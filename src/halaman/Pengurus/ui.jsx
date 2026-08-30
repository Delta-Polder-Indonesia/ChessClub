import { useEffect, useRef, useState } from "react";

/**
 * Komponen kecil yang dipakai bersama oleh Dashboard dan PanelTurnamen.
 *
 * Sengaja diletakkan di berkas sendiri: sebelumnya Tombol dan Bidang tinggal
 * di Dashboard.jsx, sementara Dashboard.jsx sendiri mengimpor PanelTurnamen —
 * lingkaran impor yang membuat pesan galat menuding modul keliru dan
 * gampang rusak saat hot-reload.
 */

export function Tombol({ anak, onClick, jenis = "biasa", kecil, className, ...sisa }) {
  const gaya = {
    biasa:
      "border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40",
    utama:
      "border-primary bg-primary text-white hover:opacity-90 disabled:opacity-40",
    bahaya: "border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-40",
  }[jenis];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-solid font-semibold ${gaya} ${
        kecil ? "px-3 py-1 text-xs" : "px-4 py-2 text-xs"
      } ${className || ""}`}
      {...sisa}
    >
      {anak}
    </button>
  );
}

export function Bidang({ label, ...sisa }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
      {label}
      <input
        className="rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        {...sisa}
      />
    </label>
  );
}

export function Avatar({ username, foto }) {
  const [gagal, setGagal] = useState(false);
  /**
   * Sumber foto diambil dari field `foto` data anggota (URL avatar resmi
   * yang diberikan API Chess.com). Pola tebakan
   * images.chesscom.com/uploads/user/{username}.jpg tidak didokumentasikan
   * Chess.com dan hampir selalu 404 — setiap render hanya membuang
   * permintaan sebelum akhirnya jatuh ke inisial.
   */
  if (!foto || gagal) {
    return (
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
        {username.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={foto}
      alt={username}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-9 w-9 rounded-full object-cover bg-slate-200 shrink-0"
      onError={() => setGagal(true)}
    />
  );
}

/**
 * Modal konfirmasi sederhana — pengganti window.confirm/window.prompt
 * yang konsisten dengan gaya dashboard. Mendukung input satu baris
 * opsional (untuk alasan blokir/penolakan).
 */

export function Modal({
  terbuka,
  judul,
  anak,
  labelKonfirmasi = "Konfirmasi",
  labelBatal = "Batal",
  jenisKonfirmasi = "biasa",
  butuhInput = false,
  placeholderInput = "",
  nilaiBawaanInput = "",
  catatanInput = "",
  onKonfirmasi,
  onBatal,
  sibuk = false,
}) {
  const [nilai, setNilai] = useState(nilaiBawaanInput);
  const inputRef = useRef(null);
  const wadahRef = useRef(null);

  /** Fokus elemen pertama yang bisa di-fokus di dalam dialog. */
  const fokusPertama = () => {
    const wadah = wadahRef.current;
    if (!wadah) return;
    const fokus = wadah.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (fokus[0] || wadah).focus?.();
  };

  useEffect(() => {
    if (terbuka) {
      setNilai(nilaiBawaanInput);
      const t = setTimeout(fokusPertama, 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terbuka, nilaiBawaanInput]);

  useEffect(() => {
    if (!terbuka) return;
    const tadi = document.activeElement;
    const onEsc = (e) => {
      if (e.key === "Escape" && !sibuk) onBatal?.();
    };
    // Focus trap: Tab/Shift+Tab berputar di dalam dialog, tidak keluar
    // ke halaman di belakangnya.
    const onTab = (e) => {
      if (e.key !== "Tab") return;
      const wadah = wadahRef.current;
      if (!wadah) return;
      const fokus = [...wadah.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )].filter((el) => !el.disabled);
      if (!fokus.length) return;
      const pertama = fokus[0];
      const terakhir = fokus[fokus.length - 1];
      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault();
        terakhir.focus();
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault();
        pertama.focus();
      }
    };
    document.addEventListener("keydown", onEsc);
    document.addEventListener("keydown", onTab);
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.removeEventListener("keydown", onTab);
      // Kembalikan fokus ke elemen pemicu setelah dialog ditutup.
      if (tadi && typeof tadi.focus === "function") tadi.focus();
    };
  }, [terbuka, sibuk, onBatal]);

  if (!terbuka) return null;

  const warnaTombol =
    jenisKonfirmasi === "bahaya"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-primary hover:opacity-90";

  const bisaKonfirmasi = !sibuk && (!butuhInput || nilai.trim().length > 0);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={judul}
      onClick={() => !sibuk && onBatal?.()}
    >
      <div
        ref={wadahRef}
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-900">{judul}</h3>
        {anak && (
          <div className="mt-2 text-sm leading-6 text-slate-600">{anak}</div>
        )}
        {butuhInput && (
          <label className="mt-4 flex flex-col gap-1 text-xs font-medium text-slate-700">
            Keterangan
            <textarea
              ref={inputRef}
              rows={3}
              value={nilai}
              placeholder={placeholderInput}
              onChange={(e) => setNilai(e.target.value)}
              className="rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
            />
            {catatanInput && (
              <span className="text-xs font-normal text-slate-500">
                {catatanInput}
              </span>
            )}
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onBatal}
            disabled={sibuk}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            {labelBatal}
          </button>
          <button
            type="button"
            onClick={() =>
              onKonfirmasi?.(butuhInput ? nilai.trim() : undefined)
            }
            disabled={!bisaKonfirmasi}
            className={`rounded-full px-4 py-2 text-xs font-bold text-white disabled:opacity-40 ${warnaTombol}`}
          >
            {sibuk ? "Memproses…" : labelKonfirmasi}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Kartu({ label, nilai, catatan, warna = "slate" }) {
  const warnaTeks = {
    slate: "text-slate-900",
    merah: "text-red-700",
    hijau: "text-emerald-700",
    biru: "text-primary",
  }[warna];
  return (
    <div className="flex h-full flex-col pb-3 text-center">
      <p className={`text-2xl font-bold ${warnaTeks}`}>{nilai}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      {catatan && <p className="mt-0.5 text-xs text-slate-500">{catatan}</p>}
      <div className="mx-auto mt-auto w-24 pt-2">
        <div className="border-b border-slate-300"></div>
      </div>
    </div>
  );
}
