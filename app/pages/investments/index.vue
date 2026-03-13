<template>
  <div class="flex flex-col gap-6 lg:gap-8 w-full pb-20">
    
    <!-- Top Row Content -->
    <div class="flex flex-col md:flex-row gap-6 lg:gap-10 min-w-0">
      <!-- Left Column (Total & Assets) -->
      <div class="flex flex-col gap-6 lg:gap-8 w-full md:w-[55%]">
        
        <!-- Total Invested & Chart Widget -->
        <div class="bg-card-inner rounded-[36px] pt-8 px-8 pb-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] overflow-hidden relative flex flex-col h-[400px] md:h-[320px] transition-transform hover:-translate-y-1 duration-300">
          
          <div class="relative z-10 flex flex-col h-full">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4 sm:gap-0">
              <h2 class="text-text-heading text-[22px] font-medium">Investissements</h2>
              
              <!-- Time Filter Toggle -->
              <div class="flex items-center bg-[#f0f4f2] p-1.5 rounded-2xl w-fit">
                <button @click="timeFilter = 'week'" :class="['px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all', timeFilter === 'week' ? 'bg-white shadow-sm text-primary' : 'text-text-body/60 hover:text-text-heading']">
                  Semaine
                </button>
                <button @click="timeFilter = 'month'" :class="['px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all', timeFilter === 'month' ? 'bg-white shadow-sm text-primary' : 'text-text-body/60 hover:text-text-heading']">
                  Mois
                </button>
                <button @click="timeFilter = 'year'" :class="['px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all', timeFilter === 'year' ? 'bg-white shadow-sm text-primary' : 'text-text-body/60 hover:text-text-heading']">
                  Année
                </button>
                <button @click="timeFilter = 'all'" :class="['px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all', timeFilter === 'all' ? 'bg-white shadow-sm text-primary' : 'text-text-body/60 hover:text-text-heading']">
                  Tout
                </button>
              </div>
            </div>

            <!-- Dynamic Amount -->
            <div class="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-6">
              <div class="flex flex-col">
                <div class="text-[42px] sm:text-[48px] leading-none tracking-tight font-semibold text-text-heading">
                  {{ currentTotal }}
                </div>
                <div class="text-text-body/60 text-sm mt-1 font-medium">
                  Net investi {{ timeFilterLabel.toLowerCase() }}
                </div>
              </div>
              
              <div v-if="timeFilter === 'all'" class="flex flex-col pb-1">
                <div class="text-[18px] sm:text-[22px] font-bold" :class="totalRealizedPnL >= 0 ? 'text-primary' : 'text-red-500'">
                  {{ totalRealizedPnL >= 0 ? '+' : '' }}{{ formatCurrency(totalRealizedPnL) }}
                </div>
                <div class="text-[11px] text-text-body/40 font-bold uppercase tracking-wider">
                  Profit réalisé total
                </div>
              </div>
            </div>
          </div>
          
          <!-- Dynamic Chart inside card -->
          <div class="absolute bottom-4 left-6 right-6 h-[140px] flex flex-col justify-end pointer-events-none transition-opacity duration-300">
            <!-- SVG Line Chart -->
            <svg viewBox="0 0 500 120" preserveAspectRatio="none" class="w-full h-[100px] overflow-visible">
              <defs>
                <linearGradient id="dynamicGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#294b3c" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#294b3c" stop-opacity="0.0" />
                </linearGradient>
              </defs>
              <path :d="chartAreaPath" fill="url(#dynamicGradient)" />
              <polyline :points="chartLinePoints" fill="none" stroke="#294b3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <!-- X Axis Labels -->
            <div class="flex justify-between mt-2 pt-1 border-t border-input-border/30">
              <span v-for="(pt, i) in chartData" :key="'label-'+i" 
                :class="['text-[11px] font-medium text-text-body/50', (chartData.length > 7 && i % 2 !== 0) ? 'hidden sm:block' : 'block']" 
                :style="{ width: (100 / (chartData.length > 7 ? (chartData.length/2) : chartData.length)) + '%', textAlign: 'center' }">
                {{ pt.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Portfolio Assets Widget -->
        <div class="bg-primary rounded-[36px] p-8 sm:p-10 shadow-[0_12px_40px_rgba(41,75,60,0.15)] flex flex-col md:h-[400px] text-white relative overflow-hidden md:overflow-hidden transition-transform hover:-translate-y-1 duration-300">
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

          <div class="flex justify-between items-start sm:items-center mb-6 relative z-10 shrink-0 gap-4">
            <h2 class="text-[18px] sm:text-[22px] font-medium leading-tight">Actifs en portefeuille</h2>
            <span class="text-white/60 text-[11px] sm:text-sm font-medium bg-white/10 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">Temps réel</span>
          </div>
          
          <div class="flex flex-col grow gap-6 relative z-10 md:overflow-y-auto pr-2 custom-scrollbar pt-1">
            <div v-for="(asset, index) in currentAssets" :key="index" class="group/asset">
              <div class="flex justify-between items-start mb-2">
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-[18px] sm:text-[20px] text-white">{{ asset.name }}</span>
                    <span v-if="asset.netInvested > 0" class="font-bold text-[11px] text-white/60 bg-white/10 px-2 py-0.5 rounded-md">{{ asset.portfolioPercentage.toFixed(1) }}%</span>
                    <span class="font-medium text-[12px] text-white/50 bg-white/10 px-2 py-0.5 rounded-md">{{ asset.quantity.toLocaleString('fr-FR') }} unités</span>
                  </div>
                  <div class="flex flex-col gap-1 mt-1">
                    <div class="flex items-center gap-2" title="Prix d'achat moyen (Pondéré par vos achats et ventes)">
                      <span class="text-[11px] text-white/40 font-bold uppercase tracking-wider">Prix Moyen:</span>
                      <span class="text-[14px] text-white font-bold">{{ formatCurrency(asset.avgPrice, true) }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-[11px] text-white/40 font-bold uppercase tracking-wider mb-1">Valeur Net</span>
                  <span class="font-bold text-[18px] sm:text-[20px] tracking-wide" :class="asset.netInvested < 0 ? 'text-green-300' : 'text-white'">
                    {{ formatCurrency(Math.abs(asset.netInvested)) }}
                    <span class="text-[12px] align-top ml-0.5">{{ asset.netInvested < 0 ? 'PROFIT' : '' }}</span>
                  </span>
                </div>
              </div>
              <div class="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1">
                <div class="h-full rounded-full transition-all duration-1000 ease-out bg-white/40 group-hover/asset:bg-white/80" :style="{ width: asset.percentage + '%' }"></div>
              </div>
            </div>
            <div v-if="currentAssets.length === 0" class="flex items-center justify-center h-full text-white/40 italic">
              Aucun actif en portefeuille
            </div>
          </div>
        </div>
        
      </div>

      <!-- Right Column (Transactions) -->
      <div class="flex flex-col w-full md:w-[45%] md:h-[744px]">
        
         <!-- Recent Investments Widget -->
         <div class="bg-card-inner rounded-[36px] pt-8 px-6 sm:px-8 pb-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col flex-grow transition-transform hover:-translate-y-1 duration-300 relative">
           
           <div class="flex justify-between items-center mb-6">
             <h2 class="text-text-heading text-[22px] font-medium">Historique récent</h2>
             <NuxtLink to="/investments/add" class="w-11 h-11 rounded-[16px] bg-primary text-white flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20" title="Ajouter un investissement">
               <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
               </svg>
             </NuxtLink>
           </div>
           
           <!-- List that scrolls if too many -->
            <div class="flex flex-col gap-4 md:overflow-y-auto pr-2 custom-scrollbar grow pb-4">
              <div v-for="(tx, index) in recentTransactions" :key="index" class="flex items-center justify-between group p-3 -mx-2 rounded-2xl hover:bg-input-bg transition-colors relative z-0">
               <div class="flex items-center gap-4">
                 <div class="w-12 h-12 rounded-[16px] flex items-center justify-center shadow-sm text-white shrink-0" 
                      :class="tx.type === 'buy' ? 'bg-[#294b3c]' : 'bg-[#e74c3c]'">
                   <svg v-if="tx.type === 'buy'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                   </svg>
                   <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                   </svg>
                 </div>
                 <div class="flex flex-col min-w-0">
                   <h3 class="text-[16px] sm:text-[17px] font-semibold text-text-heading leading-tight truncate">{{ tx.asset }}</h3>
                   <span class="text-[13px] text-text-body/60 font-medium whitespace-nowrap">{{ tx.formattedDate }} • {{ tx.type === 'buy' ? 'Achat' : 'Vente' }} de {{ tx.quantity }}</span>
                   <span v-if="tx.note" class="text-[12px] text-text-body/40 italic mt-0.5 line-clamp-1 max-w-[150px]">{{ tx.note }}</span>
                 </div>
               </div>
                <div class="flex items-center gap-3 shrink-0">
                  <div class="flex flex-col items-end">
                    <span class="text-[16px] sm:text-[17px] font-bold" :class="tx.type === 'buy' ? 'text-primary' : 'text-[#e74c3c]'">
                      {{ tx.type === 'buy' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
                    </span>
                    <span class="text-[10px] text-text-body/40 font-bold uppercase tracking-tighter">{{ formatCurrency(tx.amount / tx.quantity, true) }} / unit</span>
                  </div>
                </div>
             </div>
             
             <div v-if="filteredTransactions.length === 0" class="flex flex-col items-center justify-center gap-4 py-10 text-text-body/30 italic">
               <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               <span>Aucun investissement trouvé</span>
             </div>
           </div>

            <NuxtLink 
              v-if="investments.length > 0"
              to="/investments/list" 
              class="mt-4 text-[13px] font-bold text-primary flex items-center justify-center gap-2 py-3 hover:bg-primary/5 rounded-xl transition-all border border-transparent hover:border-primary/10 tracking-tight"
            >
              Voir tout l'historique
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

definePageMeta({
  middleware: 'auth'
});

type TimeFilter = 'week' | 'month' | 'year' | 'all';
const timeFilter = ref<TimeFilter>('all');

const timeFilterLabel = computed(() => {
  const labels: Record<TimeFilter, string> = {
    week: 'Cette Semaine',
    month: 'Ce Mois',
    year: 'Cette Année',
    all: 'Toujours'
  };
  return labels[timeFilter.value];
});

const investments = ref<any[]>([]);

const formatCurrency = (amountInCents: number, exact = false) => {
  const val = amountInCents / 100;
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: exact ? 2 : 0 
  }).format(val);
};

const fetchData = async () => {
  try {
    const data = await $fetch('/api/investments');
    investments.value = data as any[];
  } catch (err) {
    console.error('Failed to fetch investments', err);
  }
};

const deleteInvestment = async (id: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet investissement ?')) return;
  try {
    await $fetch(`/api/investments/${id}`, { method: 'DELETE' });
    investments.value = investments.value.filter(inv => inv.id !== id);
  } catch (err) {
    console.error('Failed to delete investment', err);
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

// Filtered list based on time
const filteredTransactions = computed(() => {
  const now = new Date();
  const list = investments.value.filter(tx => {
    const txDate = new Date(tx.date);
    if (timeFilter.value === 'week') {
      return getWeekNumber(txDate) === getWeekNumber(now) && txDate.getFullYear() === now.getFullYear();
    } else if (timeFilter.value === 'month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    } else if (timeFilter.value === 'year') {
      return txDate.getFullYear() === now.getFullYear();
    }
    return true;
  });
  
  return list.map(tx => ({
    ...tx,
    formattedDate: new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: timeFilter.value === 'all' ? 'numeric' : undefined })
  }));
});

const recentTransactions = computed(() => {
  return [...investments.value]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)
    .map(tx => ({
      ...tx,
      formattedDate: new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }));
});

// Total Invested (Buys - Sells)
const currentTotalValue = computed(() => {
  return filteredTransactions.value.reduce((acc, tx) => {
    return acc + (tx.type === 'buy' ? tx.amount : -tx.amount);
  }, 0);
});

const currentTotal = computed(() => formatCurrency(currentTotalValue.value));

// Assets computing (Single Average Price reflecting buys & sales)
const currentAssets = computed(() => {
  const assetsGroup = new Map<string, any[]>();
  
  // Chronological sort
  const sortedAll = [...investments.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedAll.forEach(tx => {
    if (!assetsGroup.has(tx.asset)) assetsGroup.set(tx.asset, []);
    assetsGroup.get(tx.asset)?.push(tx);
  });

  const results = Array.from(assetsGroup.entries()).map(([assetName, txs]) => {
    let runningQty = 0;
    let netInvested = 0; // buys - sells
    let realizedPnL = 0;
    let runningCostBasis = 0; // for internal PnL tracking

    txs.forEach(tx => {
      if (tx.type === 'buy') {
        runningQty += tx.quantity;
        netInvested += tx.amount;
        runningCostBasis += tx.amount;
      } else {
        // Calculate realized PnL based on previous weighted average before this sale
        const avgBeforeSale = runningQty > 0 ? (runningCostBasis / runningQty) : 0;
        const sellQtyMatched = Math.min(tx.quantity, runningQty);
        realizedPnL += (tx.amount - (avgBeforeSale * sellQtyMatched));
        
        runningQty -= tx.quantity;
        netInvested -= tx.amount;
        runningCostBasis -= avgBeforeSale * sellQtyMatched;
      }
    });

    // The "Average Price" requested (reflects impact of sales on net investment)
    const avgPrice = runningQty > 0 ? (netInvested / runningQty) : 0;

    return {
      name: assetName,
      quantity: runningQty,
      avgPrice,
      netInvested,
      realizedPnL
    };
  }).filter(a => a.quantity > 0.00000001 || Math.abs(a.realizedPnL) > 0.00000001);
  
  const totalNet = results.reduce((acc, r) => acc + Math.max(0, r.netInvested), 0);
  const maxVal = Math.max(...results.map(r => Math.max(0, r.netInvested)), 1);

  return results.map(r => ({ 
    ...r, 
    portfolioPercentage: totalNet > 0 ? (Math.max(0, r.netInvested) / totalNet) * 100 : 0,
    percentage: Math.max(5, Math.min(100, Math.round((Math.max(0, r.netInvested) / maxVal) * 100))) 
  })).sort((a, b) => b.netInvested - a.netInvested);
});

const totalRealizedPnL = computed(() => {
  return currentAssets.value.reduce((acc, a) => acc + a.realizedPnL, 0);
});

// Dynamic Chart Logic
const chartData = computed(() => {
  const buckets: Record<string, number> = {};
  const labels: string[] = [];
  const now = new Date();

  if (timeFilter.value === 'week') {
    labels.push('Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim');
    labels.forEach(l => buckets[l] = 0);
    filteredTransactions.value.forEach(tx => {
      let day = new Date(tx.date).getDay();
      day = day === 0 ? 6 : day - 1;
      const label = labels[day] as string;
      buckets[label] = (buckets[label] || 0) + (tx.type === 'buy' ? tx.amount : -tx.amount);
    });
  } else if (timeFilter.value === 'month') {
    labels.push('Sem 1', 'Sem 2', 'Sem 3', 'Sem 4+');
    labels.forEach(l => buckets[l] = 0);
    filteredTransactions.value.forEach(tx => {
      const date = new Date(tx.date).getDate();
      let week = Math.floor((date - 1) / 7);
      if (week > 3) week = 3;
      const label = labels[week] as string;
      buckets[label] = (buckets[label] || 0) + (tx.type === 'buy' ? tx.amount : -tx.amount);
    });
  } else if (timeFilter.value === 'year') {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    labels.push(...monthNames);
    labels.forEach(l => buckets[l] = 0);
    filteredTransactions.value.forEach(tx => {
      const month = new Date(tx.date).getMonth();
      const label = labels[month] as string;
      buckets[label] = (buckets[label] || 0) + (tx.type === 'buy' ? tx.amount : -tx.amount);
    });
  } else if (timeFilter.value === 'all') {
    if (filteredTransactions.value.length === 0) {
      labels.push(now.getFullYear().toString());
      labels.forEach(l => buckets[l] = 0);
    } else {
      const years = filteredTransactions.value.map(tx => new Date(tx.date).getFullYear());
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years, now.getFullYear());
      for (let y = minYear; y <= maxYear; y++) {
        labels.push(y.toString());
        buckets[y.toString()] = 0;
      }
      filteredTransactions.value.forEach(tx => {
        const year = new Date(tx.date).getFullYear().toString();
        buckets[year] = (buckets[year] || 0) + (tx.type === 'buy' ? tx.amount : -tx.amount);
      });
    }
  }

  // To draw a line chart of net investments per bucket
  // We actually want a cumulative chart if it's 'all' or 'year' perhaps? 
  // Let's stick to the bar/line style of volumes for now, same as dashboard
  const values = labels.map(l => Math.max(0, buckets[l] || 0)); // Avoid negative spikes for simple visual
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

const chartLinePoints = computed(() => {
  return chartData.value.map(pt => `${pt.x},${pt.y}`).join(' ');
});

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
.bg-primary .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}
</style>
