<template>
  <div class="flex flex-col gap-6 lg:gap-10 min-w-0 mx-auto max-w-[800px] w-full pb-20">
    
    <!-- Header Section -->
    <div class="flex flex-col gap-2">
      <NuxtLink to="/transactions" class="flex items-center gap-2 text-text-body/60 hover:text-primary transition-colors font-semibold text-sm mb-2 w-fit">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour à l'historique
      </NuxtLink>
      <h1 class="text-3xl font-bold text-text-heading tracking-tight">Modifier la dépense</h1>
      <p class="text-text-body/60 font-medium">Mettez à jour les détails de votre transaction.</p>
    </div>

    <!-- Main Form Card -->
    <div v-if="!loading" class="bg-card-inner rounded-[40px] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-8">
        
        <!-- Amount Input Group -->
        <div class="flex flex-col items-center justify-center py-10 bg-bg-base/50 rounded-[32px] border border-[#eff3f1] mb-4">
          <span class="text-text-body/40 text-sm font-bold uppercase tracking-widest mb-4">Montant de la dépense</span>
          <div class="relative flex items-center">
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
          <!-- Merchant / Label -->
          <div class="flex flex-col gap-3 relative">
            <label class="text-text-heading font-bold text-[15px] ml-2">Commerçant ou libellé</label>
            <div class="relative group">
              <input 
                type="text" 
                v-model="form.merchant"
                @focus="showSuggestions = true"
                @blur="handleBlur"
                placeholder="Ex: Delhaize, Amazon..."
                class="w-full bg-white border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                required
                autocomplete="off"
              />
              <div class="absolute right-5 top-1/2 -translate-y-1/2 text-text-body/20 group-focus-within:text-primary transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>

            <!-- Suggestions Dropdown -->
            <div 
              v-if="showSuggestions && filteredMerchants.length > 0"
              class="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-[#e3ece8] rounded-[24px] shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div class="flex flex-col">
                <button 
                  v-for="(merchant, index) in filteredMerchants" 
                  :key="index"
                  type="button"
                  @mousedown="selectMerchant(merchant)"
                  class="flex items-center gap-4 px-6 py-4 text-left hover:bg-bg-base transition-colors border-b border-[#f1f5f3] last:border-0 group"
                >
                  <div class="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-text-heading font-bold text-[14px]">{{ merchant }}</span>
                  </div>
                </button>
              </div>
            </div>
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

        <!-- Category Selector -->
        <div class="flex flex-col gap-4">
          <div class="flex justify-between items-center ml-2">
            <label class="text-text-heading font-bold text-[15px]">Catégorie</label>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div 
              v-for="cat in categories" 
              :key="cat.id"
              class="relative group"
            >
              <button 
                type="button"
                @click="form.categoryId = cat.id"
                :class="[
                  'w-full flex flex-col items-center gap-3 p-4 rounded-[24px] border transition-all relative overflow-hidden',
                  form.categoryId === cat.id 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-[#e3ece8] bg-white hover:border-primary/30 hover:bg-bg-base'
                ]"
              >
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110']" :style="{ backgroundColor: cat.color }">
                  <span v-html="cat.icon" class="scale-75"></span>
                </div>
                <span :class="['text-[11px] font-bold text-center leading-tight', form.categoryId === cat.id ? 'text-primary' : 'text-text-body/60']">{{ cat.name }}</span>
                <div v-if="form.categoryId === cat.id" class="absolute top-2 right-2">
                  <div class="w-2 h-2 bg-primary rounded-full"></div>
                </div>
              </button>
            </div>
          </div>
        </div>


        <!-- Note / Attachment (Optional) -->
        <div class="flex flex-col gap-3">
          <label class="text-text-heading font-bold text-[15px] ml-2">Note (optionnel)</label>
          <textarea 
            v-model="form.note"
            rows="3"
            placeholder="Détails supplémentaires..."
            class="w-full bg-white border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none"
          ></textarea>
        </div>

        <!-- Submit Button -->
        <div class="flex flex-col sm:flex-row gap-4 mt-4">
          <button 
            type="button"
            @click="handleDelete"
            class="sm:w-1/3 bg-white text-red-500 border border-red-500/20 py-5 rounded-[24px] text-lg font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-3"
          >
            Supprimer
          </button>
          <button 
            type="submit"
            :disabled="isSubmitting || !form.categoryId"
            class="grow bg-primary text-white py-5 rounded-[24px] text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
          >
            <svg v-if="isSubmitting" class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-if="!isSubmitting">Mettre à jour</span>
            <span v-else>Mise à jour...</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Feedback Message -->
    <Transition name="fade">
      <div v-if="showSuccess" class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-text-heading text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 z-50">
        <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="font-bold">Dépense mise à jour avec succès !</span>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';

const route = useRoute();
const id = route.params.id;

definePageMeta({
  middleware: 'auth'
});

const loading = ref(true);
const isSubmitting = ref(false);
const showSuccess = ref(false);

// Merchant suggestions
const showSuggestions = ref(false);
const merchants = ref<string[]>([]);
const filteredMerchants = computed(() => {
  if (!form.merchant) return merchants.value.slice(0, 5);
  const query = form.merchant.toLowerCase();
  return merchants.value
    .filter(m => m.toLowerCase().includes(query))
    .slice(0, 5);
});

const selectMerchant = (merchant: string) => {
  form.merchant = merchant;
  showSuggestions.value = false;
};

const handleBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

const categories = ref<any[]>([]);

const form = reactive({
  amount: undefined as number | undefined,
  merchant: '',
  date: '',
  categoryId: undefined as number | undefined,
  note: ''
});

const fetchData = async () => {
  try {
    const [expense, cats, allMerchants] = await Promise.all([
      $fetch(`/api/expenses/${id}`),
      $fetch('/api/categories'),
      $fetch('/api/merchants')
    ]);

    categories.value = cats as any[];
    merchants.value = allMerchants as string[];

    const exp = expense as any;
    form.amount = exp.amount / 100;
    form.merchant = exp.merchant;
    form.date = new Date(exp.date).toISOString().split('T')[0];
    form.categoryId = exp.categoryId;
    form.note = exp.note || '';

    loading.value = false;
  } catch (err) {
    console.error('Failed to fetch data', err);
    navigateTo('/transactions');
  }
};

onMounted(fetchData);

const handleDelete = async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;
  
  try {
    await $fetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    });
    await navigateTo('/transactions');
  } catch (err) {
    console.error('Failed to delete expense', err);
  }
};

const handleSubmit = async () => {
  if (isSubmitting.value || !form.categoryId || form.amount === undefined) return;
  
  isSubmitting.value = true;
  
  try {
    await $fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      body: form
    });
    
    showSuccess.value = true;
    
    setTimeout(async () => {
      showSuccess.value = false;
      await navigateTo('/transactions');
    }, 1500);
  } catch (err) {
    console.error('Failed to update expense', err);
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
