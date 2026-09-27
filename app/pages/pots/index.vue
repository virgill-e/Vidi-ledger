<template>
  <div>
    <SheetHeader title="Épargne" back-to="/">
      <template #action>
        <NuxtLink to="/pots/new" class="size-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30" aria-label="Nouveau pot">
          <Icon name="lucide:plus" class="size-6" />
        </NuxtLink>
      </template>
    </SheetHeader>

    <div class="px-4 flex flex-col gap-6">
      <div class="text-center py-2">
        <p class="text-ink-muted text-sm font-medium">Total épargné</p>
        <p class="text-4xl font-light tracking-tight tabular-nums mt-1">{{ formatMoney(total) }}</p>
      </div>

      <div v-if="!active.length" class="bg-surface rounded-2xl p-6 text-center flex flex-col items-center gap-3">
        <Icon name="lucide:piggy-bank" class="size-10 text-primary" />
        <p class="text-ink-muted">Crée un pot pour mettre de côté ton surplus, puis paie certaines dépenses avec.</p>
        <NuxtLink to="/pots/new" class="font-semibold text-primary">Créer un pot</NuxtLink>
      </div>

      <UiGroup v-else>
        <NuxtLink v-for="p in active" :key="p.id" :to="`/pots/${p.id}`" class="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted/60">
          <span class="size-11 shrink-0 rounded-xl flex items-center justify-center" :style="{ backgroundColor: `${p.color}1a` }">
            <Icon :name="p.icon" class="size-6" :style="{ color: p.color }" />
          </span>
          <span class="grow min-w-0 flex flex-col gap-1">
            <span class="truncate font-medium">{{ p.name }}</span>
            <PotProgress :balance="p.balance" :target="p.targetAmount" :color="p.color" />
          </span>
          <span class="tabular-nums font-semibold">{{ formatMoney(p.balance) }}</span>
        </NuxtLink>
      </UiGroup>

      <UiGroup v-if="archived.length" title="Archivés">
        <NuxtLink v-for="p in archived" :key="p.id" :to="`/pots/${p.id}`" class="flex items-center gap-3 px-4 min-h-13 text-ink-muted hover:bg-surface-muted/60">
          <Icon :name="p.icon" class="size-5" />
          <span class="grow">{{ p.name }}</span>
          <Icon name="lucide:chevron-right" class="size-5" />
        </NuxtLink>
      </UiGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'sheet', middleware: 'wallet' });

const { formatMoney } = useFormat();
const pots = await useRequestFetch()<Pot[]>('/api/pots');

const active = computed(() => pots.filter((p) => !p.archivedAt));
const archived = computed(() => pots.filter((p) => p.archivedAt));
const total = computed(() => pots.reduce((sum, p) => sum + p.balance, 0));
</script>
