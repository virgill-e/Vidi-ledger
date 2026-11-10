import { describe, expect, it } from 'vitest';
import { strToU8, strFromU8, unzipSync, zipSync } from 'fflate';
import { buildExport, centsToDecimal, scaledToDecimal, toCsv, type ExportRows } from '../server/utils/export';

const rows = (): ExportRows => ({
    wallet: { name: 'Mon portefeuille', startDate: '2026-10-01', endDate: null, currency: 'EUR', timezone: 'Europe/Brussels' },
    categories: [
        { id: 1, kind: 'expense', isInvestment: false, name: 'Courses', archivedAt: null },
        { id: 2, kind: 'income', isInvestment: false, name: 'Salaire', archivedAt: null },
        { id: 3, kind: 'expense', isInvestment: true, name: 'Investissement', archivedAt: null },
        { id: 4, kind: 'income', isInvestment: true, name: "Revenus d'investissement", archivedAt: null },
    ],
    pots: [{ id: 7, name: 'Vacances', targetAmount: 150_000, archivedAt: null }],
    assets: [{ id: 9, name: 'SOL', ticker: null, assetClass: 'crypto' }],
    transactions: [
        { id: 10, date: '2026-10-05', type: 'expense', categoryId: 1, amount: 1_250, spreadDays: 3, potId: null, assetId: null, quantity: null, memo: 'Delhaize, "promo"' },
        { id: 11, date: '2026-10-01', type: 'income', categoryId: 2, amount: 233_500, spreadDays: 1, potId: 7, assetId: null, quantity: null, memo: null },
        { id: 12, date: '2026-05-19', type: 'buy', categoryId: 3, amount: 100_100, spreadDays: 1, potId: null, assetId: 9, quantity: 2_502_189_400, memo: null },
        { id: 13, date: '2026-10-20', type: 'reward', categoryId: 4, amount: 0, spreadDays: 1, potId: null, assetId: 9, quantity: 48_310_000, memo: null },
    ],
    recurrences: [
        { id: 20, kind: 'expense', categoryId: 1, potId: null, amount: 4_000, frequency: 'monthly', startDate: '2026-10-01', endDate: '2026-10-31', memo: 'Proximus' },
        { id: 21, kind: 'expense', categoryId: null, potId: 7, amount: 50_000, frequency: 'monthly', startDate: '2026-11-01', endDate: null, memo: null },
    ],
    potTransfers: [{ id: 30, potId: 7, direction: 'from_pot', amount: 2_000, date: '2026-10-10', memo: null }],
});

const csvLines = (text: string) => text.trimEnd().split('\r\n');

describe('export formatting', () => {
    it('writes money and quantities exactly, with a dot decimal', () => {
        expect(centsToDecimal(1_250)).toBe('12.50');
        expect(centsToDecimal(5)).toBe('0.05');
        expect(centsToDecimal(123_456_789)).toBe('1234567.89');
        expect(scaledToDecimal(2_502_189_400)).toBe('25.021894');
        expect(scaledToDecimal(1)).toBe('0.00000001');
        expect(scaledToDecimal(1_000_000_000)).toBe('10');
    });

    it('quotes CSV fields holding commas, quotes or line breaks', () => {
        expect(toCsv(['a', 'b'], [['x,y', 'il a dit "oui"'], ['ligne\nsuivante', null]]))
            .toBe('a,b\r\n"x,y","il a dit ""oui"""\r\n"ligne\nsuivante",\r\n');
    });
});

describe('buildExport', () => {
    it('splits movements by kind, oldest first, with names instead of ids', () => {
        const files = buildExport(rows(), { exportedOn: '2026-11-10' });
        expect(Object.keys(files).sort()).toEqual([
            'LISEZMOI.md', 'actifs.csv', 'categories.csv', 'depenses.csv', 'epargne_pots.csv', 'epargne_virements.csv',
            'investissements.csv', 'recurrences.csv', 'revenus.csv', 'vidi-export.json',
        ]);
        expect(csvLines(files['depenses.csv']!)).toEqual([
            'id,date,categorie,montant,etale_sur_jours,paye_depuis_pot,memo',
            '10,2026-10-05,Courses,12.50,3,,"Delhaize, ""promo"""',
        ]);
        expect(csvLines(files['revenus.csv']!)[1]).toBe('11,2026-10-01,Salaire,2335.00,Vacances,');
        expect(csvLines(files['investissements.csv']!).slice(1)).toEqual([
            '12,2026-05-19,achat,SOL,,25.021894,1001.00,40.0050,,',
            '13,2026-10-20,recompense,SOL,,0.4831,0.00,,,',
        ]);
        expect(csvLines(files['epargne_virements.csv']!)[1]).toBe('30,2026-10-10,Vacances,pot_vers_budget,20.00,');
        expect(csvLines(files['recurrences.csv']!).slice(1)).toEqual([
            '20,depense,Courses,,40.00,mensuel,2026-10-01,2026-10-31,Proximus',
            '21,versement_pot,,Vacances,500.00,mensuel,2026-11-01,,',
        ]);
    });

    it('keeps exact values and links in the JSON file', () => {
        const json = JSON.parse(buildExport(rows(), { exportedOn: '2026-11-10' })['vidi-export.json']!);
        expect(json).toMatchObject({ format: 'vidi-ledger-export', version: 1, period: { from: null, to: null } });
        expect(json.transactions.find((t: any) => t.id === 12)).toEqual({
            id: 12, date: '2026-05-19', type: 'buy', categoryId: 3, amountCents: 100_100, spreadDays: 1, potId: null, assetId: 9, quantity: '25.021894', memo: null,
        });
        expect(json.pots[0]).toEqual({ id: 7, name: 'Vacances', targetAmountCents: 150_000, archived: false });
    });

    it('limits dated rows to the period and keeps the rules overlapping it', () => {
        const files = buildExport(rows(), { from: '2026-10-06', to: '2026-10-31', exportedOn: '2026-11-10' });
        expect(csvLines(files['depenses.csv']!)).toHaveLength(1);
        expect(csvLines(files['investissements.csv']!).slice(1).map((l) => l.split(',')[0])).toEqual(['13']);
        expect(csvLines(files['epargne_virements.csv']!)).toHaveLength(2);
        expect(csvLines(files['recurrences.csv']!).slice(1).map((l) => l.split(',')[0])).toEqual(['20']);
        expect(csvLines(files['epargne_pots.csv']!)).toHaveLength(2);
        expect(files['LISEZMOI.md']).toContain('du 2026-10-06 au 2026-10-31');
        expect(files['LISEZMOI.md']).toContain('exporte tout l\'historique');
    });

    it('round-trips through a zip with accents intact', () => {
        const files = buildExport(rows(), { exportedOn: '2026-11-10' });
        const zip = zipSync(Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)])));
        const back = unzipSync(zip);
        expect(strFromU8(back['categories.csv']!)).toContain("Revenus d'investissement");
        expect(strFromU8(back['LISEZMOI.md']!)).toContain('Dépenses ponctuelles');
    });
});
