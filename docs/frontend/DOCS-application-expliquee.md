# Présentation de l’application Geo Entreprise Management System

Ce fichier décrit l’application complète et explique l’organisation, l’installation et l’utilisation pour un développeur ou un administrateur francophone.

## 1. Objectif

Geo Entreprise Management System est une application web qui permet de gérer des entreprises (CRUD) avec géolocalisation et filtres par secteur/ville/etc. Le frontend est réalisé en React (Vite) et le backend en Django REST Framework.

## 2. Architecture

- Frontend : React 18, Vite, React Router, React Leaflet (carte interactive), FontAwesome, React Toastify.
- Backend : Django 5.2, Django REST Framework, Django CORS Headers.
- Base de données : SQLite (développement), compatible PostgreSQL.
- API : endpoints CRUD pour `entreprises` et complément par géocodage.

## 3. Fonctionnalités clés

- Listing, création, modification et suppression d’entreprises
- Recherche textuelle, filtres (secteur, ville, forme juridique, certifications)
- Carte interactive avec marqueurs et zoom automatique
- Géocodage d’adresses (OpenStreetMap/Nominatim et plus codes)
- Import d’un jeu de données via la commande `seed_entreprises`
- Interface responsive (desktop/mobile)

## 4. Prérequis

- Node.js 16+ et npm
- Python 3.8+ et pip
- Git

## 5. Installation

### Backend

```bash
cd G_entreprises/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-minimal.txt
python manage.py migrate
python manage.py seed_entreprises  # optionnel
python manage.py runserver
```

### Frontend (nouveau terminal)

```bash
cd /Users/safiatirar/Desktop/EMSI/Stage_2025/v3/G_entreprises
npm install
npm run dev
```

## 6. Points d’accès

- Frontend : http://localhost:5173/
- Backend API : http://127.0.0.1:8000/
- Docs API : http://127.0.0.1:8000/api/

## 7. Configuration des variables d’environnement

- Backend (`api/.env` ou variables système) : `DEBUG`, `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`.
- Frontend (`.env`) : `VITE_API_URL=http://127.0.0.1:8000`.

## 8. Mise en production (high level)

- `DEBUG=False`
- Base de données de production (PostgreSQL)
- Serveur WSGI (Gunicorn, UWSGI) + Nginx
- Compilation frontend : `npm run build` et servir `dist/`
- Activer CORS uniquement pour le domaine de production

## 9. Commandes utiles

- `npm run lint` : lint frontend (ESLint)
- `npm run build` : build production frontend
- `python manage.py test` : tests backend

## 10. Résolution des conflits de ports

- Port frontend : 5173 (exemple) - modification possible `npm run dev -- --port 5174`
- Port backend : 8000 - modification possible `python manage.py runserver 8001`

## 11. Contact et support

- Ce document est destiné à faciliter l’appropriation de l’application.
- En cas d’erreur de dépendance ou d’erreur 500, vérifiez les logs Django (`manage.py runserver`) et la console Vite.
