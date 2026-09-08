import { useEffect, useRef, useState } from "react";
import { tebusUnduhanEbook, ajukanMintaEbook } from "../../lib/api/ebook.js";
import { urlEbook } from "../../lib/asets.js";

function IkonTutup() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IkonCentang() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="1.6" />
      <path d="M8 12.5L11 15.5L16 9.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IkonKirim() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Popup gerbang unduh e-book — model perpustakaan.
 *
 * Dua tab sesuai alurnya:
 *   - "Ajukan kode": pengunjung yang belum punya kode mengirim permintaan
 *     (nama asli + akun Chess.com) ke pengurus. Pengurus menyetujuinya di
 *     dashboard, lalu mengirimkan kode lewat jalur lain (mis. grup WA).
 *   - "Sudah punya kode": peminjam memasukkan kode dari pengurus; bila sah,
 *     unduhan tercatat (siapa, akunnya, buku apa) dan PDF dikirim.
 */
export default function ModalUnduhEbook({ buku, onTutup }) {
  const [tab, setTab] = useState("minta");
  const [nama, setNama] = useState("");
  const [akun, setAkun] = useState("");
  const [kode, setKode] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [tercatat, setTercatat] = useState(null);
  const [mintaTerkirim, setMintaTerkirim] = useState(false);
  const namaRef = useRef(null);

  useEffect(() => {
    const gulirTadi = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const jam = setTimeout(() => namaRef.current?.focus(), 60);
    const onEsc = (e) => {
      if (e.key === "Escape") onTutup();
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = gulirTadi;
      clearTimeout(jam);
      window.removeEventListener("keydown", onEsc);
    };
  }, [onTutup]);

  function bersihkanGalat() {
    if (galat) setGalat("");
  }

  async function kirimPermintaan(e) {
    e.preventDefault();
    if (sibuk) return;
    setGalat("");

    if (!nama.trim() || !akun.trim()) {
      setGalat("Lengkapi nama asli dan akun Chess.com.");
      return;
    }

    setSibuk(true);
    try {
      await ajukanMintaEbook({
        nama: nama.trim(),
        akunChess: akun.trim(),
        bukuId: buku.id,
        judul: buku.judul,
      });
      setMintaTerkirim(true);
    } catch (e2) {
      setGalat(e2.message || "Permintaan tidak bisa dikirim. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  async function tebusDanUnduh(e) {
    e.preventDefault();
    if (sibuk) return;
    setGalat("");

    if (!nama.trim() || !akun.trim() || !kode.trim()) {
      setGalat("Lengkapi nama, akun Chess.com, dan kode akses.");
      return;
    }

    setSibuk(true);
    try {
      const catatan = await tebusUnduhanEbook({
        kode: kode.trim(),
        nama: nama.trim(),
        akunChess: akun.trim(),
        bukuId: buku.id,
        judul: buku.judul,
      });
      setTercatat(catatan);

      // Kode sah — kirim berkasnya ke browser.
      const taut = document.createElement("a");
      taut.href = urlEbook(buku.file, { unduh: true });
      taut.download = "";
      document.body.appendChild(taut);
      taut.click();
      taut.remove();
    } catch (e2) {
      setGalat(e2.message || "Kode tidak bisa ditebus. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  const pilihTab = (pilihan) => {
    setTab(pilihan);
    bersihkanGalat();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-unduh-ebook"
        className="w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id="judul-unduh-ebook" className="m-0 text-[15px] font-bold text-slate-900">
              Unduh e-book
            </h2>
            <p className="m-0 mt-0.5 truncate text-[12px] text-slate-500">{buku.judul}</p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <IkonTutup />
          </button>
        </div>

        {tercatat ? (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <IkonCentang />
            <p className="m-0 text-[14px] font-bold text-slate-900">Unduhan dimulai.</p>
            <p className="m-0 text-[12px] leading-5 text-slate-600">
              Tercatat di buku kunjungan: <strong>{tercatat.nama}</strong> ({" "}
              {tercatat.akunChess} ) mengunduh “{tercatat.judul}”.
            </p>
            <a
              href={urlEbook(buku.file, { unduh: true })}
              download
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0B2F9F] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#0a2a8e]"
            >
              Unduh lagi bila tidak berjalan
            </a>
            <button
              type="button"
              onClick={onTutup}
              className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:text-slate-900"
            >
              Tutup
            </button>
          </div>
        ) : mintaTerkirim ? (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <IkonCentang />
            <p className="m-0 text-[14px] font-bold text-slate-900">
              Permintaan terkirim ke pengurus.
            </p>
            <p className="m-0 text-[12px] leading-5 text-slate-600">
              Tunggu kode akses dikirimkan oleh pengurus (mis. lewat grup
              WhatsApp). Setelah kodenya diterima, buka popup ini lagi lalu
              pilih <strong>“Sudah punya kode”</strong> untuk mulai mengunduh.
            </p>
            <button
              type="button"
              onClick={onTutup}
              className="mt-1 rounded-md bg-[#0B2F9F] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#0a2a8e]"
            >
              Mengerti
            </button>
          </div>
        ) : (
          <div className="px-5 pb-5 pt-4">
            {/* Pemilih tab — gaya pil, seperti filter kategori di katalog. */}
            <div
              role="tablist"
              aria-label="Cara mendapatkan kode akses"
              className="mb-4 flex w-full items-center gap-1 rounded-full bg-slate-200 p-1"
            >
              {[
                ["minta", "Belum punya kode"],
                ["kode", "Sudah punya kode"],
              ].map(([nilai, label]) => (
                <button
                  key={nilai}
                  type="button"
                  role="tab"
                  aria-selected={tab === nilai}
                  onClick={() => pilihTab(nilai)}
                  className={
                    tab === nilai
                      ? "w-1/2 rounded-full bg-[#0B2F9F] px-3 py-1.5 text-[12px] font-semibold text-white"
                      : "w-1/2 rounded-full px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:text-slate-900"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {galat && (
              <p role="alert" className="m-0 mb-4 rounded-md bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
                {galat}
              </p>
            )}

            {tab === "minta" ? (
              <form className="flex flex-col gap-4" onSubmit={kirimPermintaan} noValidate>
                <p className="m-0 text-[12px] leading-5 text-slate-600">
                  Permintaanmu diteruskan ke pengurus. Setelah disetujui, kode
                  akses dikirimkan ke kamu (lewat grup WA atau jalur lain) dan
                  berlaku 1 jam.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="unduh-nama" className="text-[12px] font-semibold text-slate-700">
                    Nama asli
                  </label>
                  <input
                    ref={namaRef}
                    id="unduh-nama"
                    name="nama"
                    type="text"
                    autoComplete="name"
                    maxLength={80}
                    placeholder="cth. Budi Santoso"
                    value={nama}
                    onChange={(e) => {
                      setNama(e.target.value);
                      bersihkanGalat();
                    }}
                    className="rounded-md border border-slate-300 px-3 py-2 text-[13px] outline-none focus:border-[#0B2F9F] focus:ring-2 focus:ring-[#0B2F9F]/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="unduh-akun" className="text-[12px] font-semibold text-slate-700">
                    Akun Chess.com
                  </label>
                  <input
                    id="unduh-akun"
                    name="akunChess"
                    type="text"
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={25}
                    placeholder="cth. budichess99"
                    value={akun}
                    onChange={(e) => {
                      setAkun(e.target.value);
                      bersihkanGalat();
                    }}
                    className="rounded-md border border-slate-300 px-3 py-2 text-[13px] outline-none focus:border-[#0B2F9F] focus:ring-2 focus:ring-[#0B2F9F]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sibuk}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-[#0B2F9F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0a2a8e] disabled:opacity-50"
                >
                  <IkonKirim />
                  {sibuk ? "Mengirim…" : "Kirim permintaan ke pengurus"}
                </button>
              </form>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={tebusDanUnduh} noValidate>
                <p className="m-0 text-[12px] leading-5 text-slate-600">
                  Masukkan kode dari pengurus. Setiap unduhan tercatat seperti
                  buku kunjungan perpustakaan.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="unduh-nama" className="text-[12px] font-semibold text-slate-700">
                    Nama asli
                  </label>
                  <input
                    ref={namaRef}
                    id="unduh-nama"
                    name="nama"
                    type="text"
                    autoComplete="name"
                    maxLength={80}
                    placeholder="cth. Budi Santoso"
                    value={nama}
                    onChange={(e) => {
                      setNama(e.target.value);
                      bersihkanGalat();
                    }}
                    className="rounded-md border border-slate-300 px-3 py-2 text-[13px] outline-none focus:border-[#0B2F9F] focus:ring-2 focus:ring-[#0B2F9F]/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="unduh-akun" className="text-[12px] font-semibold text-slate-700">
                    Akun Chess.com
                  </label>
                  <input
                    id="unduh-akun"
                    name="akunChess"
                    type="text"
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={25}
                    placeholder="cth. budichess99"
                    value={akun}
                    onChange={(e) => {
                      setAkun(e.target.value);
                      bersihkanGalat();
                    }}
                    className="rounded-md border border-slate-300 px-3 py-2 text-[13px] outline-none focus:border-[#0B2F9F] focus:ring-2 focus:ring-[#0B2F9F]/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="unduh-kode" className="text-[12px] font-semibold text-slate-700">
                    Kode akses
                  </label>
                  <input
                    id="unduh-kode"
                    name="kode"
                    type="text"
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={12}
                    placeholder="cth. EBK-7F3K2M9Q"
                    value={kode}
                    onChange={(e) => {
                      setKode(e.target.value.toUpperCase());
                      bersihkanGalat();
                    }}
                    className="rounded-md border border-slate-300 px-3 py-2 font-mono text-[13px] tracking-wide outline-none focus:border-[#0B2F9F] focus:ring-2 focus:ring-[#0B2F9F]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sibuk}
                  className="mt-1 inline-flex items-center justify-center rounded-md bg-[#0B2F9F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0a2a8e] disabled:opacity-50"
                >
                  {sibuk ? "Memeriksa kode…" : "Mulai unduh"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
