<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :class="[
      'relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors',
      modelValue ? 'bg-positive' : 'bg-ink/15',
    ]"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      :class="[
        'absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform',
        modelValue ? 'translate-x-5' : 'translate-x-0',
      ]"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  label?: string;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>
