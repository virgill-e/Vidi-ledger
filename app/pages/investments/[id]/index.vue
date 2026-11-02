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
        <MetricCell v-if="p.rewards > 0" label="Reçu en récompenses" :value="`${formatQuantity(p.rewards)} part(s)`" />
        <MetricCell v-if="p.fees > 0" label="Payé en frais" :value="`${formatQuantity(p.fees)} part(s)`" />
      </div>

      <!-- Above the chart and the list: reachable without scrolling a long history. -->
      <div v-if="buyCategory || incomeCategory" class="flex gap-3 -mt-2">
        <NuxtLink v-if="buyCategory" :to="`/invest/${buyCategory.id}?asset=${encodeURIComponent(detail.asset.name)}`" class="flex-1 h-12 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:brightness-105">
          <Icon name="lucide:plus" class="size-5" />
          Nouvel achat
        </NuxtLink>
        <NuxtLink v-if="incomeCategory" :to="`/invest/${incomeCategory.id}?type=adjust&asset=${encodeURIComponent(detail.asset.name)}`" class="flex-1 h-12 rounded-2xl bg-surface border border-line text-primary font-semibold flex items-center justify-center gap-2 hover:bg-primary-soft/60" title="Ajuster au solde réel (staking, frais)">
          <Icon name="lucide:refresh-cw" class="size-5" />
          Ajuster le solde
        </NuxtLink>
      </div>

      <PriceChart :trades="detail.trades" :average-cost="p.averageCost" />

      <UiGroup title="Opérations">
        <NuxtLink
          v-for="t in detail.trades"
          :key="t.id"
          :to="`/trades/${t.id}?from=/investments/${detail.asset.id}`"
          class="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60"
        >
          <span :class="['text-[11px] font-bold uppercase rounded-md px-1.5 py-0.5 w-24 text-center shrink-0', badgeClass(t.type)]">{{ TRADE_LABELS[t.type as TradeType] }}</span>
          <span class="grow min-w-0">
            <span class="block text-[13px] text-ink-muted">{{ formatDate(t.date) }}</span>
            <span v-if="t.unitPrice !== null" class="block truncate tabular-nums text-[14px]">{{ formatQuantity(t.quantity!) }} × {{ formatUnitPrice(t.unitPrice) }}</span>
            <span v-else-if="unitsOnly(t.type)" class="block truncate tabular-nums text-[14px]">{{ t.type === 'reward' ? '+' : '−' }}{{ formatQuantity(t.quantity!) }} part(s)</span>
          </span>
          <span v-if="unitsOnly(t.type)" class="tabular-nums font-medium text-ink-muted">{{ formatMoney(0) }}</span>
          <span v-else :class="['tabular-nums font-medium', t.type !== 'buy' && 'text-positive']">{{ formatMoney(t.type === 'buy' ? -t.amount : t.amount, { signed: true }) }}</span>
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
const incomeCategory = computed(() => categories.value?.find((c) => c.isInvestment && c.kind === 'income' && !c.archivedAt));

const badgeClass = (type: string) =>
  type === 'buy' ? 'bg-positive/10 text-positive'
    : type === 'sell' ? 'bg-negative/10 text-negative'
    : type === 'reward' ? 'bg-amber-100 text-amber-700'
    : type === 'fee' ? 'bg-surface-muted text-ink-muted'
    : 'bg-primary-soft text-primary';
</script>
