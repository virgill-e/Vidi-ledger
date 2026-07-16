import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['nuxt-auth-utils'],
  runtimeConfig: {
    session: {
      // Cookie lifetime; requireAuth slides this forward on active use and
      // enforces per-device revocation via the `sessions` table.
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
});