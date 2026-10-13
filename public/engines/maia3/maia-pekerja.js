/**
 * Maia 3 Web Worker — menjalankan inferensi ONNX di luar utas utama.
 *
 * Berkas ini disajikan APA ADANYA dari `public/` (bukan di-bundle Vite), jadi
 * ia harus tetap menjadi skrip klasik: tanpa impor ESM, memakai `importScripts`
 * untuk memuat runtime ONNX. Alasannya CSP: `script-src 'self'` mengizinkan
 * `importScripts` dari origin sendiri, dan dengan begini berkas runtime
 * onnxruntime-web (14 MB) tidak ikut menggemukkan bundle JavaScript aplikasi —
 * ia diambil terpisah, di-cache browser, dan hanya dimuat bila pemain benar
 *-benar memilih Maia.
 *
 * Satu utas, sengaja: repo ini mengirim COOP tanpa COEP (lihat vercel.json),
 * sehingga `crossOriginIsolated` false dan SharedArrayBuffer tidak tersedia.
 * onnxruntime-web 1.30 otomatis turun ke satu utas dalam keadaan itu
 * (`env.wasm.numThreads = 1`) dan tetap berjalan — kira-kira 0,3 detik per
 * posisi, jauh di bawah jeda giliran 2–4 detik yang dipakai UI.
 *
 * Pesan MASUK:
 *   { jenis: "init", urlModel, versiModel, jalurOrt }
 *   { jenis: "unduh" }
 *   { jenis: "inferensi", id, token, eloSelf, eloOppo, jumlah }
 *   { jenis: "hapus" }
 * Pesan KELUAR:
 *   { jenis: "keadaan", status, progres?, galat? }
 *   { jenis: "inferensi", id, logitsLangkah, logitsNilai }
 *   { jenis: "galat", pesan, id? }
 *
 * Hak cipta model: Maia Chess (CSSLab, University of Toronto) — GPL-3.0.
 * Runtime: onnxruntime-web (Microsoft) — MIT.
 */
/* global ort, indexedDB */

const NAMA_DB = "MaiaChessClub";
const NAMA_SIMPAN = "model";
const KUNCI_MODEL = "maia3";

let sesi = null;
let jalurOrt = "./ort/";
let urlModel = null;
let versiModel = "3";

function kirim(pesan, pindah) {
  self.postMessage(pesan, pindah);
}

function keadaan(status, tambahan) {
  kirim(Object.assign({ jenis: "keadaan", status }, tambahan || {}));
}

/* ────────────────────────────── IndexedDB ────────────────────────────── */
/* Bobot 45 MB diunduh sekali lalu disimpan di peramban. Tanpa ini setiap
   kunjungan mengunduh ulang; dengan ini kunjungan berikutnya langsung siap
   (sesi ONNX dibuat dari buffer yang sudah ada di disk). */

function bukaDb() {
  return new Promise((selesai, gagal) => {
    const minta = indexedDB.open(NAMA_DB, 1);
    minta.onerror = () => gagal(minta.error);
    minta.onsuccess = () => selesai(minta.result);
    minta.onupgradeneeded = (peristiwa) => {
      const db = peristiwa.target.result;
      if (!db.objectStoreNames.contains(NAMA_SIMPAN)) db.createObjectStore(NAMA_SIMPAN, { keyPath: "id" });
    };
  });
}

async function ambilCache() {
  try {
    const db = await bukaDb();
    const data = await new Promise((selesai, gagal) => {
      const minta = db.transaction([NAMA_SIMPAN], "readonly").objectStore(NAMA_SIMPAN).get(KUNCI_MODEL);
      minta.onsuccess = () => selesai(minta.result || null);
      minta.onerror = () => gagal(minta.error);
    });
    if (!data) return null;
    // Versi/URL berubah (model diganti) → cache lama tidak boleh dipakai.
    if (data.url !== urlModel || data.versi !== versiModel) {
      await new Promise((selesai) => {
        const hapus = db.transaction([NAMA_SIMPAN], "readwrite").objectStore(NAMA_SIMPAN).delete(KUNCI_MODEL);
        hapus.onsuccess = hapus.onerror = () => selesai();
      });
      return null;
    }
    return await data.data.arrayBuffer();
  } catch {
    // IndexedDB bisa diblokir (mode penyamaran, kuota penuh). Bukan galat
    // fatal: model tetap bisa dipakai, hanya tidak tersimpan.
    return null;
  }
}

async function simpanCache(buffer) {
  try {
    const db = await bukaDb();
    await new Promise((selesai, gagal) => {
      const minta = db
        .transaction([NAMA_SIMPAN], "readwrite")
        .objectStore(NAMA_SIMPAN)
        .put({
          id: KUNCI_MODEL,
          url: urlModel,
          versi: versiModel,
          data: new Blob([buffer]),
          ukuran: buffer.byteLength,
          waktu: Date.now(),
        });
      minta.onsuccess = () => selesai();
      minta.onerror = () => gagal(minta.error);
    });
    return true;
  } catch {
    return false;
  }
}

/* ──────────────────────────────── Unduh ──────────────────────────────── */

async function unduhModel() {
  keadaan("mengunduh", { progres: 0 });
  const jawab = await fetch(urlModel, { credentials: "same-origin" });
  if (!jawab.ok) throw new Error(`HTTP ${jawab.status} saat mengunduh model`);

  const total = Number(jawab.headers.get("Content-Length")) || 0;
  const baca = jawab.body && typeof jawab.body.getReader === "function" ? jawab.body.getReader() : null;

  if (!baca) {
    return new Uint8Array(await jawab.arrayBuffer());
  }

  const keping = [];
  let diterima = 0;
  let lapor = 0;
  for (;;) {
    const { done, value } = await baca.read();
    if (done) break;
    keping.push(value);
    diterima += value.length;
    // Lapor tiap 5%: cukup halus untuk bilah kemajuan, tidak membanjiri
    // utas utama dengan postMessage (45 MB ≈ 700 keping di jaringan cepat).
    if (total > 0) {
      const persen = Math.floor((diterima / total) * 100);
      if (persen >= lapor + 5) {
        lapor = persen;
        keadaan("mengunduh", { progres: persen });
      }
    }
  }
  const gabung = new Uint8Array(diterima);
  let posisi = 0;
  for (const bagian of keping) {
    gabung.set(bagian, posisi);
    posisi += bagian.length;
  }
  return gabung;
}

/* ───────────────────────────── Inferensi ─────────────────────────────── */

function mulaiSesi(buffer) {
  return ort.InferenceSession.create(buffer, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
}

async function jalankan(id, token, eloSelf, eloOppo, jumlah) {
  if (!sesi) throw new Error("Model Maia belum dimuat");
  const masukan = {
    tokens: new ort.Tensor("float32", new Float32Array(token), [jumlah, 64, 12]),
    elo_self: new ort.Tensor("float32", new Float32Array(eloSelf), [jumlah]),
    elo_oppo: new ort.Tensor("float32", new Float32Array(eloOppo), [jumlah]),
  };
  const keluaran = await sesi.run(masukan);
  const logitsLangkah = new Float32Array(keluaran.logits_move.data);
  const logitsNilai = new Float32Array(keluaran.logits_value.data);
  kirim({ jenis: "inferensi", id, logitsLangkah, logitsNilai }, [logitsLangkah.buffer, logitsNilai.buffer]);
}

/* ────────────────────────────── Pengendali ───────────────────────────── */

self.onmessage = async (peristiwa) => {
  const pesan = peristiwa.data || {};
  try {
    if ("init" === pesan.jenis) {
      urlModel = pesan.urlModel;
      versiModel = pesan.versiModel || "3";
      jalurOrt = pesan.jalurOrt || jalurOrt;

      if (typeof ort === "undefined") {
        importScripts(`${jalurOrt}ort.wasm.min.js`);
      }
      // Satu utas (tanpa COEP tidak ada SharedArrayBuffer) dan jangan cerewet.
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = jalurOrt;
      ort.env.logLevel = "error";

      keadaan("menyiapkan");
      const cache = await ambilCache();
      if (cache) {
        sesi = await mulaiSesi(cache);
        keadaan("siap", { progres: 100, dariCache: true });
      } else {
        keadaan("perluUnduh");
      }
      return;
    }

    if ("unduh" === pesan.jenis) {
      const berkas = await unduhModel();
      // Simpan dulu, baru buat sesi: bila penyimpanan gagal (kuota), pemain
      // tetap mendapat lawan yang bisa diajak main.
      await simpanCache(berkas.buffer);
      sesi = await mulaiSesi(berkas.buffer);
      keadaan("siap", { progres: 100 });
      return;
    }

    if ("inferensi" === pesan.jenis) {
      await jalankan(pesan.id, pesan.token, pesan.eloSelf, pesan.eloOppo, pesan.jumlah ?? 1);
      return;
    }

    if ("hapus" === pesan.jenis) {
      try {
        const db = await bukaDb();
        await new Promise((selesai) => {
          const hapus = db.transaction([NAMA_SIMPAN], "readwrite").objectStore(NAMA_SIMPAN).delete(KUNCI_MODEL);
          hapus.onsuccess = hapus.onerror = () => selesai();
        });
      } catch {
        /* abaikan */
      }
      keadaan("dihapus");
      return;
    }
  } catch (galat) {
    kirim({ jenis: "galat", pesan: galat && galat.message ? galat.message : "galat worker Maia", id: pesan.id });
  }
};
