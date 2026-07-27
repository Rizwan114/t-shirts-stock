const sizeColorMap: Record<string, string> = {
  S: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20",
  M: "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20",
  L: "bg-pink-500/10 text-pink-600 dark:text-pink-400 ring-1 ring-pink-500/20",
  XL: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
  XXL: "bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/20",
  "3XL": "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20",
  "4XL": "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20",
  "5XL": "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 ring-1 ring-fuchsia-500/20",
};

const fallbackColors = [
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20",
  "bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-1 ring-teal-500/20",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
  "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20",
  "bg-lime-500/10 text-lime-600 dark:text-lime-400 ring-1 ring-lime-500/20",
];

export function getSizeColor(size: string): string {
  if (sizeColorMap[size]) return sizeColorMap[size];
  let hash = 0;
  for (let i = 0; i < size.length; i++) {
    hash = size.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}

export function getStockBadge(stock: number): string {
  if (stock <= 5) return "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20";
  if (stock <= 15) return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20";
  return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20";
}
