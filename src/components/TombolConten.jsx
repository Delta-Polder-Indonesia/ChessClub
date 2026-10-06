import { cn } from "@/lib/utils";
import { Tombol } from "./Tombol.jsx";
import { ArrowRightIcon } from "./icons.jsx";

/**
 * Satu pintu untuk CTA kelima halaman konten: teka-teki, rush teka-teki,
 * analisa, pembukaan, dan kuis catur.
 *
 * Bentuknya sengaja dibuat menonjol — hijau pekat, tebal, bershadow — supaya
 * pembaca yang tidak sempat membaca tulisan tetap mengenalinya sebagai tombol.
 * Angka hijau diambil dari tombol utama chessopeningquiz.com (#81b64c/#5d9948);
 * bayangan dan radiusnya menyamai `.primary-btn` di situs itu.
 *
 * Ikon panah selalu ikut, jadi tiap pintu terlihat sama. Lebar bawaan `w-full`
 * di layar kecil dan menyesuaikan isi di `md` ke atas; lewat `className` bisa
 * ditimbar (mis. `w-fit` di Analisa).
 */
export const GAYA_TOMBOL_CONTEN =
  "w-full rounded-[10px] border-0 bg-[#5d9948] px-8 py-4 text-[1.375rem] font-extrabold leading-7 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_2px_4px_0_rgba(0,0,0,0.15)] hover:bg-[#67a54f] active:bg-[#45753c] focus-visible:ring-[#5d9948] md:w-auto";

export function TombolConten({ to, children, className }) {
  return (
    <Tombol
      to={to}
      variant="garis"
      className={cn(GAYA_TOMBOL_CONTEN, className)}
    >
      {children}
      <ArrowRightIcon className="size-5" />
    </Tombol>
  );
}
