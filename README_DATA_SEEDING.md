# Data Seeding Scripts for ParkNLoad Website

This directory contains scripts to populate your database with sample data for testing and development purposes.

## Available Scripts

### 1. `create_sample_data.py` (Recommended for first-time setup)
**Use this script if you want to create everything from scratch:**
- Creates sample MSME users
- Creates sample warehouses for each user
- Creates sample drivers
- Creates 15-20 orders per warehouse with the specified date distribution

**Features:**
- ✅ Creates complete sample data ecosystem
- ✅ Minimum 15 orders per warehouse
- ✅ 40% future orders (22-23 August 2025)
- ✅ 30% present orders (recent dates)
- ✅ 30% completed orders (past dates)

### 2. `add_orders_only.py` (Use if you already have users/warehouses/drivers)
**Use this script if you already have users, warehouses, and drivers:**
- Only adds orders to existing warehouses
- Same order distribution as above
- Assumes existing data structure

### 3. `seed_orders.py` (Legacy script)
**Original script for adding orders only**

## How to Run

### Prerequisites
Make sure you have:
- Python 3.6+ installed
- Required packages installed (`flask`, `flask-sqlalchemy`, etc.)
- Database initialized

### Running the Scripts

1. **Navigate to the project directory:**
   ```bash
   cd ParkNLoad-website
   ```

2. **Run the comprehensive script (recommended):**
   ```bash
   python create_sample_data.py
   ```

3. **Or run the orders-only script:**
   ```bash
   python add_orders_only.py
   ```

## What Gets Created

### Sample Users (MSMEs)
- ABC Manufacturing Ltd
- XYZ Textiles Pvt Ltd  
- Tech Solutions India

### Sample Warehouses
- Main Production Warehouse (Gurgaon)
- Secondary Storage Facility (Mumbai)
- Regional Distribution Center (Bangalore)

### Sample Drivers
- 8 drivers with Indian names and phone numbers
- Random truck numbers

### Sample Orders
Each warehouse gets 15-20 orders with:
- **Package Types:** Electronics, Textiles, Automotive, Pharmaceuticals, Food, Construction, etc.
- **Priorities:** High, Medium, Low, Urgent
- **Package Categories:** Fragile, Heavy, Liquid, Solid, Hazardous, Regular
- **Logistics:** Blue Dart, DTDC, FedEx, DHL, etc.
- **Time Slots:** 09:00-12:00, 12:00-15:00, 15:00-18:00, 18:00-21:00

## Order Date Distribution

- **40% Future Orders:** August 22-23, 2025 (with some other August dates)
- **30% Present Orders:** Recent dates (last 7 days)
- **30% Completed Orders:** Past dates (8-30 days ago)

## Database Schema

The scripts work with the existing models:
- `User` (MSME companies)
- `Warehouse` (storage facilities)
- `Driver` (delivery personnel)
- `Order` (pickup/delivery orders)

## Troubleshooting

### Common Issues

1. **"No users found"**
   - Run `create_sample_data.py` instead of `add_orders_only.py`

2. **Import errors**
   - Make sure you're in the correct directory
   - Check that all required packages are installed

3. **Database errors**
   - Ensure the database is properly initialized
   - Check that the Flask app can connect to the database

### Verification

After running the script, you can verify the data by:
1. Starting your Flask application
2. Checking the database through your application
3. Viewing orders in the warehouse dashboard

## Customization

You can modify the scripts to:
- Change the number of orders per warehouse
- Adjust the date distribution percentages
- Add more package types or logistics companies
- Modify addresses or contact information

## Notes

- The scripts use realistic Indian business data
- All phone numbers follow Indian format (+91-XXXXXXXXXX)
- Addresses are from major Indian cities
- Package names represent common MSME business types
- The scripts are idempotent - they won't create duplicate data if run multiple times
