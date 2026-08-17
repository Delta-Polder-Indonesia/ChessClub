import { useState } from "react";

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
      className={`rounded-full border border-solid font-semibold transition-colors ${gaya} ${
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

export function Avatar({ username }) {
  const [gagal, setGagal] = useState(false);
  if (gagal) {
    return (
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
        {username.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={`https://images.chesscom.com/uploads/user/${username}.jpg`}
      alt={username}
      className="h-9 w-9 rounded-full object-cover bg-slate-200 shrink-0"
      onError={() => setGagal(true)}
    />
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
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${warnaTeks}`}>{nilai}</p>
      {catatan && <p className="mt-0.5 text-xs text-slate-500">{catatan}</p>}
    </div>
  );
}
