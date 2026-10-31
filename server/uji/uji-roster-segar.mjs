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
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
let negaraMagnus = "NO";
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
        country: `https://api.chess.com/pub/country/${negaraMagnus}`,
        birthday: "1990-01-01",
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
  const magnus = awal.data.find((anggota) => anggota.username === "magnuscarlsen");
  cek("API publik memuat kode negara dari profil Chess.com", magnus?.negara === "NO");
  cek("API publik tidak memuat tanggal lahir", !Object.hasOwn(magnus || {}, "birthday") && !Object.hasOwn(magnus || {}, "tanggalLahir"));

  const status = await (await fetch(`${srv.dasar}/api/anggota/status`)).json();
  cek(
    "GET /api/anggota/status melaporkan jumlah, cap waktu, dan umur",
    status?.jumlah === 3 && Boolean(status?.diperbaruiPada) && Number.isFinite(status?.umurDetik),
    JSON.stringify(status)
  );

  /* ------------------------------------------ penyegaran latar belakang */
  console.log("\nPenyegaran latar belakang (stale-while-revalidate)");
  versiFoto = 2;
  negaraMagnus = "US";
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
    "negara mengikuti perubahan profil setelah penyegaran",
    sesudahLatar.data.find((anggota) => anggota.username === "magnuscarlsen")?.negara === "US"
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

/* ----------------------------------------- migrasi puncak snapshot lama */
console.log("\nPuncak rating pada snapshot lama");
const dirPuncak = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-puncak-"));
const fetchAsli = globalThis.fetch;
const simbolKonteks = Symbol.for("@vercel/request-context");
const konteksAsli = Object.getOwnPropertyDescriptor(globalThis, simbolKonteks);
const pekerjaanLatar = [];
const sekarang = Date.now();
const cap = (umurMs) => new Date(sekarang - umurMs).toISOString();
const ratingLama = (elo) => ({ elo, win: 4, draw: 1, loss: 2 });
const anggotaLama = (username, elo, umurMs) => ({
  username,
  nama: username,
  elo,
  kontrol: "Rapid",
  negara: null,
  ratings: { Rapid: ratingLama(elo) },
  profilDiambilPada: cap(umurMs),
});
const anggotaUntukNegara = (username, elo, umurMs) => ({
  ...anggotaLama(username, elo, umurMs),
  ratings: { Rapid: { ...ratingLama(elo), puncak: elo + 100 } },
});
const snapshotPuncak = {
  diperbaruiPada: cap(65_000),
  klubChess: "blunder-skuad",
  anggota: [
    {
      ...anggotaLama("legacy_a", 1800, 50_000),
      negara: undefined,
      ratings: {
        Rapid: ratingLama(1800),
        Blitz: ratingLama(1500),
        Daily: ratingLama(1200),
      },
    },
    anggotaLama("legacy_b", 1700, 30_000),
    anggotaLama("gagal_profil", 1600, 10_000),
    anggotaLama("legacy_c", 1500, 5_000),
    {
      ...anggotaLama("sudah_lengkap", 2100, 7_200_000),
      ratings: { Rapid: { ...ratingLama(2100), puncak: 2200 } },
    },
    {
      ...anggotaLama("tanpa_best", 1300, 5_000),
      ratings: { Rapid: { ...ratingLama(1300), puncak: null } },
    },
    { username: "tanpa_rating", elo: null, negara: null, ratings: {}, profilDiambilPada: cap(5_000) },
    anggotaUntukNegara("negara_gagal", 1400, 90_000),
    anggotaUntukNegara("negara_usa", 1350, 40_000),
    anggotaUntukNegara("negara_kosong", 1250, 20_000),
    anggotaUntukNegara("negara_subdivisi", 1150, 10_000),
    anggotaUntukNegara("negara_invalid", 1050, 5_000),
  ],
};
fs.writeFileSync(path.join(dirPuncak, "roster-anggota.json"), JSON.stringify(snapshotPuncak));

const namaKlub = [...snapshotPuncak.anggota.map((a) => a.username), "pendatang"];
const statistikPemain = {
  legacy_a: {
    chess_rapid: { last: { rating: 1800 }, best: { rating: 1910 }, record: { win: 4, draw: 1, loss: 2 } },
    chess_blitz: { last: { rating: 1500 }, best: { rating: 1555 }, record: { win: 4, draw: 1, loss: 2 } },
    chess_daily: { last: { rating: 1200 }, record: { win: 4, draw: 1, loss: 2 } },
  },
  legacy_b: { chess_rapid: { last: { rating: 1700 }, best: { rating: 1755 } } },
  gagal_profil: { chess_rapid: { last: { rating: 1600 }, best: { rating: 1655 } } },
  legacy_c: { chess_rapid: { last: { rating: 1500 }, best: { rating: 1555 } } },
  sudah_lengkap: { chess_rapid: { last: { rating: 2100 }, best: { rating: 2200 } } },
  tanpa_best: { chess_rapid: { last: { rating: 1300 } } },
  tanpa_rating: {},
  pendatang: {},
  negara_gagal: { chess_rapid: { last: { rating: 1400 }, best: { rating: 1500 } } },
  negara_usa: { chess_rapid: { last: { rating: 1350 }, best: { rating: 1450 } } },
  negara_kosong: { chess_rapid: { last: { rating: 1250 }, best: { rating: 1350 } } },
  negara_subdivisi: { chess_rapid: { last: { rating: 1150 }, best: { rating: 1250 } } },
  negara_invalid: { chess_rapid: { last: { rating: 1050 }, best: { rating: 1150 } } },
};
let statistikGagal = true;
let profilGagal = true;
let profilNegaraGagal = true;
const negaraProfil = {
  legacy_a: "https://api.chess.com/pub/country/ID",
  negara_gagal: "https://api.chess.com/pub/country/ID",
  negara_usa: "https://api.chess.com/pub/country/US",
  negara_subdivisi: "https://api.chess.com/pub/country/gb-eng",
  negara_invalid: "https://tidak-tepercaya.test/country/ID",
};
const permintaanStatistik = [];
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json" },
});

globalThis.fetch = async (url) => {
  const jalur = new URL(url).pathname;
  if (jalur === "/club/blunder-skuad/members") {
    return json({ all_time: namaKlub.map((username) => ({ username })) });
  }
  const cocok = /^\/player\/([^/]+)(\/stats)?$/.exec(jalur);
  if (!cocok || !Object.hasOwn(statistikPemain, cocok[1])) return json({}, 404);
  const [, username, stats] = cocok;
  if (stats) {
    permintaanStatistik.push(username);
    if ((username === "legacy_b" && statistikGagal) || username === "negara_usa") return json({}, 503);
    return json(statistikPemain[username]);
  }
  if ((username === "gagal_profil" && profilGagal) || (username === "negara_gagal" && profilNegaraGagal)) {
    return json({}, 503);
  }
  return json({
    username,
    status: "basic",
    url: `https://www.chess.com/member/${username}`,
    country: negaraProfil[username],
    birthday: "1990-01-01",
  });
};
Object.defineProperty(globalThis, simbolKonteks, {
  configurable: true,
  value: { get: () => ({ waitUntil: (janji) => pekerjaanLatar.push(janji) }) },
});

const envPuncak = {
  KCI_DIR_DATA: dirPuncak,
  KCI_CHESS_DASAR: "https://chess-tiruan.test",
  KCI_CHESS_KLUB: "blunder-skuad",
  KCI_CHESS_KLUB_CACHE: "3600",
  KCI_CHESS_KLUB_PROFILE_CACHE: "3600",
  KCI_CHESS_KLUB_SNAPSHOT_SEGAR: "900",
  KCI_CHESS_KLUB_SNAPSHOT_TUNGGU: "7200",
  KCI_CHESS_KLUB_SAPU: "1",
  KCI_CHESS_KLUB_PENGAYAAN_MS: "3000",
  KCI_CHESS_RETRY: "1",
  SUPABASE_URL: "",
  KCI_SUPABASE_URL: "",
};
const envAsli = Object.fromEntries(Object.keys(envPuncak).map((k) => [k, process.env[k]]));
Object.assign(process.env, envPuncak);

try {
  const { rosterAnggota, segarkanRoster } = await import("../src/keanggotaan.js");
  const awal = await rosterAnggota();
  cek(
    "snapshot lama tetap langsung dikirim tanpa menunggu migrasi",
    awal.anggota.find((a) => a.username === "legacy_a")?.ratings.Rapid.puncak === undefined
  );
  cek("snapshot segar yang belum punya puncak menjadwalkan penyegaran latar", pekerjaanLatar.length === 1);
  await Promise.all(pekerjaanLatar.splice(0));

  let daftar = (await rosterAnggota()).anggota;
  cek("anggota baru tanpa profil tetap didahulukan", daftar.some((a) => a.username === "pendatang" && a.profilDiambilPada));
  cek("jumlah profil per penyegaran mengikuti batas", permintaanStatistik.length === 1 && permintaanStatistik[0] === "pendatang", permintaanStatistik.join(", "));
  cek("permintaan berikutnya tidak langsung mengulang penyegaran", pekerjaanLatar.length === 0);

  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  const a = daftar.find((item) => item.username === "legacy_a");
  cek("profil lama tanpa puncak didahulukan meski cap profil masih baru", a?.ratings.Rapid.puncak === 1910, JSON.stringify(a?.ratings));
  cek("puncak mengikuti kontrol waktu", a?.ratings.Blitz.puncak === 1555);
  cek("best yang tidak disediakan Chess.com tetap null", a?.ratings.Daily.puncak === null);
  cek("negara publik Chess.com ikut tersimpan saat migrasi puncak", a?.negara === "ID", JSON.stringify(a));
  cek("tanggal lahir profil tidak ikut dipublikasikan", !Object.hasOwn(a || {}, "birthday") && !Object.hasOwn(a || {}, "tanggalLahir"));
  cek("profil yang sudah punya puncak tidak mendahului profil lama", !permintaanStatistik.includes("sudah_lengkap"));

  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  const b = daftar.find((item) => item.username === "legacy_b");
  cek(
    "gangguan statistik tidak menghapus rating lama atau menandai migrasi selesai",
    b?.elo === 1700 && b.ratings?.Rapid?.elo === 1700 && !Object.hasOwn(b.ratings.Rapid, "puncak"),
    JSON.stringify(b)
  );

  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  const gagal = daftar.find((item) => item.username === "gagal_profil");
  cek(
    "gangguan profil mempertahankan data lama untuk dicoba kembali",
    gagal?.elo === 1600 && gagal.ratings?.Rapid?.elo === 1600 && !gagal.gagal,
    JSON.stringify(gagal)
  );

  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  cek("profil yang gagal tidak menghalangi migrasi pemain lain", daftar.find((a) => a.username === "legacy_c")?.ratings.Rapid.puncak === 1555);

  profilGagal = false;
  statistikGagal = false;
  await segarkanRoster();
  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  cek("profil yang sempat gagal berhasil diperbarui", daftar.find((a) => a.username === "gagal_profil")?.ratings.Rapid.puncak === 1655);
  cek("statistik yang sempat gagal berhasil diperbarui", daftar.find((a) => a.username === "legacy_b")?.ratings.Rapid.puncak === 1755);
  cek("puncak null dan rating kosong tidak ikut diambil ulang", !permintaanStatistik.includes("tanpa_best") && !permintaanStatistik.includes("tanpa_rating"));

  console.log("\nNegara pada snapshot lama");
  // Simulasikan snapshot lama yang sudah memiliki puncak, tetapi belum negara.
  for (const item of daftar.filter((anggota) => anggota.username.startsWith("negara_"))) {
    delete item.negara;
  }
  const waktuAsli = Date.now;
  try {
    Date.now = () => waktuAsli() + 120_000;
    await rosterAnggota();
    cek("snapshot segar tanpa negara menjadwalkan migrasi latar", pekerjaanLatar.length === 1);
    await Promise.all(pekerjaanLatar.splice(0));
  } finally {
    Date.now = waktuAsli;
  }
  daftar = (await rosterAnggota()).anggota;
  const gagalNegara = daftar.find((item) => item.username === "negara_gagal");
  cek("profil negara yang gagal tetap mempertahankan rating lama", gagalNegara?.elo === 1400 && !gagalNegara.gagal && !Object.hasOwn(gagalNegara, "negara"));

  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  const usa = daftar.find((item) => item.username === "negara_usa");
  cek("profil gagal tidak menghalangi negara pemain lain", usa?.negara === "US");
  cek("kegagalan statistik saat migrasi negara menjaga rating lama", usa?.elo === 1350 && usa.ratings?.Rapid?.puncak === 1450);

  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  cek("negara yang tidak tersedia disimpan sebagai null", daftar.find((item) => item.username === "negara_kosong")?.negara === null);

  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  cek("kode negara subdivisi dinormalisasi", daftar.find((item) => item.username === "negara_subdivisi")?.negara === "GB-ENG");

  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  cek("sumber negara tidak tepercaya tidak dipakai", daftar.find((item) => item.username === "negara_invalid")?.negara === null);

  profilNegaraGagal = false;
  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  cek("negara yang sempat gagal berhasil dicoba ulang", daftar.find((item) => item.username === "negara_gagal")?.negara === "ID");
  cek("negara dari snapshot tetap ada saat profil digunakan ulang", daftar.find((item) => item.username === "negara_usa")?.negara === "US");

  const { hapusCache } = await import("../src/chess.js");
  delete daftar.find((item) => item.username === "legacy_b").ratings.Rapid.puncak;
  delete daftar.find((item) => item.username === "negara_usa").negara;
  statistikGagal = true;
  hapusCache("legacy_b");
  await segarkanRoster();
  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  cek("puncak yang gagal tidak menghalangi migrasi negara", daftar.find((item) => item.username === "negara_usa")?.negara === "US");
  statistikGagal = false;
  hapusCache("legacy_b");
  await segarkanRoster();
  daftar = (await rosterAnggota()).anggota;
  cek("puncak yang tertunda tetap dicoba kembali", daftar.find((item) => item.username === "legacy_b")?.ratings.Rapid.puncak === 1755);

  try {
    Date.now = () => waktuAsli() + 240_000;
    await rosterAnggota();
    cek("negara null dan puncak null tidak memicu migrasi ulang", pekerjaanLatar.length === 0);
    await Promise.all(pekerjaanLatar.splice(0));
  } finally {
    Date.now = waktuAsli;
  }
} finally {
  globalThis.fetch = fetchAsli;
  if (konteksAsli) Object.defineProperty(globalThis, simbolKonteks, konteksAsli);
  else delete globalThis[simbolKonteks];
  for (const [k, nilai] of Object.entries(envAsli)) {
    if (nilai === undefined) delete process.env[k];
    else process.env[k] = nilai;
  }
  fs.rmSync(dirPuncak, { recursive: true, force: true });
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
