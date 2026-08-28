import { useState } from "react";
import {
  loginAdmin,
  tokenPengurus,
  adminPengguna,
} from "../../lib/api/index.js";

/**
 * Gerbang masuk dashboard pengurus — metode umum.
 *
 * Sekarang pakai username + password sederhana:
 *   bawaan: admin / admin123
 *   ubah via env KCI_ADMIN_USER / KCI_ADMIN_PASSWORD di server.
 *
 * Kompatibel dengan token lama: bila password diisi token lama, tetap bisa masuk.
 */
export default function Gerbang({ onMasuk }) {
  const [nama, setNama] = useState(adminPengguna.ambil() || "admin");
  const [sandi, setSandi] = useState("");
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [lihat, setLihat] = useState(false);

  const namaBersih = nama.trim().toLowerCase();
  const namaValid = /^[a-z0-9_-]{3,25}$/.test(namaBersih);

  const masuk = async (e) => {
    e.preventDefault();
    if (!namaValid) {
      setGalat("Masukkan username yang valid (3–25 karakter, huruf/angka/_/-).");
      return;
    }
    if (!sandi) {
      setGalat("Masukkan password.");
      return;
    }
    setSibuk(true);
    setGalat("");
    try {
      const hasil = await loginAdmin(namaBersih, sandi);
      // Simpan token & identitas untuk semua request /api/pengurus/*
      tokenPengurus.simpan(hasil.token);
      adminPengguna.simpan(hasil.username || namaBersih);
      onMasuk(hasil.username || namaBersih);
    } catch (err) {
      tokenPengurus.hapus();
      // jangan hapus username agar mudah koreksi password
      setGalat(
        err.status === 401
          ? "Username atau password salah. Bawaan: admin / admin123"
          : err.status === 429
            ? "Terlalu banyak percobaan gagal. Tunggu beberapa saat."
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
        className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-bold text-slate-900">Dashboard Pengurus</h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Masuk dengan username dan password pengurus untuk mengelola keanggotaan,
          daftar larangan, dan turnamen.
        </p>

        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
          <strong>Bawaan:</strong> <code className="font-mono">admin / admin123</code>
          <br />
          Ganti password lewat env <code className="font-mono">KCI_ADMIN_PASSWORD</code> di server.
        </div>

        <label className="mt-5 flex flex-col gap-1.5 text-sm text-slate-700">
          Username
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="admin"
            className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>

        <label className="mt-4 flex flex-col gap-1.5 text-sm text-slate-700">
          Password
          <div className="flex gap-2">
            <input
              type={lihat ? "text" : "password"}
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              autoComplete="current-password"
              placeholder="admin123"
              className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setLihat((v) => !v)}
              className="rounded border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
              tabIndex={-1}
            >
              {lihat ? "Sembunyi" : "Lihat"}
            </button>
          </div>
        </label>

        {galat && (
          <p className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
            {galat}
          </p>
        )}

        <button
          type="submit"
          disabled={sibuk || !sandi || !namaValid}
          className="mt-5 w-full rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40"
        >
          {sibuk ? "Memeriksa…" : "Masuk"}
        </button>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Login tersimpan hanya selama tab ini terbuka. Tekan Keluar setelah selesai
          bila memakai komputer bersama.
        </p>
      </form>
    </div>
  );
}
