<template>
  <div class="flex flex-col h-full w-full select-none">
    <!-- Plot area: y-axis labels + svg -->
    <div class="flex gap-2 h-[100px]">
      <!-- Y-axis labels -->
      <div class="flex flex-col justify-between h-full w-9 sm:w-11 shrink-0 text-right">
        <span v-for="tick in yTicks" :key="tick.value" class="text-[9px] sm:text-[10px] font-medium text-text-body/40 tabular-nums leading-none">
          {{ formatValue(tick.value) }}
        </span>
      </div>

      <!-- Chart -->
      <div class="relative grow min-w-0 h-full">
        <svg viewBox="0 0 500 100" preserveAspectRatio="none" class="w-full h-full overflow-visible">
          <defs>
            <linearGradient :id="gradientId" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#294b3c" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#294b3c" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- Gridlines -->
          <line v-for="tick in yTicks" :key="`g-${tick.value}`" x1="0" :y1="tick.y" x2="500" :y2="tick.y"
            stroke="#294b3c" stroke-opacity="0.07" stroke-width="1" />

          <path :d="areaPath" :fill="`url(#${gradientId})`" />
          <polyline :points="linePointsAttr" fill="none" stroke="#294b3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

          <circle v-for="(pt, i) in plotted" :key="`c-${i}`" :cx="pt.x" :cy="pt.y" r="4.5"
            class="fill-primary stroke-white transition-opacity duration-150"
            :class="hoveredIndex === i ? 'opacity-100' : 'opacity-0'" stroke-width="2" />
        </svg>

        <!-- Hover/touch overlay: a single tracked area is far more reliable than one
             narrow hit-zone per point, which can miss fast mouse movement or small taps. -->
        <div class="absolute inset-0 cursor-pointer"
          @mousemove="handlePointer" @mouseleave="hoveredIndex = null"
          @touchstart="handlePointer">
          <div v-if="hoveredIndex !== null && plotted[hoveredIndex]"
            class="pointer-events-none absolute z-20 w-max"
            :class="tipAlign(hoveredIndex)" :style="tipStyle(plotted[hoveredIndex])">
            <div class="bg-text-heading text-white rounded-xl px-3 py-2 shadow-xl shadow-black/20">
              <div class="text-[10px] font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">{{ points[hoveredIndex]?.label }}</div>
              <div class="text-[13px] font-bold tabular-nums whitespace-nowrap">{{ formatValue(points[hoveredIndex]?.value ?? 0) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- X-axis labels -->
    <div class="flex gap-2 mt-2 pt-1 border-t border-input-border/30">
      <div class="w-9 sm:w-11 shrink-0"></div>
      <div class="flex justify-between grow min-w-0">
        <span v-for="(pt, i) in points" :key="`x-${i}`"
          :class="['text-[11px] font-medium text-text-body/50 truncate', (points.length > 7 && i % 2 !== 0) ? 'hidden sm:block' : 'block']"
          :style="{ width: (100 / (points.length > 7 ? (points.length / 2) : points.length)) + '%', textAlign: 'center' }">
          {{ pt.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  points: { label: string; value: number }[];
  formatValue: (value: number) => string;
}>();

const gradientId = `line-chart-gradient-${useId()}`;
const hoveredIndex = ref<number | null>(null);

const WIDTH = 500;
const HEIGHT = 100;
const PAD = 6; // keep the line/dots clear of the plot edges

const maxValue = computed(() => Math.max(...props.points.map((p) => Math.max(0, p.value || 0)), 1));

const yTicks = computed(() => {
  const max = maxValue.value;
  return [0, 1, 2, 3].map((i) => ({
    value: (max * (3 - i)) / 3,
    y: (i / 3) * HEIGHT,
  }));
});

const plotted = computed(() => {
  const n = props.points.length;
  return props.points.map((p, i) => {
    const x = n > 1 ? (i / (n - 1)) * WIDTH : WIDTH / 2;
    const value = Math.max(0, p.value || 0);
    const rawY = HEIGHT - (value / maxValue.value) * HEIGHT;
    const y = Math.min(HEIGHT - PAD, Math.max(PAD, rawY));
    return { x, y };
  });
});

const linePointsAttr = computed(() => plotted.value.map((pt) => `${pt.x},${pt.y}`).join(' '));

// Track the pointer continuously over the whole chart area and snap to the
// nearest point, instead of relying on one narrow hit-zone div per point
// (which can miss a fast mouse move or a small tap between zones).
const handlePointer = (e: MouseEvent | TouchEvent) => {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
  if (clientX === undefined || !rect.width) return;
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const n = props.points.length;
  hoveredIndex.value = n > 1 ? Math.round(ratio * (n - 1)) : 0;
};

const areaPath = computed(() => {
  const pts = plotted.value;
  if (pts.length === 0) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last) return '';
  let d = `M${first.x},${HEIGHT} L${first.x},${first.y} `;
  pts.forEach((pt, i) => {
    if (i > 0) d += `L${pt.x},${pt.y} `;
  });
  d += `L${last.x},${HEIGHT} Z`;
  return d;
});

// Keep the tooltip inside the chart bounds near the first/last points.
const tipAlign = (i: number) => {
  const n = props.points.length;
  if (n > 1 && i === 0) return 'left-0';
  if (n > 1 && i === n - 1) return 'right-0';
  return 'left-1/2 -translate-x-1/2';
};

// Flip the tooltip below the point when it's in the upper half of the chart,
// so a near-max value never overflows above the card's fixed-height box.
const tipStyle = (pt: { y: number }) =>
  pt.y < HEIGHT / 2
    ? { top: `calc(${pt.y}% + 10px)` }
    : { bottom: `calc(${HEIGHT - pt.y}% + 10px)` };
</script>
