/**
 * Pencari korpus komentar posisi (`public/data/komentator-master.json`) yang
 * diolah dari koleksi PGN beranotasi `ValdemarOrn/Chess`.
 *
 * Dimuat sekali secara malas (lazy) saat `/papan-interaktif` atau
 * `/papan-interaktif/manusia-vs-mesin` dibuka, lalu dicari secara sinkron O(1)
 * lewat hash `(epdSebelum, san)`. Kegagalan jaringan atau ketiadaan `fetch`
 * (uji Node) ditelan diam-diam agar komentator posisional tetap berjalan mulus.
 */

const VERSI_KORPUS = "2026-11-03-v2";

let janjiKorpus = null;
let cacheKorpus = null;

function kunciEpd(fen) {
  return String(fen || "").trim().split(/\s+/).slice(0, 4).join(" ");
}

/**
 * Hash ganda 64-bit deterministik (16 karakter heksadesimal) untuk pasangan
 * posisi sebelum melangkah (4 ruas pertama FEN) dan SAN langkah.
 */
export function hashPosisiLangkah(fenSebelum, san) {
  const masukan = `${kunciEpd(fenSebelum)}|${String(san || "").trim()}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < masukan.length; i += 1) {
    const c = masukan.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}

function unduhKorpus() {
  if (typeof fetch !== "function") return Promise.resolve({});
  const dasar =
    typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL
      ? import.meta.env.BASE_URL
      : "/";
  return fetch(`${dasar}data/komentator-master.json?v=${VERSI_KORPUS}`)
    .then((respon) => (respon.ok ? respon.json() : {}))
    .catch(() => ({}));
}

/**
 * Muat peta komentar posisi sekali per kunjungan. Mengembalikan objek peta
 * mentah (atau `{}` bila belum tersedia / luring).
 */
export function muatKorpusMaster() {
  if (cacheKorpus) return Promise.resolve(cacheKorpus);
  janjiKorpus ||= unduhKorpus().then((peta) => {
    if (peta && typeof peta === "object" && Object.keys(peta).length > 0) {
      cacheKorpus = peta;
      return peta;
    }
    janjiKorpus = null;
    return {};
  });
  return janjiKorpus;
}

/** Ambil peta yang sudah di-cache secara sinkron (atau `null` bila belum siap). */
export function intipKorpusMaster() {
  return cacheKorpus;
}

/**
 * Cari komentar posisi untuk satu langkah `(fenSebelum, san)`.
 *
 * @param {object|null} peta hasil `muatKorpusMaster()` / `intipKorpusMaster()`
 * @param {string} fenSebelum FEN sebelum langkah dimainkan
 * @param {string} san notasi SAN baku langkah
 * @returns {{kunci: string, id: string, en: string}|null}
 */
export function cariCatatanMaster(peta, fenSebelum, san) {
  const sumber = peta || cacheKorpus;
  if (!sumber || !fenSebelum || !san) return null;
  const kunci = hashPosisiLangkah(fenSebelum, san);
  const entri = sumber[kunci];
  if (!Array.isArray(entri)) return null;
  const [id = "", en = ""] = entri;
  if (!id && !en) return null;
  return { kunci, id, en };
}
