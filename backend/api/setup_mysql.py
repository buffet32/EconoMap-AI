#!/usr/bin/env python3
"""
MySQL Setup Script for G_entreprises Django Project
This script helps you set up the MySQL database for the project.
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

def create_database():
    """Create the MySQL database if it doesn't exist."""
    load_dotenv()
    
    # Database configuration
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'port': int(os.getenv('DB_PORT', '3306'))
    }
    
    db_name = os.getenv('DB_NAME', 'g_entreprises_db')
    
    try:
        # Connect to MySQL server
        connection = mysql.connector.connect(**db_config)
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Create database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ Database '{db_name}' created successfully or already exists.")
            
            # Show databases
            cursor.execute("SHOW DATABASES")
            databases = cursor.fetchall()
            print("\n📋 Available databases:")
            for db in databases:
                print(f"   - {db[0]}")
            
    except Error as e:
        print(f"❌ Error connecting to MySQL: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Make sure MySQL is installed and running")
        print("2. Check your MySQL credentials in .env file")
        print("3. Ensure MySQL user has CREATE DATABASE privileges")
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 MySQL connection closed.")

def check_mysql_installation():
    """Check if MySQL is properly installed and accessible."""
    try:
        import mysql.connector
        print("✅ mysql-connector-python is installed")
    except ImportError:
        print("❌ mysql-connector-python is not installed")
        print("Run: pip install mysql-connector-python")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 MySQL Setup for G_entreprises Django Project")
    print("=" * 50)
    
    if check_mysql_installation():
        create_database()
        
    print("\n📝 Next steps:")
    print("1. Make sure your .env file has correct database credentials")
    print("2. Run: python manage.py makemigrations")
    print("3. Run: python manage.py migrate")
    print("4. Run: python manage.py runserver") 