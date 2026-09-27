<template>
  <div class="min-h-dvh bg-linear-160 from-brand-teal to-brand-blue text-white flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
    <TheHeader />
    <main class="grow w-full max-w-3xl mx-auto px-4 sm:px-6 pb-8 flex flex-col">
      <slot />
    </main>
  </div>
</template>
