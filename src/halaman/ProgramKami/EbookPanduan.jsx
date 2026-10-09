import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { CloseIcon } from "../../components/icons.jsx";
import PembacaPdf from "../../components/PembacaPdf.jsx";
import { sumberEbook, sumberGambar, urlEbook } from "../../lib/asets.js";
import { useI18n } from "../../lib/i18n.jsx";
import { DAFTAR_EBOOK, COVER, kategoriDariDaftar } from "../Beranda/ebook-data.js";
import FiturEbook from "./FiturEbook.jsx";
import {
  ambilTiketSesi,
  bersihkanSesiEbook,
  hapusTiketSesi,
  tiketBelumKedaluwarsa,
} from "../../lib/sesiUnduhEbook.js";
import ModalUnduhEbook from "./ModalUnduhEbook.jsx";

/**
 * Halaman E-Book & Panduan (di bawah menu Program Kami)
 *
 * Konsep — model perpustakaan (baca bebas, unduh pakai kode):
 * - Daftar file PDF yang ada di /public/ebooks/
 * - Gambar sampul (cover) di /public/images/E-Books/
 * - Klik "Baca" (ikon mata) -> pembaca PDF bawaan situs (berbasis pdf.js)
 *   langsung terbuka TANPA kode: pengunjung bisa menilai isi buku dulu.
 *   Halaman digambar ke <canvas> sehingga dokumen benar-benar TAMPIL.
 * - Klik "Unduh" -> gerbang kode akses (redemption). Setelah kode sah, tiket
 *   diterbitkan server dan unduhan dipaksa `attachment`.
 * - Tiket hanya dipakai untuk mengunduh. Ia tidak pernah menghalangi membaca,
 *   jadi tiket kedaluwarsa pun tidak membuat pembaca kosong.
 * - Dibuka dari laman lain dengan /ebook-panduan/<id> -> otomatis gulir & sorot kartu
 * - Dibuka dengan /ebook-panduan/kategori/<slug> -> pasang filter & gulir ke katalog
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
 * Sampul buku dengan cadangan aman.
 *
 * `sumberGambar()` mengarahkan JPG/PNG ke varian WebP, jadi berkas yang belum
 * dikonversi (atau terhapus) akan gagal dimuat. Tanpa penanganan, kartu
 * menampilkan ikon gambar rusak; di sini kegagalan itu jatuh ke ikon PDF yang
 * sama seperti buku tanpa sampul, sehingga katalog tidak pernah tampak rusak.
 */
function SampulBuku({ jalur, judul }) {
  const { t } = useI18n();
  const [gagal, setGagal] = useState(false);
  if (!jalur || gagal) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-200">
        <PdfIcon />
      </div>
    );
  }
  return (
    <img
      {...sumberGambar(jalur, {
        // Kisi 2 / 3 / 5 kolom → lebar kartu ± 48vw, 33vw, 20vw.
        sizes: "(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 48vw",
      })}
      alt={t("ebookPanduan.sampulAlt", { judul })}
      loading="lazy"
      decoding="async"
      onError={() => setGagal(true)}
      className="h-full w-full object-cover"
    />
  );
}

/**
 * Kartu e-book gaya flip-card (mengikuti pola Pertamina): sisi depan = sampul
 * + judul berlapis gradasi, sisi belakang = info & tombol aksi. Flip lewat
 * hover/fokus di desktop dan lewat klik/ketuk di perangkat sentuh.
 */
function KartuEbook({ buku, disorot, terbalik, padaBalik, padaBaca, padaUnduh }) {
  const { t } = useI18n();
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
        disorot ? "ring-4 ring-primary/60 ring-offset-2" : ""
      }`}
      aria-label={
        buku.tersedia
          ? t("ebookPanduan.ariaKartuAksi", { judul: buku.judul })
          : t("ebookPanduan.ariaKartuSegera", { judul: buku.judul })
      }
    >
      <div
        className={`relative h-full w-full rounded-lg transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus:[transform:rotateY(180deg)] ${
          terbalik ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Sisi depan — sampul */}
        <div className="absolute inset-0 h-full w-full rounded-lg [backface-visibility:hidden] [transform-style:preserve-3d]">
          <div className="relative h-full w-full overflow-hidden rounded-lg [transform:translateZ(1px)]">
            <SampulBuku jalur={COVER[buku.id]} judul={buku.judul} />
            {!buku.tersedia && (
              <span className="absolute bottom-2 right-2 z-20 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                {t("ebookPanduan.segeraHadir")}
              </span>
            )}
          </div>
        </div>

        {/* Sisi belakang — info & aksi */}
        <div className="absolute inset-0 z-10 h-full w-full rounded-lg bg-slate-100 text-center [transform:rotateY(180deg)] [backface-visibility:hidden] [transform-style:preserve-3d]">
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <IkonBaca /> {t("ebookPanduan.baca")}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    padaUnduh();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  <IkonUnduh /> {t("ebookPanduan.unduh")}
                </button>
              </div>
            ) : (
              <span className="rounded border border-dashed border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-400">
                {t("ebookPanduan.belumTersedia")}
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
  // Buku yang sedang melewati gerbang unduh (popup kode akses).
  const [unduhan, setUnduhan] = useState(null);
  // Jumlah halaman sebenarnya baru diketahui setelah PDF terbuka; data statis
  // di ebook-data.js sering hanya berisi "-".
  const [halamanPdf, setHalamanPdf] = useState(0);
  const [kategoriAktif, setKategoriAktif] = useState("Semua");
  const [disorot, setDisorot] = useState(null);
  const { id: bukuIdPath, kategori: kategoriPath } = useParams();
  const [kartuBalik, setKartuBalik] = useState(() => new Set());

  // Tiket kedaluwarsa dibuang sekali saat halaman dibuka supaya buku berikutnya
  // tidak pernah memakai tiket mati (server akan menolaknya di tengah render PDF).
  useEffect(() => {
    bersihkanSesiEbook();
  }, []);

  // Flip kartu lewat klik/ketuk (perangkat tanpa hover).
  const toggleBalik = (id) => {
    setKartuBalik((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function unduhDenganTiket(buku) {
    /*
     * Tiket di state bisa saja sudah lewat 15 menit (pembaca dibiarkan terbuka
     * lama), dan jam perangkat pengguna bisa bergeser dari jam server. Karena
     * itu tiket tidak hanya diperiksa di sisi klien: URL-nya "diketuk" lebih
     * dulu dengan HEAD. Tanpa langkah ini, tiket yang ditolak server membuat
     * browser menyimpan berkas JSON 403 sebagai "unduhan" — pengguna merasa
     * sudah mengunduh padahal isinya pesan galat.
     */
    const tiketLayak = tiketBelumKedaluwarsa(buku?.tiketUnduh)
      ? buku.tiketUnduh
      : ambilTiketSesi({ file: buku?.file });
    if (!tiketLayak) {
      setUnduhan(buku);
      return;
    }

    const tautanUnduh = urlEbook(buku.file, { unduh: true, tiket: tiketLayak });
    let boleh = true;
    try {
      const jawaban = await fetch(tautanUnduh, { method: "HEAD", credentials: "same-origin" });
      // HANYA penolakan eksplisit (401/403) yang dianggap tiket tidak sah.
      // Balasan lain (mis. 405 dari proxy yang tidak mendukung HEAD) tidak
      // boleh menghalangi unduhan yang sebenarnya sah.
      boleh = ![401, 403].includes(jawaban.status);
    } catch {
      // Jaringan bermasalah: biarkan browser mencoba (unduhan biasa pun akan
      // memunculkan galatnya sendiri) daripada memaksa mengisi kode lagi.
      boleh = true;
    }

    if (!boleh) {
      hapusTiketSesi({ file: buku.file });
      setUnduhan(buku);
      return;
    }

    // Perbarui tiket pembaca HANYA bila pembaca sedang menampilkan buku ini.
    // Tombol Unduh di kartu katalog tidak boleh ikut membuka pembaca PDF.
    setPdfAktif((lama) =>
      lama && lama.file === buku.file ? { ...lama, tiketUnduh: tiketLayak } : lama
    );
    const taut = document.createElement("a");
    taut.href = tautanUnduh;
    taut.download = "";
    document.body.appendChild(taut);
    taut.click();
    taut.remove();
  }

  const kategoriList = useMemo(() => {
    return ["Semua", ...kategoriDariDaftar(DAFTAR_EBOOK)];
  }, []);

  const daftarTampil = useMemo(() => {
    if (kategoriAktif === "Semua") return DAFTAR_EBOOK;
    return DAFTAR_EBOOK.filter((b) => b.kategori === kategoriAktif);
  }, [kategoriAktif]);

  // Kunci body scroll saat modal terbuka. Esc menutup lapisan paling atas
  // lebih dulu: popup unduh, baru pembaca PDF.
  useEffect(() => {
    if (pdfAktif || unduhan) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onEsc = (e) => {
        if (e.key !== "Escape") return;
        if (unduhan) {
          setUnduhan(null);
          return;
        }
        if (pdfAktif) setPdfAktif(null);
      };
      window.addEventListener("keydown", onEsc);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onEsc);
      };
    }
  }, [pdfAktif, unduhan]);

  // Bila dibuka dari laman lain dengan /ebook-panduan/<id>, gulir ke kartu
  // e-book terkait dan sorot sebentar agar pengguna tahu posisinya.
  useEffect(() => {
    const id = bukuIdPath;
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
  }, [bukuIdPath]);

  // Bila dibuka dengan /ebook-panduan/kategori/<slug>, pasang filter sesuai
  // barisan kemudian gulir ke katalog buku.
  useEffect(() => {
    if (!kategoriPath) return;
    const label = kategoriList.find(
      (kategori) => kategori.toLowerCase().replace(/\s+/g, "-") === kategoriPath
    );
    if (!label) return;
    setKategoriAktif(label);
    const timer = window.setTimeout(() => {
      const el = document.getElementById("katalog-ebook");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [kategoriPath, kategoriList]);

  return (
    <HalamanIsi
      title={t("ebookPanduan.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("ebookPanduan.deskripsi")}
    >
      <section
        id="ebook-panduan"
        className="w-full relative bg-transparent pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-12 md:pb-12 xl:pb-16 pt-10 md:pt-12 xl:pt-16"
      >
        <div className="relative w-full mx-auto max-w-[1280px] flex flex-col">
<div className="prose-kci mb-10">
            <h3>{t("ebookPanduan.tentangJudul")}</h3>
            <p>
              {t("ebookPanduan.tentangP1")}
            </p>
            <p>
              {t("ebookPanduan.tentangP2")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="overflow-x-auto">
              <div role="tablist" aria-label={t("ebookPanduan.filterAriaLabel")} className="w-max flex flex-nowrap items-center gap-1 bg-slate-200 rounded-full p-2">
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
                          ? "flex whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm text-white transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          : "flex whitespace-nowrap rounded-full px-4 py-2 text-sm text-black transition-all duration-300 hover:bg-slate-300/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                      }
                    >
                      {k === "Semua" ? t("ebookPanduan.semua") : k}
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="ml-auto whitespace-nowrap text-[12px] text-slate-500">{t("ebookPanduan.dokumenCount", { n: daftarTampil.length })}</span>
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
                padaBaca={() => {
                  if (!buku.tersedia) return;
                  // MEMBACA bebas: pembaca langsung dibuka, tanpa kode akses.
                  // Pengunjung bisa menilai isi buku dulu; yang wajib kode
                  // hanya UNDUH (lihat unduhDenganTiket).
                  setHalamanPdf(0);
                  setPdfAktif({
                    ...buku,
                    tiketUnduh: ambilTiketSesi({ file: buku.file }) || null,
                  });
                }}
                // Satu jalur untuk semua tombol Unduh: bila tiket sesi untuk
                // berkas ini masih berlaku, berkas langsung diunduh tanpa
                // meminta kode lagi (tiket tetap diketik ulang HANYA kalau
                // server menolaknya — lihat unduhDenganTiket). Tanpa ini,
                // pengguna yang baru menebus kode tetap disuruh memasukkan
                // kode yang sama dari kartu.
                padaUnduh={() => unduhDenganTiket(buku)}
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
                      {t("ebookPanduan.pdf")}
                    </span>
                    <h2 className="truncate text-[14px] font-semibold text-slate-900">{pdfAktif.judul}</h2>
                  </div>
                  <p className="mt-0.5 hidden text-[11px] text-slate-500 md:block">
                    {t("ebookPanduan.info", {
                      kategori: pdfAktif.kategori,
                      ukuran: pdfAktif.ukuran,
                      halaman: halamanPdf
                        ? t("ebookPanduan.halamanCount", { n: halamanPdf })
                        : pdfAktif.halaman,
                    })}
                  </p>
                </div>
    
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => unduhDenganTiket(pdfAktif)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <IkonUnduh />
                    <span className="hidden sm:inline">{t("ebookPanduan.unduh")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfAktif(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    aria-label={t("ebookPanduan.tutup")}
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
    
              <div className="flex min-h-0 flex-1 flex-col bg-[#525659] p-2 md:p-4">
                <div className="mx-auto flex min-h-0 w-full max-w-[1024px] flex-1 flex-col overflow-hidden rounded-md shadow-xl">
                  <PembacaPdf
                    sumber={sumberEbook(pdfAktif.file)}
                    padaGagal={() => {
                      /*
                       * Semua sumber gagal (mis. berkas belum ada di storage
                       * privat → 503). TIKET UNDUHAN sengaja tidak disentuh:
                       * membaca tidak memakai tiket, jadi kegagalan di sini
                       * tidak ada hubungannya dengan tiket, dan menghapusnya
                       * hanya akan membuang kode akses yang masih sah.
                       * State pembaca juga tidak boleh diubah di sini —
                       * `sumber` adalah dependensi efek pemuatan, jadi
                       * mengubahnya akan memicu pemuatan ulang tanpa henti.
                       */
                    }}
                    judul={pdfAktif.judul}
                    urlUnduh={
                      pdfAktif.tiketUnduh
                        ? urlEbook(pdfAktif.file, {
                            unduh: true,
                            tiket: pdfAktif.tiketUnduh,
                          })
                        : undefined
                    }
                    padaSiap={setHalamanPdf}
                  />
                </div>
                <div className="mx-auto mt-3 flex w-full max-w-[1024px] flex-wrap items-center justify-between gap-2 text-[11px] text-white/70">
                  <span>
                    {t("ebookPanduan.bantuan")}{" "}
                    <a
                      href={urlEbook(pdfAktif.file)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline hover:text-white"
                    >
                      {t("ebookPanduan.bukaTabBaru")}
                    </a>
                    .
                  </span>
                  <button type="button" onClick={() => setPdfAktif(null)} className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">
                    {t("ebookPanduan.tutupEsc")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {unduhan && (
            <ModalUnduhEbook buku={unduhan} onTutup={() => setUnduhan(null)} />
          )}
        </div>
      </section>
    </HalamanIsi>
  );
}
