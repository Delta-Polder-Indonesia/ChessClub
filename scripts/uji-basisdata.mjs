/**
 * Uji basis data partai (`src/halaman/Analisa/basisData.js`).
 *
 * Fokusnya satu hal yang mudah rusak diam-diam: **paginasi harus benar-benar
 * per halaman**. Versi lama memanggil `store.getAll()` — seluruh partai
 * berikut teks PGN-nya dibaca ke memori setiap kali tabel Basis Data
 * berpindah halaman, lalu 99% hasilnya dibuang dengan `slice`. Dengan ribuan
 * partai tersimpan, membuka halaman 5 berarti mengunduh ulang semuanya.
 *
 * Yang diperiksa di sini (dengan IndexedDB tiruan `fake-indexeddb`):
 *  1. Halaman 1 hanya mengembalikan sejumlah baris yang diminta, dengan total
 *     keseluruhan tetap benar.
 *  2. Halaman berikutnya berisi baris yang berbeda dan urutannya nyambung.
 *  3. Kueri berhalaman TIDAK memakai `getAll` sama sekali, dan kursornya
 *     melompat lewat `advance(offset)` — bukan membaca satu per satu dari awal.
 *  4. `sertakanPgn: false` benar-benar membuang teks PGN dari hasil.
 *  5. Filter, pencarian, dan pengurutan tetap memberi hasil yang benar.
 *
 * Skrip melewatkan dirinya (exit 0) bila `fake-indexeddb` tidak terpasang.
 *
 * Jalankan: node scripts/uji-basisdata.mjs
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("fake-indexeddb")) {
  console.log("lewati uji basis data — pasang `npm i -D fake-indexeddb` untuk menjalankannya.");
  process.exit(0);
}

await import("fake-indexeddb/auto");

/* basisData.js memakai `window.indexedDB`; sediakan jendela tiruan. */
globalThis.window = globalThis;

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, catatan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}${catatan ? ` — ${catatan}` : ""}`);
  }
}

/* ── Mata-mata: hitung pemakaian getAll / cursor ─────────────────────── */

const hitung = { getAll: 0, getAllPartai: 0, openCursor: 0, advance: 0, lanjut: 0 };

/** Nama store yang sedang diakses (indeks pun menunjuk store induknya). */
const namaStore = (ini) => {
  try {
    return ini?.name && ini?.objectStore ? ini.objectStore.name : (ini?.name ?? "");
  } catch {
    return "";
  }
};

for (const Kelas of [IDBObjectStore, IDBIndex]) {
  const getAllAsli = Kelas.prototype.getAll;
  Kelas.prototype.getAll = function (...args) {
    hitung.getAll++;
    // Store "koleksi" isinya satu baris per akun — membacanya sekaligus wajar.
    if (namaStore(this) === "partai") hitung.getAllPartai++;
    return getAllAsli.apply(this, args);
  };
  const bukaAsli = Kelas.prototype.openCursor;
  Kelas.prototype.openCursor = function (...args) {
    hitung.openCursor++;
    return bukaAsli.apply(this, args);
  };
}
const advanceAsli = IDBCursor.prototype.advance;
IDBCursor.prototype.advance = function (n) {
  hitung.advance++;
  return advanceAsli.call(this, n);
};
const lanjutAsli = IDBCursor.prototype.continue;
IDBCursor.prototype.continue = function (...args) {
  hitung.lanjut++;
  return lanjutAsli.apply(this, args);
};
const resetHitung = () => {
  hitung.getAll = 0;
  hitung.getAllPartai = 0;
  hitung.openCursor = 0;
  hitung.advance = 0;
  hitung.lanjut = 0;
};

/* ── Data uji ────────────────────────────────────────────────────────── */

const basisData = await import("../src/halaman/Analisa/basisData.js");

const TOTAL = 320;
const PER_HALAMAN = 50;
const KELAS_WAKTU = ["blitz", "rapid", "bullet"];

/** PGN cukup panjang supaya "membaca semuanya" terasa mahal, seperti aslinya. */
function pgnPanjang(i) {
  const langkah = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6";
  return [
    `[Event "Uji ${i}"]`,
    `[White "Pemain${String(i).padStart(4, "0")}"]`,
    `[Black "Lawan${String(i).padStart(4, "0")}"]`,
    '[Result "1-0"]',
    "",
    `${langkah} ${"8. c3 O-O 9. h3 Nb8 10. d4 Nbd7".repeat(6)} 1-0`,
  ].join("\n");
}

const partaiUji = Array.from({ length: TOTAL }, (_, i) => ({
  pgn: pgnPanjang(i),
  whiteName: `Pemain${String(i).padStart(4, "0")}`,
  blackName: `Lawan${String(i).padStart(4, "0")}`,
  whiteElo: 1200 + (i % 500),
  blackElo: 1300 + (i % 400),
  result: i % 3 === 0 ? "white" : i % 3 === 1 ? "black" : "draw",
  // Timestamp menaik: partai indeks terbesar adalah yang terbaru.
  timestamp: 1700000000000 + i * 3600000,
  timeClass: KELAS_WAKTU[i % KELAS_WAKTU.length],
  plyCount: 20 + (i % 40),
}));

console.log(`Menyiapkan ${TOTAL} partai di IndexedDB tiruan…`);
const simpan = await basisData.simpanBanyakPartai(partaiUji, {
  platform: "chessCom",
  username: "pemainuji",
});
uji(`${TOTAL} partai tersimpan`, simpan?.tersimpan === TOTAL, `tersimpan=${simpan?.tersimpan}`);

/* ── 1 & 2 — halaman demi halaman ────────────────────────────────────── */

console.log("\nPaginasi");
const opsiDasar = {
  platform: "chessCom",
  username: "pemainuji",
  urut: "tanggal",
  arah: "desc",
  limit: PER_HALAMAN,
  sertakanPgn: false,
};

const halaman1 = await basisData.ambilDaftarPartai({ ...opsiDasar, offset: 0 });
uji("halaman 1 hanya berisi satu halaman baris", halaman1.partai.length === PER_HALAMAN, `dapat ${halaman1.partai.length}`);
uji("total keseluruhan tetap dilaporkan", halaman1.total === TOTAL, `total=${halaman1.total}`);
uji(
  "halaman 1 memuat partai terbaru lebih dulu (urut turun)",
  halaman1.partai[0].timestamp > halaman1.partai[PER_HALAMAN - 1].timestamp
);

const halaman2 = await basisData.ambilDaftarPartai({ ...opsiDasar, offset: PER_HALAMAN });
const id1 = new Set(halaman1.partai.map((p) => p.id));
const tumpang = halaman2.partai.filter((p) => id1.has(p.id));
uji("halaman 2 berisi baris yang berbeda", halaman2.partai.length === PER_HALAMAN && tumpang.length === 0);
uji(
  "urutan antar halaman nyambung",
  halaman1.partai[PER_HALAMAN - 1].timestamp > halaman2.partai[0].timestamp
);

const halamanTerakhir = await basisData.ambilDaftarPartai({
  ...opsiDasar,
  offset: Math.floor(TOTAL / PER_HALAMAN) * PER_HALAMAN,
});
uji("halaman terakhir berisi sisanya saja", halamanTerakhir.partai.length === TOTAL % PER_HALAMAN);

const lewatBatas = await basisData.ambilDaftarPartai({ ...opsiDasar, offset: TOTAL + 100 });
uji("offset di luar jangkauan mengembalikan daftar kosong", lewatBatas.partai.length === 0 && lewatBatas.total === TOTAL);

/* ── 3 — bukti hanya satu halaman yang dibaca ────────────────────────── */

console.log("\nBiaya baca (regresi getAll)");
resetHitung();
const halaman5 = await basisData.ambilDaftarPartai({ ...opsiDasar, offset: 4 * PER_HALAMAN });
uji("halaman 5 tetap utuh", halaman5.partai.length === PER_HALAMAN);
uji(
  "kueri berhalaman tidak memakai getAll pada store partai",
  hitung.getAllPartai === 0,
  `getAll dipanggil ${hitung.getAllPartai}×`
);
uji("kursor melompati offset dengan advance()", hitung.advance === 1, `advance ${hitung.advance}×`);
uji(
  "kursor hanya melangkah sebanyak baris halaman",
  hitung.lanjut <= PER_HALAMAN,
  `continue ${hitung.lanjut}× untuk ${PER_HALAMAN} baris`
);

/* ── 4 — teks PGN tidak ikut ditarik ─────────────────────────────────── */

console.log("\nMuatan data");
uji(
  "sertakanPgn:false membuang teks PGN dari hasil",
  halaman1.partai.every((p) => !("pgn" in p))
);
uji(
  "metadata baris tetap lengkap",
  halaman1.partai.every((p) => p.id && p.whiteName && p.blackName && p.timestamp)
);
const satu = await basisData.ambilPartai(halaman1.partai[0].id);
uji("PGN penuh tetap bisa diambil per partai lewat ambilPartai()", Boolean(satu?.pgn?.includes("[Event")));

const denganPgn = await basisData.ambilDaftarPartai({ ...opsiDasar, offset: 0, sertakanPgn: true });
uji("sertakanPgn:true tetap membawa PGN", denganPgn.partai.every((p) => typeof p.pgn === "string" && p.pgn.length > 0));

/* ── 5 — filter, pencarian, pengurutan ───────────────────────────────── */

console.log("\nFilter & urutan");
const kelasBlitz = partaiUji.filter((p) => p.timeClass === "blitz").length;
const hasilBlitz = await basisData.ambilDaftarPartai({
  ...opsiDasar,
  offset: 0,
  timeClass: "blitz",
});
uji(
  "filter kelas waktu menghitung total yang benar",
  hasilBlitz.total === kelasBlitz,
  `total=${hasilBlitz.total} seharusnya ${kelasBlitz}`
);
uji("filter kelas waktu tetap dibatasi satu halaman", hasilBlitz.partai.length === Math.min(PER_HALAMAN, kelasBlitz));
uji("semua baris hasil filter benar", hasilBlitz.partai.every((p) => p.timeClass === "blitz"));

const putihMenang = partaiUji.filter((p) => p.result === "white").length;
const hasilPutih = await basisData.ambilDaftarPartai({ ...opsiDasar, offset: 0, hasil: "white" });
uji("filter hasil (putih menang) benar", hasilPutih.total === putihMenang);

const cari = await basisData.ambilDaftarPartai({ ...opsiDasar, offset: 0, cari: "Pemain0007" });
uji("pencarian nama pemain menemukan satu partai", cari.total === 1 && cari.partai[0].whiteName === "Pemain0007");

const urutLangkah = await basisData.ambilDaftarPartai({
  ...opsiDasar,
  offset: 0,
  urut: "langkah",
  arah: "asc",
});
const naik = urutLangkah.partai.every(
  (p, i, arr) => i === 0 || (arr[i - 1].plyCount ?? 0) <= (p.plyCount ?? 0)
);
uji("pengurutan berdasar jumlah langkah (naik) benar", naik && urutLangkah.total === TOTAL);

/* ── statistik ───────────────────────────────────────────────────────── */

console.log("\nStatistik");
const st = await basisData.hitungStatistikBasisData();
uji("total partai pada statistik benar", st.totalPartai === TOTAL, `total=${st.totalPartai}`);
uji(
  "rincian hasil pada statistik benar",
  st.putihMenang === putihMenang && st.putihMenang + st.hitamMenang + st.seri === TOTAL
);
resetHitung();
await basisData.hitungStatistikBasisData();
uji(
  "statistik dihitung lewat kursor, bukan getAll partai",
  hitung.getAllPartai === 0,
  `getAll partai ${hitung.getAllPartai}×`
);

/* ── koleksi: username ber-huruf besar ───────────────────────────────── */

console.log("\nPemilihan koleksi");
await basisData.simpanBanyakPartai(
  [
    {
      pgn: pgnPanjang(9001),
      whiteName: "MagnusUji",
      blackName: "LawanUji",
      result: "white",
      timestamp: 1800000000000,
      timeClass: "rapid",
    },
  ],
  { platform: "chessCom", username: "MagnusUji" } // sengaja ada huruf besar
);

/*
 * Panel Database memilih koleksi lewat id "platform:username" yang selalu
 * huruf kecil, lalu memecahnya jadi platform + username. Dulu daftar partai
 * dicocokkan ke indeks [platform, username] yang peka huruf besar-kecil,
 * sehingga koleksi akun ber-huruf besar tampil KOSONG. Kini indeksnya
 * memakai koleksiId, jadi ejaan aslinya tidak lagi jadi masalah.
 */
resetHitung();
const koleksiBesar = await basisData.ambilDaftarPartai({
  koleksiId: "chessCom:magnusuji",
  platform: "chessCom",
  username: "magnusuji",
  limit: PER_HALAMAN,
  offset: 0,
  sertakanPgn: false,
});
uji(
  "koleksi akun ber-huruf besar tetap menampilkan partainya",
  koleksiBesar.total === 1 && koleksiBesar.partai[0]?.whiteName === "MagnusUji",
  `total=${koleksiBesar.total}`
);
uji(
  "memilih koleksi tetap memakai jalur cepat (tanpa getAll)",
  hitung.getAllPartai === 0,
  `getAll partai ${hitung.getAllPartai}×`
);

console.log(`\n${lulus} pemeriksaan lulus, ${gagal} gagal.`);
process.exit(gagal ? 1 : 0);
