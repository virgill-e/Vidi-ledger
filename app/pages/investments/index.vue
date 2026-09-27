<template>
  <div>
    <SheetHeader title="Investissements" back-to="/">
      <template #action>
        <NuxtLink v-if="buyCategory" :to="`/invest/${buyCategory.id}`" class="size-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30" aria-label="Nouvel achat">
          <Icon name="lucide:plus" class="size-6" />
        </NuxtLink>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-6">
      <div v-if="!assets.length" class="bg-surface rounded-2xl p-6 text-center flex flex-col items-center gap-3">
        <Icon name="lucide:chart-line" class="size-10 text-primary" />
        <p class="text-ink-muted">Aucun investissement. Ajoute un achat avec + → Investissement.</p>
      </div>

      <template v-else>
        <div class="bg-surface rounded-2xl p-4 grid grid-cols-2 gap-4">
          <div class="col-span-2 text-center">
            <p class="text-sm text-ink-muted font-medium">Valeur{{ allQuoted ? '' : ' estimée' }}</p>
            <p class="text-4xl font-light tracking-tight tabular-nums">{{ formatMoney(totals.value) }}</p>
            <p v-if="!allQuoted" class="text-[12px] text-ink-muted mt-1">Sans cours saisi, un actif compte pour son prix de revient.</p>
          </div>
          <MetricCell label="Prix de revient" :value="formatMoney(totals.cost)" />
          <MetricCell label="+/- latente" :value="formatMoney(totals.unrealized, { signed: true })" :tone="totals.unrealized" />
          <MetricCell label="+/- réalisée" :value="formatMoney(totals.realized, { signed: true })" :tone="totals.realized" />
          <MetricCell label="Dividendes" :value="formatMoney(totals.dividends)" />
        </div>

        <UiGroup v-if="open.length" title="Positions">
          <NuxtLink v-for="a in open" :key="a.id" :to="`/investments/${a.id}`" class="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60">
            <span class="grow min-w-0">
              <span class="block truncate font-medium">{{ a.name }}<span v-if="a.ticker" class="text-ink-muted font-normal"> · {{ a.ticker }}</span></span>
              <span class="block text-[13px] text-ink-muted truncate">{{ formatQuantity(a.position.quantity) }} part(s) · PRU {{ formatUnitPrice(a.position.averageCost!) }}</span>
            </span>
            <span class="text-right shrink-0">
              <span class="block tabular-nums font-semibold">{{ formatMoney(a.position.value ?? a.position.costBasis) }}</span>
              <span v-if="a.position.unrealizedPnL !== null" :class="['block text-[13px] tabular-nums', toneClass(a.position.unrealizedPnL)]">
                {{ percent(a.position.unrealizedPnL, a.position.costBasis) }}
              </span>
              <span v-else class="block text-[13px] text-ink-muted">sans cours</span>
            </span>
          </NuxtLink>
        </UiGroup>

        <UiGroup v-if="closed.length" title="Positions clôturées">
          <NuxtLink v-for="a in closed" :key="a.id" :to="`/investments/${a.id}`" class="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60">
            <span class="grow min-w-0 truncate">{{ a.name }}</span>
            <span :class="['tabular-nums', toneClass(a.position.realizedPnL)]">{{ formatMoney(a.position.realizedPnL, { signed: true }) }}</span>
          </NuxtLink>
        </UiGroup>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const { formatMoney, formatUnitPrice, formatQuantity } = useFormat();
const { categories, ensureLoaded } = useCategories();
const [assets] = await Promise.all([useRequestFetch()<AssetSummary[]>('/api/assets'), ensureLoaded()]);
const buyCategory = computed(() => categories.value?.find((c) => c.isInvestment && c.kind === 'expense' && !c.archivedAt));

const open = computed(() => assets.filter((a) => a.position.quantity > 0));
const closed = computed(() => assets.filter((a) => a.position.quantity === 0));
const allQuoted = computed(() => open.value.every((a) => a.position.value !== null));

const totals = computed(() => ({
  value: open.value.reduce((s, a) => s + (a.position.value ?? a.position.costBasis), 0),
  cost: open.value.reduce((s, a) => s + a.position.costBasis, 0),
  unrealized: open.value.reduce((s, a) => s + (a.position.unrealizedPnL ?? 0), 0),
  realized: assets.reduce((s, a) => s + a.position.realizedPnL, 0),
  dividends: assets.reduce((s, a) => s + a.position.dividends, 0),
}));

const toneClass = (cents: number) => (cents > 0 ? 'text-positive' : cents < 0 ? 'text-negative' : 'text-ink-muted');
const percent = (pnl: number, cost: number) =>
  cost > 0 ? new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(pnl / cost) : '—';
</script>
