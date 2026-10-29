/**
 * Validasi impor PGN/FEN/tautan serta pengambilan data sumber online.
 * Batas dan allowlist sengaja terpusat agar jalur UI maupun uji memakai aturan sama.
 */
import { Chess } from "chess.js";
import { bacaPartaiPGN } from "../../mesin/engine.js";

/** Batas defensif: 1 MiB teks, 500 half-moves, dan 256 byte untuk FEN. */
export const BATAS_IMPOR = Object.freeze({
  bytePGN: 1024 * 1024,
  ply: 500,
  byteFEN: 256,
  byteRespons: 1024 * 1024,
  waktuMs: 12_000,
});

export const KODE_GALAT = Object.freeze({
  TAUTAN: "tautan",
  JARINGAN: "jaringan",
  TIMEOUT: "timeout",
  RESPONS: "respons",
  PGN: "pgn",
  FEN: "fen",
  UKURAN: "ukuran",
  LANGKAH: "langkah",
  TCN: "tcn",
});

export function galatImpor(kode) {
  const galat = new Error(kode);
  galat.code = kode;
  return galat;
}

function ukuranUtf8(teks) {
  return new TextEncoder().encode(String(teks ?? "")).byteLength;
}

/** Validasi PGN memakai parser yang sama dengan alur analisis. */
export function validasiPgn(teks) {
  const pgn = String(teks ?? "");
  if (ukuranUtf8(pgn) > BATAS_IMPOR.bytePGN) throw galatImpor(KODE_GALAT.UKURAN);
  let partai;
  try {
    partai = bacaPartaiPGN(pgn);
  } catch {
    throw galatImpor(KODE_GALAT.PGN);
  }
  if (partai.riwayat.length > BATAS_IMPOR.ply) throw galatImpor(KODE_GALAT.LANGKAH);
  return partai;
}

/** Tolak FEN tak valid atau tak wajar sebelum mengubah state halaman. */
export function validasiFen(teks) {
  const fen = String(teks ?? "").trim();
  if (!fen || ukuranUtf8(fen) > BATAS_IMPOR.byteFEN) throw galatImpor(KODE_GALAT.FEN);
  try {
    new Chess(fen);
  } catch {
    throw galatImpor(KODE_GALAT.FEN);
  }
  return fen;
}

/** Hanya menerima URL HTTPS permainan dari host resmi yang didukung. */
export function uraikanTautanPartai(teks) {
  let url;
  try {
    url = new URL(String(teks ?? "").trim());
  } catch {
    throw galatImpor(KODE_GALAT.TAUTAN);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw galatImpor(KODE_GALAT.TAUTAN);
  }

  const host = url.hostname.toLowerCase();
  if (host === "lichess.org") {
    const cocok = url.pathname.match(/^\/(?:game\/|embed\/)?([a-z0-9]{8})(?:\/(?:white|black))?\/?$/i);
    if (cocok) return { platform: "lichess", id: cocok[1] };
  }
  if (host === "chess.com" || host === "www.chess.com") {
    const cocok = url.pathname.match(/^\/game\/(?:(live|daily|master)\/)?(\d+)\/?$/i);
    if (cocok) return { platform: "chesscom", tipe: (cocok[1] || "live").toLowerCase(), id: cocok[2] };
  }
  throw galatImpor(KODE_GALAT.TAUTAN);
}

/* --- format TCN Chess.com (spesifikasi publik) --- */
const KODE_TCN =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?{~}(^)[_]@#$,./&-*++=";
const HURUF_PROMOSI = "qnrbkp";

function langkahDariTcn(kode) {
  if (!kode || kode.length !== 2) return null;
  const a = KODE_TCN.indexOf(kode[0]);
  let b = KODE_TCN.indexOf(kode[1]);
  if (a < 0 || b < 0) return null;
  let promosi;
  if (b > 63) {
    promosi = HURUF_PROMOSI[Math.floor((b - 64) / 3)];
    if (!promosi) return null;
    b = a + (a < 16 ? -8 : 8) + (((b - 1) % 3) - 1);
  }
  const bujur = (i) => "abcdefgh"[i % 8];
  const lintang = (i) => Math.floor(i / 8) + 1;
  return { from: bujur(a) + lintang(a), to: bujur(b) + lintang(b), promotion: promosi };
}

export function susunPgnDariTcn(kepalaMasuk, moveListMasuk) {
  const kepala = kepalaMasuk && typeof kepalaMasuk === "object" && !Array.isArray(kepalaMasuk)
    ? kepalaMasuk
    : {};
  const moveList = String(moveListMasuk ?? "");
  if (moveList.length % 2 !== 0 || moveList.length > BATAS_IMPOR.ply * 2) {
    throw galatImpor(moveList.length > BATAS_IMPOR.ply * 2 ? KODE_GALAT.LANGKAH : KODE_GALAT.TCN);
  }
  const kunciKepala = Object.keys(kepala);
  if (kunciKepala.length > 64) throw galatImpor(KODE_GALAT.RESPONS);

  const urutan = ["Event", "Site", "Date", "Round", "White", "Black", "Result"];
  const baris = [];
  const sudah = new Set();
  const buatHeader = (k, v) => {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(k)) throw galatImpor(KODE_GALAT.RESPONS);
    if (
      (typeof v !== "string" && typeof v !== "number") ||
      String(v).length > 512 ||
      [...String(v)].some((karakter) => {
        const kode = karakter.charCodeAt(0);
        return kode < 32 || kode === 127;
      })
    ) {
      throw galatImpor(KODE_GALAT.RESPONS);
    }
    return `[${k} "${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;
  };
  const tambahHeader = (k) => {
    const nilai = kepala[k];
    if (nilai === undefined || nilai === "") return;
    if (k === "Result" && !["1-0", "0-1", "1/2-1/2", "*"].includes(String(nilai))) {
      throw galatImpor(KODE_GALAT.RESPONS);
    }
    baris.push(buatHeader(k, nilai));
    sudah.add(k);
  };

  for (const k of urutan) tambahHeader(k);
  for (const k of kunciKepala.sort()) if (!sudah.has(k)) tambahHeader(k);
  if (!sudah.has("Event")) baris.unshift(buatHeader("Event", "Chess.com game"));
  if (!sudah.has("Site")) baris.push(buatHeader("Site", "https://www.chess.com"));

  const catur = new Chess();
  const sans = [];
  for (let i = 0; i < moveList.length; i += 2) {
    const tujuan = langkahDariTcn(moveList.slice(i, i + 2));
    if (!tujuan) throw galatImpor(KODE_GALAT.TCN);
    let hasil;
    try {
      hasil = catur.move(tujuan);
    } catch {
      throw galatImpor(KODE_GALAT.TCN);
    }
    if (!hasil) throw galatImpor(KODE_GALAT.TCN);
    sans.push(hasil.san);
  }
  const bernomor = [];
  let nomor = 1;
  sans.forEach((san, i) => {
    if (i % 2 === 0) bernomor.push(`${nomor++}.`);
    bernomor.push(san);
  });
  const hasilTag = kepala.Result && kepala.Result !== "*" ? ` ${kepala.Result}` : "";
  return `${baris.join("\n")}\n\n${bernomor.join(" ")}${hasilTag}\n`;
}

async function bacaTeksTerbatas(response, batasByte, signal) {
  const panjang = Number(response.headers?.get?.("content-length"));
  if (Number.isFinite(panjang) && panjang > batasByte) throw galatImpor(KODE_GALAT.UKURAN);

  const reader = response.body?.getReader?.();
  if (!reader) {
    const teks = await response.text();
    if (ukuranUtf8(teks) > batasByte) throw galatImpor(KODE_GALAT.UKURAN);
    return teks;
  }

  const potongan = [];
  let total = 0;
  try {
    while (true) {
      if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > batasByte) {
        await reader.cancel().catch(() => {});
        throw galatImpor(KODE_GALAT.UKURAN);
      }
      potongan.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }

  const data = new Uint8Array(total);
  let posisi = 0;
  for (const bagian of potongan) {
    data.set(bagian, posisi);
    posisi += bagian.byteLength;
  }
  return new TextDecoder().decode(data);
}

export async function ambilPgn(tautan, { signal } = {}) {
  const sumber = uraikanTautanPartai(tautan);
  const alamat = sumber.platform === "lichess"
    ? `https://lichess.org/game/export/${sumber.id}`
    : `https://www.chess.com/callback/${sumber.tipe}/game/${sumber.id}`;
  const headers = sumber.platform === "lichess"
    ? { Accept: "text/plain" }
    : { Accept: "application/json" };

  let response;
  try {
    response = await fetch(alamat, { headers, signal, redirect: "error" });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw galatImpor(KODE_GALAT.JARINGAN);
  }
  if (!response.ok) throw galatImpor(KODE_GALAT.JARINGAN);

  const isi = await bacaTeksTerbatas(response, BATAS_IMPOR.byteRespons, signal);
  if (sumber.platform === "lichess") return isi;

  let data;
  try {
    data = JSON.parse(isi);
  } catch {
    throw galatImpor(KODE_GALAT.RESPONS);
  }
  if (!data?.game || typeof data.game !== "object") throw galatImpor(KODE_GALAT.RESPONS);
  return susunPgnDariTcn(data.game.pgnHeaders, data.game.moveList);
}

