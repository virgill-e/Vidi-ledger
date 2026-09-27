<template>
  <div>
    <SheetHeader title="Administration" back-to="/settings" />
    <div class="px-4 flex flex-col gap-6">
      <p class="text-center text-sm text-ink-muted">{{ users.length }} compte(s)</p>
      <UiGroup>
        <component
          :is="u.isAdmin ? 'div' : NuxtLink"
          v-for="u in users"
          :key="u.id"
          :to="u.isAdmin ? undefined : `/admin/users/${u.id}`"
          :class="['flex items-center gap-3 px-4 py-3', !u.isAdmin && 'hover:bg-surface-muted/60']"
        >
          <span class="grow min-w-0">
            <span class="flex items-center gap-2">
              <span class="truncate font-medium">{{ u.name }}</span>
              <span v-if="u.isAdmin" class="text-[11px] font-bold uppercase rounded-md px-1.5 py-0.5 bg-primary-soft text-primary">Admin</span>
            </span>
            <span class="block text-[13px] text-ink-muted truncate">{{ u.email }}</span>
            <span class="block text-[12px] text-ink-muted truncate">
              Inscrit le {{ formatTimestamp(u.createdAt) }} · {{ u.lastActiveAt ? `actif le ${formatTimestamp(u.lastActiveAt)}` : 'aucune session ouverte' }}
            </span>
          </span>
          <Icon v-if="!u.isAdmin" name="lucide:chevron-right" class="size-5 text-ink-muted" />
        </component>
      </UiGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components';

definePageMeta({ layout: 'sheet', middleware: 'admin' });

const users = await useRequestFetch()<AdminUser[]>('/api/admin/users');
const formatTimestamp = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
</script>
