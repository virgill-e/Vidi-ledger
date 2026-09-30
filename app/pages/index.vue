<template>
  <div class="grow flex flex-col">
    <div class="flex justify-center pt-2">
      <div
        :class="[
          'size-72 sm:size-80 rounded-full border flex flex-col items-center justify-center text-center px-8 transition-colors',
          today && today.available < 0 ? 'border-red-200' : 'border-white/80',
        ]"
      >
        <Transition name="fade" mode="out-in">
          <div v-if="flash" key="flash" class="flex flex-col items-center gap-1">
            <Icon :name="flash.icon" class="size-9" />
            <span class="text-4xl font-bold tabular-nums">{{ formatMoney(flash.amount, { signed: true }) }}</span>
            <span class="text-2xl font-bold text-white/50">{{ flash.name }}</span>
          </div>
          <div v-else-if="today" key="budget" class="flex flex-col items-center">
            <span class="text-white/60 font-medium">{{ today.available < 0 ? 'Budget dépassé' : 'Budget du jour' }}</span>
            <span class="text-6xl font-light tracking-tight tabular-nums mt-1">{{ formatMoney(today.available) }}</span>
          </div>
          <div v-else key="idle" class="flex flex-col items-center gap-1">
            <span class="text-white/60 font-medium">Budget du jour</span>
            <span class="text-xl font-medium">{{ idleMessage }}</span>
          </div>
        </Transition>
      </div>
    </div>

    <BudgetChart v-if="visibleDays.length && data" :days="visibleDays" :today="data.today" class="grow min-h-80 w-screen relative left-1/2 -translate-x-1/2 mt-4 -mb-8" />

    <nav data-floating class="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-5 z-30 flex items-center gap-2">
      <NuxtLink to="/history" class="h-14 px-5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center gap-2 font-medium transition-colors">
        <Icon name="lucide:history" class="size-5" />
        Historique
      </NuxtLink>
      <NuxtLink to="/investments" class="size-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-colors" aria-label="Investissements" title="Investissements">
        <Icon name="lucide:chart-line" class="size-6" />
      </NuxtLink>
    </nav>
    <NuxtLink
      to="/add"
      data-floating
      class="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-5 z-30 size-16 rounded-full bg-sky-300/90 text-ink shadow-xl shadow-black/15 flex items-center justify-center hover:brightness-105 transition"
      aria-label="Ajouter un mouvement"
    >
      <Icon name="lucide:plus" class="size-8" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'wallet' });

const { formatMoney, formatDate } = useFormat();
const { data } = await useFetch<BudgetResponse>('/api/budget', { query: { days: 7 } });

const today = computed(() => {
  const first = data.value?.days[0];
  return first && first.date === data.value?.today ? first : null;
});

// Before the start date / after the end date there is no budget for today.
const idleMessage = computed(() => {
  const d = data.value;
  if (!d) return '';
  if (d.today < d.startDate) return `Démarre le ${formatDate(d.startDate)}`;
  if (d.endDate && d.today > d.endDate) return `Terminé le ${formatDate(d.endDate)}`;
  return '';
});

// 3 days on phones, 5 from the `sm` breakpoint.
const wide = ref(false);
onMounted(() => {
  const query = window.matchMedia('(min-width: 640px)');
  wide.value = query.matches;
  query.addEventListener('change', (e) => { wide.value = e.matches; });
});
const visibleDays = computed(() => (data.value?.days ?? []).slice(0, wide.value ? 5 : 3));

// Taken during setup so the very first paint shows the saved movement
// (client-side navigation from the add form; always null during SSR).
const lastAdded = useLastAdded();
const flash = ref<LastAdded | null>(lastAdded.value);
lastAdded.value = null;
onMounted(() => {
  if (flash.value) setTimeout(() => { flash.value = null; }, 2000);
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
