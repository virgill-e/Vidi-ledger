<template>
  <div class="grid grid-cols-2 gap-3">
    <button
      type="button"
      :class="[chip, isToday ? chipActive : chipIdle]"
      :aria-pressed="isToday"
      @click="$emit('update:modelValue', today)"
    >
      Aujourd'hui
    </button>
    <label :class="[chip, !isToday ? chipActive : chipIdle, 'relative cursor-pointer']">
      <Icon name="lucide:calendar" class="size-5" />
      <span v-if="!isToday">{{ formatDate(modelValue) }}</span>
      <span v-else class="sr-only">Choisir une date</span>
      <input
        type="date"
        :value="modelValue"
        :min="min"
        :max="max"
        class="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="Date"
        @change="onPick"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  today: string;
  min?: string;
  max?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { formatDate } = useFormat();
const isToday = computed(() => props.modelValue === props.today);

const chip = 'h-14 rounded-2xl border font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors';
const chipActive = 'bg-primary-soft border-primary/60 text-primary';
const chipIdle = 'bg-surface border-line text-ink';

const onPick = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  if (value) emit('update:modelValue', value);
};
</script>
