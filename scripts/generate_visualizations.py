"""
generate_visualizations.py
===========================
Génère toutes les visualisations pour le rapport d'évaluation du modèle.
Lit directement depuis model/artifacts — à lancer après evaluate.py et explain.py.

Outputs : docs/ml/reports/figures/*.png  (haute résolution, prêtes pour rapport)

Usage:
    pip install matplotlib seaborn pandas numpy
    python generate_visualizations.py
"""

import warnings
warnings.filterwarnings("ignore")

import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
import seaborn as sns

from config import ARTIFACTS_DIR, DATA_PATH, REPORTS_DIR

# ── Style global ─────────────────────────────────────────────
plt.rcParams.update({
    "font.family"      : "DejaVu Sans",
    "font.size"        : 11,
    "axes.titlesize"   : 13,
    "axes.titleweight" : "bold",
    "axes.spines.top"  : False,
    "axes.spines.right": False,
    "figure.dpi"       : 150,
    "savefig.dpi"      : 200,
    "savefig.bbox"     : "tight",
    "savefig.facecolor": "white",
})

PALETTE = ["#2E4057", "#048A81", "#54C6EB", "#EF7B45", "#D64045", "#8B5CF6"]
ARTIFACTS = ARTIFACTS_DIR
OUT_DIR = REPORTS_DIR / "figures"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def load_json(name):
    p = ARTIFACTS / name
    if not p.exists():
        print(f"  [SKIP] {name} introuvable")
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f)

def load_csv(name):
    p = ARTIFACTS / name
    if not p.exists():
        print(f"  [SKIP] {name} introuvable")
        return None
    return pd.read_csv(p)

def save(fig, name):
    path = OUT_DIR / name
    fig.savefig(path)
    print(f"  Sauvegarde : {path}")
    plt.close(fig)


# ════════════════════════════════════════════════════════════
# FIG 1 — Résumé métriques Modèle A (régression + classification)
# ════════════════════════════════════════════════════════════
def fig_model_a_summary():
    print("\n[1] Résumé métriques Modèle A")
    reg = load_json("model_a_regression_eval_metrics.json")
    clf = load_json("model_a_classification_eval_metrics.json")
    if not reg or not clf:
        return

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    fig.suptitle("Modèle A — Résumé des performances", fontsize=15, fontweight="bold", y=1.02)

    # ── Régression ──
    ax = axes[0]
    metrics = {"RMSE\n(primaire)": reg["rmse"],
               "MAE": reg["mae"],
               "R²×100": reg["r2"] * 100}
    colors = [PALETTE[4], PALETTE[1], PALETTE[0]]
    bars = ax.barh(list(metrics.keys()), list(metrics.values()), color=colors, height=0.5)
    ax.set_title("Régression — attractivity_score")
    ax.set_xlabel("Valeur")
    for bar, val in zip(bars, metrics.values()):
        ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2,
                f"{val:.2f}", va="center", fontweight="bold")
    ax.set_xlim(0, 110)
    # Annotation R²
    ax.axvline(98.85, color=PALETTE[0], linestyle="--", alpha=0.3)

    # ── Classification ──
    ax = axes[1]
    classes = clf.get("classes", ["Faible", "Fort", "Moyen"])
    f1_vals = [clf.get(f"f1_{c}", 0) for c in classes]
    colors_cls = [PALETTE[4], PALETTE[0], PALETTE[1]]
    bars = ax.bar(classes, f1_vals, color=colors_cls, width=0.5)
    ax.set_title("Classification — attractivity_class")
    ax.set_ylabel("F1-score par classe")
    ax.set_ylim(0, 1.15)
    ax.axhline(clf.get("f1_macro", 0), color="black", linestyle="--",
               linewidth=1.5, label=f"F1-macro = {clf.get('f1_macro',0):.3f}")
    ax.axhline(clf.get("top_2_accuracy", 1.0), color=PALETTE[2], linestyle=":",
               linewidth=1.5, label=f"Top-2 accuracy = {clf.get('top_2_accuracy',1.0):.2f}")
    for bar, val in zip(bars, f1_vals):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.02,
                f"{val:.3f}", ha="center", fontweight="bold")
    ax.legend(fontsize=9)

    plt.tight_layout()
    save(fig, "fig1_model_a_summary.png")


# ════════════════════════════════════════════════════════════
# FIG 2 — Matrice de confusion Modèle A (classification)
# ════════════════════════════════════════════════════════════
def fig_confusion_matrix_a():
    print("\n[2] Matrice de confusion Modèle A")
    cm_df = load_csv("model_a_classification_confusion_matrix.csv")
    if cm_df is None:
        return

    cm_df = cm_df.set_index(cm_df.columns[0])
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.heatmap(cm_df, annot=True, fmt="d", cmap="Blues",
                linewidths=0.5, ax=ax, cbar_kws={"label": "Nb observations"})
    ax.set_title("Matrice de confusion — Modèle A Classification\n(Faible / Moyen / Fort)",
                 fontweight="bold")
    ax.set_xlabel("Prédit", fontweight="bold")
    ax.set_ylabel("Réel", fontweight="bold")

    # Encadrer la diagonale
    for i in range(len(cm_df)):
        ax.add_patch(plt.Rectangle((i, i), 1, 1, fill=False,
                                   edgecolor=PALETTE[3], lw=2.5))
    plt.tight_layout()
    save(fig, "fig2_confusion_matrix_a.png")


# ════════════════════════════════════════════════════════════
# FIG 3 — Régression : y_true vs y_pred + distribution résidus
# ════════════════════════════════════════════════════════════
def fig_regression_diagnostics():
    print("\n[3] Diagnostics régression")
    df = load_csv("model_a_regression_eval.csv")
    if df is None:
        return

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    fig.suptitle("Modèle A Régression — Diagnostics", fontweight="bold", fontsize=14)

    # ── Scatter y_true vs y_pred ──
    ax = axes[0]
    ax.scatter(df["y_true"], df["y_pred"], alpha=0.6, color=PALETTE[0],
               edgecolors="white", linewidth=0.4, s=60)
    lims = [df[["y_true","y_pred"]].min().min() - 2,
            df[["y_true","y_pred"]].max().max() + 2]
    ax.plot(lims, lims, "--", color=PALETTE[4], linewidth=1.5, label="Prédiction parfaite")
    ax.set_xlabel("Score réel")
    ax.set_ylabel("Score prédit")
    ax.set_title("Score réel vs Score prédit")
    ax.legend()
    # Annotation R²
    r2 = 1 - ((df["y_true"] - df["y_pred"])**2).sum() / ((df["y_true"] - df["y_true"].mean())**2).sum()
    ax.text(0.05, 0.92, f"R² = {r2:.4f}", transform=ax.transAxes,
            fontsize=12, fontweight="bold", color=PALETTE[0])

    # ── Distribution résidus ──
    ax = axes[1]
    residuals = df["residual"]
    ax.hist(residuals, bins=25, color=PALETTE[1], edgecolor="white",
            alpha=0.85, density=True)
    from scipy.stats import norm
    mu, std = residuals.mean(), residuals.std()
    x = np.linspace(residuals.min(), residuals.max(), 200)
    ax.plot(x, norm.pdf(x, mu, std), color=PALETTE[4], linewidth=2,
            label=f"N({mu:.2f}, {std:.2f})")
    ax.axvline(0, color="black", linestyle="--", linewidth=1.2)
    ax.set_xlabel("Résidu (réel − prédit)")
    ax.set_ylabel("Densité")
    ax.set_title("Distribution des résidus")
    ax.legend()

    plt.tight_layout()
    save(fig, "fig3_regression_diagnostics.png")


# ════════════════════════════════════════════════════════════
# FIG 4 — Comparaison CV des 3 modèles (régression)
# ════════════════════════════════════════════════════════════
def fig_model_comparison_cv():
    print("\n[4] Comparaison CV modèles")
    reg_metrics = load_json("model_a_regression_metrics.json")
    clf_metrics = load_json("model_a_classification_metrics.json")
    if not reg_metrics or not clf_metrics:
        return

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    fig.suptitle("Comparaison des modèles — Cross-Validation 5-fold", fontweight="bold")

    # ── Régression — neg-RMSE ──
    ax = axes[0]
    cv_reg = reg_metrics.get("cv_results", {})
    models = list(cv_reg.keys())
    means  = [abs(cv_reg[m].get("cv_neg_rmse_mean", 0)) for m in models]
    stds   = [abs(cv_reg[m].get("cv_neg_rmse_std",  0)) for m in models]
    colors = [PALETTE[2] if m == reg_metrics.get("model") else PALETTE[0] for m in models]
    bars   = ax.bar(models, means, yerr=stds, color=colors, width=0.5,
                    capsize=5, error_kw={"linewidth":1.5})
    ax.set_title("Régression — RMSE (CV)\n[plus bas = meilleur]")
    ax.set_ylabel("RMSE moyen")
    for bar, val in zip(bars, means):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.03,
                f"{val:.3f}", ha="center", fontsize=9, fontweight="bold")
    # Légende meilleur
    best_patch = mpatches.Patch(color=PALETTE[2], label=f"Meilleur : {reg_metrics.get('model')}")
    ax.legend(handles=[best_patch], fontsize=9)

    # ── Classification — F1-macro ──
    ax = axes[1]
    cv_clf = clf_metrics.get("cv_results", {})
    models_c = list(cv_clf.keys())
    means_c  = [cv_clf[m].get("cv_f1_macro_mean", 0) for m in models_c]
    stds_c   = [cv_clf[m].get("cv_f1_macro_std",  0) for m in models_c]
    colors_c = [PALETTE[2] if m == clf_metrics.get("model") else PALETTE[0] for m in models_c]
    bars_c   = ax.bar(models_c, means_c, yerr=stds_c, color=colors_c, width=0.5,
                      capsize=5, error_kw={"linewidth":1.5})
    ax.set_title("Classification — F1-macro (CV)\n[plus haut = meilleur]")
    ax.set_ylabel("F1-macro moyen")
    ax.set_ylim(0, 1.1)
    for bar, val in zip(bars_c, means_c):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                f"{val:.3f}", ha="center", fontsize=9, fontweight="bold")
    best_patch_c = mpatches.Patch(color=PALETTE[2], label=f"Meilleur : {clf_metrics.get('model')}")
    ax.legend(handles=[best_patch_c], fontsize=9)

    plt.tight_layout()
    save(fig, "fig4_model_comparison_cv.png")


# ════════════════════════════════════════════════════════════
# FIG 5 — Feature importance (SHAP ou permutation)
# ════════════════════════════════════════════════════════════
def fig_feature_importance():
    print("\n[5] Feature importance")

    sources = [
        ("model_a_regression_feature_importance.csv",       "Modèle A — Régression\n(SHAP mean |values|)",   "mean_abs_shap"),
        ("model_a_regression_permutation_importance.csv",   "Modèle A — Régression\n(Permutation)",           "importance"),
        ("model_a_classification_permutation_importance.csv","Modèle A — Classification\n(Permutation)",      "importance"),
    ]

    loaded = []
    for fname, title, col in sources:
        df = load_csv(fname)
        if df is not None and col in df.columns:
            loaded.append((df, title, col))
            break   # on prend le premier disponible pour la régression

    # Chercher aussi classification
    df_clf = load_csv("model_a_classification_permutation_importance.csv")
    if df_clf is not None and "importance" in df_clf.columns:
        loaded.append((df_clf, "Modèle A — Classification\n(Permutation importance)", "importance"))

    if not loaded:
        print("  Aucun fichier d'importance trouvé")
        return

    n = len(loaded)
    fig, axes = plt.subplots(1, n, figsize=(7 * n, 6))
    if n == 1:
        axes = [axes]

    fig.suptitle("Importance des features", fontweight="bold", fontsize=14)

    for ax, (df, title, col) in zip(axes, loaded):
        top = df.nlargest(12, col)
        colors = [PALETTE[0] if i == 0 else PALETTE[1] if i < 3 else "#AABCCC"
                  for i in range(len(top))]
        bars = ax.barh(top["feature"][::-1], top[col][::-1], color=colors[::-1], height=0.65)
        ax.set_title(title)
        ax.set_xlabel("Importance")
        for bar, val in zip(bars, top[col][::-1]):
            ax.text(bar.get_width() + top[col].max() * 0.01,
                    bar.get_y() + bar.get_height()/2,
                    f"{val:.3f}", va="center", fontsize=8)
        # Top 3 en gras
        for i, label in enumerate(ax.get_yticklabels()):
            if i >= len(top) - 3:
                label.set_fontweight("bold")

    plt.tight_layout()
    save(fig, "fig5_feature_importance.png")


# ════════════════════════════════════════════════════════════
# FIG 6 — Radar chart : profil de performance Modèle A
# ════════════════════════════════════════════════════════════
def fig_radar_performance():
    print("\n[6] Radar performance")
    clf = load_json("model_a_classification_eval_metrics.json")
    reg = load_json("model_a_regression_eval_metrics.json")
    if not clf or not reg:
        return

    # Normaliser toutes les métriques entre 0 et 1 pour le radar
    metrics = {
        "R²"          : reg.get("r2", 0),
        "1 - RMSE/100": max(0, 1 - reg.get("rmse", 0) / 100),
        "1 - MAE/100" : max(0, 1 - reg.get("mae", 0) / 100),
        "F1-macro"    : clf.get("f1_macro", 0),
        "Accuracy"    : clf.get("accuracy", 0),
        "Top-2 acc"   : clf.get("top_2_accuracy", 0),
    }

    labels = list(metrics.keys())
    values = list(metrics.values())
    N = len(labels)

    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]
    values += values[:1]

    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
    ax.set_theta_offset(np.pi / 2)
    ax.set_theta_direction(-1)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, size=11, fontweight="bold")
    ax.set_ylim(0, 1)
    ax.set_yticks([0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["0.25", "0.50", "0.75", "1.00"], size=8)
    ax.set_rlabel_position(30)

    ax.plot(angles, values, "o-", linewidth=2.5, color=PALETTE[0])
    ax.fill(angles, values, alpha=0.25, color=PALETTE[0])

    # Référence baseline 0.8
    baseline = [0.8] * N + [0.8]
    ax.plot(angles, baseline, "--", linewidth=1, color=PALETTE[4], alpha=0.5)

    ax.set_title("Profil de performance — Modèle A\n(Toutes métriques normalisées [0–1])",
                 fontweight="bold", pad=20)
    legend = [
        mpatches.Patch(color=PALETTE[0], label="Modèle A"),
        mpatches.Patch(color=PALETTE[4], alpha=0.5, label="Seuil de référence 0.8"),
    ]
    ax.legend(handles=legend, loc="upper right", bbox_to_anchor=(1.3, 1.1))

    save(fig, "fig6_radar_performance.png")


# ════════════════════════════════════════════════════════════
# FIG 7 — Distribution des prédictions vs réelles (classification)
# ════════════════════════════════════════════════════════════
def fig_prediction_distribution():
    print("\n[7] Distribution prédictions vs réelles")
    df = load_csv("model_a_classification_eval_predictions.csv")
    if df is None:
        return

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    fig.suptitle("Distribution des classes — Réel vs Prédit", fontweight="bold")

    order = ["Faible", "Moyen", "Fort"]
    colors_map = {"Faible": PALETTE[4], "Moyen": PALETTE[1], "Fort": PALETTE[0]}

    # ── Distribution réelle ──
    ax = axes[0]
    counts_true = df["y_true"].value_counts().reindex(order, fill_value=0)
    bars = ax.bar(order, counts_true.values,
                  color=[colors_map[c] for c in order], width=0.5)
    ax.set_title("Distribution réelle")
    ax.set_ylabel("Nombre d'observations")
    for bar, val in zip(bars, counts_true.values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                str(val), ha="center", fontweight="bold")

    # ── Distribution prédite ──
    ax = axes[1]
    counts_pred = df["y_pred"].value_counts().reindex(order, fill_value=0)
    bars = ax.bar(order, counts_pred.values,
                  color=[colors_map[c] for c in order], width=0.5, alpha=0.8)
    ax.set_title("Distribution prédite")
    ax.set_ylabel("Nombre d'observations")
    for bar, val in zip(bars, counts_pred.values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                str(val), ha="center", fontweight="bold")

    # Ligne référence
    for ax in axes:
        ax.axhline(53, color="gray", linestyle="--", linewidth=1, alpha=0.6,
                   label="Équilibre parfait (53)")
        ax.legend(fontsize=9)

    plt.tight_layout()
    save(fig, "fig7_prediction_distribution.png")


# ════════════════════════════════════════════════════════════
# FIG 8 — Score attractivité par secteur (données agrégées)
# ════════════════════════════════════════════════════════════
def fig_score_by_sector():
    print("\n[8] Score par secteur")
    # Lire depuis les prédictions de régression
    df = load_csv("model_a_regression_eval.csv")
    if df is None:
        return

    # On n'a pas sector_main ici — on lit le dataset final
    data_path = DATA_PATH
    if not data_path.exists():
        print("  dataset.csv introuvable — skip")
        return

    full_df = pd.read_csv(data_path)
    sector_stats = full_df.groupby("sector_main")["attractivity_score"].agg(
        ["mean", "std", "count"]
    ).sort_values("mean", ascending=True)

    fig, ax = plt.subplots(figsize=(10, 7))
    colors = [PALETTE[0] if v > sector_stats["mean"].median() else PALETTE[1]
              for v in sector_stats["mean"]]
    bars = ax.barh(sector_stats.index, sector_stats["mean"],
                   xerr=sector_stats["std"], color=colors, height=0.6,
                   capsize=4, error_kw={"linewidth": 1.5})
    ax.set_xlabel("Score d'attractivité moyen")
    ax.set_title("Score d'attractivité moyen par secteur\n(barres d'erreur = écart-type)",
                 fontweight="bold")
    ax.axvline(full_df["attractivity_score"].mean(), color=PALETTE[4],
               linestyle="--", linewidth=1.5,
               label=f"Moyenne globale = {full_df['attractivity_score'].mean():.1f}")
    for bar, (_, row) in zip(bars, sector_stats.iterrows()):
        ax.text(bar.get_width() + row["std"] + 0.5,
                bar.get_y() + bar.get_height()/2,
                f"{row['mean']:.1f} (n={int(row['count'])})",
                va="center", fontsize=9)
    ax.legend()
    plt.tight_layout()
    save(fig, "fig8_score_by_sector.png")


# ════════════════════════════════════════════════════════════
# FIG 9 — Score attractivité par ville
# ════════════════════════════════════════════════════════════
def fig_score_by_city():
    print("\n[9] Score par ville")
    data_path = DATA_PATH
    if not data_path.exists():
        return

    df = pd.read_csv(data_path)
    city_stats = df.groupby("city")["attractivity_score"].agg(
        ["mean", "std", "max", "count"]
    ).sort_values("mean", ascending=False)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("Attractivité économique par ville", fontweight="bold")

    # ── Score moyen ──
    ax = axes[0]
    colors = [PALETTE[0] if i == 0 else PALETTE[1] if i == 1 else "#AABCCC"
              for i in range(len(city_stats))]
    bars = ax.bar(city_stats.index, city_stats["mean"],
                  yerr=city_stats["std"], color=colors, width=0.6,
                  capsize=5, error_kw={"linewidth": 1.5})
    ax.set_title("Score moyen ± écart-type")
    ax.set_ylabel("Score attractivité")
    ax.set_ylim(0, 100)
    for bar, val in zip(bars, city_stats["mean"]):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                f"{val:.1f}", ha="center", fontsize=9, fontweight="bold")
    plt.setp(ax.get_xticklabels(), rotation=20, ha="right")

    # ── Score max ──
    ax = axes[1]
    bars = ax.bar(city_stats.index, city_stats["max"],
                  color=PALETTE[2], width=0.6, alpha=0.85)
    ax.set_title("Score maximum par ville")
    ax.set_ylabel("Score attractivité max")
    ax.set_ylim(0, 110)
    for bar, (city, row) in zip(bars, city_stats.iterrows()):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                f"{row['max']:.0f}", ha="center", fontsize=9, fontweight="bold")
    plt.setp(ax.get_xticklabels(), rotation=20, ha="right")

    plt.tight_layout()
    save(fig, "fig9_score_by_city.png")


# ════════════════════════════════════════════════════════════
# FIG 10 — Heatmap secteur × ville (score moyen)
# ════════════════════════════════════════════════════════════
def fig_heatmap_sector_city():
    print("\n[10] Heatmap secteur × ville")
    data_path = DATA_PATH
    if not data_path.exists():
        return

    df = pd.read_csv(data_path)
    pivot = df.pivot_table(values="attractivity_score",
                           index="sector_main", columns="city",
                           aggfunc="mean").round(1)

    fig, ax = plt.subplots(figsize=(12, 8))
    sns.heatmap(pivot, annot=True, fmt=".0f", cmap="YlOrRd",
                linewidths=0.5, ax=ax, cbar_kws={"label": "Score attractivité moyen"},
                vmin=20, vmax=100)
    ax.set_title("Score d'attractivité moyen — Secteur × Ville\n(lecture : plus foncé = plus attractif)",
                 fontweight="bold", pad=12)
    ax.set_xlabel("Ville", fontweight="bold")
    ax.set_ylabel("Secteur", fontweight="bold")
    plt.xticks(rotation=25, ha="right")
    plt.yticks(rotation=0)
    plt.tight_layout()
    save(fig, "fig10_heatmap_sector_city.png")


# ════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════
def main():
    print("=" * 55)
    print("GENERATION DES VISUALISATIONS — Rapport ML")
    print("=" * 55)
    print(f"Lecture depuis : {ARTIFACTS.absolute()}")
    print(f"Export vers    : {OUT_DIR.absolute()}\n")

    fig_model_a_summary()
    fig_confusion_matrix_a()
    fig_regression_diagnostics()
    fig_model_comparison_cv()
    fig_feature_importance()
    fig_radar_performance()
    fig_prediction_distribution()
    fig_score_by_sector()
    fig_score_by_city()
    fig_heatmap_sector_city()

    print("\n" + "=" * 55)
    print(f"DONE — {len(list(OUT_DIR.glob('*.png')))} figures dans {OUT_DIR}/")
    print("=" * 55)

    # Index des figures
    print("\nIndex des figures generees :")
    figures = {
        "fig1_model_a_summary.png"         : "Résumé métriques Modèle A (régression + classification)",
        "fig2_confusion_matrix_a.png"      : "Matrice de confusion — 3 classes",
        "fig3_regression_diagnostics.png"  : "y_true vs y_pred + distribution résidus",
        "fig4_model_comparison_cv.png"     : "Comparaison RF / XGBoost / LightGBM (CV)",
        "fig5_feature_importance.png"      : "Top 12 features importantes (SHAP / permutation)",
        "fig6_radar_performance.png"       : "Radar chart — profil de performance global",
        "fig7_prediction_distribution.png" : "Distribution réelle vs prédite par classe",
        "fig8_score_by_sector.png"         : "Score attractivité moyen par secteur",
        "fig9_score_by_city.png"           : "Score attractivité par ville (moyen + max)",
        "fig10_heatmap_sector_city.png"    : "Heatmap Secteur × Ville",
    }
    for fname, desc in figures.items():
        status = "OK" if (OUT_DIR / fname).exists() else "--"
        print(f"  [{status}] {fname:<42s} {desc}")


if __name__ == "__main__":
    main()
