/**
 * Ekspor PGN beranotasi dari hasil analisis halaman Analisa.
 *
 * Kenapa ada: hingga sekarang satu-satunya keluaran yang bisa dibawa keluar
 * dari halaman ini adalah PGN MENTAH (tanpa label, tanpa eval) — panel Basis
 * Data memang hanya menyimpan teks PGN (lihat ./basisData.js), bukan hasil
 * analisisnya, jadi anotasi tidak bisa ditambahkan dari sana. Akibatnya label
 * yang sudah dihitung susah payah di peramban hilang begitu partai diunduh,
 * padahal aplikasi catur lain (lichess, ChessBase, en-croissant, scid) bisa
 * membaca NAG dan komentar `[%eval …]` standar PGN.
 *
 * Yang ditulis ke berkas:
 *   - NAG standar untuk label yang memang layak ditandai (lihat `NAG_LABEL`);
 *     label netral (best/excellent/good/book/forced) sengaja TIDAK ditandai
 *     supaya berkasnya tidak penuh tanda seru pada setiap langkah.
 *   - Komentar `{ [%eval x.xx] }` / `{ [%eval #n] }` dari eval baku sudut
 *     Putih, format yang sama dengan yang ditulis lichess.
 *
 * Gagasan NAG-per-label berasal dari tabel `classifNags` WintrChess
 * (WintrCat/wintrchess, GPL-3.0) — hanya gagasannya; kode di sini ditulis
 * sendiri dengan konvensi ChessClub, dan TIDAK ada berkas WintrChess yang
 * disalin.
 *
 * Murni kecuali `unduhPgnBeranotasi` (memakai Blob + DOM), sama seperti
 * ./laporanPeninjauan.js.
 */

import { Chess } from "chess.js";

/**
 * Label langkah → kode NAG standar (lihat
 * https://en.wikipedia.org/wiki/Portable_Game_Notation#Standard_NAGs).
 *
 * Sengaja tidak lengkap:
 *   - `best`/`excellent`/`good` tidak ditandai — hampir semua langkah akan
 *     menjadi `$1` dan NAG-nya kehilangan makna.
 *   - `book`/`forced` tidak ditandai — keduanya bukan penilaian kualitas.
 *   - `$5` (!?) tidak dipakai karena halaman ini tidak punya label setaranya
 *     (`risky` milik WintrChess tidak pernah dikeluarkan oleh penilaian kita).
 */
export const NAG_LABEL = Object.freeze({
  brilliant: "$3",
  critical: "$1",
  inaccuracy: "$6",
  miss: "$2",
  mistake: "$2",
  blunder: "$4",
});

/** Nilai tag `Annotator` bawaan berkas hasil ekspor. */
export const ANOTATOR = "Komunitas Catur Indonesia (ChessClub)";

const LEBAR_BARIS = 80;

/**
 * Eval mentah UCI sesudah langkah → teks antar-kurung siku dari sudut PUTIH.
 *
 * Konvensi (sama dengan ./akurasi.js): `staticEval` relatif terhadap pihak
 * yang BERGILIR, yaitu lawan dari warna yang baru saja melangkah. Jadi untuk
 * sudut Putih: eval dibalik bila pemain yang melangkah adalah Putih.
 *
 * @param {Array} staticEval `["cp","34"]` / `["mate","2"]`.
 * @param {"w"|"b"} warnaPemain warna pemain yang BARU melangkah.
 * @returns {string|null} `"0.34"`, `"#3"`, `"-#2"`, atau `null` bila eval
 *   tidak ada/rusak (mis. setelah pembatalan, atau `["mate"]` di posisi mati).
 */
export function evalKeTeks(staticEval, warnaPemain) {
  if (!Array.isArray(staticEval) || staticEval.length < 2) return null;
  const angka = Number(staticEval[1]);
  if (!Number.isFinite(angka)) return null;

  const sudutPutih = warnaPemain === "w" ? -angka : angka;

  if (staticEval[0] === "mate") {
    return `${sudutPutih < 0 ? "-" : ""}#${Math.abs(sudutPutih)}`;
  }

  const teks = (sudutPutih / 100).toFixed(2);
  return teks === "-0.00" ? "0.00" : teks;
}

/** Satu token langkah: `1. e4` → `1. e4 $3 { [%eval 0.21] }`. */
function tokenLangkah(entri, nomorLangkah, putihMelangkah) {
  const bagian = [];
  if (putihMelangkah) bagian.push(`${nomorLangkah}.`);
  bagian.push(entri.san);

  const nag = NAG_LABEL[entri.moveRating];
  if (nag) bagian.push(nag);

  const evaluasi = evalKeTeks(entri.previousStaticEvals?.[0], entri.color === "w" ? "b" : "w");
  if (evaluasi) bagian.push(`{ [%eval ${evaluasi}] }`);

  return bagian.join(" ");
}

/**
 * Susun teks PGN beranotasi dari hasil `parsePGN`.
 *
 * @param {object} opsi
 * @param {string} [opsi.pgn] PGN asli — dipakai HANYA untuk mengambil tag
 *   header (Event/Site/Date/White/Black/Result/Elo…). Movetext-nya dibangun
 *   ulang dari `moves` supaya anotasinya ikut.
 * @param {Array} [opsi.moves] hasil `parsePGN`; `moves[0]` adalah entri posisi
 *   awal (tanpa langkah) sehingga dilewati.
 * @param {Array} [opsi.pemain] `[{ name, elo }]` dari halaman — dipakai bila
 *   PGN tidak punya tag White/Black.
 * @param {string} [opsi.hasil] hasil partai ("1-0", "0-1", "1/2-1/2", "*").
 * @param {boolean} [opsi.sertakanEval] `false` untuk NAG saja (tanpa eval).
 * @param {string} [opsi.anotator] isi tag `Annotator`.
 * @returns {string|null} PGN beranotasi, atau `null` bila tidak ada langkah
 *   yang bisa diekspor (mis. analisis belum jalan).
 */
export function bangunPgnBeranotasi({ pgn = "", moves = [], pemain = [], hasil = "*", sertakanEval = true, anotator = ANOTATOR } = {}) {
  const daftar = Array.isArray(moves) ? moves.slice(1).filter((m) => m?.san) : [];
  if (!daftar.length) return null;

  let header = {};
  if (pgn) {
    try {
      const papan = new Chess();
      papan.loadPgn(pgn);
      header = papan.header?.() ?? {};
    } catch {
      header = {};
    }
  }

  const baku = (nilai) => String(nilai ?? "").replace(/"/g, "'").replace(/\s+/g, " ").trim();
  /*
   * chess.js mengisi tag yang tidak ada dengan "?" (dan tanggal dengan
   * "????.??.??") — nilai itu BUKAN kosong, jadi tanpa dibersihkan lebih dulu
   * berkas ekspor akan menulis `[White "?"]` dan nama pemain dari halaman
   * tidak pernah terpakai. Lihat uji "PGN tanpa tag" di scripts/uji-pgn-anotasi.mjs.
   */
  const bersih = (nilai) => {
    const teks = baku(nilai);
    return /^[?\-\s]*$/.test(teks) || teks === "????.??.??" ? "" : teks;
  };

  const hasilBaku = /^(1-0|0-1|1\/2-1\/2|\*)$/.test(baku(header.Result)) ? baku(header.Result) : hasil;
  const hasilAkhir = /^(1-0|0-1|1\/2-1\/2|\*)$/.test(String(hasilBaku)) ? hasilBaku : "*";

  const tag = [
    ["Event", bersih(header.Event) || "Analisa ChessClub"],
    ["Site", bersih(header.Site) || "Komunitas Catur Indonesia"],
    ["Date", bersih(header.Date) || new Date().toISOString().slice(0, 10).replace(/-/g, ".")],
    ["Round", bersih(header.Round) || "-"],
    ["White", bersih(header.White) || pemain?.[0]?.name || "Putih"],
    ["Black", bersih(header.Black) || pemain?.[1]?.name || "Hitam"],
    ["Result", hasilAkhir],
    ["Annotator", anotator],
  ];
  if (bersih(header.WhiteElo)) tag.push(["WhiteElo", bersih(header.WhiteElo)]);
  if (bersih(header.BlackElo)) tag.push(["BlackElo", bersih(header.BlackElo)]);
  if (bersih(header.TimeControl)) tag.push(["TimeControl", bersih(header.TimeControl)]);

  const barisTag = tag.map(([nama, nilai]) => `[${nama} "${baku(nilai)}"]`);

  const token = daftar.map((entri, i) => {
    const putihMelangkah = i % 2 === 0;
    const nomorLangkah = Math.floor(i / 2) + 1;
    return tokenLangkah(entri, nomorLangkah, putihMelangkah);
  });

  /*
   * Bila eval tidak diminta, buang komentarnya tanpa membongkar NAG. Dilakukan
   * dengan menyaring token, bukan dengan flag tambahan di `tokenLangkah`,
   * supaya satu tempat saja yang tahu bentuk token.
   */
  const tokenAkhir = sertakanEval
    ? token
    : token.map((tk) => tk.replace(/\s*\{ \[%eval [^}]*\] \}/g, ""));

  return `${barisTag.join("\n")}\n\n${bungkusBaris(tokenAkhir, hasilAkhir)}\n`;
}

/** Gabungkan token jadi baris ≤ 80 kolom; token dengan komentar tak dipecah. */
function bungkusBaris(token, hasilAkhir) {
  const baris = [];
  let sekarang = "";
  for (const tk of token) {
    if (!sekarang) sekarang = tk;
    else if (sekarang.length + 1 + tk.length <= LEBAR_BARIS) sekarang += ` ${tk}`;
    else {
      baris.push(sekarang);
      sekarang = tk;
    }
  }
  if (sekarang) baris.push(sekarang);
  return `${baris.join("\n")} ${hasilAkhir}`;
}

/** Buang semua anotasi dari PGN (untuk membandingkan hasil dengan/tanpa). */
export function tanpaAnotasi(teksPgn) {
  return String(teksPgn ?? "")
    .replace(/\s*\{ \[%eval [^}]*\] \}/g, "")
    .replace(/ \$\d+/g, "");
}

/**
 * Unduh PGN beranotasi sebagai berkas `.pgn`. `false` bila bukan di peramban
 * atau tidak ada langkah untuk diekspor (pola sama dengan
 * ./laporanPeninjauan.js → `unduhLaporanPeninjauan`).
 */
export function unduhPgnBeranotasi({ namaPartai = "analisa", ...opsi } = {}) {
  const isi = bangunPgnBeranotasi(opsi);
  if (!isi) return false;
  if (typeof document === "undefined" || typeof Blob === "undefined") return false;

  const nama = `${String(namaPartai || "analisa").replace(/[^a-z0-9_-]+/gi, "_")}-${new Date().toISOString().slice(0, 10)}.pgn`;

  /*
   * Dibungkus try/catch: `URL.createObjectURL` tidak ada di sebagian
   * lingkungan (jsdom, mode privasi ketat). Kegagalan menyiapkan unduhan
   * tidak boleh merobohkan panel Ringkasan — pemanggil hanya menerima `false`
   * dan tombolnya tidak menampilkan konfirmasi.
   */
  try {
    const url = URL.createObjectURL(new Blob([isi], { type: "application/x-chess-pgn;charset=utf-8" }));
    const tautan = document.createElement("a");
    tautan.href = url;
    tautan.download = nama;
    document.body.appendChild(tautan);
    tautan.click();
    tautan.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
