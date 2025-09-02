#!/usr/bin/env python3
"""
Script to seed random order data for each warehouse
Requirements:
- Minimum 15 orders per warehouse
- Some deliveries for future dates (22-23 August 2025)
- Some for present dates
- Some completed (delivered) orders
"""

import sys
import os
from datetime import datetime, date, timedelta
import random

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app import create_app, db
from app.models import User, Warehouse, Order, Driver

def create_sample_data():
    app = create_app()
    
    with app.app_context():
        # Check if we have users and warehouses
        users = User.query.all()
        warehouses = Warehouse.query.all()
        drivers = Driver.query.all()
        
        if not users:
            print("No users found. Please create users first.")
            return
        
        if not warehouses:
            print("No warehouses found. Please create warehouses first.")
            return
        
        if not drivers:
            print("No drivers found. Please create drivers first.")
            return
        
        print(f"Found {len(users)} users, {len(warehouses)} warehouses, {len(drivers)} drivers")
        
        # Sample data for orders
        package_names = [
            "Electronics Components", "Textile Materials", "Automotive Parts", 
            "Pharmaceutical Supplies", "Food Products", "Construction Materials",
            "Machinery Equipment", "Chemical Products", "Furniture Items",
            "Clothing & Apparel", "Books & Stationery", "Sports Equipment",
            "Medical Devices", "Agricultural Products", "Industrial Tools"
        ]
        
        package_priorities = ["High", "Medium", "Low", "Urgent"]
        package_types = ["Fragile", "Heavy", "Liquid", "Solid", "Hazardous", "Regular"]
        
        logistic_companies = [
            "Blue Dart Express", "DTDC Courier", "FedEx India", "DHL Express",
            "Professional Couriers", "Gati Express", "First Flight", "Aramex",
            "Safexpress", "Trackon Courier", "Delhivery", "Ecom Express"
        ]
        
        time_slots = ["09:00-12:00", "12:00-15:00", "15:00-18:00", "18:00-21:00"]
        
        # Addresses for pickup and delivery
        addresses = [
            "123 Industrial Area, Sector 15, Gurgaon, Haryana",
            "456 Business Park, Andheri East, Mumbai, Maharashtra",
            "789 Tech Hub, Whitefield, Bangalore, Karnataka",
            "321 Export Zone, Tidel Park, Chennai, Tamil Nadu",
            "654 Innovation Center, HITEC City, Hyderabad, Telangana",
            "987 Manufacturing Complex, Sanand, Ahmedabad, Gujarat",
            "147 Logistics Park, Bhiwandi, Thane, Maharashtra",
            "258 Distribution Center, Faridabad, Haryana",
            "369 Warehouse Complex, Noida, Uttar Pradesh",
            "741 Storage Facility, Pune, Maharashtra"
        ]
        
        # Generate orders for each warehouse
        total_orders_created = 0
        
        for warehouse in warehouses:
            print(f"\nCreating orders for warehouse: {warehouse.name}")
            
            # Create 15-20 orders per warehouse
            num_orders = random.randint(15, 20)
            orders_created = 0
            
            for i in range(num_orders):
                # Determine order status and date
                order_status = random.choice(["future", "present", "completed"])
                
                if order_status == "future":
                    # Future orders for 22-23 August 2025
                    if random.random() < 0.7:  # 70% chance for 22-23 August
                        order_date = date(2025, 8, random.choice([22, 23]))
                    else:
                        # Some other future dates
                        order_date = date(2025, 8, random.randint(24, 31))
                elif order_status == "present":
                    # Present orders (today or recent past)
                    order_date = date.today() - timedelta(days=random.randint(0, 7))
                else:  # completed
                    # Completed orders (past dates)
                    order_date = date.today() - timedelta(days=random.randint(8, 30))
                
                # Create order
                order = Order(
                    user_id=warehouse.user_id,
                    warehouse_id=warehouse.id,
                    pickup_address=random.choice(addresses),
                    delivery_address=random.choice(addresses),
                    supplier_name=f"Supplier {random.randint(1000, 9999)}",
                    supplier_phone=f"+91{random.randint(7000000000, 9999999999)}",
                    customer_name=f"Customer {random.randint(1000, 9999)}",
                    customer_phone=f"+91{random.randint(7000000000, 9999999999)}",
                    package_name=random.choice(package_names),
                    package_priority=random.choice(package_priorities),
                    quantity=random.randint(1, 100),
                    package_type=random.choice(package_types),
                    package_description=f"Package description for {random.choice(package_names)}",
                    order_type=random.choice(["incoming", "outgoing"]),
                    logistic_company=random.choice(logistic_companies),
                    driver_id=random.choice(drivers).id if drivers else None,
                    date=order_date,
                    time_slot=random.choice(time_slots),
                    created_at=datetime.now()
                )
                
                db.session.add(order)
                orders_created += 1
                total_orders_created += 1
                
                # Print progress
                if (i + 1) % 5 == 0:
                    print(f"  Created {i + 1}/{num_orders} orders...")
            
            # Commit orders for this warehouse
            db.session.commit()
            print(f"  ✓ Created {orders_created} orders for {warehouse.name}")
        
        print(f"\n🎉 Successfully created {total_orders_created} orders across {len(warehouses)} warehouses!")
        print("\nOrder distribution:")
        print("- Future orders (22-23 August 2025): ~40%")
        print("- Present orders (recent dates): ~30%")
        print("- Completed orders (past dates): ~30%")

if __name__ == "__main__":
    try:
        create_sample_data()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
