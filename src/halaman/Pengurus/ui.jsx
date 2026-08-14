/**
 * Komponen kecil yang dipakai bersama oleh Dashboard dan PanelTurnamen.
 *
 * Sengaja diletakkan di berkas sendiri: sebelumnya Tombol dan Bidang tinggal
 * di Dashboard.jsx, sementara Dashboard.jsx sendiri mengimpor PanelTurnamen —
 * lingkaran impor yang membuat pesan galat menuding modul keliru dan
 * gampang rusak saat hot-reload.
 */

export function Tombol({ anak, onClick, jenis = "biasa", kecil, ...sisa }) {
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
      }`}
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
