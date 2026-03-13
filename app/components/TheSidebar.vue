<template>
  <aside :class="[
    'flex flex-col w-[110px] bg-[#e3ece8] rounded-[36px] py-10 items-center justify-between shrink-0 shadow-[inset_0_2px_10px_rgba(255,255,255,0.8)] border border-white/50 z-50 fixed h-[calc(100vh-32px)] sm:h-[calc(100vh-48px)] lg:h-[calc(100vh-80px)] top-4 sm:top-6 lg:top-10 transition-transform duration-300 left-4 sm:left-6 md:translate-x-0',
    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[150%] md:translate-x-0'
  ]">
    <div class="flex flex-col gap-8 w-full">
      <!-- Dashboard -->
      <NuxtLink to="/" class="flex flex-col items-center gap-2.5 transition-colors group px-2" 
        :class="[route.path === '/' || route.path === '' ? 'text-primary font-medium' : 'text-text-body/60 hover:text-primary']"
        @click="closeMenu">
        <div :class="['w-12 h-12 rounded-[16px] flex items-center justify-center transition-all', 
          (route.path === '/' || route.path === '') ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-100' : 'group-hover:bg-primary/10']">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <span class="text-[12px]" :class="[(route.path === '/' || route.path === '') ? 'font-semibold' : 'font-medium']">Dashboard</span>
      </NuxtLink>

      <!-- Transactions -->
      <NuxtLink to="/transactions" class="flex flex-col items-center gap-2.5 transition-colors group px-2"
        :class="[route.path.startsWith('/transactions') ? 'text-primary font-medium' : 'text-text-body/60 hover:text-primary']"
        @click="closeMenu">
        <div :class="['w-12 h-12 rounded-[16px] flex items-center justify-center transition-all', 
          route.path.startsWith('/transactions') ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-100' : 'group-hover:bg-primary/10']">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span class="text-[12px]" :class="[route.path.startsWith('/transactions') ? 'font-semibold' : 'font-medium']">Dépenses</span>
      </NuxtLink>

      <!-- Investments -->
      <NuxtLink to="/investments" class="flex flex-col items-center gap-2.5 transition-colors group px-2"
        :class="[route.path.startsWith('/investments') ? 'text-primary font-medium' : 'text-text-body/60 hover:text-primary']"
        @click="closeMenu">
        <div :class="['w-12 h-12 rounded-[16px] flex items-center justify-center transition-all', 
          route.path.startsWith('/investments') ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-100' : 'group-hover:bg-primary/10']">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <span class="text-[12px]" :class="[route.path.startsWith('/investments') ? 'font-semibold' : 'font-medium']">Investments</span>
      </NuxtLink>

      <!-- Analytics -->
      <NuxtLink to="/analytics" class="flex flex-col items-center gap-2.5 transition-colors group px-2"
        :class="[route.path.startsWith('/analytics') ? 'text-primary font-medium' : 'text-text-body/60 hover:text-primary']"
        @click="closeMenu">
        <div :class="['w-12 h-12 rounded-[16px] flex items-center justify-center transition-all', 
          route.path.startsWith('/analytics') ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-100' : 'group-hover:bg-primary/10']">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span class="text-[12px]" :class="[route.path.startsWith('/analytics') ? 'font-semibold' : 'font-medium']">Analyses</span>
      </NuxtLink>

      <!-- Admin -->
      <NuxtLink v-if="user?.role === 'admin'" to="/admin" class="flex flex-col items-center gap-2.5 transition-colors group px-2"
        :class="[route.path.startsWith('/admin') ? 'text-primary font-medium' : 'text-text-body/60 hover:text-primary']"
        @click="closeMenu">
        <div :class="['w-12 h-12 rounded-[16px] flex items-center justify-center transition-all', 
          route.path.startsWith('/admin') ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-100' : 'group-hover:bg-primary/10']">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <span class="text-[12px]" :class="[route.path.startsWith('/admin') ? 'font-semibold' : 'font-medium']">Admin</span>
      </NuxtLink>
    </div>

    <div class="flex flex-col gap-4 w-full">
      <!-- Settings -->
      <NuxtLink to="/settings" class="flex flex-col items-center gap-2.5 transition-colors group px-2"
        :class="[route.path.startsWith('/settings') ? 'text-primary font-medium' : 'text-text-body/60 hover:text-primary']"
        @click="closeMenu">
        <div :class="['w-12 h-12 rounded-[16px] flex items-center justify-center transition-all', 
          route.path.startsWith('/settings') ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-100' : 'group-hover:bg-primary/10']">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span class="text-[12px]" :class="[route.path.startsWith('/settings') ? 'font-semibold' : 'font-medium']">Réglages</span>
      </NuxtLink>

      <!-- Logout -->
      <button @click="handleLogout" class="flex flex-col items-center gap-2.5 text-text-body/60 hover:text-red-500 transition-colors group px-2">
        <div class="w-12 h-12 rounded-[16px] flex items-center justify-center transition-all group-hover:bg-red-50">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <span class="text-[12px] font-medium">Déconnexion</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
const { isMobileMenuOpen, closeMenu } = useNavigation();
const { user, clear: clearSession } = useUserSession();
const route = useRoute();

const handleLogout = async () => {
  await clearSession();
  await navigateTo('/login');
};
</script>
