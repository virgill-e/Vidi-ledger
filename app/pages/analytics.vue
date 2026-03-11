<template>
  <div class="flex flex-col gap-6 lg:gap-10 min-w-0 mx-auto max-w-[1200px] w-full">
    
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden">
      <div>
        <h1 class="text-3xl font-bold text-text-heading tracking-tight mb-2">Analyses & Statistiques</h1>
        <p class="text-text-body/60 font-medium">Visualisez vos habitudes de consommation et optimisez votre budget.</p>
      </div>
      
      <!-- Filters & Navigation Controls -->
      <div class="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6">
        <!-- Range Type Selector -->
        <div class="flex items-center bg-[#e3ece8] p-1 rounded-[24px] w-full sm:w-fit shadow-sm border border-white/50">
          <button v-for="filter in filters" :key="filter.id" 
            @click="timeFilter = filter.id"
            :class="['flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-[18px] text-[12px] sm:text-[13px] font-bold transition-all', timeFilter === filter.id ? 'bg-white shadow-sm text-primary' : 'text-text-body/60 hover:text-text-heading']">
            {{ filter.label }}
          </button>
        </div>

        <!-- Period Navigator -->
        <div v-if="timeFilter !== 'all'" class="flex items-center gap-2 sm:gap-3 w-full sm:w-fit">
          <div class="flex items-center bg-[#e3ece8] p-1 rounded-[24px] shadow-sm border border-white/50 grow sm:grow-0">
            <!-- Prev Button -->
            <button @click="navigatePeriod(-1)" class="p-2 sm:p-2.5 rounded-[18px] text-text-body/60 hover:bg-white hover:text-primary transition-all" title="Précédent">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sm:w-[20px] sm:h-[20px]"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            
            <!-- Current Period Label -->
            <div 
              @click="triggerPicker"
              class="px-3 sm:px-6 py-2 text-[12px] sm:text-[14px] font-bold text-primary min-w-[100px] sm:min-w-[160px] grow text-center border-x border-white/30 capitalize whitespace-nowrap cursor-pointer hover:bg-white/50 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 group/label"
            >
              {{ timeFilterLabel }}
              <svg v-if="timeFilter === 'month' || timeFilter === 'year'" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="opacity-30 group-hover/label:opacity-80 transition-opacity sm:w-[12px] sm:h-[12px]"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            
            <!-- Hidden native pickers -->
            <input 
              v-if="timeFilter === 'month'" 
              ref="monthPickerRef" 
              type="month" 
              class="absolute invisible pointer-events-none" 
              @change="onDatePicked"
            />
            <input 
              v-if="timeFilter === 'year'" 
              ref="yearPickerRef" 
              type="number" 
              min="2000" 
              max="2100" 
              class="absolute invisible pointer-events-none" 
              @change="onDatePicked"
            />

            <!-- Next Button -->
            <button @click="navigatePeriod(1)" class="p-2 sm:p-2.5 rounded-[18px] text-text-body/60 hover:bg-white hover:text-primary transition-all" title="Suivant">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sm:w-[20px] sm:h-[20px]"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <!-- Quick Return to Today -->
          <button 
            @click="resetSelection" 
            class="group flex items-center justify-center gap-2 p-3 sm:px-5 sm:py-3 rounded-[24px] bg-white border border-[#eff3f1] text-primary text-[13px] font-bold shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 shrink-0"
            title="Aujourd'hui"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-70 group-hover:opacity-100 sm:w-[16px] sm:h-[16px]">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="hidden sm:inline">Aujourd'hui</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Top Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-card-inner rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] transition-transform hover:-translate-y-1">
        <span class="text-text-body/50 text-[14px] font-semibold uppercase tracking-wider">Dépenses Totales</span>
        <div class="text-[32px] font-bold text-text-heading mt-2">{{ currentTotal }}</div>
      </div>
      <div class="bg-card-inner rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] transition-transform hover:-translate-y-1">
        <span class="text-text-body/50 text-[14px] font-semibold uppercase tracking-wider">Nombre de transactions</span>
        <div class="text-[32px] font-bold text-text-heading mt-2">{{ filteredTransactions.length }}</div>
      </div>
      <div class="bg-card-inner rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] transition-transform hover:-translate-y-1">
        <span class="text-text-body/50 text-[14px] font-semibold uppercase tracking-wider">Moyenne / jour</span>
        <div class="text-[32px] font-bold text-text-heading mt-2">{{ formatCurrency(dailyAverage) }}</div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="flex flex-col gap-8 lg:gap-10">
      
      <!-- Spending Distribution (Category Breakdown) -->
      <div class="bg-card-inner rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col">
        <h2 class="text-text-heading text-[22px] font-bold mb-8">Répartition par catégorie</h2>
        
        <div class="flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-20 grow">
          <!-- Donut Chart (SVG) -->
          <div class="relative w-48 h-48 lg:w-64 lg:h-64 shrink-0 mx-auto lg:mx-0">
            <svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90">
              <circle 
                v-for="(seg, i) in donutSegments" :key="i"
                cx="50" cy="50" r="40"
                fill="transparent"
                :stroke="seg.color"
                stroke-width="12"
                :stroke-dasharray="seg.dashArray"
                :stroke-dashoffset="seg.dashOffset"
                class="transition-all duration-1000 ease-out"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-text-body/50 text-[11px] font-bold uppercase tracking-widest">Total</span>
              <span class="text-text-heading text-3xl font-bold">{{ currentTotal }}</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5 grow w-full min-w-0 py-2">
            <div v-for="cat in categoryComparison" :key="cat.name" class="flex items-center justify-between group cursor-default gap-4 border-b border-[#eff3f1]/50 pb-2">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" :style="{ backgroundColor: cat.color }">
                  <span v-html="cat.icon" class="scale-75"></span>
                </div>
                <span class="text-text-heading font-semibold text-[16px] group-hover:text-primary transition-colors whitespace-nowrap">{{ cat.name }}</span>
              </div>
              <div class="flex items-center gap-4 shrink-0">
                <span class="text-text-body/40 text-[14px] font-medium">{{ cat.percentage }}%</span>
                <span class="text-text-heading font-bold text-[16px] text-right tabular-nums">{{ formatCurrency(cat.amount) }}</span>
              </div>
            </div>
            <div v-if="categoryComparison.length === 0" class="col-span-full py-10 text-center text-text-body/40 italic">
              Aucune donnée pour cette période
            </div>
          </div>
        </div>
      </div>

      <!-- Spending by Weekday (Bar Chart) -->
      <div class="bg-primary rounded-[40px] p-8 lg:p-10 shadow-[0_12px_40px_rgba(41,75,60,0.15)] text-white flex flex-col relative">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div class="flex justify-between items-center mb-10 relative z-10">
          <h2 class="text-[22px] font-bold">Dépenses par jour de la semaine</h2>
          <span class="text-white/60 text-[13px] font-medium bg-white/10 px-4 py-1.5 rounded-full">{{ timeFilterLabel }}</span>
        </div>

        <div class="flex items-end justify-between grow gap-3 sm:gap-5 relative z-10 mb-2 min-h-[250px]">
          <div v-for="day in weekdaySpending" :key="day.label" class="flex flex-col items-center grow group">
            <div class="w-full relative flex flex-col justify-end h-64 pb-1">
              <div class="text-center mb-3 transition-all duration-300 transform group-hover:-translate-y-1">
                <span class="text-[10px] sm:text-[12px] font-bold text-white/50 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                  {{ formatCurrency(day.amount) }}
                </span>
              </div>
              <div 
                class="w-full bg-[#92d3a7] rounded-t-2xl transition-all duration-700 ease-out origin-bottom relative shadow-lg group-hover:bg-white group-hover:shadow-[0_0_20px_rgba(146,211,167,0.4)]"
                :style="{ height: Math.max(day.percentage, 5) + '%' }"
              >
              </div>
            </div>
            <span class="mt-4 text-[13px] font-bold text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">{{ day.label }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Bottom Row: Top Merchants -->
    <div class="bg-card-inner rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-text-heading text-[22px] font-bold">Commerçants les plus fréquents</h2>
        <NuxtLink to="/transactions" class="text-primary font-bold text-[15px] hover:underline transition-all">Voir tout l'historique</NuxtLink>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="(merchant, index) in topMerchants" :key="index" class="p-6 rounded-3xl bg-bg-base/50 border border-[#eff3f1] hover:border-primary/20 hover:bg-white transition-all group">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-sm" :style="{ backgroundColor: merchant.color }">
              <span v-html="merchant.icon" class="scale-90"></span>
            </div>
            <div class="min-w-0">
              <h3 class="text-text-heading font-bold text-[16px] group-hover:text-primary transition-colors truncate">{{ merchant.name }}</h3>
              <span class="text-text-body/40 text-[13px] font-medium">{{ merchant.count }} transactions</span>
            </div>
          </div>
          <div class="flex justify-between items-end">
            <span class="text-text-body/40 text-[13px] font-medium">Total dépensé</span>
            <span class="text-text-heading font-bold text-[18px]">{{ formatCurrency(merchant.amount) }}</span>
          </div>
          <div class="mt-4 h-1.5 w-full bg-[#e3ece8] rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full" :style="{ width: (merchant.amount / (topMerchants[0]?.amount || merchant.amount || 1) * 100) + '%' }"></div>
          </div>
        </div>
        <div v-if="topMerchants.length === 0" class="col-span-full py-10 text-center text-text-body/40 font-medium">
          Dépensez un peu plus pour voir vos statistiques ici !
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFilterTime, type TimeFilter } from '~/composables/useFilters';
import { 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  startOfYear, endOfYear,
  addWeeks, subWeeks,
  addMonths, subMonths,
  addYears, subYears,
  format, isWithinInterval,
  isSameWeek, isSameMonth, isSameYear
} from 'date-fns';
import { fr } from 'date-fns/locale';

definePageMeta({
  middleware: 'auth'
});

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface Expense {
  id: number;
  amount: number;
  date: string | Date;
  merchant: string;
  category: Category;
}

const categoriesList = ref<Category[]>([]);
const expensesList = ref<Expense[]>([]);
const selectedDate = ref(new Date());

const fetchData = async () => {
  const [cats, exps] = await Promise.all([
    $fetch('/api/categories'),
    $fetch('/api/expenses')
  ]);
  categoriesList.value = cats as Category[];
  expensesList.value = exps as Expense[];
};

onMounted(fetchData);

const timeFilter = useFilterTime('main', 'month');

const filters: { id: TimeFilter, label: string }[] = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
  { id: 'all', label: 'Tout' },
];

const timeFilterLabel = computed(() => {
  if (timeFilter.value === 'all') return 'Toujours';
  
  const options = { locale: fr };
  if (timeFilter.value === 'week') {
    const start = startOfWeek(selectedDate.value, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate.value, { weekStartsOn: 1 });
    return `S${format(selectedDate.value, 'ww', options)} (${format(start, 'dd MMM', options)} - ${format(end, 'dd MMM', options)})`;
  }
  if (timeFilter.value === 'month') {
    return format(selectedDate.value, 'MMMM yyyy', options);
  }
  if (timeFilter.value === 'year') {
    return format(selectedDate.value, 'yyyy', options);
  }
  return '';
});

const navigatePeriod = (direction: number) => {
  if (timeFilter.value === 'week') {
    selectedDate.value = direction > 0 ? addWeeks(selectedDate.value, 1) : subWeeks(selectedDate.value, 1);
  } else if (timeFilter.value === 'month') {
    selectedDate.value = direction > 0 ? addMonths(selectedDate.value, 1) : subMonths(selectedDate.value, 1);
  } else if (timeFilter.value === 'year') {
    selectedDate.value = direction > 0 ? addYears(selectedDate.value, 1) : subYears(selectedDate.value, 1);
  }
};

const resetSelection = () => {
  selectedDate.value = new Date();
};

const monthPickerRef = ref<HTMLInputElement | null>(null);
const yearPickerRef = ref<HTMLInputElement | null>(null);

const triggerPicker = () => {
  if (timeFilter.value === 'month') {
    monthPickerRef.value?.showPicker?.();
    if (!monthPickerRef.value?.showPicker) monthPickerRef.value?.click();
  } else if (timeFilter.value === 'year') {
    yearPickerRef.value?.focus();
  }
};

const onDatePicked = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.value) return;

  if (timeFilter.value === 'month') {
    selectedDate.value = new Date(target.value + '-01');
  } else if (timeFilter.value === 'year') {
    const year = parseInt(target.value);
    const newDate = new Date(selectedDate.value);
    newDate.setFullYear(year);
    selectedDate.value = newDate;
  }
};

const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(valueInCents / 100);
};

const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const filteredTransactions = computed(() => {
  if (timeFilter.value === 'all') return expensesList.value;

  const interval = (() => {
    if (timeFilter.value === 'week') {
      return { 
        start: startOfWeek(selectedDate.value, { weekStartsOn: 1 }), 
        end: endOfWeek(selectedDate.value, { weekStartsOn: 1 }) 
      };
    } else if (timeFilter.value === 'month') {
      return { 
        start: startOfMonth(selectedDate.value), 
        end: endOfMonth(selectedDate.value) 
      };
    } else if (timeFilter.value === 'year') {
      return { 
        start: startOfYear(selectedDate.value), 
        end: endOfYear(selectedDate.value) 
      };
    }
    return null;
  })();

  if (!interval) return expensesList.value;

  return expensesList.value.filter(tx => {
    const txDate = new Date(tx.date);
    return isWithinInterval(txDate, interval);
  });
});

const currentTotalValue = computed(() => {
  return filteredTransactions.value.reduce((acc, tx) => acc + tx.amount, 0);
});

const currentTotal = computed(() => formatCurrency(currentTotalValue.value));

const dailyAverage = computed(() => {
  if (filteredTransactions.value.length === 0) return 0;
  
  const allDates = expensesList.value.map(tx => new Date(tx.date).getTime());
  if (allDates.length === 0) return 0;
  const firstExpenseDate = new Date(Math.min(...allDates));
  firstExpenseDate.setHours(0, 0, 0, 0);

  let periodStartDate: Date;
  let periodEndDate: Date;

  if (timeFilter.value === 'week') {
    periodStartDate = startOfWeek(selectedDate.value, { weekStartsOn: 1 });
    periodEndDate = endOfWeek(selectedDate.value, { weekStartsOn: 1 });
  } else if (timeFilter.value === 'month') {
    periodStartDate = startOfMonth(selectedDate.value);
    periodEndDate = endOfMonth(selectedDate.value);
  } else if (timeFilter.value === 'year') {
    periodStartDate = startOfYear(selectedDate.value);
    periodEndDate = endOfYear(selectedDate.value);
  } else {
    periodStartDate = firstExpenseDate;
    periodEndDate = new Date();
    periodEndDate.setHours(23, 59, 59, 999);
  }

  const effectiveStartDate = periodStartDate > firstExpenseDate ? periodStartDate : firstExpenseDate;
  const now = new Date();
  const effectiveEndDate = periodEndDate > now ? now : periodEndDate;
  
  const diffTime = effectiveEndDate.getTime() - effectiveStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return currentTotalValue.value / Math.max(diffDays, 1);
});

const categoryComparison = computed(() => {
  const stats: Record<number, { name: string, amount: number, color: string, icon: string }> = {};
  filteredTransactions.value.forEach(tx => {
    if (!tx.category || !tx.category.id) return;
    const catId = tx.category.id;
    if (!stats[catId]) {
      stats[catId] = { 
        name: tx.category.name, 
        amount: 0, 
        color: tx.category.color,
        icon: tx.category.icon
      };
    }
    const s = stats[catId];
    if (s) s.amount += tx.amount;
  });
  
  const total = currentTotalValue.value || 1;
  return Object.values(stats)
    .map(s => ({
      ...s,
      percentage: Math.round((s.amount / total) * 100)
    }))
    .sort((a, b) => b.amount - a.amount);
});

const donutSegments = computed(() => {
  let currentOffset = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return categoryComparison.value.map(cat => {
    const p = cat.percentage || 0;
    const dashArray = `${(p * circumference) / 100} ${circumference}`;
    const dashOffset = -currentOffset;
    currentOffset += (p * circumference) / 100;
    return { ...cat, dashArray, dashOffset: dashOffset.toString() };
  });
});

const weekdaySpending = computed(() => {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const amounts = [0, 0, 0, 0, 0, 0, 0];
  
  filteredTransactions.value.forEach(tx => {
    let day = new Date(tx.date).getDay();
    day = day === 0 ? 6 : day - 1; // Mon=0, Sun=6
    amounts[day] += tx.amount;
  });

  const max = Math.max(...amounts, 1);
  return days.map((label, i) => {
    const amount = amounts[i] ?? 0;
    return {
      label,
      amount,
      percentage: (amount / max) * 100
    };
  });
});

const topMerchants = computed(() => {
  const counts: Record<string, { amount: number, count: number, icon: string, color: string }> = {};
  filteredTransactions.value.forEach(tx => {
    if (!tx.category || !tx.merchant) return;
    const merchantName = tx.merchant;
    if (!counts[merchantName]) {
      counts[merchantName] = { 
        amount: 0, 
        count: 0, 
        icon: tx.category.icon,
        color: tx.category.color 
      };
    }
    counts[merchantName]!.amount += tx.amount;
    counts[merchantName]!.count += 1;
  });

  return Object.entries(counts)
    .map(([name, data]) => ({
      name,
      ...data
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
});
</script>

<style scoped>
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>
