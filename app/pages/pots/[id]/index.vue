<template>
  <div>
    <SheetHeader :title="pot.name" :icon="pot.icon" :icon-color="pot.color" back-to="/pots">
      <template #action>
        <NuxtLink :to="`/pots/${pot.id}/edit`" class="px-4 h-10 rounded-full bg-surface border border-line flex items-center font-medium text-[15px]">
          Modifier
        </NuxtLink>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-6">
      <div class="text-center flex flex-col items-center gap-3 py-2">
        <p class="text-5xl font-light tracking-tight tabular-nums">{{ formatMoney(pot.balance) }}</p>
        <PotProgress class="w-full max-w-xs" :balance="pot.balance" :target="pot.targetAmount" :color="pot.color" />
        <p v-if="pot.archivedAt" class="text-sm text-ink-muted">Pot archivé</p>
      </div>

      <div v-if="!pot.archivedAt" class="grid grid-cols-2 gap-3">
        <NuxtLink :to="`/pots/${pot.id}/transfer?direction=to_pot`" class="h-14 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25">
          <Icon name="lucide:piggy-bank" class="size-5" />
          Mettre de côté
        </NuxtLink>
        <NuxtLink
          :to="`/pots/${pot.id}/transfer?direction=from_pot`"
          :class="['h-14 rounded-2xl bg-primary-soft text-primary font-semibold flex items-center justify-center gap-2', pot.balance <= 0 && 'pointer-events-none opacity-40']"
        >
          <Icon name="lucide:undo-2" class="size-5" />
          Reprendre
        </NuxtLink>
      </div>

      <UiGroup title="Versement programmé">
        <NuxtLink
          v-for="r in activeRules"
          :key="r.id"
          :to="`/recurrences/${r.id}`"
          class="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60"
        >
          <Icon name="lucide:repeat" class="size-6 shrink-0 text-primary" />
          <span class="grow min-w-0">
            <span class="block truncate">{{ formatMoney(r.amount) }} · {{ FREQUENCY_LABELS[r.frequency].toLowerCase() }}</span>
            <span class="block text-[13px] text-ink-muted truncate">
              {{ r.endDate ? `du ${formatDate(r.startDate)} au ${formatDate(r.endDate)}` : `depuis le ${formatDate(r.startDate)}` }} · {{ perDay(r) }} / jour sur ton budget
            </span>
          </span>
          <Icon name="lucide:chevron-right" class="size-5 text-ink-muted" />
        </NuxtLink>
        <NuxtLink
          v-if="!pot.archivedAt"
          :to="`/pots/${pot.id}/recurring`"
          class="flex items-center gap-3 px-4 min-h-13 text-primary font-medium hover:bg-surface-muted/60"
        >
          <Icon name="lucide:plus" class="size-5" />
          {{ activeRules.length ? 'Ajouter un versement' : 'Programmer un versement' }}
        </NuxtLink>
      </UiGroup>

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

      <p v-if="!movements.length" class="text-center text-ink-muted py-6">Aucun mouvement pour l'instant.</p>
      <UiGroup v-else title="Mouvements">
        <template v-for="m in movements" :key="`${m.kind}-${m.id}`">
          <NuxtLink v-if="m.kind === 'transaction'" :to="['buy', 'sell', 'dividend'].includes(m.type) ? `/trades/${m.id}?from=/pots/${pot.id}` : `/transactions/${m.id}`" class="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60">
            <Icon :name="categoryOf(m.categoryId)?.icon ?? 'lucide:tag'" class="size-6 shrink-0" :style="{ color: categoryOf(m.categoryId)?.color }" />
            <span class="grow min-w-0">
              <span class="block truncate">{{ m.memo || categoryOf(m.categoryId)?.name }}</span>
              <span class="block text-[13px] text-ink-muted">{{ formatDate(m.date) }}</span>
            </span>
            <span :class="['tabular-nums font-medium', m.amount > 0 && 'text-positive']">{{ formatMoney(m.amount, { signed: true }) }}</span>
          </NuxtLink>
          <NuxtLink v-else-if="m.kind === 'recurring'" :to="`/recurrences/${m.id}`" class="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60">
            <Icon name="lucide:repeat" class="size-6 shrink-0 text-primary" />
            <span class="grow min-w-0">
              <span class="block truncate">{{ m.memo || 'Versement programmé' }}</span>
              <span class="block text-[13px] text-ink-muted">{{ formatDate(m.date) }}</span>
            </span>
            <span class="tabular-nums font-medium text-positive">{{ formatMoney(m.amount, { signed: true }) }}</span>
          </NuxtLink>
          <div v-else class="flex items-center gap-3 px-4 py-3">
            <Icon :name="m.direction === 'to_pot' ? 'lucide:piggy-bank' : 'lucide:undo-2'" class="size-6 shrink-0 text-primary" />
            <span class="grow min-w-0">
              <span class="block truncate">{{ m.memo || (m.direction === 'to_pot' ? 'Depuis le budget' : 'Vers le budget') }}</span>
              <span class="block text-[13px] text-ink-muted">{{ formatDate(m.date) }}</span>
            </span>
            <span :class="['tabular-nums font-medium', m.amount > 0 && 'text-positive']">{{ formatMoney(m.amount, { signed: true }) }}</span>
            <button
              type="button"
              :class="['h-8 rounded-full text-[13px] font-semibold transition-colors', confirmingId === m.id ? 'px-3 bg-negative text-white' : 'w-8 text-ink-muted hover:text-negative']"
              :aria-label="confirmingId === m.id ? 'Confirmer la suppression' : 'Supprimer ce transfert'"
              @click="removeTransfer(m.id)"
            >
              <span v-if="confirmingId === m.id">Supprimer</span>
              <Icon v-else name="lucide:trash-2" class="size-4" />
            </button>
          </div>
        </template>
      </UiGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const requestFetch = useRequestFetch();
const { formatMoney, formatDate } = useFormat();
const { categories, ensureLoaded } = useCategories();

const id = Number(route.params.id);
const [pots, movementsData, allRules] = await Promise.all([
  requestFetch<Pot[]>('/api/pots'),
  requestFetch<PotMovement[]>(`/api/pots/${id}/movements`).catch(() => null),
  requestFetch<Recurrence[]>('/api/recurrences'),
  ensureLoaded(),
]);
const found = pots.find((p) => p.id === id);
if (!found || !movementsData) throw createError({ statusCode: 404, statusMessage: 'Pot not found' });

const pot = ref<Pot>(found);
const movements = ref<PotMovement[]>(movementsData);
const categoryOf = (categoryId: number) => categories.value?.find((c) => c.id === categoryId);

// Recurring contributions still running (the ended ones stay in the history).
const { wallet } = useWallet();
const today = todayIn(wallet.value!.timezone);
const activeRules = allRules.filter((r) => r.potId === id && (r.endDate === null || r.endDate >= today));
const perDay = (r: Recurrence) => formatMoney(Math.round(dailyAmount(r.amount, r.frequency, r.startDate > today ? r.startDate : today)));

// Two-step delete: first tap arms the row, second tap deletes.
const confirmingId = ref<number | null>(null);
const error = ref('');

const reload = async () => {
  const [all, list] = await Promise.all([$fetch<Pot[]>('/api/pots'), $fetch<PotMovement[]>(`/api/pots/${id}/movements`)]);
  pot.value = all.find((p) => p.id === id)!;
  movements.value = list;
};

const removeTransfer = async (transferId: number) => {
  if (confirmingId.value !== transferId) {
    confirmingId.value = transferId;
    return;
  }
  error.value = '';
  try {
    await $fetch(`/api/pot-transfers/${transferId}`, { method: 'DELETE' });
    confirmingId.value = null;
    await reload();
  } catch (err: any) {
    error.value = err?.data?.statusMessage === 'Insufficient pot balance'
      ? 'Impossible : le pot deviendrait négatif.'
      : err?.data?.statusMessage || 'Impossible de supprimer.';
    confirmingId.value = null;
  }
};
</script>
