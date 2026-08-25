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

const URL_ENGINE = `${import.meta.env.BASE_URL}engines/stockfish-18-lite-single/stockfish-18-lite-single.js`;

/** Ambil bilangan dari potongan baris UCI, mis. "depth 17" → 17. */
function angkaUci(baris, kunci) {
  const cocok = baris.match(new RegExp(`(?:^| )${kunci} (-?\\d+)`));
  return cocok ? Number(cocok[1]) : null;
}

export class EngineCatur {
  constructor() {
    this.worker = null;
    this.siap = false;
    this.janjiSiap = null;
    this.penyelesaiSiap = null;
    this.padaInfo = null; // callback info pencarian yang sedang berjalan
    this.padaSelesai = null; // callback bestmove pencarian yang sedang berjalan
    this.sedangCari = false;
    this.terakhir = null; // permintaan terbaru yang menunggu pencarian lama selesai
  }

  /**
   * Muat worker + tunggu hingga engine siap ("uciok" lalu "readyok").
   * Aman dipanggil berulang: janji yang sama dikembalikan. Bila gagal
   * (mis. jaringan putus), keadaan direset sehingga percobaan ulang bisa
   * memuat ulang dari awal.
   */
  mulai() {
    if (this.janjiSiap) return this.janjiSiap;
    this.janjiSiap = new Promise((selesai, gagal) => {
      let worker;
      try {
        worker = new Worker(URL_ENGINE);
      } catch (galat) {
        this.janjiSiap = null;
        gagal(galat);
        return;
      }
      this.worker = worker;
      this.penyelesaiSiap = { selesai, gagal };
      worker.onmessage = (e) => this.terima(String(e.data));
      worker.onerror = (galat) => {
        if (!this.penyelesaiSiap) return;
        this.penyelesaiSiap.gagal(new Error(galat?.message || "worker engine gagal"));
        this.penyelesaiSiap = null;
        this.tamat();
      };
      // Perintah awal — engine menampungnya sendiri sampai siap.
      this.kirim("uci");
      this.kirim("setoption name Hash value 16");
      this.kirim("isready");
    });
    return this.janjiSiap;
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
      // Hanya baris berguna: punya skor dan barisan langkah (pv).
      if (!this.padaInfo || !baris.includes(" pv ")) return;
      if (baris.includes(" lowerbound ") || baris.includes(" upperbound ")) return;
      const cp = angkaUci(baris, "cp");
      const mate = angkaUci(baris, "mate");
      if (cp === null && mate === null) return;
      const pv = (baris.split(" pv ")[1] || "").trim().split(/\s+/);
      this.padaInfo({
        kedalaman: angkaUci(baris, "depth") ?? 0,
        cp,
        mate,
        pv: pv.slice(0, 14),
      });
      return;
    }

    if (baris.startsWith("bestmove")) {
      const uci = (baris.split(/\s+/)[1] || "").trim();
      this.sedangCari = false;
      const selesai = this.padaSelesai;
      this.padaInfo = null;
      this.padaSelesai = null;
      if (selesai) selesai(uci);
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
  analisis(fen, { movetime = 800, padaInfo, padaSelesai }) {
    const permintaan = { fen, movetime, padaInfo, padaSelesai };
    if (this.sedangCari) {
      this.terakhir = permintaan;
      this.kirim("stop");
    } else {
      this.jalankan(permintaan);
    }
  }

  jalankan({ fen, movetime, padaInfo, padaSelesai }) {
    this.padaInfo = padaInfo;
    this.padaSelesai = padaSelesai;
    this.sedangCari = true;
    this.kirim(`position fen ${fen}`);
    this.kirim(`go movetime ${movetime}`);
  }

  /** Hentikan pencarian aktif tanpa menjadwalkan permintaan baru. */
  setop() {
    this.terakhir = null;
    if (this.sedangCari) this.kirim("stop");
  }

  /** Buang worker sepenuhnya (dipakai saat komponen dilepas). */
  tamat() {
    this.setop();
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
  }
}
