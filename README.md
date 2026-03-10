# 💰 Vidi Ledger

Vidi Ledger est une application de gestion de dépenses.

## 🚀 Technologies utilisées

- **Framework** : [Nuxt 4](https://nuxt.com/) (Vue.js 3)
- **Styling** : [Tailwind CSS 4](https://tailwindcss.com/)
- **Base de données** : [Drizzle ORM](https://orm.drizzle.team/) (SQLite ou PostgreSQL)
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
# Pour SQLite : sqlite.db
# Pour PostgreSQL : postgresql://user:password@host:5432/dbname
DATABASE_URL=sqlite.db

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
   Assurez-vous d'avoir `DB_TYPE=sqlite` et `DATABASE_URL=sqlite.db` pour le local.

3. **Créer les tables** :
   ```bash
   npm run db:push
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

