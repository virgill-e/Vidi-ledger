<template>
  <div class="flex flex-col gap-6 lg:gap-10 min-w-0 mx-auto max-w-[800px] w-full pb-20">
    
    <!-- Header Section -->
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-bold text-text-heading tracking-tight">Réglages</h1>
      <p class="text-text-body/60 font-medium">Gérez vos informations personnelles et la sécurité de votre compte.</p>
    </div>

    <div class="flex flex-col gap-8">
      <!-- Profile Section -->
      <div class="bg-card-inner rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
        <h2 class="text-xl font-bold text-text-heading mb-8 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          Profil personnel
        </h2>

        <form @submit.prevent="updateProfile" class="flex flex-col gap-6">
          <div class="flex flex-col gap-3">
            <label class="text-text-heading font-bold text-[15px] ml-2">Nom complet</label>
            <div class="relative group">
              <input 
                type="text" 
                v-model="profileForm.name"
                placeholder="Votre nom"
                class="w-full bg-white border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                required
              />
              <div class="absolute right-5 top-1/2 -translate-y-1/2 text-text-body/20 group-focus-within:text-primary transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <label class="text-text-heading font-bold text-[15px] ml-2">Adresse email (non modifiable)</label>
            <div class="relative opacity-60">
              <input 
                type="email" 
                :value="currentUser?.email"
                disabled
                class="w-full bg-[#f8faf9] border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium outline-none cursor-not-allowed"
              />
              <div class="absolute right-5 top-1/2 -translate-y-1/2 text-text-body/20">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            :disabled="isUpdatingProfile || profileForm.name === currentUser?.name"
            class="self-end px-10 bg-primary text-white py-4 rounded-[20px] font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center gap-2"
          >
            <svg v-if="isUpdatingProfile" class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Enregistrer les modifications
          </button>
        </form>
      </div>

      <!-- Password Section -->
      <div class="bg-card-inner rounded-[40px] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1]">
        <h2 class="text-xl font-bold text-text-heading mb-8 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          Sécurité et mot de passe
        </h2>

        <form @submit.prevent="updatePassword" class="flex flex-col gap-6">
          <div class="flex flex-col gap-3">
            <label class="text-text-heading font-bold text-[15px] ml-2">Mot de passe actuel</label>
            <div class="relative group">
              <input 
                type="password" 
                v-model="passwordForm.currentPassword"
                placeholder="••••••••"
                class="w-full bg-white border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex flex-col gap-3">
              <label class="text-text-heading font-bold text-[15px] ml-2">Nouveau mot de passe</label>
              <div class="relative group">
                <input 
                  type="password" 
                  v-model="passwordForm.newPassword"
                  placeholder="••••••••"
                  class="w-full bg-white border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  required
                  minlength="8"
                />
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <label class="text-text-heading font-bold text-[15px] ml-2">Confirmer le nouveau mot de passe</label>
              <div class="relative group">
                <input 
                  type="password" 
                  v-model="passwordForm.confirmPassword"
                  placeholder="••••••••"
                  class="w-full bg-white border border-[#e3ece8] rounded-[22px] px-6 py-4 text-text-heading font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <p v-if="passwordError" class="text-red-500 text-sm font-medium ml-2">{{ passwordError }}</p>

          <button 
            type="submit"
            :disabled="isUpdatingPassword || !canSubmitPasswordForm"
            class="self-end px-10 bg-primary text-white py-4 rounded-[20px] font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center gap-2"
          >
            <svg v-if="isUpdatingPassword" class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Modifier le mot de passe
          </button>
        </form>
      </div>
    </div>

    <!-- Success Feedback Overlay -->
    <Transition name="fade">
      <div v-if="feedback.show" class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-text-heading text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 z-50">
        <div :class="['w-6 h-6 rounded-full flex items-center justify-center', feedback.error ? 'bg-red-500' : 'bg-primary']">
          <svg v-if="!feedback.error" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <span class="font-bold">{{ feedback.message }}</span>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';

definePageMeta({
  middleware: 'auth'
});

const { user, fetch: fetchSession } = useUserSession();
const currentUser = computed(() => user.value as { name?: string; email?: string } | null);

const isUpdatingProfile = ref(false);
const isUpdatingPassword = ref(false);

const profileForm = reactive({
  name: currentUser.value?.name || ''
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const feedback = reactive({
  show: false,
  message: '',
  error: false
});

const passwordError = computed(() => {
  if (passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
    return 'Les mots de passe ne correspondent pas';
  }
  return '';
});

const canSubmitPasswordForm = computed(() => {
  return passwordForm.currentPassword && 
         passwordForm.newPassword && 
         passwordForm.newPassword.length >= 8 &&
         passwordForm.newPassword === passwordForm.confirmPassword;
});

const showFeedback = (message: string, isError = false) => {
  feedback.message = message;
  feedback.error = isError;
  feedback.show = true;
  setTimeout(() => {
    feedback.show = false;
  }, 3018);
};

const updateProfile = async () => {
  if (!profileForm.name || isUpdatingProfile.value) return;
  
  isUpdatingProfile.value = true;
  try {
    await $fetch('/api/user/profile', {
      method: 'PATCH',
      body: { name: profileForm.name }
    });
    
    await fetchSession(); // Refresh local session data
    showFeedback('Profil mis à jour avec succès !');
  } catch (err: any) {
    showFeedback(err.statusMessage || 'Une erreur est survenue lors de la mise à jour du profil.', true);
  } finally {
    isUpdatingProfile.value = false;
  }
};

const updatePassword = async () => {
  if (!canSubmitPasswordForm.value || isUpdatingPassword.value) return;
  
  isUpdatingPassword.value = true;
  try {
    await $fetch('/api/user/password', {
      method: 'PATCH',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }
    });
    
    // Clear form
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    
    showFeedback('Mot de passe modifié avec succès !');
  } catch (err: any) {
    showFeedback(err.statusMessage || 'Ancien mot de passe incorrect.', true);
  } finally {
    isUpdatingPassword.value = false;
  }
};

// Update profile form if user session changes (e.g. after refresh)
watch(() => currentUser.value?.name, (newName) => {
  if (newName) profileForm.name = newName;
}, { immediate: true });
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
</style>
