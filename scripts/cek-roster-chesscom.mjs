#!/usr/bin/env node
/**
 * CEK DAFTAR ANGGOTA: bandingkan snapshot situs dengan roster klub Chess.com.
 *
 * Menjawab pertanyaan "apakah daftar anggota ikut berubah?" dengan angka:
 *   - kelompok mana saja yang dibaca dari Chess.com dan berapa isinya;
 *   - berapa anggota di snapshot situs, kapan snapshot itu disegarkan, dan
 *     sudah berapa lama;
 *   - SIAPA yang ada di Chess.com tetapi belum ada di situs (beserta tanggal
 *     bergabungnya) dan sebaliknya;
 *   - bila diminta, apakah foto profil di snapshot sudah sama dengan yang
 *     sekarang dipakai di Chess.com (`--cek-foto`, memakai API profil).
 *
 * Jalankan dengan environment yang SAMA seperti server (KCI_DIR_DATA /
 * SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) supaya snapshot yang dibaca
 * memang snapshot produksi:
 *
 *   node scripts/cek-roster-chesscom.mjs
 *   node scripts/cek-roster-chesscom.mjs --cek-foto
 *
 * Keluar dengan kode 1 bila ada selisih, supaya bisa dipakai di cron/CI.
 */
import { konfigurasi } from "../server/src/konfigurasi.js";
import { bacaJson } from "../server/src/simpanan.js";
import { ambilAnggotaKlub, ambilProfil } from "../server/src/chess.js";

const CLUB = konfigurasi.chess.klub.slug;
const cekFoto = process.argv.includes("--cek-foto");

const kunci = (v) => String(v || "").trim().toLowerCase();
const tanggal = (unix) =>
  Number.isFinite(Number(unix)) && Number(unix) > 0
    ? new Date(Number(unix) * 1000).toISOString().slice(0, 10)
    : "?";

function jam(iso) {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / 3_600_000;
}

console.log(`\n=== Cek roster "${CLUB}" ===\n`);
console.log(`Sumber snapshot : ${konfigurasi.berkasRosterAnggota}`);

/* ------------------------------------------------------------- Chess.com */
let dariChess = null;
try {
  const res = await ambilAnggotaKlub(CLUB, { pakaiCache: false });
  if (!res.ada) {
    console.error(`\nGALAT: klub "${CLUB}" tidak ditemukan di Chess.com (HTTP ${res.status}).`);
    process.exit(1);
  }
  dariChess = res.data;
} catch (e) {
  console.error(`\nGALAT: gagal menghubungi api.chess.com — ${e?.message || e}`);
  console.error("Jalankan skrip ini di mesin yang punya akses internet (atau di server).");
  process.exit(1);
}

const grup = ["weekly", "monthly", "all_time"];
const unikChess = new Map();
for (const g of grup) {
  const daftar = Array.isArray(dariChess[g]) ? dariChess[g] : [];
  console.log(`Chess.com ${g.padEnd(9)}: ${daftar.length} entri`);
  for (const m of daftar) {
    const u = kunci(m?.username);
    if (!u) continue;
    const lama = unikChess.get(u);
    if (!lama || (m?.joined && (!lama.joined || m.joined < lama.joined))) {
      unikChess.set(u, { username: u, joined: m?.joined, aktivitas: g });
    }
  }
}
console.log(`Chess.com TOTAL  : ${unikChess.size} anggota unik`);

/* --------------------------------------------------------------- snapshot */
const snapshot = await bacaJson(konfigurasi.berkasRosterAnggota, {
  diperbaruiPada: null,
  klubChess: null,
  anggota: [],
});
const anggotaSnapshot = Array.isArray(snapshot?.anggota) ? snapshot.anggota : [];
const umur = jam(snapshot?.diperbaruiPada);

console.log(
  `\nSnapshot situs  : ${anggotaSnapshot.length} anggota` +
    `\n  diperbarui    : ${snapshot?.diperbaruiPada || "(belum pernah)"}` +
    (umur === null
      ? " — BELUM PERNAH disegarkan"
      : ` — ${umur.toFixed(1)} jam lalu${umur > 24 ? "  ⚠ TERTINGGAL" : ""}`) +
    `\n  klub          : ${snapshot?.klubChess || "(tidak tercatat)"}`
);
if (snapshot?.klubChess && snapshot.klubChess !== CLUB) {
  console.log(`  ⚠ snapshot berasal dari klub lain ("${snapshot.klubChess}") — akan diabaikan server`);
}
const berCap = anggotaSnapshot.filter((a) => a.profilDiambilPada).length;
console.log(`  cap profil    : ${berCap}/${anggotaSnapshot.length} anggota punya cap waktu data Chess.com`);

/* ----------------------------------------------------------------- selisih */
const snapshotPer = new Map(
  anggotaSnapshot.filter((a) => a?.username).map((a) => [kunci(a.username), a])
);
const belumAda = [...unikChess.values()].filter((m) => !snapshotPer.has(m.username));
const sudahKeluar = [...snapshotPer.keys()].filter((u) => !unikChess.has(u));

console.log(`\n--- Selisih ---`);
if (belumAda.length) {
  console.log(`\nDi Chess.com tetapi BELUM ada di situs (${belumAda.length}):`);
  for (const m of belumAda.sort((a, b) => (b.joined || 0) - (a.joined || 0))) {
    console.log(`  + ${m.username.padEnd(24)} bergabung ${tanggal(m.joined)} (${m.aktivitas})`);
  }
  console.log(
    "\n  Tindakan: buka /pengurus → tab Anggota → tombol \"Segarkan dari Chess.com\"," +
      "\n  atau POST /api/pengurus/segarkan-roster. Penyegaran otomatis dibatasi cache" +
      "\n  daftar klub (KCI_CHESS_KLUB_CACHE, bawaan 12 jam — mengikuti ritme Chess.com)."
  );
} else {
  console.log("✓ Semua anggota Chess.com sudah ada di snapshot situs.");
}
if (sudahKeluar.length) {
  console.log(`\nMasih ada di situs tetapi TIDAK ada lagi di Chess.com (${sudahKeluar.length}):`);
  for (const u of sudahKeluar.slice(0, 30)) console.log(`  - ${u}`);
  if (sudahKeluar.length > 30) console.log(`  … dan ${sudahKeluar.length - 30} lainnya`);
  console.log("  (Biasanya anggota keluar dari klub; snapshot akan menyesuaikan sendiri.)");
}

/* -------------------------------------------------------------- foto profil */
if (cekFoto) {
  const contoh = anggotaSnapshot.slice(0, 25);
  console.log(`\n--- Foto profil (sampel ${contoh.length} anggota) ---`);
  let beda = 0;
  let diperiksa = 0;
  for (const a of contoh) {
    const profil = await ambilProfil(a.username, { pakaiCache: false });
    if (!profil.ada) continue;
    diperiksa++;
    const sekarang = profil.data?.avatar || "";
    const tersimpan = a.foto || "";
    if (sekarang !== tersimpan) {
      beda++;
      console.log(`  ~ ${a.username}: foto di situs ${tersimpan ? "berbeda" : "kosong"} dari Chess.com`);
    }
  }
  console.log(
    beda
      ? `  ${beda} dari ${diperiksa} anggota fotonya berbeda → snapshot perlu disegarkan (tombol pengurus).`
      : `  ✓ Semua foto pada sampel sudah sama dengan Chess.com (${diperiksa} diperiksa).`
  );
}

const adaSelisih = belumAda.length > 0 || (umur !== null && umur > 24);
console.log(
  `\nKESIMPULAN: ${
    umur === null
      ? "snapshot belum pernah dibuat — situs akan menyusunnya saat pertama diakses."
      : adaSelisih
        ? "daftar situs TERTINGGAL dari Chess.com — jalankan penyegaran paksa dari dashboard pengurus."
        : "daftar situs masih sejalan dengan Chess.com."
  }\n`
);
process.exit(adaSelisih ? 1 : 0);
