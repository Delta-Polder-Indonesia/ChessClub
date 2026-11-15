import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { jalurBeranda, jalurBerandaUtama } from "../halaman/Beranda/sidebar.js";
import { gulirKeAtasInstan, gulirKePosisiInstan } from "../lib/gulir.js";

/**
 * Positif: posisi gulir disimpan per entri riwayat (location.key) dan
 * dipulihkan saat pengguna menekan tombol kembali/maju. Sebelumnya setiap
 * perubahan path dipaksa ke atas, sehingga kembali dari halaman lain
 * selalu mendarat di puncak, bukan di bagian yang tadi dibaca.
 *
 * `history.scrollRestoration` dibuat "manual" karena peramban memulihkan
 * posisi TERLALU CEPAT: URL sudah berubah, tetapi React masih menampilkan
 * halaman lama selama rute tujuan dirender, sehingga halaman lama sempat
 * terlihat meloncat ke posisi halaman tujuan sebelum halaman baru muncul.
 * Dengan manual, posisi baru dipasang setelah halaman tujuan ter-commit.
 */
const KUNCI_SIMPANAN = "kci-posisi-gulir";
const BATAS_ENTRI = 24;

if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

let petaPosisi = null;

function ambilPetaPosisi() {
  if (petaPosisi) return petaPosisi;
  try {
    const mentah = globalThis.sessionStorage?.getItem(KUNCI_SIMPANAN);
    const peta = mentah ? JSON.parse(mentah) : null;
    petaPosisi = peta && typeof peta === "object" ? peta : {};
  } catch {
    petaPosisi = {};
  }
  return petaPosisi;
}

function tulisPetaPosisi() {
  try {
    globalThis.sessionStorage?.setItem(
      KUNCI_SIMPANAN,
      JSON.stringify(ambilPetaPosisi())
    );
  } catch {
    /* sessionStorage penuh/diblokir - posisi hanya berlaku di memori */
  }
}

function simpanPosisi(kunci, path, y) {
  if (!kunci) return;
  const peta = ambilPetaPosisi();
  const bulat = Math.max(0, Math.round(y));
  const lama = peta[kunci];
  if (lama && lama.path === path && lama.y === bulat) return;
  peta[kunci] = { path, y: bulat };
  const semua = Object.keys(peta);
  if (semua.length > BATAS_ENTRI) {
    for (const k of semua.slice(0, semua.length - BATAS_ENTRI)) delete peta[k];
  }
  tulisPetaPosisi();
}

function posisiTersimpan(kunci, path) {
  const data = ambilPetaPosisi()[kunci];
  if (!data || data.path !== path) return 0;
  return typeof data.y === "number" && Number.isFinite(data.y) ? data.y : 0;
}

/**
 * Pasang posisi tersimpan setelah halaman tujuan ter-commit.
 *
 * Konten rute dimuat malas, jadi tinggi dokumen bisa belum cukup saat efek
 * ini berjalan (posisi akan terpotong di dasar dokumen). Percobaan diulang
 * beberapa frame sampai tinggi dokumen mencukupi, lalu berhenti — juga
 * berhenti begitu pengguna menggulir sendiri agar tidak berebut kendali.
 */
function pulihkanPosisi(y) {
  if (y <= 0) {
    gulirKeAtasInstan();
    return undefined;
  }
  let frame = 0;
  let coba = 0;
  let aktif = true;

  const berhenti = () => {
    if (!aktif) return;
    aktif = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener("wheel", berhenti);
    window.removeEventListener("touchstart", berhenti);
    window.removeEventListener("keydown", berhenti);
  };

  const pasang = () => {
    if (!aktif) return;
    frame = 0;
    const maksimal = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    gulirKePosisiInstan(Math.min(y, maksimal));
    if (Math.abs(window.scrollY - y) <= 1 || coba++ >= 90) {
      berhenti();
      return;
    }
    frame = window.requestAnimationFrame(pasang);
  };

  window.addEventListener("wheel", berhenti, { passive: true });
  window.addEventListener("touchstart", berhenti, { passive: true });
  window.addEventListener("keydown", berhenti);
  pasang();
  return berhenti;
}

export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  const jenisNavigasi = useNavigationType();
  const sebelumnya = useRef(null);
  const kunciAktif = useRef(key);
  const pathAktif = useRef(pathname);

  // Simpan posisi entri yang sedang aktif. Ditulis per frame (throttle rAF)
  // agar scroll tetap mulus; pagehide menangkap posisi terakhir sebelum
  // halaman ditinggalkan.
  useEffect(() => {
    let frame = 0;
    const catat = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        simpanPosisi(kunciAktif.current, pathAktif.current, window.scrollY);
      });
    };
    const catatSekarang = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      simpanPosisi(kunciAktif.current, pathAktif.current, window.scrollY);
    };
    window.addEventListener("scroll", catat, { passive: true });
    window.addEventListener("pagehide", catatSekarang);
    return () => {
      window.removeEventListener("scroll", catat);
      window.removeEventListener("pagehide", catatSekarang);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useLayoutEffect(() => {
    const prev = sebelumnya.current;
    sebelumnya.current = pathname;
    kunciAktif.current = key;
    pathAktif.current = pathname;

    if (hash) {
      let id;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        // Hash malformed (mis. "/#%zz") — jangan biarkan aplikasi crash.
        id = hash.slice(1);
      }
      // Halaman tujuan dimuat malas: saat efek ini berjalan, chunk-nya
      // bisa saja belum selesai diunduh sehingga elemen #id belum ada.
      // Coba ulang beberapa frame sampai elemennya muncul (pola yang sama
      // dengan TataLetakBeranda) — tanpa ini, tautan seperti
      // "/tentang-kami#visi-misi" diam-diam gagal menggulir.
      let aktif = true;
      let coba = 0;
      let frame = 0;
      const go = () => {
        if (!aktif) return;
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return;
        }
        if (coba++ < 90) frame = window.requestAnimationFrame(go);
      };
      frame = window.requestAnimationFrame(go);
      return () => {
        aktif = false;
        if (frame) window.cancelAnimationFrame(frame);
        coba = 999;
      };
    }

    // Halaman utama Beranda ("/beranda"): selalu tampilkan foto
    // hero di atas — termasuk saat menekan menu Beranda dari tab lain.
    if (jalurBerandaUtama(pathname)) {
      gulirKeAtasInstan();
      return undefined;
    }

    // Pindah tab di dalam Beranda: hero tetap, fokus ke artikel di bawah foto.
    // TataLetakBeranda yang menggulir ke judul artikel — jangan loncat ke hero.
    if (prev && jalurBeranda(prev) && jalurBeranda(pathname)) {
      return undefined;
    }

    // Kembali/maju: pulihkan posisi entri riwayat yang sama. Navigasi baru
    // (klik menu/tautan) tetap mulai dari atas.
    if (jenisNavigasi === "POP") {
      return pulihkanPosisi(posisiTersimpan(key, pathname));
    }

    gulirKeAtasInstan();
    return undefined;
  }, [pathname, hash, key, jenisNavigasi]);

  return null;
}
