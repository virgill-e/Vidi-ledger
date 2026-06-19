<template>
  <div class="flex flex-col gap-6 lg:gap-8 w-full pb-20">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-text-heading tracking-tight mb-1">Tableau de bord</h1>
        <p class="text-text-body/60 font-medium">Vue d'ensemble de vos dépenses et investissements.</p>
      </div>
      <!-- Period filter -->
      <div class="flex items-center bg-[#f0f4f2] p-1.5 rounded-2xl w-full sm:w-fit">
        <button v-for="f in filters" :key="f.id" @click="timeFilter = f.id"
          :class="['flex-1 sm:flex-none px-4 py-2 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap', timeFilter === f.id ? 'bg-white shadow-sm text-primary' : 'text-text-body/60 hover:text-text-heading']">
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Summary Cards: Dépenses / Investissements / Total combiné -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <!-- Dépenses -->
      <NuxtLink to="/transactions" class="bg-card-inner rounded-[32px] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col transition-transform hover:-translate-y-1 duration-300 group">
        <div class="flex items-center justify-between mb-5">
          <div class="w-12 h-12 rounded-[16px] bg-red-500/10 text-red-500 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <span class="text-text-body/30 group-hover:text-primary transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
        <span class="text-[12px] font-bold text-text-body/40 uppercase tracking-widest mb-1">Dépenses · {{ timeFilterLabel }}</span>
        <span class="text-[34px] font-semibold text-text-heading leading-none tracking-tight">{{ formatCompact(periodExpenses) }}</span>
      </NuxtLink>

      <!-- Investissements -->
      <NuxtLink to="/investments" class="bg-card-inner rounded-[32px] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col transition-transform hover:-translate-y-1 duration-300 group">
        <div class="flex items-center justify-between mb-5">
          <div class="w-12 h-12 rounded-[16px] bg-primary/10 text-primary flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span class="text-text-body/30 group-hover:text-primary transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
        <span class="text-[12px] font-bold text-text-body/40 uppercase tracking-widest mb-1">Investi net · {{ timeFilterLabel }}</span>
        <span class="text-[34px] font-semibold text-text-heading leading-none tracking-tight">{{ formatCompact(periodInvested) }}</span>
      </NuxtLink>

      <!-- Total combiné -->
      <div class="bg-primary rounded-[32px] p-7 shadow-[0_12px_40px_rgba(41,75,60,0.15)] text-white flex flex-col relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
        <div class="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
        <div class="flex items-center justify-between mb-5 relative z-10">
          <div class="w-12 h-12 rounded-[16px] bg-white/15 text-white flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <span class="text-[12px] font-bold text-white/60 uppercase tracking-widest mb-1 relative z-10">Total · {{ timeFilterLabel }}</span>
        <span class="text-[34px] font-semibold leading-none tracking-tight relative z-10">{{ formatCompact(periodCombined) }}</span>
        <span class="text-[12px] text-white/50 font-medium mt-2 relative z-10">Dépenses + investissements</span>
      </div>
    </div>

    <!-- Monthly Recap (sum of both per month) + Recent activity -->
    <div class="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8 min-w-0">

      <!-- Monthly comparison chart -->
      <div class="bg-card-inner rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col w-full lg:w-[62%] transition-transform hover:-translate-y-1 duration-300">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="text-text-heading text-[22px] font-medium">Dépenses & investissements par mois</h2>
            <p class="text-text-body/50 text-sm font-medium mt-0.5">Année {{ currentYear }}</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#e74c3c]"></span>
              <span class="text-[12px] font-semibold text-text-body/60">Dépenses</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-primary"></span>
              <span class="text-[12px] font-semibold text-text-body/60">Investis</span>
            </div>
          </div>
        </div>

        <!-- Bars -->
        <div class="flex items-end justify-between gap-1 sm:gap-3">
          <div v-for="(m, i) in monthlyData" :key="i" class="flex flex-col items-center gap-2 flex-1 min-w-0 group/bar">
            <div class="flex items-end justify-center gap-1 sm:gap-1.5 w-full h-[200px]">
              <div class="w-2.5 sm:w-3.5 rounded-t-md bg-[#e74c3c] transition-all duration-700 ease-out group-hover/bar:opacity-80" :style="{ height: barHeight(m.expenses) }"
                   :title="`Dépenses ${m.label} : ${formatCompact(m.expenses)}`"></div>
              <div class="w-2.5 sm:w-3.5 rounded-t-md bg-primary transition-all duration-700 ease-out group-hover/bar:opacity-80" :style="{ height: barHeight(m.invested) }"
                   :title="`Investi ${m.label} : ${formatCompact(m.invested)}`"></div>
            </div>
            <span :class="['text-[11px] font-medium', m.isCurrent ? 'text-primary font-bold' : 'text-text-body/50']">{{ m.label }}</span>
            <span class="text-[10px] sm:text-[11px] font-bold tabular-nums" :class="m.isCurrent ? 'text-primary' : 'text-text-heading/70'">{{ compactNumber(m.total) }}</span>
          </div>
        </div>
      </div>

      <!-- Right column: monthly sum list + recent activity -->
      <div class="flex flex-col gap-6 w-full lg:w-[38%]">

        <!-- This month sum -->
        <div class="bg-card-inner rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
          <h2 class="text-text-heading text-[20px] font-medium mb-5">Détail par mois</h2>
          <div class="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            <div v-for="(m, i) in monthlyDataReversed" :key="i" class="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-input-bg transition-colors" :class="m.isCurrent ? 'bg-primary/5' : ''">
              <span class="text-[14px] font-semibold" :class="m.isCurrent ? 'text-primary' : 'text-text-body/70'">{{ m.label }}</span>
              <div class="flex items-center gap-4">
                <span class="text-[12px] text-[#e74c3c] font-semibold w-[70px] text-right">{{ formatCompact(m.expenses) }}</span>
                <span class="text-[12px] text-primary font-semibold w-[70px] text-right">{{ formatCompact(m.invested) }}</span>
                <span class="text-[13px] text-text-heading font-bold w-[80px] text-right">{{ formatCompact(m.total) }}</span>
              </div>
            </div>
            <div v-if="monthlyData.length === 0" class="text-text-body/40 italic text-sm py-6 text-center">Aucune donnée</div>
          </div>
        </div>

        <!-- Recent combined activity -->
        <div class="bg-card-inner rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col grow">
          <h2 class="text-text-heading text-[20px] font-medium mb-5">Activité récente</h2>
          <div class="flex flex-col gap-4 grow">
            <NuxtLink
              v-for="(item, index) in recentActivity" :key="index"
              :to="item.link"
              class="flex items-center justify-between group p-2 -mx-2 rounded-2xl hover:bg-input-bg transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-11 h-11 rounded-[14px] flex items-center justify-center text-white shadow-sm shrink-0" :style="item.color ? { backgroundColor: item.color } : {}" :class="item.bgClass">
                  <span v-if="item.icon" v-html="item.icon" class="scale-90"></span>
                  <span v-else class="text-[11px] font-bold">{{ item.badge }}</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-[15px] font-semibold text-text-heading truncate">{{ item.title }}</span>
                  <span class="text-[12px] text-text-body/55 font-medium truncate">{{ item.subtitle }}</span>
                </div>
              </div>
              <span class="text-[15px] font-bold whitespace-nowrap pl-2" :class="item.amountClass">{{ item.amountLabel }}</span>
            </NuxtLink>
            <div v-if="recentActivity.length === 0" class="flex flex-col items-center justify-center gap-3 py-10 text-text-body/30 italic grow">
              <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Aucune activité</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile quick-add FAB (sits above the layout's GitHub button) -->
    <NuxtLink
      to="/transactions/add"
      class="md:hidden fixed bottom-24 right-6 z-50 flex items-center gap-2 bg-primary text-white pl-4 pr-5 py-4 rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-all border border-white/10"
      aria-label="Ajouter une dépense"
    >
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span class="text-sm font-bold whitespace-nowrap">Dépense</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFilterTime, type TimeFilter } from '~/composables/useFilters';

definePageMeta({
  middleware: 'auth'
});

const timeFilter = useFilterTime('dashboard', 'month');

const filters: { id: TimeFilter, label: string }[] = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
  { id: 'all', label: 'Tout' },
];

const timeFilterLabel = computed(() => {
  const labels: Record<TimeFilter, string> = {
    week: 'cette semaine',
    month: 'ce mois',
    year: 'cette année',
    all: 'au total'
  };
  return labels[timeFilter.value];
});

const expensesList = ref<any[]>([]);
const investmentsList = ref<any[]>([]);

const formatCompact = (amountInCents: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amountInCents / 100);
};

// Short currency for tight spaces (e.g. "1,2 k €")
const compactNumber = (amountInCents: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(amountInCents / 100);
};

const fetchData = async () => {
  const [exps, invs] = await Promise.all([
    $fetch('/api/expenses'),
    $fetch('/api/investments')
  ]);
  expensesList.value = exps as any[];
  investmentsList.value = invs as any[];
};

onMounted(fetchData);

const currentYear = new Date().getFullYear();

const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const matchesTimeFilter = (date: Date) => {
  const now = new Date();
  if (timeFilter.value === 'week') {
    return getWeekNumber(date) === getWeekNumber(now) && date.getFullYear() === now.getFullYear();
  } else if (timeFilter.value === 'month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  } else if (timeFilter.value === 'year') {
    return date.getFullYear() === now.getFullYear();
  }
  return true;
};

// Period totals
const periodExpenses = computed(() =>
  expensesList.value
    .filter(tx => matchesTimeFilter(new Date(tx.date)))
    .reduce((acc, tx) => acc + tx.amount, 0)
);

const periodInvested = computed(() =>
  investmentsList.value
    .filter(tx => matchesTimeFilter(new Date(tx.date)))
    .reduce((acc, tx) => acc + (tx.type === 'buy' ? tx.amount : tx.type === 'sell' ? -tx.amount : 0), 0)
);

const periodCombined = computed(() => periodExpenses.value + periodInvested.value);

// Monthly data for the current year (sum of both per month), up to the current month
const monthlyData = computed(() => {
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const now = new Date();
  const lastMonth = now.getFullYear() === currentYear ? now.getMonth() : 11;

  const months = monthNames.slice(0, lastMonth + 1).map((label, idx) => ({
    label,
    expenses: 0,
    invested: 0,
    total: 0,
    isCurrent: idx === now.getMonth() && currentYear === now.getFullYear()
  }));

  expensesList.value.forEach(tx => {
    const d = new Date(tx.date);
    if (d.getFullYear() === currentYear && d.getMonth() <= lastMonth) months[d.getMonth()].expenses += tx.amount;
  });

  investmentsList.value.forEach(tx => {
    const d = new Date(tx.date);
    if (d.getFullYear() === currentYear && d.getMonth() <= lastMonth) {
      months[d.getMonth()].invested += (tx.type === 'buy' ? tx.amount : tx.type === 'sell' ? -tx.amount : 0);
    }
  });

  months.forEach(m => { m.total = m.expenses + m.invested; });
  return months;
});

// Detail list: only months with activity, most recent first
const monthlyDataReversed = computed(() =>
  [...monthlyData.value].filter(m => m.total !== 0).reverse()
);

const monthlyMax = computed(() => {
  return Math.max(
    ...monthlyData.value.map(m => Math.max(m.expenses, m.invested)),
    1
  );
});

const barHeight = (value: number) => {
  const pct = (Math.max(0, value) / monthlyMax.value) * 100;
  return `${Math.max(value > 0 ? 4 : 0, pct)}%`;
};

// Recent combined activity (expenses + investments)
const recentActivity = computed(() => {
  const expenseItems = expensesList.value.map(tx => ({
    kind: 'expense' as const,
    date: new Date(tx.date),
    title: tx.merchant,
    subtitle: `${tx.category?.name ?? 'Dépense'} • ${new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`,
    icon: tx.category?.icon ?? null,
    color: tx.category?.color ?? null,
    bgClass: '',
    badge: '',
    amountLabel: `-${formatCompact(tx.amount)}`,
    amountClass: 'text-text-heading',
    link: `/transactions/${tx.id}`
  }));

  const investmentItems = investmentsList.value.map(tx => ({
    kind: 'investment' as const,
    date: new Date(tx.date),
    title: tx.asset,
    subtitle: `${tx.type === 'buy' ? 'Achat' : tx.type === 'sell' ? 'Vente' : 'Dividende'} • ${new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`,
    icon: null,
    color: null,
    bgClass: tx.type === 'buy' ? 'bg-[#294b3c]' : tx.type === 'sell' ? 'bg-[#e74c3c]' : 'bg-[#3498db]',
    badge: tx.asset?.slice(0, 3).toUpperCase() ?? '?',
    amountLabel: `${tx.type === 'sell' ? '-' : '+'}${formatCompact(tx.amount)}`,
    amountClass: tx.type === 'buy' ? 'text-primary' : tx.type === 'sell' ? 'text-[#e74c3c]' : 'text-[#3498db]',
    link: `/investments/asset/${encodeURIComponent(tx.asset)}`
  }));

  return [...expenseItems, ...investmentItems]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 7);
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(41, 75, 60, 0.2);
  border-radius: 10px;
}
.custom-scrollbar-h::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar-h::-webkit-scrollbar-thumb {
  background: rgba(41, 75, 60, 0.15);
  border-radius: 10px;
}
</style>
