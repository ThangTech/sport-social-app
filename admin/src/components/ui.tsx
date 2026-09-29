import type { ReactNode } from "react";
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-brand-600">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}
export function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)] ${className}`}
    >
      <div className="p-5 md:p-6">
        {title && (
          <div className="mb-5">
            <h2 className="font-semibold text-slate-950">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
export function MetricCard({
  label,
  value,
  helper,
  tone = "brand",
}: {
  label: string;
  value: number | string;
  helper?: string;
  tone?: "brand" | "amber" | "red" | "slate";
}) {
  const colors = {
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div
        className={`mb-4 grid size-9 place-items-center rounded-xl text-sm font-bold ${colors[tone]}`}
      >
        ●
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      {helper && <p className="mt-2 text-xs text-slate-400">{helper}</p>}
    </div>
  );
}
export function StatusBadge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "slate";
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/15",
    red: "bg-red-50 text-red-700 ring-red-600/15",
    blue: "bg-sky-50 text-sky-700 ring-sky-600/15",
    slate: "bg-slate-100 text-slate-600 ring-slate-500/10",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colors[tone]}`}
    >
      {children}
    </span>
  );
}
export function PageState({
  loading,
  error,
  empty,
  retry,
  children,
}: {
  loading: boolean;
  error: string;
  empty?: boolean;
  retry?: () => void;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
        Đang tải dữ liệu…
      </div>
    );
  if (error)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        <p>{error}</p>
        {retry && (
          <button className="mt-3 font-semibold underline" onClick={retry}>
            Thử lại
          </button>
        )}
      </div>
    );
  if (empty)
    return (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
        Chưa có dữ liệu.
      </div>
    );
  return <>{children}</>;
}
