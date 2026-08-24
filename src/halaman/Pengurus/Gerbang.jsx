import { useState } from "react";
import {
  apiPengurus,
  tokenPengurus,
  adminPengguna,
} from "../../lib/api/index.js";

/**
 * Gerbang masuk dashboard pengurus.
 *
 * Meminta username Chess.com (identitas siapa yang masuk, untuk jejak
 * audit) DAN token pengurus. Token diverifikasi ke server; username
 * ikut dikirim pada setiap aksi agar server tahu siapa yang melakukannya.
 */
export default function Gerbang({ onMasuk }) {
  const [nama, setNama] = useState(adminPengguna.ambil());
  const [token, setToken] = useState("");
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const namaBersih = nama.trim().toLowerCase();
  const namaValid = /^[a-z0-9_-]{3,25}$/.test(namaBersih);

  const masuk = async (e) => {
    e.preventDefault();
    if (!namaValid) {
      setGalat("Masukkan username Chess.com yang valid (3–25 karakter).");
      return;
    }
    setSibuk(true);
    setGalat("");
    // Simpan identitas lebih dulu agar header X-Admin-User terisi pada
    // panggilan verifikasi. Endpoint /verifikasi dipilih karena tidak
    // memanggil Chess.com — gerbang tetap bisa dimasuki saat API
    // Chess.com sedang tidak terjangkau.
    adminPengguna.simpan(namaBersih);
    tokenPengurus.simpan(token.trim());
    try {
      await apiPengurus("/verifikasi");
      onMasuk(namaBersih);
    } catch (err) {
      tokenPengurus.hapus();
      adminPengguna.hapus();
      setGalat(
        err.status === 401
          ? "Token pengurus tidak dikenali."
          : err.status === 429
            ? "Terlalu banyak percobaan. Tunggu beberapa saat."
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
          Masukkan username Chess.com dan token pengurus untuk mengelola
          keanggotaan, daftar larangan, dan turnamen.
        </p>

        <label className="mt-5 flex flex-col gap-1.5 text-sm text-slate-700">
          Nama akun Chess.com
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="contoh: magnuscarlsen"
            className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <span className="text-xs text-slate-500">
            Untuk identifikasi & jejak audit — bukan kata sandi.
          </span>
        </label>

        <label className="mt-4 flex flex-col gap-1.5 text-sm text-slate-700">
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
          disabled={sibuk || !token.trim() || !namaValid}
          className="mt-5 w-full rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
        >
          {sibuk ? "Memeriksa…" : "Masuk"}
        </button>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Identitas dan token tersimpan hanya selama tab ini terbuka.
        </p>
      </form>
    </div>
  );
}
