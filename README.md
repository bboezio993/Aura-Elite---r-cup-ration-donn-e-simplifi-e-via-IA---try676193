# Aura Elite

Aura Elite est une plateforme personnelle de monitoring destinée aux athlètes de haut niveau (et passionnés exigeants) visant l'optimisation de la performance, l'équilibre de la charge d'entraînement, et le suivi des signaux de charge et récupération.

## Périmètre du Projet

Aura Elite se positionne comme un agrégateur et moteur d’analyse déterministe centré sur :
1. **Garmin** : comme source de données physiologique (HRV, sommeil, biometrie) et sportive (activités, TSS, charges). L'intégration se fait via l'import direct de fichiers ZIP, CSV, FIT ou JSON (pas d'API externe requise en V1).
2. **Saisie Utilisateur** : via des formulaires journaliers subjectifs (Index Hooper, RPE de séance, contexte de vie, hydratation, logs de douleur, menstruations).
3. **Données Dérivées (Engine)** : Notre moteur déterministe (Aura Analytics) calcule longitudinalement l'ACWR (Acute:Chronic Workload Ratio), les z-scores de récupération, les dettes de sommeil, et les bilans énergétiques (si la masse maigre est renseignée).

**Architecture et Philosophie :**
- **Déterministe & Transparent** : Aucun "score magique" généré par une IA. Tous les calculs sont mathématiques et affichent les "drivers" exacts qui les composent (Data Used, Data Missing, Limits).
- **Prudence & Non-Médical** : Aura Elite propose des *recommandations* et des *signaux de vigilance* (ex: disponibilité énergétique à interpréter prudemment) en conservant un wording très prudent ("signal de vigilance", "adaptation recommandée"). Aucun diagnostic n'est posé.
- **Explainability Layer** : Les rapports sous forme de textes destinés aux athlètes sont d'abord structurés par un moteur interne, puis reformulés de façon pédagogique en bout de chaîne (ex: Gemini) – uniquement à des fins de *rewrite* littéraire, sans liberté d'action sur les tendances ni sur les chiffres.

## Cadre Strictement Non Médical

Aura Elite est un outil logiciel conçu exclusivement pour l'optimisation de la performance sportive et le bien-être. Les analyses affichées dépendent entièrement de la qualité des données tierces (Garmin) et subjectives saisies par l'utilisateur. 
L'application ne pose aucun diagnostic, ne traite aucune pathologie et n'offre aucun avis médical. En cas de douleur aiguë ou de symptômes persistants, l'application suggère d'observer une prudence accrue et de recourir à une évaluation professionnelle.

## Moteur Modulaire (Analysis Engine)

La chaîne de calcul est séparée en sous-moteurs distincts :
- **Baseline Engine** : Suivi longitudinal robuste (7, 14, 28, 42, 90 jours) avec MAD/Median et indices de maturité des données.
- **Training Load Engine** : Gère l'ACWR et la dynamique des charges.
- **Sleep Engine** : Agrège durée, score, dette de sommeil et RHR nocturne.
- **Recovery Engine** : Fusionne HRV, RHR, et logs subjectifs (Hooper).
- **Nutrition/Context/Mental Engines** : Modélisent le bilan énergétique, le stress et les contraintes externes (voyages, alcool, examens).
- **Readiness Engine & Risk Boundary** : Calculent le score final de disponibilité et évaluent les situations nécessitant prudence ou évaluation professionnelle (ex: douleur extrême isolée).

## Qualité des données (Data Quality)

Chaque donnée ingérée passe par un évaluateur de qualité (couche `assessDataQuality`) mesurant son intégrité, sa fraîcheur temporelle et sa cohérence de source. Le score assigné à chaque métrique (0-100) va par la suite influencer les intervalles de calcul de la plateforme, plafonnant la certitude des moteurs en cas de contexte faible ou partiellement renseigné.

## Données rejetées / Quarantaine

Aucune information ne disparaît sans laisser de trace :
Les valeurs détectées comme aberrantes ou dont les attributs ne matchent pas le registre strict de l'application (finalConfidence < 50) sont orientées vers une quarantaine systémique (`rejectedMetrics`). Ces données exclues restent vérifiables en vue d'audit (diagnostic des sources, anomalies des parsers ou saisies hasardeuses de l'utilisateur).

## Données complexes, Architecture & Vie Privée

Aura Elite suit une conception de stockage local prioritaire :
- En version Web/Preview : les données subjectives, incluant les questionnaires de forme physiologiques, douleurs, repas et constantes féminines sont conservées localement dans `IndexedDB` en mode `local-only` pour une sécurité maximale durant les itérations.
- Si le déploiement de **Firebase Firestore** est activé : la synchronisation nécessitera alors le renforcement de toutes les collections log avec des Règles de Sécurité fortes isolant strictement chaque profil.

### Matrice de Stockage et Vie Privée

| Catégorie de Donnée | Stockage Local | Cloud (Firestore) | Export (JSON) | Suppression locale | Suppression distante |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Profil physique** | oui | disponible | oui | oui | à implémenter |
| **Métriques Garmin** | oui | disponible | oui | oui | à implémenter |
| **Activités & Entrainements** | oui | disponible | oui | oui | à implémenter |
| **Nutrition (Meal Logs)**| oui | non V1 | oui | oui | n/a |
| **Douleurs** | oui | non V1 | oui | oui | n/a |
| **Humeur & Contexte** | oui | non V1 | oui | oui | n/a |

## Nutrition : Limites actuelles

Pour maintenir une fiabilité analytique, le modèle énergétique actuel exige une base de profils corporels complète (poids, taille, masse grasse). Sans ces informations, l'application neutralise le niveau de certitude quant au risque de déficit et bloque ses estimations.
Une feuille de route (Nutrition V1 Solide) prévoit l’intégration prochaine d'une base nutritionnelle canonique (micro et macro) gérant cru/cuit et portions exactes sans baser la recommandation sur des algorithmes génératifs, et gérée de manière complètement interne.

## Tests
Un script dédié (`npm run test`) couvre la prévention d'erreurs déterministes sur des snapshots fixes, validant les blocages liés à la composition corporelle, le rejet qualifié des métriques fautives, ou le respect des contraintes d'IA.
