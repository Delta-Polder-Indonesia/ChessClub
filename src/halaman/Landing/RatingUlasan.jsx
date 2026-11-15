/**
 * Blok Rating & Ulasan di Landing page.
 *
 * Struktur (meniru Play Store):
 *   1. Hero "Beri rating aplikasi ini" + bintang interaktif + tautan "Tulis ulasan"
 *      — klik bintang pilihan tersimpan (state lokal), klik tautan navigasi ke
 *        /tulis-ulasan (halaman sendiri) dengan membawa bintang terpilih via
 *        state lokasi (bukan query string).
 *   2. Kepala "Rating dan ulasan" dengan panah-kanan yang navigasi ke
 *      /rating-ulasan (halaman daftar semua ulasan).
 *   3. Paragraf verifikasi + ikon ⓘ.
 *   4. Ringkasan agregat (skor besar + bintang pecahan + bar distribusi).
 *   5. Carousel geser kartu ulasan (embla via shadcn/ui Carousel) —
 *      beberapa ulasan terbaru ditampilkan sebagai kartu-kartu yang bisa
 *      di-slide ke kiri/kanan, dengan tombol panah dan indikator dot.
 *      Klik panah-kanan di judul masuk ke halaman daftar penuh.
 *
 * Tidak ada form tulis ulasan dan tidak ada daftar vertikal panjang di
 * halaman ini — dua hal itu punya halaman masing-masing.
 */
import { Suspense, useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PenSquare } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useI18n } from "../../lib/i18n.jsx";
import { useUlasan } from "./gunakanUlasan.js";
import {
  DeretBintang,
  IkonInfo,
  KartuUlasan,
  PanahKanan,
  PanahKiri,
  Ringkasan,
} from "./komponen-rating.jsx";

const KUNCI_BINTANG_HERO = "kci-ulasan-bintang-hero";

/* Toast ringan */
function Toast({ terbuka, pesan, onTutup }) {
  useEffect(() => {
    if (!terbuka) return;
    const id = setTimeout(onTutup, 2400);
    return () => clearTimeout(id);
  }, [terbuka, onTutup]);
  if (!terbuka) return null;
  return (
    <div role="status" aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-2 font-sans text-sm font-medium text-paper shadow-lg">
      {pesan}
    </div>
  );
}

/* Carousel kartu ulasan */
function KaruselUlasan({ t, ulasan, padaVote }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [bisaPrev, setBisaPrev] = useState(false);
  const [bisaNext, setBisaNext] = useState(false);
  const [indeksAktif, setIndeksAktif] = useState(0);
  const [jumlahSnaps, setJumlahSnaps] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const perbarui = () => {
      setBisaPrev(emblaApi.canScrollPrev());
      setBisaNext(emblaApi.canScrollNext());
      setIndeksAktif(emblaApi.selectedScrollSnap());
    };
    setJumlahSnaps(emblaApi.scrollSnapList().length);
    perbarui();
    emblaApi.on("select", perbarui);
    emblaApi.on("reInit", () => {
      setJumlahSnaps(emblaApi.scrollSnapList().length);
      perbarui();
    });
  }, [emblaApi]);

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex -ml-3">
          {ulasan.map((u) => (
            <div key={u.id} className="min-w-0 shrink-0 grow-0 basis-full pl-3 sm:basis-2/3 md:basis-1/2 lg:basis-2/5">
              <KartuUlasan t={t} ulasan={u} padaVote={padaVote} />
            </div>
          ))}
        </div>
      </div>

      {/* Kontrol panah */}
      <button
        type="button"
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!bisaPrev}
        aria-label={t("landing.rating.sebelumnya")}
        className={`absolute -left-2 top-1/2 z-10 -translate-y-1/2 hidden size-10 items-center justify-center rounded-full bg-paper shadow-md md:flex ${
          bisaPrev ? "text-foreground" : "text-grey-300 pointer-events-none"
        }`}
      >
        <PanahKiri className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!bisaNext}
        aria-label={t("landing.rating.berikutnya")}
        className={`absolute -right-2 top-1/2 z-10 -translate-y-1/2 hidden size-10 items-center justify-center rounded-full bg-paper shadow-md md:flex ${
          bisaNext ? "text-foreground" : "text-grey-300 pointer-events-none"
        }`}
      >
        <PanahKanan className="size-5" />
      </button>

      {/* Indikator dot */}
      {jumlahSnaps > 1 ? (
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: jumlahSnaps }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === indeksAktif ? "w-6 bg-primary" : "w-1.5 bg-grey-300"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function RatingUlasan() {
  const { t, locale } = useI18n();
  const { urut, vote, total } = useUlasan();
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState(null);

  // Baca bintang terpilih dari sessionStorage (bertahan jika user navigasi
  // sebelum klik "Tulis ulasan", dan reset saat tab ditutup).
  const [bintangHero, setBintangHero] = useState(() => {
    try {
      return Number(globalThis.sessionStorage?.getItem(KUNCI_BINTANG_HERO)) || 0;
    } catch { return 0; }
  });

  useEffect(() => {
    try {
      if (bintangHero > 0) globalThis.sessionStorage?.setItem(KUNCI_BINTANG_HERO, String(bintangHero));
      else globalThis.sessionStorage?.removeItem(KUNCI_BINTANG_HERO);
    } catch { /* abaikan */ }
  }, [bintangHero]);

  // Tampilkan toast sukses saat kembali dari halaman tulis (setelah kirim).
  useEffect(() => {
    if (location.state?.ulasTerkirim) {
      setToast(t("landing.rating.terkirim", { n: location.state.bintang }));
      // Bersihkan state supaya refresh tidak memunculkan toast ulang.
      window.history.replaceState({ ...location.state, ulasTerkirim: false }, "");
    }
  }, [location, t]);

  const pilihBintangHero = useCallback((n) => {
    setBintangHero((prev) => (prev === n ? 0 : n));
  }, []);

  const bukaHalamanTulis = useCallback(() => {
    navigate("/tulis-ulasan");
  }, [navigate]);

  // Tampilkan maksimal 10 ulasan terbaru di carousel; selebihnya hanya
  // bisa diakses dari halaman /rating-ulasan.
  const untukKarusel = urut.slice(0, 10);

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">

        {/* 1. Kartu hero "Beri rating website ini" */}
        <div className="flex w-full flex-col items-start rounded-lg border border-grey-200 bg-paper p-6 sm:p-8 md:max-w-[52%]">
          <h3 className="font-serif text-xl font-semibold text-grey-800">
            {t("landing.rating.ajakJudul")}
          </h3>
          <p className="mt-2 font-serif text-base text-grey-600">
            {t("landing.rating.ajakSub")}
          </p>
          <div className="mt-6">
            <DeretBintang nilai={bintangHero} ukuran="xl" bisaUbah onPilih={pilihBintangHero} />
          </div>
          <div className="mt-7 w-full border-t border-grey-200 pt-4">
            <button
              type="button"
              onClick={bukaHalamanTulis}
              className="inline-flex items-center gap-2 font-sans text-base font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <PenSquare className="size-4" aria-hidden="true" />
              {t("landing.rating.tulisUlasan")}
            </button>
          </div>
        </div>

        {/* 2. Kepala "Rating dan ulasan" + panah ke halaman daftar */}
        <div className="mt-10 flex w-full items-center justify-between gap-3 md:max-w-[52%]">
          <h2 className="font-sans text-xl font-semibold text-foreground md:text-2xl">
            {t("landing.rating.judul")}
          </h2>
          <Link
            to="/rating-ulasan"
            aria-label={t("landing.rating.lihatSemua")}
            className="flex size-10 items-center justify-center rounded-full bg-grey-200 text-foregroundGrey transition-colors hover:bg-grey-300 hover:text-foreground"
          >
            <PanahKanan className="size-5" />
          </Link>
        </div>
        <p className="mt-2 flex w-full items-start gap-1.5 font-sans text-sm text-foregroundGrey md:max-w-[52%]">
          <IkonInfo className="mt-0.5 size-4 flex-none" />
          <span>{t("landing.rating.subJudul")}</span>
        </p>

        {/* 3. Ringkasan */}
        <div className="mt-5 w-full md:max-w-[52%]">
          <Ringkasan ulasan={urut} locale={locale} />
        </div>

        {/* 4. Carousel kartu ulasan */}
        <div className="mt-6">
          <KaruselUlasan t={t} ulasan={untukKarusel} padaVote={vote} />
        </div>

        {total > 10 ? (
          <div className="mt-4 text-center">
            <Link to="/rating-ulasan"
              className="font-sans text-sm font-medium text-primary hover:underline">
              {t("landing.rating.lihatSemuaUlasan", { n: total })}
            </Link>
          </div>
        ) : null}
      </div>

      <Suspense fallback={null}>
        <Toast terbuka={!!toast} pesan={toast || ""} onTutup={() => setToast(null)} />
      </Suspense>
    </section>
  );
}
