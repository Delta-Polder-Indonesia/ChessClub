/**
 * Statistik akun pemain untuk dashboard (gaya en-croissant).
 *
 * Fungsi di sini MURNI: menerima daftar partai (metadata dari basisData atau
 * dari hasil pengambilan API) + nama akun, lalu mengembalikan data siap
 * render untuk tiga tab: Overview, Ratings, Openings. Tidak bergantung pada
 * React maupun DOM sehingga mudah diuji.
 */

const RANGE = {
  "7d": 7 * 24 * 3600 * 1000,
  "30d": 30 * 24 * 3600 * 1000,
  "90d": 90 * 24 * 3600 * 1000,
  "1y": 365 * 24 * 3600 * 1000,
  all: Infinity,
};

/** Untuk pemain `username`, tentukan sisi, rating, hasil, dan lawan. */
export function infoPartaiUntuk(p, username) {
  const u = String(username ?? "").trim().toLowerCase();
  if (!u) return null;
  const diPutih = String(p.whiteName ?? "").trim().toLowerCase() === u;
  const diHitam = String(p.blackName ?? "").trim().toLowerCase() === u;
  if (!diPutih && !diHitam) return null;

  const sides = diPutih ? "white" : "black";
  const rating = diPutih ? Number(p.whiteElo) || 0 : Number(p.blackElo) || 0;
  const oppRating = diPutih ? Number(p.blackElo) || 0 : Number(p.whiteElo) || 0;
  const oppName = diPutih ? p.blackName : p.whiteName;

  let outcome; // win | draw | loss (relatif terhadap pemain)
  if (p.result === "white") outcome = diPutih ? "win" : "loss";
  else if (p.result === "black") outcome = diPutih ? "loss" : "win";
  else outcome = "draw";

  return {
    sides,
    diPutih,
    rating,
    oppRating,
    oppName,
    outcome,
    timeClass: String(p.timeClass || "unknown"),
    timestamp: Number(p.timestamp) || 0,
    plyCount: Number(p.plyCount) || 0,
  };
}

/** Ambil nama pembukaan dari header PGN (regex ringan, tanpa simulasi papan). */
export function bacaPembukaan(pgn) {
  if (typeof pgn !== "string" || !pgn) return "";
  const m = pgn.match(/\[Opening\s+"([^"]*)"\]/i);
  if (m && m[1]) return m[1].trim();
  const m2 = pgn.match(/\[ECOUrl\s+"([^"]*)"\]/i);
  if (m2 && m2[1]) {
    const slug = m2[1].split("/").pop() || "";
    return decodeURIComponent(slug).replace(/[-_]+/g, " ");
  }
  const e = pgn.match(/\[ECO\s+"([^"]*)"\]/i);
  return e && e[1] ? e[1].trim() : "";
}

/** Ringkasan tab Overview: total, menang/seri/kalah, dan partai per tahun. */
export function ringkasanOverview(games, username, { rentang = "all", timeClass = "any" } = {}) {
  const batas = RANGE[rentang] ?? Infinity;
  const sekarang = Date.now();
  const tahunan = new Map();
  let w = 0;
  let d = 0;
  let l = 0;
  const total = 0;

  let cocok = 0;
  for (const p of games) {
    const info = infoPartaiUntuk(p, username);
    if (!info) continue;
    if (rentang !== "all" && !(info.timestamp >= sekarang - batas)) continue;
    if (timeClass && timeClass !== "any" && info.timeClass !== timeClass) continue;
    cocok++;
    const tahun = info.timestamp ? new Date(info.timestamp).getFullYear() : 0;
    tahunan.set(tahun, (tahunan.get(tahun) || 0) + 1);
    if (info.outcome === "win") w++;
    else if (info.outcome === "loss") l++;
    else d++;
  }

  const daftarTahun = Array.from(tahunan.entries())
    .filter(([y]) => y > 0)
    .sort((a, b) => a[0] - b[0])
    .map(([y, n]) => ({ tahun: String(y), jumlah: n }));
  const totalCocok = w + d + l;
  const persen = (x) => (totalCocok ? Math.round((x / totalCocok) * 1000) / 10 : 0);

  return {
    total: totalCocok,
    w,
    d,
    l,
    persenW: persen(w),
    persenD: persen(d),
    persenL: persen(l),
    tahunan: daftarTahun,
  };
}

/** Riwayat rating untuk tab Ratings (urut waktu, opsional range). */
export function riwayatRating(games, username, { rentang = "all" } = {}) {
  const batas = RANGE[rentang] ?? Infinity;
  const sekarang = Date.now();
  const poin = [];
  for (const p of games) {
    const info = infoPartaiUntuk(p, username);
    if (!info) continue;
    if (!info.rating) continue;
    if (rentang !== "all" && !(info.timestamp >= sekarang - batas)) continue;
    poin.push({
      ts: info.timestamp,
      rating: info.rating,
      oppRating: info.oppRating,
      outcome: info.outcome,
      oppName: info.oppName,
    });
  }
  poin.sort((a, b) => a.ts - b.ts);
  const ratings = poin.map((x) => x.rating);
  const min = ratings.length ? Math.min(...ratings) : 0;
  const max = ratings.length ? Math.max(...ratings) : 0;
  return { poin, min, max, total: poin.length };
}

/** Ringkasan pembukaan untuk tab Openings, terpisah Putih & Hitam. */
export function rekapPembukaan(games, username, { rentang = "all", timeClass = "any" } = {}) {
  const batas = RANGE[rentang] ?? Infinity;
  const sekarang = Date.now();
  const putih = new Map();
  const hitam = new Map();

  for (const p of games) {
    const info = infoPartaiUntuk(p, username);
    if (!info) continue;
    if (rentang !== "all" && !(info.timestamp >= sekarang - batas)) continue;
    if (timeClass && timeClass !== "any" && info.timeClass !== timeClass) continue;
    const nama = bacaPembukaan(p.pgn) || "Lainnya";
    const peta = info.sides === "white" ? putih : hitam;
    const entri = peta.get(nama) || { nama, w: 0, d: 0, l: 0 };
    if (info.outcome === "win") entri.w++;
    else if (info.outcome === "loss") entri.l++;
    else entri.d++;
    peta.set(nama, entri);
  }

  const keDaftar = (peta, totalWarna) =>
    Array.from(peta.values())
      .map((e) => {
        const total = e.w + e.d + e.l;
        return {
          nama: e.nama,
          jumlah: total,
          persen: totalWarna ? Math.round((total / totalWarna) * 1000) / 10 : 0,
          w: e.w,
          d: e.d,
          l: e.l,
          persenW: total ? Math.round((e.w / total) * 1000) / 10 : 0,
          persenD: total ? Math.round((e.d / total) * 1000) / 10 : 0,
          persenL: total ? Math.round((e.l / total) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.jumlah - a.jumlah);

  const totalPutih = [...putih.values()].reduce((s, e) => s + e.w + e.d + e.l, 0);
  const totalHitam = [...hitam.values()].reduce((s, e) => s + e.w + e.d + e.l, 0);
  return { putih: keDaftar(putih, totalPutih), hitam: keDaftar(hitam, totalHitam) };
}
