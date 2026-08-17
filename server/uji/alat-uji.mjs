/**
 * Alat bersama untuk uji HTTP backend.
 *
 * Tujuan: seluruh skenario integrasi dapat berjalan TANPA internet dan
 * TANPA menyentuh data asli:
 *  - server backend diluncurkan pada port acak dengan KCI_DIR_DATA di /tmp
 *  - Chess.com ditiru oleh server lokal kecil (KCI_CHESS_DASAR)
 *  - token CSRF diambil dari GET /api/csrf-token seperti klien sungguhan
 *
 * Dipakai oleh uji-backend.mjs dan uji-verifikasi.mjs.
 */
import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Akun-akun Chess.com tiruan. Username lain dijawab 404. */
export const ANGGOTA_KLUB_TIRUAN = {
  // Sengaja ada Magnus di dua kelompok untuk menguji deduplikasi roster.
  weekly: [{ username: "magnuscarlsen", joined: 1767225600 }],
  monthly: [{ username: "gothamchess", joined: 1764547200 }],
  all_time: [
    { username: "magnuscarlsen", joined: 1767225600 },
    { username: "hikaru", joined: 1761955200 },
  ],
};

export const PEMAIN_TIRUAN = {
  magnuscarlsen: {
    username: "MagnusCarlsen",
    player_id: 111,
    status: "premium",
    joined: 1262051374,
    name: "Magnus Carlsen",
    avatar: "https://images.chesscomfiles.com/uploads/v1/user/111.abc.jpg",
    url: "https://www.chess.com/member/magnuscarlsen",
    stats: {
      chess_rapid: { last: { rating: 2882 }, record: { win: 10, draw: 2, loss: 1 } },
      chess_blitz: { last: { rating: 2901 }, record: { win: 20, draw: 3, loss: 2 } },
      chess_bullet: { last: { rating: 2850 }, record: { win: 5, draw: 0, loss: 1 } },
    },
  },
  gothamchess: {
    username: "GothamChess",
    player_id: 222,
    status: "basic",
    joined: 1432500000,
    name: "Levy Rozman",
    url: "https://www.chess.com/member/gothamchess",
    stats: {
      chess_rapid: { last: { rating: 2500 }, record: { win: 8, draw: 1, loss: 4 } },
    },
  },
  di_luar_klub: {
    username: "Di_Luar_Klub",
    player_id: 444,
    status: "basic",
    name: "Pemain Luar Klub",
    url: "https://www.chess.com/member/di_luar_klub",
    stats: {
      chess_rapid: { last: { rating: 1200 }, record: { win: 2, draw: 0, loss: 2 } },
    },
  },
  hikaru: {
    username: "Hikaru",
    player_id: 333,
    status: "basic",
    name: "Hikaru Nakamura",
    url: "https://www.chess.com/member/hikaru",
    stats: {
      chess_blitz: { last: { rating: 2900 }, record: { win: 30, draw: 5, loss: 5 } },
    },
  },
};

/** Nyalakan server HTTP tiruan api.chess.com. Mengembalikan alamat dasar. */
export function nyalakanPeniruChess(pemainTambahan = {}) {
  const pemain = { ...PEMAIN_TIRUAN, ...pemainTambahan };
  const server = http.createServer((req, res) => {
    const kirim = (status, isi) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(isi));
    };
    const jalur = decodeURIComponent((req.url || "").split("?")[0]);
    const klub = /^\/club\/([^/]+)\/members$/.exec(jalur);
    if (klub) {
      return klub[1].toLowerCase() === "blunder-skuad"
        ? kirim(200, ANGGOTA_KLUB_TIRUAN)
        : kirim(404, { code: 0, message: "Not Found" });
    }
    const cocok = /^\/player\/([^/]+?)(\/stats)?$/.exec(jalur);
    if (!cocok) return kirim(404, { pesan: "jalur tak dikenal" });
    const data = pemain[cocok[1].toLowerCase()];
    if (!data) return kirim(404, { code: 0, message: "Not Found" });
    if (cocok[2]) return kirim(200, data.stats || {});
    const { stats, ...profil } = data;
    return kirim(200, profil);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () =>
      resolve({ dasar: `http://127.0.0.1:${server.address().port}`, server })
    );
  });
}

async function serverHidup(dasar) {
  try {
    const r = await fetch(`${dasar}/api/kesehatan`, {
      signal: AbortSignal.timeout(1500),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Luncurkan server backend terisolasi.
 *
 * Opsi:
 *  - tanpaToken: true  → tanpa KCI_TOKEN_ADMIN (mode pengembangan)
 *  - chessDasar        → GANTIAN peniru, arahkan ke target lain
 *  - env               → variabel lingkungan tambahan untuk anak
 *
 * Mengembalikan { dasar, token, hentikan }.
 */
export async function luncurkanServerUji({ tanpaToken = false, chessDasar, env = {} } = {}) {
  const port = 10000 + Math.floor(Math.random() * 20000);
  const dirData = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-"));
  const token = tanpaToken
    ? ""
    : `token-uji-${Math.random().toString(36).slice(2)}-123456`;
  const dasar = `http://127.0.0.1:${port}`;

  let peniru = null;
  let targetChess = chessDasar || process.env.KCI_CHESS_DASAR;
  if (!targetChess) {
    peniru = await nyalakanPeniruChess();
    targetChess = peniru.dasar;
  }

  const anak = spawn(process.execPath, ["server/src/index.js"], {
    cwd: AKAR,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      NODE_ENV: "development",
      KCI_DIR_DATA: dirData,
      KCI_PEPPER: "pepper-uji-yang-cukup-panjang",
      KCI_TOKEN_ADMIN: token,
      KCI_CHESS_DASAR: targetChess,
      KCI_CHESS_TIMEOUT: "1500",
      KCI_CHESS_RETRY: "2",
      ...env,
    },
    stdio: ["ignore", "inherit", "inherit"],
  });

  const hentikan = () => {
    if (anak.exitCode === null) anak.kill("SIGTERM");
    peniru?.server.close();
    fs.rmSync(dirData, { recursive: true, force: true });
  };

  for (let i = 0; i < 100; i++) {
    if (await serverHidup(dasar)) return { dasar, token, hentikan, chessTiruan: Boolean(peniru) };
    if (anak.exitCode !== null) {
      hentikan();
      throw new Error("Server uji mati saat dinyalakan.");
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  hentikan();
  throw new Error("Server uji tidak merespons dalam 10 detik.");
}

/** Ambil token CSRF, seperti yang dilakukan klien web sebelum POST. */
export async function ambilTokenCsrf(dasar) {
  const r = await fetch(`${dasar}/api/csrf-token`);
  const data = await r.json().catch(() => ({}));
  if (!data.token) throw new Error("Server tidak menerbitkan token CSRF.");
  return data.token;
}
