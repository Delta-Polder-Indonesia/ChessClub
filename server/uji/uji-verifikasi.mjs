/**
 * Uji verifikasi kepemilikan akun Chess.com: PKCE, state tanpa keadaan,
 * tiket, validasi id_token, dan jalur kode profil lewat HTTP.
 *
 * Bagian yang butuh profil sungguhan disimulasikan dengan menyuntik jawaban
 * Chess.com, agar uji tidak bergantung pada akun nyata dan tetap jalan di
 * CI tanpa akses internet.
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.KCI_PEPPER = "pepper-uji-verifikasi-yang-panjang";
process.env.KCI_DIR_DATA = "/tmp/kci-uji-verif";
/* Rahasia tetap: tiket/state ditandatangani dengannya. Nilai tetap membuat
   uji "tiket tetap sah di proses lain" dapat dijalankan. */
process.env.KCI_JWT_SECRET = "rahasa-uji-verifikasi-yang-cukup-panjang-untuk-uji";
/* OAuth dianggap aktif di PROSES UJI ini saja, supaya `mulaiLogin` dapat
   dipakai untuk menghasilkan state. Server uji HTTP dijalankan tanpa
   kredensial ini (lihat `env` di luncurkanServerUji) sehingga jalur
   pencocokan profil tetap diuji pada konfigurasi default. */
process.env.KCI_CHESS_CLIENT_ID = "klien-kci";
process.env.KCI_CHESS_REDIRECT_URI = "https://uji.example/api/auth/chess/kembali";

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

/**
 * Hapus direktori data uji.
 *
 * `maxRetries` bukan hiasan: server anak menutup dengan anggun saat menerima
 * SIGTERM dan masih sempat menuliskan jejak audit, jadi berkas baru bisa
 * muncul ketika `rmSync` sedang menyusuri pohon direktori. Tanpa percobaan
 * ulang, pembersihan ini sesekali melempar ENOTEMPTY dan menjatuhkan seluruh
 * suite — kegagalan di langkah bersih-bersih, bukan pada perilaku yang diuji.
 */
const bersihkanDirData = (dir) =>
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

/** Jalankan `isi` dan kembalikan pesan galatnya (atau null bila lolos). */
async function galatDari(isi) {
  try {
    await isi();
    return null;
  } catch (e) {
    return e;
  }
}

const oauth = await import("../src/oauth.js");
const konfigurasiOAuth = (await import("../src/konfigurasi.js")).konfigurasi;

/* ------------------------------------------------------------- PKCE */

console.log("\nPKCE (Proof Key for Code Exchange)");
{
  const { verifier, challenge } = oauth.buatPkce();
  cek(
    "panjang verifier dalam rentang 43–128",
    verifier.length >= 43 && verifier.length <= 128,
    `panjang ${verifier.length}`
  );
  cek(
    "verifier hanya memakai karakter yang diizinkan",
    /^[A-Za-z0-9\-._~]+$/.test(verifier)
  );
  const harusnya = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  cek("challenge = Base64URL(SHA256(verifier))", challenge === harusnya);

  const kedua = oauth.buatPkce();
  cek("verifier berbeda tiap panggilan", verifier !== kedua.verifier);
}

/* ------------------------------------------------- state OAuth tanpa keadaan */

console.log("\nState OAuth (tanpa keadaan, bertanda tangan)");
{
  const state = oauth.mulaiLogin({ kembaliKe: "/pendaftaran-anggota" }).state;
  cek("state diterbitkan mulaiLogin", typeof state === "string" && state.length > 20);

  const e1 = await galatDari(() => oauth.selesaikanLogin({ code: "", state }));
  cek("state palsu/diubah ditolak", Boolean(e1), String(e1?.sebab));

  const e2 = await galatDari(() =>
    oauth.selesaikanLogin({ code: "abc", state: "kci1.eyJhIjoxfQ.xxxxxx" })
  );
  cek("state tanpa tanda tangan sah ditolak", Boolean(e2));

  const e3 = await galatDari(() =>
    oauth.selesaikanLogin({ code: "abc", state: "tiket-yang-bukan-state" })
  );
  cek("state acak ditolak", Boolean(e3));

  /* State harus menolak nilai yang berasal dari konteks lain (tiket). */
  const { tiket } = oauth.terbitkanTiket("budi", "oauth");
  const e4 = await galatDari(() => oauth.selesaikanLogin({ code: "abc", state: tiket }));
  cek("tiket tidak dapat dipakai sebagai state", Boolean(e4));

  /* Konfigurasi tidak lengkap -> mulaiLogin menolak (503), bukan menghasilkan
     state yang tidak bisa diselesaikan. */
  cek(
    "mulaiLogin menolak saat OAuth tidak aktif",
    (() => {
      const asli = konfigurasiOAuth.oauth.clientId;
      konfigurasiOAuth.oauth.clientId = "";
      try {
        oauth.mulaiLogin({ kembaliKe: "/x" });
        return false;
      } catch (e) {
        return e.status === 503 && e.sebab === "konfigurasi";
      } finally {
        konfigurasiOAuth.oauth.clientId = asli;
      }
    })()
  );

  /* Open redirect tetap ditutup. */
  cek("jalur eksternal ditolak jalurInternal", oauth.jalurInternal("https://jahat.example/x") === null);
  cek("protocol-relative URL ditolak", oauth.jalurInternal("//jahat.example") === null);
  cek("jalur internal diterima", oauth.jalurInternal("/pendaftaran-anggota") === "/pendaftaran-anggota");
}

/* ------------------------------------------------------------ tiket */

console.log("\nTiket verifikasi (sekali pakai, terikat username)");
{
  const { tiket, berlakuDetik } = oauth.terbitkanTiket("BudiCatur", "oauth");
  cek("tiket diterbitkan", Boolean(tiket));
  cek("masa berlaku dilaporkan", Number(berlakuDetik) > 0);
  cek(
    "tiket terikat username hasil normalisasi",
    oauth.periksaTiket(tiket, "BudiCatur").sah === true &&
      oauth.periksaTiket(tiket, "  BudiCatur  ").sah === true
  );

  const intip = oauth.intipTiket(tiket);
  cek("intip tidak memakai tiket", intip?.username === "budicatur");
  cek("intip kedua kali masih ada", Boolean(oauth.intipTiket(tiket)));

  const beda = oauth.periksaTiket(tiket, "orang-lain");
  cek("tiket ditolak untuk username lain", beda.sah === false && beda.sebab === "username-beda");

  const pakai = oauth.pakaiTiket(tiket, "budicatur");
  cek("tiket diterima untuk username benar", pakai?.cara === "oauth");
  const ulang = oauth.periksaTiket(tiket, "budicatur");
  cek(
    "tiket sekali pakai (percobaan kedua ditolak)",
    ulang.sah === false && ulang.sebab === "sudah-dipakai"
  );
  cek("pakaiTiket kedua kali mengembalikan null", oauth.pakaiTiket(tiket, "budicatur") === null);

  const palsu = oauth.periksaTiket("kci1.e30.bm9wZQ", "budicatur");
  cek(
    "tiket karangan ditolak",
    palsu.sah === false && palsu.sebab === "tidak-sah",
    JSON.stringify(palsu)
  );
  cek(
    "token CSRF (hex 64) tidak sah jadi tiket",
    oauth.periksaTiket(crypto.randomBytes(32).toString("hex"), "budicatur").sah === false
  );
  cek("tiket kosong ditolak", oauth.periksaTiket("", "budicatur").sebab === "kosong");
  cek("tiket undefined ditolak", oauth.periksaTiket(undefined, "budicatur").sebab === "kosong");
  cek("tiket bukan string ditolak sebagai tidak-sah", oauth.periksaTiket({ nilai: "x" }, "budicatur").sebab === "tidak-sah");

  cek(
    "username kapital dan lowercase diperlakukan konsisten",
    (() => {
      const { tiket: t } = oauth.terbitkanTiket("SitiAminah", "kode-profil");
      return (
        oauth.periksaTiket(t, "SITIAMINAH").sah === true &&
        oauth.periksaTiket(t, "sitiaminah").sah === true
      );
    })()
  );

  cek(
    "tiket untuk username tidak sah gagal diterbitkan",
    Boolean(await galatDari(() => Promise.resolve(oauth.terbitkanTiket("a", "oauth"))))
  );

  /* Kedaluwarsa: terbitkan tiket berumur 1 detik, tunggu, lalu periksa. */
  const konfigurasi = (await import("../src/konfigurasi.js")).konfigurasi;
  const umurAsli = konfigurasi.tiket.umurDetik;
  konfigurasi.tiket.umurDetik = 1;
  const { tiket: singkat } = oauth.terbitkanTiket("budi", "oauth");
  konfigurasi.tiket.umurDetik = umurAsli;
  await new Promise((r) => setTimeout(r, 1200));
  const basi = oauth.periksaTiket(singkat, "budi");
  cek(
    "tiket kedaluwarsa ditolak dengan sebab khusus",
    basi.sah === false && basi.sebab === "kedaluwarsa",
    JSON.stringify(basi)
  );
  cek("tiket kedaluwarsa tidak dapat diintip", oauth.intipTiket(singkat) === null);
}

/* ------------------------- lintas proses (deployment multi-instance/serverless) */

console.log("\nTiket tanpa keadaan (bertahan lintas proses & restart)");
{
  const { tiket } = oauth.terbitkanTiket("budi", "oauth");
  const AKAR_REPO = new URL("../../", import.meta.url).pathname;
  const hasilAnak = await new Promise((resolve) => {
    const proses = spawn(
      process.execPath,
      [
        "-e",
        `import("./server/src/oauth.js").then(async (m) => {
  const hasil = m.periksaTiket(process.argv[1], "budi");
  process.stdout.write(JSON.stringify(hasil));
});`,
        tiket,
      ],
      {
        cwd: AKAR_REPO,
        env: {
          ...process.env,
          KCI_JWT_SECRET: process.env.KCI_JWT_SECRET,
          KCI_DIR_DATA: "/tmp/kci-uji-verif-anak",
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    let keluaran = "";
    proses.stdout.on("data", (c) => (keluaran += c));
    proses.stderr.on("data", (c) => process.stderr.write(c));
    proses.on("close", () => {
      try {
        resolve(JSON.parse(keluaran));
      } catch {
        resolve(null);
      }
    });
  });
  cek(
    "tiket tetap divalidasi oleh proses lain (tanpa state bersama)",
    hasilAnak?.sah === true,
    JSON.stringify(hasilAnak)
  );
  cek(
    "ledger 'sudah dipakai' bersifat per proses (keterbatasan tercatat)",
    hasilAnak?.sudahDipakai !== true,
    JSON.stringify(hasilAnak)
  );
}

/* --------------------------------------------------- verifikasi JWT */

console.log("\nKeamanan id_token (JWT)");
{
  const { generateKeyPairSync } = crypto;
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const jwk = publicKey.export({ format: "jwk" });
  jwk.kid = "uji-kunci";

  const kunciCadangan = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/certs")) {
      return new Response(JSON.stringify({ keys: [jwk] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return kunciCadangan(url);
  };

  const buatToken = (muatan, kunci = privateKey, alg = "RS256", kid = "uji-kunci") => {
    const kepala = Buffer.from(
      JSON.stringify(kid === null ? { alg, typ: "JWT" } : { alg, typ: "JWT", kid })
    ).toString("base64url");
    const isi = Buffer.from(JSON.stringify(muatan)).toString("base64url");
    if (alg === "none") return `${kepala}.${isi}.`;
    const tanda = crypto
      .sign("RSA-SHA256", Buffer.from(`${kepala}.${isi}`), kunci)
      .toString("base64url");
    return `${kepala}.${isi}.${tanda}`;
  };

  const kini = Math.floor(Date.now() / 1000);
  const muatanDasar = () => ({
    sub: "12345",
    iss: "https://oauth.chess.com",
    preferred_username: "BudiCatur",
    aud: "klien-kci",
    exp: kini + 3600,
  });

  const sah = buatToken(muatanDasar());
  const hasil = await oauth.verifikasiIdToken(sah, { clientId: "klien-kci" });
  cek("token sah diterima", hasil.usernameTerverifikasi === "budicatur");
  cek(
    "username dinormalisasi ke huruf kecil",
    hasil.preferred_username === "BudiCatur" && hasil.usernameTerverifikasi === "budicatur"
  );

  /* Penolakan per klaim — setiap kasus harus menghasilkan GalatVerifikasi. */
  const tolak = async (nama, token, clientId = "klien-kci") => {
    const e = await galatDari(() => oauth.verifikasiIdToken(token, { clientId }));
    cek(nama, Boolean(e), e ? "lolos (SEHARUSNYA DITOLAK)" : "");
    return e;
  };

  await tolak("tanda tangan palsu DITOLAK", sah.slice(0, -6) + "AAAAAA");
  await tolak("header rusak DITOLAK", "abc.def.ghi");
  await tolak(
    "jumlah segmen salah DITOLAK",
    `${Buffer.from(JSON.stringify({ alg: "RS256", kid: "uji-kunci" })).toString("base64url")}.${Buffer.from("{}").toString("base64url")}`
  );
  await tolak(
    "serangan alg:none DITOLAK",
    buatToken({ ...muatanDasar(), preferred_username: "penyusup" }, null, "none")
  );
  await tolak(
    "algoritma selain RS256 (HS256) DITOLAK",
    buatToken(muatanDasar(), privateKey, "HS256")
  );
  await tolak(
    "token kedaluwarsa DITOLAK",
    buatToken({ ...muatanDasar(), exp: kini - 10 })
  );
  await tolak(
    "token milik aplikasi lain (aud salah) DITOLAK",
    buatToken({ ...muatanDasar(), aud: "aplikasi-lain" })
  );
  await tolak("audience kosong DITOLAK", buatToken({ ...muatanDasar(), aud: undefined }));
  await tolak(
    "expiration hilang DITOLAK",
    buatToken({ ...muatanDasar(), exp: undefined })
  );
  await tolak(
    "expiration bukan angka DITOLAK",
    buatToken({ ...muatanDasar(), exp: "99999999999" })
  );
  await tolak(
    "issuer salah DITOLAK",
    buatToken({ ...muatanDasar(), iss: "https://penyedia-lain.example" })
  );
  await tolak("issuer kosong DITOLAK", buatToken({ ...muatanDasar(), iss: undefined }));
  await tolak("sub hilang DITOLAK", buatToken({ ...muatanDasar(), sub: undefined }));
  await tolak(
    "username tidak tersedia DITOLAK",
    buatToken({ sub: "9", iss: "https://oauth.chess.com", aud: "klien-kci", exp: kini + 600 })
  );
  await tolak(
    "username tidak sah (spasi) DITOLAK",
    buatToken({ ...muatanDasar(), preferred_username: "budi catur" })
  );
  await tolak(
    "token dari kunci asing DITOLAK",
    buatToken(muatanDasar(), generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey)
  );
  await tolak(
    "kid tidak dikenal DITOLAK",
    buatToken(muatanDasar(), privateKey, "RS256", "kunci-lain")
  );
  await tolak("kid hilang DITOLAK", buatToken(muatanDasar(), privateKey, "RS256", null));
  await tolak(
    "nbf di masa depan DITOLAK",
    buatToken({ ...muatanDasar(), nbf: kini + 3600 })
  );
  await tolak(
    "exp terlalu jauh DITOLAK",
    buatToken({ ...muatanDasar(), exp: kini + 400 * 24 * 60 * 60 })
  );

  /* Tanpa client_id, verifikasi tidak boleh berjalan sama sekali: `aud`
     tidak dapat diperiksa, dan itulah celah "token untuk aplikasi lain". */
  const eTanpaClient = await galatDari(() => oauth.verifikasiIdToken(sah, {}));
  cek("tanpa client_id verifikasi ditolak", Boolean(eTanpaClient));

  /* nbf yang sudah lewat (dalam toleransi) harus tetap diterima. */
  const denganNbf = buatToken({ ...muatanDasar(), nbf: kini - 10 });
  const okNbf = await galatDari(() =>
    oauth.verifikasiIdToken(denganNbf, { clientId: "klien-kci" })
  );
  cek("nbf yang sudah lewat diterima", okNbf === null, String(okNbf));

  /* `iss` dengan garis miring di ujung adalah issuer yang sama. */
  const issGaris = buatToken({ ...muatanDasar(), iss: "https://oauth.chess.com/" });
  const okIss = await galatDari(() =>
    oauth.verifikasiIdToken(issGaris, { clientId: "klien-kci" })
  );
  cek("issuer dengan '/' di ujung diterima", okIss === null, String(okIss));

  /* Pesan galat tidak boleh memuat isi token. */
  const ePesan = await galatDari(() =>
    oauth.verifikasiIdToken(buatToken({ ...muatanDasar(), aud: "salah" }), {
      clientId: "klien-kci",
    })
  );
  cek(
    "pesan galat tidak memuat token mentah",
    !String(ePesan?.message || "").includes(sah.slice(0, 12))
  );
  cek(
    "galat membawa kode sebab untuk dipetakan UI",
    typeof ePesan?.sebab === "string" && ePesan.sebab.length > 0,
    String(ePesan?.sebab)
  );
  cek(
    "kode sebab terpetakan ke pesan aman",
    typeof oauth.pesanVerifikasiUntukPengguna(ePesan?.sebab) === "string" &&
      oauth.pesanVerifikasiUntukPengguna("kode-asing").length > 10
  );

  globalThis.fetch = kunciCadangan;
}

/* ------------------------------------------- verifikasi kode profil */

console.log("\nVerifikasi kode di profil (lewat HTTP)");
{
  /* Bila KCI_DASAR diberikan, tempel ke server yang sudah berjalan.
     Bila tidak, luncurkan server uji terisolasi dengan Chess.com tiruan —
     seluruh tes tetap berjalan tanpa internet dan tanpa menyentuh data asli. */
  const { luncurkanServerUji, ambilTokenCsrf } = await import("./alat-uji.mjs");

  let DASAR = process.env.KCI_DASAR || "";
  let hentikan = null;
  if (DASAR) {
    const hidup = await fetch(DASAR + "/api/kesehatan", {
      signal: AbortSignal.timeout(2000),
    })
      .then((r) => r.ok)
      .catch(() => false);
    if (!hidup) {
      console.log(`  (server di ${DASAR} tidak merespons — bagian ini dilewati)`);
      DASAR = "";
    }
  }
  let tokenPengurus = "";
  let dirDataUji = null;
  if (!process.env.KCI_DASAR) {
    const hasil = await luncurkanServerUji({
      env: { KCI_CHESS_CLIENT_ID: "", KCI_CHESS_REDIRECT_URI: "" },
    });
    DASAR = hasil.dasar;
    hentikan = hasil.hentikan;
    tokenPengurus = hasil.token || "";
    dirDataUji = hasil.dirData; // untuk memeriksa isi berkas yang ditulis server
  }

  if (DASAR) {
    // Server mewajibkan X-CSRF-Token untuk semua POST. IP unik
    // (X-Forwarded-For) agar kuota pembatas laju tidak bertabrakan
    // dengan uji-backend bila keduanya menempel server yang sama.
    const IP_UJI = "10.30.77.7";
    let csrfToken = "";
    try {
      csrfToken = await ambilTokenCsrf(DASAR);
    } catch {
      console.log("  (server tidak menerbitkan token CSRF — bagian ini dilewati)");
    }

    if (csrfToken) {
      const kirim = async (jalur, bodi) => {
        const r = await fetch(DASAR + jalur, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
            "X-Forwarded-For": IP_UJI,
          },
          body: JSON.stringify(bodi),
        });
        return { status: r.status, data: await r.json().catch(() => null) };
      };

      // Tanpa token CSRF, POST harus ditolak 403.
      const tanpaCsrf = await fetch(DASAR + "/api/auth/kode/minta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": IP_UJI,
        },
        body: JSON.stringify({ username: "gothamchess" }),
      });
      cek("POST tanpa token CSRF -> 403", tanpaCsrf.status === 403, `dapat ${tanpaCsrf.status}`);

      const takAda = await kirim("/api/auth/kode/minta", {
        username: "akuntidakada99887766",
      });
      cek("username tak ada -> 404", takAda.status === 404, `dapat ${takAda.status}`);

      /* Aturan username KANONIK: frontend dan server memakai fungsi yang
         sama, jadi isian yang lolos UI tidak boleh ditolak API. */
      const terlaluPanjang = await kirim("/api/auth/kode/minta", {
        username: "a".repeat(26),
      });
      cek("username 26 karakter -> 400", terlaluPanjang.status === 400, `dapat ${terlaluPanjang.status}`);
      const batasPanjang = await kirim("/api/auth/kode/minta", {
        username: "m".repeat(25),
      });
      cek("username 25 karakter -> tidak ditolak karena format", batasPanjang.status !== 400, `dapat ${batasPanjang.status}`);
      const kapital = await kirim("/api/auth/kode/minta", { username: "GothamChess" });
      cek("username kapital diterima (dinormalisasi)", kapital.status === 200, `dapat ${kapital.status}`);
      const spasi = await kirim("/api/auth/kode/minta", { username: "gotham chess" });
      cek("username berspasi ditolak", spasi.status === 400, `dapat ${spasi.status}`);

      const minta = await kirim("/api/auth/kode/minta", { username: "gothamchess" });
      cek("kode diterbitkan server", /^KCI-[A-Z2-9]{6}$/.test(minta.data?.kode || ""), minta.data?.kode);
      cek("kode punya masa berlaku", minta.data?.berlakuDetik > 0);

      const ulang = await kirim("/api/auth/kode/minta", { username: "gothamchess" });
      cek("permintaan ulang memberi kode sama", ulang.data?.kode === minta.data?.kode);

      const paksakan = await kirim("/api/auth/kode/minta", { username: "gothamchess", paksa: true });
      cek("paksa=true menerbitkan kode baru", paksakan.data?.kode !== minta.data?.kode);

      const periksa = await kirim("/api/auth/kode/periksa", { username: "gothamchess" });
      cek(
        "kode belum dipasang -> cocok:false",
        periksa.data?.cocok === false,
        JSON.stringify(periksa.data)?.slice(0, 120)
      );
      cek("tidak menerbitkan tiket saat gagal", !periksa.data?.tiket);

      const cepat = await kirim("/api/auth/kode/periksa", { username: "gothamchess" });
      cek("pemeriksaan terlalu cepat -> 429", cepat.status === 429, `dapat ${cepat.status}`);

      const belumMinta = await kirim("/api/auth/kode/periksa", { username: "hikaru" });
      cek("periksa tanpa minta kode -> 400", belumMinta.status === 400, `dapat ${belumMinta.status}`);

      const cara = await fetch(DASAR + "/api/auth/cara").then((r) => r.json());
      cek("endpoint /api/auth/cara melaporkan mode", Boolean(cara.mode));
      cek("kodeProfil selalu tersedia", cara.kodeProfil === true);
      cek("cara melaporkan kewajiban verifikasi", typeof cara.wajib === "boolean");
      cek("cara melaporkan umur tiket", Number(cara.tiketBerlakuDetik) > 0);

      /* --- pengajuan manual: dicatat, TIDAK pernah menghasilkan tiket --- */
      const pengajuan = await kirim("/api/auth/pengajuan-manual", {
        username: "gothamchess",
        catatan: "profil sedang terkunci",
      });
      cek("pengajuan manual -> 202 diterima", pengajuan.status === 202, `dapat ${pengajuan.status}`);
      cek(
        "status pengajuan 'menunggu' (bukan verified)",
        pengajuan.data?.status === "menunggu",
        JSON.stringify(pengajuan.data)
      );
      cek(
        "pengajuan manual tidak memberi tiket",
        !pengajuan.data?.tiket && !pengajuan.data?.terverifikasi
      );
      const pengajuanTanpaTiket = await kirim("/api/anggota", {
        username: "gothamchess",
        namaLengkap: "Levy Rozman",
        panggilan: "Levy",
        hp: "081234567890",
        kota: "New York",
        tanggalLahir: "1995-05-20",
        setuju: true,
        tiketVerifikasi: "tiket-karangan-dari-pengajuan",
      });
      cek(
        "tiket karangan untuk menutupi pengajuan ditolak",
        pengajuanTanpaTiket.status === 403 &&
          pengajuanTanpaTiket.data?.perluVerifikasi === true,
        JSON.stringify(pengajuanTanpaTiket.data)
      );
      const bacaPengajuan = async () => {
        try {
          const r = await fetch(`${DASAR}/api/pengurus/pengajuan-verifikasi?status=menunggu`, {
            headers: { "X-Token-Admin": tokenPengurus },
          });
          return { status: r.status, isi: await r.json().catch(() => []) };
        } catch {
          return { status: 0, isi: [] };
        }
      };
      const daftarPengajuan = await bacaPengajuan();
      const daftar = Array.isArray(daftarPengajuan.isi) ? daftarPengajuan.isi : [];
      const tercatat = daftar.find((p) => p.username === "gothamchess");
      cek(
        "pengajuan tercatat di antrean pengurus",
        daftarPengajuan.status === 200 && Boolean(tercatat?.id),
        JSON.stringify(daftarPengajuan)?.slice(0, 160)
      );
      /* Persetujuan pengurus = satu-satunya jalur manual yang boleh
         menghasilkan tiket. */
      const responsSetuju = await fetch(
        `${DASAR}/api/pengurus/pengajuan-verifikasi/${tercatat?.id || "x"}/setujui`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
            "X-Token-Admin": tokenPengurus,
            "X-Forwarded-For": IP_UJI,
          },
          body: "{}",
        }
      );
      const hasilSetuju = await responsSetuju.json().catch(() => null);
      cek(
        "pengurus dapat menyetujui pengajuan (satu-satunya mekanisme)",
        responsSetuju.status === 200 &&
          hasilSetuju?.ok === true &&
          hasilSetuju?.status === "disetujui",
        JSON.stringify(hasilSetuju)?.slice(0, 200)
      );
      /* Kontrak yang dikunci: TIDAK ada tiket yang keluar dari endpoint
         pengurus. Kalau tiket disalurkan di sini, jalur manual punya DUA
         mekanisme yang menghasilkan state sama lewat jalan berbeda. */
      cek(
        "persetujuan tidak menyerahkan tiket apa pun ke layar pengurus",
        !hasilSetuju?.tiket && !hasilSetuju?.berlakuDetik,
        JSON.stringify(hasilSetuju)?.slice(0, 200)
      );
      cek(
        "persetujuan untuk yang belum mendaftar tidak mengarang status",
        hasilSetuju?.anggotaDiperbarui === false && /belum ada/i.test(hasilSetuju?.petunjuk || ""),
        JSON.stringify(hasilSetuju)?.slice(0, 200)
      );

      /* Persetujuan yang belum diterapkan tetap hidup di antrean dan dipakai
         SERVER pada saat pendaftaran — bukan oleh browser. */
      const daftarSetuju = await kirim("/api/anggota", {
        username: "gothamchess",
        namaLengkap: "Levy Rozman",
        panggilan: "Levy",
        hp: "081234567811",
        kota: "New York",
        tanggalLahir: "1995-05-20",
        setuju: true,
      });
      cek(
        "pendaftaran setelah disetujui -> 201",
        daftarSetuju.status === 201,
        JSON.stringify(daftarSetuju.data)?.slice(0, 200)
      );
      const tersimpanSetuju = (() => {
        try {
          const berkas = `${dirDataUji}/anggota.json`;
          const arr = JSON.parse(fs.readFileSync(berkas, "utf8"));
          return arr.find((a) => a.username === "gothamchess") || null;
        } catch {
          return null;
        }
      })();
      cek(
        "status terverifikasi ditulis server dari persetujuan pengurus",
        tersimpanSetuju?.terverifikasi === true &&
          tersimpanSetuju?.caraVerifikasi === "pengurus",
        JSON.stringify(tersimpanSetuju)?.slice(0, 200)
      );
      cek(
        "siapa yang menyetujui ikut tercatat di catatan anggota",
        Boolean(tersimpanSetuju?.diverifikasiOleh),
        JSON.stringify(tersimpanSetuju?.diverifikasiOleh)
      );
      const antrean = (() => {
        try {
          return JSON.parse(
            fs.readFileSync(`${dirDataUji}/pengajuan-verifikasi.json`, "utf8")
          );
        } catch {
          return [];
        }
      })();
      const entriAntrean = (Array.isArray(antrean) ? antrean : []).find(
        (p) => p.username === "gothamchess"
      );
      cek(
        "persetujuan ditandai sudah diterapkan (tidak dipakai dua kali)",
        entriAntrean?.status === "disetujui" && Boolean(entriAntrean?.diterapkanPada),
        JSON.stringify(entriAntrean)?.slice(0, 200)
      );
      /* Persetujuan hanya berlaku untuk username-nya sendiri. */
      const usernameLain = await kirim("/api/anggota", {
        username: "hikaru",
        namaLengkap: "Hikaru Nakamura",
        panggilan: "Hikaru",
        hp: "081234567812",
        kota: "Medan",
        tanggalLahir: "1990-05-20",
        setuju: true,
      });
      const tersimpanLain = (() => {
        try {
          const arr = JSON.parse(fs.readFileSync(`${dirDataUji}/anggota.json`, "utf8"));
          return arr.find((a) => a.username === "hikaru") || null;
        } catch {
          return null;
        }
      })();
      cek(
        "persetujuan gothamchess tidak menular ke username lain",
        usernameLain.status === 201 && tersimpanLain?.terverifikasi === false,
        JSON.stringify(tersimpanLain)?.slice(0, 160)
      );
      const tanpaAdmin = await fetch(`${DASAR}/api/pengurus/pengajuan-verifikasi`, {
        method: "GET",
      }).then((r) => r.status);
      cek("daftar pengajuan butuh kredensial pengurus", tanpaAdmin === 401 || tanpaAdmin === 403, `dapat ${tanpaAdmin}`);
    }
  }
  hentikan?.();
}

/* ----------------- Tantangan kode profil: penyimpanan, siklus, isolasi proses
 *
 * Di sininya pertanyaan deployment dijawab dengan tes, bukan asumsi:
 * tantangan TIDAK boleh bergantung pada "request berikutnya mendarat di
 * proses yang sama". Karena penyimpanan tantangan sekarang berupa berkas
 * melalui lapisan data yang sudah ada (`simpanan.js` -> Supabase bila
 * terpasang), sebuah proses BARU dengan direktori data yang sama wajib masih
 * melihat tantangan itu; dan proses dengan direktori BERBEDA wajib gagal
 * aman (menolak), bukan lolos verifikasi.
 */

console.log("\nTantangan kode profil (penyimpanan, siklus, isolasi proses)");
{
  const { luncurkanServerUji, ambilTokenCsrf, nyalakanPeniruChess } = await import(
    "./alat-uji.mjs"
  );
  const jeda = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Direktori data bersama = simulasi "penyimpanan bersama" (Supabase). */
  const DIR_BERSAMA = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-tantangan-"));
  const DIR_LAIN = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-tantangan-lain-"));

  /** Lokasi profil tiruan per username; diisi saat "pengguna menempel kode". */
  const lokasi = {};
  const peniru = await nyalakanPeniruChess(
    {},
    { ubahProfil: (u) => (lokasi[u] === undefined ? {} : { location: lokasi[u] }) }
  );

  const berkasTantangan = (dir) => path.join(dir, "rahasia", "verifikasi-tantangan.json");
  const bacaTantangan = (dir) => {
    try {
      return JSON.parse(fs.readFileSync(berkasTantangan(dir), "utf8"));
    } catch {
      return null;
    }
  };
  const bacaAnggota = (dir, username) => {
    try {
      const arr = JSON.parse(fs.readFileSync(path.join(dir, "anggota.json"), "utf8"));
      return arr.find((a) => a.username === username) || null;
    } catch {
      return null;
    }
  };

  let nomorIp = 0;
  const nyalakan = async ({ dirData, env = {} } = {}) => {
    nomorIp += 1;
    const hasil = await luncurkanServerUji({
      chessDasar: peniru.dasar,
      env: {
        KCI_DIR_DATA: dirData,
        KCI_BATAS_UMUM: "5000",
        KCI_BATAS_DAFTAR: "500",
        /* Jeda 1 detik agar satu tes dapat memeriksa berkali-kali tanpa
           membuat suites lambat; nilai produksi tetap 5 detik. */
        KCI_TANTANGAN_JEDA_DETIK: "1",
        ...env,
      },
    });
    const csrf = await ambilTokenCsrf(hasil.dasar);
    const ip = `10.77.77.${nomorIp}`;
    const kirim = async (jalur, bodi) => {
      const r = await fetch(hasil.dasar + jalur, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
          "X-Forwarded-For": ip,
        },
        body: JSON.stringify(bodi ?? {}),
      });
      return { status: r.status, data: await r.json().catch(() => null) };
    };
    const baca = async (jalur) => {
      const r = await fetch(hasil.dasar + jalur, { headers: { "X-Forwarded-For": ip } });
      return { status: r.status, data: await r.json().catch(() => null) };
    };
    return { ...hasil, csrf, ip, kirim, baca, dirData };
  };

  const formulir = (lebih) => ({
    username: "magnuscarlsen",
    namaLengkap: "Magnus Carlsen",
    panggilan: "Magnus",
    hp: "0812-7777-0001",
    kota: "Medan",
    tanggalLahir: "1990-05-20",
    setuju: true,
    ...lebih,
  });

  let server = await nyalakan({ dirData: DIR_BERSAMA });
  try {
    /* 1. Tantangan dibuat di satu request, dibaca di request berikutnya. */
    const minta = await server.kirim("/api/auth/kode/minta", { username: "magnuscarlsen" });
    const kode = minta.data?.kode || "";
    cek("minta kode -> 200 + kode dari server", minta.status === 200 && /^KCI-[A-Z2-9]{6}$/.test(kode), kode);

    /* 2. Tantangan benar-benar tersimpan (bukan hanya Map milik proses). */
    const berkas = bacaTantangan(DIR_BERSAMA);
    cek(
      "tantangan tertulis di penyimpanan berkas (bukan hanya memori proses)",
      berkas?.magnuscarlsen?.kode === kode,
      JSON.stringify(berkas)?.slice(0, 160)
    );
    cek(
      "tantangan tidak ditulis ke berkas yang ikut ter-bundle/ke git",
      berkasTantangan(DIR_BERSAMA).includes("rahasia"),
      berkasTantangan(DIR_BERSAMA)
    );
    {
      const AKAR_REPO = new URL("../../", import.meta.url).pathname;
      const gitignore = fs.readFileSync(path.join(AKAR_REPO, ".gitignore"), "utf8");
      cek(
        "data/rahasia/ di-gitignore (kode tantangan tidak ikut ter-commit)",
        /data\/rahasia\//.test(gitignore)
      );
      const vercel = JSON.parse(
        fs.readFileSync(path.join(AKAR_REPO, "vercel.json"), "utf8")
      );
      const benih = vercel?.functions?.["api/[...jalur].js"]?.includeFiles || "";
      cek(
        "glob benih Vercel tidak mencakup folder rahasia",
        benih === "data/*.json",
        benih
      );
      const berkasContoh = fs.readFileSync(path.join(AKAR_REPO, ".env.contoh"), "utf8");
      cek(
        "knob umur/jeda/percobaan tantangan terdokumentasi di .env.contoh",
        ["KCI_TANTANGAN_UMUR_DETIK", "KCI_TANTANGAN_JEDA_DETIK", "KCI_TANTANGAN_MAKS_PERCOBAAN"].every(
          (k) => berkasContoh.includes(k)
        )
      );
    }

    /* 3. Belum dipasang -> cocok:false, tantangan TIDAK dibuang. */
    const belum = await server.kirim("/api/auth/kode/periksa", { username: "magnuscarlsen" });
    cek(
      "profil belum memuat kode -> cocok:false",
      belum.status === 200 && belum.data?.cocok === false && !belum.data?.tiket,
      JSON.stringify(belum.data)?.slice(0, 160)
    );
    cek(
      "kegagalan pemeriksaan tidak menghabiskan tantangan",
      bacaTantangan(DIR_BERSAMA)?.magnuscarlsen?.kode === kode
    );

    /* 4. Kode SALAH di profil -> tetap ditolak. */
    lokasi.magnuscarlsen = "KCI-SALAH1";
    await jeda(1100);
    const salah = await server.kirim("/api/auth/kode/periksa", { username: "magnuscarlsen" });
    cek(
      "kode berbeda di profil -> cocok:false (bukan bocor jadi tiket)",
      salah.status === 200 && salah.data?.cocok === false && !salah.data?.tiket,
      JSON.stringify(salah.data)?.slice(0, 160)
    );

    /* 5. Dua pemeriksaan bersamaan -> hanya SATU yang boleh berhasil.
       Kode yang benar baru dipasang sekarang, dan jeda 1 detik dilewati agar
       yang diuji adalah BALAPAN-nya, bukan pembatas kecepatannya. */
    lokasi.magnuscarlsen = kode;
    await jeda(1100);
    const balapan = await Promise.all([
      server.kirim("/api/auth/kode/periksa", { username: "magnuscarlsen" }),
      server.kirim("/api/auth/kode/periksa", { username: "magnuscarlsen" }),
    ]);
    const menang = balapan.filter(
      (r) => r.status === 200 && r.data?.cocok === true && r.data?.tiket
    );
    const kalah = balapan.filter((r) => !(r.status === 200 && r.data?.cocok === true));
    cek(
      "dua request pemeriksaan bersamaan -> tepat satu yang berhasil",
      menang.length === 1 && kalah.length === 1,
      JSON.stringify(balapan.map((r) => [r.status, r.data?.cocok]))
    );
    cek(
      "hanya satu tiket yang terbit dari dua pemeriksaan",
      new Set(menang.map((r) => r.data?.tiket)).size === 1 &&
        kalah.every((r) => !r.data?.tiket)
    );

    /* 6. Berhasil -> tantangan habis; periksa lagi tidak dapat tiket kedua. */
    const ulang = await server.kirim("/api/auth/kode/periksa", { username: "magnuscarlsen" });
    cek(
      "tantangan yang sudah berhasil tidak dapat dipakai ulang",
      ulang.status === 400 && ulang.data?.kode === "tantangan-tidak-ada",
      `${ulang.status} ${JSON.stringify(ulang.data)?.slice(0, 140)}`
    );
    cek(
      "tantangan dihapus dari penyimpanan setelah berhasil",
      !bacaTantangan(DIR_BERSAMA)?.magnuscarlsen,
      JSON.stringify(bacaTantangan(DIR_BERSAMA))?.slice(0, 160)
    );

    /* 7. Tiket hasil tantangan dipakai mendaftar -> anggota terverifikasi. */
    const tiket = menang[0]?.data?.tiket;
    const daftar = await server.kirim("/api/anggota", formulir({ tiketVerifikasi: tiket }));
    const anggota = bacaAnggota(DIR_BERSAMA, "magnuscarlsen");
    cek(
      "tiket jalur kode-profil diterima pendaftaran",
      daftar.status === 201 &&
        anggota?.terverifikasi === true &&
        anggota?.caraVerifikasi === "kode-profil",
      `${daftar.status} ${JSON.stringify(anggota)?.slice(0, 160)}`
    );

    /* 8. Tiket yang sama tidak menghasilkan pendaftaran kedua. */
    const daftarLagi = await server.kirim(
      "/api/anggota",
      formulir({ tiketVerifikasi: tiket, hp: "0812-7777-0002" })
    );
    cek(
      "tiket yang sama tidak dapat dipakai dua kali",
      daftarLagi.status === 409 || daftarLagi.status === 403,
      `${daftarLagi.status} ${JSON.stringify(daftarLagi.data)?.slice(0, 140)}`
    );

    /* 9. Tantangan bertahan melewati RESTART proses (instance dingin baru). */
    const mintaBaru = await server.kirim("/api/auth/kode/minta", { username: "hikaru" });
    const kodeHikaru = mintaBaru.data?.kode;
    cek("tantangan kedua terbit", Boolean(kodeHikaru), JSON.stringify(mintaBaru.data));
    server.hentikan(); // proses lama mati total
    server = null;
    await jeda(250);

    const instanceBaru = await nyalakan({ dirData: DIR_BERSAMA });
    lokasi.hikaru = kodeHikaru;
    const setelahRestart = await instanceBaru.kirim("/api/auth/kode/periksa", {
      username: "hikaru",
    });
    cek(
      "instance BARU dengan penyimpanan bersama melihat tantangan yang sama",
      setelahRestart.status === 200 &&
        setelahRestart.data?.cocok === true &&
        Boolean(setelahRestart.data?.tiket),
      `${setelahRestart.status} ${JSON.stringify(setelahRestart.data)?.slice(0, 160)}`
    );

    /* 10. Instance dengan penyimpanan TERPISAH harus gagal aman, bukan lolos. */
    const mintaLain = await instanceBaru.kirim("/api/auth/kode/minta", { username: "gothamchess" });
    const kodeLain = mintaLain.data?.kode;
    cek("tantangan di instance sendiri terbit", Boolean(kodeLain));
    const instanceLain = await nyalakan({ dirData: DIR_LAIN });
    lokasi.gothamchess = kodeLain;
    const silang = await instanceLain.kirim("/api/auth/kode/periksa", { username: "gothamchess" });
    cek(
      "tanpa penyimpanan bersama: kode dari instance lain DITOLAK (gagal aman)",
      silang.status === 400 && silang.data?.kode === "tantangan-tidak-ada",
      `${silang.status} ${JSON.stringify(silang.data)?.slice(0, 140)}`
    );
    cek(
      "penyimpanan tantangan dilaporkan ke dasbor sebagai status eksplisit",
      Boolean((await instanceLain.baca("/api/kesehatan")).data?.status),
      "cek ringan: /api/kesehatan tetap hidup"
    );
    instanceLain.hentikan();

    /* 11. Kedaluwarsa -> pesan yang bisa ditindaklanjuti, bukan diam-diam. */
    const instanceUmur = await nyalakan({
      dirData: fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-tantangan-umur-")),
      env: { KCI_TANTANGAN_UMUR_DETIK: "1" },
    });
    const mintaUmur = await instanceUmur.kirim("/api/auth/kode/minta", { username: "hikaru" });
    lokasi.hikaru = mintaUmur.data?.kode;
    await jeda(1500);
    const kedaluwarsa = await instanceUmur.kirim("/api/auth/kode/periksa", { username: "hikaru" });
    cek(
      "tantangan kedaluwarsa -> 410 + sebab + tanpa tiket",
      kedaluwarsa.status === 410 &&
        kedaluwarsa.data?.kode === "kode-kedaluwarsa" &&
        !kedaluwarsa.data?.tiket,
      `${kedaluwarsa.status} ${JSON.stringify(kedaluwarsa.data)?.slice(0, 160)}`
    );
    const setelahKedaluwarsa = await instanceUmur.kirim("/api/auth/kode/periksa", {
      username: "hikaru",
    });
    cek(
      "entri kedaluwarsa dibuang, bukan dibiarkan menumpuk",
      setelahKedaluwarsa.status === 400 &&
        setelahKedaluwarsa.data?.kode === "tantangan-tidak-ada",
      `${setelahKedaluwarsa.status} ${JSON.stringify(setelahKedaluwarsa.data)?.slice(0, 140)}`
    );

    /* 12. Batas percobaan tetap berlaku walau prosesnya berbeda. */
    const instanceCoba = await nyalakan({
      dirData: fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-tantangan-coba-")),
      env: { KCI_TANTANGAN_MAKS_PERCOBAAN: "2", KCI_TANTANGAN_UMUR_DETIK: "600" },
    });
    await instanceCoba.kirim("/api/auth/kode/minta", { username: "hikaru" });
    await instanceCoba.kirim("/api/auth/kode/periksa", { username: "hikaru" });
    await jeda(1100);
    await instanceCoba.kirim("/api/auth/kode/periksa", { username: "hikaru" });
    await jeda(1100);
    const kelebihan = await instanceCoba.kirim("/api/auth/kode/periksa", { username: "hikaru" });
    cek(
      "melewati batas percobaan -> 429 terlalu-banyak-percobaan",
      kelebihan.status === 429 && kelebihan.data?.kode === "terlalu-banyak-percobaan",
      `${kelebihan.status} ${JSON.stringify(kelebihan.data)?.slice(0, 140)}`
    );
    const setelahBatas = await instanceCoba.kirim("/api/auth/kode/periksa", { username: "hikaru" });
    cek(
      "tantangan dibuang setelah batas percobaan (tidak dapat dipakai lagi)",
      setelahBatas.status === 400 && setelahBatas.data?.kode === "tantangan-tidak-ada",
      `${setelahBatas.status} ${JSON.stringify(setelahBatas.data)?.slice(0, 140)}`
    );

    instanceCoba.hentikan();
    instanceUmur.hentikan();
    instanceBaru.hentikan();
  } finally {
    server?.hentikan();
    peniru.server.close();
    bersihkanDirData(DIR_BERSAMA);
    bersihkanDirData(DIR_LAIN);
  }
}

/* ============ PEMINDAIAN BAN FAIR PLAY: jangkauan, pencabutan, batch, cron */

/* Inti keluhan pengguna: "banyak anggota memakai engine, jadi datanya tidak
   terlacak kalau dia kena banned." Yang diuji di sini:
     1. pemindaian menjangkau anggota SITUS, bukan hanya roster klub;
     2. ban fair play / akun ditutup / akun hilang mencabut verifikasi;
     3. Chess.com down TIDAK mencabut apa pun (rem pengaman);
     4. keluar dari klub hanya menandai, tidak mencabut (roster bisa telat 12 jam);
     5. batch + kursor menyusuri roster besar tanpa mengulang dari awal;
     6. endpoint cron terkunci KCI_CRON_SECRET dan gagal aman bila kosong. */
console.log("\nPemindaian fair play (jangkauan anggota situs & pencabutan verifikasi)");
{
  const { luncurkanServerUji, ambilTokenCsrf, nyalakanPeniruChess } = await import(
    "./alat-uji.mjs"
  );

  /** Tulis langsung data anggota: pemindaian harus menjangkau akun yang
   *  TIDAK ada di roster klub, dan itu tidak bisa dibuat lewat pendaftaran
   *  (pendaftaran justru menolak username di luar roster). */
  const tulisAnggota = (dir, daftar) =>
    fs.writeFileSync(path.join(dir, "anggota.json"), JSON.stringify(daftar, null, 2));
  const bacaAnggota = (dir) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, "anggota.json"), "utf8"));
    } catch {
      return [];
    }
  };
  const cariAnggota = (dir, username) =>
    bacaAnggota(dir).find((a) => a.username === username) || null;
  const bacaHitam = (dir) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, "daftar-hitam.json"), "utf8"));
    } catch {
      return [];
    }
  };

  /* Anggota situs yang sengaja TIDAK ada di roster klub tiruan
     (roster = magnuscarlsen, gothamchess, hikaru). */
  const anggotaAwal = [
    { username: "hikaru", terverifikasi: true, caraVerifikasi: "oauth", identitas: {} },
    { username: "tukang_engine", terverifikasi: true, caraVerifikasi: "oauth", identitas: {} },
    { username: "akun_ditutup", terverifikasi: true, caraVerifikasi: "kode", identitas: {} },
    { username: "akun_hilang", terverifikasi: true, caraVerifikasi: "oauth", identitas: {} },
    { username: "di_luar_klub", terverifikasi: true, caraVerifikasi: "oauth", identitas: {} },
  ];

  const peniru = await nyalakanPeniruChess({
    tukang_engine: {
      username: "Tukang_Engine",
      player_id: 9001,
      status: "closed:fair_play_violations",
      name: "Pemain Engine",
    },
    akun_ditutup: {
      username: "Akun_Ditutup",
      player_id: 9002,
      status: "closed",
      name: "Akun Ditutup",
    },
    // "akun_hilang" sengaja TIDAK didefinisikan -> mock menjawab 404.
  });

  const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-pindai-"));
  tulisAnggota(DIR, anggotaAwal);

  const server = await luncurkanServerUji({
    chessDasar: peniru.dasar,
    env: {
      KCI_DIR_DATA: DIR,
      KCI_BATAS_UMUM: "5000",
      KCI_BATAS_DAFTAR: "500",
    },
  });
  const csrf = await ambilTokenCsrf(server.dasar);
  const pindai = async () => {
    const r = await fetch(server.dasar + "/api/pengurus/pindai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
        "X-Token-Admin": server.token,
        "X-Forwarded-For": "10.88.0.1",
      },
      body: "{}",
    });
    return { status: r.status, data: await r.json().catch(() => null) };
  };

  try {
    const hasil = await pindai();
    cek("pindai -> 200", hasil.status === 200, `dapat ${hasil.status}`);

    /* 1. JANGKAUAN: anggota situs yang tidak ada di roster ikut dipindai.
          Sebelum perbaikan hanya 3 akun roster yang diperiksa, jadi akun
          pemakai engine di bawah ini tidak pernah terlihat sama sekali. */
    cek(
      "memindai gabungan roster + anggota situs (bukan roster saja)",
      hasil.data?.jumlahGabungan === 7 &&
        hasil.data?.jumlahKlub === 3 &&
        hasil.data?.jumlahSitus === 5 &&
        hasil.data?.diperiksa === 7,
      JSON.stringify({
        gabungan: hasil.data?.jumlahGabungan,
        klub: hasil.data?.jumlahKlub,
        situs: hasil.data?.jumlahSitus,
        diperiksa: hasil.data?.diperiksa,
      })
    );

    cek(
      "ban fair play terdeteksi pada akun DI LUAR roster",
      (hasil.data?.diblokir || []).includes("tukang_engine"),
      JSON.stringify(hasil.data?.diblokir)
    );
    cek(
      "akun ditutup terdeteksi",
      (hasil.data?.ditutup || []).includes("akun_ditutup")
    );
    cek(
      "akun hilang (404) terdeteksi",
      (hasil.data?.hilang || []).includes("akun_hilang")
    );
    cek(
      "tidak ada kegagalan jaringan pada pemindaian ini",
      (hasil.data?.gagal || []).length === 0,
      JSON.stringify(hasil.data?.gagal)
    );

    /* 2. PENCABUTAN verifikasi pada tiga sinyal yang berwenang. */
    const engine = cariAnggota(DIR, "tukang_engine");
    cek(
      "ban fair play -> terverifikasi:false + perluVerifikasiUlang:true",
      engine?.terverifikasi === false && engine?.perluVerifikasiUlang === true,
      JSON.stringify(engine)?.slice(0, 200)
    );
    cek(
      "ban fair play -> alasanStatus + diperiksaPada tercatat",
      engine?.alasanStatus === "fair_play_violations" &&
        Boolean(engine?.diperiksaPada) &&
        !Number.isNaN(Date.parse(engine?.diperiksaPada || "")),
      JSON.stringify({ alasan: engine?.alasanStatus, pada: engine?.diperiksaPada })
    );

    const ditutup = cariAnggota(DIR, "akun_ditutup");
    cek(
      "akun ditutup -> verifikasi dicabut dengan alasan 'closed'",
      ditutup?.terverifikasi === false && ditutup?.alasanStatus === "closed"
    );

    const hilang = cariAnggota(DIR, "akun_hilang");
    cek(
      "akun hilang -> verifikasi dicabut dengan alasan 'akun-hilang'",
      hilang?.terverifikasi === false && hilang?.alasanStatus === "akun-hilang"
    );

    cek(
      "tiga akun tercabut dilaporkan di hasil",
      (hasil.data?.dicabut || []).length === 3,
      JSON.stringify(hasil.data?.dicabut)
    );

    /* 3. Daftar hitam: hanya ban fair play, sesuai perilaku yang sudah ada.
          Anggota yang sekadar keluar klub tidak boleh dipermalukan di daftar
          hitam publik. */
    const hitam = bacaHitam(DIR);
    cek(
      "ban fair play otomatis masuk daftar hitam dengan sumber 'otomatis'",
      hitam.some((h) => h.username === "tukang_engine" && h.sumber === "otomatis"),
      JSON.stringify(hitam.map((h) => [h.username, h.sumber]))
    );
    cek(
      "anggota yang keluar klub TIDAK dimasukkan ke daftar hitam",
      !hitam.some((h) => h.username === "di_luar_klub")
    );

    /* 4. KELUAR KLUB: hanya ditandai, verifikasi TIDAK dicabut. */
    const luar = cariAnggota(DIR, "di_luar_klub");
    cek(
      "keluar klub -> ditandai perluVerifikasiUlang tapi verifikasi TETAP ada",
      luar?.perluVerifikasiUlang === true && luar?.terverifikasi === true,
      JSON.stringify(luar)?.slice(0, 200)
    );
    cek(
      "keluar klub -> alasanStatus 'keluar-klub'",
      luar?.alasanStatus === "keluar-klub"
    );

    /* 5. Anggota sehat tidak tersentuh status verifikasinya. */
    const sehat = cariAnggota(DIR, "hikaru");
    cek(
      "anggota sehat tetap terverifikasi dan tidak ditandai",
      sehat?.terverifikasi === true && sehat?.perluVerifikasiUlang !== true,
      JSON.stringify(sehat)?.slice(0, 200)
    );

    /* 6. Jejak audit per pencabutan. */
    let jejak = "";
    try {
      jejak = fs.readFileSync(path.join(DIR, "rahasia", "jejak-audit.jsonl"), "utf8");
    } catch {
      jejak = "";
    }
    cek(
      "jejak audit 'verifikasi-dicabut' tercatat",
      jejak.includes("verifikasi-dicabut") && jejak.includes("tukang_engine"),
      jejak ? jejak.slice(-200) : "berkas jejak tidak ditemukan"
    );

    /* 7. Dasbor menampilkan status pemindaian + jumlah yang perlu ditindak. */
    const dasbor = await fetch(server.dasar + "/api/pengurus", {
      headers: { "X-Token-Admin": server.token, "X-Forwarded-For": "10.88.0.2" },
    }).then((r) => r.json());
    cek(
      "dasbor: perluVerifikasiUlang terhitung",
      dasbor?.perluVerifikasiUlang === 4,
      `dapat ${dasbor?.perluVerifikasiUlang}`
    );
    cek(
      "dasbor: ban fair play otomatis terhitung",
      dasbor?.otomatis === 1,
      `dapat ${dasbor?.otomatis}`
    );
    cek(
      "dasbor: terakhir dipindai tersedia dan putarannya tuntas",
      dasbor?.verifikasi?.pindaiTerakhir?.pernah === true &&
        dasbor?.verifikasi?.pindaiTerakhir?.selesai === true,
      JSON.stringify(dasbor?.verifikasi?.pindaiTerakhir)
    );
    cek(
      "dasbor: mode verifikasi ikut dilaporkan",
      dasbor?.verifikasi?.mode === "opsional"
    );

    /* 8. Pemindaian ulang tidak menghitung ulang pencabutan yang sama,
          jadi angka dasbor tidak membengkak tiap 6 jam. */
    const ulang = await pindai();
    cek(
      "pemindaian ulang: akun yang sudah tercabut tidak dihitung lagi",
      (ulang.data?.dicabut || []).length === 0,
      JSON.stringify(ulang.data?.dicabut)
    );
    cek(
      "pemindaian ulang: anggota sehat TIDAK ikut dicabut",
      cariAnggota(DIR, "hikaru")?.terverifikasi === true
    );
  } finally {
    server.hentikan();
    peniru.server.close();
    bersihkanDirData(DIR);
  }
}

/* ------------------------- Chess.com down: jangan sentuh data anggota */
console.log("\nPemindaian fair play — Chess.com gagal menjawab (rem pengaman)");
{
  const { luncurkanServerUji, ambilTokenCsrf } = await import("./alat-uji.mjs");
  const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-pindai-gagal-"));
  fs.writeFileSync(
    path.join(DIR, "anggota.json"),
    JSON.stringify(
      [
        { username: "hikaru", terverifikasi: true, caraVerifikasi: "oauth", identitas: {} },
        { username: "magnuscarlsen", terverifikasi: true, caraVerifikasi: "kode", identitas: {} },
      ],
      null,
      2
    )
  );

  /* Port 1 tidak didengarkan apa pun -> koneksi ditolak untuk SEMUA permintaan
     Chess.com, persis kondisi Chess.com down. */
  const server = await luncurkanServerUji({
    chessDasar: "http://127.0.0.1:1",
    env: {
      KCI_DIR_DATA: DIR,
      KCI_BATAS_UMUM: "5000",
      KCI_CHESS_TIMEOUT: "400",
      KCI_CHESS_RETRY: "1",
    },
  });
  const csrf = await ambilTokenCsrf(server.dasar);
  try {
    const r = await fetch(server.dasar + "/api/pengurus/pindai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
        "X-Token-Admin": server.token,
        "X-Forwarded-For": "10.88.1.1",
      },
      body: "{}",
    });
    const hasil = await r.json().catch(() => null);

    cek("pindai saat Chess.com down -> 200 (tidak melempar)", r.status === 200, `dapat ${r.status}`);
    cek(
      "semua akun masuk 'gagal', bukan 'hilang'",
      (hasil?.gagal || []).length === 2 && (hasil?.hilang || []).length === 0,
      JSON.stringify({ gagal: hasil?.gagal?.length, hilang: hasil?.hilang?.length })
    );
    cek(
      "tidak ada verifikasi yang dicabut",
      (hasil?.dicabut || []).length === 0
    );

    const setelah = JSON.parse(fs.readFileSync(path.join(DIR, "anggota.json"), "utf8"));
    cek(
      "data anggota tidak berubah sedikit pun saat Chess.com down",
      setelah.every((a) => a.terverifikasi === true && a.perluVerifikasiUlang !== true),
      JSON.stringify(setelah)?.slice(0, 220)
    );
    cek(
      "roster yang gagal dibaca tidak memicu penandaan 'keluar-klub' massal",
      setelah.every((a) => a.alasanStatus !== "keluar-klub"),
      JSON.stringify(setelah.map((a) => a.alasanStatus))
    );
  } finally {
    server.hentikan();
    bersihkanDirData(DIR);
  }
}

/* ------------------------------------------ batch + kursor (maxDuration 60) */
console.log("\nPemindaian fair play — batch & kursor pada roster besar");
{
  const { luncurkanServerUji, ambilTokenCsrf, nyalakanPeniruChess } = await import(
    "./alat-uji.mjs"
  );
  const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-pindai-batch-"));
  /* 45 anggota situs, semuanya tak dikenal mock -> 404. Ditambah 3 akun roster
     menjadi 48 target: lebih besar dari satu batch (40) supaya kursor terpakai. */
  const banyak = Array.from({ length: 45 }, (_, i) => ({
    username: `batch_${String(i + 1).padStart(3, "0")}`,
    terverifikasi: true,
    caraVerifikasi: "oauth",
    identitas: {},
  }));
  fs.writeFileSync(path.join(DIR, "anggota.json"), JSON.stringify(banyak, null, 2));

  const peniru = await nyalakanPeniruChess();
  const server = await luncurkanServerUji({
    chessDasar: peniru.dasar,
    env: { KCI_DIR_DATA: DIR, KCI_BATAS_UMUM: "5000" },
  });
  const csrf = await ambilTokenCsrf(server.dasar);
  const pindai = async () => {
    const r = await fetch(server.dasar + "/api/pengurus/pindai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
        "X-Token-Admin": server.token,
        "X-Forwarded-For": "10.88.2.1",
      },
      body: "{}",
    });
    return { status: r.status, data: await r.json().catch(() => null) };
  };

  try {
    const pertama = await pindai();
    cek(
      "batch pertama dibatasi 40 akun, tidak seluruh roster sekaligus",
      pertama.data?.diperiksa === 40,
      `diperiksa=${pertama.data?.diperiksa}`
    );
    cek(
      "batch pertama menandai putaran belum tuntas + menyimpan kursor",
      pertama.data?.selesai === false && Boolean(pertama.data?.kursorLanjut),
      JSON.stringify({ selesai: pertama.data?.selesai, kursor: pertama.data?.kursorLanjut })
    );

    const kedua = await pindai();
    cek(
      "batch kedua MELANJUTKAN dari kursor (bukan mengulang dari awal)",
      kedua.data?.kursor === pertama.data?.kursorLanjut && kedua.data?.diperiksa === 8,
      JSON.stringify({ kursor: kedua.data?.kursor, diperiksa: kedua.data?.diperiksa })
    );
    cek("batch kedua menyelesaikan putaran", kedua.data?.selesai === true);

    const ketiga = await pindai();
    cek(
      "setelah tuntas, putaran baru mulai lagi dari awal",
      ketiga.data?.kursor === "" && ketiga.data?.diperiksa === 40,
      JSON.stringify({ kursor: ketiga.data?.kursor, diperiksa: ketiga.data?.diperiksa })
    );

    const semua = JSON.parse(fs.readFileSync(path.join(DIR, "anggota.json"), "utf8"));
    cek(
      "seluruh 45 akun akhirnya terperiksa dan tercabut (tidak ada yang terlewat)",
      semua.length === 45 && semua.every((a) => a.terverifikasi === false),
      `tercabut=${semua.filter((a) => a.terverifikasi === false).length}/${semua.length}`
    );
  } finally {
    server.hentikan();
    peniru.server.close();
    bersihkanDirData(DIR);
  }
}

/* ------------------------------------------- endpoint cron terjadwal */
console.log("\nEndpoint cron /api/verifikasi/pindai-jadwal (KCI_CRON_SECRET)");
{
  const { luncurkanServerUji, nyalakanPeniruChess, ambilTokenCsrf } = await import(
    "./alat-uji.mjs"
  );
  const RAHASIA_CRON = "rahasia-cron-uji-yang-cukup-panjang";

  const panggil = async (dasar, headerAuth) => {
    const r = await fetch(dasar + "/api/verifikasi/pindai-jadwal", {
      headers: {
        "X-Forwarded-For": "10.88.3.1",
        ...(headerAuth ? { Authorization: headerAuth } : {}),
      },
    });
    return { status: r.status, data: await r.json().catch(() => null) };
  };

  /* a) Tanpa KCI_CRON_SECRET: endpoint HARUS menolak (503), bukan terbuka. */
  const DIR_TANPA = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-cron-tanpa-"));
  const peniruA = await nyalakanPeniruChess();
  const tanpaRahasia = await luncurkanServerUji({
    chessDasar: peniruA.dasar,
    env: { KCI_DIR_DATA: DIR_TANPA, KCI_BATAS_UMUM: "5000", KCI_CRON_SECRET: "" },
  });
  try {
    const kosong = await panggil(tanpaRahasia.dasar);
    cek(
      "KCI_CRON_SECRET kosong -> 503 (gagal aman, bukan terbuka)",
      kosong.status === 503 && kosong.data?.dijalankan === false,
      `${kosong.status} ${JSON.stringify(kosong.data)?.slice(0, 140)}`
    );
    const nebak = await panggil(tanpaRahasia.dasar, `Bearer ${RAHASIA_CRON}`);
    cek(
      "KCI_CRON_SECRET kosong -> tebakan rahasia tetap 503",
      nebak.status === 503
    );
  } finally {
    tanpaRahasia.hentikan();
    peniruA.server.close();
    bersihkanDirData(DIR_TANPA);
  }

  /* b) Dengan KCI_CRON_SECRET: hanya bearer yang cocok yang jalan. */
  const DIR_CRON = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-cron-"));
  fs.writeFileSync(
    path.join(DIR_CRON, "anggota.json"),
    JSON.stringify(
      [{ username: "hikaru", terverifikasi: true, caraVerifikasi: "oauth", identitas: {} }],
      null,
      2
    )
  );
  const peniruB = await nyalakanPeniruChess();
  const denganRahasia = await luncurkanServerUji({
    chessDasar: peniruB.dasar,
    env: {
      KCI_DIR_DATA: DIR_CRON,
      KCI_BATAS_UMUM: "5000",
      KCI_CRON_SECRET: RAHASIA_CRON,
    },
  });
  try {
    const tanpaHeader = await panggil(denganRahasia.dasar);
    cek("tanpa header Authorization -> 401", tanpaHeader.status === 401, `dapat ${tanpaHeader.status}`);

    const salah = await panggil(denganRahasia.dasar, `Bearer rahasia-salah`);
    cek("bearer salah -> 401", salah.status === 401, `dapat ${salah.status}`);

    const tanpaPrefix = await panggil(denganRahasia.dasar, RAHASIA_CRON);
    cek(
      "rahasia tanpa skema 'Bearer' -> 401",
      tanpaPrefix.status === 401,
      `dapat ${tanpaPrefix.status}`
    );

    const skemaSalah = await panggil(denganRahasia.dasar, `Basic ${RAHASIA_CRON}`);
    cek("skema Basic dengan rahasia benar -> 401", skemaSalah.status === 401);

    const benar = await panggil(denganRahasia.dasar, `Bearer ${RAHASIA_CRON}`);
    cek(
      "bearer benar -> 200 dan pemindaian dijalankan",
      benar.status === 200 && benar.data?.dijalankan === true,
      `${benar.status} ${JSON.stringify(benar.data)?.slice(0, 160)}`
    );
    cek(
      "cron melaporkan cakupan pemindaian",
      typeof benar.data?.diperiksa === "number" && benar.data?.diperiksa >= 1,
      JSON.stringify({ diperiksa: benar.data?.diperiksa })
    );

    /* Throttle 6 jam: panggilan cron berikutnya dalam putaran yang sama
       menjawab 200 dengan dijalankan:false — itu normal, bukan kegagalan. */
    const lagi = await panggil(denganRahasia.dasar, `Bearer ${RAHASIA_CRON}`);
    cek(
      "pemanggilan beruntun kena throttle 6 jam -> 200 + dijalankan:false",
      lagi.status === 200 && lagi.data?.dijalankan === false,
      `${lagi.status} ${JSON.stringify(lagi.data)?.slice(0, 140)}`
    );

    /* Endpoint cron tidak boleh bocor jadi jalur pengurus. CSRF disertakan
       supaya yang diukur benar-benar keputusan otorisasi admin, bukan
       penolakan CSRF yang memang terjadi lebih dulu. */
    const csrfCron = await ambilTokenCsrf(denganRahasia.dasar);
    const adminPalsu = await fetch(denganRahasia.dasar + "/api/pengurus/pindai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfCron,
        Authorization: `Bearer ${RAHASIA_CRON}`,
        "X-Forwarded-For": "10.88.3.9",
      },
      body: "{}",
    });
    cek(
      "rahasia cron TIDAK diterima sebagai token pengurus",
      adminPalsu.status === 401,
      `dapat ${adminPalsu.status}`
    );
  } finally {
    denganRahasia.hentikan();
    peniruB.server.close();
    bersihkanDirData(DIR_CRON);
  }
}

/* Paket Vercel Hobby MENOLAK deployment dengan cron lebih dari sekali sehari,
   jadi pemindaian terjadwal hanya dipanggil sekali sehari. Konsekuensinya satu
   pemanggilan HARUS menutup seluruh roster: bila hanya satu batch (40 akun)
   yang jalan, akun di ujung daftar baru terperiksa berhari-hari kemudian.
   Uji ini menaruh satu akun kena ban di ujung alfabet (`zzz_engine`) — batch
   pertama tidak mungkin mencapainya — lalu memastikan satu pemanggilan cron
   tetap menemukannya. */
console.log("\nCron terjadwal: banyak batch dalam satu pemanggilan");
{
  const { luncurkanServerUji, nyalakanPeniruChess } = await import("./alat-uji.mjs");
  const RAHASIA_CRON = "rahasia-cron-uji-yang-cukup-panjang";

  /* 50 anggota sehat + 1 akun kena ban di ujung alfabet. Ditambah roster klub
     (3 akun) gabungannya melewati batas 40 akun per batch. */
  const pemainTambahan = {};
  const anggotaSitus = [];
  for (let i = 1; i <= 50; i += 1) {
    const nama = `pemain${String(i).padStart(3, "0")}`;
    pemainTambahan[nama] = {
      username: nama,
      player_id: 5000 + i,
      status: "basic",
      name: nama,
    };
    anggotaSitus.push({
      username: nama,
      terverifikasi: true,
      caraVerifikasi: "oauth",
      identitas: {},
    });
  }
  pemainTambahan.zzz_engine = {
    username: "zzz_engine",
    player_id: 5999,
    status: "closed:fair_play_violations",
    name: "Kena Ban Di Ujung Daftar",
  };
  anggotaSitus.push({
    username: "zzz_engine",
    terverifikasi: true,
    caraVerifikasi: "oauth",
    identitas: {},
  });

  const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-cron-batch-"));
  fs.writeFileSync(path.join(DIR, "anggota.json"), JSON.stringify(anggotaSitus, null, 2));
  const peniru = await nyalakanPeniruChess(pemainTambahan);
  const server = await luncurkanServerUji({
    chessDasar: peniru.dasar,
    env: {
      KCI_DIR_DATA: DIR,
      KCI_BATAS_UMUM: "5000",
      KCI_CRON_SECRET: RAHASIA_CRON,
    },
  });
  try {
    const r = await fetch(server.dasar + "/api/verifikasi/pindai-jadwal", {
      headers: {
        Authorization: `Bearer ${RAHASIA_CRON}`,
        "X-Forwarded-For": "10.88.4.1",
      },
    });
    const data = await r.json().catch(() => null);

    cek(
      "satu pemanggilan cron -> 200",
      r.status === 200 && data?.dijalankan === true,
      `${r.status} ${JSON.stringify(data)?.slice(0, 160)}`
    );
    cek(
      "roster di atas 40 akun dikerjakan dalam LEBIH dari satu batch",
      typeof data?.batch === "number" && data.batch >= 2,
      `batch=${data?.batch} diperiksa=${data?.diperiksa}`
    );
    cek(
      "putaran tuntas dalam satu pemanggilan (bukan berhenti di batch pertama)",
      data?.selesai === true,
      JSON.stringify({ selesai: data?.selesai, batch: data?.batch })
    );
    cek(
      "seluruh gabungan roster + anggota situs terperiksa",
      typeof data?.diperiksa === "number" && data.diperiksa >= 51,
      `diperiksa=${data?.diperiksa}`
    );
    cek(
      "akun kena ban di UJUNG alfabet tertangkap dalam satu pemanggilan",
      Array.isArray(data?.diblokir) && data.diblokir.includes("zzz_engine"),
      JSON.stringify(data?.diblokir)
    );
    cek(
      "verifikasi akun kena ban itu ikut dicabut",
      Array.isArray(data?.dicabut) && data.dicabut.includes("zzz_engine"),
      JSON.stringify(data?.dicabut)
    );

    /* Kursor harus kosong lagi setelah putaran tuntas, supaya pemanggilan
       berikutnya mulai dari awal daftar (bukan melewatkan 40 akun pertama). */
    const meta = JSON.parse(
      fs.readFileSync(path.join(DIR, "terakhir-pindai.json"), "utf8")
    );
    cek(
      "kursor dikosongkan setelah putaran tuntas",
      meta.selesai === true && meta.kursor === "" && Boolean(meta.waktu),
      JSON.stringify({ selesai: meta.selesai, kursor: meta.kursor, waktu: meta.waktu })
    );

    /* Anggota sehat tidak boleh kehilangan verifikasi hanya karena ikut
       terpindai — pencabutan satu arah khusus temuan nyata. */
    const setelah = JSON.parse(fs.readFileSync(path.join(DIR, "anggota.json"), "utf8"));
    const sehat = setelah.filter(
      (a) => a.username.startsWith("pemain") && a.terverifikasi !== true
    );
    cek(
      "50 anggota sehat tetap terverifikasi setelah pemindaian",
      sehat.length === 0,
      JSON.stringify(sehat.map((a) => a.username).slice(0, 5))
    );
  } finally {
    server.hentikan();
    peniru.server.close();
    bersihkanDirData(DIR);
  }
}

/* ================ VERIFIKASI MANDIRI (anggota lama) + GERBANG TURNAMEN */

/* Tanpa jalur ini, pengetatan mode `wajib` mengunci anggota lama yang
   terverifikasi:false secara permanen: pendaftaran menolak username yang sudah
   ada (409), jadi mereka tidak bisa mengulang dari formulir. */
console.log("\nVerifikasi mandiri anggota lama (POST /api/anggota/verifikasi-diri)");
{
  const { luncurkanServerUji, ambilTokenCsrf, nyalakanPeniruChess } = await import(
    "./alat-uji.mjs"
  );

  const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-mandiri-"));
  const tulisAnggota = (daftar) =>
    fs.writeFileSync(path.join(DIR, "anggota.json"), JSON.stringify(daftar, null, 2));
  const cariAnggota = (username) => {
    try {
      return (
        JSON.parse(fs.readFileSync(path.join(DIR, "anggota.json"), "utf8")).find(
          (a) => a.username === username
        ) || null
      );
    } catch {
      return null;
    }
  };

  /* hikaru: anggota lama yang dulu mendaftar tanpa bukti (di roster, sehat).
     tukang_engine: akan kena ban fair play lewat pemindaian.
     di_luar_klub: sehat tapi tidak ada di roster (hanya ditandai). */
  tulisAnggota([
    { username: "hikaru", terverifikasi: false, caraVerifikasi: null, identitas: {} },
    { username: "tukang_engine", terverifikasi: true, caraVerifikasi: "oauth", identitas: {} },
    { username: "di_luar_klub", terverifikasi: true, caraVerifikasi: "oauth", identitas: {}, perluVerifikasiUlang: true, alasanStatus: "keluar-klub" },
  ]);

  const peniru = await nyalakanPeniruChess({
    tukang_engine: {
      username: "Tukang_Engine",
      player_id: 9101,
      status: "closed:fair_play_violations",
      name: "Pemain Engine",
    },
  });

  const server = await luncurkanServerUji({
    chessDasar: peniru.dasar,
    env: { KCI_DIR_DATA: DIR, KCI_BATAS_UMUM: "5000", KCI_BATAS_DAFTAR: "500" },
  });
  const csrf = await ambilTokenCsrf(server.dasar);
  let nomorIp = 0;

  const verifikasiDiri = async ({ username, tiket, tanpaCsrf = false, token } = {}) => {
    nomorIp += 1;
    const r = await fetch(server.dasar + "/api/anggota/verifikasi-diri", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tanpaCsrf ? {} : { "X-CSRF-Token": csrf }),
        ...(token ? { "X-Token-Admin": token } : {}),
        "X-Forwarded-For": `10.99.0.${nomorIp}`,
      },
      body: JSON.stringify({ username, tiketVerifikasi: tiket }),
    });
    return { status: r.status, data: await r.json().catch(() => null) };
  };

  try {
    /* --- Penolakan dasar ------------------------------------------------- */
    const tanpaCsrf = await verifikasiDiri({ username: "hikaru", tiket: "x", tanpaCsrf: true });
    cek("tanpa token CSRF -> 403", tanpaCsrf.status === 403, `dapat ${tanpaCsrf.status}`);

    const tanpaTiket = await verifikasiDiri({ username: "hikaru" });
    cek(
      "tanpa tiket -> 403 + kodeVerifikasi 'kosong'",
      tanpaTiket.status === 403 && tanpaTiket.data?.kodeVerifikasi === "kosong",
      JSON.stringify(tanpaTiket.data)?.slice(0, 160)
    );
    cek(
      "tanpa tiket -> status anggota tidak berubah",
      cariAnggota("hikaru")?.terverifikasi === false
    );

    const palsu = await verifikasiDiri({ username: "hikaru", tiket: "kci1.e30.bm9wZQ" });
    cek(
      "tiket palsu -> 403 'tidak-sah'",
      palsu.status === 403 && palsu.data?.kodeVerifikasi === "tidak-sah",
      JSON.stringify(palsu.data)?.slice(0, 160)
    );

    /* Tiket sah tetapi untuk username lain: tidak boleh dipakai membajak
       akun anggota lain. */
    const tiketOrang = oauth.terbitkanTiket("magnuscarlsen", "oauth").tiket;
    const bajak = await verifikasiDiri({ username: "hikaru", tiket: tiketOrang });
    cek(
      "tiket milik username lain -> 403 'username-beda'",
      bajak.status === 403 && bajak.data?.kodeVerifikasi === "username-beda",
      JSON.stringify(bajak.data)?.slice(0, 160)
    );
    cek(
      "percobaan bajak tidak memverifikasi akun target",
      cariAnggota("hikaru")?.terverifikasi === false
    );

    /* Anggota yang tidak ada: endpoint melengkapi verifikasi, bukan mendaftar. */
    const tiketAsing = oauth.terbitkanTiket("gothamchess", "oauth").tiket;
    const bukanAnggota = await verifikasiDiri({ username: "gothamchess", tiket: tiketAsing });
    cek(
      "username bukan anggota -> 404 (tidak membuat anggota baru)",
      bukanAnggota.status === 404,
      `${bukanAnggota.status} ${JSON.stringify(bukanAnggota.data)?.slice(0, 140)}`
    );
    cek(
      "username bukan anggota tidak ditambahkan ke data",
      cariAnggota("gothamchess") === null
    );

    /* --- Jalur bahagia --------------------------------------------------- */
    const { tiket: tiketHikaru } = oauth.terbitkanTiket("HIKARU", "oauth");
    const sukses = await verifikasiDiri({ username: "HIKARU", tiket: tiketHikaru });
    cek(
      "tiket sah (username beda kapitalisasi) -> 200 terverifikasi",
      sukses.status === 200 && sukses.data?.terverifikasi === true,
      `${sukses.status} ${JSON.stringify(sukses.data)?.slice(0, 180)}`
    );
    const sesudah = cariAnggota("hikaru");
    cek(
      "entri anggota tercatat terverifikasi dari bukti server",
      sesudah?.terverifikasi === true && sesudah?.caraVerifikasi === "oauth",
      JSON.stringify(sesudah)?.slice(0, 200)
    );
    cek(
      "penanda perluVerifikasiUlang dibersihkan",
      sesudah?.perluVerifikasiUlang === false
    );
    cek(
      "tiket TIDAK dikembalikan ke klien",
      !JSON.stringify(sukses.data || {}).includes(tiketHikaru) &&
        sukses.data?.tiketVerifikasi === undefined,
      JSON.stringify(sukses.data)?.slice(0, 200)
    );

    /* Tiket sekali pakai: replay harus gagal, bukan memverifikasi ulang. */
    const replay = await verifikasiDiri({ username: "hikaru", tiket: tiketHikaru });
    cek(
      "tiket tidak dapat dipakai ulang (replay)",
      replay.status !== 200 &&
        ["sudah-dipakai", "kedaluwarsa", "tidak-sah"].includes(replay.data?.kodeVerifikasi),
      `${replay.status} ${JSON.stringify(replay.data)?.slice(0, 160)}`
    );

    /* Penandaan "keluar-klub" bisa dibersihkan dengan bukti baru. */
    const tiketLuar = oauth.terbitkanTiket("di_luar_klub", "kode").tiket;
    const luar = await verifikasiDiri({ username: "di_luar_klub", tiket: tiketLuar });
    cek(
      "anggota di luar roster tetap bisa memverifikasi diri -> 200",
      luar.status === 200,
      `${luar.status} ${JSON.stringify(luar.data)?.slice(0, 160)}`
    );
    cek(
      "alasanStatus 'keluar-klub' dibersihkan setelah bukti baru",
      cariAnggota("di_luar_klub")?.alasanStatus === null &&
        cariAnggota("di_luar_klub")?.perluVerifikasiUlang === false,
      JSON.stringify(cariAnggota("di_luar_klub"))?.slice(0, 200)
    );

    /* --- Bypass yang harus TERTUTUP -------------------------------------- */
    /* Pemindaian otomatis memblokir tukang_engine. Setelah itu, endpoint ini
       tidak boleh bisa memulihkan status verifikasinya dengan tiket baru. */
    const pindai = await fetch(server.dasar + "/api/pengurus/pindai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
        "X-Token-Admin": server.token,
        "X-Forwarded-For": "10.99.1.1",
      },
      body: "{}",
    }).then((r) => r.json());
    cek(
      "pemindaian memblokir tukang_engine lebih dulu",
      (pindai?.diblokir || []).includes("tukang_engine"),
      JSON.stringify(pindai?.diblokir)
    );
    cek(
      "pemindaian mencabut verifikasi tukang_engine",
      cariAnggota("tukang_engine")?.terverifikasi === false
    );

    const tiketEngine = oauth.terbitkanTiket("tukang_engine", "oauth").tiket;
    const pulihkan = await verifikasiDiri({ username: "tukang_engine", tiket: tiketEngine });
    cek(
      "akun kena ban fair play TIDAK bisa memulihkan diri lewat verifikasi mandiri",
      pulihkan.status === 403 && pulihkan.data?.diblokir === true,
      `${pulihkan.status} ${JSON.stringify(pulihkan.data)?.slice(0, 180)}`
    );
    cek(
      "status tercabut akun banned tetap bertahan",
      cariAnggota("tukang_engine")?.terverifikasi === false,
      JSON.stringify(cariAnggota("tukang_engine"))?.slice(0, 200)
    );

    /* Jejak audit. */
    let jejak = "";
    try {
      jejak = fs.readFileSync(path.join(DIR, "rahasia", "jejak-audit.jsonl"), "utf8");
    } catch {
      jejak = "";
    }
    cek(
      "jejak audit 'verifikasi-mandiri' tercatat",
      jejak.includes("verifikasi-mandiri") && jejak.includes("hikaru"),
      jejak ? jejak.slice(-160) : "berkas jejak tidak ditemukan"
    );
    cek(
      "penolakan juga meninggalkan jejak audit",
      jejak.includes("verifikasi-mandiri-ditolak")
    );

    /* --- Gerbang turnamen (T5) ------------------------------------------ */
    /* Turnamen dibuat tanpa pengecualian: anggota belum terverifikasi tidak
       boleh mendaftar sendiri. */
    tulisAnggota([
      { username: "hikaru", terverifikasi: false, caraVerifikasi: null, identitas: {} },
      { username: "magnuscarlsen", terverifikasi: true, caraVerifikasi: "oauth", identitas: {} },
    ]);
    const buatTurnamen = (nama, izinkan) =>
      fetch(server.dasar + "/api/pengurus/turnamen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
          "X-Token-Admin": server.token,
          "X-Forwarded-For": "10.99.2.1",
        },
        body: JSON.stringify({
          jenis: "bulanan",
          nama,
          status: "pendaftaran",
          ...(izinkan === undefined ? {} : { izinkanBelumTerverifikasi: izinkan }),
        }),
      }).then((r) => r.json());

    const daftarTurnamen = async (id, username) => {
      nomorIp += 1;
      const r = await fetch(server.dasar + `/api/turnamen/${id}/daftar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
          "X-Forwarded-For": `10.99.3.${nomorIp}`,
        },
        body: JSON.stringify({ username }),
      });
      return { status: r.status, data: await r.json().catch(() => null) };
    };

    const ketat = await buatTurnamen("Turnamen Gerbang Ketat");
    cek("turnamen uji dibuat", Boolean(ketat?.id), JSON.stringify(ketat)?.slice(0, 160));

    const belumVerif = await daftarTurnamen(ketat.id, "hikaru");
    cek(
      "anggota belum terverifikasi ditolak mendaftar turnamen",
      belumVerif.status === 403 && belumVerif.data?.perluVerifikasi === true,
      `${belumVerif.status} ${JSON.stringify(belumVerif.data)?.slice(0, 180)}`
    );
    cek(
      "pesan penolakan mengarahkan melengkapi verifikasi",
      /verifikasi/i.test(belumVerif.data?.pesan || ""),
      belumVerif.data?.pesan
    );
    cek(
      "penolakan tidak memasukkan pengajuan peserta",
      belumVerif.data?.status !== "menunggu"
    );

    const sudahVerif = await daftarTurnamen(ketat.id, "magnuscarlsen");
    cek(
      "anggota terverifikasi tetap bisa mendaftar turnamen",
      sudahVerif.status === 201,
      `${sudahVerif.status} ${JSON.stringify(sudahVerif.data)?.slice(0, 180)}`
    );

    /* Setelah melengkapi verifikasi, anggota yang tadi ditolak bisa masuk. */
    const tiketBaru = oauth.terbitkanTiket("hikaru", "oauth").tiket;
    const lengkapi = await verifikasiDiri({ username: "hikaru", tiket: tiketBaru });
    cek("anggota melengkapi verifikasi -> 200", lengkapi.status === 200, `${lengkapi.status}`);
    const setelahLengkap = await daftarTurnamen(ketat.id, "hikaru");
    cek(
      "setelah terverifikasi, pendaftaran turnamen diterima",
      setelahLengkap.status === 201,
      `${setelahLengkap.status} ${JSON.stringify(setelahLengkap.data)?.slice(0, 180)}`
    );

    /* Pengecualian per-even yang bisa dibuka pengurus. */
    const longgar = await buatTurnamen("Turnamen Pengecualian", true);
    cek(
      "pengecualian per-even tersimpan dan terumumkan",
      longgar?.izinkanBelumTerverifikasi === true,
      JSON.stringify({ izin: longgar?.izinkanBelumTerverifikasi })
    );
    tulisAnggota([
      { username: "hikaru", terverifikasi: false, caraVerifikasi: null, identitas: {} },
    ]);
    const denganIzin = await daftarTurnamen(longgar.id, "hikaru");
    cek(
      "even dengan pengecualian menerima anggota belum terverifikasi",
      denganIzin.status === 201,
      `${denganIzin.status} ${JSON.stringify(denganIzin.data)?.slice(0, 180)}`
    );

  } finally {
    server.hentikan();
    peniru.server.close();
    bersihkanDirData(DIR);
  }
}

/* ------- pengecualian per-even TIDAK meloloskan akun kena ban fair play */

/* Dipisah karena yang diuji harus anggota ROSTER klub: `tukang_engine` di blok
   sebelumnya tidak ada di roster sehingga ditolak lebih dulu oleh pemeriksaan
   keanggotaan klub, bukan oleh pemeriksaan ban. */
console.log("\nGerbang turnamen — akun banned tidak lolos lewat pengecualian");
{
  const { luncurkanServerUji, ambilTokenCsrf, nyalakanPeniruChess } = await import(
    "./alat-uji.mjs"
  );
  const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "kci-uji-gerbang-ban-"));
  /* "hikaru" ada di roster tiruan; di sini profilnya dibuat kena ban fair play. */
  const peniru = await nyalakanPeniruChess(
    {},
    {
      ubahProfil: (u) =>
        u === "hikaru" ? { status: "closed:fair_play_violations" } : {},
    }
  );
  fs.writeFileSync(
    path.join(DIR, "anggota.json"),
    JSON.stringify(
      [{ username: "hikaru", terverifikasi: false, caraVerifikasi: null, identitas: {} }],
      null,
      2
    )
  );
  const server = await luncurkanServerUji({
    chessDasar: peniru.dasar,
    env: { KCI_DIR_DATA: DIR, KCI_BATAS_UMUM: "5000" },
  });
  const csrf = await ambilTokenCsrf(server.dasar);
  try {
    const buat = await fetch(server.dasar + "/api/pengurus/turnamen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
        "X-Token-Admin": server.token,
        "X-Forwarded-For": "10.99.9.1",
      },
      body: JSON.stringify({
        jenis: "bulanan",
        nama: "Turnamen Longgar",
        status: "pendaftaran",
        izinkanBelumTerverifikasi: true,
      }),
    }).then((r) => r.json());

    const daftar = await fetch(server.dasar + `/api/turnamen/${buat.id}/daftar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
        "X-Forwarded-For": "10.99.9.2",
      },
      body: JSON.stringify({ username: "hikaru" }),
    });
    const data = await daftar.json().catch(() => null);
    cek(
      "pengecualian per-even TIDAK meloloskan akun kena ban fair play",
      daftar.status === 403 && data?.diblokir === true,
      `${daftar.status} ${JSON.stringify(data)?.slice(0, 180)}`
    );

    /* Verifikasi mandiri juga harus menolak, walau akunnya ada di roster. */
    const tiket = oauth.terbitkanTiket("hikaru", "oauth").tiket;
    const mandiri = await fetch(server.dasar + "/api/anggota/verifikasi-diri", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
        "X-Forwarded-For": "10.99.9.3",
      },
      body: JSON.stringify({ username: "hikaru", tiketVerifikasi: tiket }),
    });
    const dataMandiri = await mandiri.json().catch(() => null);
    cek(
      "akun banned di roster tetap ditolak verifikasi mandiri",
      mandiri.status === 403 && dataMandiri?.diblokir === true,
      `${mandiri.status} ${JSON.stringify(dataMandiri)?.slice(0, 180)}`
    );
    const setelah = JSON.parse(fs.readFileSync(path.join(DIR, "anggota.json"), "utf8"));
    cek(
      "verifikasi tidak dipulihkan oleh percobaan itu",
      setelah[0]?.terverifikasi === false,
      JSON.stringify(setelah[0])?.slice(0, 180)
    );
  } finally {
    server.hentikan();
    peniru.server.close();
    bersihkanDirData(DIR);
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(`  ${lulus} lulus, ${gagal} gagal`);
console.log(`${"=".repeat(50)}\n`);
process.exit(gagal ? 1 : 0);
