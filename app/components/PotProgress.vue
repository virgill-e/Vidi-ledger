<template>
  <div v-if="target" class="flex flex-col gap-1">
    <div class="h-2 rounded-full bg-ink/10 overflow-hidden">
      <div class="h-full rounded-full transition-all" :style="{ width: `${percent}%`, backgroundColor: color }" />
    </div>
    <span class="text-[12px] text-ink-muted tabular-nums">{{ formatMoney(balance) }} / {{ formatMoney(target) }} · {{ percent }} %</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  balance: number;
  target: number | null;
  color: string;
}>();

const { formatMoney } = useFormat();
const percent = computed(() => (props.target ? Math.min(100, Math.max(0, Math.round((props.balance / props.target) * 100))) : 0));
</script>
