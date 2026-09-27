<template>
  <header class="w-full max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <NuxtLink to="/" class="flex items-center gap-2 font-semibold tracking-tight">
      <Icon name="lucide:wallet" class="size-6" />
      <span class="text-lg">Vidi Ledger</span>
    </NuxtLink>

    <div v-if="user" class="flex items-center gap-2">
      <span class="hidden sm:block text-sm text-white/80">{{ user.name }}</span>
      <button
        type="button"
        class="size-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
        aria-label="Se déconnecter"
        title="Se déconnecter"
        @click="logout"
      >
        <Icon name="lucide:log-out" class="size-5" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, clear } = useUserSession();

// clear() hits the built-in session DELETE route; server/plugins/sessionCleanup.ts
// removes the matching `sessions` row.
const logout = async () => {
  await clear();
  await navigateTo('/login');
};
</script>
