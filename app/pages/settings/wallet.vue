<template>
  <form @submit.prevent="save">
    <SheetHeader title="Portefeuille" back-to="/settings">
      <template #action>
        <button type="submit" :disabled="saving" class="px-4 h-10 rounded-full bg-primary text-white font-semibold text-[15px] disabled:opacity-50">
          Enregistrer
        </button>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-6">
      <WalletForm
        v-model:name="form.name"
        v-model:start-date="form.startDate"
        v-model:no-end-date="form.noEndDate"
        v-model:end-date="form.endDate"
        v-model:currency="form.currency"
        v-model:timezone="form.timezone"
      />

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

      <ConfirmDelete :loading="deleting" @confirm="remove">
        Supprimer <strong>{{ wallet?.name }}</strong> efface définitivement ses catégories, pots, investissements et mouvements. Ton compte est conservé.
      </ConfirmDelete>
    </div>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const { wallet, reset: resetWallet } = useWallet();
const { reset: resetCategories } = useCategories();

const current = wallet.value!;
const form = reactive({
  name: current.name,
  startDate: current.startDate,
  noEndDate: current.endDate === null,
  endDate: current.endDate ?? '',
  currency: current.currency,
  timezone: current.timezone,
});

const saving = ref(false);
const error = ref('');

const save = async () => {
  saving.value = true;
  error.value = '';
  try {
    wallet.value = await $fetch<Wallet>('/api/wallet', {
      method: 'PATCH',
      body: {
        name: form.name,
        startDate: form.startDate,
        endDate: form.noEndDate ? null : form.endDate,
        currency: form.currency,
        timezone: form.timezone,
      },
    });
    await navigateTo('/settings');
  } catch (err: any) {
    error.value = err?.data?.statusMessage || "Impossible d'enregistrer.";
  } finally {
    saving.value = false;
  }
};

const deleting = ref(false);

const remove = async () => {
  deleting.value = true;
  try {
    await $fetch('/api/wallet', { method: 'DELETE' });
    resetWallet();
    resetCategories();
    await navigateTo('/onboarding');
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Impossible de supprimer.';
    deleting.value = false;
  }
};
</script>
