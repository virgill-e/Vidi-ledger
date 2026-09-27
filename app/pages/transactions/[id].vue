<template>
  <form @submit.prevent="save">
    <SheetHeader title="Modifier" :icon="category?.icon" :icon-color="category?.color" back-to="/history">
      <template #action>
        <button
          type="submit"
          :disabled="amount === null || saving"
          class="size-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 disabled:opacity-40"
          aria-label="Enregistrer"
        >
          <Icon :name="saving ? 'lucide:loader-circle' : 'lucide:check'" :class="['size-6', saving && 'animate-spin']" />
        </button>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-4">
      <AmountInput v-model="amountText" :invalid="amount === null" />

      <input
        v-model="memo"
        type="text"
        maxlength="200"
        placeholder="Ajouter un mémo"
        aria-label="Mémo"
        class="h-14 rounded-2xl bg-surface border border-line text-center text-[16px] outline-none focus:border-primary"
      />

      <DateChoice v-model="date" :today="today" :min="wallet.startDate" :max="wallet.endDate ?? undefined" />

      <div class="flex flex-col">
        <SelectRow v-model="categoryId" label="Catégorie" :options="categoryOptions" />
        <SelectRow
          v-if="potOptions.length > 1"
          v-model="potId"
          :label="tx.type === 'expense' ? 'Payé depuis' : 'Versé sur'"
          :options="potOptions"
          :active="potId !== ''"
        />
        <SelectRow
          v-if="tx.type === 'expense'"
          v-model="spread"
          label="Étaler sur plusieurs jours"
          :options="spreadOptions"
          :active="spread !== '1'"
        />
      </div>

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

      <ConfirmDelete :loading="deleting" @confirm="remove">
        Supprimer ce mouvement ? Le budget des jours concernés sera recalculé.
      </ConfirmDelete>
    </div>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const requestFetch = useRequestFetch();
const { wallet: walletState } = useWallet();
const wallet = walletState.value!;
const { categories, ensureLoaded } = useCategories();

const [tx, pots] = await Promise.all([
  requestFetch<Transaction>(`/api/transactions/${route.params.id}`).catch(() => null),
  requestFetch<Pot[]>('/api/pots'),
  ensureLoaded(),
]);
if (!tx || (tx.type !== 'expense' && tx.type !== 'income')) {
  throw createError({ statusCode: 404, statusMessage: 'Transaction not found' });
}

const today = todayIn(wallet.timezone);
const amountText = ref(centsToInput(tx.amount));
const amount = computed(() => parseAmount(amountText.value));
const memo = ref(tx.memo ?? '');
const date = ref(tx.date);
const spread = ref(String(tx.spreadDays));
const categoryId = ref(String(tx.categoryId));

const category = computed(() => categories.value?.find((c) => c.id === Number(categoryId.value)));
// Same kind only (the sign never changes); the current one stays even if archived.
const categoryOptions = computed(() =>
  (categories.value ?? [])
    .filter((c) => c.kind === tx.type && !c.isInvestment && (!c.archivedAt || c.id === tx.categoryId))
    .map((c) => ({ value: String(c.id), label: c.name })),
);
// '' = the budget. The current pot stays listed even if archived since.
const potId = ref(tx.potId ? String(tx.potId) : '');
const { formatMoney } = useFormat();
const potOptions = [
  { value: '', label: 'Budget' },
  ...pots.filter((p) => !p.archivedAt || p.id === tx.potId).map((p) => ({ value: String(p.id), label: `${p.name} (${formatMoney(p.balance)})` })),
];
const spreadOptions = SPREAD_OPTIONS.map((n) => ({ value: String(n), label: n === 1 ? 'Non' : `${n} jours` }));

const saving = ref(false);
const deleting = ref(false);
const error = ref('');

const save = async () => {
  if (amount.value === null) return;
  saving.value = true;
  error.value = '';
  try {
    await $fetch(`/api/transactions/${tx.id}`, {
      method: 'PATCH',
      body: {
        categoryId: Number(categoryId.value),
        amount: amount.value,
        date: date.value,
        memo: memo.value || null,
        potId: potId.value ? Number(potId.value) : null,
        ...(tx.type === 'expense' ? { spreadDays: Number(spread.value) } : {}),
      },
    });
    await navigateTo('/history');
  } catch (err: any) {
    error.value = err?.data?.statusMessage === 'Insufficient pot balance'
      ? 'Solde du pot insuffisant.'
      : err?.data?.statusMessage || "Impossible d'enregistrer.";
  } finally {
    saving.value = false;
  }
};

const remove = async () => {
  deleting.value = true;
  try {
    await $fetch(`/api/transactions/${tx.id}`, { method: 'DELETE' });
    await navigateTo('/history');
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Impossible de supprimer.';
    deleting.value = false;
  }
};
</script>
