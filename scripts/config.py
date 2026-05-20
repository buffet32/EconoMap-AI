# config.py
# Centralise tous les paramètres du projet ML.

from pathlib import Path

# ── Chemins ──────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = PROJECT_ROOT / "model"
DOCS_DIR = PROJECT_ROOT / "docs"
ML_DOCS_DIR = DOCS_DIR / "ml"

DATA_PATH = MODEL_DIR / "dataset.csv"
ARTIFACTS_DIR = MODEL_DIR / "artifacts"
REPORTS_DIR = ML_DOCS_DIR / "reports"
OUTPUTS_DIR = ML_DOCS_DIR / "outputs"
LOGS_DIR = PROJECT_ROOT / "runtime" / "logs"

# ── Colonnes ─────────────────────────────────────────────────
ID_COLS     = ["cell_id", "cell_lat", "cell_lon"]   # jamais utilisées comme features
TARGET_REG  = "attractivity_score"
TARGET_CLF  = "attractivity_class"
TARGET_B    = "sector_main"

# Features numériques
NUM_FEATURES = [
    "entity_count_real",
    "entity_count_total",
    "density_log",
    "active_rate",
    "capital_median",
    "capital_mean",
    "capital_max",
    "sector_diversity",
    "formal_ratio",
    "sarl_count",
    "sa_count",
    "dist_casa_center",
]

# Features catégorielles
CAT_FEATURES_A = ["city"]              # Modèle A : zone + secteur → score
CAT_FEATURES_B = ["city"]              # Modèle B : zone → secteur

# sector_main est feature pour Modèle A, target pour Modèle B
SECTOR_FEATURE = "sector_main"

# ── Split ─────────────────────────────────────────────────────
TEST_SIZE    = 0.20
RANDOM_STATE = 42
CV_FOLDS     = 5

# ── Hyperparamètres grilles ───────────────────────────────────
RF_PARAM_GRID = {
    "model__n_estimators"      : [100, 200, 300],
    "model__max_depth"         : [None, 10, 20],
    "model__min_samples_split" : [2, 5],
    "model__min_samples_leaf"  : [1, 2],
}

XGB_PARAM_GRID = {
    "model__n_estimators"  : [100, 200, 300],
    "model__max_depth"     : [3, 5, 7],
    "model__learning_rate" : [0.05, 0.1, 0.2],
    "model__subsample"     : [0.8, 1.0],
}

LGB_PARAM_GRID = {
    "model__n_estimators"  : [100, 200],
    "model__max_depth"     : [5, 10],
    "model__learning_rate" : [0.05, 0.1],
    "model__num_leaves"    : [31, 63],
}

# ── SHAP ──────────────────────────────────────────────────────
SHAP_SAMPLE_SIZE = 100   # nb lignes pour calcul SHAP (vitesse)
