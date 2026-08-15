import { useState } from "react";
import { apiPengurus, tokenPengurus } from "../../lib/chessAnggota.js";

/**
 * Gerbang masuk dashboard pengurus.
 *
 * Meminta token pengurus, memvalidasinya ke server (/api/pengurus/ringkasan),
 * lalu memanggil `onMasuk` bila sah. Diekstrak dari Dashboard.jsx supaya bisa
 * dipakai ulang oleh ProtectedRoute tanpa menduplikasi formulir login.
 */
export default function Gerbang({ onMasuk }) {
  const [token, setToken] = useState("");
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const masuk = async (e) => {
    e.preventDefault();
    setSibuk(true);
    setGalat("");
    tokenPengurus.simpan(token.trim());
    try {
      await apiPengurus("/ringkasan");
      onMasuk();
    } catch (err) {
      tokenPengurus.hapus();
      setGalat(
        err.status === 401
          ? "Token pengurus tidak dikenali."
          : err.message || "Gagal masuk."
      );
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6">
      <form
        onSubmit={masuk}
        className="w-full rounded-lg border border-slate-200 bg-white p-6"
      >
        <h1 className="text-xl font-bold text-slate-900">Dashboard Pengurus</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Masukkan token pengurus untuk mengelola keanggotaan, daftar larangan,
          dan turnamen.
        </p>
        <label className="mt-5 flex flex-col gap-1.5 text-sm text-slate-700">
          Token pengurus
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            placeholder="tempel token di sini"
            className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        {galat && (
          <p className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
            {galat}
          </p>
        )}
        <button
          type="submit"
          disabled={sibuk || !token.trim()}
          className="mt-5 w-full rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
        >
          {sibuk ? "Memeriksa…" : "Masuk"}
        </button>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Token tersimpan hanya selama tab ini terbuka.
        </p>
      </form>
    </div>
  );
}
