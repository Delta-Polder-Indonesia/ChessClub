import { createContext } from "react";

/**
 * Layar area kerja Analisa. "bermain" = papan + panel ringkasan/langkah;
 * sisanya menutupi area kerja dengan layar itu. Daftar ini juga dipakai
 * bilah navigasi untuk menandai menu yang sedang aktif.
 */
export const TAMPILAN_ANALISA = Object.freeze({
  BERMAIN: "bermain",
  AKUN: "akun",
  DETEKSI_ENGINE: "deteksi-engine",
  PENGATURAN: "pengaturan",
  BASIS_DATA: "database",
  IMPOR: "impor",
});

const PEMAIN_KOSONG = Object.freeze([
  Object.freeze({ name: "", elo: "NOELO" }),
  Object.freeze({ name: "", elo: "NOELO" }),
]);

/**
 * Kontrak konteks selalu menyediakan pemain putih dan hitam. State lama yang
 * dipertahankan Vite Fast Refresh, atau metadata eksternal yang tidak lengkap,
 * tidak boleh membuat komponen papan membaca `.name` dari `undefined`.
 */
export function normalisasiPemain(players, namaBawaan = ["", ""]) {
  const daftar = Array.isArray(players) ? players : [];
  return [0, 1].map((index) => {
    const pemain = daftar[index] && typeof daftar[index] === "object" ? daftar[index] : {};
    return {
      ...pemain,
      name: String(pemain.name ?? "").trim() || namaBawaan?.[index] || "",
      elo: pemain.elo ?? "NOELO",
    };
  });
}

const abortControllerInstance = new AbortController();

export const AnalyzeContext = createContext({
  data: [{ format: "fen", string: "" }, () => {
  }],
  pageState: ["analyze", () => {
  }],
  game: [[], () => {
  }],
  players: [PEMAIN_KOSONG, () => {
  }],
  moveNumber: [0, () => {
  }],
  forward: [true, () => {
  }],
  animation: [false, () => {
  }],
  white: [true, () => {
  }],
  playing: [false, () => {
  }],
  time: [0, () => {
  }],
  materialAdvantage: [0, () => {
  }],
  result: ["", () => {
  }],
  progress: [0, () => {
  }],
  langkahSementara: [[], () => {
  }],
  tab: ["analyze", () => {
  }],
  analyzeController: [abortControllerInstance, () => {
  }],
  customLine: [{ moveNumber: -1, moves: [], arrows: {} }, () => {
  }],
  returnedToNormalGame: [null, () => {
  }],
  analyzingMove: [false, () => {
  }],
  akun: [{ platform: "chessCom", username: "" }, () => {
  }],
  depth: [13, () => {
  }],
  /*
   * Layar yang sedang tampil di area kerja. Nilainya salah satu dari
   * TAMPILAN_ANALISA. Papan catur TIDAK pernah dilepas — hanya ditutupi
   * lapisan lain — sehingga analisis yang sedang berjalan dan panah yang
   * sudah digambar tetap utuh saat pengguna berpindah layar.
   */
  tampilan: ["bermain", () => {
  }],
  gameController: { back: () => {
  }, forward: () => {
  }, last: () => {
  }, first: () => {
  }, play: () => {
  }, pause: () => {
  }, togglePlay: () => {
  } }
});
