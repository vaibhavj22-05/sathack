from flask import Blueprint, render_template, request, redirect, url_for, session
from ..models import User
from .. import db, oauth
from flask_login import login_user,current_user,logout_user
import os 
from dotenv import load_dotenv

load_dotenv()

auth = Blueprint('auth', __name__)

google = oauth.register(
    name='google',
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv('CLIENT_SECRET'),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={'scope': 'openid profile email'}
)

@auth.route('/login', methods=['GET','POST'])
def login():
    return redirect(url_for('auth.login_google'))

@auth.route('/register', methods=['GET','POST'])
def register():
    return redirect(url_for('auth.login_google'))

@auth.route('/login/google')
def login_google():
    redirect_uri = url_for('auth.authorize_google', _external=True)
    return google.authorize_redirect(redirect_uri)

@auth.route('/authorize/google')
def authorize_google():
    token = google.authorize_access_token()
    userinfo_endpoint = google.client_kwargs.get('userinfo_endpoint') or 'https://www.googleapis.com/oauth2/v3/userinfo'
    user_info = google.get(userinfo_endpoint).json()

    email = user_info['email']
    name = user_info['name']

    user = User.query.filter_by(email=email).first()

    if not user:
        user = User(email=email, name=name)  
        db.session.add(user)
        db.session.commit()
    else:
        if not user.name:
            user.name = name
            db.session.commit()

    login_user(user)
    return redirect(url_for('views.complete_profile' if not user.email else 'msme.dashboard'))

@auth.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('views.home'))
