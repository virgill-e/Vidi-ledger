<template>
  <div class="flex flex-col gap-2">
    <div class="relative h-60 bg-surface rounded-2xl border border-line select-none overflow-hidden">
      <p v-if="!hasData" class="absolute inset-0 flex items-center justify-center text-sm text-ink-muted px-6 text-center">
        Ajoute un achat ou un cours pour voir le graphique.
      </p>
      <template v-else>
        <svg class="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line v-if="pruY !== null" x1="0" x2="100" :y1="pruY" :y2="pruY" class="stroke-ink-muted" stroke-width="1.5" stroke-dasharray="5 4" vector-effect="non-scaling-stroke" />
          <polyline v-if="quotes.length > 1" :points="quoteLine" fill="none" class="stroke-primary" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
        </svg>

        <span class="absolute left-2 top-1.5 text-[11px] text-ink-muted tabular-nums">{{ formatUnitPrice(hi) }}</span>
        <span class="absolute left-2 bottom-6 text-[11px] text-ink-muted tabular-nums">{{ formatUnitPrice(lo) }}</span>
        <span class="absolute left-2 bottom-1.5 text-[11px] text-ink-muted">{{ formatDate(fromDayNumber(minDay)) }}</span>
        <span class="absolute right-2 bottom-1.5 text-[11px] text-ink-muted">{{ formatDate(fromDayNumber(maxDay)) }}</span>
        <!-- Left side: recent trades cluster on the right. -->
        <span v-if="pruY !== null" class="absolute left-[12%] -translate-y-full text-[11px] font-semibold text-ink-muted bg-surface/80 px-1 rounded" :style="{ top: `${pruY}%` }">
          PRU {{ formatUnitPrice(averageCost!) }}
        </span>

        <span
          v-for="q in quotes"
          :key="`q-${q.date}`"
          class="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
          :style="{ left: `${x(q.date)}%`, top: `${y(q.value)}%` }"
        />

        <button
          v-for="(t, i) in tradePoints"
          :key="`t-${t.id}`"
          type="button"
          :class="[
            'absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow',
            t.type === 'buy' ? 'bg-positive' : 'bg-negative',
            selected === i ? 'ring-4 ring-ink/15 z-20' : 'z-10',
          ]"
          :style="{ left: `${x(t.date)}%`, top: `${y(t.value)}%` }"
          :aria-label="`${TRADE_LABELS[t.type]} du ${formatDate(t.date)} à ${formatUnitPrice(t.value)}`"
          @click="selected = selected === i ? null : i"
        />

        <div
          v-if="selectedTrade"
          class="absolute z-30 bg-ink text-white rounded-xl px-3 py-2 text-[12px] shadow-xl pointer-events-none whitespace-nowrap"
          :style="tooltipStyle"
        >
          <p class="font-semibold">{{ TRADE_LABELS[selectedTrade.type] }} · {{ formatDate(selectedTrade.date) }}</p>
          <p class="tabular-nums text-white/80">{{ formatQuantity(selectedTrade.quantity) }} × {{ formatUnitPrice(selectedTrade.value) }} = {{ formatMoney(selectedTrade.amount) }}</p>
        </div>
      </template>
    </div>

    <div v-if="hasData" class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-ink-muted">
      <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-positive" /> Achat</span>
      <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-full bg-negative" /> Vente</span>
      <span v-if="quotes.length" class="flex items-center gap-1.5"><span class="w-4 h-0.5 bg-primary" /> Cours saisis</span>
      <span v-if="averageCost !== null" class="flex items-center gap-1.5"><span class="w-4 border-t-2 border-dashed border-ink-muted" /> PRU</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  trades: AssetDetail['trades'];
  prices: AssetPrice[];
  /** Current PRU, cents per unit. */
  averageCost: number | null;
}>();

const { formatMoney, formatUnitPrice, formatQuantity, formatDate } = useFormat();

const quotes = computed(() => props.prices.map((p) => ({ date: p.date, value: unitPriceToCents(p.unitPrice) })));
const tradePoints = computed(() =>
  props.trades
    .filter((t) => t.unitPrice !== null && (t.type === 'buy' || t.type === 'sell'))
    .map((t) => ({ id: t.id, type: t.type as 'buy' | 'sell', date: t.date, value: t.unitPrice!, quantity: t.quantity ?? 0, amount: t.amount }))
    .reverse(),
);
const hasData = computed(() => quotes.value.length > 0 || tradePoints.value.length > 0);

// Time axis: first to last point (±3 days when everything is on one day).
const days = computed(() => [...quotes.value, ...tradePoints.value].map((p) => toDayNumber(p.date)));
const minDay = computed(() => (days.value.length ? Math.min(...days.value) - (spread.value ? 0 : 3) : 0));
const maxDay = computed(() => (days.value.length ? Math.max(...days.value) + (spread.value ? 0 : 3) : 0));
const spread = computed(() => days.value.length > 0 && Math.max(...days.value) > Math.min(...days.value));
const x = (date: string) => 8 + ((toDayNumber(date) - minDay.value) / Math.max(1, maxDay.value - minDay.value)) * 84;

// Price axis: every quote, trade price and the PRU, with some headroom.
const values = computed(() => [
  ...quotes.value.map((q) => q.value),
  ...tradePoints.value.map((t) => t.value),
  ...(props.averageCost !== null ? [props.averageCost] : []),
]);
const range = computed(() => {
  const min = Math.min(...values.value);
  const max = Math.max(...values.value);
  const pad = max > min ? (max - min) * 0.12 : Math.max(1, max * 0.05);
  return { lo: Math.max(0, min - pad), hi: max + pad };
});
const lo = computed(() => range.value.lo);
const hi = computed(() => range.value.hi);
const y = (value: number) => 10 + (1 - (value - lo.value) / (hi.value - lo.value)) * 74;

const quoteLine = computed(() => quotes.value.map((q) => `${x(q.date)},${y(q.value)}`).join(' '));
const pruY = computed(() => (props.averageCost !== null ? y(props.averageCost) : null));

const selected = ref<number | null>(null);
const selectedTrade = computed(() => (selected.value !== null ? tradePoints.value[selected.value] : undefined));
// Keep the tooltip inside the chart: anchor it left/right depending on the point.
const tooltipStyle = computed(() => {
  const t = selectedTrade.value!;
  const left = x(t.date);
  const top = y(t.value);
  return {
    top: `calc(${top}% ${top > 45 ? '- 3.75rem' : '+ 0.9rem'})`,
    ...(left > 55 ? { right: `${100 - left}%` } : { left: `${left}%` }),
  };
});
</script>
