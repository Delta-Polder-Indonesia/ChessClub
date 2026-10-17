/**
 * Utilitas murni Papan Interaktif — penyusunan pohon buku pembukaan, konversi
 * langkah/FEN/PGN, dan format angka. Tanpa React, mudah diuji terpisah.
 */
import { Chess } from "chess.js";
import { standarkanNamaPembukaan } from "../../../lib/namaPembukaan.js";
import { FEN_AWAL } from "./konstanta.js";

/**
 * Replay deret SAN menjadi FEN (dipakai untuk undo & memuat jalur katalog).
 *
 * @param {string[]} daftarSan deret SAN dari posisi `dasar`
 * @param {string} [dasar] FEN posisi awal replay (bawaan: posisi awal standar)
 * @returns {string|null} FEN hasil, atau null bila ada SAN ilegal / FEN rusak
 *   (tidak pernah melempar — pemanggil wajib menangani null).
 */
export function fenDariLangkah(daftarSan, dasar = FEN_AWAL) {
  let game;
  try {
    game = new Chess(dasar);
  } catch {
    return null;
  }
  for (const san of daftarSan) {
    let pindah;
    try {
      pindah = game.move(san);
    } catch {
      return null;
    }
    if (!pindah) return null;
  }
  return game.fen();
}

/**
 * Rincian tiap langkah (indeks i = langkah ke-i): FEN sesudah langkah itu
 * serta petak asal & tujuan dari chess.js (rokade & en passant ikut benar).
 * Dipakai pratinjau papan saat kursor diarahkan ke langkah di riwayat.
 * Langkah yang tidak sah menghentikan replay: sisanya bernilai null.
 */
export function rincianTiapLangkah(daftarSan, dasar = FEN_AWAL) {
  const hasil = [];
  let game;
  try {
    game = new Chess(dasar);
  } catch {
    return daftarSan.map(() => ({ fen: null, dari: null, ke: null }));
  }
  let rusak = false;
  for (const san of daftarSan) {
    let pindah = null;
    if (!rusak) {
      try {
        pindah = game.move(san);
      } catch {
        pindah = null;
      }
      if (!pindah) rusak = true;
    }
    hasil.push(
      rusak
        ? { fen: null, dari: null, ke: null }
        : { fen: game.fen(), dari: pindah.from, ke: pindah.to }
    );
  }
  return hasil;
}

/** Susun deret SAN menjadi teks PGN sederhana ("1. e4 e5 2. Nf3 …"). */
export function susunPgn(daftarSan) {
  const bagian = [];
  for (let i = 0; i < daftarSan.length; i += 2) {
    const nomor = i / 2 + 1;
    const putih = daftarSan[i];
    const hitam = daftarSan[i + 1];
    bagian.push(`${nomor}. ${putih}${hitam ? ` ${hitam}` : ""}`);
  }
  return bagian.join(" ");
}

/**
 * Susun PGN lengkap: bila partai berangkat dari FEN kustom (bukan posisi
 * awal standar), sertakan header `[SetUp "1"]` + `[FEN "…"]` agar PGN bisa
 * dimuat ulang dengan benar.
 */
export function susunPgnDenganFen(daftarSan, fenAwal) {
  const isi = susunPgn(daftarSan);
  if (fenAwal && fenAwal !== FEN_AWAL) {
    return `[SetUp "1"]\n[FEN "${fenAwal}"]\n\n${isi}`;
  }
  return isi;
}

/** Ambil FEN dari header `[FEN "…"]` sebuah PGN (null bila tidak ada). */
export function ekstrakFenDariPgn(pgn) {
  const cocok = String(pgn || "").match(/^\s*\[FEN\s+"([^"]+)"\s*\]/m);
  return cocok ? cocok[1].trim() : null;
}

/** Kumpulkan katalog (nama + jalur terpendek) lewat DFS dari pohon pembukaan. */
export function susunKatalog(pohon) {
  const hasil = [];
  (function telusur(node, jalur) {
    if (node.n) {
      for (const [eco, nama] of node.n) {
        hasil.push({ eco, nama, langkah: [...jalur] });
      }
    }
    for (const [san, anak] of Object.entries(node.c || {})) {
      jalur.push(san);
      telusur(anak, jalur);
      jalur.pop();
    }
  })(pohon, []);
  hasil.sort((a, b) => (a.eco === b.eco ? a.nama.localeCompare(b.nama) : a.eco.localeCompare(b.eco)));
  return hasil;
}

/** Pola langkah koordinat ("e2e4") — dipakai untuk membedakan jenis kunci pohon. */
const POLA_KOORDINAT = /^[a-h][1-8][a-h][1-8]$/;

/** Ambil statistik dari satu entri (null bila entri tidak punya statistik). */
function statDariEntri(entri) {
  if (typeof entri.games !== "number") return null;
  const angka = (v) => (typeof v === "number" ? v : null);
  return {
    games: entri.games,
    whiteWin: angka(entri.white_win_rate),
    blackWin: angka(entri.black_win_rate),
    draw: angka(entri.draw_rate),
    rating: angka(entri.avg_rating),
  };
}

/**
 * Ubah buku pembukaan berformat "daftar rata" (format Lichess, mis.
 * [{ eco, opening, moves: "e2e4 e7e5 g1f3 …" }, …]) menjadi pohon langkah
 * ber-key koordinat: node = { "n"?: [[eco, nama, stat], …], "c"?: {…} }.
 * Konversi ini murni penyusunan string sehingga cepat (tidak butuh chess.js).
 */
export function pohonDariDaftar(daftar) {
  const akar = {};
  for (const entri of daftar) {
    const eco = entri.eco || entri.code || "?";
    const nama = standarkanNamaPembukaan(entri.opening || entri.name);
    const langkah = String(entri.moves || entri.uci || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!nama || !langkah.length) continue;
    const stat = statDariEntri(entri);
    let node = akar;
    for (const k of langkah) {
      if (!node.c) node.c = {};
      if (!node.c[k]) node.c[k] = {};
      node = node.c[k];
    }
    if (!node.n) node.n = [];
    const ada = node.n.find(([e, n]) => e === eco && n === nama);
    if (!ada) {
      node.n.push([eco, nama, stat]);
    } else if (!ada[2] && stat) {
      ada[2] = stat; // lengkapi statistik pada nama duplikat yang belum punya
    }
  }
  return akar;
}

/** Tebak kunci pohon: koordinat ("e2e4") atau SAN ("e4", "Nf3", …). */
export function modeDariPohon(pohon) {
  const kunci = Object.keys((pohon && pohon.c) || {});
  if (!kunci.length) return "koordinat";
  return kunci.every((k) => POLA_KOORDINAT.test(k)) ? "koordinat" : "san";
}

/** Kunci pohon untuk satu pindahan: koordinat atau SAN, sesuai mode.
 *  Promosi ikut ditulis ("e7e8q") — format UCI standar yang sama dengan kunci
 *  hasil `pohonDariDaftar`, supaya jalur ber-promosi tetap cocok dengan buku. */
export function kuciDariPindahan(pindah, mode) {
  return mode === "koordinat"
    ? `${pindah.from}${pindah.to}${pindah.promotion ?? ""}`
    : pindah.san;
}

/** Opsi `game.move` dari kunci koordinat (4 atau 5 karakter, "e7e8q"). */
function opsiDariKoordinat(koordinat) {
  const opsi = { from: koordinat.slice(0, 2), to: koordinat.slice(2, 4) };
  if (koordinat[4]) opsi.promotion = koordinat[4];
  return opsi;
}

/** Ubah satu langkah koordinat menjadi SAN pada posisi `game` (lalu undo). */
export function sanDiPosisi(game, koordinat) {
  try {
    const pindah = game.move(opsiDariKoordinat(koordinat));
    if (pindah) {
      game.undo();
      return pindah.san;
    }
  } catch { /* koordinat tidak sah — kembalikan apa adanya */ }
  return koordinat;
}

/** Replay deret koordinat menjadi { fen, san } (untuk memuat jalur katalog). */
export function fenDanSanDariKoordinat(daftarKoordinat) {
  const game = new Chess();
  const san = [];
  for (const k of daftarKoordinat) {
    let pindah;
    try {
      pindah = game.move(opsiDariKoordinat(k));
    } catch {
      pindah = null;
    }
    if (!pindah) return null;
    san.push(pindah.san);
  }
  return { fen: game.fen(), san };
}

/** Format angka sesuai bahasa aktif (22.326 → "22.326" id / "22,326" en). */
export function formatAngka(nilai, bahasa) {
  return new Intl.NumberFormat(bahasa === "en" ? "en-US" : "id-ID").format(nilai);
}

/** Ubah pecahan (0..1) menjadi persen berdesimal (0.527 → "52,7"/"52.7"). */
export function statTurunan(node) {
  if (!node) return null;
  const milikNode = (node.n || []).map(([, , stat]) => stat).find((stat) => stat?.games);
  if (milikNode) return milikNode;
  for (const anak of Object.values(node.c || {})) {
    const stat = statTurunan(anak);
    if (stat) return stat;
  }
  return null;
}

export function formatPersen(pecahan, bahasa) {
  return new Intl.NumberFormat(bahasa === "en" ? "en-US" : "id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(pecahan * 100);
}


/**
 * Ambil daftar SAN jalur utama dari teks PGN. Diabaikan: baris header `[]`,
 * komentar `{…}` dan `;…`, variasi `(…)` BERSARANG, nomor langkah, NAG
 * (`$1`), anotasi `?!`, dan tanda hasil akhir.
 */
export function sanDariPgn(pgn) {
  let teks = String(pgn || "")
    .replace(/^\[[^\n]*\]/gm, " ")
    .replace(/;[^\n]*/g, " ")
    .replace(/\{[^}]*\}/g, " ");
  // Buang variasi dengan hitung kedalaman agar "(1. d4 d5 (1... Nf6))" ikut
  // hilang seluruhnya — regex satu tingkat menyisakan token variasi.
  let tanpaVariasi = "";
  let kedalaman = 0;
  for (const ch of teks) {
    if (ch === "(") kedalaman++;
    else if (ch === ")") {
      if (kedalaman > 0) kedalaman--;
    } else if (kedalaman === 0) tanpaVariasi += ch;
  }
  teks = tanpaVariasi
    .replace(/\b\d+\s*\.(?:\s*\.)?/g, " ")
    .replace(/\$\d+/g, " ")
    .replace(/\b(1-0|0-1|1\/2-1\/2|½-½|\*)\b/g, " ");
  return teks
    .split(/\s+/)
    .map((token) => token.replace(/[!?]+$/, ""))
    .filter((token) => token && token !== "..." && token !== "…");
}

/**
 * Klasifikasi SATU langkah dari snapshot eval engine posisi SEBELUM dan
 * SESUDAH langkah — kosakata & ambang yang sama dengan ikon di petak papan
 * (best/miss/blunder/mistake/inaccuracy/good/excellent). Murni tanpa React,
 * dipakai baik untuk ikon langkah terakhir maupun rating per langkah riwayat.
 *
 * @param {object} a argumen
 * @param {string} a.san SAN langkah yang dinilai
 * @param {"w"|"b"} a.warnaPenglangkah warna pihak yang melangkah
 * @param {string} a.fenSesudah FEN posisi sesudah langkah (deteksi remis terminal)
 * @param {{cpPutih:number, matePutih:number|null, bestSan?:string|null}|undefined} a.sebelum
 *     snapshot eval posisi SEBELUM langkah (wajib — tanpa ini return null)
 * @param {{cpPutih:number, matePutih:number|null}|undefined} a.sesudah
 *     snapshot eval posisi SESUDAH langkah (belum siap → boleh undefined)
 * @param {(fen:string)=>string|null} [a.statusTerminal] fungsi status akhir posisi
 * @returns {string|null} rating, atau null bila data eval belum siap
 */
export function ratingDariSnapshotEval({
  san,
  warnaPenglangkah,
  fenSesudah,
  sebelum,
  sesudah,
  statusTerminal,
}) {
  if (!sebelum || !["w", "b"].includes(warnaPenglangkah)) return null;

  // best — sama dengan saran utama engine pada posisi sebelumnya.
  if (sebelum.bestSan && sebelum.bestSan === san) return "best";

  const sudut = warnaPenglangkah === "w" ? 1 : -1;
  const mateSebelum =
    sebelum.matePutih !== null && sebelum.matePutih !== undefined
      ? sebelum.matePutih
      : null;
  const mateSesudah =
    sesudah && sesudah.matePutih !== null && sesudah.matePutih !== undefined
      ? sesudah.matePutih
      : null;
  const nilaiSebelum =
    mateSebelum !== null ? Math.sign(mateSebelum) * 10000 : sebelum.cpPutih ?? 0;
  let nilaiSesudah =
    mateSesudah !== null ? Math.sign(mateSesudah) * 10000 : sesudah ? sesudah.cpPutih : undefined;

  // miss — melewatkan skakmat yang bisa langsung diberikan.
  if (mateSebelum !== null && mateSebelum * sudut > 0) {
    const dikasih = mateSesudah !== null && mateSesudah * sudut < 0;
    if (!dikasih) return "miss";
  }

  // blunder — menyerahkan skakmat ke lawan.
  if (mateSesudah !== null && mateSesudah * sudut < 0) return "blunder";

  if (nilaiSesudah === undefined || nilaiSesudah === null) {
    // Snapshot sesudah tak ada karena DUA sebab: eval belum tiba (tanpa ikon,
    // hindari loncatan palsu) atau posisi sesudah TERMINAL — remis terminal
    // nilainya pasti 0.00 sehingga pat yang membuang kemenangan tetap berikon.
    if (!sesudah && statusTerminal && statusTerminal(fenSesudah) === "remis") {
      nilaiSesudah = 0;
    } else {
      return null;
    }
  }

  const rugiPion = ((nilaiSebelum - nilaiSesudah) * sudut) / 100;
  if (rugiPion >= 4) return "blunder";
  if (rugiPion >= 1.2) return "mistake";
  if (rugiPion >= 0.8) return "inaccuracy";
  if (rugiPion >= 0.4) return "good";
  return "excellent";
}
