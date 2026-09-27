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
        <MetricCell
          label="Valeur"
          :value="p.value !== null ? formatMoney(p.value) : '—'"
          :hint="p.lastPrice !== null ? `${formatUnitPrice(p.lastPrice)} le ${formatDate(p.lastPriceDate!)}` : 'aucun cours saisi'"
        />
        <MetricCell label="+/- latente" :value="p.unrealizedPnL !== null ? formatMoney(p.unrealizedPnL, { signed: true }) : '—'" :tone="p.unrealizedPnL" />
        <MetricCell label="+/- réalisée" :value="formatMoney(p.realizedPnL, { signed: true })" :tone="p.realizedPnL" />
        <MetricCell label="Dividendes" :value="formatMoney(p.dividends)" />
        <MetricCell label="Total acheté" :value="formatMoney(p.invested)" />
      </div>

      <PriceChart :trades="detail.trades" :prices="detail.prices" :average-cost="p.averageCost" />

      <form class="flex flex-col gap-2" @submit.prevent="saveQuote">
        <h2 class="text-[13px] font-medium text-ink-muted px-4">Mettre à jour le cours</h2>
        <div class="bg-surface rounded-2xl p-3 flex items-center gap-2">
          <input v-model="quoteDate" type="date" required aria-label="Date du cours" class="bg-surface-muted rounded-lg px-2.5 py-2 outline-none" />
          <input
            v-model="quoteText"
            type="text"
            inputmode="decimal"
            placeholder="Prix unitaire"
            aria-label="Prix unitaire"
            :class="['grow min-w-0 bg-surface-muted rounded-lg px-3 py-2 outline-none tabular-nums text-right', quoteText && quotePrice === null && 'text-negative']"
          />
          <button type="submit" :disabled="quotePrice === null || savingQuote" class="h-10 px-4 rounded-full bg-primary text-white font-semibold disabled:opacity-40">OK</button>
        </div>
      </form>

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

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

      <UiGroup v-if="detail.prices.length" title="Cours saisis">
        <div v-for="q in [...detail.prices].reverse()" :key="q.id" class="flex items-center gap-3 px-4 py-2.5">
          <span class="grow text-[14px]">{{ formatDate(q.date) }}</span>
          <span class="tabular-nums">{{ formatUnitPrice(unitPriceToCents(q.unitPrice)) }}</span>
          <button
            type="button"
            :class="['h-8 rounded-full text-[13px] font-semibold transition-colors', confirmingQuote === q.id ? 'px-3 bg-negative text-white' : 'w-8 text-ink-muted hover:text-negative']"
            :aria-label="confirmingQuote === q.id ? 'Confirmer la suppression' : 'Supprimer ce cours'"
            @click="removeQuote(q.id)"
          >
            <span v-if="confirmingQuote === q.id">Supprimer</span>
            <Icon v-else name="lucide:trash-2" class="size-4" />
          </button>
        </div>
      </UiGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const { wallet } = useWallet();
const { formatMoney, formatUnitPrice, formatQuantity, formatDate } = useFormat();
const { categories, ensureLoaded } = useCategories();

const id = Number(route.params.id);
const [initial] = await Promise.all([
  useRequestFetch()<AssetDetail>(`/api/assets/${id}`).catch(() => null),
  ensureLoaded(),
]);
if (!initial) throw createError({ statusCode: 404, statusMessage: 'Asset not found' });

const detail = ref<AssetDetail>(initial);
const p = computed(() => detail.value.position);
const buyCategory = computed(() => categories.value?.find((c) => c.isInvestment && c.kind === 'expense' && !c.archivedAt));
const reload = async () => { detail.value = await $fetch<AssetDetail>(`/api/assets/${id}`); };

const badgeClass = (type: string) =>
  type === 'buy' ? 'bg-positive/10 text-positive' : type === 'sell' ? 'bg-negative/10 text-negative' : 'bg-primary-soft text-primary';

const quoteDate = ref(todayIn(wallet.value!.timezone));
const quoteText = ref('');
const quotePrice = computed(() => parseScaled(quoteText.value, UNIT_PRICE_DECIMALS));
const savingQuote = ref(false);
const error = ref('');

const saveQuote = async () => {
  if (quotePrice.value === null) return;
  savingQuote.value = true;
  error.value = '';
  try {
    await $fetch(`/api/assets/${id}/prices`, { method: 'POST', body: { date: quoteDate.value, unitPrice: quoteText.value } });
    quoteText.value = '';
    await reload();
  } catch (err) {
    error.value = apiErrorMessage(err, "Impossible d'enregistrer le cours.");
  } finally {
    savingQuote.value = false;
  }
};

// Two-step delete, like pot transfers.
const confirmingQuote = ref<number | null>(null);
const removeQuote = async (quoteId: number) => {
  if (confirmingQuote.value !== quoteId) {
    confirmingQuote.value = quoteId;
    return;
  }
  confirmingQuote.value = null;
  try {
    await $fetch(`/api/asset-prices/${quoteId}`, { method: 'DELETE' });
    await reload();
  } catch (err) {
    error.value = apiErrorMessage(err, 'Impossible de supprimer.');
  }
};
</script>
