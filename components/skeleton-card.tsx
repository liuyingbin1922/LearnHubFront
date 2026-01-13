export function SkeletonCard() {
  return (
    <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="h-4 w-2/3 rounded bg-slate-100" />
      <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
      <div className="mt-6 h-3 w-1/2 rounded bg-slate-100" />
    </div>
  );
}
