<template>
  <div class="flex flex-col gap-2">
    <div class="grid grid-cols-2 gap-3">
      <button
        type="button"
        :class="[chip, isToday ? chipActive : chipIdle, 'disabled:opacity-40 disabled:pointer-events-none']"
        :aria-pressed="isToday"
        :disabled="!todayAllowed"
        @click="$emit('update:modelValue', today)"
      >
        Aujourd'hui
      </button>
      <div class="relative">
        <button type="button" :class="[chip, !isToday ? chipActive : chipIdle, 'w-full']" @click="openPicker">
          <Icon name="lucide:calendar" class="size-5" />
          <span v-if="!isToday">{{ formatDate(modelValue) }}</span>
          <span v-else class="sr-only">Choisir une date</span>
        </button>
        <!-- Native picker, opened by the button (desktop browsers ignore clicks on an invisible date input). -->
        <input
          ref="input"
          type="date"
          :value="modelValue"
          :min="min"
          :max="max"
          tabindex="-1"
          aria-hidden="true"
          class="absolute bottom-0 left-1/2 size-px opacity-0 pointer-events-none"
          @change="onPick"
        />
      </div>
    </div>
    <p v-if="!todayAllowed && min && today < min" class="text-[13px] text-ink-muted text-center">
      Ton portefeuille démarre le {{ formatDate(min) }} : choisis une date à partir de ce jour.
    </p>
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
// Today can be outside the wallet period (not started yet / already ended).
const todayAllowed = computed(() => clampDate(props.today, props.min, props.max) === props.today);

const chip = 'h-14 rounded-2xl border font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors outline-none focus-visible:ring-4 focus-visible:ring-primary/20';
const chipActive = 'bg-primary-soft border-primary/60 text-primary';
const chipIdle = 'bg-surface border-line text-ink';

const input = ref<HTMLInputElement>();
const openPicker = () => {
  const el = input.value;
  if (!el) return;
  try {
    el.showPicker();
  } catch {
    // Older browsers: focusing/clicking the input is the best fallback.
    el.focus();
    el.click();
  }
};

const onPick = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  if (value) emit('update:modelValue', value);
};
</script>
