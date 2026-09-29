export const primaryButton = [
  "inline-flex min-h-10 items-center justify-center rounded-xl",
  "bg-brand-700 px-4 text-sm font-semibold text-white transition",
  "hover:bg-brand-600 disabled:opacity-50",
].join(" ");

export const secondaryButton = [
  "inline-flex min-h-10 items-center justify-center rounded-xl border",
  "border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700",
  "hover:bg-slate-50 disabled:opacity-40",
].join(" ");

export const inputClass = [
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3",
  "text-sm outline-none transition placeholder:text-slate-400",
  "focus:border-brand-500 focus:ring-4 focus:ring-brand-100",
].join(" ");
