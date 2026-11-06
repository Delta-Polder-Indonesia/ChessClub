/**
 * Logika pemilihan soal Teka-Teki — murni, tanpa React dan tanpa DOM.
 *
 * Dipisahkan dari halaman supaya dapat diuji langsung di Node: seluruh aturan
 * "soal mana yang dibuka/dilewati" dulu terkunci di dalam komponen 1.600 baris.
 */

/**
 * Lingkaran pencarian: cari indeks soal yang belum terpecahkan, mulai dari
 * indeks yang diminta lalu melingkar satu kali.
 *
 * @returns {number} indeks soal, atau -1 bila semua soal sudah terpecahkan.
 */
export function cariIndeksBelumTerpecahkan(daftar, mulai, terpecahkan) {
  if (!Array.isArray(daftar) || daftar.length === 0) return -1;
  const awal =
    ((Math.trunc(Number(mulai) || 0) % daftar.length) + daftar.length) %
    daftar.length;
  const sudah = terpecahkan instanceof Set ? terpecahkan : new Set(terpecahkan || []);
  for (let langkah = 0; langkah < daftar.length; langkah += 1) {
    const indeks = (awal + langkah) % daftar.length;
    if (!sudah.has(daftar[indeks]?.problemid)) return indeks;
  }
  return -1;
}

/**
 * Indeks soal pilihan acak di antara yang belum terpecahkan.
 * @returns {number} indeks, atau -1 bila tidak ada yang tersisa.
 */
export function pilihIndeksAcak(daftar, terpecahkan, acak = Math.random) {
  if (!Array.isArray(daftar) || !daftar.length) return -1;
  const sudah = terpecahkan instanceof Set ? terpecahkan : new Set(terpecahkan || []);
  const tersedia = [];
  daftar.forEach((m, indeks) => {
    if (!sudah.has(m?.problemid)) tersedia.push(indeks);
  });
  if (!tersedia.length) return -1;
  return tersedia[Math.floor(acak() * tersedia.length) % tersedia.length];
}

/**
 * Indeks awal untuk satu permintaan buka-soal.
 *
 * Aturan produk yang harus dipertahankan:
 *   - nomor di URL yang sah dan BUKAN soal tersimpan yang sudah selesai →
 *     hormati nomor itu (deep-link untuk meninjau);
 *   - selebihnya → lewati soal yang sudah terpecahkan (pemulihan sesi).
 */
export function tentukanIndeksAwal({
  daftar,
  idDiminta,
  koleksi = "lichess",
  posisiTersimpan = null,
  terpecahkan,
  acak = Math.random,
}) {
  if (!Array.isArray(daftar) || !daftar.length) return -1;
  const idUrut = Number.isInteger(idDiminta) && idDiminta >= 1 && idDiminta <= daftar.length;
  if (idUrut) {
    const tersimpan = posisiTersimpan;
    const sedangMemulihkan =
      tersimpan &&
      tersimpan.koleksi === koleksi &&
      tersimpan.id === idDiminta &&
      terpecahkan.has(daftar[idDiminta - 1]?.problemid);
    if (!sedangMemulihkan) return idDiminta - 1;
    return cariIndeksBelumTerpecahkan(daftar, idDiminta - 1, terpecahkan);
  }
  const dasar =
    posisiTersimpan && posisiTersimpan.koleksi === koleksi
      ? posisiTersimpan.id
      : 0;
  const awal = dasar >= 1 && dasar <= daftar.length ? dasar - 1 : Math.floor(acak() * daftar.length);
  return cariIndeksBelumTerpecahkan(daftar, awal, terpecahkan);
}
