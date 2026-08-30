/**
 * Lapisan penyimpanan persisten melalui Supabase (PostgreSQL).
 *
 * Setiap "berkas" data aplikasi disimpan sebagai SATU BARIS pada tabel
 * `kci_storage` (kolom `id` = kunci relatif, `data` = isi JSON / JSONL).
 * Dengan begitu seluruh data yang ditulis saat runtime (anggota, turnamen,
 * berita, pengumuman, pesan, riwayat masuk, admins, jejak audit) bertahan
 * terhadap cold start / redeploy Vercel — tidak lagi hilang direntang
 * `/tmp`.
 *
 * Bila Supabase belum dikonfigurasi atau tabel `kci_storage` belum dibuat,
 * modul ini melaporkan "tidak siap" dan pemanggil (simpanan.js) tetap
 * memakai berkas lokal sebagai cadangan sehingga aplikasi tidak rusak.
 */
import path from "node:path";
import fsp from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { konfigurasi } from "./konfigurasi.js";

const TABEL = "kci_storage";

let klien = null;
let statusSiap = null; // null = belum dicek; true = siap; false = tidak siap

/** Apakah variabel Supabase sudah diisi pada environment? */
export function supabaseTerpasang() {
  return Boolean(
    konfigurasi.supabase.url &&
      (konfigurasi.supabase.serviceRole || konfigurasi.supabase.anon)
  );
}

function dapatkanKlien() {
  if (klien) return klien;
  klien = createClient(
    konfigurasi.supabase.url,
    konfigurasi.supabase.serviceRole || konfigurasi.supabase.anon,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return klien;
}

/**
 * Periksa (sekali per instance) apakah tabel `kci_storage` benar-benar ada
 * dan dapat dipakai. Juga menjadi gerbang bagi simpanan.js: jika tabel
 * belum dibuat, backend tetap memakai berkas sementara agar situs jalan.
 */
export async function supabaseSiap() {
  if (!supabaseTerpasang()) return false;
  if (statusSiap !== null) return statusSiap;

  const client = dapatkanKlien();
  try {
    const { error } = await client.from(TABEL).select("id").limit(1);
    if (error) {
      console.error(
        `[kci] Supabase belum siap (tabel "${TABEL}"): ${error.message}` +
          " — data memakai penyimpanan sementara sampai tabel dibuat."
      );
      statusSiap = false;
    } else {
      statusSiap = true;
    }
  } catch (e) {
    console.error(
      `[kci] Tidak dapat menghubungi Supabase: ${e?.message || e}` +
        " — data memakai penyimpanan sementara."
    );
    statusSiap = false;
  }
  return statusSiap;
}

/** Ubah path berkas absolut menjadi kunci relatif yang stabil (memakai '/'). */
function kunciRelatif(berkas) {
  const rel = path.relative(konfigurasi.dirData, berkas);
  return rel.split(path.sep).join("/");
}

async function bacaBaris(kunci) {
  const client = dapatkanKlien();
  const { data, error } = await client
    .from(TABEL)
    .select("id,data")
    .eq("id", kunci)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/** Baca berkas benih yang ikut ter-bundle (dipakai saat baris belum ada). */
async function bacaBenih(kunci) {
  const berkas = path.join(konfigurasi.dirSeed, kunci);
  try {
    const teks = await fsp.readFile(berkas, "utf8");
    return teks.trim() ? teks : null;
  } catch {
    return null;
  }
}

export async function bacaJsonSupabase(berkas, bawaan) {
  const kunci = kunciRelatif(berkas);
  const baris = await bacaBaris(kunci);
  if (baris) {
    const teks = baris.data || "";
    return teks.trim() ? JSON.parse(teks) : bawaan;
  }

  // Baris belum ada: coba benih (data publik yang di-commit ke Git) agar situs
  // tetap menampilkan data awal bahkan pada database yang masih kosong.
  const benih = await bacaBenih(kunci);
  if (benih) {
    const isi = JSON.parse(benih);
    try {
      await tulisJsonSupabase(berkas, isi);
    } catch {
      /* benih tetap dipakai walau gagal ditulis ke database */
    }
    return isi;
  }

  return bawaan;
}

export async function tulisJsonSupabase(berkas, isi) {
  const kunci = kunciRelatif(berkas);
  const client = dapatkanKlien();
  const teks = JSON.stringify(isi, null, 2) + "\n";
  const { error } = await client.from(TABEL).upsert({
    id: kunci,
    data: teks,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function tambahBarisSupabase(berkas, objek) {
  const kunci = kunciRelatif(berkas);
  const client = dapatkanKlien();
  const baris = await bacaBaris(kunci);
  const teks = (baris?.data || "") + JSON.stringify(objek) + "\n";
  const { error } = await client.from(TABEL).upsert({
    id: kunci,
    data: teks,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
