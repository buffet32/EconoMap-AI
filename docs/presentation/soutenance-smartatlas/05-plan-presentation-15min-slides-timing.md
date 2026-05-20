# Partie 5 — Plan de présentation (15 minutes)

## Structure globale

| Segment | Durée | Objectif |
|---|---:|---|
| 1. Contexte & problème | 1 min 30 | Créer l’urgence et la pertinence |
| 2. Question scientifique & hypothèse | 1 min | Positionner la contribution |
| 3. Données & qualité | 3 min | Montrer la rigueur méthodologique |
| 4. Pipeline ML | 3 min 30 | Expliquer les choix techniques |
| 5. Résultats & interprétation | 2 min 30 | Prouver la validité scientifique |
| 6. Démo SmartAtlas (captures) | 2 min | Montrer l’impact opérationnel |
| 7. Limites & perspectives | 1 min | Montrer lucidité et vision |
| 8. Conclusion | 30 sec | Laisser un message fort |

---

## Détail slide par slide

## **Slide 1 — Titre & promesse (30 sec)**
**Message clé :** “SmartAtlas révèle des profils économiques locaux explicables, au-delà des moyennes régionales.”  
À afficher :
- Titre du PFA
- Question centrale
- 1 phrase d’impact

## **Slide 2 — Problématique (1 min)**
**Message clé :** Les statistiques régionales masquent l’hétérogénéité intra-régionale.  
À afficher :
- Schéma “agrégé vs infra-régional”
- Exemple concret de zone contrastée

## **Slide 3 — Données & pipeline qualité (1 min 30)**
**Message clé :** La valeur du modèle repose d’abord sur la qualité data.  
À afficher :
- Sources (Charika + Pages Jaunes)
- Déduplication 2 passes
- Triple filtre géographique

## **Slide 4 — Problème GPS manquants & correction (1 min 30)**
**Message clé :** Vous avez identifié et corrigé un biais spatial critique.  
À afficher :
- Schéma du biais centroïde
- Rôle de `coords_real`
- Avant / après (conceptuel)

## **Slide 5 — Feature engineering (1 min 30)**
**Message clé :** Variables économiques interprétables, sans cible artificielle.  
À afficher :
- 12 features + 3 interactions
- Mention explicite: score synthétique exclu des entrées

## **Slide 6 — Clustering multi-objectif (2 min)**
**Message clé :** Sélection par compromis scientifique, pas par un seul indicateur.  
À afficher :
- Formule objectif \(O = \alpha S + \beta B \cdot 1[\text{validité}]\)
- Tableau top modèles
- Choix Spectral k=3 justifié

## **Slide 7 — Profils économiques découverts (1 min 30)**
**Message clé :** 3 profils lisibles et actionnables.  
À afficher :
- Description des 3 clusters
- Taille de chaque cluster
- Score post-hoc monotone 35 → 53 → 61

## **Slide 8 — Classification supervisée (1 min)**
**Message clé :** Assignation robuste pour usage opérationnel.  
À afficher :
- Comparaison RF / XGBoost / LightGBM
- Macro-F1 CV et test
- Pourquoi RF retenu

## **Slide 9 — Explicabilité SHAP (1 min)**
**Message clé :** Décision IA justifiée et auditable.  
À afficher :
- Top features SHAP
- Contraste SHAP vs Gini
- Exemple de contribution locale

## **Slide 10 — Application SmartAtlas (2 min)**
**Message clé :** Le projet est utilisable en pratique.  
À afficher :
- Carte interactive
- Dashboard régional
- Prédiction zone + recommandations

## **Slide 11 — Limites & roadmap (1 min)**
**Message clé :** Projet solide mais perfectible, avec plan clair.  
À afficher :
- 3 limites majeures
- 3 perspectives prioritaires

## **Slide 12 — Conclusion (30 sec)**
**Message clé :** Contribution scientifique + valeur opérationnelle.  
Phrase finale suggérée :
> “SmartAtlas transforme des données d’entreprises hétérogènes en profils territoriaux explicables pour aider des décisions économiques locales fiables.”

---

## Messages oraux à répéter (ancrage jury)

1. **“Sans fuite de cible.”**  
2. **“Biais spatial identifié et corrigé explicitement.”**  
3. **“Compromis assumé entre séparation géométrique et exploitabilité.”**  
4. **“Explicabilité SHAP intégrée au produit.”**  
5. **“Prototype déjà actionnable, extensible au national.”**

