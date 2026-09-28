<template>
  <form @submit.prevent="submit">
    <SheetHeader :title="trade ? TRADE_LABELS[type] : category.name" :icon="category.icon" :icon-color="category.color" :back-to="backTo">
      <template #action>
        <button
          type="submit"
          :disabled="!canSubmit || saving"
          class="size-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 disabled:opacity-40"
          aria-label="Valider"
        >
          <Icon :name="saving ? 'lucide:loader-circle' : 'lucide:check'" :class="['size-6', saving && 'animate-spin']" />
        </button>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-4">
      <UiSegmented v-if="!trade && category.kind === 'income'" v-model="type" :options="incomeTypes" />

      <div v-if="!trade" class="flex flex-col gap-1.5">
        <input
          v-model="assetName"
          type="text"
          list="asset-names"
          maxlength="60"
          autocomplete="off"
          placeholder="Actif (ex. VWCE, Bitcoin…)"
          aria-label="Actif"
          class="h-14 rounded-2xl bg-surface border border-line px-4 text-[16px] outline-none focus:border-primary"
        />
        <datalist id="asset-names">
          <option v-for="a in assets" :key="a.id" :value="a.name" />
        </datalist>
        <p v-if="selectedAsset" class="text-[13px] text-ink-muted px-1">
          {{ formatQuantity(selectedAsset.position.quantity) }} part(s) détenue(s)<template v-if="selectedAsset.position.averageCost !== null"> · PRU {{ formatUnitPrice(selectedAsset.position.averageCost) }}</template>
        </p>
        <p v-else-if="assetName.trim()" class="text-[13px] text-primary px-1">Nouvel actif</p>
      </div>
      <div v-else class="h-14 rounded-2xl bg-surface border border-line px-4 flex items-center justify-between">
        <span class="text-ink-muted">Actif</span>
        <span class="font-medium">{{ tradeAsset?.name }}</span>
      </div>

      <p class="text-[13px] font-medium text-ink-muted px-1 -mb-2">{{ amountLabel }}</p>
      <AmountInput v-model="amountText" :invalid="amountText !== '' && amount === null" />

      <div v-if="type !== 'dividend'" class="flex flex-col gap-1">
        <label for="trade-quantity" class="text-[13px] font-medium text-ink-muted px-1">Quantité</label>
        <div class="relative">
          <input
            id="trade-quantity"
            v-model="quantityText"
            type="text"
            inputmode="decimal"
            placeholder="ex. 1,5"
            :class="[
              'w-full h-14 rounded-2xl bg-surface border px-4 text-[16px] tabular-nums outline-none focus:border-primary',
              quantityText && (quantity === null || oversell) ? 'border-negative' : 'border-line',
              maxQuantity !== null && 'pr-20',
            ]"
          />
          <button
            v-if="maxQuantity !== null"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-primary-soft text-primary font-semibold text-sm hover:brightness-95"
            aria-label="Vendre toutes les parts"
            @click="quantityText = formatQuantity(maxQuantity)"
          >
            Max
          </button>
        </div>
      </div>
      <p v-if="oversell" class="text-[13px] text-negative text-center -mt-2">Tu ne détiens que {{ formatQuantity(selectedAsset!.position.quantity) }} part(s).</p>
      <p v-else-if="unitPrice !== null" class="text-center text-sm text-ink-muted -mt-1">
        Prix unitaire : <strong class="text-ink">{{ formatUnitPrice(unitPrice) }}</strong>
      </p>

      <input
        v-model="memo"
        type="text"
        maxlength="200"
        placeholder="Ajouter un mémo"
        aria-label="Mémo"
        class="h-14 rounded-2xl bg-surface border border-line text-center text-[16px] outline-none focus:border-primary"
      />

      <DateChoice v-model="date" :today="today" :max="wallet.endDate ?? undefined" />
      <p v-if="date < wallet.startDate" class="text-[13px] text-ink-muted text-center -mt-2">Antérieur au portefeuille : n'affecte pas le budget.</p>

      <SelectRow
        v-if="potOptions.length > 1"
        v-model="potId"
        :label="type === 'buy' ? 'Payé depuis' : 'Versé sur'"
        :options="potOptions"
        :active="potId !== ''"
      />

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

      <ConfirmDelete v-if="trade" :loading="deleting" @confirm="remove">
        Supprimer cette opération ? La position de l'actif et le budget seront recalculés.
      </ConfirmDelete>
    </div>
  </form>
</template>

<script setup lang="ts">
type TradeType = 'buy' | 'sell' | 'dividend';

const props = defineProps<{
  category: Category;
  assets: AssetSummary[];
  pots: Pot[];
  /** Edit mode. */
  trade?: Transaction;
  backTo: string;
  /** Prefilled asset name (e.g. "Nouvel achat" from an asset page). */
  initialAsset?: string;
}>();

const { wallet: walletState } = useWallet();
const wallet = walletState.value!;
const { formatMoney, formatUnitPrice, formatQuantity } = useFormat();
const lastAdded = useLastAdded();
const today = todayIn(wallet.timezone);

const incomeTypes: { value: TradeType; label: string }[] = [
  { value: 'sell', label: 'Vente' },
  { value: 'dividend', label: 'Dividende' },
];
const type = ref<TradeType>((props.trade?.type as TradeType) ?? (props.category.kind === 'expense' ? 'buy' : 'sell'));

const tradeAsset = computed(() => props.assets.find((a) => a.id === props.trade?.assetId));
const assetName = ref(props.initialAsset ?? '');
const selectedAsset = computed(() =>
  props.trade ? tradeAsset.value : props.assets.find((a) => a.name.toLowerCase() === assetName.value.trim().toLowerCase()),
);

const amountText = ref(props.trade ? centsToInput(props.trade.amount) : '');
const amount = computed(() => parseAmount(amountText.value));
const quantityText = ref(props.trade?.quantity ? formatQuantity(props.trade.quantity) : '');
const quantity = computed(() => parseScaled(quantityText.value, QUANTITY_DECIMALS));
const memo = ref(props.trade?.memo ?? '');
const date = ref(props.trade?.date ?? today);

const amountLabel = computed(() => ({
  buy: 'Montant payé (frais inclus)',
  sell: 'Montant reçu (net de frais)',
  dividend: 'Dividende reçu',
}[type.value]));

const unitPrice = computed(() =>
  amount.value === null ? null : tradeUnitPrice({ type: type.value, amount: Math.round(amount.value * 100), quantity: quantity.value }),
);

// Whole current holding, offered by the "Max" button when selling.
const maxQuantity = computed(() =>
  !props.trade && type.value === 'sell' && selectedAsset.value && selectedAsset.value.position.quantity > 0
    ? selectedAsset.value.position.quantity
    : null,
);

// Client-side hint only (current holding); the API checks the holding at the trade's date.
const oversell = computed(() =>
  !props.trade && type.value === 'sell' && quantity.value !== null
    && (!selectedAsset.value || quantity.value > selectedAsset.value.position.quantity),
);

const potId = ref(props.trade?.potId ? String(props.trade.potId) : '');
const potOptions = [
  { value: '', label: 'Budget' },
  ...props.pots.filter((p) => !p.archivedAt || p.id === props.trade?.potId)
    .map((p) => ({ value: String(p.id), label: `${p.name} (${formatMoney(p.balance)})` })),
];

const canSubmit = computed(() => {
  if (amount.value === null) return false;
  if (!props.trade && !assetName.value.trim()) return false;
  if (type.value !== 'dividend' && quantity.value === null) return false;
  return !oversell.value;
});

const saving = ref(false);
const deleting = ref(false);
const error = ref('');

const submit = async () => {
  if (!canSubmit.value) return;
  saving.value = true;
  error.value = '';
  const common = {
    amount: amount.value,
    date: date.value,
    memo: memo.value || null,
    potId: potId.value ? Number(potId.value) : null,
  };
  try {
    if (props.trade) {
      await $fetch(`/api/investments/${props.trade.id}`, {
        method: 'PATCH',
        body: { ...common, ...(type.value !== 'dividend' ? { quantity: quantityText.value } : {}) },
      });
      await navigateTo(props.backTo);
    } else {
      await $fetch('/api/investments', {
        method: 'POST',
        body: {
          ...common,
          type: type.value,
          categoryId: props.category.id,
          ...(selectedAsset.value ? { assetId: selectedAsset.value.id } : { assetName: assetName.value.trim() }),
          ...(type.value !== 'dividend' ? { quantity: quantityText.value } : {}),
        },
      });
      const cents = Math.round(amount.value! * 100);
      lastAdded.value = { amount: type.value === 'buy' ? -cents : cents, name: selectedAsset.value?.name ?? assetName.value.trim(), icon: props.category.icon };
      await navigateTo('/');
    }
  } catch (err) {
    error.value = apiErrorMessage(err, "Impossible d'enregistrer.");
  } finally {
    saving.value = false;
  }
};

const remove = async () => {
  deleting.value = true;
  try {
    await $fetch(`/api/transactions/${props.trade!.id}`, { method: 'DELETE' });
    await navigateTo(props.backTo);
  } catch (err) {
    error.value = apiErrorMessage(err, 'Impossible de supprimer.');
    deleting.value = false;
  }
};
</script>
