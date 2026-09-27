<template>
  <form @submit.prevent="save">
    <SheetHeader :title="pot ? 'Modifier le pot' : 'Nouveau pot'" :back-to="pot ? `/pots/${pot.id}` : '/pots'">
      <template #action>
        <button type="submit" :disabled="saving || !canSave" class="px-4 h-10 rounded-full bg-primary text-white font-semibold text-[15px] disabled:opacity-40">
          Enregistrer
        </button>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-6">
      <div class="flex items-center gap-3">
        <span class="size-16 shrink-0 rounded-2xl flex items-center justify-center bg-surface border border-line">
          <Icon :name="form.icon" class="size-8" :style="{ color: form.color }" />
        </span>
        <input
          v-model="form.name"
          type="text"
          maxlength="40"
          required
          placeholder="ex. Vacances, Voiture…"
          aria-label="Nom du pot"
          class="grow min-w-0 bg-surface border border-line rounded-2xl px-4 py-3.5 text-[16px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <UiGroup title="Objectif (optionnel)">
        <label class="flex items-center justify-between gap-4 px-4 min-h-13">
          <span>Montant visé</span>
          <input
            v-model="form.target"
            type="text"
            inputmode="decimal"
            placeholder="—"
            aria-label="Objectif"
            :class="['text-right bg-transparent outline-none tabular-nums w-32', targetInvalid && 'text-negative']"
          />
        </label>
      </UiGroup>

      <IconColorPicker v-model:icon="form.icon" v-model:color="form.color" />

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

      <UiButton v-if="pot" :variant="pot.archivedAt ? 'secondary' : 'danger'" :loading="archiving" @click="toggleArchive">
        <Icon :name="pot.archivedAt ? 'lucide:archive-restore' : 'lucide:archive'" class="size-5" />
        {{ pot.archivedAt ? 'Restaurer' : 'Archiver' }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  pot?: Pot;
}>();

const form = reactive({
  name: props.pot?.name ?? '',
  icon: props.pot?.icon ?? 'lucide:piggy-bank',
  color: props.pot?.color ?? CATEGORY_COLORS[7]!,
  target: props.pot?.targetAmount ? centsToInput(props.pot.targetAmount) : '',
});

const targetInvalid = computed(() => form.target.trim() !== '' && parseAmount(form.target) === null);
const canSave = computed(() => form.name.trim() !== '' && !targetInvalid.value);

const saving = ref(false);
const archiving = ref(false);
const error = ref('');

const save = async () => {
  saving.value = true;
  error.value = '';
  try {
    const body = {
      name: form.name,
      icon: form.icon,
      color: form.color,
      targetAmount: form.target.trim() ? parseAmount(form.target) : null,
    };
    const saved = await $fetch<Pot>(props.pot ? `/api/pots/${props.pot.id}` : '/api/pots', {
      method: props.pot ? 'PATCH' : 'POST',
      body,
    });
    await navigateTo(`/pots/${saved.id}`);
  } catch (err: any) {
    error.value = err?.data?.statusMessage || "Impossible d'enregistrer.";
  } finally {
    saving.value = false;
  }
};

const toggleArchive = async () => {
  archiving.value = true;
  error.value = '';
  try {
    await $fetch(`/api/pots/${props.pot!.id}`, { method: 'PATCH', body: { archived: !props.pot!.archivedAt } });
    await navigateTo('/pots');
  } catch (err: any) {
    error.value = err?.data?.statusMessage === 'Empty the pot before archiving it'
      ? 'Vide le pot (reprends son solde vers le budget) avant de l’archiver.'
      : err?.data?.statusMessage || 'Action impossible.';
  } finally {
    archiving.value = false;
  }
};
</script>
