// Data export (Settings → Exporter): CSV files per kind of movement, a full
// JSON file and a LISEZMOI.md explaining both, for an AI, a spreadsheet or a
// script. Pure functions: the endpoint loads the rows and zips the result.
// Not a restorable backup (there is no import).

import { QUANTITY_DECIMALS, isTrade, tradeUnitPrice } from '../../shared/utils/portfolio';

export interface ExportRows {
    wallet: { name: string; startDate: string; endDate: string | null; currency: string; timezone: string };
    categories: { id: number; kind: string; isInvestment: boolean; name: string; archivedAt: unknown }[];
    pots: { id: number; name: string; targetAmount: number | null; archivedAt: unknown }[];
    assets: { id: number; name: string; ticker: string | null; assetClass: string | null }[];
    transactions: {
        id: number; date: string; type: string; categoryId: number; amount: number; spreadDays: number;
        potId: number | null; assetId: number | null; quantity: number | null; memo: string | null;
    }[];
    recurrences: {
        id: number; kind: string; categoryId: number | null; potId: number | null; amount: number;
        frequency: string; startDate: string; endDate: string | null; memo: string | null;
    }[];
    potTransfers: { id: number; potId: number; direction: string; amount: number; date: string; memo: string | null }[];
}

export interface ExportOptions {
    /** Inclusive 'YYYY-MM-DD' bounds; none = the whole history. */
    from?: string;
    to?: string;
    /** 'YYYY-MM-DD' in the wallet's timezone, shown in the files. */
    exportedOn: string;
}

const TRADE_TYPES_FR: Record<string, string> = { buy: 'achat', sell: 'vente', dividend: 'dividende', reward: 'recompense', fee: 'frais' };
const FREQUENCIES_FR: Record<string, string> = { daily: 'quotidien', weekly: 'hebdomadaire', monthly: 'mensuel', yearly: 'annuel' };

/** Cents → "1234.50" (dot decimal, no thousands separator), exactly. */
export const centsToDecimal = (cents: number): string => {
    const abs = Math.abs(cents);
    return `${cents < 0 ? '-' : ''}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
};

/** Scaled quantity → "10.4831" (dot decimal, trailing zeros dropped), exactly. */
export const scaledToDecimal = (value: number, decimals = QUANTITY_DECIMALS): string => {
    const digits = String(Math.abs(value)).padStart(decimals + 1, '0');
    const fraction = digits.slice(-decimals).replace(/0+$/, '');
    return `${value < 0 ? '-' : ''}${digits.slice(0, -decimals)}${fraction ? `.${fraction}` : ''}`;
};

const csvField = (value: string | number | null | undefined): string => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** RFC 4180 CSV: comma separator, CRLF line endings, quoted when needed. */
export const toCsv = (header: string[], rows: (string | number | null | undefined)[][]): string =>
    [header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';

const inPeriod = (date: string, { from, to }: ExportOptions) => (!from || date >= from) && (!to || date <= to);

export const buildExport = (rows: ExportRows, options: ExportOptions): Record<string, string> => {
    const categoryName = new Map(rows.categories.map((c) => [c.id, c.name]));
    const potName = new Map(rows.pots.map((p) => [p.id, p.name]));
    const asset = new Map(rows.assets.map((a) => [a.id, a]));

    const byDate = <T extends { date: string; id: number }>(list: T[]) =>
        list.filter((r) => inPeriod(r.date, options)).sort((a, b) => (a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1));
    const transactions = byDate(rows.transactions);
    const potTransfers = byDate(rows.potTransfers);
    // A rule belongs to the period when its application period overlaps it.
    const recurrences = rows.recurrences
        .filter((r) => (!options.to || r.startDate <= options.to) && (!options.from || r.endDate === null || r.endDate >= options.from))
        .sort((a, b) => (a.startDate === b.startDate ? a.id - b.id : a.startDate < b.startDate ? -1 : 1));

    const pot = (id: number | null) => (id === null ? '' : potName.get(id) ?? '');
    const quantity = (q: number | null) => (q === null ? '' : scaledToDecimal(q));

    const expenses = transactions.filter((t) => t.type === 'expense');
    const incomes = transactions.filter((t) => t.type === 'income');
    const trades = transactions.filter((t) => isTrade(t.type));

    const files: Record<string, string> = {
        'depenses.csv': toCsv(
            ['id', 'date', 'categorie', 'montant', 'etale_sur_jours', 'paye_depuis_pot', 'memo'],
            expenses.map((t) => [t.id, t.date, categoryName.get(t.categoryId), centsToDecimal(t.amount), t.spreadDays, pot(t.potId), t.memo]),
        ),
        'revenus.csv': toCsv(
            ['id', 'date', 'categorie', 'montant', 'verse_sur_pot', 'memo'],
            incomes.map((t) => [t.id, t.date, categoryName.get(t.categoryId), centsToDecimal(t.amount), pot(t.potId), t.memo]),
        ),
        'investissements.csv': toCsv(
            ['id', 'date', 'type', 'actif', 'ticker', 'quantite', 'montant', 'prix_unitaire', 'pot', 'memo'],
            trades.map((t) => {
                const a = t.assetId === null ? undefined : asset.get(t.assetId);
                const unit = tradeUnitPrice({ type: t.type as 'buy', amount: t.amount, quantity: t.quantity });
                return [
                    t.id, t.date, TRADE_TYPES_FR[t.type], a?.name, a?.ticker, quantity(t.quantity), centsToDecimal(t.amount),
                    unit === null ? '' : (unit / 100).toFixed(4), pot(t.potId), t.memo,
                ];
            }),
        ),
        'epargne_pots.csv': toCsv(
            ['id', 'nom', 'objectif', 'archive'],
            rows.pots.map((p) => [p.id, p.name, p.targetAmount === null ? '' : centsToDecimal(p.targetAmount), p.archivedAt ? 'oui' : 'non']),
        ),
        'epargne_virements.csv': toCsv(
            ['id', 'date', 'pot', 'sens', 'montant', 'memo'],
            potTransfers.map((t) => [t.id, t.date, pot(t.potId), t.direction === 'to_pot' ? 'budget_vers_pot' : 'pot_vers_budget', centsToDecimal(t.amount), t.memo]),
        ),
        'recurrences.csv': toCsv(
            ['id', 'type', 'categorie', 'pot', 'montant', 'frequence', 'debut', 'fin', 'memo'],
            recurrences.map((r) => [
                r.id, r.potId !== null ? 'versement_pot' : r.kind === 'income' ? 'revenu' : 'depense',
                r.categoryId === null ? '' : categoryName.get(r.categoryId), pot(r.potId), centsToDecimal(r.amount),
                FREQUENCIES_FR[r.frequency] ?? r.frequency, r.startDate, r.endDate, r.memo,
            ]),
        ),
        'categories.csv': toCsv(
            ['id', 'type', 'investissement', 'nom', 'archivee'],
            rows.categories.map((c) => [c.id, c.kind === 'income' ? 'revenu' : 'depense', c.isInvestment ? 'oui' : 'non', c.name, c.archivedAt ? 'oui' : 'non']),
        ),
        'actifs.csv': toCsv(['id', 'nom', 'ticker', 'classe'], rows.assets.map((a) => [a.id, a.name, a.ticker, a.assetClass])),
    };

    // Exact values for scripts: cents and decimal-text quantities, as stored.
    files['vidi-export.json'] = JSON.stringify({
        format: 'vidi-ledger-export',
        version: 1,
        exportedOn: options.exportedOn,
        period: { from: options.from ?? null, to: options.to ?? null },
        units: {
            amountCents: 'centimes entiers, toujours positifs ; le sens vient du type',
            quantity: 'texte décimal exact (point décimal)',
            dates: 'YYYY-MM-DD dans le fuseau du portefeuille',
        },
        wallet: rows.wallet,
        categories: rows.categories.map((c) => ({ id: c.id, kind: c.kind, isInvestment: c.isInvestment, name: c.name, archived: Boolean(c.archivedAt) })),
        pots: rows.pots.map((p) => ({ id: p.id, name: p.name, targetAmountCents: p.targetAmount, archived: Boolean(p.archivedAt) })),
        assets: rows.assets.map((a) => ({ id: a.id, name: a.name, ticker: a.ticker, assetClass: a.assetClass })),
        transactions: transactions.map((t) => ({
            id: t.id, date: t.date, type: t.type, categoryId: t.categoryId, amountCents: t.amount, spreadDays: t.spreadDays,
            potId: t.potId, assetId: t.assetId, quantity: t.quantity === null ? null : scaledToDecimal(t.quantity), memo: t.memo,
        })),
        recurrences: recurrences.map((r) => ({
            id: r.id, kind: r.kind, categoryId: r.categoryId, potId: r.potId, amountCents: r.amount,
            frequency: r.frequency, startDate: r.startDate, endDate: r.endDate, memo: r.memo,
        })),
        potTransfers: potTransfers.map((t) => ({ id: t.id, date: t.date, potId: t.potId, direction: t.direction, amountCents: t.amount, memo: t.memo })),
    }, null, 2);

    const counts = { expenses: expenses.length, incomes: incomes.length, trades: trades.length, transfers: potTransfers.length, recurrences: recurrences.length };
    files['LISEZMOI.md'] = readme(rows.wallet, options, counts);
    return files;
};

const readme = (wallet: ExportRows['wallet'], { from, to, exportedOn }: ExportOptions, n: Record<string, number>) => {
    const period = from || to ? `du ${from ?? 'début'} au ${to ?? exportedOn}` : 'tout l\'historique';
    return `# Export Vidi Ledger — ${wallet.name}

Exporté le ${exportedOn}, ${period}. Devise : ${wallet.currency}. Dates au format AAAA-MM-JJ, dans le fuseau ${wallet.timezone}.
Portefeuille de budget commencé le ${wallet.startDate}${wallet.endDate ? `, terminé le ${wallet.endDate}` : ''}.

Cet export sert à analyser ou retraiter les données. Il ne se réimporte pas dans l'app.

## Fichiers

| Fichier | Contenu | Lignes |
|---|---|---|
| depenses.csv | Dépenses ponctuelles | ${n.expenses} |
| revenus.csv | Revenus ponctuels | ${n.incomes} |
| investissements.csv | Opérations sur les actifs : achat, vente, dividende, récompense, frais | ${n.trades} |
| epargne_virements.csv | Virements entre le budget et les pots d'épargne | ${n.transfers} |
| epargne_pots.csv | Liste des pots d'épargne et de leur objectif | — |
| recurrences.csv | Revenus, dépenses et versements vers un pot qui se répètent | ${n.recurrences} |
| categories.csv, actifs.csv | Listes de référence | — |
| vidi-export.json | Toutes les données ci-dessus avec leurs identifiants et liens, valeurs exactes (montants en centimes) | — |

CSV : séparateur virgule, point décimal (12.50), encodage UTF-8, première ligne = noms des colonnes. Dans Excel en français, ouvrir via Données > À partir d'un fichier texte/CSV.

## Colonnes

- \`montant\` : toujours positif. Le sens vient du fichier ou de la colonne \`type\` / \`sens\` (une dépense diminue le budget, un revenu l'augmente).
- \`depenses.csv\` : \`etale_sur_jours\` = la dépense est répartie à parts égales sur ce nombre de jours à partir de \`date\`. \`paye_depuis_pot\` vide = payée par le budget du jour, sinon par ce pot (alors sans effet sur le budget).
- \`revenus.csv\` : \`verse_sur_pot\` vide = ajouté au budget, sinon versé sur ce pot.
- \`investissements.csv\` :
  - \`achat\` : \`montant\` = somme payée, frais inclus ;
  - \`vente\` : somme nette reçue ;
  - \`dividende\` : somme reçue, sans quantité ;
  - \`recompense\` (staking, airdrop) : parts reçues gratuitement, \`montant\` 0 ;
  - \`frais\` : parts perdues en frais (unstaking), \`montant\` 0.
  - \`prix_unitaire\` = montant / quantité, pour les achats et les ventes. \`pot\` vide = budget.
- \`epargne_virements.csv\` : \`sens\` = \`budget_vers_pot\` (mise de côté) ou \`pot_vers_budget\` (retrait).
- \`recurrences.csv\` : \`type\` = \`revenu\`, \`depense\` ou \`versement_pot\` (somme envoyée automatiquement vers un pot). \`fin\` vide = sans fin. Quand un montant change « à partir du », l'ancienne règle s'arrête la veille et une nouvelle commence : deux lignes à la suite.

## Règles de l'app

- **Budget du jour** = part du jour des revenus récurrents − part du jour des dépenses et versements récurrents. Une règle mensuelle est divisée par le nombre de jours du mois, une annuelle par 365 ou 366, une hebdomadaire par 7.
- Le disponible de la veille, positif ou négatif, se reporte au jour suivant. Il n'y a pas de remise à zéro en fin de mois.
- Chaque jour : disponible = report + budget du jour + revenus ponctuels − dépenses ponctuelles − virements vers les pots + retraits des pots.
- Les achats d'actifs comptent comme des dépenses, les ventes et les dividendes comme des revenus. Les récompenses et les frais en parts n'ont pas d'effet sur le budget.
- Les opérations datées avant le ${wallet.startDate} (début du portefeuille) n'ont aucun effet sur le budget ni sur les pots. C'est le cas de l'historique d'investissements repris de l'ancienne version.
- **Solde d'un pot** = virements budget → pot − retraits pot → budget + versements programmés + revenus, ventes et dividendes versés sur le pot − dépenses et achats payés depuis le pot. Un versement programmé crédite le pot en entier le premier jour de chaque période.
- **Investissements** : suivis au prix d'achat, sans cours de marché. PRU au coût moyen pondéré : chaque vente sort au PRU du moment, la différence avec le montant reçu est la plus-value réalisée. Une récompense entre à coût zéro (le PRU baisse). Des frais en parts gardent le coût sur les parts restantes (le PRU monte).
${from ? '\nAttention : la période ne commence pas au début de l\'historique. Pour recalculer les quantités détenues et le PRU, exporte tout l\'historique.\n' : ''}
## Prompt à copier pour une IA

> Voici l'export de mon application de budget Vidi Ledger : des fichiers CSV et un LISEZMOI.md. Lis d'abord LISEZMOI.md pour comprendre les fichiers, les colonnes et les règles de calcul.
> Ensuite :
> 1. Résume mes dépenses par catégorie et par mois, et compare-les à mes revenus.
> 2. Repère les postes qui augmentent, les dépenses inhabituelles et les abonnements ou charges récurrents.
> 3. Pour mes investissements, donne par actif la quantité détenue, le PRU et le montant investi, calculés avec les règles du LISEZMOI.
> 4. Propose des pistes concrètes pour mieux répartir mon budget et mon épargne.
>
> Ne suppose pas de cours de marché : l'app suit les investissements au prix d'achat. Si une donnée te semble ambiguë, pose-moi la question au lieu de deviner.
`;
};
