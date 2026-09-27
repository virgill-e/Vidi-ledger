<template>
  <div>
    <SheetHeader :title="target.name" back-to="/admin" />
    <div class="px-4 flex flex-col gap-6">
      <UiGroup>
        <div class="px-4 py-3">
          <p class="font-medium">{{ target.email }}</p>
          <p class="text-sm text-ink-muted">{{ target.wallet ? `Portefeuille « ${target.wallet.name} »` : 'Aucun portefeuille' }}</p>
        </div>
      </UiGroup>

      <p v-if="notice" class="text-sm text-positive bg-positive/10 rounded-xl px-3 py-2" role="status">{{ notice }}</p>
      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

      <form class="flex flex-col gap-2" @submit.prevent="changePassword">
        <h2 class="text-[13px] font-medium text-ink-muted px-4">Nouveau mot de passe</h2>
        <div class="bg-surface rounded-2xl p-3 flex items-center gap-2">
          <input
            v-model="password"
            type="password"
            minlength="8"
            autocomplete="new-password"
            placeholder="8 caractères minimum"
            aria-label="Nouveau mot de passe"
            class="grow min-w-0 bg-surface-muted rounded-lg px-3 py-2 outline-none"
          />
          <button type="submit" :disabled="password.length < 8 || busy" class="h-10 px-4 rounded-full bg-primary text-white font-semibold disabled:opacity-40">
            Changer
          </button>
        </div>
        <p class="text-[12px] text-ink-muted px-4">L'utilisateur est déconnecté de tous ses appareils.</p>
      </form>

      <ConfirmDelete v-if="target.wallet" label="Réinitialiser les données" :loading="busy" @confirm="resetData">
        Supprimer le portefeuille de <strong>{{ target.name }}</strong> et toutes ses données (catégories, mouvements, pots, investissements) ? Le compte est conservé.
      </ConfirmDelete>

      <ConfirmDelete label="Supprimer le compte" :loading="busy" @confirm="deleteAccount">
        Supprimer définitivement le compte <strong>{{ target.email }}</strong> et toutes ses données ?
      </ConfirmDelete>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'admin' });

const route = useRoute();
const all = await useRequestFetch()<AdminUser[]>('/api/admin/users');
const found = all.find((u) => u.id === Number(route.params.id) && !u.isAdmin);
if (!found) throw createError({ statusCode: 404, statusMessage: 'User not found' });
const target = ref<AdminUser>(found);

const password = ref('');
const busy = ref(false);
const notice = ref('');
const error = ref('');

const run = async (action: () => Promise<unknown>, done: string) => {
  busy.value = true;
  notice.value = '';
  error.value = '';
  try {
    await action();
    notice.value = done;
  } catch (err) {
    error.value = apiErrorMessage(err, 'Action impossible.');
  } finally {
    busy.value = false;
  }
};

const changePassword = () => run(async () => {
  await $fetch(`/api/admin/users/${target.value.id}/password`, { method: 'PATCH', body: { password: password.value } });
  password.value = '';
}, 'Mot de passe changé.');

const resetData = () => run(async () => {
  await $fetch(`/api/admin/users/${target.value.id}/data`, { method: 'DELETE' });
  target.value = { ...target.value, wallet: null };
}, 'Données réinitialisées.');

const deleteAccount = () => run(async () => {
  await $fetch(`/api/admin/users/${target.value.id}`, { method: 'DELETE' });
  await navigateTo('/admin');
}, 'Compte supprimé.');
</script>
