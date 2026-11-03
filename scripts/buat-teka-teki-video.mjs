#!/usr/bin/env node
/**
 * Bangun `public/data/teka-teki-video.json` dari arsip mentah
 * `scripts/data-sumber/puzzle-all.json`.
 *
 * Setiap entri diverifikasi ulang lewat `parsePgnTekaTeki()` + `chess.js`
 * sehingga langkah korup, token hasil partai yang bocor ke array langkah,
 * URL `.mp4` yang kemasukan atribut HTML, dan karakter emoji dibersihkan
 * sebelum dipakai `TekaTeki.jsx`.
 *
 * Soal yang memiliki video pembahasan pelatih ditempatkan lebih dulu
 * (terbaru ke terlama) agar koleksi "Taktik + Video" langsung menampilkan
 * pembahasan terbaru; sisanya menyusul sebagai arsip taktik pelengkap.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";
import { parsePgnTekaTeki, tanggalSah } from "../src/lib/tekaTekiHarian.js";
import { parseLangkah } from "../src/lib/tekaTeki.js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUMBER = path.join(AKAR, "scripts", "data-sumber", "puzzle-all.json");
const DATA_UTAMA = path.join(AKAR, "public", "data", "teka-teki.json");
const KELUARAN = path.join(AKAR, "public", "data", "teka-teki-video.json");

const DOMAIN_VIDEO_SAH = /^https:\/\/(media\.chesscomfiles\.com|chesscom-videos\.s3\.amazonaws\.com)\/[^\s"<>]+\.mp4$/i;
const POLA_EMOJI = /[\p{Extended_Pictographic}\uFE0E\uFE0F\u200D]/gu;
const NAMA_ABAIKAN = /^(?:\?+|daily puzzle inspiration|study|white|black|unknown|nn)$/i;
const POLA_MASTER = /\b(?:GM|IM|WGM|WIM|FM|NM|Carlsen|Nakamura|Kasparov|Fischer|Tal|Karpov|Anand|Caruana|Gukesh|Firouzja|Nepomniachtchi|Polgar|Morphy|Capablanca|Alekhine|Botvinnik|Spassky|Ivanchuk|Aronian|Ding Liren|Kramnik|Topalov|Shirov|Bronstein|Korchnoi)\b/i;
const POLA_LEGENDA_PEMAIN = /\b(?:Carlsen|Kasparov|Fischer|Tal|Nakamura|Capablanca|Morphy|Polgar|Anand|Karpov|Kramnik|Spassky|Botvinnik|Alekhine|Smyslov|Petrosian|Korchnoi|Bronstein|Ivanchuk|Aronian|Caruana|Ding\s+Liren|Ding,\s*L|Nepomniachtchi|Gukesh|Praggnanandhaa|Firouzja|Anderssen|Steinitz|Lasker|Euwe|Nimzowitsch|Rubinstein)\b/i;
const POLA_LEGENDA_JUDUL = /\b(?:Carlsen|Kasparov|Fischer|Mikhail\s+Tal|Hikaru|Nakamura|Capablanca|Morphy|Polgar|Anand|Karpov|Kramnik|Spassky|Botvinnik|Alekhine|Ivanchuk|Aronian|Caruana|Ding\s+Liren|Nepomniachtchi|Gukesh|Praggnanandhaa|Pragg|Firouzja|Anderssen|Steinitz|Lasker)\b/i;
const POLA_STUDI = /\b(?:Troitzky|Troitsky|Reti|R[eé]ti|Rinck|Kasparian|Kubbel|Loyd|Stamma|Mendheim|Horwitz|Kling|Mattison|Grigoriev|Endgame\s+Study|Composition)\b/i;
const PETA_NAG = {
  $1: "!",
  $2: "?",
  $3: "!!",
  $4: "??",
  $5: "!?",
  $6: "?!",
};
const NILAI_BIDAK = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function bersihkanTeks(nilai) {
  if (typeof nilai !== "string") return "";
  return nilai.replace(POLA_EMOJI, "").replace(/\s+/g, " ").trim();
}

function bersihkanUrlVideo(mentah) {
  const urlAsal = mentah && !Array.isArray(mentah) ? mentah.url : "";
  if (typeof urlAsal !== "string" || !urlAsal.trim()) return "";
  const potong = urlAsal
    .split('"')[0]
    .trim()
    .replace(/^http:\/\//i, "https://");
  return DOMAIN_VIDEO_SAH.test(potong) ? potong : "";
}

function namaPelatih(author) {
  if (!author || typeof author !== "object") return "";
  const nama = bersihkanTeks(author.name || author.username || "");
  if (!nama) return "";
  const gelar = bersihkanTeks(author.chess_title || "");
  return gelar ? `${gelar} ${nama}` : nama;
}

function namaPemainBersih(mentah) {
  const teks = bersihkanTeks(mentah);
  if (!teks || NAMA_ABAIKAN.test(teks)) return "";
  return teks;
}

function hitungBidakFen(fen) {
  const papan = String(fen || "").split(" ")[0] || "";
  let total = 0;
  for (const ch of papan) {
    if (/[pnbrqkPNBRQK]/.test(ch)) total += 1;
  }
  return total;
}

function cariPetakRaja(game, warna) {
  for (const baris of game.board()) {
    for (const isi of baris) {
      if (isi && isi.type === "k" && isi.color === warna) return isi.square;
    }
  }
  return null;
}

function apakahSkakmatSempit(game, langkahTerakhir) {
  if (!game.isCheckmate() || langkahTerakhir?.piece !== "n") return false;
  const warnaKalah = game.turn();
  const raja = cariPetakRaja(game, warnaKalah);
  if (!raja) return false;
  const f0 = raja.charCodeAt(0) - 97;
  const r0 = Number(raja[1]);
  for (let df = -1; df <= 1; df += 1) {
    for (let dr = -1; dr <= 1; dr += 1) {
      if (df === 0 && dr === 0) continue;
      const f = f0 + df;
      const r = r0 + dr;
      if (f < 0 || f > 7 || r < 1 || r > 8) continue;
      const sq = `${String.fromCharCode(97 + f)}${r}`;
      const bidak = game.get(sq);
      if (!bidak || bidak.color !== warnaKalah) return false;
    }
  }
  return true;
}

function apakahSkakmatPunggung(game, langkahTerakhir) {
  if (!game.isCheckmate()) return false;
  if (langkahTerakhir?.piece !== "r" && langkahTerakhir?.piece !== "q") return false;
  const warnaKalah = game.turn();
  const barisBelakang = warnaKalah === "w" ? "1" : "8";
  const barisPion = warnaKalah === "w" ? "2" : "7";
  const raja = cariPetakRaja(game, warnaKalah);
  if (!raja || raja[1] !== barisBelakang || langkahTerakhir.to[1] !== barisBelakang) {
    return false;
  }
  const f0 = raja.charCodeAt(0) - 97;
  let pionPenghalang = 0;
  for (let df = -1; df <= 1; df += 1) {
    const f = f0 + df;
    if (f < 0 || f > 7) continue;
    const sq = `${String.fromCharCode(97 + f)}${barisPion}`;
    const b = game.get(sq);
    if (b && b.color === warnaKalah && b.type === "p") pionPenghalang += 1;
  }
  return pionPenghalang >= 2;
}

function deteksiTema({ fenAwal, daftarDetail, gameAkhir, pemainPutih, pemainHitam, eloPutih, eloHitam }) {
  const tema = new Set();
  const jumlahBidak = hitungBidakFen(fenAwal);
  if (jumlahBidak <= 12) tema.add("endgame");
  else if (jumlahBidak >= 26) tema.add("opening");
  else tema.add("middlegame");

  if (daftarDetail.some((d) => Boolean(d.promotion))) {
    tema.add("promotion");
  }

  for (let i = 0; i < daftarDetail.length; i += 2) {
    const m = daftarDetail[i];
    const balasan = daftarDetail[i + 1];
    if (
      balasan &&
      balasan.to === m.to &&
      balasan.captured &&
      (NILAI_BIDAK[m.piece] || 0) >= 3 &&
      (NILAI_BIDAK[m.piece] || 0) > (NILAI_BIDAK[m.captured] || 0)
    ) {
      tema.add("sacrifice");
    }
  }

  const terakhir = daftarDetail.at(-1);
  if (apakahSkakmatSempit(gameAkhir, terakhir)) tema.add("smotheredMate");
  if (apakahSkakmatPunggung(gameAkhir, terakhir)) tema.add("backRankMate");

  if (!gameAkhir.isCheckmate() && daftarDetail.length === 1 && terakhir?.captured) {
    tema.add("hangingPiece");
  }

  if (
    eloPutih >= 2200 ||
    eloHitam >= 2200 ||
    POLA_MASTER.test(`${pemainPutih} ${pemainHitam}`)
  ) {
    tema.add("master");
  }

  return [...tema].join(" ");
}

function deteksiKurasi({ pemainPutih, pemainHitam, judulSoal, turnamen, rawEvent, rawWhite, rawBlack }) {
  const tag = [];
  const gabunganPemain = `${pemainPutih} ${pemainHitam}`;
  if (POLA_LEGENDA_PEMAIN.test(gabunganPemain) || POLA_LEGENDA_JUDUL.test(judulSoal)) {
    tag.push("legenda");
  }
  const konteksStudi = `${rawEvent} ${rawWhite} ${rawBlack} ${turnamen} ${judulSoal}`;
  if (
    POLA_STUDI.test(konteksStudi) ||
    /^(?:study|endgame study|composition)$/i.test(bersihkanTeks(rawEvent)) ||
    /^(?:study|white)$/i.test(bersihkanTeks(rawWhite)) && /study/i.test(konteksStudi)
  ) {
    tag.push("studi");
  }
  return tag.join(" ");
}

function ekstrakAnotasiPgn(pgnMentah) {
  const teks = String(pgnMentah || "").replace(POLA_EMOJI, "").replace(/\r\n/g, "\n").trim();
  if (!teks) return null;
  const badan = teks.replace(/^\[[^\]]*\]\s*/gm, "").trim();
  const komentar = [...badan.matchAll(/\{([^}]*)\}/g)]
    .map((m) => m[1].replace(/\[%[^\]]*\]/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const jumlahVariasi = (badan.match(/\(/g) || []).length;
  const simbolNag = [...new Set((badan.match(/\$[1-6]\b/g) || []).map((k) => PETA_NAG[k]).filter(Boolean))];

  if (!komentar.length && jumlahVariasi === 0 && !simbolNag.length) {
    return null;
  }

  let pgnValid;
  try {
    const ujiCatur = new Chess();
    ujiCatur.loadPgn(teks, { strict: false });
    pgnValid = ujiCatur.history().length > 0;
  } catch {
    pgnValid = false;
  }

  return {
    ...(pgnValid ? { pgnAnalisa: teks } : {}),
    ...(komentar.length ? { catatanLangkah: komentar.slice(0, 4) } : {}),
    ...(jumlahVariasi > 0 ? { jumlahVariasi } : {}),
    ...(simbolNag.length ? { simbolNag: simbolNag.join(" ") } : {}),
  };
}

function bangunPersentilTahunan(sumber) {
  const perTahun = new Map();
  for (const item of sumber) {
    const tahun = String(item?.date || "").slice(0, 4) || "0000";
    const n = Number(item?.solved_count) || 0;
    if (n <= 0) continue;
    if (!perTahun.has(tahun)) perTahun.set(tahun, []);
    perTahun.get(tahun).push(n);
  }
  for (const daftar of perTahun.values()) {
    daftar.sort((a, b) => a - b);
  }
  return function ambilPersentil(tanggal, solvedCount) {
    const tahun = String(tanggal || "").slice(0, 4) || "0000";
    const daftar = perTahun.get(tahun);
    const n = Number(solvedCount) || 0;
    if (!daftar || daftar.length < 2 || n <= 0) return 0.5;
    let lo = 0;
    let hi = daftar.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (daftar[mid] < n) lo = mid + 1;
      else hi = mid;
    }
    return lo / (daftar.length - 1);
  };
}

function estimasiRating({
  jumlahLangkahPemain,
  persentilSelesai,
  punyaUnderpromosi,
  akhirSkakmat,
}) {
  let dasar =
    jumlahLangkahPemain === 1
      ? 860
      : jumlahLangkahPemain === 2
        ? 1160
        : jumlahLangkahPemain === 3
          ? 1450
          : jumlahLangkahPemain === 4
            ? 1700
            : 1920;

  if (!akhirSkakmat) dasar += 90;
  if (punyaUnderpromosi) dasar += 170;

  // persentilSelesai = 1.0 berarti paling banyak terpecahkan di tahunnya (lebih mudah),
  // persentilSelesai = 0.0 berarti paling jarang terpecahkan di tahunnya (lebih sulit).
  const penyesuaianEmpiris = Math.round((0.5 - persentilSelesai) * 460);
  dasar += penyesuaianEmpiris;

  return Math.max(700, Math.min(2380, Math.round(dasar)));
}

function bangunDataset() {
  const sumber = JSON.parse(fs.readFileSync(SUMBER, "utf8"));
  const ambilPersentil = bangunPersentilTahunan(sumber);
  const utama = JSON.parse(fs.readFileSync(DATA_UTAMA, "utf8"));
  const daftarUtama = Array.isArray(utama) ? utama : utama.problems || [];
  const idAwal = daftarUtama.length + 1;
  const fenTerpakai = new Set(
    daftarUtama.map((p) => p.fen.split(" ").slice(0, 2).join(" "))
  );

  const berVideo = [];
  const arsipLain = [];
  let dilewati = 0;
  let hitungLegenda = 0;
  let hitungStudi = 0;
  let hitungAnotasi = 0;

  for (const item of sumber) {
    const tanggal = tanggalSah(item?.date) ? item.date : "";
    const pgnBersih = String(item?.pgn || "").replace(/\s+\*\s*$/, "");
    const hasil = parsePgnTekaTeki(pgnBersih, { fen: item?.parsed?.fen });
    if (!hasil.fen || !hasil.langkah.length) {
      dilewati += 1;
      continue;
    }

    const langkah =
      hasil.langkah.length % 2 === 0
        ? hasil.langkah.slice(0, -1)
        : hasil.langkah.slice();
    if (!langkah.length) {
      dilewati += 1;
      continue;
    }

    const kunciPapan = hasil.fen.split(" ").slice(0, 2).join(" ");
    if (fenTerpakai.has(kunciPapan)) {
      dilewati += 1;
      continue;
    }

    const game = new Chess(hasil.fen);
    const giliranAwal = game.turn() === "b" ? "Black to Move" : "White to Move";
    const daftarDetail = [];
    let sah = true;
    for (const uci of langkah) {
      const { from, to, promo } = parseLangkah(uci);
      try {
        const mv = game.move({ from, to, ...(promo ? { promotion: promo } : {}) });
        if (!mv) {
          sah = false;
          break;
        }
        daftarDetail.push(mv);
      } catch {
        sah = false;
        break;
      }
    }
    if (!sah) {
      dilewati += 1;
      continue;
    }

    fenTerpakai.add(kunciPapan);
    const jumlahLangkahPemain = Math.ceil(langkah.length / 2);
    const akhirSkakmat = game.isCheckmate();
    const type = akhirSkakmat
      ? jumlahLangkahPemain === 1
        ? "Mate in One"
        : jumlahLangkahPemain === 2
          ? "Mate in Two"
          : jumlahLangkahPemain === 3
            ? "Mate in Three"
            : "Mate in More"
      : "Tactical";

    const punyaUnderpromosi = daftarDetail.some(
      (d) => d.promotion && d.promotion !== "q"
    );
    const pemainPutih = namaPemainBersih(item?.parsed?.white);
    const pemainHitam = namaPemainBersih(item?.parsed?.black);
    const eloPutih = Number(item?.parsed?.whiteelo) > 0 ? Number(item.parsed.whiteelo) : 0;
    const eloHitam = Number(item?.parsed?.blackelo) > 0 ? Number(item.parsed.blackelo) : 0;
    const video = bersihkanUrlVideo(item?.video);
    const pelatih = namaPelatih(item?.author);
    const judulSoal = bersihkanTeks(item?.title);
    const turnamen = namaPemainBersih(item?.parsed?.event);
    const kurasi = deteksiKurasi({
      pemainPutih,
      pemainHitam,
      judulSoal,
      turnamen,
      rawEvent: item?.parsed?.event || "",
      rawWhite: item?.parsed?.white || "",
      rawBlack: item?.parsed?.black || "",
    });
    if (kurasi.includes("legenda")) hitungLegenda += 1;
    if (kurasi.includes("studi")) hitungStudi += 1;

    const anotasi = ekstrakAnotasiPgn(item?.pgn);
    if (anotasi) hitungAnotasi += 1;

    const tema = deteksiTema({
      fenAwal: hasil.fen,
      daftarDetail,
      gameAkhir: game,
      pemainPutih,
      pemainHitam,
      eloPutih,
      eloHitam,
    });
    const jumlahTerpecahkan = Math.max(0, Math.trunc(Number(item?.solved_count) || 0));
    const persentilSelesai = ambilPersentil(tanggal, jumlahTerpecahkan);
    const rating = estimasiRating({
      jumlahLangkahPemain,
      persentilSelesai,
      punyaUnderpromosi,
      akhirSkakmat,
    });

    const entri = {
      first: giliranAwal,
      type,
      fen: hasil.fen,
      moves: langkah.join(";"),
      rating,
      tema,
      sumberId: `cc-${item.id}`,
      ...(jumlahTerpecahkan > 0 ? { jumlahTerpecahkan } : {}),
      ...(kurasi ? { kurasi } : {}),
      ...(tanggal ? { tanggal } : {}),
      ...(judulSoal ? { judulSoal } : {}),
      ...(video ? { video } : {}),
      ...(pelatih ? { pelatih } : {}),
      ...(pemainPutih ? { pemainPutih } : {}),
      ...(pemainHitam ? { pemainHitam } : {}),
      ...(eloPutih ? { eloPutih } : {}),
      ...(eloHitam ? { eloHitam } : {}),
      ...(turnamen ? { turnamen } : {}),
      ...(anotasi || {}),
    };

    if (video) berVideo.push(entri);
    else arsipLain.push(entri);
  }

  berVideo.sort((a, b) => String(b.tanggal || "").localeCompare(String(a.tanggal || "")));
  arsipLain.sort((a, b) => String(b.tanggal || "").localeCompare(String(a.tanggal || "")));

  const gabungan = [...berVideo, ...arsipLain].map((entri, idx) => ({
    problemid: idAwal + idx,
    ...entri,
  }));

  const paket = {
    versi: 2,
    jumlahVideo: berVideo.length,
    jumlahLegenda: hitungLegenda,
    jumlahStudi: hitungStudi,
    jumlahAnotasi: hitungAnotasi,
    jumlahTotal: gabungan.length,
    problems: gabungan,
  };

  fs.writeFileSync(KELUARAN, `${JSON.stringify(paket)}\n`, "utf8");
  console.log(
    `Selesai: ${gabungan.length} soal ditulis ke public/data/teka-teki-video.json (${berVideo.length} video, ${hitungLegenda} legenda, ${hitungStudi} studi, ${hitungAnotasi} beranotasi PGN, ${dilewati} dilewati).`
  );
}

bangunDataset();
