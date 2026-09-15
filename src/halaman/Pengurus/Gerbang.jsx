import { useState } from "react";
import {
  loginAdmin,
  tokenPengurus,
  adminPengguna,
  peranPengurus,
} from "../../lib/api/index.js";
import Logo from "../../components/Logo.jsx";
import Eye from "../Analisa/komponen/svg/eye.jsx";
import EyeClosed from "../Analisa/komponen/svg/eye-closed.jsx";
import User from "../Analisa/komponen/svg/user.jsx";
import LockKeyhole from "../Analisa/komponen/svg/lock-keyhole.jsx";

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

        <div className="relative mt-6 flex items-center gap-2 border-b border-slate-300 transition-colors focus-within:border-primary">
          <User className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            id="gerbang-user"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            placeholder=" "
            className="peer w-full border-0 bg-transparent pb-1.5 pt-5 text-sm outline-none"
          />
          <label
            htmlFor="gerbang-user"
            className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 transition-all duration-150 peer-focus:top-0 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-slate-700"
          >
            Username
          </label>
        </div>

        <div className="relative mt-5 flex items-center gap-2 border-b border-slate-300 transition-colors focus-within:border-primary">
          <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            id="gerbang-sandi"
            type={lihat ? "text" : "password"}
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
            autoComplete="current-password"
            placeholder=" "
            className="peer w-full border-0 bg-transparent pb-1.5 pt-5 text-sm outline-none"
          />
          <label
            htmlFor="gerbang-sandi"
            className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 transition-all duration-150 peer-focus:top-0 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-slate-700"
          >
            Password
          </label>
          <button
            type="button"
            onClick={() => setLihat((v) => !v)}
            tabIndex={-1}
            aria-label={lihat ? "Sembunyikan password" : "Lihat password"}
            className="shrink-0 text-slate-500 hover:text-primary"
          >
            {lihat ? (
              <Eye className="h-[18px] w-[18px]" />
            ) : (
              <EyeClosed className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>

        {galat && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Gagal masuk"
            onClick={() => setGalat("")}
          >
            <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
              <h2 className="text-base font-bold text-slate-900">Gagal masuk</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{galat}</p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setGalat("")}
                  className="rounded-md border-2 border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={sibuk || !sandi || !namaValid}
          className="mt-6 w-full rounded-md border-2 border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
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
