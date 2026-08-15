import { useCallback, useEffect, useState } from "react";
import { apiPengurus, tokenPengurus } from "../lib/chessAnggota.js";
import { LoadingSpinner } from "./Loading.jsx";
import Gerbang from "../halaman/Pengurus/Gerbang.jsx";

/**
 * Pelindung rute pengurus.
 *
 * Menebak URL /pengurus secara manual tidak lagi cukup: sebelum anak dirender,
 * token di sessionStorage DIVERIFIKASI ULANG ke server (/api/pengurus/ringkasan).
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
      await apiPengurus("/ringkasan");
      setStatus("terverifikasi");
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        // Token tidak sah: buang agar tidak dipakai ulang.
        tokenPengurus.hapus();
      }
      setStatus("tanpa-akses");
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

  if (status === "tanpa-akses") {
    return <Gerbang onMasuk={() => setStatus("terverifikasi")} />;
  }

  return children;
}
