#!/usr/bin/env node
/**
 * Alat bantu pengurus Komunitas Catur Indonesia.
 *
 * Cara pakai (dari folder proyek):
 *
 *   node scripts/pengurus.mjs pindai
 *       Periksa semua anggota ke Chess.com. Siapa pun yang akunnya ditutup
 *       karena pelanggaran fair play otomatis dipindahkan ke daftar hitam.
 *
 *   node scripts/pengurus.mjs blokir <username> "alasan"
 *       Blokir anggota berdasarkan keputusan pengurus (mis. terbukti curang
 *       di turnamen internal). Identitasnya ikut tercatat sehingga akun
 *       kecil dengan nomor HP yang sama akan tertolak.
 *
 *   node scripts/pengurus.mjs cek <hp>
 *       Periksa apakah sebuah nomor HP ada di daftar hitam.
 *
 *   node scripts/pengurus.mjs daftar-hitam
 *       Tampilkan isi daftar hitam.
 *
 *   node scripts/pengurus.mjs buka <username>
 *       Cabut larangan (mis. banding diterima).
 *
 * PENTING: jalankan dengan KCI_PEPPER yang sama dengan server, jika tidak
 * hash identitas tidak akan cocok. Contoh:
 *   KCI_PEPPER="kalimat-rahasia-panjang" node scripts/pengurus.mjs pindai
 */
import fs from "node:fs";
import path from "node:path";
import {
  hashIdentitas,
  cariDiDaftarHitam,
  evaluasiStatusChess,
  sidikPepper,
  periksaPepper,
  LABEL_KUNCI,
} from "../server/src/identitas-server.js";
import { normalisasiHp, normalisasiUsername } from "../src/lib/identitas.js";

const DATA = path.resolve("data/anggota.json");
const HITAM = path.resolve("data/daftar-hitam.json");
const UA = "KomunitasCaturIndonesia/1.0 (contact: info@komunitascatur.or.id)";

const baca = (f, b) => {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return b;
  }
};
const tulis = (f, i) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(i, null, 2) + "\n");
};

/**
 * Hentikan bila pepper berbeda dari yang dipakai saat entri dibuat —
 * jika diteruskan, semua pencocokan gagal diam-diam dan pemain terlarang
 * akan tampak "aman".
 */
function pastikanPepper(hitam) {
  const beda = periksaPepper(hitam);
  if (!beda.length) return;
  console.error(
    `\nGALAT: KCI_PEPPER tidak cocok dengan ${beda.length} entri daftar hitam\n` +
      `       (${beda.map((h) => h.username).join(", ")}).\n\n` +
      `       Pepper saat ini : ${sidikPepper()}\n` +
      `       Dibutuhkan      : ${[...new Set(beda.map((h) => h.sidikPepper))].join(", ")}\n\n` +
      `       Gunakan KCI_PEPPER yang sama dengan saat entri dibuat, jika tidak\n` +
      `       pemain yang dilarang akan lolos tanpa terdeteksi.\n`
  );
  process.exit(1);
}

async function chessGet(p) {
  return fetch(`https://api.chess.com/pub${p}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
}

/* ------------------------------------------------------------- perintah */

async function pindai() {
  const anggota = baca(DATA, []);
  const hitam = baca(HITAM, []);
  pastikanPepper(hitam);
  if (!anggota.length) {
    console.log("Belum ada anggota terdaftar.");
    return;
  }

  console.log(`Memeriksa ${anggota.length} anggota ke Chess.com…\n`);
  const tersisa = [];
  let diblokir = 0;

  for (const a of anggota) {
    process.stdout.write(`  ${a.username.padEnd(24)} `);
    try {
      const res = await chessGet(`/player/${encodeURIComponent(a.username)}`);
      if (!res.ok) {
        console.log(res.status === 404 ? "akun hilang" : `gagal (${res.status})`);
        tersisa.push(a);
        continue;
      }
      const profil = await res.json();
      const st = evaluasiStatusChess(profil.status);

      if (st.diblokir) {
        hitam.push({
          username: a.username,
          playerId: profil.player_id ?? a.playerId ?? null,
          identitas: a.identitas || {},
          sidikPepper: sidikPepper(),
          alasan: st.alasan,
          keterangan: st.keterangan,
          sumber: "otomatis",
          diblokirPada: new Date().toISOString(),
        });
        diblokir += 1;
        console.log("DIBLOKIR — pelanggaran fair play");
        continue;
      }
      console.log(profil.status || "aktif");
      tersisa.push({ ...a, statusChess: profil.status || null });
    } catch (e) {
      console.log(`galat: ${e.message}`);
      tersisa.push(a);
    }
  }

  tulis(DATA, tersisa);
  tulis(HITAM, hitam);
  console.log(
    `\nSelesai. ${diblokir} anggota dipindahkan ke daftar hitam, ${tersisa.length} tetap aktif.`
  );
}

function blokir(username, alasanTeks) {
  const uname = normalisasiUsername(username);
  if (!uname) return console.error("Sebutkan username.");
  const anggota = baca(DATA, []);
  const hitam = baca(HITAM, []);
  pastikanPepper(hitam);

  const idx = anggota.findIndex((a) => a.username === uname);
  if (idx === -1) return console.error(`"${uname}" tidak ada di daftar anggota.`);
  if (hitam.some((h) => h.username === uname))
    return console.error(`"${uname}" sudah ada di daftar hitam.`);

  const a = anggota[idx];
  hitam.push({
    username: a.username,
    playerId: a.playerId ?? null,
    identitas: a.identitas || {},
    sidikPepper: sidikPepper(),
    alasan: "keputusan_pengurus",
    keterangan: alasanTeks || "Diblokir berdasarkan keputusan pengurus.",
    sumber: "pengurus",
    diblokirPada: new Date().toISOString(),
  });
  anggota.splice(idx, 1);
  tulis(DATA, anggota);
  tulis(HITAM, hitam);
  console.log(
    `"${uname}" diblokir. Identitasnya tercatat, sehingga pendaftaran ulang ` +
      `dengan nomor HP/DANA atau nama+tanggal lahir yang sama akan ditolak.`
  );
}

function buka(username) {
  const uname = normalisasiUsername(username);
  const hitam = baca(HITAM, []);
  const sisa = hitam.filter((h) => h.username !== uname);
  if (sisa.length === hitam.length)
    return console.error(`"${uname}" tidak ada di daftar hitam.`);
  tulis(HITAM, sisa);
  console.log(`Larangan untuk "${uname}" dicabut. Ia dapat mendaftar kembali.`);
}

function cek(hp) {
  const n = normalisasiHp(hp);
  if (!n) return console.error("Sebutkan nomor HP.");
  const hitam = baca(HITAM, []);
  pastikanPepper(hitam);
  const hash = { hp: hashIdentitas("hp", n) };
  const cocok = cariDiDaftarHitam(hash, hitam);
  if (cocok) {
    console.log(
      `DIBLOKIR — nomor ini cocok dengan "${cocok.entri.username}"\n` +
        `  alasan     : ${cocok.entri.alasan}\n` +
        `  keterangan : ${cocok.entri.keterangan}\n` +
        `  cocok pada : ${LABEL_KUNCI[cocok.jenis]}`
    );
  } else {
    console.log(`Aman — nomor ${n} tidak ada di daftar hitam.`);
  }
}

function tampilkan() {
  const hitam = baca(HITAM, []);
  if (!hitam.length) return console.log("Daftar hitam kosong.");
  console.log(`Daftar hitam (${hitam.length}):\n`);
  for (const h of hitam) {
    console.log(`  ${h.username}`);
    console.log(`    alasan     : ${h.alasan} (${h.sumber})`);
    console.log(`    keterangan : ${h.keterangan}`);
    console.log(`    sejak      : ${h.diblokirPada}`);
    console.log(`    kunci      : ${Object.keys(h.identitas || {}).join(", ") || "—"}\n`);
  }
}

/* ---------------------------------------------------------------- utama */

const [perintah, ...arg] = process.argv.slice(2);
switch (perintah) {
  case "pindai":
    await pindai();
    break;
  case "blokir":
    blokir(arg[0], arg.slice(1).join(" "));
    break;
  case "buka":
    buka(arg[0]);
    break;
  case "cek":
    cek(arg[0]);
    break;
  case "daftar-hitam":
    tampilkan();
    break;
  default:
    console.log(
      "Perintah: pindai | blokir <username> \"alasan\" | buka <username> | cek <hp> | daftar-hitam"
    );
}
