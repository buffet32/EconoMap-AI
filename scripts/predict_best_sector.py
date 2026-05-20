# predict_best_sector.py
# Répond à la question du Modèle B via le Modèle A :
# "Quel est le meilleur secteur pour cette zone ?"
#
# Approche : pour une zone donnée, on prédit le score d'attractivité
# de chaque secteur via le pipeline de régression du Modèle A,
# puis on retourne le top-K secteurs classés par score descendant.
#
# Pourquoi cette approche est meilleure que train_model_b.py :
# - Modèle A a R²=0.9885 → prédictions de score très fiables
# - Modèle B (classification directe) avait F1-macro=0.25 → trop faible
# - Une zone peut être attractive pour plusieurs secteurs simultanément
#   → retourner un classement est plus utile qu'une classe unique

import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np

from config import ARTIFACTS_DIR
from preprocessing import load_data
from features import engineer_features, get_feature_list_a
from utils import get_logger, load_artifact, save_metrics

logger = get_logger("predict_best_sector")

# Tous les secteurs du dataset
ALL_SECTORS = [
    "Agriculture", "Commerce", "Construction", "Education",
    "Finance", "Healthcare", "Information Technology",
    "Manufacturing", "Other", "Professional Services",
    "Real Estate", "Tourism & Hospitality", "Transport",
]


def predict_best_sectors_for_zone(zone_features: dict, top_k: int = 3) -> pd.DataFrame:
    """
    Pour une zone décrite par ses features économiques,
    prédit le score d'attractivité pour chaque secteur
    et retourne le classement top-K.

    Args:
        zone_features : dict des features de la zone
                        (sans sector_main — il sera testé pour chaque secteur)
        top_k         : nombre de secteurs à retourner

    Returns:
        DataFrame trié par score décroissant avec colonnes
        [sector_main, predicted_score, attractivity_class, rank]
    """
    pipe_reg = load_artifact("model_a_regression")
    pipe_clf = load_artifact("model_a_classification")
    le_clf   = load_artifact("model_a_label_encoder")

    rows = []
    for sector in ALL_SECTORS:
        row = {**zone_features, "sector_main": sector}
        rows.append(row)

    df_input = pd.DataFrame(rows)

    # Appliquer le feature engineering (mêmes transformations que l'entraînement)
    # Les agrégats ville nécessitent le dataset complet — on utilise les valeurs
    # fournies dans zone_features si disponibles, sinon on les calcule depuis
    # le dataset de référence
    df_full = load_data()
    city = zone_features.get("city", None)

    if city and "city_avg_density" not in zone_features:
        city_stats = df_full.groupby("city").agg(
            city_avg_density = ("density_log",    "mean"),
            city_avg_active  = ("active_rate",    "mean"),
            city_avg_capital = ("capital_median", "mean"),
            city_n_sectors   = ("sector_main",    "nunique"),
        )
        if city in city_stats.index:
            for col in ["city_avg_density", "city_avg_active",
                        "city_avg_capital", "city_n_sectors"]:
                df_input[col] = city_stats.loc[city, col]
        else:
            for col in ["city_avg_density", "city_avg_active",
                        "city_avg_capital", "city_n_sectors"]:
                df_input[col] = df_full[col].median() if col in df_full.columns else 0

    # Features d'interaction
    if "vitality" not in df_input.columns:
        df_input["vitality"] = df_input["density_log"] * df_input["active_rate"]
    if "weighted_capital" not in df_input.columns:
        df_input["weighted_capital"] = df_input["capital_median"] * df_input["active_rate"]
    if "gps_quality" not in df_input.columns:
        total = df_input.get("entity_count_total", df_input.get("entity_count_real", 1))
        df_input["gps_quality"] = df_input["entity_count_real"] / (total + 1e-6)
    if "rel_density" not in df_input.columns:
        avg = df_input.get("city_avg_density", df_input["density_log"].mean())
        df_input["rel_density"] = df_input["density_log"] / (avg + 1e-6)
    if "rel_capital" not in df_input.columns:
        avg = df_input.get("city_avg_capital", df_input["capital_median"].mean())
        df_input["rel_capital"] = df_input["capital_median"] / (avg + 1e-6)

    # Prédiction score et classe pour chaque secteur
    num_feat, cat_feat = get_feature_list_a()
    available = set(df_input.columns)
    num_feat  = [f for f in num_feat if f in available]
    cat_feat  = [f for f in cat_feat if f in available]

    X = df_input[num_feat + cat_feat]

    scores  = pipe_reg.predict(X)
    classes = le_clf.inverse_transform(pipe_clf.predict(X))

    results = pd.DataFrame({
        "sector_main"       : ALL_SECTORS,
        "predicted_score"   : scores.round(2),
        "attractivity_class": classes,
    }).sort_values("predicted_score", ascending=False).reset_index(drop=True)

    results["rank"] = results.index + 1
    return results.head(top_k)


def evaluate_on_test_set(top_k: int = 3) -> dict:
    """
    Évalue la stratégie Modèle A sur le test set de Modèle B :
    pour chaque zone du test set, prédit le top-K secteurs via Modèle A
    et vérifie si le vrai secteur est dans le top-K.

    Métrique : Top-K Hit Rate (équivalent du Top-K accuracy de Modèle B)
    """
    logger.info("=" * 55)
    logger.info(f"EVALUATION — Strategie Modele A pour prediction secteur")
    logger.info(f"Top-K = {top_k}")
    logger.info("=" * 55)

    pipe_reg = load_artifact("model_a_regression")
    le_b     = load_artifact("model_b_label_encoder")
    df       = load_data()

    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from config import TEST_SIZE, RANDOM_STATE
    from preprocessing import prepare_model_b

    data_b = prepare_model_b(df)
    X_test = data_b["X_test"]
    y_test = data_b["y_test"]
    le     = data_b["label_encoder"]

    # Pour chaque observation test, construire les 13 variantes sectorielles
    hits = 0
    results_rows = []

    X_test_df = X_test.copy()
    true_sectors = le.inverse_transform(y_test)

    for i, (idx, row) in enumerate(X_test_df.iterrows()):
        true_sector = true_sectors[i]

        # Créer 13 lignes — une par secteur
        rows_sector = []
        for sector in ALL_SECTORS:
            r = row.to_dict()
            r["sector_main"] = sector
            rows_sector.append(r)

        df_variants = pd.DataFrame(rows_sector)

        try:
            scores = pipe_reg.predict(df_variants)
        except Exception:
            continue

        ranked = sorted(zip(ALL_SECTORS, scores), key=lambda x: x[1], reverse=True)
        top_k_sectors = [s for s, _ in ranked[:top_k]]

        hit = true_sector in top_k_sectors
        if hit:
            hits += 1

        results_rows.append({
            "true_sector"  : true_sector,
            "top1_sector"  : ranked[0][0],
            "top1_score"   : round(ranked[0][1], 2),
            "top2_sector"  : ranked[1][0] if len(ranked) > 1 else "",
            "top3_sector"  : ranked[2][0] if len(ranked) > 2 else "",
            f"hit_top{top_k}": int(hit),
        })

    n_test = len(results_rows)
    hit_rate = hits / n_test if n_test > 0 else 0

    metrics = {
        f"top{top_k}_hit_rate"  : round(hit_rate, 4),
        "n_test"                : n_test,
        "hits"                  : hits,
        "strategy"              : "model_a_regression_ranking",
        "vs_model_b_top3"       : 0.5346,   # résultat précédent pour comparaison
    }

    logger.info(f"\n  Top-{top_k} Hit Rate (Modele A ranking) : {hit_rate:.4f}")
    logger.info(f"  Top-3 accuracy  (Modele B direct)       : 0.5346")
    logger.info(f"  Gain : {hit_rate - 0.5346:+.4f}")

    save_metrics(metrics, "predict_best_sector_eval")

    results_df = pd.DataFrame(results_rows)
    out_path = ARTIFACTS_DIR / "predict_best_sector_predictions.csv"
    results_df.to_csv(out_path, index=False)
    logger.info(f"\n  Predictions sauvegardees : {out_path}")

    return metrics


def demo():
    """
    Démonstration : prédit les meilleurs secteurs pour une zone exemple.
    """
    logger.info("\n=== DEMO — Meilleurs secteurs pour une zone Casablanca ===")

    # Zone exemple : cellule centrale Casablanca
    zone = {
        "city"               : "Casablanca",
        "entity_count_real"  : 150,
        "entity_count_total" : 160,
        "density_log"        : np.log1p(150),
        "active_rate"        : 0.75,
        "capital_median"     : 100000.0,
        "capital_mean"       : 120000.0,
        "capital_max"        : 500000.0,
        "sector_diversity"   : 0.85,
        "formal_ratio"       : 0.60,
        "sarl_count"         : 80,
        "sa_count"           : 10,
        "dist_casa_center"   : 2.5,
    }

    top3 = predict_best_sectors_for_zone(zone, top_k=3)
    logger.info(f"\n  Top-3 secteurs pour cette zone :\n{top3.to_string(index=False)}")
    return top3


def main():
    # 1. Évaluation sur le test set
    metrics = evaluate_on_test_set(top_k=3)

    # 2. Démonstration
    demo()

    logger.info("\nTermine. Fichiers dans model/artifacts/")


if __name__ == "__main__":
    main()
