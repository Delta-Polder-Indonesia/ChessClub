import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Pencil, Trash2, X } from "lucide-react";

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
      className={`rounded-md border-2 border-solid font-semibold ${gaya} ${
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
        className="rounded border-2 border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        {...sisa}
      />
    </label>
  );
}

/**
 * Kotak galat muat data panel: pesan yang TETAP TAMPIL sampai berhasil,
 * plus tombol coba lagi. Tanpa ini, kegagalan muat hanya menghasilkan toast
 * 8 detik lalu tabel kosong dibaca sebagai "belum ada data" (menyesatkan).
 */
export function KotakGalatMuat({ pesan, onCobaLagi, className = "" }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-white px-4 py-3 ${className}`}
    >
      <p className="text-sm font-medium text-red-800">{pesan}</p>
      {onCobaLagi && (
        <Tombol
          jenis="bahaya"
          onClick={onCobaLagi}
          className="shrink-0 bg-white hover:bg-red-100"
        >
          Coba Lagi
        </Tombol>
      )}
    </div>
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
   *
   * Gaya meniru Avatar neobrutalism (port `avatar.tsx`): lingkaran dengan
   * outline hitam 2px, gambar mengisi penuh, fallback inisial putih-hitam.
   */
  if (!foto || gagal) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-black outline-2 outline-black">
        {username.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={foto}
      alt={username}
      width={36}
      height={36}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="size-9 shrink-0 overflow-hidden rounded-full bg-slate-200 object-cover outline-2 outline-black"
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
className="rounded-md border-2 border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
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

/**
 * Menu aksi "..." satu baris tabel, gaya dropdown-menu template neobrutalism
 * (trigger ikon MoreHorizontal + konten rata kanan). Ditonjolkan lewat portal
 * agar tak terpotong wadah tabel yang overflow-auto.
 *
 * Tanpa prop `aksi`, menu berisi Ubah/Hapus (perilaku lama). Dengan `aksi`
 * (daftar { label, Ikon, onClick, bahaya, disabled }), isi menu ditentukan
 * pemanggil — dipakai panel Anggota untuk aksi kontak/blokir.
 */
export function MenuAksi({ onUbah, onHapus, aksi }) {
  const [terbuka, setTerbuka] = useState(false);
  const [posisi, setPosisi] = useState(null);
  const tombolRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!terbuka) return;
    const el = tombolRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPosisi({
      top: r.bottom + 4,
      right: window.innerWidth - r.right,
    });
  }, [terbuka]);

  useEffect(() => {
    if (!terbuka) return;
    function cekKlik(e) {
      if (tombolRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setTerbuka(false);
    }
    function cekEsc(e) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", cekKlik);
    document.addEventListener("keydown", cekEsc);
    return () => {
      document.removeEventListener("mousedown", cekKlik);
      document.removeEventListener("keydown", cekEsc);
    };
  }, [terbuka]);

  const daftar = aksi || [
    { label: "Ubah", Ikon: Pencil, onClick: onUbah },
    { label: "Hapus", Ikon: Trash2, onClick: onHapus, bahaya: true },
  ];

  return (
    <div ref={tombolRef} className="inline-flex">
      <button
        type="button"
        onClick={() => setTerbuka((t) => !t)}
        aria-haspopup="menu"
        aria-expanded={terbuka}
        aria-label="Menu aksi"
        className="inline-flex size-8 items-center justify-center rounded-md border-2 border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
      >
        <span className="sr-only">Buka menu aksi</span>
        <MoreHorizontal className="size-4" />
      </button>
      {terbuka &&
        posisi &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Menu aksi"
            style={{ top: posisi.top, right: posisi.right }}
            className="fixed z-50 min-w-[8rem] rounded-md border border-slate-200 bg-white p-1 shadow-lg"
          >
            {daftar.map(({ label, Ikon, onClick, bahaya, disabled }) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={() => {
                  setTerbuka(false);
                  onClick?.();
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm disabled:opacity-40 ${
                  bahaya
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Ikon className="size-4" />
                {label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * Panel geser dari kiri (mirip Sheet template neobrutalism, side="left").
 * Muncul dari tepi kiri dari bagian sidebar; ditonjolkan via portal, dengan
 * overlay, tombol tutup, dan area konten + kaki yang bisa digulir.
 */
export function Sheet({
  terbuka,
  judul,
  anak,
  kaki,
  onTutup,
  sibuk = false,
  children,
}) {
  useEffect(() => {
    if (!terbuka) return;
    const onEsc = (e) => {
      if (e.key === "Escape" && !sibuk) onTutup?.();
    };
    // Kunci gulir halaman di belakang panel selama terbuka.
    const tadi = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = tadi;
      document.removeEventListener("keydown", onEsc);
    };
  }, [terbuka, sibuk, onTutup]);

  // Panel SELALU ter-render dan hanya digeser lewat transisi transform,
  // sehingga geraknya halus baik saat dibuka maupun ditutup (bukan
  // "muncul mendadak" seperti mount baru dengan animasi saat terbuka).
  return createPortal(
    <div
      aria-hidden={!terbuka}
      className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
        terbuka ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={() => !sibuk && onTutup?.()}
    >
      <div className="absolute inset-0 bg-slate-900/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 top-12 flex w-64 max-w-full flex-col border-r-2 border-slate-200 bg-white transition-transform duration-300 ease-out ${
          terbuka ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b-2 border-slate-200 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">{judul}</h3>
          <button
            type="button"
            onClick={onTutup}
            disabled={sibuk}
            aria-label="Tutup panel"
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children || anak}</div>
        {kaki && (
          <div className="border-t-2 border-slate-200 px-5 py-4">{kaki}</div>
        )}
      </div>
    </div>,
    document.body
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
