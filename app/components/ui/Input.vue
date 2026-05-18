<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" :for="id" class="text-[15px] font-medium text-text-heading">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :placeholder="placeholder"
      class="bg-white border border-input-border rounded-xl px-4 py-3.5 text-text-heading outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-input-border/80 text-[16px] md:text-[15px] placeholder:text-gray-400"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  id: string;
  label?: string;
  type?: string;
  modelValue: string;
  placeholder?: string;
}>(), {
  type: 'text'
});

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
