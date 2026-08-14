/**
 * Proxy Chess.com + penyimpanan daftar anggota.
 * Browser tidak bisa memanggil api.chess.com langsung (CORS + User-Agent).
 */
import fs from "node:fs";
import path from "node:path";

const UA =
  "KomunitasCaturIndonesia/1.0 (contact: info@komunitascatur.or.id)";
const DATA = path.resolve("data/anggota.json");

function bacaAnggota() {
  try {
    return JSON.parse(fs.readFileSync(DATA, "utf8"));
  } catch {
    return [];
  }
}

function tulisAnggota(list) {
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(list, null, 2) + "\n");
}

function normalisasi(raw) {
  let s = String(raw || "").trim();
  s = s.replace(/^https?:\/\/(www\.)?chess\.com\/member\//i, "");
  s = s.replace(/^@/, "");
  s = s.split(/[/?#\s]/)[0];
  return s.toLowerCase();
}

async function chessGet(urlPath) {
  const res = await fetch(`https://api.chess.com/pub${urlPath}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  return res;
}

function semuaRating(stats) {
  const urutan = [
    ["chess_rapid", "Rapid"],
    ["chess_blitz", "Blitz"],
    ["chess_bullet", "Bullet"],
    ["chess_daily", "Daily"],
  ];
  const ratings = {};
  let utama = null;
  for (const [kunci, label] of urutan) {
    const blok = stats?.[kunci];
    if (blok?.last?.rating) {
      ratings[label] = {
        elo: blok.last.rating,
        win: blok.record?.win ?? 0,
        draw: blok.record?.draw ?? 0,
        loss: blok.record?.loss ?? 0,
      };
      if (!utama) utama = label;
    }
  }
  if (!utama) {
    return { ratings: {}, elo: null, kontrol: null, win: 0, draw: 0, loss: 0 };
  }
  return {
    ratings,
    kontrol: utama,
    elo: ratings[utama].elo,
    win: ratings[utama].win,
    draw: ratings[utama].draw,
    loss: ratings[utama].loss,
  };
}

async function lengkapi(anggota) {
  const username = anggota.username;
  try {
    const [pRes, sRes] = await Promise.all([
      chessGet(`/player/${encodeURIComponent(username)}`),
      chessGet(`/player/${encodeURIComponent(username)}/stats`),
    ]);
    if (pRes.status === 404) {
      return { ...anggota, nama: username, hilang: true };
    }
    if (!pRes.ok) {
      return { ...anggota, nama: username, gagal: true };
    }
    const profil = await pRes.json();
    const stats = sRes.ok ? await sRes.json() : {};
    const rating = semuaRating(stats);
    const namaAsli = profil.name || profil.username || username;
    const nama = profil.title ? `${profil.title} ${namaAsli}` : namaAsli;
    return {
      ...anggota,
      username: profil.username || username,
      nama,
      foto: profil.avatar || "",
      url: profil.url || `https://www.chess.com/member/${username}`,
      ...rating,
    };
  } catch {
    return { ...anggota, nama: username, gagal: true };
  }
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function bacaBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

async function handle(req, res, next) {
  const url = req.url.split("?")[0];

  if (req.method === "GET" && url === "/api/anggota") {
    const dasar = bacaAnggota();
    const lengkap = [];
    for (const item of dasar) {
      lengkap.push(await lengkapi(item));
    }
    lengkap.sort((a, b) => (b.elo || 0) - (a.elo || 0));
    return json(res, 200, lengkap);
  }

  if (req.method === "POST" && url === "/api/anggota") {
    let body;
    try {
      body = await bacaBody(req);
    } catch {
      return json(res, 400, { pesan: "Data tidak valid." });
    }
    const username = normalisasi(body.username);
    if (!username || !/^[a-z0-9_-]{3,25}$/i.test(username)) {
      return json(res, 400, {
        pesan: "Username Chess.com tidak valid.",
      });
    }

    const daftar = bacaAnggota();
    if (daftar.some((a) => a.username === username)) {
      return json(res, 409, {
        pesan: "Username ini sudah terdaftar sebagai anggota.",
      });
    }

    const cek = await chessGet(`/player/${encodeURIComponent(username)}`);
    if (cek.status === 404) {
      return json(res, 404, {
        pesan: "Akun Chess.com tidak ditemukan. Periksa ejaan username.",
      });
    }
    if (!cek.ok) {
      return json(res, 502, {
        pesan: "Chess.com sedang tidak dapat dihubungi. Coba beberapa saat lagi.",
      });
    }
    const profil = await cek.json();
    const uname = (profil.username || username).toLowerCase();
    const baru = {
      username: uname,
      daftarPada: new Date().toISOString(),
    };
    daftar.push(baru);
    tulisAnggota(daftar);
    const lengkap = await lengkapi(baru);
    return json(res, 201, lengkap);
  }

  return next();
}

export function kciApi() {
  return {
    name: "kci-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/api/")) {
          handle(req, res, next).catch((err) => {
            console.error(err);
            json(res, 500, { pesan: "Kesalahan server." });
          });
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/api/")) {
          handle(req, res, next).catch((err) => {
            console.error(err);
            json(res, 500, { pesan: "Kesalahan server." });
          });
          return;
        }
        next();
      });
    },
  };
}
