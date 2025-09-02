#!/usr/bin/env python3
"""
Comprehensive script to create sample data including users, warehouses, drivers, and orders
This script will create everything needed if it doesn't exist
"""

import sys
import os
from datetime import datetime, date, timedelta
import random

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app import create_app, db
from app.models import User, Warehouse, Order, Driver

def create_sample_users():
    """Create sample MSME users if none exist"""
    users = User.query.all()
    if users:
        print(f"Found {len(users)} existing users")
        return users
    
    print("Creating sample MSME users...")
    
    sample_users = [
        {
            "email": "msme1@example.com",
            "name": "ABC Manufacturing Ltd",
            "phone": "+91-9876543210",
            "company_name": "ABC Manufacturing Ltd",
            "business_address": "123 Industrial Area, Sector 15, Gurgaon, Haryana",
            "gst_number": "06AABC1234567890",
            "pan_number": "AABC123456"
        },
        {
            "email": "msme2@example.com", 
            "name": "XYZ Textiles Pvt Ltd",
            "phone": "+91-9876543211",
            "company_name": "XYZ Textiles Pvt Ltd",
            "business_address": "456 Business Park, Andheri East, Mumbai, Maharashtra",
            "gst_number": "27BXYZ1234567890",
            "pan_number": "BXYZ123456"
        },
        {
            "email": "msme3@example.com",
            "name": "Tech Solutions India",
            "phone": "+91-9876543212", 
            "company_name": "Tech Solutions India",
            "business_address": "789 Tech Hub, Whitefield, Bangalore, Karnataka",
            "gst_number": "29CTECH1234567890",
            "pan_number": "CTECH123456"
        }
    ]
    
    created_users = []
    for user_data in sample_users:
        user = User(**user_data)
        db.session.add(user)
        created_users.append(user)
    
    db.session.commit()
    print(f"✓ Created {len(created_users)} sample users")
    return created_users

def create_sample_warehouses(users):
    """Create sample warehouses for each user if none exist"""
    warehouses = Warehouse.query.all()
    if warehouses:
        print(f"Found {len(warehouses)} existing warehouses")
        return warehouses
    
    print("Creating sample warehouses...")
    
    warehouse_data = [
        {
            "name": "Main Production Warehouse",
            "address": "123 Industrial Area, Sector 15, Gurgaon, Haryana",
            "city": "Gurgaon",
            "state": "Haryana", 
            "pincode": "122001",
            "contact_person": "Warehouse Manager",
            "contact_phone": "+91-9876543201"
        },
        {
            "name": "Secondary Storage Facility",
            "address": "456 Business Park, Andheri East, Mumbai, Maharashtra",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400069",
            "contact_person": "Storage Supervisor",
            "contact_phone": "+91-9876543202"
        },
        {
            "name": "Regional Distribution Center",
            "address": "789 Tech Hub, Whitefield, Bangalore, Karnataka",
            "city": "Bangalore",
            "state": "Karnataka",
            "pincode": "560066",
            "contact_person": "Distribution Manager",
            "contact_phone": "+91-9876543203"
        }
    ]
    
    created_warehouses = []
    for i, warehouse_info in enumerate(warehouse_data):
        warehouse = Warehouse(
            user_id=users[i % len(users)].id,
            **warehouse_info
        )
        db.session.add(warehouse)
        created_warehouses.append(warehouse)
    
    db.session.commit()
    print(f"✓ Created {len(created_warehouses)} sample warehouses")
    return created_warehouses

def create_sample_drivers():
    """Create sample drivers if none exist"""
    drivers = Driver.query.all()
    if drivers:
        print(f"Found {len(drivers)} existing drivers")
        return drivers
    
    print("Creating sample drivers...")
    
    driver_names = [
        "Rajesh Kumar", "Amit Singh", "Suresh Patel", "Mohan Sharma",
        "Vikram Verma", "Deepak Gupta", "Ramesh Tiwari", "Anil Joshi"
    ]
    
    created_drivers = []
    for i, name in enumerate(driver_names):
        driver = Driver(
            name=name,
            phone=f"+91-98765{43200 + i:05d}",
            truck_no=f"MH{random.randint(10, 99)}-{random.randint(1000, 9999)}"
        )
        db.session.add(driver)
        created_drivers.append(driver)
    
    db.session.commit()
    print(f"✓ Created {len(created_drivers)} sample drivers")
    return created_drivers

def create_sample_orders(warehouses, drivers):
    """Create sample orders for each warehouse"""
    print("Creating sample orders...")
    
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
        print(f"  Creating orders for warehouse: {warehouse.name}")
        
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
                print(f"    Created {i + 1}/{num_orders} orders...")
        
        # Commit orders for this warehouse
        db.session.commit()
        print(f"    ✓ Created {orders_created} orders for {warehouse.name}")
    
    print(f"\n🎉 Successfully created {total_orders_created} orders across {len(warehouses)} warehouses!")
    print("\nOrder distribution:")
    print("- Future orders (22-23 August 2025): ~40%")
    print("- Present orders (recent dates): ~30%")
    print("- Completed orders (past dates): ~30%")

def main():
    """Main function to create all sample data"""
    app = create_app()
    
    with app.app_context():
        try:
            print("🚀 Starting to create sample data...\n")
            
            # Create users first
            users = create_sample_users()
            
            # Create warehouses
            warehouses = create_sample_warehouses(users)
            
            # Create drivers
            drivers = create_sample_drivers()
            
            # Create orders
            create_sample_orders(warehouses, drivers)
            
            print("\n✅ All sample data created successfully!")
            print(f"📊 Summary:")
            print(f"   - Users: {len(users)}")
            print(f"   - Warehouses: {len(warehouses)}")
            print(f"   - Drivers: {len(drivers)}")
            print(f"   - Orders: {Order.query.count()}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()
