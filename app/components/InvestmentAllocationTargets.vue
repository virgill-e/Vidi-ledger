<template>
  <div class="bg-card-inner rounded-[36px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-[#eff3f1] transition-transform hover:-translate-y-1 duration-300">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-text-heading text-[22px] font-medium">Objectifs d'allocation</h2>
        <p class="text-text-body/50 text-sm font-medium mt-0.5">Assignez un objectif % à vos actifs existants — la valeur actuelle peut être ajustée manuellement</p>
      </div>

      <!-- Editable total goal -->
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[11px] font-bold uppercase tracking-wider text-text-body/40">Objectif total</span>
        <div
          v-if="!editingGoal"
          @click="startEditGoal"
          class="group flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#f0f4f2] hover:bg-primary/10 hover:ring-2 hover:ring-primary/30 cursor-pointer transition-all"
          title="Cliquer pour modifier l'objectif total"
        >
          <span class="font-bold text-text-heading">{{ goal ? formatCurrency(goal.totalTarget) : 'Définir' }}</span>
          <svg class="w-4 h-4 text-text-body/30 group-hover:text-primary group-hover:scale-110 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <form v-else @submit.prevent="saveGoal" class="flex items-center gap-2">
          <input
            v-model="goalInput"
            ref="goalInputRef"
            type="number"
            min="0"
            step="1"
            class="w-32 bg-white border border-primary/30 rounded-xl px-3 py-2 font-bold text-text-heading focus:outline-none focus:ring-2 focus:ring-primary/30"
            @keydown.esc="cancelEditGoal"
          />
          <button type="submit" class="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </button>
          <button type="button" @click="cancelEditGoal" class="w-9 h-9 rounded-xl bg-bg-base text-text-body/40 flex items-center justify-center hover:text-red-500 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </form>
      </div>
    </div>

    <!-- Rows: one per asset with an assigned target (0% assets are hidden to avoid clutter from old/temporary holdings) -->
    <div class="flex flex-col gap-2">
      <div
        v-for="row in visibleRows"
        :key="row.name"
        class="group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-4 rounded-[20px] border border-transparent hover:border-primary/20 hover:bg-primary/[0.04] hover:shadow-md hover:shadow-black/[0.02] transition-all cursor-default"
      >
        <div class="flex items-center gap-2 sm:w-[22%] min-w-0">
          <span class="font-bold text-text-heading truncate">{{ row.name }}</span>
        </div>

        <div class="flex items-center gap-2 sm:w-[14%]">
          <template v-if="editingAsset === row.name">
            <input
              v-model.number="editPercentInput"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="w-20 bg-white border border-primary/30 rounded-lg px-2 py-1 font-bold text-text-heading text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              @keydown.enter="saveTargetEdit(row)"
              @keydown.esc="cancelTargetEdit"
              autofocus
            />
          </template>
          <template v-else>
            <span class="font-bold text-sm" :class="row.targetPercent > 0 ? 'text-text-heading' : 'text-text-body/30'">{{ formatPercent(row.targetPercent) }}</span>
            <span class="text-[10px] text-text-body/30 font-bold uppercase">objectif</span>
          </template>
        </div>

        <div class="flex flex-col sm:w-[16%]">
          <template v-if="editingAsset === row.name">
            <input
              v-model.number="editValueInput"
              type="number"
              min="0"
              step="1"
              :placeholder="`${(Math.max(0, row.investedValue) / 100).toFixed(0)} (investi)`"
              class="w-28 bg-white border border-primary/30 rounded-lg px-2 py-1 font-semibold text-text-heading text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              @keydown.enter="saveTargetEdit(row)"
              @keydown.esc="cancelTargetEdit"
            />
          </template>
          <template v-else>
            <div class="flex items-center gap-1.5">
              <span class="font-semibold text-text-heading text-sm">{{ formatCurrency(row.currentValue) }}</span>
              <span v-if="row.isManual" class="text-[9px] text-text-body/40 font-bold uppercase bg-bg-base px-1.5 py-0.5 rounded">manuel</span>
            </div>
          </template>
        </div>

        <div class="flex items-center sm:w-[14%]">
          <span
            class="px-2.5 py-1 rounded-lg text-[12px] font-bold"
            :class="row.currentPercent + 0.01 >= row.targetPercent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
          >
            {{ formatPercent(row.currentPercent) }}
          </span>
        </div>

        <div class="flex flex-col sm:w-[16%]">
          <span class="font-semibold text-text-body/70 text-sm">{{ goal && row.targetPercent > 0 ? formatCurrency(row.targetValue) : '—' }}</span>
        </div>

        <div class="flex-1 min-w-0 sm:w-[18%]">
          <div v-if="goal && row.targetPercent > 0 && row.delta > 1" class="text-[12px] font-bold text-red-500 truncate">
            Déposer {{ formatCurrency(row.delta) }}
          </div>
          <div v-else-if="goal && row.targetPercent > 0" class="text-[12px] font-bold text-primary truncate">
            Objectif atteint
          </div>
        </div>

        <!-- Hover actions: more visible affordance to edit -->
        <div class="flex items-center gap-2 sm:opacity-40 group-hover:opacity-100 group-hover:scale-105 transition-all shrink-0">
          <button
            v-if="editingAsset !== row.name"
            @click="startEditTarget(row)"
            class="w-9 h-9 rounded-xl bg-white border border-[#e3ece8] text-text-body/50 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center"
            title="Assigner / modifier l'objectif"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            v-else
            @click="saveTargetEdit(row)"
            class="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all"
            title="Enregistrer"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </button>
          <button
            v-if="editingAsset !== row.name && row.isManual"
            @click="clearOverride(row)"
            class="w-9 h-9 rounded-xl bg-white border border-[#e3ece8] text-text-body/50 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all flex items-center justify-center"
            title="Revenir à la valeur investie"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div v-if="rows.length === 0" class="flex flex-col items-center justify-center py-10 text-text-body/30 italic gap-2">
        <span>Ajoutez des transactions pour voir vos actifs et leur assigner un objectif</span>
      </div>

      <div v-else-if="visibleRows.length === 0" class="flex flex-col items-center justify-center py-10 text-text-body/30 italic gap-2">
        <span>Assignez un objectif à un de vos actifs ci-dessous</span>
      </div>

      <!-- Sum warning -->
      <div v-if="visibleRows.length > 0" class="flex items-center justify-end gap-2 px-4 pt-1 text-[12px] font-bold" :class="Math.abs(totalTargetPercent - 100) < 0.5 ? 'text-text-body/30' : 'text-amber-600'">
        Total des objectifs : {{ formatPercent(totalTargetPercent) }}
        <span v-if="Math.abs(totalTargetPercent - 100) >= 0.5">(≠ 100%)</span>
      </div>
    </div>

    <!-- Assign a target to an asset that doesn't have one yet -->
    <form v-if="unassignedAssets.length > 0" @submit.prevent="assignNewTarget" class="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-dashed border-[#eff3f1]">
      <select
        v-model="newTargetAsset"
        class="flex-1 min-w-[160px] bg-[#f8faf9] border border-[#e3ece8] rounded-[16px] px-4 py-3 text-text-heading font-medium focus:outline-none focus:border-primary/30 transition-all"
      >
        <option value="" disabled>Choisir un actif...</option>
        <option v-for="asset in unassignedAssets" :key="asset.name" :value="asset.name">{{ asset.name }}</option>
      </select>
      <input
        v-model.number="newTargetPercent"
        type="number"
        min="0"
        max="100"
        step="0.1"
        placeholder="Objectif %"
        class="w-32 bg-[#f8faf9] border border-[#e3ece8] rounded-[16px] px-4 py-3 text-text-heading font-medium focus:outline-none focus:border-primary/30 transition-all"
      />
      <button
        type="submit"
        :disabled="!newTargetAsset || newTargetPercent === null"
        class="bg-primary text-white px-5 py-3 rounded-[16px] font-bold shadow-md shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0 flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
        Assigner un objectif
      </button>
    </form>

    <!-- Under-target summary -->
    <div v-if="goal && underTarget.length > 0" class="mt-6 bg-red-50 border border-red-100 rounded-[24px] p-6">
      <h3 class="text-red-600 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        Sous l'objectif — à renforcer
      </h3>
      <ul class="flex flex-col gap-2">
        <li v-for="row in underTarget" :key="row.name" class="flex items-center justify-between gap-4 bg-white/70 rounded-xl px-4 py-3">
          <span class="font-bold text-text-heading">{{ row.name }}</span>
          <span class="font-bold text-red-600">Déposer {{ formatCurrency(row.delta) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';

type AssetSummary = { name: string; netInvested: number };
type Target = { id: number; asset: string; targetPercent: number; currentValueOverride: number | null };
type Goal = { id: number; totalTarget: number } | null;

const props = defineProps<{ assets: AssetSummary[] }>();

const fmt = useFormat();
const formatCurrency = (cents: number) => fmt.formatCurrency(cents);
const formatPercent = (value: number) => `${value.toFixed(1).replace('.', ',')}%`;

const targets = ref<Target[]>([]);
const goal = ref<Goal>(null);

const fetchTargets = async () => {
  try {
    targets.value = await $fetch('/api/investments/targets');
  } catch (err) {
    console.error('Failed to fetch investment targets', err);
  }
};

const fetchGoal = async () => {
  try {
    goal.value = await $fetch('/api/investments/goal');
  } catch (err) {
    console.error('Failed to fetch investment goal', err);
  }
};

onMounted(() => {
  fetchTargets();
  fetchGoal();
});

const findTarget = (assetName: string) =>
  targets.value.find(t => t.asset.toLowerCase() === assetName.toLowerCase());

// The current value of an asset defaults to its invested cost basis, but can
// be overridden manually — useful since we have no live market price feed
// and the market value can differ a lot from what was actually put in.
const resolvedValue = (asset: AssetSummary, target: Target | undefined) =>
  target?.currentValueOverride ?? Math.max(0, asset.netInvested);

const totalCurrentValue = computed(() =>
  props.assets.reduce((acc, a) => acc + resolvedValue(a, findTarget(a.name)), 0)
);

// One row per asset actually held in the portfolio — targets are assigned
// directly on top of existing holdings, never as a free-standing entry.
const rows = computed(() => {
  return props.assets.map(asset => {
    const target = findTarget(asset.name);
    const targetPercent = target?.targetPercent ?? 0;
    const investedValue = Math.max(0, asset.netInvested);
    const currentValue = resolvedValue(asset, target);
    const isManual = target?.currentValueOverride != null;
    const currentPercent = totalCurrentValue.value > 0 ? (currentValue / totalCurrentValue.value) * 100 : 0;
    const targetValue = goal.value ? Math.round(goal.value.totalTarget * (targetPercent / 100)) : 0;
    const delta = targetValue - currentValue;
    return { name: asset.name, id: target?.id ?? null, targetPercent, investedValue, currentValue, isManual, currentPercent, targetValue, delta };
  });
});

// Only assets with an assigned target are shown, to avoid cluttering the
// list with old/temporary holdings that were never meant to have a goal.
const visibleRows = computed(() => rows.value.filter(r => r.targetPercent > 0));
const unassignedAssets = computed(() => rows.value.filter(r => r.targetPercent === 0));

const totalTargetPercent = computed(() => visibleRows.value.reduce((acc, r) => acc + r.targetPercent, 0));

const underTarget = computed(() =>
  visibleRows.value.filter(r => r.delta > 1).sort((a, b) => b.delta - a.delta)
);

// --- Goal editing ---
const editingGoal = ref(false);
const goalInput = ref<number | null>(null);
const goalInputRef = ref<HTMLInputElement | null>(null);

const startEditGoal = async () => {
  goalInput.value = goal.value ? goal.value.totalTarget / 100 : null;
  editingGoal.value = true;
  await nextTick();
  goalInputRef.value?.focus();
};

const cancelEditGoal = () => { editingGoal.value = false; };

const saveGoal = async () => {
  if (goalInput.value === null || goalInput.value < 0) return;
  try {
    goal.value = await $fetch('/api/investments/goal', {
      method: 'POST',
      body: { totalTarget: Math.round(goalInput.value * 100) },
    });
    editingGoal.value = false;
  } catch (err) {
    console.error('Failed to save investment goal', err);
  }
};

// --- Per-asset target editing (upsert directly on the asset row) ---
const editingAsset = ref<string | null>(null);
const editPercentInput = ref<number | null>(null);
const editValueInput = ref<number | null>(null);

const startEditTarget = (row: { name: string; targetPercent: number; isManual: boolean; currentValue: number }) => {
  editingAsset.value = row.name;
  editPercentInput.value = row.targetPercent;
  editValueInput.value = row.isManual ? row.currentValue / 100 : null;
};

const cancelTargetEdit = () => { editingAsset.value = null; };

const saveTargetEdit = async (row: { name: string }) => {
  if (editPercentInput.value === null || editPercentInput.value < 0) return;
  try {
    const saved = await $fetch('/api/investments/targets', {
      method: 'POST',
      body: {
        asset: row.name,
        targetPercent: editPercentInput.value,
        currentValueOverride: editValueInput.value !== null ? Math.round(editValueInput.value * 100) : null,
      },
    }) as Target;
    const idx = targets.value.findIndex(t => t.asset.toLowerCase() === row.name.toLowerCase());
    if (idx !== -1) targets.value[idx] = saved;
    else targets.value.push(saved);
    editingAsset.value = null;
  } catch (err) {
    console.error('Failed to save investment target', err);
  }
};

const clearOverride = async (row: { id: number | null }) => {
  if (row.id === null) return;
  try {
    const updated = await $fetch(`/api/investments/targets/${row.id}`, {
      method: 'PATCH',
      body: { currentValueOverride: null },
    }) as Target;
    const idx = targets.value.findIndex(t => t.id === row.id);
    if (idx !== -1) targets.value[idx] = updated;
  } catch (err) {
    console.error('Failed to clear investment target override', err);
  }
};

// --- Assign a target to a currently-unassigned (0%) asset ---
const newTargetAsset = ref('');
const newTargetPercent = ref<number | null>(null);

const assignNewTarget = async () => {
  if (!newTargetAsset.value || newTargetPercent.value === null) return;
  try {
    const saved = await $fetch('/api/investments/targets', {
      method: 'POST',
      body: { asset: newTargetAsset.value, targetPercent: newTargetPercent.value },
    }) as Target;
    const idx = targets.value.findIndex(t => t.asset.toLowerCase() === newTargetAsset.value.toLowerCase());
    if (idx !== -1) targets.value[idx] = saved;
    else targets.value.push(saved);
    newTargetAsset.value = '';
    newTargetPercent.value = null;
  } catch (err) {
    console.error('Failed to assign investment target', err);
  }
};
</script>
