/**
 * Profil lawan lemah & daftar level untuk mode Manusia vs Mesin.
 *
 * Mengapa ada: Stockfish resmi tidak bisa bermain di bawah 1320 Elo (lantai
 * `UCI_Elo` — `Skill Level 0` pun setara ±1320, kalibrasi CCRL-blitz), jadi
 * level 100–1200 tetap terlalu kuat untuk pemula sejati bila memakai engine
 * UCI mana pun. Menurunkan kedalaman, mengacak pilihan dari MultiPV, atau
 * menyuntik blunder dari luar engine sudah dicoba dan hasilnya terasa
 * dibuat-buat: engine tetap taktis sempurna dan selalu menghukum kesalahan
 * pemain.
 *
 * Pendekatan di sini mengikuti gaya Chessmaster "The King": yang dirusak
 * adalah PENILAIAN engine dari dalam, bukan pilihan langkahnya. Modul ini
 * hanya memetakan level UI ke knob engine sunfish (lihat
 * `public/engines/sunfish/sunfish.js`) dan menyediakan langkah cadangan yang
 * divalidasi chess.js. Murni: tanpa React, DOM, atau jaringan — supaya skrip
 * uji Node bisa memakai tabel yang sama persis dengan yang dipakai UI.
 *
 * Tangga lawan sekarang TIGA engine, dibagi jadi dua tab di UI:
 *   sunfish   → enam level terendah (100–1600). SETIAP level mempunyai
 *               PROFIL SENDIRI di `PROFIL_SUNFISH` (bukan berbagi dua profil
 *               untuk enam label) supaya beda label = beda kekuatan riil;
 *               urutannya dijaga monoton oleh uji di `scripts/uji-sunfish.mjs`
 *               dan bisa diperiksa dengan `scripts/kalibrasi-sunfish.mjs`.
 *               Paling ringan (44 KB) dan penilaiannya dirusak dari dalam,
 *               jadi ia lemah secara meyakinkan.
 *   Maia 3    → menengah. Model yang justru dilatih untuk meniru MANUSIA
 *               (policy + WDL, tanpa pencarian), ratingnya bisa dipilih
 *               600–2600 — lihat `src/lib/maia3.js` dan `lib/mesinMaia.js`.
 *   Stockfish → ahli/master/GM/maximum (2000 ke atas), memakai KALIBRASI
 *               RESMI protokol UCI: `UCI_LimitStrength = true` +
 *               `UCI_Elo` sesuai angka label (benar-by-construction —
 *               kekuatan riil bidik labelnya, bukan perkiraan). Rentang
 *               resmi `UCI_Elo` 1320–3190; entri Maximum memakai 3190
 *               (batas atas resmi; label UI 3200 tetap plafon nominal gaya
 *               chess.com). Nilai di luar rentang DITOLAK diam-diam engine
 *               (lihat `Option::operator=` di Stockfish), jadi jangan
 *               mengirim 3200 — tetap akan jatuh ke default 1320.
 */
import { Chess } from "chess.js";

/**
 * Knob per level — SATU PROFIL PER LABEL, tidak ada dua label berbagi
 * parameter yang sama. Nama kunci = `id` level pada `PILIHAN_LEVEL_MESIN`.
 *
 * - `kedalaman`/`waktu` — batas pencarian (`go depth N movetime T`).
 * - `qs`/`qsA` — ambang quiescence search. `qs` besar dengan `qsA` lebih besar
 *   mematikan QS sepenuhnya: daun dinilai apa adanya, sehingga tangkapan
 *   balasan satu langkah pun sering terlewat, persis pemula.
 * - `derau` — sigma derau evaluasi (centipawn), deterministik per posisi.
 * - `materiSaja` — ratakan piece-square table jadi nilai bidak polos.
 * - `terowongan` — peluang per giliran engine hanya "melihat" sekitar langkah
 *   terakhir lawan, tangkapan, dan skak.
 *
 * Invarian (dijaga uji `uji-sunfish.mjs`, urut dari label terendah):
 * `kedalaman` tidak pernah turun; `derau` dan `terowongan` tidak pernah naik.
 * Nilai absolut kekuatan terukur (bukan target label) diverifikasi lewat
 * `scripts/kalibrasi-sunfish.mjs` — lantai fisiknya adalah pemain acak: tidak
 * ada konfigurasi yang benar-benar bermain 100 Elo.
 */
export const PROFIL_SUNFISH = {
  "new-to-chess": {
    kedalaman: 1,
    waktu: 300,
    qs: 30000,
    qsA: 60000,
    derau: 1600,
    materiSaja: true,
    terowongan: 0.95,
  },
  beginner: {
    kedalaman: 1,
    waktu: 300,
    qs: 30000,
    qsA: 60000,
    derau: 600,
    materiSaja: true,
    terowongan: 0.75,
  },
  novice: {
    kedalaman: 2,
    waktu: 300,
    qs: 30000,
    qsA: 60000,
    derau: 350,
    materiSaja: true,
    terowongan: 0.6,
  },
  intermediate: {
    kedalaman: 3,
    waktu: 500,
    qs: 200,
    qsA: 400,
    derau: 220,
    materiSaja: false,
    terowongan: 0.45,
  },
  "intermediate-2": {
    kedalaman: 3,
    waktu: 500,
    qs: 200,
    qsA: 400,
    derau: 80,
    materiSaja: false,
    terowongan: 0.15,
  },
  advanced: {
    kedalaman: 4,
    waktu: 700,
    qs: 40,
    qsA: 140,
    derau: 0,
    materiSaja: false,
    terowongan: 0,
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
 * elo 100–3200 ala chess.com, tetapi di bawah 2000 engine yang dipakai
 * tetap sunfish (lantai resmi `UCI_Elo` Stockfish adalah 1320 — di bawah
 * itu tidak ada yang bisa dilakukan UCI). Entri sunfish menentukan engine
 * via `mesin` dan memakai SATU PROFIL SENDIRI per level: `profilSunfish`
 * selalu menunjuk ke `PROFIL_SUNFISH[id]` yang sama, sehingga tiap label
 * mempunyai parameter berbeda. Entri Stockfish memakai `uciElo` (angka
 * label, rentang resmi 1320–3190) yang dikirim ke `UCI_Elo` saat
 * `UCI_LimitStrength` aktif, dan `rating` hanya berarti untuk Maia.
 */
/**
 * Jeda "berpikir" manusiawi (ms) sebelum langkah mesin DITERAPKAN
 * ke papan, per level `[min, maks]` — dicuplik acak tiap giliran.
 *
 * Mengapa ada: dulu langkah mesin diterapkan seketika begitu
 * `bestmove`/inferensi keluar. Level lemah (sunfish, `movetime`
 * 300 ms) menjawab dalam ~300–400 ms — LEBIH CEPAT dari luncuran
 * bidak pemain (300 ms) — sehingga mesin terasa "menyerbu": balasan
 * mendarat saat rokade/tangkapan pemain masih meluncur, dan pemain
 * yang berpikir panjang pun disusul mesin tanpa jeda. Solusinya bukan
 * gestur klik-goyang 2–4 detik yang dulu dibuang (terasa lambat),
 * tapi LANTAIAN jeda minimum pendek yang diskalakan per level:
 * lemah = lebih lama (pemain butuh waktu membaca posisi), kuat =
 * lebih pendek (mesin sudah lama menghitung). Total respons tetap
 * manusiawi: level pemula ~1–1,5 detik, GM/Maximum ~2,75–3 detik.
 *
 * Jeda ini TIDAK mengunci papan lebih lama dari biasanya: status
 * tetap "mesin" (papan memang terkunci selama giliran lawan) dan
 * dialog tetap "sedang berpikir" selama jeda, jadi terasa seperti
 * lawan yang membaca langkah pemain — bukan mesin macet.
 */
export const PILIHAN_LEVEL_MESIN = [
  {
    id: "new-to-chess",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "new-to-chess",
    waktu: PROFIL_SUNFISH["new-to-chess"].waktu,
    kedalaman: PROFIL_SUNFISH["new-to-chess"].kedalaman,
    jeda: [700, 1200],
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
    jeda: [650, 1100],
    label: "papan.pveLevelBeginner",
    ringkas: "papan.pveLevelBeginnerRingkas",
  },
  {
    id: "novice",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "novice",
    waktu: PROFIL_SUNFISH.novice.waktu,
    kedalaman: PROFIL_SUNFISH.novice.kedalaman,
    jeda: [600, 1000],
    label: "papan.pveLevelNovice",
    ringkas: "papan.pveLevelNoviceRingkas",
  },
  {
    id: "intermediate",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "intermediate",
    waktu: PROFIL_SUNFISH.intermediate.waktu,
    kedalaman: PROFIL_SUNFISH.intermediate.kedalaman,
    jeda: [500, 850],
    label: "papan.pveLevelIntermediate",
    ringkas: "papan.pveLevelIntermediateRingkas",
  },
  {
    id: "intermediate-2",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "intermediate-2",
    waktu: PROFIL_SUNFISH["intermediate-2"].waktu,
    kedalaman: PROFIL_SUNFISH["intermediate-2"].kedalaman,
    jeda: [450, 750],
    label: "papan.pveLevelIntermediate2",
    ringkas: "papan.pveLevelIntermediate2Ringkas",
  },
  {
    id: "advanced",
    tab: "stockfish",
    mesin: "sunfish",
    profilSunfish: "advanced",
    waktu: PROFIL_SUNFISH.advanced.waktu,
    kedalaman: PROFIL_SUNFISH.advanced.kedalaman,
    jeda: [400, 650],
    label: "papan.pveLevelAdvanced",
    ringkas: "papan.pveLevelAdvancedRingkas",
  },
  {
    id: "expert",
    tab: "stockfish",
    mesin: "stockfish",
    uciElo: 2000,
    waktu: 800,
    jeda: [300, 550],
    label: "papan.pveLevelExpert",
    ringkas: "papan.pveLevelExpertRingkas",
  },
  {
    id: "master",
    tab: "stockfish",
    mesin: "stockfish",
    uciElo: 2400,
    waktu: 1200,
    jeda: [300, 550],
    label: "papan.pveLevelMaster",
    ringkas: "papan.pveLevelMasterRingkas",
  },
  {
    id: "grandmaster",
    tab: "stockfish",
    mesin: "stockfish",
    uciElo: 2800,
    waktu: 1600,
    jeda: [250, 500],
    label: "papan.pveLevelGrandmaster",
    ringkas: "papan.pveLevelGrandmasterRingkas",
  },
  {
    id: "maximum",
    tab: "stockfish",
    mesin: "stockfish",
    uciElo: 3190,
    waktu: 2500,
    jeda: [250, 500],
    label: "papan.pveLevelMaximum",
    ringkas: "papan.pveLevelMaximumRingkas",
  },
  {
    id: "maia",
    tab: "maia",
    mesin: "maia",
    rating: RATING_MAIA_BAKU,
    // Maia 3 menjawab dalam satu inferensi (~sepersekian detik),
    // jadi jedanya paling panjang di antara semua level — total
    // respons barulah terasa manusiawi.
    jeda: [550, 1000],
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
 * Normalisasi rokade gaya Chess960 ke bentuk standar chess.js.
 *
 * Beberapa engine (dan Stockfish dalam mode Chess960) melaporkan
 * rokade sebagai RAJA KE PETAK BENTENG — "e1h1" / "e1c1" — bukan
 * bentuk standar "e1g1" / "e1c1". chess.js (mode standar) hanya
 * mengenal bentuk kedua, sehingga "e1h1" akan ditolak tidak sah
 * dan `langkahMesinSah` akan mengambil langkah acak — rokade
 * bisa berubah jadi langkah lain tanpa peringatan. en-croissant
 * menormalisasi lewat shakmaty (`UciMove::from_move` +
 * `CastlingMode`) sebelum memakai langkah engine; fungsi ini
 * penutup celah yang sama untuk sisi KELUARAN engine di mode ini.
 *
 * Raja hanya pernah berpindah lebih dari satu petak secara
 * horizontal pada rokade, jadi pemetaan ini tidak mungkin salah
 * mengubah langkah biasa: selisih 2 petak sudah standar
 * (dikembalikan apa adanya), selisih 3 petak (raja ke petak
 * benteng) dipetakan ke dua petak ke arah yang sama.
 *
 * @param {string} fen posisi sebelum langkah engine
 * @param {string} uci langkah UCI mentah dari engine
 * @returns {string} UCI ternormalisasi (bentuk standar bila rokade)
 */
export function normalisasiUciRokade(fen, uci) {
  const bersih = String(uci || "").trim().toLowerCase();
  if (bersih.length !== 4) return bersih;
  const dari = bersih.slice(0, 2);
  const ke = bersih.slice(2, 4);
  let game;
  try {
    game = new Chess(fen);
  } catch {
    return bersih;
  }
  if (game.get(dari)?.type !== "k") return bersih;
  const fileDari = dari.charCodeAt(0);
  const selisih = ke.charCodeAt(0) - fileDari;
  // Raja tak pernah berpindah 3+ petak horizontal kecuali rokade:
  // sisi raja = benteng di petak +3 (e1h1), sisi ratu = -4 (e1a1).
  if (Math.abs(selisih) < 3) return bersih; // bukan bentuk ke benteng
  const arah = Math.sign(selisih);
  return `${dari}${String.fromCharCode(fileDari + 2 * arah)}${dari[1]}`;
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
  // Rokade gaya Chess960 ("e1h1") dinormalisasi dulu ke bentuk
  // standar ("e1g1") sebelum dicek ke daftar langkah sah.
  const bersih = normalisasiUciRokade(fen, uci);
  if (daftar.includes(bersih)) return { uci: bersih, cadangan: false };
  // Promosi tanpa huruf bidak: chess.js menuntutnya eksplisit, sunfish tidak
  // selalu mengirimnya. Diselesaikan jadi promosi menteri bila memang ada.
  if (4 === bersih.length && daftar.includes(`${bersih}q`)) {
    return { uci: `${bersih}q`, cadangan: false };
  }
  return { uci: daftar[Math.floor(acak() * daftar.length) % daftar.length], cadangan: true };
}

/**
 * Lama jeda "berpikir" manusiawi untuk satu level, dalam ms.
 * Dicuplik acak di dalam rentang `jeda` level supaya tidak
 * metronom — lawan terasa membaca langkah, bukan membalas dengan
 * timer. Dipakai efek giliran mesin Manusia vs Mesin SEBELUM
 * menerapkan langkah ke papan (setelah `bestmove`/inferensi
 * keluar), bukan menggantikan `movetime` pencarian engine.
 *
 * @param {object} tingkat entri `PILIHAN_LEVEL_MESIN` yang aktif
 * @param {() => number} [acak] penyumbang acak (bisa dipalsukan uji)
 * @returns {number} jeda dalam milidetik (dibulatkan)
 */
export function jedaBerpikir(tingkat, acak = Math.random) {
  const [min, maks] = tingkat?.jeda ?? [300, 600];
  return Math.round(min + acak() * (maks - min));
}
