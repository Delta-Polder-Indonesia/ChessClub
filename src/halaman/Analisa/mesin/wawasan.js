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
 * Ringan: hanya regex pada teks, tanpa chess.js.
 */
export function ekstraksHeaderPgn(pgn) {
  if (typeof pgn !== "string" || !pgn) return {};
  const header = {};
  const re = /\[(\w+)\s+"([^"]*)"\]/g;
  let m;
  while ((m = re.exec(pgn)) !== null) {
    header[m[1]] = m[2];
  }
  return header;
}

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
 * Pembukaan teratas dari PGN headers [Opening] dan [ECO].
 */
export function hitungPembukaanTeratas(partai, username, warna, batas = 5) {
  const partaiWarna = partai.filter((p) => warnaPemain(p, username) === warna);
  const peta = new Map();

  for (const p of partaiWarna) {
    const header = ekstraksHeaderPgn(p.pgn);
    const nama = (header.Opening || "").trim() || "Tidak diketahui";
    const eco = (header.ECO || "").trim() || undefined;

    let entri = peta.get(nama);
    if (!entri) {
      entri = { name: nama, eco, wins: 0, losses: 0, draws: 0 };
      peta.set(nama, entri);
    }

    const hasil = hasilPemain(p, warna);
    if (hasil === "win") entri.wins++;
    else if (hasil === "loss") entri.losses++;
    else if (hasil === "draw") entri.draws++;
  }

  const hasil = Array.from(peta.values()).map((item) => {
    const played = item.wins + item.losses + item.draws;
    const winRate = played > 0 ? Math.round((item.wins / played) * 1000) / 10 : 0;
    return { ...item, played, winRate };
  });

  hasil.sort((a, b) => b.played !== a.played ? b.played - a.played : b.winRate - a.winRate);
  return hasil.slice(0, batas);
}

/**
 * Ringkasan akurasi dari partai — dihitung dari akurasi per-pemain jika
 * tersedia di data (mis. dari analisis Stockfish sebelumnya). Saat ini
 * IndexedDB belum menyimpan akurasi per partai, jadi ini mengembalikan
 * placeholder yang jujur (null).
 */
export function hitungAkurasi(partai, username) {
  // TODO: hubungkan ke hasil analisis Stockfish per partai bila sudah
  // tersedia di IndexedDB (skor kecocokan, ACPL, dll dari antiCheat.js).
  return { totalLangkahDinilai: 0, avgAkurasi: null };
}

/**
 * Filter partai berdasarkan waktu dan rentang tanggal.
 */
export function filterPartaiWawasan(partai, filter, nowMs = Date.now()) {
  let minTimestamp = null;
  if (filter.dateRange === "30d") minTimestamp = nowMs - 30 * 86400000;
  else if (filter.dateRange === "90d") minTimestamp = nowMs - 90 * 86400000;
  else if (filter.dateRange === "365d") minTimestamp = nowMs - 365 * 86400000;

  return partai.filter((p) => {
    // Filter kecepatan
    if (filter.timeClass !== "all" && p.timeClass !== filter.timeClass) return false;
    // Filter rentang tanggal (timestamp dalam ms)
    if (minTimestamp !== null && (p.timestamp || 0) < minTimestamp) return false;
    return true;
  });
}

/**
 * Agregasi seluruh wawasan.
 */
export function agregasiWawasan(partai, username, filter = {}) {
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

  const pembukaPutih = hitungPembukaanTeratas(difilter, username, "white");
  const pembukaanHitam = hitungPembukaanTeratas(difilter, username, "black");
  const akurasi = hitungAkurasi(difilter, username);

  return {
    totalPartai: difilter.length,
    hasilUmum,
    sebagaiPutih,
    sebagaiHitam,
    trenRating,
    streak,
    peakRating,
    pembukaPutih,
    pembukaanHitam,
    akurasi,
  };
}
