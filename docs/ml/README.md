# Projet ML — Attractivite Economique des Zones (Version Finale)

Auteur: Souhaib MADHOUR - EMSI Marrakech - 2026

> Note structure: les scripts ML sont dans `scripts/` et les données/modèles dans `model/`.
> Toute référence à `artifacts/` correspond à `model/artifacts/`, et le dataset principal est `model/dataset.csv`.
> Les commandes ci-dessous se lancent donc avec `python scripts/...` depuis la racine du repo.

Ce README est la version de cloture du projet. Il documente explicitement la direction complete, du jour 0 jusqu'au dernier etat (repositionnement scientifique inclus).

## 1) Direction du projet: de Day 0 a la version finale

### Phase 0 - Cadrage initial
- Problematique: absence d'indice officiel standardise d'attractivite economique infra-regionale au Maroc.
- Vision initiale: prediction d'un score d'attractivite (0-100), avec validation explicative (SHAP) et usage applicatif.
- Contrainte forte: stack classique CPU-only (Python + scikit-learn + XGBoost/LightGBM), sans cloud ni deep learning.

### Phase 1 - Collecte et realite terrain
- Sources d'entreprises et d'hebergement heterogenes.
- Forte duplication fonctionnelle cote entreprises.
- Incompatibilites de schemas et nettoyage lourd (deduplication, harmonisation, normalisation).
- Bug critique de fusion de colonnes corrige et trace.

### Phase 2 - Pivot de scope geographique
- Reduction pragmatique du perimetre vers Casablanca-Settat-El Jadida pour assurer qualite des donnees et validite statistique.
- Filtrage geographique strict pour retirer les entites hors region.

### Phase 3 - Invention de l'unite d'observation
- Passage de l'entite individuelle a la cellule geo.
- Grille 1.5 km x 1.5 km retenue comme compromis resolution/stabilite.
- Correction majeure: gestion des coordonnees imputees pour eviter une cellule artificiellement dominante.

### Phase 4 - Construction de la cible composite (version historique)
- Score composite pondere (densite, activite, capital, diversite sectorielle, formalisation).
- Resultats predictifs eleves sur la version supervisee historique (R2 et F1 tres hauts).
- Limite epistemique identifiee: risque de circularite lorsque la cible est construite a partir des memes signaux.

### Phase 5 - Repositionnement scientifique (etat final)
- Le projet est reframed vers:
  - decouverte de structures economiques spatiales par clustering non supervise,
  - puis prediction des profils decouverts (et non du score composite).
- `attractivity_score` est conserve uniquement pour validation descriptive post-hoc.
- Ce repositionnement est le dernier etat officiel du projet.

## 2) Question scientifique finale

Comment decouvrir et expliquer des profils economiques de zones geographiques, puis assigner de nouvelles zones a ces profils de facon robuste, interpretable et reproductible?

## 3) Architecture finale (code courant)

Scripts principaux:
- `cluster_zones.py`: aggregation zone-level, clustering multi-strategie (`typology` / `anomaly`), selection de la partition.
- `analyze_clusters.py`: interpretation economique des clusters (profils, secteurs dominants, distribution par ville).
- `train_cluster_classifier.py`: classification supervisee des labels de cluster decouverts.
- `visualize_results.py`: cartes et heatmaps exportees pour rapport.
- `run_all.py`: orchestration de bout en bout.

Fichiers support:
- `config.py`: chemins, constantes, parametres de split.
- `utils.py`: logging UTF-8, persistance artifacts.

## 4) Pipeline final recommande

Mode principal (typology):
```bash
python cluster_zones.py typology
python analyze_clusters.py typology
python train_cluster_classifier.py typology
python visualize_results.py typology
```

Mode secondaire (anomaly):
```bash
python cluster_zones.py anomaly
python analyze_clusters.py anomaly
python train_cluster_classifier.py anomaly
python visualize_results.py anomaly
```

Ou execution complete:
```bash
python run_all.py both
```

## 5) Resultats de reference (etat final)

Les resultats finaux consolides sont documentes dans:
- `RESULTS_AND_EXPLICABILITY_REPORT.md`
- `SCIENTIFIC_REPOSITIONING_REPORT.md`

En synthese:
- Le mode `typology` est la narration principale (clusters plus equilibres, macro-F1 forte).
- Le mode `anomaly` est complementaire (poches atypiques / outliers).
- L'explicabilite globale est fournie via importances (et SHAP quand disponible).

## 6) Validite methodologique et anti-leakage

Controles appliques dans la version finale:
- `attractivity_score` exclu des features de clustering.
- `attractivity_score` et `attractivity_class` exclus des features du classifieur de clusters.
- La cible supervisee finale est `cluster_label` (profil latent decouvert), pas un score synthetique.
- Separation claire des roles: non supervise pour decouverte, supervise pour assignation.

## 7) Livrables de cloture ajoutes

Pour finaliser completement le projet, les documents suivants ont ete ajoutes:
- `TEST_PLAN.md`: plan de tests unitaire/integration/reproductibilite.
- `VARIABLE_DICTIONARY.md`: dictionnaire complet des variables.
- `API_SPECIFICATION.md`: specification d'API metier (FastAPI) pour industrialisation.

## 8) Limites connues (a assumer en soutenance)

- Scope regional: validation surtout sur Casablanca-Settat-El Jadida.
- Taille de donnees moderee: necessite extension multi-regions pour generalisation nationale.
- Sensibilite du clustering aux hyperparametres et a la representation des features.
- Validation qualitative metier a renforcer avec cas zones de reference.

## 9) Comment lancer rapidement

Prerequis (minimal):
```bash
pip install pandas numpy scikit-learn matplotlib seaborn joblib
```

Optionnel selon environnement:
```bash
pip install xgboost lightgbm shap geopandas contextily
```

Puis:
```bash
python run_all.py typology
```

## 10) Conclusion finale

Le projet a bien converge: il est passe d'une intuition large et d'un score composite operationnel a un cadre scientifiquement plus defendable centre sur la decouverte de profils economiques spatiaux. La version finale est techniquement executable, documentee, explicable et prete pour soutenance avec une narration claire "probleme reel -> donnees imparfaites -> corrections critiques -> repositionnement valide -> livrables reproductibles".
