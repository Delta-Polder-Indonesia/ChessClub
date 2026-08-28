/**
 * Uji integrasi backend melalui HTTP sungguhan.
 *
 * Dua cara pakai:
 *
 *   1. OTOMATIS (disarankan) — skrip meluncurkan server uji sendiri pada
 *      port acak dengan direktori data SEMENTARA (lalu menghapusnya),
 *      jadi data asli di data/ tidak ikut berubah:
 *
 *          node server/uji/uji-backend.mjs
 *
 *   2. MENEMPEL ke server yang sudah berjalan (mis. server pengembangan):
 *
 *          KCI_DASAR=http://localhost:8787 node server/uji/uji-backend.mjs
 *
 *      Disarankan server itu juga memakai KCI_DIR_DATA sementara.
 *
 * Server mewajibkan header X-CSRF-Token untuk semua POST — skrip ini
 * mengambilnya dari GET /api/csrf-token lebih dulu.
 *
 * Pembatasan laju dihitung per IP. Tiap bagian uji memakai IP berbeda
 * (header X-Forwarded-For) agar kuota tidak saling memakan; bagian uji
 * pembatasan laju justru memakai SATU IP tetap supaya 429 benar-benar
 * terpicu.
 *
 * Tes yang berinteraksi dengan Chess.com membutuhkan akses internet ke
 * api.chess.com. Tanpa itu tes-tes tersebut DILEWATI (bukan gagal) dan
 * dicantumkan di ringkasan — jalankan lagi saat daring untuk uji penuh.
 */
import { luncurkanServerUji, ambilTokenCsrf } from "./alat-uji.mjs";

let lulus = 0;
let gagal = 0;
let dilewati = 0;
const kegagalan = [];
const terlewati = [];

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

/** Tandai tes sebagai dilewati (butuh internet ke api.chess.com). */
function lewati(nama) {
  dilewati++;
  terlewati.push(nama);
  console.log(`  ~ ${nama} (dilewati — butuh koneksi ke api.chess.com)`);
}

/** cek versi jaringan: bila Chess.com tak terjangkau, tandai dilewati. */
function cekNet(nama, syarat, rincian = "") {
  if (!daring) return lewati(nama);
  return cek(nama, syarat, rincian);
}

/* ------------------------------------------------------- peluncur server */

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

let hentikanUji = null;
let chessTiruanAktif = false;

function bersihkan() {
  hentikanUji?.();
  hentikanUji = null;
}

process.on("exit", bersihkan);
process.on("SIGINT", () => {
  bersihkan();
  process.exit(130);
});

/* ------------------------------------------------------------ panggilan */

let DASAR = process.env.KCI_DASAR || "http://localhost:8787";
let TOKEN = process.env.KCI_TOKEN_ADMIN || "";
const ADMIN_USER_UJI = process.env.KCI_ADMIN_USER || "admin";
const ADMIN_PASSWORD_UJI = process.env.KCI_ADMIN_PASSWORD || (process.env.KCI_DASAR ? "" : "admin123");
let csrfToken = "";
/** IP klien yang "terlihat" server — diganti-ganti agar kuota laju pisah. */
let ipSaatIni = "10.10.0.1";
let daring = false;

let penghitungIp = 0;
const ipBaru = () => `10.20.${Math.floor(penghitungIp / 250)}.${(penghitungIp++ % 250) + 1}`;

async function ambilCsrf() {
  csrfToken = await ambilTokenCsrf(DASAR);
}

async function panggil(metode, jalur, bodi, header = {}) {
  const res = await fetch(DASAR + jalur, {
    method: metode,
    headers: {
      ...(bodi ? { "Content-Type": "application/json" } : {}),
      ...(metode === "POST" ? { "X-CSRF-Token": csrfToken } : {}),
      ...(TOKEN ? { "X-Token-Admin": TOKEN } : {}),
      "X-Forwarded-For": ipSaatIni,
      ...header,
    },
    body: bodi ? JSON.stringify(bodi) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* biarkan null */
  }
  return { status: res.status, data, headers: res.headers };
}

const anggotaSah = (username, ubah = {}) => ({
  username,
  namaLengkap: "Budi Santoso",
  panggilan: "Budi",
  hp: "0812-3456-7890",
  kota: "Medan",
  tanggalLahir: "2000-01-01",
  setuju: true,
  ...ubah,
});

/* ------------------------------------------------------------ persiapan */

if (process.env.KCI_DASAR) {
  // Mode menempel: hanya bila pemanggil MENUNJUK server secara eksplisit.
  if (!(await serverHidup(DASAR))) {
    console.error(`Server di ${DASAR} tidak merespons.`);
    process.exit(1);
  }
  console.log(`\nMenguji backend yang sudah berjalan di ${DASAR}`);
} else {
  // Bawaan: server uji terisolasi — data asli tidak disentuh, Chess.com
  // ditiru lokal, token admin aktif agar jalur autentikasi ikut diuji.
  const hasil = await luncurkanServerUji();
  DASAR = hasil.dasar;
  TOKEN = hasil.token;
  hentikanUji = hasil.hentikan;
  chessTiruanAktif = hasil.chessTiruan;
  console.log(`\nMeluncurkan server uji terisolasi di ${DASAR} (data sementara)`);
}
if (TOKEN) console.log("  (token admin uji aktif — jalur autentikasi ikut diuji)");

await ambilCsrf();

// Tes yang membaca profil Chess.com bisa dijalankan bila:
//  - server uji kita sendiri yang berjalan (Chess.com tiruan aktif), atau
//  - api.chess.com asli terjangkau dari sini.
if (chessTiruanAktif) {
  daring = true;
  console.log("  (Chess.com tiruan aktif — seluruh skenario diuji tanpa internet)");
} else {
  try {
    const r = await fetch("https://api.chess.com/pub/player/magnuscarlsen", {
      method: "HEAD",
      signal: AbortSignal.timeout(4000),
    });
    daring = r.status > 0;
  } catch {
    daring = false;
  }
}
if (!daring) {
  console.log(
    "\nPERINGATAN: api.chess.com tidak terjangkau dari lingkungan ini." +
      "\nTes berlabel ~ dilewati; jalankan ulang saat daring (atau tanpa KCI_DASAR) untuk uji penuh."
  );
}

/* ------------------------------------------------------------ kesehatan */
console.log("\nKesehatan & rute dasar");
{
  ipSaatIni = ipBaru();
  const r = await panggil("GET", "/api/kesehatan");
  cek("GET /api/kesehatan -> 200", r.status === 200, `dapat ${r.status}`);
  cek("melaporkan status sehat", r.data?.status === "sehat");
  cek(
    "menerbitkan ID permintaan untuk penelusuran galat",
    /^[0-9a-f-]{36}$/i.test(r.headers.get("x-request-id") || "")
  );

  const nf = await panggil("GET", "/api/tidak-ada");
  cek("rute tak dikenal -> 404", nf.status === 404, `dapat ${nf.status}`);

  const anggota = await panggil("GET", "/api/anggota");
  cek("GET /api/anggota -> 200", anggota.status === 200);
  cek("mengembalikan array", Array.isArray(anggota.data));
  cek(
    "mengambil roster klub Chess.com tanpa akun ganda",
    anggota.data?.length === 3 &&
      anggota.data.some((a) => a.username === "magnuscarlsen") &&
      anggota.data.some((a) => a.username === "gothamchess") &&
      anggota.data.some((a) => a.username === "hikaru"),
    JSON.stringify(anggota.data)?.slice(0, 220)
  );
  const magnusKlub = anggota.data?.find((a) => a.username === "magnuscarlsen");
  cek(
    "menyertakan sumber dan tanggal gabung klub",
    magnusKlub?.sumberAnggota === "chesscom-klub" &&
      magnusKlub?.klubChess === "blunder-skuad" &&
      magnusKlub?.aktivitasKlub === "weekly" &&
      Boolean(magnusKlub?.daftarPada),
    JSON.stringify(magnusKlub)
  );
  cek(
    "tidak membocorkan hash identitas",
    !JSON.stringify(anggota.data).includes("identitas")
  );

  const csrf = await panggil("GET", "/api/csrf-token");
  cek("GET /api/csrf-token -> 200", csrf.status === 200);
  cek("menerbitkan token", Boolean(csrf.data?.token));
}

/* ------------------------------------------------------------- validasi */
console.log("\nValidasi masukan");
{
  // Tanpa token CSRF — proteksi harus menolak lebih dulu.
  const tanpaCsrf = await fetch(DASAR + "/api/anggota", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": ipBaru(),
    },
    body: JSON.stringify(anggotaSah("magnuscarlsen")),
  });
  cek("POST tanpa token CSRF -> 403", tanpaCsrf.status === 403, `dapat ${tanpaCsrf.status}`);

  ipSaatIni = ipBaru();
  const kosong = await panggil("POST", "/api/anggota", {});
  cek("formulir kosong -> 400", kosong.status === 400, `dapat ${kosong.status}`);
  const g = kosong.data?.galat || {};
  cek(
    "menyebut semua field wajib",
    g.username && g.namaLengkap && g.panggilan && g.hp && g.kota && g.tanggalLahir && g.setuju,
    JSON.stringify(g)
  );

  ipSaatIni = ipBaru();
  const hp = await panggil("POST", "/api/anggota", anggotaSah("magnuscarlsen", { hp: "123" }));
  cek("nomor HP tak valid -> 400", hp.status === 400 && hp.data?.galat?.hp, `dapat ${hp.status}`);

  ipSaatIni = ipBaru();
  const nama = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("magnuscarlsen", { namaLengkap: "Budi" })
  );
  cek("nama satu kata ditolak", nama.status === 400 && nama.data?.galat?.namaLengkap, `dapat ${nama.status}`);

  ipSaatIni = ipBaru();
  const setuju = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("magnuscarlsen", { setuju: false })
  );
  cek("belum setuju kode etik ditolak", setuju.status === 400 && setuju.data?.galat?.setuju, `dapat ${setuju.status}`);

  ipSaatIni = ipBaru();
  const lahir = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("magnuscarlsen", { tanggalLahir: "1890-01-01" })
  );
  cek("tanggal lahir mustahil ditolak", lahir.status === 400, `dapat ${lahir.status}`);

  ipSaatIni = ipBaru();
  const lahirKalender = await panggil(
    "POST",
    "/api/anggota",
    // 30 Februari tidak pernah ada di kalender — harus ditolak, bukan
    // di-rollover diam-diam menjadi 2 Maret oleh Date.
    anggotaSah("magnuscarlsen", { tanggalLahir: "2026-02-30" })
  );
  cek(
    "tanggal kalender mustahil (2026-02-30) ditolak",
    lahirKalender.status === 400 && lahirKalender.data?.galat?.tanggalLahir,
    `dapat ${lahirKalender.status}: ${JSON.stringify(lahirKalender.data?.galat)}`
  );

  ipSaatIni = ipBaru();
  const surel = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("magnuscarlsen", { email: "bukan-email" })
  );
  cek("email tak valid ditolak", surel.status === 400 && surel.data?.galat?.email, `dapat ${surel.status}`);

  ipSaatIni = ipBaru();
  const rusak = await fetch(DASAR + "/api/anggota", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
      "X-Forwarded-For": ipSaatIni,
    },
    body: "{bukan json",
  });
  cek("JSON rusak -> 400", rusak.status === 400, `dapat ${rusak.status}`);
}

/* ---------------------------------------------------------- pendaftaran */
console.log("\nPendaftaran & verifikasi Chess.com  (butuh api.chess.com)");
let pendaftaranBerhasil = false;
{
  ipSaatIni = ipBaru();
  const hantu = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("akuntidakada998877665", { hp: "0811-1111-1111" })
  );
  cekNet("akun Chess.com tak ada -> 404", hantu.status === 404, `dapat ${hantu.status}`);

  ipSaatIni = ipBaru();
  const luarKlub = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("di_luar_klub", { hp: "0811-2222-3333" })
  );
  cekNet(
    "akun di luar roster klub -> 403",
    luarKlub.status === 403 && luarKlub.data?.perluGabungKlub === true,
    `dapat ${luarKlub.status}`
  );

  ipSaatIni = ipBaru();
  const sah = await panggil("POST", "/api/anggota", anggotaSah("magnuscarlsen"));
  cekNet("pendaftaran sah -> 201", sah.status === 201, JSON.stringify(sah.data)?.slice(0, 160));
  if (daring) {
    cek("mengembalikan Elo dari Chess.com", typeof sah.data?.elo === "number");
    cek("menghitung kategori umur", Boolean(sah.data?.kategoriUmur));
    cek("tidak mengembalikan hash identitas", !("identitas" in (sah.data || {})));
    cek("tidak mengembalikan nomor HP", !JSON.stringify(sah.data).includes("62812"));
    pendaftaranBerhasil = sah.status === 201;
  }
  if (pendaftaranBerhasil) {
    ipSaatIni = ipBaru();
    const rosterSesudahDaftar = await panggil("GET", "/api/anggota");
    cek(
      "roster menandai data website sudah lengkap",
      rosterSesudahDaftar.data?.find((a) => a.username === "magnuscarlsen")
        ?.dataSitusLengkap === true &&
        rosterSesudahDaftar.data?.find((a) => a.username === "hikaru")
          ?.dataSitusLengkap === false,
      JSON.stringify(rosterSesudahDaftar.data)
    );

    const teksRoster = JSON.stringify(rosterSesudahDaftar.data);
    cek(
      "roster publik tidak membocorkan sidikPepper",
      !teksRoster.includes("sidikPepper")
    );
    cek(
      "roster publik tidak membocorkan kotaKunci/caraVerifikasi",
      !teksRoster.includes("kotaKunci") && !teksRoster.includes("caraVerifikasi")
    );

    ipSaatIni = ipBaru();
    const ulang = await panggil("POST", "/api/anggota", anggotaSah("magnuscarlsen"));
    cek("username sama -> 409", ulang.status === 409, `dapat ${ulang.status}`);
  } else if (daring) {
    cek("username sama -> 409", false, "pendaftaran awal gagal");
  } else {
    lewati("username sama -> 409");
  }
}

/* ------------------------------------------------- pencegahan akun ganda */
console.log("\nPencegahan akun ganda (anggota aktif)  (butuh api.chess.com)");
{
  if (!pendaftaranBerhasil) {
    lewati("HP sama format beda -> 409");
    lewati("nama+lahir sama -> 409");
    lewati("nomor lama di kolom DANA -> 409");
  } else {
    ipSaatIni = ipBaru();
    const gandaHp = await panggil(
      "POST",
      "/api/anggota",
      anggotaSah("gothamchess", { panggilan: "Budi2", hp: "+62 812 3456 7890" })
    );
    cek(
      "HP sama format beda -> 409",
      gandaHp.status === 409,
      JSON.stringify(gandaHp.data)?.slice(0, 140)
    );

    ipSaatIni = ipBaru();
    const gandaNama = await panggil(
      "POST",
      "/api/anggota",
      anggotaSah("gothamchess", { hp: "0857-1111-2222", namaLengkap: "budi   santoso" })
    );
    cek("nama+lahir sama -> 409", gandaNama.status === 409, `dapat ${gandaNama.status}`);

    ipSaatIni = ipBaru();
    const silangDana = await panggil(
      "POST",
      "/api/anggota",
      anggotaSah("gothamchess", {
        namaLengkap: "Andi Wijaya",
        hp: "0857-3333-4444",
        dana: "081234567890",
        tanggalLahir: "1995-05-05",
      })
    );
    cek("nomor lama di kolom DANA -> 409", silangDana.status === 409, `dapat ${silangDana.status}`);
  }
}

/* ------------------------------------------------------ keamanan admin */
console.log("\nKeamanan endpoint pengurus");
{
  ipSaatIni = ipBaru();
  const tanpa = await fetch(DASAR + "/api/pengurus/ringkasan", {
    headers: { "X-Forwarded-For": ipSaatIni },
  });
  if (TOKEN) {
    cek("tanpa token -> 401", tanpa.status === 401, `dapat ${tanpa.status}`);
    const salah = await fetch(DASAR + "/api/pengurus/ringkasan", {
      headers: { "X-Token-Admin": "token-salah-sekali", "X-Forwarded-For": ipSaatIni },
    });
    cek("token salah -> 401", salah.status === 401, `dapat ${salah.status}`);
    const benar = await panggil("GET", "/api/pengurus/ringkasan");
    cek("token benar -> 200", benar.status === 200, `dapat ${benar.status}`);

    // Endpoint verifikasi token yang ringan — dipakai ProtectedRoute/Gerbang
    // agar login dashboard tidak ikut gagal saat api.chess.com padam.
    ipSaatIni = ipBaru();
    const tanpaV = await fetch(DASAR + "/api/pengurus/verifikasi", {
      headers: { "X-Forwarded-For": ipSaatIni },
    });
    cek("verifikasi: tanpa token -> 401", tanpaV.status === 401, `dapat ${tanpaV.status}`);
    const benarV = await panggil("GET", "/api/pengurus/verifikasi");
    cek("verifikasi: token benar -> 200 {ok:true}", benarV.status === 200 && benarV.data?.ok === true, `dapat ${benarV.status}`);

    // Login dashboard username + password (dipakai halaman /pengurus).
    if (ADMIN_PASSWORD_UJI) {
      ipSaatIni = ipBaru();
      const loginSalah = await fetch(DASAR + "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": ipSaatIni,
        },
        body: JSON.stringify({ username: ADMIN_USER_UJI, password: "password-salah-uji" }),
      });
      cek("login dashboard: password salah -> 401", loginSalah.status === 401, `dapat ${loginSalah.status}`);

      ipSaatIni = ipBaru();
      const loginBenarRes = await fetch(DASAR + "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": ipSaatIni,
        },
        body: JSON.stringify({ username: ADMIN_USER_UJI, password: ADMIN_PASSWORD_UJI }),
      });
      const loginBenar = await loginBenarRes.json().catch(() => ({}));
      cek(
        "login dashboard: username/password benar -> 200",
        loginBenarRes.status === 200 && loginBenar?.ok === true && loginBenar?.token,
        `dapat ${loginBenarRes.status}`
      );
      const verifikasiTokenLogin = await fetch(DASAR + "/api/pengurus/verifikasi", {
        headers: {
          "X-Admin-User": loginBenar.username || ADMIN_USER_UJI,
          "X-Token-Admin": loginBenar.token || "",
          "X-Forwarded-For": ipSaatIni,
        },
      });
      cek(
        "token hasil login dashboard membuka endpoint pengurus",
        verifikasiTokenLogin.status === 200,
        `dapat ${verifikasiTokenLogin.status}`
      );
    } else {
      console.log("  ~ login dashboard username/password dilewati (KCI_ADMIN_PASSWORD tidak tersedia)");
    }

    // Riwayat masuk pengurus
    ipSaatIni = ipBaru();
    const loginPengurus = await panggil("POST", "/api/pengurus/masuk", {
      username: "magnuscarlsen",
    });
    cek("catat riwayat masuk: token benar -> 200", loginPengurus.status === 200 && loginPengurus.data?.ok === true, `dapat ${loginPengurus.status}`);
    cek("catat riwayat masuk: menyertakan username ternormalisasi", loginPengurus.data?.entri?.username === "magnuscarlsen");
    cek("catat riwayat masuk: menyertakan waktu ISO", Boolean(loginPengurus.data?.entri?.waktu));
    const entriId = loginPengurus.data?.entri?.id;

    const daftarMasuk = await panggil("GET", "/api/pengurus/riwayat-masuk");
    cek("ambil riwayat masuk -> 200", daftarMasuk.status === 200 && Array.isArray(daftarMasuk.data));
    cek("riwayat memuat entri login terbaru", daftarMasuk.data?.some((r) => r.id === entriId && r.username === "magnuscarlsen"));

    const ringkasSesudahMasuk = await panggil("GET", "/api/pengurus/ringkasan");
    cek("ringkasan memuat statistik riwayat masuk", typeof ringkasSesudahMasuk.data?.riwayatMasuk?.total === "number" && ringkasSesudahMasuk.data?.riwayatMasuk?.total >= 1);

    const hapusSatu = await panggil("POST", "/api/pengurus/riwayat-masuk/hapus", {
      id: entriId,
    });
    cek("hapus satu entri riwayat masuk -> 200", hapusSatu.status === 200);

    const bersihkanSemua = await panggil("POST", "/api/pengurus/riwayat-masuk/bersihkan");
    cek("bersihkan semua riwayat masuk -> 200", bersihkanSemua.status === 200);
    const daftarSetelahBersih = await panggil("GET", "/api/pengurus/riwayat-masuk");
    cek("riwayat masuk kosong setelah dibersihkan", daftarSetelahBersih.data?.length === 0);
  } else {
    cek("mode pengembangan: admin terbuka", tanpa.status === 200);
    console.log("      (jalankan ulang dengan KCI_TOKEN_ADMIN untuk uji autentikasi)");
  }
}

/* -------------------------------------------- daftar hitam & akun kecil */
console.log("\nDaftar hitam & pencegahan akun kecil  (butuh api.chess.com)");
{
  if (!pendaftaranBerhasil) {
    for (const n of [
      "blokir anggota -> 200",
      "identitas ikut tercatat",
      "sidik pepper tercatat",
      "akun kecil HP sama -> 403 diblokir",
      "akun kecil ganti HP, nama+lahir sama -> 403",
      "akun kecil lewat kolom DANA -> 403",
      "cek nomor terblokir",
      "cek nomor bersih",
      "anggota sah tetap bisa mendaftar -> 201",
      "cabut larangan -> 200",
      "nomor bersih setelah dicabut",
    ]) lewati(n);
  } else {
    ipSaatIni = ipBaru();
    const blokir = await panggil("POST", "/api/pengurus/blokir", {
      username: "magnuscarlsen",
      keterangan: "Terbukti memakai engine pada uji otomatis.",
    });
    cek("blokir anggota -> 200", blokir.status === 200, `dapat ${blokir.status}`);
    cek("identitas ikut tercatat", Object.keys(blokir.data?.identitas || {}).length > 0);
    cek("sidik pepper tercatat", Boolean(blokir.data?.sidikPepper));

    const kecilHp = await panggil(
      "POST",
      "/api/anggota",
      anggotaSah("gothamchess", { panggilan: "BudiBaru", hp: "0812 3456 7890" })
    );
    cek(
      "akun kecil HP sama -> 403 diblokir",
      kecilHp.status === 403 && kecilHp.data?.diblokir === true,
      `dapat ${kecilHp.status}`
    );

    ipSaatIni = ipBaru();
    const kecilNama = await panggil(
      "POST",
      "/api/anggota",
      anggotaSah("gothamchess", { hp: "0899-1111-2222", namaLengkap: "budi santoso" })
    );
    cek(
      "akun kecil ganti HP, nama+lahir sama -> 403",
      kecilNama.status === 403 && kecilNama.data?.diblokir === true,
      `dapat ${kecilNama.status}`
    );

    ipSaatIni = ipBaru();
    const kecilDana = await panggil(
      "POST",
      "/api/anggota",
      anggotaSah("gothamchess", {
        namaLengkap: "Andi Wijaya",
        hp: "0899-3333-4444",
        dana: "081234567890",
        tanggalLahir: "1995-05-05",
      })
    );
    cek(
      "akun kecil lewat kolom DANA -> 403",
      kecilDana.status === 403 && kecilDana.data?.diblokir === true,
      `dapat ${kecilDana.status}`
    );

    ipSaatIni = ipBaru();
    const cekNomor = await panggil("POST", "/api/pengurus/cek-nomor", {
      hp: "0812-3456-7890",
    });
    cek("cek nomor terblokir", cekNomor.data?.diblokir === true, JSON.stringify(cekNomor.data));

    const cekBersih = await panggil("POST", "/api/pengurus/cek-nomor", {
      hp: "0857-9999-8888",
    });
    cek("cek nomor bersih", cekBersih.data?.diblokir === false);

    ipSaatIni = ipBaru();
    const sah = await panggil(
      "POST",
      "/api/anggota",
      anggotaSah("gothamchess", {
        namaLengkap: "Siti Aminah",
        panggilan: "Siti",
        hp: "0857-9999-8888",
        kota: "Binjai",
        tanggalLahir: "1999-09-09",
      })
    );
    cek("anggota sah tetap bisa mendaftar -> 201", sah.status === 201, `dapat ${sah.status}`);

    const buka = await panggil("POST", "/api/pengurus/buka", {
      username: "magnuscarlsen",
    });
    cek("cabut larangan -> 200", buka.status === 200, `dapat ${buka.status}`);

    const setelahBuka = await panggil("POST", "/api/pengurus/cek-nomor", {
      hp: "0812-3456-7890",
    });
    cek("nomor bersih setelah dicabut", setelahBuka.data?.diblokir === false);

    // hikaru ada di roster klub tiruan, tetapi tidak pernah mengisi formulir.
    // Pengurus tetap harus bisa memblokirnya dari kegiatan situs/turnamen.
    const blokirRoster = await panggil("POST", "/api/pengurus/blokir", {
      username: "hikaru",
      keterangan: "Uji blokir anggota roster.",
    });
    cek(
      "anggota roster tanpa formulir dapat diblokir",
      blokirRoster.status === 200 && blokirRoster.data?.username === "hikaru",
      `dapat ${blokirRoster.status}`
    );
    const bukaRoster = await panggil("POST", "/api/pengurus/buka", {
      username: "hikaru",
    });
    cek("blokir anggota roster dapat dicabut", bukaRoster.status === 200);

    const pindaiRoster = await panggil("POST", "/api/pengurus/pindai");
    cek(
      "pindai fair play memeriksa seluruh roster klub",
      pindaiRoster.status === 200 && pindaiRoster.data?.diperiksa === 3,
      JSON.stringify(pindaiRoster.data)
    );
  }

  // Daftar hitam publik bisa diuji tanpa jaringan.
  ipSaatIni = ipBaru();
  const publik = await panggil("GET", "/api/daftar-hitam");
  cek("daftar hitam publik -> 200", publik.status === 200);
  cek(
    "daftar hitam publik tidak membocorkan hash",
    !JSON.stringify(publik.data).includes("identitas")
  );
}

/* ---------------------------------------------- persetujuan peserta turnamen */
console.log("\nPersetujuan peserta turnamen");
{
  ipSaatIni = ipBaru();
  const buat = await panggil("POST", "/api/pengurus/turnamen", {
    jenis: "bulanan",
    nama: "Turnamen Uji Persetujuan",
    status: "pendaftaran",
  });
  cek("pengurus membuat turnamen pendaftaran", buat.status === 201, JSON.stringify(buat.data));
  const id = buat.data?.id;

  if (id && daring) {
    ipSaatIni = ipBaru();
    const nonAnggota = await panggil("POST", `/api/turnamen/${id}/daftar`, {
      username: "bukananggota",
    });
    cek(
      "non-anggota ditolak dan diarahkan mendaftar",
      nonAnggota.status === 403 && nonAnggota.data?.harusDaftarAnggota === true,
      JSON.stringify(nonAnggota.data)
    );

    ipSaatIni = ipBaru();
    const ajukan = await panggil("POST", `/api/turnamen/${id}/daftar`, {
      username: "gothamchess",
    });
    cek(
      "anggota dengan data lengkap dapat mengirim pengajuan",
      ajukan.status === 201 && ajukan.data?.status === "menunggu",
      JSON.stringify(ajukan.data)
    );

    const ganda = await panggil("POST", `/api/turnamen/${id}/daftar`, {
      username: "gothamchess",
    });
    cek("pengajuan ganda ditolak", ganda.status === 409, JSON.stringify(ganda.data));

    ipSaatIni = ipBaru();
    const detail = await panggil("GET", `/api/pengurus/turnamen/${id}`);
    cek(
      "pengurus melihat pengajuan beserta usia akun",
      detail.status === 200 &&
        detail.data?.pengajuan?.[0]?.username === "gothamchess" &&
        Boolean(detail.data?.pengajuan?.[0]?.akunDibuatPada),
      JSON.stringify(detail.data?.pengajuan)
    );

    const terima = await panggil(
      "POST",
      `/api/pengurus/turnamen/${id}/pengajuan-terima`,
      { username: "gothamchess" }
    );
    cek("pengurus menerima pengajuan", terima.status === 200);

    const sesudah = await panggil("GET", `/api/pengurus/turnamen/${id}`);
    cek(
      "pengajuan diterima masuk daftar peserta",
      sesudah.data?.peserta?.some((p) => p.username === "gothamchess") &&
        sesudah.data?.pengajuan?.[0]?.status === "diterima",
      JSON.stringify(sesudah.data)
    );
    cek(
      "rincian pengurus menyertakan rating peserta",
      typeof sesudah.data?.peserta?.find((p) => p.username === "gothamchess")
        ?.rating === "number",
      JSON.stringify(sesudah.data?.peserta)
    );

    ipSaatIni = ipBaru();
    const belumLengkap = await panggil("POST", `/api/turnamen/${id}/daftar`, {
      username: "hikaru",
    });
    cek(
      "anggota roster tanpa data website ditolak",
      belumLengkap.status === 403 && belumLengkap.data?.dataSitusBelumLengkap === true,
      JSON.stringify(belumLengkap.data)
    );

    ipSaatIni = ipBaru();
    const lengkapiHikaru = await panggil(
      "POST",
      "/api/anggota",
      anggotaSah("hikaru", {
        namaLengkap: "Hikaru Nakamura",
        panggilan: "Hikaru",
        hp: "0814-5555-7777",
        tanggalLahir: "1987-12-09",
      })
    );
    cek("anggota melengkapi data website", lengkapiHikaru.status === 201);

    const ajukanKedua = await panggil("POST", `/api/turnamen/${id}/daftar`, {
      username: "hikaru",
    });
    cek("anggota kedua dapat mengajukan", ajukanKedua.status === 201);
    const tolak = await panggil(
      "POST",
      `/api/pengurus/turnamen/${id}/pengajuan-tolak`,
      { username: "hikaru", alasan: "Akun perlu peninjauan lanjutan." }
    );
    cek("pengurus dapat menolak pengajuan", tolak.status === 200);
    const setelahTolak = await panggil("GET", `/api/pengurus/turnamen/${id}`);
    cek(
      "pengajuan ditolak tidak masuk peserta",
      !setelahTolak.data?.peserta?.some((p) => p.username === "hikaru") &&
        setelahTolak.data?.pengajuan?.find((p) => p.username === "hikaru")?.status ===
          "ditolak",
      JSON.stringify(setelahTolak.data)
    );
  } else {
    for (const nama of [
      "non-anggota ditolak dan diarahkan mendaftar",
      "anggota dengan data lengkap dapat mengirim pengajuan",
      "pengajuan ganda ditolak",
      "pengurus melihat pengajuan beserta usia akun",
      "pengurus menerima pengajuan",
      "pengajuan diterima masuk daftar peserta",
      "anggota roster tanpa data website ditolak",
      "anggota melengkapi data website",
      "anggota kedua dapat mengajukan",
      "pengurus dapat menolak pengajuan",
      "pengajuan ditolak tidak masuk peserta",
    ]) lewati(nama);
  }
}

/* ------------------------------------------------ pencatatan hasil partai */
console.log("\nPencatatan hasil partai");
{
  ipSaatIni = ipBaru();
  const buat = await panggil("POST", "/api/pengurus/turnamen", {
    jenis: "bulanan",
    nama: "Turnamen Uji Hasil",
    status: "pendaftaran",
  });
  cek(
    "pengurus membuat turnamen untuk uji hasil",
    buat.status === 201,
    JSON.stringify(buat.data)
  );
  const id = buat.data?.id;

  if (id) {
    for (const u of ["magnuscarlsen", "gothamchess", "hikaru"]) {
      ipSaatIni = ipBaru();
      const dftr = await panggil(
        "POST",
        `/api/pengurus/turnamen/${id}/peserta`,
        { username: u }
      );
      cek(`peserta ${u} didaftarkan pengurus`, dftr.status === 201, JSON.stringify(dftr.data)?.slice(0, 120));
    }

    ipSaatIni = ipBaru();
    const hasil1 = await panggil(
      "POST",
      `/api/pengurus/turnamen/${id}/hasil`,
      { ronde: 1, putih: "magnuscarlsen", hitam: "gothamchess", skor: "1-0" }
    );
    cek("hasil ronde 1 tercatat", hasil1.status === 201, JSON.stringify(hasil1.data)?.slice(0, 120));

    ipSaatIni = ipBaru();
    const duplikat = await panggil(
      "POST",
      `/api/pengurus/turnamen/${id}/hasil`,
      { ronde: 1, putih: "magnuscarlsen", hitam: "gothamchess", skor: "0-1" }
    );
    cek("partai sama di ronde sama ditolak", duplikat.status === 409, `dapat ${duplikat.status}`);

    ipSaatIni = ipBaru();
    const duaKali = await panggil(
      "POST",
      `/api/pengurus/turnamen/${id}/hasil`,
      { ronde: 1, putih: "magnuscarlsen", hitam: "hikaru", skor: "1-0" }
    );
    cek(
      "pemain tidak bisa dua partai di ronde sama",
      duaKali.status === 409,
      JSON.stringify(duaKali.data)?.slice(0, 140)
    );

    ipSaatIni = ipBaru();
    const ronde2 = await panggil(
      "POST",
      `/api/pengurus/turnamen/${id}/hasil`,
      { ronde: 2, putih: "magnuscarlsen", hitam: "hikaru", skor: "0.5-0.5" }
    );
    cek("ronde berikutnya tetap bisa dicatat", ronde2.status === 201, `dapat ${ronde2.status}`);
  }
}

/* -------------------------------------------------------------- privasi */
console.log("\nPrivasi data pribadi");
{
  if (!pendaftaranBerhasil) {
    lewati("pengurus dapat melihat kontak");
    lewati("nomor tersimpan ternormalisasi");
  } else {
    ipSaatIni = ipBaru();
    const kontak = await panggil("GET", "/api/pengurus/kontak/gothamchess");
    cek("pengurus dapat melihat kontak", kontak.status === 200 && kontak.data?.hp);
    cek("nomor tersimpan ternormalisasi", kontak.data?.hp === "6285799998888", kontak.data?.hp);

    if (TOKEN) {
      const tanpaToken = await fetch(DASAR + "/api/pengurus/kontak/gothamchess", {
        headers: { "X-Forwarded-For": ipSaatIni },
      });
      cek("kontak terlindungi token -> 401", tanpaToken.status === 401, `dapat ${tanpaToken.status}`);
    }
  }

  ipSaatIni = ipBaru();
  const publik = await panggil("GET", "/api/anggota");
  const teks = JSON.stringify(publik.data);
  if (pendaftaranBerhasil) {
    cek("daftar publik tanpa nomor HP", !teks.includes("6285799998888"));
    cek("daftar publik tanpa nama lengkap asli", !teks.includes("Siti Aminah"));
  } else {
    // Tanpa data uji, cukup pastikan tidak ada kebocoran bentuk umum.
    cek("daftar publik tanpa field identitas", !teks.includes("identitas"));
  }
}

/* --------------------------------------------------------- batas laju */
console.log("\nPembatasan laju");
{
  // SATU IP tetap agar kuota habis dan 429 benar-benar muncul.
  ipSaatIni = "10.99.99.99";
  const hasil = [];
  for (let i = 0; i < 8; i++) {
    const r = await panggil("POST", "/api/anggota", anggotaSah("hikaru", { hp: "0813-0000-0001" }));
    hasil.push(r.status);
  }
  cek(
    "pendaftaran berlebih dibatasi (429)",
    hasil.includes(429),
    `status: ${hasil.join(",")}`
  );
  ipSaatIni = ipBaru();
}

/* ---------------------------------- anti brute-force endpoint pengurus */
console.log("\nAnti brute-force token pengurus");
if (TOKEN) {
  ipSaatIni = ipBaru();
  let terlihat429 = false;
  let terakhir = 0;
  // 6 percobaan token salah dalam satu jendela → 5 percobaan pertama
  // lolos ke handler (dibalas 401), percobaan ke-6 harus diblokir 429
  // SEBELUM sampai ke handler.
  for (let i = 0; i < 6; i++) {
    const r = await fetch(DASAR + "/api/pengurus/ringkasan", {
      headers: {
        "X-Token-Admin": `token-salah-${i}`,
        "X-Forwarded-For": ipSaatIni,
      },
    });
    terakhir = r.status;
    if (r.status === 429) terlihat429 = true;
  }
  cek(
    "percobaan token salah berulang diblokir 429",
    terlihat429,
    `status terakhir ${terakhir}`
  );

  // IP lain masih boleh mengakses.
  const ipLain = ipBaru();
  const rLain = await fetch(DASAR + "/api/pengurus/ringkasan", {
    headers: {
      "X-Token-Admin": TOKEN,
      "X-Forwarded-For": ipLain,
    },
  });
  cek("IP lain tidak terkena kunci", rLain.status === 200, `dapat ${rLain.status}`);
  ipSaatIni = ipBaru();
} else {
  lewati("percobaan token salah berulang diblokir 429");
  lewati("IP lain tidak terkena kunci");
}

/* --------------------------------------------- validasi pesan publik */
console.log("\nValidasi pesan publik");
{
  ipSaatIni = ipBaru();
  await ambilCsrf();
  const emailBodong = await panggil("POST", "/api/pesan", {
    nama: "Budi",
    email: "bukan-email",
    pesan: "halo",
  });
  cek("email tidak valid -> 400", emailBodong.status === 400, `dapat ${emailBodong.status}`);

  const pesanPanjang = await panggil("POST", "/api/pesan", {
    nama: "Budi",
    email: "budi@contoh.id",
    pesan: "x".repeat(6000),
  });
  cek("pesan terlalu panjang -> 400", pesanPanjang.status === 400, `dapat ${pesanPanjang.status}`);

  // Butuh IP baru: kuota pesan per IP adalah 5 per 15 menit.
  ipSaatIni = ipBaru();
  await ambilCsrf();
  const pesanSah = await panggil("POST", "/api/pesan", {
    nama: "Budi",
    email: "budi@contoh.id",
    pesan: "halo pengurus",
  });
  cek("pesan sah -> 201", pesanSah.status === 201, `dapat ${pesanSah.status}`);

  // Endpoint hapus-banyak sebelumnya selalu gagal karena membaca req.bodi
  // (tidak pernah diisi). Pastikan kontraknya berfungsi benar.
  ipSaatIni = ipBaru();
  const hapusTanpaId = await panggil("POST", "/api/pengurus/pesan/hapus-banyak", {});
  cek("hapus banyak tanpa id -> 400", hapusTanpaId.status === 400, `dapat ${hapusTanpaId.status}`);

  ipSaatIni = ipBaru();
  const hapusBanyak = await panggil("POST", "/api/pengurus/pesan/hapus-banyak", {
    ids: [pesanSah.data?.id].filter(Boolean),
  });
  cek("hapus banyak pesan -> 200", hapusBanyak.status === 200, `dapat ${hapusBanyak.status}: ${JSON.stringify(hapusBanyak.data)}`);
  ipSaatIni = ipBaru();
}

/* ------------------------------------------------------------ ringkasan */
console.log(`\n${"=".repeat(52)}`);
console.log(`  ${lulus} lulus, ${gagal} gagal, ${dilewati} dilewati`);
if (kegagalan.length) {
  console.log("\n  Yang gagal:");
  for (const k of kegagalan) console.log(`    - ${k}`);
}
if (terlewati.length) {
  console.log("\n  Dilewati (butuh koneksi ke api.chess.com):");
  for (const k of terlewati) console.log(`    - ${k}`);
}
console.log(`${"=".repeat(52)}\n`);
bersihkan();
process.exit(gagal ? 1 : 0);
