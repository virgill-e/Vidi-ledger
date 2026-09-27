<template>
  <form @submit.prevent="save">
    <SheetHeader title="Mot de passe" back-to="/settings">
      <template #action>
        <button type="submit" :disabled="!canSave || saving" class="px-4 h-10 rounded-full bg-primary text-white font-semibold text-[15px] disabled:opacity-40">
          Enregistrer
        </button>
      </template>
    </SheetHeader>
    <div class="px-4 flex flex-col gap-4">
      <UiInput id="current" v-model="current" type="password" label="Mot de passe actuel" autocomplete="current-password" required />
      <UiInput id="next" v-model="next" type="password" label="Nouveau mot de passe" autocomplete="new-password" minlength="8" required />
      <p class="text-xs text-ink-muted px-1 -mt-2">8 caractères minimum.</p>
      <p v-if="notice" class="text-sm text-positive bg-positive/10 rounded-xl px-3 py-2" role="status">{{ notice }}</p>
      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>
    </div>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const current = ref('');
const next = ref('');
const canSave = computed(() => current.value.length > 0 && next.value.length >= 8);
const saving = ref(false);
const notice = ref('');
const error = ref('');

const save = async () => {
  saving.value = true;
  notice.value = '';
  error.value = '';
  try {
    await $fetch('/api/user/password', { method: 'PATCH', body: { currentPassword: current.value, newPassword: next.value } });
    current.value = '';
    next.value = '';
    notice.value = 'Mot de passe changé.';
  } catch (err: any) {
    error.value = err?.data?.statusMessage === 'Current password is incorrect'
      ? 'Mot de passe actuel incorrect.'
      : apiErrorMessage(err, "Impossible d'enregistrer.");
  } finally {
    saving.value = false;
  }
};
</script>
