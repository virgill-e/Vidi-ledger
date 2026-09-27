# Vidi Ledger V2 — Analyse

Refonte complète inspirée de **Today's Budget** : budget journalier calculé à partir des revenus et charges récurrents, report continu du surplus, pots d'épargne, et les investissements saisis comme une catégorie de dépense.

---

## 0. Décisions prises

| Sujet | Décision |
|---|---|
| Modèle budgétaire | Budget journalier : revenus et charges récurrents lissés par jour, report continu du surplus **et du déficit** |
| Épargne | Plusieurs pots nommés, alimentés manuellement depuis le surplus, utilisables comme source d'une dépense |
| Investissements | Catégorie de type « investissement » dans l'onglet Dépense, même flux de saisie. **Seuls les achats** impactent le budget |
| Cours des actifs | Saisie manuelle, historisée |
| Portefeuille | Un seul par utilisateur |
| Plateforme | Web responsive, design entièrement nouveau (aucun lien visuel avec la V1) |
| Périmètre | Fonctionnalités de Today's Budget + vues prix d'achat/vente des investissements. Rien d'autre de la V1 n'est repris |
| Migration | Utilisateurs + investissements uniquement, vers une **nouvelle base** |

---

## 1. Stratégie de branches

| Branche | Rôle |
|---|---|
| `V1/main` | V1 figée. Correctifs uniquement. **La prod V1 se build depuis cette branche.** |
| `main` | V2. Reçoit les PR des branches `V2/*`. |
| `V2/<feature>` | Branches de travail (ex. `V2/analysis`, `V2/budget-engine`). |

⚠️ Dès le premier merge V2 dans `main`, `main` ne peut plus servir à builder la V1. Le build Docker de prod doit partir de `V1/main` jusqu'à la bascule.

---

## 2. Spécification fonctionnelle

### 2.1 Portefeuille
- Champs : nom, date de début, date de fin (optionnelle), devise, fuseau horaire.
- « Aujourd'hui » = date locale dans le fuseau du portefeuille (calculé côté serveur).
- Rien de ce qui est daté avant la date de début, ni après la date de fin, n'entre dans le budget.

### 2.2 Moteur de budget

**Lissage des récurrents** (revenus, charges, investissements programmés) :

| Fréquence | Part journalière |
|---|---|
| Quotidien | montant |
| Hebdomadaire | montant / 7 |
| Mensuel | montant / nombre de jours du mois concerné |
| Annuel | montant / nombre de jours de l'année concernée |

- Exemple des captures : 2 335 € mensuel en septembre (30 j) → 77,83 €/jour.
- Répartition exacte au centime : la somme des parts sur la période est égale au montant (le reste est distribué sur les jours, pas d'arrondi cumulé). L'affichage « budget quotidien » peut donc varier d'1 centime d'un jour à l'autre.
- Période d'application : début (par défaut, le début du portefeuille) et fin optionnelle. Modifier un montant « à partir du JJ/MM » clôt l'ancienne règle et en crée une nouvelle : le passé n'est pas recalculé.

**Formule** (pour chaque jour `j` à partir de la date de début) :

```
Allocation(j)  = Σ parts des revenus récurrents(j) − Σ parts des charges récurrentes(j)
Dépenses(j)    = Σ dépenses et achats ponctuels payés par le budget (parts étalées incluses)
Revenus(j)     = Σ revenus ponctuels versés au budget
Transferts(j)  = Σ envois budget → pots − Σ retraits pots → budget

Disponible(j)  = Disponible(j−1) + Allocation(j) + Revenus(j) − Dépenses(j) − Transferts(j)
Disponible(début − 1) = 0
```

- Le déficit se reporte comme le surplus (disponible négatif affiché en rouge).
- Étalement sur N jours : montant / N par jour à partir de la date de la dépense (répartition exacte au centime).
- Vérification avec les captures : aujourd'hui 40,47 − 10,00 = **30,47** ; dimanche : excédent 30,47 + budget quotidien 40,47 = **70,93** ; lundi : 111,40.

**Écran d'accueil**
- Grand cercle « Budget du jour » = `Disponible(aujourd'hui)`.
- Courbe : aujourd'hui + jours suivants projetés (allocations futures, dépenses futures déjà saisies ou étalées).
- Info-bulle d'un jour : Excédent = `Disponible(j−1)`, Budget quotidien = `Allocation(j)`, Total.
- Bouton `+` → saisie. Interrupteur tirelire → vue des pots.

### 2.3 Saisie (flux unique)

1. `+` → choix de la catégorie, onglets **Dépense** / **Revenu**. Les catégories d'investissement apparaissent dans Dépense.
2. Formulaire, clavier numérique en priorité :

| Champ | Dépense | Revenu | Investissement |
|---|---|---|---|
| Montant, mémo | ✓ | ✓ | ✓ (montant total, frais inclus) |
| Date (Aujourd'hui / autre) | ✓ | ✓ | ✓ |
| Répétition (Non / Quotidien / Hebdo / Mensuel / Annuel) | ✓ | ✓ + affichage €/jour | Achat seulement (DCA) |
| Période d'application | si récurrent | si récurrent | si récurrent |
| Étaler sur N jours | ✓ | — | — |
| Source / destination : Budget ou un pot | source | destination | source (achat) |
| Actif (autocomplétion + création) | — | — | ✓ |
| Opération : Achat / Vente / Dividende | — | — | ✓ |
| Quantité, frais, prix unitaire calculé | — | — | ✓ (quantité optionnelle pour un dividende) |

3. Règles :
   - Une vente supérieure à la quantité détenue est refusée.
   - Vente et dividende : aucun impact sur le budget.
   - Achat récurrent (DCA) : charge récurrente lissée. Chaque échéance crée une exécution « à compléter » (quantité, montant réel). Les exécutions liées à la règle ne sont pas déduites une deuxième fois du budget.

### 2.4 Pots d'épargne
- Nom, icône, couleur, objectif optionnel.
- Solde = entrées (envois depuis le budget, revenus destinés au pot) − sorties (retraits vers le budget, dépenses et achats payés par le pot).
- Solde négatif interdit.

### 2.5 Catégories
- Type : dépense, revenu ou investissement. Nom, icône, couleur, ordre, archivage (pas de suppression si utilisée).
- Jeu par défaut à la création du portefeuille : Logement, Charges, Transports, Courses, Sorties & restaurants, Santé, Loisirs, Autre, Investissement (dépenses) ; Salaire (revenu).
- Sélecteur d'icônes par groupes (Maison et factures, Alimentation…) comme dans l'app de référence. Pas de premium.

### 2.6 Investissements
- **Vue portefeuille**, par actif : quantité détenue, PRU, investi net, dernier cours saisi, valeur, plus-value latente, plus-value réalisée, dividendes. Totaux.
- **Vue actif** : courbe du cours saisi dans le temps avec les points d'achat et de vente (prix unitaire de chaque opération), ligne du PRU, liste des opérations, saisie d'un nouveau cours.
- Calculs : PRU au coût moyen pondéré (même méthode que la V1), frais inclus dans le coût. Plus-value réalisée d'une vente = produit net − PRU × quantité vendue.

### 2.7 Historique
- Liste groupée par jour, filtres par catégorie et type, modification et suppression.
- Onglet « Récurrents » : règles actives et passées.

### 2.8 Hors périmètre
Analytics, export PDF/CSV, page admin, cibles d'allocation, objectif global d'investissement, multi-portefeuille, partage, API de cours, multi-devise.

---

## 3. Modèle de données

### 3.1 Principes (changements par rapport à la V1)
- **Montants** : entiers en centimes, toujours positifs ; le sens vient du type.
- **Dates métier** en texte `YYYY-MM-DD` (date locale du portefeuille) au lieu de timestamps : aucun décalage de fuseau, tri lexicographique, identique en SQLite et Postgres. Les timestamps ne servent que pour `created_at` / `updated_at`.
- **Quantités** en entier ×10⁸ au lieu d'un double : sommes exactes, plus besoin d'epsilon. Nécessite un helper `bigint` (le `integer` Postgres est en 32 bits).
- **Actifs** dans une table dédiée (en V1, texte libre regroupé par casse).
- Données rattachées au **portefeuille** (`wallet_id`) plutôt qu'à l'utilisateur. `wallets.user_id` est unique ; passer à plusieurs portefeuilles revient à retirer cette contrainte.
- Contraintes `CHECK` sur les énumérations et les combinaisons de colonnes. Le helper `table()` de `schema.ts` doit accepter le 3ᵉ argument de Drizzle (index, checks).

### 3.2 Tables

**users** — `id`, `email` (unique), `name`, `password_hash`, `created_at`, `updated_at`

**sessions** — `id` (texte), `user_id`, `user_agent`, `ip_address`, `created_at`, `last_active_at`, `expires_at` (révocation par appareil, repris tel quel)

**wallets** — `id`, `user_id` (unique), `name`, `start_date`, `end_date?`, `currency` (ISO 4217, défaut `EUR`), `timezone` (IANA, défaut `Europe/Brussels`), `created_at`, `updated_at`

**categories** — `id`, `wallet_id`, `kind` (`expense` | `income` | `investment`), `name`, `icon`, `color`, `position`, `archived_at?`, `created_at`

**pots** — `id`, `wallet_id`, `name`, `icon`, `color`, `target_amount?`, `position`, `archived_at?`, `created_at`

**assets** — `id`, `wallet_id`, `name`, `name_key` (minuscules, unique par portefeuille), `ticker?`, `asset_class?` (`etf` | `stock` | `crypto` | `bond` | `other`), `created_at`

**asset_prices** — `id`, `asset_id`, `date`, `unit_price` (entier en millionièmes de devise, pour les actifs à très bas prix), `created_at`. Unique `(asset_id, date)`.

**recurrences** — `id`, `wallet_id`, `category_id`, `kind` (`expense` | `income` | `investment`), `amount`, `frequency` (`daily` | `weekly` | `monthly` | `yearly`), `start_date`, `end_date?`, `memo?`, `asset_id?` (DCA), `created_at`, `updated_at`

**transactions** — `id`, `wallet_id`, `category_id`, `type` (`expense` | `income` | `buy` | `sell` | `dividend`), `date`, `amount`, `memo?`, `pot_id?`, `spread_days` (≥ 1, défaut 1), `asset_id?`, `quantity?` (×10⁸), `fees` (défaut 0), `recurrence_id?`, `created_at`, `updated_at`
- `buy` / `sell` ⇒ `asset_id` et `quantity > 0` obligatoires ; `dividend` ⇒ `asset_id` obligatoire ; `expense` / `income` ⇒ `asset_id` nul.
- `spread_days > 1` uniquement pour `expense`.
- Index `(wallet_id, date)` et `(asset_id, date)`.

**pot_transfers** — `id`, `wallet_id`, `pot_id`, `direction` (`to_pot` | `from_pot`), `amount`, `date`, `memo?`, `created_at`

### 3.3 Impact des transactions

| Type | `pot_id` nul | `pot_id` renseigné |
|---|---|---|
| `expense` | − budget | − pot |
| `income` | + budget | + pot |
| `buy` | − budget | − pot |
| `buy` avec `recurrence_id` | aucun (déjà couvert par la règle) | — |
| `sell`, `dividend` | aucun | aucun (voir point ouvert 2) |

Une transaction datée avant `wallets.start_date` n'a **aucun impact** sur le budget. C'est ce qui neutralise l'historique d'investissements migré.

### 3.4 Calcul
- Calcul à la volée côté serveur, dans une fonction pure (`server/utils/budget.ts`) : pas de table de soldes à maintenir. Le volume (quelques centaines de jours × quelques dizaines de règles) est négligeable ; un cache pourra être ajouté plus tard si besoin.
- Tests unitaires (vitest) sur cette fonction : fin de mois, février et années bissextiles, étalement, déficit reporté, règle modifiée « à partir de », début de portefeuille en milieu de mois, fuseau horaire.

---

## 4. Migration V1 → V2

### 4.1 Principe
- **Nouvelle base V2** (nouvelle base Postgres ou nouveau fichier SQLite). La base V1 n'est jamais modifiée : la V1 reste utilisable et le retour arrière est immédiat.
- Ne **jamais** lancer `db:push` V2 sur la base V1 : drizzle-kit supprimerait ou modifierait les tables V1.
- Les migrations Drizzle V2 repartent d'une baseline `0000` ; l'historique V1 reste sur `V1/main`.

### 4.2 Script `scripts/migrate-from-v1.ts`
- Lit `V1_DATABASE_URL`, écrit dans `DATABASE_URL`. Exécuté une fois.
- Mode `--dry-run`, exécution dans une transaction, refus si la base cible contient déjà des données.

| V1 | V2 | Règle |
|---|---|---|
| `users` | `users` | email, nom, hash bcrypt copié tel quel (les mots de passe restent valides), `created_at`. `role` ignoré |
| — | `wallets` | 1 par utilisateur : « Mon portefeuille », `start_date` = date de bascule, EUR, Europe/Brussels |
| — | `categories` | jeu par défaut + catégorie Investissement |
| `investments.asset` (distinct, insensible à la casse) | `assets` | `name` = graphie la plus fréquente |
| `investments` | `transactions` (`buy` / `sell` / `dividend`) | `amount` identique (centimes) ; `quantity` = round(q × 10⁸) ; `fees` = 0 (frais déjà inclus dans le montant V1) ; `date` = partie UTC du timestamp V1 (la V1 enregistre `YYYY-MM-DD` à minuit UTC) ; `note` → `memo` ; `pot_id` nul |
| `investment_targets.current_value_override` | `asset_prices` | cours unitaire = valeur / quantité détenue, daté du jour de migration. Préserve la dernière valorisation manuelle |
| `sessions`, `categories`, `expenses`, `investment_goals`, `investment_targets` (%) | — | non migrés |

### 4.3 Contrôles post-migration (bloquants)
Par utilisateur et par actif, V1 comparée à V2 : nombre d'opérations, quantité détenue, coût total, PRU, dividendes cumulés. Rapport affiché ; annulation de la transaction en cas d'écart.

Répétition obligatoire sur une copie de la base de prod avant la bascule réelle.

---

## 5. Stack

- **Conservée** : Nuxt 4, Drizzle (SQLite + Postgres), nuxt-auth-utils, zod, Tailwind 4, date-fns (+ `@date-fns/tz` pour le fuseau du portefeuille), bcrypt (hashes compatibles).
- **Ajouts proposés** (outils existants plutôt que du code maison) :
  - Icônes : `@nuxt/icon` (Iconify). On stocke une clé du type `lucide:shopping-cart` en base.
  - Graphiques : une librairie existante plutôt que le SVG maison de la V1, choix à faire en début de projet.
  - Tests : vitest pour le moteur de budget.
- **Retirés** : jspdf, jspdf-autotable (export hors périmètre).

---

## 6. Découpage en branches

| # | Branche | Contenu |
|---|---|---|
| 1 | `V2/foundation` | Retrait du code V1 sur `main`, nouveau schéma, baseline de migration, auth, layout responsive |
| 2 | `V2/budget-engine` | Moteur de budget + tests, sans UI |
| 3 | `V2/wallet` | Création/édition du portefeuille, catégories par défaut, gestion des catégories |
| 4 | `V2/transactions` | Flux de saisie, historique, récurrents |
| 5 | `V2/home` | Écran « Budget du jour » + courbe |
| 6 | `V2/pots` | Pots, transferts, dépense depuis un pot |
| 7 | `V2/investments` | Actifs, opérations, vues portefeuille et actif, cours manuels, DCA |
| 8 | `V2/migration-v1` | Script de migration + contrôles, répétition sur copie de la prod |
| 9 | Bascule | V2 déployée sur la nouvelle base, V1 arrêtée ou en lecture seule |

1 et 2 en premier. La 8 peut démarrer dès que le schéma de la 1 est figé.

---

## 7. Points ouverts

1. **Inscription** : ouverte, sur invitation, ou désactivée (comptes créés à la main) ? Sans page admin, il faut trancher.
2. **Ventes et dividendes** : jamais d'impact, ou option pour créditer un pot (ex. « Réinvestissement ») ? La colonne `pot_id` le permet sans changer le schéma.
3. **DCA** : mécanisme « exécution à compléter » (décrit en 2.3), ou simple charge récurrente sans lien avec les opérations réelles ? Plus simple, mais le budget ne reflète alors pas le montant réellement investi.
4. **Date de début des portefeuilles migrés** : jour de bascule, ou 1ᵉʳ du mois ?
5. **Récurrents payés par un pot** (ex. assurance annuelle prélevée sur un pot) : à prévoir ? Non inclus dans le schéma actuel (`recurrences` n'a pas de `pot_id`).
