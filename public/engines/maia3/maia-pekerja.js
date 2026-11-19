/**
 * Maia 3 Web Worker — menjalankan inferensi ONNX di luar utas utama.
 *
 * Hak cipta model: Maia Chess (CSSLab, University of Toronto) — GPL-3.0.
 * Runtime: onnxruntime-web (Microsoft) — MIT.
 *
 * Worker hanya menerima pesan berstruktur dari aplikasi. URL model dan
 * runtime dibatasi ke aset same-origin milik situs agar pesan palsu tidak
 * dapat memaksa pengunduhan atau eksekusi aset lintas-origin.
 */
/* global ort, indexedDB */

const NAMA_DB = "MaiaChessClub";
const NAMA_SIMPAN = "model";
const KUNCI_MODEL = "maia3";
// Aset ditentukan oleh lokasi worker, bukan oleh pengirim pesan init.
const urlModel = new URL("./maia3_simplified.onnx", self.location.href).href;
const jalurOrt = new URL("../ort/", self.location.href).href;
let sesi = null;
let versiModel = "3";

function kirim(pesan, pindah) {
  self.postMessage(pesan, pindah);
}

function keadaan(status, tambahan) {
  kirim(Object.assign({ jenis: "keadaan", status }, tambahan || {}));
}

function validasiInit(pesan) {
  if (new URL(pesan.urlModel, self.location.href).href !== urlModel ||
      new URL(pesan.jalurOrt || jalurOrt, self.location.href).href !== jalurOrt) {
    throw new Error("URL aset Maia tidak diizinkan");
  }
  versiModel = typeof pesan.versiModel === "string" && /^[a-zA-Z0-9_.-]{1,64}$/.test(pesan.versiModel)
    ? pesan.versiModel
    : "3";
}

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
    if (data.url !== urlModel || data.versi !== versiModel) {
      await new Promise((selesai) => {
        const hapus = db.transaction([NAMA_SIMPAN], "readwrite").objectStore(NAMA_SIMPAN).delete(KUNCI_MODEL);
        hapus.onsuccess = hapus.onerror = () => selesai();
      });
      return null;
    }
    return await data.data.arrayBuffer();
  } catch {
    return null;
  }
}

async function simpanCache(buffer) {
  try {
    const db = await bukaDb();
    await new Promise((selesai, gagal) => {
      const minta = db.transaction([NAMA_SIMPAN], "readwrite").objectStore(NAMA_SIMPAN).put({
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

async function unduhModel() {
  keadaan("mengunduh", { progres: 0 });
  const jawab = await fetch(urlModel, { credentials: "same-origin", redirect: "error" });
  if (!jawab.ok) throw new Error(`HTTP ${jawab.status} saat mengunduh model`);

  const balik = new URL(jawab.url || urlModel);
  if (balik.href !== urlModel) {
    throw new Error("Respons model lintas-origin tidak diterima");
  }

  const total = Number(jawab.headers.get("Content-Length")) || 0;
  const baca = jawab.body && typeof jawab.body.getReader === "function" ? jawab.body.getReader() : null;
  if (!baca) return new Uint8Array(await jawab.arrayBuffer());

  const keping = [];
  let diterima = 0;
  let lapor = 0;
  for (;;) {
    const { done, value } = await baca.read();
    if (done) break;
    keping.push(value);
    diterima += value.length;
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

function mulaiSesi(buffer) {
  return ort.InferenceSession.create(buffer, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
}

async function jalankan(id, token, eloSelf, eloOppo, jumlah) {
  if (!sesi) throw new Error("Model Maia belum dimuat");
  if (!Number.isInteger(id) || id < 1) throw new Error("ID inferensi tidak sah");
  if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 64) throw new Error("Jumlah inferensi tidak sah");
  if (!(token instanceof ArrayBuffer) || !(eloSelf instanceof ArrayBuffer) || !(eloOppo instanceof ArrayBuffer)) {
    throw new Error("Tensor inferensi tidak sah");
  }
  if (token.byteLength !== jumlah * 64 * 12 * 4 || eloSelf.byteLength !== jumlah * 4 || eloOppo.byteLength !== jumlah * 4) {
    throw new Error("Ukuran tensor inferensi tidak sah");
  }
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

self.onmessage = async (peristiwa) => {
  const pesan = peristiwa?.data;
  try {
    if (peristiwa?.origin !== self.location.origin) {
      throw new Error("Asal pesan worker tidak diizinkan");
    }
    if (!pesan || typeof pesan !== "object" || typeof pesan.jenis !== "string") {
      throw new Error("Pesan worker tidak sah");
    }

    if (pesan.jenis === "init") {
      validasiInit(pesan);
      if (typeof ort === "undefined") importScripts(`${jalurOrt}ort.wasm.min.js`);
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

    if (pesan.jenis === "unduh") {
      const berkas = await unduhModel();
      await simpanCache(berkas.buffer);
      sesi = await mulaiSesi(berkas.buffer);
      keadaan("siap", { progres: 100 });
      return;
    }

    if (pesan.jenis === "inferensi") {
      await jalankan(pesan.id, pesan.token, pesan.eloSelf, pesan.eloOppo, pesan.jumlah ?? 1);
      return;
    }

    if (pesan.jenis === "hapus") {
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

    throw new Error("Jenis pesan worker tidak dikenal");
  } catch (galat) {
    kirim({ jenis: "galat", pesan: galat?.message ? galat.message : "galat worker Maia", id: pesan?.id });
  }
};
