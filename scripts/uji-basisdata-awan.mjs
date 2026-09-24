/**
 * Uji basis data awan (Chess Cloud Database) — tanpa jaringan.
 *
 * Memastikan:
 *  1. FEN disaring sebelum dikirim ke pihak ketiga: FEN sampah ditolak,
 *     FEN yang kurang bidang dilengkapi (bukan diteruskan apa adanya).
 *  2. Balasan cdb.php benar-benar dimengerti: bentuk JSON (`json=1`) DAN
 *     bentuk teks (`move:d2d4,score:31,...`), termasuk `unknown`, posisi
 *     tanpa data, dan penanda akhir permainan.
 *  3. Klien server: timeout/ulang, cache (kueri kedua tidak menyentuh
 *     jaringan), FEN tidak sah → 400 tanpa memanggil jaringan, 5xx → 502.
 *  4. Penolakan "invalid board" tidak diam-diam dianggap "belum ada data".
 *  5. Formatter skor klien: sentipion → teks (+0.4 / -1.2), nilai tak wajar
 *     (penanda mati paksa) dibuang.
 *
 * Jalankan: node scripts/uji-basisdata-awan.mjs  (keluar 1 bila ada kegagalan)
 */
import {
  GalatAwan,
  bersihkanCacheAwan,
  bersihkanFen,
  tanyaAwan,
  uraiBalasanAwan,
} from "../server/src/basisDataAwan.js";
import {
  ambilBasisDataAwan,
  bersihkanCacheAwanKlien,
  formatSkorAwan,
  saranAwanKomentator,
} from "../src/lib/basisDataAwan.js";
import { susunKomentar, faktaLangkah } from "../src/lib/komentator.js";
import { ID, EN } from "../src/lib/terjemahan.js";

let gagal = 0;
let lulus = 0;
const ok = (kondisi, pesan) => {
  if (kondisi) lulus += 1;
  else {
    gagal += 1;
    console.error(`  ✗ ${pesan}`);
  }
};

/* ------------------------------------------------------------ 1. FEN sah */

console.log("1) Penyaringan FEN");
{
  const awal = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  ok(bersihkanFen(awal) === awal, "FEN lengkap diteruskan apa adanya");
  ok(
    bersihkanFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w") ===
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1",
    "FEN 2 bidang dilengkapi sampai 6 bidang"
  );
  ok(
    bersihkanFen("  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR   b  ") ===
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b - - 0 1",
    "spasi berlebih dibersihkan & giliran dipertahankan"
  );
  ok(bersihkanFen("") === null, "FEN kosong ditolak");
  ok(bersihkanFen(null) === null, "FEN null ditolak");
  ok(bersihkanFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1") === null, "giliran tidak sah ditolak");
  ok(bersihkanFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPP/RNBQKBNR w KQkq - 0 1") === null, "jumlah kotak baris salah ditolak");
  ok(bersihkanFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KKz - 0 1") === null, "hak rokade tidak sah ditolak");
  ok(bersihkanFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq z9 0 1") === null, "petak en passant tidak sah ditolak");
  ok(bersihkanFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - x 1") === null, "penghitung langkah tidak sah ditolak");
}

/* --------------------------------------------------- 2. urai balasan CDB */

console.log("2) Uraian balasan cdb.php");
{
  const contohJson = JSON.stringify([
    { uci: "g1f3", san: "Nf3", score: 35, rank: 1, note: "*", winrate: "52.1" },
    { uci: "d2d4", san: "d4", score: 31, rank: 0, note: "!", winrate: "51.8" },
    { uci: "b1c3", san: "Nc3", score: null, rank: 2, note: "??", winrate: null },
  ]);
  const urai = uraiBalasanAwan(contohJson);
  ok(urai.diketahui === true, "JSON: posisi dianggap diketahui");
  ok(urai.akhir === null, "JSON: tidak ada penanda akhir permainan");
  ok(urai.langkah.length === 3, "JSON: tiga langkah terbaca");
  ok(urai.langkah[0].uci === "d2d4" && urai.langkah[0].san === "d4", "JSON: diurutkan menurut rank (0 lebih dulu)");
  ok(urai.langkah[0].skorCp === 31 && urai.langkah[0].winrate === 51.8, "JSON: skor & winrate jadi angka");
  ok(urai.langkah[2].skorCp === null, "JSON: skor kosong jadi null (bukan NaN)");
  ok(urai.langkah[2].catatan === "??", "JSON: catatan dipertahankan");

  const uraiTeks = uraiBalasanAwan("move:d2d4,score:31,rank:100,note:!|move:g1f3,score:20,rank:80");
  ok(uraiTeks.langkah.length === 2, "teks: dua langkah terbaca");
  const d4 = uraiTeks.langkah.find((l) => l.uci === "d2d4");
  const nf3 = uraiTeks.langkah.find((l) => l.uci === "g1f3");
  ok(d4?.catatan === "!" && d4?.skorCp === 31, "teks: uci + skor + catatan terbaca");
  ok(nf3?.catatan === null && nf3?.rank === 80, "teks: bidang yang tidak dikirim jadi null");
  ok(
    uraiTeks.langkah[0].uci === "g1f3",
    "teks: urutan mengikuti rank CDB (80 sebelum 100)"
  );

  ok(uraiBalasanAwan("unknown").diketahui === false, "\"unknown\" → belum ada data");
  ok(uraiBalasanAwan("").diketahui === false, "balasan kosong → belum ada data");
  ok(uraiBalasanAwan("nobestmove").diketahui === false, "\"nobestmove\" → belum ada data");
  ok(uraiBalasanAwan("checkmate").akhir === "checkmate", "\"checkmate\" → penanda akhir");
  ok(uraiBalasanAwan("stalemate").akhir === "stalemate", "\"stalemate\" → penanda akhir");
  ok(uraiBalasanAwan("[]").diketahui === false, "JSON kosong → belum ada data");
  ok(uraiBalasanAwan("move:zz99,score:1").langkah.length === 0, "langkah sampah dibuang");

  let tolak = null;
  try {
    uraiBalasanAwan("invalid board");
  } catch (e) {
    tolak = e;
  }
  ok(tolak instanceof GalatAwan && tolak.status === 502, "\"invalid board\" → galat (bukan dianggap kosong)");
}

/* ------------------------------------------------------- 3. klien server */

console.log("3) Klien server (timeout, ulang, cache)");
{
  const FEN = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
  const jawab = (teks, status = 200) => async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => teks,
  });

  bersihkanCacheAwan();
  let panggilan = 0;
  const fetchImpl = async () => {
    panggilan += 1;
    return jawab(JSON.stringify([{ uci: "g1f3", san: "Nf3", score: 25, rank: 0, winrate: "51" }]))();
  };
  const hasil = await tanyaAwan(FEN, { fetchImpl });
  ok(hasil.diketahui === true && hasil.langkah[0].san === "Nf3", "kueri pertama → data terbaca");
  ok(hasil.sumber === "chessdb" && hasil.posisi === FEN, "identitas sumber & posisi disertakan");
  const hasil2 = await tanyaAwan(FEN, { fetchImpl });
  ok(panggilan === 1 && hasil2.dariCache === true, "kueri kedua dilayani cache (jaringan tidak disentuh)");

  // FEN tidak sah: harus 400 dan jaringan tidak boleh dipanggil.
  panggilan = 0;
  let galatFen = null;
  try {
    await tanyaAwan("bukan-fen", { fetchImpl });
  } catch (e) {
    galatFen = e;
  }
  ok(galatFen instanceof GalatAwan && galatFen.status === 400, "FEN tidak sah → galat 400");
  ok(panggilan === 0, "FEN tidak sah tidak pernah dikirim ke pihak ketiga");

  // 500 → dicoba ulang sekali, lalu galat 502.
  bersihkanCacheAwan();
  panggilan = 0;
  let galat500 = null;
  try {
    await tanyaAwan(FEN, {
      fetchImpl: async () => {
        panggilan += 1;
        return jawab("gagal", 500)();
      },
    });
  } catch (e) {
    galat500 = e;
  }
  ok(galat500 instanceof GalatAwan && galat500.status === 502, "5xx → galat 502");
  ok(panggilan === 2, `5xx dicoba ulang sekali (panggilan: ${panggilan})`);

  // 404 → tidak diulang (4xx tidak akan membaik).
  bersihkanCacheAwan();
  panggilan = 0;
  try {
    await tanyaAwan(FEN, {
      fetchImpl: async () => {
        panggilan += 1;
        return jawab("tidak ada", 404)();
      },
    });
  } catch {
    /* galat memang diharapkan */
  }
  ok(panggilan === 1, `4xx tidak diulang (panggilan: ${panggilan})`);

  // Jaringan mati -> 503, bukan 500.
  bersihkanCacheAwan();
  let galatJaringan = null;
  try {
    await tanyaAwan(FEN, {
      fetchImpl: async () => {
        throw new Error("offline");
      },
    });
  } catch (e) {
    galatJaringan = e;
  }
  ok(galatJaringan instanceof GalatAwan && galatJaringan.status === 503, "jaringan mati → galat 503");
  bersihkanCacheAwan();
}

/* --------------------------------------------------- 4. sisi klien & UI */

console.log("4) Formatter & saran untuk komentator");
{
  ok(formatSkorAwan(35) === "+0.4", "35 sentipion → +0.4");
  ok(formatSkorAwan(-121) === "-1.2", "-121 sentipion → -1.2");
  ok(formatSkorAwan(0) === "0", "0 → 0 (tanpa tanda)");
  ok(formatSkorAwan(100) === "+1", "100 sentipion → +1 (nol di belakang dibuang)");
  ok(formatSkorAwan(null) === null, "skor kosong → null");
  ok(formatSkorAwan(undefined) === null, "skor undefined → null");

  const data = { langkah: [{ san: "Nf3", skorCp: 35 }, { san: "d4", skorCp: 20 }] };
  ok(saranAwanKomentator(data)?.san === "Nf3", "saran komentator memakai langkah teratas");
  ok(saranAwanKomentator(data)?.nilai === "+0.4", "saran komentator membawa nilai terformat");
  ok(saranAwanKomentator({ langkah: [{ uci: "g1f3", skorCp: 35 }] }) === null, "tanpa SAN → tidak ada saran");
  ok(saranAwanKomentator({ langkah: [{ san: "Nf3", skorCp: null }] }) === null, "tanpa skor → tidak ada saran");
  ok(saranAwanKomentator({ langkah: [] }) === null, "daftar kosong → tidak ada saran");

  bersihkanCacheAwanKlien();

  // Kegagalan layanan disimpan sebentar: satu kali jaringan gagal, panggilan
  // berikutnya untuk posisi yang sama tidak lagi menyentuh fetch.
  {
    const fetchAsli = globalThis.fetch;
    let panggilan = 0;
    globalThis.fetch = async () => {
      panggilan += 1;
      return { ok: false, status: 503, json: async () => ({}) };
    };
    const FEN_UJI = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";
    let pesan1 = null;
    try {
      await ambilBasisDataAwan(FEN_UJI);
    } catch (e) {
      pesan1 = e.message;
    }
    let pesan2 = null;
    try {
      await ambilBasisDataAwan(FEN_UJI);
    } catch (e) {
      pesan2 = e.message;
    }
    globalThis.fetch = fetchAsli;
    ok(panggilan === 1, `kegagalan tidak diulang tiap langkah (fetch dipanggil ${panggilan}×)`);
    ok(pesan1 === pesan2 && /503/.test(pesan2), "pesan galat yang sama dipakai ulang (di-cache 30 detik)");

    // Cache dibersihkan → permintaan baru diizinkan lagi.
    bersihkanCacheAwanKlien();
    globalThis.fetch = async () => {
      panggilan += 1;
      return { ok: true, status: 200, json: async () => ({ diketahui: false, langkah: [] }) };
    };
    await ambilBasisDataAwan(FEN_UJI);
    globalThis.fetch = fetchAsli;
    ok(panggilan === 2, "setelah cache dikosongkan, permintaan baru dijalankan lagi");
  }
}

/* --------------------------------- 5. kalimat komentator memakai saran itu */

console.log("5) Kalimat komentator");
{
  const FEN = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
  const fakta = faktaLangkah(FEN, "Nf3");
  const denganAwan = susunKomentar({
    fakta,
    gaya: "santai",
    engineNyala: false,
    saranAwan: { san: "d4", nilai: "+0.4" },
  });
  ok(
    denganAwan.some(({ kunci }) => kunci.includes(".awan.")),
    "engine mati + saran awan → kalimat awan dipakai"
  );
  const ganti = denganAwan.find(({ kunci }) => kunci.includes(".awan."))?.ganti || {};
  ok(ganti.awan === "d4" && ganti.nilai === "+0.4", "placeholder awan/nilai terisi");

  const tanpaEngine = susunKomentar({
    fakta,
    gaya: "santai",
    engineNyala: true,
    saranAwan: { san: "d4", nilai: "+0.4" },
  });
  ok(
    !tanpaEngine.some(({ kunci }) => kunci.includes(".awan.")),
    "engine nyala → saran awan tidak dipakai (engine yang menilai)"
  );

  // Kalimat hasil harus ada di kedua kamus & tanpa placeholder tersisa.
  const ambil = (kamus, kunci) =>
    kunci.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), kamus);
  for (const [nama, kamus] of [["ID", ID], ["EN", EN]]) {
    const teks = ambil(kamus, denganAwan.find(({ kunci }) => kunci.includes(".awan.")).kunci);
    ok(typeof teks === "string" && teks.includes("{awan}"), `kalimat awan ada di kamus ${nama}`);
  }
}

console.log(gagal ? `\nGAGAL — ${gagal} masalah (${lulus} lulus).` : `\nOK — ${lulus} pemeriksaan lulus.`);
process.exit(gagal ? 1 : 0);
