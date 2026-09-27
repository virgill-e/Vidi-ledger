<template>
  <label class="flex items-center justify-between gap-4 min-h-14 border-b border-line">
    <span class="text-[16px]">{{ label }}</span>
    <span class="relative flex items-center gap-1" :class="active ? 'text-primary' : 'text-ink-muted'">
      <select
        :value="modelValue"
        class="appearance-none bg-transparent text-right outline-none pr-5 cursor-pointer"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <!-- `selected` too: a <select>'s value is not part of the SSR markup. -->
        <option v-for="o in options" :key="o.value" :value="o.value" :selected="o.value === modelValue">{{ o.label }}</option>
      </select>
      <Icon name="lucide:chevrons-up-down" class="size-4 absolute right-0 pointer-events-none" />
    </span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  modelValue: string;
  options: { value: string; label: string }[];
  /** Highlight the value (e.g. anything other than "Non"). */
  active?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
