<template>
  <div>
    <SheetHeader :title="detail.asset.name" icon="lucide:chart-line" back-to="/investments">
      <template #action>
        <NuxtLink :to="`/investments/${detail.asset.id}/edit`" class="px-4 h-10 rounded-full bg-surface border border-line flex items-center font-medium text-[15px]">
          Modifier
        </NuxtLink>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-6">
      <p v-if="detail.asset.ticker || detail.asset.assetClass" class="text-center text-sm text-ink-muted -mt-2">
        {{ [detail.asset.ticker, detail.asset.assetClass && ASSET_CLASS_LABELS[detail.asset.assetClass]].filter(Boolean).join(' · ') }}
      </p>

      <div class="bg-surface rounded-2xl p-4 grid grid-cols-2 gap-4">
        <MetricCell label="Quantité" :value="formatQuantity(p.quantity)" />
        <MetricCell label="PRU" :value="p.averageCost !== null ? formatUnitPrice(p.averageCost) : '—'" />
        <MetricCell label="Prix de revient" :value="formatMoney(p.costBasis)" />
        <MetricCell label="+/- réalisée" :value="formatMoney(p.realizedPnL, { signed: true })" :tone="p.realizedPnL" />
        <MetricCell label="Dividendes" :value="formatMoney(p.dividends)" />
        <MetricCell label="Total acheté" :value="formatMoney(p.invested)" />
      </div>

      <PriceChart :trades="detail.trades" :average-cost="p.averageCost" />

      <UiGroup title="Opérations">
        <NuxtLink
          v-for="t in detail.trades"
          :key="t.id"
          :to="`/trades/${t.id}?from=/investments/${detail.asset.id}`"
          class="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60"
        >
          <span :class="['text-[11px] font-bold uppercase rounded-md px-1.5 py-0.5 w-20 text-center shrink-0', badgeClass(t.type)]">{{ TRADE_LABELS[t.type as 'buy'] }}</span>
          <span class="grow min-w-0">
            <span class="block text-[13px] text-ink-muted">{{ formatDate(t.date) }}</span>
            <span v-if="t.unitPrice !== null" class="block truncate tabular-nums text-[14px]">{{ formatQuantity(t.quantity!) }} × {{ formatUnitPrice(t.unitPrice) }}</span>
          </span>
          <span :class="['tabular-nums font-medium', t.type !== 'buy' && 'text-positive']">{{ formatMoney(t.type === 'buy' ? -t.amount : t.amount, { signed: true }) }}</span>
        </NuxtLink>
        <NuxtLink v-if="buyCategory" :to="`/invest/${buyCategory.id}?asset=${encodeURIComponent(detail.asset.name)}`" class="flex items-center gap-3 px-4 min-h-13 text-primary font-medium hover:bg-surface-muted/60">
          <Icon name="lucide:plus" class="size-5" />
          Nouvel achat
        </NuxtLink>
      </UiGroup>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const { formatMoney, formatUnitPrice, formatQuantity, formatDate } = useFormat();
const { categories, ensureLoaded } = useCategories();

const id = Number(route.params.id);
const [initial] = await Promise.all([
  useRequestFetch()<AssetDetail>(`/api/assets/${id}`).catch(() => null),
  ensureLoaded(),
]);
if (!initial) throw createError({ statusCode: 404, statusMessage: 'Asset not found' });

const detail = initial;
const p = detail.position;
const buyCategory = computed(() => categories.value?.find((c) => c.isInvestment && c.kind === 'expense' && !c.archivedAt));

const badgeClass = (type: string) =>
  type === 'buy' ? 'bg-positive/10 text-positive' : type === 'sell' ? 'bg-negative/10 text-negative' : 'bg-primary-soft text-primary';
</script>
