/**
 * Uji KESEGARAN daftar anggota (sumber: API klub Chess.com).
 *
 * Latar belakang: dulu penyegaran snapshot roster hanya dijalankan sebagai
 * pekerjaan latar belakang yang tidak ditunggu. Di Vercel, function dibekukan
 * begitu respons terkirim, jadi penyegaran itu tidak pernah selesai —
 * akibatnya daftar anggota situs berbeda dengan klub di Chess.com dan foto
 * profil tidak pernah berubah (snapshot terakhir bisa berhari-hari lalu).
 *
 * Uji ini mengunci tiga jaminan yang menggantikannya:
 *  1. Snapshot usang tetap dijawab seketika (halaman tidak kosong), dan
 *     penyegaran latar belakangnya benar-benar diterapkan.
 *  2. Snapshot yang sudah melewati `snapshotTungguDetik` disegarkan DI DALAM
 *     permintaan, jadi data tidak bisa tertinggal berhari-hari.
 *  3. Tombol pengurus (`paksa`) melewati cache daftar klub DAN cache profil.
 *
 * Jalankan: node server/uji/uji-roster-segar.mjs
 * Tanpa internet: Chess.com ditiru server lokal (lihat alat-uji.mjs).
 */
import { nyalakanPeniruChess, luncurkanServerUji, ambilTokenCsrf } from "./alat-uji.mjs";

let lulus = 0;
let gagal = 0;
const kegagalan = [];

function cek(nama, syarat, rincian = "") {
  if (syarat) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    kegagalan.push(nama);
    console.log(`  ✗ ${nama}${rincian ? `\n      ${rincian}` : ""}`);
  }
}

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const foto = (anggota, username) => {
  const a = anggota.find((x) => x.username === username);
  return a?.foto || "";
};

const klubTiruan = {
  weekly: [{ username: "magnuscarlsen", joined: 1767225600 }],
  monthly: [{ username: "gothamchess", joined: 1764547200 }],
  all_time: [
    { username: "magnuscarlsen", joined: 1767225600 },
    { username: "hikaru", joined: 1761955200 },
  ],
};

let versiFoto = 1;
const tiruan = await nyalakanPeniruChess(
  {
    magnuscarlsen: { ...undefined, avatar: "" },
  },
  {
    anggotaKlub: klubTiruan,
    pemainTambahanGetter: () => ({
      magnuscarlsen: {
        username: "MagnusCarlsen",
        player_id: 111,
        status: "premium",
        joined: 1262051374,
        name: "Magnus Carlsen",
        avatar: `https://images.chesscomfiles.com/uploads/v1/user/111.versi-${versiFoto}.jpg`,
        url: "https://www.chess.com/member/magnuscarlsen",
        stats: {
          chess_rapid: { last: { rating: 2882 }, record: { win: 10, draw: 2, loss: 1 } },
        },
      },
      ...(klubTiruan.all_time.some((m) => m.username === "anggota_baru")
        ? {
            anggota_baru: {
              username: "Anggota_Baru",
              player_id: 999,
              status: "basic",
              joined: 1770000000,
              name: "Anggota Baru",
              avatar: "https://images.chesscomfiles.com/uploads/v1/user/999.baru.png",
              url: "https://www.chess.com/member/anggota_baru",
              stats: {},
            },
          }
        : {}),
    }),
  }
);

const srv = await luncurkanServerUji({
  chessDasar: tiruan.dasar,
  env: {
    // Nilai kecil supaya uji cepat; perilakunya sama dengan bawaan produksi.
    KCI_CHESS_KLUB_CACHE: "3600",
    KCI_CHESS_KLUB_PROFILE_CACHE: "2",
    KCI_CHESS_KLUB_SNAPSHOT_SEGAR: "1",
    KCI_CHESS_KLUB_SNAPSHOT_TUNGGU: "3",
    KCI_CHESS_KLUB_SAPU: "5",
    KCI_CHESS_KLUB_PENGAYAAN_MS: "3000",
  },
});

async function ambilAnggota() {
  const res = await fetch(`${srv.dasar}/api/anggota`);
  const data = await res.json().catch(() => []);
  return {
    data: Array.isArray(data) ? data : [],
    diperbaruiPada: res.headers.get("x-roster-diperbarui") || "",
    segar: res.headers.get("x-roster-segar"),
    umur: Number(res.headers.get("x-roster-umur") || "0"),
  };
}

try {
  /* ---------------------------------------------------- bangun snapshot */
  console.log("\nSnapshot awal & metadata");
  const awal = await ambilAnggota();
  cek("GET /api/anggota -> daftar roster klub", awal.data.length === 3, JSON.stringify(awal.data));
  cek("roster ditandai sumber klub Chess.com", awal.data.every((a) => a.sumberAnggota === "chesscom-klub"));
  cek("snapshot segar saat baru dibuat", awal.segar === "1", `segar=${awal.segar}`);
  cek("cap waktu snapshot dilaporkan", Boolean(awal.diperbaruiPada), awal.diperbaruiPada);
  cek("foto profil ikut tersimpan di snapshot", foto(awal.data, "magnuscarlsen").includes("versi-1"), foto(awal.data, "magnuscarlsen"));

  const status = await (await fetch(`${srv.dasar}/api/anggota/status`)).json();
  cek(
    "GET /api/anggota/status melaporkan jumlah, cap waktu, dan umur",
    status?.jumlah === 3 && Boolean(status?.diperbaruiPada) && Number.isFinite(status?.umurDetik),
    JSON.stringify(status)
  );

  /* ------------------------------------------ penyegaran latar belakang */
  console.log("\nPenyegaran latar belakang (stale-while-revalidate)");
  versiFoto = 2;
  klubTiruan.all_time.push({ username: "anggota_baru", joined: 1770000000 });
  await tidur(2400); // melewati batas segar (1 dtk) DAN umur cache profil (2 dtk)

  const lama = await ambilAnggota();
  cek(
    "snapshot usang tetap dijawab seketika (halaman tidak kosong)",
    lama.data.length === 3 && lama.segar === "0",
    `jumlah=${lama.data.length} segar=${lama.segar}`
  );
  cek(
    "jawaban itu belum berisi foto terbaru (memang snapshot lama)",
    foto(lama.data, "magnuscarlsen").includes("versi-1"),
    foto(lama.data, "magnuscarlsen")
  );

  await tidur(3200); // beri kesempatan penyegaran latar belakang selesai
  const sesudahLatar = await ambilAnggota();
  cek(
    "foto profil ikut diperbarui oleh penyegaran latar belakang",
    foto(sesudahLatar.data, "magnuscarlsen").includes("versi-2"),
    foto(sesudahLatar.data, "magnuscarlsen")
  );
  cek(
    "cap waktu snapshot ikut maju setelah penyegaran",
    sesudahLatar.diperbaruiPada !== "" && sesudahLatar.diperbaruiPada !== awal.diperbaruiPada
  );

  /* ------------------------------- penyegaran ditunggu saat terlalu tua */
  console.log("\nSnapshot terlalu tua: penyegaran ditunggu di dalam permintaan");
  versiFoto = 3;
  await tidur(6000); // melewati batas tunggu (3 dtk)
  const ditunggu = await ambilAnggota();
  cek(
    "jawaban sudah berisi foto terbaru (bukan menunggu kunjungan berikutnya)",
    foto(ditunggu.data, "magnuscarlsen").includes("versi-3"),
    foto(ditunggu.data, "magnuscarlsen")
  );
  cek("snapshot dilaporkan segar setelah penyegaran ditunggu", ditunggu.segar === "1", `segar=${ditunggu.segar}`);

  /* ------------------------------------------------- tombol pengurus */
  console.log("\nPenyegaran paksa pengurus (melewati cache)");
  const klubSebelumPaksa = tiruan.hits.klub;
  cek(
    "daftar anggota klub TIDAK diunduh ulang setiap penyegaran",
    klubSebelumPaksa === 1,
    `panggilan endpoint klub = ${klubSebelumPaksa}`
  );

  versiFoto = 4;
  klubTiruan.all_time.push({ username: "anggota_kedua", joined: 1770000001 });

  const tanpaToken = await fetch(`${srv.dasar}/api/pengurus/segarkan-roster`, { method: "POST" });
  cek(
    "penyegaran paksa tanpa kredensial pengurus ditolak",
    [401, 403, 503].includes(tanpaToken.status),
    `dapat ${tanpaToken.status}`
  );

  const csrf = await ambilTokenCsrf(srv.dasar);
  const paksa = await fetch(`${srv.dasar}/api/pengurus/segarkan-roster`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
      "X-Token-Admin": srv.token,
    },
    body: "{}",
  });
  const isiPaksa = await paksa.json().catch(() => ({}));
  cek(
    "POST /api/pengurus/segarkan-roster -> 200 dengan jumlah terbaru",
    paksa.status === 200 && isiPaksa.jumlah === 5,
    `${paksa.status} ${JSON.stringify(isiPaksa)}`
  );
  cek("paksa benar-benar mengunduh ulang daftar klub", tiruan.hits.klub === klubSebelumPaksa + 1, `panggilan klub = ${tiruan.hits.klub}`);

  const setelahPaksa = await ambilAnggota();
  cek(
    "anggota kedua yang baru bergabung langsung tampil",
    setelahPaksa.data.some((a) => a.username === "anggota_kedua"),
    setelahPaksa.data.map((a) => a.username).join(", ")
  );
  cek(
    "foto profil terbaru ikut terpakai setelah paksa",
    foto(setelahPaksa.data, "magnuscarlsen").includes("versi-4"),
    foto(setelahPaksa.data, "magnuscarlsen")
  );
} finally {
  srv.hentikan();
}

/* -------------------------------------------------------------- ringkasan */
console.log(`\n${"=".repeat(52)}`);
console.log(`  ${lulus} lulus, ${gagal} gagal`);
if (kegagalan.length) {
  console.log("\n  Yang gagal:");
  for (const k of kegagalan) console.log(`    - ${k}`);
}
console.log(`${"=".repeat(52)}\n`);
process.exit(gagal ? 1 : 0);
