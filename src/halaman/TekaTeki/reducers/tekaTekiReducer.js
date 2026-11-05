/**
 * Transisi murni permainan Teka-Teki.
 *
 * Sebelumnya inti permainan hidup sebagai 39 `useState` terpisah di komponen
 * halaman; satu langkah pemain menulis 14 state dalam satu fungsi, sehingga
 * `fen`, `sisa`, dan `jalurFen` bisa menyimpang tanpa terlihat. Reducer ini
 * memusatkan transisi itu menjadi fungsi murni: masukan (keadaan, aksi) →
 * keadaan baru. Semua keputusan "apa yang berubah setelah langkah X" berada
 * di sini dan bisa diuji tanpa DOM.
 *
 * Yang TIDAK termasuk di sini (sengaja): bunyi, timer, dan penyimpanan — itu
 * efek samping, jadi dijalankan pemanggil setelah aksi diputuskan.
 */
import { parseLangkah } from "../../../lib/tekaTeki.js";

/** Kolam/keadaan papan untuk soal tertentu (posisi awal soal). */
export function keadaanSoal(m, { pertahankanSelesai = false } = {}) {
  const moves = String(m?.moves || "");
  return {
    fen: m?.fen || "",
    sisa: moves ? moves.split(";") : [],
    jalurFen: m?.fen ? [m.fen] : [],
    orientasi: m?.first === "Black to Move" ? "b" : "w",
    terpilih: null,
    sasaran: [],
    petunjuk: null,
    kesalahan: null,
    langkahAkhir: null,
    promosi: null,
    sedangSeret: false,
    komputer: false,
    selesai: pertahankanSelesai,
  };
}

/** Keadaan papan sebelum soal pertama dipasang. */
export const KEADAAN_AWAL = {
  ...keadaanSoal(null),
  // Komentar komentator mengikuti keadaan papan (tahap + fakta langkah).
  komentar: null,
};

/**
 * @param {object} kondisi
 * @param {{type: string, [k:string]: any}} aksi
 */
export function reduksiPapan(kondisi, aksi) {
  switch (aksi.type) {
    case "PASANG_SOAL": {
      const dasar = keadaanSoal(aksi.soal, {
        pertahankanSelesai: aksi.pertahankanSelesai,
      });
      return {
        ...kondisi,
        ...dasar,
        komentar: { tahap: "mulai", fakta: null, fen: aksi.soal?.fen || "" },
      };
    }

    case "PILIH_PETAK":
      return { ...kondisi, terpilih: aksi.petak, sasaran: aksi.sasaran };

    case "BERSIHKAN_PILIHAN":
      return { ...kondisi, terpilih: null, sasaran: [] };

    case "BUKA_PROMOSI":
      return {
        ...kondisi,
        promosi: aksi.promosi,
        terpilih: null,
        sasaran: [],
      };

    case "BATAL_PROMOSI":
      return { ...kondisi, promosi: null, terpilih: null, sasaran: [] };

    /** Langkah bukan solusi (atau ilegal): papan tidak bergerak. */
    case "LANGKAH_SALAH":
      return {
        ...kondisi,
        kesalahan: aksi.petak,
        terpilih: null,
        sasaran: [],
      };

    case "HAPUS_KESALAHAN":
      return { ...kondisi, kesalahan: null };

    /** Langkah pemain sesuai solusi — papan maju satu ply. */
    case "LANGKAH_BENAR": {
      const { permainan, langkah, sisaBaru } = aksi;
      const fenBaru = permainan.fen();
      const dasar = {
        ...kondisi,
        fen: fenBaru,
        jalurFen: [...kondisi.jalurFen, fenBaru],
        sisa: sisaBaru,
        langkahAkhir: { from: langkah.from, to: langkah.to },
        terpilih: null,
        sasaran: [],
        petunjuk: null,
        kesalahan: null,
        promosi: null,
      };
      return sisaBaru.length === 0
        ? {
            ...dasar,
            selesai: true,
            komputer: false,
            komentar: {
              tahap: "selesai",
              fakta: aksi.fakta,
              fen: fenBaru,
            },
          }
        : {
            ...dasar,
            komputer: true,
            komentar: {
              tahap: "benar",
              fakta: aksi.fakta,
              sisa: aksi.sisaPemain,
              fen: fenBaru,
            },
          };
    }

    /** Balasan lawan (dijadwalkan pemanggil setelah jeda). */
    case "LANGKAH_LAWAN": {
      const { permainan, balasan } = aksi;
      const fenBaru = permainan.fen();
      return {
        ...kondisi,
        fen: fenBaru,
        jalurFen: [...kondisi.jalurFen, fenBaru],
        langkahAkhir: { from: balasan.from, to: balasan.to },
        sisa: kondisi.sisa.slice(1),
        komputer: false,
        komentar: {
          tahap: "lawan",
          fakta: aksi.fakta,
          sisa: aksi.sisaPemain,
          fen: fenBaru,
        },
      };
    }

    case "TAMPILKAN_PETUNJUK":
      return {
        ...kondisi,
        petunjuk: aksi.petunjuk,
        komentar: {
          tahap: "petunjuk",
          petunjuk: aksi.petunjukKomentar,
          fen: kondisi.fen,
        },
      };

    case "BERSIHKAN_BANTU":
      return {
        ...kondisi,
        terpilih: null,
        sasaran: [],
        petunjuk: null,
        kesalahan: null,
        promosi: null,
      };

    case "SETELAH_MUNDUR": {
      const { fenBaru, sisa, jalurFen, langkahAkhir, komentar } = aksi;
      return {
        ...kondisi,
        fen: fenBaru,
        sisa,
        jalurFen,
        langkahAkhir,
        komputer: false,
        terpilih: null,
        sasaran: [],
        petunjuk: null,
        kesalahan: null,
        promosi: null,
        komentar,
      };
    }

    case "SETELAH_MAJU": {
      const { fenBaru, sisa, jalurFen, langkahAkhir, komentar } = aksi;
      return {
        ...kondisi,
        fen: fenBaru,
        sisa,
        jalurFen,
        langkahAkhir,
        komputer: false,
        terpilih: null,
        sasaran: [],
        petunjuk: null,
        kesalahan: null,
        promosi: null,
        komentar,
      };
    }

    case "ORIENTASI":
      return { ...kondisi, orientasi: aksi.orientasi };

    case "SERET":
      return { ...kondisi, sedangSeret: aksi.sedangSeret };

    case "KOMPUTER":
      return { ...kondisi, komputer: aksi.komputer };

    case "SELESAI":
      return { ...kondisi, selesai: aksi.selesai };

    case "KOMENTAR":
      return { ...kondisi, komentar: aksi.komentar };

    case "HAPUS_BANTU_TANPA_PESAN":
      return {
        ...kondisi,
        terpilih: null,
        sasaran: [],
        petunjuk: null,
        kesalahan: null,
        promosi: null,
      };

    default:
      return kondisi;
  }
}

/** Langkah-langkah solusi soal (dibagi `;`). */
export function langkahSolusi(soal) {
  if (!soal?.moves) return [];
  return String(soal.moves).split(";");
}

/** Posisi (dalam ply) yang sedang ditampilkan. */
export function posisiSekarang(soal, sisa) {
  const total = langkahSolusi(soal).length;
  return Math.max(0, total - (sisa?.length || 0));
}

/** Langkah solusi ke-`i` sebagai objek `{ from, to, promo }`. */
export const langkahKe = (langkahPenuh, i) => parseLangkah(langkahPenuh[i]);
