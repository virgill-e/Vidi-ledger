// Admins only (the API re-checks the flag in the database).
export default defineNuxtRouteMiddleware(() => {
    const { loggedIn, user } = useUserSession();
    if (!loggedIn.value) return navigateTo('/login');
    if (!user.value?.isAdmin) return navigateTo('/');
});
