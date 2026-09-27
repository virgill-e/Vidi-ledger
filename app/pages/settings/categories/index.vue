<template>
  <div>
    <SheetHeader title="Catégories" back-to="/settings" />
    <div class="px-4 flex flex-col gap-5">
      <KindTabs v-model="kind" />

      <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <CategoryTile
          v-for="c in active"
          :key="c.id"
          :name="c.name"
          :icon="c.icon"
          :color="c.color"
          :to="`/settings/categories/${c.id}`"
        />
        <NuxtLink
          :to="`/settings/categories/new?kind=${kind}`"
          class="aspect-square rounded-2xl bg-surface border border-dashed border-ink/20 flex flex-col items-center justify-center gap-2 text-ink hover:border-primary/50 transition-colors"
        >
          <Icon name="lucide:plus" class="size-7" />
          <span class="text-[12px] font-semibold">Ajouter</span>
        </NuxtLink>
      </div>

      <UiGroup v-if="archived.length" title="Archivées">
        <NuxtLink
          v-for="c in archived"
          :key="c.id"
          :to="`/settings/categories/${c.id}`"
          class="flex items-center gap-3 px-4 min-h-13 text-ink-muted hover:bg-surface-muted/60"
        >
          <Icon :name="c.icon" class="size-5" />
          <span class="grow">{{ c.name }}</span>
          <Icon name="lucide:chevron-right" class="size-5" />
        </NuxtLink>
      </UiGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const route = useRoute();
const router = useRouter();

// The tab lives in the URL so coming back from the editor keeps it.
const kind = computed<CategoryKind>({
  get: () => (route.query.kind === 'income' ? 'income' : 'expense'),
  set: (value) => router.replace({ query: { kind: value } }),
});

const { categories, ensureLoaded } = useCategories();
await ensureLoaded();

const ofKind = computed(() => (categories.value ?? []).filter((c) => c.kind === kind.value));
const active = computed(() => ofKind.value.filter((c) => !c.archivedAt));
const archived = computed(() => ofKind.value.filter((c) => c.archivedAt));
</script>
