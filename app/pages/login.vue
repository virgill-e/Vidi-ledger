<template>
  <div class="min-h-screen flex text-text-body bg-bg-base">
    
    <!-- Left Visual Panel (Desktop only) -->
    <div class="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden p-12 flex-col justify-between">
      <!-- Decorative Background Elements -->
      <div class="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div class="absolute -top-[15%] -left-[10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[100px]"></div>
        <div class="absolute bottom-[0%] -right-[15%] w-[80%] h-[80%] rounded-full bg-[#1e3a2e]/60 blur-[120px]"></div>
      </div>
      
      <!-- Brand/Logo -->
      <div class="relative z-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary font-bold text-xl shadow-lg">
            V
          </div>
          <span class="text-white text-2xl font-semibold tracking-tight">Vidi Ledger</span>
        </div>
      </div>
      
      <!-- Hero Text -->
      <div class="relative z-10 max-w-lg mb-20">
        <h1 class="text-4xl md:text-5xl leading-[1.15] font-medium text-white mb-6 tracking-tight">
          Track your expenses securely & achieve financial goals.
        </h1>
        <p class="text-primary-light/80 text-lg leading-relaxed font-light">
          Join thousands of users who are already managing their money smarter and faster every single day.
        </p>
      </div>
      
      <!-- Footer Info -->
      <div class="relative z-10 flex items-center gap-4 text-white/50 text-sm font-medium">
        <a 
          href="https://github.com/virgill-e/Vidi-ledger" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="hover:text-white transition-colors duration-200 flex items-center gap-1.5"
        >
          <span>© 2026 Vidi Ledger — Open Source</span>
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
        </a>
      </div>
    </div>

    <!-- Right Form Panel -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-24 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] z-20 bg-bg-base min-h-screen lg:min-h-0">
      
      <div class="w-full max-w-[440px] flex flex-col">
        <!-- Mobile Brand/Logo (hidden on desktop) -->
        <div class="lg:hidden flex items-center gap-3 mb-8">
          <div class="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
            V
          </div>
          <span class="text-text-heading text-xl font-bold tracking-tight">Vidi Ledger</span>
        </div>

        <!-- Form Container -->
        <div class="w-full bg-card-inner lg:bg-transparent shadow-2xl shadow-black/5 lg:shadow-none rounded-3xl p-8 sm:p-10 lg:p-0 border border-white/60 lg:border-none relative z-10">
        <div class="mb-10 lg:mb-12">
          <h2 class="text-[32px] font-semibold text-text-heading mb-3 tracking-tight">
            {{ isLogin ? 'Welcome back' : 'Create an account' }}
          </h2>
          <p class="text-text-body/70 text-[15px]">
            {{ isLogin ? 'Please enter your details to sign in.' : 'Start your journey with us today.' }}
          </p>
        </div>

        <form @submit.prevent="submitForm" class="flex flex-col gap-5">
          <!-- Name Field (Only on Register) -->
          <UiInput
            v-if="!isLogin"
            id="name"
            label="Full Name"
            type="text"
            placeholder="John Doe"
            v-model="name"
          />

          <UiInput
            id="email"
            label="Email address"
            type="email"
            placeholder="name@example.com"
            v-model="email"
          />
          
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center mb-0.5">
              <label for="password" class="text-[15px] font-medium text-text-heading">
                Password
              </label>
              <div v-if="isLogin" class="relative group">
                <button 
                  type="button"
                  @click="showForgotTooltip = !showForgotTooltip"
                  class="text-[13px] font-medium text-primary hover:text-primary/70 transition-colors flex items-center gap-1"
                >
                  Forgot password?
                  <svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                <!-- Tooltip / Info Bubble -->
                <div 
                  :class="[
                    'absolute bottom-full right-0 mb-3 w-64 p-4 bg-text-heading text-white text-[13px] rounded-2xl shadow-2xl z-50 transition-all duration-300 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:pointer-events-auto',
                    showForgotTooltip ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2'
                  ]"
                >
                  <p class="leading-relaxed font-medium">
                    Veuillez contacter la personne qui héberge ce projet pour réinitialiser votre mot de passe via le <span class="text-primary-light">centre de contrôle administrateur</span>.
                  </p>
                  <!-- Arrow -->
                  <div class="absolute top-full right-6 -mt-px border-[6px] border-transparent border-t-text-heading"></div>
                </div>

                <!-- Overlay for mobile click-outside -->
                <div v-if="showForgotTooltip" @click="showForgotTooltip = false" class="fixed inset-0 z-40 lg:hidden"></div>
              </div>
            </div>
            <UiInput
              id="password"
              :label="''"
              type="password"
              placeholder="••••••••"
              v-model="password"
            />
            <p v-if="!isLogin" class="text-[13px] text-text-body/60 mt-1">
              Must be at least 8 characters.
            </p>
          </div>

          <!-- Error Message Display -->
          <div v-if="error" class="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm font-medium">
            {{ error }}
          </div>

          <div class="mt-4">
            <UiButton variant="primary" type="submit" class="w-full h-[52px] text-[16px]" :loading="loading">
              {{ isLogin ? 'Sign In' : 'Create Account' }}
            </UiButton>
          </div>
          
        </form>

        <p class="mt-10 text-center text-[15px] text-text-body/70">
          {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
          <button @click="toggleMode" class="font-semibold text-primary hover:text-primary/70 focus:outline-none transition-colors ml-1">
            {{ isLogin ? 'Create one' : 'Log in' }}
          </button>
        </p>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Disable default layout (sidebar) for login page
definePageMeta({
  layout: false
});

const isLogin = ref(true);
const loading = ref(false);
const error = ref('');

const { fetch: refreshSession } = useUserSession();

const name = ref('');
const email = ref('');
const password = ref('');
const showForgotTooltip = ref(false);

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  error.value = '';
  // Reset fields when switching forms
  if (isLogin.value) {
    name.value = '';
  }
  password.value = '';
};

const submitForm = async () => {
  loading.value = true;
  error.value = '';

  const endpoint = isLogin.value ? '/api/auth/login' : '/api/auth/register';
  const body = isLogin.value 
    ? { email: email.value, password: password.value }
    : { name: name.value, email: email.value, password: password.value };

  try {
    await $fetch(endpoint, {
      method: 'POST',
      body
    });
    
    // On rafraîchit la session cliente pour être sûr d'avoir les infos user
    await refreshSession();
    
    // Redirect on success
    await navigateTo('/');
  } catch (err: any) {
    error.value = err.data?.statusMessage || "Une erreur est survenue lors de l'authentification.";
  } finally {
    loading.value = false;
  }
};
</script>
