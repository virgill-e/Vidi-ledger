<template>
  <div class="min-h-screen bg-bg-base flex p-4 sm:p-6 lg:p-10 gap-6 lg:gap-10 font-sans selection:bg-primary-light selection:text-primary relative overflow-x-hidden">
    
    <!-- Mobile Menu Overlay -->
    <div v-if="isMobileMenuOpen" @click="closeMenu" class="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm transition-opacity"></div>

    <!-- Sidebar Navigation -->
    <TheSidebar />

    <!-- Main Content Container -->
    <main class="grow flex flex-col md:flex-row gap-6 lg:gap-10 min-w-0 mx-auto max-w-[1200px] w-full md:ml-[134px] lg:ml-[150px]">
      <div class="grow flex flex-col min-w-0">
        <TheMobileHeader />
        <slot />
      </div>
    </main>

    <!-- Floating GitHub Button -->
    <a 
      href="https://github.com/virgill-e/Vidi-ledger" 
      target="_blank" 
      rel="noopener noreferrer"
      class="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex items-center justify-center p-3 bg-primary text-[#fdfffe] rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 ease-out hover:px-4 group active:scale-95 border border-white/10"
      aria-label="GitHub Repository"
    >
      <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
      <span class="max-w-0 overflow-hidden font-medium text-sm whitespace-nowrap opacity-0 ml-0 transition-all duration-300 ease-out group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-2">
        Vidi-ledger
      </span>
    </a>
  </div>
</template>

<script setup lang="ts">
const { isMobileMenuOpen, closeMenu } = useNavigation();
</script>
