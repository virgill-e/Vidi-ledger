<template>
  <div class="flex flex-col gap-6">
    <section class="flex flex-col gap-2">
      <h2 class="text-[13px] font-medium text-ink-muted px-1">Couleur</h2>
      <div class="flex flex-wrap gap-2.5">
        <button
          v-for="c in CATEGORY_COLORS"
          :key="c"
          type="button"
          :aria-label="`Couleur ${c}`"
          :aria-pressed="color === c"
          :class="['size-9 rounded-full transition-transform', color === c ? 'ring-3 ring-offset-2 ring-offset-surface-muted scale-110' : '']"
          :style="{ backgroundColor: c, '--tw-ring-color': c }"
          @click="color = c"
        />
      </div>
    </section>

    <section v-for="group in CATEGORY_ICON_GROUPS" :key="group.title" class="flex flex-col gap-2">
      <h2 class="text-[13px] font-medium text-ink-muted px-1">{{ group.title }}</h2>
      <div class="grid grid-cols-6 sm:grid-cols-8 gap-2">
        <button
          v-for="i in group.icons"
          :key="i"
          type="button"
          :aria-label="i.replace('lucide:', '')"
          :aria-pressed="icon === i"
          :class="[
            'aspect-square rounded-xl border flex items-center justify-center transition-colors',
            icon === i ? 'border-primary bg-primary-soft' : 'border-line bg-surface hover:border-primary/40',
          ]"
          @click="icon = i"
        >
          <Icon :name="i" class="size-5" :style="{ color: icon === i ? color : undefined }" />
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const icon = defineModel<string>('icon', { required: true });
const color = defineModel<string>('color', { required: true });
</script>
