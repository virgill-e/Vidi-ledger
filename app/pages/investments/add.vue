<template>
  <div class="flex flex-col gap-6 lg:gap-10 min-w-0 mx-auto max-w-[800px] w-full pb-20">
    
    <!-- Header Section -->
    <div class="flex flex-col gap-2">
      <NuxtLink to="/investments" class="flex items-center gap-2 text-text-body/60 hover:text-primary transition-colors font-semibold text-sm mb-2 w-fit">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour aux investissements
      </NuxtLink>
      <h1 class="text-3xl font-bold text-text-heading tracking-tight">Ajouter un investissement</h1>
      <p class="text-text-body/60 font-medium">Saisissez les détails de cet investissement (achat ou vente).</p>
    </div>

    <!-- Main Form Card -->
    <div class="bg-card-inner rounded-[40px] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-8">
        
        <!-- Type Selection -->
        <div class="flex justify-center gap-4">
          <button 
            type="button"
            @click="form.type = 'buy'"
            :class="['px-8 py-4 rounded-[22px] font-bold text-[16px] transition-all', form.type === 'buy' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-[#e3ece8] text-text-body/60 hover:bg-[#d1e0d9]']"
          >
            Achat
          </button>
          <button 
            type="button"
            @click="form.type = 'sell'"
            :class="['px-8 py-4 rounded-[22px] font-bold text-[16px] transition-all', form.type === 'sell' ? 'bg-[#e74c3c] text-white shadow-lg shadow-red-500/20 scale-105' : 'bg-[#f5e6e6] text-text-body/60 hover:bg-[#eedbdb]']"
          >
            Vente
          </button>
        </div>

        <!-- Amount Input Group -->
        <div class="flex flex-col items-center justify-center py-10 bg-bg-base/50 rounded-[32px] border border-[#eff3f1] mb-4 relative overflow-hidden">
          <div v-if="form.type === 'sell'" class="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
          <span class="text-text-body/40 text-sm font-bold uppercase tracking-widest mb-4 z-10 relative">Montant total</span>
          <div class="relative flex items-center z-10">
            <input 
              type="number" 
              step="0.01" 
              v-model="form.amount"
              placeholder="0.00"
              class="bg-transparent text-[64px] font-black text-text-heading text-center focus:outline-none w-full max-w-[300px] placeholder:text-text-body/10"
              required
            />
            <span class="text-[32px] font-bold text-primary ml-2">€</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Asset -->
          <div class="flex flex-col gap-3 relative">
            <label class="text-text-heading font-bold text-[15px] ml-2">Actif (ex: AAPL, BTC)</label>
            <div class="relative group">
              <input 
                type="text" 
                v-model="form.asset"
                @focus="showSuggestions = true"
                @blur="handleBlur"
                placeholder="Ex: Apple, Bitcoin..."
                class="w-full bg-white border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none uppercase"
                required
                autocomplete="off"
              />
            </div>

            <!-- Suggestions Dropdown -->
            <div 
              v-if="showSuggestions && filteredAssets.length > 0"
              class="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-[#e3ece8] rounded-[24px] shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div class="flex flex-col">
                <button 
                  v-for="(asset, index) in filteredAssets" 
                  :key="index"
                  type="button"
                  @mousedown="selectAsset(asset)"
                  class="flex items-center gap-4 px-6 py-4 text-left hover:bg-bg-base transition-colors border-b border-[#f1f5f3] last:border-0 group"
                >
                  <div class="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform font-bold text-[10px]">
                    {{ asset.name.substring(0, 3) }}
                  </div>
                  <div class="flex flex-col">
                    <span class="text-text-heading font-bold text-[14px]">{{ asset.name }}</span>
                    <span class="text-text-body/40 text-[11px] font-bold">{{ asset.totalQuantity.toLocaleString('fr-FR') }} possédés</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Quantity -->
          <div class="flex flex-col gap-3 relative">
            <label class="text-text-heading font-bold text-[15px] ml-2">Quantité</label>
            <div class="relative group">
              <input 
                type="number" 
                step="any"
                v-model="form.quantity"
                :max="form.type === 'sell' && currentHolding !== null ? currentHolding : undefined"
                placeholder="Ex: 0.5, 10..."
                class="w-full bg-white border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                required
              />
              <button 
                v-if="form.type === 'sell' && currentHolding && currentHolding > 0"
                type="button"
                @click="setMaxQuantity"
                class="absolute right-4 top-1/2 -translate-y-1/2 bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all z-10"
              >
                MAX
              </button>
            </div>
            <span v-if="showMaxMessage && form.type === 'sell'" class="text-[#e74c3c] font-bold text-[13px] ml-2 mt-1 animate-in fade-in duration-300">
              Le nombre d'actifs possédés est de {{ currentHolding }}
            </span>
          </div>
          
          <!-- Date -->
          <div class="flex flex-col gap-3">
            <label class="text-text-heading font-bold text-[15px] ml-2">Date de transaction</label>
            <div class="relative group">
              <input 
                type="date" 
                v-model="form.date"
                class="w-full bg-white border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none"
                required
              />
              <div class="absolute right-5 top-1/2 -translate-y-1/2 text-text-body/20 group-focus-within:text-primary transition-colors pointer-events-none">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Note / Attachment (Optional) -->
        <div class="flex flex-col gap-3">
          <label class="text-text-heading font-bold text-[15px] ml-2">Notes (optionnel)</label>
          <textarea 
            v-model="form.note"
            rows="3"
            placeholder="Détails supplémentaires..."
            class="w-full bg-white border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none"
          ></textarea>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit"
          :disabled="isSubmitting"
          :class="[
            'mt-4 w-full text-white py-5 rounded-[24px] text-lg font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0',
            form.type === 'buy' ? 'bg-primary shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1' : 'bg-[#e74c3c] shadow-xl shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-1'
          ]"
        >
          <svg v-if="isSubmitting" class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="!isSubmitting">Enregistrer l'investissement</span>
          <span v-else>Enregistrement...</span>
        </button>
      </form>
    </div>

    <!-- Feedback Message -->
    <Transition name="fade">
      <div v-if="showSuccess" class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-text-heading text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 z-50">
        <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="font-bold">Investissement enregistré avec succès !</span>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';

definePageMeta({
  middleware: 'auth'
});

const isSubmitting = ref(false);
const showSuccess = ref(false);
const showMaxMessage = ref(false);
let maxMessageTimeout: ReturnType<typeof setTimeout> | null = null;

const form = reactive({
  type: 'buy' as 'buy' | 'sell',
  amount: undefined as number | undefined,
  quantity: undefined as number | undefined,
  asset: '',
  date: new Date().toISOString().split('T')[0],
  note: ''
});

// Asset suggestions
const showSuggestions = ref(false);
const assets = ref<{ name: string, totalQuantity: number }[]>([]);
const filteredAssets = computed(() => {
  if (!form.asset) return assets.value.slice(0, 5);
  const query = form.asset.toLowerCase();
  return assets.value
    .filter(a => a.name.toLowerCase().includes(query))
    .slice(0, 5);
});

const selectAsset = (asset: { name: string, totalQuantity: number }) => {
  form.asset = asset.name;
  showSuggestions.value = false;
};

const currentHolding = computed(() => {
  if (!form.asset) return null;
  const asset = assets.value.find(a => a.name.toLowerCase() === form.asset.toLowerCase());
  return asset ? asset.totalQuantity : null;
});

const setMaxQuantity = () => {
  if (currentHolding.value !== null) {
    form.quantity = currentHolding.value;
  }
};

watch(() => form.quantity, (newVal) => {
  if (form.type === 'sell' && currentHolding.value !== null && newVal !== undefined && newVal > currentHolding.value) {
    form.quantity = currentHolding.value;
    
    showMaxMessage.value = true;
    if (maxMessageTimeout) clearTimeout(maxMessageTimeout);
    maxMessageTimeout = setTimeout(() => {
      showMaxMessage.value = false;
    }, 3000);
  } else if (newVal !== undefined && currentHolding.value !== null && newVal < currentHolding.value) {
    showMaxMessage.value = false;
  }
});

const handleBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

const fetchAssets = async () => {
  try {
    const data = await $fetch('/api/investments/assets');
    assets.value = data as { name: string, totalQuantity: number }[];
  } catch (err) {
    console.error('Failed to fetch assets', err);
  }
};

onMounted(() => {
  fetchAssets();
});

const handleSubmit = async () => {
  if (isSubmitting.value || form.amount === undefined || form.quantity === undefined || !form.asset) return;
  if (form.type === 'sell' && currentHolding.value !== null && form.quantity > currentHolding.value) return;
  
  isSubmitting.value = true;
  
  try {
    const payload = {
      ...form,
      amount: Math.round(form.amount * 100), // convert to cents
      asset: form.asset.toUpperCase()
    };
    await $fetch('/api/investments', {
      method: 'POST',
      body: payload
    });
    
    showSuccess.value = true;
    
    setTimeout(async () => {
      showSuccess.value = false;
      await navigateTo('/investments');
    }, 1500);
  } catch (err) {
    console.error('Failed to save investment', err);
    isSubmitting.value = false;
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

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
  appearance: none;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  color: transparent;
  background: transparent;
}
</style>
