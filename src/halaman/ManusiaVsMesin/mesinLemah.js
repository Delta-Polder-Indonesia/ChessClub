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
 * Tangga lawan sekarang TIGA engine, dibagi jadi tiga tab di UI:
 *   sunfish   → pemula total & pemula. Cadangan untuk elo rendah: build
 *               WebWorker Stockfish hanya menyisakan depth minimal 6 yang
 *               setara ~2100+, jadi Stockfish tidak bisa melayani di bawah
 *               itu. Paling ringan (44 KB) dan penilaiannya dirusak dari
 *               dalam, jadi ia lemah secara meyakinkan.
 *   Maia 3    → menengah. Model yang justru dilatih untuk meniru MANUSIA
 *               (policy + WDL, tanpa pencarian), ratingnya bisa dipilih
 *               600–2600 — lihat `src/lib/maia3.js` dan `lib/mesinMaia.js`.
 *   Stockfish → mahir/ahli/master/GM/maximum (2000 ke atas). Skill Level
 *               0–20 dipetakan naik ke sana; di bawah 2000 pemain memakai
 *               tab Sunfish, bukan Stockfish yang dipaksa lemah.
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
 * daftar ini hanya penanda yang enak dipilih — di luar rentang latihan model
 * (1100–1900) hasilnya extrapolasi dan sudah dijelaskan di keterangan UI.
 */
export const PILIHAN_RATING_MAIA = [
  600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600,
  1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600,
];

/** Rating Maia bawaan — tengah rentang latihan model. */
export const RATING_MAIA_BAKU = 1500;

/**
 * Level lawan di UI Manusia vs Mesin, dikelompokkan per tab (`tab`).
 *
 * Dua tab di UI: Stockfish dan Maia-3. Tab Stockfish memuat SELURUH daftar
 * elo 100–3200 ala Chess.com, tetapi di bawah 2000 engine yang dipakai
 * tetap sunfish (build WebWorker Stockfish hanya menyisakan depth minimal 6
 * yang setara ~2100+). Entri sunfish menentukan engine via `mesin`, dan
 * `profilSunfish` memetakan ke PROFIL_SUNFISH — bukan ke `id`, karena id
 * level sekarang mengikuti nama elo, bukan nama profil. `keterampilan`
 * hanya berarti untuk Stockfish dan `rating` hanya untuk Maia.
 */
export const PILIHAN_LEVEL_MESIN = [
  {
    id: "new-to-chess",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "beginner",
    waktu: PROFIL_SUNFISH.beginner.waktu,
    kedalaman: PROFIL_SUNFISH.beginner.kedalaman,
    label: "papan.pveLevelNewToChess",
    ringkas: "papan.pveLevelNewToChessRingkas",
  },
  {
    id: "beginner",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "beginner",
    waktu: PROFIL_SUNFISH.beginner.waktu,
    kedalaman: PROFIL_SUNFISH.beginner.kedalaman,
    label: "papan.pveLevelBeginner",
    ringkas: "papan.pveLevelBeginnerRingkas",
  },
  {
    id: "novice",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "beginner",
    waktu: PROFIL_SUNFISH.beginner.waktu,
    kedalaman: PROFIL_SUNFISH.beginner.kedalaman,
    label: "papan.pveLevelNovice",
    ringkas: "papan.pveLevelNoviceRingkas",
  },
  {
    id: "intermediate",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "casual",
    waktu: PROFIL_SUNFISH.casual.waktu,
    kedalaman: PROFIL_SUNFISH.casual.kedalaman,
    label: "papan.pveLevelIntermediate",
    ringkas: "papan.pveLevelIntermediateRingkas",
  },
  {
    id: "intermediate-2",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "casual",
    waktu: PROFIL_SUNFISH.casual.waktu,
    kedalaman: PROFIL_SUNFISH.casual.kedalaman,
    label: "papan.pveLevelIntermediate2",
    ringkas: "papan.pveLevelIntermediate2Ringkas",
  },
  {
    id: "advanced",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "casual",
    waktu: PROFIL_SUNFISH.casual.waktu,
    kedalaman: PROFIL_SUNFISH.casual.kedalaman,
    label: "papan.pveLevelAdvanced",
    ringkas: "papan.pveLevelAdvancedRingkas",
  },
  {
    id: "expert",
    tab: "stockfish",
    mesin: "stockfish",
    keterampilan: 12,
    waktu: 800,
    label: "papan.pveLevelExpert",
    ringkas: "papan.pveLevelExpertRingkas",
  },
  {
    id: "master",
    tab: "stockfish",
    mesin: "stockfish",
    keterampilan: 16,
    waktu: 1200,
    label: "papan.pveLevelMaster",
    ringkas: "papan.pveLevelMasterRingkas",
  },
  {
    id: "grandmaster",
    tab: "stockfish",
    mesin: "stockfish",
    keterampilan: 18,
    waktu: 1600,
    label: "papan.pveLevelGrandmaster",
    ringkas: "papan.pveLevelGrandmasterRingkas",
  },
  {
    id: "maximum",
    tab: "stockfish",
    mesin: "stockfish",
    keterampilan: 20,
    waktu: 2500,
    label: "papan.pveLevelMaximum",
    ringkas: "papan.pveLevelMaximumRingkas",
  },
  {
    id: "maia",
    tab: "maia",
    mesin: "maia",
    rating: RATING_MAIA_BAKU,
    label: "papan.pveLevelMaia",
    ringkas: "papan.pveLevelMaiaRingkas",
  },
];

/** Urutan tab level di UI. */
export const TAB_LEVEL_MESIN = [
  { id: "stockfish", judul: "papan.pveTabStockfish" },
  { id: "maia", judul: "papan.pveTabMaia" },
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
