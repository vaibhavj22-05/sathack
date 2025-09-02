from flask import Blueprint, render_template, redirect, url_for, request, flash, session, jsonify
from ..models import Order, User, Driver, Warehouse
from .. import db
from flask_login import login_required, current_user
from ..forms import OrderForm, WarehouseForm
from datetime import datetime

msme = Blueprint('msme', __name__)

@msme.route('/')
@login_required
def dashboard():
    # Get warehouse count and recent orders for dashboard
    warehouse_count = Warehouse.query.filter_by(user_id=current_user.id, is_active=True).count()

    # Determine selected warehouse (if any)
    selected_warehouse_id = current_user.current_warehouse_id

    # Base query for user's orders
    base_query = Order.query.filter_by(user_id=current_user.id)
    if selected_warehouse_id:
        base_query = base_query.filter_by(warehouse_id=selected_warehouse_id)

    # Recent orders - scoped to selected warehouse if set
    recent_orders = base_query.order_by(Order.created_at.desc()).limit(5).all()
    
    # Get order type statistics - scoped if warehouse selected
    incoming_orders = base_query.filter_by(order_type="incoming").count()
    outgoing_orders = base_query.filter_by(order_type="outgoing").count()
    
    # Get user's warehouses for selection
    user_warehouses = Warehouse.query.filter_by(user_id=current_user.id, is_active=True).all()
    
    # Active orders (today or future)
    active_orders_query = Order.query.filter_by(user_id=current_user.id).filter(Order.date >= datetime.now().date())
    if selected_warehouse_id:
        active_orders_query = active_orders_query.filter_by(warehouse_id=selected_warehouse_id)
    active_orders_count = active_orders_query.count()
    
    return render_template('msme/dashboard.html', 
                         warehouse_count=warehouse_count, 
                         recent_orders=recent_orders,
                         incoming_orders=incoming_orders,
                         outgoing_orders=outgoing_orders,
                         user_warehouses=user_warehouses,
                         current_warehouse=current_user.current_warehouse,
                         now_date=datetime.now().date(),
                         active_orders_count=active_orders_count)


@msme.route('/set-warehouse/<int:warehouse_id>')
@login_required
def set_warehouse(warehouse_id):
    """Set the current warehouse for the user"""
    warehouse = Warehouse.query.filter_by(id=warehouse_id, user_id=current_user.id).first_or_404()
    
    current_user.current_warehouse_id = warehouse_id
    db.session.commit()
    
    flash(f"Active warehouse set to: {warehouse.name}", "success")
    return redirect(url_for('msme.dashboard'))


#######################################################################################################################
#################################              WAREHOUSE ROUTES                     #####################################
#######################################################################################################################

@msme.route('/warehouses')
@login_required
def warehouses():
    warehouses = Warehouse.query.filter_by(user_id=current_user.id).order_by(Warehouse.created_at.desc()).all()
    return render_template('msme/warehouses.html', warehouses=warehouses)


@msme.route('/warehouses/add', methods=['GET', 'POST'])
@login_required
def add_warehouse():
    form = WarehouseForm()
    
    if form.validate_on_submit():
        warehouse = Warehouse(
            name=form.name.data,
            address=form.address.data,
            city=form.city.data,
            state=form.state.data,
            pincode=form.pincode.data,
            contact_person=form.contact_person.data,
            contact_phone=form.contact_phone.data,
            is_active=form.is_active.data,
            user_id=current_user.id
        )
        db.session.add(warehouse)
        db.session.commit()
        
        # If this is the first warehouse, set it as current
        if not current_user.current_warehouse_id:
            current_user.current_warehouse_id = warehouse.id
            db.session.commit()
        
        flash("Warehouse added successfully!", "success")
        return redirect(url_for('msme.warehouses'))
    
    return render_template('msme/add_warehouse.html', form=form)


@msme.route('/warehouses/<int:warehouse_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_warehouse(warehouse_id):
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    
    # Ensure the warehouse belongs to the current user
    if warehouse.user_id != current_user.id:
        flash("You are not authorized to edit this warehouse", "danger")
        return redirect(url_for('msme.warehouses'))
    
    form = WarehouseForm(obj=warehouse)
    
    if form.validate_on_submit():
        warehouse.name = form.name.data
        warehouse.address = form.address.data
        warehouse.city = form.city.data
        warehouse.state = form.state.data
        warehouse.pincode = form.pincode.data
        warehouse.contact_person = form.contact_person.data
        warehouse.contact_phone = form.contact_phone.data
        warehouse.is_active = form.is_active.data
        
        db.session.commit()
        flash("Warehouse updated successfully!", "success")
        return redirect(url_for('msme.warehouses'))
    
    return render_template('msme/edit_warehouse.html', form=form, warehouse=warehouse)


@msme.route('/warehouses/<int:warehouse_id>/delete', methods=['POST'])
@login_required
def delete_warehouse(warehouse_id):
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    
    # Ensure the warehouse belongs to the current user
    if warehouse.user_id != current_user.id:
        flash("You are not authorized to delete this warehouse", "danger")
        return redirect(url_for('msme.warehouses'))
    
    # Check if warehouse has orders
    if warehouse.orders:
        flash("Cannot delete warehouse with existing orders", "danger")
        return redirect(url_for('msme.warehouses'))
    
    # If this was the current warehouse, clear it
    if current_user.current_warehouse_id == warehouse_id:
        current_user.current_warehouse_id = None
        db.session.commit()
    
    db.session.delete(warehouse)
    db.session.commit()
    flash("Warehouse deleted successfully!", "success")
    return redirect(url_for('msme.warehouses'))


#######################################################################################################################
#################################              ORDER ROUTES                       #####################################
#######################################################################################################################

@msme.route('/orders')
@login_required
def orders():
    warehouse_id = request.args.get('warehouse_id', type=int)
    order_type = request.args.get('order_type', type=str)
    
    # Build query
    query = Order.query.filter_by(user_id=current_user.id)
    
    if warehouse_id:
        # Filter orders by specific warehouse
        warehouse = Warehouse.query.filter_by(id=warehouse_id, user_id=current_user.id).first_or_404()
        query = query.filter_by(warehouse_id=warehouse_id)
    else:
        warehouse = None
    
    if order_type and order_type in ['incoming', 'outgoing']:
        # Filter orders by type
        query = query.filter_by(order_type=order_type)
    
    orders = query.order_by(Order.created_at.desc()).all()
    
    return render_template('msme/orders.html', 
                         orders=orders, 
                         selected_warehouse=warehouse,
                         selected_order_type=order_type,
                         now_date=datetime.now().date())


# Add a new order
@msme.route('/add_order', methods=['GET', 'POST'])
@login_required
def add_order():
    # Check if user has a current warehouse
    if not current_user.current_warehouse_id:
        flash("Please select a warehouse first from your dashboard", "warning")
        return redirect(url_for('msme.dashboard'))
    
    # Check if current warehouse is still active
    current_warehouse = Warehouse.query.filter_by(
        id=current_user.current_warehouse_id, 
        user_id=current_user.id, 
        is_active=True
    ).first()
    
    if not current_warehouse:
        flash("Your selected warehouse is no longer active. Please select another warehouse.", "warning")
        current_user.current_warehouse_id = None
        db.session.commit()
        return redirect(url_for('msme.dashboard'))
    
    form = OrderForm()
    
    # Populate warehouse choices for order routing
    user_active_warehouses = Warehouse.query.filter_by(user_id=current_user.id, is_active=True).all()
    
    # Ensure we have at least one warehouse
    if not user_active_warehouses:
        flash("No active warehouses found. Please create a warehouse first.", "warning")
        return redirect(url_for('msme.dashboard'))
    
    # Set warehouse choices with proper validation
    form.selected_warehouse_id.choices = [(w.id, w.name) for w in user_active_warehouses]
    
    # Set default warehouse if current warehouse exists in choices
    if current_user.current_warehouse_id:
        # Check if current warehouse is in the choices
        current_wh_ids = [w.id for w in user_active_warehouses]
        if current_user.current_warehouse_id in current_wh_ids:
            form.selected_warehouse_id.default = current_user.current_warehouse_id
        else:
            # If current warehouse is not in choices, set first available
            form.selected_warehouse_id.default = user_active_warehouses[0].id
            current_user.current_warehouse_id = user_active_warehouses[0].id
            db.session.commit()
    
    # Set default order type
    if request.method == 'GET':
        form.order_type.data = 'outgoing'
        # Process form to set defaults
        form.process()
    
    if request.method == 'POST':
        print(f"Form submitted - Valid: {form.validate()}")
        if form.errors:
            print(f"Form errors: {form.errors}")
        
        # Re-populate choices after POST to ensure validation works
        form.selected_warehouse_id.choices = [(w.id, w.name) for w in user_active_warehouses]
        
        if form.validate_on_submit():
            try:
                # 1. Resolve selected warehouse for routing
                selected_wh = None
                try:
                    if form.selected_warehouse_id.data:
                        # Validate that the selected warehouse exists and belongs to user
                        selected_wh = Warehouse.query.filter_by(
                            id=form.selected_warehouse_id.data, 
                            user_id=current_user.id,
                            is_active=True
                        ).first()
                        if not selected_wh:
                            flash("Selected warehouse is not valid. Please try again.", "error")
                            return render_template("msme/add_order.html", 
                                               form=form, 
                                               current_warehouse=current_warehouse, 
                                               user_warehouses=user_active_warehouses,
                                               current_user=current_user)
                except Exception as e:
                    print(f"Error resolving warehouse: {e}")
                    selected_wh = None

                # 2. Save Driver first
                driver = Driver(
                    name=form.driver_name.data,
                    phone=form.driver_phone.data,
                    truck_no=form.driver_truck_no.data
                )
                db.session.add(driver)
                db.session.commit()
                print(f"Driver created with ID: {driver.id}")

                # 3. Determine order type and auto-fill customer name if needed
                order_type = (form.order_type.data or "outgoing").strip().lower()
                if order_type not in ["incoming", "outgoing"]:
                    order_type = "outgoing"
                customer_name = form.customer_name.data
                
                # 4. Compute addresses based on order type and selected warehouse
                pickup_address_value = form.pickup_address.data
                delivery_address_value = form.delivery_address.data
                def format_wh_address(wh):
                    return f"{wh.address}, {wh.city}, {wh.state}" if wh else ""

                if order_type == "incoming":
                    # Delivery goes to selected warehouse (fallback to current)
                    target_wh = selected_wh or current_warehouse
                    delivery_address_value = format_wh_address(target_wh)
                    # Auto-fill customer name with MSME for incoming if blank
                    if not customer_name:
                        customer_name = current_user.name
                else:
                    # Outgoing: Pickup is from selected warehouse (fallback to current)
                    source_wh = selected_wh or current_warehouse
                    pickup_address_value = format_wh_address(source_wh)
                
                # 5. Save Order with current warehouse
                order = Order(
                    user_id=current_user.id,
                    warehouse_id=current_user.current_warehouse_id,
                    pickup_address=pickup_address_value,
                    delivery_address=delivery_address_value,
                    supplier_name=form.supplier_name.data,
                    supplier_phone=form.supplier_phone.data,
                    customer_name=customer_name,
                    customer_phone=form.customer_phone.data,
                    package_name=form.package_name.data,
                    package_priority=form.package_priority.data,
                    quantity=form.quantity.data,
                    package_type=form.package_type.data,
                    package_description=form.package_description.data,
                    logistic_company=form.logistic_company.data,
                    driver_id=driver.id,
                    date=form.date.data,
                    time_slot=form.time_slot.data,
                    order_type=order_type
                )
                db.session.add(order)
                db.session.commit()
                print(f"Order created successfully with ID: {order.id}")
                flash("Order created successfully!", "success")
                return redirect(url_for('msme.orders'))
                
            except Exception as e:
                db.session.rollback()
                print(f"Error creating order: {e}")
                flash(f"Error creating order: {str(e)}", "error")
        else:
            # Form validation failed
            error_messages = []
            for field, errors in form.errors.items():
                for error in errors:
                    error_messages.append(f"{getattr(form, field).label.text}: {error}")
            
            if error_messages:
                flash("Please correct the following errors:\n" + "\n".join(error_messages), "error")
            else:
                flash("Please fill in all required fields correctly.", "error")
    
    return render_template("msme/add_order.html", 
                         form=form, 
                         current_warehouse=current_warehouse, 
                         user_warehouses=user_active_warehouses,
                         current_user=current_user)


# View order details
@msme.route('/orders/<int:order_id>')
@login_required
def order_detail(order_id):
    order = Order.query.get_or_404(order_id)

    # Ensure the order belongs to the current user
    if order.user_id != current_user.id:
        flash("You are not authorized to view this order", "danger")
        return redirect(url_for('msme.orders'))

    return render_template('msme/order_detail.html', order=order)


# Delete order
@msme.route('/orders/<int:order_id>/delete', methods=['POST'])
@login_required
def delete_order(order_id):
    order = Order.query.get_or_404(order_id)
    
    # Ensure the order belongs to the current user
    if order.user_id != current_user.id:
        flash("You are not authorized to delete this order", "danger")
        return redirect(url_for('msme.orders'))
    
    try:
        # Delete the associated driver if no other orders use it
        driver = order.driver
        if driver and len(driver.orders) == 1:  # Only this order uses this driver
            db.session.delete(driver)
        
        # Delete the order
        db.session.delete(order)
        db.session.commit()
        
        flash("Order deleted successfully!", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Error deleting order: {str(e)}", "error")
    
    return redirect(url_for('msme.orders'))


#######################################################################################################################
#################################              PROFILE ROUTES                     #####################################
#######################################################################################################################

@msme.route('/profile')
@login_required
def profile():
    """Display user profile page"""
    return render_template('msme/profile.html')


@msme.route('/ltc')
@login_required
def ltc():
    """Display Live Tracking Center page"""
    return render_template('msme/ltc.html')


@msme.route('/inventory')
@login_required
def inventory():
    """Inventory management page - scoped to current warehouse if selected"""
    current_wh = current_user.current_warehouse
    # Placeholder inventory dataset; in real app this would query an Inventory model
    # Here we just derive from recent orders to demonstrate structure
    orders = Order.query.filter_by(user_id=current_user.id)
    if current_wh:
        orders = orders.filter_by(warehouse_id=current_wh.id)
    orders = orders.order_by(Order.created_at.desc()).all()

    # Group a simple inventory snapshot by package_name
    inventory_items = {}
    for o in orders:
        key = (o.package_name or 'Unknown', o.package_type or 'general')
        if key not in inventory_items:
            inventory_items[key] = {
                'name': o.package_name or 'Unknown',
                'type': o.package_type or 'general',
                'quantity': 0,
                'last_movement': o.created_at,
                'usage_count': 0,
            }
        inventory_items[key]['quantity'] += int(o.quantity or 0)
        inventory_items[key]['usage_count'] += 1
        if o.created_at and (inventory_items[key]['last_movement'] is None or o.created_at > inventory_items[key]['last_movement']):
            inventory_items[key]['last_movement'] = o.created_at

    # Convert to list
    inventory_list = list(inventory_items.values())
    # Sort by name
    inventory_list.sort(key=lambda x: x['name'] or '')

    return render_template('msme/inventory.html',
                           items=inventory_list,
                           current_warehouse=current_wh)


@msme.route('/analysis')
@login_required
def analysis():
    """Analysis and insights page with forecasting capabilities"""
    current_wh = current_user.current_warehouse
    
    # Get order statistics for analysis
    orders = Order.query.filter_by(user_id=current_user.id)
    if current_wh:
        orders = orders.filter_by(warehouse_id=current_wh.id)
    
    # Calculate key metrics
    total_orders = orders.count()
    incoming_orders = orders.filter_by(order_type="incoming").count()
    outgoing_orders = orders.filter_by(order_type="outgoing").count()
    
    # Priority distribution
    priority_stats = {
        'High': orders.filter_by(package_priority="High").count(),
        'Medium': orders.filter_by(package_priority="Medium").count(),
        'Low': orders.filter_by(package_priority="Low").count(),
        'Urgent': orders.filter_by(package_priority="Urgent").count()
    }
    
    # Package type distribution
    package_type_stats = {
        'Fragile': orders.filter_by(package_type="Fragile").count(),
        'Heavy': orders.filter_by(package_type="Heavy").count(),
        'Liquid': orders.filter_by(package_type="Liquid").count(),
        'Solid': orders.filter_by(package_type="Solid").count(),
        'Hazardous': orders.filter_by(package_type="Hazardous").count(),
        'Regular': orders.filter_by(package_type="Regular").count()
    }
    
    # Monthly trends (last 6 months)
    from datetime import datetime, timedelta
    monthly_data = []
    for i in range(6):
        month_start = datetime.now().replace(day=1) - timedelta(days=30*i)
        month_end = month_start.replace(day=28) + timedelta(days=4)
        month_end = month_end.replace(day=1) - timedelta(days=1)
        
        month_orders = orders.filter(
            Order.created_at >= month_start,
            Order.created_at <= month_end
        ).count()
        
        monthly_data.append({
            'month': month_start.strftime('%b %Y'),
            'orders': month_orders
        })
    
    monthly_data.reverse()  # Show oldest to newest
    
    # Top logistics companies
    logistics_stats = db.session.query(
        Order.logistic_company,
        db.func.count(Order.id).label('count')
    ).filter_by(user_id=current_user.id).group_by(Order.logistic_company).order_by(
        db.func.count(Order.id).desc()
    ).limit(5).all()
    
    return render_template('msme/analysis.html',
                           current_warehouse=current_wh,
                           total_orders=total_orders,
                           incoming_orders=incoming_orders,
                           outgoing_orders=outgoing_orders,
                           priority_stats=priority_stats,
                           package_type_stats=package_type_stats,
                           monthly_data=monthly_data,
                           logistics_stats=logistics_stats)

@msme.route('/update_profile', methods=['POST'])
@login_required
def update_profile():
    """Update user profile information"""
    form_type = request.form.get('form_type')
    
    try:
        if form_type == 'personal':
            # Update personal information
            current_user.name = request.form.get('name', current_user.name)
            current_user.phone = request.form.get('phone', current_user.phone)
            
        elif form_type == 'company':
            # Update company information
            current_user.company_name = request.form.get('company_name', current_user.company_name)
            current_user.business_address = request.form.get('business_address', current_user.business_address)
            current_user.gst_number = request.form.get('gst_number', current_user.gst_number)
            current_user.pan_number = request.form.get('pan_number', current_user.pan_number)
            
        elif form_type == 'subscription':
            # Update subscription information
            current_user.subscription_plan = request.form.get('subscription_plan', current_user.subscription_plan)
            current_user.billing_email = request.form.get('billing_email', current_user.billing_email)
            current_user.payment_method = request.form.get('payment_method', current_user.payment_method)
            
        elif form_type == 'preferences':
            # Update preferences
            warehouse_id = request.form.get('current_warehouse_id')
            if warehouse_id:
                # Verify warehouse belongs to user
                warehouse = Warehouse.query.filter_by(id=warehouse_id, user_id=current_user.id).first()
                if warehouse:
                    current_user.current_warehouse_id = int(warehouse_id)
            
            current_user.timezone = request.form.get('timezone', current_user.timezone)
            current_user.language = request.form.get('language', current_user.language)
            current_user.email_notifications = 'email_notifications' in request.form
            current_user.sms_notifications = 'sms_notifications' in request.form
        
        # Update the updated_at timestamp
        current_user.updated_at = datetime.now()
        
        db.session.commit()
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': True, 'message': 'Profile updated successfully!'})
        else:
            flash('Profile updated successfully!', 'success')
            return redirect(url_for('msme.profile'))
            
    except Exception as e:
        db.session.rollback()
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': f'Error updating profile: {str(e)}'})
        else:
            flash(f'Error updating profile: {str(e)}', 'error')
            return redirect(url_for('msme.profile'))
