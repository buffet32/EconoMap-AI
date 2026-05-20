# Test Plan - Economic Attractivity Project

## Purpose

This document defines the minimum test strategy required to keep the final project reliable and reproducible.

## 1) Test Scope

Components under test:
- `cluster_zones.py`
- `analyze_clusters.py`
- `train_cluster_classifier.py`
- `visualize_results.py`
- `run_all.py`
- utility modules (`config.py`, `utils.py`)

## 2) Test Levels

### A. Unit tests
Focus on deterministic helper behavior.

Recommended unit targets:
- `cluster_zones._safe_mode`
- `cluster_zones._balance_score`
- `cluster_zones._evaluate_partition`
- `analyze_clusters._cluster_profile_name`
- `analyze_clusters._top_items`

Assertions:
- Correct handling of empty/NaN-heavy series.
- Stable cluster validity logic (`valid_for_supervised`).
- Correct profile naming according to relative feature ratios.

### B. Integration tests
Run script pipelines with a lightweight fixture dataset.

Scenarios:
1. `typology` mode end-to-end:
   - `python cluster_zones.py typology`
   - `python analyze_clusters.py typology`
   - `python train_cluster_classifier.py typology`
   - expected artifacts generated
2. `anomaly` mode end-to-end:
   - same sequence with `anomaly`
3. full orchestration:
   - `python run_all.py typology`

Assertions:
- expected files exist in `artifacts/`
- output CSV/JSON are non-empty
- classifier metrics JSON contains `test_f1_macro` and `test_accuracy`

### C. Reproducibility tests

With fixed `RANDOM_STATE=42`, verify:
- cluster counts remain stable (within tolerance when algorithm is stochastic)
- selected strategy in typology mode remains consistent for unchanged data
- key metrics do not drift unexpectedly

## 3) Data Quality Guards (pre-ML checks)

Before running training:
- required columns exist (`cell_id`, `city`, `sector_main`, core numeric fields)
- no invalid infinities after transformations
- cluster input table has enough rows for multi-cluster search
- minimum class frequency is checked before supervised split

## 4) Non-Regression Checks

On each major change:
- compare current outputs vs previous baseline artifacts
- inspect:
  - `artifacts/clustering_metrics_typology.json`
  - `artifacts/cluster_classifier_metrics_typology.json`
  - `artifacts/cluster_summary_typology.json`

Alert conditions:
- typology mode falls to 1 effective cluster
- macro-F1 collapse greater than 0.10 from baseline
- major feature importance ranking inversion without data change rationale

## 5) Optional Pytest Layout

Suggested structure:
```text
tests/
  test_cluster_helpers.py
  test_analysis_helpers.py
  test_typology_integration.py
  test_anomaly_integration.py
```

## 6) Exit Criteria for "Project Ready"

The project is considered merge-ready/final-ready when:
- all unit and integration tests pass
- key artifacts are generated for requested mode(s)
- no runtime errors in `run_all.py`
- latest documentation (`README.md`, this file, variable dictionary, API spec) is consistent with current codebase
