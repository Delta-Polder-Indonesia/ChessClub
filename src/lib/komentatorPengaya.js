/**
 * Variasi tambahan komentator.
 *
 * Dipisahkan dari kamus utama supaya penambahan kalimat tidak mengacak
 * struktur terjemahan yang sudah dipakai. Modul ini hanya menambah pilihan
 * kalimat ke kategori yang sudah ada; mesin komentator tetap memakai fakta
 * papan yang sama.
 *
 * Aturan: TAMBAHAN_ID dan TAMBAHAN_EN dipakai berpasangan.
 * scripts/uji-i18n.mjs menolak bila jumlah varian ID dan EN berbeda per
 * kategori, jadi menambah varian hanya untuk satu bahasa akan menjebol
 * paritas kunci. Placeholder memakai nama kunci kamus ({pihak}, {san},
 * {lawan}, {petak}, {bidak}, {korban}, {pembukaan}, {unggul}, {nilai},
 * {mat}, {saran}, {awan}) — termasuk di EN, karena mesin komentator yang
 * mengisi placeholder, bukan bahasa teksnya.
 *
 * Saat ini kedua objek sengaja dikosongkan: kamus dasar
 * (terjemahan/{id,en}/komentator.js) sudah memuat seluruh varian yang
 * diminta mesin, jadi kalimat tambahan di sini hanya akan menduplikasi
 * pilihan. Tambahkan kalimat baru di sini bila suatu kategori perlu varian
 * ekstra — selalu berpasangan ID dan EN dengan jumlah sama.
 */

import { komentatorPapan as idPapan } from "./terjemahan/id/komentator.js";
import { komentatorPapan as enPapan } from "./terjemahan/en/komentator.js";

const TAMBAHAN_ID = {};

const TAMBAHAN_EN = {};

function tambahkan(target, tambahan) {
  for (const [gaya, kategori] of Object.entries(tambahan)) {
    if (!target[gaya]) continue;
    for (const [kunci, kalimat] of Object.entries(kategori)) {
      if (!Array.isArray(target[gaya][kunci])) continue;
      target[gaya][kunci].push(...kalimat);
    }
  }
}

tambahkan(idPapan, TAMBAHAN_ID);
tambahkan(enPapan, TAMBAHAN_EN);
