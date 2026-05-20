# utils.py
# Fonctions utilitaires partagées : logging, sauvegarde, chargement.

import json
import logging
import sys
import joblib
from datetime import datetime
from pathlib import Path

from config import LOGS_DIR, ARTIFACTS_DIR


def get_logger(name: str) -> logging.Logger:
    """Crée un logger qui écrit dans console ET fichier log.
    Force UTF-8 sur Windows (CP1252 ne supporte pas les caractères Unicode).
    """
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)

    fmt = logging.Formatter("%(asctime)s | %(name)s | %(levelname)s | %(message)s",
                            datefmt="%Y-%m-%d %H:%M:%S")

    # Console — force UTF-8 sur Windows
    if sys.platform == "win32":
        import io
        stream = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8",
                                  errors="replace", line_buffering=True)
    else:
        stream = sys.stdout
    ch = logging.StreamHandler(stream)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    # Fichier — toujours UTF-8
    log_file = LOGS_DIR / f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    fh = logging.FileHandler(log_file, encoding="utf-8")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    return logger


def save_artifact(obj, name: str, logger=None):
    """Sauvegarde un objet avec joblib dans model/artifacts/."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    path = ARTIFACTS_DIR / f"{name}.pkl"
    joblib.dump(obj, path)
    if logger:
        logger.info(f"Artifact sauvegarde : {path}")
    return path


def load_artifact(name: str):
    """Charge un artifact depuis model/artifacts/."""
    path = ARTIFACTS_DIR / f"{name}.pkl"
    if not path.exists():
        raise FileNotFoundError(f"Artifact introuvable : {path}")
    return joblib.load(path)


def save_metrics(metrics: dict, name: str, logger=None):
    """Sauvegarde un dictionnaire de métriques en JSON."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    path = ARTIFACTS_DIR / f"{name}_metrics.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)
    if logger:
        logger.info(f"Metriques sauvegardees : {path}")
    return path


def load_metrics(name: str) -> dict:
    path = ARTIFACTS_DIR / f"{name}_metrics.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")
