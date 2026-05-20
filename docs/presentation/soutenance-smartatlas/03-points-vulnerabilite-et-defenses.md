# Partie 3 — 10 points de vulnérabilité à défendre (version approfondie)

Objectif de cette partie : te préparer aux critiques les plus dures du jury avec une réponse **technique, calme et crédible**, puis une ouverture vers l’amélioration.

| # | Choix contestable | Attaque probable du jury | Réponse courte (10–15 sec) | Défense technique (30–45 sec) | Preuve chiffrée à citer | Amélioration future à annoncer |
|---|---|---|---|---|---|---|
| 1 | Silhouette modérée (Spectral k=3) | « Vos clusters se chevauchent, c’est faible. » | La silhouette n’est pas l’unique critère en économie spatiale réelle. | Les zones économiques ont des frontières floues; j’optimise un compromis séparation + équilibre + exploitabilité supervisée. Le modèle retenu est celui qui reste interprétable et apprenable. | Silhouette 0.229 mais balance 0.963 + validité supervisée oui. | Stabilité par bootstrap + variation de k et du graphe de similarité. |
| 2 | Pondération objective \(\alpha=0.3,\beta=0.7\) | « Pondération arbitraire. » | Les poids reflètent l’objectif applicatif assumé : classes utiles à l’assignation. | Une pondération favorisant l’équilibre évite des clusters non exploitables en phase 2. Le choix est justifié par la performance aval et l’interprétabilité des profils. | RF test macro-F1 ≈ 0.955, accuracy ≈ 0.966. | Analyse de sensibilité complète et front de Pareto séparation/équilibre. |
| 3 | Seuil 10% min par cluster | « Vous forcez les classes. » | C’est un garde-fou de généralisabilité, pas une contrainte esthétique. | Sans taille minimale, on obtient des classes micro-fréquences qui sur-apprennent et se généralisent mal. Ce seuil protège la robustesse de la phase supervisée. | Seules les partitions “supervised-valid” sont retenues. | Tester 5%, 8%, 12% et publier l’impact sur macro-F1 et calibration. |
| 4 | Déduplication fuzzy seuil 0.92 | « Risque de fusion abusive. » | Le fuzzy vient après matching exact et avec seuil élevé. | Pipeline 2 passes : exact d’abord pour retirer les doublons évidents, puis Jaro-Winkler 0.92 pour variations orthographiques. Le seuil est conservateur pour limiter faux positifs. | 998k lignes brutes → ~98k entités uniques (≈90% duplication fonctionnelle traitée). | Audit manuel échantillonné + matrice précision/rappel du matching. |
| 5 | GPS imputés au centroïde (phase initiale) | « Biais spatial majeur. » | Biais identifié, isolé et corrigé explicitement. | Les entités imputées gonflaient une cellule artificielle. Correction: `coords_real`; densités calculées sur coordonnées réelles uniquement; imputées limitées aux stats qualitatives. | 4 684 entités imputées traitées + exclusion quantitative des densités. | Score de confiance géographique par entité + géocodage multi-fournisseurs renforcé. |
| 6 | Présence de “Other” sectoriel | « Taxonomie bruitée. » | “Other” a été réduit méthodiquement, sans surinterprétation. | 25 patterns regex appliqués pour remapping des entrées ambiguës. J’ai privilégié précision de catégorisation à une classification agressive non fiable. | Couverture de remapping “Other” ≈ 67.7%. | Taxonomie hiérarchique + classification NLP semi-supervisée des libellés. |
| 7 | Périmètre limité à Casablanca–Settat–El Jadida | « Généralisation nationale non prouvée. » | C’est une validation régionale robuste d’une méthode extensible. | Le PFA vise la preuve de concept scientifique + applicative sur un territoire dense et hétérogène. La généralisation externe est une étape de réplication, pas une hypothèse implicite. | 37 873 entités valides spatialement, 142 zones, 13 secteurs. | Réplication sur 2–3 régions contrastées puis consolidation nationale. |
| 8 | Lat/Lon en classification | « Le modèle mémorise la carte. » | Les coordonnées aident, mais ne dominent pas l’explication. | SHAP place les signaux économiques en tête (diversité sectorielle, capital). Les coordonnées apportent un gradient spatial résiduel, utile mais secondaire. | SHAP: `sector_diversity` 0.945 > `cell_lat` 0.355. | Tests d’ablation avec/sans spatial + validation hors-zone. |
| 9 | Choix Random Forest vs boosting | « Choix conservateur. » | J’ai choisi le meilleur compromis perf/robustesse/interprétabilité observé. | RF surperforme ici en macro-F1 et stabilité. Dans un projet décisionnel explicable, robustesse et maintenance comptent autant que le gain marginal de score. | RF CV 0.9587, test 0.9552 > XGBoost/LightGBM. | Tuning avancé boosters + calibration + interprétabilité comparative. |
| 10 | Macro-F1 faible en anomalie | « Votre mode anomalie est faible. » | Le score reflète surtout un déséquilibre extrême, pas une panne du modèle. | En 127:5:4, macro-F1 chute mécaniquement. Le mode anomalie sert au repérage d’outliers rares (alerting), pas à une classification équilibrée classique. | LightGBM anomalie: accuracy 0.964, macro-F1 0.660. | One-class, coût-sensible, rééchantillonnage et seuils métier d’alerte. |

---

## Cartes de défense prêtes à dire (format oral)

## Carte 1 — Si on t’attaque sur la qualité clustering
> « J’assume une silhouette modérée car je modélise une réalité économique continue. Le critère décisif est le compromis entre séparation, équilibre des classes et utilité prédictive aval. »

## Carte 2 — Si on t’attaque sur l’arbitraire des hyperparamètres
> « Les paramètres ne sont pas arbitraires, ils sont orientés objectif produit : obtenir des profils lisibles et assignables. La validation test confirme leur pertinence. »

## Carte 3 — Si on t’attaque sur la donnée bruitée
> « J’ai traité le bruit par étapes traçables : déduplication exacte + fuzzy, triple filtre géographique, et correction explicite du biais d’imputation GPS. »

## Carte 4 — Si on t’attaque sur l’explicabilité
> « Je ne me limite pas aux importances Gini; j’utilise SHAP pour des contributions locales et globales plus fidèles à la décision réelle du modèle. »

## Carte 5 — Si on t’attaque sur la généralisation
> « Le périmètre régional valide la méthode dans un environnement complexe. La généralisation nationale est une réplication planifiée, pas une promesse non démontrée. »

---

## Réponses “si le jury insiste” (niveau critique)

## 1) « Pourquoi pas un score unique directement ? »
> « Un score unique masque les mécanismes et injecte des choix normatifs en amont. Les profils d’abord, le scoring ensuite, c’est plus scientifique et plus explicable. »

## 2) « Pourquoi pas du deep learning ? »
> « Sur tabulaire de cette taille avec contrainte d’explicabilité métier, les ensembles d’arbres sont plus robustes, plus auditables et déjà très performants. »

## 3) « Vos résultats ne sont-ils pas dépendants de Casablanca ? »
> « Oui, c’est une limite assumée de validité externe. Le design méthodologique est transférable, la prochaine étape est la réplication inter-régions. »

---

## Erreurs à éviter pendant la défense

1. Dire « c’est comme ça » sans justification par objectif ou métrique.  
2. Sur-vendre la généralisation nationale sans protocole de réplication.  
3. Mélanger score post-hoc et variables d’entraînement (donne une impression de leakage).  
4. Défendre la silhouette seule comme preuve absolue.  
5. Ignorer les limites : le jury préfère une limite assumée qu’une certitude fragile.

---

## Formules de posture (à mémoriser)

### Formule 1 — Rigueur
> « J’ai privilégié des compromis méthodologiques explicités, mesurables et alignés avec l’usage final du modèle. »

### Formule 2 — Lucidité
> « Je distingue ce qui est validé empiriquement aujourd’hui et ce qui relève d’une extension planifiée. »

### Formule 3 — Crédibilité appliquée
> « La valeur du projet vient du triptyque performance, explicabilité et déployabilité décisionnelle. »
