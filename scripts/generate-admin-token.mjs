/**
 * Generate token admin untuk demo/testing.
 *
 * Jalankan: node scripts/generate-admin-token.mjs
 */

import crypto from "node:crypto";

function generateAdminToken() {
  // Generate random token untuk demo
  const token = crypto.randomBytes(32).toString("hex");
  
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║           TOKEN ADMIN PENGURUS (DEMO)                         ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("Token ini digunakan untuk masuk ke dashboard pengurus.");
  console.log("Gunakan token ini di halaman /pengurus untuk demo.");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TOKEN ADMIN:");
  console.log(token);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("Cara penggunaan:");
  console.log("1. Buka halaman /pengurus di browser");
  console.log("2. Tempel token di atas ke kolom 'Token pengurus'");
  console.log("3. Tekan tombol 'Masuk'");
  console.log("");
  console.log("⚠️  PERINGATAN: Token ini hanya untuk demo/testing.");
  console.log("   Jangan gunakan di production environment.");
  console.log("");
}

generateAdminToken();