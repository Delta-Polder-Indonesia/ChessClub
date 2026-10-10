import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Memuat widget peeking dari public/peeking-widget.js (lokal).
 *
 * Script meng-inject <ybouane-peeking> (karakter mengintip dari tepi
 * kanan layar) dan <ybouane-peeking-dialog> ke document.body otomatis.
 * Kedua elemen ini TIDAK pernah dibuang oleh script, sehingga di SPA ia
 * ikut menempel ke setiap halaman setelah meninggalkan Landing. Karena
 * itu komponen ini mengatur tampil/sembunyi sendiri berdasarkan rute:
 * hanya terlihat di "/" (halaman Landing), dan script-nya baru dimuat
 * saat pertama kali rute itu dikunjungi.
 *
 * Semua asset (script + video) lokal di public/.
 * Tidak ada request ke peeking.ybouane.com.
 *
 * Catatan: script punya guard internal `window.PeekingWidget` — sekali
 * load, tidak mau re-init. Jadi visibilitas diatur lewat style, bukan
 * dengan membongkar lalu memuat ulang widget.
 */

/** Hanya rute ini yang menampilkan karakter. */
const RUTE = "/";

/** Setel style elemen yang disuntik script sesuai status tampil. */
function terapkan(tampil) {
  const container = window.PeekingWidget && window.PeekingWidget.container;
  const dialog = document.querySelector("ybouane-peeking-dialog");

  if (container) container.style.display = tampil ? "" : "none";
  if (dialog) {
    if (!tampil) {
      dialog.removeAttribute("data-visible");
      dialog.removeAttribute("data-open");
    }
    dialog.style.display = tampil ? "" : "none";
  }
}

export default function KarakterAnomali() {
  const { pathname } = useLocation();
  const tampil = pathname === RUTE;
  const tampilRef = useRef(tampil);
  tampilRef.current = tampil;

  useEffect(() => {
    // Selalu selaraskan visibilitas dengan rute saat ini. Saat elemen
    // belum ada (script belum dimuat) ini hanya no-op.
    terapkan(tampil);
    if (!tampil) return undefined;

    // Muat script sekali. Penjaga ini juga mencegah StrictMode (yang
    // menjalankan efek dua kali) menyisipkan <script> ganda.
    const sudahDimuat =
      window.PeekingWidget ||
      document.querySelector('script[src="/peeking-widget.js"]');
    if (sudahDimuat) return undefined;

    // Konfigurasi harus diset SEBELUM script load.
    // fileNameWebm: "/character.webm" — file video sudah ada di public/.
    window.YbouanePeeking = {
      introDelayMs: 0,
      autoPeek: true,
      theme: "light",
      heightPx: 300,
      topPx: 80,
      analytics: false,
      fileNameWebm: "/character.webm",
      fileNameHevc: null,
      poster: ["Ikuti perjalanannya!", "Ada yang menarik di sini...", "Yuk, mulai bermain!"],
      dialogContent:
        '<p class="eyebrow">Komunitas Catur Indonesia</p>' +
        "<h2>Blunder Skuad</h2>" +
        "<p>Wadah bagi pecatur untuk bermain, belajar, dan bertumbuh bersama. Tantang mesin, analisa partai, dan ikuti turnamen rutin.</p>" +
        '<div class="actions"><a class="btn primary" href="/papan-interaktif">Mulai Bermain</a></div>',
    };

    const s = document.createElement("script");
    s.src = "/peeking-widget.js";
    s.async = true;
    // Navigasi cepat bisa terjadi sebelum script selesai dimuat; saat itu
    // rute sudah berpindah, jadi terapkan status paling baru.
    s.onload = () => terapkan(tampilRef.current);
    document.body.appendChild(s);

    return undefined;
  }, [tampil]);

  return null;
}
