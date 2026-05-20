# API Specification (Implementation Blueprint)

## Status

This repository currently contains the ML pipeline and artifacts generation scripts.  
This document specifies the API contract to expose the final models in a production-like service (FastAPI).

## 1) Service Goal

Expose final economic-profile capabilities:
- assign a zone to an economic profile (`cluster_label`)
- provide explainability signals
- return sector recommendations (legacy compatibility if required)

## 2) Base Configuration

- Framework: FastAPI
- Base path: `/api/v1`
- Content type: `application/json`
- Startup behavior: preload pipelines from `artifacts/`

Expected model files:
- `artifacts/cluster_classifier_pipeline_typology.pkl` (primary)
- optionally `artifacts/cluster_classifier_pipeline_anomaly.pkl`

## 3) Endpoints

### A. Health check

`GET /api/v1/health`

Response:
```json
{
  "status": "ok",
  "models_loaded": true,
  "mode": "typology"
}
```

### B. Predict profile for one zone

`POST /api/v1/predict/profile`

Request body (minimum required fields):
```json
{
  "city": "Casablanca",
  "entity_count_real": 120,
  "entity_count_total": 160,
  "density_log": 4.80,
  "active_rate": 0.91,
  "capital_median": 250000,
  "capital_mean": 1500000,
  "capital_max": 12000000,
  "sector_diversity": 1.95,
  "formal_ratio": 0.62,
  "sarl_count": 90,
  "sa_count": 8,
  "n_sectors_present": 9,
  "cell_lat": 33.57,
  "cell_lon": -7.62
}
```

Response:
```json
{
  "cluster_label": 2,
  "profile_name": "High-density capital hubs",
  "mode": "typology",
  "model": "RandomForest"
}
```

### C. Batch profile prediction

`POST /api/v1/predict/profile/batch`

Request:
```json
{
  "items": [
    { "... zone payload 1 ..." },
    { "... zone payload 2 ..." }
  ]
}
```

Response:
```json
{
  "count": 2,
  "predictions": [
    { "cluster_label": 1, "profile_name": "Emerging low-capital zones" },
    { "cluster_label": 2, "profile_name": "High-density capital hubs" }
  ]
}
```

### D. Explain profile drivers

`POST /api/v1/explain/profile`

Behavior:
- returns top global feature importances from latest artifact
- optional local explanation if SHAP values are available and mapped

Response:
```json
{
  "top_global_drivers": [
    { "feature": "active_rate", "importance": 0.201 },
    { "feature": "density_log", "importance": 0.114 }
  ]
}
```

## 4) Validation Rules

Server-side checks:
- reject missing required numeric fields
- reject non-finite values (NaN, inf)
- enforce realistic ranges for rates (`0 <= active_rate <= 1`, `0 <= formal_ratio <= 1`)
- return clear 422 errors for invalid schema

## 5) Error Contract

Standard error format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: density_log"
  }
}
```

Common codes:
- `VALIDATION_ERROR`
- `MODEL_NOT_LOADED`
- `INFERENCE_ERROR`
- `UNSUPPORTED_MODE`

## 6) Performance Targets

- p50 latency: < 100 ms for single prediction
- p95 latency: < 300 ms for single prediction
- batch endpoint: linear scaling up to at least 256 records/request

## 7) Security and Operations

- run behind reverse proxy (Nginx or equivalent)
- enable request size limits
- log request IDs and inference duration
- version lock artifacts used by deployment

## 8) Versioning

- current contract version: `v1`
- breaking changes require new prefix (`/api/v2`)
