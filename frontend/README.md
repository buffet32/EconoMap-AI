# Geo Entreprise Management System

A modern web application for managing companies with geolocation features, built with React frontend and Django REST API backend.

## 🌟 Features

### Frontend (React)
- **Modern UI**: Dark theme with responsive design
- **Interactive Map**: Real-time company locations with Leaflet
- **Search & Filter**: Advanced filtering by sector, city, and other criteria
- **CRUD Operations**: Create, Read, Update, Delete companies
- **Geocoding**: Automatic address to coordinates conversion
- **Plus Code Support**: Google Plus Codes integration
- **Responsive Design**: Works on desktop and mobile devices

### Backend (Django)
- **REST API**: Complete CRUD operations
- **CORS Support**: Configured for frontend integration
- **Database**: SQLite for development, PostgreSQL ready
- **Geocoding**: Integration with OpenStreetMap Nominatim
- **Data Validation**: Comprehensive input validation
- **API Documentation**: Interactive API docs

### AI Premium Features 🤖
- **Region Profitability Prediction**: AI-powered analysis of most profitable activities by region
- **Activity Location Suggestion**: Find optimal regions for specific business activities
- **AI Chatbot**: Intelligent assistant for entrepreneurship questions and advice
- **Data Interpretation**: Upload files and get AI-powered insights and recommendations
- **Market Intelligence**: Real-time market trends and opportunities analysis
- **Premium Dashboard**: Centralized access to all AI features with usage statistics

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+ and pip
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mon-projet
   ```

2. **Backend Setup**:
   ```bash
   cd backend/api
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements-minimal.txt
   python manage.py migrate
   python manage.py seed_entreprises  # Optional: Add sample data
   python manage.py runserver
   ```

3. **Frontend Setup** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://127.0.0.1:8000
   - API Docs: http://127.0.0.1:8000/api/

## 📁 Project Structure

```
mon-projet/
├── backend/               # Django Backend
│   └── api/               # Django project (manage.py, settings, apps)
├── frontend/              # React Frontend (Vite)
│   ├── src/               # React source
│   └── package.json
├── model/                 # Trained models + datasets
├── scripts/               # ML pipeline scripts
├── package.json           # Root workspace scripts
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **React Leaflet** - Interactive maps
- **FontAwesome** - Icons
- **React Toastify** - Notifications

### Backend
- **Django 5.2** - Web framework
- **Django REST Framework** - API framework
- **Django CORS Headers** - Cross-origin support
- **SQLite** - Database (development)
- **OpenStreetMap Nominatim** - Geocoding service

## 📊 Database Schema

### Entreprise Model
- `nom_entreprise` - Company name
- `code_ice` - ICE code
- `secteur` - Business sector
- `forme_juridique` - Legal form
- `ville` - City
- `adresse` - Address (supports Plus Codes)
- `latitude/longitude` - GPS coordinates
- `activite` - Business activity
- `type` - Person/Company type
- `email`, `tel`, `fax` - Contact info
- `certifications` - Certifications
- `cnss`, `identifiant_fiscal`, `patente`, `rc` - Administrative codes
- `en_activite` - Active status
- `taille_entreprise` - Company size

## 🔧 Configuration

### Environment Variables

Create `.env` files for environment-specific settings:

**Backend (.env in Api/)**:
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Frontend (.env in root)**:
```env
VITE_API_URL=http://127.0.0.1:8000
```

## 🗺️ Map Features

### Geocoding
- **Address Conversion**: Automatic conversion of addresses to coordinates
- **Plus Code Support**: Google Plus Codes (e.g., "CWP2+WQ")
- **City-Level Fallback**: Falls back to city coordinates if specific address not found
- **Manual Override**: Users can manually adjust coordinates

### Map Functionality
- **Interactive Markers**: Click to see company details
- **Dynamic Centering**: Map centers on filtered results
- **Zoom Levels**: Automatic zoom based on result spread
- **Search Integration**: Map updates with search/filter results

## 🔍 Search & Filter

### Available Filters
- **Text Search**: Company name, address, activity
- **Sector**: Business sector filter
- **City**: Location-based filter
- **Legal Form**: Company structure filter
- **Certifications**: Certification-based filter

### Features
- **Real-time Filtering**: Instant results as you type
- **Combined Filters**: Multiple filters work together
- **Result Counter**: Shows number of filtered results
- **Reset Functionality**: Clear all filters

## 📱 Responsive Design

### Breakpoints
- **Desktop**: Full feature set with sidebar navigation
- **Tablet**: Optimized layout for medium screens
- **Mobile**: Touch-friendly interface with mobile navigation

### Components
- **Header**: Responsive navigation with mobile menu
- **Dashboard**: Adaptive grid layout
- **Forms**: Mobile-optimized input fields
- **Map**: Touch-friendly controls

## 🚀 Deployment

### Backend Deployment
1. Set `DEBUG=False`
2. Configure production database (PostgreSQL recommended)
3. Set up environment variables
4. Use Gunicorn or similar WSGI server
5. Configure static file serving

### Frontend Deployment
1. Build the project: `npm run build`
2. Serve the `dist` folder
3. Configure API URL for production
4. Set up proper CORS settings

## 🧪 Testing

### Backend Tests
```bash
cd Api
python manage.py test
```

### Frontend Tests
```bash
npm test  # If test setup is configured
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 API Documentation

### Endpoints

#### Entreprises
- `GET /api/entreprises/` - List all companies
- `POST /api/entreprises/` - Create new company
- `GET /api/entreprises/{id}/` - Get specific company
- `PUT /api/entreprises/{id}/` - Update company
- `DELETE /api/entreprises/{id}/` - Delete company

### Premium AI Routes
- `/premium-dashboard` - Main premium dashboard with AI features overview
- `/ai-features` - AI prediction and chatbot features
- `/ai-interpretation` - Data analysis and market insights

### Example API Usage

```javascript
// Fetch all companies
const response = await fetch('http://127.0.0.1:8000/api/entreprises/');
const companies = await response.json();

// Create new company
const newCompany = {
  nom_entreprise: "Example Corp",
  code_ice: "ICE123456",
  secteur: "Technology",
  ville: "Marrakech",
  adresse: "CWP2+WQ Tantan",
  // ... other fields
};

const createResponse = await fetch('http://127.0.0.1:8000/api/entreprises/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newCompany)
});
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `django-cors-headers` is installed and configured
2. **Map Not Loading**: Check if Leaflet CSS is properly imported
3. **Geocoding Fails**: Verify internet connection for Nominatim API
4. **Database Errors**: Run migrations: `python manage.py migrate`

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reloading
2. **API Testing**: Use the interactive API docs at `/api/`
3. **Database Reset**: `python manage.py flush` to clear data
4. **Sample Data**: `python manage.py seed_entreprises` to add test data

## 📄 License

This project is part of the Geo Entreprise Management System.

## 🙏 Acknowledgments

- **OpenStreetMap** for geocoding services
- **Leaflet** for interactive maps
- **Django REST Framework** for API development
- **React** for the frontend framework
