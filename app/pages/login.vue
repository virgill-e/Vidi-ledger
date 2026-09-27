<template>
  <div class="flex flex-col gap-6">
    <div class="flex p-1 bg-surface-muted rounded-2xl">
      <button
        v-for="m in modes"
        :key="m.value"
        type="button"
        :class="[
          'flex-1 py-2 rounded-xl text-sm font-semibold transition-all',
          mode === m.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted',
        ]"
        @click="switchMode(m.value)"
      >
        {{ m.label }}
      </button>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <UiInput
        v-if="mode === 'register'"
        id="name"
        v-model="name"
        label="Prénom"
        autocomplete="given-name"
        required
      />
      <UiInput
        id="email"
        v-model="email"
        type="email"
        label="Email"
        autocomplete="email"
        required
      />
      <UiInput
        id="password"
        v-model="password"
        type="password"
        label="Mot de passe"
        :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
        :minlength="mode === 'register' ? 8 : undefined"
        required
      />
      <p v-if="mode === 'register'" class="text-xs text-ink-muted px-1 -mt-2">8 caractères minimum.</p>

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

      <UiButton type="submit" :loading="loading" class="mt-2">
        {{ mode === 'login' ? 'Se connecter' : 'Créer mon compte' }}
      </UiButton>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' });

type Mode = 'login' | 'register';
const modes: { value: Mode; label: string }[] = [
  { value: 'login', label: 'Connexion' },
  { value: 'register', label: 'Inscription' },
];

const mode = ref<Mode>('login');
const name = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const { fetch: refreshSession } = useUserSession();
const { reset: resetWallet } = useWallet();
const { reset: resetCategories } = useCategories();

const switchMode = (value: Mode) => {
  mode.value = value;
  error.value = '';
  password.value = '';
};

const errorMessage = (err: any): string => {
  const status = err?.statusCode ?? err?.data?.statusCode;
  if (status === 401) return 'Email ou mot de passe incorrect.';
  if (status === 409) return 'Un compte existe déjà avec cet email.';
  if (status === 429) return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (status >= 500) return 'Erreur serveur. Réessaie dans un instant.';
  return err?.data?.statusMessage || 'Une erreur est survenue. Réessaie.';
};

const submit = async () => {
  loading.value = true;
  error.value = '';

  const isLogin = mode.value === 'login';
  try {
    await $fetch(isLogin ? '/api/auth/login' : '/api/auth/register', {
      method: 'POST',
      body: isLogin
        ? { email: email.value, password: password.value }
        : { name: name.value, email: email.value, password: password.value },
    });
    await refreshSession();
    // Drop any state cached for a previous user of this tab.
    resetWallet();
    resetCategories();
    await navigateTo('/');
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};
</script>
