from flask import Blueprint,render_template,redirect,url_for
from flask_login import login_required,current_user
from ..models import User
from ..import db
from app.forms import BaseProfileForm


views = Blueprint('views',__name__)

@views.route('/')
def home():
    return render_template('index.html')


@views.route('/complete_profile', methods=['GET', 'POST'])
@login_required
def complete_profile():
    form = BaseProfileForm()

    if form.validate_on_submit():
        current_user.phone = form.phone.data
        db.session.commit()
        return redirect(url_for('msme.dashboard'))  
    return render_template('complete_profile.html', form=form)
