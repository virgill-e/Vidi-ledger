<template>
  <div class="min-h-screen bg-bg-base text-text-body antialiased font-sans selection:bg-primary-light selection:text-primary flex flex-col p-4 sm:p-6 lg:p-10">

    <!-- Brand header -->
    <div class="flex items-center justify-between max-w-[1100px] w-full mx-auto mb-6 lg:mb-10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary/30">
          V
        </div>
        <span class="text-text-heading text-xl font-bold tracking-tight">Vidi Ledger</span>
      </div>
      <span class="text-[12px] font-bold text-text-body/40 uppercase tracking-widest tabular-nums">Erreur {{ statusCode }}</span>
    </div>

    <div class="grow flex flex-col gap-6 lg:gap-8 max-w-[1100px] w-full mx-auto">

      <!-- Hero -->
      <div class="bg-primary rounded-[32px] p-8 sm:p-10 text-white relative overflow-hidden shadow-[0_12px_40px_rgba(41,75,60,0.15)]">
        <div class="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-20 -mt-24"></div>
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span class="text-[80px] sm:text-[96px] font-bold leading-none tracking-tighter block">404</span>
            <h1 class="text-2xl sm:text-3xl font-semibold mt-2">{{ heading }}</h1>
            <p class="text-white/60 font-medium mt-2 max-w-md">
              Cette page n'existe pas — mais votre argent, lui, peut continuer à travailler. Simulez vos intérêts composés en attendant.
            </p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 shrink-0">
            <button @click="goHome"
              class="py-3.5 px-5 rounded-xl font-medium transition-all duration-200 text-center text-[15px] active:scale-[0.98] bg-white text-primary hover:bg-white/90 shadow-sm whitespace-nowrap">
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>

      <!-- Calculator -->
      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-6 lg:gap-8">

        <!-- Inputs -->
        <div class="bg-card-inner rounded-[32px] p-7 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col gap-6">
          <div>
            <h2 class="text-text-heading text-[22px] font-medium">Intérêts composés</h2>
            <p class="text-text-body/50 text-sm font-medium mt-0.5">Ajustez les curseurs pour simuler.</p>
          </div>

          <!-- Capital de départ -->
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <label for="initial" class="text-[15px] font-medium text-text-heading">Capital de départ</label>
              <span class="text-[13px] font-bold text-primary tabular-nums">{{ fmtEur(initial) }}</span>
            </div>
            <div class="relative">
              <input id="initial" v-model.number="initial" type="number" min="0" step="100"
                class="w-full bg-white border border-input-border rounded-xl pl-4 pr-9 py-3 text-text-heading outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[16px] md:text-[15px] tabular-nums" />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-body/40 font-medium pointer-events-none">€</span>
            </div>
            <input v-model.number="initial" type="range" min="0" max="100000" step="500" class="w-full accent-primary cursor-pointer" />
          </div>

          <!-- Versement mensuel -->
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <label for="monthly" class="text-[15px] font-medium text-text-heading">Versement mensuel</label>
              <span class="text-[13px] font-bold text-primary tabular-nums">{{ fmtEur(monthly) }}</span>
            </div>
            <div class="relative">
              <input id="monthly" v-model.number="monthly" type="number" min="0" step="50"
                class="w-full bg-white border border-input-border rounded-xl pl-4 pr-9 py-3 text-text-heading outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[16px] md:text-[15px] tabular-nums" />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-body/40 font-medium pointer-events-none">€</span>
            </div>
            <input v-model.number="monthly" type="range" min="0" max="3000" step="25" class="w-full accent-primary cursor-pointer" />
          </div>

          <!-- Taux annuel -->
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <label for="rate" class="text-[15px] font-medium text-text-heading">Taux annuel moyen</label>
              <span class="text-[13px] font-bold text-primary tabular-nums">{{ rate.toFixed(1) }} %</span>
            </div>
            <div class="relative">
              <input id="rate" v-model.number="rate" type="number" min="0" max="30" step="0.1"
                class="w-full bg-white border border-input-border rounded-xl pl-4 pr-9 py-3 text-text-heading outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[16px] md:text-[15px] tabular-nums" />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-body/40 font-medium pointer-events-none">%</span>
            </div>
            <input v-model.number="rate" type="range" min="0" max="20" step="0.1" class="w-full accent-primary cursor-pointer" />
          </div>

          <!-- Durée -->
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <label for="years" class="text-[15px] font-medium text-text-heading">Durée</label>
              <span class="text-[13px] font-bold text-primary tabular-nums">{{ years }} {{ years > 1 ? 'ans' : 'an' }}</span>
            </div>
            <div class="relative">
              <input id="years" v-model.number="years" type="number" min="1" max="60" step="1"
                class="w-full bg-white border border-input-border rounded-xl pl-4 pr-12 py-3 text-text-heading outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[16px] md:text-[15px] tabular-nums" />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-body/40 font-medium pointer-events-none">ans</span>
            </div>
            <input v-model.number="years" type="range" min="1" max="50" step="1" class="w-full accent-primary cursor-pointer" />
          </div>
        </div>

        <!-- Results -->
        <div class="flex flex-col gap-6 min-w-0">

          <!-- Stat cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-primary rounded-[28px] p-6 text-white relative overflow-hidden shadow-[0_12px_40px_rgba(41,75,60,0.15)] min-w-0">
              <div class="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
              <span class="text-[11px] font-bold text-white/60 uppercase tracking-widest relative z-10">Capital final</span>
              <span class="text-2xl sm:text-[28px] font-semibold leading-none tracking-tight mt-2 block relative z-10 truncate tabular-nums">{{ fmtEur(result.total) }}</span>
            </div>
            <div class="bg-card-inner rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] min-w-0">
              <span class="text-[11px] font-bold text-text-body/40 uppercase tracking-widest">Total investi</span>
              <span class="text-2xl sm:text-[28px] font-semibold text-text-heading leading-none tracking-tight mt-2 block truncate tabular-nums">{{ fmtEur(result.contributed) }}</span>
            </div>
            <div class="bg-card-inner rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] min-w-0">
              <span class="text-[11px] font-bold text-text-body/40 uppercase tracking-widest">Intérêts générés</span>
              <span class="text-2xl sm:text-[28px] font-semibold text-primary leading-none tracking-tight mt-2 block truncate tabular-nums">+{{ fmtEur(result.interest) }}</span>
            </div>
          </div>

          <!-- Growth chart -->
          <div class="bg-card-inner rounded-[32px] p-7 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] flex flex-col grow min-w-0">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 class="text-text-heading text-[20px] font-medium">Croissance du capital</h2>
                <p class="text-text-body/50 text-sm font-medium mt-0.5">Projection sur {{ years }} {{ years > 1 ? 'ans' : 'an' }}</p>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-primary/25"></span>
                  <span class="text-[12px] font-semibold text-text-body/60">Versé</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-primary"></span>
                  <span class="text-[12px] font-semibold text-text-body/60">Intérêts</span>
                </div>
              </div>
            </div>

            <!-- Bars (flex-1 + min-w-0 so adding years never widens the page) -->
            <div class="flex items-end justify-between gap-[2px] sm:gap-1 grow min-h-[220px] min-w-0">
              <div v-for="(p, i) in series" :key="p.year" class="relative flex flex-col items-center gap-2 flex-1 min-w-0 group/bar">
                <!-- Hover tooltip -->
                <div :class="['pointer-events-none absolute bottom-full mb-2 z-20 w-max opacity-0 translate-y-1 group-hover/bar:opacity-100 group-hover/bar:translate-y-0 transition-all duration-150', tipAlign(i)]">
                  <div class="bg-text-heading text-white rounded-2xl p-3.5 shadow-xl shadow-black/20">
                    <div class="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">{{ p.year === 0 ? 'Départ' : `Année ${p.year}` }}</div>
                    <div class="flex items-center justify-between gap-5 text-[12px]">
                      <span class="text-white/60 whitespace-nowrap">Total investi</span>
                      <span class="font-semibold tabular-nums whitespace-nowrap">{{ fmtEur(p.contributed) }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-5 text-[12px] mt-1.5">
                      <span class="text-white/60 whitespace-nowrap">Intérêts générés</span>
                      <span class="font-semibold tabular-nums whitespace-nowrap text-primary-light">+{{ fmtEur(p.interest) }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-5 text-[12px] mt-2 pt-2 border-t border-white/10">
                      <span class="text-white/60 whitespace-nowrap">Capital total</span>
                      <span class="font-bold tabular-nums whitespace-nowrap">{{ fmtEur(p.total) }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col-reverse w-full h-[200px] max-w-[26px] mx-auto cursor-pointer">
                  <div class="w-full bg-primary/25 transition-all duration-300 ease-out group-hover/bar:bg-primary/40 rounded-b-md"
                    :style="{ height: barPct(p.contributed) }"></div>
                  <div class="w-full bg-primary transition-all duration-300 ease-out group-hover/bar:brightness-110 rounded-t-md"
                    :style="{ height: barPct(p.interest) }"></div>
                </div>
                <span v-if="showLabel(p.year)" class="text-[10px] sm:text-[11px] font-medium text-text-body/50 tabular-nums">{{ p.year }}</span>
                <span v-else class="text-[10px] sm:text-[11px] font-medium text-transparent select-none">·</span>
              </div>
            </div>
            <p class="text-[12px] text-text-body/40 font-medium mt-4 text-center">
              Sur {{ years }} {{ years > 1 ? 'ans' : 'an' }}, vos intérêts représentent
              <span class="font-bold text-primary">{{ interestShare }} %</span> du capital final.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string };
}>();

const statusCode = computed(() => props.error?.statusCode ?? 404);
const heading = computed(() =>
  statusCode.value === 404 ? 'Page introuvable' : (props.error?.statusMessage || 'Une erreur est survenue')
);

const { formatCurrency } = useFormat();
// Inputs are in whole euros; the centralized formatter works on cents.
const fmtEur = (euros: number) => formatCurrency(Math.round((euros || 0) * 100));

// Calculator inputs
const initial = ref(1000);
const monthly = ref(150);
const rate = ref(7);
const years = ref(20);

// Monthly-compounded projection, end-of-month contributions.
const projectAt = (yrs: number) => {
  const r = (rate.value || 0) / 100 / 12;
  const m = Math.max(0, Math.round(yrs * 12));
  const cap = Math.max(0, initial.value || 0);
  const pmt = Math.max(0, monthly.value || 0);

  const fvCapital = cap * Math.pow(1 + r, m);
  const fvContrib = r === 0 ? pmt * m : pmt * ((Math.pow(1 + r, m) - 1) / r);

  const total = fvCapital + fvContrib;
  const contributed = cap + pmt * m;
  return { total, contributed, interest: Math.max(0, total - contributed) };
};

const series = computed(() => {
  const n = Math.max(1, Math.min(60, Math.round(years.value || 1)));
  const pts = [];
  for (let y = 0; y <= n; y++) pts.push({ year: y, ...projectAt(y) });
  return pts;
});

const result = computed(() => projectAt(Math.max(1, years.value || 1)));

const chartMax = computed(() => Math.max(...series.value.map((p) => p.total), 1));
const barPct = (v: number) => `${Math.max(v > 0 ? 2 : 0, (v / chartMax.value) * 100)}%`;

// Keep the x-axis readable regardless of duration.
const labelStep = computed(() => {
  const n = series.value.length - 1;
  if (n <= 15) return 1;
  if (n <= 30) return 5;
  return 10;
});
const showLabel = (year: number) =>
  year === 0 || year === series.value.length - 1 || year % labelStep.value === 0;

// Anchor the hover tooltip inside the chart so edge bars never overflow.
const tipAlign = (i: number) => {
  const n = series.value.length;
  if (i <= 1) return 'left-0';
  if (i >= n - 2) return 'right-0';
  return 'left-1/2 -translate-x-1/2';
};

const interestShare = computed(() =>
  result.value.total > 0 ? Math.round((result.value.interest / result.value.total) * 100) : 0
);

const goHome = () => clearError({ redirect: '/' });
</script>
