/**
 * Komponen loading skeleton — menampilkan placeholder saat data dimuat.
 */
export function LoadingSkeleton({ rows = 3, className = "" }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="mb-3 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-slate-200" />
          <div className="flex-1">
            <div className="mb-2 h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Loading spinner sederhana. */
export function LoadingSpinner({ label = "Memuat…", className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-12 ${className}`}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}
