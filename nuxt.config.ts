import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['nuxt-auth-utils'],
  runtimeConfig: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    public: {}
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
});