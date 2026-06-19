# Analyse Complète : Web App de Suivi des Dépenses Personnelles

## 1. Périmètre Fonctionnel

### Gestion Multi-utilisateurs (Cloisonnée)
Le système doit permettre à plusieurs utilisateurs (toi, tes colocataires ou amis) de s'inscrire et de se connecter. Chaque compte fonctionne en vase clos, appelé architecture *multi-tenant* : aucune donnée, catégorie ou transaction n'est partagée. 

### Saisie et Importation des Données
Puisque tu refuses la synchronisation automatique pour des raisons de souveraineté et de contrôle, l'application doit proposer deux flux :

- **Saisie manuelle rapide** : Un formulaire optimisé (raccourcis clavier, complétion automatique des commerçants) pour encoder une dépense depuis un smartphone après un achat.
- **Importation de fichiers** : Un module d'import de fichiers CSV ou OFX exportés depuis ta banque. Il faudra une interface de "mapping" pour associer les colonnes du CSV (Date, Montant, Libellé) aux champs de ton application.

### Module OCR "No-AI" pour Tickets de Caisse
Pour scanner tes tickets de courses (pratique pour ton budget cuisine) sans utiliser d'API coûteuse, la solution repose sur la technologie de reconnaissance optique de caractères (OCR) traditionnelle. Des moteurs open source gratuits comme Tesseract permettent d'extraire le texte brut d'une image. Une fois le texte récupéré, l'application utilisera des expressions régulières (Regex) pour identifier les éléments clés :

- **Date** : recherche de formats type `JJ/MM/AAAA`.
- **Montant total** : recherche du montant le plus élevé ou des mots-clés comme "TOTAL" ou "TTC" suivis d'un format monétaire.
- **Commerçant** : recoupement du texte de l'en-tête avec ta base de données de commerçants connus.

### Catégorisation et Moteur de Règles
Pour éviter d'assigner manuellement chaque dépense issue d'un import CSV, il te faut un **moteur de règles d'auto-catégorisation**. Exemple : *Si le libellé contient "Delhaize" ou "Colruyt", assigner automatiquement à la catégorie "Alimentation/Cuisine"*.

### Tableaux de Bord et Reporting
Des vues graphiques permettant d'analyser la répartition des dépenses, l'évolution du patrimoine net, et un comparatif budget défini vs budget réalisé.

---

## 2. Architecture et Stack Technique

Connaissant tes affinités techniques, voici l'architecture recommandée :

### Frontend : Nuxt 3 (Vue.js)
- **Mode** : SPA (Single Page Application) ou SSR (Server-Side Rendering). Pour un tableau de bord derrière un login, une SPA classique est souvent suffisante et plus légère à héberger.
- **UI Framework** : Tailwind CSS couplé à Nuxt UI ou Shadcn-vue pour créer des composants d'interface modernes (tableaux de données, modales d'import) rapidement.
- **Gestion de l'état** : Pinia pour gérer la session utilisateur et le cache des catégories/transactions.
- **Graphiques** : Chart.js ou ApexCharts pour les visualisations de dépenses par catégorie.

### Backend : API REST en C# .NET (8 ou 9)
- **Architecture** : Clean Architecture (ou Vertical Slice Architecture) pour bien séparer la logique métier (règles de catégorisation) de l'accès aux données.
- **Intégration OCR** : Utilisation d'un "wrapper" C# open source pour Tesseract (comme le package NuGet `Tesseract`). Il faudra s'assurer que les bibliothèques C++ de Tesseract et les fichiers de langue (français/anglais) sont installés sur le serveur hôte.
- **Authentification** : ASP.NET Core Identity avec émission de tokens JWT ou de cookies HTTP-Only pour sécuriser les sessions.
- **Parsing de fichiers** : Utilisation de libraries comme `CsvHelper` pour parser les CSV et `OpenFINCH` (ou parseur custom) pour les fichiers OFX.

### Base de Données et Stockage
- **SGBD** : PostgreSQL. C'est le standard robuste qui gère parfaitement les relations financières et permet d'utiliser des champs JSONB si tu souhaites stocker les données brutes des imports CSV.
- **Stockage de fichiers** : Un volume Docker local monté sur le backend, ou un conteneur MinIO (compatible S3) pour stocker les scans de tickets de caisse de manière sécurisée et isolée.

### Structure du Projet
```
expense-tracker/
├── backend/
│   ├── src/
│   │   ├── Application/        # Use Cases & Services
│   │   ├── Domain/             # Entities & Business Rules
│   │   ├── Infrastructure/     # DB, OCR, FileStorage
│   │   ├── API/                # Controllers & DTOs
│   │   └── Program.cs
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app.vue
│   ├── nuxt.config.ts
│   ├── components/
│   ├── pages/
│   ├── composables/
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

## 3. Modèle de Données

Pour garantir une isolation parfaite, la clé étrangère `UserId` doit être présente sur toutes les tables principales.

| Table | Description et Champs clés |
|:------|:---|
| **Users** | `Id`, `Email`, `PasswordHash`, `CreatedAt`, `UpdatedAt`. Gère les accès et authentification. |
| **Accounts** | `Id`, `UserId`, `Name`, `Type` (Courant, Épargne, Espèces), `Balance`, `Currency`. Représente les comptes bancaires/portefeuilles de l'utilisateur. |
| **Categories** | `Id`, `UserId`, `Name`, `Color`, `Icon`, `ParentCategoryId` (pour créer une hiérarchie, ex: Cuisine > Ustensiles). Permet une organisation hiérarchique des dépenses. |
| **Transactions** | `Id`, `AccountId`, `Amount`, `Date`, `Payee`, `CategoryId`, `Notes`, `ReceiptFilePath`, `Source` (Manual/Import/OCR). L'enregistrement principal de chaque opération. |
| **Rules** | `Id`, `UserId`, `ConditionPattern` (Regex), `TargetCategoryId`, `Priority`. Les règles pour l'auto-catégorisation. |
| **ImportBatch** | `Id`, `UserId`, `UploadedAt`, `FileName`, `Status` (Pending/Processed/Failed). Permet de tracker les imports de fichiers. |
| **Payees** | `Id`, `UserId`, `Name`, `Category`. Base de commerçants connus pour améliorer l'autocomplétion et la reconnaissance OCR. |

---

## 4. Fonctionnalités Détaillées par Module

### Module 1 : Authentification et Gestion des Utilisateurs
**Endpoints API :**
- `POST /auth/register` : Inscription avec email unique et validation du mot de passe (min 8 caractères).
- `POST /auth/login` : Authentification et génération du JWT (durée de vie 7 jours avec refresh token).
- `POST /auth/logout` : Invalidation côté serveur si gestion des sessions.
- `POST /auth/refresh` : Renouvellement du JWT expiré.
- `GET /users/profile` : Récupération du profil de l'utilisateur authentifié.
- `PATCH /users/profile` : Modification des paramètres utilisateur (langue, devise, fuseau horaire).

**Sécurité :**
- Hachage des mots de passe avec BCrypt ou Argon2.
- Tokens JWT signés avec une clé asymétrique (RS256).
- Délai de rate-limiting sur les endpoints de login (max 5 tentatives par minute).

### Module 2 : Gestion des Comptes
**Endpoints API :**
- `GET /accounts` : Listing de tous les comptes de l'utilisateur avec soldes.
- `POST /accounts` : Création d'un nouveau compte (Courant, Épargne, Espèces, etc.).
- `PATCH /accounts/{id}` : Modification du nom ou du solde initial.
- `DELETE /accounts/{id}` : Suppression d'un compte (avec vérification : pas de transactions liées).
- `GET /accounts/{id}/balance-history` : Historique du solde (utile pour des graphiques).

**Frontend :**
- Sélecteur de compte sur la page de saisie de dépenses.
- Vue synthétique des soldes de tous les comptes.

### Module 3 : Saisie Manuelle de Transactions
**Endpoints API :**
- `POST /transactions` : Création d'une transaction avec validation (montant > 0, date valide, catégorie appartenant à l'utilisateur).
- `GET /transactions?skip=0&take=50&category=1&account=1&startDate=2026-01-01&endDate=2026-02-26` : Listing avec filtres et pagination.
- `PATCH /transactions/{id}` : Modification d'une transaction existante.
- `DELETE /transactions/{id}` : Suppression.

**Frontend :**
- Formulaire rapide optimisé pour mobile (champs : Date, Montant, Commerçant, Catégorie, Notes).
- Autocomplétion du champ "Commerçant" basée sur l'historique (table `Payees`).
- Raccourcis clavier : `Enter` pour valider, `Esc` pour réinitialiser.
- Option pour dédupliquer les transactions (si deux transactions identiques sont détectées).

### Module 4 : Importation de Fichiers (CSV/OFX)
**Endpoints API :**
- `POST /imports/upload` : Upload d'un fichier CSV ou OFX (validation MIME type).
- `GET /imports/{batchId}/preview` : Aperçu des transactions parsées (sans les sauvegarder).
- `POST /imports/{batchId}/process` : Validation et insertion dans la DB.
- `GET /imports/history` : Historique des imports (avec statuts).

**Logique C# :**
- Parser CSV en utilisant `CsvHelper` (NuGet).
- Détection automatique des colonnes si l'ordre est inconnu.
- Application des règles de catégorisation avant affichage du preview.
- Gestion des doublons : comparaison (Date, Montant, Payee) pour éviter les imports en double.

**Frontend :**
- Zone de drop de fichier (drag & drop).
- Sélection du format (CSV ou OFX).
- Mapper visuel des colonnes : l'utilisateur peut associer les colonnes de son export bancaire à celles attendues (Date, Montant, Libellé, etc.).
- Aperçu du résultat avec possibilité de supprimer certaines lignes avant validation.

### Module 5 : Module OCR pour Tickets de Caisse
**Architecture :**
- Upload de l'image (formats acceptés : JPEG, PNG, PDF monopages).
- Appel au service C# qui utilise Tesseract via le package NuGet `Tesseract`.
- Extraction du texte brut.
- Parsing avec regex pour identifier la date, le montant et le commerçant.
- Retour d'une dépense "pré-remplie" à l'utilisateur.

**Endpoints API :**
- `POST /ocr/upload` : Upload d'un ticket.
- `GET /ocr/result/{uploadId}` : Récupération du texte extrait et des données pré-remplies (suggestion de catégorie basée sur le commerçant).

**Frontend :**
- Modal de capture de ticket (avec webcam ou upload).
- Affichage du texte extrait (lisible et éditable).
- Formulaire pré-rempli avec les valeurs détectées (date, montant).
- Option de validation directe ou de modification avant validation.

**Exemple de regex pour extraction :**
```csharp
// Montant : cherche les motifs "TOTAL : 25.50 €" ou "TTC 123,45 EUR"
var montantPattern = @"(?:TOTAL|TTC)[\s:]*(\d+[,\.]\d{2})\s*(?:€|EUR)?";

// Date : cherche "JJ/MM/AAAA" ou "AAAA-MM-JJ"
var datePattern = @"(\d{2}/\d{2}/\d{4}|\d{4}-\d{2}-\d{2})";

// Commerçant : première ligne pertinente, souvent tout en majuscules
var merchantPattern = @"^([A-Z\s]+)(?:\n|$)";
```

### Module 6 : Moteur de Règles d'Auto-Catégorisation
**Table `Rules` :**
- `ConditionPattern` : Chaîne regex (ex : `(Delhaize|Colruyt|Carrefour)`, `(Netflix|Spotify)`).
- `TargetCategoryId` : La catégorie assignée si le pattern correspond.
- `Priority` : Numérique (0 = haute priorité). En cas de plusieurs règles correspondantes, la première (priorité la plus haute) gagne.

**Logique de Traitement :**
- À chaque import de transaction (manuelle, CSV ou OCR), le backend boucle sur les règles de l'utilisateur.
- Il teste chaque regex contre le champ `Payee` (libellé du commerçant).
- La première correspondance assigne la catégorie automatiquement.
- L'utilisateur peut modifier après coup si la catégorisation ne lui plaît pas.

**Frontend :**
- Interface CRUD pour gérer les règles.
- Testeur de règles : l'utilisateur saisit un libellé exemple et la regex est testée en temps réel.

### Module 7 : Catégorisation Hiérarchique
**Structure :**
- Les catégories peuvent être imbriquées (ex : Cuisine > Ustensiles, Cuisine > Courses).
- L'utilisateur crée ses propres catégories selon ses besoins.
- Les rapports peuvent agrégér par catégorie parente.

**Endpoints API :**
- `GET /categories` : Listing de toutes les catégories (avec hiérarchie).
- `POST /categories` : Création (avec `ParentCategoryId` optionnel).
- `PATCH /categories/{id}` : Modification.
- `DELETE /categories/{id}` : Suppression (avec vérification : pas de transactions liées).

### Module 8 : Tableaux de Bord et Reportage
**Vues Disponibles :**

1. **Dashboard Principal**
   - Résumé des soldes par compte.
   - Dépenses du mois en cours.
   - Graphique en camembert : répartition par catégorie.
   - Graphique en courbe : tendance des dépenses sur les 6 derniers mois.
   - Comparatif budget vs réalisé (si des budgets sont définis par catégorie).

2. **Vue de Détail par Catégorie**
   - Liste des transactions d'une catégorie (filtrable par période).
   - Dépense moyenne mensuelle.
   - Montant total d'un mois.
   - Export en CSV/PDF de la période sélectionnée.

3. **Rapport de Synthèse**
   - Vue mensuelle/trimestrielle/annuelle.
   - Heatmap des dépenses par jour de la semaine.
   - Dépense par commerçant (top 10, par exemple).
   - Ratio d'épargne (solde initial - dépenses total du mois).

4. **Analyse Budgétaire (Optionnel)**
   - Définition de budgets par catégorie.
   - Alerte si dépassement.
   - Tendance vs budget sur les 12 derniers mois.

**Endpoints API (pour les rapports) :**
- `GET /analytics/overview?period=month&date=2026-02-01` : Vue d'ensemble.
- `GET /analytics/by-category?startDate=2026-01-01&endDate=2026-02-26` : Répartition par catégorie.
- `GET /analytics/trend?months=6` : Tendance sur N mois.
- `POST /exports/report?format=pdf&period=january-2026` : Génération d'un rapport PDF.

---

## 5. Sécurité et Isolation Multi-Tenant

C'est le point critique d'une application multi-utilisateurs où chacun gère son propre argent :

### Principe Fondamental : Zero Trust
Chaque endpoint API doit vérifier que l'utilisateur accédant dispose bien des droits sur la ressource demandée.

### Mise en Œuvre Technique

1. **Extraction de l'Utilisateur Authentifié**
   ```csharp
   var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
   if (userId == null) return Unauthorized();
   ```

2. **Global Query Filters dans Entity Framework**
   ```csharp
   modelBuilder.Entity<Transaction>()
       .HasQueryFilter(t => t.Account.UserId == userId);
   
   modelBuilder.Entity<Category>()
       .HasQueryFilter(c => c.UserId == userId);
   ```
   Cela garantit que chaque requête d'une entité filtrée exclut automatiquement les données d'autres utilisateurs.

3. **Validation Systématique**
   ```csharp
   // Avant de modifier une transaction
   var transaction = await dbContext.Transactions.FirstOrDefaultAsync(t => t.Id == id);
   if (transaction?.Account?.UserId != userId) 
       return Forbid("Access denied");
   ```

4. **Uploads Sécurisés**
   - Validation du MIME type réel (pas juste l'extension).
   - Taille maximale des fichiers (ex : 10 Mo pour les images, 50 Mo pour les CSV).
   - Noms de fichiers aléatoires (GUID) pour éviter les collisions ou injections.
   - Stockage hors de la webroot (impossible d'exécuter des scripts).

5. **Chiffrement des Données Sensibles** (Optionnel mais recommandé)
   - Notes de transactions : chiffrement AES-256 avec clé dérivée du mot de passe utilisateur.
   - Informations IBAN : masquage (affichage partiel ou chiffrement).

### Politiques CORS et CSRF
- **CORS** : Autorise les requêtes depuis le domaine du frontend uniquement.
- **CSRF** : Intégrer des tokens CSRF pour les mutateurs (POST, PATCH, DELETE).

---

## 6. Infrastructure et Hébergement (Dokploy)

Puisque tu as de l'expérience avec Dokploy et l'auto-hébergement, ton VPS (Debian ou Ubuntu) sera parfaitement adapté :

### Fichier `docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: expensetracker
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      ConnectionStrings__DefaultConnection: Host=postgres;Database=expensetracker;Username=app_user;Password=${DB_PASSWORD}
      Jwt__SecretKey: ${JWT_SECRET}
      Jwt__Issuer: ${JWT_ISSUER}
      Jwt__Audience: ${JWT_AUDIENCE}
    depends_on:
      - postgres
    volumes:
      - ./storage:/app/storage  # Pour les tickets OCR
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NUXT_PUBLIC_API_BASE: ${API_BASE_URL}
    restart: unless-stopped

volumes:
  postgres_data:
```

### Dockerfile Backend (avec Tesseract)
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["ExpenseTracker.API/ExpenseTracker.API.csproj", "ExpenseTracker.API/"]
RUN dotnet restore "ExpenseTracker.API/ExpenseTracker.API.csproj"
COPY . .
RUN dotnet build "ExpenseTracker.API/ExpenseTracker.API.csproj" -c Release -o /app/build
RUN dotnet publish "ExpenseTracker.API/ExpenseTracker.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-fra \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "ExpenseTracker.API.dll"]
```

### Dockerfile Frontend (Nuxt)
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.output .
EXPOSE 3018
CMD ["node", "server/index.mjs"]
```

### Configuration Dokploy
1. Créer une nouvelle application pour le backend (répertoire `/backend`).
2. Créer une nouvelle application pour le frontend (répertoire `/frontend`).
3. Créer une base de données PostgreSQL managée via Dokploy.
4. Configurer Traefik pour :
   - Rediriger `https://example.com/api/*` vers le backend sur le port 80.
   - Rediriger `https://example.com/` vers le frontend sur le port 3000.
5. Générer les certificats SSL via Let's Encrypt automatiquement.

### Variables d'Environnement (`.env`)
```
DB_PASSWORD=xxxxxxxxxxxxx
JWT_SECRET=your-very-secret-key-here
JWT_ISSUER=https://yourdomain.com
JWT_AUDIENCE=expensetracker-app
API_BASE_URL=https://yourdomain.com/api
```

---

## 7. Roadmap de Développement Suggérée

### Phase 1 : MVP - Socle et Saisie Manuelle (Semaines 1-3)
**Objectifs :**
- [ ] Mise en place de la base de données PostgreSQL et migrations Entity Framework.
- [ ] Implémentation de l'authentification (Register / Login / JWT).
- [ ] Création des entités Domain (User, Account, Category, Transaction).
- [ ] Global Query Filters pour l'isolation multi-tenant.
- [ ] API REST minimale : CRUD Transactions, CRUD Accounts, CRUD Categories.
- [ ] Frontend Nuxt : Page de login, Dashboard avec listing des transactions, Formulaire de saisie rapide.
- [ ] Test intégration : vérifier qu'un utilisateur ne voit que ses propres données.

**Livrable :**
- Application fonctionnelle pour saisir manuellement des dépenses et les consulter.

### Phase 2 : Importation et Automatisation (Semaines 4-6)
**Objectifs :**
- [ ] Implémentation du parseur CSV (avec `CsvHelper`).
- [ ] Création de la table `Rules` et logique d'auto-catégorisation.
- [ ] Endpoint d'upload et preview de fichier.
- [ ] Logic pour éviter les doublons.
- [ ] Frontend : Module d'import avec mapper de colonnes et aperçu avant validation.
- [ ] Tests des règles : interface de test regex côté frontend.

**Livrable :**
- Capacité à importer des fichiers bancaires et auto-catégoriser les dépenses via des règles.

### Phase 3 : Module OCR (Semaines 7-9)
**Objectifs :**
- [ ] Installation et test de Tesseract dans l'environnement Docker.
- [ ] Implémentation du service OCR en C# (extraction de texte + regex).
- [ ] Endpoint d'upload et de résultat OCR.
- [ ] Integration avec les commandes pour détecter le commerçant existant.
- [ ] Frontend : Modal de capture et formulaire pré-rempli.

**Livrable :**
- Scanner de tickets de caisse avec pré-remplissage intelligent des dépenses.

### Phase 4 : Tableaux de Bord et Reporting (Semaines 10-12)
**Objectifs :**
- [ ] Endpoints analytics : répartition par catégorie, tendances, etc.
- [ ] Frontend : Dashboard avec graphiques (Chart.js ou ApexCharts).
- [ ] Rapports PDF exportables.
- [ ] Heatmaps et analyses avancées (optionnel).

**Livrable :**
- Vue complète de la situation financière avec graphiques et exports.

### Phase 5 : Optimisations et Déploiement (Semaines 13+)
**Objectifs :**
- [ ] Tests unitaires (xUnit pour le C#, Vitest pour Nuxt).
- [ ] Tests d'intégration (API avec base de données).
- [ ] Tests de sécurité : vérifications multi-tenant.
- [ ] Monitoring : logs centralisés, alertes d'erreurs.
- [ ] Optimisation des performances : indexation DB, caching côté API, SSG côté frontend si possible.
- [ ] Documentation : README, architecture, guide de déploiement.
- [ ] Déploiement sur Dokploy avec monitoring en continu.

**Livrable :**
- Application production-ready, sécurisée, documentée et auto-hébergée.

---

## 8. Considérations Techniques Avancées

### Performance et Scalabilité
- **Pagination** : Toujours limiter les résultats (ex : 50 transactions par page) pour éviter de charger la RAM.
- **Indexation DB** : Créer des index sur les colonnes fréquemment filtrées (UserId, Date, CategoryId).
- **Caching** : Utiliser Redis (optionnel) pour cacher les catégories, les règles et les résultats d'analytics fréquents.
- **Async/Await** : Toutes les opérations I/O (DB, fichiers) doivent être asynchrones en C#.

### Monitoring et Logging
- **Serilog** : Framework de logging recommandé pour C# (exporte vers fichiers, ElasticSearch, etc.).
- **Application Insights** (optionnel) : Suivi des performances et des erreurs.
- **Logs centralisés** : Stocker les logs sur le VPS avec rotation (logrotate).

### Tests Automatisés
- **Authentification** : Vérifier que les tokens expirent et se renouvellent correctement.
- **Multi-tenant** : Vérifier qu'un utilisateur ne peut pas accéder aux données d'un autre (tests de sécurité).
- **OCR** : Tester le parseur regex sur divers formats de tickets belges.

### RGPD et Conformité
- **Droit à l'oubli** : Ajouter une fonctionnalité pour supprimer complètement les données d'un utilisateur.
- **Exportabilité** : Permettre l'export de toutes les données personnelles en JSON/CSV.
- **Politique de confidentialité** : Documenter ce qui est stocké et comment.

### Évolutivité Future
- **API GraphQL** : En cas de besoin de requêtes complexes, considérer une migration vers GraphQL.
- **Synchronisation bancaire** : Si tu décides ultérieurement d'intégrer la synchro bancaire, utiliser des APIs comme Wise ou Plaid.
- **Mobile native** : Envisager une app Flutter/React Native qui consomme la même API REST.
- **Notifications** : Ajouter des alertes email ou push si une dépense dépasse le budget.

---

## 9. Estimations et Ressources

### Effort de Développement
- **MVP (Phase 1)** : ~80-100 heures (2.5-3 semaines à 40h/semaine).
- **Phase 2 (Import + Règles)** : ~60-80 heures.
- **Phase 3 (OCR)** : ~40-60 heures (dépend de la complexité des tickets).
- **Phase 4 (Analytics)** : ~50-70 heures.
- **Total estimé** : ~250-350 heures (3-4 mois à temps plein, ou 6-9 mois à temps partiel).

### Ressources Requises
- **Serveur** : Ton VPS (2 CPU, 4 GB RAM suffit amplement).
- **Domaine & SSL** : ~10-15 € /an (Let's Encrypt gratuit via Traefik).
- **Outils de développement** : Visual Studio Community (gratuit) + Visual Studio Code (gratuit) + Rider (payant, ~150 €/an, mais tu as peut-être une licence pro).

### Dépendances Clés (NuGet & NPM)
**Backend C# :**
- `Microsoft.EntityFrameworkCore` (ORM).
- `Microsoft.AspNetCore.Authentication.JwtBearer` (Authentification).
- `CsvHelper` (Parsing CSV).
- `Tesseract` (OCR).
- `FluentValidation` (Validation de DTO).

**Frontend Nuxt :**
- `@nuxtjs/tailwindcss` (Styling).
- `pinia` (State management).
- `axios` (Client HTTP).
- `chart.js` ou `apexcharts` (Graphiques).
- `date-fns` (Manipulation de dates).

---

## 10. Checklist de Contrôle Qualité Avant Production

- [ ] Tous les endpoints retournent les codes HTTP corrects (200, 201, 400, 401, 403, 404, 500).
- [ ] Les erreurs incluent des messages utiles (pas juste "Error").
- [ ] Les données sensibles ne sont jamais loggées (ex : mots de passe, tokens).
- [ ] Les mots de passe sont hachés (BCrypt/Argon2), les tokens JWT signés.
- [ ] Les tokens ont une durée de vie limitée (7 jours) + refresh tokens.
- [ ] Tous les endpoints "lecture" testés : utilisateur A ne voit que ses données.
- [ ] Tous les endpoints "écriture" testés : utilisateur A ne peut modifier que ses données.
- [ ] Les uploads de fichiers sont validés (MIME type, taille, safe storage).
- [ ] Les regex OCR testées sur au moins 20 tickets variés (Delhaize, Carrefour, petits commerces, etc.).
- [ ] Les imports CSV testés avec colonnes dans différents ordres.
- [ ] Les règles de catégorisation testées en cas de chevauchement (priorités).
- [ ] Le site frontend fonctionne sur mobile (responsive design).
- [ ] Les erreurs de validation affichent des messages clairs à l'utilisateur.
- [ ] La base de données est sauvegardée automatiquement (stratégie de backup).
- [ ] Les logs rotatifs configurés pour ne pas saturer le disque.
- [ ] Let's Encrypt SSL fonctionne et se renouvelle automatiquement.

---

## Conclusion

Cette application de suivi des dépenses est **parfaitement réalisable en solo** avec ta stack de compétences. Elle respecte tes contraintes (no IA, no API bancaire, multi-tenant cloisonné) et valorise tes talents de développeur infrastructure + backend + frontend.

**Points forts du projet :**
✅ Architecture Clean Architecture bien structurée.
✅ Multi-tenant sécurisé par Global Query Filters.
✅ OCR sans coûts récurrents (Tesseract open source).
✅ Déploiement entièrement self-hosted sur Dokploy.
✅ Stack moderne et alignée avec l'industrie.
✅ Opportunité d'apprendre des bonnes pratiques (testing, security, monitoring).

**Prochaines étapes :**
1. Créer le dépôt GitHub avec la structure du projet.
2. Mettre en place la base de données et les migrations.
3. Implémenter l'authentification en Phase 1.
4. Itérer progressivement à travers les phases.

Bon coding, et n'hésite pas si tu veux des précisions sur une partie technique ! 🚀

