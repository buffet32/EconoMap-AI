# Django API Backend

This is the Django REST API backend for the Geo Entreprise Management System.

## Features

- **Entreprise Management**: Full CRUD operations for companies
- **REST API**: Complete RESTful API with Django REST Framework
- **CORS Support**: Configured for frontend integration
- **Geocoding**: Support for address geocoding and Plus Codes
- **Database**: SQLite for development, PostgreSQL ready for production

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Setup Instructions

1. **From the repo root**:
   ```bash
   cd backend/api
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   
   For minimal setup (CRUD/API basics only):
   ```bash
   pip install -r requirements-minimal.txt
   ```
   
   For full setup with ML endpoints (`/api/predict`, `/api/recommendations`, dashboard scoring):
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser** (optional):
   ```bash
   python manage.py createsuperuser
   ```

6. **Seed the database with sample data** (optional):
   ```bash
   python manage.py seed_entreprises
   ```

7. **Run the development server**:
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://127.0.0.1:8000/`

## Data & ML Assets

The API expects datasets and trained models under the repo root:
- `model/dataset.csv`
- `model/artifacts/*.pkl`

## API Endpoints

### Entreprises

- `GET /api/entreprises/` - List all companies
- `POST /api/entreprises/` - Create a new company
- `GET /api/entreprises/{id}/` - Get a specific company
- `PUT /api/entreprises/{id}/` - Update a company
- `DELETE /api/entreprises/{id}/` - Delete a company

### API Documentation

Visit `http://127.0.0.1:8000/api/` for the interactive API documentation.

## Environment Variables

Create a `.env` file in the `backend/api` directory for environment-specific settings:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Database Configuration

### Development (SQLite)
The project is configured to use SQLite by default, which is perfect for development.

### Production (PostgreSQL)
For production, uncomment the PostgreSQL dependency in `requirements-minimal.txt` and update your database settings in `api/settings.py`.

## Project Structure

```
backend/api/
├── api/                 # Main Django project
│   ├── settings.py     # Project settings
│   ├── urls.py         # Main URL configuration
│   └── wsgi.py         # WSGI configuration
├── entreprise/         # Entreprise app
│   ├── models.py       # Entreprise model
│   ├── serializers.py  # REST API serializers
│   ├── views.py        # API views
│   └── urls.py         # App URL configuration
├── requirements.txt    # Full dependencies
├── requirements-minimal.txt  # Minimal dependencies
└── manage.py          # Django management script
```

## Development

### Running Tests
```bash
python manage.py test
```

### Code Formatting
If you have the full requirements installed:
```bash
black .
isort .
```

### Database Reset
```bash
python manage.py flush  # Clear all data
python manage.py seed_entreprises  # Re-seed with sample data
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   python manage.py runserver 8001  # Use different port
   ```

2. **Database errors**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **CORS errors**: Make sure `django-cors-headers` is installed and configured in settings.

4. **Import errors**: Make sure you're in the correct directory and virtual environment is activated.
   
   On Windows, if `python` still resolves to a global interpreter, run Django commands explicitly with:
   ```bash
   ..\..\.venv\Scripts\python.exe manage.py runserver
   ```

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in settings
2. Use a production database (PostgreSQL recommended)
3. Configure proper CORS settings
4. Use a production WSGI server like Gunicorn
5. Set up proper static file serving
6. Configure environment variables securely

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is part of the Geo Entreprise Management System. 