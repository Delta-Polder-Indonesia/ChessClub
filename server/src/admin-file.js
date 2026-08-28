/**
 * Penyimpanan kredensial admin sederhana di file.
 * File: data/rahasia/admin.json (gitignored)
 * Format: { username, password }
 * Jika file ada, nilainya override env KCI_ADMIN_USER/PASSWORD.
 * Ini memungkinkan ganti password lewat dashboard tanpa edit env.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { konfigurasi } from "./konfigurasi.js";

function berkasAdmin() {
  return path.join(konfigurasi.dirData, "rahasia", "admin.json");
}

export async function bacaAdminFile() {
  try {
    const teks = await fs.readFile(berkasAdmin(), "utf8");
    const data = JSON.parse(teks);
    if (!data || typeof data !== "object") return null;
    const u = String(data.username || "").trim().toLowerCase();
    const p = String(data.password || "");
    if (!u || !p) return null;
    if (!/^[a-z0-9_-]{3,25}$/.test(u)) return null;
    if (p.length < 3) return null;
    return { username: u, password: p };
  } catch {
    return null;
  }
}

export async function tulisAdminFile({ username, password }) {
  const berkas = berkasAdmin();
  const dir = path.dirname(berkas);
  await fs.mkdir(dir, { recursive: true });
  const data = {
    username: String(username || "").trim().toLowerCase(),
    password: String(password || ""),
    diubahPada: new Date().toISOString(),
  };
  await fs.writeFile(berkas, JSON.stringify(data, null, 2) + "\n", "utf8");
  return data;
}

// Sinkronisasi awal: jika file ada, override konfigurasi.admin
export async function muatAdminFileKeKonfigurasi() {
  const file = await bacaAdminFile();
  if (file) {
    konfigurasi.admin.username = file.username;
    konfigurasi.admin.password = file.password;
    console.log(`[kci] Kredensial admin dimuat dari file: ${berkasAdmin()} (user: ${file.username})`);
  }
}
