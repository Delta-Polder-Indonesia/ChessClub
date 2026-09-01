/**
 * Pembungkus Stockfish (WebAssembly) untuk analisis catur di peramban.
 *
 * Engine diambil dari folder publik `public/engines/stockfish-18-lite-single`
 * (build "single" = satu utas, sehingga tidak membutuhkan header
 * COOP/COEP dan aman disajikan lewat GitHub Pages). Loader bawaan engine
 * otomatis mencari file `.wasm` di folder yang sama dengan skrip worker,
 * jadi cukup satu URL:
 *   `${BASE_URL}engines/stockfish-18-lite-single/stockfish-18-lite-single.js`
 *
 * Komunikasi memakai protokol UCI lewat `postMessage` string. Perintah yang
 * dikirim sebelum engine siap otomatis ditampung oleh loader engine sendiri,
 * lalu dijalankan berurutan begitu "uciok"/"readyok" terbit.
 */

/**
 * Dasar folder aset. Vite mengganti ekspresi `import.meta.env` saat build;
 * di Node (skrip uji `scripts/uji-analisa.mjs`) nilainya tidak ada, sehingga
 * dijaga dengan `typeof` agar modul ini tetap bisa diimpor tanpa peramban.
 */
function dasarAset() {
  return typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.BASE_URL : "/";
}

const URL_ENGINE = `${dasarAset()}engines/stockfish-18-lite-single/stockfish-18-lite-single.js`;

/**
 * Engine lokal yang tersedia di `public/engines/` — dipakai halaman Analisa
 * untuk memilih kekuatan analisis (semuanya build "single" = satu utas,
 * jadi tidak butuh header COOP/COEP dan aman lewat GitHub Pages).
 */
export const DAFTAR_ENGINE = [
  {
    id: "stockfish-18-lite",
    label: "Stockfish 18 Lite",
    url: `${dasarAset()}engines/stockfish-18-lite-single/stockfish-18-lite-single.js`,
    saran: true,
  },
  {
    id: "stockfish-17-lite",
    label: "Stockfish 17 Lite",
    url: `${dasarAset()}engines/stockfish-17-lite-single/stockfish-17-lite-single.js`,
  },
  {
    id: "stockfish-18",
    label: "Stockfish 18 (NNUE penuh)",
    url: `${dasarAset()}engines/stockfish-18-single/stockfish-18-single.js`,
  },
  {
    id: "stockfish-17",
    label: "Stockfish 17 (NNUE penuh)",
    url: `${dasarAset()}engines/stockfish-17-single/stockfish-17-single.js`,
  },
];

export const ENGINE_BAKU = DAFTAR_ENGINE.find((e) => e.saran)?.id ?? DAFTAR_ENGINE[0].id;

/** Cari konfigurasi engine berdasarkan id (fallback ke bawaan). */
export function cariEngine(id) {
  return DAFTAR_ENGINE.find((e) => e.id === id) ?? DAFTAR_ENGINE.find((e) => e.id === ENGINE_BAKU);
}

/** Ambil bilangan dari potongan baris UCI, mis. "depth 17" → 17. */
function angkaUci(baris, kunci) {
  const cocok = baris.match(new RegExp(`(?:^| )${kunci} (-?\\d+)`));
  return cocok ? Number(cocok[1]) : null;
}

export class EngineCatur {
  /**
   * @param {{url?: string, hash?: number, threads?: number}} [opsi]
   *   `url`  — URL skrip worker engine (default: Stockfish 18 Lite lokal),
   *   `hash` — ukuran tabel hash dalam MB (naikkan untuk analisis partai),
   *   `threads` — jumlah utas; build lokal di repo ini satu utas.
   */
  constructor({ url = URL_ENGINE, hash = 16, threads = 1 } = {}) {
    this.url = url;
    this.hash = hash;
    this.threads = threads;
    this.worker = null;
    this.siap = false;
    this.janjiSiap = null;
    this.penyelesaiSiap = null;
    this.padaInfo = null; // callback info pencarian yang sedang berjalan
    this.padaSelesai = null; // callback bestmove pencarian yang sedang berjalan
    this.sedangCari = false;
    this.terakhir = null; // permintaan terbaru yang menunggu pencarian lama selesai
    this.infoTerakhir = null; // baris "info" berskor terakhir dari pencarian aktif
  }

  /**
   * Muat worker + tunggu hingga engine siap ("uciok" lalu "readyok").
   * Aman dipanggil berulang: janji yang sama dikembalikan. Bila gagal
   * (mis. jaringan putus), keadaan direset sehingga percobaan ulang bisa
   * memuat ulang dari awal.
   */
  mulai() {
    if (this.janjiSiap) return this.janjiSiap;
    const janji = new Promise((selesai, gagal) => {
      let worker;
      try {
        worker = new Worker(this.url);
      } catch (galat) {
        gagal(galat);
        return;
      }
      this.worker = worker;
      this.penyelesaiSiap = { selesai, gagal };
      worker.onmessage = (e) => this.terima(String(e.data));
      worker.onerror = (galat) => {
        // Worker mati: bukan hanya pemuatan yang gagal — pencarian yang
        // sedang menunggu juga tidak akan pernah menerima "bestmove".
        // Keduanya harus dibereskan, kalau tidak halaman menggantung di
        // layar "menganalisa…" selamanya.
        const pesan = new Error(galat?.message || "worker engine gagal");
        const penyelesai = this.penyelesaiSiap;
        this.penyelesaiSiap = null;
        this.gagalkanPencarian(pesan);
        this.tamat();
        if (penyelesai) penyelesai.gagal(pesan);
      };
      // Perintah awal — engine menampungnya sendiri sampai siap.
      this.kirim("uci");
      this.kirim(`setoption name Hash value ${this.hash}`);
      this.kirim(`setoption name Threads value ${this.threads}`);
      this.kirim("setoption name Ponder value false");
      this.kirim("isready");
    });
    // Kegagalan tidak boleh "lengket": tanpa ini, `janjiSiap` yang sudah
    // ditolak akan dikembalikan selamanya sehingga tombol "Coba lagi" di
    // panel pengaturan tidak pernah bisa memuat ulang engine.
    const dijaga = janji.catch((galat) => {
      if (this.janjiSiap === dijaga) this.janjiSiap = null;
      throw galat;
    });
    this.janjiSiap = dijaga;
    return dijaga;
  }

  /**
   * Batalkan pencarian yang menunggu karena engine mati/di-terminate.
   * Tanpa ini janji `cari()` tidak pernah selesai dan pemanggil (analisis
   * partai) berhenti di tengah jalan tanpa pesan apa pun.
   */
  gagalkanPencarian(galat) {
    const selesai = this.padaSelesai;
    const tertunda = this.terakhir;
    this.padaInfo = null;
    this.padaSelesai = null;
    this.terakhir = null;
    this.sedangCari = false;
    if (selesai) selesai("", null, galat ?? new Error("engine berhenti"));
    if (tertunda?.padaSelesai) tertunda.padaSelesai("", null, galat ?? new Error("engine berhenti"));
  }

  kirim(perintah) {
    if (this.worker) this.worker.postMessage(perintah);
  }

  terima(baris) {
    if (baris === "readyok") {
      if (!this.siap) {
        this.siap = true;
        if (this.penyelesaiSiap) {
          this.penyelesaiSiap.selesai();
          this.penyelesaiSiap = null;
        }
      }
      return;
    }

    if (baris.startsWith("info ")) {
      const adaBatas = baris.includes(" lowerbound ") || baris.includes(" upperbound ");
      const cp = angkaUci(baris, "cp");
      const mate = angkaUci(baris, "mate");
      if (cp === null && mate === null) return;
      const pv = (baris.split(" pv ")[1] || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 14);
      const info = { kedalaman: angkaUci(baris, "depth") ?? 0, cp, mate, pv, adaBatas };
      // Skor terakhir dipakai fitur Analisa (lihat `cari`). Baris dengan batas
      // lower/upperbound hanya dipakai bila belum ada baris PV yang bersih.
      if (!adaBatas || !this.infoTerakhir) this.infoTerakhir = info;
      // Hanya baris berguna untuk panah: punya langkah pv dan bukan batas.
      if (this.padaInfo && !adaBatas && pv.length) this.padaInfo(info);
      return;
    }

    if (baris.startsWith("bestmove")) {
      const uci = (baris.split(/\s+/)[1] || "").trim();
      this.sedangCari = false;
      const selesai = this.padaSelesai;
      const info = this.infoTerakhir;
      this.padaInfo = null;
      this.padaSelesai = null;
      if (selesai) selesai(uci, info);
      // Bila ada permintaan yang lebih baru menunggu, jalankan sekarang.
      if (this.terakhir) {
        const baru = this.terakhir;
        this.terakhir = null;
        this.jalankan(baru);
      }
    }
  }

  /**
   * Minta analisis satu posisi FEN. Bila pencarian lain sedang berjalan,
   * pencarian lama dihentikan dan permintaan ini dijalankan tepat setelah
   * engine menerbitkan "bestmove" (posisi tidak boleh ditukar di tengah
   * pencarian). Permintaan yang datang berikutnya selalu menggantikan yang
   * sebelumnya sehingga hanya analisis terbaru yang ditampilkan.
   */
  analisis(fen, { movetime = 800, kedalaman = null, padaInfo, padaSelesai }) {
    const permintaan = { fen, movetime, kedalaman, padaInfo, padaSelesai };
    if (this.sedangCari) {
      // Permintaan lama yang belum sempat jalan digantikan — pemanggilnya
      // harus diberi tahu, kalau tidak janji `cari()` miliknya menggantung
      // selamanya (ini yang membuat analisis berhenti diam-diam saat
      // pengguna mengetuk beberapa langkah dengan cepat).
      const digantikan = this.terakhir;
      this.terakhir = permintaan;
      if (digantikan?.padaSelesai) {
        digantikan.padaSelesai("", null, new Error("permintaan digantikan"));
      }
      this.kirim("stop");
    } else {
      this.jalankan(permintaan);
    }
  }

  /**
   * Satu pencarian, satu janji (promise) — bentuk yang dipakai fitur Analisa
   * saat menelusuri seluruh partai langkah demi langkah. Beresolusi begitu
   * engine menerbitkan "bestmove"; hasilnya ikut membawa baris "info"
   * terakhir sehingga pemanggil tidak perlu memantau pesan worker sendiri.
   *
   * @returns {Promise<{uci: string, info: object|null}>}
   */
  cari({ fen, kedalaman = 12, movetime = null }) {
    return new Promise((selesai, gagal) => {
      this.analisis(fen, {
        kedalaman,
        movetime,
        padaSelesai: (uci, info, galat) => {
          if (galat) gagal(galat);
          else selesai({ uci, info: info ?? null });
        },
      });
    });
  }

  jalankan({ fen, movetime, kedalaman, padaInfo, padaSelesai }) {
    this.padaInfo = padaInfo;
    this.padaSelesai = padaSelesai;
    this.sedangCari = true;
    this.infoTerakhir = null;
    this.kirim(`position fen ${fen}`);
    // Batas boleh lebih dari satu: engine berhenti pada batas pertama
    // yang tercapai (mis. depth 12 atau movetime 4000 ms).
    const batas = [];
    if (kedalaman) batas.push(`depth ${kedalaman}`);
    if (movetime) batas.push(`movetime ${movetime}`);
    this.kirim(`go ${batas.length ? batas.join(" ") : `movetime ${movetime || 800}`}`);
  }

  /** Buang tabel hash — panggil saat memulai analisis partai yang baru. */
  gameBaru() {
    this.setop();
    this.kirim("ucinewgame");
    this.kirim("isready");
  }

  /** Hentikan pencarian aktif tanpa menjadwalkan permintaan baru. */
  setop() {
    const tertunda = this.terakhir;
    this.terakhir = null;
    if (tertunda?.padaSelesai) tertunda.padaSelesai("", null, new Error("pencarian dibatalkan"));
    if (this.sedangCari) this.kirim("stop");
  }

  /** Buang worker sepenuhnya (dipakai saat komponen dilepas). */
  tamat() {
    this.setop();
    // Lepaskan penunggu SEBELUM worker dibuang, kalau tidak `cari()` yang
    // sedang berjalan tidak akan pernah beresolusi.
    this.gagalkanPencarian(new Error("engine dihentikan"));
    if (this.worker) {
      this.worker.terminate();
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker = null;
    }
    this.siap = false;
    this.janjiSiap = null;
    this.penyelesaiSiap = null;
    this.padaInfo = null;
    this.padaSelesai = null;
    this.sedangCari = false;
    this.terakhir = null;
    this.infoTerakhir = null;
  }
}
