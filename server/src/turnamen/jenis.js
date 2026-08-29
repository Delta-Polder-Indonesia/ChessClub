/**
 * Konstanta jenis, status, dan skor sah untuk mesin turnamen.
 */

/** Sifat bawaan tiap jenis turnamen. */
export const JENIS = {
  bulanan: {
    label: "Turnamen Bulanan",
    slug: "turnamen-bulanan",
    sistem: "swiss",
    rondeBawaan: 5,
    tempoBawaan: "15+10",
    bolehNonAnggota: false,
    beregu: false,
    klasemenBerjalan: false,
  },
  musiman: {
    label: "Liga Musiman",
    slug: "liga-musiman",
    sistem: "liga",
    rondeBawaan: 0, // berjalan terus
    tempoBawaan: "15+10",
    bolehNonAnggota: false,
    beregu: false,
    klasemenBerjalan: true,
    minPartai: 6,
  },
  terbuka: {
    label: "Turnamen Terbuka",
    slug: "turnamen-terbuka",
    sistem: "swiss",
    rondeBawaan: 7,
    tempoBawaan: "25+10",
    bolehNonAnggota: true,
    beregu: false,
    klasemenBerjalan: false,
  },
  "antar-komunitas": {
    label: "Liga Antar Komunitas",
    slug: "liga-antar-komunitas",
    sistem: "beregu",
    rondeBawaan: 0,
    tempoBawaan: "15+10",
    bolehNonAnggota: true,
    beregu: true,
    klasemenBerjalan: true,
  },
};

export const STATUS = ["draf", "pendaftaran", "berlangsung", "selesai", "batal"];

export const SKOR_SAH = ["1-0", "0-1", "0.5-0.5"];
