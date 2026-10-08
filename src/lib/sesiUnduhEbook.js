/**
 * Sesi pemohon e-book: nama, akun Chess.com, dan tiket per berkas.
 *
 * Mengapa ada: tiket unduhan e-book berlaku 15 MENIT (lihat
 * `server/src/tiket-ebook.js`) dan setelah terbit ia hanya hidup di state
 * komponen — setiap muat ulang halaman atau setiap buku baru, pemain harus
 * mengisi nama, akun, dan kode akses dari awal. Modul ini menyimpannya di
 * sessionStorage (hilang saat tab ditutup — sesuai umur tiket) sehingga:
 *   - isian nama & akun langsung terisi kembali,
 *   - tiket yang masih berlaku dipakai ulang (tidak menembak ulang kode
 *     akses yang sama, yang juga menambah hitungan di dashboard pengurus),
 *   - tiket kedaluwarsa / ditolak dibuang, lalu pemain memakai kode lagi.
 *
 * Modul ini sengaja bebas DOM, bebas `Buffer`, dan bebas efek samping supaya
 * berjalan di browser MAUPUN di Node (lihat scripts/uji-sesi-ebook.mjs).
 * Dekode base64url memakai `atob` + `TextDecoder`, bukan `Buffer` — `Buffer`
 * tidak ada di browser dan membuat seluruh tiket dianggap kedaluwarsa.
 * Batas umur di sini hanya jaring pengaman sisi klien; keputusan sah/tidak
 * tetap milik server (HMAC).
 */

const KUNCI_PEMOHON = "kci-ebook-pemohon";
const AWALAN_TIKET = "kci-ebook-tiket:";
/** Toleransi jam klien yang bergeser (detik). */
const TOLERANSI_DETIK = 60;
/** Jaring pengaman bila usia tiket pada token tidak terbaca. */
const UMUR_MAKS_DETIK = 15 * 60;

function penyimpanan(store) {
  if (store) return store;
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null; // mode privat / akses diblokir
  }
}

function bacaJson(store, kunci) {
  try {
    const mentah = store?.getItem(kunci);
    if (!mentah) return null;
    const nilai = JSON.parse(mentah);
    return nilai && typeof nilai === "object" ? nilai : null;
  } catch {
    return null;
  }
}

function tulisJson(store, kunci, nilai) {
  try {
    store?.setItem(kunci, JSON.stringify(nilai));
  } catch {
    /* kuota penuh / mode privat — sesi cukup dilewati */
  }
}

function hapus(store, kunci) {
  try {
    store?.removeItem(kunci);
  } catch {
    /* abaikan */
  }
}

/**
 * Uraikan base64url menjadi teks — TANPA `Buffer`.
 *
 * Modul ini juga jalan di browser, dan di sana `Buffer` tidak ada. Versi
 * sebelumnya memakai `Buffer.from(..., "base64url")` sehingga di browser setiap
 * tiket selalu dianggap "bentuknya tak dikenali" (diam-diam dilempar lalu
 * ditangkap): tiket sesi tidak pernah tersimpan dan pengguna selalu diminta
 * memasukkan kode lagi untuk buku yang sama. `atob` tersedia di browser modern
 * maupun Node >= 16, jadi jalur ini aman di keduanya; `Buffer` tetap dipakai
 * sebagai cadangan bila `atob` tidak ada (runtime lama/uji tertentu).
 */
function uraiBase64Url(teks) {
  if (typeof atob === "function") {
    const b64 = String(teks).replace(/-/g, "+").replace(/_/g, "/");
    const berpad = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const biner = atob(berpad);
    const bita = Uint8Array.from(biner, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bita);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(String(teks), "base64url").toString("utf8");
  }
  throw new Error("base64url tidak bisa diuraikan di lingkungan ini");
}

/**
 * Baca usia tiket dari token `kci-ebook-v1.<base64url>.<ttd>`.
 *
 * @returns {{ kedaluwarsa: number, acak: string } | null} dalam detik epoch,
 *          atau null bila bentuk token tidak dikenali (token versi lain).
 */
function infoTiket(tiket) {
  if (typeof tiket !== "string") return null;
  const bagian = tiket.split(".");
  if (bagian.length !== 3 || bagian[0] !== "kci-ebook-v1") return null;
  try {
    const muatan = JSON.parse(uraiBase64Url(bagian[1]));
    const kedaluwarsa = Number(muatan?.x);
    if (!Number.isFinite(kedaluwarsa)) return null;
    return { kedaluwarsa, acak: typeof muatan.j === "string" ? muatan.j : "" };
  } catch {
    return null;
  }
}

/** Sisa detik sebelum tiket kedaluwarsa; null bila bentuknya tak dikenali. */
function sisaDetik(tiket, sekarangMs = Date.now()) {
  const info = infoTiket(tiket);
  if (!info) return null;
  return info.kedaluwarsa - Math.floor(sekarangMs / 1000);
}

/**
 * Apakah tiket ini masih layak dipakai? Batasnya sama dengan pengambilan tiket
 * sesi: sisa <60 detik dianggap tidak layak karena server bisa menolaknya di
 * tengah unduhan/render.
 *
 * @param {string} tiket
 * @returns {boolean}
 */
export function tiketBelumKedaluwarsa(tiket, { sekarangMs = Date.now() } = {}) {
  const sisa = sisaDetik(tiket, sekarangMs);
  return sisa !== null && sisa >= TOLERANSI_DETIK;
}

/**
 * Buang tiket yang sudah kedaluwarsa / bentuknya tak dikenali.
 * @returns {number} jumlah tiket yang dibuang (0 bila tidak ada perubahan).
 */
export function bersihkanSesiEbook({ sekarangMs = Date.now(), store } = {}) {
  const s = penyimpanan(store);
  if (!s) return 0;
  let dibuang = 0;
  try {
    for (const kunci of Object.keys(s)) {
      if (!kunci.startsWith(AWALAN_TIKET)) continue;
      const nilai = bacaJson(s, kunci);
      const sisa = sisaDetik(nilai?.tiket, sekarangMs);
      if (sisa === null || sisa <= -TOLERANSI_DETIK) {
        hapus(s, kunci);
        dibuang += 1;
      }
    }
  } catch {
    /* penyimpanan tidak bisa dienumerasi — lewati */
  }
  return dibuang;
}

/** Nama & akun pemohon terakhir (untuk mengisi ulang formulir). */
export function ambilPemohonEbook({ store } = {}) {
  return bacaJson(penyimpanan(store), KUNCI_PEMOHON);
}

/** Simpan nama & akun pemohon; nilai kosong diabaikan. */
export function simpanPemohonEbook({ nama, akun, store } = {}) {
  const bersih = {
    nama: String(nama ?? "").trim(),
    akun: String(akun ?? "").trim(),
  };
  if (!bersih.nama || !bersih.akun) return;
  tulisJson(penyimpanan(store), KUNCI_PEMOHON, bersih);
}

/** Buang jejak pemohon (mis. setelah pengguna menutup sesi). */
export function hapusPemohonEbook({ store } = {}) {
  hapus(penyimpanan(store), KUNCI_PEMOHON);
}

/**
 * Tiket sesi untuk satu berkas — null bila tidak ada, berkas tidak cocok,
 * bentuknya tak dikenali, atau sudah lewat masa berlaku.
 */
export function ambilTiketSesi({ file, store, sekarangMs = Date.now() } = {}) {
  const s = penyimpanan(store);
  if (!s || !file) return null;
  const nilai = bacaJson(s, AWALAN_TIKET + file);
  if (!nilai?.tiket || nilai.file !== file) return null;
  const sisa = sisaDetik(nilai.tiket, sekarangMs);
  if (sisa === null || sisa < TOLERANSI_DETIK) {
    hapus(s, AWALAN_TIKET + file);
    return null;
  }
  return nilai.tiket;
}

/**
 * Simpan tiket sesi untuk satu berkas.
 * @returns {boolean} true bila tersimpan (false bila token tak dikenali).
 */
export function simpanTiketSesi({ file, tiket, store, sekarangMs = Date.now() } = {}) {
  const s = penyimpanan(store);
  if (!s || !file || !tiket) return false;
  const sisa = sisaDetik(tiket, sekarangMs);
  if (sisa === null || sisa < TOLERANSI_DETIK) return false;
  tulisJson(s, AWALAN_TIKET + file, { tiket, file, disimpan: sekarangMs });
  return true;
}

/** Buang tiket sesi satu berkas (dipakai saat tiket ditolak server). */
export function hapusTiketSesi({ file, store } = {}) {
  if (!file) return;
  hapus(penyimpanan(store), AWALAN_TIKET + file);
}

export {
  AWALAN_TIKET,
  KUNCI_PEMOHON,
  UMUR_MAKS_DETIK,
  TOLERANSI_DETIK,
  infoTiket,
  uraiBase64Url,
};
