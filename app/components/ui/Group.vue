<template>
  <section class="flex flex-col gap-1.5">
    <h2 v-if="title" class="text-[13px] font-medium text-ink-muted px-4">{{ title }}</h2>
    <div class="bg-surface rounded-2xl divide-y divide-line overflow-hidden">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>
