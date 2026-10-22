/**
 * Ringkasan hasil analisis SATU partai, per warna.
 *
 * Padanan 1:1 `summarizeColor()` di repo acuan ChessGameReviewer
 * (`features/stockfish-analysis/analyzeGame.ts`) — struktur keluarannya
 * (`accuracyEstimate`, `eligibleMoves`, `excludedMoves`, `breakdown`) disalin
 * apa adanya supaya `hitungTaktikal` (padanan `computeTacticalStats`) bisa
 * membaca kedua sumber dengan cara yang sama.
 *
 * Yang berbeda hanya BAHAN mentahnya, karena bentuk data partai di repo ini
 * bukan `GameAnnotation[]` milik acuan melainkan `moves[]` hasil `parsePGN`
 * (lihat ./engine.js):
 *   - `mover` per langkah  → `pemainDariEntri(move, i)` (./akurasi.js),
 *     aturan yang sama dengan `pemainLangkah` di ./antiCheat.js;
 *   - `accuracy.accuracyEstimate` → `akurasiMove(move)` (./akurasi.js),
 *     `null` bila eval sebelum/sesudah tidak terbaca — padanan status
 *     `indeterminate` acuan, yang juga tidak ikut dihitung;
 *   - `accuracy.quality` → `move.moveRating` hasil ./penilaian.js.
 *
 * MURNI: tanpa React, tanpa DOM, tanpa pemanggilan engine.
 */

import { langkahTerpaksa } from "./evaluasi.js";
import { akurasiMove, pemainDariEntri } from "./akurasi.js";

/**
 * Kunci `breakdown` — SALINAN `REVIEW_MOVE_QUALITIES` acuan plus `book`,
 * karena repo ini punya label `book` sendiri (langkah masih di dalam buku
 * pembukaan) yang di acuan dinyatakan sebagai `tags: ["repertoire"]`.
 */
export const KUALITAS_LANGKAH = Object.freeze([
  "brilliant",
  "great",
  "best",
  "excellent",
  "good",
  "inaccuracy",
  "mistake",
  "blunder",
  "miss",
  "forced",
  "book",
]);

/**
 * Pemetaan label → kunci breakdown.
 *
 * `critical → best` mengikuti keputusan produk yang sudah berlaku di halaman
 * ini (`ratingCount.jsx`: label kritis tampil persis seperti best, tanpa
 * baris hitungan sendiri) dan catatan README 2026-09-23: "Akurasi panel
 * Ringkasan: label ini diperlakukan seperti `best`".
 */
export const PETA_KUALITAS = Object.freeze({
  brilliant: "brilliant",
  great: "great",
  best: "best",
  critical: "best",
  excellent: "excellent",
  good: "good",
  book: "book",
  inaccuracy: "inaccuracy",
  mistake: "mistake",
  miss: "miss",
  blunder: "blunder",
  forced: "forced",
});

/** `emptyBreakdown()` acuan: semua kunci 0. */
export function breakdownKosong() {
  const kosong = {};
  for (const kualitas of KUALITAS_LANGKAH) kosong[kualitas] = 0;
  return kosong;
}

/**
 * Ringkasan satu warna — `summarizeColor(annotations, color)` acuan.
 *
 * `accuracyEstimate` adalah RATA-RATA ARITMETIK akurasi per langkah milik
 * warna itu (acuan: `estimates.reduce((sum, e) => sum + e, 0) / estimates.length`),
 * BUKAN harmonic mean. Harmonic mean tetap milik panel Deteksi Engine
 * (./antiCheat.js); keduanya sengaja berbeda karena memang berbeda di acuan.
 *
 * @param {object[]} moves   daftar `moves` hasil `parsePGN`
 * @param {"w"|"b"} warna    warna yang dirangkum
 * @returns {{
 *   accuracyEstimate: number|null,
 *   eligibleMoves: number,
 *   excludedMoves: number,
 *   breakdown: Record<string, number>,
 * }}
 */
export function ringkasWarna(moves, warna) {
  const daftar = Array.isArray(moves) ? moves : [];
  const breakdown = breakdownKosong();
  const estimates = [];
  let milikWarna = 0;

  for (let i = 0; i < daftar.length; i += 1) {
    const move = daftar[i];
    // `annotations.filter((a) => a.mover === color)` di acuan.
    if (pemainDariEntri(move, i) !== warna) continue;
    milikWarna += 1;

    const akurasi = akurasiMove(move);
    // `if (annotation.accuracy.status === 'classified')` di acuan: langkah
    // yang akurasinya tak-terhitung tidak masuk estimates maupun breakdown.
    if (!Number.isFinite(akurasi)) continue;

    estimates.push(akurasi);
    // Langkah paksa dihitung pada barisnya sendiri, sama seperti
    // `ratingCount.jsx` — keterpaksaan bukan kualitas.
    const kualitas = langkahTerpaksa(move)
      ? "forced"
      : PETA_KUALITAS[move?.moveRating] ?? null;
    if (kualitas) breakdown[kualitas] += 1;
  }

  return {
    accuracyEstimate: estimates.length
      ? estimates.reduce((jumlah, nilai) => jumlah + nilai, 0) / estimates.length
      : null,
    eligibleMoves: estimates.length,
    excludedMoves: milikWarna - estimates.length,
    breakdown,
  };
}

/**
 * Ringkasan satu partai — bentuk yang disimpan `catatAnalisis` dan dibaca
 * `hitungTaktikal`. `summary` diwarnai `"w"`/`"b"` mengikuti konvensi warna
 * repo ini; acuan memakai `"white"`/`"black"`.
 *
 * @param {object[]} moves hasil `parsePGN`
 * @returns {{ status: "complete", summary: { w: object, b: object },
 *             analyzedPlies: number, totalPlies: number }}
 */
export function ringkasAnalisis(moves) {
  const daftar = Array.isArray(moves) ? moves : [];
  // `moves[0]` adalah posisi awal (tanpa `san`), jadi jumlah ply = panjang − 1.
  const totalPlies = Math.max(0, daftar.length - 1);
  return {
    status: "complete",
    summary: { w: ringkasWarna(daftar, "w"), b: ringkasWarna(daftar, "b") },
    analyzedPlies: totalPlies,
    totalPlies,
  };
}
