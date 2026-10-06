/**
 * Uji keamanan admin — regresi temuan survei/audit eksternal:
 *
 *  A1. Ganti password = layanan mandiri: pengurus TIDAK bisa naik jadi
 *      master lewat /api/pengurus/ganti-password, tidak bisa memakai
 *      password admin lain sebagai "password lama", dan tidak bisa
 *      mengambil alih username admin lain. Master tetap bisa mengganti
 *      password/username sendiri dengan role dipertahankan.
 *  A2. Perbaruan admin yang sudah ada tidak pernah memaksa role master
 *      (dicakup lewat A1 — role pengurus bertahan setelah ganti password).
 *  A3. Ambang panjang password (PANJANG_PASSWORD_MIN = 12) ditegakkan di
 *      lapisan rute dengan pesan 400 yang jelas.
 *  A4. Hash bcrypt (prefiks "$2") tidak pernah diterima sebagai token
 *      login (X-Token-Admin / Bearer) — baik di gerbang pastikanAdmin
 *      maupun pencocokan legacy dapatkanAdminDariRequest.
 *  A5. Pencocokan token lintas-username ditolak: bila header X-Admin-User
 *      diisi, token hanya boleh cocok dengan password admin itu.
 *
 *  Plus jaring "alur normal tetap jalan": login JWT master/pengurus,
 *  /verifikasi mengembalikan role, CRUD admin master-only, dan tokenAdmin
 *  legacy masih sah.
 *
 * Jalankan: node server/uji/uji-keamanan-admin.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { luncurkanServerUji, ambilTokenCsrf } from "./alat-uji.mjs";
import { konfigurasi } from "../src/konfigurasi.js";
import { dapatkanAdminDariRequest } from "../src/http.js";

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

/* --------------------------------------- unit: A4/A5 dapatkanAdminDariRequest */

function ujiUnitPencocokanToken() {
  console.log("Unit — pencocokan token legacy (A4/A5):");
  // Bentuk hash bcrypt yang valid; nilainya tidak perlu bisa diverifikasi,
  // yang diuji adalah PENOLAKANNYA sebagai token.
  const hashContoh = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7ZBpDLm0r5eXtQe0aJfVfKmLqJ8rNqW";
  const adminsAsli = konfigurasi.admins;
  const adminAsli = konfigurasi.admin;
  const tokenAsli = konfigurasi.tokenAdmin;
  try {
    konfigurasi.admins = [
      { username: "mentah", password: "rahasia-mentah-1", role: "pengurus" },
      { username: "terhash", password: hashContoh, role: "master" },
    ];
    konfigurasi.admin = { username: "", password: "" };
    konfigurasi.tokenAdmin = "";
    const req = (headers) => ({ headers });

    cek(
      "token plaintext cocok dengan username pemiliknya → diterima",
      dapatkanAdminDariRequest(
        req({ "x-token-admin": "rahasia-mentah-1", "x-admin-user": "mentah" })
      )?.username === "mentah"
    );
    cek(
      "A5: token admin lain + X-Admin-User berbeda → ditolak (tanpa cocok lintas username)",
      dapatkanAdminDariRequest(
        req({ "x-token-admin": "rahasia-mentah-1", "x-admin-user": "terhash" })
      ) === null
    );
    cek(
      "A5: token plaintext TANPA header username → identitas mengikuti pemilik token",
      dapatkanAdminDariRequest(req({ "x-token-admin": "rahasia-mentah-1" }))?.username === "mentah"
    );
    cek(
      "A4: hash bcrypt sebagai token + username pemilik hash → ditolak",
      dapatkanAdminDariRequest(
        req({ "x-token-admin": hashContoh, "x-admin-user": "terhash" })
      ) === null
    );
    cek(
      "A4: hash bcrypt sebagai token tanpa username → ditolak",
      dapatkanAdminDariRequest(req({ "x-token-admin": hashContoh })) === null
    );
    cek("tanpa token → null", dapatkanAdminDariRequest(req({})) === null);
  } finally {
    konfigurasi.admins = adminsAsli;
    konfigurasi.admin = adminAsli;
    konfigurasi.tokenAdmin = tokenAsli;
  }
}

/* ------------------------------------------------------------- integrasi HTTP */

async function jalankan() {
  console.log("\n🔐 UJI KEAMANAN ADMIN (A1–A5 + alur normal)\n");
  ujiUnitPencocokanToken();

  const { dasar, token, hentikan, dirData } = await luncurkanServerUji();
  const csrf = await ambilTokenCsrf(dasar);

  // Pembatasan laju login dihitung per IP — tiap kelompok panggilan memakai
  // IP klien berbeda lewat X-Forwarded-For (harness menyetel KCI_JUMLAH_PROXY=1).
  let hitungIp = 0;
  let ipSaatIni = `10.40.0.${++hitungIp}`;
  const ipBaru = () => {
    ipSaatIni = `10.40.0.${++hitungIp}`;
  };

  async function panggil(metode, jalur, bodi, header = {}) {
    const res = await fetch(dasar + jalur, {
      method: metode,
      headers: {
        ...(bodi ? { "Content-Type": "application/json" } : {}),
        ...(metode === "POST" ? { "X-CSRF-Token": csrf } : {}),
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
    return { status: res.status, data };
  }

  const authMaster = (jwt) => ({ "X-Token-Admin": jwt, "X-Admin-User": "admin" });

  try {
    /* ------------------------------------------------- alur normal: master */
    console.log("\nAlur normal — login & verifikasi master:");
    ipBaru();
    const masukMaster = await panggil("POST", "/api/auth/login", {
      username: "admin",
      password: "admin123",
    });
    const jwtMaster = masukMaster.data?.token || "";
    cek("login master → 200", masukMaster.status === 200);
    cek("login master mengembalikan JWT (3 segmen)", jwtMaster.split(".").length === 3);
    cek("login master role=master", masukMaster.data?.role === "master");

    const verifikasiMaster = await panggil("GET", "/api/pengurus/verifikasi", null, authMaster(jwtMaster));
    cek("GET /verifikasi dengan JWT → 200 role master", verifikasiMaster.status === 200 && verifikasiMaster.data?.role === "master");

    const daftarAdmins = await panggil("GET", "/api/pengurus/admins", null, authMaster(jwtMaster));
    cek("GET /admins (master) → 200 berisi 1 admin", daftarAdmins.status === 200 && Array.isArray(daftarAdmins.data) && daftarAdmins.data.length === 1);

    /* ---------------------------------------- alur normal: buat admin pengurus */
    console.log("\nAlur normal — master menambah admin pengurus:");
    ipBaru();
    const PASS_PENGURUS = "cukup-panjang-12";
    const tambah = await panggil(
      "POST",
      "/api/pengurus/admins/tambah",
      { username: "pengurus1", password: PASS_PENGURUS, role: "pengurus" },
      authMaster(jwtMaster)
    );
    cek("POST /admins/tambah (master) → 201", tambah.status === 201);

    const masukPengurus = await panggil("POST", "/api/auth/login", {
      username: "pengurus1",
      password: PASS_PENGURUS,
    });
    const jwtPengurus = masukPengurus.data?.token || "";
    cek("login pengurus → 200 role pengurus", masukPengurus.status === 200 && masukPengurus.data?.role === "pengurus");

    let authPengurus = { "X-Token-Admin": jwtPengurus, "X-Admin-User": "pengurus1" };

    /* --------------------------------------------- CRUD admin = master-only */
    console.log("\nCRUD admin master-only:");
    const adminsPengurus = await panggil("GET", "/api/pengurus/admins", null, authPengurus);
    cek("GET /admins (pengurus) → 403", adminsPengurus.status === 403);
    const tambahPengurus = await panggil(
      "POST",
      "/api/pengurus/admins/tambah",
      { username: "pengurus2", password: "juga-panjang-123", role: "pengurus" },
      authPengurus
    );
    cek("POST /admins/tambah (pengurus) → 403", tambahPengurus.status === 403);

    /* ------------------------------------------------- A1: layanan mandiri */
    console.log("\nA1 — ganti password adalah layanan mandiri:");
    ipBaru();
    const PASS_PENGURUS_BARU = "pengurus-pass-baru";
    const gpPengurus = await panggil(
      "POST",
      "/api/pengurus/ganti-password",
      { passwordLama: PASS_PENGURUS, passwordBaru: PASS_PENGURUS_BARU },
      authPengurus
    );
    cek("pengurus ganti password sendiri → 200", gpPengurus.status === 200, JSON.stringify(gpPengurus.data));
    cek("respons mengembalikan username sendiri", gpPengurus.data?.username === "pengurus1");

    ipBaru();
    const masukUlang = await panggil("POST", "/api/auth/login", {
      username: "pengurus1",
      password: PASS_PENGURUS_BARU,
    });
    cek("login dengan password baru → 200", masukUlang.status === 200);
    cek("A1/A2: role TETAP pengurus setelah ganti password (tidak naik jadi master)", masukUlang.data?.role === "pengurus");
    const jwtLama = await panggil("GET", "/api/pengurus/verifikasi", null, {
      "X-Token-Admin": jwtPengurus,
      "X-Admin-User": "pengurus1",
    });
    cek("JWT sebelum ganti password langsung dicabut → 401", jwtLama.status === 401);
    // Password change mencabut JWT lama; lanjutkan pengujian dengan sesi baru.
    authPengurus = {
      "X-Token-Admin": masukUlang.data?.token || "",
      "X-Admin-User": "pengurus1",
    };

    ipBaru();
    const masukLama = await panggil("POST", "/api/auth/login", {
      username: "pengurus1",
      password: PASS_PENGURUS,
    });
    cek("password lama ditolak setelah diganti → 401", masukLama.status === 401);

    ipBaru();
    const masukMasterLagi = await panggil("POST", "/api/auth/login", {
      username: "admin",
      password: "admin123",
    });
    cek("A1: akun master tidak tersentuh perubahan pengurus → login 200", masukMasterLagi.status === 200 && masukMasterLagi.data?.role === "master");

    ipBaru();
    const gpPassMaster = await panggil(
      "POST",
      "/api/pengurus/ganti-password",
      { passwordLama: "admin123", passwordBaru: "pengurus-pass-lain" },
      authPengurus
    );
    cek("A1: password master sebagai passwordLama pengurus → 401", gpPassMaster.status === 401);

    ipBaru();
    const masihBisa = await panggil("POST", "/api/auth/login", {
      username: "pengurus1",
      password: PASS_PENGURUS_BARU,
    });
    cek("percobaan gagal tidak mengubah password pengurus → login tetap 200", masihBisa.status === 200);

    ipBaru();
    const gpAmbilAlih = await panggil(
      "POST",
      "/api/pengurus/ganti-password",
      { passwordLama: PASS_PENGURUS_BARU, passwordBaru: "pengurus-pass-ok1", usernameBaru: "admin" },
      authPengurus
    );
    cek("A1: pengurus mengambil alih username master → 400", gpAmbilAlih.status === 400, JSON.stringify(gpAmbilAlih.data));

    /* ------------------------------------------------------ A3: ambang 12 */
    console.log("\nA3 — ambang panjang password di lapisan rute:");
    ipBaru();
    const gpPendek = await panggil(
      "POST",
      "/api/pengurus/ganti-password",
      { passwordLama: "admin123", passwordBaru: "pendek12345" }, // 11 karakter
      authMaster(jwtMaster)
    );
    cek("password baru 11 karakter → 400", gpPendek.status === 400);
    cek("pesan menyebut minimal 12 karakter", /minimal 12/i.test(gpPendek.data?.pesan || ""));

    ipBaru();
    const gpBawaan = await panggil(
      "POST",
      "/api/pengurus/ganti-password",
      { passwordLama: "admin123", passwordBaru: "admin123" },
      authMaster(jwtMaster)
    );
    cek("password bawaan admin123 → 400", gpBawaan.status === 400);

    /* ------------------------------------------- A4: hash bukan token login */
    console.log("\nA4 — hash bcrypt tidak sah sebagai token login:");
    const berkasAdmins = JSON.parse(
      fs.readFileSync(path.join(dirData, "rahasia", "admins.json"), "utf8")
    );
    const hashMaster = berkasAdmins.admins.find((a) => a.role === "master")?.password;
    cek("admins.json menyimpan password sebagai hash bcrypt", typeof hashMaster === "string" && hashMaster.startsWith("$2"));

    const verPakaiHash = await panggil("GET", "/api/pengurus/verifikasi", null, {
      "X-Token-Admin": hashMaster,
      "X-Admin-User": "admin",
    });
    cek("hash bcrypt sebagai X-Token-Admin (+username) → 401", verPakaiHash.status === 401);

    const adminsPakaiHash = await panggil("GET", "/api/pengurus/admins", null, {
      Authorization: `Bearer ${hashMaster}`,
    });
    cek("hash bcrypt sebagai Bearer → 401", adminsPakaiHash.status === 401);

    const hashPengurus = berkasAdmins.admins.find((a) => a.username === "pengurus1")?.password;
    const verPakaiHashPengurus = await panggil("GET", "/api/pengurus/verifikasi", null, {
      "X-Token-Admin": hashPengurus,
    });
    cek("hash bcrypt pengurus sebagai token → 401", verPakaiHashPengurus.status === 401);

    /* --------------------------------------------- alur normal: token lama */
    console.log("\nAlur normal — kompatibilitas tokenAdmin legacy:");
    const verLegacy = await panggil("GET", "/api/pengurus/verifikasi", null, {
      "X-Token-Admin": token,
    });
    cek("tokenAdmin legacy → 200 role master", verLegacy.status === 200 && verLegacy.data?.role === "master");

    /* ------------------------------------ A1: master ganti username+password */
    console.log("\nA1 — master ganti password & username sendiri (role bertahan):");
    ipBaru();
    const gpMaster = await panggil(
      "POST",
      "/api/pengurus/ganti-password",
      { passwordLama: "admin123", passwordBaru: "master-pass-baru1", usernameBaru: "masterbaru" },
      authMaster(jwtMaster)
    );
    cek("master ganti password+username → 200", gpMaster.status === 200, JSON.stringify(gpMaster.data));
    cek("respons mengembalikan username baru", gpMaster.data?.username === "masterbaru");

    ipBaru();
    const masukMasterBaru = await panggil("POST", "/api/auth/login", {
      username: "masterbaru",
      password: "master-pass-baru1",
    });
    cek("login username baru → 200 dan role TETAP master", masukMasterBaru.status === 200 && masukMasterBaru.data?.role === "master");

    ipBaru();
    const masukMasterLama = await panggil("POST", "/api/auth/login", {
      username: "admin",
      password: "admin123",
    });
    cek("username+password master lama ditolak → 401", masukMasterLama.status === 401);
  } finally {
    hentikan();
  }

  console.log(`\nRINGKASAN: ${lulus} lulus, ${gagal} gagal`);
  if (gagal) {
    console.log("Gagal:");
    for (const nama of kegagalan) console.log(`  - ${nama}`);
    process.exit(1);
  }
}

jalankan().catch((e) => {
  console.error(e);
  process.exit(1);
});
