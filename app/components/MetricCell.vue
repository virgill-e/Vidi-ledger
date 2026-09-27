<template>
  <div class="flex flex-col">
    <span class="text-[12px] font-medium text-ink-muted">{{ label }}</span>
    <span :class="['text-lg font-semibold tabular-nums', toneClass]">{{ value }}</span>
    <span v-if="hint" class="text-[11px] text-ink-muted">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string;
  hint?: string;
  /** Colors the value by sign (gains/losses). */
  tone?: number | null;
}>();

const toneClass = computed(() => {
  if (props.tone === undefined || props.tone === null || props.tone === 0) return '';
  return props.tone > 0 ? 'text-positive' : 'text-negative';
});
</script>
