<template>
  <form @submit.prevent="submit">
    <SheetHeader title="Versement programmé" :icon="pot.icon" :icon-color="pot.color" :back-to="`/pots/${pot.id}`">
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
        Chaque période, « {{ pot.name }} » reçoit le montant dès le premier jour ; ton budget le paie jour après jour.
      </p>

      <AmountInput v-model="amountText" :invalid="amountText !== '' && amount === null" />

      <input
        v-model="memo"
        type="text"
        maxlength="200"
        placeholder="Ajouter un mémo (ex. Investissement mensuel)"
        aria-label="Mémo"
        class="h-14 rounded-2xl bg-surface border border-line text-center text-[16px] outline-none focus:border-primary"
      />

      <div class="flex flex-col">
        <SelectRow v-model="frequency" label="Répète" :options="frequencyOptions" active />
        <p v-if="perDay" class="text-right text-[13px] text-ink-muted -mt-3 mb-1">{{ perDay }} / jour sur ton budget</p>

        <p class="text-[13px] font-medium text-ink-muted pt-4 pb-1">Période</p>
        <label class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
          <span>Début</span>
          <input v-model="startDate" type="date" :min="wallet.startDate" :max="wallet.endDate ?? undefined" required class="bg-surface-muted rounded-lg px-2.5 py-1.5 outline-none" />
        </label>
        <div class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
          <span>Sans fin</span>
          <UiToggle v-model="noEnd" label="Sans fin" />
        </div>
        <label v-if="!noEnd" class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
          <span>Fin (dernier jour inclus)</span>
          <input v-model="endDate" type="date" :min="startDate" required class="bg-surface-muted rounded-lg px-2.5 py-1.5 outline-none" />
        </label>
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
const { formatMoney } = useFormat();

const pots = await useRequestFetch()<Pot[]>('/api/pots');
const found = pots.find((p) => p.id === Number(route.params.id) && !p.archivedAt);
if (!found) throw createError({ statusCode: 404, statusMessage: 'Pot not found' });
const pot: Pot = found;

const today = todayIn(wallet.timezone);
const amountText = ref('');
const amount = computed(() => parseAmount(amountText.value));
const memo = ref('');
const frequency = ref<Frequency>('monthly');
// Today, or the wallet's first day when it has not started yet.
const startDate = ref(clampDate(today, wallet.startDate, wallet.endDate));
const noEnd = ref(true);
const endDate = ref('');

const frequencyOptions = (Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }));
const perDay = computed(() =>
  amount.value === null ? '' : formatMoney(Math.round(dailyAmount(Math.round(amount.value * 100), frequency.value, startDate.value))),
);

const canSubmit = computed(() => amount.value !== null && !!startDate.value && (noEnd.value || (!!endDate.value && endDate.value >= startDate.value)));
const saving = ref(false);
const error = ref('');

const submit = async () => {
  if (!canSubmit.value) return;
  saving.value = true;
  error.value = '';
  try {
    await $fetch(`/api/pots/${pot.id}/recurrences`, {
      method: 'POST',
      body: {
        amount: amount.value,
        frequency: frequency.value,
        startDate: startDate.value,
        endDate: noEnd.value ? null : endDate.value,
        memo: memo.value || null,
      },
    });
    await navigateTo(`/pots/${pot.id}`);
  } catch (err) {
    error.value = apiErrorMessage(err, "Impossible d'enregistrer.");
  } finally {
    saving.value = false;
  }
};
</script>
