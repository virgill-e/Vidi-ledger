<template>
  <InvestmentForm :category="category" :assets="assets" :pots="pots" :trade="trade" :back-to="backTo" />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const requestFetch = useRequestFetch();
const { categories, ensureLoaded } = useCategories();
const [found, assets, pots] = await Promise.all([
  requestFetch<Transaction>(`/api/transactions/${route.params.id}`).catch(() => null),
  requestFetch<AssetSummary[]>('/api/assets'),
  requestFetch<Pot[]>('/api/pots'),
  ensureLoaded(),
]);
if (!found || (found.type !== 'buy' && found.type !== 'sell' && found.type !== 'dividend')) {
  throw createError({ statusCode: 404, statusMessage: 'Trade not found' });
}
const trade: Transaction = found;
const category = categories.value!.find((c) => c.id === trade.categoryId)!;

// Back to where the trade was opened from (history, asset page, pot).
const backTo = typeof route.query.from === 'string' && route.query.from.startsWith('/') ? route.query.from : '/history';
</script>
