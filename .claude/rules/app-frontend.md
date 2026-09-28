---
paths:
  - "app/**/*.vue"
  - "app/**/*.ts"
---
# app/ — Nuxt frontend

- Vue 3 Composition API, `<script setup lang="ts">` only. Typed `defineProps`/`defineEmits`.
- Pages are file-based routes under `app/pages/`; nested dirs = nested paths, `[param]` = dynamic.
- Protect pages with `definePageMeta({ middleware: 'wallet' })` (signed in + wallet; `'onboarding'`, `'auth'`, `'guest'` for the special cases); auth state via `useUserSession()`.
- Rely on Nuxt auto-imports — do not manually import `ref`, `computed`, `useState`, composables, or `#components`.
- Shared cross-component state: `useState(key, init)` inside a `composables/use*.ts`.
- Reusable UI in `app/components/ui/` (Button, Input) with `variant` props; reuse before adding new ones.
- Styling: Tailwind 4 utility classes inline, mobile-first. Theme tokens (`main.css`): `brand-teal`/`brand-blue` (app gradient: `bg-linear-160 from-brand-teal to-brand-blue`), `primary`, `primary-soft`, `surface`, `surface-muted`, `ink`, `ink-muted`, `line`, `positive`, `negative`.
- Icons: `<Icon name="lucide:…" class="size-5" />` (SVG mode, served locally, no external API).
- Fetch data with `$fetch`/`useFetch` against `/api/...`. Display money by dividing cents by 100.
- A `<select>` bound with `:value` (not `v-model`) must also set `:selected` on its options, or SSR shows the first option (see `SelectRow`).
- Money inputs: parse with `parseAmount` (euros, comma or dot), send euros to the API; display cents with `formatMoney`.
- Don't write an auto-imported constant right before a `/` (e.g. `x * QUANTITY_SCALE / y`): unimport may take it for a regex and skip the import. Use the helpers (e.g. `tradeUnitPrice`).
- Map API errors to French with `apiErrorMessage(err, fallback)` (`app/utils/labels.ts`).
