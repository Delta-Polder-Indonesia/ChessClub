/**
 * Logika wawasan (Insights) profil pemain — adaptasi dari fitur Profile
 * Insights di ChessGameReviewer. Mengagregasi data partai tersimpan di
 * IndexedDB menjadi ringkasan performa: KPI, tren rating, distribusi hasil,
 * pembukaan teratas, dan ringkasan taktikal.
 *
 * MURNI — tidak ada React, tidak ada DOM. Semua fungsi menerima array partai
 * dan mengembalikan objek data yang siap dirender.
 *
 * Data partai diambil dari basisData.js (ambilDaftarPartai); setiap partai
 * memiliki shape yang sudah dipakai deteksiEngine/antiCheatRiwayat:
 *   { id, pgn, white, black, result, timestamp, timeClass, ... }
 */

/**
 * Hitung jumlah menang/seri/kalah dari sudut pemain tertentu.
 * @param {Array} partai - daftar partai
 * @param {string} username - nama pemain
 * @returns {{ wins: number, losses: number, draws: number, total: number, winRate: number }}
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

/* hitungHasilPerWarna sudah dihitung di agregasiWawasan() — tidak perlu terpisah. */

/**
 * Tentukan warna pemain dari data partai.
 */
export function warnaPemain(partai, username) {
  if (!username) return null;
  const uname = username.toLowerCase();
  const w = String(partai.white || "").toLowerCase();
  const b = String(partai.black || "").toLowerCase();
  if (w === uname) return "white";
  if (b === uname) return "black";
  return null;
}

/**
 * Hasil pemain dari data partai (win/loss/draw).
 * result biasanya "1-0", "0-1", "1/2-1/2", "*", atau teks seperti
 * "win", "agreed", "repetition", dll (Chess.com).
 */
function hasilPemain(partai, warna) {
  const result = String(partai.result || "").trim();
  if (!result) return null;

  // Format PGN standar
  if (result === "1/2-1/2") return "draw";
  if (result === "1-0") return warna === "white" ? "win" : "loss";
  if (result === "0-1") return warna === "black" ? "win" : "loss";

  // Format Chess.com / teks
  const r = result.toLowerCase();
  if (r === "win") return "win";
  if (r === "loss" || r === "checkmated" || r === "timeout" || r === "resigned" || r === "abandoned") return "loss";
  if (r === "agreed" || r === "repetition" || r === "stalemate" || r === "insufficient" || r === "50move" || r === "timevsinsufficient") return "draw";

  return null;
}

/**
 * Tren rating dari riwayat partai. Setiap partai menjadi satu titik data.
 */
export function hitungTrenRating(partai, username) {
  const denganRating = partai
    .filter((p) => {
      const warna = warnaPemain(p, username);
      if (!warna) return false;
      const rating = ambilRating(p, warna);
      return Number.isFinite(rating) && rating > 0;
    })
    .map((p) => {
      const warna = warnaPemain(p, username);
      const rating = ambilRating(p, warna);
      return {
        date: p.timestamp ? Math.floor(new Date(p.timestamp).getTime() / 1000) : 0,
        rating,
        gameId: p.id,
        result: hasilPemain(p, warna) || "draw",
        timeClass: p.timeClass || "",
      };
    })
    .sort((a, b) => a.date - b.date);

  return denganRating;
}

/**
 * Hitung streak (rentetan) menang/kalah/seri terbaru.
 */
export function hitungStreak(partai, username) {
  if (!partai.length) return { type: "none", count: 0 };

  const denganHasil = partai
    .filter((p) => {
      const warna = warnaPemain(p, username);
      return warna && hasilPemain(p, warna);
    })
    .sort((a, b) => {
      const da = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const db = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return db - da; // terbaru dulu
    });

  if (!denganHasil.length) return { type: "none", count: 0 };

  const warnaTerbaru = warnaPemain(denganHasil[0], username);
  const hasilTerbaru = hasilPemain(denganHasil[0], warnaTerbaru);
  if (!hasilTerbaru) return { type: "none", count: 0 };

  let count = 0;
  for (const p of denganHasil) {
    const warna = warnaPemain(p, username);
    const hasil = hasilPemain(p, warna);
    if (hasil === hasilTerbaru) count++;
    else break;
  }

  return { type: hasilTerbaru, count };
}

/**
 * Statistik pembukaan teratas dari partai.
 */
export function hitungPembukaanTeratas(partai, username, warna, batas = 5) {
  const partaiWarna = partai.filter((p) => warnaPemain(p, username) === warna);
  const peta = new Map();

  for (const p of partaiWarna) {
    const nama = String(p.opening || p.ecoName || "Tidak diketahui").trim() || "Tidak diketahui";
    const eco = p.eco || undefined;
    let entri = peta.get(nama);
    if (!entri) {
      entri = { name: nama, eco, moves: p.openingMoves || "", wins: 0, losses: 0, draws: 0 };
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
 * Ringkasan taktikal dari hasil anti-cheat agregat (bila tersedia).
 */
export function hitungTaktikal(hasilAntiCheat) {
  if (!hasilAntiCheat?.agregat) {
    return {
      totalLangkahDinilai: 0,
      avgAkurasi: null,
      blunder: 0,
      mistakes: 0,
      inaccuracies: 0,
      misses: 0,
      blunderPerPartai: 0,
    };
  }

  const agregat = hasilAntiCheat.agregat;
  const jumlahPartai = agregat.jumlahPartai || 1;

  return {
    totalLangkahDinilai: agregat.jumlahLangkah || 0,
    avgAkurasi: Number.isFinite(agregat.akurasi) ? Math.round(agregat.akurasi * 10) / 10 : null,
    blunder: agregat.jumlahBlunder || 0,
    mistakes: agregat.jumlahMistake || 0,
    inaccuracies: agregat.jumlahInaccuracy || 0,
    misses: agregat.jumlahMiss || 0,
    blunderPerPartai: Math.round(((agregat.jumlahBlunder || 0) / jumlahPartai) * 100) / 100,
  };
}

/**
 * Ambil rating dari partai.
 */
function ambilRating(partai, warna) {
  if (warna === "white") {
    return partai.whiteRating || partai.white_elo || partai.elo_white || null;
  }
  return partai.blackRating || partai.black_elo || partai.elo_black || null;
}

/**
 * Filter partai berdasarkan opsi.
 */
export function filterPartaiWawasan(partai, filter, nowMs = Date.now()) {
  const nowSec = Math.floor(nowMs / 1000);
  let minDate = null;
  if (filter.dateRange === "30d") minDate = nowSec - 30 * 86400;
  else if (filter.dateRange === "90d") minDate = nowSec - 90 * 86400;
  else if (filter.dateRange === "365d") minDate = nowSec - 365 * 86400;

  return partai.filter((p) => {
    if (filter.timeClass !== "all" && p.timeClass !== filter.timeClass) return false;
    if (filter.color !== "all") {
      // color filter akan diterapkan di downstream; di sini hanya waktu
    }
    if (minDate !== null) {
      const ts = p.timestamp ? Math.floor(new Date(p.timestamp).getTime() / 1000) : 0;
      if (ts < minDate) return false;
    }
    return true;
  });
}

/**
 * Agregasi seluruh wawasan dari daftar partai.
 */
export function agregasiWawasan(partai, username, filter = {}, hasilAntiCheat = null) {
  const difilter = filterPartaiWawasan(partai, filter);

  const hasilUmum = hitungHasil(difilter, username);

  // Hasil per warna
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
  const taktikal = hitungTaktikal(hasilAntiCheat);

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
    taktikal,
  };
}
