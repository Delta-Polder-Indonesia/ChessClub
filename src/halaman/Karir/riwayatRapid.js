/** Riwayat rating publik untuk grafik kecil papan peringkat. */
const DASAR_CHESS = "https://api.chess.com/pub/player";
const KUNCI_CACHE = "kci-peringkat-riwayat-";
const KONTROL_DIDUKUNG = new Set(["rapid", "blitz", "bullet", "daily"]);
const UMUR_CACHE_MS = 60 * 60 * 1000;
const BATAS_PARTAI = 20;
const BATAS_WAKTU_MS = 12_000;
const JEDA_BATAS_MS = 60_000;

const cache = new Map();
let antrean = Promise.resolve();
let batasSampai = 0;

function namaSah(username) {
  const nama = String(username ?? "").trim().toLowerCase();
  return /^[a-z0-9_-]{3,25}$/.test(nama) ? nama : "";
}

function kunciCache(nama, jenis) {
  return `${KUNCI_CACHE}${jenis}-v1-${nama}`;
}

function bacaCache(nama, jenis) {
  const kunci = kunciCache(nama, jenis);
  let entri = cache.get(kunci);
  if (!entri) {
    try {
      const tersimpan = localStorage.getItem(kunci);
      entri = tersimpan ? JSON.parse(tersimpan) : null;
    } catch {
      return null;
    }
  }
  const usia = Date.now() - entri?.disimpanPada;
  if (!Number.isFinite(usia) || usia < 0 || usia >= UMUR_CACHE_MS || !Array.isArray(entri?.nilai)
    || entri.nilai.length > BATAS_PARTAI
    || !entri.nilai.every((titik) => Number.isFinite(titik?.waktu) && titik.waktu > 0
      && Number.isFinite(new Date(titik.waktu * 1000).getTime())
      && Number.isSafeInteger(titik?.rating) && titik.rating > 0)) return null;
  cache.set(kunci, entri);
  return entri.nilai;
}

function simpanCache(nama, jenis, nilai) {
  const entri = { disimpanPada: Date.now(), nilai };
  const kunci = kunciCache(nama, jenis);
  cache.set(kunci, entri);
  try {
    localStorage.setItem(kunci, JSON.stringify(entri));
  } catch {
    /* Penyimpanan mungkin penuh atau tidak tersedia; cache memori tetap dipakai. */
  }
}

function galatBatal() {
  return new DOMException("Pengambilan riwayat dibatalkan", "AbortError");
}

async function ambilJson(url, signal, bolehKosong = false) {
  if (signal?.aborted) throw galatBatal();
  if (Date.now() < batasSampai) throw new Error("Chess.com sedang membatasi permintaan");
  const kontrol = new AbortController();
  const batalkan = () => kontrol.abort();
  const waktu = setTimeout(batalkan, BATAS_WAKTU_MS);
  signal?.addEventListener("abort", batalkan, { once: true });
  try {
    const respons = await fetch(url, { signal: kontrol.signal });
    if (bolehKosong && (respons.status === 404 || respons.status === 410)) return { games: [] };
    if (!respons.ok) {
      if (respons.status === 429) batasSampai = Date.now() + JEDA_BATAS_MS;
      throw new Error(`Chess.com menjawab ${respons.status}`);
    }
    return await respons.json();
  } finally {
    clearTimeout(waktu);
    signal?.removeEventListener("abort", batalkan);
  }
}

/** Tiga bulan kalender sebelum partai terakhir, dengan akhir bulan yang sah. */
function awalRentang(akhir) {
  const t = new Date(akhir * 1000);
  const bulanAwal = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 3, 1));
  const akhirBulan = new Date(Date.UTC(bulanAwal.getUTCFullYear(), bulanAwal.getUTCMonth() + 1, 0)).getUTCDate();
  bulanAwal.setUTCDate(Math.min(t.getUTCDate(), akhirBulan));
  bulanAwal.setUTCHours(t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds(), 0);
  return Math.floor(bulanAwal.getTime() / 1000);
}

function titikDariPartai(partai, nama, jenis, awal, akhir) {
  if (partai?.rated !== true || partai?.time_class !== jenis || partai?.rules !== "chess") return null;
  const waktu = partai.end_time;
  if (!Number.isFinite(waktu) || waktu < awal || waktu > akhir) return null;
  const pemain = [partai.white, partai.black].find((sisi) => String(sisi?.username ?? "").toLowerCase() === nama);
  if (!Number.isSafeInteger(pemain?.rating) || pemain.rating <= 0) return null;
  return { waktu, rating: pemain.rating };
}

async function ambilRiwayat(nama, jenis, signal) {
  const dasar = `${DASAR_CHESS}/${encodeURIComponent(nama)}`;
  const statistik = await ambilJson(`${dasar}/stats`, signal);
  const akhir = statistik?.[`chess_${jenis}`]?.last?.date;
  if (!Number.isFinite(akhir) || akhir <= 0 || !Number.isFinite(new Date(akhir * 1000).getTime())) return [];

  const awal = awalRentang(akhir);
  const tanggalAkhir = new Date(akhir * 1000);
  const tanggalAwal = new Date(awal * 1000);
  const bulanAwal = Date.UTC(tanggalAwal.getUTCFullYear(), tanggalAwal.getUTCMonth(), 1);
  const bulan = new Date(Date.UTC(tanggalAkhir.getUTCFullYear(), tanggalAkhir.getUTCMonth(), 1));
  const nilai = [];

  // Arsip bulanan diambil dari yang terbaru, berhenti segera bila 20 titik cukup.
  while (bulan.getTime() >= bulanAwal && nilai.length < BATAS_PARTAI) {
    const tahun = bulan.getUTCFullYear();
    const nomorBulan = String(bulan.getUTCMonth() + 1).padStart(2, "0");
    const arsip = await ambilJson(`${dasar}/games/${tahun}/${nomorBulan}`, signal, true);
    if (!Array.isArray(arsip?.games)) throw new Error("Arsip Chess.com tidak sah");
    for (const partai of arsip.games) {
      const titik = titikDariPartai(partai, nama, jenis, awal, akhir);
      if (titik) nilai.push(titik);
    }
    bulan.setUTCMonth(bulan.getUTCMonth() - 1);
  }
  return nilai.sort((a, b) => a.waktu - b.waktu).slice(-BATAS_PARTAI);
}

/**
 * Serialisasi semua pengambilan grafik: Chess.com dapat membatasi permintaan
 * paralel. Pekerjaan dalam antrean yang sudah dibatalkan tidak mengakses API.
 */
export function muatRiwayatRating(username, { kontrol = "Rapid", signal } = {}) {
  const nama = namaSah(username);
  const jenis = String(kontrol ?? "").toLowerCase();
  if (!nama || !KONTROL_DIDUKUNG.has(jenis)) return Promise.resolve([]);
  if (signal?.aborted) return Promise.reject(galatBatal());
  const tersimpan = bacaCache(nama, jenis);
  if (tersimpan) return Promise.resolve(tersimpan);

  const pekerjaan = antrean.then(async () => {
    if (signal?.aborted) throw galatBatal();
    const sebelumnya = bacaCache(nama, jenis);
    if (sebelumnya) return sebelumnya;
    const nilai = await ambilRiwayat(nama, jenis, signal);
    if (signal?.aborted) throw galatBatal();
    simpanCache(nama, jenis, nilai);
    return nilai;
  });
  antrean = pekerjaan.then(() => undefined, () => undefined);
  return pekerjaan;
}

// Panggilan Rapid yang sudah ada tetap memakai kunci cache dan perilaku semula.
export function muatRiwayatRapid(username, { signal } = {}) {
  return muatRiwayatRating(username, { kontrol: "Rapid", signal });
}
