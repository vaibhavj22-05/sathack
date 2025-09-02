from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, IntegerField, TextAreaField,DateField,TimeField,SelectField, BooleanField, HiddenField
from wtforms.validators import DataRequired, Email,Length,Optional


class BaseProfileForm(FlaskForm):
    name = StringField('Name', render_kw={'readonly': True})
    phone = StringField('Phone Number', validators=[DataRequired()])
    email = StringField('Email',render_kw={'readonly': True} )

    submit = SubmitField('Save')


class WarehouseForm(FlaskForm):
    name = StringField('Warehouse Name', validators=[DataRequired(), Length(max=100)])
    address = TextAreaField('Address', validators=[DataRequired(), Length(max=200)])
    city = StringField('City', validators=[DataRequired(), Length(max=100)])
    state = StringField('State', validators=[DataRequired(), Length(max=100)])
    pincode = StringField('Pincode', validators=[DataRequired(), Length(max=10)])
    contact_person = StringField('Contact Person', validators=[Optional(), Length(max=100)])
    contact_phone = StringField('Contact Phone', validators=[Optional(), Length(max=15)])
    is_active = BooleanField('Active')
    
    submit = SubmitField('Save Warehouse')


class OrderForm(FlaskForm):
    # ------------------------
    # 0. Order Type & Warehouse
    # ------------------------
    order_type = HiddenField("Order Type")  # will be set by UI (incoming/outgoing)
    selected_warehouse_id = SelectField("Warehouse", coerce=int, validators=[Optional()])

    # ------------------------
    # 1. Pickup & Delivery
    # ------------------------
    pickup_address = TextAreaField("Pickup Address", validators=[DataRequired(), Length(max=200)])
    delivery_address = TextAreaField("Delivery Address", validators=[DataRequired(), Length(max=200)])
    
    supplier_name = StringField("Supplier Name", validators=[Optional(), Length(max=100)])
    supplier_phone = StringField("Supplier Phone", validators=[Optional(), Length(max=15)])
    customer_name = StringField("Customer Name", validators=[Optional(), Length(max=100)])
    customer_phone = StringField("Customer Phone", validators=[Optional(), Length(max=15)])
    
    # ------------------------
    # 2. Package Details
    # ------------------------
    package_name = StringField("Package Name", validators=[DataRequired(), Length(max=100)])
    package_priority = SelectField(
        "Package Priority",
        choices=[("Low", "Low"), ("Medium", "Medium"), ("High", "High"), ("Urgent", "Urgent")],
        validators=[DataRequired()]
    )
    quantity = IntegerField("Quantity", validators=[DataRequired()])
    package_type = SelectField(
        "Package Type",
        choices=[("Fragile", "Fragile"), ("Heavy", "Heavy"), ("Liquid", "Liquid"), ("Solid", "Solid"), ("Hazardous", "Hazardous"), ("Regular", "Regular")],
        validators=[DataRequired()]
    )
    package_description = TextAreaField("Package Description", validators=[Optional(), Length(max=300)])
    
    # ------------------------
    # 3. Logistics Details (Enter driver info directly)
    # ------------------------
    logistic_company = StringField("Logistic Company Name", validators=[DataRequired(), Length(max=100)])
    driver_name = StringField("Driver Name", validators=[DataRequired(), Length(max=100)])
    driver_phone = StringField("Driver Phone", validators=[DataRequired(), Length(max=15)])
    driver_truck_no = StringField("Driver Truck No", validators=[Optional(), Length(max=50)])
    
    # ------------------------
    # 4. Schedule
    # ------------------------
    date = DateField("Date", validators=[DataRequired()])
    time_slot = SelectField(
        "Time Slot",
        choices=[
            ("09:00-12:00", "9:00 AM - 12:00 PM"),
            ("12:00-15:00", "12:00 PM - 3:00 PM"),
            ("15:00-18:00", "3:00 PM - 6:00 PM"),
            ("18:00-21:00", "6:00 PM - 9:00 PM")
        ],
        validators=[DataRequired()]
    )
    
    # ------------------------
    # Submit
    # ------------------------
    submit = SubmitField("Create Order")