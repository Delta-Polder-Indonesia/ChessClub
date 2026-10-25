#!/usr/bin/env node
/**
 * Audit integritas dataset teka-teki yang dipakai aplikasi.
 *
 * Memvalidasi skema, ID, FEN, legalitas jalur solusi, hasil skakmat,
 * giliran awal, dan konsistensi jumlah langkah terhadap type.
 * Tidak mengubah dataset.
 */
import fs from "node:fs";
import path from "node:path";
import { Chess } from "chess.js";

const file = path.resolve("public/data/teka-teki.json");
const fail = [];
const warn = [];
let root;
try {
  root = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (error) {
  console.error(`GAGAL: tidak dapat membaca JSON ${file}: ${error.message}`);
  process.exit(1);
}

const problems = Array.isArray(root) ? root : root?.problems;
if (!Array.isArray(problems) || problems.length === 0) {
  console.error("GAGAL: dataset harus berupa array atau objek { problems: [...] } yang tidak kosong.");
  process.exit(1);
}

const seenIds = new Set();
const seenSourceIds = new Set();
const targetMoves = new Map([
  ["Mate in One", 1],
  ["Mate in Two", 2],
  ["Mate in Three", 3],
  ["Skakmat dalam 1 Langkah", 1],
  ["Skakmat dalam 2 Langkah", 2],
  ["Skakmat dalam 3 Langkah", 3],
]);

for (let i = 0; i < problems.length; i += 1) {
  const p = problems[i];
  const label = `baris ${i + 1} (ID ${String(p?.problemid ?? "?")})`;
  if (!p || typeof p !== "object" || Array.isArray(p)) {
    fail.push(`${label}: record bukan objek`);
    continue;
  }

  if (!Number.isInteger(p.problemid) || p.problemid < 1) {
    fail.push(`${label}: problemid harus integer positif`);
  } else {
    if (seenIds.has(p.problemid)) fail.push(`${label}: problemid duplikat ${p.problemid}`);
    seenIds.add(p.problemid);
    if (p.problemid !== i + 1) {
      fail.push(`${label}: problemid ${p.problemid} tidak sama dengan posisi array ${i + 1}`);
    }
  }
  if (p.sumberId) {
    if (seenSourceIds.has(p.sumberId)) warn.push(`${label}: sumberId duplikat ${p.sumberId}`);
    seenSourceIds.add(p.sumberId);
  }
  if (typeof p.fen !== "string" || !p.fen.trim()) {
    fail.push(`${label}: FEN kosong atau bukan string`);
    continue;
  }
  if (typeof p.moves !== "string" || !p.moves.trim()) {
    fail.push(`${label}: moves kosong atau bukan string`);
    continue;
  }
  if (typeof p.first !== "string" || !["White to Move", "Black to Move"].includes(p.first)) {
    fail.push(`${label}: nilai first tidak dikenal (${String(p.first)})`);
  }

  let chess;
  try {
    chess = new Chess(p.fen);
  } catch (error) {
    fail.push(`${label}: FEN tidak valid (${error.message})`);
    continue;
  }

  const actualTurn = chess.turn() === "w" ? "White to Move" : "Black to Move";
  if (p.first !== actualTurn) {
    fail.push(`${label}: first=${p.first}, tetapi giliran FEN=${actualTurn}`);
  }

  const tokens = p.moves.split(";").map((m) => m.trim()).filter(Boolean);
  if (tokens.length === 0) {
    fail.push(`${label}: tidak ada langkah solusi setelah parsing`);
    continue;
  }

  let legal = true;
  for (let j = 0; j < tokens.length; j += 1) {
    const match = /^([a-h][1-8])-([a-h][1-8])([qrbn])?$/.exec(tokens[j]);
    if (!match) {
      fail.push(`${label}: format langkah #${j + 1} tidak valid: ${tokens[j]}`);
      legal = false;
      break;
    }
    const [, from, to, promotion] = match;
    const piece = chess.get(from);
    const result = chess.move({ from, to, ...(promotion ? { promotion } : {}) });
    if (!result) {
      fail.push(`${label}: langkah #${j + 1} ilegal: ${tokens[j]}`);
      legal = false;
      break;
    }
    if (piece?.type === "p" && (to[1] === "8" || to[1] === "1") && !promotion) {
      fail.push(`${label}: promosi pion tidak menyebut bidak promosi pada langkah #${j + 1}`);
      legal = false;
      break;
    }
  }
  if (!legal) continue;

  if (!chess.isCheckmate()) {
    fail.push(`${label}: jalur solusi tidak berakhir dalam skakmat`);
  }

  const target = targetMoves.get(p.type);
  if (!target) {
    fail.push(`${label}: tipe soal tidak dikenal (${String(p.type)})`);
  } else {
    // Jalur tersimpan bergantian: pemain mencari mat dan lawan membalas.
    // Mate-in-N memiliki 2*N-1 ply dalam jalur solusi kanonis.
    const expectedPly = target * 2 - 1;
    if (tokens.length !== expectedPly) {
      fail.push(`${label}: type=${p.type} mengharapkan ${expectedPly} ply solusi, ditemukan ${tokens.length}`);
    }
  }
}

console.log(`Dataset: ${problems.length} soal`);
console.log(`Kegagalan: ${fail.length} | Peringatan: ${warn.length}`);
for (const item of fail) console.error(`FAIL: ${item}`);
for (const item of warn) console.warn(`WARN: ${item}`);
if (fail.length) process.exit(1);
console.log("LULUS: integritas dasar dataset teka-teki terverifikasi.");
