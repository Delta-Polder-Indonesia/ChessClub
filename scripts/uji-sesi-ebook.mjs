/**
 * Uji sesi pemohon e-book (`src/lib/sesiUnduhEbook.js`).
 *
 * Mengapa ada: tiket unduhan e-book berlaku 15 menit dan — sebelum modul ini —
 * hanya hidup di state komponen, sehingga setiap muat ulang halaman meminta
 * nama, akun, dan kode akses lagi. Uji ini mengunci empat janji modul:
 *  1. Tiket yang masih berlaku dipakai ulang; yang kedaluwarsa DIBUANG.
 *  2. Batas 60 detik sebelum kedaluwarsa mencegah tiket "hampir mati" dipakai
 *     (percuma — server akan menolaknya di tengah pemuatan PDF).
 *  3. Tiket kedaluwarsa saat pengambilan langsung dibuang dari penyimpanan.
 *  4. Tiket rusak / format asing tidak pernah dikembalikan sebagai sah.
 * Bonus: nama & akun pemohon disimpan/dibaca/dihapus dengan benar.
 *
 * Jalankan: node scripts/uji-sesi-ebook.mjs
 */
import assert from "node:assert/strict";

let lulus = 0;
let gagal = 0;

function uji(nama, jalan) {
  try {
    jalan();
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (galat) {
    gagal += 1;
    console.error(`  ✗ ${nama}\n    ${galat?.message ?? galat}`);
    process.exitCode = 1;
  }
}

const {
  ambilPemohonEbook,
  ambilTiketSesi,
  bersihkanSesiEbook,
  hapusPemohonEbook,
  hapusTiketSesi,
  infoTiket,
  simpanPemohonEbook,
  simpanTiketSesi,
  tiketBelumKedaluwarsa,
  AWALAN_TIKET,
} = await import("../src/lib/sesiUnduhEbook.js");

/** sessionStorage tiruan berbasis Map (dukung Object.keys lewat Proxy). */
function storageTiruan(awal = {}) {
  const isi = new Map(Object.entries(awal));
  const s = {
    getItem: (k) => (isi.has(k) ? isi.get(k) : null),
    setItem: (k, v) => isi.set(k, String(v)),
    removeItem: (k) => isi.delete(k),
    clear: () => isi.clear(),
    key: (i) => [...isi.keys()][i] ?? null,
    get length() {
      return isi.size;
    },
  };
  // Object.keys(store) harus berisi kunci yang tersimpan (seperti Storage asli).
  return new Proxy(s, {
    ownKeys: () => [...isi.keys()],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
    get: (target, prop) => (prop in target ? target[prop] : undefined),
  });
}

/** Bangun token tiruan berbentuk sama dengan server (`kci-ebook-v1.<b64>.<ttd>`). */
function tiketTiruan({ kedaluwarsaDetik, acak = "acak-1" }) {
  const muatan = { v: 1, f: "buku.pdf", x: kedaluwarsaDetik, j: acak };
  const isi = Buffer.from(JSON.stringify(muatan)).toString("base64url");
  return `kci-ebook-v1.${isi}.tanda-tangan-tiruan`;
}

const SEKARANG = 1_800_000_000_000; // ms — nilai tetap agar uji tidak bergantung waktu nyata
const SEKARANG_DETIK = Math.floor(SEKARANG / 1000);

/** Tiket dianggap layak bila sisa waktunya > 60 detik (lihat modul). */
function sisaTiketLayak(tiket) {
  const info = infoTiket(tiket);
  return Boolean(info) && info.kedaluwarsa - SEKARANG_DETIK >= 60;
}

/* ------------------------------------------------------------------ kasus */

console.log("\nSesi e-book · dekode tiket di browser");

uji("infoTiket tetap membaca tiket TANPA Buffer (lingkungan browser)", () => {
  // Token dibuat lebih dulu (pembuatnya boleh memakai Buffer), lalu Buffer
  // "dihilangkan" seperti di browser: hanya atob + TextDecoder yang tersedia.
  // Versi lama memakai Buffer.from(...) di dalam infoTiket, sehingga di
  // browser SETIAP tiket dianggap tak dikenali — tiket sesi tidak pernah
  // tersimpan dan pengguna selalu diminta memasukkan ulang kode akses.
  const token = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 600 });
  const simpanBuffer = globalThis.Buffer;
  try {
     
    globalThis.Buffer = undefined;
    const info = infoTiket(token);
    assert.notEqual(info, null, "infoTiket mengembalikan null di lingkungan tanpa Buffer");
    assert.equal(info?.kedaluwarsa, SEKARANG_DETIK + 600, "kedaluwarsa salah baca");
    assert.equal(sisaTiketLayak(token), true, "tiket layak malah ditolak di lingkungan tanpa Buffer");
  } finally {
    globalThis.Buffer = simpanBuffer;
  }
});

uji("tiket tersimpan & terbaca ulang di lingkungan tanpa Buffer", () => {
  const token = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 600 });
  const simpanBuffer = globalThis.Buffer;
  const store = storageTiruan();
  try {
     
    globalThis.Buffer = undefined;
    assert.equal(
      simpanTiketSesi({ file: "buku.pdf", tiket: token, store }),
      true,
      "simpanTiketSesi menolak tiket yang sah (Buffer hilang)"
    );
    assert.equal(
      ambilTiketSesi({ file: "buku.pdf", store, sekarangMs: SEKARANG }),
      token,
      "tiket sesi tidak terbaca kembali"
    );
  } finally {
    globalThis.Buffer = simpanBuffer;
  }
});

console.log("\nSesi e-book · tiket per berkas");

uji("tiket yang masih berlaku dikembalikan apa adanya", () => {
  const store = storageTiruan();
  const tiket = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 600 });
  assert.equal(simpanTiketSesi({ file: "a.pdf", tiket, store, sekarangMs: SEKARANG }), true);
  assert.equal(ambilTiketSesi({ file: "a.pdf", store, sekarangMs: SEKARANG }), tiket);
});

uji("tiket untuk berkas LAIN tidak dipakai (terikat nama berkas)", () => {
  const store = storageTiruan();
  const tiket = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 600 });
  simpanTiketSesi({ file: "a.pdf", tiket, store, sekarangMs: SEKARANG });
  assert.equal(ambilTiketSesi({ file: "b.pdf", store, sekarangMs: SEKARANG }), null);
});

uji("tiket kedaluwarsa tidak dikembalikan dan langsung dibuang", () => {
  const store = storageTiruan();
  const tiket = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK - 5 });
  // Disimpan dengan waktu lama supaya pemeriksaan kelayakan saat menyimpan tidak menolaknya.
  store.setItem(AWALAN_TIKET + "a.pdf", JSON.stringify({ tiket, file: "a.pdf" }));
  assert.equal(ambilTiketSesi({ file: "a.pdf", store, sekarangMs: SEKARANG }), null);
  assert.equal(store.getItem(AWALAN_TIKET + "a.pdf"), null, "entri harus dihapus dari penyimpanan");
});

uji("tiket yang tinggal <60 detik tidak dipakai (server akan menolaknya di tengah render)", () => {
  const store = storageTiruan();
  const tiket = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 30 });
  assert.equal(simpanTiketSesi({ file: "a.pdf", tiket, store, sekarangMs: SEKARANG }), false);
  assert.equal(ambilTiketSesi({ file: "a.pdf", store, sekarangMs: SEKARANG }), null);
});

uji("tiket rusak / format asing tidak pernah dianggap sah", () => {
  const store = storageTiruan();
  for (const rusak of ["", "bukan-tiket", "kci-ebook-v1.!!!.xxx", "kci-ebook-v2.a.b", null]) {
    assert.equal(ambilTiketSesi({ file: "a.pdf", store, sekarangMs: SEKARANG }), null, `lolos: ${rusak}`);
  }
});

uji("penyimpanan rusak (JSON bukan objek) tidak melempar", () => {
  const store = storageTiruan({ [AWALAN_TIKET + "a.pdf"]: "bukan-json" });
  assert.equal(ambilTiketSesi({ file: "a.pdf", store, sekarangMs: SEKARANG }), null);
  assert.equal(bersihkanSesiEbook({ store, sekarangMs: SEKARANG }), 1, "entri rusak ikut dibuang");
});

uji("bersihkanSesiEbook membuang hanya tiket kedaluwarsa/rusak", () => {
  const store = storageTiruan();
  const hidup = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 600, acak: "hidup" });
  const mati = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK - 120, acak: "mati" });
  store.setItem(AWALAN_TIKET + "hidup.pdf", JSON.stringify({ tiket: hidup, file: "hidup.pdf" }));
  store.setItem(AWALAN_TIKET + "mati.pdf", JSON.stringify({ tiket: mati, file: "mati.pdf" }));

  assert.equal(bersihkanSesiEbook({ store, sekarangMs: SEKARANG }), 1);
  assert.equal(ambilTiketSesi({ file: "hidup.pdf", store, sekarangMs: SEKARANG }), hidup);
  assert.equal(store.getItem(AWALAN_TIKET + "mati.pdf"), null);
});

uji("hapusTiketSesi menghapus satu berkas tanpa menyentuh berkas lain", () => {
  const store = storageTiruan();
  const t1 = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 600, acak: "1" });
  const t2 = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 600, acak: "2" });
  simpanTiketSesi({ file: "a.pdf", tiket: t1, store, sekarangMs: SEKARANG });
  simpanTiketSesi({ file: "b.pdf", tiket: t2, store, sekarangMs: SEKARANG });
  hapusTiketSesi({ file: "a.pdf", store });
  assert.equal(ambilTiketSesi({ file: "a.pdf", store, sekarangMs: SEKARANG }), null);
  assert.equal(ambilTiketSesi({ file: "b.pdf", store, sekarangMs: SEKARANG }), t2);
});

uji("tiketBelumKedaluwarsa: layak >60 detik, tidak layak di bawahnya / rusak", () => {
  const jauh = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 600 });
  const dekat = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 30 });
  const mati = tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK - 1 });
  assert.equal(tiketBelumKedaluwarsa(jauh, { sekarangMs: SEKARANG }), true);
  assert.equal(tiketBelumKedaluwarsa(dekat, { sekarangMs: SEKARANG }), false);
  assert.equal(tiketBelumKedaluwarsa(mati, { sekarangMs: SEKARANG }), false);
  assert.equal(tiketBelumKedaluwarsa("sampah", { sekarangMs: SEKARANG }), false);
  assert.equal(tiketBelumKedaluwarsa(null, { sekarangMs: SEKARANG }), false);
});

uji("infoTiket membaca usia & id acak dari token", () => {
  const info = infoTiket(tiketTiruan({ kedaluwarsaDetik: SEKARANG_DETIK + 900, acak: "xyz" }));
  assert.equal(info.kedaluwarsa, SEKARANG_DETIK + 900);
  assert.equal(info.acak, "xyz");
  assert.equal(infoTiket("sampah"), null);
});

console.log("\nSesi e-book · identitas pemohon");

uji("nama & akun disimpan lalu dibaca kembali", () => {
  const store = storageTiruan();
  simpanPemohonEbook({ nama: "  Budi Santoso ", akun: " budichess99 ", store });
  assert.deepEqual(ambilPemohonEbook({ store }), { nama: "Budi Santoso", akun: "budichess99" });
});

uji("isian kosong tidak menimpa data yang sudah ada", () => {
  const store = storageTiruan();
  simpanPemohonEbook({ nama: "Budi", akun: "budi99", store });
  simpanPemohonEbook({ nama: "   ", akun: "budi99", store });
  assert.deepEqual(ambilPemohonEbook({ store }), { nama: "Budi", akun: "budi99" });
});

uji("hapusPemohonEbook membersihkan jejak", () => {
  const store = storageTiruan();
  simpanPemohonEbook({ nama: "Budi", akun: "budi99", store });
  hapusPemohonEbook({ store });
  assert.equal(ambilPemohonEbook({ store }), null);
});

uji("tanpa sessionStorage (mode privat) semua fungsi tetap aman", () => {
  const asli = globalThis.sessionStorage;
  delete globalThis.sessionStorage;
  try {
    assert.equal(ambilTiketSesi({ file: "a.pdf" }), null);
    assert.equal(simpanTiketSesi({ file: "a.pdf", tiket: "x" }), false);
    assert.equal(ambilPemohonEbook(), null);
    simpanPemohonEbook({ nama: "A", akun: "b" }); // tidak boleh melempar
    assert.equal(bersihkanSesiEbook(), 0);
  } finally {
    if (asli !== undefined) globalThis.sessionStorage = asli;
  }
});

/* ------------------------------------------------------------------ hasil */

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
