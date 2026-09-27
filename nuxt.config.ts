import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Vidi Ledger',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#4fb8b0' },
      ],
    },
  },
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['nuxt-auth-utils', '@nuxt/icon'],
  icon: {
    // Icons are served from the locally installed @iconify-json/* packages;
    // no request ever leaves for the public Iconify API.
    serverBundle: { collections: ['lucide'] },
    fallbackToApi: false,
  },
  runtimeConfig: {
    session: {
      // Set at runtime via NUXT_SESSION_PASSWORD (32+ chars).
      password: '',
      // Cookie lifetime; requireAuth slides this forward on active use and
      // enforces per-device revocation via the `sessions` table.
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  },
  vite: {
    plugins: [
      // Cast: @tailwindcss/vite is typed against a different vite copy than Nuxt's.
      tailwindcss() as any,
    ],
  },
});