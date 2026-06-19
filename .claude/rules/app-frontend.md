---
paths:
  - "app/**/*.vue"
  - "app/**/*.ts"
---
# app/ — Nuxt frontend

- Vue 3 Composition API, `<script setup lang="ts">` only. Typed `defineProps`/`defineEmits`.
- Pages are file-based routes under `app/pages/`; nested dirs = nested paths, `[param]` = dynamic.
- Protect pages with `definePageMeta({ middleware: 'auth' })`; auth state via `useUserSession()`.
- Rely on Nuxt auto-imports — do not manually import `ref`, `computed`, `useState`, composables, or `#components`.
- Shared cross-component state: `useState(key, init)` inside a `composables/use*.ts`.
- Reusable UI in `app/components/ui/` (Button, Input) with `variant` props; reuse before adding new ones.
- Styling: Tailwind 4 utility classes inline. Theme tokens: `bg-primary`, `text-primary`, `bg-primary-light`.
- Fetch data with `$fetch`/`useFetch` against `/api/...`. Display money by dividing cents by 100.
