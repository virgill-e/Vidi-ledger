export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    return requireTransaction(event, wallet.id);
});
