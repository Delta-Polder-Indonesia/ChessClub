import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Tombol navigasi satu pintu untuk seluruh halaman konten.
 *
 * Tiga varian, satu markup: `garis` (outline netral — gaya Landing),
 * `isi` (isian netral — CTA utama), `terang` (putih di atas foto gelap).
 * Pakai `<Link>` React Router, jadi semua tombol pintu di situs ini
 * bersumber dari komponen yang sama.
 */
const GAYA = {
  garis:
    "border border-slate-800 bg-transparent text-slate-800 hover:bg-slate-800 hover:text-white focus-visible:ring-slate-800",
  isi: "border border-slate-800 bg-slate-800 text-white hover:bg-slate-800/90 focus-visible:ring-slate-800",
  terang:
    "border border-white text-white hover:bg-white hover:text-slate-800 focus-visible:ring-white",
};

export function Tombol({ to, children, variant = "garis", className, ...props }) {
  return (
    <Link
      to={to}
      className={cn(
        "tombol-kci inline-flex items-center justify-center gap-2 rounded px-6 py-3 font-sans text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        GAYA[variant],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
