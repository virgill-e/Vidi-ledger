<template>
  <UiSegmented :model-value="modelValue" :options="tabs" @update:model-value="$emit('update:modelValue', $event)" />
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
