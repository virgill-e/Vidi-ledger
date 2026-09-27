<template>
  <header class="w-full max-w-3xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-3">
    <NuxtLink
      to="/settings"
      class="size-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
      aria-label="Réglages"
      title="Réglages"
    >
      <Icon name="lucide:sliders-horizontal" class="size-5" />
    </NuxtLink>
    <span class="text-center font-semibold tracking-tight truncate">{{ wallet?.name }}</span>
    <span class="size-10" />
  </header>
</template>

<script setup lang="ts">
const { wallet } = useWallet();
</script>
