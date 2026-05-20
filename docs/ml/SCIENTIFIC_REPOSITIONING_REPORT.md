# Scientific Repositioning Report

## Project Reframing

This project was repositioned from:

- **Old framing (invalid for research):** predicting `attractivity_score` that is itself a synthetic composite built from input features.
- **New framing (scientifically valid):** discovering, modeling, and explaining economic spatial structures of geographic zones using unsupervised learning, with supervised learning used only to predict discovered profiles.

Core scientific principle applied:

- `attractivity_score` is **never** used as a supervised training target in this new pipeline.
- `attractivity_score` is used only for **post-hoc descriptive validation** of discovered clusters.

---

## What Was Implemented

Three new scripts were added:

- `cluster_zones.py`
  - Aggregates data to zone level (`cell_id`).
  - Supports two explicit modes:
    - `typology` (default): evaluates **KMeans, GMM, Agglomerative, Spectral**.
    - `anomaly`: evaluates **DBSCAN + KMeans** for atypical pocket detection.
  - In `typology` mode, selection is multi-objective:
    - separation quality (silhouette),
    - balance of cluster sizes (entropy-based balance score),
    - supervised readiness constraints (minimum cluster size and share).
  - In `anomaly` mode, DBSCAN remains available for anomaly-oriented analysis.
  - Outputs:
    - `artifacts/zone_clusters.csv`
    - `artifacts/clustering_metrics.json`

- `analyze_clusters.py`
  - Builds interpretable cluster profiles:
    - mean economic features,
    - dominant sectors,
    - city distribution,
    - cluster-level `attractivity_score` stats for validation only.
  - Outputs:
    - `artifacts/cluster_summary.json`
    - `artifacts/cluster_summary.txt`

- `train_cluster_classifier.py`
  - Predicts **cluster labels** (economic profiles), not score.
  - Compares `RandomForest`, `XGBoost`, `LightGBM` (if available).
  - Uses `F1-macro` + accuracy.
  - Handles rare-cluster edge cases robustly.
  - Outputs:
    - `artifacts/cluster_classifier_pipeline.pkl`
    - `artifacts/cluster_classifier_metrics.json`
    - `artifacts/cluster_classifier_predictions.csv`
    - `artifacts/cluster_classifier_feature_importance.csv`

---

## Anti-Leakage and Validity Controls

Implemented controls include:

- Conceptual leakage prevention:
  - `attractivity_score` excluded from clustering features.
  - `attractivity_score` and `attractivity_class` excluded from classifier features.
- Role separation:
  - Unsupervised stage discovers structure from economic variables only.
  - Supervised stage predicts discovered `cluster_label` only.
- Cluster quality constraints:
  - clustering selection prioritizes solutions with minimum cluster size compatible with supervised evaluation.
- Transparent logging:
  - strategy selection rationale and metrics saved in `clustering_metrics.json`.

---

## Run Summary (Current Results)

### 1) Unsupervised clustering

From `artifacts/clustering_metrics.json`:

- Number of zones: **142**
- Features used for clustering: **12**
- Selected strategy: **DBSCAN**
- Selection reason:
  - KMeans had very high silhouette for `k=2` (`0.8534`) but produced a singleton cluster (`min_cluster_size = 1`), not valid for supervised follow-up.
  - DBSCAN provided a valid multi-cluster structure (best quality score `0.5218`, with minimum cluster size `4`).
- Final cluster counts:
  - cluster `-1` (noise/outlier-like): **6**
  - cluster `0`: **127**
  - cluster `1`: **5**
  - cluster `2`: **4**

### 2) Cluster interpretation

From `artifacts/cluster_summary.json`:

- **Cluster 2 — "High-density capital hubs"** (`n=4`)
  - Very high density and very high aggregate capital signals.
  - Mean validation score: **66.69** (highest among dense business clusters).
  - Dominant city: Casablanca.

- **Cluster 1 — "Emerging low-capital zones"** (`n=5`)
  - Very low density, low capitalization, low diversification.
  - Mean validation score: **37.28** (lower attractivity profile).

- **Cluster 0 — "Intermediate mixed economic zones"** (`n=127`)
  - Main mass of zones with moderate, mixed economic characteristics.
  - Mean validation score: **52.42**.

- **Cluster -1 — "Structured formal business zones"** (`n=6`, DBSCAN noise class)
  - High formalization/capital signatures and atypical structure.
  - Mean validation score: **60.54**.
  - Interpreted as special/outlier-like economic pockets.

### 3) Supervised profile assignment

From `artifacts/cluster_classifier_metrics.json`:

- Selected model: **LightGBM**
- CV `F1-macro` (model selection):
  - RandomForest: `0.6602`
  - XGBoost: `0.5088`
  - LightGBM: `0.9613`
- Test metrics:
  - Accuracy: **0.9643**
  - F1-macro: **0.6604**

Interpretation:

- The realistic metric for scientific reporting is **F1-macro** (class-imbalance robust), not accuracy alone.
- `F1-macro = 0.6604` is consistent with a credible, non-tautological setup.
- Very high accuracy is expected because one cluster is dominant; macro metrics give a more honest view.

---

## Scientific Interpretation

This pipeline now supports a defensible narrative:

- Economic zones are discovered as latent structures from observed economic behavior (density, activity, capitalization, formalization, diversification).
- The discovered structures are interpretable and map to plausible economic archetypes.
- The original score is used as an external descriptive signal to check whether clusters are economically coherent.
- A secondary classifier can assign new zones to discovered profiles with moderate-to-good macro performance.

This is scientifically stronger than direct prediction of a synthetic score built from the same components.

---

## Reproducibility

Run sequence:

```bash
python cluster_zones.py                # default: balanced typology mode
# or: python cluster_zones.py anomaly  # anomaly detection mode
python analyze_clusters.py
python train_cluster_classifier.py
```

Main artifacts to include in reporting:

- `artifacts/clustering_metrics.json`
- `artifacts/zone_clusters.csv`
- `artifacts/cluster_summary.json`
- `artifacts/cluster_classifier_metrics.json`
- `artifacts/cluster_classifier_feature_importance.csv`

---

## Recommended Reporting Language (Paper/Thesis)

Suggested positioning sentence:

> "We propose a data-driven framework to discover and model economic spatial structures at zone level using unsupervised clustering, followed by supervised profile assignment. The synthetic attractivity score is used exclusively as a post-hoc descriptive validation signal and never as a training target."
