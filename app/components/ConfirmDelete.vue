<template>
  <div v-if="!confirming">
    <UiButton variant="danger" @click="confirming = true">
      <Icon name="lucide:trash-2" class="size-5" />
      {{ label }}
    </UiButton>
  </div>
  <div v-else class="bg-surface rounded-2xl p-4 flex flex-col gap-3 border border-negative/30">
    <p class="text-sm"><slot /></p>
    <div class="flex gap-2">
      <UiButton variant="secondary" @click="confirming = false">Annuler</UiButton>
      <UiButton variant="destructive" :loading="loading" @click="$emit('confirm')">{{ label }}</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label?: string;
  loading?: boolean;
}>(), {
  label: 'Supprimer',
  loading: false,
});

defineEmits<{
  confirm: [];
}>();

const confirming = ref(false);
</script>
