# Partie 1 — Maîtrise du projet (version jury)

## A. Version **5 minutes** (pitch clair et percutant)

### 1) Problème
Au Maroc, les indicateurs économiques classiques (PIB régional, emploi régional) sont trop agrégés. Ils masquent les écarts entre zones d’une même région.  
**SmartAtlas** répond à ce manque en construisant des **profils économiques infra-régionaux** à partir de données d’entreprises, sans imposer un score cible artificiel.

### 2) Approche scientifique
J’ai formulé une question simple :  
**Peut-on découvrir des profils spatiaux interprétables, stables et généralisables à partir des données brutes, sans score synthétique d’entraînement ?**

Pour y répondre, j’ai utilisé une pipeline en 4 étapes :
1. **Préparation de données multi-sources** (Charika + Pages Jaunes), déduplication et filtrage géographique strict.
2. **Clustering non supervisé** multi-algorithmes, sélectionné par fonction objectif équilibrant séparation et exploitabilité.
3. **Classification supervisée** pour assigner rapidement un profil à de nouvelles zones.
4. **Explainabilité SHAP** pour justifier chaque décision modèle.

### 3) Données et fiabilisation
- 998k lignes brutes Charika → ~98k entités uniques (déduplication exacte + Jaro-Winkler).
- Intégration de 26k établissements Pages Jaunes avec remapping sectoriel.
- Zone d’étude : Casablanca–Settat–El Jadida via triple filtre (GPS, ville normalisée, code région).
- Problème critique traité : coordonnées manquantes imputées au centroïde biaisant les densités.  
  **Solution** : `coords_real` pour séparer usages quantitatifs (densité) et qualitatifs.

### 4) Résultats principaux
- Clustering retenu : **Spectral Clustering k=3**, balance 0.963, silhouette 0.229 (acceptable en données économiques chevauchantes).
- 3 profils cohérents :
  - Écosystèmes sous-développés
  - Zones émergentes actives
  - Hubs capitalisés à forte densité
- Validation post-hoc : progression monotone du score externe (35 → 53 → 61), sans fuite de cible.
- Classifieur final : **Random Forest** (Macro-F1 test ≈ 0.955, Accuracy ≈ 0.966).
- SHAP : facteur dominant = **diversité sectorielle**, puis capital moyen et latitude.

### 5) Impact applicatif
SmartAtlas transforme une recherche ML en **outil opérationnel** :
- cartographie interactive,
- scoring explicable en temps réel,
- recommandation de zones par secteur,
- aide à la décision pour investisseurs, institutions et porteurs de projet.

### 6) Phrase de clôture (à dire au jury)
> « Ma contribution est d’avoir construit une méthode robuste et explicable pour révéler des profils économiques locaux sans score cible imposé, puis de l’avoir industrialisée dans une application décisionnelle utilisable. »

---

## B. Version **15 minutes** (narratif complet)

## 1) Contexte et motivation (2 min)
- Les politiques publiques et décisions privées ont besoin d’une lecture **fine-grained** du territoire.
- Les agrégats régionaux sont utiles mais insuffisants pour localiser les opportunités.
- Objectif de SmartAtlas : passer d’une logique “moyenne régionale” à une logique “profil économique de zone”.

## 2) Question scientifique et hypothèse (1 min)
- Question : découverte de profils spatiaux interprétables/stables/généralisables à partir de données brutes.
- Hypothèse : la structure latente des zones peut être apprise en non supervisé, puis transférée vers un classifieur explicable.

## 3) Données et qualité (3 min)
### Sources
- Charika (registre formel), Pages Jaunes (activité commerciale locale).

### Nettoyage et harmonisation
- Déduplication 2 passes : exacte + approximative (Jaro-Winkler 0.92).
- Normalisation des villes, secteurs et formats.
- Regex mapping sectoriel pour réduire “Other”.

### Contrôle géographique
- Triple filtre : bounding box + ville normalisée + code région.
- Élimination des hors-périmètre pour éviter contamination spatiale.

### Biais coordonnés manquants (point fort à expliquer)
- Imputer au centroïde créait une fausse cellule dominante.
- Traitement méthodologique : `coords_real` et séparation des contributions.
- Résultat : suppression d’un biais structurel majeur.

## 4) Construction des variables (2 min)
- 12 features économiques (densité, activité, capital, diversité, formalisation, sectorisation).
- 3 interactions (vitality, weighted_capital, gps_quality).
- Choix clé : **aucun score synthétique d’attractivité** en entrée modèle.
- Le score externe sert uniquement à valider la cohérence économique après découverte.

## 5) Méthode ML (3 min)
### Découverte (non supervisée)
- 7 familles testées (K-Means, GMM, Agglomerative, Spectral, DBSCAN).
- Fonction objectif :  
  \[
  O = \alpha \cdot S + \beta \cdot B \cdot \mathbf{1}[\text{supervised-valid}]
  \]
  avec \(\alpha=0.3\), \(\beta=0.7\).
- Justification : prioriser des clusters équilibrés et exploitables.

### Assignation (supervisée)
- 3 modèles comparés via CV stratifiée macro-F1.
- Random Forest retenu pour robustesse, performance et interprétabilité pratique.

### Explicabilité
- SHAP pour importance globale et locale, plus fiable que Gini seul.

## 6) Résultats et lecture métier (2 min)
- 3 profils économiquement lisibles et actionnables.
- Progression monotone du score externe (validation sans leakage).
- Variable clé : diversité sectorielle > capital moyen > composante spatiale.
- Message : la performance n’est pas due à la géographie brute, mais à la structure économique.

## 7) Déploiement SmartAtlas (1.5 min)
- Carte interactive + tableau de bord + prédiction par zone + recommandations sectorielles.
- IA explicable intégrée dans l’interface utilisateur.
- Valeur : passer de la data brute à une décision territoriale argumentée.

## 8) Limites et perspectives (0.5 min)
- Couverture géographique partielle (une macro-région).
- Dépendance à la qualité des sources web.
- Extensions : séries temporelles, données de mobilité/prix foncier, validation externe institutionnelle.

---

## C. Points à **ne jamais oublier** devant le jury

1. **Originalité scientifique** : non supervisé d’abord, score externe seulement en post-hoc.  
2. **Qualité des données** : déduplication rigoureuse + gestion explicite des coordonnées imputées.  
3. **Critère de sélection justifié** : équilibre des clusters priorisé pour usage réel.  
4. **Résultat lisible** : 3 profils interprétables, pas juste des “labels techniques”.  
5. **Performance robuste** : Macro-F1 élevée sur test.  
6. **Explicabilité sérieuse** : SHAP utilisé pour éviter les biais d’importance Gini.  
7. **Impact concret** : application opérationnelle, pas seulement un notebook de recherche.  
8. **Lucidité** : limites reconnues + plan clair d’amélioration.

