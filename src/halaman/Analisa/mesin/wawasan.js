/**
 * Logika wawasan (Insights) profil pemain — agregasi performa dari partai
 * tersimpan di IndexedDB.
 *
 * Data model partai (dari `normalisasiDataPartai` di basisData.js):
 *   { id, whiteName, blackName, whiteElo, blackElo, result, timestamp,
 *     timeClass, pgn, koleksiId, platform, ... }
 *
 * `result` sudah dinormalisasi ke "white" | "black" | "draw" oleh
 * `normalisasiHasil()`. `timestamp` dalam milidetik. `whiteElo`/`blackElo`
 * dalam angka (0 bila tidak ada).
 *
 * MURNI — tidak ada React, tidak ada DOM, tidak ada pemanggilan IndexedDB.
 */

/**
 * Ekstrak header PGN (tag pairs [Key "Value"]).
 *
 * SALINAN `parsePgnHeaders` repo acuan ChessGameReviewer
 * (`lib/chess/pgnHeaders.ts`), termasuk regex-nya: nilai yang mengandung
 * kutipan/ garis-miring-terbalik yang di-escape (`\"`, `\\`) tetap terbaca,
 * sesuatu yang dilewatkan regex sederhana `\["([^"]*)"\]`.
 */
const REGEX_HEADER_PGN = /^\[([A-Za-z0-9_]+)\s+"((?:[^"\\]|\\.)*)"\]/gm;

export function parsePgnHeaders(pgn) {
  const header = {};
  if (!pgn || typeof pgn !== "string") return header;
  let cocok;
  REGEX_HEADER_PGN.lastIndex = 0;
  while ((cocok = REGEX_HEADER_PGN.exec(pgn)) !== null) {
    const kunci = cocok[1];
    const nilai = cocok[2];
    if (kunci && nilai !== undefined) {
      header[kunci] = nilai.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  }
  return header;
}

/** Nama lama fungsi di atas; dipertahankan agar pemanggil lama tidak berubah. */
export const ekstraksHeaderPgn = parsePgnHeaders;

/**
 * Warna pemain dari data partai.
 * @returns {"white"|"black"|null}
 */
export function warnaPemain(partai, username) {
  if (!username) return null;
  const uname = username.toLowerCase();
  if (String(partai.whiteName || "").toLowerCase() === uname) return "white";
  if (String(partai.blackName || "").toLowerCase() === uname) return "black";
  return null;
}

/**
 * Hasil dari sudut pemain: "win"|"loss"|"draw"|null.
 *
 * `partai.result` sudah dinormalisasi ke "white"|"black"|"draw" oleh
 * `normalisasiHasil()` di basisData.js.
 */
function hasilPemain(partai, warna) {
  const r = partai.result;
  if (!r) return null;
  if (r === "draw") return "draw";
  if (r === warna) return "win";
  // r adalah warna lawan → pemain kalah
  if (r === "white" || r === "black") return "loss";
  return null;
}

/**
 * Hitung menang/seri/kalah.
 */
export function hitungHasil(partai, username) {
  let wins = 0;
  let losses = 0;
  let draws = 0;

  for (const p of partai) {
    const warna = warnaPemain(p, username);
    if (!warna) continue;
    const hasil = hasilPemain(p, warna);
    if (hasil === "win") wins++;
    else if (hasil === "loss") losses++;
    else if (hasil === "draw") draws++;
  }

  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
  return { wins, losses, draws, total, winRate };
}

/**
 * Tren rating — setiap partai menjadi satu titik data, diurut dari lama ke baru.
 */
export function hitungTrenRating(partai, username) {
  const titik = [];

  for (const p of partai) {
    const warna = warnaPemain(p, username);
    if (!warna) continue;
    const rating = warna === "white" ? p.whiteElo : p.blackElo;
    if (!Number.isFinite(rating) || rating <= 0) continue;

    titik.push({
      date: Math.floor((p.timestamp || 0) / 1000), // konversi ms → detik untuk tampilan
      rating,
      gameId: p.id,
      result: hasilPemain(p, warna) || "draw",
      timeClass: p.timeClass || "",
    });
  }

  titik.sort((a, b) => a.date - b.date);
  return titik;
}

/**
 * Streak (rentetan) menang/kalah/seri terbaru.
 */
export function hitungStreak(partai, username) {
  if (!partai.length) return { type: "none", count: 0 };

  // Urutkan terbaru dulu
  const diurut = [...partai]
    .filter((p) => {
      const warna = warnaPemain(p, username);
      return warna && hasilPemain(p, warna);
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (!diurut.length) return { type: "none", count: 0 };

  const warnaTerbaru = warnaPemain(diurut[0], username);
  const hasilTerbaru = hasilPemain(diurut[0], warnaTerbaru);
  if (!hasilTerbaru) return { type: "none", count: 0 };

  let count = 0;
  for (const p of diurut) {
    const warna = warnaPemain(p, username);
    const hasil = hasilPemain(p, warna);
    if (hasil === hasilTerbaru) count++;
    else break;
  }

  return { type: hasilTerbaru, count };
}

/**
 * Nama pembukaan dari slug `[ECOUrl]` — SALINAN `formatEcoUrlName` acuan
 * (`features/profile-insights/aggregations.ts`): ambil segmen terakhir path,
 * `decodeURIComponent`, lalu ubah `-`/`_` menjadi spasi. Bila URL-nya tidak
 * sah, acuan tetap mencoba memotong string mentahnya — jalur cadangan itu
 * ikut disalin supaya hasilnya sama untuk header yang rusak.
 */
export function formatEcoUrlName(ecoUrl) {
  if (!ecoUrl) return undefined;
  try {
    const url = new URL(ecoUrl);
    const bagian = url.pathname.split("/").filter(Boolean);
    const slug = bagian[bagian.length - 1];
    if (!slug) return undefined;
    return decodeURIComponent(slug).replace(/[-_]+/g, " ").trim();
  } catch {
    const bagian = ecoUrl.split("/");
    const slug = bagian[bagian.length - 1];
    return slug ? slug.replace(/[-_]+/g, " ").trim() : undefined;
  }
}

/**
 * Delapan token pertama movetext — SALINAN `extractFirstMovesFromPgn` acuan.
 *
 * Perhatikan apa yang SENGAJA tidak dilakukan acuan (dan karena itu tidak
 * dilakukan di sini juga): nomor langkah ("1.", "2.") TIDAK dibuang, dan
 * anotasi clock `{[%clk …]}` hanya bersih bila kurung kurawalnya tidak
 * bersarang. Uji acuan (`tests/profile-insights/aggregations.test.ts`)
 * mengunci keluarannya sebagai `"1. e4 d5 2. exd5 Qxd5"` — angka itulah yang
 * dijadikan acuan di sini, bukan tafsiran sendiri.
 */
export function extractFirstMovesFromPgn(pgn) {
  if (!pgn) return "";
  const isi = pgn
    .replace(/^\[[^\]]*\]/gm, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const token = isi.split(" ").filter(Boolean);
  const langkah = [];
  for (const t of token) {
    if (t === "1-0" || t === "0-1" || t === "1/2-1/2" || t === "*") break;
    langkah.push(t);
    if (langkah.length >= 8) break;
  }
  return langkah.join(" ");
}

/** Label cadangan bawaan — teks Inggris persis milik acuan. */
export const LABEL_PEMBUKAAN = Object.freeze({
  dariEco: (eco) => `Opening ${eco}`,
  tidakDiketahui: "Unknown Opening",
});

/**
 * Pembukaan teratas per warna — SALINAN `computeOpeningStats` acuan.
 *
 * Rantai nama inilah yang membuat kartunya tidak lagi penuh "Tidak diketahui"
 * untuk partai Chess.com: PGN Chess.com TIDAK punya tag `[Opening]`, hanya
 * `[ECO]` + `[ECOUrl]`, sementara versi lama fungsi ini cuma membaca
 * `[Opening]`. Urutan cadangannya mengikuti acuan:
 *   1. `[Opening]`
 *   2. slug `[ECOUrl]` (mis. `.../Sicilian-Defense` → "Sicilian Defense")
 *   3. `Opening <ECO>` bila hanya `[ECO]` yang ada
 *   4. label "tidak diketahui"
 *
 * Pengelompokan per nama, hitungan hasil, `winRate` (1 desimal), urutan
 * (jumlah partai desc lalu winRate desc), dan potongan `batas` semuanya
 * mengikuti acuan apa adanya.
 *
 * @param {object[]} partai daftar partai (butuh `pgn`, `whiteName`/`blackName`, `result`)
 * @param {"all"|"white"|"black"} warna
 * @param {number|null} [batas=5] batas jumlah baris (`Infinity`/`null` = semua)
 * @param {{ dariEco?: Function, tidakDiketahui?: string }} [label] teks
 *   cadangan; di UI diisi dari kamus i18n, di uji dibiarkan bawaan acuan.
 */
export function hitungPembukaanTeratas(partai, username, warna, batas = 5, label = LABEL_PEMBUKAAN) {
  const labelEco = typeof label?.dariEco === "function" ? label.dariEco : LABEL_PEMBUKAAN.dariEco;
  const labelTidakDiketahui = label?.tidakDiketahui || LABEL_PEMBUKAAN.tidakDiketahui;
  const semuaWarna = warna === "all";

  const partaiWarna = (Array.isArray(partai) ? partai : []).filter((p) => {
    const sisi = warnaPemain(p, username);
    return semuaWarna ? Boolean(sisi) : sisi === warna;
  });
  const peta = new Map();

  for (const p of partaiWarna) {
    const sisi = semuaWarna ? warnaPemain(p, username) : warna;
    if (!sisi) continue;
    const header = parsePgnHeaders(p.pgn);
    const eco = (header.ECO || "").trim() || undefined;
    const nama =
      (header.Opening || "").trim() ||
      formatEcoUrlName(header.ECOUrl) ||
      (eco ? labelEco(eco) : labelTidakDiketahui);

    let entri = peta.get(nama);
    if (!entri) {
      entri = {
        eco,
        name: nama,
        moves: extractFirstMovesFromPgn(p.pgn),
        wins: 0,
        losses: 0,
        draws: 0,
      };
      peta.set(nama, entri);
    } else if (!entri.eco && eco) {
      entri.eco = eco;
    }

    const hasil = hasilPemain(p, sisi);
    if (hasil === "win") entri.wins += 1;
    else if (hasil === "loss") entri.losses += 1;
    else if (hasil === "draw") entri.draws += 1;
  }

  const daftar = Array.from(peta.values()).map((item) => {
    const played = item.wins + item.losses + item.draws;
    const winRate = played > 0 ? Math.round((item.wins / played) * 1000) / 10 : 0;
    return { ...item, played, winRate };
  });

  daftar.sort((a, b) => (b.played !== a.played ? b.played - a.played : b.winRate - a.winRate));
  return batas == null || !Number.isFinite(batas) ? daftar : daftar.slice(0, batas);
}

/**
 * Ringkasan akurasi + kesalahan taktikal — SALINAN `computeTacticalStats`
 * repo acuan ChessGameReviewer (`features/profile-insights/aggregations.ts`).
 *
 * Dua tingkat sumber, PERSIS seperti acuan (bukan karangan sendiri):
 *
 *   1. `analysisMap[game.id]` — hasil analisis engine partai itu. Bila ada dan
 *      `summary`-nya lengkap, yang diambil adalah ringkasan warna pemain
 *      (`eligibleMoves`, `accuracyEstimate`, dan `breakdown` blunder/mistake/
 *      inaccuracy/miss), lalu `analyzedGamesCount` ditambah satu.
 *   2. `else if (game.accuracies)` — akurasi TERBITAN PLATFORM yang ikut
 *      tersimpan saat tarik data (Chess.com mengirim `accuracies.white/black`
 *      di arsip bulanannya; lihat `akun/muatPartaiAkun.js`). Hanya akurasinya
 *      yang ikut; hitungan kesalahan tidak, karena platform tidak mengirimnya.
 *
 * Aturan agregasinya juga disalin apa adanya, termasuk dua hal yang mudah
 * "diperbaiki" sendiri dan justru membuat angkanya menyimpang dari acuan:
 *   - `avgAccuracy` adalah rata-rata ARITMETIK per PARTAI (bukan berbobot
 *     jumlah langkah, bukan harmonic mean), dibulatkan 1 desimal;
 *   - `blundersPerGame` dibagi `analyzedGamesCount` (hanya partai yang
 *     dianalisis engine), sehingga 0 bila tidak ada satu pun.
 *
 * `null` untuk `avgAccuracy` berarti "belum ada evaluasi" — itu keadaan jujur,
 * bukan galat: acuan pun menampilkannya sebagai "No evaluations yet".
 *
 * BENTUK MASUKAN juga disamakan dengan acuan supaya tidak ada tafsiran kedua:
 * setiap partai harus membawa `id`, `userColor` ("white"/"black"), dan
 * `accuracies` ({ white, black }). `agregasiWawasan` yang menyesuaikan record
 * repo ini ke bentuk itu — fungsi ini tidak menebak-nebak nama field.
 *
 * @param {object[]} partai daftar partai berbentuk acuan
 * @param {Object<string, object>} analysisMap id partai → hasil `ringkasAnalisis`
 */
export function hitungTaktikal(partai, analysisMap = {}) {
  let totalEvaluatedMoves = 0;
  let blunders = 0;
  let mistakes = 0;
  let inaccuracies = 0;
  let misses = 0;
  let analyzedGamesCount = 0;

  let accuracySum = 0;
  let accuracyCount = 0;

  for (const game of Array.isArray(partai) ? partai : []) {
    const analysis = analysisMap?.[game?.id];

    // Ringkasan harus tersedia untuk warna pemain ini; keberadaan objek
    // analysis.summary saja belum membuktikan bahwa sisi pemain ikut dianalisis.
    const sisi = game?.userColor === "black" ? "b" : "w";
    const colorSummary = analysis?.summary?.[game?.userColor] ?? analysis?.summary?.[sisi];

    if (colorSummary && typeof colorSummary === "object") {
      analyzedGamesCount += 1;
      totalEvaluatedMoves += colorSummary.eligibleMoves ?? 0;
      if (
        colorSummary.accuracyEstimate !== null &&
        Number.isFinite(colorSummary.accuracyEstimate)
      ) {
        accuracySum += colorSummary.accuracyEstimate;
        accuracyCount += 1;
      }
      if (colorSummary.breakdown) {
        blunders += colorSummary.breakdown.blunder ?? 0;
        mistakes += colorSummary.breakdown.mistake ?? 0;
        inaccuracies += colorSummary.breakdown.inaccuracy ?? 0;
        misses += colorSummary.breakdown.miss ?? 0;
      }
    } else if (game?.accuracies) {
      const acc = game.accuracies[game.userColor];
      if (typeof acc === "number" && Number.isFinite(acc)) {
        accuracySum += acc;
        accuracyCount += 1;
      }
    }
  }

  const avgAccuracy = accuracyCount > 0 ? Math.round((accuracySum / accuracyCount) * 10) / 10 : null;
  const blundersPerGame =
    analyzedGamesCount > 0 ? Math.round((blunders / analyzedGamesCount) * 100) / 100 : 0;

  return {
    totalEvaluatedMoves,
    avgAccuracy,
    blunders,
    mistakes,
    inaccuracies,
    misses,
    blundersPerGame,
    /*
     * Tambahan di luar acuan, khusus untuk teks UI yang jujur: berapa partai
     * yang ikut menyumbang angka akurasi, supaya pertanyaan "kenapa belum
     * semua partai terhitung" terjawab tanpa harus menebak.
     */
    analyzedGamesCount,
    accuracyCount,
  };
}


/**
 * Filter partai berdasarkan waktu dan rentang tanggal.
 */
export function filterPartaiWawasan(partai, filter = {}, nowMs = Date.now()) {
  const opsi = filter && typeof filter === "object" ? filter : {};
  const timeClass = opsi.timeClass || "all";
  const dateRange = opsi.dateRange || "all";
  let minTimestamp = null;

  if (dateRange === "30d") minTimestamp = nowMs - 30 * 86400000;
  else if (dateRange === "90d") minTimestamp = nowMs - 90 * 86400000;
  else if (dateRange === "365d") minTimestamp = nowMs - 365 * 86400000;

  const daftar = Array.isArray(partai) ? partai : [];
  return daftar.filter((p) => {
    if (!p || typeof p !== "object") return false;
    // Filter kecepatan
    if (timeClass !== "all" && p.timeClass !== timeClass) return false;
    // Filter rentang tanggal (timestamp dalam ms). Timestamp invalid dan
    // tanggal masa depan tidak boleh diam-diam lolos sebagai partai terbaru.
    if (minTimestamp !== null) {
      const timestamp = Number(p.timestamp);
      if (!Number.isFinite(timestamp) || timestamp < minTimestamp || timestamp > nowMs) return false;
    }
    return true;
  });
}

/**
 * Agregasi seluruh wawasan — SALINAN `aggregateAllInsights` acuan.
 *
 * Bedanya hanya bentuk masukan, karena data partai repo ini menyimpan nama
 * kedua pemain + hasil dari sudut putih ("white"/"black"/"draw"), bukan
 * `userColor`/`result` siap pakai milik acuan: warna pemain diturunkan dari
 * `username` lewat `warnaPemain`, dan hasil pemain lewat `hasilPemain`.
 *
 * @param {object[]} partai
 * @param {string} username
 * @param {object} filter lihat `filterPartaiWawasan`
 * @param {Object<string, object>} analysisMap id partai → hasil analisis
 *   engine sesi ini (./analisisTersimpan.js). Tanpa peta ini kartu Akurasi
 *   tetap bisa terisi dari akurasi terbitan platform.
 * @param {object} [label] teks cadangan nama pembukaan (i18n)
 */
export function agregasiWawasan(partai, username, filter = {}, analysisMap = {}, label) {
  const difilter = filterPartaiWawasan(partai, filter);

  const hasilUmum = hitungHasil(difilter, username);

  const partaiPutih = difilter.filter((p) => warnaPemain(p, username) === "white");
  const partaiHitam = difilter.filter((p) => warnaPemain(p, username) === "black");
  const sebagaiPutih = hitungHasil(partaiPutih, username);
  const sebagaiHitam = hitungHasil(partaiHitam, username);

  const trenRating = hitungTrenRating(difilter, username);
  const streak = hitungStreak(difilter, username);

  const peakRating = trenRating.length > 0
    ? Math.max(...trenRating.map((p) => p.rating))
    : null;

  const pembukaanSemua = hitungPembukaanTeratas(difilter, username, "all", Infinity, label);
  const pembukaPutih = hitungPembukaanTeratas(difilter, username, "white", Infinity, label);
  const pembukaanHitam = hitungPembukaanTeratas(difilter, username, "black", Infinity, label);

  /*
   * `computeTacticalStats(filtered, analysisMap)` di acuan — dua argumen,
   * tanpa opsi. Yang dikerjakan di sini hanyalah MENYESUAIKAN BENTUK record:
   * partai repo ini menyimpan nama kedua pemain + hasil dari sudut putih,
   * bukan `userColor` siap pakai, dan akurasi terbitan platform disimpan
   * sebagai `accuracies` (nama field acuan, `lib/db/schema.ts`).
   */
  const bentukAcuan = difilter.map((p) => ({
    ...p,
    userColor: warnaPemain(p, username),
  }));
  const taktikal = hitungTaktikal(bentukAcuan, analysisMap);

  return {
    totalPartai: difilter.length,
    hasilUmum,
    sebagaiPutih,
    sebagaiHitam,
    trenRating,
    streak,
    peakRating,
    pembukaanSemua,
    pembukaPutih,
    pembukaanHitam,
    taktikal,
  };
}
