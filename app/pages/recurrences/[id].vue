<template>
  <form @submit.prevent="save">
    <SheetHeader :title="look.name" :icon="look.icon" :icon-color="look.color" :back-to="backTo">
      <template #action>
        <button
          type="submit"
          :disabled="!canSave || saving"
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

      <div class="flex flex-col">
        <SelectRow v-model="frequency" label="Répète" :options="frequencyOptions" active />
        <p v-if="perDay" class="text-right text-[13px] text-ink-muted -mt-3 mb-1">{{ perDay }} / jour</p>

        <template v-if="valueChanged && canVersion">
          <div class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
            <span>Modifier aussi le passé</span>
            <UiToggle v-model="rewritePast" label="Modifier aussi le passé" />
          </div>
          <label v-if="!rewritePast" class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
            <span>À partir du</span>
            <input v-model="effectiveFrom" type="date" :min="minEffective" :max="rule.endDate ?? undefined" required class="bg-surface-muted rounded-lg px-2.5 py-1.5 outline-none" />
          </label>
        </template>

        <p class="text-[13px] font-medium text-ink-muted pt-4 pb-1">Période d'application</p>
        <div class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
          <span>Début</span>
          <span class="text-ink-muted">{{ formatDate(rule.startDate) }}</span>
        </div>
        <div class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
          <span>Sans fin</span>
          <UiToggle v-model="noEnd" label="Sans fin" />
        </div>
        <label v-if="!noEnd" class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
          <span>Fin (dernier jour inclus)</span>
          <input v-model="endDate" type="date" :min="rule.startDate" required class="bg-surface-muted rounded-lg px-2.5 py-1.5 outline-none" />
        </label>
      </div>

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

      <ConfirmDelete :loading="deleting" @confirm="remove">
        Supprimer cette règle l'efface de <strong>tout l'historique</strong> : le budget des jours passés sera recalculé.
        Pour l'arrêter à partir d'une date, désactive plutôt « Sans fin ».
      </ConfirmDelete>
    </div>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const requestFetch = useRequestFetch();
const { wallet } = useWallet();
const { categories, ensureLoaded } = useCategories();
const { formatMoney, formatDate } = useFormat();

const [rules, pots] = await Promise.all([requestFetch<Recurrence[]>('/api/recurrences'), requestFetch<Pot[]>('/api/pots'), ensureLoaded()]);
const found = rules.find((r) => r.id === Number(route.params.id));
if (!found) throw createError({ statusCode: 404, statusMessage: 'Recurrence not found' });
const rule: Recurrence = found;

const category = computed(() => categories.value?.find((c) => c.id === rule.categoryId));
// Recurring contributions to a pot show the pot and lead back to it.
const pot = rule.potId !== null ? pots.find((p) => p.id === rule.potId) : undefined;
const look = computed(() => pot
  ? { name: `Vers ${pot.name}`, icon: pot.icon, color: pot.color }
  : { name: category.value?.name ?? 'Récurrent', icon: category.value?.icon, color: category.value?.color });
const backTo = pot ? `/pots/${pot.id}` : '/history?tab=recurrences';
const today = todayIn(wallet.value!.timezone);

const amountText = ref(centsToInput(rule.amount));
const amount = computed(() => parseAmount(amountText.value));
const memo = ref(rule.memo ?? '');
const frequency = ref<Frequency>(rule.frequency);
const noEnd = ref(rule.endDate === null);
const endDate = ref(rule.endDate ?? today);

const frequencyOptions = (Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }));

const valueChanged = computed(() =>
  amount.value !== null && (Math.round(amount.value * 100) !== rule.amount || frequency.value !== rule.frequency),
);
// Versioning only makes sense for a rule that already started.
const minEffective = addDays(rule.startDate, 1);
const canVersion = today >= minEffective;
const rewritePast = ref(false);
const effectiveFrom = ref(today);

// Shown for today's period, or the rule's first one if it has not started yet.
const perDay = computed(() =>
  amount.value === null ? '' : formatMoney(Math.round(dailyAmount(Math.round(amount.value * 100), frequency.value, rule.startDate > today ? rule.startDate : today))),
);

const canSave = computed(() => amount.value !== null && (noEnd.value || endDate.value >= rule.startDate));

const saving = ref(false);
const deleting = ref(false);
const error = ref('');

const save = async () => {
  if (!canSave.value) return;
  saving.value = true;
  error.value = '';
  try {
    await $fetch(`/api/recurrences/${rule.id}`, {
      method: 'PATCH',
      body: {
        amount: amount.value,
        frequency: frequency.value,
        memo: memo.value || null,
        endDate: noEnd.value ? null : endDate.value,
        ...(valueChanged.value && canVersion && !rewritePast.value ? { effectiveFrom: effectiveFrom.value } : {}),
      },
    });
    await navigateTo(backTo);
  } catch (err: any) {
    error.value = apiErrorMessage(err, "Impossible d'enregistrer.");
  } finally {
    saving.value = false;
  }
};

const remove = async () => {
  deleting.value = true;
  try {
    await $fetch(`/api/recurrences/${rule.id}`, { method: 'DELETE' });
    await navigateTo(backTo);
  } catch (err: any) {
    error.value = apiErrorMessage(err, 'Impossible de supprimer.');
    deleting.value = false;
  }
};
</script>
