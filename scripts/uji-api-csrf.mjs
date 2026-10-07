/**
 * Uji pemulihan token CSRF pada API non-pengurus (tanpa jaringan).
 *
 * Mengapa ada: token CSRF server hidup di MEMORI (24 jam) dan ikut hilang saat
 * server di-restart atau berpindah instance, sedangkan salinan di
 * sessionStorage tetap terpakai. Tanpa pemulihan, kiriman skor Rush dan
 * pendaftaran turnamen gagal terus ("Gagal menyimpan skor…") sampai tab
 * ditutup, tanpa sebab yang terlihat pengguna.
 *
 * Yang dikunci di sini:
 *  1. `kirimSkorRush` mengulang SEKALI setelah penolakan CSRF: buang token
 *     lama → ambil token baru dari `/api/csrf-token` → kirim ulang.
 *  2. Penolakan 403 yang BUKAN CSRF (mis. bukan anggota klub) tidak diulang —
 *     pesan server diteruskan apa adanya.
 *  3. Pengulangan tidak pernah lebih dari sekali (dua 403 CSRF berturut-turut
 *     tetap berhenti, bukan berputar).
 *  4. `ajukanPesertaTurnamen` memakai pemulihan yang sama.
 *
 * Jalankan: node scripts/uji-api-csrf.mjs
 */
import assert from "node:assert/strict";

let lulus = 0;
let gagal = 0;

async function uji(nama, jalan) {
  try {
    await jalan();
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (galat) {
    gagal += 1;
    console.error(`  ✗ ${nama}\n    ${galat?.message ?? galat}`);
    process.exitCode = 1;
  }
}

/* ---------------------------------------------- tiruan peramban & jaringan */

/** sessionStorage tiruan (Map) — modul API membacanya lewat try/catch. */
function pasangStorage(awal = {}) {
  const isi = new Map(Object.entries(awal));
  globalThis.sessionStorage = {
    getItem: (k) => (isi.has(k) ? isi.get(k) : null),
    setItem: (k, v) => isi.set(k, String(v)),
    removeItem: (k) => isi.delete(k),
    clear: () => isi.clear(),
    get panjang() {
      return isi.size;
    },
  };
  return isi;
}

/** Respons tiruan: body JSON dibaca berulang (klon independen seperti fetch asli). */
function respons(status, body) {
  const buat = () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone: () => buat(),
  });
  return buat();
}

const KUNCI_CSRF = "kci-csrf-token";

/** Catat setiap permintaan agar urutannya bisa diperiksa. */
function pasangFetch(penangan) {
  const jejak = [];
  globalThis.fetch = async (url, opsi = {}) => {
    const jalur = String(url);
    const catatan = {
      jalur,
      metode: opsi.method || "GET",
      token: opsi.headers?.["X-CSRF-Token"] ?? null,
      bodi: opsi.body ? JSON.parse(opsi.body) : null,
    };
    jejak.push(catatan);
    return penangan(catatan, jejak);
  };
  return jejak;
}

pasangStorage();
globalThis.window = globalThis;

const { kirimSkorRush } = await import("../src/lib/api/rekorRush.js");
const { ajukanPesertaTurnamen } = await import("../src/lib/api/turnamen.js");

/* ------------------------------------------------------------------ kasus */

console.log("\nPemulihan CSRF · kirim skor Rush");

await uji("penolakan CSRF → token baru diambil → kiriman diulang dan sukses", async () => {
  const isi = pasangStorage({ [KUNCI_CSRF]: "token-lama" });
  const jejak = pasangFetch(({ jalur, token }) => {
    if (jalur.includes("/api/csrf-token")) return respons(200, { token: "token-baru" });
    if (token === "token-baru") return respons(201, { hasil: "baru", peringkat: [] });
    return respons(403, { kode: "token-csrf", pesan: "Token CSRF tidak sah." });
  });

  const hasil = await kirimSkorRush({
    username: "anggota1",
    skor: 42,
    durasiMenit: 3,
    tiketVerifikasi: "tiket-abc",
  });

  assert.equal(hasil.hasil, "baru");
  assert.equal(jejak.length, 3, `harus 3 permintaan (POST, token, POST) — nyatanya ${jejak.length}`);
  assert.equal(jejak[0].token, "token-lama", "kiriman pertama memakai token lama");
  assert.equal(jejak[1].jalur.includes("/api/csrf-token"), true, "token baru diambil dari /api/csrf-token");
  assert.equal(jejak[2].token, "token-baru", "kiriman ulang memakai token baru");
  assert.equal(jejak[2].bodi.skor, 42, "bodi kiriman ulang tetap utuh");
  assert.equal(isi.get(KUNCI_CSRF), "token-baru", "token baru tersimpan untuk pemanggilan berikutnya");
});

await uji("403 bukan CSRF (bukan anggota) tidak diulang, pesan server diteruskan", async () => {
  const isi = pasangStorage({ [KUNCI_CSRF]: "token-lama" });
  const jejak = pasangFetch(() =>
    respons(403, { pesan: "Hanya anggota klub terdaftar yang bisa mencatat skor Rush." })
  );

  await assert.rejects(
    () => kirimSkorRush({ username: "bukan-anggota", skor: 10, durasiMenit: 5, tiketVerifikasi: "t" }),
    (galat) => {
      assert.equal(galat.status, 403);
      assert.match(galat.message, /Hanya anggota klub/);
      return true;
    }
  );
  assert.equal(jejak.length, 1, `tidak boleh ada pengulangan — nyatanya ${jejak.length} permintaan`);
  assert.equal(isi.get(KUNCI_CSRF), "token-lama", "token lama dibiarkan saat galatnya bukan CSRF");
});

await uji("dua penolakan CSRF berturut-turut berhenti (tidak berputar)", async () => {
  pasangStorage({ [KUNCI_CSRF]: "token-lama" });
  const jejak = pasangFetch(({ jalur }) =>
    jalur.includes("/api/csrf-token")
      ? respons(200, { token: "token-baru" })
      : respons(403, { kode: "token-csrf", pesan: "Token CSRF tidak sah." })
  );

  await assert.rejects(() =>
    kirimSkorRush({ username: "anggota1", skor: 5, durasiMenit: 3, tiketVerifikasi: "t" })
  );
  const kiriman = jejak.filter((j) => !j.jalur.includes("/api/csrf-token"));
  assert.equal(kiriman.length, 2, `POST maksimum dua kali — nyatanya ${kiriman.length}`);
});

await uji("token baru diambil ulang bila CSRF masih ditolak setelah satu perbaikan", async () => {
  // Setelah server benar-benar sehat: sekali kiriman ditolak (token basi),
  // pemulihan mengambil token baru, kiriman berikutnya sukses.
  pasangStorage({ [KUNCI_CSRF]: "basi" });
  let ditolak = 0;
  const jejak = pasangFetch(({ jalur, token }) => {
    if (jalur.includes("/api/csrf-token")) return respons(200, { token: `segar-${jejak.length}` });
    if (token === "basi") {
      ditolak += 1;
      return respons(403, { kode: "token-csrf", pesan: "Token CSRF tidak sah." });
    }
    return respons(200, { hasil: "diperbarui" });
  });

  const hasil = await kirimSkorRush({
    username: "anggota1",
    skor: 7,
    durasiMenit: 5,
    tiketVerifikasi: "t",
  });
  assert.equal(ditolak, 1, "hanya kiriman pertama yang ditolak");
  assert.equal(hasil.hasil, "diperbarui");
});

console.log("\nPemulihan CSRF · pendaftaran turnamen");

await uji("ajukanPesertaTurnamen: penolakan CSRF → token baru → sukses", async () => {
  const isi = pasangStorage({ [KUNCI_CSRF]: "token-lama" });
  const jejak = pasangFetch(({ jalur, token }) => {
    if (jalur.includes("/api/csrf-token")) return respons(200, { token: "token-baru" });
    if (token === "token-baru") return respons(201, { ok: true });
    return respons(403, { pesan: "Token CSRF tidak sah." });
  });

  const hasil = await ajukanPesertaTurnamen("turnamen-1", "anggota1");
  assert.equal(hasil.ok, true);
  assert.equal(jejak.filter((j) => j.jalur.includes("/daftar")).length, 2);
  assert.equal(jejak.at(-1).token, "token-baru");
  assert.equal(isi.get(KUNCI_CSRF), "token-baru");
});

await uji("ajukanPesertaTurnamen: penolakan non-CSRF tidak diulang", async () => {
  pasangStorage({ [KUNCI_CSRF]: "token-lama" });
  const jejak = pasangFetch(() => respons(403, { pesan: "Anda belum terdaftar sebagai anggota." }));
  await assert.rejects(() => ajukanPesertaTurnamen("turnamen-2", "anggota1"));
  assert.equal(jejak.length, 1, `tidak boleh diulang — nyatanya ${jejak.length}`);
});

/* ------------------------------------------------------------------ hasil */

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
