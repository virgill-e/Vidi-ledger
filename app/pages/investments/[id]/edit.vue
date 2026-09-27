<template>
  <form @submit.prevent="save">
    <SheetHeader title="Modifier l'actif" :back-to="`/investments/${asset.id}`">
      <template #action>
        <button type="submit" :disabled="saving || !form.name.trim()" class="px-4 h-10 rounded-full bg-primary text-white font-semibold text-[15px] disabled:opacity-40">
          Enregistrer
        </button>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-6">
      <UiGroup>
        <label class="flex items-center justify-between gap-4 px-4 min-h-13">
          <span>Nom</span>
          <input v-model="form.name" type="text" maxlength="60" required class="text-right bg-transparent outline-none grow min-w-0" />
        </label>
        <label class="flex items-center justify-between gap-4 px-4 min-h-13">
          <span>Ticker / ISIN</span>
          <input v-model="form.ticker" type="text" maxlength="20" placeholder="—" class="text-right bg-transparent outline-none grow min-w-0 uppercase" />
        </label>
        <label class="flex items-center justify-between gap-4 px-4 min-h-13">
          <span>Type</span>
          <select v-model="form.assetClass" class="bg-transparent text-right text-ink-muted outline-none">
            <option value="">—</option>
            <option v-for="(label, value) in ASSET_CLASS_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </label>
      </UiGroup>

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>
    </div>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const detail = await useRequestFetch()<AssetDetail>(`/api/assets/${route.params.id}`).catch(() => null);
if (!detail) throw createError({ statusCode: 404, statusMessage: 'Asset not found' });
const asset = detail.asset;

const form = reactive({ name: asset.name, ticker: asset.ticker ?? '', assetClass: asset.assetClass ?? '' });
const saving = ref(false);
const error = ref('');

const save = async () => {
  saving.value = true;
  error.value = '';
  try {
    await $fetch(`/api/assets/${asset.id}`, {
      method: 'PATCH',
      body: { name: form.name, ticker: form.ticker.trim() || null, assetClass: form.assetClass || null },
    });
    await navigateTo(`/investments/${asset.id}`);
  } catch (err) {
    error.value = apiErrorMessage(err, "Impossible d'enregistrer.");
  } finally {
    saving.value = false;
  }
};
</script>
