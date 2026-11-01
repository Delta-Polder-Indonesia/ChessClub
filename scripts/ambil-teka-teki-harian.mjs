/**
 * Pengumpul Teka-teki Harian → snapshot statis (agar situs jalan TANPA API).
 *
 * Keluaran (bawaan `public/data/teka-teki-harian/`):
 *   indeks.json        — daftar tahun, rentang tanggal, jumlah soal
 *   terbaru.json       — 7 soal terakhir (dipakai widget di landing, ±2 KB)
 *   <tahun>.json       — semua soal tahun itu (satu berkas ±40 KB)
 *
 * Setiap soal hanya memuat TIGA hal: `tanggal`, `fen`, `langkah` (notasi
 * `from-to`, sama dengan `parseLangkah()` di src/lib/tekaTeki.js).
 * Judul, nama/avatar penulis, video, dan hitungan komentar TIDAK diambil —
 * itu konten kreatif dan data pribadi pihak lain, bukan bagian dari soal.
 *
 * Dua sumber data:
 *
 * 1. API PUBLIK RESMI CHESS.COM (disarankan)
 *      node scripts/ambil-teka-teki-harian.mjs --hari 400
 *      node scripts/ambil-teka-teki-harian.mjs --dari 2007-05-08 --sampai 2026-11-01
 *    Endpoint: https://api.chess.com/pub/puzzle/YYYY-MM-DD
 *    Hasilnya inkremental: tanggal yang sudah ada di snapshot dilewati.
 *
 * 2. SALINAN ARSIP LOKAL (opsional, tanggung jawab pemakai)
 *      git clone --depth 1 https://github.com/samuraitruong/chess.com-daily-puzzle /tmp/arsip
 *      node scripts/ambil-teka-teki-harian.mjs --dari-arsip /tmp/arsip/puzzle
 *    Membaca berkas bulanan `puzzle/<tahun>/<tahun>-<bulan>.json` dan menyimpan
 *    ulang HANYA tanggal + FEN + langkah solusi. Arsip itu tidak berlisensi dan
 *    diambil dari endpoint internal Chess.com (bukan API resmi), jadi pakai
 *    hanya bila Anda sudah menilai risikonya sendiri; cara (1) selalu lebih aman
 *    dan selalu terbaru.
 *
 * Setelah snapshot dibuat, jalankan `npm run uji:teka-teki-harian` dan rebuild.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePgnTekaTeki, tanggalHariIni, tanggalSah } from "../src/lib/tekaTekiHarian.js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DASAR_BAWAAN = process.env.KCI_CHESS_DASAR || "https://api.chess.com/pub";
const KELUARAN_BAWAAN = path.join(AKAR, "public", "data", "teka-teki-harian");
const UA = "KomunitasCaturIndonesia/1.0 (+https://blunderskuad.id; pengumpul snapshot)";
const JEDA_MS = 250;
const PERCOBAAN = 4;
const JUMLAH_TERBARU = 7;

/* ------------------------------------------------------------- argumen */

function argumen(nama, bawaan = null) {
  const i = process.argv.indexOf(`--${nama}`);
  if (i === -1) return bawaan;
  const nilai = process.argv[i + 1];
  if (!nilai || nilai.startsWith("--")) return true;
  return nilai;
}

const PILIHAN = {
  hari: Number(argumen("hari", 400)),
  dari: argumen("dari", null),
  sampai: argumen("sampai", null),
  dasar: String(argumen("dasar", DASAR_BAWAAN)).replace(/\/+$/, ""),
  keluaran: path.resolve(String(argumen("keluaran", KELUARAN_BAWAAN))),
  dariArsip: argumen("dari-arsip", null),
  paksa: Boolean(argumen("paksa", false)),
  kering: Boolean(argumen("kering", false)),
};

/* ---------------------------------------------------------------- util */

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

/** Daftar tanggal `YYYY-MM-DD` dari `dari` sampai `sampai` (inklusif). */
function rentangTanggal(dari, sampai) {
  const hasil = [];
  let kini = dari;
  let batas = 0;
  while (kini <= sampai && batas++ < 20000) {
    hasil.push(kini);
    const [t, b, h] = kini.split("-").map(Number);
    kini = new Date(Date.UTC(t, b - 1, h + 1)).toISOString().slice(0, 10);
  }
  return hasil;
}

/** Simpan JSON dengan tulis atomik (tmp → rename) supaya tidak setengah jadi. */
async function tulisJson(berkas, nilai) {
  await fsp.mkdir(path.dirname(berkas), { recursive: true });
  const sementara = `${berkas}.tmp-${process.pid}`;
  await fsp.writeFile(sementara, `${JSON.stringify(nilai)}\n`, "utf8");
  await fsp.rename(sementara, berkas);
}

function bacaJsonSync(berkas) {
  try {
    return JSON.parse(fs.readFileSync(berkas, "utf8"));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- sumber 1 */

/** Ambil satu tanggal dari API publik resmi Chess.com. */
async function ambilDariApi(tanggal) {
  let galatTerakhir = null;
  for (let percobaan = 1; percobaan <= PERCOBAAN; percobaan++) {
    try {
      const res = await fetch(`${PILIHAN.dasar}/puzzle/${tanggal}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 404) return { status: "kosong" };
      if (res.status === 429 || res.status >= 500) {
        galatTerakhir = new Error(`HTTP ${res.status}`);
      } else if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      } else {
        const data = await res.json();
        const hasil = parsePgnTekaTeki(data?.pgn, { fen: data?.fen });
        if (!hasil.fen || !hasil.langkah.length) return { status: "kosong" };
        return {
          status: "ok",
          soal: { tanggal, fen: hasil.fen, langkah: hasil.langkah.join(";") },
        };
      }
    } catch (e) {
      galatTerakhir = e;
    }
    await tidur(800 * percobaan);
  }
  return { status: "galat", pesan: galatTerakhir?.message || "tidak diketahui" };
}

/* ------------------------------------------------------------- sumber 2 */

/**
 * Impor dari salinan arsip pihak ketiga. Hanya `date`, `parsed.fen`, dan
 * langkah solusi yang dipakai; `pgn` milik arsip itu juga berisi judul/penulis
 * tetapi kita hanya menyimpan hasil urainya.
 */
async function imporArsip(folder) {
  const soal = [];
  let dilewati = 0;
  const tahun = (await fsp.readdir(folder, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && /^\d{4}$/.test(e.name))
    .map((e) => e.name)
    .sort();

  for (const th of tahun) {
    const dir = path.join(folder, th);
    const berkas = (await fsp.readdir(dir)).filter((f) => f.endsWith(".json")).sort();
    for (const nama of berkas) {
      let isi;
      try {
        isi = JSON.parse(await fsp.readFile(path.join(dir, nama), "utf8"));
      } catch {
        dilewati++;
        continue;
      }
      for (const catatan of Array.isArray(isi) ? isi : []) {
        const tanggal = tanggalSah(catatan?.date) ? catatan.date : null;
        if (!tanggal) {
          dilewati++;
          continue;
        }
        const fen = catatan?.parsed?.fen || catatan?.fen || null;
        const pgn = typeof catatan?.pgn === "string" ? catatan.pgn : "";
        const hasil = parsePgnTekaTeki(pgn, { fen });
        if (!hasil.fen || !hasil.langkah.length) {
          dilewati++;
          continue;
        }
        soal.push({ tanggal, fen: hasil.fen, langkah: hasil.langkah.join(";") });
      }
    }
  }
  return { soal, dilewati };
}

/* --------------------------------------------------------------- tulis */

/** Susun indeks + berkas per tahun + terbaru dari daftar soal. */
async function tulisSnapshot(soal, { sumber, dilewati = 0 }) {
  const unik = new Map();
  for (const s of soal) unik.set(s.tanggal, s);
  const urut = [...unik.values()].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const perTahun = new Map();
  for (const s of urut) {
    const tahun = Number(s.tanggal.slice(0, 4));
    if (!perTahun.has(tahun)) perTahun.set(tahun, []);
    perTahun.get(tahun).push(s);
  }

  const indeks = {
    versi: 1,
    dibuat: new Date().toISOString(),
    sumber,
    catatan:
      "Hanya tanggal, FEN, dan langkah solusi. Judul, penulis, dan media milik Chess.com tidak disimpan. Dibuat oleh scripts/ambil-teka-teki-harian.mjs.",
    jumlah: urut.length,
    terlama: urut[0]?.tanggal || null,
    terbaru: urut.at(-1)?.tanggal || null,
    tahun: [...perTahun.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([tahun, daftar]) => ({
        tahun,
        jumlah: daftar.length,
        dari: daftar[0].tanggal,
        sampai: daftar.at(-1).tanggal,
        berkas: `${tahun}.json`,
      })),
  };
  const terbaru = urut.slice(-JUMLAH_TERBARU);

  if (PILIHAN.kering) {
    console.log(
      `[kering] ${urut.length} soal, ${perTahun.size} tahun, terbaru ${indeks.terbaru}`
    );
    return indeks;
  }

  await tulisJson(path.join(PILIHAN.keluaran, "indeks.json"), indeks);
  await tulisJson(path.join(PILIHAN.keluaran, "terbaru.json"), {
    dibuat: indeks.dibuat,
    soal: terbaru,
  });
  for (const [tahun, daftar] of perTahun) {
    await tulisJson(path.join(PILIHAN.keluaran, `${tahun}.json`), {
      tahun,
      jumlah: daftar.length,
      soal: daftar,
    });
  }
  // Berkas tahun yang tidak lagi punya soal (mis. rentang dipersempit) dibuang
  // agar tidak ada data lama yang tertinggal dan membingungkan pembaca.
  try {
    for (const nama of await fsp.readdir(PILIHAN.keluaran)) {
      const cocok = /^(\d{4})\.json$/.exec(nama);
      if (cocok && !perTahun.has(Number(cocok[1]))) {
        await fsp.rm(path.join(PILIHAN.keluaran, nama), { force: true });
      }
    }
  } catch {
    /* folder belum ada — tidak ada yang perlu dibersihkan */
  }

  console.log(
    `Snapshot ditulis: ${urut.length} soal (${perTahun.size} berkas tahun), ` +
      `terbaru ${indeks.terbaru || "—"}${dilewati ? `, ${dilewati} catatan dilewati` : ""}.`
  );
  return indeks;
}

/* ---------------------------------------------------------------- main */

const soalLama = [];
if (!PILIHAN.paksa) {
  const indeksLama = bacaJsonSync(path.join(PILIHAN.keluaran, "indeks.json"));
  for (const t of indeksLama?.tahun || []) {
    const isi = bacaJsonSync(path.join(PILIHAN.keluaran, t.berkas));
    for (const s of isi?.soal || []) soalLama.push(s);
  }
}

if (PILIHAN.dariArsip) {
  const folder = path.resolve(String(PILIHAN.dariArsip));
  console.log(`Mengimpor dari arsip lokal: ${folder}`);
  const { soal, dilewati } = await imporArsip(folder);
  console.log(`  ${soal.length} soal terbaca dari arsip (${dilewati} dilewati).`);
  await tulisSnapshot([...soalLama, ...soal], {
    sumber:
      "arsip lokal (samuraitruong/chess.com-daily-puzzle) — hanya FEN & langkah solusi",
    dilewati,
  });
} else {
  const sampai = tanggalSah(PILIHAN.sampai) ? PILIHAN.sampai : tanggalHariIni();
  const dari =
    (tanggalSah(PILIHAN.dari) && PILIHAN.dari) ||
    new Date(Date.parse(`${sampai}T00:00:00Z`) - (PILIHAN.hari - 1) * 86400000)
      .toISOString()
      .slice(0, 10);

  const punya = new Set(soalLama.map((s) => s.tanggal));
  const daftar = rentangTanggal(dari, sampai);
  console.log(
    `Mengambil ${daftar.length} tanggal dari ${PILIHAN.dasar} ` +
      `(${dari} → ${sampai}); ${punya.size} sudah ada di snapshot.`
  );

  const baru = [];
  let kosong = 0;
  let galat = 0;
  for (const [i, tanggal] of daftar.entries()) {
    if (punya.has(tanggal) && !PILIHAN.paksa) {
      process.stdout.write(`\r  ${i + 1}/${daftar.length} — dilewati (sudah ada)   `);
      continue;
    }
    const hasil = await ambilDariApi(tanggal);
    if (hasil.status === "ok") baru.push(hasil.soal);
    else if (hasil.status === "kosong") kosong++;
    else {
      galat++;
      console.warn(`\n  ! ${tanggal}: ${hasil.pesan}`);
    }
    process.stdout.write(
      `\r  ${i + 1}/${daftar.length} — ${baru.length} baru, ${kosong} kosong, ${galat} galat   `
    );
    await tidur(JEDA_MS);
  }
  process.stdout.write("\n");

  if (!baru.length && !soalLama.length) {
    console.error(
      "Tidak ada soal yang berhasil diambil. Periksa koneksi / --dasar, lalu coba lagi."
    );
    process.exit(1);
  }
  await tulisSnapshot([...soalLama, ...baru], {
    sumber: `${PILIHAN.dasar}/puzzle/<tanggal> (API publik Chess.com)`,
    dilewati: kosong + galat,
  });
  if (galat) {
    console.warn(
      `${galat} tanggal gagal diambil — jalankan ulang perintah yang sama; tanggal yang sudah ada akan dilewati.`
    );
  }
}
