<template>
  <PotForm :pot="pot" />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const pots = await useRequestFetch()<Pot[]>('/api/pots');
const pot = pots.find((p) => p.id === Number(route.params.id));
if (!pot) throw createError({ statusCode: 404, statusMessage: 'Pot not found' });
</script>
