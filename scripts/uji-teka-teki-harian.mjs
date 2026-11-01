/**
 * Uji Teka-teki Harian — logika klien, modul server, dan pengikatan rute.
 *
 * Yang dijaga di sini:
 *  1. Tanggal: hanya `YYYY-MM-DD` kalender sungguhan yang diterima, dan
 *     pergeseran tanggal benar di batas bulan/tahun/kabisat.
 *  2. PGN Chess.com: komentar, variasi, nomor langkah, dan hasil partai tidak
 *     boleh bocor menjadi "langkah"; solusi yang sah harus menghasilkan daftar
 *     UCI legal dan berakhir skakmat.
 *  3. Server: data Chess.com dinormalisasi tanpa membuat halaman kosong saat
 *     kolom opsional hilang, tanggal masa depan TIDAK memanggil Chess.com,
 *     404 menjadi "tidak-ada" (bukan galat), dan galat jaringan dilempar.
 *  4. Rute `/api/teka-teki-harian` benar-benar terdaftar di server.
 *
 * Jalankan: node scripts/uji-teka-teki-harian.mjs
 */
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, mkdir, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";
import { parseLangkah } from "../src/lib/tekaTeki.js";
import { hitungMateriBidak } from "../src/lib/materiBidak.js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jalankan = promisify(execFile);
const SKRIP_PENGUMPUL = path.join(AKAR, "scripts/ambil-teka-teki-harian.mjs");

let lolos = 0;
let gagal = 0;
const ok = (pesan) => {
  lolos++;
  console.log(`  ✅ ${pesan}`);
};
const fail = (pesan) => {
  gagal++;
  console.error(`  ❌ ${pesan}`);
};
const sama = (a, b, pesan) => {
  if (JSON.stringify(a) === JSON.stringify(b)) ok(pesan);
  else fail(`${pesan} — dapat ${JSON.stringify(a)}, harap ${JSON.stringify(b)}`);
};
const benar = (nilai, pesan) => {
  if (nilai) ok(pesan);
  else fail(pesan);
};

/* --------------------------------------------------------------- klien */

const {
  ambilIndeksSnapshot,
  ambilSoalTanggal,
  ambilSoalTerbaru,
  geserTanggal,
  langkahDariTeks,
  parsePgnTekaTeki,
  pasanganLangkah,
  sanDariPgn,
  soalDariCatatan,
  tanggalHariIni,
  tanggalSah,
  tanggalTerbaca,
  warnaGiliran,
} = await import("../src/lib/tekaTekiHarian.js");

console.log("\n== 1. Validasi tanggal ==");
{
  sama(tanggalSah("2026-11-01"), true, "tanggal sah diterima");
  sama(tanggalSah("2026-02-29"), false, "29 Feb 2026 (bukan kabisat) ditolak");
  sama(tanggalSah("2024-02-29"), true, "29 Feb 2024 (kabisat) diterima");
  sama(tanggalSah("2026-13-01"), false, "bulan 13 ditolak");
  sama(tanggalSah("2026-11-1"), false, "format satu digit ditolak");
  sama(tanggalSah(null), false, "null ditolak");
  sama(tanggalSah(20261101), false, "angka ditolak");
  sama(tanggalHariIni(new Date("2026-11-01T23:30:00Z")), "2026-11-01", "hari ini memakai UTC");
}

console.log("\n== 2. Pergeseran tanggal ==");
{
  sama(geserTanggal("2026-11-01", 1), "2026-11-02", "+1 hari");
  sama(geserTanggal("2026-11-01", -1), "2026-10-31", "-1 hari melintasi bulan");
  sama(geserTanggal("2026-12-31", 1), "2027-01-01", "+1 hari melintasi tahun");
  sama(geserTanggal("2024-02-28", 1), "2024-02-29", "masuk 29 Feb kabisat");
  sama(geserTanggal("2024-03-01", -1), "2024-02-29", "kembali ke 29 Feb kabisat");
  sama(geserTanggal("2026-11-01", "x"), null, "langkah tidak sah → null");
  sama(geserTanggal("bukan-tanggal", 1), null, "tanggal tidak sah → null");
}

console.log("\n== 3. Teks tanggal ==");
{
  const teks = tanggalTerbaca("2026-11-01", "id-ID");
  benar(/2026/.test(teks) && /November/i.test(teks), `tanggal terbaca: ${teks}`);
  sama(tanggalTerbaca("", "id-ID"), "", "nilai kosong dikembalikan apa adanya");
}

/* PGN contoh dari Chess.com (soal 1 Januari 2026 pada arsip publik). */
const FEN_CONTOH =
  "r5bk/q1p2p2/1pn4p/2nP2p1/4N3/PPN3PP/K1B2R2/B1r5 w - - 0 1";
const PGN_CONTOH = `[White "kehall41"]\r
[Black "Daily Puzzle Inspiration"]\r
[Result "1-0"]\r
[FEN "${FEN_CONTOH}"]\r
\r
1. Nb1+ Nd4 2. Bxd4+ f6 3. Bxf6+ Kh7 4. Nxg5# 1-0`;

console.log("\n== 4. Pembersihan PGN ==");
{
  const token = sanDariPgn(PGN_CONTOH);
  sama(
    token,
    ["Nb1+", "Nd4", "Bxd4+", "f6", "Bxf6+", "Kh7", "Nxg5#"],
    "header, nomor langkah, dan hasil dibuang"
  );
  sama(
    sanDariPgn("1. e4 {komentar} (1... c5 2. Nf3) e5 2. Nf3 $1 Nc6 1/2-1/2"),
    ["e4", "e5", "Nf3", "Nc6"],
    "komentar, variasi bersarang, NAG, dan hasil dibuang"
  );
  sama(sanDariPgn(""), [], "PGN kosong → tanpa langkah");
  sama(sanDariPgn(null), [], "PGN bukan string → tanpa langkah");
}

console.log("\n== 5. PGN → langkah UCI ==");
{
  const hasil = parsePgnTekaTeki(PGN_CONTOH);
  sama(hasil.langkah.length, 7, "tujuh setengah-langkah terbaca");
  sama(hasil.galat, null, "tanpa galat");
  sama(hasil.utuh, true, "seluruh PGN berhasil dimainkan");
  benar(/ w /.test(hasil.fen), "FEN awal berpihak pada putih");

  // Setiap langkah harus legal bila dimainkan berurutan, dan berakhir skakmat.
  const game = new Chess(hasil.fen);
  let legalSemua = true;
  for (const uci of hasil.langkah) {
    try {
      const { from, to, promo } = parseLangkah(uci);
      game.move({ from, to, promotion: promo || undefined });
    } catch {
      legalSemua = false;
      break;
    }
  }
  benar(legalSemua, "semua langkah UCI legal dari FEN awal");
  benar(game.isCheckmate(), "langkah terakhir menghasilkan skakmat");

  const tanpaFen = parsePgnTekaTeki(PGN_CONTOH.replace(/\[FEN[^\]]*\]\r?\n/, ""));
  sama(tanpaFen.langkah.length, 0, "tanpa FEN: langkah tidak bisa diturunkan");
  sama(tanpaFen.galat, "fen-tidak-ada", "tanpa FEN: alasan dilaporkan");

  const pakaiFenArgumen = parsePgnTekaTeki(
    PGN_CONTOH.replace(/\[FEN[^\]]*\]\r?\n/, ""),
    { fen: FEN_CONTOH }
  );
  sama(pakaiFenArgumen.langkah.length, 7, "FEN dari argumen dipakai bila header hilang");

  const fenRusak = parsePgnTekaTeki(PGN_CONTOH, { fen: "bukan fen" });
  sama(fenRusak.galat, "fen-tidak-sah", "FEN rusak dilaporkan, bukan dilempar");
  sama(fenRusak.langkah, [], "FEN rusak → tanpa langkah");

  const tanpaLangkah = parsePgnTekaTeki("", { fen: FEN_CONTOH });
  sama(tanpaLangkah.galat, "tanpa-langkah", "PGN tanpa langkah dilaporkan");
  sama(tanpaLangkah.utuh, false, "PGN tanpa langkah tidak dianggap utuh");

  const langkahRusak = parsePgnTekaTeki("1. e5", { fen: FEN_CONTOH });
  sama(langkahRusak.langkah, [], "langkah ilegal pertama berhenti di awal");
  sama(langkahRusak.galat, "san-tidak-dikenal", "alasan langkah pertama dilaporkan");
}

console.log("\n== 6. Pengelompokan langkah & giliran ==");
{
  sama(
    pasanganLangkah(["e2e4", "e7e5", "g1f3"]),
    [
      { nomor: 1, putih: "e2e4", hitam: "e7e5" },
      { nomor: 2, putih: "g1f3", hitam: null },
    ],
    "pasangan putih/hitam"
  );
  sama(pasanganLangkah([]), [], "tanpa langkah → tanpa pasangan");
  sama(
    pasanganLangkah(["e7e5", "g1f3", "b8c6"], "b"),
    [
      { nomor: 1, putih: null, hitam: "e7e5" },
      { nomor: 2, putih: "g1f3", hitam: "b8c6" },
    ],
    "hitam melangkah lebih dulu → penomoran benar"
  );
  sama(
    pasanganLangkah(["e7e5"], "b"),
    [{ nomor: 1, putih: null, hitam: "e7e5" }],
    "langkah tunggal hitam tetap satu baris"
  );
  sama(warnaGiliran(FEN_CONTOH), "w", "FEN putih melangkah");
  sama(warnaGiliran("8/8/8/8/8/8/8/8 b - - 0 1"), "b", "FEN hitam melangkah");
  sama(warnaGiliran(""), "w", "FEN kosong dianggap putih");
}

console.log("\n== 6b. Snapshot statis (tanpa API) ==");
{
  sama(langkahDariTeks("e2-e4;e7-e5"), ["e2-e4", "e7-e5"], "teks langkah → daftar");
  sama(langkahDariTeks(""), [], "teks kosong → daftar kosong");
  sama(langkahDariTeks(["a2-a3"]), ["a2-a3"], "array diteruskan");

  const soal = soalDariCatatan({
    tanggal: "2026-01-01",
    fen: FEN_CONTOH,
    langkah: "c3-b1;c6-d4",
  });
  sama(soal.tanggal, "2026-01-01", "tanggal terbawa");
  sama(soal.langkah, ["c3-b1", "c6-d4"], "langkah dipecah dari teks");
  sama(soal.orientasi, "w", "orientasi dari FEN");
  benar(/daily-chess-puzzle\/2026-01-01$/.test(soal.url), "tautan asli disusun dari tanggal");
  sama(soalDariCatatan({ tanggal: "2026-01-01", fen: FEN_CONTOH }), null, "tanpa langkah → null");
  sama(soalDariCatatan({ tanggal: "2026-13-40", fen: FEN_CONTOH, langkah: "a2-a3" }), null, "tanggal rusak → null");
  sama(soalDariCatatan({ tanggal: "2026-01-01", fen: "", langkah: "a2-a3" }), null, "tanpa FEN → null");

  // `muat` disuntikkan supaya uji tidak butuh fetch/DOM.
  const berkas = new Map([
    [
      "data/teka-teki-harian/terbaru.json",
      { soal: [{ tanggal: "2026-01-01", fen: FEN_CONTOH, langkah: "c3-b1" }] },
    ],
    [
      "data/teka-teki-harian/2007.json",
      {
        soal: [
          { tanggal: "2007-05-08", fen: FEN_CONTOH, langkah: "c3-b1;c6-d4" },
        ],
      },
    ],
  ]);
  const muat = (jalur) => {
    if (!berkas.has(jalur)) return Promise.reject(new Error(`tidak ada: ${jalur}`));
    return Promise.resolve(berkas.get(jalur));
  };

  const dariTerbaru = await ambilSoalTanggal("2026-01-01", { muat });
  sama(dariTerbaru?.tanggal, "2026-01-01", "tanggal hari ini dilayani terbaru.json");

  const dariTahun = await ambilSoalTanggal("2007-05-08", { muat });
  sama(dariTahun?.langkah.length, 2, "tanggal lama dilayani berkas tahun");
  const dibaca = [];
  await ambilSoalTanggal("2007-05-08", {
    muat: (jalur) => {
      dibaca.push(jalur);
      return muat(jalur);
    },
  });
  sama(
    dibaca,
    ["data/teka-teki-harian/terbaru.json", "data/teka-teki-harian/2007.json"],
    "berkas tahun hanya diunduh bila tanggal tidak ada di terbaru.json"
  );

  sama(await ambilSoalTanggal("1999-01-01", { muat }), null, "tanggal tanpa data → null");
  sama(await ambilSoalTanggal("bukan-tanggal", { muat }), null, "tanggal tidak sah → null");

  const terbaru = await ambilSoalTerbaru({ muat });
  sama(terbaru.length, 1, "daftar terbaru terbaca");
  sama(
    await ambilSoalTerbaru({ muat: () => Promise.reject(new Error("offline")) }),
    [],
    "snapshot hilang → daftar kosong (bukan galat)"
  );
  sama(
    await ambilIndeksSnapshot({ muat }),
    null,
    "indeks hilang → null (halaman memakai batas bawaan)"
  );
}

console.log("\n== 6c. Berkas snapshot di public/ ==");
{
  const indeks = JSON.parse(
    await readFile(path.join(AKAR, "public/data/teka-teki-harian/indeks.json"), "utf8")
  );
  benar(indeks.jumlah > 0, `indeks memuat ${indeks.jumlah} soal`);
  benar(tanggalSah(indeks.terlama) && tanggalSah(indeks.terbaru), "rentang tanggal indeks sah");
  benar(
    !JSON.stringify(indeks).includes("@") && !("judul" in indeks),
    "indeks tidak membawa judul/penulis"
  );

  // Setiap soal di setiap berkas tahun: field hanya tanggal/fen/langkah dan
  // SEMUA langkah legal bila dimainkan berurutan.
  let total = 0;
  let rusak = 0;
  let tidakMate = 0;
  for (const t of indeks.tahun) {
    const isi = JSON.parse(
      await readFile(path.join(AKAR, "public/data/teka-teki-harian", t.berkas), "utf8")
    );
    for (const catatan of isi.soal || []) {
      total++;
      const kunci = Object.keys(catatan).sort();
      if (kunci.join(",") !== "fen,langkah,tanggal") {
        rusak++;
        continue;
      }
      const soal = soalDariCatatan(catatan);
      if (!soal) {
        rusak++;
        continue;
      }
      const game = new Chess(soal.fen);
      let legal = true;
      for (const uci of soal.langkah) {
        const { from, to, promo } = parseLangkah(uci);
        try {
          game.move({ from, to, promotion: promo || undefined });
        } catch {
          legal = false;
          break;
        }
      }
      if (!legal) rusak++;
      else if (!game.isCheckmate()) tidakMate++;
    }
  }
  sama(total, indeks.jumlah, "jumlah soal di berkas tahun = jumlah di indeks");
  sama(rusak, 0, "tidak ada catatan rusak / berisi kolom tambahan");
  /*
   * Bukan semua teka-teki harian berakhir skakmat: banyak yang berupa
   * keuntungan materi. Karena itu halaman TIDAK mensyaratkan mate sebagai
   * syarat selesai (cukup seluruh langkah solusi dimainkan) — pagar di sini
   * memastikan kedua jenis soal memang ada, bukan menganggap semuanya mate.
   */
  benar(tidakMate > 0, `${total - tidakMate} soal berakhir skakmat, ${tidakMate} berakhir bukan mate`);
  benar(total - tidakMate > 0 && total - tidakMate < total, "kedua jenis soal (mate & non-mate) ada di snapshot");

  const terbaru = JSON.parse(
    await readFile(path.join(AKAR, "public/data/teka-teki-harian/terbaru.json"), "utf8")
  );
  sama(terbaru.soal.length, 7, "terbaru.json memuat 7 soal untuk widget landing");
  sama(terbaru.soal.at(-1).tanggal, indeks.terbaru, "entri terakhir = tanggal terbaru");
}

/* -------------------------------------------------------------- server */

/*
 * Chess.com dipalsukan dengan server HTTP lokal (pola sama dengan
 * `scripts/mock-chess.mjs`): `KCI_CHESS_DASAR` harus diatur SEBELUM modul
 * konfigurasi server dimuat, jadi impor dinamisnya di bawah ini.
 */
console.log("\n== 7. Modul server dengan Chess.com tiruan ==");

let jumlahPermintaan = 0;
const permintaanTerakhir = [];
const permintaanSemua = [];
const soalTiruan = {
  title: "A New Beginning 🥳",
  url: "https://www.chess.com/daily-chess-puzzle/2026-01-01",
  publish_time: 1767225600,
  fen: FEN_CONTOH,
  pgn: PGN_CONTOH,
  image: "https://images.chesscomfiles.com/uploads/v1/puzzle/1.jpg",
};

const peladen = http.createServer((req, res) => {
  jumlahPermintaan++;
  permintaanTerakhir.push(req.url);
  permintaanSemua.push(req.url);
  const kirim = (status, isi) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(isi));
  };
  if (req.url === "/puzzle") return kirim(200, soalTiruan);
  if (req.url === "/puzzle/2025-12-31") return kirim(200, soalTiruan);
  if (req.url === "/puzzle/2025-12-30") {
    return kirim(200, { ...soalTiruan, fen: "", pgn: "" });
  }
  if (req.url === "/puzzle/2025-12-29") return kirim(429, { message: "rate limit" });
  return kirim(404, { message: "not found" });
});

await new Promise((r) => peladen.listen(0, "127.0.0.1", r));
const port = peladen.address().port;
process.env.KCI_CHESS_DASAR = `http://127.0.0.1:${port}`;
process.env.KCI_CHESS_RETRY = "1";
process.env.KCI_CHESS_TIMEOUT = "3000";

const {
  ambilTekaTekiHarian,
  geserTanggal: geserTanggalServer,
  normalisasiTekaTeki,
  tanggalHariIni: hariIniServer,
  tanggalSah: tanggalSahServer,
} = await import("../server/src/teka-teki-harian.js");

{
  sama(normalisasiTekaTeki(null), null, "data kosong → null");
  sama(normalisasiTekaTeki({ pgn: "1. e4" }), null, "tanpa FEN → null");
  sama(
    normalisasiTekaTeki({ fen: "bukan fen", pgn: "" }),
    null,
    "FEN rusak → null"
  );

  const soal = normalisasiTekaTeki(soalTiruan, { tanggal: "2026-01-01" });
  sama(soal.tersedia, true, "data sah → tersedia");
  sama(soal.fen, FEN_CONTOH, "FEN diteruskan apa adanya");
  sama(soal.judul, "A New Beginning 🥳", "judul diteruskan");
  sama(soal.sumber, "chess.com", "sumber ditandai");
  sama(soal.terbitPada, new Date(1767225600 * 1000).toISOString(), "waktu terbit → ISO");
  sama(soal.tanggal, "2026-01-01", "tanggal diteruskan");

  const minimal = normalisasiTekaTeki({ fen: FEN_CONTOH }, { tanggal: "2026-01-01" });
  sama(minimal.judul, "", "judul hilang → string kosong, bukan crash");
  benar(/daily-chess-puzzle\/2026-01-01$/.test(minimal.url), "tautan cadangan dibuat dari tanggal");
  sama(minimal.gambar, null, "gambar hilang → null");
  sama(minimal.pgn, "", "PGN hilang → string kosong");
  sama(minimal.terbitPada, null, "publish_time hilang → null");
}

{
  const sekarang = new Date("2026-01-01T12:00:00Z");
  sama(hariIniServer(sekarang), "2026-01-01", "hari ini server = UTC");
  sama(tanggalSahServer("2026-01-01"), "2026-01-01", "tanggal sah server");
  sama(tanggalSahServer("2026-02-30"), null, "tanggal mustahil ditolak");
  sama(geserTanggalServer("2026-01-01", -1), "2025-12-31", "geser tanggal server");

  // Soal hari ini memakai jalur pendek `/puzzle`.
  const hariIni = await ambilTekaTekiHarian({ sekarang });
  sama(hariIni.tersedia, true, "soal hari ini diambil dari /puzzle");
  sama(permintaanTerakhir.at(-1), "/puzzle", "jalur /puzzle dipakai untuk hari ini");

  // Arsip memakai jalur bertanggal.
  const arsip = await ambilTekaTekiHarian({ tanggal: "2025-12-31", sekarang });
  sama(arsip.tersedia, true, "arsip tanggal lampau tersedia");
  sama(permintaanTerakhir.at(-1), "/puzzle/2025-12-31", "jalur arsip bertanggal");

  // Tanggal masa depan tidak boleh memanggil Chess.com sama sekali.
  const sebelum = jumlahPermintaan;
  const masaDepan = await ambilTekaTekiHarian({ tanggal: "2026-01-05", sekarang });
  sama(masaDepan, { tersedia: false, tanggal: "2026-01-05", alasan: "masa-depan" }, "masa depan ditolak tanpa panggilan");
  sama(jumlahPermintaan, sebelum, "Chess.com tidak dipanggil untuk tanggal masa depan");

  // 404 → "tidak-ada", bukan galat.
  const tidakAda = await ambilTekaTekiHarian({ tanggal: "2020-01-01", sekarang });
  sama(tidakAda, { tersedia: false, tanggal: "2020-01-01", alasan: "tidak-ada" }, "404 → tidak-ada");

  // Data tanpa FEN → alasan data-tidak-lengkap.
  const tidakLengkap = await ambilTekaHarianAman("2025-12-30", sekarang);
  sama(tidakLengkap.alasan, "data-tidak-lengkap", "data tanpa FEN → data-tidak-lengkap");

  // 429 setelah percobaan habis → galat dilempar (bukan "tidak-ada").
  let melempar = false;
  try {
    await ambilTekaHarianAman("2025-12-29", sekarang, { lempar: true });
  } catch {
    melempar = true;
  }
  benar(melempar, "kegagalan sementara dilempar sebagai galat");
}

console.log("\n== 8. Rute API terdaftar ==");
{
  const rute = await readFile(path.join(AKAR, "server/src/rute.js"), "utf8");
  benar(
    rute.includes('router.get("/api/teka-teki-harian"'),
    "rute GET /api/teka-teki-harian terdaftar"
  );
  benar(
    /ambilTekaTekiHarian/.test(rute) && /tanggalSah/.test(rute),
    "rute memakai modul & validator tanggal"
  );

  const app = await readFile(path.join(AKAR, "src/App.jsx"), "utf8");
  benar(app.includes('["/teka-teki-harian", TekaTekiHarian]'), "rute halaman terdaftar di App.jsx");
}

/* Fungsi bantu: ambil tanpa melempar, atau melempar bila diminta. */
async function ambilTekaHarianAman(tanggal, sekarang, { lempar = false } = {}) {
  try {
    return await ambilTekaTekiHarian({ tanggal, sekarang });
  } catch (e) {
    if (lempar) throw e;
    return { tersedia: false, galat: e.message };
  }
}

console.log("\n== 9. Skrip pengumpul snapshot ==");
{
  const tmp = await mkdtemp(path.join(os.tmpdir(), "kci-harian-uji-"));

  // (a) Mode impor arsip lokal: PGN dipakai, kolom lain dibuang.
  const folderArsip = path.join(tmp, "arsip", "2020");
  await mkdir(folderArsip, { recursive: true });
  await writeFile(
    path.join(folderArsip, "2020-01.json"),
    JSON.stringify([
      {
        id: 1,
        date: "2020-01-01",
        title: "Judul yang tidak boleh ikut tersimpan",
        pgn: PGN_CONTOH,
        author: { name: "Orang", avatar_url: "https://contoh/x.jpg" },
        video: { url: "https://contoh/v.mp4" },
      },
      { id: 2, date: "2020-01-02", pgn: "", author: { name: "Tanpa FEN" } },
      { id: 3, date: "bukan-tanggal", pgn: PGN_CONTOH },
    ]),
    "utf8"
  );

  const keluaranArsip = path.join(tmp, "keluaran-arsip");
  const hasilImpor = await jalankan(process.execPath, [
    SKRIP_PENGUMPUL,
    "--dari-arsip",
    path.join(tmp, "arsip"),
    "--keluaran",
    keluaranArsip,
  ]);
  benar(/1 soal terbaca/.test(hasilImpor.stdout), "arsip: satu catatan sah terbaca");

  const indeksImpor = JSON.parse(
    await readFile(path.join(keluaranArsip, "indeks.json"), "utf8")
  );
  sama(indeksImpor.jumlah, 1, "arsip: satu soal tersimpan");
  sama(indeksImpor.terbaru, "2020-01-01", "arsip: tanggal benar");
  benar(
    !JSON.stringify(indeksImpor).includes("Judul yang tidak boleh") &&
      !JSON.stringify(indeksImpor).includes("contoh/x.jpg") &&
      !JSON.stringify(indeksImpor).includes("contoh/v.mp4"),
    "arsip: judul, avatar, dan video TIDAK ikut tersimpan"
  );
  const berkas2020 = JSON.parse(
    await readFile(path.join(keluaranArsip, "2020.json"), "utf8")
  );
  sama(Object.keys(berkas2020.soal[0]).sort(), ["fen", "langkah", "tanggal"], "arsip: hanya tiga kolom");
  sama(
    berkas2020.soal[0].langkah,
    "c3-b1;c6-d4;a1-d4;f7-f6;d4-f6;h8-h7;e4-g5",
    "arsip: langkah solusi tersimpan (notasi from-to)"
  );

  // (b) Mode API: terhadap Chess.com tiruan, dan inkremental pada jalannya kedua.
  const keluaranApi = path.join(tmp, "keluaran-api");
  const argumenApi = [
    SKRIP_PENGUMPUL,
    "--dasar",
    `http://127.0.0.1:${port}`,
    "--dari",
    "2025-12-30",
    "--sampai",
    "2025-12-31",
    "--keluaran",
    keluaranApi,
  ];
  const hitung = (jalur) =>
    permintaanSemua.filter((u) => u === jalur).length;
  // Bagian 7 sudah memakai kedua tanggal ini; hitung SELISIHNYA, bukan total.
  const awal3112 = hitung("/puzzle/2025-12-31");
  const awal3012 = hitung("/puzzle/2025-12-30");
  const pertama = await jalankan(process.execPath, argumenApi);
  sama(hitung("/puzzle/2025-12-31") - awal3112, 1, "api: tanggal bersoal diminta sekali");
  sama(hitung("/puzzle/2025-12-30") - awal3012, 1, "api: tanggal kosong tetap dicoba");
  benar(
    /1 baru/.test(pertama.stdout.replace(/\s+/g, " ")),
    "api: tanggal bersoal diambil, tanggal tanpa data dilewati"
  );
  const indeksApi = JSON.parse(
    await readFile(path.join(keluaranApi, "indeks.json"), "utf8")
  );
  sama(indeksApi.jumlah, 1, "api: hanya tanggal bersoal yang disimpan (2025-12-31)");
  sama(indeksApi.terbaru, "2025-12-31", "api: tanggal tersimpan benar");
  const berkasApi = JSON.parse(
    await readFile(path.join(keluaranApi, "2025.json"), "utf8")
  );
  sama(berkasApi.soal[0].langkah.split(";").length, 7, "api: seluruh langkah solusi tersimpan");
  const kedua = await jalankan(process.execPath, argumenApi);
  /*
   * Tanggal yang SUDAH tersimpan tidak boleh diambil ulang. Tanggal yang
   * kosong (belum terbit saat itu) memang dicoba lagi — ia bisa muncul
   * belakangan, jadi bukan sesuatu yang boleh di-cache selamanya.
   */
  sama(
    hitung("/puzzle/2025-12-31") - awal3112,
    1,
    "api: tanggal yang sudah tersimpan tidak diminta ulang"
  );
  sama(
    hitung("/puzzle/2025-12-30") - awal3012,
    2,
    "api: tanggal kosong dicoba lagi pada jalan berikutnya"
  );
  sama(
    JSON.parse(await readFile(path.join(keluaranApi, "indeks.json"), "utf8")).jumlah,
    1,
    "api: jalan kedua tidak menggandakan data"
  );
  benar(/dilewati/.test(kedua.stdout), "api: tanggal lama dilewati (inkremental)");

  // (c) `--kering` tidak menulis berkas apa pun.
  const keluaranKering = path.join(tmp, "keluaran-kering");
  await jalankan(process.execPath, [
    ...argumenApi.slice(0, -2),
    "--keluaran",
    keluaranKering,
    "--kering",
  ]);
  let adaBerkas = true;
  try {
    await readFile(path.join(keluaranKering, "indeks.json"));
  } catch {
    adaBerkas = false;
  }
  sama(adaBerkas, false, "--kering tidak menulis berkas");

  await rm(tmp, { recursive: true, force: true });
}

console.log("\n== 10. Selisih materi di samping papan ==");
{
  const awal = hitungMateriBidak(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  sama(awal.selisih, 0, "posisi awal: materi seimbang");
  sama(awal.keping.length, 0, "posisi awal: belum ada bidak tertangkap");

  // Hitam kehilangan satu kuda di g8.
  const contoh = hitungMateriBidak(
    "rnbqkbr1/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  sama(contoh.selisih, 3, "kuda hitam hilang: putih unggul 3");
  sama(contoh.keping.map((k) => k.bidak), ["n"], "bidak tertangkap diberi nama FEN");

  // Hitam utuh, putih kehilangan dua pion → hitam unggul 2.
  const unggulHitam = hitungMateriBidak(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPP2/RNBQKBNR w KQkq - 0 1"
  );
  sama(unggulHitam.selisih, -2, "putih kurang dua pion: hitam unggul 2");

  const duaPionPutih = hitungMateriBidak(
    "rnbqqkbr/pppppppp/8/8/8/8/PPPPPP2/RNBQKBNR w KQkq - 0 1"
  );
  benar(
    duaPionPutih.keping.filter((k) => k.bidak === "P").length >= 2,
    "pion putih yang hilang terhitung"
  );

  const urutan = hitungMateriBidak(
    "4k3/8/8/8/8/8/8/4K3 w - - 0 1"
  );
  const nilaiTurun = urutan.keping.every(
    (k, i) => i === 0 || urutan.keping[i - 1].nilai >= k.nilai
  );
  benar(nilaiTurun, "bidak tertangkap diurutkan dari yang paling berharga");
  sama(urutan.selisih, 0, "hanya dua raja tersisa: materi seimbang");

  // Promosi: ratu tambahan tidak boleh dilaporkan sebagai pion yang tertangkap.
  const promosi = hitungMateriBidak("4k3/8/8/8/8/8/PPPPPPP1/4K1QQ w - - 0 1");
  sama(
    promosi.keping.filter((k) => k.bidak === "P").length,
    0,
    "pion yang berpromosi tidak dihitung tertangkap"
  );
  benar(promosi.selisih > 15, "ratu tambahan menambah nilai materi putih");

  sama(hitungMateriBidak("").selisih, 0, "FEN kosong: selisih 0 tanpa galat");
}

peladen.close();

console.log(
  `\n${gagal ? "GAGAL" : "OK"} — ${lolos} lulus, ${gagal} gagal.`
);
if (gagal) process.exit(1);
