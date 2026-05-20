# Partie 2 — Questions jury probables (40+) + réponses modèles

## A. Conceptuelles / problématique

### 1) Pourquoi ce sujet est-il important ?
Parce que les agrégats régionaux cachent des écarts locaux majeurs. SmartAtlas apporte une lecture infra-régionale utile pour des décisions d’implantation plus précises.

### 2) Quelle est votre contribution scientifique principale ?
J’ai proposé une stratégie **non supervisée puis supervisée** qui découvre des profils économiques sans imposer de score cible, puis les rend prédictibles et explicables.

### 3) Pourquoi ne pas avoir prédit directement un score d’attractivité ?
Un score construit à la main introduit des biais normatifs et du circular reasoning. J’ai préféré découvrir la structure latente des données, puis valider post-hoc sa cohérence.

### 4) Quelle est l’hypothèse centrale ?
Qu’il existe des profils spatiaux stables détectables à partir de signaux économiques bruts, indépendamment d’un label synthétique imposé.

### 5) Qu’entendez-vous par “interprétable” ?
Chaque cluster correspond à un comportement économique lisible (densité, activité, capital, diversité sectorielle), pas seulement à une séparation mathématique.

### 6) En quoi SmartAtlas se distingue d’un simple dashboard BI ?
Le dashboard visualise, SmartAtlas **apprend** des profils, les **prédit** sur de nouvelles zones, et justifie les décisions via SHAP.

---

## B. Données et preprocessing

### 7) Pourquoi 2 sources (Charika + Pages Jaunes) ?
Charika couvre le formel administratif, Pages Jaunes enrichit l’activité terrain. Leur fusion améliore la représentativité économique locale.

### 8) Comment avez-vous traité la duplication massive ?
Deux passes : matching exact puis matching approximatif Jaro-Winkler à 0.92. Cela réduit le bruit sans supprimer agressivement des entités distinctes.

### 9) Pourquoi un seuil Jaro-Winkler à 0.92 ?
C’est un compromis précision/rappel adapté aux variations orthographiques fréquentes dans les raisons sociales. En dessous, le risque de faux positifs augmente.

### 10) Comment garantissez-vous la cohérence géographique ?
Par triple contrainte indépendante : coordonnées dans bounding box, ville normalisée conforme, et code région valide.

### 11) Pourquoi conserver des entités sans GPS ?
Elles gardent une valeur économique qualitative (activité, statut, secteur). Je les exclue seulement des métriques de densité via `coords_real`.

### 12) Pourquoi une grille de 1.5 km × 1.5 km ?
Elle équilibre résolution locale et stabilité statistique. Plus fin = bruit/sparsité, plus large = perte de granularité.

### 13) Pourquoi un minimum de 3 entités réelles par cellule ?
Pour éviter des cellules quasi vides qui produisent des profils artificiels instables.

### 14) Pourquoi transformer la densité en log ?
La distribution est très asymétrique. La transformation log réduit l’influence des extrêmes et stabilise le clustering.

### 15) Pourquoi un remapping sectoriel par regex ?
Pour diminuer la classe “Other” et restaurer du signal métier exploitable dans les features de diversité sectorielle.

### 16) Qu’est-ce qui vous assure qu’il n’y a pas de fuite de cible ?
Le score d’attractivité synthétique est exclu de tous les inputs d’entraînement; il n’intervient qu’en validation post-hoc.

---

## C. Choix méthodologiques ML

### 17) Pourquoi évaluer plusieurs familles de clustering ?
Parce que chaque famille encode une hypothèse différente de structure (sphérique, gaussienne, hiérarchique, graphe, densité). Je voulais une sélection robuste.

### 18) Pourquoi Spectral Clustering au final ?
Il donne le meilleur compromis selon l’objectif global : excellente balance des clusters et validité supervisée, avec une séparation géométrique acceptable.

### 19) Pourquoi accepter une silhouette modérée (0.229) ?
Les données économiques réelles sont chevauchantes. Une silhouette extrême est rare; l’important ici est l’utilité économique + stabilité + équilibrage.

### 20) Pourquoi la balance pèse plus que la silhouette (β > α) ?
Le but n’est pas seulement de séparer, mais d’obtenir des classes suffisamment équilibrées pour être apprenables et utiles opérationnellement.

### 21) Pourquoi imposer 10% minimum par cluster ?
Pour éviter des classes microscopiques non généralisables qui dégradent la phase supervisée et la robustesse en production.

### 22) Pourquoi Random Forest au lieu de XGBoost/LightGBM ?
Dans ce setup, Random Forest donne la meilleure macro-F1 test et une robustesse élevée avec moins de sensibilité au tuning fin.

### 23) Pourquoi macro-F1 comme métrique principale ?
Elle traite toutes les classes équitablement, même si elles sont déséquilibrées, contrairement à l’accuracy seule.

### 24) Pourquoi une validation croisée stratifiée ?
Pour conserver la distribution des classes à chaque fold et éviter des évaluations optimistes ou instables.

### 25) Pourquoi inclure lat/lon en supervision ?
Pour capturer un effet spatial résiduel utile à la prédiction, tout en vérifiant via SHAP que la structure économique reste dominante.

---

## D. Résultats et interprétation

### 26) Comment prouvez-vous la cohérence économique des clusters ?
Par le profil moyen des features (densité, activité, capital, diversité) et la progression monotone du score externe non utilisé à l’entraînement.

### 27) Que signifie “progression monotone 35→53→61” ?
Que les clusters ordonnés par caractéristiques économiques internes suivent aussi un ordre d’attractivité externe, sans fuite de cible.

### 28) Pourquoi SHAP et pas seulement les importances Gini ?
Gini peut biaiser l’importance des variables fréquemment splittées. SHAP fournit des contributions locales et globales plus fidèles.

### 29) Comment expliquez-vous la place importante de `cell_lat` ?
Elle capte un gradient spatial réel, mais elle ne domine pas le modèle; la diversité sectorielle et le capital restent plus explicatifs.

### 30) Votre modèle est-il stable ?
Oui, la performance CV et test est cohérente, et les profils restent interprétables sur différentes zones de l’échantillon.

### 31) Pourquoi le mode anomalie a un macro-F1 faible ?
Le déséquilibre est extrême (classe bruit très minoritaire). L’accuracy reste élevée; le macro-F1 reflète surtout la difficulté structurelle.

---

## E. Application et déploiement

### 32) Quelle est la valeur pratique immédiate de SmartAtlas ?
Recommander des zones par secteur avec justification explicable, utile pour implantation commerciale et ciblage territorial.

### 33) Comment un décideur utilise concrètement l’outil ?
Il choisit une ville/secteur, consulte le score de zone, les facteurs SHAP, puis compare plusieurs zones avant décision.

### 34) En quoi l’explicabilité est utile métier ?
Elle transforme une prédiction “boîte noire” en argument décisionnel auditable : on sait pourquoi une zone est recommandée.

### 35) Comment exposer le modèle en production ?
Via une API REST qui reçoit les features zone et renvoie classe, score, confiance et explication SHAP.

### 36) Quels risques en production ?
Dérive des données sources, qualité de géocodage, évolution des secteurs; d’où besoin de monitoring et recalibrage périodique.

---

## F. Limitations et perspectives

### 37) Quelle est la limite la plus forte de votre étude ?
La couverture géographique partielle (une macro-région). La généralisation nationale doit être validée sur d’autres régions.

### 38) Que manque-t-il pour un index “institutionnel” national ?
Des données additionnelles (foncier, mobilité, démographie fine, fiscalité locale) et une validation croisée avec des acteurs publics.

### 39) Votre approche gère-t-elle la temporalité ?
Pas encore au niveau complet. La prochaine étape est un suivi longitudinal pour détecter transitions et dynamiques de zones.

### 40) Peut-on transférer la méthode à d’autres pays ?
Oui, la méthode est transférable si on reconstruit les mappings sectoriels et la normalisation locale des sources.

### 41) Quelle amélioration prioritaire recommandez-vous ?
Ajouter une dimension temporelle trimestrielle pour passer d’une photo statique à une prévision d’évolution des profils.

---

## G. Questions pièges / défenses critiques

### 42) “Votre silhouette est faible, donc vos clusters sont mauvais.”
Ce serait vrai en données bien séparées. Ici, l’économie territoriale est naturellement chevauchante; la validité se juge aussi sur équilibre, interprétabilité et utilité prédictive.

### 43) “Vous avez favorisé l’équilibre, donc vous avez forcé le résultat.”
J’ai optimisé pour l’usage réel : classes apprenables et actionnables. La cohérence externe et la performance test confirment que ce n’est pas un artefact.

### 44) “Le score post-hoc valide vos clusters parce qu’il leur ressemble.”
Le score n’a jamais été utilisé pour apprendre les clusters. La convergence observée constitue justement une validation indépendante.

### 45) “Pourquoi pas du deep learning ?”
Le volume tabulaire et l’exigence d’explicabilité rendent les méthodes classiques plus appropriées, performantes et auditablement défendables.

### 46) “Vos données web ne sont pas fiables.”
J’ai traité ce risque par déduplication stricte, filtres géographiques multiples, et règles explicites de qualité des coordonnées.

### 47) “Votre modèle apprend surtout la géographie.”
SHAP montre que les variables économiques dominent; les coordonnées apportent un signal complémentaire, pas principal.

### 48) “DBSCAN échoue, donc votre pipeline est fragile.”
Le mode anomalie traite un problème différent avec fort déséquilibre. La pipeline principale reste robuste et validée sur la tâche cible.

### 49) “Vous auriez dû créer un score unique final.”
Un score unique simplifie mais masque les mécanismes. Les profils permettent une lecture plus riche, puis un score peut être ajouté en couche décisionnelle.

### 50) “Ce n’est qu’un exercice académique.”
Le projet livre une application opérationnelle exploitable, avec API, carte interactive, recommandation et explicabilité utilisables en contexte réel.

### 51) “Votre seuil de 3 entités réelles est arbitraire.”
C’est un seuil de robustesse pour limiter le bruit des cellules quasi vides. Il est transparent, documenté et ajustable en analyse de sensibilité.

### 52) “Pourquoi ne pas avoir inclus l’informel non enregistré ?”
La disponibilité fiable est limitée. J’ai privilégié des sources vérifiables; l’informel est une piste d’extension future via proxys externes.

