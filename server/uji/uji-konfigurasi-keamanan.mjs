/**
 * Regresi konfigurasi keamanan produksi.
 * Memastikan default admin dan secret JWT tidak dapat lolos sebagai konfigurasi produksi.
 */

let gagal = 0;
let lolos = 0;

function cek(kondisi, pesan) {
  if (kondisi) {
    lolos += 1;
    console.log(`  ✅ ${pesan}`);
  } else {
    gagal += 1;
    console.error(`  ❌ ${pesan}`);
  }
}

async function muat(env) {
  const sebelumnya = {};
  for (const k of [
    "NODE_ENV",
    "KCI_ASAL_DIIZINKAN",
    "KCI_PEPPER",
    "KCI_ADMIN_USER",
    "KCI_ADMIN_PASSWORD",
    "KCI_JWT_SECRET",
  ]) {
    sebelumnya[k] = process.env[k];
    if (Object.prototype.hasOwnProperty.call(env, k)) process.env[k] = env[k];
    else delete process.env[k];
  }

  const suffix = `?uji=${Date.now()}-${Math.random()}`;
  const mod = await import(`../src/konfigurasi.js${suffix}`);
  const hasil = mod.periksaProduksi();

  for (const [k, v] of Object.entries(sebelumnya)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return hasil;
}

async function jalankan() {
  console.log("\n🧪 UJI KONFIGURASI KEAMANAN\n");

  const defaultProduksi = await muat({
    NODE_ENV: "production",
    KCI_ASAL_DIIZINKAN: "https://contoh.invalid",
    KCI_PEPPER: "pepper-aman-minimal-16",
    KCI_ADMIN_USER: "admin",
    KCI_ADMIN_PASSWORD: "admin123",
    KCI_JWT_SECRET: "jwt-secret-aman-minimal-24-karakter",
  });
  cek(
    defaultProduksi.some((m) => /KCI_ADMIN_PASSWORD/.test(m)),
    "admin123 ditolak di produksi"
  );

  const passwordTerlaluPendek = await muat({
    NODE_ENV: "production",
    KCI_ASAL_DIIZINKAN: "https://contoh.invalid",
    KCI_PEPPER: "pepper-aman-minimal-16",
    KCI_ADMIN_USER: "admin",
    KCI_ADMIN_PASSWORD: "12345",
    KCI_JWT_SECRET: "jwt-secret-aman-minimal-24-karakter",
  });
  cek(
    passwordTerlaluPendek.some((m) => /KCI_ADMIN_PASSWORD/.test(m)),
    "password admin 5 karakter ditolak"
  );

  const passwordKuat = await muat({
    NODE_ENV: "production",
    KCI_ASAL_DIIZINKAN: "https://contoh.invalid",
    KCI_PEPPER: "pepper-aman-minimal-16",
    KCI_ADMIN_USER: "admin",
    KCI_ADMIN_PASSWORD: "password-produksi-yang-kuat-2026",
    KCI_JWT_SECRET: "jwt-secret-aman-minimal-24-karakter",
  });
  cek(
    !passwordKuat.some((m) => /KCI_ADMIN_PASSWORD/.test(m)),
    "password admin kuat diterima"
  );

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Hasil: ${lolos} lolos, ${gagal} gagal`);
  if (gagal) process.exitCode = 1;
}

jalankan().catch((e) => {
  console.error("Galat fatal:", e);
  process.exit(1);
});