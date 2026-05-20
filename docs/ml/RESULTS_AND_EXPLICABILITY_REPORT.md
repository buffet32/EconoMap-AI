# Results and Detailed Explainability Report

## Scope

This report consolidates the latest outputs produced by the hybrid pipeline in both modes:

- **Typology mode**: balanced economic profile discovery.
- **Anomaly mode**: atypical economic pocket detection.

Data source: `dataset.csv` aggregated to **142 zones**.

---

## 1) Scientific Validity Check (Passed)

The current pipeline is scientifically valid under your constraints:

- `attractivity_score` is **not used** as a supervised target.
- `attractivity_score` is used **only** for post-hoc interpretation/validation.
- Cluster classifier predicts **cluster labels**, not synthetic score.
- Leakage controls are explicitly logged in classifier metrics.

---

## 2) Typology Mode Results (Recommended Main Narrative)

## 2.1 Clustering setup and selection

From `artifacts/clustering_metrics_typology.json`:

- Selection strategy: `balanced_typology`
- Selected algorithm: **Spectral Clustering**
- Parameters: `k=3`, `affinity=nearest_neighbors`, `n_neighbors=10`
- Selection rationale:
  - Silhouette: `0.2288`
  - Balance score: `0.9628` (very high)
  - Valid for supervised follow-up: `true`

The selector correctly prioritized **balanced and trainable** structures over raw silhouette-only solutions.

### Cluster sizes (typology)

- Cluster 0: **29 zones** (20.4%)
- Cluster 1: **56 zones** (39.4%)
- Cluster 2: **57 zones** (40.1%)

This is a strong structural improvement vs the earlier degenerate partition.

## 2.2 Economic interpretation of clusters

From `artifacts/cluster_summary_typology.json`:

- **Cluster 0 (29 zones)** - "Emerging low-capital zones"
  - Lower density (`density_log=2.87`)
  - Lower activity (`active_rate=0.58`)
  - Lower formalization (`formal_ratio=0.017`)
  - Validation score mean: **35.02**
  - Interpretation: underdeveloped / early-stage local ecosystems.

- **Cluster 1 (56 zones)** - "Emerging low-capital zones" (but structurally more active than cluster 0)
  - Low-moderate density (`density_log=2.42`)
  - High activity (`active_rate=0.946`)
  - Moderate formalization (`formal_ratio=0.173`)
  - Validation score mean: **52.96**
  - Interpretation: active but still constrained-capital business fabric.

- **Cluster 2 (57 zones)** - "High-density capital hubs"
  - High density (`density_log=5.60`)
  - High sector presence (`n_sectors_present=9.70`)
  - Much higher capital intensity (`capital_mean=15.7M`)
  - Validation score mean: **61.27**
  - Interpretation: mature multi-sector economic hubs.

### Validation with attractivity score (descriptive only)

Monotonic trend is economically coherent:

- Cluster 0: **35.02**
- Cluster 1: **52.96**
- Cluster 2: **61.27**

This supports that discovered typologies map to meaningful economic gradients.

## 2.3 Supervised profile assignment performance

From `artifacts/cluster_classifier_metrics_typology.json`:

- Selected classifier: **RandomForest**
- CV F1-macro:
  - RandomForest: `0.9587`
  - XGBoost: `0.8961`
  - LightGBM: `0.8860`
- Test performance:
  - Accuracy: **0.9655**
  - F1-macro: **0.9552**

Interpretation:

- Strong generalization in typology setting.
- Macro metrics are high across classes; not driven only by majority class.
- This makes the "assign a new zone to an economic profile" use-case credible.

---

## 3) Explainability (Detailed)

Primary source: `artifacts/cluster_classifier_feature_importance_typology.csv`.

## 3.1 Top global drivers of cluster assignment

Most important features (descending):

1. `active_rate` (0.201)
2. `density_log` (0.114)
3. `entity_count_real` (0.113)
4. `n_sectors_present` (0.105)
5. `entity_count_total` (0.100)
6. `sarl_count` (0.093)
7. `formal_ratio` (0.065)

Lower-impact but contributive:

- `capital_max`, `capital_mean`
- spatial position (`cell_lon`, `cell_lat`)
- city indicators (small additional effect)

## 3.2 Economic reading of explainability

The model primarily separates clusters by:

- **economic intensity** (density and entity counts),
- **business vitality** (active rate),
- **structural complexity** (number of sectors),
- **formalization patterns** (SARL count, formal ratio).

This is exactly aligned with a structural economic typology, not with synthetic-score memorization.

## 3.3 SHAP explainability artifacts

The pipeline now supports SHAP generation in `train_cluster_classifier.py`:

- `artifacts/cluster_classifier_shap_importance_<mode>.csv`
- `artifacts/cluster_classifier_shap_values_<mode>.csv`

Behavior:

- If `shap` is installed, SHAP values are computed on a train sample.
- If `shap` is unavailable or fails, the pipeline keeps running and logs the reason.

These SHAP outputs provide:

- global feature attribution by mean absolute SHAP value,
- per-observation attribution matrix for deeper analysis.

## 3.4 Important caveat on current importance method

- Current importance is tree-based global feature importance.
- It is useful but can be biased toward certain feature types.
- For publication-grade local explainability, add SHAP per class/profile:
  - global SHAP summary,
  - per-cluster SHAP contrast plots,
  - case-level explanations for representative zones.

---

## 4) Anomaly Mode Results (Secondary Narrative)

From `artifacts/clustering_metrics_anomaly.json` and `cluster_summary_anomaly.json`:

- Selected strategy: **DBSCAN**
- Cluster counts: `-1:6`, `0:127`, `1:5`, `2:4`

Interpretation:

- This is suitable for **anomaly pocket detection**, not balanced typology.
- It identifies rare high-formalization/high-capital pockets (`-1`) and a dominant background cluster.

Classifier results in anomaly mode (`cluster_classifier_metrics_anomaly.json`):

- Accuracy: `0.9643` (high)
- F1-macro: `0.6604` (moderate)

Reason: class structure is highly imbalanced and less suitable for profile assignment.

---

## 5) Direct Typology vs Anomaly Comparison

- **Typology mode**
  - Balanced clusters
  - Strong macro classification (`F1-macro 0.9552`)
  - Best for publication narrative: economic structure discovery and assignment

- **Anomaly mode**
  - Excellent for outlier/atypical pocket detection
  - Less appropriate as primary typology framework
  - Best presented as complementary analysis

---

## 6) Scientific Limitations (Critical for Credibility)

This section should be explicitly reported in paper/thesis form.

- **Regional scope only**
  - Current dataset covers a specific regional footprint and cannot be directly generalized to all Moroccan territory without external validation.

- **No official economic labels**
  - Cluster labels are latent structures derived from observed variables, not official administrative/economic typology labels.
  - Results should be interpreted as **descriptive validation** and **economic coherence**, not absolute truth labels.

- **Clustering sensitivity**
  - Unsupervised solutions are sensitive to feature scaling, algorithm choice, and hyperparameters (`k`, linkage, affinity, `eps`, `min_samples`).
  - Multi-model selection mitigates this but does not eliminate epistemic uncertainty.

- **Indirect attractivity construct**
  - Even when not used for training, `attractivity_score` remains a synthetic indicator used only as post-hoc descriptive signal.
  - It supports coherence checks but is not an external causal criterion.

- **Temporal stationarity assumption**
  - Data are treated as static snapshot; potential time dynamics and macro shocks are not modeled.

## 7) Visualization Outputs for Final Reports

New script: `visualize_results.py`

Generated figures (saved under `artifacts/figures/`):

- `morocco_cluster_map_<mode>.png` (real lat/lon cluster map over Morocco extent)
- `morocco_density_heatmap_<mode>.png`
- `morocco_capital_heatmap_<mode>.png`
- `cluster_profile_heatmap_<mode>.png`
- `visualization_manifest_<mode>.json`

Usage:

```bash
python visualize_results.py typology
python visualize_results.py anomaly
```

These images are designed for direct inclusion in final reports/manuscripts.

---

## 8) Final Recommendation

For your main scientific deliverable:

1. Use **typology mode** as the primary experiment.
2. Keep **anomaly mode** as a secondary robustness/insight section.
3. Report:
   - cluster sizes and profiles,
   - score validation trend (descriptive only),
   - macro metrics for classifier,
   - top explanatory drivers.
4. Add SHAP-based local explanations as the next enhancement.

---

## 9) Reproducible Commands

### Typology pipeline (main)
```bash
python cluster_zones.py typology
python analyze_clusters.py typology
python train_cluster_classifier.py typology
python visualize_results.py typology
```

### Anomaly pipeline (secondary)
```bash
python cluster_zones.py anomaly
python analyze_clusters.py anomaly
python train_cluster_classifier.py anomaly
python visualize_results.py anomaly
```
