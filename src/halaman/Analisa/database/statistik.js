/**
 * Agregasi statistik: per koleksi (ringan, berbasis revisi) dan seluruh basis.
 *
 * Dependensi: `./partai.js` (baca daftar + telusur kursor), `./koleksi.js`
 * (daftar koleksi), `./migrasi.js` (cadangan memori), dan `revisiBasis` dari
 * `./index.js`. Kode dipindahkan apa adanya.
 */
import { STORE_PARTAI, memoriPartai, bukaDB } from "./migrasi.js";
import { ambilDaftarPartai, telusuriKursor } from "./partai.js";
import { ambilSemuaKoleksi } from "./koleksi.js";
import { revisiBasis } from "./index.js";

/*
 * Cache statistik per koleksi (jumlah/pemain/event/ukuran). Diisi sekali per
 * koleksi per revisi — dan karena metadatanya kini membawa `event` +
 * `ukuranPgn`, isinya bisa dihitung dari metadata ringan (sertakanPgn:false),
 * bukan menarik seluruh teks PGN koleksi ke memori setiap popup Database
 * dibuka. Setiap tulis (unduh/impor/hapus/gabung) menaikkan `revisiBasis`,
 * jadi entri otomatis basi saat data benar-benar berubah.
 */
const cacheStatistikKoleksi = new Map();

/**
 * Statistik satu koleksi: jumlah partai, pemain unik, event unik, dan ukuran
 * total PGN (byte karakter). Jalur normal membaca METADATA SAJA.
 *
 * Kompatibilitas basis lama: bila koleksi berisi rekaman warisan yang belum
 * punya `ukuranPgn` (dibuat sebelum field ini ada), satu kali penelusuran
 * penuh dengan PGN dilakukan untuk mengisi ukuran & event; hasilnya di-cache
 * sampai revisi berikutnya. Instalasi baru tidak pernah menyentuh teks PGN di sini.
 */
export async function hitungStatistikKoleksiRingan(koleksiId) {
  if (!koleksiId) return { jumlah: 0, pemain: 0, event: 0, ukuran: 0 };
  const tersimpan = cacheStatistikKoleksi.get(koleksiId);
  if (tersimpan && tersimpan.revisi === revisiBasis) {
    return {
      jumlah: tersimpan.jumlah,
      pemain: tersimpan.pemain,
      event: tersimpan.event,
      ukuran: tersimpan.ukuran,
    };
  }

  const hasil = await ambilDaftarPartai({
    koleksiId,
    limit: 0,
    sertakanPgn: false,
  });
  const partai = hasil?.partai || [];

  const pemain = new Set();
  const eventSet = new Set();
  let ukuran = 0;
  let adaWarisan = false;

  for (const p of partai) {
    pemain.add(p.whiteName);
    pemain.add(p.blackName);
    if (p.event) eventSet.add(p.event);
    if (typeof p.ukuranPgn === "number" && p.ukuranPgn > 0) {
      ukuran += p.ukuranPgn;
    } else {
      adaWarisan = true;
    }
  }

  /*
   * Rekaman warisan tidak menyimpan panjang PGN maupun event teruraikan —
   * tarik teks PGN sekali untuk koleksi ini, lalu cache hasilnya agar
   * pembukaan popup berikutnya tidak mengulang.
   */
  if (adaWarisan) {
    const lengkap = await ambilDaftarPartai({
      koleksiId,
      limit: 0,
      sertakanPgn: true,
    });
    const semua = lengkap?.partai || [];
    ukuran = 0;
    const eventPenuh = new Set();
    for (const p of semua) {
      ukuran += (p.pgn || "").length;
      const m = /\[Event\s+"([^"]*)"\]/.exec(p.pgn || "");
      if (m && m[1]) eventPenuh.add(m[1]);
      else if (p.event) eventPenuh.add(p.event);
    }
    for (const e of eventPenuh) eventSet.add(e);
  }

  pemain.delete("");

  const statistik = {
    jumlah: partai.length,
    pemain: pemain.size,
    event: eventSet.size,
    ukuran,
    revisi: revisiBasis,
  };
  cacheStatistikKoleksi.set(koleksiId, statistik);
  return {
    jumlah: statistik.jumlah,
    pemain: statistik.pemain,
    event: statistik.event,
    ukuran: statistik.ukuran,
  };
}

/**
 * Hitung ringkasan statistik basis data (total partai, koleksi, menang, kalah, seri).
 *
 * Dihitung sambil menelusuri kursor: tidak ada larik besar yang dibangun dan
 * teks PGN tidak pernah ikut ditumpuk di memori. Dulu fungsi ini memanggil
 * `ambilDaftarPartai()` tanpa limit — artinya seluruh basis data dimuat hanya
 * untuk menjumlahkan menang/kalah setiap kali panel Database dibuka.
 */
export async function hitungStatistikBasisData() {
  let putihMenang = 0;
  let hitamMenang = 0;
  let seri = 0;
  let totalPartai = 0;
  const platformCounts = { chessCom: 0, lichessOrg: 0, impor: 0 };

  const tally = (p) => {
    totalPartai++;
    if (p.result === "white") putihMenang++;
    else if (p.result === "black") hitamMenang++;
    else seri++;
    const plat = p.platform || "chessCom";
    platformCounts[plat] = (platformCounts[plat] || 0) + 1;
  };

  const db = await bukaDB();
  if (!db) {
    for (const p of memoriPartai.values()) tally(p);
  } else {
    let store;
    try {
      store = db.transaction([STORE_PARTAI], "readonly").objectStore(STORE_PARTAI);
    } catch {
      store = null;
    }
    if (store) {
      await telusuriKursor(store, null, "next", (kursor) => {
        tally(kursor.value);
      });
    }
  }

  const koleksi = await ambilSemuaKoleksi();

  return {
    totalPartai,
    totalKoleksi: koleksi.length,
    putihMenang,
    hitamMenang,
    seri,
    platformCounts,
  };
}
