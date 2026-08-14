/**
 * Uji integrasi backend melalui HTTP sungguhan.
 * Jalankan server lebih dulu, lalu: node server/uji/uji-backend.mjs
 */
const DASAR = process.env.KCI_DASAR || "http://localhost:8787";
const TOKEN = process.env.KCI_TOKEN_ADMIN || "";

let lulus = 0;
let gagal = 0;
const kegagalan = [];

function cek(nama, syarat, rincian = "") {
  if (syarat) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    kegagalan.push(nama);
    console.log(`  ✗ ${nama}${rincian ? `\n      ${rincian}` : ""}`);
  }
}

async function panggil(metode, jalur, bodi, header = {}) {
  const res = await fetch(DASAR + jalur, {
    method: metode,
    headers: {
      ...(bodi ? { "Content-Type": "application/json" } : {}),
      ...(TOKEN ? { "X-Token-Admin": TOKEN } : {}),
      ...header,
    },
    body: bodi ? JSON.stringify(bodi) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* biarkan null */
  }
  return { status: res.status, data, headers: res.headers };
}

const anggotaSah = (username, ubah = {}) => ({
  username,
  namaLengkap: "Budi Santoso",
  panggilan: "Budi",
  hp: "0812-3456-7890",
  kota: "Medan",
  tanggalLahir: "2000-01-01",
  setuju: true,
  ...ubah,
});

console.log(`\nMenguji backend di ${DASAR}\n`);

/* ------------------------------------------------------------ kesehatan */
console.log("Kesehatan & rute dasar");
{
  const r = await panggil("GET", "/api/kesehatan");
  cek("GET /api/kesehatan -> 200", r.status === 200, `dapat ${r.status}`);
  cek("melaporkan status sehat", r.data?.status === "sehat");

  const nf = await panggil("GET", "/api/tidak-ada");
  cek("rute tak dikenal -> 404", nf.status === 404, `dapat ${nf.status}`);

  const anggota = await panggil("GET", "/api/anggota");
  cek("GET /api/anggota -> 200", anggota.status === 200);
  cek("mengembalikan array", Array.isArray(anggota.data));
  cek(
    "tidak membocorkan hash identitas",
    !JSON.stringify(anggota.data).includes("identitas")
  );
}

/* ------------------------------------------------------------- validasi */
console.log("\nValidasi masukan");
{
  const kosong = await panggil("POST", "/api/anggota", {});
  cek("formulir kosong -> 400", kosong.status === 400, `dapat ${kosong.status}`);
  const g = kosong.data?.galat || {};
  cek(
    "menyebut semua field wajib",
    g.username && g.namaLengkap && g.panggilan && g.hp && g.kota && g.tanggalLahir && g.setuju,
    JSON.stringify(g)
  );

  const hp = await panggil("POST", "/api/anggota", anggotaSah("magnuscarlsen", { hp: "123" }));
  cek("nomor HP tak valid -> 400", hp.status === 400 && hp.data?.galat?.hp);

  const nama = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("magnuscarlsen", { namaLengkap: "Budi" })
  );
  cek("nama satu kata ditolak", nama.status === 400 && nama.data?.galat?.namaLengkap);

  const setuju = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("magnuscarlsen", { setuju: false })
  );
  cek("belum setuju kode etik ditolak", setuju.status === 400 && setuju.data?.galat?.setuju);

  const lahir = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("magnuscarlsen", { tanggalLahir: "1890-01-01" })
  );
  cek("tanggal lahir mustahil ditolak", lahir.status === 400);

  const surel = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("magnuscarlsen", { email: "bukan-email" })
  );
  cek("email tak valid ditolak", surel.status === 400 && surel.data?.galat?.email);

  const rusak = await fetch(DASAR + "/api/anggota", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bukan json",
  });
  cek("JSON rusak -> 400", rusak.status === 400, `dapat ${rusak.status}`);
}

/* ---------------------------------------------------------- pendaftaran */
console.log("\nPendaftaran & verifikasi Chess.com");
{
  const hantu = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("akuntidakada998877665", { hp: "0811-1111-1111" })
  );
  cek("akun Chess.com tak ada -> 404", hantu.status === 404, `dapat ${hantu.status}`);

  const sah = await panggil("POST", "/api/anggota", anggotaSah("magnuscarlsen"));
  cek("pendaftaran sah -> 201", sah.status === 201, JSON.stringify(sah.data)?.slice(0, 160));
  cek("mengembalikan Elo dari Chess.com", typeof sah.data?.elo === "number");
  cek("menghitung kategori umur", Boolean(sah.data?.kategoriUmur));
  cek("tidak mengembalikan hash identitas", !("identitas" in (sah.data || {})));
  cek("tidak mengembalikan nomor HP", !JSON.stringify(sah.data).includes("62812"));

  const ulang = await panggil("POST", "/api/anggota", anggotaSah("magnuscarlsen"));
  cek("username sama -> 409", ulang.status === 409, `dapat ${ulang.status}`);
}

/* ------------------------------------------------- pencegahan akun ganda */
console.log("\nPencegahan akun ganda (anggota aktif)");
{
  const gandaHp = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("gothamchess", { panggilan: "Budi2", hp: "+62 812 3456 7890" })
  );
  cek(
    "HP sama format beda -> 409",
    gandaHp.status === 409,
    JSON.stringify(gandaHp.data)?.slice(0, 140)
  );

  const gandaNama = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("gothamchess", { hp: "0857-1111-2222", namaLengkap: "budi   santoso" })
  );
  cek("nama+lahir sama -> 409", gandaNama.status === 409);

  const silangDana = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("gothamchess", {
      namaLengkap: "Andi Wijaya",
      hp: "0857-3333-4444",
      dana: "081234567890",
      tanggalLahir: "1995-05-05",
    })
  );
  cek("nomor lama di kolom DANA -> 409", silangDana.status === 409);
}

/* ------------------------------------------------------ keamanan admin */
console.log("\nKeamanan endpoint pengurus");
{
  const tanpa = await fetch(DASAR + "/api/pengurus/ringkasan");
  if (TOKEN) {
    cek("tanpa token -> 401", tanpa.status === 401, `dapat ${tanpa.status}`);
    const salah = await fetch(DASAR + "/api/pengurus/ringkasan", {
      headers: { "X-Token-Admin": "token-salah-sekali" },
    });
    cek("token salah -> 401", salah.status === 401, `dapat ${salah.status}`);
    const benar = await panggil("GET", "/api/pengurus/ringkasan");
    cek("token benar -> 200", benar.status === 200, `dapat ${benar.status}`);
  } else {
    cek("mode pengembangan: admin terbuka", tanpa.status === 200);
    console.log("      (jalankan ulang dengan KCI_TOKEN_ADMIN untuk uji autentikasi)");
  }
}

/* -------------------------------------------- daftar hitam & akun kecil */
console.log("\nDaftar hitam & pencegahan akun kecil");
{
  const blokir = await panggil("POST", "/api/pengurus/blokir", {
    username: "magnuscarlsen",
    keterangan: "Terbukti memakai engine pada uji otomatis.",
  });
  cek("blokir anggota -> 200", blokir.status === 200, `dapat ${blokir.status}`);
  cek("identitas ikut tercatat", Object.keys(blokir.data?.identitas || {}).length > 0);
  cek("sidik pepper tercatat", Boolean(blokir.data?.sidikPepper));

  const publik = await panggil("GET", "/api/daftar-hitam");
  cek("daftar hitam publik -> 200", publik.status === 200);
  cek(
    "daftar hitam publik tidak membocorkan hash",
    !JSON.stringify(publik.data).includes("identitas")
  );

  const kecilHp = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("gothamchess", { panggilan: "BudiBaru", hp: "0812 3456 7890" })
  );
  cek(
    "akun kecil HP sama -> 403 diblokir",
    kecilHp.status === 403 && kecilHp.data?.diblokir === true,
    `dapat ${kecilHp.status}`
  );

  const kecilNama = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("gothamchess", { hp: "0899-1111-2222", namaLengkap: "budi santoso" })
  );
  cek(
    "akun kecil ganti HP, nama+lahir sama -> 403",
    kecilNama.status === 403 && kecilNama.data?.diblokir === true
  );

  const kecilDana = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("gothamchess", {
      namaLengkap: "Andi Wijaya",
      hp: "0899-3333-4444",
      dana: "081234567890",
      tanggalLahir: "1995-05-05",
    })
  );
  cek(
    "akun kecil lewat kolom DANA -> 403",
    kecilDana.status === 403 && kecilDana.data?.diblokir === true
  );

  const cekNomor = await panggil("POST", "/api/pengurus/cek-nomor", {
    hp: "0812-3456-7890",
  });
  cek("cek nomor terblokir", cekNomor.data?.diblokir === true, JSON.stringify(cekNomor.data));

  const cekBersih = await panggil("POST", "/api/pengurus/cek-nomor", {
    hp: "0857-9999-8888",
  });
  cek("cek nomor bersih", cekBersih.data?.diblokir === false);

  const sah = await panggil(
    "POST",
    "/api/anggota",
    anggotaSah("gothamchess", {
      namaLengkap: "Siti Aminah",
      panggilan: "Siti",
      hp: "0857-9999-8888",
      kota: "Binjai",
      tanggalLahir: "1999-09-09",
    })
  );
  cek("anggota sah tetap bisa mendaftar -> 201", sah.status === 201, `dapat ${sah.status}`);

  const buka = await panggil("POST", "/api/pengurus/buka", {
    username: "magnuscarlsen",
  });
  cek("cabut larangan -> 200", buka.status === 200);

  const setelahBuka = await panggil("POST", "/api/pengurus/cek-nomor", {
    hp: "0812-3456-7890",
  });
  cek("nomor bersih setelah dicabut", setelahBuka.data?.diblokir === false);
}

/* -------------------------------------------------------------- privasi */
console.log("\nPrivasi data pribadi");
{
  const kontak = await panggil("GET", "/api/pengurus/kontak/gothamchess");
  cek("pengurus dapat melihat kontak", kontak.status === 200 && kontak.data?.hp);
  cek("nomor tersimpan ternormalisasi", kontak.data?.hp === "6285799998888", kontak.data?.hp);

  if (TOKEN) {
    const tanpaToken = await fetch(DASAR + "/api/pengurus/kontak/gothamchess");
    cek("kontak terlindungi token -> 401", tanpaToken.status === 401);
  }

  const publik = await panggil("GET", "/api/anggota");
  const teks = JSON.stringify(publik.data);
  cek("daftar publik tanpa nomor HP", !teks.includes("6285799998888"));
  cek("daftar publik tanpa nama lengkap asli", !teks.includes("Siti Aminah"));
}

/* --------------------------------------------------------- batas laju */
console.log("\nPembatasan laju");
{
  const hasil = [];
  for (let i = 0; i < 8; i++) {
    const r = await panggil("POST", "/api/anggota", anggotaSah("hikaru", { hp: "0813-0000-0001" }));
    hasil.push(r.status);
  }
  cek(
    "pendaftaran berlebih dibatasi (429)",
    hasil.includes(429),
    `status: ${hasil.join(",")}`
  );
}

/* ------------------------------------------------------------ ringkasan */
console.log(`\n${"=".repeat(52)}`);
console.log(`  ${lulus} lulus, ${gagal} gagal`);
if (kegagalan.length) {
  console.log("\n  Yang gagal:");
  for (const k of kegagalan) console.log(`    - ${k}`);
}
console.log(`${"=".repeat(52)}\n`);
process.exit(gagal ? 1 : 0);
