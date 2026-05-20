# Variable Dictionary

## Dataset Level (`dataset.csv`)

### Geographic and identity
- `cell_id`: unique grid-cell identifier.
- `cell_lat`: latitude of cell centroid.
- `cell_lon`: longitude of cell centroid.
- `city`: city label associated with row.

### Economic counts and intensity
- `entity_count_real`: number of entities with real geocoordinates.
- `entity_count_total`: total number of entities linked to the cell.
- `density_log`: log-transformed density proxy, typically `log(1 + entity_count_real)`.
- `active_rate`: share of active entities in the considered group.

### Capital features
- `capital_median`: median capital.
- `capital_mean`: mean capital.
- `capital_max`: max capital.

### Structure and formalization
- `sector_main`: main sector category (historically a feature/target depending on task).
- `sector_diversity`: diversification index (Shannon-like).
- `formal_ratio`: formalization ratio (e.g., SARL/SA share).
- `sarl_count`: number of SARL entities.
- `sa_count`: number of SA entities.
- `n_sectors_present`: number of distinct sectors in the cell.

### Historical synthetic targets (legacy framing)
- `attractivity_score`: composite score used in historical supervised framing; final framing uses it only for post-hoc validation.
- `attractivity_class`: discretized class derived from score (legacy supervised framing).

## Zone-Level Table (`cluster_zones.py`)

When aggregated by `cell_id`, the pipeline builds one row per zone containing:
- all core numeric aggregates listed above
- `dominant_sector`: sector with highest real entity contribution in the zone
- `cluster_label`: discovered unsupervised profile label

## Model Feature Roles in Final Framing

### Clustering features
Used from `ZONE_NUMERIC_FEATURES`:
- `entity_count_real`
- `entity_count_total`
- `density_log`
- `active_rate`
- `capital_median`
- `capital_mean`
- `capital_max`
- `sector_diversity`
- `formal_ratio`
- `sarl_count`
- `sa_count`
- `n_sectors_present`

Excluded by design:
- `attractivity_score`
- `attractivity_class`

### Cluster classifier features (`train_cluster_classifier.py`)

Numeric candidates:
- clustering numeric features plus `cell_lat`, `cell_lon`

Categorical:
- `city`

Forbidden (not used as predictors):
- `cluster_label` (target)
- `attractivity_score`
- `attractivity_class`
- `cell_id`
- `dominant_sector`

## Artifact Variables

### `artifacts/clustering_metrics_<mode>.json`
- `selected_strategy`
- `selection_details`
- `cluster_counts`
- `features_used`

### `artifacts/cluster_summary_<mode>.json`
- `profile_name`
- `n_zones`
- `mean_features`
- `dominant_sectors`
- `city_distribution`
- `attractivity_score_validation`

### `artifacts/cluster_classifier_metrics_<mode>.json`
- `selected_model`
- `cv_f1_macro_by_model`
- `test_f1_macro`
- `test_accuracy`
- `features_numeric`
- `features_categorical`
- `shap_explainability`
