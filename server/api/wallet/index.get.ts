// The user's wallet, or null before onboarding.
export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    return (await findUserWallet(user.id)) ?? null;
});
