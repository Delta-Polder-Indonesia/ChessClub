import { useEffect, useMemo, useRef, useState } from "react";
import { HalamanIsi, PageArtikel, MastheadEditorial } from "../../components/PageBagian.jsx";
import { ArrowRightIcon, CloseIcon } from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Galeri (/media-dan-informasi/galeri).
 *
 * Tata letak diadopsi dari struktur galeri impeccable.style/gallery: kendali
 * penyaring di atas, koleksi bertumpuk (judul + deskripsi + jumlah foto), grid
 * lempeng foto, dan lightbox untuk perbesar. Diselaraskan token DESIGN.md
 * (biru/abu/putih, garis 1px, tanpa gradien/glow) dan craft-floor.
 */

/** Album foto — sumber gambar dipetakan di kode, teks lewat kamus `galeri.*`. */
const ALBUM = [
  {
    id: "tonggak",
    foto: [
      { src: "/images/tonggak-2015.webp", cap: "foto.t2015" },
      { src: "/images/tonggak-2016.webp", cap: "foto.t2016" },
      { src: "/images/tonggak-2018.webp", cap: "foto.t2018" },
      { src: "/images/tonggak-2020.webp", cap: "foto.t2020" },
      { src: "/images/tonggak-2022.webp", cap: "foto.t2022" },
      { src: "/images/tonggak-2024.webp", cap: "foto.t2024" },
    ],
  },
  {
    id: "turnamen",
    foto: [
      { src: "/images/sekilas.webp", cap: "foto.aula" },
      { src: "/images/landing-sorotan-turnamen.webp", cap: "foto.jalanan" },
      { src: "/images/landing-sorotan-program.webp", cap: "foto.menteri" },
      { src: "/images/hero-about.webp", cap: "foto.bidak" },
    ],
  },
  {
    id: "kegiatan",
    foto: [
      { src: "/images/landing-sorotan-media.webp", cap: "foto.latihanTanding" },
      { src: "/images/tata-nilai.webp", cap: "foto.jamCatur" },
      { src: "/images/buku_tulis.webp", cap: "foto.notasi" },
    ],
  },
];

const KATEGORI = ["semua", "tonggak", "turnamen", "kegiatan"];

/** Satu lempeng foto — tombol (bukan gambar) yang menerima umpan balik hover
    & fokus, agar gambar tidak dianimasikan sebagai target aksi. */
function Lempeng({ src, alt, caption, onBuka, labelBuka }) {
  return (
    <figure className="m-0 flex flex-col">
      <button
        type="button"
        onClick={onBuka}
        aria-label={`${labelBuka}: ${caption}`}
        className="group block w-full overflow-hidden rounded border border-grey-200 bg-white transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <img
          src={gambar(src)}
          alt={alt}
          draggable="false"
          decoding="async"
          loading="lazy"
          className="aspect-[4/3] w-full object-cover object-center"
        />
      </button>
      <figcaption className="mt-2 text-[13px] leading-snug text-grey-600">
        {caption}
      </figcaption>
    </figure>
  );
}

/** Lightbox — dialog untuk memperbesar foto dengan navigasi maju/mundur.
    Fokus terperangkap di dalam dialog (Tab melingkar) dan latar diperlakukan
    inert oleh AT lewat aria-modal; fokus dikembalikan ke pemicu saat ditutup. */
function Lightbox({ foto, idx, setIdx, onTutup, t }) {
  const dialogRef = useRef(null);
  const tutupRef = useRef(null);
  const total = foto.length;
  const aktif = idx >= 0 ? foto[idx] : null;

  useEffect(() => {
    if (idx < 0) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        onTutup();
      } else if (e.key === "ArrowRight") {
        setIdx((i) => (i + 1) % total);
      } else if (e.key === "ArrowLeft") {
        setIdx((i) => (i - 1 + total) % total);
      } else if (e.key === "Tab") {
        // Perangkap fokus: hanya elemen yang benar-benar tampak (bukan
        // varian mobil/desktop yang display:none) yang ikut siklus Tab.
        const fokusabel = Array.from(
          dialogRef.current?.querySelectorAll("button:not([disabled])") || []
        ).filter((n) => n.offsetParent !== null);
        if (fokusabel.length === 0) return;
        const pertama = fokusabel[0];
        const terakhir = fokusabel[fokusabel.length - 1];
        if (e.shiftKey && document.activeElement === pertama) {
          e.preventDefault();
          terakhir.focus();
        } else if (!e.shiftKey && document.activeElement === terakhir) {
          e.preventDefault();
          pertama.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    tutupRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [idx, total, setIdx, onTutup]);

  if (!aktif) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("galeri.judul")}
      className="fixed inset-0 z-[60] flex flex-col bg-hero/95"
      onClick={onTutup}
    >
      {/* Bar atas: posisi + tutup */}
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <span className="text-sm tabular-nums text-white/80">
          {t("galeri.lightbox.posisi", { i: idx + 1, n: total })}
        </span>
        <button
          type="button"
          ref={tutupRef}
          onClick={(e) => {
            e.stopPropagation();
            onTutup();
          }}
          aria-label={t("galeri.lightbox.tutup")}
          className="inline-flex size-11 items-center justify-center rounded border border-white/30 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      {/* Panggung foto + kontrol samping */}
      <div
        className="flex flex-1 items-center justify-center gap-3 px-4 pb-2 md:gap-5 md:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIdx((i) => (i - 1 + total) % total)}
          aria-label={t("galeri.lightbox.sebelumnya")}
          className="hidden size-11 flex-none items-center justify-center rounded border border-white/30 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
        >
          <ArrowRightIcon className="size-5 rotate-180" />
        </button>

        <figure className="m-0 flex min-h-0 flex-1 flex-col items-center justify-center">
          <img
            src={gambar(aktif.src)}
            alt={t(`galeri.${aktif.cap}`)}
            decoding="async"
            className="max-h-[74vh] w-auto max-w-full rounded border border-white/15 object-contain"
          />
        </figure>

        <button
          type="button"
          onClick={() => setIdx((i) => (i + 1) % total)}
          aria-label={t("galeri.lightbox.berikutnya")}
          className="hidden size-11 flex-none items-center justify-center rounded border border-white/30 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
        >
          <ArrowRightIcon className="size-5" />
        </button>
      </div>

      {/* Keterangan + navigasi mobil */}
      <div
        className="px-4 pb-5 pt-1 text-center md:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mx-auto max-w-[70ch] text-sm leading-relaxed text-white/90">
          {t(`galeri.${aktif.cap}`)}
        </p>
        <div className="mt-3 flex justify-center gap-3 sm:hidden">
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + total) % total)}
            aria-label={t("galeri.lightbox.sebelumnya")}
            className="inline-flex size-11 items-center justify-center rounded border border-white/30 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowRightIcon className="size-5 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % total)}
            aria-label={t("galeri.lightbox.berikutnya")}
            className="inline-flex size-11 items-center justify-center rounded border border-white/30 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowRightIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Galeri() {
  const { t } = useI18n();
  const [aktif, setAktif] = useState("semua");
  const [idx, setIdx] = useState(-1);
  // Elemen pemicu (thumbnail) agar fokus bisa dikembalikan saat lightbox tutup.
  const pemicuRef = useRef(null);

  const albumTampil = useMemo(
    () => (aktif === "semua" ? ALBUM : ALBUM.filter((a) => a.id === aktif)),
    [aktif]
  );

  // Daftar rata (flat) untuk navigasi lightbox mengikuti urutan tampil.
  const flat = useMemo(
    () => albumTampil.flatMap((a) => a.foto.map((f) => ({ src: f.src, cap: f.cap }))),
    [albumTampil]
  );

  // Offset awal tiap album di dalam daftar rata → indeks global tombol foto.
  const offsets = useMemo(() => {
    let acc = 0;
    return albumTampil.map((a) => {
      const start = acc;
      acc += a.foto.length;
      return start;
    });
  }, [albumTampil]);

  const gantiFilter = (k) => {
    setIdx(-1);
    setAktif(k);
  };

  const bukaFoto = (el, index) => {
    pemicuRef.current = el;
    setIdx(index);
  };

  const tutupFoto = () => {
    setIdx(-1);
    const el = pemicuRef.current;
    if (el) requestAnimationFrame(() => el.focus());
  };

  return (
    <HalamanIsi
      title={t("galeri.judul")}
      parent={t("nav.mediaDanInformasi")}
      parentPath="/media-dan-informasi"
      description={t("galeri.deskripsi")}
      next={{ to: "/keberlanjutan", judul: t("nav.keberlanjutan") }}
    >
      <div className="font-serif">
      {/* ═══ Header Editorial / Judul Besar ═══ */}
      <PageArtikel lebar>
        <MastheadEditorial
          kicker={t("galeri.judul")}
          judul={t("galeri.judul")}
          subjudul={t("galeri.deskripsi")}
        />
      </PageArtikel>

      {/* ═══ Standfirst + penyaring kategori ═══ */}
      <section className="w-full border-b border-grey-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-8 md:py-16">
          <div className="grid gap-x-16 gap-y-8 lg:grid-cols-12">
            <h2 className="text-pretty text-2xl font-semibold leading-snug text-grey-800 md:text-3xl lg:col-span-5">
              {t("galeri.artikel")}
            </h2>
            <div className="flex max-w-[70ch] flex-col gap-y-4 text-[15px] leading-relaxed text-grey-600 md:text-base lg:col-span-7">
              <p className="m-0">{t("galeri.standfirst")}</p>
              <p className="m-0 text-[13px] text-grey-600">{t("galeri.p1")}</p>
            </div>
          </div>

          <div
            role="group"
            aria-label={t("galeri.judul")}
            className="mt-9 flex flex-wrap gap-2"
          >
            {KATEGORI.map((k) => {
              const dipilih = aktif === k;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={dipilih}
                  onClick={() => gantiFilter(k)}
                  className={`inline-flex min-h-11 items-center rounded border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    dipilih
                      ? "border-primary bg-primary text-white"
                      : "border-grey-200 bg-white text-grey-800 hover:border-grey-800"
                  }`}
                >
                  {t(`galeri.filter.${k}`)}
                </button>
              );
            })}
          </div>

          {/* Umumkan perubahan jumlah foto ke pembaca layar. */}
          <p role="status" aria-live="polite" className="sr-only">
            {t("galeri.hasil", { n: flat.length })}
          </p>
        </div>
      </section>

      {/* ═══ Koleksi foto ═══ */}
      {albumTampil.map((a, ai) => (
        <section key={a.id} className="w-full border-b border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-14 md:px-8 md:py-16">
            <div className="grid gap-x-16 gap-y-3 border-b border-grey-200 pb-8 lg:grid-cols-12">
              <h3 className="text-balance text-xl font-semibold leading-snug text-grey-800 md:text-2xl lg:col-span-5">
                {t(`galeri.album.${a.id}.judul`)}
              </h3>
              <div className="lg:col-span-7">
                <p className="m-0 max-w-[65ch] text-[15px] leading-relaxed text-grey-600">
                  {t(`galeri.album.${a.id}.deskripsi`)}
                </p>
                <p className="m-0 mt-2 text-[13px] font-medium text-grey-600">
                  {t("galeri.fotoMeta", { n: a.foto.length })}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {a.foto.map((f, fi) => (
                <Lempeng
                  key={f.src}
                  src={f.src}
                  alt={t(`galeri.${f.cap}`)}
                  caption={t(`galeri.${f.cap}`)}
                  labelBuka={t("galeri.lightbox.buka")}
                  onBuka={(e) => bukaFoto(e.currentTarget, offsets[ai] + fi)}
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      <Lightbox foto={flat} idx={idx} setIdx={setIdx} onTutup={tutupFoto} t={t} />
      </div>
    </HalamanIsi>
  );
}
