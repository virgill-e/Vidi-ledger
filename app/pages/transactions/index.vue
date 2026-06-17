<template>
  <div class="flex flex-col gap-6 lg:gap-10 min-w-0 mx-auto max-w-[1200px] w-full pb-20">

    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden">
      <div>
        <h1 class="text-3xl font-bold text-text-heading tracking-tight mb-2">Dépenses</h1>
        <p class="text-text-body/60 font-medium">Vue d'ensemble et historique de toutes vos transactions.</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Export Dropdown -->
        <div class="relative z-50">
          <button @click="isExportMenuOpen = !isExportMenuOpen"
                  class="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl bg-card-inner border border-[#eff3f1] shadow-[0_2px_10px_rgb(0,0,0,0.02)] text-text-body/50 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all group"
                  :class="isExportMenuOpen ? 'border-primary/20 bg-primary/5 text-primary' : ''"
                  title="Exporter les données">
            <svg class="w-5 h-5 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <div v-if="isExportMenuOpen"
               class="absolute right-0 mt-3 w-56 bg-white rounded-[24px] shadow-[0_20px_60px_rgb(0,0,0,0.08)] border border-[#eff3f1] p-2.5 flex flex-col gap-1 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
            <div class="fixed inset-0 z-[-1]" @click="isExportMenuOpen = false"></div>
            <div class="px-3 py-1.5 text-[11px] font-bold text-text-body/40 uppercase tracking-widest">Exporter la période</div>
            <button @click="handleExport('pdf'); isExportMenuOpen = false" class="w-full text-left px-2 py-2 rounded-[16px] text-[14px] font-medium text-text-heading hover:bg-[#f0f4f2] transition-colors flex items-center gap-3 group">
              <div class="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div class="font-semibold">Format PDF</div>
                <div class="text-[11px] text-text-body/50 font-normal">Rapport mis en page</div>
              </div>
            </button>
            <button @click="handleExport('csv'); isExportMenuOpen = false" class="w-full text-left px-2 py-2 rounded-[16px] text-[14px] font-medium text-text-heading hover:bg-[#f0f4f2] transition-colors flex items-center gap-3 group">
              <div class="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div class="font-semibold">Format CSV</div>
                <div class="text-[11px] text-text-body/50 font-normal">Données brutes (Excel)</div>
              </div>
            </button>
          </div>
        </div>

        <NuxtLink to="/transactions/add" class="flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-[20px] font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une dépense
        </NuxtLink>
      </div>
    </div>

    <!-- Overview Row (moved from Dashboard) -->
    <div class="flex flex-col md:flex-row gap-6 lg:gap-8 min-w-0">

      <!-- Total Expenses & Chart Widget -->
      <div class="bg-card-inner rounded-[36px] pt-8 px-8 pb-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] overflow-hidden relative flex flex-col h-[320px] w-full md:w-[55%] transition-transform hover:-translate-y-1 duration-300">
        <div class="relative z-10 flex flex-col h-full">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4 sm:gap-0">
            <h2 class="text-text-heading text-[22px] font-medium">Total Dépenses</h2>
            <div class="flex items-center bg-[#f0f4f2] p-1 sm:p-1.5 rounded-2xl w-full sm:w-fit min-w-0">
              <button v-for="f in filters" :key="f.id" @click="timeFilter = f.id"
                :class="['flex-1 sm:flex-none px-2 sm:px-4 py-1.5 rounded-xl text-[12px] sm:text-[13px] font-medium transition-all whitespace-nowrap', timeFilter === f.id ? 'bg-white shadow-sm text-primary' : 'text-text-body/60 hover:text-text-heading']">
                {{ f.label }}
              </button>
            </div>
          </div>
          <div class="text-[48px] sm:text-[54px] leading-none tracking-tight font-semibold text-text-heading">
            {{ formatCompact(overviewTotal) }}
          </div>
        </div>

        <div class="absolute bottom-4 left-6 right-6 h-[140px] flex flex-col justify-end pointer-events-none transition-opacity duration-300">
          <svg viewBox="0 0 500 120" preserveAspectRatio="none" class="w-full h-[100px] overflow-visible">
            <defs>
              <linearGradient id="expensesGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#294b3c" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#294b3c" stop-opacity="0.0" />
              </linearGradient>
            </defs>
            <path :d="chartAreaPath" fill="url(#expensesGradient)" />
            <polyline :points="chartLinePoints" fill="none" stroke="#294b3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="flex justify-between mt-2 pt-1 border-t border-input-border/30">
            <span v-for="(pt, i) in chartData" :key="'label-'+i"
              :class="['text-[11px] font-medium text-text-body/50', (chartData.length > 7 && i % 2 !== 0) ? 'hidden sm:block' : 'block']"
              :style="{ width: (100 / (chartData.length > 7 ? (chartData.length/2) : chartData.length)) + '%', textAlign: 'center' }">
              {{ pt.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Category Comparison Widget -->
      <div class="bg-primary rounded-[36px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(41,75,60,0.15)] flex flex-col h-[320px] w-full md:w-[45%] text-white relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div class="flex justify-between items-start sm:items-center mb-6 relative z-10 shrink-0 gap-4">
          <h2 class="text-[18px] sm:text-[22px] font-medium leading-tight">Dépenses par catégorie</h2>
          <span class="text-white/60 text-[11px] sm:text-sm font-medium bg-white/10 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">{{ timeFilterLabel }}</span>
        </div>
        <div class="flex flex-col flex-grow gap-6 relative z-10 overflow-y-auto pr-2 custom-scrollbar pt-1">
          <div v-for="(cat, index) in overviewCategories" :key="index">
            <div class="flex justify-between items-end mb-2.5">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: cat.color }"></div>
                <span class="font-medium text-[15px] sm:text-[16px] text-white/90">{{ cat.name }}</span>
              </div>
              <span class="font-semibold text-[16px] sm:text-[17px] tracking-wide">{{ formatCompact(cat.amount) }}</span>
            </div>
            <div class="h-2.5 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
              <div class="h-full rounded-full transition-all duration-1000 ease-out" :style="{ width: cat.percentage + '%', backgroundColor: cat.color }"></div>
            </div>
          </div>
          <div v-if="overviewCategories.length === 0" class="flex items-center justify-center h-full text-white/40 italic">
            Aucune donnée pour cette période
          </div>
        </div>
      </div>
    </div>

    <!-- Filters & Search Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Search Bar -->
      <div class="lg:col-span-1">
        <div class="relative group">
          <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-body/40 group-focus-within:text-primary transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un commerçant..."
            class="w-full bg-card-inner border border-[#eff3f1] rounded-[24px] py-4 pl-12 pr-6 text-text-heading font-medium placeholder:text-text-body/30 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all"
          >
        </div>
      </div>

      <!-- Time Filter -->
      <div class="grow flex items-center bg-[#e3ece8] p-1.5 rounded-[24px] w-full">
        <button v-for="filter in filters" :key="filter.id"
          @click="timeFilter = filter.id"
          :class="['grow py-3 rounded-[18px] text-[14px] font-semibold transition-all', timeFilter === filter.id ? 'bg-white shadow-sm text-primary' : 'text-text-body/60 hover:text-text-heading']">
          {{ filter.label }}
        </button>
      </div>

      <!-- Category Filter -->
      <div class="relative group">
        <select
          v-model="selectedCategory"
          class="w-full appearance-none bg-card-inner border border-[#eff3f1] rounded-[24px] py-4 px-6 text-text-heading font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all cursor-pointer"
        >
          <option value="all">Toutes les catégories</option>
          <option v-for="cat in categories" :key="cat.id" :value="String(cat.id)">{{ cat.name }}</option>
        </select>
        <div class="absolute inset-y-0 right-6 flex items-center pointer-events-none text-text-body/40">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Transactions List -->
    <div class="bg-card-inner rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] overflow-hidden flex flex-col grow min-h-[500px]">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[#eff3f1]">
              <th class="px-8 py-6 text-text-body/40 font-semibold text-[13px] uppercase tracking-wider">Date</th>
              <th class="px-8 py-6 text-text-body/40 font-semibold text-[13px] uppercase tracking-wider">Commerçant</th>
              <th class="px-8 py-6 text-text-body/40 font-semibold text-[13px] uppercase tracking-wider">Catégorie</th>
              <th class="px-8 py-6 text-text-body/40 font-semibold text-[13px] uppercase tracking-wider text-right">Montant</th>
              <th class="px-8 py-6 text-text-body/40 font-semibold text-[13px] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#eff3f1]/50">
            <tr v-for="(tx, index) in finalTransactions" :key="index" class="hover:bg-input-bg/50 transition-colors group">
              <td class="px-8 py-5">
                <span class="text-text-body font-semibold text-[15px]">{{ tx.formattedDate }}</span>
              </td>
              <td class="px-8 py-5">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-[14px] text-white flex items-center justify-center shadow-sm shrink-0" :style="{ backgroundColor: tx.category.color }">
                    <span v-html="tx.category.icon" class="scale-75"></span>
                  </div>
                  <span class="text-text-heading font-bold text-[16px]">{{ tx.merchant }}</span>
                </div>
              </td>
              <td class="px-8 py-5">
                <span class="px-4 py-1.5 rounded-full bg-[#f0f4f2] text-primary text-[13px] font-bold border border-primary/5">
                  {{ tx.category.name }}
                </span>
              </td>
              <td class="px-8 py-5 text-right">
                <span class="text-[17px] font-bold text-text-heading">
                  {{ formatCurrency(tx.amount) }}
                </span>
              </td>
              <td class="px-8 py-5 text-right">
                <div class="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <NuxtLink :to="`/transactions/${tx.id}`" class="p-2 text-text-body/40 hover:text-primary transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </NuxtLink>
                  <button @click="deleteExpense(tx.id)" class="p-2 text-text-body/40 hover:text-red-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="finalTransactions.length === 0">
              <td colspan="5" class="px-8 py-20 text-center">
                <div class="flex flex-col items-center gap-4 text-text-body/40">
                  <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span class="text-xl font-medium">Aucune dépense trouvée</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination (Mock) -->
      <div class="mt-auto border-t border-[#eff3f1] p-8 flex items-center justify-between">
        <span class="text-[14px] text-text-body/50 font-medium">Affichage de 1 à {{ finalTransactions.length }} sur {{ filteredTransactions.length }} transactions</span>
        <div class="flex gap-3">
          <button class="w-10 h-10 rounded-xl border border-[#eff3f1] flex items-center justify-center text-text-body/40 hover:bg-input-bg transition-colors disabled:opacity-30" disabled>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button class="w-10 h-10 rounded-xl bg-white border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">1</button>
          <button class="w-10 h-10 rounded-xl border border-[#eff3f1] flex items-center justify-center text-text-body/40 hover:bg-input-bg transition-colors disabled:opacity-30" disabled>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFilterTime, type TimeFilter } from '~/composables/useFilters';
import { exportToCSV, exportToPDF } from '~/utils/exportData';

definePageMeta({
  middleware: 'auth'
});

const searchQuery = ref('');
const selectedCategory = ref('all');
const isExportMenuOpen = ref(false);

const timeFilter = useFilterTime('expenses', 'month');

const filters: { id: TimeFilter, label: string }[] = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
  { id: 'all', label: 'Tout' },
];

const timeFilterLabel = computed(() => {
  const labels: Record<TimeFilter, string> = {
    week: 'Cette Semaine',
    month: 'Ce Mois',
    year: 'Cette Année',
    all: 'Toujours'
  };
  return labels[timeFilter.value];
});

const categories = ref<any[]>([]);
const expenses = ref<any[]>([]);

const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amountInCents / 100);
};

const formatCompact = (amountInCents: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amountInCents / 100);
};

const fetchData = async () => {
  const [cats, exps] = await Promise.all([
    $fetch('/api/categories'),
    $fetch('/api/expenses')
  ]);
  categories.value = cats as any[];
  expenses.value = exps as any[];
};

const deleteExpense = async (id: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

  try {
    await $fetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    });
    expenses.value = expenses.value.filter(e => e.id !== id);
  } catch (err) {
    console.error('Failed to delete expense', err);
    alert('Une erreur est survenue lors de la suppression.');
  }
};

onMounted(fetchData);

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

// Time-only filtered list — drives the overview (total, categories, chart)
const timeFilteredExpenses = computed(() => {
  return expenses.value.filter(tx => matchesTimeFilter(new Date(tx.date)));
});

const overviewTotal = computed(() => timeFilteredExpenses.value.reduce((acc, tx) => acc + tx.amount, 0));

const overviewCategories = computed(() => {
  const stats: Record<number, { name: string, amount: number, color: string }> = {};
  timeFilteredExpenses.value.forEach(tx => {
    if (!stats[tx.category.id]) {
      stats[tx.category.id] = { name: tx.category.name, amount: 0, color: tx.category.color };
    }
    stats[tx.category.id].amount += tx.amount;
  });
  const total = overviewTotal.value || 1;
  return Object.values(stats).map(s => ({
    ...s,
    percentage: Math.round((s.amount / total) * 100)
  })).sort((a, b) => b.amount - a.amount);
});

// Table list — time + category + search filters
const filteredTransactions = computed(() => {
  return timeFilteredExpenses.value.filter(tx => {
    if (selectedCategory.value !== 'all' && String(tx.category.id) !== selectedCategory.value) return false;
    return true;
  });
});

const finalTransactions = computed(() => {
  return filteredTransactions.value
    .filter(tx => tx.merchant.toLowerCase().includes(searchQuery.value.toLowerCase()))
    .map(tx => ({
      ...tx,
      formattedDate: new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    }));
});

const handleExport = (format: 'csv' | 'pdf') => {
  const headers = ['Date', 'Marchand', 'Catégorie', 'Montant', 'Note'];
  const data = timeFilteredExpenses.value
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(tx => [
      new Date(tx.date).toLocaleDateString('fr-FR'),
      tx.merchant,
      tx.category.name,
      formatCurrency(tx.amount).replace('€', '').trim(),
      tx.note || ''
    ]);

  const title = `Rapport de dépenses - ${timeFilterLabel.value}`;
  const filename = `depenses_${timeFilter.value}_${new Date().toISOString().split('T')[0]}`;

  if (format === 'csv') {
    exportToCSV(filename, headers, data);
  } else {
    exportToPDF(title, filename, headers, data);
  }
};

// Dynamic Chart Logic (expenses over the selected period)
const chartData = computed(() => {
  const buckets: Record<string, number> = {};
  const labels: string[] = [];
  const now = new Date();

  if (timeFilter.value === 'week') {
    labels.push('Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim');
    labels.forEach(l => buckets[l] = 0);
    timeFilteredExpenses.value.forEach(tx => {
      let day = new Date(tx.date).getDay();
      day = day === 0 ? 6 : day - 1;
      const label = labels[day] as string;
      buckets[label] = (buckets[label] || 0) + tx.amount;
    });
  } else if (timeFilter.value === 'month') {
    labels.push('Sem 1', 'Sem 2', 'Sem 3', 'Sem 4+');
    labels.forEach(l => buckets[l] = 0);
    timeFilteredExpenses.value.forEach(tx => {
      const date = new Date(tx.date).getDate();
      let week = Math.floor((date - 1) / 7);
      if (week > 3) week = 3;
      const label = labels[week] as string;
      buckets[label] = (buckets[label] || 0) + tx.amount;
    });
  } else if (timeFilter.value === 'year') {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    labels.push(...monthNames);
    labels.forEach(l => buckets[l] = 0);
    timeFilteredExpenses.value.forEach(tx => {
      const month = new Date(tx.date).getMonth();
      const label = labels[month] as string;
      buckets[label] = (buckets[label] || 0) + tx.amount;
    });
  } else if (timeFilter.value === 'all') {
    if (timeFilteredExpenses.value.length === 0) {
      labels.push(now.getFullYear().toString());
      labels.forEach(l => buckets[l] = 0);
    } else {
      const years = timeFilteredExpenses.value.map(tx => new Date(tx.date).getFullYear());
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years, now.getFullYear());
      for (let y = minYear; y <= maxYear; y++) {
        labels.push(y.toString());
        buckets[y.toString()] = 0;
      }
      timeFilteredExpenses.value.forEach(tx => {
        const year = new Date(tx.date).getFullYear().toString();
        buckets[year] = (buckets[year] || 0) + tx.amount;
      });
    }
  }

  const values = labels.map(l => buckets[l] || 0);
  const max = Math.max(...values, 100);
  const width = 500;
  const height = 100;

  return labels.map((label, i) => {
    const x = labels.length > 1 ? (i / (labels.length - 1)) * width : width / 2;
    const y = height - ((values[i] || 0) / max) * height;
    const paddedY = Math.max(10, Math.min(y, height - 10));
    const paddedX = Math.max(10, Math.min(x, width - 10));
    return { label, value: values[i], x: paddedX, y: paddedY };
  });
});

const chartLinePoints = computed(() => chartData.value.map(pt => `${pt.x},${pt.y}`).join(' '));

const chartAreaPath = computed(() => {
  const pts = chartData.value;
  if (!pts || pts.length === 0) return '';
  const firstPt = pts[0];
  const lastPt = pts[pts.length - 1];
  if (!firstPt || !lastPt) return '';
  const width = 500;
  const height = 120;
  let d = `M${firstPt.x},${height} L${firstPt.x},${firstPt.y} `;
  pts.forEach((pt, i) => {
    if (i > 0) d += `L${pt.x},${pt.y} `;
  });
  d += `L${lastPt.x},${height} Z`;
  return d;
});
</script>

<style scoped>
/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(41, 75, 60, 0.1);
  border-radius: 20px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(41, 75, 60, 0.2);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.bg-primary .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

table tr:last-child {
  border-bottom: none;
}
</style>
