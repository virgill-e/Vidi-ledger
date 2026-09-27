<template>
  <header class="sticky top-0 z-10 bg-surface-muted/90 backdrop-blur rounded-t-[28px] px-4 pt-3 pb-3">
    <div class="mx-auto w-9 h-1 rounded-full bg-ink/15 mb-3 sm:hidden" />
    <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3 min-h-11">
      <NuxtLink
        v-if="backTo"
        :to="backTo"
        class="size-11 rounded-full bg-surface border border-line flex items-center justify-center hover:bg-surface-muted transition-colors"
        aria-label="Retour"
      >
        <Icon name="lucide:chevron-left" class="size-6" />
      </NuxtLink>
      <span v-else class="size-11" />
      <h1 class="text-center font-semibold text-[17px] truncate">{{ title }}</h1>
      <div class="min-w-11 flex justify-end">
        <slot name="action" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  backTo?: string;
}>();
</script>
