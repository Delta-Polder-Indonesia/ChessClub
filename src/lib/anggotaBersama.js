/**
 * SATU PINTU data anggota.
 *
 * Semua halaman yang menampilkan anggota — tab Keanggotaan
 * (TentangKami/StrukturGrupCatur/Keanggotaan) dan halaman Peringkat
 * (Beranda/Peringkat.jsx) — WAJIB mengambil datanya dari sini, bukan
 * memanggil `ambilDaftarAnggota()` sendiri-sendiri dan bukan dari berkas
 * data statis.
 *
 * Keuntungannya:
 * - Satu anggota mendaftar sekali → otomatis muncul di kedua halaman.
 * - Hanya SATU permintaan jaringan walau dua halaman dibuka bergantian
 *   (hasilnya di-cache di memori selama TTL).
 * - Aturan turunan (peringkat, nomor urut, penyaring rating) ditulis
 *   sekali di sini sehingga kedua halaman tidak pernah berbeda angka.
 *
 * Sumber sebenarnya tetap satu: GET /api/anggota (server/src/keanggotaan.js).
 * Server mengambil roster publik klub Chess.com, lalu memperkaya profil +
 * rating pemain dan mengurutkannya menurut rating menurun.
 */
import { useEffect, useState } from "react";
import { ambilDaftarAnggota } from "./chessAnggota.js";

/** Berapa lama hasil dianggap masih segar (ms). */
const TTL = 5 * 60 * 1000;

let cache = null; // { waktu, data }
let sedangJalan = null; // Promise yang sedang berjalan (dedupe)
const pendengar = new Set();

/** Beri tahu semua komponen yang sedang memakai data ini. */
function siarkan() {
  for (const fn of pendengar) fn();
}

/**
 * Ambil daftar anggota lewat satu pintu.
 * Permintaan serentak digabung; hasil segar dipakai ulang tanpa fetch.
 *
 * @param {{paksa?: boolean}} opsi - `paksa: true` melewati cache (tombol muat ulang).
 */
export function muatAnggota({ paksa = false } = {}) {
  if (!paksa && cache && Date.now() - cache.waktu < TTL) {
    return Promise.resolve(cache.data);
  }
  if (!paksa && sedangJalan) return sedangJalan;

  sedangJalan = ambilDaftarAnggota()
    .then((data) => {
      const bersih = Array.isArray(data) ? data : [];
      cache = { waktu: Date.now(), data: bersih };
      siarkan();
      return bersih;
    })
    .finally(() => {
      sedangJalan = null;
    });

  return sedangJalan;
}

/** Kosongkan cache — dipanggil setelah ada pendaftaran anggota baru. */
export function segarkanAnggota() {
  cache = null;
  return muatAnggota({ paksa: true });
}

/**
 * Hook React: satu pintu untuk komponen.
 * @returns {{anggota: Array, status: "memuat"|"siap"|"gagal", pesan: string, muatUlang: Function}}
 */
export function useAnggota() {
  const [anggota, setAnggota] = useState(() => cache?.data || []);
  const [status, setStatus] = useState(() => (cache ? "siap" : "memuat"));
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    let hidup = true;

    const sinkron = () => {
      if (hidup && cache) setAnggota(cache.data);
    };
    pendengar.add(sinkron);

    muatAnggota()
      .then((data) => {
        if (!hidup) return;
        setAnggota(data);
        setStatus("siap");
      })
      .catch((err) => {
        if (!hidup) return;
        setPesan(err.message || "Gagal memuat daftar anggota.");
        setStatus("gagal");
      });

    return () => {
      hidup = false;
      pendengar.delete(sinkron);
    };
  }, []);

  const muatUlang = () => {
    setStatus("memuat");
    return segarkanAnggota()
      .then((data) => {
        setAnggota(data);
        setStatus("siap");
      })
      .catch((err) => {
        setPesan(err.message || "Gagal memuat daftar anggota.");
        setStatus("gagal");
      });
  };

  return { anggota, status, pesan, muatUlang };
}

/* ------------------------------------------------------ turunan bersama */

/** Elo anggota sebagai angka, atau null bila belum ada rating. */
export function eloAnggota(a) {
  const elo = Number(a?.elo);
  return Number.isFinite(elo) ? elo : null;
}

/** Nama tampil: nama profil Chess.com, jatuh ke panggilan/username. */
export function namaTampil(a) {
  return a?.nama || a?.panggilan || a?.username || "—";
}

/**
 * Apakah akun Chess.com anggota terkena ban fair play.
 * Chess.com menutup akun pelanggar dengan status `closed:fair_play_violations`
 * (diterjemahkan server menjadi `alasanStatus: "fair_play_violations"`).
 */
export function kenaBan(a) {
  return (
    a?.diblokirKomunitas === true ||
    a?.statusChess === "closed:fair_play_violations" ||
    a?.alasanStatus === "fair_play_violations" ||
    a?.alasanStatus === "keputusan_pengurus"
  );
}

/**
 * Kontrol waktu yang dikenal Chess.com, beserta urutan tampilnya.
 * Label dipakai apa adanya pada pilihan "All Games" di tabel Peringkat.
 */
export const KONTROL = ["Blitz", "Bullet", "Rapid", "Daily"];

/** Jumlah partai satu blok rating (menang + seri + kalah). */
function totalPartai(r) {
  return (r?.win ?? 0) + (r?.draw ?? 0) + (r?.loss ?? 0);
}

/**
 * Ringkas rating seorang anggota menjadi daftar pilihan:
 *
 *   All Games (n) · Blitz (n) · Bullet (n) · Rapid (n) · Daily (n)
 *
 * - "All Games" memakai Elo kontrol utama (`kontrol`, biasanya Rapid) dan
 *   MENJUMLAHKAN W/D/L dari seluruh kontrol, sehingga angka partainya
 *   mewakili semua permainan anggota tersebut.
 * - Kontrol yang belum pernah dimainkan tetap ditampilkan sebagai (0)
 *   dan dinonaktifkan, supaya susunan pilihan setiap pemain seragam.
 *
 * @returns {Array<{id,label,elo,win,draw,loss,total,ada}>}
 */
export function opsiKontrol(a) {
  const ratings = a?.ratings || {};

  let win = 0;
  let draw = 0;
  let loss = 0;
  for (const nama of KONTROL) {
    const r = ratings[nama];
    if (!r) continue;
    win += r.win ?? 0;
    draw += r.draw ?? 0;
    loss += r.loss ?? 0;
  }

  const semua = {
    id: "all",
    label: "All Games",
    elo: eloAnggota(a),
    win,
    draw,
    loss,
    total: win + draw + loss,
    ada: true,
  };

  const rinci = KONTROL.map((nama) => {
    const r = ratings[nama];
    return {
      id: nama,
      label: nama,
      elo: r?.elo ?? null,
      win: r?.win ?? 0,
      draw: r?.draw ?? 0,
      loss: r?.loss ?? 0,
      total: totalPartai(r),
      ada: Boolean(r),
    };
  });

  return [semua, ...rinci];
}

/**
 * Susun papan peringkat dari daftar anggota yang sama.
 *
 * Anggota tanpa rating tidak diberi nomor peringkat (`no: null`) supaya
 * tidak menggeser nomor pemain yang sudah punya Elo — persis seperti
 * papan peringkat pada umumnya.
 */
export function susunPeringkat(anggota) {
  const berating = [];
  const tanpaRating = [];

  for (const a of anggota) {
    if (a.hilang || a.gagal) tanpaRating.push(a);
    else if (eloAnggota(a) === null) tanpaRating.push(a);
    else berating.push(a);
  }

  berating.sort((a, b) => eloAnggota(b) - eloAnggota(a));

  return [
    ...berating.map((a, i) => ({ ...a, no: i + 1 })),
    ...tanpaRating.map((a) => ({ ...a, no: null })),
  ];
}
