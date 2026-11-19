/**
 * Uji regresi validasi aliran data Chess.com dan jejak audit.
 * Jalankan melalui npm run uji:backend.
 */
import assert from "node:assert/strict";
import { chessGet, ambilProfil, ambilStatistik, ambilAnggotaKlub, GalatChess } from "../src/chess.js";
import { konfigurasi } from "../src/konfigurasi.js";
import { ajukanKeikutsertaan, daftarkanPeserta } from "../src/turnamen.js";
import { bersihkanRincian } from "../src/audit.js";
import {
  playerIdChessSah,
  statusChessSah,
  usernameRosterSah,
} from "../../scripts/validasi-respons-chess.mjs";

let lulus = 0;
function cek(nama, kondisi) {
  assert.ok(kondisi, nama);
  lulus += 1;
  console.log(`  ✓ ${nama}`);
}

console.log("\nUji keamanan aliran data Chess.com & audit");

const fetchAsli = globalThis.fetch;
const urlDiminta = [];
globalThis.fetch = async (url) => {
  urlDiminta.push(String(url));
  return new Response("{}", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

try {
  for (const [nama, tugas] of [
    ["path traversal ditolak", () => chessGet("/player/../etc/passwd")],
    ["URL absolut ditolak", () => chessGet("https://attacker.test/player/abc")],
    ["path club traversal ditolak", () => chessGet("/club/../members")],
    ["tanggal puzzle tidak sah ditolak", () => chessGet("/puzzle/2026-02-31")],
    ["username profil tidak sah ditolak", () => ambilProfil("..")],
    ["username statistik tidak sah ditolak", () => ambilStatistik("../admin")],
    ["slug klub tidak sah ditolak", () => ambilAnggotaKlub("../attacker")],
  ]) {
    await assert.rejects(Promise.resolve().then(tugas), (galat) => galat instanceof GalatChess && galat.status === 400);
    cek(nama, true);
  }
  await assert.rejects(
    Promise.resolve().then(() => ajukanKeikutsertaan("turnamen-uji", { username: ".." })),
    (galat) => galat?.status === 400
  );
  cek("pengajuan turnamen menolak username tidak sah sebelum jaringan", urlDiminta.length === 0);
  await assert.rejects(
    Promise.resolve().then(() => daftarkanPeserta("turnamen-uji", { username: "../admin" })),
    (galat) => galat?.status === 400
  );
  cek("penambahan peserta menolak username tidak sah sebelum jaringan", urlDiminta.length === 0);

  await chessGet("/player/magnuscarlsen", { pakaiCache: false });
  cek(
    "path sah tetap diarahkan ke host dasar Chess.com yang dikonfigurasi",
    urlDiminta[0] === `${konfigurasi.chess.dasar}/player/magnuscarlsen`
  );
} finally {
  globalThis.fetch = fetchAsli;
}

cek("username roster biasa diterima", usernameRosterSah({ username: "MagnusCarlsen" }) === "magnuscarlsen");
for (const anggota of [
  { username: ".." },
  { username: "../attacker" },
  { username: "@magnuscarlsen" },
  { username: "https://www.chess.com/member/magnuscarlsen" },
  { username: 12345 },
  "magnuscarlsen",
]) {
  cek("username roster abnormal ditolak", usernameRosterSah(anggota) === null);
}

cek("status profil dikenal diterima", statusChessSah({ status: "premium" }) === "premium");
cek(
  "status fair-play dikenal diterima",
  statusChessSah({ status: "closed:fair_play_violations" }) === "closed:fair_play_violations"
);
cek("status profil tak dikenal ditolak", statusChessSah({ status: "premium<script>" }) === null);
cek("player_id positif aman diterima", playerIdChessSah({ player_id: 123 }) === 123);
cek("player_id pecahan ditolak", playerIdChessSah({ player_id: 1.5 }) === null);
cek("player_id negatif ditolak", playerIdChessSah({ player_id: -1 }) === null);
cek("player_id di luar safe integer ditolak", playerIdChessSah({ player_id: Number.MAX_SAFE_INTEGER + 1 }) === null);

const siklus = { status: "aman" };
siklus.siklus = siklus;
const rincian = bersihkanRincian({
  token: "jangan-simpan",
  nested: {
    password: "jangan-simpan",
    status: "aman",
    daftar: [
      { cookie: "jangan-simpan", label: "item aman" },
      "EBK-7F3K2M9Q",
    ],
  },
  panjang: "x".repeat(2000),
  action: "jangan-menimpa-metadata",
  timestamp: "jangan-menimpa-waktu",
  siklus,
});
const serial = JSON.stringify(rincian);
cek("kunci sensitif di objek bersarang dibuang", !serial.includes("jangan-simpan"));
cek("array ikut disanitasi secara rekursif", rincian.nested.daftar[0].label === "item aman" && !("cookie" in rincian.nested.daftar[0]));
cek("kode akses e-book disamarkan", !serial.includes("EBK-7F3K2M9Q") && serial.includes("kode akses disamarkan"));
cek("string panjang dibatasi", rincian.panjang.length <= 400);
cek("field metadata audit tidak dapat ditimpa", !("action" in rincian) && !("timestamp" in rincian));
cek("referensi siklik tidak menyebabkan rekursi tak terbatas", rincian.siklus.status === "aman" && !("siklus" in rincian.siklus));

const terlaluDalam = { a: { b: { c: { d: { e: "di luar batas" } } } } };
cek("kedalaman objek dibatasi", bersihkanRincian(terlaluDalam).a.b.c.d === undefined);

const muatanBesar = Object.fromEntries(
  Array.from({ length: 250 }, (_, i) => [`field${i}`, "x".repeat(400)])
);
const muatanBersih = bersihkanRincian(muatanBesar);
cek("jumlah node dan ukuran rincian dibatasi", new TextEncoder().encode(JSON.stringify(muatanBersih)).length <= 8192);

console.log(`\n${lulus} pemeriksaan lulus.`);
