<template>
  <div class="flex flex-col gap-6">
    <UiGroup title="Nom">
      <input
        v-model="name"
        type="text"
        maxlength="60"
        required
        aria-label="Nom du portefeuille"
        class="w-full px-4 min-h-13 bg-transparent outline-none text-[16px]"
      />
    </UiGroup>

    <UiGroup title="Dates">
      <label class="flex items-center justify-between gap-4 px-4 min-h-13">
        <span>Commencer</span>
        <input v-model="startDate" type="date" required class="bg-surface-muted rounded-lg px-2.5 py-1.5 text-[15px] outline-none focus:ring-2 focus:ring-primary/30" />
      </label>
      <div class="flex items-center justify-between gap-4 px-4 min-h-13">
        <span>Pas de date limite</span>
        <UiToggle v-model="noEndDate" label="Pas de date limite" />
      </div>
      <label v-if="!noEndDate" class="flex items-center justify-between gap-4 px-4 min-h-13">
        <span>Terminer</span>
        <input v-model="endDate" type="date" :min="startDate" required class="bg-surface-muted rounded-lg px-2.5 py-1.5 text-[15px] outline-none focus:ring-2 focus:ring-primary/30" />
      </label>
    </UiGroup>

    <UiGroup title="Région">
      <label class="flex items-center justify-between gap-4 px-4 min-h-13">
        <span>Devise</span>
        <select v-model="currency" class="bg-transparent text-right text-ink-muted outline-none max-w-[60%]">
          <option v-for="c in SUPPORTED_CURRENCIES" :key="c" :value="c">{{ currencyLabel(c) }}</option>
        </select>
      </label>
      <label class="flex items-center justify-between gap-4 px-4 min-h-13">
        <span>Fuseau horaire</span>
        <select v-model="timezone" class="bg-transparent text-right text-ink-muted outline-none max-w-[60%]">
          <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
        </select>
      </label>
    </UiGroup>
  </div>
</template>

<script setup lang="ts">
const name = defineModel<string>('name', { required: true });
const startDate = defineModel<string>('startDate', { required: true });
const noEndDate = defineModel<boolean>('noEndDate', { required: true });
const endDate = defineModel<string>('endDate', { required: true });
const currency = defineModel<string>('currency', { required: true });
const timezone = defineModel<string>('timezone', { required: true });

const currencyNames = new Intl.DisplayNames('fr', { type: 'currency' });
const currencyLabel = (code: string) => currencyNames.of(code) ?? code;

// Keep the current value selectable even if the runtime does not list it.
const timezones = computed(() => {
  const all = Intl.supportedValuesOf('timeZone');
  return all.includes(timezone.value) ? all : [timezone.value, ...all];
});
</script>
