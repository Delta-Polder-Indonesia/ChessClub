import { useEffect, useRef, useState } from "react";
import { tebusUnduhanEbook } from "../../lib/api/ebook.js";
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

/**
 * Popup gerbang unduh e-book — model perpustakaan.
 *
 * Pengunjung mengisi nama asli, akun Chess.com, dan kode akses dari
 * pengurus (berlaku 1 jam). Kode diteruskan ke POST /api/ebook/tebus;
 * kalau sah, unduhan dicatat lalu berkas PDF dikirim ke browser.
 */
export default function ModalUnduhEbook({ buku, onTutup }) {
  const [nama, setNama] = useState("");
  const [akun, setAkun] = useState("");
  const [kode, setKode] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [tercatat, setTercatat] = useState(null);
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

  async function kirim(e) {
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
        ) : (
          <form className="flex flex-col gap-4 px-5 py-5" onSubmit={kirim} noValidate>
            <p className="m-0 text-[12px] leading-5 text-slate-600">
              Unduhan dicatat seperti buku kunjungan perpustakaan. Masukkan kode
              akses dari pengurus — berlaku 1 jam sejak diterbitkan.
            </p>

            {galat && (
              <p role="alert" className="m-0 rounded-md bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
                {galat}
              </p>
            )}

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
                onChange={(e) => setNama(e.target.value)}
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
                onChange={(e) => setAkun(e.target.value)}
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
                onChange={(e) => setKode(e.target.value.toUpperCase())}
                className="rounded-md border border-slate-300 px-3 py-2 font-mono text-[13px] tracking-wide outline-none focus:border-[#0B2F9F] focus:ring-2 focus:ring-[#0B2F9F]/20"
              />
            </div>

            <button
              type="submit"
              disabled={sibuk}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-[#0B2F9F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0a2a8e] disabled:opacity-50"
            >
              {sibuk ? "Memeriksa kode…" : "Mulai unduh"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
