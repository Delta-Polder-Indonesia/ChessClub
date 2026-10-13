/**
 * Kalibrasi kekuatan profil sunfish (mode Manusia vs Mesin).
 *
 * Bukan uji penjaga — skrip riset yang dijalankan manual saat knob di
 * `src/halaman/ManusiaVsMesin/mesinLemah.js` disetel. Tiap profil
 * diadu dengan dua jangkar:
 *
 *   bawah : pemain acak murni (semua langkah sah berpeluang sama)
 *   atas  : Stockfish lokal dengan UCI_LimitStrength + UCI_Elo 1320
 *           (lantai resmi Stockfish, lihat scripts/engine-uci-node.mjs)
 *
 * Skor lalu dikonversi ke selisih Elo (rumus logistik standar) terhadap Elo
 * jangkar, sehingga hasilnya bisa dibandingkan dengan label rentang rating
 * tiap level di UI. Jangkar bawah dipatok 400 — angka yang lazim dipakai
 * untuk pemain acak murni dan sengaja dicatat di sini sebagai asumsi, bukan
 * kebenaran mutlak.
 *
 * Jalankan:
 *   node scripts/kalibrasi-sunfish.mjs                 (semua profil, default)
 *   node scripts/kalibrasi-sunfish.mjs --partai=40 --profil=beginner
 *   node scripts/kalibrasi-sunfish.mjs --tanpa-stockfish
 */
import { Chess } from "chess.js";
import { muatSunfish } from "./sunfish-node.mjs";
import { DAFTAR_ENGINE_NODE, UciEngine } from "./engine-uci-node.mjs";
import { PROFIL_SUNFISH, perintahProfilSunfish, langkahMesinSah } from "../src/halaman/ManusiaVsMesin/mesinLemah.js";

const argumen = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);
const PARTAI = Number(argumen.get("partai") || 30);
const PROFIL_DIPILIH = argumen.get("profil");
const PAKAI_STOCKFISH = !argumen.has("tanpa-stockfish");
// Jangkar tambahan: profil sunfish lain, untuk memastikan urutan level
// benar-benar menanjak (beginner < casual < intermediate).
const LAWAN_PROFIL = argumen.get("lawan") || null;
const ELO_LAWAN_PROFIL = Number(argumen.get("elo-lawan") || 1000);
// Override knob tanpa menyentuh tabel profil, mis.
//   --knob=kedalaman:3,derau:60,terowongan:0.15
const KNOB = Object.fromEntries(
  (argumen.get("knob") || "")
    .split(",")
    .filter(Boolean)
    .map((bagian) => {
      const [nama, nilai] = bagian.split(":");
      return [nama, Number(nilai)];
    })
);
const ELO_ACAK = 400;
const ELO_STOCKFISH = 1320;
const BATAS_PLY = 200;
const WAKTU_STOCKFISH = Number(argumen.get("movetime") || 200);

/** PRNG deterministik supaya kalibrasi bisa diulang persis. */
function pengacak(benih) {
  let keadaan = benih >>> 0 || 1;
  return () => {
    keadaan = (keadaan + 0x6d2b79f5) >>> 0;
    let t = keadaan;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Selisih Elo dari skor rata-rata (0..1); null bila 0 atau 1 (tak terhingga). */
function selisihElo(skor) {
  if (0 >= skor || 1 <= skor) return null;
  return -400 * Math.log10(1 / skor - 1);
}

/** Margin kesalahan kasar (±) skor rata-rata pada 95%, dalam poin Elo. */
function marginElo(skor, jumlah) {
  if (!jumlah) return null;
  const sd = Math.sqrt(Math.max(skor * (1 - skor), 0.01) / jumlah);
  const atas = selisihElo(Math.min(0.999, skor + 1.96 * sd));
  const bawah = selisihElo(Math.max(0.001, skor - 1.96 * sd));
  return null === atas || null === bawah ? null : Math.round((atas - bawah) / 2);
}

/** Pemain acak murni — jangkar bawah. */
function pemainAcak(acak) {
  return {
    nama: "acak",
    async langkah(game) {
      const daftar = game.moves({ verbose: true });
      const pilih = daftar[Math.floor(acak() * daftar.length) % daftar.length];
      return `${pilih.from}${pilih.to}${pilih.promotion || ""}`;
    },
    async tutup() {},
  };
}

/** Lawan sunfish dengan satu profil pembodohan. */
function pemainSunfish(id, benih) {
  const profil = { ...PROFIL_SUNFISH[id], ...KNOB };
  const engine = muatSunfish();
  let cadangan = 0;
  let total = 0;
  return {
    nama: `sunfish:${id}`,
    get statistik() {
      return { cadangan, total };
    },
    async langkah(game, petakLawan) {
      for (const perintah of perintahProfilSunfish(profil, { benih, petakLawan })) {
        engine.perintah(perintah);
      }
      const fen = game.fen();
      const uci = engine.cari(fen, { kedalaman: profil.kedalaman });
      const pilih = langkahMesinSah(fen, uci);
      total += 1;
      if (pilih?.cadangan) cadangan += 1;
      return pilih ? pilih.uci : null;
    },
    async tutup() {},
  };
}

/** Stockfish lokal dengan kekuatan dibatasi — jangkar atas. */
async function pemainStockfish(elo, movetime) {
  const engine = new UciEngine(DAFTAR_ENGINE_NODE[0], { timeout: 30_000 });
  engine.mulai();
  await engine.siap();
  engine.kirim("setoption name UCI_LimitStrength value true");
  engine.kirim(`setoption name UCI_Elo value ${elo}`);
  await engine.gameBaru();
  return {
    nama: `stockfish:${elo}`,
    async langkah(game) {
      const { uci } = await engine.cari({ fen: game.fen(), movetime });
      return "(none)" === uci ? null : uci;
    },
    async tutup() {
      await engine.tutup();
    },
  };
}

const NILAI_BIDAK = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Selisih materi (putih - hitam) dalam satuan bidak. */
function selisihMateri(game) {
  let nilai = 0;
  for (const baris of game.board()) {
    for (const petak of baris) {
      if (!petak) continue;
      nilai += ("w" === petak.color ? 1 : -1) * (NILAI_BIDAK[petak.type] || 0);
    }
  }
  return nilai;
}

/**
 * Satu partai. Mengembalikan 1 (putih menang), 0.5 (remis), 0 (hitam menang).
 *
 * Partai yang melewati batas ply diadjudikasi dari materi (selisih >= 5 bidak
 * dihitung menang) — level terbawah sering unggul telak tetapi tidak mampu
 * menyelesaikan akhir permainan, dan tanpa adjudikasi kekuatannya jadi
 * dinilai terlalu rendah oleh remis buatan batas langkah.
 */
async function mainkanPartai(putih, hitam, acak) {
  const game = new Chess();
  let petakLawan = null;
  while (!game.isGameOver() && game.history().length < BATAS_PLY) {
    const giliran = "w" === game.turn() ? putih : hitam;
    const uci = await giliran.langkah(game, petakLawan);
    const daftar = game.moves({ verbose: true });
    let pindah = null;
    if (uci) {
      try {
        pindah = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || "q" });
      } catch {
        pindah = null;
      }
    }
    if (!pindah) {
      const ganti = daftar[Math.floor(acak() * daftar.length) % daftar.length];
      pindah = game.move(ganti);
    }
    petakLawan = pindah.to;
  }
  if (game.isCheckmate()) return { nilai: "w" === game.turn() ? 0 : 1, adjudikasi: false };
  if (game.isGameOver()) return { nilai: 0.5, adjudikasi: false };
  const materi = selisihMateri(game);
  if (5 <= materi) return { nilai: 1, adjudikasi: true };
  if (-5 >= materi) return { nilai: 0, adjudikasi: true };
  return { nilai: 0.5, adjudikasi: true };
}

/** Adu satu profil melawan satu jangkar, warna bergantian. */
async function adu(idProfil, buatLawan, eloJangkar, partai) {
  let skor = 0;
  let menang = 0;
  let remis = 0;
  let kalah = 0;
  let cadangan = 0;
  let langkah = 0;
  let adjudikasi = 0;
  const mulai = Date.now();
  for (let i = 0; i < partai; ++i) {
    const acak = pengacak(1000 + i);
    const uji = pemainSunfish(idProfil, 1 + i);
    const lawan = await buatLawan(i);
    const ujiPutih = 0 === i % 2;
    const hasil = ujiPutih
      ? await mainkanPartai(uji, lawan, acak)
      : await mainkanPartai(lawan, uji, acak);
    if (hasil.adjudikasi) adjudikasi += 1;
    const nilai = ujiPutih ? hasil.nilai : 1 - hasil.nilai;
    skor += nilai;
    if (1 === nilai) menang += 1;
    else if (0.5 === nilai) remis += 1;
    else kalah += 1;
    cadangan += uji.statistik.cadangan;
    langkah += uji.statistik.total;
    await lawan.tutup();
    await uji.tutup();
  }
  const rata = skor / partai;
  const beda = selisihElo(rata);
  return {
    partai,
    menang,
    remis,
    kalah,
    skor: rata,
    elo: null === beda ? null : Math.round(eloJangkar + beda),
    margin: marginElo(rata, partai),
    cadangan,
    langkah,
    adjudikasi,
    detik: Math.round((Date.now() - mulai) / 1000),
  };
}

const daftarProfil = PROFIL_DIPILIH ? [PROFIL_DIPILIH] : Object.keys(PROFIL_SUNFISH);
const baris = [];

for (const id of daftarProfil) {
  const profil = { ...PROFIL_SUNFISH[id], ...KNOB };
  console.log(
    `\n== ${id} — depth ${profil.kedalaman}, QS ${profil.qs}/${profil.qsA}, derau ${profil.derau}cp,` +
      ` materi-saja ${profil.materiSaja}, terowongan ${profil.terowongan}`
  );

  const lawanAcak = await adu(id, async (i) => pemainAcak(pengacak(5000 + i)), ELO_ACAK, PARTAI);
  console.log(
    `   vs acak (${ELO_ACAK})      : ${lawanAcak.menang}-${lawanAcak.remis}-${lawanAcak.kalah}` +
      `  skor ${(100 * lawanAcak.skor).toFixed(1)}%  ≈ ${lawanAcak.elo ?? ">"} Elo` +
      `${lawanAcak.margin ? ` ±${lawanAcak.margin}` : ""}  (${lawanAcak.detik}s)`
  );
  console.log(
    `   langkah cadangan (tidak sah/kosong): ${lawanAcak.cadangan}/${lawanAcak.langkah}` +
      `  ·  partai diadjudikasi materi: ${lawanAcak.adjudikasi}/${lawanAcak.partai}`
  );
  baris.push({ profil: id, jangkar: `acak ${ELO_ACAK}`, ...lawanAcak });

  if (LAWAN_PROFIL) {
    const lawanProfil = await adu(
      id,
      async (i) => pemainSunfish(LAWAN_PROFIL, 500 + i),
      ELO_LAWAN_PROFIL,
      PARTAI
    );
    console.log(
      `   vs ${LAWAN_PROFIL} (${ELO_LAWAN_PROFIL}): ${lawanProfil.menang}-${lawanProfil.remis}-${lawanProfil.kalah}` +
        `  skor ${(100 * lawanProfil.skor).toFixed(1)}%  ≈ ${lawanProfil.elo ?? "?"} Elo` +
        `${lawanProfil.margin ? ` ±${lawanProfil.margin}` : ""}  (${lawanProfil.detik}s)`
    );
    baris.push({ profil: id, jangkar: `${LAWAN_PROFIL} ${ELO_LAWAN_PROFIL}`, ...lawanProfil });
  }

  if (PAKAI_STOCKFISH) {
    const lawanSf = await adu(id, () => pemainStockfish(ELO_STOCKFISH, WAKTU_STOCKFISH), ELO_STOCKFISH, PARTAI);
    console.log(
      `   vs Stockfish (${ELO_STOCKFISH}, ${WAKTU_STOCKFISH}ms): ${lawanSf.menang}-${lawanSf.remis}-${lawanSf.kalah}` +
        `  skor ${(100 * lawanSf.skor).toFixed(1)}%  ≈ ${lawanSf.elo ?? "<"} Elo` +
        `${lawanSf.margin ? ` ±${lawanSf.margin}` : ""}  (${lawanSf.detik}s)`
    );
    console.log(
      `   langkah cadangan (tidak sah/kosong): ${lawanSf.cadangan}/${lawanSf.langkah}` +
        `  ·  partai diadjudikasi materi: ${lawanSf.adjudikasi}/${lawanSf.partai}`
    );
    baris.push({ profil: id, jangkar: `stockfish ${ELO_STOCKFISH}`, ...lawanSf });
  }
}

console.log("\nRingkasan (JSON):");
console.log(JSON.stringify(baris, null, 2));
