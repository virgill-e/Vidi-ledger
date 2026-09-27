// Wallet categories (archived included), cached across pages.
export const useCategories = () => {
    const categories = useState<Category[] | undefined>('categories', () => undefined);
    const requestFetch = useRequestFetch();

    const refresh = async () => {
        categories.value = await requestFetch<Category[]>('/api/categories');
        return categories.value;
    };

    const ensureLoaded = async () => categories.value ?? refresh();

    const reset = () => {
        categories.value = undefined;
    };

    return { categories, refresh, ensureLoaded, reset };
};
