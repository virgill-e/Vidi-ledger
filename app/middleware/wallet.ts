// Signed-in users with a wallet only; others go to login or onboarding.
export default defineNuxtRouteMiddleware(async () => {
    const { loggedIn } = useUserSession();
    if (!loggedIn.value) return navigateTo('/login');

    const { wallet, refresh } = useWallet();
    if (wallet.value === undefined) await refresh();
    if (!wallet.value) return navigateTo('/onboarding');
});
