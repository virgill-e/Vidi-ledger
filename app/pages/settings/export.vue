<template>
  <div>
    <SheetHeader title="Exporter mes données" back-to="/settings" />
    <div class="px-4 flex flex-col gap-6">
      <p class="text-sm text-ink-muted px-1">
        Un fichier zip avec tes dépenses, revenus, investissements, épargne et récurrences en CSV, un JSON complet
        et un LISEZMOI qui explique les fichiers et propose un prompt pour une IA.
      </p>

      <UiGroup title="Période">
        <div class="flex items-center justify-between gap-4 px-4 min-h-14">
          <span>Tout l'historique</span>
          <UiToggle v-model="all" label="Tout l'historique" />
        </div>
        <template v-if="!all">
          <label class="flex items-center justify-between gap-4 px-4 min-h-14">
            <span>Du</span>
            <input v-model="from" type="date" :max="to || undefined" class="bg-surface-muted rounded-lg px-2.5 py-1.5 outline-none" />
          </label>
          <label class="flex items-center justify-between gap-4 px-4 min-h-14">
            <span>Au</span>
            <input v-model="to" type="date" :min="from || undefined" class="bg-surface-muted rounded-lg px-2.5 py-1.5 outline-none" />
          </label>
        </template>
      </UiGroup>
      <p v-if="!all && !valid" class="text-[13px] text-negative text-center -mt-4">Choisis deux dates, la première avant la seconde.</p>

      <a
        v-if="valid"
        :href="url"
        download
        class="h-13 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:brightness-105"
      >
        <Icon name="lucide:download" class="size-5" />
        Télécharger l'export
      </a>
      <UiButton v-else disabled>
        <Icon name="lucide:download" class="size-5" />
        Télécharger l'export
      </UiButton>

      <p class="text-[13px] text-ink-muted px-1">
        L'export ne se réimporte pas dans l'app : pour une sauvegarde restaurable, utilise les sauvegardes de la base de données.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const { wallet } = useWallet();
const today = todayIn(wallet.value!.timezone);

const all = ref(true);
const from = ref(wallet.value!.startDate < today ? wallet.value!.startDate : addDays(today, -30));
const to = ref(today);

const valid = computed(() => all.value || (isLocalDate(from.value) && isLocalDate(to.value) && from.value <= to.value));
const url = computed(() => (all.value ? '/api/export' : `/api/export?from=${from.value}&to=${to.value}`));
</script>
