/**
 * Uji basis data awan (Chess Cloud Database) — tanpa jaringan.
 *
 * Memastikan:
 *  1. FEN disaring sebelum dikirim ke pihak ketiga: FEN sampah ditolak,
 *     FEN yang kurang bidang dilengkapi (bukan diteruskan apa adanya).
 *  2. Balasan cdb.php ASLI benar-benar dimengerti: objek JSON (`json=1`,
 *     `{"status":"ok","moves":[...]}`, rank 2 = terbaik, skor "??" disertakan
 *     sebagai `dinilai:false` — TIDAK dibuang, dan skor mat paksa ditandai
 *     `mat`) DAN bentuk teks (`move:d2d4,score:31,...`), termasuk `unknown`,
 *     posisi tanpa data, dan penanda akhir permainan. `diketahui` hanya true
 *     bila ≥ 1 langkah BERNILAI (semua "??" = belum diketahui).
 *  3. Klien server: timeout/ulang, cache (kueri kedua tidak menyentuh
 *     jaringan), FEN tidak sah → 400 tanpa memanggil jaringan, 5xx → 502.
 *  4. Penolakan "invalid board" dan balasan asing (HTML blokir, status tak
 *     dikenal) tidak diam-diam dianggap "belum ada data"; alamat cadangan,
 *     log kegagalan, dan pesan/kode server sampai ke klien.
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
  intipBasisDataAwan,
  saranAwanKomentator,
  skorLangkahAwan,
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
  // Balasan ASLI cdb.php (diambil langsung dari layanan, Sep 2026) — posisi
  // setelah 1.e4 e5 2.Nf3 Nc6 3.Bb5, dipangkas. Uji sebelumnya memakai format
  // karangan (array JSON, rank 0 = terbaik) sehingga lulus padahal balasan
  // sungguhan selalu terurai kosong → panel "Basis Data" kosong di produksi.
  const asliJson =
    '{"status":"ok","moves":[' +
    '{"uci":"e8e7","san":"Ke7","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"g8f6","san":"Nf6","score":-1,"rank":2,"note":"! (32-08)","winrate":"49.92"},' +
    '{"uci":"a7a6","san":"a6","score":0,"rank":2,"note":"! (32-04)","winrate":"50.00"},' +
    '{"uci":"d7d6","san":"d6","score":-45,"rank":1,"note":"* (30-01)","winrate":"46.10"},' +
    '{"uci":"f7f6","san":"f6","score":"??","rank":0,"note":"? (??-??)"}' +
    '],"ply":5}';
  const urai = uraiBalasanAwan(asliJson);
  ok(urai.diketahui === true, "JSON asli: posisi dianggap diketahui");
  ok(urai.akhir === null, "JSON asli: tidak ada penanda akhir permainan");
  ok(urai.langkah.length === 5, `JSON asli: skor "??" kini ikut dikirim (${urai.langkah.length} langkah)`);
  ok(
    urai.langkah.map((l) => l.san).join(" ") === "a6 Nf6 d6 Ke7 f6",
    `JSON asli: yang dinilai dulu (rank 2 lalu skor menurun), "??" menyusul urut CDB (${urai.langkah.map((l) => l.san).join(" ")})`
  );
  ok(urai.langkah[0].skorCp === 0 && urai.langkah[0].winrate === 50, "JSON asli: skor & winrate teks jadi angka");
  ok(urai.langkah[1].catatan === "! (32-08)", "JSON asli: catatan dipertahankan");
  ok(
    urai.langkah[0].dinilai === true && urai.langkah[3].dinilai === false,
    'JSON asli: bidang `dinilai` benar (numeri` = true, "??" = false)'
  );
  ok(
    urai.jumlahDinilai === 3 && urai.jumlahBelumDinilai === 2,
    "JSON asli: jumlahDinilai/jumlahBelumDinilai terhitung benar"
  );
  ok(!("_skor" in urai.langkah[0]), "JSON asli: bidang bantu pengurutan tidak bocor");

  ok(uraiBalasanAwan('{"status":"unknown"}').diketahui === false, 'JSON {"status":"unknown"} → belum ada data');
  ok(uraiBalasanAwan('{"status":"checkmate"}').akhir === "checkmate", 'JSON {"status":"checkmate"} → penanda akhir');
  ok(uraiBalasanAwan('{"status":"stalemate"}').akhir === "stalemate", 'JSON {"status":"stalemate"} → penanda akhir');
  ok(uraiBalasanAwan('{"status":"ok","moves":[]}').diketahui === false, "JSON ok tanpa langkah → belum ada data");
  const mat = uraiBalasanAwan('{"status":"ok","moves":[{"uci":"d8h4","san":"Qh4#","score":29999,"rank":2}]}');
  ok(mat.langkah.length === 1 && mat.langkah[0].skorCp === null, "skor mat paksa: langkah tetap ada, skorCp null");
  ok(
    mat.langkah[0].mat === true && mat.langkah[0].dinilai === true,
    'skor mat paksa: `mat` true & `dinilai` true (bukan "??")'
  );
  const matKalah = uraiBalasanAwan('{"status":"ok","moves":[{"uci":"e1g1","san":"O-O","score":-29995,"rank":0}]}');
  ok(matKalah.langkah[0].mat === true && matKalah.langkah[0].skorCp === null, "skor mat negatif juga ditandai `mat`");

  const uraiTeks = uraiBalasanAwan(
    "move:a7a6,score:0,rank:2,note:! (32-04),winrate:50.00|move:e8e7,score:??,rank:0,note:? (??-??)|move:d7d6,score:-45,rank:1"
  );
  ok(uraiTeks.langkah.length === 3, 'teks asli: "??" kini ikut terbaca (3 langkah)');
  ok(uraiTeks.langkah[0].uci === "a7a6" && uraiTeks.langkah[0].catatan === "! (32-04)", "teks asli: uci + catatan (dengan spasi) terbaca");
  ok(uraiTeks.langkah[1].catatan === null && uraiTeks.langkah[1].rank === 1, "teks: bidang yang tidak dikirim jadi null");
  ok(
    uraiTeks.langkah[2].uci === "e8e7" && uraiTeks.langkah[2].dinilai === false,
    'teks asli: "??" terbaca sebagai belum dinilai, menyusul di belakang'
  );

  ok(uraiBalasanAwan("unknown").diketahui === false, "\"unknown\" → belum ada data");
  ok(uraiBalasanAwan("").diketahui === false, "balasan kosong → belum ada data");
  ok(uraiBalasanAwan("nobestmove").diketahui === false, "\"nobestmove\" → belum ada data");
  ok(uraiBalasanAwan("checkmate").akhir === "checkmate", "\"checkmate\" → penanda akhir");
  ok(uraiBalasanAwan("stalemate").akhir === "stalemate", "\"stalemate\" → penanda akhir");
  ok(uraiBalasanAwan("[]").diketahui === false, "array JSON kosong → belum ada data");
  ok(uraiBalasanAwan("move:zz99,score:1").langkah.length === 0, "langkah sampah dibuang");

  // Balasan asing TIDAK boleh diam-diam jadi "posisi belum ada".
  for (const [asing, nama] of [
    ["<html><body>Access denied</body></html>", "halaman HTML (blokir/CDN)"],
    ['{"status":"rate limited"}', "JSON dengan status asing"],
    ["{rusak", "JSON rusak"],
    ["Service Unavailable", "teks bebas"],
  ]) {
    let g = null;
    try {
      uraiBalasanAwan(asing);
    } catch (e) {
      g = e;
    }
    ok(g instanceof GalatAwan && g.sebab === "awan-balasan-tak-dikenal", `${nama} → galat "tak dikenal"`);
  }
  let tolakJson = null;
  try {
    uraiBalasanAwan('{"status":"invalid board"}');
  } catch (e) {
    tolakJson = e;
  }
  ok(tolakJson instanceof GalatAwan && tolakJson.sebab === "awan-tolak-posisi", 'JSON {"status":"invalid board"} → galat tolak posisi');
  let tolak = null;
  try {
    uraiBalasanAwan("invalid board");
  } catch (e) {
    tolak = e;
  }
  ok(tolak instanceof GalatAwan && tolak.status === 502, "\"invalid board\" → galat (bukan dianggap kosong)");
}

/* ------------------------------- 2b. "??" dinilai-salah, mat, urutan, batas */

console.log("2b) Langkah \"??\", penanda mat, urutan dinilai-dulu & batas kirim");
{
  // Semua "??" = belum ada yang dinilai → TIDAK dianggap diketahui (cache
  // pendek + panel menawarkan engine), tetapi daftarnya tetap dikirim utuh.
  const semuaTanya = uraiBalasanAwan(
    '{"status":"ok","moves":[{"uci":"e8e7","san":"Ke7","score":"??","rank":0,"note":"? (??-??)"},' +
      '{"uci":"a7a6","san":"a6","score":"??","rank":0,"note":"? (??-??)"}]}'
  );
  ok(semuaTanya.diketahui === false, 'semua "??" → diketahui false');
  ok(
    semuaTanya.langkah.length === 2 && semuaTanya.jumlahBelumDinilai === 2,
    'semua "??" → daftar tetap dikirim lengkap'
  );
  ok(
    semuaTanya.langkah.every((l) => l.dinilai === false && l.skorCp === null && l.mat === false),
    'semua "??" → dinilai false, skorCp null, mat false'
  );
  ok(
    uraiBalasanAwan("move:e8e7,score:??,rank:0|move:a7a6,score:??,rank:0").diketahui === false,
    'teks semua "??" → diketahui false'
  );

  // Fixture ASLI cdb.php (queryall, Sep 2026): FEN Berlin 4.O-O
  // `r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4`
  // — hanya Nxe4 yang bernilai; 27 langkah lain "??" (sama seperti queryc_en).
  const berlin =
    '{"status":"ok","moves":[{"uci":"f6e4","san":"Nxe4","score":-1,"rank":2,"note":"! (29-07)","winrate":"49.92"},' +
    '{"uci":"e8e7","san":"Ke7","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"a7a6","san":"a6","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"b7b6","san":"b6","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"d7d6","san":"d6","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"g7g6","san":"g6","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"h7h6","san":"h6","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"a7a5","san":"a5","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"d7d5","san":"d5","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"g7g5","san":"g5","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"h7h5","san":"h5","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"c6b4","san":"Nb4","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"c6d4","san":"Nd4","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"c6a5","san":"Na5","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"c6e7","san":"Ne7","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"c6b8","san":"Nb8","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"f6g4","san":"Ng4","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"f6d5","san":"Nd5","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"f6h5","san":"Nh5","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"f6g8","san":"Ng8","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"f8a3","san":"Ba3","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"f8b4","san":"Bb4","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"f8c5","san":"Bc5","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"f8d6","san":"Bd6","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"f8e7","san":"Be7","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"a8b8","san":"Rb8","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"h8g8","san":"Rg8","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"d8e7","san":"Qe7","score":"??","rank":0,"note":"? (??-??)"}],"ply":7}';
  const b = uraiBalasanAwan(berlin);
  ok(b.diketahui === true, "Berlin: Nxe4 bernilai → diketahui true");
  ok(b.jumlahDinilai === 1 && b.jumlahBelumDinilai === 27, 'Berlin: 1 bernilai + 27 "??"');
  ok(b.langkah.length === 28, "Berlin: 28 langkah dikirim (sekaya queryc_en)");
  ok(
    b.langkah[0].san === "Nxe4" && b.langkah[0].dinilai === true && b.langkah[0].skorCp === -1,
    "Berlin: Nxe4 di puncak dengan skor -1"
  );
  ok(
    b.langkah[1].san === "Ke7" && b.langkah[1].dinilai === false && b.langkah[27].san === "Qe7",
    'Berlin: "??" menyusul dengan urutan asli CDB (Ke7 … Qe7)'
  );

  // Fixture ASLI cdb.php: posisi awal — 16 langkah bernilai + 4 "??".
  // Batas lama (10) memotong 16 jadi 10; batas baru menampung semuanya.
  const posisiAwal =
    '{"status":"ok","moves":[{"uci":"d2d4","san":"d4","score":0,"rank":2,"note":"! (20-04)","winrate":"50.00"},' +
    '{"uci":"e2e4","san":"e4","score":0,"rank":2,"note":"! (20-05)","winrate":"50.00"},' +
    '{"uci":"g1f3","san":"Nf3","score":0,"rank":2,"note":"! (20-06)","winrate":"50.00"},' +
    '{"uci":"b1c3","san":"Nc3","score":0,"rank":2,"note":"! (20-07)","winrate":"50.00"},' +
    '{"uci":"c2c4","san":"c4","score":0,"rank":2,"note":"! (20-07)","winrate":"50.00"},' +
    '{"uci":"a2a3","san":"a3","score":0,"rank":2,"note":"! (20-09)","winrate":"50.00"},' +
    '{"uci":"g2g3","san":"g3","score":0,"rank":2,"note":"! (20-09)","winrate":"50.00"},' +
    '{"uci":"c2c3","san":"c3","score":0,"rank":2,"note":"! (20-11)","winrate":"50.00"},' +
    '{"uci":"e2e3","san":"e3","score":0,"rank":2,"note":"! (20-11)","winrate":"50.00"},' +
    '{"uci":"b2b3","san":"b3","score":0,"rank":2,"note":"! (20-12)","winrate":"50.00"},' +
    '{"uci":"h2h3","san":"h3","score":0,"rank":2,"note":"! (20-12)","winrate":"50.00"},' +
    '{"uci":"d2d3","san":"d3","score":0,"rank":2,"note":"! (20-13)","winrate":"50.00"},' +
    '{"uci":"a2a4","san":"a4","score":-1,"rank":2,"note":"! (20-12)","winrate":"49.92"},' +
    '{"uci":"h2h4","san":"h4","score":-1,"rank":2,"note":"! (20-12)","winrate":"49.92"},' +
    '{"uci":"b2b4","san":"b4","score":-1,"rank":2,"note":"! (20-14)","winrate":"49.92"},' +
    '{"uci":"f2f4","san":"f4","score":-1,"rank":2,"note":"! (20-15)","winrate":"49.92"},' +
    '{"uci":"f2f3","san":"f3","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"g2g4","san":"g4","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"b1a3","san":"Na3","score":"??","rank":0,"note":"? (??-??)"},' +
    '{"uci":"g1h3","san":"Nh3","score":"??","rank":0,"note":"? (??-??)"}],"ply":0}';
  const awal = uraiBalasanAwan(posisiAwal);
  ok(awal.diketahui === true && awal.jumlahDinilai === 16, "posisi awal: 16 langkah bernilai → diketahui");
  ok(awal.jumlahBelumDinilai === 4 && awal.langkah.length === 20, 'posisi awal: 4 "??" ikut → 20 langkah utuh');
  ok(
    awal.langkah[0].san === "d4" && awal.langkah[15].san === "f4" && awal.langkah[16].san === "f3",
    'posisi awal: 16 bernilai (d4 … f4) lebih dulu, baru "??" (f3 …)'
  );

  // Batas kirim: maks. 20 bernilai + 40 "??"; jumlah asli tetap dilaporkan.
  const mentah = [];
  for (let i = 0; i < 25; i += 1) mentah.push({ uci: "a7a6", san: `V${i}`, score: 25 - i, rank: 2 });
  for (let i = 0; i < 50; i += 1) mentah.push({ uci: "b7b6", san: `U${i}`, score: "??", rank: 0 });
  const batas = uraiBalasanAwan(JSON.stringify({ status: "ok", moves: mentah }));
  ok(
    batas.jumlahDinilai === 25 && batas.jumlahBelumDinilai === 50,
    "batas: jumlah asli tetap dilaporkan (25/50)"
  );
  ok(batas.langkah.length === 60, `batas: maks 20 dinilai + 40 belum dinilai (${batas.langkah.length})`);
  ok(
    batas.langkah[0].san === "V0" && batas.langkah[19].san === "V19" && batas.langkah[20].san === "U0",
    "batas: 20 skor teratas dipilih & urutan tetap dinilai-dulu"
  );
  ok(batas.langkah[59].san === "U39", 'batas: 40 "??" pertama (urut CDB) dipilih');
}

/* ------------------------------------------------------- 3. klien server */

console.log("3) Klien server (timeout, alamat cadangan, cache, log)");
const log = [];
const warnAsli = console.warn;
console.warn = (...isi) => log.push(isi.join(" "));
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
    return jawab(
      JSON.stringify({ status: "ok", moves: [{ uci: "g1f3", san: "Nf3", score: 25, rank: 2, winrate: "51.00" }] })
    )();
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

  // Alamat cadangan: www. gagal DNS → domain telanjang dipakai; kueri tetap
  // hanya-baca (queryall, learn=0, tanpa queue/store).
  bersihkanCacheAwan();
  const url = [];
  const hasilCadangan = await tanyaAwan(FEN, {
    fetchImpl: async (u) => {
      url.push(u);
      if (u.startsWith("https://www.")) {
        const e = new TypeError("fetch failed");
        e.cause = { code: "ENOTFOUND", message: "getaddrinfo ENOTFOUND www.chessdb.cn" };
        throw e;
      }
      return jawab('{"status":"ok","moves":[{"uci":"g1f3","san":"Nf3","score":20,"rank":2}]}')();
    },
  });
  ok(hasilCadangan.diketahui === true, "alamat pertama gagal → alamat cadangan menjawab");
  ok(url.length === 2 && url[1].startsWith("https://chessdb.cn/cdb.php?"), "alamat cadangan = domain telanjang");
  ok(
    url.every((u) => /action=queryall/.test(u) && /learn=0/.test(u) && !/queue|store/.test(u)),
    "semua kueri hanya-baca (queryall + learn=0, tanpa queue/store)"
  );
  ok(
    log.some((b) => b.includes('"penyebab":"ENOTFOUND"') && b.includes('"host":"www.chessdb.cn"')),
    "kegagalan DNS tercatat di log dengan host + penyebab ENOTFOUND"
  );

  // 403 (mis. IP datacenter diblokir) → tidak pindah alamat, kode jelas.
  bersihkanCacheAwan();
  panggilan = 0;
  let galat403 = null;
  try {
    await tanyaAwan(FEN, {
      fetchImpl: async () => {
        panggilan += 1;
        return jawab("Forbidden", 403)();
      },
    });
  } catch (e) {
    galat403 = e;
  }
  ok(panggilan === 1 && galat403?.sebab === "awan-http-403", "403 → tanpa alamat cadangan, kode awan-http-403");

  // Balasan HTML 200 → galat (bukan "kosong") + tercatat di log.
  bersihkanCacheAwan();
  let galatHtml = null;
  try {
    await tanyaAwan(FEN, { fetchImpl: jawab("<!doctype html><title>Just a moment…</title>") });
  } catch (e) {
    galatHtml = e;
  }
  ok(galatHtml?.status === 502 && galatHtml?.sebab === "awan-balasan-tak-dikenal", "HTML 200 → galat 502 tak dikenal");
  ok(log.some((b) => b.includes('"penyebab":"balasan-tak-dikenal"')), "balasan tak dikenal tercatat di log");
  bersihkanCacheAwan();
}

console.warn = warnAsli;

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
  ok(
    saranAwanKomentator({
      langkah: [
        { san: "a6", dinilai: false, skorCp: null, mat: false },
        { san: "Nf3", dinilai: true, skorCp: 35, mat: false },
      ],
    })?.san === "Nf3",
    'saran komentator melewati langkah "??" yang terselip di depan'
  );
  ok(
    saranAwanKomentator({ langkah: [{ san: "a6", dinilai: false, skorCp: null, mat: false }] }) === null,
    'hanya "??" → tidak ada saran komentator'
  );
  ok(
    saranAwanKomentator({
      langkah: [
        { san: "Qh4#", dinilai: true, skorCp: null, mat: true },
        { san: "Nf3", dinilai: true, skorCp: 35, mat: false },
      ],
    }) === null,
    "langkah mat paksa tanpa skor pion → nilai tak terformat, tidak jadi saran"
  );

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

  // Pesan + kode server diteruskan apa adanya; `segarkan` melewati cache gagal.
  {
    bersihkanCacheAwanKlien();
    const fetchAsli = globalThis.fetch;
    let panggilan = 0;
    globalThis.fetch = async () => {
      panggilan += 1;
      return {
        ok: false,
        status: 503,
        json: async () => ({ pesan: "Basis data awan tidak dapat dihubungi.", kode: "awan-tidak-terjangkau" }),
      };
    };
    const FEN_UJI = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let g = null;
    try {
      await ambilBasisDataAwan(FEN_UJI);
    } catch (e) {
      g = e;
    }
    ok(g?.message === "Basis data awan tidak dapat dihubungi.", "pesan server diteruskan apa adanya");
    ok(g?.kode === "awan-tidak-terjangkau", "kode server diteruskan");
    let g2 = null;
    try {
      await ambilBasisDataAwan(FEN_UJI);
    } catch (e) {
      g2 = e;
    }
    ok(panggilan === 1 && g2?.kode === "awan-tidak-terjangkau", "kegagalan dari cache tetap membawa kode");
    globalThis.fetch = async () => {
      panggilan += 1;
      return { ok: true, status: 200, json: async () => ({ diketahui: true, langkah: [{ san: "e4" }] }) };
    };
    const segar = await ambilBasisDataAwan(FEN_UJI, { segarkan: true });
    globalThis.fetch = fetchAsli;
    ok(panggilan === 2 && segar.diketahui === true, "segarkan: true melewati cache kegagalan (Coba lagi)");
    bersihkanCacheAwanKlien();
  }
}

/* ------------------ 4b. intip cache & skor langkah (tinjauan komentator) */

console.log("4b) Intip cache klien & skor langkah yang dimainkan");
{
  // skorLangkahAwan — sumber ekspresi karakter untuk langkah yang BARU
  // dimainkan, diambil dari data posisi SEBELUM langkah itu.
  const dataTinjau = {
    langkah: [
      { san: "Nf3", dinilai: true, skorCp: 35, mat: false },
      { san: "f3", dinilai: false, skorCp: null, mat: false },
      { san: "Qh4#", dinilai: true, skorCp: null, mat: true },
    ],
  };
  ok(skorLangkahAwan(dataTinjau, "Nf3") === 35, "skorLangkahAwan: langkah bernilai → skornya");
  ok(skorLangkahAwan(dataTinjau, "f3") === null, 'skorLangkahAwan: langkah "??" → null');
  ok(skorLangkahAwan(dataTinjau, "Qh4#") === null, "skorLangkahAwan: mat paksa (tanpa skorCp) → null");
  ok(skorLangkahAwan(dataTinjau, "e4") === null, "skorLangkahAwan: langkah tak ada di data → null");
  ok(skorLangkahAwan(null, "Nf3") === null, "skorLangkahAwan: data kosong → null");

  // intipBasisDataAwan — cache-ONLY, tidak boleh menyentuh jaringan (dipakai
  // tinjauan pasca-langkah komentator supaya beban chessdb tidak bertambah).
  {
    bersihkanCacheAwanKlien();
    const FEN_INTIP = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    ok(intipBasisDataAwan(FEN_INTIP) === null, "intip: cache kosong → null");
    const fetchAsli = globalThis.fetch;
    let panggilan = 0;
    globalThis.fetch = async () => {
      panggilan += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({ diketahui: true, langkah: [{ san: "Nf3", skorCp: 35 }] }),
      };
    };
    await ambilBasisDataAwan(FEN_INTIP);
    const diintip = intipBasisDataAwan(FEN_INTIP);
    globalThis.fetch = fetchAsli;
    ok(
      panggilan === 1 && diintip?.langkah?.[0]?.san === "Nf3",
      "intip: hasil cache terbaca tanpa kueri tambahan"
    );
    ok(intipBasisDataAwan("bukan-fen-simpanan") === null, "intip: posisi lain → null");
    bersihkanCacheAwanKlien();
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
