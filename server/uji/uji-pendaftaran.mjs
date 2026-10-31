/**
 * Uji keamanan alur PENDAFTARAN ANGGOTA (end-to-end lewat HTTP).
 *
 * Server uji dijalankan dengan Chess.com tiruan (alat-uji) sehingga tidak
 * menyentuh akun nyata dan tidak butuh internet. KCI_JWT_SECRET disamakan
 * dengan proses uji ini supaya tiket dapat diterbitkan/diatur di sini lalu
 * diperiksa server — sama seperti yang terjadi saat OAuth callback sukses.
 *
 * Yang diperiksa di sini (temuan audit):
 *  - mode `wajib` benar-benar dipaksa server, bukan dihias UI;
 *  - tiket terikat username, sekali pakai, kedaluwarsa, dan tidak dapat
 *    dipalsukan; tiket tetap sah setelah server restart (tanpa keadaan);
 *  - field keamanan dari browser (mode/sumber/kode/profil/terverifikasi)
 *    tidak menentukan apa pun;
 *  - aturan username sama di kedua sisi;
 *  - duplikasi (termasuk beda kapitalisasi) dan klik ganda ditolak atomik;
 *  - tanggal lahir (format, kabisat, masa depan) dan umur divalidasi server;
 *  - daftar hitam berlaku untuk varian kapitalisasi/spasi/tautan;
 *  - POST tanpa CSRF ditolak.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.KCI_PEPPER = "pepper-uji-pendaftaran-yang-panjang-cukup";
/* Rahasia yang sama dipakai anak (server uji) dan proses ini, sehingga tiket
   yang diterbitkan di sini dapat diverifikasi oleh server. */
process.env.KCI_JWT_SECRET = "rahasa-uji-pendaftaran-yang-cukup-panjang";

const { luncurkanServerUji, ambilTokenCsrf, nyalakanPeniruChess } = await import(
  "./alat-uji.mjs"
);
const oauth = await import("../src/oauth.js");
const konfigurasi = (await import("../src/konfigurasi.js")).konfigurasi;

let lulus = 0;
let gagal = 0;
const cek = (nama, syarat, rincian = "") => {
  if (syarat) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}${rincian ? `\n      ${rincian}` : ""}`);
  }
};

const DIRENDE = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-daftar-"));

/** Data formulir sah (semua wajib diisi dengan benar). */
const formulir = (lebih = {}) => ({
  username: "hikaru",
  namaLengkap: "Hikaru Nakamura",
  panggilan: "Hikaru",
  hp: "0812-3456-7890",
  kota: "Medan",
  tanggalLahir: "1990-05-20",
  setuju: true,
  ...lebih,
});

/**
 * @param {{dirData?: string, env?: object}} opsi
 */
async function serverUji({ dirData = DIRENDE, env = {} } = {}) {
  const peniru = await nyalakanPeniruChess();
  const hasil = await luncurkanServerUji({
    chessDasar: peniru.dasar,
    env: {
      KCI_DIR_DATA: dirData,
      KCI_BATAS_DAFTAR: "500",
      KCI_BATAS_UMUM: "5000",
      ...env,
    },
  });
  return {
    ...hasil,
    hentikan: () => {
      hasil.hentikan();
      peniru.server.close();
    },
    hentikanDanTunggu: async () => {
      const keluar = hasil.tungguBerhenti();
      hasil.hentikan();
      peniru.server.close();
      await keluar;
    },
  };
}

function pembuatKirim(dasar, csrfToken, ip) {
  return async function kirim(jalur, bodi, opsi = {}) {
    const r = await fetch(dasar + jalur, {
      method: opsi.metode || "POST",
      headers: {
        "Content-Type": "application/json",
        ...(opsi.tanpaCsrf ? {} : { "X-CSRF-Token": csrfToken }),
        ...(opsi.token ? { "X-Token-Admin": opsi.token } : {}),
        "X-Forwarded-For": ip,
      },
      body: opsi.mentah === true ? bodi : JSON.stringify(bodi ?? {}),
    });
    return { status: r.status, data: await r.json().catch(() => null) };
  };
}

/** Baca berkas data yang ditulis server (untuk memastikan isi tersimpan). */
function bacaBerkas(nama, dir = DIRENDE) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, nama), "utf8"));
  } catch {
    return null;
  }
}

/* ============================================================ MODE OPSIONAL */

console.log("\nPendaftaran — mode default `opsional` (server A)");
{
  const server = await serverUji();
  const csrf = await ambilTokenCsrf(server.dasar);
  const IP = "10.44.0.1";
  const kirim = pembuatKirim(server.dasar, csrf, IP);

  const tanpaCsrf = await fetch(server.dasar + "/api/anggota", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": IP },
    body: JSON.stringify(formulir()),
  });
  cek("POST /api/anggota tanpa CSRF -> 403", tanpaCsrf.status === 403, `dapat ${tanpaCsrf.status}`);
  await tanpaCsrf.body?.cancel?.();

  const sah = await kirim("/api/anggota", formulir());
  cek(
    "data valid -> 201",
    sah.status === 201,
    JSON.stringify(sah.data)?.slice(0, 200)
  );

  const disimpan = (bacaBerkas("anggota.json") || []).find(
    (a) => a.username === "hikaru"
  );
  cek(
    "mode opsional tanpa tiket: TIDAK ditandai terverifikasi",
    disimpan && disimpan.terverifikasi === false && !disimpan.caraVerifikasi,
    JSON.stringify(disimpan)
  );
  cek(
    "field publik tidak memuat data pribadi",
    sah.data &&
      !("hp" in sah.data) &&
      !("email" in sah.data) &&
      !("tanggalLahir" in sah.data) &&
      !("umur" in sah.data) &&
      !("identitas" in sah.data) &&
      !("sidikPepper" in sah.data),
    JSON.stringify(sah.data)?.slice(0, 200)
  );
  const rosterPublik = await (await fetch(`${server.dasar}/api/anggota`)).json();
  const hikaruPublik = Array.isArray(rosterPublik) ? rosterPublik.find((anggota) => anggota.username === "hikaru") : null;
  cek(
    "roster tidak mempublikasikan tanggal lahir formulir atau umur hasil hitungannya",
    Boolean(hikaruPublik) && !("tanggalLahir" in hikaruPublik) && !("umur" in hikaruPublik)
  );

  /* Field "keamanan" dari browser harus diabaikan sama sekali. */
  const sokTahu = await kirim(
    "/api/anggota",
    formulir({
      username: "gothamchess",
      terverifikasi: true,
      mode: "wajib",
      hp: "0812-3456-7800",
      sumber: "login chess.com",
      kode: "KCI-PALSU1",
      usernameVerifikasi: "gothamchess",
      profil: { location: "KCI-PALSU1", verified: true },
      namaLengkap: "Levy Rozman",
      panggilan: "Levy",
    })
  );
  const sokTahuTersimpan = (bacaBerkas("anggota.json") || []).find(
    (a) => a.username === "gothamchess"
  );
  cek(
    "frontend tidak bisa menetapkan status terverifikasi lewat field",
    sokTahu.status === 201 && sokTahuTersimpan?.terverifikasi === false,
    JSON.stringify(sokTahuTersimpan)
  );

  /* Duplikasi — termasuk kapitalisasi dan bentuk tautan. */
  const ganda = await kirim("/api/anggota", formulir({ hp: "0812-3456-7891" }));
  cek("username duplikat -> 409", ganda.status === 409, `dapat ${ganda.status}`);

  const gandaKapital = await kirim(
    "/api/anggota",
    formulir({ username: "  HIKARU ", hp: "0812-3456-7892" })
  );
  cek(
    "duplikasi beda kapitalisasi/spasi -> 409",
    gandaKapital.status === 409,
    JSON.stringify(gandaKapital.data)?.slice(0, 160)
  );

  const jumlahHikaru = (bacaBerkas("anggota.json") || []).filter(
    (a) => a.username === "hikaru"
  ).length;
  cek("tidak ada baris ganda di penyimpanan", jumlahHikaru === 1, `dapat ${jumlahHikaru}`);

  /* Aturan username kanonik (identik dengan UI). */
  for (const [nama, nilai, harusDitolak] of [
    ["kosong", "", true],
    ["2 karakter", "ab", true],
    ["25 karakter", "m".repeat(25), false],
    ["26 karakter", "m".repeat(26), true],
    ["30 karakter", "m".repeat(30), true],
    ["karakter terlarang", "budi@nako", true],
    ["spasi di tengah", "budi catur", true],
    ["kapital dinormalisasi", "GoThamChess", false],
    ["tautan profil", "https://www.chess.com/member/hikaru", false],
    ["awalan @", "@hikaru", false],
  ]) {
    const r = await kirim(
      "/api/anggota",
      formulir({ username: nilai, hp: "0812-3456-7893", namaLengkap: "Uji One Two", tanggalLahir: "1990-01-01" })
    );
    const ditolak = r.status === 400;
    cek(`username ${nama} -> ${harusDitolak ? "ditolak" : "lolos validasi format"}`, ditolak === harusDitolak, `status ${r.status}`);
  }

  const kabisat = await kirim(
    "/api/anggota",
    formulir({ username: "gothamchess", namaLengkap: "Levy Rozman", panggilan: "Levy", tanggalLahir: "2000-02-29", hp: "0812-3456-7894" })
  );
  cek(
    "tanggal kabisat 29 Feb 2000 diterima",
    kabisat.status !== 400 || kabisat.data?.galat?.tanggalLahir === undefined,
    JSON.stringify(kabisat.data)?.slice(0, 160)
  );
  for (const [nama, tanggal] of [
    ["30 Februari", "2026-02-30"],
    ["format slash", "14/08/1990"],
    ["bulan 13", "1990-13-01"],
    ["string aneh", "bukan-tanggal"],
    ["masa depan", "2999-01-01"],
    ["umur < 5", "2025-01-01"],
    ["umur > 100", "1900-01-01"],
  ]) {
    const r = await kirim(
      "/api/anggota",
      formulir({ username: "magnuscarlsen", tanggalLahir: tanggal, hp: "0812-9999-0001" })
    );
    cek(
      `tanggal lahir ${nama} -> 400 + pesan per field`,
      r.status === 400 && Boolean(r.data?.galat?.tanggalLahir),
      JSON.stringify(r.data)?.slice(0, 160)
    );
  }

  /* Daftar hitam: varian penulisan tidak boleh lolos. */
  fs.writeFileSync(
    path.join(DIRENDE, "daftar-hitam.json"),
    JSON.stringify([
      {
        username: "magnuscarlsen",
        alasan: "keputusan_pengurus",
        keterangan: "uji",
        sumber: "pengurus",
        identitas: {},
      },
    ])
  );
  for (const varian of ["magnuscarlsen", "MAGNUSCARLSEN", "  MagnusCarlsen ", "https://www.chess.com/member/magnuscarlsen"]) {
    const r = await kirim(
      "/api/anggota",
      formulir({ username: varian, hp: "0812-9999-0002" })
    );
    cek(
      `daftar hitam menolak varian "${varian.slice(0, 22)}…"`,
      r.status === 403 && r.data?.diblokir === true,
      `status ${r.status}`
    );
  }

  /* Luar klub tetap ditolak meskipun datanya sah. */
  const luar = await kirim(
    "/api/anggota",
    formulir({ username: "di_luar_klub", hp: "0812-3456-7899", namaLengkap: "Pemain Luar" })
  );
  cek(
    "belum bergabung klub -> 403 + petunjuk",
    luar.status === 403 && luar.data?.perluGabungKlub === true,
    JSON.stringify(luar.data)?.slice(0, 160)
  );

  /* Tiket (mode opsional): tiket untuk username lain ditolak; tiket untuk
     username yang sama diterima dan menandai terverifikasi. */
  const tiketOrang = oauth.terbitkanTiket("hikaru", "oauth").tiket;
  const pakaiSalah = await kirim(
    "/api/anggota",
    formulir({ username: "magnuscarlsen", tiketVerifikasi: tiketOrang, hp: "0812-3456-7900", namaLengkap: "Magnus Carlsen", panggilan: "Magnus" })
  );
  cek(
    "tiket milik username lain -> 403 username-beda",
    pakaiSalah.status === 403 && pakaiSalah.data?.kodeVerifikasi === "username-beda",
    JSON.stringify(pakaiSalah.data)?.slice(0, 180)
  );

  server.hentikan();
}

/* ================================================== KLIK GANDA / RACE */

console.log("\nPendaftaran — klik ganda dan permintaan bersamaan");
{
  fs.rmSync(path.join(DIRENDE, "anggota.json"), { force: true });
  const server = await serverUji();
  const csrf = await ambilTokenCsrf(server.dasar);
  const kirim = pembuatKirim(server.dasar, csrf, "10.44.0.2");

  const [a, b] = await Promise.all([
    kirim("/api/anggota", formulir({ hp: "0812-1111-2222" })),
    kirim("/api/anggota", formulir({ hp: "0812-1111-2222" })),
  ]);
  const statusnya = [a.status, b.status].sort();
  const tersimpan = (bacaBerkas("anggota.json") || []).filter(
    (x) => x.username === "hikaru"
  );
  cek(
    "dua submit bersamaan: satu 201, satu 409",
    statusnya[0] === 201 && statusnya[1] === 409,
    JSON.stringify(statusnya)
  );
  cek(
    "dua submit bersamaan tidak menghasilkan dua anggota",
    tersimpan.length === 1,
    `dapat ${tersimpan.length} baris`
  );

  server.hentikan();
}

/* ================================================== MODE WAJIB (server B) */

console.log("\nPendaftaran — mode `wajib` (tiket benar-benar dipaksa)");
{
  const DIR_WAJIB = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-wajib-"));
  const server = await serverUji({
    dirData: DIR_WAJIB,
    env: { KCI_WAJIB_VERIFIKASI: "wajib" },
  });
  const csrf = await ambilTokenCsrf(server.dasar);
  const kirim = pembuatKirim(server.dasar, csrf, "10.44.0.3");

  const tanpaTiket = await kirim("/api/anggota", formulir());
  cek(
    "tiket kosong saat mode wajib -> 403 + perluVerifikasi",
    tanpaTiket.status === 403 &&
      tanpaTiket.data?.perluVerifikasi === true &&
      tanpaTiket.data?.kodeVerifikasi === "kosong",
    JSON.stringify(tanpaTiket.data)?.slice(0, 200)
  );

  const palsu = await kirim(
    "/api/anggota",
    formulir({ tiketVerifikasi: "kci1.e30.bm9wZQ" })
  );
  cek(
    "tiket palsu -> 403 tidak-sah",
    palsu.status === 403 && palsu.data?.kodeVerifikasi === "tidak-sah",
    JSON.stringify(palsu.data)?.slice(0, 180)
  );

  const { tiket, berlakuDetik } = oauth.terbitkanTiket("HIKARU", "oauth");
  cek("tiket uji terbit", Boolean(tiket) && berlakuDetik > 0);

  const sah = await kirim("/api/anggota", formulir({ tiketVerifikasi: tiket }));
  cek(
    "tiket OAuth sah -> 201",
    sah.status === 201,
    JSON.stringify(sah.data)?.slice(0, 200)
  );
  const entri = (bacaBerkas("anggota.json", DIR_WAJIB) || []).find(
    (x) => x.username === "hikaru"
  );
  cek(
    "status terverifikasi berasal dari tiket server",
    entri?.terverifikasi === true && entri?.caraVerifikasi === "oauth",
    JSON.stringify(entri)?.slice(0, 200)
  );

  const replay = await kirim(
    "/api/anggota",
    formulir({ tiketVerifikasi: tiket, hp: "0812-3456-0001" })
  );
  cek(
    "tiket tidak dapat dipakai ulang (replay)",
    replay.status !== 201 &&
      ["sudah-dipakai", "username-beda", "kedaluwarsa"].includes(replay.data?.kodeVerifikasi),
    JSON.stringify(replay.data)?.slice(0, 180)
  );

  konfigurasi.tiket.umurDetik = -1;
  const basi = oauth.terbitkanTiket("hikaru", "oauth").tiket;
  konfigurasi.tiket.umurDetik = 30 * 60;
  const pakaiBasi = await kirim(
    "/api/anggota",
    formulir({ username: "gothamchess", namaLengkap: "Levy Rozman", panggilan: "Levy", hp: "0812-5555-6666", tiketVerifikasi: basi })
  );
  cek(
    "tiket kedaluwarsa -> 403 dengan pesan kedaluwarsa",
    pakaiBasi.status === 403 && pakaiBasi.data?.kodeVerifikasi === "kedaluwarsa",
    JSON.stringify(pakaiBasi.data)?.slice(0, 200)
  );
  cek(
    "pesan kedaluwarsa dapat ditindaklanjuti",
    /kedaluwarsa/i.test(pakaiBasi.data?.pesan || ""),
    pakaiBasi.data?.pesan
  );

  /* Tiket bertahan melewati RESTART server (tanpa keadaan di proses). */
  const untukRestart = oauth.terbitkanTiket("gothamchess", "oauth").tiket;
  server.hentikan();
  const serverBaru = await serverUji({
    dirData: DIR_WAJIB,
    env: { KCI_WAJIB_VERIFIKASI: "wajib" },
  });
  const csrfBaru = await ambilTokenCsrf(serverBaru.dasar);
  const kirimBaru = pembuatKirim(serverBaru.dasar, csrfBaru, "10.44.0.4");
  const setelahRestart = await kirimBaru(
    "/api/anggota",
    formulir({ username: "gothamchess", namaLengkap: "Levy Rozman", panggilan: "Levy", hp: "0812-5555-6666", tiketVerifikasi: untukRestart })
  );
  cek(
    "tiket hasil verifikasi sebelum restart tetap diterima",
    setelahRestart.status === 201,
    JSON.stringify(setelahRestart.data)?.slice(0, 200)
  );
  // Tunggu child server benar-benar keluar sebelum menghapus direktori data
  // eksternal yang dipakainya; SIGTERM async + rm langsung memicu ENOTEMPTY.
  await serverBaru.hentikanDanTunggu();
  fs.rmSync(DIR_WAJIB, { recursive: true, force: true });
}

/* ==================== JALUR MANUAL SAMPAI SETUJU (mode wajib, tanpa tiket) */

console.log("\nPendaftaran — jalur manual: menunggu sampai pengurus menyetujui (mode wajib)");
{
  const DIR_MANUAL = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-manual-"));
  const server = await serverUji({
    dirData: DIR_MANUAL,
    env: { KCI_WAJIB_VERIFIKASI: "wajib" },
  });
  const csrf = await ambilTokenCsrf(server.dasar);
  const kirim = pembuatKirim(server.dasar, csrf, "10.44.0.21");
  const kirimPengurus = pembuatKirim(server.dasar, csrf, "10.44.0.22");

  try {
    /* 1. Pengajuan manual: hanya mencatat antrean. */
    const ajukan = await kirim("/api/auth/pengajuan-manual", {
      username: "hikaru",
      catatan: "profil sedang dikunci Chess.com",
    });
    cek(
      "pengajuan manual -> 202 menunggu",
      ajukan.status === 202 && ajukan.data?.status === "menunggu",
      JSON.stringify(ajukan.data)?.slice(0, 160)
    );

    /* 2. Belum ada persetujuan: di mode wajib pendaftaran DITOLAK, dan
          status di layar tidak bisa dinaikkan dari browser. */
    const tanpaSetuju = await kirim("/api/anggota", formulir({}));
    cek(
      "pengajuan saja tidak menembus mode wajib",
      tanpaSetuju.status === 403 && tanpaSetuju.data?.perluVerifikasi === true,
      JSON.stringify(tanpaSetuju.data)?.slice(0, 180)
    );
    const puraPura = await kirim(
      "/api/anggota",
      formulir({ pengajuanVerifikasi: "disetujui", terverifikasi: true, status: "verif" })
    );
    cek(
      "field 'disetujui' kiriman browser diabaikan (tetap 403)",
      puraPura.status === 403 && puraPura.data?.perluVerifikasi === true,
      `${puraPura.status} ${JSON.stringify(puraPura.data)?.slice(0, 160)}`
    );

    /* 3. Pengurus menyetujui. Yang belum mendaftar: tidak ada tiket,
          tidak ada status, hanya antrean yang berubah. */
    const daftar = await fetch(`${server.dasar}/api/pengurus/pengajuan-verifikasi?status=menunggu`, {
      headers: { "X-Token-Admin": server.token },
    }).then((r) => r.json().catch(() => []));
    const entri = (Array.isArray(daftar) ? daftar : []).find((p) => p.username === "hikaru");
    cek("pengurus melihat antrean pengajuan", Boolean(entri?.id), JSON.stringify(entri)?.slice(0, 160));

    const setuju = await kirimPengurus(
      `/api/pengurus/pengajuan-verifikasi/${entri?.id || "x"}/setujui`,
      {},
      { token: server.token }
    );
    cek(
      "persetujuan tercatat tanpa tiket dan tanpa mengubah status paksa",
      setuju.status === 200 &&
        setuju.data?.status === "disetujui" &&
        !setuju.data?.tiket &&
        setuju.data?.anggotaDiperbarui === false,
      JSON.stringify(setuju.data)?.slice(0, 200)
    );

    /* 4. Persetujuan server-lah yang membuat pendaftaran berikutnya sah. */
    const setelahSetuju = await kirim("/api/anggota", formulir({ hp: "0812-7777-8888" }));
    const anggota = (bacaBerkas("anggota.json", DIR_MANUAL) || []).find(
      (a) => a.username === "hikaru"
    );
    cek(
      "pendaftaran setelah disetujui -> 201 + terverifikasi dari antrean",
      setelahSetuju.status === 201 &&
        anggota?.terverifikasi === true &&
        anggota?.caraVerifikasi === "pengurus",
      `${setelahSetuju.status} ${JSON.stringify(anggota)?.slice(0, 200)}`
    );
    const antrean = bacaBerkas("pengajuan-verifikasi.json", DIR_MANUAL) || [];
    const diterapkan = (Array.isArray(antrean) ? antrean : []).find(
      (p) => p.username === "hikaru"
    );
    cek(
      "persetujuan ditandai diterapkan (tidak dapat dipakai dua kali)",
      Boolean(diterapkan?.diterapkanPada),
      JSON.stringify(diterapkan)?.slice(0, 200)
    );

    /* 5. Persetujuan tidak menular ke username lain. */
    const usernameLain = await kirim(
      "/api/anggota",
      formulir({
        username: "gothamchess",
        namaLengkap: "Levy Rozman",
        panggilan: "Levy",
        hp: "0812-7777-8889",
        tanggalLahir: "1995-05-20",
      })
    );
    cek(
      "persetujuan hikaru tidak meloloskan pendaftar lain",
      usernameLain.status === 403 && usernameLain.data?.perluVerifikasi === true,
      JSON.stringify(usernameLain.data)?.slice(0, 160)
    );

    /* 6. Penolakan pengurus: tetap menunggu / ditolak, tidak ada status baru. */
    const ajukanDua = await kirim("/api/auth/pengajuan-manual", { username: "gothamchess" });
    const daftarDua = await fetch(`${server.dasar}/api/pengurus/pengajuan-verifikasi?status=menunggu`, {
      headers: { "X-Token-Admin": server.token },
    }).then((r) => r.json().catch(() => []));
    const entriDua = (Array.isArray(daftarDua) ? daftarDua : []).find(
      (p) => p.username === "gothamchess"
    );
    const tolak = await kirimPengurus(
      `/api/pengurus/pengajuan-verifikasi/${entriDua?.id || "x"}/tolak`,
      { alasan: "profil tidak dapat diperiksa" },
      { token: server.token }
    );
    cek(
      "penolakan pengurus -> status ditolak + alasan",
      ajukanDua.status === 202 &&
        tolak.status === 200 &&
        tolak.data?.status === "ditolak",
      JSON.stringify(tolak.data)?.slice(0, 160)
    );
    const setelahTolak = await kirim(
      "/api/anggota",
      formulir({
        username: "gothamchess",
        namaLengkap: "Levy Rozman",
        panggilan: "Levy",
        hp: "0812-7777-8890",
        tanggalLahir: "1995-05-20",
      })
    );
    cek(
      "pengajuan yang ditolak tidak pernah melahirkan status terverifikasi",
      setelahTolak.status === 403,
      `dapat ${setelahTolak.status}`
    );

    /* 7. Persetujuan ganda ditolak (satu entri, satu keputusan). */
    const setujuLagi = await kirimPengurus(
      `/api/pengurus/pengajuan-verifikasi/${entriDua?.id || "x"}/setujui`,
      {},
      { token: server.token }
    );
    cek(
      "menyetujui ulang entri yang sudah ditolak -> 409",
      setujuLagi.status === 409,
      `dapat ${setujuLagi.status}`
    );
  } finally {
    server.hentikan();
    fs.rmSync(DIR_MANUAL, { recursive: true, force: true });
  }
}

/* =============================================== NORMALISASI MODE VERIFIKASI */

console.log("\nKonfigurasi mode verifikasi");
{
  const { normalisasiModeVerifikasi, MODE_VERIFIKASI } = await import(
    "../src/konfigurasi.js"
  );
  cek("nilai sah dipertahankan", MODE_VERIFIKASI.every((m) => normalisasiModeVerifikasi(m) === m));
  cek("kapital dinormalisasi", normalisasiModeVerifikasi("WAJIB") === "wajib");
  cek("spasi dinormalisasi", normalisasiModeVerifikasi(" wajib ") === "wajib");
  cek("alias 'on' dipetakan ke wajib", normalisasiModeVerifikasi("on") === "wajib");
  cek(
    "nilai tak dikenal jatuh ke bawaan (bukan 'off'!)",
    normalisasiModeVerifikasi("Wajibb") === "opsional"
  );
  cek("kosong = bawaan", normalisasiModeVerifikasi("") === "opsional");
}

fs.rmSync(DIRENDE, { recursive: true, force: true });

console.log(`\n${"=".repeat(50)}`);
console.log(`  ${lulus} lulus, ${gagal} gagal`);
console.log(`${"=".repeat(50)}\n`);
process.exit(gagal ? 1 : 0);
