// The signed-in user's wallet: `undefined` = not loaded yet, `null` = none
// (onboarding needed). Loaded once by the `wallet` middleware.
export const useWallet = () => {
    const wallet = useState<Wallet | null | undefined>('wallet', () => undefined);
    // Forwards the session cookie when called during SSR.
    const requestFetch = useRequestFetch();

    const refresh = async () => {
        wallet.value = await requestFetch<Wallet | null>('/api/wallet');
        return wallet.value;
    };

    const reset = () => {
        wallet.value = undefined;
    };

    return { wallet, refresh, reset };
};
