<template>
  <div class="flex flex-col gap-6 lg:gap-10 min-w-0 mx-auto max-w-[1200px] w-full pb-20">

    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
      <div class="flex flex-col gap-2">
        <NuxtLink to="/investments" class="flex items-center gap-2 text-text-body/60 hover:text-primary transition-colors font-semibold text-sm mb-2 w-fit">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour au Dashboard
        </NuxtLink>
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-[20px] bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20 shrink-0">
            {{ assetInitials }}
          </div>
          <div class="flex flex-col">
            <h1 class="text-3xl font-bold text-text-heading tracking-tight">{{ assetName }}</h1>
            <p class="text-text-body/60 font-medium">{{ transactions.length }} transaction{{ transactions.length > 1 ? 's' : '' }} • Depuis {{ firstDateLabel }}</p>
          </div>
        </div>
      </div>

      <NuxtLink
        :to="{ path: '/investments/add', query: { asset: assetName } }"
        class="bg-primary text-white px-6 py-4 rounded-[22px] font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 w-full sm:w-auto"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nouvelle transaction
      </NuxtLink>
    </div>

    <!-- Not Found State -->
    <div v-if="loaded && transactions.length === 0" class="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div class="w-20 h-20 rounded-[32px] bg-bg-base flex items-center justify-center text-text-body/10">
        <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div>
        <p class="text-lg font-bold text-text-heading">Aucune donnée pour « {{ assetName }} »</p>
        <p class="text-text-body/40 font-medium">Cet actif n'a aucune transaction enregistrée.</p>
      </div>
    </div>

    <template v-else>
      <!-- Key Metrics Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <!-- Net Invested / Position -->
        <div class="bg-primary rounded-[28px] p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden flex flex-col">
          <div class="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
          <p class="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2 relative z-10">{{ metrics.quantity > 0 ? 'Position nette' : 'Position clôturée' }}</p>
          <div class="text-2xl lg:text-[28px] font-black relative z-10 leading-tight">{{ formatCurrency(metrics.netInvested) }}</div>
          <p class="text-[12px] text-white/50 font-semibold mt-1 relative z-10">{{ metrics.quantity.toLocaleString('fr-FR') }} unités détenues</p>
        </div>

        <!-- Average Price -->
        <div class="bg-card-inner rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col">
          <p class="text-[11px] font-bold uppercase tracking-widest text-text-body/40 mb-2">Prix moyen (PRU)</p>
          <div class="text-2xl lg:text-[28px] font-black text-text-heading leading-tight">{{ metrics.quantity > 0 ? formatCurrency(metrics.avgPrice, true) : '—' }}</div>
          <p class="text-[12px] text-text-body/40 font-semibold mt-1">Coût moyen par unité</p>
        </div>

        <!-- Realized P&L -->
        <div class="bg-card-inner rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col">
          <p class="text-[11px] font-bold uppercase tracking-widest text-text-body/40 mb-2">P&L réalisé</p>
          <div class="text-2xl lg:text-[28px] font-black leading-tight" :class="metrics.realizedPnL >= 0 ? 'text-primary' : 'text-red-500'">
            {{ metrics.realizedPnL >= 0 ? '+' : '' }}{{ formatCurrency(metrics.realizedPnL) }}
          </div>
          <p class="text-[12px] text-text-body/40 font-semibold mt-1">Ventes + dividendes</p>
        </div>

        <!-- Dividends -->
        <div class="bg-card-inner rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col">
          <p class="text-[11px] font-bold uppercase tracking-widest text-text-body/40 mb-2">Dividendes perçus</p>
          <div class="text-2xl lg:text-[28px] font-black text-blue-500 leading-tight">{{ formatCurrency(metrics.totalDividends) }}</div>
          <p class="text-[12px] text-text-body/40 font-semibold mt-1">{{ dividendCount }} versement{{ dividendCount > 1 ? 's' : '' }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: Chart + Breakdown -->
        <div class="lg:col-span-2 flex flex-col gap-6">

          <!-- Cumulative Invested Chart -->
          <div class="bg-card-inner rounded-[36px] pt-8 px-8 pb-0 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] overflow-hidden relative flex flex-col h-[320px]">
            <h2 class="text-text-heading text-[22px] font-medium mb-1">Évolution de la position</h2>
            <p class="text-text-body/50 text-sm font-medium">Capital net investi au fil du temps</p>

            <div class="absolute bottom-4 left-6 right-6 h-[180px] flex flex-col justify-end pointer-events-none">
              <svg viewBox="0 0 500 120" preserveAspectRatio="none" class="w-full h-[140px] overflow-visible">
                <defs>
                  <linearGradient id="assetGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#294b3c" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#294b3c" stop-opacity="0.0" />
                  </linearGradient>
                </defs>
                <path :d="chartAreaPath" fill="url(#assetGradient)" />
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

          <!-- Buy / Sell Breakdown -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="bg-card-inner rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-[12px] bg-primary text-white flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <span class="text-sm font-bold text-text-heading">Achats</span>
              </div>
              <div class="text-xl font-black text-text-heading">{{ formatCurrency(metrics.totalBought) }}</div>
              <p class="text-[12px] text-text-body/40 font-semibold mt-1">{{ metrics.totalBoughtQty.toLocaleString('fr-FR') }} unités • {{ buyCount }} ordre{{ buyCount > 1 ? 's' : '' }}</p>
            </div>
            <div class="bg-card-inner rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-[12px] bg-red-500 text-white flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
                <span class="text-sm font-bold text-text-heading">Ventes</span>
              </div>
              <div class="text-xl font-black text-text-heading">{{ formatCurrency(metrics.totalSold) }}</div>
              <p class="text-[12px] text-text-body/40 font-semibold mt-1">{{ metrics.totalSoldQty.toLocaleString('fr-FR') }} unités • {{ sellCount }} ordre{{ sellCount > 1 ? 's' : '' }}</p>
            </div>
          </div>
        </div>

        <!-- Right: Transaction History -->
        <div class="bg-card-inner rounded-[36px] pt-8 px-6 sm:px-8 pb-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col">
          <h2 class="text-text-heading text-[22px] font-medium mb-6">Historique complet</h2>

          <div class="flex flex-col gap-3 lg:max-h-[560px] lg:overflow-y-auto pr-2 custom-scrollbar grow">
            <div
              v-for="tx in sortedTransactions"
              :key="tx.id"
              class="flex items-center justify-between group p-3 -mx-2 rounded-2xl hover:bg-input-bg transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-11 h-11 rounded-[14px] flex items-center justify-center shadow-sm text-white shrink-0"
                     :class="tx.type === 'buy' ? 'bg-[#294b3c]' : tx.type === 'sell' ? 'bg-[#e74c3c]' : 'bg-[#3498db]'">
                  <svg v-if="tx.type === 'buy'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <svg v-else-if="tx.type === 'sell'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex flex-col min-w-0 flex-1">
                  <h3 class="text-[15px] font-semibold text-text-heading leading-tight">
                    {{ tx.type === 'buy' ? 'Achat' : tx.type === 'sell' ? 'Vente' : 'Dividende' }}
                  </h3>
                  <span class="text-[12px] text-text-body/60 font-medium">{{ formatDate(tx.date) }}{{ tx.type === 'dividend' && tx.quantity === 0 ? '' : ' • ' + tx.quantity + ' unités' }}</span>
                  <span v-if="tx.note" class="text-[11px] text-text-body/40 italic mt-0.5 line-clamp-1">{{ tx.note }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0 pl-2">
                <div class="flex flex-col items-end">
                  <span class="text-[15px] font-bold whitespace-nowrap" :class="tx.type === 'buy' ? 'text-primary' : tx.type === 'sell' ? 'text-[#e74c3c]' : 'text-[#3498db]'">
                    {{ tx.type === 'buy' || tx.type === 'dividend' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
                  </span>
                  <span v-if="tx.quantity > 0" class="text-[10px] text-text-body/40 font-bold uppercase tracking-tighter">{{ formatCurrency(tx.amount / tx.quantity, true) }} / unit</span>
                </div>
                <div class="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    @click="handleEdit(tx)"
                    class="w-8 h-8 rounded-lg bg-bg-base text-text-body/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center"
                    title="Modifier"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    @click="handleDelete(tx.id)"
                    class="w-8 h-8 rounded-lg bg-bg-base text-text-body/40 hover:text-red-500 hover:bg-red-500/5 transition-all flex items-center justify-center"
                    title="Supprimer"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Feedback Message -->
    <Transition name="fade">
      <div v-if="showSuccess" class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-text-heading text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 z-[100]">
        <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="font-bold">{{ successMessage }}</span>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

definePageMeta({
  middleware: 'auth'
});

const route = useRoute();
const assetName = computed(() => decodeURIComponent(route.params.name as string));

const allInvestments = ref<any[]>([]);
const loaded = ref(false);
const showSuccess = ref(false);
const successMessage = ref('');

const fetchData = async () => {
  try {
    const data = await $fetch('/api/investments');
    allInvestments.value = data as any[];
  } catch (err) {
    console.error('Failed to fetch investments', err);
  } finally {
    loaded.value = true;
  }
};

onMounted(fetchData);

// Transactions for this asset only (case-insensitive match)
const transactions = computed(() =>
  allInvestments.value.filter(tx => tx.asset?.toLowerCase() === assetName.value.toLowerCase())
);

const sortedTransactions = computed(() =>
  [...transactions.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
);

const buyCount = computed(() => transactions.value.filter(tx => tx.type === 'buy').length);
const sellCount = computed(() => transactions.value.filter(tx => tx.type === 'sell').length);
const dividendCount = computed(() => transactions.value.filter(tx => tx.type === 'dividend').length);

const assetInitials = computed(() => {
  const n = assetName.value.trim();
  return n ? n.slice(0, 2).toUpperCase() : '?';
});

const firstDateLabel = computed(() => {
  if (transactions.value.length === 0) return '—';
  const min = transactions.value.reduce((acc, tx) => {
    const d = new Date(tx.date).getTime();
    return d < acc ? d : acc;
  }, Infinity);
  return new Date(min).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
});

// Core metrics, computed chronologically (matches dashboard logic)
const metrics = computed(() => {
  const txs = [...transactions.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningQty = 0;
  let runningCostBasis = 0;
  let realizedPnL = 0;
  let totalDividends = 0;
  let totalBought = 0;
  let totalBoughtQty = 0;
  let totalSold = 0;
  let totalSoldQty = 0;

  txs.forEach(tx => {
    if (tx.type === 'buy') {
      runningQty += tx.quantity;
      runningCostBasis += tx.amount;
      totalBought += tx.amount;
      totalBoughtQty += tx.quantity;
    } else if (tx.type === 'sell') {
      const avgBeforeSale = runningQty > 0 ? (runningCostBasis / runningQty) : 0;
      const sellQtyMatched = Math.min(tx.quantity, runningQty);
      realizedPnL += (tx.amount - (avgBeforeSale * sellQtyMatched));
      runningQty -= tx.quantity;
      runningCostBasis -= avgBeforeSale * sellQtyMatched;
      totalSold += tx.amount;
      totalSoldQty += tx.quantity;
    } else if (tx.type === 'dividend') {
      realizedPnL += tx.amount;
      totalDividends += tx.amount;
    }
  });

  return {
    quantity: runningQty,
    netInvested: runningCostBasis,
    avgPrice: runningQty > 0 ? (runningCostBasis / runningQty) : 0,
    realizedPnL,
    totalDividends,
    totalBought,
    totalBoughtQty,
    totalSold,
    totalSoldQty
  };
});

// Cumulative net-invested evolution chart
const chartData = computed(() => {
  const txs = [...transactions.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (txs.length === 0) return [];

  let runningQty = 0;
  let runningCostBasis = 0;
  const points: { label: string; value: number }[] = [];

  txs.forEach(tx => {
    if (tx.type === 'buy') {
      runningQty += tx.quantity;
      runningCostBasis += tx.amount;
    } else if (tx.type === 'sell') {
      const avgBeforeSale = runningQty > 0 ? (runningCostBasis / runningQty) : 0;
      const sellQtyMatched = Math.min(tx.quantity, runningQty);
      runningQty -= tx.quantity;
      runningCostBasis -= avgBeforeSale * sellQtyMatched;
    }
    points.push({
      label: new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      value: Math.max(0, runningCostBasis)
    });
  });

  const values = points.map(p => p.value);
  const max = Math.max(...values, 100);
  const width = 500;
  const height = 100;

  return points.map((pt, i) => {
    const x = points.length > 1 ? (i / (points.length - 1)) * width : width / 2;
    const y = height - (pt.value / max) * height;
    return {
      label: pt.label,
      value: pt.value,
      x: Math.max(10, Math.min(x, width - 10)),
      y: Math.max(10, Math.min(y, height - 10))
    };
  });
});

const chartLinePoints = computed(() => chartData.value.map(pt => `${pt.x},${pt.y}`).join(' '));

const chartAreaPath = computed(() => {
  const pts = chartData.value;
  if (!pts || pts.length === 0) return '';
  const firstPt = pts[0];
  const lastPt = pts[pts.length - 1];
  if (!firstPt || !lastPt) return '';
  const height = 120;
  let d = `M${firstPt.x},${height} L${firstPt.x},${firstPt.y} `;
  pts.forEach((pt, i) => {
    if (i > 0) d += `L${pt.x},${pt.y} `;
  });
  d += `L${lastPt.x},${height} Z`;
  return d;
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatCurrency = (amountInCents: number, exact = false) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: exact ? 2 : 0
  }).format(amountInCents / 100);
};

const handleEdit = (tx: any) => {
  navigateTo(`/investments/edit/${tx.id}`);
};

const handleDelete = async (id: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) return;
  try {
    await $fetch(`/api/investments/${id}`, { method: 'DELETE' });
    allInvestments.value = allInvestments.value.filter(tx => tx.id !== id);
    successMessage.value = 'Transaction supprimée';
    showSuccess.value = true;
    setTimeout(() => showSuccess.value = false, 2000);
  } catch (err) {
    console.error('Failed to delete investment', err);
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(41, 75, 60, 0.1);
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(41, 75, 60, 0.2);
}
</style>
