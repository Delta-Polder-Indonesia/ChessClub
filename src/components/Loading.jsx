import { useLayoutEffect } from "react";
import { useI18n } from "../lib/i18n.jsx";

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
 * Buang #boot-hero (gambar pramuat dari index.html).
 *
 * Komponen ini dipasang DI DALAM <Suspense> sebagai saudara <Outlet />,
 * sehingga efeknya baru berjalan SETELAH konten halaman pertama
 * benar-benar ter-render — bukan begitu kerangka React siap. Dengan begitu
 * foto boot tetap terlihat selama chunk halaman pertama masih diunduh,
 * lalu dibuang pada frame yang sama ketika halaman asli mulai digambar
 * (useLayoutEffect berjalan sebelum paint — tidak ada dua gambar yang
 * tampak bertumpuk).
 */
export function BersihkanBootHero() {
  useLayoutEffect(() => {
    document.getElementById("boot-hero")?.remove();
  }, []);
  return null;
}

/**
 * Placeholder Suspense untuk area konten halaman (dipakai PageLayout).
 *
 * Dua keadaan:
 *  1. Muat awal — #boot-hero dari index.html masih ada: area ini dibuat
 *     transparan dan setinggi hero supaya foto boot TETAP terlihat di
 *     belakangnya. Tidak ada layar putih, tidak ada gambar lain yang
 *     menyala-nyala bergantian.
 *  2. Navigasi antar halaman — boot sudah dibuang: tampilkan spinner kecil
 *     di tengah area konten. Header & footer tetap terpasang, sehingga
 *     tidak ada lagi "seluruh halaman tertimpa foto Beranda" seperti
 *     perilaku fallback lama (HeroFallback) yang mengganti seluruh layar.
 */
export function PlaceholderHalaman() {
  const { t } = useI18n();
  const bootMasihAda =
    typeof document !== "undefined" &&
    document.getElementById("boot-hero") !== null;

  if (bootMasihAda) {
    return <div aria-hidden="true" className="h-[650px] w-full" />;
  }

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-primary" />
        <span className="text-sm text-slate-500">{t("common.memuat")}</span>
      </div>
    </div>
  );
}

/**
 * Placeholder kecil untuk isi tab Beranda — hero dan sidebar tetap
 * terpasang, hanya artikel di bawah foto yang menunggu chunk tab.
 */
export function PlaceholderArtikel() {
  const { t } = useI18n();
  return (
    <div className="flex w-full items-center justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
      <span className="sr-only">{t("common.memuat")}</span>
    </div>
  );
}

/** Placeholder layar penuh untuk rute tanpa kerangka publik (Dashboard). */
export function PlaceholderLayarPenuh() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner label="Menyiapkan dashboard…" />
    </div>
  );
}
