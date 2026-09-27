<template>
  <form @submit.prevent="submit">
    <SheetHeader :title="category.name" :icon="category.icon" :icon-color="category.color" :back-to="`/add?kind=${category.kind}`">
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
      <AmountInput v-model="amountText" :invalid="amountText !== '' && amount === null" />

      <input
        v-model="memo"
        type="text"
        maxlength="200"
        placeholder="Ajouter un mémo"
        aria-label="Mémo"
        class="h-14 rounded-2xl bg-surface border border-line text-center text-[16px] outline-none focus:border-primary"
      />

      <DateChoice v-if="repeat === 'none'" v-model="date" :today="today" :min="wallet.startDate" :max="wallet.endDate ?? undefined" />

      <div class="flex flex-col">
        <SelectRow v-model="repeat" label="Répète" :options="repeatOptions" :active="repeat !== 'none'" />
        <p v-if="perDay" class="text-right text-[13px] text-ink-muted -mt-3 mb-1">{{ perDay }} / jour</p>

        <SelectRow
          v-if="repeat === 'none' && category.kind === 'expense'"
          v-model="spread"
          label="Étaler sur plusieurs jours"
          :options="spreadOptions"
          :active="spread !== '1'"
        />

        <template v-if="repeat !== 'none'">
          <p class="text-[13px] font-medium text-ink-muted pt-4 pb-1">Période d'application</p>
          <div class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
            <span>Depuis le début du portefeuille</span>
            <UiToggle v-model="fromWalletStart" label="Depuis le début du portefeuille" />
          </div>
          <label v-if="!fromWalletStart" class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
            <span>Début</span>
            <input v-model="startDate" type="date" required class="bg-surface-muted rounded-lg px-2.5 py-1.5 outline-none" />
          </label>
          <div class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
            <span>Sans fin</span>
            <UiToggle v-model="noEnd" label="Sans fin" />
          </div>
          <label v-if="!noEnd" class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
            <span>Fin</span>
            <input v-model="endDate" type="date" :min="effectiveStart" required class="bg-surface-muted rounded-lg px-2.5 py-1.5 outline-none" />
          </label>
        </template>
      </div>

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>
    </div>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const { wallet: walletState } = useWallet();
const wallet = walletState.value!;
const { categories, ensureLoaded } = useCategories();
await ensureLoaded();

const found = categories.value?.find((c) => c.id === Number(route.params.categoryId));
if (!found || found.archivedAt || found.isInvestment) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' });
}
const category: Category = found;

const { formatMoney } = useFormat();
const today = todayIn(wallet.timezone);

const amountText = ref('');
const amount = computed(() => parseAmount(amountText.value));
const memo = ref('');
const date = ref(today);
const repeat = ref<'none' | Frequency>('none');
const spread = ref('1');
const fromWalletStart = ref(true);
const startDate = ref(today);
const noEnd = ref(true);
const endDate = ref('');

const repeatOptions = [
  { value: 'none', label: 'Non' },
  ...(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => ({ value: f, label: FREQUENCY_LABELS[f] })),
];
const spreadOptions = SPREAD_OPTIONS.map((n) => ({ value: String(n), label: n === 1 ? 'Non' : `${n} jours` }));

const effectiveStart = computed(() => (fromWalletStart.value ? wallet.startDate : startDate.value));

// "77,83 € / jour" preview, in the current month/year like the engine.
const perDay = computed(() => {
  if (repeat.value === 'none' || amount.value === null) return '';
  return formatMoney(Math.round(dailyAmount(Math.round(amount.value * 100), repeat.value, today)));
});

const canSubmit = computed(() => {
  if (amount.value === null) return false;
  if (repeat.value !== 'none' && !noEnd.value && (!endDate.value || endDate.value < effectiveStart.value)) return false;
  return true;
});

const saving = ref(false);
const error = ref('');

const submit = async () => {
  if (!canSubmit.value) return;
  saving.value = true;
  error.value = '';
  try {
    if (repeat.value === 'none') {
      await $fetch('/api/transactions', {
        method: 'POST',
        body: {
          categoryId: category.id,
          amount: amount.value,
          date: date.value,
          memo: memo.value || null,
          spreadDays: Number(spread.value),
        },
      });
    } else {
      await $fetch('/api/recurrences', {
        method: 'POST',
        body: {
          categoryId: category.id,
          amount: amount.value,
          frequency: repeat.value,
          startDate: effectiveStart.value,
          endDate: noEnd.value ? null : endDate.value,
          memo: memo.value || null,
        },
      });
    }
    await navigateTo('/');
  } catch (err: any) {
    error.value = err?.data?.statusMessage || "Impossible d'enregistrer.";
  } finally {
    saving.value = false;
  }
};
</script>
