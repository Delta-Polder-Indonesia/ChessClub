/**
 * Suara papan bersama — dipakai Papan Interaktif, Teka-Teki, dan Analisa.
 *
 * Sumber bunyi: berkas MP3 di `public/SoundChess/standard/`. Berkasnya sangat
 * pendek (0,1–1,8 detik, total ±250 KB) sehingga aman dimuat sesuai kebutuhan
 * lalu disimpan di memori.
 *
 * Cara mainnya memakai Web Audio API (fetch → decodeAudioData → AudioBuffer),
 * bukan elemen <audio>, karena:
 *   - langkah cepat beruntun tidak saling memotong (tiap bunyi punya sumber
 *     sendiri, sementara satu elemen <audio> harus di-rewind dulu);
 *   - tidak ada jeda `play()` yang mengembalikan Promise dan bisa ditolak.
 * Bila peramban tidak punya Web Audio, modul jatuh ke HTMLAudioElement; bila
 * itu pun gagal, semua panggilan jadi noop — papan tidak boleh rusak hanya
 * karena bunyi.
 *
 * LISENSI: berkas MP3 berasal dari set suara Chess.com. Dipakai dengan
 * atribusi (lihat halaman Atribusi). Jangan salin ke proyek lain tanpa izin.
 */

import { useCallback, useEffect, useState } from "react";

import { berkasPublik } from "./asets.js";

/** Kunci localStorage untuk sakelar suara (dipakai bersama semua papan). */
const KUNCI_SIMPAN = "kci-suara-papan";

/** Nama bunyi = nama berkas di `public/SoundChess/standard/` tanpa `.mp3`. */
export const SUARA = {
  langkahSendiri: "move-self",
  langkahLawan: "move-opponent",
  makan: "capture",
  rokade: "castle",
  skak: "move-check",
  promosi: "promote",
  ilegal: "illegal",
  mulai: "game-start",
  selesai: "game-end",
  menang: "game-win",
  remis: "game-draw",
  klik: "click",
  notifikasi: "notify",
  tesSuara: "soundcheck",
  tekaTekiBenar: "puzzle-correct",
  tekaTekiSalah: "puzzle-wrong",
  tekaTekiTuntas: "lesson-pass",
  prestasi: "achievement",
};

/** Bunyi yang dipanaskan lebih dulu supaya langkah pertama tidak telat. */
const INTI = [
  SUARA.langkahSendiri,
  SUARA.langkahLawan,
  SUARA.makan,
  SUARA.rokade,
  SUARA.skak,
  SUARA.ilegal,
];

/** Kekerasan relatif tiap bunyi (set Chess.com tidak sepenuhnya seragam). */
const VOLUME = {
  [SUARA.langkahLawan]: 0.9,
  [SUARA.ilegal]: 0.7,
  [SUARA.klik]: 0.6,
  [SUARA.tekaTekiTuntas]: 0.8,
  [SUARA.prestasi]: 0.8,
};

const VOLUME_UTAMA = 0.7;

const alamat = (nama) => berkasPublik(`/SoundChess/standard/${nama}.mp3`);

/* ------------------------------------------------------------------ mesin */

let ctx = null;
let webAudioMati = false;
const bufferCache = new Map(); // nama → AudioBuffer | Promise<AudioBuffer>
const elemenCache = new Map(); // nama → HTMLAudioElement (jalur cadangan)

function konteksAudio() {
  if (typeof window === "undefined" || webAudioMati) return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    webAudioMati = true;
    return null;
  }
  try {
    ctx ||= new AudioCtx();
  } catch {
    webAudioMati = true;
    return null;
  }
  // Peramban membekukan AudioContext sampai ada interaksi pengguna.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function muat(nama) {
  const audio = konteksAudio();
  if (!audio) return null;
  const tersimpan = bufferCache.get(nama);
  if (tersimpan) return tersimpan;

  const janji = fetch(alamat(nama))
    .then((res) => {
      if (!res.ok) throw new Error(`suara ${nama}: HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((data) => audio.decodeAudioData(data))
    .then((buffer) => {
      bufferCache.set(nama, buffer);
      return buffer;
    })
    .catch(() => {
      // Gagal ambil/decode: jangan cache kegagalan selamanya, cukup diamkan.
      bufferCache.delete(nama);
      return null;
    });

  bufferCache.set(nama, janji);
  return janji;
}

function bunyikan(buffer, volume) {
  const audio = konteksAudio();
  if (!audio || !buffer) return;
  const sumber = audio.createBufferSource();
  sumber.buffer = buffer;
  const gain = audio.createGain();
  gain.gain.value = volume;
  sumber.connect(gain).connect(audio.destination);
  sumber.start(0);
}

/** Jalur cadangan untuk peramban tanpa Web Audio. */
function bunyikanElemen(nama, volume) {
  if (typeof Audio === "undefined") return;
  try {
    let contoh = elemenCache.get(nama);
    if (!contoh) {
      contoh = new Audio(alamat(nama));
      contoh.preload = "auto";
      elemenCache.set(nama, contoh);
    }
    const putar = contoh.cloneNode();
    putar.volume = Math.min(1, Math.max(0, volume));
    const hasil = putar.play();
    if (hasil && typeof hasil.catch === "function") hasil.catch(() => {});
  } catch {
    /* diamkan */
  }
}

/* ------------------------------------------------------------------- API  */

/**
 * Bunyikan satu suara. Aman dipanggil kapan saja: kalau berkasnya belum
 * termuat, ia dimuat dulu lalu dibunyikan (hanya kali pertama yang telat).
 */
export function mainkanSuara(nama, { volume } = {}) {
  if (!nama || typeof window === "undefined") return;
  const keras = (volume ?? VOLUME[nama] ?? 1) * VOLUME_UTAMA;

  const audio = konteksAudio();
  if (!audio) {
    bunyikanElemen(nama, keras);
    return;
  }

  const hasil = muat(nama);
  if (!hasil) {
    bunyikanElemen(nama, keras);
    return;
  }
  if (typeof hasil.then === "function") {
    hasil.then((buffer) => {
      if (buffer) bunyikan(buffer, keras);
      else bunyikanElemen(nama, keras);
    });
    return;
  }
  bunyikan(hasil, keras);
}

/**
 * Panaskan berkas suara (unduh + decode) supaya bunyi pertama tidak telat.
 * Dipanggil sekali saat halaman papan dipasang; tanpa argumen memuat set inti.
 */
export function panaskanSuara(daftar = INTI) {
  if (typeof window === "undefined") return;
  for (const nama of daftar) muat(nama);
}

/**
 * Pilih bunyi yang cocok untuk satu langkah chess.js.
 *
 * @param {object} pindah hasil `game.move(...)` (punya `flags`, `captured`).
 * @param {object} game   posisi SESUDAH langkah (untuk cek skak/akhir).
 * @param {{lawan?: boolean}} opsi `lawan: true` bila langkah dijalankan
 *        komputer/solusi, bukan oleh pengguna.
 */
export function suaraLangkah(pindah, game, { lawan = false } = {}) {
  if (!pindah) return SUARA.ilegal;
  const flags = pindah.flags || "";
  try {
    if (game?.isCheckmate?.()) return SUARA.selesai;
    if (game?.isGameOver?.()) return SUARA.remis;
    if (game?.isCheck?.()) return SUARA.skak;
  } catch {
    /* posisi tidak dapat dibaca — pakai bunyi langkah biasa */
  }
  if (flags.includes("k") || flags.includes("q")) return SUARA.rokade;
  if (flags.includes("p")) return SUARA.promosi;
  if (flags.includes("c") || flags.includes("e") || pindah.captured) return SUARA.makan;
  return lawan ? SUARA.langkahLawan : SUARA.langkahSendiri;
}

/** Gabungan `suaraLangkah` + `mainkanSuara` — pemakaian paling umum. */
export function mainkanSuaraLangkah(pindah, game, opsi) {
  mainkanSuara(suaraLangkah(pindah, game, opsi));
}

/* --------------------------------------------------- sakelar hidup / mati */

/** Baca preferensi tersimpan; bawaannya hidup. */
export function suaraAktifTersimpan() {
  try {
    return localStorage.getItem(KUNCI_SIMPAN) !== "0";
  } catch {
    return true;
  }
}

/**
 * Hook sakelar suara papan: `[nyala, setNyala, mainkan]`.
 *
 * `mainkan(nama)` sudah menghormati sakelar, jadi pemanggil tidak perlu
 * menulis `if (nyala)` di mana-mana. Preferensinya disimpan di localStorage
 * dan dibagi antara Papan Interaktif dan Teka-Teki.
 */
export function gunakanSuara() {
  const [nyala, setNyala] = useState(true);

  // Dibaca setelah mount agar aman untuk render di server / hidrasi.
  useEffect(() => {
    setNyala(suaraAktifTersimpan());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_SIMPAN, nyala ? "1" : "0");
    } catch {
      /* mode privat / kuota penuh — abaikan */
    }
  }, [nyala]);

  // Berkas dipanaskan hanya bila suara memang dipakai.
  useEffect(() => {
    if (nyala) panaskanSuara();
  }, [nyala]);

  const mainkan = useCallback(
    (nama, opsi) => {
      if (!nyala) return;
      mainkanSuara(nama, opsi);
    },
    [nyala]
  );

  const mainkanLangkah = useCallback(
    (pindah, game, opsi) => {
      if (!nyala) return;
      mainkanSuaraLangkah(pindah, game, opsi);
    },
    [nyala]
  );

  return { nyala, setNyala, mainkan, mainkanLangkah };
}
