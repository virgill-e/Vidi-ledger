<template>
  <div class="min-h-dvh bg-linear-160 from-brand-teal to-brand-blue pt-[max(0.75rem,env(safe-area-inset-top))] sm:py-10">
    <div class="min-h-[calc(100dvh-0.75rem)] sm:min-h-0 w-full max-w-xl mx-auto bg-surface-muted text-ink rounded-t-[28px] sm:rounded-[28px] shadow-2xl shadow-black/10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <slot />
    </div>
  </div>
</template>
