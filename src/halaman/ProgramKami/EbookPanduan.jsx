import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { CloseIcon } from "../../components/icons.jsx";
import { sumberGambar, urlEbook } from "../../lib/asets.js";
import { useI18n } from "../../lib/i18n.jsx";
import { DAFTAR_EBOOK, COVER, kategoriDariDaftar } from "../Beranda/ebook-data.js";
import FiturEbook from "./FiturEbook.jsx";

/**
 * Halaman E-Book & Panduan (di bawah menu Program Kami)
 *
 * Konsep:
 * - Daftar file PDF yang ada di /public/ebooks/
 * - Gambar sampul (cover) di /public/images/E-Books/
 * - Klik "Baca" -> buka modal viewer (iframe) bisa baca langsung
 * - Klik "Unduh" -> download file
 * - Dibuka dari laman lain dengan ?buku=<id> -> otomatis gulir & sorot kartu
 * - Dibuka dengan ?kategori=<label> -> pasang filter & gulir ke katalog
 *
 * Data (DAFTAR_EBOOK, COVER, KATEGORI_URUTAN, kategoriDariDaftar) dipisah ke
 * src/halaman/Beranda/ebook-data.js agar bisa dipakai ulang di Landing dan
 * tetap menjaga pemisahan chunk (lazy-load) masing-masing halaman.
 */

function PdfIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-none"
      aria-hidden="true"
    >
      <path d="M8 0C6.9 0 6 0.9 6 2V30C6 31.1 6.9 32 8 32H28C29.1 32 30 31.1 30 30V8L22 0H8Z" fill="#E2E5E7" />
      <path d="M24 8H30L22 0V6C22 7.1 22.9 8 24 8Z" fill="#B0B7BD" />
      <path d="M30 14L24 8H30V14Z" fill="#CAD1D8" />
      <path d="M26 26C26 26.55 25.55 27 25 27H3C2.45 27 2 26.55 2 26V16C2 15.45 2.45 15 3 15H25C25.55 15 26 15.45 26 16V26Z" fill="#F15642" />
      <path d="M6.36 18.95C6.36 18.68 6.57 18.4 6.9 18.4H8.75C9.79 18.4 10.73 19.09 10.73 20.43C10.73 21.69 9.79 22.39 8.75 22.39H7.41V23.45C7.41 23.8 7.19 24 6.9 24C6.64 24 6.36 23.8 6.36 23.45V18.95ZM7.41 19.4V21.39H8.75C9.29 21.39 9.71 20.92 9.71 20.43C9.71 19.87 9.29 19.4 8.75 19.4H7.41Z" fill="white" />
      <path d="M12.29 24C12.03 24 11.74 23.86 11.74 23.5V18.96C11.74 18.68 12.03 18.47 12.29 18.47H14.12C17.78 18.47 17.7 24 14.2 24H12.29ZM12.8 19.44V23.03H14.12C16.28 23.03 16.38 19.44 14.12 19.44H12.8Z" fill="white" />
      <path d="M18.99 19.51V20.78H21.03C21.32 20.78 21.61 21.07 21.61 21.35C21.61 21.61 21.32 21.83 21.03 21.83H18.99V23.5C18.99 23.78 18.79 24 18.51 24C18.16 24 17.95 23.78 17.95 23.5V18.96C17.95 18.68 18.16 18.47 18.51 18.47H21.32C21.67 18.47 21.88 18.68 21.88 18.96C21.88 19.22 21.67 19.51 21.32 19.51H18.99Z" fill="white" />
      <path d="M25 27H6V28H25C25.55 28 26 27.55 26 27V26C26 26.55 25.55 27 25 27Z" fill="#CAD1D8" />
    </svg>
  );
}

function IkonBaca() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IkonUnduh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3V15M12 15L8 11M12 15L16 11M3 17V19C3 19.55 3.45 20 4 20H20C20.55 20 21 19.55 21 19V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Kartu e-book gaya flip-card (mengikuti pola Pertamina): sisi depan = sampul
 * + judul berlapis gradasi, sisi belakang = info & tombol aksi. Flip lewat
 * hover/fokus di desktop dan lewat klik/ketuk di perangkat sentuh.
 */
function KartuEbook({ buku, disorot, terbalik, padaBalik, padaBaca }) {
  return (
    <article
      id={buku.id}
      tabIndex={0}
      onClick={padaBalik}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          padaBalik();
        }
      }}
      className={`group block aspect-[2/3] w-full cursor-pointer rounded-lg focus:outline-none lg:max-h-[280px] ${
        disorot ? "ring-4 ring-[#0B2F9F]/60 ring-offset-2" : ""
      }`}
      aria-label={`${buku.judul} — ${buku.tersedia ? "klik untuk membalik dan melihat aksi" : "segera hadir"}`}
    >
      <div
        className={`relative h-full w-full rounded-lg transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus:[transform:rotateY(180deg)] ${
          terbalik ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Sisi depan — sampul */}
        <div className="absolute inset-0 h-full w-full rounded-lg [backface-visibility:hidden] [transform-style:preserve-3d]">
          <div className="relative h-full w-full overflow-hidden rounded-lg [transform:translateZ(1px)]">
            {COVER[buku.id] ? (
              <img
                {...sumberGambar(COVER[buku.id], {
                  // Kisi 2 / 3 / 5 kolom → lebar kartu ± 48vw, 33vw, 20vw.
                  sizes: "(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 48vw",
                })}
                alt={`Sampul ${buku.judul}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-200">
                <PdfIcon />
              </div>
            )}
            {!buku.tersedia && (
              <span className="absolute bottom-2 right-2 z-20 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                Segera hadir
              </span>
            )}
          </div>
        </div>

        {/* Sisi belakang — info & aksi */}
        <div className="absolute inset-0 z-10 h-full w-full rounded-lg bg-[#f1f5f9] text-center [transform:rotateY(180deg)] [backface-visibility:hidden] [transform-style:preserve-3d]">
          <div className="flex min-h-full flex-col items-center justify-center gap-2 p-3 [transform:translateZ(1px)]">
            <div className="flex-none">
              <PdfIcon />
            </div>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {buku.kategori}
            </span>
            <p className="m-0 line-clamp-2 text-[12px] font-semibold leading-4 text-slate-900">{buku.judul}</p>
            <p className="m-0 text-[11px] text-slate-500">{buku.ukuran}</p>
            {buku.tersedia ? (
              <div className="mx-auto flex w-full max-w-[160px] flex-row items-stretch justify-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    padaBaca();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0B2F9F] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0a2a8e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2F9F]"
                >
                  <IkonBaca /> Baca
                </button>
                <a
                  href={urlEbook(buku.file, { unduh: true })}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  <IkonUnduh /> Unduh
                </a>
              </div>
            ) : (
              <span className="rounded border border-dashed border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-400">
                Belum tersedia
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function EbookPanduan() {
  const { t } = useI18n();
  const [pdfAktif, setPdfAktif] = useState(null);
  const [kategoriAktif, setKategoriAktif] = useState("Semua");
  const [disorot, setDisorot] = useState(null);
  const [searchParams] = useSearchParams();
  const [kartuBalik, setKartuBalik] = useState(() => new Set());

  // Flip kartu lewat klik/ketuk (perangkat tanpa hover).
  const toggleBalik = (id) => {
    setKartuBalik((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const kategoriList = useMemo(() => {
    return ["Semua", ...kategoriDariDaftar(DAFTAR_EBOOK)];
  }, []);

  const daftarTampil = useMemo(() => {
    if (kategoriAktif === "Semua") return DAFTAR_EBOOK;
    return DAFTAR_EBOOK.filter((b) => b.kategori === kategoriAktif);
  }, [kategoriAktif]);

  // Kunci body scroll saat modal terbuka
  useEffect(() => {
    if (pdfAktif) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onEsc = (e) => {
        if (e.key === "Escape") setPdfAktif(null);
      };
      window.addEventListener("keydown", onEsc);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onEsc);
      };
    }
  }, [pdfAktif]);

  // Bila dibuka dari laman lain dengan ?buku=<id>, gulir ke kartu e-book
  // terkait dan sorot sebentar agar pengguna tahu posisinya.
  useEffect(() => {
    const id = searchParams.get("buku");
    if (!id) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setDisorot(id);
        window.setTimeout(() => setDisorot(null), 2600);
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  // Bila dibuka dari Landing dengan ?kategori=<label>, pasang filter sesuai
  // barisan kemudian gulir ke katalog buku.
  useEffect(() => {
    const label = searchParams.get("kategori");
    if (!label || !kategoriList.includes(label)) return;
    setKategoriAktif(label);
    const timer = window.setTimeout(() => {
      const el = document.getElementById("katalog-ebook");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [searchParams, kategoriList]);

  return (
    <HalamanIsi
      title="E-Book & Panduan"
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description="Pusat literasi resmi komunitas: kumpulan e-book dan panduan catur dalam format PDF yang bisa dibaca langsung di browser atau diunduh."
    >
      <section
        id="ebook-panduan"
        className="w-full relative bg-transparent pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-12 md:pb-12 xl:pb-16 pt-10 md:pt-12 xl:pt-16"
      >
        <div className="relative w-full mx-auto max-w-[1280px] flex flex-col">
<div className="prose-kci mb-10">
            <h3>Tentang E-Book & Panduan</h3>
            <p>
              Koleksi ini merupakan pusat literasi resmi komunitas yang menghimpun materi belajar catur secara
              terstruktur, dari tingkat dasar hingga lanjutan: pengenalan papan dan bidak, gerakan setiap buah,
              taktik dasar, strategi, hingga panduan pertandingan. Setiap materi disusun berjenjang agar dapat
              dipelajari selangkah demi selangkah, baik oleh pemula yang baru mulai maupun pemain yang ingin
              memperdalam pemahaman strateginya.
            </p>
            <p>
              Seluruh dokumen disediakan dalam format PDF sehingga dapat dibaca langsung di browser tanpa memerlukan
              aplikasi tambahan, maupun diunduh untuk dibaca secara offline di perangkat apa pun. Penataan kategori
              yang teratur membantu pengguna memilih materi yang sesuai dengan tingkat kemampuannya.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="overflow-x-auto">
              <div role="tablist" aria-label="Filter kategori e-book" className="w-max flex flex-nowrap items-center gap-1 bg-slate-200 rounded-full p-2">
                {kategoriList.map((k) => {
                  const aktif = k === kategoriAktif;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      id={`tab-${k}`}
                      aria-selected={aktif}
                      onClick={() => setKategoriAktif(k)}
                      className={
                        aktif
                          ? "flex whitespace-nowrap rounded-full bg-[#0B2F9F] px-4 py-2 text-sm text-white transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2F9F]"
                          : "flex whitespace-nowrap rounded-full px-4 py-2 text-sm text-black transition-all duration-300 hover:bg-slate-300/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                      }
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="ml-auto whitespace-nowrap text-[12px] text-slate-500">{daftarTampil.length} dokumen</span>
          </div>
    
          <div
            id="katalog-ebook"
            role="tabpanel"
            aria-labelledby={`tab-${kategoriAktif}`}
            className="mt-6 grid scroll-mt-10 grid-cols-2 gap-x-2 gap-y-4 md:grid-cols-3 md:gap-x-4 md:gap-y-4 lg:grid-cols-5 lg:gap-x-4 lg:gap-y-4"
          >
            {daftarTampil.map((buku) => (
              <KartuEbook
                key={buku.id}
                buku={buku}
                disorot={disorot === buku.id}
                terbalik={kartuBalik.has(buku.id)}
                padaBalik={() => toggleBalik(buku.id)}
                padaBaca={() => buku.tersedia && setPdfAktif(buku)}
              />
            ))}
          </div>

          <FiturEbook />

          {pdfAktif && (
            <div className="fixed inset-0 z-[80] flex flex-col bg-black/60 backdrop-blur-sm">
              <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-flex rounded bg-[#F15642]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F15642] ring-1 ring-[#F15642]/20">
                      PDF
                    </span>
                    <h2 className="truncate text-[14px] font-semibold text-slate-900">{pdfAktif.judul}</h2>
                  </div>
                  <p className="mt-0.5 hidden text-[11px] text-slate-500 md:block">
                    {pdfAktif.kategori} • {pdfAktif.ukuran} • {pdfAktif.halaman}
                  </p>
                </div>
    
                <div className="flex items-center gap-2">
                  <a
                    href={urlEbook(pdfAktif.file, { unduh: true })}
                    download
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <IkonUnduh />
                    <span className="hidden sm:inline">Unduh</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPdfAktif(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    aria-label="Tutup"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
    
              <div className="flex flex-1 flex-col bg-[#525659] p-2 md:p-4">
                <div className="mx-auto flex w-full max-w-[1024px] flex-1 flex-col overflow-hidden rounded-md bg-white shadow-xl">
                  <iframe
                    title={pdfAktif.judul}
                    src={urlEbook(pdfAktif.file)}
                    className="h-full w-full flex-1 border-0"
                  />
                </div>
                <div className="mx-auto mt-3 flex w-full max-w-[1024px] items-center justify-between text-[11px] text-white/70">
                  <span>
                    Jika PDF tidak tampil,{" "}
                    <a href={urlEbook(pdfAktif.file)} target="_blank" rel="noreferrer noopener" className="underline hover:text-white">
                      buka di tab baru
                    </a>{" "}
                    atau unduh.
                  </span>
                  <button type="button" onClick={() => setPdfAktif(null)} className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">
                    Tutup (Esc)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </HalamanIsi>
  );
}
