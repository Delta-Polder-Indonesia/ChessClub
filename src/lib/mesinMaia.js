/**
 * Klien Maia 3 di peramban — mengurus worker, unduhan 45 MB, dan cache.
 *
 * Pisah dari `maia3.js`: berkas itu murni matematika (bisa diuji Node),
 * berkas ini mengurus hal-hal yang hanya ada di peramban (Worker, IndexedDB,
 * fetch). Pemisahan ini juga menjaga bundle: onnxruntime-web TIDAK diimpor
 * di sini sama sekali — ia dimuat oleh worker lewat `importScripts`, jadi
 * 14 MB runtime-nya tidak pernah masuk ke bundle aplikasi.
 *
 * Satu instance dipakai bersama lewat `ambilMesinMaia()`: model hanya boleh
 * dimuat sekali per tab. Setelah tersimpan di IndexedDB, kunjungan berikutnya
 * langsung siap tanpa mengunduh ulang.
 */
import { RATING_BAKU, batasRating, contohLangkah, susunBatch, uraiBatch } from "./maia3.js";

/**
 * Dasar folder aset — sama polanya dengan `lib/engineCatur.js`: di Node
 * (skrip uji) `import.meta.env` tidak ada, jadi dijaga dengan `typeof`.
 */
function dasarAset() {
  return typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.BASE_URL : "/";
}

/** Folder runtime onnxruntime-web hasil salinan `scripts/salin-ort.mjs`. */
export const JALUR_ORT = `${dasarAset()}engines/ort/`;

/** Bobot model Maia 3, disajikan statis dari `public/`. */
export const URL_MODEL_MAIA = `${dasarAset()}engines/maia3/maia3_simplified.onnx`;

/** Skrip worker klasik (bukan modul) yang menjalankan inferensi. */
export const URL_PEKERJA_MAIA = `${dasarAset()}engines/maia3/maia-pekerja.js`;

/**
 * Penanda versi cache. Naikkan bila berkas model diganti supaya cache lama
 * di peramban pemain dibuang dan model baru diunduh ulang.
 */
export const VERSI_MODEL_MAIA = "maia3-simplified-1";

/** Status yang mungkin dilaporkan ke UI. */
export const STATUS_MAIA = {
  IDLE: "idle",
  MENYIAPKAN: "menyiapkan",
  PERLU_UNDUH: "perluUnduh",
  MENGUNDUH: "mengunduh",
  SIAP: "siap",
  GAGAL: "gagal",
};

export class MesinMaia {
  constructor({ urlModel = URL_MODEL_MAIA, urlPekerja = URL_PEKERJA_MAIA, jalurOrt = JALUR_ORT, versi = VERSI_MODEL_MAIA } = {}) {
    this.urlModel = urlModel;
    this.urlPekerja = urlPekerja;
    this.jalurOrt = jalurOrt;
    this.versi = versi;

    this.pekerja = null;
    this.status = STATUS_MAIA.IDLE;
    this.progres = 0;
    this.galat = null;
    this.dariCache = false;

    this.pendengar = new Set();
    this.antrean = []; // { id, selesai, gagal }
    this.penunggu = []; // { cocok, selesai, gagal }
    this.berikutId = 1;
    this.janjiSiap = null;
  }

  /** Ambil keadaan ringkas — dipakai hook React dan panel UI. */
  keadaan() {
    return { status: this.status, progres: this.progres, galat: this.galat, dariCache: this.dariCache };
  }

  /**
   * Daftarkan pemantau keadaan. Mengembalikan fungsi berhenti langganan.
   * Dipanggil setiap kali status/progres berubah (unduhan, siap, gagal).
   */
  langganan(fungsi) {
    this.pendengar.add(fungsi);
    fungsi(this.keadaan());
    return () => this.pendengar.delete(fungsi);
  }

  beriTahu() {
    for (const fungsi of this.pendengar) fungsi(this.keadaan());
  }

  aturKeadaan(status, tambahan = {}) {
    this.status = status;
    if (Number.isFinite(tambahan.progres)) this.progres = tambahan.progres;
    if (status === STATUS_MAIA.SIAP) this.progres = 100;
    if (tambahan.dariCache) this.dariCache = true;
    this.beriTahu();
    // Penunggu yang kondisinya sudah terpenuhi diselesaikan sekarang.
    const selesai = this.penunggu.filter((p) => p.cocok(status));
    this.penunggu = this.penunggu.filter((p) => !p.cocok(status));
    for (const p of selesai) p.selesai(status);
  }

  gagalkan(galat) {
    this.galat = galat instanceof Error ? galat.message : String(galat || "galat Maia");
    this.aturKeadaan(STATUS_MAIA.GAGAL);
    const menganggur = this.antrean;
    this.antrean = [];
    for (const p of menganggur) p.gagal(new Error(this.galat));
    const menunggu = this.penunggu;
    this.penunggu = [];
    for (const p of menunggu) p.gagal(new Error(this.galat));
  }

  buatPekerja() {
    if (this.pekerja) return this.pekerja;
    if (typeof Worker === "undefined") {
      throw new Error("Worker tidak tersedia di lingkungan ini");
    }
    const pekerja = new Worker(this.urlPekerja);
    pekerja.onmessage = (peristiwa) => this.terima(peristiwa.data || {});
    pekerja.onerror = (peristiwa) => {
      this.gagalkan(new Error(peristiwa?.message || "worker Maia berhenti"));
    };
    this.pekerja = pekerja;
    return pekerja;
  }

  terima(pesan) {
    if ("keadaan" === pesan.jenis) {
      this.aturKeadaan(pesan.status, { progres: pesan.progres, dariCache: pesan.dariCache });
      return;
    }
    if ("inferensi" === pesan.jenis) {
      const menunggu = this.antrean.find((p) => p.id === pesan.id);
      this.antrean = this.antrean.filter((p) => p.id !== pesan.id);
      if (menunggu) menunggu.selesai({ logitsLangkah: pesan.logitsLangkah, logitsNilai: pesan.logitsNilai });
      return;
    }
    if ("galat" === pesan.jenis) {
      const pesanGalat = new Error(pesan.pesan || "galat Maia");
      if (pesan.id !== undefined) {
        const menunggu = this.antrean.find((p) => p.id === pesan.id);
        this.antrean = this.antrean.filter((p) => p.id !== pesan.id);
        if (menunggu) menunggu.gagal(pesanGalat);
      } else {
        this.gagalkan(pesanGalat);
      }
    }
  }

  /** Tunggu sampai status memenuhi `cocok` (atau galat lebih dulu). */
  tungguStatus(cocok) {
    if (cocok(this.status)) return Promise.resolve(this.status);
    if (this.status === STATUS_MAIA.GAGAL) return Promise.reject(new Error(this.galat || "Maia gagal"));
    return new Promise((selesai, gagal) => {
      this.penunggu.push({ cocok, selesai, gagal });
    });
  }

  /**
   * Siapkan sampai model benar-benar bisa dipakai: mulai worker, pakai cache
   * bila ada, atau unduh 45 MB sambil melaporkan kemajuan lewat `langganan`.
   * Aman dipanggil berulang — janji yang sama dikembalikan.
   */
  siapkan() {
    if (this.status === STATUS_MAIA.SIAP) return Promise.resolve(this.status);
    if (this.janjiSiap) return this.janjiSiap;
    this.janjiSiap = (async () => {
      const pekerja = this.buatPekerja();
      this.aturKeadaan(STATUS_MAIA.MENYIAPKAN, { progres: 0 });
      pekerja.postMessage({
        jenis: "init",
        urlModel: this.urlModel,
        versiModel: this.versi,
        jalurOrt: this.jalurOrt,
      });
      const awal = await this.tungguStatus((s) => s === STATUS_MAIA.SIAP || s === STATUS_MAIA.PERLU_UNDUH);
      if (awal === STATUS_MAIA.SIAP) return this.status;
      this.pekerja.postMessage({ jenis: "unduh" });
      await this.tungguStatus((s) => s === STATUS_MAIA.SIAP);
      return this.status;
    })().catch((galat) => {
      // Jangan biarkan janji yang gagal lengket: pemain harus bisa mencoba
      // lagi dengan memilih level ulang.
      this.janjiSiap = null;
      this.gagalkan(galat);
      throw galat;
    });
    return this.janjiSiap;
  }

  /** Buang cache tersimpan (bobot 45 MB) di peramban pemain. */
  hapusCache() {
    if (!this.pekerja) return;
    this.pekerja.postMessage({ jenis: "hapus" });
    this.dariCache = false;
  }

  /**
   * Jalankan inferensi untuk sekumpulan posisi sekaligus.
   *
   * @param {string[]} daftarFen
   * @param {{rating?: number|number[], ratingLawan?: number|number[]}} [opsi]
   * @returns {Promise<Array<{kebijakan: object, menang: number, cp: number}>>}
   */
  async inferensi(daftarFen, { rating = RATING_BAKU, ratingLawan = null } = {}) {
    if (!Array.isArray(daftarFen) || !daftarFen.length) return [];
    await this.siapkan();
    const self = Array.isArray(rating) ? rating : Array(daftarFen.length).fill(rating);
    const oppo = Array.isArray(ratingLawan) ? ratingLawan : Array(daftarFen.length).fill(ratingLawan ?? rating);
    const berkas = susunBatch(daftarFen, self, oppo);

    // `tamat()` bisa berjalan di antara `siapkan()` di atas dan baris ini —
    // pemain berpindah mode tepat saat mesin sedang berpikir. Pekerja dibaca
    // sekali di sini supaya permintaan tidak pernah masuk antrean tanpa
    // pekerja yang bisa menjawabnya: janji terlantar seperti itu tidak ada
    // yang menunggu, dan gema galatnya baru muncul jauh di kemudian hari.
    const pekerja = this.pekerja;
    if (!pekerja) throw new Error("mesin Maia sudah dilepas");

    const id = this.berikutId++;
    const janji = new Promise((selesai, gagal) => {
      this.antrean.push({ id, selesai, gagal });
    });
    try {
      // ArrayBuffer dipindahkan (bukan disalin) supaya 45 MB bobot model tidak
      // ikut digandakan di memori setiap kali giliran mesin.
      pekerja.postMessage(
        {
          jenis: "inferensi",
          id,
          token: berkas.token.buffer,
          eloSelf: berkas.self.buffer,
          eloOppo: berkas.oppo.buffer,
          jumlah: berkas.jumlah,
        },
        [berkas.token.buffer, berkas.self.buffer, berkas.oppo.buffer]
      );
    } catch (galat) {
      // Kiriman gagal: cabut permintaannya supaya tidak ada janji yang
      // menggantung di antrean tanpa penjawab.
      this.antrean = this.antrean.filter((p) => p.id !== id);
      throw galat;
    }
    const keluaran = await janji;
    return uraiBatch(keluaran.logitsLangkah, keluaran.logitsNilai, berkas.posisi);
  }

  /**
   * Satu langkah Maia untuk satu posisi — bentuk yang dipakai mode
   * Manusia vs Mesin.
   *
   * @param {string} fen
   * @param {{rating?: number, ratingLawan?: number, ambilTeratas?: boolean,
   *   acak?: () => number}} [opsi]
   * @returns {Promise<{uci: string|null, kebijakan: object, menang: number,
   *   cp: number, rating: number}>}
   *   `uci` null hanya bila posisi sudah selesai (tidak ada langkah sah).
   */
  async cariLangkah(fen, opsi = {}) {
    const [hasil] = await this.inferensi([fen], opsi);
    if (!hasil) return { uci: null, kebijakan: {}, menang: 0.5, cp: 0, rating: batasRating(opsi.rating) };
    const uci = contohLangkah(hasil.kebijakan, { acak: opsi.acak, ambilTeratas: opsi.ambilTeratas });
    return { uci, ...hasil, rating: batasRating(opsi.rating ?? RATING_BAKU) };
  }

  /** Lepaskan worker. Model di IndexedDB tetap tersimpan. */
  tamat() {
    this.gagalkan(new Error("mesin Maia dihentikan"));
    if (this.pekerja) {
      this.pekerja.terminate();
      this.pekerja.onmessage = null;
      this.pekerja.onerror = null;
      this.pekerja = null;
    }
    this.status = STATUS_MAIA.IDLE;
    this.progres = 0;
    this.janjiSiap = null;
    this.dariCache = false;
    // Mesin yang sengaja dilepas bukan mesin yang gagal: tanpa dibersihkan,
    // pemakaian berikutnya mewarisi pesan galat lama di `keadaan()`.
    this.galat = null;
    this.beriTahu();
  }
}

let tunggal = null;

/**
 * Instance bersama. Worker + sesi ONNX memakan ratusan megabita memori, jadi
 * seluruh aplikasi berbagi satu mesin; memanggil `tamat()` akan memaksa
 * unduh/unggah ulang dari cache pada pemakaian berikutnya.
 */
export function ambilMesinMaia(opsi) {
  if (!tunggal) tunggal = new MesinMaia(opsi);
  return tunggal;
}
