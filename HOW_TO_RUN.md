# How to run (quick guide for a friend)

This repo has three parts: **backend** (Django), **frontend** (React), and **ML artifacts** (models + dataset).

## 1) Backend (Django API)

```bash
cd backend/api
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux

#pip install -r requirements-minimal.txt
# Or full ML endpoints:
pip install -r requirements.txt

python manage.py migrate

python manage.py import_economic_data --clear --zones-path "..\..\model\data_ml_final_enriched_cleaned.csv"
#python manage.py seed_entreprises   # optional sample data
python manage.py runserver
# or ..\..\.venv\Scripts\python.exe manage.py runserver
```

Backend runs at **http://127.0.0.1:8000**  
API docs at **http://127.0.0.1:8000/api/**

### Backend env (optional)
Create `backend/api/.env`:
```
DEBUG=True
SECRET_KEY=your-secret-key
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

## 2) Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### Frontend env (optional)
Create `frontend/.env`:
```
VITE_API_URL=http://127.0.0.1:8000
```

## 3) ML artifacts & scripts (optional)

The ML dataset and trained models live in `model/`:
- `model/dataset.csv`
- `model/artifacts/*.pkl`
- `model/model.pkl` (default regression model copy)

If you need to (re)train or regenerate artifacts:

```bash
pip install -r requirements.txt
python scripts/run_all.py typology
# or
python scripts/run_all.py anomaly
```

Other scripts:
```bash
python scripts/train_model_a.py
python scripts/train_model_b.py
python scripts/evaluate.py
python scripts/explain.py
```

Visual outputs land in:
```
docs/ml/reports/figures/
docs/ml/outputs/
```
