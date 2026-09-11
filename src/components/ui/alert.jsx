import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils.js";

/**
 * Alert — port `alert.tsx` dari neobrutalism-components, dirapikan menjadi
 * gaya korporat KCI (flat, border tipis, tanpa shadow keras).
 *
 * Pemakaian (ikon kiri, judul + keterangan di kanan):
 *
 *   <Alert variasi="sukses">
 *     <CheckCircle2 />
 *     <Alertjudul>Berhasil disimpan</Alertjudul>
 *     <AlertKeterangan>Perubahan sudah tersimpan.</AlertKeterangan>
 *   </Alert>
 *
 * Variasi: "sukses" (hijau) / "gagal" (merah) / "info" (biru).
 */
const alertVariasi = cva(
  "relative grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-0.5 px-4 py-3 text-sm [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current [&>svg]:col-start-1 [&>div]:col-start-2",
  {
    variants: {
      variasi: {
        sukses: "border border-emerald-200 bg-emerald-50 text-emerald-800",
        gagal: "border border-red-200 bg-red-50 text-red-800",
        info: "border border-slate-200 bg-slate-50 text-slate-800",
      },
    },
    defaultVariants: {
      variasi: "info",
    },
  },
);

function Alert({ variasi, className, ...props }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariasi({ variasi }), className)}
      {...props}
    />
  );
}

function Alertjudul({ className, ...props }) {
  return (
    <div
      data-slot="alert-judul"
      className={cn("font-semibold leading-5", className)}
      {...props}
    />
  );
}

function AlertKeterangan({ className, ...props }) {
  return (
    <div
      data-slot="alert-keterangan"
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, Alertjudul, AlertKeterangan };