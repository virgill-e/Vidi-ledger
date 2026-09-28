# 💰 Vidi Ledger

Vidi Ledger est une application de finances personnelles basée sur un **budget journalier** : les revenus et charges récurrents sont lissés par jour, le budget non dépensé se reporte, l'épargne se range dans des pots, et les investissements (achats, ventes, dividendes) se saisissent comme des dépenses et des revenus.

> **V2 en cours de développement** sur `main` — spécification : [`docs/v2/analyse.md`](docs/v2/analyse.md).
> La V1 (suivi de dépenses + investissements) est figée sur la branche `V1/main`.
> La V2 utilise une **nouvelle base de données** : ne jamais la pointer vers la base V1.

## 🚀 Technologies utilisées

- **Framework** : [Nuxt 4](https://nuxt.com/) (Vue.js 3)
- **Styling** : [Tailwind CSS 4](https://tailwindcss.com/)
- **Base de données** : [Drizzle ORM](https://orm.drizzle.team/) (SQLite ou PostgreSQL)
- **Icônes** : [@nuxt/icon](https://github.com/nuxt/icon) (Lucide, embarqué localement)
- **Conteneurisation** : Docker & Docker Compose.
- **Node.js** : v22.x ou supérieur
- **npm** : v10.x ou supérieur

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- **Node.js** (recommandé v22.22.0 ou plus récent)
- **npm** (v10.9.4 ou supérieur)

---

## ⚙️ Configuration (.env)

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```bash
# "sqlite" pour le local, "postgres" pour la production
DB_TYPE=sqlite

# URL de connexion
# Pour SQLite : v2-local.db
# Pour PostgreSQL : postgresql://user:password@host:5432/dbname
DATABASE_URL=v2-local.db

# Mot de passe secret pour la session (32 caractères minimum)
NUXT_SESSION_PASSWORD=votre_secret_de_32_caracteres_minimum
```

---

## 🛠️ Installation et Exécution locale

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Configurer le `.env`** :
   Pour le local : `DB_TYPE=sqlite` et `DATABASE_URL=v2-local.db` (une base propre à la V2 — `sqlite.db` est celle de la V1).

3. **Créer les tables** puis, en option, des **données de démo** (compte et mot de passe dans `scripts/seed-dev.ts`) :
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Lancer l'app** :
   ```bash
   npm run dev
   ```

---

## 🐳 Déploiement avec Docker / PostgreSQL

### 1. Lancer l'environnement
Assurez-vous que votre `.env` contient les accès à votre base PostgreSQL (via `DB_TYPE=postgres`).
```bash
docker-compose up -d --build
```

### 2. Migration manuelle de la base de données
Puisque l'application ne fait pas le push automatiquement au démarrage, vous devez le lancer manuellement depuis votre machine locale en pointant vers la base de production.

**Option A : Depuis votre terminal local (Recommandé)**
Si votre base PostgreSQL est accessible depuis votre machine :
```bash
# Vérifiez que DB_TYPE=postgres et DATABASE_URL pointe vers votre prod dans le .env
npm run db:push
```

**Option B : Via le conteneur (Si configuré)**
Si vous avez accès au conteneur de l'app :
```bash
docker exec -it vidi-ledger-app npx drizzle-kit push
```

---

---

## 🔁 Migration V1 → V2

Reprend les **utilisateurs** (mots de passe conservés, rôle admin) et les **investissements** (achats, ventes, dividendes) de la V1 dans une **nouvelle** base V2. La base V1 n'est que lue. Détails : [`docs/v2/analyse.md`](docs/v2/analyse.md) §4.

1. Créer une base V2 vide et y appliquer le schéma (`DATABASE_URL` pointant vers elle) :
   ```bash
   npm run db:push
   ```
2. Simuler (aucune écriture, contrôles V1 ↔ V2 bloquants) :
   ```bash
   V1_DATABASE_URL=<base V1> DATABASE_URL=<base V2> npm run migrate:v1 -- --dry-run --start-date=AAAA-MM-JJ
   ```
3. Lancer la migration réelle (même commande sans `--dry-run`). Le script refuse une base V2 non vide et revérifie les données écrites.

Migration dans la **même** base Postgres : déplacer d'abord les tables V1 dans un autre schéma (`CREATE SCHEMA v1; ALTER TABLE public.<table> SET SCHEMA v1;` pour chaque table V1), appliquer les migrations V2 (`DB_TYPE=postgres npx drizzle-kit migrate`), puis passer `--v1-schema=v1` (et `--only=<email>` pour un seul compte).

`--start-date` : jour de bascule (par défaut aujourd'hui, Europe/Brussels). Les jours déjà écoulés du mois sont réputés dépensés ; les opérations V1 datées à partir de ce jour sont signalées car elles impactent le budget.
