import { useEffect, useMemo, useState } from "react";
import { BagianBeranda } from "./TataLetakBeranda.jsx";
import { CloseIcon } from "../../components/icons.jsx";

/**
 * Halaman E-Book & Panduan
 *
 * Konsep:
 * - Daftar file PDF yang ada di /public/ebooks/
 * - Klik "Baca" -> buka modal viewer (iframe) bisa baca langsung
 * - Klik "Unduh" -> download file
 * - Kalau file belum ada (tersedia: false) -> tampilkan status Segera hadir
 *
 * Cara menambah e-book baru:
 * 1. Taruh file PDF di folder public/ebooks/
 * 2. Tambah entri baru di DAFTAR_EBOOK di bawah
 * Tidak perlu ubah komponen lain.
 */

const DAFTAR_EBOOK = [
  {
    id: "panduan-dasar",
    judul: "Panduan Dasar Bermain Catur",
    deskripsi:
      "Pengenalan papan, gerakan bidak, notasi aljabar, dan aturan khusus seperti rokade, en passant, dan promosi.",
    file: "/ebooks/panduan-dasar-catur.pdf",
    kategori: "Dasar",
    ukuran: "0,9 MB",
    halaman: "12 hal",
    tahun: "2024",
    tersedia: true,
  },
  {
    id: "aturan-fide",
    judul: "Aturan Resmi FIDE 2024 - Ringkasan",
    deskripsi:
      "Ringkasan aturan permainan, penggunaan jam catur, ketentuan remis, dan regulasi turnamen resmi.",
    file: "/ebooks/aturan-fide.pdf",
    kategori: "Regulasi",
    ukuran: "0,9 MB",
    halaman: "10 hal",
    tahun: "2024",
    tersedia: true,
  },
  {
    id: "pembukaan",
    judul: "Prinsip & Ide Pembukaan",
    deskripsi:
      "Prinsip kontrol pusat, pengembangan perwira, keamanan raja, serta contoh ide pembukaan populer yang praktis.",
    file: "/ebooks/pembukaan.pdf",
    kategori: "Strategi",
    ukuran: "0,8 MB",
    halaman: "8 hal",
    tahun: "2024",
    tersedia: true,
  },
  {
    id: "taktik",
    judul: "Taktik Dasar & Menengah",
    deskripsi:
      "Materi garpu, pin, tusuk sate, serangan ganda, dan latihan perhitungan variasi untuk mengasah ketajaman.",
    file: "/ebooks/taktik-strategi.pdf",
    kategori: "Taktik",
    ukuran: "0,8 MB",
    halaman: "8 hal",
    tahun: "2024",
    tersedia: true,
  },
  {
    id: "peraturan-komunitas",
    judul: "Peraturan Komunitas BLUNDER SKUAD",
    deskripsi:
      "Tata tertib anggota, kode etik komunitas, hak dan kewajiban, serta mekanisme sanksi pelanggaran.",
    file: "/ebooks/peraturan-komunitas.pdf",
    kategori: "Regulasi",
    ukuran: "0,8 MB",
    halaman: "6 hal",
    tahun: "2024",
    tersedia: true,
  },
  {
    id: "materi-lanjutan",
    judul: "Materi Lanjutan - Endgame & Strategi",
    deskripsi:
      "Konsep endgame dasar, struktur pion, evaluasi posisi, dan rencana permainan untuk tingkat lanjut.",
    file: "/ebooks/materi-lanjutan.pdf",
    kategori: "Strategi",
    ukuran: "-",
    halaman: "-",
    tahun: "2025",
    tersedia: false,
  },
];

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

export default function EbookPanduan() {
  const [pdfAktif, setPdfAktif] = useState(null);
  const [kategoriAktif, setKategoriAktif] = useState("Semua");

  const kategoriList = useMemo(() => {
    const set = new Set(DAFTAR_EBOOK.map((b) => b.kategori));
    return ["Semua", ...Array.from(set)];
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

  return (
    <BagianBeranda id="ebook-catur" title="E-Book & Panduan">
      <div className="max-w-[720px]">
        <p>
          Pusat dokumen resmi komunitas. Semua materi tersedia dalam format PDF — bisa dibaca langsung di browser
          tanpa aplikasi tambahan, dan bisa diunduh untuk dibaca offline.
        </p>
        <p className="mt-3 text-[13px] leading-6 text-slate-500">
          File disimpan di folder <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px]">public/ebooks/</code>.
          Untuk menambah e-book baru, cukup taruh file PDF di folder tersebut dan tambah entri di daftar.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        <span className="mr-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Filter:</span>
        {kategoriList.map((k) => {
          const aktif = k === kategoriAktif;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKategoriAktif(k)}
              className={
                aktif
                  ? "rounded-full bg-[#0B2F9F] px-3.5 py-1.5 text-[12px] font-semibold text-white"
                  : "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }
            >
              {k}
            </button>
          );
        })}
        <span className="ml-auto text-[12px] text-slate-500">{daftarTampil.length} dokumen</span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {daftarTampil.map((buku) => (
          <div
            key={buku.id}
            className="flex gap-4 rounded-lg border border-[#E2E8F0] bg-white p-4"
          >
            <div className="hidden sm:block">
              <PdfIcon />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[14px] font-semibold leading-5 text-slate-900">
                  {buku.judul}
                </h3>
                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  {buku.kategori}
                </span>
              </div>

              <p className="mt-1.5 line-clamp-2 text-[13px] leading-[20px] text-slate-600">
                {buku.deskripsi}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-4 text-slate-500">
                <span>{buku.tahun}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                <span>{buku.ukuran}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                <span>{buku.halaman}</span>
                {!buku.tersedia && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                      Segera hadir
                    </span>
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  disabled={!buku.tersedia}
                  onClick={() => buku.tersedia && setPdfAktif(buku)}
                  className={
                    buku.tersedia
                      ? "inline-flex items-center gap-1.5 rounded-md bg-[#0B2F9F] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#0a2a8e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2F9F]"
                      : "inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3.5 py-2 text-[12px] font-semibold text-slate-400"
                  }
                >
                  <IkonBaca />
                  Baca
                </button>

                {buku.tersedia ? (
                  <a
                    href={buku.file}
                    download
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                  >
                    <IkonUnduh />
                    Unduh
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-200 px-3.5 py-2 text-[12px] font-medium text-slate-400">
                    Belum tersedia
                  </span>
                )}

                {buku.tersedia && (
                  <a
                    href={buku.file}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ml-auto text-[11px] font-medium text-slate-500 hover:text-[#0B2F9F] hover:underline"
                  >
                    Buka tab baru
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-[13px] font-semibold text-slate-900">Catatan untuk pengurus</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[13px] leading-6 text-slate-600">
          <li>
            Letakkan file PDF di <code className="rounded bg-white px-1 py-0.5 ring-1 ring-slate-200">public/ebooks/</code>.
          </li>
          <li>
            Tambah data di <code className="rounded bg-white px-1 py-0.5 ring-1 ring-slate-200">src/halaman/Beranda/EbookPanduan.jsx</code> bagian{" "}
            <code className="rounded bg-white px-1 py-0.5 ring-1 ring-slate-200">DAFTAR_EBOOK</code>.
          </li>
          <li>Nama file harus sama persis dengan yang ada di entri (case-sensitive).</li>
          <li>Jika <code>tersedia: false</code>, tombol baca & unduh otomatis nonaktif dan tampil label “Segera hadir”.</li>
        </ol>
      </div>

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
                href={pdfAktif.file}
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
                src={pdfAktif.file}
                className="h-full w-full flex-1 border-0"
              />
            </div>
            <div className="mx-auto mt-3 flex w-full max-w-[1024px] items-center justify-between text-[11px] text-white/70">
              <span>
                Jika PDF tidak tampil,{" "}
                <a href={pdfAktif.file} target="_blank" rel="noreferrer noopener" className="underline hover:text-white">
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
    </BagianBeranda>
  );
}
