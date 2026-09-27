<template>
  <form @submit.prevent="save">
    <SheetHeader :title="isNew ? 'Nouvelle catégorie' : 'Modifier la catégorie'" :back-to="backTo">
      <template #action>
        <button type="submit" :disabled="saving || !form.name.trim()" class="px-4 h-10 rounded-full bg-primary text-white font-semibold text-[15px] disabled:opacity-40">
          Enregistrer
        </button>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-6">
      <div class="flex items-center gap-3">
        <div class="size-20 shrink-0">
          <CategoryTile :name="kindLabel" :icon="form.icon" :color="form.color" />
        </div>
        <input
          v-model="form.name"
          type="text"
          maxlength="40"
          required
          placeholder="ex. Courses, Salaire…"
          aria-label="Nom de la catégorie"
          class="grow min-w-0 bg-surface border border-line rounded-2xl px-4 py-3.5 text-[16px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>
      <p v-if="category?.isInvestment" class="text-sm text-ink-muted -mt-3 px-1">
        Catégorie d'investissement : elle ouvre le formulaire {{ category.kind === 'expense' ? "d'achat" : 'de vente et de dividende' }}.
      </p>

      <section class="flex flex-col gap-2">
        <h2 class="text-[13px] font-medium text-ink-muted px-1">Couleur</h2>
        <div class="flex flex-wrap gap-2.5">
          <button
            v-for="c in CATEGORY_COLORS"
            :key="c"
            type="button"
            :aria-label="`Couleur ${c}`"
            :aria-pressed="form.color === c"
            :class="['size-9 rounded-full transition-transform', form.color === c ? 'ring-3 ring-offset-2 ring-offset-surface-muted scale-110' : '']"
            :style="{ backgroundColor: c, '--tw-ring-color': c }"
            @click="form.color = c"
          />
        </div>
      </section>

      <section v-for="group in CATEGORY_ICON_GROUPS" :key="group.title" class="flex flex-col gap-2">
        <h2 class="text-[13px] font-medium text-ink-muted px-1">{{ group.title }}</h2>
        <div class="grid grid-cols-6 sm:grid-cols-8 gap-2">
          <button
            v-for="icon in group.icons"
            :key="icon"
            type="button"
            :aria-label="icon.replace('lucide:', '')"
            :aria-pressed="form.icon === icon"
            :class="[
              'aspect-square rounded-xl border flex items-center justify-center transition-colors',
              form.icon === icon ? 'border-primary bg-primary-soft' : 'border-line bg-surface hover:border-primary/40',
            ]"
            @click="form.icon = icon"
          >
            <Icon :name="icon" class="size-5" :style="{ color: form.icon === icon ? form.color : undefined }" />
          </button>
        </div>
      </section>

      <p v-if="error" class="text-sm text-negative bg-negative/5 rounded-xl px-3 py-2" role="alert">{{ error }}</p>

      <UiButton v-if="category" :variant="category.archivedAt ? 'secondary' : 'danger'" :loading="archiving" @click="toggleArchive">
        <Icon :name="category.archivedAt ? 'lucide:archive-restore' : 'lucide:archive'" class="size-5" />
        {{ category.archivedAt ? 'Restaurer' : 'Archiver' }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const { categories, ensureLoaded, refresh } = useCategories();
await ensureLoaded();

const isNew = route.params.id === 'new';
const category = computed(() => categories.value?.find((c) => c.id === Number(route.params.id)));
if (!isNew && !category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' });
}

const kind: CategoryKind = category.value?.kind ?? (route.query.kind === 'income' ? 'income' : 'expense');
const kindLabel = kind === 'expense' ? 'Dépense' : 'Revenu';
const backTo = `/settings/categories?kind=${kind}`;

const form = reactive({
  name: category.value?.name ?? '',
  icon: category.value?.icon ?? 'lucide:tag',
  color: category.value?.color ?? CATEGORY_COLORS[0]!,
});

const saving = ref(false);
const archiving = ref(false);
const error = ref('');

const save = async () => {
  saving.value = true;
  error.value = '';
  try {
    const body = { name: form.name, icon: form.icon, color: form.color };
    await $fetch(isNew ? '/api/categories' : `/api/categories/${category.value!.id}`, {
      method: isNew ? 'POST' : 'PATCH',
      body: isNew ? { ...body, kind } : body,
    });
    await refresh();
    await navigateTo(backTo);
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
    await $fetch(`/api/categories/${category.value!.id}`, {
      method: 'PATCH',
      body: { archived: !category.value!.archivedAt },
    });
    await refresh();
    await navigateTo(backTo);
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Action impossible.';
  } finally {
    archiving.value = false;
  }
};
</script>
