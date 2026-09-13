import { useCallback, useEffect, useState } from "react";
import { apiPengurus, tokenPengurus, adminPengguna, peranPengurus } from "../lib/api/index.js";
import { LoadingSpinner } from "./Loading.jsx";
import Gerbang from "../halaman/Pengurus/Gerbang.jsx";

/**
 * Pelindung rute pengurus.
 *
 * Menebak URL /pengurus secara manual tidak lagi cukup: sebelum anak dirender,
 * token di sessionStorage DIVERIFIKASI ULANG ke server lewat endpoint ringan
 * /api/pengurus/verifikasi (sengaja BUKAN /ringkasan supaya login tidak ikut
 * gagal saat api.chess.com padam — data panel dimuat terpisah setelah
 * dashboard terbuka).
 * Token kosong, kedaluwarsa, atau palsu (mis. disuntikkan lewat DevTools)
 * langsung dibuang dan pengguna diarahkan ke gerbang login.
 *
 * Status:
 *  - "memeriksa"     → tampilkan spinner selagi token dicek ke server
 *  - "terverifikasi" → render children (dashboard)
 *  - "tanpa-akses"   → render Gerbang; setelah login sah, cek ulang
 */
export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("memeriksa");

  const periksa = useCallback(async () => {
    const token = tokenPengurus.ambil();
    if (!token) {
      setStatus("tanpa-akses");
      return;
    }
    setStatus("memeriksa");
    try {
      // Validasi sisi server — sumber kebenaran satu-satunya, juga ambil role.
      const data = await apiPengurus("/verifikasi");
      if (data?.role) peranPengurus.simpan(data.role);
      if (data?.username) adminPengguna.simpan(data.username);
      setStatus("terverifikasi");
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        // Token tidak sah: buang agar tidak dipakai ulang.
        tokenPengurus.hapus();
        setStatus("tanpa-akses");
        return;
      }
      // 5xx / jaringan / Chess.com sementara tak terjangkau BUKAN
      // alasan untuk menendang pengguna keluar. Tampilkan pesan dan
      // izinkan mencoba lagi — jangan kunci dashboard seumur hidup
      // hanya karena layanan pihak ketiga sedang down.
      setStatus("galat");
    }
  }, []);

  useEffect(() => {
    periksa();
  }, [periksa]);

  if (status === "memeriksa") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner label="Memeriksa akses…" />
      </div>
    );
  }

  if (status === "galat") {
    return (
      <>
        <Gerbang onMasuk={() => setStatus("terverifikasi")} />
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Tidak dapat menghubungi server"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">
              Tidak dapat menghubungi server
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Token Anda masih tersimpan, tetapi verifikasi ke server gagal
              (mis. Chess.com sedang tidak dapat dihubungi). Coba lagi beberapa
              saat lagi.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  tokenPengurus.hapus();
                  setStatus("tanpa-akses");
                }}
                className="rounded-md border-2 border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Keluar
              </button>
              <button
                type="button"
                onClick={periksa}
                className="rounded-md border-2 border-primary px-4 py-1.5 text-xs font-semibold text-primary hover:bg-blue-50"
              >
                Coba lagi
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (status === "tanpa-akses") {
    return <Gerbang onMasuk={() => setStatus("terverifikasi")} />;
  }

  return children;
}
