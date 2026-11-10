/**
 * Uji lifecycle Stockfish — Promise deterministik & pergantian engine.
 *
 * Memverifikasi 10 skenario wajib dari temuan P0:
 * 1. Engine berhasil startup normal
 * 2. Engine dihentikan sebelum readyok
 * 3. Engine diganti sebelum readyok
 * 4. Engine diganti ketika sedang melakukan pencarian
 * 5. Engine dihentikan setelah siap
 * 6. Engine gagal dimuat
 * 7. Worker mengirim readyok terlambat setelah dihentikan
 * 8. Worker mengirim pesan setelah penghancuran
 * 9. Dua permintaan startup berdekatan
 * 10. Pergantian engine berulang dengan cepat
 *
 * Semua Promise harus memiliki hasil yang dapat diverifikasi (resolve/reject),
 * tidak ada yang menggantung, tidak ada unhandled rejection, tidak ada kebocoran worker.
 */
import assert from "node:assert/strict";
import { EngineCatur } from "../src/lib/engineCatur.js";
import { EngineAnalisis } from "../src/halaman/Analisa/mesin/engine.js";

let lulus = 0;
let gagal = 0;

async function uji(nama, fn) {
  try {
    await fn();
    lulus++;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal++;
    console.error(`  ✗ ${nama}\n    ${e?.stack ?? e?.message ?? e}`);
    process.exitCode = 1;
  }
}

function workerDiam() {
  const dikirim = [];
  class W {
    constructor(url) {
      W.terakhir = this;
      this.url = url;
      this.onmessage = null;
      this.onerror = null;
      this.terminated = false;
    }
    postMessage(cmd) {
      dikirim.push(String(cmd));
    }
    terminate() { this.terminated = true; this.onmessage = null; this.onerror = null; }
  }
  return { W, dikirim };
}

function workerSiap(delay = 5) {
  class W {
    constructor(url) {
      W.terakhir = this;
      this.url = url;
      this.onmessage = null;
      this.onerror = null;
    }
    postMessage(cmd) {
      if (String(cmd) === "isready") setTimeout(() => this.onmessage?.({ data: "readyok" }), delay);
    }
    terminate() { this.onmessage = null; this.onerror = null; }
  }
  return W;
}

function workerCariSiap() {
  // Worker yang langsung siap dan bisa menjawab pencarian
  class W {
    constructor(url) {
      W.terakhir = this;
      this.url = url;
      this.onmessage = null;
      this.onerror = null;
    }
    postMessage(cmd) {
      const s = String(cmd);
      if (s === "isready") setTimeout(() => this.onmessage?.({ data: "readyok" }), 2);
      if (s.startsWith("go ")) {
        setTimeout(() => {
          this.onmessage?.({ data: "info depth 10 cp 20 pv e2e4" });
          this.onmessage?.({ data: "bestmove e2e4" });
        }, 5);
      }
    }
    terminate() { this.onmessage = null; this.onerror = null; }
  }
  return W;
}

async function denganWorker(WorkerPalsu, fn) {
  const asli = globalThis.Worker;
  globalThis.Worker = WorkerPalsu;
  try { return await fn(); } finally { globalThis.Worker = asli; }
}

console.log("Lifecycle Stockfish — Promise deterministik");

await uji("1. Engine berhasil startup secara normal", async () => {
  const W = workerSiap(2);
  await denganWorker(W, async () => {
    const eng = new EngineCatur({ url: "/engines/x/x.js" });
    await eng.mulai();
    assert.equal(eng.siap, true);
    eng.tamat();
  });
});

await uji("2. Engine dihentikan sebelum readyok — Promise ditolak, tidak menggantung", async () => {
  const { W } = workerDiam();
  await denganWorker(W, async () => {
    const eng = new EngineCatur({ url: "/engines/x/x.js" });
    const p = eng.mulai();
    let rejected = false;
    p.catch(() => { rejected = true; });
    // Tamat sebelum readyok
    eng.tamat();
    // Tunggu sedikit, pastikan rejection terjadi
    await new Promise(r => setTimeout(r, 20));
    await assert.rejects(() => p, /dihentikan/);
    assert.equal(rejected, true);
    assert.equal(eng.janjiSiap, null);
    assert.equal(eng.penyelesaiSiap, null);
  });
});

await uji("3. Engine diganti sebelum readyok — Promise lama ditolak, engine baru bisa startup", async () => {
  const { W: WDiam } = workerDiam();
  await denganWorker(WDiam, async () => {
    const engLama = new EngineCatur({ url: "/engines/old/x.js" });
    const pLama = engLama.mulai();
    engLama.tamat();
    await assert.rejects(() => pLama, /dihentikan/);

    // Engine baru
    const WSiap = workerSiap(2);
    await denganWorker(WSiap, async () => {
      const engBaru = new EngineCatur({ url: "/engines/new/y.js" });
      await engBaru.mulai();
      assert.equal(engBaru.siap, true);
      engBaru.tamat();
    });
  });
});

await uji("3b. EngineAnalisis diganti sebelum readyok — memuat tidak menggantung", async () => {
  const { W: WDiam } = workerDiam();
  await denganWorker(WDiam, async () => {
    const m1 = new EngineAnalisis({ idEngine: "stockfish-18-lite" });
    const p1 = m1.siapkan();
    // Hancurkan sebelum readyok
    m1.hancurkan();
    await assert.rejects(() => p1, /dihentikan/);
    assert.equal(m1.memuat, null);

    const WSiap = workerSiap(2);
    await denganWorker(WSiap, async () => {
      const m2 = new EngineAnalisis({ idEngine: "stockfish-17-lite" });
      await m2.siapkan();
      assert.equal(m2.engine.siap, true);
      m2.hancurkan();
    });
  });
});

await uji("4. Engine diganti ketika sedang melakukan pencarian — pencarian dibatalkan", async () => {
  const W = workerCariSiap();
  await denganWorker(W, async () => {
    const eng = new EngineCatur({ url: "/engines/x/x.js" });
    await eng.mulai();
    const pCari = eng.cari({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", kedalaman: 10 });
    // Ganti = tamat saat mencari
    eng.tamat();
    await assert.rejects(() => pCari, /dihentikan|berhenti|batal/);
    assert.equal(eng.sedangCari, false);
  });
});

await uji("5. Engine dihentikan setelah siap — aman dan tidak ada Promise menggantung", async () => {
  const W = workerSiap(2);
  await denganWorker(W, async () => {
    const eng = new EngineCatur({ url: "/engines/x/x.js" });
    await eng.mulai();
    assert.equal(eng.siap, true);
    eng.tamat();
    assert.equal(eng.siap, false);
    assert.equal(eng.worker, null);
    // Cari setelah tamat harus tidak throw sync, tapi mungkin perlu mulai lagi
    // Tamat setelah siap tidak meninggalkan janji menggantung
    await eng.mulai().then(() => eng.tamat()).catch(() => {});
  });
});

await uji("5b. Engine dihentikan saat sedang siap dan sedang mencari — kedua Promise ditolak", async () => {
  const W = workerCariSiap();
  await denganWorker(W, async () => {
    const eng = new EngineCatur({ url: "/engines/x/x.js" });
    await eng.mulai();
    const p = eng.cari({ fen: "start", kedalaman: 8 });
    eng.tamat();
    await assert.rejects(() => p, /dihentikan|berhenti|batal/);
  });
});

await uji("6. Engine gagal dimuat — error diteruskan dan retry bisa", async () => {
  let percobaan = 0;
  class WGagalSekali {
    constructor(url) {
      percobaan++;
      this.url = url;
      this.onmessage = null;
      this.onerror = null;
      if (percobaan === 1) setTimeout(() => this.onerror?.({ message: "jaringan putus" }), 1);
    }
    postMessage(cmd) {
      if (percobaan > 1 && String(cmd) === "isready") setTimeout(() => this.onmessage?.({ data: "readyok" }), 2);
    }
    terminate() { this.onmessage = null; this.onerror = null; }
  }
  await denganWorker(WGagalSekali, async () => {
    const eng = new EngineCatur({ url: "/engines/x/x.js" });
    await assert.rejects(() => eng.mulai(), /jaringan putus/);
    assert.equal(eng.janjiSiap, null);
    // Retry harus berhasil
    await eng.mulai();
    assert.equal(eng.siap, true);
    eng.tamat();
  });
});

await uji("6b. EngineAnalisis gagal lalu retry — memuat dibersihkan", async () => {
  let percobaan = 0;
  class WGagalSekali {
    constructor(url) {
      percobaan++;
      this.url = url;
      this.onmessage = null;
      this.onerror = null;
      if (percobaan === 1) setTimeout(() => this.onerror?.({ message: "gagal load" }), 1);
    }
    postMessage(cmd) {
      if (percobaan > 1 && String(cmd) === "isready") setTimeout(() => this.onmessage?.({ data: "readyok" }), 2);
    }
    terminate() { this.onmessage = null; this.onerror = null; }
  }
  await denganWorker(WGagalSekali, async () => {
    const m = new EngineAnalisis({ idEngine: "stockfish-18-lite" });
    await assert.rejects(() => m.siapkan(), /gagal load/);
    assert.equal(m.memuat, null);
    await m.siapkan();
    assert.equal(m.engine.siap, true);
    m.hancurkan();
  });
});

await uji("7. Worker mengirim readyok terlambat setelah engine lama dihentikan — tidak mengubah engine baru", async () => {
  const dikirim = [];
  let workerLama = null;
  class WLambat {
    constructor(url) {
      workerLama = this;
      this.url = url;
      this.onmessage = null;
      this.onerror = null;
    }
    postMessage(cmd) { dikirim.push(String(cmd)); }
    terminate() { this.onmessage = null; this.onerror = null; }
  }
  await denganWorker(WLambat, async () => {
    const engLama = new EngineCatur({ url: "/engines/old/x.js" });
    const pLama = engLama.mulai();
    // Tamat sebelum readyok, simpan handler lama
    const handlerLama = workerLama.onmessage;
    engLama.tamat();
    await assert.rejects(() => pLama, /dihentikan/);
    // Kirim readyok terlambat via handler lama — harus diabaikan
    if (handlerLama) handlerLama({ data: "readyok" });
    assert.equal(engLama.siap, false);
    assert.equal(engLama.penyelesaiSiap, null);

    // Engine baru harus tetap bisa startup normal
    const WSiap = workerSiap(2);
    await denganWorker(WSiap, async () => {
      const engBaru = new EngineCatur({ url: "/engines/new/y.js" });
      await engBaru.mulai();
      assert.equal(engBaru.siap, true);
      engBaru.tamat();
    });
  });
});

await uji("8. Worker mengirim pesan setelah penghancuran — diabaikan", async () => {
  const W = workerSiap(2);
  await denganWorker(W, async () => {
    const eng = new EngineCatur({ url: "/engines/x/x.js" });
    await eng.mulai();
    eng.tamat();
    // Setelah tamat, worker nulled, terima harus abaikan
    eng.terima("info depth 10 cp 20 pv e2e4");
    eng.terima("bestmove e2e4");
    // Tidak throw, tidak set siap true, tidak ada side effect
    assert.equal(eng.siap, false);
    assert.equal(eng.worker, null);
  });
});

await uji("9. Dua permintaan startup berdekatan — Promise sama dikembalikan", async () => {
  const W = workerSiap(5);
  await denganWorker(W, async () => {
    const eng = new EngineCatur({ url: "/engines/x/x.js" });
    const p1 = eng.mulai();
    const p2 = eng.mulai();
    assert.equal(p1, p2);
    await p1;
    await p2;
    assert.equal(eng.siap, true);
    eng.tamat();
  });
});

await uji("10. Pergantian engine berulang dengan cepat — semua Promise lama ditolak, terakhir berhasil", async () => {
  const { W: WDiam } = workerDiam();
  await denganWorker(WDiam, async () => {
    const promises = [];
    const engines = [];
    for (let i = 0; i < 4; i++) {
      const m = new EngineAnalisis({ idEngine: `stockfish-${i}-lite` });
      const p = m.siapkan().catch(e => e.message);
      promises.push(p);
      engines.push(m);
      m.hancurkan();
    }
    // Tunggu semua yang dihancurkan: harus reject
    for (let i = 0; i < 4; i++) {
      const hasil = await promises[i];
      assert.match(hasil, /dihentikan/);
      assert.equal(engines[i].memuat, null);
    }
    // Engine terakhir dibuat terpisah agar bisa diuji hancur sebelum readyok
    const mLast = new EngineAnalisis({ idEngine: "stockfish-4-lite" });
    const pLast = mLast.siapkan();
    mLast.hancurkan();
    await assert.rejects(() => pLast, /dihentikan/);
    const WSiap = workerSiap(2);
    await denganWorker(WSiap, async () => {
      const mFinal = new EngineAnalisis({ idEngine: "stockfish-18-lite" });
      await mFinal.siapkan();
      assert.equal(mFinal.engine.siap, true);
      mFinal.hancurkan();
    });
  });
});

await uji("11. Tidak ada unhandled rejection — semua Promise tertangani", async () => {
  const { W } = workerDiam();
  await denganWorker(W, async () => {
    const eng = new EngineCatur({ url: "/engines/x/x.js" });
    const p = eng.mulai();
    p.catch(() => {}); // tangani
    eng.tamat();
    await new Promise(r => setTimeout(r, 10));
    // Jika ada unhandled, Node akan warning; test ini memastikan tidak throw
    await assert.rejects(() => p, /dihentikan/);
  });
});

await uji("12. Tidak ada kebocoran worker — terminate dipanggil", async () => {
  const W = workerSiap(2);
  await denganWorker(W, async () => {
    const eng = new EngineCatur({ url: "/engines/x/x.js" });
    await eng.mulai();
    assert.ok(eng.worker);
    const wRef = eng.worker;
    let terminated = false;
    wRef.terminate = () => { terminated = true; };
    wRef.onmessage = () => {};
    wRef.onerror = () => {};
    eng.tamat();
    assert.equal(terminated, true);
    assert.equal(eng.worker, null);
  });
});

console.log(`\n${lulus} pemeriksaan lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
