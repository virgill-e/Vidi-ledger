# Vidi Ledger V2 — Analyse

Refonte complète inspirée de **Today's Budget** : budget journalier calculé à partir des revenus et charges récurrents, report continu du surplus, pots d'épargne, et investissements saisis via le même flux que les dépenses et revenus.

---

## 0. Décisions prises

| Sujet | Décision |
|---|---|
| Modèle budgétaire | Budget journalier : revenus et charges récurrents lissés par jour, report continu du surplus **et du déficit** |
| Épargne | Plusieurs pots nommés, alimentés manuellement depuis le surplus, utilisables comme source d'une dépense |
| Investissements | Achat = dépense (catégorie d'investissement dans l'onglet Dépense). Vente et dividende = revenu ponctuel (catégorie de revenu dédiée, distincte du salaire). Chaque opération est saisie à la main, **pas de DCA programmé** |
| Récurrents | Revenus et charges récurrents (salaire, loyer, charges…) lissés dans le budget. Toujours imputés au budget, jamais à un pot |
| Cours des actifs | Saisie manuelle, historisée |
| Portefeuille | Un seul par utilisateur |
| Comptes | Inscription ouverte. Drapeau `is_admin` en base, vue admin (suppression de compte ou de données, changement de mot de passe) |
| Plateforme | Web responsive, design entièrement nouveau (aucun lien visuel avec la V1) |
| Périmètre | Fonctionnalités de Today's Budget + vues prix d'achat/vente des investissements + admin. Rien d'autre de la V1 n'est repris |
| Migration | Utilisateurs + investissements uniquement, vers une **nouvelle base**. Portefeuilles migrés démarrant le jour de bascule, jours écoulés du mois réputés dépensés à la moyenne |

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

**Lissage des récurrents** (revenus et charges uniquement) :

| Fréquence | Part journalière |
|---|---|
| Quotidien | montant |
| Hebdomadaire | montant / 7 |
| Mensuel | montant / nombre de jours du mois concerné |
| Annuel | montant / nombre de jours de l'année concernée |

- Exemple des captures : 2 335 € mensuel en septembre (30 j) → 77,83 €/jour.
- Calcul en fractions de centime, arrondi uniquement à l'affichage (comme l'app de référence) : la somme sur la période est égale au montant, sans dérive d'arrondi. Conséquence visible : « Excédent + Budget quotidien » peut différer d'1 centime du total affiché (30,47 + 40,47 → 70,93 dans les captures).
- Période d'application : début (par défaut, le début du portefeuille) et fin optionnelle. Modifier un montant « à partir du JJ/MM » clôt l'ancienne règle et en crée une nouvelle : le passé n'est pas recalculé.

**Formule** (pour chaque jour `j` à partir de la date de début) :

```
Allocation(j)  = Σ parts des revenus récurrents(j) − Σ parts des charges récurrentes(j)
Dépenses(j)    = Σ dépenses et achats ponctuels payés par le budget (parts étalées incluses)
Revenus(j)     = Σ revenus ponctuels versés au budget (ventes et dividendes inclus)
Transferts(j)  = Σ envois budget → pots − Σ retraits pots → budget

Disponible(j)  = Disponible(j−1) + Allocation(j) + Revenus(j) − Dépenses(j) − Transferts(j)
Disponible(début − 1) = 0
```

- Le déficit se reporte comme le surplus (disponible négatif affiché en rouge).
- Étalement sur N jours : montant / N par jour à partir de la date de la dépense.
- Vérification avec les captures : aujourd'hui 40,47 − 10,00 = **30,47** ; dimanche : excédent 30,47 + budget quotidien 40,47 = **70,93** ; lundi : 111,40.

**Écran d'accueil**
- Grand cercle « Budget du jour » = `Disponible(aujourd'hui)`.
- Courbe : aujourd'hui + jours suivants projetés (allocations futures, dépenses futures déjà saisies ou étalées).
- Info-bulle d'un jour : Excédent = `Disponible(j−1)`, Budget quotidien = `Allocation(j)`, Total.
- Bouton `+` → saisie. Interrupteur tirelire → vue des pots.

### 2.3 Saisie (flux unique)

1. `+` → choix de la catégorie, onglets **Dépense** / **Revenu**.
   - Onglet Dépense : la catégorie « Investissement » ouvre le formulaire d'**achat**.
   - Onglet Revenu : la catégorie « Revenus d'investissement » ouvre le formulaire de **vente** ou de **dividende**.
2. Formulaire, clavier numérique en priorité :

| Champ | Dépense | Revenu | Achat | Vente / Dividende |
|---|---|---|---|---|
| Montant, mémo | ✓ | ✓ | ✓ (montant total, frais inclus) | ✓ (montant net reçu) |
| Date (Aujourd'hui / autre) | ✓ | ✓ | ✓ | ✓ |
| Répétition (Non / Quotidien / Hebdo / Mensuel / Annuel) | ✓ | ✓ + affichage €/jour | — | — |
| Période d'application | si récurrent | si récurrent | — | — |
| Étaler sur N jours | ✓ (ponctuel) | — | — | — |
| Budget ou un pot | source (ponctuel) | destination (ponctuel) | source | destination |
| Actif (autocomplétion + création) | — | — | ✓ | ✓ |
| Opération | — | — | Achat | Vente / Dividende |
| Quantité, frais, prix unitaire calculé | — | — | ✓ | ✓ vente ; quantité optionnelle pour un dividende |

3. Règles :
   - Une vente supérieure à la quantité détenue est refusée.
   - Un récurrent est toujours imputé au budget. Une charge payée depuis un pot se saisit à la main à chaque occurrence.
   - Une grosse vente versée au budget gonfle le disponible d'autant : choisir un pot comme destination pour l'éviter.

### 2.4 Pots d'épargne
- Nom, icône, couleur, objectif optionnel.
- Solde = entrées (envois depuis le budget, revenus, ventes et dividendes destinés au pot) − sorties (retraits vers le budget, dépenses et achats payés par le pot).
- Solde négatif interdit.

### 2.5 Catégories
- Type : dépense ou revenu, avec un drapeau « investissement » qui active les champs actif / quantité / frais.
- Nom, icône, couleur, ordre, archivage (pas de suppression si utilisée).
- Jeu par défaut à la création du portefeuille :
  - Dépenses : Logement, Charges, Transports, Courses, Sorties & restaurants, Santé, Loisirs, Autre, **Investissement**.
  - Revenus : Salaire, **Revenus d'investissement**.
- Sélecteur d'icônes par groupes (Maison et factures, Alimentation…) comme dans l'app de référence. Pas de premium.

### 2.6 Investissements
- **Vue portefeuille**, par actif : quantité détenue, PRU, investi net, dernier cours saisi, valeur, plus-value latente, plus-value réalisée, dividendes. Totaux.
- **Vue actif** : courbe du cours saisi dans le temps avec les points d'achat et de vente (prix unitaire de chaque opération), ligne du PRU, liste des opérations, saisie d'un nouveau cours.
- Calculs : PRU au coût moyen pondéré (même méthode que la V1), frais inclus dans le coût. Plus-value réalisée d'une vente = produit net − PRU × quantité vendue.

### 2.7 Historique
- Liste groupée par jour, filtres par catégorie et type, modification et suppression.
- Onglet « Récurrents » : règles actives et passées.

### 2.8 Comptes et administration
- Inscription ouverte (email + mot de passe). Chaque compte a son portefeuille, cloisonné.
- Un utilisateur avec `is_admin` accède à la vue admin :
  - liste des comptes (email, nom, date d'inscription, dernière activité) ;
  - **changer le mot de passe** d'un compte (invalide toutes ses sessions) ;
  - **réinitialiser les données** d'un compte (portefeuille, transactions, pots, actifs…) en conservant le compte ;
  - **supprimer un compte** et toutes ses données.
- Garde-fous : confirmation explicite pour chaque action destructive ; un admin ne peut ni se supprimer ni retirer le dernier admin.
- Premier admin : repris de la V1 (`role = 'admin'`) lors de la migration, sinon activé à la main en base.

### 2.9 Hors périmètre
Analytics, export PDF/CSV, cibles d'allocation, objectif global d'investissement, DCA programmé, récurrents payés par un pot, multi-portefeuille, partage, API de cours, multi-devise.

---

## 3. Modèle de données

### 3.1 Principes (changements par rapport à la V1)
- **Montants** : entiers en centimes, toujours positifs ; le sens vient du type.
- **Dates métier** en texte `YYYY-MM-DD` (date locale du portefeuille) au lieu de timestamps : aucun décalage de fuseau, tri lexicographique, identique en SQLite et Postgres. Les timestamps ne servent que pour `created_at` / `updated_at`.
- **Quantités** en entier ×10⁸ au lieu d'un double : sommes exactes, plus besoin d'epsilon. Nécessite un helper `bigint` (le `integer` Postgres est en 32 bits).
- **Booléens** via un helper `bool` (`boolean` en Postgres, `integer` mode booléen en SQLite).
- **Actifs** dans une table dédiée (en V1, texte libre regroupé par casse).
- Données rattachées au **portefeuille** (`wallet_id`) plutôt qu'à l'utilisateur. `wallets.user_id` est unique ; passer à plusieurs portefeuilles revient à retirer cette contrainte.
- Contraintes `CHECK` sur les énumérations et les combinaisons de colonnes. Le helper `table()` de `schema.ts` doit accepter le 3ᵉ argument de Drizzle (index, checks).
- Suppression en cascade (`ON DELETE CASCADE`) depuis `users` et `wallets`, pour que la suppression ou la réinitialisation d'un compte par l'admin soit une seule requête.

### 3.2 Tables

**users** — `id`, `email` (unique), `name`, `password_hash`, `is_admin` (défaut faux), `created_at`, `updated_at`

**sessions** — `id` (texte), `user_id`, `user_agent`, `ip_address`, `created_at`, `last_active_at`, `expires_at` (révocation par appareil, repris tel quel)

**wallets** — `id`, `user_id` (unique), `name`, `start_date`, `end_date?`, `currency` (ISO 4217, défaut `EUR`), `timezone` (IANA, défaut `Europe/Brussels`), `created_at`, `updated_at`

**categories** — `id`, `wallet_id`, `kind` (`expense` | `income`), `is_investment` (défaut faux), `name`, `icon`, `color`, `position`, `archived_at?`, `created_at`

**pots** — `id`, `wallet_id`, `name`, `icon`, `color`, `target_amount?`, `position`, `archived_at?`, `created_at`

**assets** — `id`, `wallet_id`, `name`, `name_key` (minuscules, unique par portefeuille), `ticker?`, `asset_class?` (`etf` | `stock` | `crypto` | `bond` | `other`), `created_at`

**asset_prices** — `id`, `asset_id`, `date`, `unit_price` (entier en millionièmes de devise, pour les actifs à très bas prix), `created_at`. Unique `(asset_id, date)`.

**recurrences** — `id`, `wallet_id`, `category_id`, `kind` (`expense` | `income`), `amount`, `frequency` (`daily` | `weekly` | `monthly` | `yearly`), `start_date`, `end_date?`, `memo?`, `created_at`, `updated_at`

**transactions** — `id`, `wallet_id`, `category_id`, `type` (`expense` | `income` | `buy` | `sell` | `dividend`), `date`, `amount`, `memo?`, `pot_id?`, `spread_days` (≥ 1, défaut 1), `asset_id?`, `quantity?` (×10⁸), `fees` (défaut 0), `created_at`, `updated_at`
- `buy` / `sell` ⇒ `asset_id` et `quantity > 0` obligatoires ; `dividend` ⇒ `asset_id` obligatoire ; `expense` / `income` ⇒ `asset_id` nul.
- `spread_days > 1` uniquement pour `expense`.
- Cohérence type ↔ catégorie, vérifiée côté API (contrainte inter-tables) : `buy` ⇒ catégorie dépense d'investissement ; `sell` / `dividend` ⇒ catégorie revenu d'investissement ; `expense` / `income` ⇒ catégorie non investissement du même sens.
- Index `(wallet_id, date)` et `(asset_id, date)`.

**pot_transfers** — `id`, `wallet_id`, `pot_id`, `direction` (`to_pot` | `from_pot`), `amount`, `date`, `memo?`, `created_at`

### 3.3 Impact des transactions

| Type | `pot_id` nul | `pot_id` renseigné |
|---|---|---|
| `expense`, `buy` | − budget | − pot |
| `income`, `sell`, `dividend` | + budget | + pot |
| récurrence (`recurrences`) | lissée dans l'allocation | — (non autorisé) |

Une transaction datée avant `wallets.start_date` n'a **aucun impact** sur le budget ni sur les pots. C'est ce qui neutralise l'historique d'investissements migré.

### 3.4 Calcul
- Calcul à la volée côté serveur, dans une fonction pure (`shared/utils/budget.ts`, partagée avec le front pour les aperçus « €/jour ») : pas de table de soldes à maintenir. Le volume (quelques centaines de jours × quelques dizaines de règles) est négligeable ; un cache pourra être ajouté plus tard si besoin.
- Tests unitaires (vitest) sur cette fonction : fin de mois, février et années bissextiles, étalement, déficit reporté, règle modifiée « à partir de », début de portefeuille en milieu de mois, fuseau horaire.

---

## 4. Migration V1 → V2

### 4.1 Principe
- **Nouvelle base V2** (nouvelle base Postgres ou nouveau fichier SQLite). La base V1 n'est jamais modifiée : la V1 reste utilisable et le retour arrière est immédiat.
- Ne **jamais** lancer `db:push` V2 sur la base V1 : drizzle-kit supprimerait ou modifierait les tables V1.
- Les migrations Drizzle V2 repartent d'une baseline `0000` ; l'historique V1 reste sur `V1/main`.

### 4.2 Date de bascule
La bascule peut avoir lieu n'importe quel jour. Les dépenses V1 n'étant pas migrées, les jours du mois déjà écoulés sont **considérés comme dépensés à hauteur de la moyenne journalière**, et les jours restants gardent cette même moyenne.

En pratique, cela revient à fixer `start_date` = **jour de bascule** avec un disponible de départ à 0 :
- le lissage mensuel reste `montant / nombre de jours du mois` : chaque jour restant reçoit la moyenne, sans recalcul sur les seuls jours restants ;
- les jours écoulés n'apportent ni surplus ni déficit ;
- les opérations d'investissement V1 de ces jours-là sont antérieures à `start_date` : elles n'impactent pas le budget.

Exemple : salaire de 2 335 €, bascule le 15 septembre (30 jours) → du 15 au 30, 16 jours × 77,83 € ; les 14 premiers jours sont réputés consommés.

### 4.3 Script `scripts/migrate-from-v1.ts`
- Lit `V1_DATABASE_URL`, écrit dans `DATABASE_URL`. Exécuté une fois.
- Mode `--dry-run`, exécution dans une transaction, refus si la base cible contient déjà des données.

| V1 | V2 | Règle |
|---|---|---|
| `users` | `users` | email, nom, hash bcrypt copié tel quel (les mots de passe restent valides), `created_at`. `role = 'admin'` → `is_admin = true` |
| — | `wallets` | 1 par utilisateur : « Mon portefeuille », `start_date` = jour de bascule, EUR, Europe/Brussels |
| — | `categories` | jeu par défaut, dont « Investissement » (dépense) et « Revenus d'investissement » (revenu) |
| `investments.asset` (distinct, insensible à la casse) | `assets` | `name` = graphie la plus fréquente |
| `investments` | `transactions` | `buy` → catégorie Investissement ; `sell` / `dividend` → catégorie Revenus d'investissement. `amount` identique (centimes) ; `quantity` = round(q × 10⁸) ; `fees` = 0 (frais déjà inclus dans le montant V1) ; `date` = partie UTC du timestamp V1 (la V1 enregistre `YYYY-MM-DD` à minuit UTC) ; `note` → `memo` ; `pot_id` nul |
| `investment_targets.current_value_override` | `asset_prices` | cours unitaire = valeur / quantité détenue, daté du jour de migration. Préserve la dernière valorisation manuelle |
| `sessions`, `categories`, `expenses`, `investment_goals`, `investment_targets` (%) | — | non migrés |

### 4.4 Contrôles post-migration (bloquants)
Par utilisateur et par actif, V1 comparée à V2 : nombre d'opérations, quantité détenue, coût total, PRU, dividendes cumulés. Rapport affiché ; annulation de la transaction en cas d'écart.

Répétition obligatoire sur une copie de la base de prod avant la bascule réelle.

---

## 5. Stack

- **Conservée** : Nuxt 4, Drizzle (SQLite + Postgres), nuxt-auth-utils, zod, Tailwind 4, date-fns (+ `@date-fns/tz` pour le fuseau du portefeuille), bcrypt (hashes compatibles).
- **Ajouts proposés** (outils existants plutôt que du code maison) :
  - Icônes : `@nuxt/icon` (Iconify). On stocke une clé du type `lucide:shopping-cart` en base.
  - Graphiques : finalement deux petits composants SVG (`BudgetChart`, `PriceChart`) — 3 à 7 points et un nuage de prix ne justifiaient pas une librairie.
  - Tests : vitest pour le moteur de budget.
- **Retirés** : jspdf, jspdf-autotable (export hors périmètre).

---

## 6. Découpage en branches

| # | Branche | Contenu |
|---|---|---|
| 1 | `V2/foundation` | Retrait du code V1 sur `main`, nouveau schéma, baseline de migration, auth (inscription ouverte), layout responsive |
| 2 | `V2/budget-engine` | Moteur de budget + tests, sans UI |
| 3 | `V2/wallet` | Création/édition du portefeuille, catégories par défaut, gestion des catégories |
| 4 | `V2/transactions` | Flux de saisie, historique, récurrents |
| 5 | `V2/home` | Écran « Budget du jour » + courbe |
| 6 | `V2/pots` | Pots, transferts, dépense depuis un pot |
| 7 | `V2/investments` | Actifs, achats/ventes/dividendes, vues portefeuille et actif, cours manuels |
| 8 | `V2/admin` | Vue admin : comptes, mot de passe, réinitialisation, suppression |
| 9 | `V2/migration-v1` | Script de migration + contrôles, répétition sur copie de la prod |
| 10 | Bascule | V2 déployée sur la nouvelle base, V1 arrêtée ou en lecture seule |

1 et 2 en premier. La 9 peut démarrer dès que le schéma de la 1 est figé.

---

## 7. Points tranchés (retours sur la première version)

1. **Inscription** : ouverte, drapeau `is_admin` en base, vue admin (section 2.8).
2. **Ventes et dividendes** : revenus ponctuels via une catégorie de revenu dédiée, distincte du salaire. Ils alimentent le budget ou un pot. *(Remplace la décision initiale « seuls les achats impactent le budget ».)*
3. **DCA** : pas de programmation. Chaque achat est saisi à la main pour conserver le prix réel et un PRU exact.
4. **Date de début des portefeuilles migrés** : jour de bascule ; les jours écoulés du mois sont réputés dépensés à la moyenne journalière, les jours restants gardent la moyenne (voir 4.2).
5. **Récurrents** : loyer, charges, salaire… restent récurrents et lissés dans le budget. Aucun récurrent payé par un pot : ces charges-là se saisissent à la main.
