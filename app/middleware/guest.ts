// Pages for signed-out visitors only (login/register): send logged-in users home.
export default defineNuxtRouteMiddleware(() => {
    const { loggedIn } = useUserSession();

    if (loggedIn.value) {
        return navigateTo('/');
    }
});
