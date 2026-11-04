#!/usr/bin/env node
/**
 * Audit integritas dataset teka-teki (`public/data/teka-teki.json` dan
 * `public/data/teka-teki-video.json`) yang dipakai aplikasi.
 *
 * Memvalidasi skema, keunikan ID lintas berkas, deduplikasi posisi `(papan, giliran)`,
 * FEN, legalitas jalur solusi, hasil skakmat/taktik, konsistensi giliran awal,
 * serta format domain URL video MP4 dan tanggal harian.
 * Tidak mengubah dataset.
 */
import fs from "node:fs";
import path from "node:path";
import { Chess } from "chess.js";

const fileUtama = path.resolve("public/data/teka-teki.json");
const fileVideo = path.resolve("public/data/teka-teki-video.json");
const fail = [];
const warn = [];

const DOMAIN_VIDEO_SAH =
  /^https:\/\/(media\.chesscomfiles\.com|chesscom-videos\.s3\.amazonaws\.com)\/[^\s"<>]+\.mp4$/i;
const TANGGAL_SAH = /^\d{4}-\d{2}-\d{2}$/;

function bacaJson(jalur) {
  try {
    return JSON.parse(fs.readFileSync(jalur, "utf8"));
  } catch (error) {
    console.error(`GAGAL: tidak dapat membaca JSON ${jalur}: ${error.message}`);
    process.exit(1);
  }
}

const rootUtama = bacaJson(fileUtama);
const problemsUtama = Array.isArray(rootUtama) ? rootUtama : rootUtama?.problems;
if (!Array.isArray(problemsUtama) || problemsUtama.length === 0) {
  console.error("GAGAL: teka-teki.json harus memuat daftar problems yang tidak kosong.");
  process.exit(1);
}

const rootVideo = bacaJson(fileVideo);
const problemsVideo = rootVideo?.problems;
if (!Array.isArray(problemsVideo) || problemsVideo.length === 0) {
  console.error("GAGAL: teka-teki-video.json harus memuat objek { problems: [...] } yang tidak kosong.");
  process.exit(1);
}

const seenIds = new Set();
const seenSourceIds = new Set();
const seenBoardTurns = new Set();
const targetMoves = new Map([
  ["Mate in One", 1],
  ["Mate in Two", 2],
  ["Mate in Three", 3],
  ["Skakmat dalam 1 Langkah", 1],
  ["Skakmat dalam 2 Langkah", 2],
  ["Skakmat dalam 3 Langkah", 3],
]);

function validasiDaftar(problems, { namaBerkas, idAwal, izinkanTaktik = false }) {
  for (let i = 0; i < problems.length; i += 1) {
    const p = problems[i];
    const label = `${namaBerkas} baris ${i + 1} (ID ${String(p?.problemid ?? "?")})`;
    if (!p || typeof p !== "object" || Array.isArray(p)) {
      fail.push(`${label}: record bukan objek`);
      continue;
    }

    const expectedId = idAwal + i;
    if (!Number.isInteger(p.problemid) || p.problemid < 1) {
      fail.push(`${label}: problemid harus integer positif`);
    } else {
      if (seenIds.has(p.problemid)) fail.push(`${label}: problemid duplikat lintas dataset ${p.problemid}`);
      seenIds.add(p.problemid);
      if (p.problemid !== expectedId) {
        fail.push(`${label}: problemid ${p.problemid} tidak sama dengan urutan kanonis ${expectedId}`);
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

    if (!izinkanTaktik) {
      if (typeof p.fenSebelum !== "string" || !p.fenSebelum.trim()) {
        fail.push(`${label}: fenSebelum kosong atau bukan string`);
      }
      const pembuka = /^([a-h][1-8])-([a-h][1-8])([qrbn])?$/.exec(p.langkahPersiapan || "");
      if (!pembuka) {
        fail.push(`${label}: langkahPersiapan kosong atau formatnya tidak sah`);
      } else if (typeof p.fenSebelum === "string" && p.fenSebelum.trim()) {
        try {
          const sebelumPembuka = new Chess(p.fenSebelum);
          const [, from, to, promotion] = pembuka;
          const hasilPembuka = sebelumPembuka.move({
            from,
            to,
            ...(promotion ? { promotion } : {}),
          });
          if (!hasilPembuka) {
            fail.push(`${label}: langkahPersiapan ilegal (${p.langkahPersiapan})`);
          } else if (sebelumPembuka.fen() !== p.fen) {
            fail.push(`${label}: fenSebelum + langkahPersiapan tidak menghasilkan fen`);
          }
        } catch (error) {
          fail.push(`${label}: FEN/langkah persiapan tidak sah (${error.message})`);
        }
      }
    }

    const boardTurn = p.fen.trim().split(/\s+/).slice(0, 2).join(" ");
    if (seenBoardTurns.has(boardTurn)) {
      if (izinkanTaktik) {
        fail.push(`${label}: duplikasi posisi (papan+giliran) dengan soal sebelumnya`);
      } else {
        warn.push(`${label}: duplikasi posisi internal di dataset utama`);
      }
    }
    seenBoardTurns.add(boardTurn);

    if (p.video !== undefined) {
      if (typeof p.video !== "string" || !DOMAIN_VIDEO_SAH.test(p.video)) {
        fail.push(`${label}: URL video tidak memenuhi allowlist MP4 (${String(p.video)})`);
      }
    }
    if (p.tanggal !== undefined) {
      if (typeof p.tanggal !== "string" || !TANGGAL_SAH.test(p.tanggal)) {
        fail.push(`${label}: format tanggal tidak sah (${String(p.tanggal)})`);
      }
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
    if (tokens.length % 2 === 0) {
      fail.push(`${label}: jalur solusi harus diakhiri langkah pemain (jumlah ply ganjil, ditemukan ${tokens.length})`);
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
      let result;
      try {
        result = chess.move({ from, to, ...(promotion ? { promotion } : {}) });
      } catch {
        fail.push(`${label}: langkah #${j + 1} ilegal: ${tokens[j]}`);
        legal = false;
        break;
      }
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

    const berakhirMat = chess.isCheckmate();
    if (izinkanTaktik && p.type === "Tactical") {
      if (berakhirMat) {
        fail.push(`${label}: type=Tactical tetapi jalur berakhir dalam skakmat`);
      }
      continue;
    }

    if (!berakhirMat) {
      fail.push(`${label}: jalur solusi bertipe ${p.type} tidak berakhir dalam skakmat`);
    }

    if (izinkanTaktik && p.type === "Mate in More") {
      if (tokens.length < 7) {
        fail.push(`${label}: type=Mate in More mengharapkan >= 7 ply solusi, ditemukan ${tokens.length}`);
      }
      continue;
    }

    const target = targetMoves.get(p.type);
    if (!target) {
      fail.push(`${label}: tipe soal tidak dikenal (${String(p.type)})`);
    } else {
      const expectedPly = target * 2 - 1;
      if (tokens.length !== expectedPly) {
        fail.push(`${label}: type=${p.type} mengharapkan ${expectedPly} ply solusi, ditemukan ${tokens.length}`);
      }
    }
  }
}

validasiDaftar(problemsUtama, {
  namaBerkas: "teka-teki.json",
  idAwal: 1,
  izinkanTaktik: false,
});

validasiDaftar(problemsVideo, {
  namaBerkas: "teka-teki-video.json",
  idAwal: problemsUtama.length + 1,
  izinkanTaktik: true,
});

const aktualVideo = problemsVideo.filter((p) => Boolean(p.video)).length;
const aktualLegenda = problemsVideo.filter((p) => p.kurasi?.includes("legenda")).length;
const aktualStudi = problemsVideo.filter((p) => p.kurasi?.includes("studi")).length;
if (rootVideo.jumlahTotal !== problemsVideo.length) {
  fail.push(`teka-teki-video.json: jumlahTotal=${rootVideo.jumlahTotal} != ${problemsVideo.length}`);
}
if (rootVideo.jumlahVideo !== aktualVideo) {
  fail.push(`teka-teki-video.json: jumlahVideo=${rootVideo.jumlahVideo} != ${aktualVideo}`);
}
if (rootVideo.jumlahLegenda !== aktualLegenda) {
  fail.push(`teka-teki-video.json: jumlahLegenda=${rootVideo.jumlahLegenda} != ${aktualLegenda}`);
}
if (rootVideo.jumlahStudi !== aktualStudi) {
  fail.push(`teka-teki-video.json: jumlahStudi=${rootVideo.jumlahStudi} != ${aktualStudi}`);
}

console.log(
  `Dataset: ${problemsUtama.length} soal utama + ${problemsVideo.length} soal video/arsip (${aktualVideo} ber-video)`
);
console.log(`Kegagalan: ${fail.length} | Peringatan: ${warn.length}`);
for (const item of fail) console.error(`FAIL: ${item}`);
for (const item of warn) console.warn(`WARN: ${item}`);
if (fail.length) process.exit(1);
console.log("LULUS: integritas kedua dataset teka-teki terverifikasi.");
