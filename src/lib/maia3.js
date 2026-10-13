/**
 * Maia 3 — penyandian posisi dan dekode keluaran model ONNX
 * `public/engines/maia3/maia3_simplified.onnx`.
 *
 * Mengapa modul ini ada terpisah dari `mesinMaia.js`: seluruh isinya MURNI
 * (hanya butuh chess.js, tanpa DOM, tanpa jaringan, tanpa WebAssembly) supaya
 * skrip uji Node bisa memakai fungsi yang persis sama dengan yang dipakai
 * peramban. Salah satu angka di bawah salah — misal urutan kanal bidak atau
 * indeks promosi — dan model tetap mengembalikan angka, hanya saja tanpa
 * makna: policy-nya jadi acak. Karena itu setiap konstanta di sini diuji
 * terhadap nilai acuan di `scripts/uji-maia.mjs`.
 *
 * Kontrak model (dibaca langsung dari graf ONNX-nya, bukan dari dokumentasi):
 *   masuk  : tokens    float32[batch, 64, 12]  — 64 petak × 12 kanal bidak
 *            elo_self float32[batch]          — rating pihak yang bergilir
 *            elo_oppo float32[batch]          — rating lawannya
 *   keluar : logits_move  float32[batch, 4352] — logit per langkah (belum softmax)
 *            logits_value float32[batch, 3]    — logit L/D/W untuk pihak bergilir
 *
 * Maia 3 SELALU melihat papan dari sudut putih: bila giliran hitam, posisi
 * dicermin dulu (baris dibalik + warna ditukar) sebelum disandikan, dan
 * langkah hasilnya dicermin balik. Rating dikirim sebagai ANGKA MENTAH
 * (mis. 1500), bukan kategori — Maia 3 menyisipkan rating secara kontinu.
 *
 * Lisensi: kode Maia (maia-chess) GPL-3.0, setara Stockfish yang sudah
 * di-bundle repo ini. Modul ini hanya mengimplementasikan format masuk/keluar
 * model (fakta teknis), bukan salinan kode hulunya.
 */
import { Chess } from "chess.js";

/** Banyak kanal bidak per petak: P N B R Q K p n b r q k (urutan model). */
export const KANAL_BIDAK = 12;

/** Ukuran token papan yang dimakan model: 64 petak × 12 kanal. */
export const UKURAN_TOKEN = 64 * KANAL_BIDAK;

/**
 * Ruang langkah Maia 3.
 *   0–4095    : 64 petak asal × 64 petak tujuan (termasuk "langkah" diam
 *               asal = tujuan, yang tidak pernah legal dan selalu tersaring
 *               oleh topeng langkah sah).
 *   4096–4351 : 8 petak asal (a7–h7) × 8 petak tujuan (a8–h8) × 4 promosi.
 */
export const RUANG_LANGKAH = 4352;

/** Indeks ruang langkah tempat blok promosi dimulai. */
export const AWAL_PROMOSI = 4096;

/** Urutan bidak promosi pada blok promosi — jangan diubah, ini urutan model. */
export const URUT_PROMOSI = ["q", "r", "b", "n"];

/** Urutan kanal bidak: putih dulu (P..K), lalu hitam (p..k). */
export const URUT_BIDAK = ["P", "N", "B", "R", "Q", "K", "p", "n", "b", "r", "q", "k"];

/**
 * Rentang rating yang dilayani model. Maia 3 dilatih pada ~1100–1900; di luar
 * rentang itu model tetap jalan tetapi hasilnya extrapolasi, bukan lagi
 * kemampuan yang pernah divalidasi. Rating dijepit (bukan ditolak) supaya UI
 * tidak pernah mengirim angka ngawur — rentang jepitan sengaja dilebar
 * (600–2600) karena pemain boleh memilih di luar rentang latihan, dengan
 * keterangan eksplisit di UI mode Manusia vs Mesin.
 */
export const RATING_MIN = 600;
export const RATING_MAKS = 2600;

/** Rating bawaan bila pemilih rating tidak dipakai. */
export const RATING_BAKU = 1500;

/** Jepit rating ke rentang yang dilayani model. */
export function batasRating(rating) {
  const angka = Number(rating);
  if (!Number.isFinite(angka)) return RATING_BAKU;
  return Math.min(RATING_MAKS, Math.max(RATING_MIN, Math.round(angka)));
}

/** Nama berkas (tanpa huruf) pada papan catur. */
const HURUF = "abcdefgh";

/** Petak ("e4") → indeks 0..63 dengan a1 = 0, h8 = 63. */
export function petakKeIndeks(petak) {
  return HURUF.indexOf(petak[0]) + 8 * (Number(petak[1]) - 1);
}

/** Indeks 0..63 → petak ("e4"). */
export function indeksKePetak(indeks) {
  return `${HURUF[indeks % 8]}${Math.floor(indeks / 8) + 1}`;
}

/** Balik petak secara vertikal: a1 → a8, e4 → e5. */
export function cerminPetak(petak) {
  return `${petak[0]}${9 - Number(petak[1])}`;
}

/** Balik langkah UCI secara vertikal: e2e4 → e7e5 (promosi tetap di akhir). */
export function cerminLangkah(uci) {
  const promosi = uci.length > 4 ? uci.slice(4) : "";
  return `${cerminPetak(uci.slice(0, 2))}${cerminPetak(uci.slice(2, 4))}${promosi}`;
}

/** Tukar warna bidak dalam satu baris FEN ("rnbQ" → "RNBq"). */
function tukarWarnaBaris(baris) {
  let hasil = "";
  for (const huruf of baris) {
    if (/[A-Z]/.test(huruf)) hasil += huruf.toLowerCase();
    else if (/[a-z]/.test(huruf)) hasil += huruf.toUpperCase();
    else hasil += huruf;
  }
  return hasil;
}

/** Tukar hak rokade putih ⇄ hitam, tetap urut K Q k q. */
function tukarRokade(rokade) {
  if (!rokade || "-" === rokade) return "-";
  const punya = new Set(rokade.split(""));
  const tukar = new Set();
  if (punya.has("K")) tukar.add("k");
  if (punya.has("Q")) tukar.add("q");
  if (punya.has("k")) tukar.add("K");
  if (punya.has("q")) tukar.add("Q");
  const urut = ["K", "Q", "k", "q"].filter((huruf) => tukar.has(huruf)).join("");
  return urut || "-";
}

/**
 * Cermin FEN secara vertikal sambil menukar warna — sehingga giliran hitam
 * bisa disandikan seolah-olah putih yang melangkah.
 */
export function cerminFen(fen) {
  const [posisi, giliran, rokade, ep, setengah, penuh] = fen.split(" ");
  return [
    posisi
      .split("/")
      .reverse()
      .map(tukarWarnaBaris)
      .join("/"),
    "w" === giliran ? "b" : "w",
    tukarRokade(rokade),
    ep && "-" !== ep ? cerminPetak(ep) : "-",
    setengah ?? "0",
    penuh ?? "1",
  ].join(" ");
}

/**
 * Indeks langkah UCI di ruang 4352 Maia 3.
 *
 * @param {string} dari petak asal ("e2")
 * @param {string} ke petak tujuan ("e4")
 * @param {string} [promosi] "q" | "r" | "b" | "n" (kosong bila bukan promosi)
 * @returns {number} indeks 0..4351
 */
export function indeksLangkah(dari, ke, promosi = "") {
  const asal = petakKeIndeks(dari);
  const tujuan = petakKeIndeks(ke);
  if (!promosi) return asal * 64 + tujuan;
  // Blok promosi: asal selalu baris ke-7 (indeks 48..55), tujuan baris ke-8
  // (56..63). Empat indeks berturut-turut per pasangan, urut q r b n.
  const lajurAsal = asal - 48;
  const lajurTujuan = tujuan - 56;
  return AWAL_PROMOSI + (lajurAsal * 8 + lajurTujuan) * URUT_PROMOSI.length + URUT_PROMOSI.indexOf(promosi);
}

/** Kebalikan `indeksLangkah`: indeks ruang Maia → UCI. */
export function langkahDariIndeks(indeks) {
  if (indeks < AWAL_PROMOSI) {
    return `${indeksKePetak(Math.floor(indeks / 64))}${indeksKePetak(indeks % 64)}`;
  }
  const sisa = indeks - AWAL_PROMOSI;
  const pasangan = Math.floor(sisa / URUT_PROMOSI.length);
  return `${indeksKePetak(48 + Math.floor(pasangan / 8))}${indeksKePetak(56 + (pasangan % 8))}${
    URUT_PROMOSI[sisa % URUT_PROMOSI.length]
  }`;
}

/**
 * Sandikan papan FEN menjadi token (64 × 12) yang dimakan model.
 * Papan HARUS sudah dari sudut putih (lihat `cerminFen`).
 */
export function papanKeToken(fen) {
  const token = new Float32Array(UKURAN_TOKEN);
  const baris = fen.split(" ")[0].split("/");
  for (let rank = 0; rank < 8; rank++) {
    const barisKe = 7 - rank; // baris FEN pertama adalah rank 8
    let lajur = 0;
    for (const huruf of baris[rank]) {
      if (Number.isNaN(Number(huruf))) {
        const kanal = URUT_BIDAK.indexOf(huruf);
        if (kanal >= 0) token[(barisKe * 8 + lajur) * KANAL_BIDAK + kanal] = 1;
        lajur += 1;
      } else {
        lajur += Number(huruf);
      }
    }
  }
  return token;
}

/**
 * Siapkan satu posisi untuk inferensi.
 *
 * @param {string} fen posisi dengan giliran yang akan melangkah
 * @returns {{token: Float32Array, topeng: Float32Array, hitam: boolean,
 *   fenSandikan: string, uciSah: string[]}}
 *   `topeng` adalah 1 pada indeks langkah sah (sisanya 0), `hitam` menandai
 *   bahwa posisi dicermin (langkah hasil harus dicermin balik), dan
 *   `uciSah` daftar langkah sah pada FEN ASLI (bukan yang dicermin).
 */
export function praProses(fen) {
  const asli = new Chess(fen);
  const hitam = "b" === fen.split(" ")[1];
  const papan = hitam ? new Chess(cerminFen(asli.fen())) : asli;
  const fenSandikan = papan.fen();
  const token = papanKeToken(fenSandikan);
  const topeng = new Float32Array(RUANG_LANGKAH);
  const uciSah = [];
  for (const langkah of papan.moves({ verbose: true })) {
    const indeks = indeksLangkah(langkah.from, langkah.to, langkah.promotion || "");
    if (indeks < 0 || indeks >= RUANG_LANGKAH) continue;
    topeng[indeks] = 1;
    const uci = `${langkah.from}${langkah.to}${langkah.promotion || ""}`;
    uciSah.push(hitam ? cerminLangkah(uci) : uci);
  }
  return { token, topeng, hitam, fenSandikan, uciSah };
}

/**
 * Softmax + topeng → distribusi langkah manusia, terurut dari yang paling
 * mungkin. Hanya langkah sah yang ikut dihitung, sehingga probabilitasnya
 * selalu berjumlah 1 (sampai galat pembulatan).
 *
 * @param {Float32Array|number[]} logitsLangkah logit mentah 4352
 * @param {Float32Array|number[]} topeng 1 pada langkah sah
 * @param {{hitam?: boolean}} [opsi] `hitam` = posisi dicermin saat disandikan
 * @returns {{[uci: string]: number}} UCI → probabilitas 0..1, terurut menurun
 */
export function dekodeKebijakan(logitsLangkah, topeng, { hitam = false } = {}) {
  const indeksSah = [];
  for (let i = 0; i < RUANG_LANGKAH; i++) {
    if (topeng[i] > 0) indeksSah.push(i);
  }
  if (!indeksSah.length) return {};
  let maks = -Infinity;
  for (const i of indeksSah) {
    const nilai = logitsLangkah[i];
    if (Number.isFinite(nilai) && nilai > maks) maks = nilai;
  }
  const bobot = indeksSah.map((i) => {
    const nilai = Number.isFinite(logitsLangkah[i]) ? logitsLangkah[i] : maks;
    return Math.exp(nilai - maks);
  });
  const total = bobot.reduce((a, b) => a + b, 0) || 1;
  const pasangan = indeksSah.map((i, urut) => {
    const uci = langkahDariIndeks(i);
    return [hitam ? cerminLangkah(uci) : uci, bobot[urut] / total];
  });
  pasangan.sort((a, b) => b[1] - a[1]);
  const kebijakan = {};
  for (const [uci, peluang] of pasangan) kebijakan[uci] = peluang;
  return kebijakan;
}

/**
 * Peluang menang 0..1 dari logit nilai (L, D, W) untuk PIAK YANG BERGILIR,
 * lalu dibalik bila yang bergilir hitam — jadi hasilnya SELALU "peluang
 * menang putih", sama seperti centipawn Stockfish.
 *
 * @param {Float32Array|number[]} logitsNilai tiga logit: indeks 0 = kalah,
 *   1 = remis, 2 = menang
 * @param {boolean} [hitam] posisi dicermin (giliran hitam)
 */
export function nilaiMenang(logitsNilai, hitam = false) {
  const [kalah, remis, menang] = [logitsNilai[0], logitsNilai[1], logitsNilai[2]];
  const maks = Math.max(kalah, remis, menang);
  const eksp = [Math.exp(kalah - maks), Math.exp(remis - maks), Math.exp(menang - maks)];
  const total = eksp[0] + eksp[1] + eksp[2] || 1;
  const menangBerikutnya = (eksp[2] + 0.5 * eksp[1]) / total;
  return hitam ? 1 - menangBerikutnya : menangBerikutnya;
}

/** Pengali dan batas kurva peluang menang — salinan rumus `mesin/peluang.js`. */
export const FAKTOR_PELUANG_MAIA = -0.00368208;
export const BATAS_CP_MAIA = 1000;

/**
 * Centipawn dari peluang menang 0..100 — kebalikan kurva lichess yang dipakai
 * `src/halaman/Analisa/mesin/peluang.js`. Dipakai agar Maia (yang tidak
 * mengeluarkan centipawn sama sekali, hanya policy + WDL) tetap bisa
 * memberi angka untuk gestur "mesin ragu" di Papan Interaktif.
 *
 * Rumusnya diturunkan dari `peluangMenang(cp) = 50 + 50 * (2/(1+e^(k·cp)) − 1)`:
 *   w = (persen − 50) / 50   →   cp = ln((1 − w)/(1 + w)) / k
 */
export function cpDariPeluang(persen) {
  const angka = Number(persen);
  if (!Number.isFinite(angka)) return 0;
  const w = Math.min(0.999999, Math.max(-0.999999, (Math.min(100, Math.max(0, angka)) - 50) / 50));
  const cp = Math.log((1 - w) / (1 + w)) / FAKTOR_PELUANG_MAIA;
  return Math.round(Math.min(BATAS_CP_MAIA, Math.max(-BATAS_CP_MAIA, cp)));
}

/**
 * Ambil satu langkah dari distribusi manusia.
 *
 * @param {{[uci: string]: number}} kebijakan hasil `dekodeKebijakan`
 * @param {{acak?: () => number, ambilTeratas?: boolean}} [opsi]
 *   `ambilTeratas` = selalu langkah paling mungkin (deterministik, dipakai
 *   uji); bawaannya mencontoh dari seluruh distribusi — itulah yang membuat
 *   Maia terasa seperti manusia, bukan mesin yang menjawab identik setiap
 *   kali posisi sama muncul.
 * @returns {string|null} UCI, atau null bila distribusinya kosong
 */
export function contohLangkah(kebijakan, { acak = Math.random, ambilTeratas = false } = {}) {
  const daftar = Object.entries(kebijakan || {});
  if (!daftar.length) return null;
  if (ambilTeratas) return daftar[0][0];
  let batas = acak();
  if (!Number.isFinite(batas)) batas = 0;
  batas = Math.min(1, Math.max(0, batas));
  let jum = 0;
  for (const [uci, peluang] of daftar) {
    jum += Number.isFinite(peluang) ? Math.max(0, peluang) : 0;
    if (batas <= jum) return uci;
  }
  return daftar[daftar.length - 1][0];
}

/**
 * Susun tensor masuk untuk sekumpulan posisi sekaligus (batch).
 * Mengembalikan susunan siap kirim ke worker — tanpa menyentuh DOM.
 *
 * @param {string[]} daftarFen
 * @param {number[]} ratingSelf rating pihak bergilir per posisi
 * @param {number[]} ratingOppo rating lawan per posisi
 */
export function susunBatch(daftarFen, ratingSelf, ratingOppo) {
  const jumlah = daftarFen.length;
  const token = new Float32Array(jumlah * UKURAN_TOKEN);
  const self = new Float32Array(jumlah);
  const oppo = new Float32Array(jumlah);
  const posisi = [];
  for (let i = 0; i < jumlah; i++) {
    const siap = praProses(daftarFen[i]);
    token.set(siap.token, i * UKURAN_TOKEN);
    self[i] = batasRating(ratingSelf[i]);
    oppo[i] = batasRating(ratingOppo[i]);
    posisi.push(siap);
  }
  return { token, self, oppo, posisi, jumlah };
}

/**
 * Urai keluaran worker menjadi hasil per posisi.
 *
 * @param {Float32Array|number[]} logitsLangkah panjang jumlah × 4352
 * @param {Float32Array|number[]} logitsNilai panjang jumlah × 3
 * @param {Array<{topeng: Float32Array, hitam: boolean}>} posisi hasil `susunBatch`
 */
export function uraiBatch(logitsLangkah, logitsNilai, posisi) {
  return posisi.map((siap, i) => {
    const potonganLangkah = logitsLangkah.subarray
      ? logitsLangkah.subarray(i * RUANG_LANGKAH, (i + 1) * RUANG_LANGKAH)
      : logitsLangkah.slice(i * RUANG_LANGKAH, (i + 1) * RUANG_LANGKAH);
    const potonganNilai = logitsNilai.subarray
      ? logitsNilai.subarray(i * 3, (i + 1) * 3)
      : logitsNilai.slice(i * 3, (i + 1) * 3);
    const kebijakan = dekodeKebijakan(potonganLangkah, siap.topeng, { hitam: siap.hitam });
    const menang = nilaiMenang(potonganNilai, siap.hitam);
    return { kebijakan, menang, cp: cpDariPeluang(menang * 100) };
  });
}
