from pathlib import Path
from django.conf import settings

PROJECT_ROOT = Path(settings.PROJECT_ROOT)
ARTIFACTS_DIR = Path(settings.ML_ARTIFACTS_DIR)
ENTITIES_CSV = Path(settings.DATA_ENTITIES_CSV)
ZONES_CSV = Path(settings.DATA_ZONES_CSV)

TARGET_REG = "attractivity_score"
TARGET_CLF = "attractivity_class"
TARGET_B = "sector_main"

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
]

CAT_FEATURES_A = ["city"]
CAT_FEATURES_B = ["city"]
SECTOR_FEATURE = "sector_main"

ML_FEATURE_COLUMNS = NUM_FEATURES + ["city", "sector_main"]
