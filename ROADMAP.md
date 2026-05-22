# DOCUMENT TECHNIQUE INTERNE & FEUILLE DE ROUTE (ROADMAP)
## Consolidation de l'Architecture Cloud-First & Sécurisée de Aura Elite

Ce document sert de spécification technique consolidée pour les phases à venir de l'application Aura Elite.

---

### I. Modèle d'Isolation de Données Firestore

#### Choix d'isolation : Collections de niveau supérieur (Top-Level)
*   **Décision d'architecture :** Conserver des collections de premier niveau (ex : `/mealLogs`, `/favoriteFoods`, `/metrics`, `/recipes`) isolées par un champ caché `uid`.
*   **Justification :** Ce modèle permet des requêtes globales haute performance pour l'Analytics Engine, réduisant drastiquement le coût I/O des jointures de données de l'athlète comparativement au modèle imbriqué `/users/{uid}/...` tout en restant 100% conforme au RGPD.
*   **Étanchéité et Sécurisation :** Les règles Firestore déployées bloquent de manière systématique tout accès non authentifié ou d'un tiers via des expressions du type :
    ```javascript
    allow read, write: if isAuthenticated() && (resource == null || resource.data.uid == request.auth.uid);
    ```

---

### II. Gestion de la Synchronisation d'Écriture (Session & Retries)

*   **Zustand comme Cache UI Réactif :** L'état local Zustand s'occupe exclusivement de servir de miroir ultra-rapide des dernières valeurs lues depuis les Snapshot Listeners temps réel de Firestore.
*   **Statuts Synchronisés :** Un registre dynamique non persistant (`syncStatuses`) dans le store répertorie chaque écriture sensible initiée en arrière-plan.
    *   `pending` : L'appel Firestore est initié, l'indicateur clignote orange en haut de l'écran.
    *   `synced` : L'écriture a abouti avec succès, l'indicateur passe au vert.
    *   `failed` : L'écriture a échoué (ex: micro-coupure réseau/règles non respectées). L'indicateur passe au rouge et l'état d'erreur est capturé.
*   **Mécanique de Retry :** L'utilisateur peut déclencher manuellement via le Widget de Synchronisation une réémission immédiate de l'écriture en utilisant les données restées intègres dans le cache Zustand local.

---

### III. Migration Cloud Serverless (Remplacement de server.ts)

Afin de basculer vers une infrastructure hautement disponible et 100% serverless, le microservice Express de développement (`server.ts`) sera migré vers des **Firebase/Google Cloud Functions**.

```
                           +--------------------------+
                           |  AURA ELITE CLIENT APP  |
                           +------------+-------------+
                                        |
                 +----------------------+----------------------+
                 | (Writes/Reads)                              | (Secure Proxy API)
                 v                                             v
     +-----------------------+                    +--------------------------+
     |  Firestore Database   |                    | Firebase Cloud Functions |
     |                       |                    | (Node.js 20 Serverless)  |
     |  - Top-Level Segments |                    +------------+-------------+
     |  - Secured via UID   |                                 |
     +-----------------------+                 +---------------+---------------+
                                               |                               |
                                               v                               v
                                  +-----------------------+       +-------------------+
                                  | Open Food Facts API   |       | Gemini Flash 2.0  |
                                  | (Barcode verification)|       | (AI Insights API) |
                                  +-----------------------+       +-------------------+
```

#### Plan de Transition :
1.  **Dépôt de Credentials :** Les clés privées (`GEMINI_API_KEY`) et tokens d'API sensibles seront hébergés dans Google Secret Manager.
2.  **Déploiement des Endpoints :**
    *   `verifyBarcode` -> Remplacera le route Express `/api/openfoodfacts/barcode/:code`.
    *   `generateAiInsights` -> Centralisera les requêtes d'ingestion de repas par photo ou de synthèse vocale par IA de façon atomique.
3.  **Avantages :** Zéro serveur long-running à administrer, coût réduit aux requêtes réelles (pay-per-use), passage d'échelle instantané lors des pics d'entraînements collectifs des athlètes.
