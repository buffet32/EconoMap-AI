# Partie 4 — Lexique technique à maîtriser à l’oral

## A

### **Accuracy**
Part de prédictions correctes sur l’ensemble des observations. Peut être trompeuse en cas de classes déséquilibrées.

### **Agglomerative Clustering**
Méthode hiérarchique qui fusionne progressivement les points/cluster les plus proches selon un critère (Ward, average, complete).

### **Apprentissage non supervisé**
Apprentissage sans variable cible; l’algorithme découvre des structures latentes (ex: clusters).

### **Apprentissage supervisé**
Apprentissage avec une cible connue; le modèle apprend une fonction de prédiction (ex: classe de profil).

---

## B

### **Balance score entropique**
Mesure d’équilibre de taille entre clusters. Plus il est élevé, plus la répartition des classes est homogène.

### **Bounding box géographique**
Rectangle de coordonnées (min/max lat/lon) utilisé pour filtrer les points d’une zone géographique.

---

## C

### **Centroïde**
Point moyen représentant une zone; utilisé en imputation géographique mais potentiellement biaisant s’il est surutilisé.

### **Cluster**
Groupe d’observations similaires selon un espace de features.

### **Clustering**
Processus de partitionnement non supervisé des données en groupes homogènes.

### **Confusion matrix**
Tableau croisant classes réelles et prédites, utile pour analyser les erreurs par classe.

### **Cross-validation (CV)**
Évaluation robuste qui répète entraînement/test sur plusieurs sous-échantillons (folds).

---

## D

### **DBSCAN**
Algorithme de clustering par densité, capable de détecter du bruit/outliers via \(\varepsilon\) et `min_samples`.

### **Déduplication exacte**
Suppression des doublons strictement identiques sur un ensemble de clés.

### **Déduplication approximative (fuzzy matching)**
Détection de doublons “presque identiques” via une mesure de similarité textuelle.

### **Densité spatiale**
Concentration d’entités sur une surface donnée (ici, cellule de grille).

### **Distribution asymétrique**
Distribution avec queue longue; typique des montants de capital et densités économiques.

---

## E

### **Entropy (entropie)**
Mesure d’incertitude ou de dispersion d’une distribution. Utilisée ici pour juger l’équilibre des clusters.

### **Explainability / Explicabilité**
Capacité à expliquer pourquoi un modèle prédit une classe/score donné.

---

## F

### **Feature engineering**
Création et transformation de variables pertinentes à partir des données brutes.

### **Formal ratio**
Indicateur du degré de formalisation (ex. proportion SARL/SA dans les entités d’une zone).

---

## G

### **Gini importance**
Importance de variable basée sur la réduction d’impureté dans les arbres; peut être biaisée vers variables souvent splittées.

### **GMM (Gaussian Mixture Model)**
Modèle probabiliste supposant que les données proviennent d’un mélange de distributions gaussiennes.

---

## H

### **Heatmap**
Carte de densité visuelle où l’intensité couleur représente la concentration/valeur.

---

## I

### **Imputation**
Remplacement d’une valeur manquante par une estimation (ex: centroïde de ville).

### **Indice de Shannon (sector_diversity)**
Mesure de diversité: plus l’activité est répartie entre secteurs, plus l’indice est élevé.

### **Inférence**
Prédiction produite par un modèle déjà entraîné.

### **Interprétabilité**
Niveau de compréhension humaine de la logique d’un modèle et de ses sorties.

---

## J

### **Jaro-Winkler**
Métrique de similarité de chaînes, utile pour comparer des noms proches avec fautes/variantes.

---

## K

### **K-Means**
Algorithme qui partitionne les données en \(k\) clusters en minimisant la distance intra-cluster aux centroïdes.

### **K-fold stratifié**
CV où chaque fold conserve approximativement la distribution des classes.

---

## L

### **Leakage (fuite de cible)**
Situation où des informations dérivées de la cible entrent dans les features d’entraînement, gonflant artificiellement les performances.

### **LightGBM / XGBoost**
Bibliothèques de gradient boosting sur arbres, performantes sur données tabulaires.

### **Log-transform**
Transformation logarithmique qui compresse les grandes valeurs et stabilise la variance.

---

## M

### **Macro-F1**
Moyenne simple des F1-score par classe; valorise l’équité entre classes, surtout en déséquilibre.

### **Mean \|SHAP\|**
Moyenne de la valeur absolue SHAP d’une variable; mesure son influence globale.

### **Min_samples**
Paramètre DBSCAN : nombre minimal de voisins pour qu’un point soit “dense”.

---

## N

### **Normalisation**
Standardisation/harmonisation des formats et libellés pour rendre les données comparables.

---

## O

### **Overfitting**
Modèle trop ajusté à l’entraînement, qui généralise mal sur de nouvelles données.

---

## P

### **Post-hoc validation**
Validation a posteriori d’une structure découverte, sans l’avoir utilisée pour entraîner le modèle.

### **Précision (Precision)**
Parmi les prédictions positives d’une classe, proportion réellement correcte.

### **Prétraitement**
Ensemble des opérations de nettoyage, filtrage, enrichissement et transformation avant modélisation.

---

## R

### **Random Forest**
Ensemble d’arbres entraînés sur sous-échantillons et sous-espaces de variables; robuste et performant sur données tabulaires.

### **Rappel (Recall)**
Parmi les vrais éléments d’une classe, proportion correctement détectée.

### **Regex (expression régulière)**
Motif textuel permettant de détecter/transformer des chaînes selon des règles formelles.

---

## S

### **Score synthétique**
Indice composite agrégé à partir de plusieurs variables; utile en reporting mais risqué comme cible d’entraînement.

### **SHAP (SHapley Additive exPlanations)**
Méthode d’explication attribuant à chaque feature une contribution additive à la prédiction locale.

### **Silhouette coefficient**
Mesure de qualité de clustering basée sur compacité intra-cluster et séparation inter-cluster (de -1 à 1).

### **Spectral Clustering**
Clustering basé sur un graphe de similarité et la décomposition spectrale du Laplacien, efficace pour structures non linéaires.

### **Stabilité modèle**
Capacité à conserver des performances et comportements cohérents selon différents échantillons/splits.

---

## T

### **Triple filtre géographique**
Contrôle combiné des coordonnées, du nom de ville et du code région pour sécuriser l’appartenance spatiale.

---

## V

### **Vitality (feature d’interaction)**
Variable combinant densité et activité (`density_log × active_rate`) pour capturer un dynamisme économique plus riche.

