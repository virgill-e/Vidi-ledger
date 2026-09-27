<template>
  <div>
    <SheetHeader title="Historique" back-to="/" />
    <div class="px-4 flex flex-col gap-5">
      <UiSegmented v-model="tab" :options="tabs" />

      <template v-if="tab === 'movements'">
        <p v-if="!days.length" class="text-center text-ink-muted py-10">Aucun mouvement pour l'instant.</p>
        <UiGroup v-for="day in days" :key="day.date" :title="dayLabel(day.date)">
          <NuxtLink
            v-for="tx in day.items"
            :key="tx.id"
            :to="`/transactions/${tx.id}`"
            class="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60"
          >
            <Icon :name="categoryOf(tx.categoryId)?.icon ?? 'lucide:tag'" class="size-6 shrink-0" :style="{ color: categoryOf(tx.categoryId)?.color }" />
            <span class="grow min-w-0">
              <span class="block truncate">{{ tx.memo || categoryOf(tx.categoryId)?.name }}</span>
              <span v-if="subtitle(tx)" class="block text-[13px] text-ink-muted truncate">{{ subtitle(tx) }}</span>
            </span>
            <span :class="['tabular-nums font-medium', isInflow(tx) ? 'text-positive' : '']">
              {{ formatMoney(isInflow(tx) ? tx.amount : -tx.amount, { signed: true }) }}
            </span>
          </NuxtLink>
        </UiGroup>
      </template>

      <template v-else>
        <p v-if="!recurrences.length" class="text-center text-ink-muted py-10">Aucune dépense ni revenu récurrent.</p>
        <UiGroup v-for="group in recurrenceGroups" :key="group.title" :title="group.title">
          <NuxtLink
            v-for="r in group.items"
            :key="r.id"
            :to="`/recurrences/${r.id}`"
            class="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60"
          >
            <Icon :name="categoryOf(r.categoryId)?.icon ?? 'lucide:tag'" class="size-6 shrink-0" :style="{ color: categoryOf(r.categoryId)?.color }" />
            <span class="grow min-w-0">
              <span class="block truncate">{{ r.memo || categoryOf(r.categoryId)?.name }}</span>
              <span class="block text-[13px] text-ink-muted truncate">{{ FREQUENCY_LABELS[r.frequency] }} · {{ periodLabel(r) }}</span>
            </span>
            <span :class="['tabular-nums font-medium', r.kind === 'income' ? 'text-positive' : '']">
              {{ formatMoney(r.kind === 'income' ? r.amount : -r.amount, { signed: true }) }}
            </span>
          </NuxtLink>
        </UiGroup>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const router = useRouter();
type Tab = 'movements' | 'recurrences';
const tabs: { value: Tab; label: string }[] = [
  { value: 'movements', label: 'Mouvements' },
  { value: 'recurrences', label: 'Récurrents' },
];
const tab = computed<Tab>({
  get: () => (route.query.tab === 'recurrences' ? 'recurrences' : 'movements'),
  set: (value) => router.replace({ query: { tab: value } }),
});

const { wallet } = useWallet();
const { categories, ensureLoaded } = useCategories();
const { formatMoney, formatDate } = useFormat();
const requestFetch = useRequestFetch();

const [transactions, recurrences, pots] = await Promise.all([
  requestFetch<Transaction[]>('/api/transactions'),
  requestFetch<Recurrence[]>('/api/recurrences'),
  requestFetch<Pot[]>('/api/pots'),
  ensureLoaded(),
]);

const categoryOf = (id: number) => categories.value?.find((c) => c.id === id);
// "Courses · Vacances · étalé sur 3 jours": category (when a memo is shown), pot, spread.
const subtitle = (tx: Transaction) => [
  tx.memo ? categoryOf(tx.categoryId)?.name : null,
  tx.potId ? pots.find((p) => p.id === tx.potId)?.name : null,
  tx.spreadDays > 1 ? `étalé sur ${tx.spreadDays} jours` : null,
].filter(Boolean).join(' · ');
const isInflow = (tx: Transaction) => tx.type === 'income' || tx.type === 'sell' || tx.type === 'dividend';

const days = computed(() => {
  const groups: { date: string; items: Transaction[] }[] = [];
  for (const tx of transactions) {
    const last = groups.at(-1);
    if (last?.date === tx.date) last.items.push(tx);
    else groups.push({ date: tx.date, items: [tx] });
  }
  return groups;
});

const today = todayIn(wallet.value!.timezone);
const dayLabel = (date: string) => {
  if (date === today) return "Aujourd'hui";
  if (date === addDays(today, -1)) return 'Hier';
  return formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// Compact dates: the year only when it is not the current one.
const shortDate = (date: string) =>
  formatDate(date, date.slice(0, 4) === today.slice(0, 4) ? { day: 'numeric', month: 'short' } : undefined);
const periodLabel = (r: Recurrence) => {
  if (r.endDate) return `${shortDate(r.startDate)} → ${shortDate(r.endDate)}`;
  return `depuis le ${shortDate(r.startDate)}`;
};

const recurrenceGroups = computed(() => {
  const active = recurrences.filter((r) => r.endDate === null || r.endDate >= today);
  const ended = recurrences.filter((r) => r.endDate !== null && r.endDate < today);
  return [
    { title: 'Revenus', items: active.filter((r) => r.kind === 'income') },
    { title: 'Dépenses', items: active.filter((r) => r.kind === 'expense') },
    { title: 'Terminés', items: ended },
  ].filter((g) => g.items.length);
});
</script>
