# CONCEPT : Aura Elite - Performance & Health OS

## 1. Résumé Exécutif
Aura Elite est une plateforme d'intelligence décisionnelle pour la santé et la performance. Contrairement aux trackers passifs, Aura Elite agit comme un comité d'experts virtuel (médecine du sport, nutrition, psychologie) qui analyse en temps réel les signaux faibles pour fournir des recommandations actionnables. L'objectif est de maximiser la disponibilité à l'entraînement tout en minimisant les risques de blessure et de surentraînement.

## 2. Vision et Objectifs
### Vision
Transformer la donnée brute en sagesse biologique. Aura Elite ne se contente pas de compter les pas ; il interprète la charge de travail par rapport à la capacité de récupération actuelle.

### Objectifs
- **Individualisation extrême** : Chaque recommandation est basée sur le profil historique de l'utilisateur.
- **Prévention proactive** : Détection des "drapeaux rouges" avant l'apparition de la blessure ou de la maladie.
- **Optimisation de la performance** : Ajustement dynamique des charges d'entraînement selon l'état physiologique.

## 3. Architecture Produit
L'application est structurée en modules interdépendants :
1. **Module d'Ingestion** : Collecte hybride (capteurs + questionnaires subjectifs).
2. **Moteur d'Interprétation (Aura Brain)** : Analyse multi-factorielle utilisant des modèles de physiologie de l'exercice.
3. **Moteur de Recommandation** : Génération de conseils quotidiens (Nutrition, Sommeil, Entraînement).
4. **Tableau de Bord "Disponibilité"** : Visualisation claire de l'état de forme.

## 4. Données et Capteurs
### Données Objectives
- **Fréquence Cardiaque au Repos (RHR)** & **Variabilité de la Fréquence Cardiaque (HRV)**.
- **Charge d'entraînement** (Volume, Intensité, Fréquence).
- **Sommeil** (Durée, Phases, Efficacité).
- **Composition corporelle**.

### Données Subjectives (Cruciales)
- **RPE (Rate of Perceived Exertion)** : Intensité perçue de l'effort.
- **Humeur et Stress perçu**.
- **Qualité de la digestion**.
- **Douleurs localisées** (Échelle EVA).

## 5. Logique d'Analyse
Le système utilise une approche **Intra-Individuelle**. Une HRV "basse" pour la population peut être "normale" pour un athlète spécifique. Aura Elite calcule des **Z-Scores** glissants sur 28 jours pour identifier les déviations significatives par rapport à la ligne de base de l'utilisateur.

## 6. Système de Recommandations
- **Court Terme (Aujourd'hui)** : "Votre HRV est en baisse de 15%, privilégiez une séance de récupération active (Zone 1) et augmentez votre apport en magnésium ce soir."
- **Moyen Terme (Semaine)** : "La charge aiguë dépasse la charge chronique (Ratio > 1.5). Risque de blessure élevé. Réduisez le volume de 20% sur les 3 prochains jours."

## 7. Gestion des Risques
### Drapeaux Rouges (Red Flags)
- Douleur persistante > 4/10 au repos.
- HRV en chute libre sur 3 jours consécutifs.
- Signes de triade de l'athlète / RED-S.
- Fréquence cardiaque au repos anormalement élevée (> +10 bpm).
**Action** : Alerte immédiate et recommandation de consultation médicale.

## 8. Validation Scientifique
Aura Elite s'appuie sur :
- Le modèle de **Banister** (Impulsion-Réponse) pour la charge.
- Les consensus de l'**IOC** sur la charge de travail et la prévention des blessures.
- Les protocoles de nutrition de l'**ISSN**.

## 9. Gouvernance, Éthique et Confidentialité
- **Confidentialité** : Chiffrement de bout en bout des données de santé.
- **Transparence** : Chaque recommandation peut être "dépliée" pour voir les données sources et la logique scientifique associée.
- **Éthique** : Pas de diagnostic médical automatisé, uniquement des indicateurs de risque.

## 10. Schéma de Données (Logique)
- **Utilisateur** : Profil, Métriques de base, Objectifs.
- **Événement de Santé** : Date, Type, Intensité, Notes.
- **Session d'Entraînement** : Type, Charge, RPE, HRV post-effort.
- **Nuit de Sommeil** : Scores, Phases, Latence.
- **Recommandation** : Texte, Priorité, Statut d'application.

## 11. Système de Scoring
- **Score de Disponibilité (Readiness)** : 0-100. Agrégation de HRV, Sommeil et Stress.
- **Ratio de Charge (ACWR)** : Charge Aiguë / Charge Chronique. Idéal entre 0.8 et 1.3.
- **Score de Récupération Perçue**.

## 12. Feuille de Route (Roadmap)
- **V1** : Dashboard de base, saisie manuelle RPE/Sommeil, calcul ACWR, recommandations simples.
- **V2** : Intégration API (Garmin/Apple Health), analyse de tendance HRV, nutrition dynamique.
- **V3** : Analyse prédictive par IA, coaching vocal, intégration de données biologiques (prises de sang).

## 13. Risques et Limites
- **Biais de saisie** : Les données subjectives peuvent être influencées par l'humeur.
- **Surcharge informationnelle** : Risque d'orthorexie ou d'anxiété liée aux scores.
- **Limites technologiques** : Imprécision de certains capteurs optiques.

## 14. Décisions de Conception Majeures
1. **Priorité au subjectif** : Si le capteur dit "Prêt" mais que l'athlète dit "Épuisé", le système suit l'athlète.
2. **Design Minimaliste** : Éviter le bruit visuel pour se concentrer sur l'action.
3. **Pédagogie Active** : Expliquer le "Pourquoi" derrière chaque "Quoi".
