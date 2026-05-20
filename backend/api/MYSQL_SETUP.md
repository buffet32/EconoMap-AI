# MySQL Setup Guide for G_entreprises Django Project

This guide will help you switch from SQLite to MySQL for your Django project.

## Prerequisites

1. **MySQL Server** - Make sure MySQL is installed and running on your system
2. **Python MySQL Client** - The required packages are already in requirements.txt

## Installation Steps

### 1. Install MySQL Server (if not already installed)

**On macOS (using Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**On Windows:**
Download and install MySQL from the official website: https://dev.mysql.com/downloads/mysql/

### 2. Install Python Dependencies

Navigate to the `api` directory and install the requirements:
```bash
cd api
pip install -r requirements.txt
```

### 3. Create Environment File

Create a `.env` file in the `api` directory with your database configuration:
```bash
# Database Configuration
DB_NAME=g_entreprises_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

# Django Configuration
SECRET_KEY=django-insecure-zhhu7nu6gq+-!r%=$b=ijoiua0yo4b52xwt2i6_t+gin!q&11g
DEBUG=True
```

### 4. Set Up MySQL Database

Run the setup script to create the database:
```bash
python setup_mysql.py
```

Or manually create the database:
```sql
CREATE DATABASE g_entreprises_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run Django Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 7. Run the Development Server

```bash
python manage.py runserver
```

## Configuration Details

### Database Settings

The project is now configured to use MySQL with the following settings:

- **Engine**: `django.db.backends.mysql`
- **Database**: `g_entreprises_db`
- **Character Set**: `utf8mb4` (supports full Unicode including emojis)
- **SQL Mode**: `STRICT_TRANS_TABLES` (ensures data integrity)

### Environment Variables

The following environment variables can be customized in your `.env` file:

- `DB_NAME`: Database name (default: g_entreprises_db)
- `DB_USER`: MySQL username (default: root)
- `DB_PASSWORD`: MySQL password (default: empty)
- `DB_HOST`: MySQL host (default: localhost)
- `DB_PORT`: MySQL port (default: 3306)
- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)

## Troubleshooting

### Common Issues

1. **Connection Error**: Make sure MySQL is running and credentials are correct
2. **Permission Denied**: Ensure your MySQL user has CREATE DATABASE privileges
3. **Character Set Issues**: The configuration uses utf8mb4 for full Unicode support

### Useful MySQL Commands

```sql
-- Show all databases
SHOW DATABASES;

-- Show current user
SELECT USER();

-- Show user privileges
SHOW GRANTS;

-- Create a new user (if needed)
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON g_entreprises_db.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

## Migration from SQLite

If you have existing data in SQLite that you want to migrate to MySQL:

1. **Export data from SQLite:**
```bash
python manage.py dumpdata > data_backup.json
```

2. **After setting up MySQL and running migrations:**
```bash
python manage.py loaddata data_backup.json
```

## Production Considerations

For production deployment:

1. Use a strong, unique `SECRET_KEY`
2. Set `DEBUG=False`
3. Use a dedicated MySQL user with limited privileges
4. Configure proper MySQL security settings
5. Set up database backups
6. Use environment variables for all sensitive configuration

## Support

If you encounter any issues:

1. Check the MySQL error logs
2. Verify your `.env` file configuration
3. Ensure MySQL service is running
4. Test database connectivity using the setup script 