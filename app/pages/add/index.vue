<template>
  <div>
    <SheetHeader :title="kind === 'expense' ? 'Choisis une catégorie' : 'Nouveau revenu'" back-to="/">
      <template #action>
        <NuxtLink :to="`/settings/categories?kind=${kind}`" class="px-4 h-10 rounded-full bg-surface border border-line flex items-center font-medium text-[15px]">
          Modifier
        </NuxtLink>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-5">
      <KindTabs v-model="kind" />

      <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <CategoryTile
          v-for="c in available"
          :key="c.id"
          :name="c.name"
          :icon="c.icon"
          :color="c.color"
          :to="c.isInvestment ? `/invest/${c.id}` : `/add/${c.id}`"
        />
        <NuxtLink
          :to="`/settings/categories/new?kind=${kind}`"
          class="aspect-square rounded-2xl bg-surface border border-dashed border-ink/20 flex flex-col items-center justify-center gap-2 text-ink hover:border-primary/50 transition-colors"
        >
          <Icon name="lucide:plus" class="size-7" />
          <span class="text-[12px] font-semibold">Ajouter</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const router = useRouter();

const kind = computed<CategoryKind>({
  get: () => (route.query.kind === 'income' ? 'income' : 'expense'),
  set: (value) => router.replace({ query: { kind: value } }),
});

const { categories, ensureLoaded } = useCategories();
await ensureLoaded();

// Investment categories open the trade form (/invest/:categoryId).
const available = computed(() =>
  (categories.value ?? []).filter((c) => c.kind === kind.value && !c.archivedAt),
);
</script>
