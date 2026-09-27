<template>
  <div class="min-h-dvh bg-linear-160 from-brand-teal to-brand-blue flex flex-col items-center justify-center px-4 py-10">
    <div class="w-full max-w-sm bg-surface text-ink rounded-[28px] shadow-2xl shadow-black/10 p-8 flex flex-col items-center text-center gap-3">
      <span class="text-6xl font-light tracking-tight tabular-nums text-primary">{{ statusCode }}</span>
      <h1 class="text-xl font-semibold">{{ heading }}</h1>
      <UiButton class="mt-4" @click="goHome">Retour à l'accueil</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string };
}>();

const statusCode = computed(() => props.error?.statusCode ?? 500);
const heading = computed(() =>
  statusCode.value === 404 ? 'Page introuvable' : 'Une erreur est survenue',
);

const goHome = () => clearError({ redirect: '/' });
</script>
