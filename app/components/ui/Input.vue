<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" :for="id" class="text-[13px] font-medium text-ink-muted px-1">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      v-bind="$attrs"
      class="w-full bg-surface border border-line rounded-2xl px-4 py-3.5 text-ink text-[16px] outline-none transition-all placeholder:text-ink-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
// Extra attributes (autocomplete, required, minlength…) go to the <input>, not the wrapper.
defineOptions({ inheritAttrs: false });

withDefaults(defineProps<{
  id: string;
  label?: string;
  type?: string;
  modelValue: string;
  placeholder?: string;
}>(), {
  type: 'text',
});

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
