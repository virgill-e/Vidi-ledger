<template>
  <div class="flex p-1 bg-ink/5 rounded-xl" role="tablist">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === option.value"
      :class="[
        'flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all',
        modelValue === option.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted',
      ]"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
defineProps<{
  modelValue: T;
  options: { value: T; label: string }[];
}>();

defineEmits<{
  'update:modelValue': [value: T];
}>();
</script>
