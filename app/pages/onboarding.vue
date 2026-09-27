<template>
  <form class="flex flex-col gap-5" @submit.prevent="submit">
    <div>
      <h1 class="text-xl font-semibold">Crée ton portefeuille</h1>
      <p class="text-sm text-ink-muted mt-1">Ton budget journalier démarre à la date de début.</p>
    </div>

    <div class="bg-surface-muted rounded-3xl p-3 -mx-2">
      <WalletForm
        v-model:name="form.name"
        v-model:start-date="form.startDate"
        v-model:no-end-date="form.noEndDate"
        v-model:end-date="form.endDate"
        v-model:currency="form.currency"
        v-model:timezone="form.timezone"
      />
    </div>

    <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

    <UiButton type="submit" :loading="loading">Créer mon portefeuille</UiButton>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'onboarding' });

const { wallet } = useWallet();
const { reset: resetCategories } = useCategories();

const form = reactive({
  name: 'Mon portefeuille',
  startDate: todayIn(DEFAULT_TIMEZONE),
  noEndDate: true,
  endDate: '',
  currency: 'EUR',
  timezone: DEFAULT_TIMEZONE,
});

// Browser timezone and local date are only known client-side.
onMounted(() => {
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (browserTz && isValidTimeZone(browserTz)) form.timezone = browserTz;
  form.startDate = todayIn(form.timezone);
});

const loading = ref(false);
const error = ref('');

const submit = async () => {
  loading.value = true;
  error.value = '';
  try {
    wallet.value = await $fetch<Wallet>('/api/wallet', {
      method: 'POST',
      body: {
        name: form.name,
        startDate: form.startDate,
        endDate: form.noEndDate ? null : form.endDate,
        currency: form.currency,
        timezone: form.timezone,
      },
    });
    resetCategories();
    await navigateTo('/');
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Impossible de créer le portefeuille.';
  } finally {
    loading.value = false;
  }
};
</script>
