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
        <h1 class="text-3xl font-bold text-text-heading tracking-tight">Gérer mes investissements</h1>
        <p class="text-text-body/60 font-medium">Consultez, modifiez ou supprimez vos transactions.</p>
      </div>
      
      <NuxtLink 
        to="/investments/add" 
        class="bg-primary text-white px-6 py-4 rounded-[22px] font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 w-full sm:w-auto"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nouvelle transaction
      </NuxtLink>
    </div>

    <!-- Filters & Stats -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3 bg-card-inner rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
        
        <!-- Filter Bar -->
        <div class="flex flex-col gap-6 mb-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <!-- Buy/Sell Toggle -->
            <div class="flex items-center gap-2 bg-bg-base p-1.5 rounded-[20px] w-fit">
              <button 
                v-for="filter in ['all', 'buy', 'sell']" 
                :key="filter"
                @click="typeFilter = filter"
                :class="['px-5 py-2.5 rounded-[14px] text-sm font-bold transition-all', typeFilter === filter ? 'bg-white text-primary shadow-sm' : 'text-text-body/40 hover:text-text-body/60']"
              >
                {{ filter === 'all' ? 'Tous' : filter === 'buy' ? 'Achats' : 'Ventes' }}
              </button>
            </div>

            <!-- Search -->
            <div class="relative w-full md:max-w-[300px]">
              <input 
                v-model="search"
                type="text" 
                placeholder="Rechercher un actif..." 
                class="w-full bg-[#f8faf9] border border-[#e3ece8] rounded-[18px] pl-12 pr-6 py-3.5 text-text-heading font-medium focus:outline-none focus:border-primary/30 transition-all outline-none"
              />
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-text-body/20">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Time Period Filter -->
          <div class="grow flex items-center bg-[#e3ece8] p-1.5 rounded-[24px] w-full lg:max-w-[500px]">
            <button 
              v-for="filter in filters" 
              :key="filter.id" 
              @click="timeFilter = filter.id"
              :class="['grow py-3 rounded-[18px] text-[13px] font-bold transition-all', timeFilter === filter.id ? 'bg-white shadow-sm text-primary' : 'text-text-body/60 hover:text-text-heading']"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto overflow-y-visible">
          <table class="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr class="text-text-body/40 font-bold text-[11px] uppercase tracking-widest px-4">
                <th class="pb-2 pl-4">Date</th>
                <th class="pb-2">Actif</th>
                <th class="pb-2">Type</th>
                <th class="pb-2">Quantité</th>
                <th class="pb-2">Montant</th>
                <th class="pb-2 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="tx in paginatedInvestments" 
                :key="tx.id" 
                class="bg-white border border-[#e3ece8] rounded-[22px] transition-all hover:shadow-lg hover:shadow-black/[0.02] hover:-translate-y-0.5 group"
              >
                <td class="py-5 pl-4 rounded-l-[22px] font-medium text-text-body/60 text-sm">
                  {{ formatDate(tx.date) }}
                </td>
                <td class="py-5 font-bold text-text-heading">
                  {{ tx.asset }}
                </td>
                <td class="py-5">
                  <span :class="['px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider', tx.type === 'buy' ? 'bg-primary/5 text-primary' : 'bg-red-500/5 text-red-500']">
                    {{ tx.type === 'buy' ? 'Achat' : 'Vente' }}
                  </span>
                </td>
                <td class="py-5 font-bold text-text-heading text-sm">
                  {{ tx.quantity }}
                </td>
                <td class="py-5 font-bold text-text-heading">
                  {{ formatCurrency(tx.amount) }}
                </td>
                <td class="py-5 pr-4 text-right rounded-r-[22px]">
                  <div class="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      @click="handleEdit(tx)"
                      class="w-10 h-10 rounded-xl bg-bg-base text-text-body/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center"
                      title="Modifier"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      @click="handleDelete(tx.id)"
                      class="w-10 h-10 rounded-xl bg-bg-base text-text-body/40 hover:text-red-500 hover:bg-red-500/5 transition-all flex items-center justify-center underline-none"
                      title="Supprimer"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile List -->
        <div class="md:hidden flex flex-col gap-4">
          <div 
            v-for="tx in paginatedInvestments" 
            :key="tx.id" 
            class="bg-white border border-[#e3ece8] p-5 rounded-[28px] flex flex-col gap-4"
          >
            <div class="flex justify-between items-start">
              <div class="flex flex-col">
                <span class="text-[11px] text-text-body/40 font-bold uppercase tracking-widest mb-1">{{ formatDate(tx.date) }}</span>
                <span class="text-lg font-bold text-text-heading">{{ tx.asset }}</span>
              </div>
              <span :class="['px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider', tx.type === 'buy' ? 'bg-primary/5 text-primary' : 'bg-red-500/5 text-red-500']">
                {{ tx.type === 'buy' ? 'Achat' : 'Vente' }}
              </span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 py-4 border-y border-dashed border-[#eff3f1]">
              <div class="flex flex-col">
                <span class="text-[10px] text-text-body/40 font-bold uppercase tracking-wider mb-0.5">Quantité</span>
                <span class="font-bold text-text-heading text-sm">{{ tx.quantity }}</span>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-[10px] text-text-body/40 font-bold uppercase tracking-wider mb-0.5">Montant</span>
                <span class="font-bold text-text-heading">{{ formatCurrency(tx.amount) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="handleEdit(tx)"
                class="flex-1 bg-bg-base py-3 rounded-xl font-bold text-sm text-text-body/60 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                Modifier
              </button>
              <button 
                @click="handleDelete(tx.id)"
                class="flex-1 bg-bg-base py-3 rounded-xl font-bold text-sm text-text-body/60 hover:text-red-500 transition-all flex items-center justify-center gap-2"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-10">
          <button 
            @click="page = Math.max(1, page - 1)" 
            :disabled="page === 1"
            class="w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center text-text-body/40 disabled:opacity-30 hover:text-primary transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div class="flex items-center gap-1">
            <button 
              v-for="p in totalPages" 
              :key="p"
              @click="page = p"
              :class="['w-10 h-10 rounded-xl text-sm font-bold transition-all', page === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-bg-base text-text-body/40 hover:bg-primary/5 hover:text-primary']"
            >
              {{ p }}
            </button>
          </div>

          <button 
            @click="page = Math.min(totalPages, page + 1)" 
            :disabled="page === totalPages"
            class="w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center text-text-body/40 disabled:opacity-30 hover:text-primary transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div v-if="filteredInvestments.length === 0" class="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div class="w-20 h-20 rounded-[32px] bg-bg-base flex items-center justify-center text-text-body/10">
            <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <p class="text-lg font-bold text-text-heading">Aucun investissement trouvé</p>
            <p class="text-text-body/40 font-medium">Réinitialisez vos filtres ou créez une nouvelle transaction.</p>
          </div>
        </div>
      </div>

      <!-- Quick Summary -->
      <div class="flex flex-col gap-6">
        <div class="bg-primary rounded-[36px] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p class="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2">Total Investi (Net)</p>
          <div class="text-3xl font-black mb-4">{{ formatCurrency(netTotalValue) }}</div>
          <div class="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-white/60 rounded-full transition-all duration-1000" style="width: 70%"></div>
          </div>
        </div>

        <div class="bg-card-inner rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
          <h3 class="text-lg font-bold text-text-heading mb-6">Répartition par type</h3>
          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center bg-bg-base p-4 rounded-[20px]">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-primary"></div>
                <span class="text-sm font-bold text-text-body/60">Achats</span>
              </div>
              <span class="font-bold text-text-heading">{{ buyCount }}</span>
            </div>
            <div class="flex justify-between items-center bg-bg-base p-4 rounded-[20px]">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-red-500"></div>
                <span class="text-sm font-bold text-text-body/60">Ventes</span>
              </div>
              <span class="font-bold text-text-heading">{{ sellCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Dialog (Optional or Navigate to full page) -->
    <!-- For simplicity, let's navigate to edit/[id] -->

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

const investments = ref<any[]>([]);
const search = ref('');
const typeFilter = ref('all');
const timeFilter = ref('all');
const page = ref(1);
const perPage = 10;
const showSuccess = ref(false);
const successMessage = ref('');

const filters = [
  { id: 'all', label: 'Tout' },
  { id: 'week', label: '7j' },
  { id: 'month', label: '30j' },
  { id: 'year', label: '12m' }
];

const fetchInvestments = async () => {
  try {
    const data = await $fetch('/api/investments');
    investments.value = (data as any[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err) {
    console.error('Failed to fetch investments', err);
  }
};

onMounted(fetchInvestments);

const filteredInvestments = computed(() => {
  const now = new Date();
  return investments.value.filter(tx => {
    // 1. Asset/Search filter
    const matchesSearch = tx.asset.toLowerCase().includes(search.value.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Type filter
    const matchesType = typeFilter.value === 'all' || tx.type === typeFilter.value;
    if (!matchesType) return false;

    // 3. Time filter
    const txDate = new Date(tx.date);
    if (timeFilter.value === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (txDate < weekAgo) return false;
    } else if (timeFilter.value === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (txDate < monthAgo) return false;
    } else if (timeFilter.value === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      if (txDate < yearAgo) return false;
    }

    return true;
  });
});

const paginatedInvestments = computed(() => {
  const start = (page.value - 1) * perPage;
  return filteredInvestments.value.slice(start, start + perPage);
});

const totalPages = computed(() => Math.ceil(filteredInvestments.value.length / perPage));

const buyCount = computed(() => investments.value.filter(tx => tx.type === 'buy').length);
const sellCount = computed(() => investments.value.filter(tx => tx.type === 'sell').length);
const netTotalValue = computed(() => {
  return investments.value.reduce((acc, tx) => acc + (tx.type === 'buy' ? tx.amount : -tx.amount), 0);
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatCurrency = (amount: number, minimal = false) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: minimal && amount % 100 === 0 ? 0 : 2
  }).format(amount / 100);
};

const handleEdit = (tx: any) => {
  navigateTo(`/investments/edit/${tx.id}`);
};

const handleDelete = async (id: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) return;
  
  try {
    await $fetch(`/api/investments/${id}`, { method: 'DELETE' });
    investments.value = investments.value.filter(tx => tx.id !== id);
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

/* Custom scrollbar for desktop list */
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
