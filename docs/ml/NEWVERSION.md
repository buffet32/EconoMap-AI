# NEW VERSION — améliorations livrées

## 1) Ce qui a été corrigé

### A. Suppression des caractères amazigh (Tifinagh) dans l’affichage final

Objectif demandé: garder uniquement **alphabet latin + arabe** dans les labels affichés.

Livré:
- Nettoyage centralisé backend via `sanitize_latin_arabic_text(...)`
- Nettoyage côté frontend avant rendu (`sanitizeDisplayText(...)`)
- Script dédié de nettoyage dataset: `G_entreprises/api/scripts/remove_tifinagh_labels.py`

Fichiers concernés:
- `G_entreprises/api/entreprise/services/text_cleaning.py`
- `G_entreprises/api/ml/schemas.py`
- `G_entreprises/api/entreprise/serializers_intelligence.py`
- `G_entreprises/api/entreprise/views_intelligence.py`
- `G_entreprises/src/utils/textSanitizer.js`
- `G_entreprises/src/components/AIFeatures.jsx`
- `G_entreprises/src/components/intelligence/ZoneInsightPanel.jsx`
- `G_entreprises/src/pages/IntelligencePlatform.jsx`
- `G_entreprises/src/components/intelligence/EconomicDashboard.jsx`

### B. Ergonomie frontend (contraste scores)

Problème: score violet trop sombre sur fond sombre.

Livré:
- Couleur score rendue plus claire (`#e9d5ff`)
- Ombre légère pour lisibilité
- Label score renforcé
- Carte suggestion légèrement éclaircie

Fichier:
- `G_entreprises/src/components/AIFeatures.css`

### C. “Secteur recommandé” devenu réellement dynamique

Problème: recommandation souvent identique au secteur sélectionné.

Livré:
- Nouvelle logique dans `EnterpriseMLService.predict_zone`:
  - pour la même cellule géographique (`cell_id`), on évalue **tous les secteurs disponibles**
  - on prédit le score d’attractivité pour chaque secteur avec le modèle de régression
  - on retient le secteur au score maximum
- fallback conservé vers l’ancien modèle sectoriel si besoin

Fichier:
- `G_entreprises/api/entreprise/services/ml_service.py`

---

## 2) Script demandé pour nettoyer le dataset

Script:
`G_entreprises/api/scripts/remove_tifinagh_labels.py`

Exemples:

```bash
cd G_entreprises/api
.\.venv\Scripts\python.exe scripts\remove_tifinagh_labels.py
```

Écraser le fichier source:

```bash
.\.venv\Scripts\python.exe scripts\remove_tifinagh_labels.py --in-place
```

Colonnes ciblées par défaut:
- `city, zone_name, district, region_name, display_name`

Si vous nettoyez le CSV en production, rechargez ensuite les données via `import_economic_data` pour persister le nettoyage en base.

---

## 3) Comment “l’intelligence” fonctionne dans l’application

## 3.1 Pipeline global (runtime)

1. Le frontend appelle l’API (`/api/predict/`, `/api/recommendations/`, `/api/dashboard/`, `/api/insights/...`).
2. Le backend Django charge les modèles entraînés (`artifacts/*.pkl`) via `joblib`.
3. Les features sont préparées (normalisation/encodage via `ColumnTransformer` dans les pipelines sklearn).
4. Le backend renvoie:
   - score d’attractivité
   - classe d’attractivité
   - secteur recommandé
   - explications (SHAP ou importances arbres)

## 3.2 Les modèles utilisés

### Modèle A (coeur principal)
- **Régression**: prédit `attractivity_score`
- **Classification**: prédit `attractivity_class`
- Entraînement comparatif: RandomForest / XGBoost / LightGBM (CV), meilleur modèle conservé
- Script: `train_model_a.py`

### Modèle B (sectoriel)
- **Classification multi-classe**: prédit `sector_main`
- Script: `train_model_b.py`
- Dans la version actuelle, la recommandation live privilégie désormais le ranking par score (plus robuste métier pour la décision zone/secteur).

## 3.3 Feature engineering

Fichiers clés: `features.py`, `preprocessing.py`

Features économiques de base:
- densité, activité, capital, diversité sectorielle, formalisation, formes juridiques, etc.

Features dérivées:
- `vitality = density_log * active_rate`
- `weighted_capital = capital_median * active_rate`
- `gps_quality = entity_count_real / entity_count_total`
- agrégats ville (`city_avg_*`, `city_n_sectors`)
- positions relatives (`rel_density`, `rel_capital`)

## 3.4 Explicabilité

Fichier: `G_entreprises/api/ml/explainability.py`

- Si `shap` est disponible: explication locale top features pour la prédiction
- Sinon: fallback automatique vers `feature_importances_` des modèles arbres
- L’API renvoie des parts relatives (`share`) pour expliquer l’influence des variables

## 3.5 Anti-leakage (point jury important)

Dans la préparation:
- pour classifier l’attractivité, on n’utilise pas la cible score comme feature
- pour la régression, on n’utilise pas la classe cible
- split stratifié sur les tâches de classification

---

## 4) Ce que vous pouvez expliquer au jury (réponses courtes prêtes)

1. **Pourquoi deux modèles principaux ?**  
   Parce qu’on veut à la fois une valeur continue (score) et une lecture catégorielle (classe) pour la décision métier.

2. **Pourquoi un pipeline sklearn et pas un modèle “brut” ?**  
   Pour figer preprocessing + modèle dans le même artifact, éviter les écarts train/inférence.

3. **Comment la recommandation secteur est faite maintenant ?**  
   On simule tous les secteurs sur la même cellule et on classe par score prédit, puis on choisit le meilleur.

4. **Comment vous justifiez la recommandation ?**  
   Par les explications SHAP/importances renvoyées dans `explanations`.

5. **Pourquoi la recommandation n’est plus statique ?**  
   Parce qu’elle dépend désormais d’un ranking multi-secteurs par cellule, pas seulement d’une classe directe unique.

6. **Comment vous gérez la qualité d’affichage multilingue ?**  
   Nettoyage backend + frontend + script dataset pour ne garder que latin/arabe.

7. **Comment éviter que l’UI trompe l’utilisateur ?**  
   Contraste amélioré sur les scores et labels critiques.

8. **Où sont les modèles en production ?**  
   Dans `artifacts/` et chargés à la demande par l’API Django.

9. **Comment mesurer la confiance ?**  
   Pour la classification via `predict_proba`; pour la recommandation dynamique via marge relative entre top secteurs.

10. **Limite actuelle à assumer ?**  
    Dépendance à la qualité et couverture des données de cellules économiques.

---

## 5) Résumé des validations effectuées sur cette version

- Build frontend OK (`npm run build`)
- Backend Django OK (`manage.py test`, `0` test mais checks Django valides)
- Compilation Python des fichiers modifiés OK

