<template>
  <div class="flex p-1 bg-ink/5 rounded-xl">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      :class="[
        'flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all',
        modelValue === tab.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted',
      ]"
      @click="$emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: CategoryKind;
}>();

defineEmits<{
  'update:modelValue': [value: CategoryKind];
}>();

const tabs: { value: CategoryKind; label: string }[] = [
  { value: 'expense', label: 'Dépense' },
  { value: 'income', label: 'Revenu' },
];
</script>
