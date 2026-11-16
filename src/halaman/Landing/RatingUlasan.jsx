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
import { ArrowRight, PenSquare } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useI18n } from "../../lib/i18n.jsx";
import { useUlasan } from "./gunakanUlasan.js";
import {
  IkonInfo,
  KartuUlasan,
  PanahKanan,
  PanahKiri,
  PemilihBintang,
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
  const [filterBintang, setFilterBintang] = useState(0);

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

  // Klik bintang langsung membuka halaman tulis ulasan dengan nilai terpilih.
  const pilihBintangHero = useCallback((n) => {
    setBintangHero(n);
    try {
      globalThis.sessionStorage?.setItem(KUNCI_BINTANG_HERO, String(n));
    } catch { /* abaikan */ }
    navigate("/tulis-ulasan", { state: { bintang: n } });
  }, [navigate]);

  const bukaHalamanTulis = useCallback(() => {
    navigate("/tulis-ulasan");
  }, [navigate]);

  // Tampilkan maksimal 10 ulasan terbaru pada landing; filter memakai
  // seluruh data agar rating lama tetap dapat ditemukan.
  const untukKarusel = urut.slice(0, 10);
  const ulasanTampil = (filterBintang === 0
    ? urut
    : urut.filter((u) => u.bintang === filterBintang)
  ).slice(0, 10);

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">

        <section aria-labelledby="judul-daftar-ulasan" className="mb-8">
      <div className="flex flex-col gap-4 border-b border-grey-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 id="judul-daftar-ulasan" className="font-sans text-xl font-semibold text-foreground sm:text-2xl">
            Rating dan Ulasan website
          </h2>
          <p className="mt-2 flex max-w-3xl items-start gap-1.5 font-sans text-sm leading-relaxed text-foregroundGrey">
            <IkonInfo className="mt-0.5 size-4 flex-none" />
            <span>Rating dan ulasan diverifikasi dan berasal dari orang yang menggunakan jenis perangkat yang sama dengan yang Anda gunakan.</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter ulasan berdasarkan rating">
          {[0, 5, 4, 3, 2, 1].map((nilai) => {
            const aktif = filterBintang === nilai;
            const jumlah = nilai === 0 ? total : urut.filter((u) => u.bintang === nilai).length;
            return (
              <button
                key={nilai}
                type="button"
                aria-pressed={aktif}
                onClick={() => setFilterBintang(nilai)}
                className={`inline-flex min-h-9 items-center justify-center rounded-full border px-3 font-sans text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  aktif
                    ? "border-foreground bg-foreground text-white"
                    : "border-grey-200 bg-white text-grey-600 hover:border-grey-400 hover:text-foreground"
                }`}
              >
                {nilai === 0 ? `Semua (${jumlah})` : `${nilai} ★`}
              </button>
            );
          })}
          <Link
            to="/rating-ulasan"
            aria-label={t("landing.rating.lihatSemua")}
            className="ml-1 flex size-9 flex-none items-center justify-center rounded-full border border-grey-200 text-foregroundGrey transition-colors hover:border-grey-400 hover:text-foreground"
          >
            <PanahKanan className="size-5" />
          </Link>
        </div>
      </div>
        </section>

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
          {/* Kolom kiri: ajakan memberi rating */}
          <div className="flex w-full min-w-0 flex-col items-start rounded-lg border border-grey-200 bg-white p-6 sm:p-8">
            <h3 className="font-sans text-2xl font-bold tracking-tight text-grey-800 sm:text-3xl">
              {t("landing.rating.ajakJudul")}
            </h3>
            <p className="mt-1.5 font-sans text-base text-foregroundGrey">
              {t("landing.rating.ajakSub")}
            </p>
            <PemilihBintang
              nilai={bintangHero}
              ukuran="xl"
              onPilih={pilihBintangHero}
              ariaLabel={t("landing.rating.beriBintang")}
              labelSatuan={(n) => t("landing.rating.skalaBintang", { n })}
              labelUntuk={(n) => (n > 0
                ? t(`landing.rating.labelBintang${n}`)
                : t("landing.rating.pilihBintangPrompt"))}
              className="mt-6 w-full"
            />
            <div className="mt-7 flex w-full items-center justify-between border-t border-grey-200 pt-4">
              <button
                type="button"
                onClick={bukaHalamanTulis}
                className="group inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary transition sm:text-base"
              >
                <PenSquare className="size-4" aria-hidden="true" />
                <span>{t("landing.rating.tulisUlasan")}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
              <span className="hidden font-sans text-xs text-foregroundGrey sm:inline">
                {t("landing.rating.ajakCatatan")}
              </span>
            </div>
          </div>

          {/* Kolom kanan: ringkasan rating dan navigasi ke seluruh ulasan */}
          <div className="w-full min-w-0 rounded-lg border border-grey-200 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-sans text-lg font-semibold text-foreground sm:text-xl">
                Ringkasan Penilaian
              </h2>
              <span className="shrink-0 font-sans text-xs text-foregroundGrey">
                {urut.length} ulasan
              </span>
            </div>
            <div className="mt-6">
              <Ringkasan ulasan={urut} locale={locale} />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-grey-200 pt-4 font-sans text-xs text-foregroundGrey">
              <span>Rating berdasarkan ulasan pengguna</span>
              <span className="font-medium text-grey-600">{urut.length} ulasan</span>
            </div>
          </div>
        </div>

          <div className="mt-6">
            {ulasanTampil.length ? (
              <KaruselUlasan t={t} ulasan={ulasanTampil} padaVote={vote} />
            ) : (
              <p className="py-8 text-center font-sans text-sm text-foregroundGrey">
                Belum ada ulasan dengan penilaian {filterBintang} bintang.
              </p>
            )}
          </div>
        </section>

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
