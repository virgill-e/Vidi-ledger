<template>
  <div ref="root" class="relative select-none">
    <svg class="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polygon :points="areaPoints" class="fill-white/10" />
      <polyline :points="linePoints" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    </svg>

    <div
      v-for="p in points"
      :key="`guide-${p.day.date}`"
      class="absolute top-0 bottom-0 w-px bg-white/15"
      :style="{ left: `${p.x}%` }"
    />

    <button
      v-for="(p, i) in points"
      :key="p.day.date"
      type="button"
      class="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      :class="selected === i ? 'z-20' : 'z-10'"
      :style="position(p, i)"
      :aria-expanded="selected === i"
      :aria-label="`${label(p.day.date)} : ${formatMoney(p.day.available)}`"
      @click="selected = selected === i ? null : i"
    >
      <span v-if="selected !== i" class="block bg-white rounded-[20px] px-5 py-2 text-center shadow-lg shadow-black/10 min-w-32">
        <span class="block text-[13px] font-medium text-ink-muted">{{ label(p.day.date) }}</span>
        <span :class="['block text-lg font-bold tabular-nums', p.day.available < 0 ? 'text-negative' : 'text-primary']">{{ formatMoney(p.day.available) }}</span>
      </span>

      <span v-else data-card class="flex flex-col items-center bg-white rounded-2xl px-5 py-3 shadow-xl shadow-black/15 min-w-40 text-center">
        <span class="text-[12px] font-semibold text-white bg-primary rounded-full px-2.5 py-0.5 mb-2">{{ label(p.day.date) }}</span>
        <span class="text-[13px] font-semibold text-ink-muted">Excédent</span>
        <span :class="['text-lg font-bold tabular-nums', p.day.carry < 0 ? 'text-negative' : 'text-positive']">{{ formatMoney(p.day.carry) }}</span>
        <span class="text-[13px] font-semibold text-ink-muted mt-1">Budget quotidien</span>
        <span class="text-lg font-bold tabular-nums text-positive">{{ formatMoney(p.day.allowance) }}</span>
        <template v-if="p.day.income">
          <span class="text-[13px] font-semibold text-ink-muted mt-1">Revenus</span>
          <span class="text-lg font-bold tabular-nums text-positive">{{ formatMoney(p.day.income, { signed: true }) }}</span>
        </template>
        <template v-if="p.day.spent">
          <span class="text-[13px] font-semibold text-ink-muted mt-1">Dépenses</span>
          <span class="text-lg font-bold tabular-nums text-negative">{{ formatMoney(-p.day.spent, { signed: true }) }}</span>
        </template>
        <template v-if="p.day.transfers">
          <span class="text-[13px] font-semibold text-ink-muted mt-1">Épargne</span>
          <span class="text-lg font-bold tabular-nums text-ink">{{ formatMoney(-p.day.transfers, { signed: true }) }}</span>
        </template>
        <span class="w-full h-px bg-line my-2" />
        <span :class="['text-lg font-bold tabular-nums', p.day.available < 0 ? 'text-negative' : 'text-primary']">{{ formatMoney(p.day.available) }}</span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  days: BudgetDay[];
  today: string;
}>();

const { formatMoney, formatDate } = useFormat();
const selected = ref<number | null>(null);
watch(() => props.days, () => { selected.value = null; });

// Weekday for the coming days; the full date when the wallet starts later.
const label = (date: string) => {
  if (date === props.today) return "Aujourd'hui";
  if (date <= addDays(props.today, 6)) return formatDate(date, { weekday: 'short' });
  return formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' });
};

// Points spread between 18% and 82% of the width; values mapped between 65%
// (lowest) and 20% (highest) of the height, so the line rises with the budget
// and the bubbles stay clear of the floating buttons at the bottom.
const points = computed(() => {
  const n = props.days.length;
  const values = props.days.map((d) => d.available);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return props.days.map((day, i) => ({
    day,
    x: n === 1 ? 50 : 18 + (i * 64) / (n - 1),
    y: max === min ? 45 : 65 - ((day.available - min) / (max - min)) * 45,
  }));
});

// The line runs edge to edge, extending the first and last segments.
const edgeY = (a: { x: number; y: number }, b: { x: number; y: number }, x: number) =>
  a.x === b.x ? a.y : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);

const linePoints = computed(() => {
  const p = points.value;
  if (!p.length) return '';
  const first = p.length > 1 ? edgeY(p[0]!, p[1]!, 0) : p[0]!.y;
  const last = p.length > 1 ? edgeY(p.at(-2)!, p.at(-1)!, 100) : p[0]!.y;
  return [`0,${first}`, ...p.map((q) => `${q.x},${q.y}`), `100,${last}`].join(' ');
});

const areaPoints = computed(() => (linePoints.value ? `${linePoints.value} 100,100 0,100` : ''));

// The open card is taller and wider than a bubble: once shown, it is moved back
// inside the screen, below the header and above the floating buttons
// (elements marked `data-floating`).
const root = ref<HTMLElement | null>(null);
const shift = ref({ x: 0, y: 0 });
const EDGE = 12;

watch(selected, async () => {
  shift.value = { x: 0, y: 0 };
  await nextTick();
  const card = root.value?.querySelector('[data-card]');
  if (!card) return;
  const r = card.getBoundingClientRect();
  const top = (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0) + EDGE;
  const floating = Array.from(document.querySelectorAll('[data-floating]'), (el) => el.getBoundingClientRect().top);
  const bottom = Math.min(window.innerHeight, ...floating) - EDGE;
  const right = document.documentElement.clientWidth - EDGE;
  const x = r.left < EDGE ? EDGE - r.left : r.right > right ? right - r.right : 0;
  let y = r.bottom > bottom ? bottom - r.bottom : 0;
  if (r.top + y < top) y = top - r.top;
  shift.value = { x, y };
});

const position = (p: { x: number; y: number }, i: number) => {
  const { x, y } = selected.value === i ? shift.value : { x: 0, y: 0 };
  return { left: `calc(${p.x}% + ${x}px)`, top: `calc(${p.y}% + ${y}px)` };
};
</script>
