/**
 * Uji engine sunfish lawan level pemula (public/engines/sunfish/sunfish.js)
 * beserta pemetaan levelnya di src/halaman/PapanInteraktif/modus/mesinLemah.js.
 *
 * Yang dijaga:
 *  1. Berkas engine tetap membawa lisensi GPL-3.0 dan atribusinya (Thomas
 *     Ahle untuk Sunfish, foo123 untuk port JS) serta catatan modifikasi KCI.
 *  2. Protokol UCI: handshake, `position fen` (tambahan KCI — hulu hanya
 *     mengenal `startpos`), dan cabang Web Worker yang benar-benar dipakai
 *     peramban, disimulasikan di Node.
 *  3. Knob pembodohan benar-benar bekerja: quiescence search bisa dimatikan,
 *     derau evaluasi deterministik per benih, mode materi-saja meratakan
 *     penilaian petak, dan tunnel vision membatasi kandidat langkah.
 *  4. Legalitas: ratusan langkah self-play per profil divalidasi chess.js,
 *     dan frekuensi langkah cadangan (jawaban sunfish yang tidak sah karena
 *     ia engine tangkap-raja) tetap kecil.
 *  5. `langkahMesinSah()` — jaring pengaman yang dipakai UI — tidak pernah
 *     mengembalikan langkah tidak sah.
 *
 * Jalankan: node scripts/uji-sunfish.mjs  (atau `--partai=200` untuk uji berat)
 */
import { readFileSync } from "node:fs";
import { Chess } from "chess.js";
import { BERKAS_SUNFISH, muatSunfish, muatSunfishWorker } from "./sunfish-node.mjs";
import {
  PILIHAN_LEVEL_MESIN,
  PILIHAN_RATING_MAIA,
  PROFIL_SUNFISH,
  TAB_LEVEL_MESIN,
  langkahMesinSah,
  langkahSahUci,
  perintahProfilSunfish,
} from "../src/halaman/PapanInteraktif/modus/mesinLemah.js";

const argumen = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);
const PARTAI = Number(argumen.get("partai") || 10);
const BATAS_PLY = 200;
const STARTPOS = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
/** Setelah 1.e4 e5 2.Nf3 Nc6: Nxe5 hanya menang bidak bila balasannya tidak terlihat. */
const UMPAN_BIDAK = "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";

let lulus = 0;
let gagal = 0;
const hasil = (nama, kondisi, keterangan = "") => {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
};

/** Engine sunfish dengan opsi tertentu, dipakai sekali pakai. */
function engineDengan(opsi) {
  const engine = muatSunfish();
  engine.aturProfil(opsi);
  return engine;
}

/* ---------------- 1. Lisensi dan atribusi ---------------- */

console.log("\n1. Lisensi & atribusi berkas engine");
const sumber = readFileSync(BERKAS_SUNFISH, "utf8");
for (const penanda of [
  "GPL-3.0",
  "Thomas Ahle",
  "foo123",
  "https://github.com/foo123/sunfish.js",
  "Delta-Polder-Indonesia/ChessClub",
]) {
  hasil(`header menyebut "${penanda}"`, sumber.includes(penanda));
}
hasil("modifikasi KCI ditandai di dalam berkas", 10 <= (sumber.match(/!KCI!/g) || []).length);
hasil("varian klasik, bukan sunfish_nnue", !/sunfish\.nnue|function\s+nnue/.test(sumber));

/* ---------------- 2. Protokol UCI ---------------- */

console.log("\n2. Protokol UCI");
const dasar = muatSunfish();
const barisUci = dasar.perintah("uci");
hasil("uci → id name + uciok", barisUci.some((b) => b.startsWith("id name")) && barisUci.includes("uciok"), barisUci.join(" | "));
hasil("isready → readyok", dasar.perintah("isready").includes("readyok"));
hasil(
  "opsi asing (Hash/Threads/Skill Level) diabaikan tanpa galat",
  0 === dasar.perintah("setoption name Hash value 16").length &&
    0 === dasar.perintah("setoption name Skill Level value 3").length
);

const langkahStartpos = dasar.cari(STARTPOS, { kedalaman: 2 });
hasil("position fen startpos → langkah sah", langkahSahUci(STARTPOS).includes(langkahStartpos), langkahStartpos);

// Orientasi papan: sunfish selalu memutar papan ke sisi yang jalan, jadi FEN
// giliran hitam adalah titik paling rawan salah pasang.
const POSISI_UJI = [
  ["giliran hitam", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"],
  ["hak rokade dua sisi", "r3k2r/pppq1ppp/2npbn2/2b1p3/2B1P3/2NPBN2/PPPQ1PPP/R3K2R w KQkq - 6 8"],
  ["en passant tersedia", "rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3"],
  ["bidak siap promosi", "8/3P2k1/8/8/8/6K1/8/8 w - - 0 1"],
  ["akhir permainan raja-benteng", "8/8/4k3/8/8/4K3/8/4R3 w - - 0 1"],
];
for (const [nama, fen] of POSISI_UJI) {
  const uci = dasar.cari(fen, { kedalaman: 2 });
  const sah = langkahSahUci(fen);
  hasil(`position fen (${nama}) → langkah sah`, sah.includes(uci) || sah.includes(`${uci}q`), `${uci} vs ${sah.length} langkah sah`);
}
const giliranHitam = new Chess(POSISI_UJI[0][1]);
const langkahHitam = dasar.cari(POSISI_UJI[0][1], { kedalaman: 2 });
hasil(
  "langkah balasan giliran hitam memang menggerakkan bidak hitam",
  "b" === giliranHitam.get(langkahHitam.slice(0, 2))?.color,
  langkahHitam
);

/* ---------------- 3. Cabang Web Worker ---------------- */

console.log("\n3. Cabang Web Worker (yang dipakai peramban)");
const pekerja = muatSunfishWorker();
pekerja.kirim("uci");
pekerja.kirim("isready");
hasil("worker membalas uciok + readyok", pekerja.keluaran.includes("uciok") && pekerja.keluaran.includes("readyok"));
pekerja.bersihkan();
pekerja.kirim(`position fen ${STARTPOS}`);
pekerja.kirim("go depth 2 movetime 2000");
const barisBestmove = await pekerja.tunggu(/^bestmove/, 20_000);
const langkahWorker = barisBestmove.split(/\s+/)[1];
hasil("worker menerbitkan bestmove sah", langkahSahUci(STARTPOS).includes(langkahWorker), barisBestmove);
hasil(
  "worker tidak menerbitkan baris info berskor (bilah evaluasi harus disembunyikan)",
  !pekerja.keluaran.some((b) => /^info .*\b(cp|mate)\b/.test(b))
);

/* ---------------- 4. Knob pembodohan ---------------- */

console.log("\n4. Knob pembodohan");
const qsMati = ["setoption name QS value 30000", "setoption name QS_A value 60000"];
hasil(
  "QS aktif: umpan bidak ditolak di kedalaman 1",
  "f3e5" !== engineDengan([]).cari(UMPAN_BIDAK, { kedalaman: 1 })
);
hasil(
  "QS dimatikan: umpan bidak disambar di kedalaman 1",
  "f3e5" === engineDengan(qsMati).cari(UMPAN_BIDAK, { kedalaman: 1 })
);

const derauA = engineDengan([
  "setoption name Eval Noise value 120",
  "setoption name Random Seed value 9",
]).cari(STARTPOS, { kedalaman: 2 });
const derauB = engineDengan([
  "setoption name Eval Noise value 120",
  "setoption name Random Seed value 9",
]).cari(STARTPOS, { kedalaman: 2 });
hasil("derau deterministik: benih sama → langkah sama", derauA === derauB, `${derauA} vs ${derauB}`);

const variasiDerau = new Set();
const variasiTanpaDerau = new Set();
for (let benih = 1; benih <= 12; ++benih) {
  variasiDerau.add(
    engineDengan([
      "setoption name Eval Noise value 150",
      "setoption name Material Only value true",
      `setoption name Random Seed value ${benih}`,
    ]).cari(STARTPOS, { kedalaman: 2 })
  );
  variasiTanpaDerau.add(
    engineDengan(["setoption name Eval Noise value 0", `setoption name Random Seed value ${benih}`]).cari(
      STARTPOS,
      { kedalaman: 2 }
    )
  );
}
hasil("derau > 0: pilihan langkah bervariasi antarbenih", 3 <= variasiDerau.size, `${variasiDerau.size} langkah berbeda`);
hasil("derau = 0: benih tidak berpengaruh", 1 === variasiTanpaDerau.size, [...variasiTanpaDerau].join(", "));

hasil(
  "mode materi-saja mengubah preferensi petak",
  engineDengan(["setoption name Material Only value true"]).cari(STARTPOS, { kedalaman: 2 }) !==
    engineDengan([]).cari(STARTPOS, { kedalaman: 2 })
);

// Tunnel vision: seluruh pilihan harus berada di sekitar langkah terakhir
// lawan, berupa tangkapan, atau memberi skak — diperiksa ulang dengan chess.js.
const FEN_TEROWONGAN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
const berkas = (petak) => petak.charCodeAt(0) - 97;
const baris = (petak) => Number(petak[1]) - 1;
const dekat = (a, b) => 2 >= Math.max(Math.abs(berkas(a) - berkas(b)), Math.abs(baris(a) - baris(b)));
function bolehDilihat(fen, uci, pusat) {
  const game = new Chess(fen);
  const langkah = game
    .moves({ verbose: true })
    .find((m) => m.from === uci.slice(0, 2) && m.to === uci.slice(2, 4));
  if (!langkah) return false;
  if (langkah.captured) return true;
  if (dekat(langkah.to, pusat) || dekat(langkah.from, pusat)) return true;
  game.move(langkah);
  return game.inCheck();
}
let terowonganPatuh = true;
const pilihanTerowongan = new Set();
for (let benih = 1; benih <= 12; ++benih) {
  const uci = engineDengan([
    "setoption name Tunnel Vision value 1",
    "setoption name Last Move value e4",
    "setoption name Eval Noise value 120",
    `setoption name Random Seed value ${benih}`,
  ]).cari(FEN_TEROWONGAN, { kedalaman: 2 });
  pilihanTerowongan.add(uci);
  if (!bolehDilihat(FEN_TEROWONGAN, uci, "e4")) terowonganPatuh = false;
}
hasil("tunnel vision 1.0: semua pilihan di sekitar langkah lawan / tangkapan / skak", terowonganPatuh, [...pilihanTerowongan].join(", "));
hasil("tunnel vision tetap menyisakan beberapa pilihan", 2 <= pilihanTerowongan.size, `${pilihanTerowongan.size} langkah`);
hasil(
  "tanpa petak acuan, tunnel vision otomatis nonaktif",
  langkahSahUci(STARTPOS).includes(
    engineDengan(["setoption name Tunnel Vision value 1"]).cari(STARTPOS, { kedalaman: 2 })
  )
);

/* ---------------- 5. Jaring pengaman langkah ---------------- */

console.log("\n5. langkahMesinSah() — jaring pengaman UI");
const acakTetap = () => 0;
hasil("langkah sah diteruskan apa adanya", "e2e4" === langkahMesinSah(STARTPOS, "e2e4", acakTetap)?.uci);
const cadanganKosong = langkahMesinSah(STARTPOS, "", acakTetap);
hasil(
  "jawaban kosong → langkah sah acak, ditandai cadangan",
  cadanganKosong?.cadangan && langkahSahUci(STARTPOS).includes(cadanganKosong.uci)
);
const cadanganIlegal = langkahMesinSah(STARTPOS, "e1e8", acakTetap);
hasil(
  "langkah tidak sah → langkah sah acak",
  cadanganIlegal?.cadangan && langkahSahUci(STARTPOS).includes(cadanganIlegal.uci)
);
hasil(
  "promosi tanpa huruf bidak diselesaikan jadi menteri",
  "d7d8q" === langkahMesinSah("8/3P2k1/8/8/8/6K1/8/8 w - - 0 1", "d7d8", acakTetap)?.uci
);
hasil("tanpa langkah sah → null (partai selesai)", null === langkahMesinSah("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", "", acakTetap));

/* ---------------- 6. Pemetaan level ---------------- */

console.log("\n6. Pemetaan level Manusia vs Mesin");
const idLevel = PILIHAN_LEVEL_MESIN.map((level) => level.id);
hasil("sebelas level menu tetap ada", 11 === PILIHAN_LEVEL_MESIN.length, idLevel.join(", "));
hasil(
  "dua tab: Stockfish memuat 100–3200, Maia terpisah",
  TAB_LEVEL_MESIN.map((tab) => tab.id).join(",") === "stockfish,maia" &&
    PILIHAN_LEVEL_MESIN.filter((l) => l.tab === "stockfish").length === 10 &&
    "maia" === PILIHAN_LEVEL_MESIN.find((l) => l.tab === "maia")?.id
);
hasil(
  "di bawah 2000 memakai sunfish, 2000 ke atas memakai Stockfish",
  ["new-to-chess", "beginner", "novice", "intermediate", "intermediate-2", "advanced"].every(
    (id) => "sunfish" === PILIHAN_LEVEL_MESIN.find((l) => l.id === id)?.mesin
  ) &&
    ["expert", "master", "grandmaster", "maximum"].every(
      (id) => "stockfish" === PILIHAN_LEVEL_MESIN.find((l) => l.id === id)?.mesin
    )
);
hasil(
  "setiap level sunfish memetakan ke profil PROFIL_SUNFISH yang sah",
  PILIHAN_LEVEL_MESIN.filter((level) => "sunfish" === level.mesin).every(
    (level) => Boolean(PROFIL_SUNFISH[level.profilSunfish])
  )
);
for (const level of PILIHAN_LEVEL_MESIN) {
  if ("sunfish" === level.mesin) {
    const profil = PROFIL_SUNFISH[level.profilSunfish];
    hasil(
      `profil sunfish "${level.id}" lengkap`,
      Boolean(profil) && 1 <= profil.kedalaman && 0 <= profil.derau && 0 <= profil.terowongan && 1 >= profil.terowongan
    );
  } else if ("maia" === level.mesin) {
    // Maia tidak punya Skill Level: kekuatannya ditentukan rating yang
    // disuapkan ke model, jadi yang diuji adalah ratingnya termasuk pilihan
    // yang ditawarkan UI (bukan sembarang angka di luar rentang latihan).
    hasil(
      `level Maia "${level.id}" ratingnya ada di pilihan UI`,
      PILIHAN_RATING_MAIA.includes(level.rating)
    );
  } else {
    hasil(`level Stockfish "${level.id}" punya Skill Level`, Number.isInteger(level.keterampilan));
  }
}
// Dulu ada profil ketiga ("intermediate"); sejak Maia 3 mengisi level
// menengah, sunfish cukup dua tingkat untuk pemula — urutannya tetap diuji.
hasil(
  "profil bertingkat: kedalaman tidak pernah turun",
  PROFIL_SUNFISH.beginner.kedalaman <= PROFIL_SUNFISH.casual.kedalaman
);
hasil(
  "profil bertingkat: derau dan tunnel vision tidak pernah naik",
  PROFIL_SUNFISH.beginner.derau >= PROFIL_SUNFISH.casual.derau &&
    PROFIL_SUNFISH.beginner.terowongan >= PROFIL_SUNFISH.casual.terowongan
);
hasil(
  "perintah profil memuat semua knob",
  ["QS", "QS_A", "Eval Noise", "Material Only", "Tunnel Vision", "Random Seed", "Last Move"].every((nama) =>
    perintahProfilSunfish(PROFIL_SUNFISH.beginner, { benih: 3, petakLawan: "e4" }).some((b) =>
      b.startsWith(`setoption name ${nama} value`)
    )
  )
);

/* ---------------- 7. Legalitas self-play ---------------- */

console.log(`\n7. Self-play ${PARTAI} partai per profil (semua langkah divalidasi chess.js)`);
for (const [id, profil] of Object.entries(PROFIL_SUNFISH)) {
  const engine = muatSunfish();
  let langkah = 0;
  let cadangan = 0;
  let tidakSah = 0;
  let selesaiWajar = 0;
  const mulai = Date.now();
  for (let partai = 0; partai < PARTAI; ++partai) {
    const game = new Chess();
    let petakLawan = null;
    while (!game.isGameOver() && game.history().length < BATAS_PLY) {
      for (const perintah of perintahProfilSunfish(profil, { benih: partai + 1, petakLawan })) {
        engine.perintah(perintah);
      }
      const fen = game.fen();
      const pilihan = langkahMesinSah(fen, engine.cari(fen, { kedalaman: profil.kedalaman }));
      langkah += 1;
      if (pilihan.cadangan) cadangan += 1;
      let pindah;
      try {
        pindah = game.move({
          from: pilihan.uci.slice(0, 2),
          to: pilihan.uci.slice(2, 4),
          promotion: pilihan.uci[4] || "q",
        });
      } catch {
        pindah = null;
      }
      if (!pindah) {
        tidakSah += 1;
        break;
      }
      petakLawan = pindah.to;
    }
    if (game.isGameOver()) selesaiWajar += 1;
  }
  const rasio = (100 * cadangan) / Math.max(langkah, 1);
  console.log(
    `  · ${id}: ${langkah} langkah, cadangan ${cadangan} (${rasio.toFixed(2)}%), ` +
      `partai tuntas ${selesaiWajar}/${PARTAI}, ${Math.round((Date.now() - mulai) / 1000)}s`
  );
  hasil(`${id}: tidak ada langkah tidak sah yang lolos ke papan`, 0 === tidakSah, `${tidakSah} langkah`);
  hasil(`${id}: frekuensi langkah cadangan wajar (< 5%)`, 5 > rasio, `${rasio.toFixed(2)}%`);
}

console.log(`\n${gagal ? "GAGAL" : "OK"} — ${lulus} lulus, ${gagal} gagal`);
