// Movement just saved from the add form, shown briefly in the home circle.
export interface LastAdded {
    amount: number; // cents, signed (negative = expense)
    name: string;
    icon: string;
}

export const useLastAdded = () => useState<LastAdded | null>('lastAdded', () => null);
