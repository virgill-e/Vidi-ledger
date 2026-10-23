# Étape de construction
FROM node:20-slim AS builder

WORKDIR /src

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code source et build
COPY . .
RUN npm run build

# Étape d'exécution
FROM node:20-slim

WORKDIR /app

# On ne copie que l'output du build pour garder l'image légère,
# plus les migrations SQL appliquées au démarrage (server/plugins/migrate.ts)
COPY --from=builder /src/.output ./.output
COPY --from=builder /src/server/database/migrations ./server/database/migrations

ENV HOST=0.0.0.0
ENV PORT=3018
ENV NODE_ENV=production

EXPOSE 3018

# Utilisateur non privilégié de l'image (uid 1000) : l'app ne fait que lire ses
# fichiers (restés à root, donc non modifiables) et écoute sur un port > 1024.
# Les données sont dans Postgres ; une base SQLite demanderait un volume inscriptible.
USER node

CMD ["node", ".output/server/index.mjs"]
