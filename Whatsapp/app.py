from fileinput import filename
from flask import Flask, request, render_template, send_from_directory
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
import requests
import os
import time
from datetime import datetime, timedelta
import sqlite3
import logging
from dotenv import load_dotenv

load_dotenv()  # Load .env variables

logging.basicConfig(level=logging.DEBUG)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DB_PATH = os.path.join(BASE_DIR, 'whatsapp_data.db')

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


# Twilio credentials from .env
ACCOUNT_SID = os.getenv("ACCOUNT_SID")
AUTH_TOKEN = os.getenv("AUTH_TOKEN")
FROM_WHATSAPP = os.getenv("FROM_WHATSAPP")

client = Client(ACCOUNT_SID, AUTH_TOKEN)


# Initialize DB
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_number TEXT,
            msg_body TEXT,
            timestamp TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS message_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sid TEXT,
            status TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/send-otp', methods=['POST'])
def send_otp():
    number = request.form.get('number')  # format: +91xxxxxxxxxx
    if not number:
        return "Phone number is required", 400

    try:
        verification = client.verify.v2.services('YOUR_VERIFY_SERVICE_SID').verifications.create(
            to=f'whatsapp:{number}',
            channel='whatsapp'
        )
        return f"✅ OTP sent to {number}", 200
    except Exception as e:
        return f"❌ Failed to send OTP: {str(e)}", 500
    
@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    number = request.form.get('number')  # format: +91xxxxxxxxxx
    code = request.form.get('otp')

    if not number or not code:
        return "Number and OTP code are required", 400

    try:
        verification_check = client.verify.v2.services('YOUR_VERIFY_SERVICE_SID').verification_checks.create(
            to=f'whatsapp:{number}',
            code=code
        )
        if verification_check.status == 'approved':
            return "✅ OTP Verified!", 200
        else:
            return "❌ Incorrect OTP", 400
    except Exception as e:
        return f"❌ Error verifying OTP: {str(e)}", 500

@app.route('/otp')
def otp_form():
    return render_template("otp_form.html")

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/pdfs')
def list_pdfs():
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    files = os.listdir(app.config['UPLOAD_FOLDER'])
    pdfs = [f for f in files if f.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png'))]
    return render_template("pdfs.html", pdfs=pdfs)

@app.route('/uploads/<filename>')
def serve_pdf(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/send-hardcoded')
def send_hardcoded():
    try:
        message = client.messages.create(
            from_=FROM_WHATSAPP,
            to='whatsapp:+918506007646',   # replace with your number
            body="🚨 Attention Driver 🚨\nPlease start your live location tracking immediately:\n\n👉 http://127.0.0.1:5050/drivers/   \nYour PIN is : 5869")

        return f"✅ Message sent with SID: {message.sid}"
    except Exception as e:
        return f"❌ Failed to send message: {str(e)}"

@app.route('/messages')
def list_messages():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT from_number, msg_body, timestamp FROM messages ORDER BY timestamp DESC')
    messages = c.fetchall()
    conn.close()
    return render_template('messages.html', messages=messages)

@app.route('/webhook', methods=['POST'])
def whatsapp_webhook():
    from_number = request.form.get('From')
    msg_body = request.form.get('Body')
    media_url = request.form.get('MediaUrl0')
    media_type = request.form.get('MediaContentType0')

    print("From:", from_number)
    print("Body:", msg_body)
    print("Media URL:", media_url)
    print("Media Type:", media_type)

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('INSERT INTO messages (from_number, msg_body, timestamp) VALUES (?, ?, ?)',
                  (from_number, msg_body, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        conn.commit()
        conn.close()
    except Exception as e:
        print("❌ Error saving message to DB:", str(e))

    resp = MessagingResponse()

    if media_url and media_type in ['application/pdf', 'image/jpeg', 'image/png']:
        try:
            timestamp = int(time.time())
            safe_number = from_number.replace("whatsapp:", "").replace("+", "")

            # Set file extension
            extension = {
                'application/pdf': 'pdf',
                'image/jpeg': 'jpg',
                'image/png': 'png'
            }.get(media_type, 'bin')  # default to .bin if unknown

            filename = f"{safe_number}_{timestamp}.{extension}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

            response = requests.get(media_url, auth=(ACCOUNT_SID, AUTH_TOKEN))
            print("📥 Download status:", response.status_code)

            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f"✅ File saved as {filename}")
                resp.message(f"✅ Your file ({extension.upper()}) was received and saved.")
            else:
                print("❌ Failed to download media from Twilio.")
                resp.message("❌ Could not download your file.")

        except Exception as e:
            print("❌ Exception during file download:", str(e))
            resp.message("❌ Internal error while saving your file.")

    else:
        print("❗ No valid media found")
        resp.message(f"You said: {msg_body}")

    return str(resp)

@app.route('/send', methods=['POST'])
def send_message():
    number = request.form.get('number')
    msg = request.form.get('message')

    message = client.messages.create(
        from_=FROM_WHATSAPP,
        to=f'whatsapp:{number}',
        body=msg,
        status_callback="https://0d5082e9445f.ngrok-free.app/status"
    )
    return f'Message sent with SID: {message.sid}'

@app.route('/status', methods=['POST'])
def message_status():
    sid = request.form.get('MessageSid')
    status = request.form.get('MessageStatus')
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    print(f"📦 Message {sid} updated to status: {status}")

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('INSERT INTO message_status (sid, status, timestamp) VALUES (?, ?, ?)',
                  (sid, status, timestamp))
        conn.commit()
        conn.close()
    except Exception as e:
        print("❌ Error saving status to DB:", str(e))

    return ('', 204)

@app.route('/delivery-status')
def delivery_status():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT sid, status, timestamp FROM message_status ORDER BY timestamp DESC')
    status_logs = c.fetchall()
    conn.close()
    return render_template('status.html', statuses=status_logs)

# def schedule_reminders(user_number):
#     for i in range(0, 60, 5):
#         run_at = datetime.now() + timedelta(minutes=i)
#         job_id = f"{user_number}_{i}"
#         scheduler.add_job(
#             send_reminder,
#             'date',
#             run_date=run_at,
#             args=[user_number],
#             id=job_id,
#             misfire_grace_time=60,
#             replace_existing=True
#         )

def send_reminder(user_number):
    try:
        client.messages.create(
            from_=FROM_WHATSAPP,
            to=user_number,
            body="🔔 Reminder: This is your scheduled notification!"
        )
    except Exception as e:
        print(f"Reminder failed: {e}")

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    init_db()
    app.run(debug=True)