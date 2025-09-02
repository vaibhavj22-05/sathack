from flask import Blueprint, render_template, request, jsonify, session
from ..models import Driver, Order
from .. import db
from datetime import datetime


drivers = Blueprint('drivers', __name__)

@drivers.route('/')
def home():
    """Driver home page with OTP entry"""
    return render_template('driver/index.html')

@drivers.route('/verify', methods=['POST'])
def verify_otp():
    """Verify driver OTP and assign delivery"""
    data = request.get_json()
    otp = data.get('otp')
    
    # Simple OTP verification (you can enhance this)
    if otp == "5869":  # Default OTP for testing
        # Get a sample delivery (you can modify this logic)
        delivery = {
        'pickup': 'Okhla Industrial Area Phase-II, New Delhi',
        'delivery': 'Bandra, Mumbai',
        'customer': 'Rajesh Kumar',
        'phone': '+91-98111-22334',
        'goods': 'Electrical Components',
        'vehicle': 'Tata Ace - DL1LC1234',
        'expected_time': '2025-08-21 14:30'
    }
        session['driver_verified'] = True
        session['delivery'] = delivery
        return jsonify({'success': True, 'delivery': delivery})
    else:
        return jsonify({'success': False, 'message': 'Invalid OTP'})

@drivers.route('/delivery')
def delivery():
    """Delivery tracking page with map"""
    if not session.get('driver_verified'):
        return render_template('driver/index.html')
    
    delivery = session.get('delivery')
    return render_template('driver/delivery.html', delivery=delivery)

@drivers.route('/api/location', methods=['POST'])
def update_location():
    """Update driver location"""
    try:
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude and longitude:
            # Store location in session for simple tracking
            session['current_location'] = {
                'lat': latitude,
                'lng': longitude,
                'timestamp': datetime.now().isoformat()
            }
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Location data required'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})