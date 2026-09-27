<template>
  <div class="grow flex flex-col items-center justify-center gap-8 py-8">
    <div class="size-72 sm:size-80 rounded-full border border-white/70 flex flex-col items-center justify-center text-center px-10">
      <span class="text-white/70 text-sm font-medium">Budget du jour</span>
      <span class="text-5xl font-light tracking-tight mt-2">—</span>
    </div>
    <p class="text-white/85 text-center max-w-sm">
      Bonjour {{ user?.name }}. Le portefeuille et le budget journalier arrivent dans les prochaines étapes.
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const { user } = useUserSession();
</script>
