import { useCallback, useEffect, useState } from "react";
import { apiPengurus, tokenPengurus } from "../lib/api/index.js";
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
      // Validasi sisi server — sumber kebenaran satu-satunya.
      await apiPengurus("/verifikasi");
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-6 text-center">
        <h1 className="text-lg font-bold text-slate-900">
          Tidak dapat menghubungi server
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Token Anda masih tersimpan, tetapi verifikasi ke server gagal
          (mis. Chess.com sedang tidak dapat dihubungi). Coba lagi beberapa
          saat lagi.
        </p>
        <button
          type="button"
          onClick={periksa}
          className="mt-5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white hover:opacity-90"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (status === "tanpa-akses") {
    return <Gerbang onMasuk={() => setStatus("terverifikasi")} />;
  }

  return children;
}
