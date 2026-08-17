/**
 * Tiruan minimal api.chess.com HANYA untuk pratinjau langsung di
 * sandbox (Chess.com tidak terjangkau dari sini). Jangan dipakai di
 * produksi — server nyata memakai https://api.chess.com/pub.
 *
 * Jalankan: node scripts/mock-chess.mjs
 * Lalu arahkan backend: KCI_CHESS_DASAR=http://127.0.0.1:8790
 */
import http from "node:http";

const ANGGOTA = {
  weekly: [{ username: "magnuscarlsen", joined: 1767225600 }],
  monthly: [{ username: "gothamchess", joined: 1764547200 }],
  all_time: [
    { username: "magnuscarlsen", joined: 1767225600 },
    { username: "hikaru", joined: 1761955200 },
    { username: "gothamchess", joined: 1764547200 },
  ],
};

const PEMAIN = {
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

function kirim(res, status, isi) {
  const teks = JSON.stringify(isi);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(teks),
  });
  res.end(teks);
}

const PORT = Number(process.env.MOCK_PORT || 8790);
http
  .createServer((req, res) => {
    const jalur = decodeURIComponent((req.url || "").split("?")[0]);
    const klub = /^\/club\/([^/]+)\/members$/.exec(jalur);
    if (klub) return kirim(res, 200, ANGGOTA);
    const pemain = /^\/player\/([^/]+?)(\/stats)?$/.exec(jalur);
    if (!pemain) return kirim(res, 404, { code: 0, message: "Not Found" });
    const data = PEMAIN[pemain[1].toLowerCase()];
    if (!data) return kirim(res, 404, { code: 0, message: "Not Found" });
    if (pemain[2]) return kirim(res, 200, data.stats || {});
    const { stats, ...profil } = data;
    return kirim(res, 200, profil);
  })
  .listen(PORT, "127.0.0.1", () =>
    console.log(`[mock-chess] tiruan Chess.com di http://127.0.0.1:${PORT}`)
  );
