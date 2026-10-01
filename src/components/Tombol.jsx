import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Tombol navigasi satu pintu untuk seluruh halaman konten.
 *
 * Tiga varian, satu markup: `garis` (outline primary — gaya Landing),
 * `isi` (primary filled — CTA utama), `terang` (putih di atas foto gelap).
 * Pakai `<Link>` React Router, jadi semua tombol pintu di situs ini
 * bersumber dari komponen yang sama.
 */
const GAYA = {
  garis:
    "border border-primary bg-transparent text-primary hover:bg-primary hover:text-white focus-visible:ring-primary",
  isi: "border border-primary bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary",
  terang:
    "border border-white text-white hover:bg-white hover:text-primary focus-visible:ring-white",
};

export function Tombol({ to, children, variant = "garis", className, ...props }) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded px-6 py-3 font-sans text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        GAYA[variant],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
