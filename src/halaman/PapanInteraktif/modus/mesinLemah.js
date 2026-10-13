/**
 * Profil lawan lemah untuk mode Manusia vs Mesin.
 *
 * Mengapa ada: Stockfish dengan Skill Level 0 masih setara sekitar 1320 Elo
 * (lantai UCI_Elo), jadi level Beginner/Casual tetap terlalu kuat untuk pemula
 * sejati. Menurunkan kedalaman, mengacak pilihan dari MultiPV, atau menyuntik
 * blunder dari luar engine sudah dicoba dan hasilnya terasa dibuat-buat:
 * engine tetap taktis sempurna dan selalu menghukum kesalahan pemain.
 *
 * Pendekatan di sini mengikuti gaya Chessmaster "The King": yang dirusak
 * adalah PENILAIAN engine dari dalam, bukan pilihan langkahnya. Modul ini
 * hanya memetakan level UI ke knob engine sunfish (lihat
 * `public/engines/sunfish/sunfish.js`) dan menyediakan langkah cadangan yang
 * divalidasi chess.js. Murni: tanpa React, DOM, atau jaringan — supaya skrip
 * uji Node bisa memakai tabel yang sama persis dengan yang dipakai UI.
 *
 * Tangga lawan sekarang TIGA engine, bukan dua:
 *   sunfish   → pemula total & pemula. Paling ringan (44 KB) dan penilaiannya
 *               dirusak dari dalam, jadi ia lemah secara meyakinkan.
 *   Maia 3    → menengah. Model yang justru dilatih untuk meniru MANUSIA
 *               (policy + WDL, tanpa pencarian), ratingnya bisa dipilih
 *               1100–1900 — lihat `src/lib/maia3.js` dan `lib/mesinMaia.js`.
 *   Stockfish → mahir/ahli/master. UCI_Elo-nya sudah pas untuk rentang atas.
 * Alasannya: Stockfish Skill Level 0 masih ~1320 Elo, jadi "menengah" paling
 * masuk akal diisi lawan yang memang meniru manusia rating itu — bukan mesin
 * yang dilemahkan, dan bukan mesin kuat yang disuruh pura-pura bodoh.
 */
import { Chess } from "chess.js";

/**
 * Knob per level.
 *
 * - `kedalaman`/`waktu` — batas pencarian (`go depth N movetime T`).
 * - `qs`/`qsA` — ambang quiescence search. `qs` besar dengan `qsA` lebih besar
 *   mematikan QS sepenuhnya: daun dinilai apa adanya, sehingga tangkapan
 *   balasan satu langkah pun sering terlewat, persis pemula.
 * - `derau` — sigma derau evaluasi (centipawn), deterministik per posisi.
 * - `materiSaja` — ratakan piece-square table jadi nilai bidak polos.
 * - `terowongan` — peluang per giliran engine hanya "melihat" sekitar langkah
 *   terakhir lawan, tangkapan, dan skak.
 */
export const PROFIL_SUNFISH = {
  beginner: {
    kedalaman: 2,
    waktu: 300,
    qs: 30000,
    qsA: 60000,
    derau: 350,
    materiSaja: true,
    terowongan: 0.6,
  },
  casual: {
    kedalaman: 3,
    waktu: 500,
    qs: 200,
    qsA: 400,
    derau: 150,
    materiSaja: false,
    terowongan: 0.35,
  },
};

/**
 * Perintah `setoption` untuk satu profil, siap dikirim ke worker sunfish.
 *
 * @param {object} profil entri PROFIL_SUNFISH
 * @param {{benih?: number, petakLawan?: string|null}} [konteks]
 *   `benih` membuat derau dapat diulang (uji) dan berbeda antarpartai (UI);
 *   `petakLawan` adalah petak tujuan langkah lawan terakhir — tanpa itu
 *   tunnel vision tidak punya pusat dan otomatis nonaktif.
 */
export function perintahProfilSunfish(profil, { benih = 1, petakLawan = null } = {}) {
  const perintah = [
    `setoption name QS value ${profil.qs}`,
    `setoption name QS_A value ${profil.qsA}`,
    `setoption name Eval Noise value ${profil.derau}`,
    `setoption name Material Only value ${profil.materiSaja ? "true" : "false"}`,
    `setoption name Tunnel Vision value ${profil.terowongan}`,
    `setoption name Random Seed value ${benih >>> 0}`,
  ];
  if (petakLawan) perintah.push(`setoption name Last Move value ${petakLawan}`);
  return perintah;
}

/**
 * Rating Maia yang bisa dipilih pemain. Maia 3 menerima rating kontinu, jadi
 * daftar ini hanya penanda yang enak dipilih — rentang 1100–1900 adalah
 * rentang yang dipakai saat model dilatih (lihat `batasRating` di maia3.js).
 */
export const PILIHAN_RATING_MAIA = [1100, 1300, 1500, 1700, 1900];

/** Rating Maia bawaan — tengah rentang latihan model. */
export const RATING_MAIA_BAKU = 1500;

/**
 * Level lawan di UI Manusia vs Mesin.
 *
 * Dua level terbawah memakai sunfish dengan profil di atas; level menengah
 * memakai Maia 3 (ratingnya dipilih terpisah lewat `PILIHAN_RATING_MAIA`);
 * level atas tetap Stockfish dengan Skill Level seperti sebelumnya (lantai
 * UCI_Elo Stockfish sudah pas untuk rentang rating itu). `keterampilan` hanya
 * berarti untuk Stockfish, `kedalaman` hanya untuk sunfish, dan `rating` hanya
 * untuk Maia.
 */
export const PILIHAN_LEVEL_MESIN = [
  {
    id: "beginner",
    mesin: "sunfish",
    waktu: PROFIL_SUNFISH.beginner.waktu,
    kedalaman: PROFIL_SUNFISH.beginner.kedalaman,
    label: "papan.pveLevelBeginner",
    ringkas: "papan.pveLevelBeginnerRingkas",
  },
  {
    id: "casual",
    mesin: "sunfish",
    waktu: PROFIL_SUNFISH.casual.waktu,
    kedalaman: PROFIL_SUNFISH.casual.kedalaman,
    label: "papan.pveLevelCasual",
    ringkas: "papan.pveLevelCasualRingkas",
  },
  {
    id: "maia",
    mesin: "maia",
    rating: RATING_MAIA_BAKU,
    label: "papan.pveLevelMaia",
    ringkas: "papan.pveLevelMaiaRingkas",
  },
  {
    id: "advanced",
    mesin: "stockfish",
    keterampilan: 12,
    waktu: 700,
    label: "papan.pveLevelAdvanced",
    ringkas: "papan.pveLevelAdvancedRingkas",
  },
  {
    id: "expert",
    mesin: "stockfish",
    keterampilan: 16,
    waktu: 1000,
    label: "papan.pveLevelExpert",
    ringkas: "papan.pveLevelExpertRingkas",
  },
  {
    id: "master",
    mesin: "stockfish",
    keterampilan: 20,
    waktu: 1400,
    label: "papan.pveLevelMaster",
    ringkas: "papan.pveLevelMasterRingkas",
  },
];

/** Semua langkah sah pada satu FEN dalam bentuk UCI (kosong bila partai usai). */
export function langkahSahUci(fen) {
  let game;
  try {
    game = new Chess(fen);
  } catch {
    return [];
  }
  return game
    .moves({ verbose: true })
    .map((langkah) => `${langkah.from}${langkah.to}${langkah.promotion || ""}`);
}

/**
 * Langkah mesin yang dijamin sah.
 *
 * Sunfish adalah engine tangkap-raja: ia menganggap raja boleh dimakan, tidak
 * mengenal underpromotion di semua kasus, dan bisa menjawab "(none)" di posisi
 * mat. Karena itu langkahnya selalu diperiksa ulang dengan chess.js; bila
 * tidak sah atau kosong, dipilih langkah sah acak alih-alih menampilkan galat.
 *
 * @returns {{uci: string, cadangan: boolean}|null}
 *   `null` berarti tidak ada langkah sah sama sekali — partai memang selesai.
 */
export function langkahMesinSah(fen, uci, acak = Math.random) {
  const daftar = langkahSahUci(fen);
  if (!daftar.length) return null;
  const bersih = String(uci || "").trim().toLowerCase();
  if (daftar.includes(bersih)) return { uci: bersih, cadangan: false };
  // Promosi tanpa huruf bidak: chess.js menuntutnya eksplisit, sunfish tidak
  // selalu mengirimnya. Diselesaikan jadi promosi menteri bila memang ada.
  if (4 === bersih.length && daftar.includes(`${bersih}q`)) {
    return { uci: `${bersih}q`, cadangan: false };
  }
  return { uci: daftar[Math.floor(acak() * daftar.length) % daftar.length], cadangan: true };
}
