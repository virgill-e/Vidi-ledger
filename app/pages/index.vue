<template>
  <div class="grow flex flex-col items-center justify-center gap-8 py-8">
    <div class="size-72 sm:size-80 rounded-full border border-white/70 flex flex-col items-center justify-center text-center px-10">
      <span class="text-white/70 text-sm font-medium">Budget du jour</span>
      <span class="text-5xl font-light tracking-tight mt-2">—</span>
    </div>

    <NuxtLink to="/history" class="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-5 h-14 px-5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center gap-2 font-medium transition-colors">
      <Icon name="lucide:history" class="size-5" />
      Historique
    </NuxtLink>
    <NuxtLink
      to="/add"
      class="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-5 size-16 rounded-full bg-sky-300/90 text-ink shadow-xl shadow-black/15 flex items-center justify-center hover:brightness-105 transition"
      aria-label="Ajouter un mouvement"
    >
      <Icon name="lucide:plus" class="size-8" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'wallet' });
</script>
