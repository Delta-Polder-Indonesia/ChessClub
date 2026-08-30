import { useState } from "react";
import {
  loginAdmin,
  tokenPengurus,
  adminPengguna,
  peranPengurus,
} from "../../lib/api/index.js";
import Logo from "../../components/Logo.jsx";

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
      // Simpan token, identitas, dan peran untuk semua request /api/pengurus/*
      tokenPengurus.simpan(hasil.token);
      adminPengguna.simpan(hasil.username || namaBersih);
      peranPengurus.simpan(hasil.role || "pengurus");
      onMasuk(hasil.username || namaBersih);
    } catch (err) {
      tokenPengurus.hapus();
      // jangan hapus username agar mudah koreksi password
      //
      // fetch melempar TypeError bila respons diblokir CORS atau server tidak
      // terjangkau — body 403 kiriman server tidak bisa dibaca browser, jadi
      // pesan galatnya harus menjelaskan sendiri kemungkinan penyebabnya.
      const terblokir =
        !err?.status &&
        (err instanceof TypeError || err?.name === "TypeError");
      setGalat(
        err.status === 401
          ? "Username atau password salah. Cek KCI_ADMIN_USER / KCI_ADMIN_PASSWORD di Vercel atau server."
          : err.status === 429
            ? "Terlalu banyak percobaan gagal. Tunggu beberapa saat."
            : terblokir
              ? "Permintaan login tidak sampai ke server (diblokir browser). " +
                "Penyebab paling umum: domain ini belum terdaftar di env " +
                "KCI_ASAL_DIIZINKAN, atau VITE_API_DASAR masih menunjuk backend lain. " +
                "Perbaiki env-nya lalu Redeploy."
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
        className="mt-10 w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="flex justify-center">
          <Logo variant="dark" size="md" />
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">Masuk Dashboard Pengurus</h1>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Masuk untuk mengelola keanggotaan, daftar larangan, dan turnamen.
          </p>
        </div>

        <label htmlFor="gerbang-user" className="mt-6 block text-sm font-semibold text-slate-700">
          Username
        </label>
        <input
          id="gerbang-user"
          type="text"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck="false"
          placeholder="admin"
          className="mt-1 w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none focus:border-primary"
        />

        <label htmlFor="gerbang-sandi" className="mt-5 block text-sm font-semibold text-slate-700">
          Password
        </label>
        <div className="mt-1 flex items-center gap-2 border-b border-slate-300 transition-colors focus-within:border-primary">
          <input
            id="gerbang-sandi"
            type={lihat ? "text" : "password"}
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
            autoComplete="current-password"
            placeholder="admin123"
            className="w-full border-0 bg-transparent py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => setLihat((v) => !v)}
            tabIndex={-1}
            className="shrink-0 text-xs font-semibold text-slate-500 hover:text-primary"
          >
            {lihat ? "Sembunyi" : "Lihat"}
          </button>
        </div>

        {galat && (
          <p className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
            {galat}
          </p>
        )}

        <button
          type="submit"
          disabled={sibuk || !sandi || !namaValid}
          className="mt-6 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {sibuk ? "Memeriksa…" : "Masuk"}
        </button>

        <p className="mt-4 text-center text-xs leading-5 text-slate-400">
          Login tersimpan hanya selama tab terbuka. Silakan Keluar bila memakai komputer bersama.
        </p>
      </form>
    </div>
  );
}
