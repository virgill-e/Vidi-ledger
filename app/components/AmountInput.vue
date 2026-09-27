<template>
  <div class="relative bg-surface border rounded-3xl flex items-center transition-colors" :class="invalid ? 'border-negative' : 'border-primary/60'">
    <input
      ref="input"
      :value="modelValue"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      placeholder="0,00"
      aria-label="Montant"
      class="w-full bg-transparent text-center text-5xl font-light tracking-tight tabular-nums py-6 pl-12 pr-12 outline-none placeholder:text-ink/20"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span class="absolute right-12 text-3xl font-light text-ink/40 pointer-events-none" aria-hidden="true">{{ symbol }}</span>
    <button
      v-if="modelValue"
      type="button"
      class="absolute right-3 size-7 rounded-full bg-ink/40 text-white flex items-center justify-center"
      aria-label="Effacer le montant"
      @click="$emit('update:modelValue', ''); input?.focus()"
    >
      <Icon name="lucide:x" class="size-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  invalid?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();

const { wallet } = useWallet();
const symbol = computed(() =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: wallet.value?.currency ?? 'EUR' })
    .formatToParts(0).find((p) => p.type === 'currency')?.value ?? '€',
);

const input = ref<HTMLInputElement>();
onMounted(() => input.value?.focus());
</script>
