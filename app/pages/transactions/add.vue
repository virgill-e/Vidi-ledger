<template>
  <div class="flex flex-col gap-6 lg:gap-10 min-w-0 mx-auto max-w-[800px] w-full pb-20">
    
    <!-- Header Section -->
    <div class="flex flex-col gap-2">
      <NuxtLink to="/" class="flex items-center gap-2 text-text-body/60 hover:text-primary transition-colors font-semibold text-sm mb-2 w-fit">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour au tableau de bord
      </NuxtLink>
      <h1 class="text-3xl font-bold text-text-heading tracking-tight">Ajouter une dépense</h1>
      <p class="text-text-body/60 font-medium">Saisissez les détails de votre transaction manuellement.</p>
    </div>

    <!-- Main Form Card -->
    <div class="bg-card-inner rounded-[40px] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
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
            <button 
              type="button" 
              @click="openAddCategory"
              class="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle catégorie
            </button>
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
              
              <!-- Edit Button -->
              <button 
                type="button"
                @click.stop="openEditCategory(cat)"
                class="absolute -top-1 -right-1 w-6 h-6 bg-white border border-[#e3ece8] rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 hover:bg-bg-base transition-all z-10"
              >
                <svg class="w-3 h-3 text-text-body/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>

            <!-- Placeholder if no categories -->
            <div v-if="!categories?.length" class="col-span-full py-4 text-center text-text-body/40 text-sm font-medium">
              Aucune catégorie créée. Cliquez sur "Nouvelle catégorie".
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
        <button 
          type="submit"
          :disabled="isSubmitting || !form.categoryId"
          class="mt-4 w-full bg-primary text-white py-5 rounded-[24px] text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
        >
          <svg v-if="isSubmitting" class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="!isSubmitting">Enregistrer la dépense</span>
          <span v-else>Enregistrement...</span>
        </button>
      </form>
    </div>

    <!-- Add/Edit Category Dialog -->
    <div v-if="showAddCategory" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div class="bg-white rounded-[32px] p-8 w-full max-w-[450px] shadow-2xl border border-white" @click.stop>
        <h3 class="text-xl font-bold text-text-heading mb-6">{{ isEditingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h3>
        <div class="flex flex-col gap-6">
          <!-- Name -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-text-body/60 ml-1">Nom</label>
            <input 
              v-model="newCat.name" 
              placeholder="Ex: Restaurant" 
              class="w-full bg-[#f8faf9] rounded-xl px-4 py-3 outline-none border border-transparent focus:border-primary/30 font-medium" 
              @keydown.enter.prevent.stop="handleSaveCategory"
            />
          </div>

          <!-- Color -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-text-body/60 ml-1">Couleur</label>
            <div class="flex gap-2 flex-wrap">
              <button 
                v-for="color in presetColors" 
                :key="color" 
                type="button"
                @click="newCat.color = color" 
                class="w-8 h-8 rounded-lg transition-transform hover:scale-110 relative"
                :style="{ backgroundColor: color }"
              >
                <div v-if="newCat.color === color" class="absolute inset-0 flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- Icon selection -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-text-body/60 ml-1">Icône</label>
            <div class="grid grid-cols-6 gap-2">
              <button 
                v-for="icon in presetIcons" 
                :key="icon.id" 
                type="button"
                @click="newCat.icon = icon.svg" 
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-all border"
                :class="newCat.icon === icon.svg ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-[#f8faf9] text-text-body/40 hover:bg-bg-base'"
              >
                <span v-html="icon.svg" class="scale-75"></span>
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 mt-4">
            <button type="button" @click="showAddCategory = false" class="flex-1 bg-gray-100 py-4 rounded-xl font-bold text-text-body hover:bg-gray-200 transition-colors">Annuler</button>
            <button type="button" @click="handleSaveCategory" class="flex-1 bg-primary py-4 rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
              {{ isEditingCategory ? 'Enregistrer' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback Message -->
    <Transition name="fade">
      <div v-if="showSuccess" class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-text-heading text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 z-50">
        <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="font-bold">Dépense enregistrée avec succès !</span>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';

definePageMeta({
  middleware: 'auth'
});

const isSubmitting = ref(false);
const showSuccess = ref(false);
const showAddCategory = ref(false);
const isEditingCategory = ref(false);
const editCategoryId = ref<number | null>(null);

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
  // Delay to allow mousedown to trigger on suggestions
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

const categories = ref<any[]>([]);
const presetColors = ['#294b3c', '#679178', '#557a66', '#3b5e4a', '#1b3127', '#e74c3c', '#f1c40f', '#3498db', '#9b59b6', '#34495e'];
const presetIcons = [
  { id: 'cart', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>' },
  { id: 'bag', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>' },
  { id: 'home', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>' },
  { id: 'car', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>' },
  { id: 'gift', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0H9m3 0h3m-3 0V7m0 5H9a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2v-2a2 2 0 00-2-2h-3" /></svg>' },
  { id: 'health', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>' },
  { id: 'food', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>' },
  { id: 'phone', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>' },
  { id: 'music', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>' },
  { id: 'coffee', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>' },
  { id: 'bank', svg: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>' }
];

const form = reactive({
  amount: undefined as number | undefined,
  merchant: '',
  date: new Date().toISOString().split('T')[0],
  categoryId: undefined as number | undefined,
  note: ''
});

const newCat = reactive({
  name: '',
  color: presetColors[0],
  icon: presetIcons[0].svg
});

const fetchCategories = async () => {
  try {
    const data = await $fetch('/api/categories');
    categories.value = data as any[];
    if (categories.value.length > 0 && !form.categoryId) {
      form.categoryId = categories.value[0].id;
    }
  } catch (err) {
    console.error('Failed to fetch categories', err);
  }
};

const fetchMerchants = async () => {
  try {
    const data = await $fetch('/api/merchants');
    merchants.value = data as string[];
  } catch (err) {
    console.error('Failed to fetch merchants', err);
  }
};

onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchMerchants()
  ]);
});

const openAddCategory = () => {
  isEditingCategory.value = false;
  editCategoryId.value = null;
  newCat.name = '';
  newCat.color = presetColors[0];
  newCat.icon = presetIcons[0].svg;
  showAddCategory.value = true;
};

const openEditCategory = (cat: any) => {
  isEditingCategory.value = true;
  editCategoryId.value = cat.id;
  newCat.name = cat.name;
  newCat.color = cat.color;
  newCat.icon = cat.icon;
  showAddCategory.value = true;
};

const handleSaveCategory = async () => {
  if (!newCat.name) return;
  try {
    if (isEditingCategory.value && editCategoryId.value) {
      const updated = await $fetch(`/api/categories/${editCategoryId.value}`, {
        method: 'PATCH',
        body: newCat
      });
      const idx = categories.value.findIndex(c => c.id === editCategoryId.value);
      if (idx !== -1) categories.value[idx] = updated;
    } else {
      const created = await $fetch('/api/categories', {
        method: 'POST',
        body: newCat
      });
      categories.value.push(created);
      form.categoryId = (created as any).id;
    }
    showAddCategory.value = false;
  } catch (err) {
    console.error('Failed to save category', err);
  }
};

const handleSubmit = async () => {
  if (isSubmitting.value || !form.categoryId || form.amount === undefined) return;
  
  isSubmitting.value = true;
  
  try {
    await $fetch('/api/expenses', {
      method: 'POST',
      body: form
    });
    
    showSuccess.value = true;
    
    setTimeout(async () => {
      showSuccess.value = false;
      await navigateTo('/transactions');
      // On ne reset isSubmitting qu'après le changement de page
      // ou on laisse l'unmount faire son travail
    }, 1500);
  } catch (err) {
    console.error('Failed to save expense', err);
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
