/**
 * Selisih materi (material balance) dari sebuah FEN.
 *
 * Dipakai panel "selisih materi" di samping papan Teka-teki Harian, mengikuti
 * cara ChessCompass menampilkan bidak yang sudah tertangkap beserta angka
 * keunggulannya (mis. "+1" dengan bidak kuda hitam dan dua pion putih).
 *
 * FEN hanya menyimpan posisi terkini, bukan riwayat tangkapan. Karena itu bidak
 * yang "hilang" dihitung dengan membandingkan jumlah bidak pada posisi terhadap
 * susunan awal. Promosi bisa membuat bidak terlihat "hilang" padahal berubah
 * jadi bidak lain, jadi kelebihan bidak (mis. dua ratu) dikurangkan dari pion
 * yang dianggap tertangkap.
 */

/** Nilai tukar bidak yang lazim dipakai untuk selisih materi. */
export const NILAI_BIDAK = { p: 1, n: 3, b: 3, r: 5, q: 9 };

/** Jumlah bidak tiap jenis pada susunan awal (raja tidak pernah tertangkap). */
const JUMLAH_AWAL = { p: 8, n: 2, b: 2, r: 2, q: 1 };

/** Urutan tampil bidak yang tertangkap: paling berharga lebih dulu. */
const URUTAN_TAMPIL = ["q", "r", "b", "n", "p"];

/** Baca bidang penempatan FEN menjadi hitungan bidak per warna. */
function hitungBidak(fen) {
  const sisa = { w: {}, b: {} };
  const posisi = String(fen || "").split(" ")[0];
  for (const ch of posisi) {
    if (!/[a-zA-Z]/.test(ch)) continue;
    const warna = ch === ch.toUpperCase() ? "w" : "b";
    const jenis = ch.toLowerCase();
    if (!(jenis in NILAI_BIDAK)) continue; // raja tidak dihitung
    sisa[warna][jenis] = (sisa[warna][jenis] || 0) + 1;
  }
  return sisa;
}

function nilaiWarna(hitungan) {
  let total = 0;
  for (const [jenis, jumlah] of Object.entries(hitungan)) {
    total += (NILAI_BIDAK[jenis] || 0) * jumlah;
  }
  return total;
}

/**
 * Daftar bidak milik satu warna yang sudah tertangkap (hilang dari papan),
 * urut dari yang paling berharga. Bidak hasil promosi dikurangkan dari pion
 * supaya tidak dilaporkan sebagai pion yang tertangkap.
 */
function kepingHilang(hitungan) {
  let kelebihan = 0;
  for (const [jenis, awal] of Object.entries(JUMLAH_AWAL)) {
    if (jenis === "p") continue;
    kelebihan += Math.max(0, (hitungan[jenis] || 0) - awal);
  }
  const keping = [];
  for (const jenis of URUTAN_TAMPIL) {
    const awal = JUMLAH_AWAL[jenis];
    let hilang = awal - (hitungan[jenis] || 0);
    if (jenis === "p") hilang -= kelebihan;
    for (let i = 0; i < Math.max(0, hilang); i += 1) keping.push(jenis);
  }
  return keping;
}

/**
 * Ringkasan materi sebuah posisi.
 *
 * @param {string} fen posisi yang sedang ditampilkan
 * @returns {{selisih:number, nilaiPutih:number, nilaiHitam:number,
 *            keping:{bidak:string,nilai:number}[], adaTertangkap:boolean}}
 *   `selisih` positif = putih unggul; `keping[].bidak` memakai notasi FEN
 *   (huruf besar = putih) sehingga bisa langsung dipakai `ChessPiece`.
 */
export function hitungMateriBidak(fen) {
  const sisa = hitungBidak(fen);
  const nilaiPutih = nilaiWarna(sisa.w);
  const nilaiHitam = nilaiWarna(sisa.b);

  const hitamTertangkap = kepingHilang(sisa.b); // bidak hitam yang hilang
  const putihTertangkap = kepingHilang(sisa.w); // bidak putih yang hilang

  const keping = [
    ...hitamTertangkap.map((jenis) => ({
      bidak: jenis,
      nilai: NILAI_BIDAK[jenis],
    })),
    ...putihTertangkap.map((jenis) => ({
      bidak: jenis.toUpperCase(),
      nilai: NILAI_BIDAK[jenis],
    })),
  ].sort((a, b) => b.nilai - a.nilai);

  return {
    selisih: nilaiPutih - nilaiHitam,
    nilaiPutih,
    nilaiHitam,
    // Bidak lawan yang tertangkap ditampilkan di sisi pemain yang menangkapnya.
    kepingPutih: hitamTertangkap.map((jenis) => ({
      bidak: jenis,
      nilai: NILAI_BIDAK[jenis],
    })),
    kepingHitam: putihTertangkap.map((jenis) => ({
      bidak: jenis.toUpperCase(),
      nilai: NILAI_BIDAK[jenis],
    })),
    keping,
    adaTertangkap: keping.length > 0,
  };
}
