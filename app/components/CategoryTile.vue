<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    class="aspect-square rounded-2xl bg-surface border border-line flex flex-col items-center justify-center gap-2 p-2 text-center hover:border-primary/40 transition-colors"
  >
    <Icon :name="icon" class="size-7" :style="{ color }" />
    <span class="text-[12px] font-semibold leading-tight line-clamp-2 text-ink">{{ name }}</span>
  </component>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components';

defineProps<{
  name: string;
  icon: string;
  color: string;
  to?: string;
}>();
</script>
