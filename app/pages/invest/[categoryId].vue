<template>
  <InvestmentForm :category="category" :assets="assets" :pots="pots" :back-to="`/add?kind=${category.kind}`" :initial-asset="typeof route.query.asset === 'string' ? route.query.asset : undefined" />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const requestFetch = useRequestFetch();
const { categories, ensureLoaded } = useCategories();
const [assets, pots] = await Promise.all([
  requestFetch<AssetSummary[]>('/api/assets'),
  requestFetch<Pot[]>('/api/pots'),
  ensureLoaded(),
]);

const found = categories.value?.find((c) => c.id === Number(route.params.categoryId));
if (!found || !found.isInvestment || found.archivedAt) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' });
}
const category: Category = found;
</script>
