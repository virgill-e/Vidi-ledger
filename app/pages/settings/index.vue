<template>
  <div>
    <SheetHeader title="Réglages" back-to="/" />
    <div class="px-4 flex flex-col gap-6">
      <UiGroup title="Portefeuille">
        <NuxtLink to="/settings/wallet" class="flex items-center gap-3 px-4 min-h-13 hover:bg-surface-muted/60">
          <Icon name="lucide:wallet" class="size-5 text-primary" />
          <span class="grow">{{ wallet?.name }}</span>
          <Icon name="lucide:chevron-right" class="size-5 text-ink-muted" />
        </NuxtLink>
        <NuxtLink to="/settings/categories" class="flex items-center gap-3 px-4 min-h-13 hover:bg-surface-muted/60">
          <Icon name="lucide:tag" class="size-5 text-primary" />
          <span class="grow">Catégories</span>
          <Icon name="lucide:chevron-right" class="size-5 text-ink-muted" />
        </NuxtLink>
      </UiGroup>

      <UiGroup title="Compte">
        <div class="px-4 py-3">
          <p class="font-medium">{{ user?.name }}</p>
          <p class="text-sm text-ink-muted">{{ user?.email }}</p>
        </div>
        <button type="button" class="w-full flex items-center gap-3 px-4 min-h-13 text-negative hover:bg-negative/5" @click="logout">
          <Icon name="lucide:log-out" class="size-5" />
          Se déconnecter
        </button>
      </UiGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const { user, clear } = useUserSession();
const { wallet, reset: resetWallet } = useWallet();
const { reset: resetCategories } = useCategories();

// clear() hits the built-in session DELETE route; server/plugins/sessionCleanup.ts
// removes the matching `sessions` row.
const logout = async () => {
  await clear();
  resetWallet();
  resetCategories();
  await navigateTo('/login');
};
</script>
