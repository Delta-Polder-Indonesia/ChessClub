/**
 * Uji verifikasi kepemilikan akun Chess.com.
 * Bagian yang butuh profil sungguhan disimulasikan dengan menyuntik
 * jawaban Chess.com, agar uji tidak bergantung pada akun nyata.
 */
import assert from "node:assert";

process.env.KCI_PEPPER = "pepper-uji-verifikasi-yang-panjang";
process.env.KCI_DIR_DATA = "/tmp/kci-uji-verif";

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

/* ------------------------------------------------------------- PKCE */

const oauth = await import("../src/oauth.js");
const crypto = await import("node:crypto");

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

/* ------------------------------------------------------------ tiket */

console.log("\nTiket verifikasi");
{
  const { tiket } = oauth.terbitkanTiket("BudiCatur", "oauth");
  cek("tiket diterbitkan", Boolean(tiket));

  const intip = oauth.intipTiket(tiket);
  cek("intip tidak memakai tiket", intip?.username === "budicatur");
  cek("intip kedua kali masih ada", Boolean(oauth.intipTiket(tiket)));

  cek(
    "tiket ditolak untuk username lain",
    oauth.pakaiTiket(tiket, "orang-lain") === null
  );

  const pakai = oauth.pakaiTiket(tiket, "budicatur");
  cek("tiket diterima untuk username benar", pakai?.cara === "oauth");
  cek(
    "tiket sekali pakai (percobaan kedua gagal)",
    oauth.pakaiTiket(tiket, "budicatur") === null
  );
  cek("tiket palsu ditolak", oauth.pakaiTiket("tiket-karangan", "budicatur") === null);
  cek(
    "username tidak peka huruf besar/kecil",
    (() => {
      const { tiket: t } = oauth.terbitkanTiket("SitiAminah", "kode-profil");
      return oauth.pakaiTiket(t, "sitiaminah")?.cara === "kode-profil";
    })()
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

  // Suntik kunci publik palsu agar tidak perlu memanggil Chess.com.
  const asli = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/certs")) {
      return new Response(JSON.stringify({ keys: [jwk] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return asli(url);
  };

  const buatToken = (muatan, kunci = privateKey, alg = "RS256") => {
    const kepala = Buffer.from(
      JSON.stringify({ alg, typ: "JWT", kid: "uji-kunci" })
    ).toString("base64url");
    const isi = Buffer.from(JSON.stringify(muatan)).toString("base64url");
    if (alg === "none") return `${kepala}.${isi}.`;
    const tanda = crypto
      .sign("RSA-SHA256", Buffer.from(`${kepala}.${isi}`), kunci)
      .toString("base64url");
    return `${kepala}.${isi}.${tanda}`;
  };

  const kini = Math.floor(Date.now() / 1000);
  const sah = buatToken({
    sub: "12345",
    preferred_username: "BudiCatur",
    aud: "klien-kci",
    exp: kini + 3600,
  });

  const muatan = await oauth.verifikasiIdToken(sah, { clientId: "klien-kci" });
  cek("token sah diterima", muatan.preferred_username === "BudiCatur");

  // Tanda tangan dipalsukan
  const rusak = sah.slice(0, -6) + "AAAAAA";
  let ditolak = false;
  try {
    await oauth.verifikasiIdToken(rusak, { clientId: "klien-kci" });
  } catch {
    ditolak = true;
  }
  cek("tanda tangan palsu DITOLAK", ditolak);

  // Serangan alg:none
  const tanpaTanda = buatToken(
    { sub: "1", preferred_username: "penyusup", exp: kini + 3600 },
    null,
    "none"
  );
  let tolakNone = false;
  try {
    await oauth.verifikasiIdToken(tanpaTanda, { clientId: "klien-kci" });
  } catch {
    tolakNone = true;
  }
  cek("serangan alg:none DITOLAK", tolakNone);

  // Token kedaluwarsa
  const basi = buatToken({
    sub: "1",
    preferred_username: "budi",
    aud: "klien-kci",
    exp: kini - 10,
  });
  let tolakBasi = false;
  try {
    await oauth.verifikasiIdToken(basi, { clientId: "klien-kci" });
  } catch {
    tolakBasi = true;
  }
  cek("token kedaluwarsa DITOLAK", tolakBasi);

  // Token untuk aplikasi lain
  const salahAud = buatToken({
    sub: "1",
    preferred_username: "budi",
    aud: "aplikasi-lain",
    exp: kini + 3600,
  });
  let tolakAud = false;
  try {
    await oauth.verifikasiIdToken(salahAud, { clientId: "klien-kci" });
  } catch {
    tolakAud = true;
  }
  cek("token milik aplikasi lain DITOLAK", tolakAud);

  // Kunci berbeda (penyerang menandatangani sendiri)
  const lain = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const kunciLain = buatToken(
    { sub: "1", preferred_username: "penyusup", aud: "klien-kci", exp: kini + 3600 },
    lain.privateKey
  );
  let tolakKunci = false;
  try {
    await oauth.verifikasiIdToken(kunciLain, { clientId: "klien-kci" });
  } catch {
    tolakKunci = true;
  }
  cek("token dari kunci asing DITOLAK", tolakKunci);

  globalThis.fetch = asli;
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
    }
  }
  if (!process.env.KCI_DASAR) {
    const hasil = await luncurkanServerUji();
    DASAR = hasil.dasar;
    hentikan = hasil.hentikan;
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

      const takValid = await kirim("/api/auth/kode/minta", { username: "a" });
      cek("username tak valid -> 400", takValid.status === 400, `dapat ${takValid.status}`);

      const minta = await kirim("/api/auth/kode/minta", { username: "gothamchess" });
      cek("kode diterbitkan", /^KCI-[A-Z2-9]{6}$/.test(minta.data?.kode || ""), minta.data?.kode);
      cek("kode punya masa berlaku", minta.data?.berlakuDetik > 0);

      const ulang = await kirim("/api/auth/kode/minta", { username: "gothamchess" });
      cek("permintaan ulang memberi kode sama", ulang.data?.kode === minta.data?.kode);

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
    }
  }
  hentikan?.();
}

console.log(`\n${"=".repeat(50)}`);
console.log(`  ${lulus} lulus, ${gagal} gagal`);
console.log(`${"=".repeat(50)}\n`);
process.exit(gagal ? 1 : 0);
