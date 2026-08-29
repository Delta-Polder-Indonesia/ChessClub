/**
 * Penyimpanan kredensial admin dengan role.
 * File utama: data/rahasia/admins.json
 * Format: { admins: [ { username, password, role, dibuatPada, diubahPada } ] }
 * role: "master" | "pengurus"
 * - master: bisa akses pengaturan, tambah/hapus admin, lihat riwayat masuk
 * - pengurus: tidak bisa masuk pengaturan
 *
 * Kompatibilitas:
 * - Jika ada file lama data/rahasia/admin.json (single object), akan dimigrasi jadi master.
 * - Jika tidak ada file, bawaan dari env KCI_ADMIN_USER/PASSWORD sebagai master.
 */
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { konfigurasi } from "./konfigurasi.js";

/** Hash password bila belum di-hash (idempoten). */
async function hashJikaPerlu(password) {
  const p = String(password || "");
  // Sudah format bcrypt → kembalikan apa adanya.
  if (p.startsWith("$2a$") || p.startsWith("$2b$")) return p;
  return bcrypt.hash(p, 12);
}

function berkasAdmins() {
  return path.join(konfigurasi.dirData, "rahasia", "admins.json");
}
function berkasAdminLama() {
  return path.join(konfigurasi.dirData, "rahasia", "admin.json");
}

function normalisasiAdmin(a) {
  if (!a || typeof a !== "object") return null;
  const u = String(a.username || "").trim().toLowerCase();
  const p = String(a.password || "");
  const r = String(a.role || "pengurus").trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,25}$/.test(u)) return null;
  if (p.length < 3) return null;
  const role = r === "master" ? "master" : "pengurus";
  return {
    username: u,
    password: p,
    role,
    dibuatPada: a.dibuatPada || new Date().toISOString(),
    diubahPada: a.diubahPada || a.dibuatPada || new Date().toISOString(),
  };
}

export async function bacaAdminsFile() {
  // coba file baru
  try {
    const teks = await fs.readFile(berkasAdmins(), "utf8");
    const data = JSON.parse(teks);
    const list = Array.isArray(data?.admins) ? data.admins : Array.isArray(data) ? data : [];
    const hasil = list.map(normalisasiAdmin).filter(Boolean);
    if (hasil.length) return hasil;
  } catch {}

  // coba file lama single
  try {
    const teks = await fs.readFile(berkasAdminLama(), "utf8");
    const data = JSON.parse(teks);
    const single = normalisasiAdmin(data);
    if (single) {
      // migrasi: jadikan master
      single.role = "master";
      return [single];
    }
  } catch {}

  return null;
}

export async function tulisAdminsFile(admins) {
  const berkas = berkasAdmins();
  const dir = path.dirname(berkas);
  await fs.mkdir(dir, { recursive: true });
  // Hash password sebelum menulis — idempoten (hash yang sudah di-hash tidak di-hash ulang).
  const belumHash = [];
  const list = (admins || []).map(normalisasiAdmin).filter(Boolean);
  for (const a of list) {
    if (a.password && !a.password.startsWith("$2")) {
      belumHash.push(a);
    }
  }
  if (belumHash.length) {
    await Promise.all(
      belumHash.map(async (a) => {
        a.password = await bcrypt.hash(a.password, 12);
      })
    );
  }
  // pastikan minimal ada 1 master
  if (!list.some((a) => a.role === "master")) {
    if (list.length) list[0].role = "master";
  }
  const data = {
    admins: list,
    diubahPada: new Date().toISOString(),
  };
  await fs.writeFile(berkas, JSON.stringify(data, null, 2) + "\n", "utf8");
  // update konfigurasi in-memory
  konfigurasi.admins = list;
  // master pertama jadi konfigurasi.admin untuk kompatibilitas lama
  const master = list.find((a) => a.role === "master") || list[0];
  if (master) {
    konfigurasi.admin.username = master.username;
    konfigurasi.admin.password = master.password;
  }
  return data;
}

// backward compat: baca single file lama
export async function bacaAdminFile() {
  const admins = await bacaAdminsFile();
  if (admins && admins.length) {
    const master = admins.find((a) => a.role === "master") || admins[0];
    return master ? { username: master.username, password: master.password } : null;
  }
  return null;
}

export async function tulisAdminFile({ username, password }) {
  // tulis sebagai master di file baru, preserve admins lain jika ada
  let admins = await bacaAdminsFile();
  if (!admins) {
    admins = [
      {
        username: String(username || "").trim().toLowerCase(),
        password: await hashJikaPerlu(password),
        role: "master",
        dibuatPada: new Date().toISOString(),
        diubahPada: new Date().toISOString(),
      },
    ];
  } else {
    // update master yang ada atau tambah
    const u = String(username || "").trim().toLowerCase();
    const idx = admins.findIndex((a) => a.username === u);
    if (idx >= 0) {
      admins[idx].password = password ? await hashJikaPerlu(password) : admins[idx].password;
      admins[idx].role = "master";
      admins[idx].diubahPada = new Date().toISOString();
    } else {
      // jika ganti username master, ganti master pertama
      const masterIdx = admins.findIndex((a) => a.role === "master");
      if (masterIdx >= 0) {
        admins[masterIdx].username = u;
        admins[masterIdx].password = password ? await hashJikaPerlu(password) : admins[masterIdx].password;
        admins[masterIdx].diubahPada = new Date().toISOString();
      } else {
        admins.unshift({
          username: u,
          password: await hashJikaPerlu(password),
          role: "master",
          dibuatPada: new Date().toISOString(),
          diubahPada: new Date().toISOString(),
        });
      }
    }
  }
  await tulisAdminsFile(admins);
  return { username, password: "***" }; // jangan kembalikan password asli
}

export async function muatAdminFileKeKonfigurasi() {
  const admins = await bacaAdminsFile();
  if (admins && admins.length) {
    // Hash password yang belum di-hash (idempoten).
    for (const a of admins) {
      if (a.password && !a.password.startsWith("$2")) {
        a.password = await bcrypt.hash(a.password, 12);
      }
    }
    konfigurasi.admins = admins;
    const master = admins.find((a) => a.role === "master") || admins[0];
    if (master) {
      konfigurasi.admin.username = master.username;
      konfigurasi.admin.password = master.password;
    }
    console.log(`[kci] ${admins.length} admin dimuat dari file: ${berkasAdmins()} (master: ${master?.username})`);
    return admins;
  }
  // tidak ada file -> buat bawaan master dari env
  const hashed = await hashJikaPerlu(konfigurasi.admin.password);
  const bawaan = {
    username: konfigurasi.admin.username,
    password: hashed,
    role: "master",
    dibuatPada: new Date().toISOString(),
    diubahPada: new Date().toISOString(),
  };
  konfigurasi.admin.password = hashed;
  konfigurasi.admins = [bawaan];
  return [bawaan];
}

// CRUD untuk master
export async function tambahAdmin({ username, password, role = "pengurus" }) {
  const u = String(username || "").trim().toLowerCase();
  const p = String(password || "");
  const r = role === "master" ? "master" : "pengurus";
  if (!/^[a-z0-9_-]{3,25}$/.test(u)) throw new Error("Username tidak valid (3-25 karakter).");
  if (p.length < 6) throw new Error("Password minimal 6 karakter.");
  let admins = await bacaAdminsFile();
  if (!admins) admins = await muatAdminFileKeKonfigurasi();
  if (admins.some((a) => a.username === u)) throw new Error(`Username "${u}" sudah ada.`);
  admins.push({
    username: u,
    password: await hashJikaPerlu(p),
    role: r,
    dibuatPada: new Date().toISOString(),
    diubahPada: new Date().toISOString(),
  });
  await tulisAdminsFile(admins);
  return admins;
}

export async function hapusAdmin(username) {
  const u = String(username || "").trim().toLowerCase();
  let admins = await bacaAdminsFile();
  if (!admins) throw new Error("Tidak ada data admin.");
  if (admins.length <= 1) throw new Error("Tidak bisa hapus admin terakhir.");
  const target = admins.find((a) => a.username === u);
  if (!target) throw new Error(`Admin "${u}" tidak ditemukan.`);
  if (target.role === "master" && admins.filter((a) => a.role === "master").length <= 1) {
    throw new Error("Tidak bisa hapus master terakhir. Minimal harus ada 1 master.");
  }
  admins = admins.filter((a) => a.username !== u);
  await tulisAdminsFile(admins);
  return admins;
}

export async function ubahAdmin(username, { password, role }) {
  const u = String(username || "").trim().toLowerCase();
  let admins = await bacaAdminsFile();
  if (!admins) throw new Error("Tidak ada data admin.");
  const idx = admins.findIndex((a) => a.username === u);
  if (idx < 0) throw new Error(`Admin "${u}" tidak ditemukan.`);
  if (password) {
    if (String(password).length < 6) throw new Error("Password minimal 6 karakter.");
    admins[idx].password = await hashJikaPerlu(password);
  }
  if (role) {
    const r = role === "master" ? "master" : "pengurus";
    // cegah hilangkan master terakhir
    if (admins[idx].role === "master" && r !== "master" && admins.filter((a) => a.role === "master").length <= 1) {
      throw new Error("Tidak bisa ubah role master terakhir menjadi pengurus.");
    }
    admins[idx].role = r;
  }
  admins[idx].diubahPada = new Date().toISOString();
  await tulisAdminsFile(admins);
  return admins;
}
