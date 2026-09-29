<template>
  <form @submit.prevent="submit">
    <SheetHeader :title="toPot ? 'Mettre de côté' : 'Reprendre'" :icon="pot.icon" :icon-color="pot.color" :back-to="`/pots/${pot.id}`">
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
      <p class="text-center text-sm text-ink-muted">
        <template v-if="toPot">Du budget vers « {{ pot.name }} » · disponible aujourd'hui : <strong :class="available < 0 ? 'text-negative' : 'text-ink'">{{ formatMoney(available) }}</strong></template>
        <template v-else>De « {{ pot.name }} » vers le budget · solde du pot : <strong class="text-ink">{{ formatMoney(pot.balance) }}</strong></template>
      </p>

      <AmountInput v-model="amountText" :invalid="amountText !== '' && (amount === null || exceedsPot)" />
      <p v-if="exceedsPot" class="text-sm text-negative text-center -mt-2">Le pot ne contient que {{ formatMoney(pot.balance) }}.</p>

      <input
        v-model="memo"
        type="text"
        maxlength="200"
        placeholder="Ajouter un mémo"
        aria-label="Mémo"
        class="h-14 rounded-2xl bg-surface border border-line text-center text-[16px] outline-none focus:border-primary"
      />

      <DateChoice v-model="date" :today="today" :min="wallet.startDate" :max="wallet.endDate ?? undefined" />

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>
    </div>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const requestFetch = useRequestFetch();
const { formatMoney } = useFormat();
const { wallet: walletState } = useWallet();
const wallet = walletState.value!;

const id = Number(route.params.id);
const toPot = route.query.direction !== 'from_pot';
const [pots, budget] = await Promise.all([
  requestFetch<Pot[]>('/api/pots'),
  requestFetch<BudgetResponse>('/api/budget', { query: { days: 1 } }),
]);
const found = pots.find((p) => p.id === id && !p.archivedAt);
if (!found) throw createError({ statusCode: 404, statusMessage: 'Pot not found' });
const pot: Pot = found;
const available = budget.days[0]?.available ?? 0;

const today = todayIn(wallet.timezone);
const amountText = ref('');
const amount = computed(() => parseAmount(amountText.value));
const exceedsPot = computed(() => !toPot && amount.value !== null && Math.round(amount.value * 100) > pot.balance);
const memo = ref('');
const date = ref(clampDate(today, wallet.startDate, wallet.endDate));

const canSubmit = computed(() => amount.value !== null && !exceedsPot.value);
const saving = ref(false);
const error = ref('');

const submit = async () => {
  if (!canSubmit.value) return;
  saving.value = true;
  error.value = '';
  try {
    await $fetch(`/api/pots/${pot.id}/transfers`, {
      method: 'POST',
      body: { direction: toPot ? 'to_pot' : 'from_pot', amount: amount.value, date: date.value, memo: memo.value || null },
    });
    await navigateTo(`/pots/${pot.id}`);
  } catch (err: any) {
    error.value = apiErrorMessage(err, "Impossible d'enregistrer.");
  } finally {
    saving.value = false;
  }
};
</script>
