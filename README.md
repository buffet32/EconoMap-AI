# Geo‑Economic Intelligence Platform

**AI‑first economic zone insights delivered as a full‑stack product.**  
This project combines a production‑ready Django API, a React (Vite) interface, and a rigorous ML pipeline to discover, explain, and serve economic patterns across geographic zones.

**Start here:** `HOW_TO_RUN.md` (clean setup for backend, frontend, and ML scripts).

## Why it matters

Organizations struggle to turn raw economic and geographic signals into actionable, explainable insights. This platform operationalizes that gap with an end‑to‑end system: data ingestion → model training → explainability → API delivery → interactive UI.

## What the product delivers

**AI value**
1. **Economic zone profiling** via clustering (typology + anomaly views).
2. **Model‑driven recommendations** for promising sectors per zone.
3. **Explainability** (feature importance + SHAP when available) to build trust.

**Product value**
1. **REST API** for enterprise workflows and integrations.
2. **Interactive frontend** with dashboards, maps, and analytics.
3. **Reproducible ML pipeline** with documented outputs and artifacts.

## ML approach (high level)

This solution prioritizes scientific validity over vanity metrics:
- **Unsupervised clustering** discovers latent economic profiles.
- **Supervised classification** assigns new zones to those profiles.
- **Explainability artifacts** provide transparent, defensible insights.

Artifacts and reports are stored under `docs/ml/` and `model/artifacts/`.

## Tech stack

- **Backend:** Django 5 + Django REST Framework
- **Frontend:** React 18 + Vite + Leaflet
- **ML:** scikit‑learn, XGBoost, LightGBM, SHAP, pandas, numpy

## Repo structure

```
mon-projet/
├── backend/             # Django API (manage.py under backend/api)
├── frontend/            # React (Vite)
├── model/               # dataset.csv + trained artifacts
├── scripts/             # ML pipeline + analysis scripts
├── docs/                # ML reports, docs, and assets
├── requirements.txt     # Root Python deps (includes backend)
└── package.json         # Root workspace scripts
```

## Quick run

Open `HOW_TO_RUN.md` for the exact commands.  
Core assets:
- Dataset: `model/dataset.csv`
- Models: `model/artifacts/*.pkl`
- Outputs: `docs/ml/reports/figures/` and `docs/ml/outputs/`
