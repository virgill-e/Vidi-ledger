// Icons and colors offered in the category editor (lucide set, bundled locally).

export const CATEGORY_ICON_GROUPS: { title: string; icons: string[] }[] = [
    { title: 'Général', icons: ['tag', 'shopping-bag', 'shopping-cart', 'shopping-basket', 'building', 'briefcase', 'star', 'gift', 'shield', 'clock', 'calendar', 'credit-card', 'package', 'sparkles', 'wand-sparkles', 'ellipsis'] },
    { title: 'Maison et factures', icons: ['house', 'file-text', 'receipt', 'plug', 'zap', 'flame', 'thermometer', 'wrench', 'droplet', 'wifi', 'smartphone', 'sofa'] },
    { title: 'Alimentation', icons: ['utensils', 'coffee', 'wine', 'beer', 'pizza', 'apple', 'croissant', 'cake-slice', 'ice-cream-cone', 'sandwich'] },
    { title: 'Transport', icons: ['car', 'bus', 'train-front', 'bike', 'plane', 'fuel', 'circle-parking', 'ship'] },
    { title: 'Loisirs', icons: ['party-popper', 'gamepad-2', 'film', 'music', 'ticket', 'book-open', 'dumbbell', 'tent', 'camera', 'palette'] },
    { title: 'Santé et famille', icons: ['heart-pulse', 'pill', 'stethoscope', 'baby', 'dog', 'cat', 'paw-print', 'scissors', 'shirt', 'graduation-cap', 'school', 'users', 'heart', 'smile', 'laptop'] },
    { title: 'Finance', icons: ['banknote', 'wallet', 'piggy-bank', 'landmark', 'chart-line', 'trending-up', 'coins', 'hand-coins', 'percent', 'bitcoin'] },
].map((g) => ({ ...g, icons: g.icons.map((i) => `lucide:${i}`) }));

export const CATEGORY_COLORS = [
    '#5b6cf0', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#22a55b', '#14b8a6', '#0ea5e9', '#2563eb', '#64748b',
];
