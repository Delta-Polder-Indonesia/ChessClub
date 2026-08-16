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

/**
 * Placeholder Suspense seukuran hero — memakai foto laman Beranda (halaman
 * pertama yang dimuat pengunjung) agar gambar terbesar tetap terlihat saat
 * chunk halaman masih diunduh.
 */
export function HeroFallback() {
  return (
    <section
      className="relative w-full h-[400px] lg:h-[500px] bg-hero overflow-hidden"
      aria-hidden="true"
    >
      <img
        src={`${import.meta.env.BASE_URL}images/sekilas-828.webp`}
        srcSet={`${import.meta.env.BASE_URL}images/sekilas-828.webp 828w, ${import.meta.env.BASE_URL}images/sekilas.webp 1280w`}
        sizes="100vw"
        alt=""
        width={828}
        height={462}
        fetchPriority="high"
        decoding="async"
        className="w-full h-full object-cover"
      />
    </section>
  );
}
