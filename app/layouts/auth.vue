<template>
  <div class="min-h-dvh bg-linear-160 from-brand-teal to-brand-blue flex flex-col items-center justify-center px-4 py-10">
    <div class="flex items-center gap-2.5 text-white mb-8">
      <Icon name="lucide:wallet" class="size-7" />
      <span class="text-2xl font-semibold tracking-tight">Vidi Ledger</span>
    </div>
    <div class="w-full max-w-sm bg-surface text-ink rounded-[28px] shadow-2xl shadow-black/10 p-6 sm:p-8">
      <slot />
    </div>
  </div>
</template>
