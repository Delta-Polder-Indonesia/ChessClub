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
import { useEffect, useRef, useState } from "react";
import { ambilAnggotaDenganSumber } from "./api/index.js";

/** Berapa lama hasil dianggap masih segar (ms). */
const TTL = 5 * 60 * 1000;

/**
 * TAMPIL SEKETIKA, SEGARKAN DI LATAR BELAKANG
 * -------------------------------------------
 * Backend sudah menyimpan snapshot roster, jadi GET /api/anggota cepat.
 * Di sisi browser kita menambah satu lapis lagi: hasil terakhir disimpan di
 * localStorage. Saat situs dibuka kembali, daftar lama LANGSUNG tampil
 * (tidak ada layar kosong "memuat"), sementara permintaan ke server berjalan
 * di latar belakang. Begitu data baru tiba, tabel diperbarui sendiri —
 * termasuk anggota yang baru bergabung atau keluar dari klub.
 */
const KUNCI_SIMPANAN = "kci.anggota.v1";
/** Simpanan lokal yang lebih tua dari ini dibuang (dianggap tidak relevan). */
const UMUR_SIMPANAN_MAKS = 7 * 24 * 60 * 60 * 1000;

let cache = null; // { waktu, data }
let sedangJalan = null; // Promise yang sedang berjalan (dedupe)
const pendengar = new Set();

/** Beri tahu semua komponen yang sedang memakai data ini. */
function siarkan() {
  for (const fn of pendengar) fn();
}

/* ----------------------------------------------------- simpanan browser */

function bacaSimpanan() {
  try {
    const mentah = globalThis.localStorage?.getItem(KUNCI_SIMPANAN);
    if (!mentah) return null;
    const isi = JSON.parse(mentah);
    if (!Array.isArray(isi?.data) || !isi.data.length) return null;
    const waktu = Number(isi.waktu) || 0;
    if (!waktu || Date.now() - waktu > UMUR_SIMPANAN_MAKS) return null;
    return {
      waktu,
      data: isi.data,
      sumber: isi.sumber === "fallback" ? "fallback" : "api",
      rosterDiperbaruiPada: isi.rosterDiperbaruiPada || null,
      rosterSegar: Boolean(isi.rosterSegar),
    };
  } catch {
    // localStorage bisa tidak tersedia (mode privat, kuota penuh, SSR).
    return null;
  }
}

function tulisSimpanan(
  data,
  sumber = "api",
  peringatan = "",
  rosterDiperbaruiPada = null,
  rosterSegar = false
) {
  try {
    globalThis.localStorage?.setItem(
      KUNCI_SIMPANAN,
      JSON.stringify({
        waktu: Date.now(),
        data,
        sumber,
        peringatan,
        // Cap waktu snapshot ROSTER dari server (bukan waktu muat di browser):
        // inilah yang memberitahu pengunjung seberapa baru daftar ini.
        rosterDiperbaruiPada,
        rosterSegar,
      })
    );
  } catch {
    /* menyimpan cache bukan hal kritis */
  }
}

/** Isi cache memori dari simpanan browser (sekali, saat modul dimuat). */
function pulihkanCache() {
  if (cache) return cache;
  const tersimpan = bacaSimpanan();
  if (tersimpan) {
    // Ditandai kedaluwarsa agar kunjungan baru tetap memicu penyegaran,
    // tetapi datanya sudah bisa ditampilkan sekarang juga.
    cache = {
      waktu: 0,
      data: tersimpan.data,
      dariSimpanan: true,
      sumber: tersimpan.sumber || "api",
      peringatan: "simpanan-lokal",
      rosterDiperbaruiPada: tersimpan.rosterDiperbaruiPada || null,
      rosterSegar: false,
    };
  }
  return cache;
}

pulihkanCache();

/** Data terakhir yang diketahui (mungkin dari kunjungan sebelumnya). */
export function anggotaTersimpan() {
  return cache?.data || [];
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

  sedangJalan = ambilAnggotaDenganSumber({ paksa })
    .then(({ anggota, sumber, peringatan, diperbaruiPada, rosterSegar }) => {
      const bersih = Array.isArray(anggota) ? anggota : [];
      // Jawaban kosong tidak boleh menghapus daftar yang sudah tampil —
      // itu hampir selalu berarti sumbernya sedang bermasalah.
      if (!bersih.length && cache?.data?.length) {
        return cache.data;
      }
      /* Asal data ikut disimpan dan ikut dikirim ke komponen. Roster publik
         Chess.com (sumber "fallback") BUKAN daftar anggota resmi — ia hanya
         muncul karena backend tidak dapat dihubungi — dan tidak boleh
         dipakai untuk menyimpulkan status/hak anggota apa pun. Kegagalan
         backend karenanya tidak disamarkan seolah sistem sehat. */
      cache = {
        waktu: Date.now(),
        data: bersih,
        sumber,
        peringatan,
        rosterDiperbaruiPada: diperbaruiPada || null,
        rosterSegar: Boolean(rosterSegar),
      };
      tulisSimpanan(bersih, sumber, peringatan, diperbaruiPada, rosterSegar);
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
  return muatAnggota({ paksa: true });
}

/**
 * Hook React: satu pintu untuk komponen.
 *
 * Status yang mungkin:
 *   "memuat"      — belum ada data sama sekali (kunjungan pertama).
 *   "siap"        — data tampil.
 *   "menyegarkan" — data lama sudah tampil, versi terbaru sedang diambil.
 *   "gagal"       — tidak ada data dan pengambilan gagal.
 *
 * @returns {{anggota: Array, status: string, pesan: string,
 *            menyegarkan: boolean, diperbaruiPada: number|null,
 *            muatUlang: Function}}
 */
export function useAnggota() {
  /* Guard mounted: permintaan muat ulang yang selesai setelah komponennya
     dibongkar tidak boleh lagi memanggil setState. */
  const hidupRef = useRef(true);
  useEffect(
    () => () => {
      hidupRef.current = false;
    },
    []
  );
  const [anggota, setAnggota] = useState(() => cache?.data || []);
  const [status, setStatus] = useState(() =>
    cache?.data?.length ? (cache.waktu ? "siap" : "menyegarkan") : "memuat"
  );
  const [diperbaruiPada, setDiperbaruiPada] = useState(
    () => cache?.waktu || null
  );
  const [pesan, setPesan] = useState("");
  /* "api" = jawaban backend, "fallback" = roster publik Chess.com saja. */
  const [sumber, setSumber] = useState(() => cache?.sumber || "api");
  const [peringatan, setPeringatan] = useState(() => cache?.peringatan || "");
  /* Cap waktu SNAPSHOT ROSTER di server — beda dengan `diperbaruiPada` di
     atas yang mencatat kapan browser terakhir memuat. Ini yang bisa
     ditampilkan sebagai "daftar diperbarui <waktu>". */
  const [rosterDiperbaruiPada, setRosterDiperbaruiPada] = useState(
    () => cache?.rosterDiperbaruiPada || null
  );
  const [rosterSegar, setRosterSegar] = useState(() => Boolean(cache?.rosterSegar));

  useEffect(() => {
    let hidup = true;

    const sinkron = () => {
      if (hidup && cache) {
        setAnggota(cache.data);
        setDiperbaruiPada(cache.waktu || null);
        setSumber(cache.sumber || "api");
        setPeringatan(cache.peringatan || "");
        setRosterDiperbaruiPada(cache.rosterDiperbaruiPada || null);
        setRosterSegar(Boolean(cache.rosterSegar));
      }
    };
    pendengar.add(sinkron);

    // Data dari kunjungan sebelumnya sudah tampil; permintaan berikut ini
    // hanya menyegarkan (mendeteksi anggota baru / yang keluar dari klub).
    if (cache?.data?.length) setStatus("menyegarkan");

    muatAnggota()
      .then((data) => {
        if (!hidup) return;
        setAnggota(data);
        setDiperbaruiPada(cache?.waktu || Date.now());
        setSumber(cache?.sumber || "api");
        setPeringatan(cache?.peringatan || "");
        setRosterDiperbaruiPada(cache?.rosterDiperbaruiPada || null);
        setRosterSegar(Boolean(cache?.rosterSegar));
        setStatus("siap");
      })
      .catch((err) => {
        if (!hidup) return;
        // Bila daftar lama masih ada, jangan tampilkan layar galat —
        // cukup pertahankan yang tampil.
        if (cache?.data?.length) {
          setStatus("siap");
          return;
        }
        setPesan(err.message || "Gagal memuat daftar anggota.");
        setStatus("gagal");
      });

    return () => {
      hidup = false;
      pendengar.delete(sinkron);
    };
  }, []);

  const muatUlang = () => {
    setStatus(anggota.length ? "menyegarkan" : "memuat");
    return segarkanAnggota()
      .then((data) => {
        if (!hidupRef.current) return data;
        setAnggota(data);
        setDiperbaruiPada(cache?.waktu || Date.now());
        setSumber(cache?.sumber || "api");
        setPeringatan(cache?.peringatan || "");
        setRosterDiperbaruiPada(cache?.rosterDiperbaruiPada || null);
        setRosterSegar(Boolean(cache?.rosterSegar));
        setStatus("siap");
        return data;
      })
      .catch((err) => {
        if (!hidupRef.current) return;
        if (cache?.data?.length) {
          setStatus("siap");
          return;
        }
        setPesan(err.message || "Gagal memuat daftar anggota.");
        setStatus("gagal");
      });
  };

  return {
    anggota,
    status,
    pesan,
    sumber,
    peringatan,
    menyegarkan: status === "menyegarkan",
    diperbaruiPada,
    // Kapan snapshot roster di SERVER terakhir diperbarui dari Chess.com.
    rosterDiperbaruiPada,
    rosterSegar,
    muatUlang,
  };
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
  let puncak = null;
  for (const nama of KONTROL) {
    const r = ratings[nama];
    if (!r) continue;
    win += r.win ?? 0;
    draw += r.draw ?? 0;
    loss += r.loss ?? 0;
    const nilaiPuncak = Number(r.puncak);
    if (r.puncak != null && Number.isFinite(nilaiPuncak)) {
      puncak = puncak === null ? nilaiPuncak : Math.max(puncak, nilaiPuncak);
    }
  }

  const semua = {
    id: "all",
    label: "All Games",
    elo: eloAnggota(a),
    puncak,
    win,
    draw,
    loss,
    total: win + draw + loss,
    ada: true,
  };

  const rinci = KONTROL.map((nama) => {
    const r = ratings[nama];
    const puncakKontrol = r?.puncak == null ? null : Number(r.puncak);
    return {
      id: nama,
      label: nama,
      elo: r?.elo ?? null,
      puncak: Number.isFinite(puncakKontrol) ? puncakKontrol : null,
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
