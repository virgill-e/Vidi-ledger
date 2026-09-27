<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'w-full py-3.5 px-5 rounded-2xl font-semibold text-[15px] transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
      variantClass,
    ]"
  >
    <Icon v-if="loading" name="lucide:loader-circle" class="size-5 animate-spin" />
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  loading?: boolean;
  disabled?: boolean;
}>(), {
  variant: 'primary',
  type: 'button',
  loading: false,
  disabled: false,
});

const variantClass = computed(() => ({
  primary: 'bg-primary text-white shadow-lg shadow-primary/25 hover:brightness-105',
  secondary: 'bg-primary-soft text-primary hover:brightness-[0.98]',
  ghost: 'bg-transparent text-primary hover:bg-primary-soft/60',
  danger: 'bg-surface text-negative border border-line hover:bg-negative/5',
}[props.variant]));
</script>
