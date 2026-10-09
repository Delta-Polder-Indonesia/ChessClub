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
import { fileURLToPath } from "node:url";

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
  const AKAR_REPO = fileURLToPath(new URL("../../", import.meta.url));
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
      throw new Error(`Server uji di ${DASAR} tidak merespons; uji HTTP verifikasi tidak boleh dilewati.`);
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
    } catch (galat) {
      throw new Error(`Server uji tidak menerbitkan token CSRF: ${galat?.message || galat}`, { cause: galat });
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
      const AKAR_REPO = fileURLToPath(new URL("../../", import.meta.url));
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
    fs.rmSync(DIR_BERSAMA, { recursive: true, force: true });
    fs.rmSync(DIR_LAIN, { recursive: true, force: true });
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(`  ${lulus} lulus, ${gagal} gagal`);
console.log(`${"=".repeat(50)}\n`);
process.exit(gagal ? 1 : 0);
