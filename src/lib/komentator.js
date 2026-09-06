/**
 * Komentator langsung — mesin kalimat komentar untuk Papan Interaktif.
 *
 * Tujuannya membuat latihan di papan terasa hidup seperti panel komentar di
 * halaman Analisa: setiap langkah dibalas satu-dua kalimat yang menyebut apa
 * yang sungguh terjadi di papan (skak, tangkapan, rokade, promosi, bidak
 * yang menggantung, nama pembukaan) dan — bila engine Stockfish menyala —
 * penilaian kualitas langkah (brilian … blunder) beserta siapa yang unggul.
 *
 * Tidak ada model AI di sini. Semua kalimat berasal dari kamus terjemahan
 * (`papan.komentator.*`) yang dipilih berdasarkan FAKTA posisi dari chess.js,
 * sehingga komentar selalu relevan dengan langkah pengguna, instan, offline,
 * dan otomatis dwibahasa. Modul ini murni (tanpa React) supaya mudah diuji
 * lewat scripts/uji-komentator.mjs.
 *
 * Alur pakai:
 *   const fakta = faktaLangkah(fenSebelum, san);          // apa yang terjadi
 *   const kunci = susunKomentar({ fakta, rating, evalSesudah, ... });
 *   kunci.map(({ kunci, ganti }) => t(kunci, ganti)).join(" ");
 *
 * `susunKomentar` mengembalikan DAFTAR KUNCI kamus (bukan teks jadi) agar
 * komponen React yang memanggil `t()` — pola yang sama dengan
 * `commentKey`/`commentIndex` di mesin Analisa.
 */
import { Chess } from "chess.js";

/** Nilai material baku (pion = 1) untuk deteksi bidak menggantung. */
export const NILAI_BIDAK = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Label penilaian engine → kunci kalimat di kamus. */
const PETA_RATING = {
  brilliant: "nilaiBrilian",
  great: "nilaiHebat",
  best: "nilaiTerbaik",
  excellent: "nilaiUnggul",
  good: "nilaiLayak",
  inaccuracy: "nilaiKeliru",
  mistake: "nilaiKesalahan",
  miss: "nilaiKelewat",
  blunder: "nilaiBlunder",
};

/** Gaya bahasa yang tersedia; disimpan di localStorage lewat kunci di bawah. */
export const GAYA_KOMENTATOR = ["santai", "formal"];
export const KUNCI_GAYA = "kci-komentator-gaya";
export const KUNCI_NYALA = "kci-komentator-nyala";

/**
 * Pemilih varian yang DETERMINISTIK: kalimat yang sama selalu muncul untuk
 * langkah yang sama (undo/redo tidak membuat komentar "berubah pikiran"),
 * tetapi langkah berbeda mendapat varian berbeda. Hash sederhana atas
 * SAN + nomor ply sudah cukup untuk kesan bervariasi.
 */
export function indeksVarian(benih, jumlah) {
  if (!jumlah || jumlah <= 1) return 0;
  let h = 0;
  const teks = String(benih);
  for (let i = 0; i < teks.length; i += 1) {
    h = (h * 31 + teks.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % jumlah;
}

/**
 * Bidak milik `warna` yang bisa ditangkap lawan pada giliran berikutnya
 * TANPA perlindungan yang setimpal: (a) tidak dilindungi sama sekali, atau
 * (b) diserang oleh bidak yang lebih murah. Raja tidak dihitung (itu skak).
 *
 * Perkiraan taktis ringan — cukup untuk komentar "kuda di c3 menggantung",
 * bukan pengganti engine. Dihitung dari posisi SETELAH langkah, untuk kedua
 * pihak: bidak lawan yang menggantung = peluang, bidak sendiri = bahaya.
 */
export function bidakMenggantung(fen, warna) {
  let game;
  try {
    game = new Chess(fen);
  } catch {
    return [];
  }
  const lawan = warna === "w" ? "b" : "w";
  const hasil = [];
  const papan = game.board();
  for (const baris of papan) {
    for (const kotak of baris) {
      if (!kotak || kotak.color !== warna || kotak.type === "k") continue;
      const petak = kotak.square;
      if (!game.isAttacked(petak, lawan)) continue;
      const penyerangTermurah = nilaiPenyerangTermurah(game, petak, lawan);
      // null = penyerang TIDAK punya tangkapan legal ke petak ini (terpaku,
      // sedang diskak, dsb.) → bukan ancaman nyata. undefined = tidak
      // diketahui → jatuh ke pemeriksaan pseudo-serangan di bawah.
      if (penyerangTermurah === null) continue;
      const dilindungi = game.isAttacked(petak, warna);
      const nilai = NILAI_BIDAK[kotak.type];
      if (!dilindungi || (penyerangTermurah !== undefined && penyerangTermurah < nilai)) {
        hasil.push({ petak, jenis: kotak.type, nilai });
      }
    }
  }
  return hasil.sort((a, b) => b.nilai - a.nilai);
}

/**
 * Nilai bidak `penyerang` termurah yang bisa menangkap di `petak` secara
 * LEGAL. Bila `penyerang` sedang giliran, daftar langkah legalnya dipakai
 * langsung; bila bukan, giliran dibalik lewat FEN — chess.js menolak FEN
 * yang rajanya "bukan giliran" sedang diskak, sehingga kegagalan dibalas
 * `undefined` (tidak diketahui). `null` berarti tidak ada tangkapan legal.
 */
function nilaiPenyerangTermurah(game, petak, penyerang) {
  let sumber = game;
  if (game.turn() !== penyerang) {
    const bagian = game.fen().split(" ");
    bagian[1] = penyerang;
    bagian[3] = "-"; // en passant tidak relevan untuk pembalikan giliran
    try {
      sumber = new Chess(bagian.join(" "));
    } catch {
      return undefined;
    }
  }
  let termurah = null;
  let langkah = [];
  try {
    langkah = sumber.moves({ verbose: true });
  } catch {
    return undefined;
  }
  for (const m of langkah) {
    if (m.to !== petak) continue;
    const nilai = m.piece === "k" ? 100 : NILAI_BIDAK[m.piece];
    if (termurah === null || nilai < termurah) termurah = nilai;
  }
  return termurah;
}

/**
 * Kumpulkan fakta satu langkah: hasil `game.move()` chess.js ditambah
 * keadaan posisi sesudahnya. Mengembalikan null bila langkah tidak legal.
 *
 * @param {string} fenSebelum posisi sebelum langkah
 * @param {string} san langkah dalam notasi SAN
 */
export function faktaLangkah(fenSebelum, san) {
  let game;
  let pindah;
  try {
    game = new Chess(fenSebelum);
    pindah = game.move(san);
  } catch {
    return null;
  }
  if (!pindah) return null;

  const warna = pindah.color;
  const lawan = warna === "w" ? "b" : "w";
  const fenSesudah = game.fen();
  const flags = pindah.flags || "";

  const fakta = {
    san: pindah.san,
    warna,
    lawan,
    bidak: pindah.piece,
    dari: pindah.from,
    ke: pindah.to,
    ply: plyDariFen(fenSesudah),
    nomorLangkah: new Chess(fenSebelum).moveNumber(),
    tangkap: pindah.captured || null,
    enPassant: flags.includes("e"),
    rokade: flags.includes("k") ? "pendek" : flags.includes("q") ? "panjang" : null,
    promosi: pindah.promotion || null,
    skak: game.inCheck(),
    skakmat: game.isCheckmate(),
    remis: game.isDraw(),
    pat: game.isStalemate(),
    materialKurang: game.isInsufficientMaterial(),
    pengulangan: game.isThreefoldRepetition(),
    fenSesudah,
    // Bidak yang menggantung SETELAH langkah — dari sudut pandang pelangkah:
    // milik lawan = sasaran empuk, milik sendiri = bahaya yang baru dibuat.
    lawanMenggantung: [],
    sendiriMenggantung: [],
    jumlahLegalLawan: 0,
    // Bidak yang baru bergerak bisa langsung ditangkap lawan (legal) —
    // bahan deteksi pengorbanan bersama nilai bidak yang dipertaruhkan.
    bisaDirebut: false,
  };

  if (!fakta.skakmat && !fakta.remis) {
    fakta.lawanMenggantung = bidakMenggantung(fenSesudah, lawan);
    fakta.sendiriMenggantung = bidakMenggantung(fenSesudah, warna);
    try {
      const balasan = game.moves({ verbose: true });
      fakta.jumlahLegalLawan = balasan.length;
      fakta.bisaDirebut = balasan.some((m) => m.to === pindah.to && m.captured);
    } catch {
      fakta.jumlahLegalLawan = 0;
    }
  }
  return fakta;
}

/**
 * Apakah langkah ini pengorbanan: bidak yang bergerak bisa langsung direbut
 * dan nilai yang dipertaruhkan (dikurangi hasil tangkapan) ≥ 2 pion.
 * Deteksi materiil sederhana — cukup untuk kalimat komentar.
 */
export function adalahPengorbanan(fakta) {
  if (!fakta || !fakta.bisaDirebut || fakta.skakmat) return false;
  const diberikan = NILAI_BIDAK[fakta.bidak] - (fakta.tangkap ? NILAI_BIDAK[fakta.tangkap] : 0);
  return diberikan >= 2;
}

/**
 * Peristiwa utama sebuah langkah untuk kalimat pembuka (dipakai komentator
 * papan interaktif DAN teka-teki): promosi, rokade, en passant, tangkapan.
 * Mengembalikan null bila langkah tidak punya peristiwa semacam itu.
 */
function peristiwaUtama(fakta) {
  if (fakta.promosi) {
    return { kunci: "promosi", n: 2, ganti: { bidak: `{{bidak:${fakta.promosi}}}` } };
  }
  if (fakta.rokade) {
    return { kunci: fakta.rokade === "pendek" ? "rokadePendek" : "rokadePanjang", n: 2, ganti: {} };
  }
  if (fakta.enPassant) return { kunci: "enPassant", n: 2, ganti: {} };
  if (fakta.tangkap) {
    const korban = `{{bidak:${fakta.tangkap}}}`;
    const untung = NILAI_BIDAK[fakta.tangkap] - NILAI_BIDAK[fakta.bidak];
    if (fakta.tangkap === "q") return { kunci: "tangkapMenteri", n: 2, ganti: { korban } };
    if (untung >= 2) return { kunci: "tangkapUntung", n: 2, ganti: { korban } };
    return { kunci: "tangkap", n: 3, ganti: { korban } };
  }
  return null;
}

/** Placeholder umum yang selalu tersedia untuk kalimat tentang satu langkah. */
function gantiDasar(fakta) {
  const pihak = fakta.warna === "w" ? "putih" : "hitam";
  const lawan = fakta.warna === "w" ? "hitam" : "putih";
  return {
    san: fakta.san,
    pihak: `{{pihak:${pihak}}}`,
    lawan: `{{pihak:${lawan}}}`,
    petak: fakta.ke,
    bidak: `{{bidak:${fakta.bidak}}}`,
  };
}

/** Nomor ply (setengah langkah) dari FEN — untuk benih varian kalimat. */
function plyDariFen(fen) {
  const bagian = fen.split(" ");
  const nomor = Number(bagian[5]) || 1;
  return (nomor - 1) * 2 + (bagian[1] === "w" ? 0 : 1);
}

/**
 * Kategori keunggulan dari evaluasi (sudut pandang Putih): cp = sentipion,
 * mate = jumlah langkah menuju skakmat (positif = Putih yang mematikan).
 */
export function kategoriKeunggulan({ cpPutih, matePutih } = {}) {
  if (matePutih !== null && matePutih !== undefined) {
    return { pihak: matePutih > 0 ? "w" : "b", tingkat: "mat", nilai: Math.abs(matePutih) };
  }
  if (cpPutih === null || cpPutih === undefined) return null;
  const abs = Math.abs(cpPutih);
  const pihak = cpPutih >= 0 ? "w" : "b";
  if (abs < 40) return { pihak: null, tingkat: "seimbang", nilai: abs / 100 };
  if (abs < 150) return { pihak, tingkat: "tipis", nilai: abs / 100 };
  if (abs < 400) return { pihak, tingkat: "jelas", nilai: abs / 100 };
  return { pihak, tingkat: "menang", nilai: abs / 100 };
}

/**
 * Susun daftar kunci kalimat untuk satu langkah.
 *
 * @param {object} p
 * @param {object} p.fakta        hasil faktaLangkah()
 * @param {string} [p.gaya]       "santai" | "formal"
 * @param {string|null} [p.rating] label penilaian engine (best/blunder/…)
 *                                 atau "book" bila masih di buku pembukaan
 * @param {object|null} [p.evalSesudah] { cpPutih, matePutih } posisi sesudah
 * @param {string|null} [p.namaPembukaan] nama pembukaan bila di buku
 * @param {string|null} [p.saranTerbaik]  SAN langkah terbaik menurut engine
 *                                        (untuk kalimat "lebih kuat: …")
 * @param {boolean} [p.engineNyala]
 * @returns {Array<{kunci: string, ganti?: object}>}
 */
export function susunKomentar({
  fakta,
  gaya = "santai",
  rating = null,
  evalSesudah = null,
  namaPembukaan = null,
  saranTerbaik = null,
  engineNyala = false,
}) {
  if (!fakta) return [];
  const g = GAYA_KOMENTATOR.includes(gaya) ? gaya : "santai";
  const kunciRating =
    rating && rating !== "book" && rating !== "forced" ? PETA_RATING[rating] || null : null;
  let ratingSudah = false;
  const benih = `${fakta.san}@${fakta.ply}`;
  const daftar = [];
  const dasar = `papan.komentator.${g}`;
  const gantiUmum = gantiDasar(fakta);
  // prioritas: makin kecil makin penting — dipakai saat memangkas komentar
  // yang kepanjangan (lihat MAKS_SEGMEN di bawah).
  const tambah = (kunci, jumlahVarian, ganti = {}, prioritas = 3) => {
    daftar.push({
      kunci: `${dasar}.${kunci}.${indeksVarian(benih + kunci, jumlahVarian)}`,
      ganti: { ...gantiUmum, ...ganti },
      prioritas,
    });
  };

  /* ---- 1. Akhir permainan: satu kalimat, selesai. ---- */
  if (fakta.skakmat) {
    tambah("skakmat", 3, {}, 0);
    return daftar;
  }
  if (fakta.pat) {
    tambah("pat", 2, {}, 0);
    return daftar;
  }
  if (fakta.remis) {
    tambah(fakta.pengulangan ? "remisUlang" : fakta.materialKurang ? "remisMaterial" : "remis", 2, {}, 0);
    return daftar;
  }

  /* ---- 2. Kalimat pembuka: peristiwa utama langkah ini. ---- */
  const utama = peristiwaUtama(fakta);
  if (utama) {
    tambah(utama.kunci, utama.n, utama.ganti, 1);
  } else if (rating === "book" && namaPembukaan) {
    tambah("buku", 3, { pembukaan: namaPembukaan }, 1);
  } else if (fakta.skak) {
    // Skak tanpa tangkapan → kalimat skak jadi pembuka.
    tambah("skak", 3, {}, 1);
  } else if (engineNyala && kunciRating) {
    // Tanpa peristiwa khusus, kalimat penilaian engine menjadi pembuka
    // (hindari "langkah tenang… Blunder.").
    tambah(kunciRating, 3, {}, 1);
    ratingSudah = true;
  } else {
    tambah("biasa", 4, {}, 1);
  }

  /* ---- 3. Skak (bila belum jadi pembuka). ---- */
  if (fakta.skak && (fakta.tangkap || fakta.promosi || fakta.rokade || fakta.enPassant)) {
    tambah("skakTambahan", 2, {}, 4);
  }
  if (fakta.skak && fakta.jumlahLegalLawan === 1) {
    tambah("skakSatuJalan", 1, {}, 6);
  }

  /* ---- 4. Taktik ringan dari fakta papan (tanpa engine). ---- */
  const sasaran = fakta.lawanMenggantung[0];
  // Bidak yang baru saja menangkap bidak bernilai ≥ dirinya wajar bisa
  // direbut balik — itu pertukaran, bukan "menggantung gratis".
  const tukarSetara =
    fakta.tangkap && NILAI_BIDAK[fakta.tangkap] >= NILAI_BIDAK[fakta.bidak];
  const bahaya = fakta.sendiriMenggantung.find(
    (b) => !(tukarSetara && b.petak === fakta.ke)
  );
  if (bahaya && bahaya.nilai >= 3) {
    tambah(
      "sendiriMenggantung",
      2,
      { bidak: `{{bidak:${bahaya.jenis}}}`, petak: bahaya.petak },
      4
    );
  } else if (sasaran && sasaran.nilai >= 3 && !fakta.skak) {
    tambah(
      "lawanMenggantung",
      2,
      { bidak: `{{bidak:${sasaran.jenis}}}`, petak: sasaran.petak },
      5
    );
  }

  /* ---- 5. Penilaian engine + siapa yang unggul. ---- */
  if (engineNyala && kunciRating) {
    if (!ratingSudah) tambah(kunciRating, 3, {}, 1);
    if (
      saranTerbaik &&
      saranTerbaik !== fakta.san &&
      ["inaccuracy", "mistake", "miss", "blunder"].includes(rating)
    ) {
      tambah("lebihKuat", 2, { saran: saranTerbaik }, 2);
    }
  } else if (rating === "forced") {
    tambah("paksa", 2, {}, 2);
  }

  if (engineNyala && evalSesudah) {
    const k = kategoriKeunggulan(evalSesudah);
    if (k) {
      const unggul = k.pihak === "w" ? "putih" : "hitam";
      const ganti = {
        unggul: `{{pihak:${unggul}}}`,
        nilai: k.nilai.toFixed(1).replace(/\.0$/, ""),
        mat: String(k.nilai),
      };
      if (k.tingkat === "mat") tambah("unggulMat", 2, ganti, 2);
      else if (k.tingkat === "seimbang") tambah("seimbang", 3, ganti, 3);
      else if (k.tingkat === "tipis") tambah("unggulTipis", 2, ganti, 3);
      else if (k.tingkat === "jelas") tambah("unggulJelas", 2, ganti, 2);
      else tambah("unggulMenang", 2, ganti, 2);
    }
  } else if (!engineNyala && !rating && daftar.length <= 1) {
    // Tanpa engine & tanpa peristiwa khusus: sesekali ingatkan engine
    // (hanya tiap beberapa langkah agar tidak cerewet).
    if (fakta.ply % 6 === 5) tambah("ajakEngine", 2, {}, 3);
  }

  return pangkas(daftar);
}

/**
 * Tema teka-teki (kunci lichess) yang punya nama di kamus `tekaTeki.tema.*`
 * dan layak disebut setelah soal terpecahkan — tanpa tema generik
 * (mate, mateIn2, short, endgame, …) yang tidak menjelaskan polanya.
 */
export const TEMA_DISEBUT = [
  "backRankMate",
  "smotheredMate",
  "promotion",
  "sacrifice",
  "attraction",
  "deflection",
  "pin",
  "fork",
  "discoveredAttack",
  "doubleCheck",
  "hangingPiece",
  "exposedKing",
  "kingsideAttack",
  "queensideAttack",
];

/**
 * Susun daftar kunci kalimat komentator untuk halaman TEKA-TEKI.
 *
 * Berbeda dari papan bebas, di sini konteksnya jelas: pemain harus
 * menemukan skakmat dalam N langkah, jadi komentar mengikuti TAHAP soal —
 * bukan sekadar mendeskripsikan langkah:
 *
 *  - "mulai"    : soal baru (pihak, jumlah langkah, pernah dipecahkan)
 *  - "benar"    : langkah pemain tepat, belum selesai (fakta + sisa langkah)
 *  - "lawan"    : balasan komputer (fakta + ajakan lanjut)
 *  - "salah"    : percobaan keliru — dianalisis kenapa (skak tapi lolos,
 *                 tergoda material, langkah terakhir harus mat, dsb.)
 *  - "ilegal"   : percobaan tidak legal
 *  - "petunjuk" : pemain minta petunjuk (bidak + petak asal)
 *  - "selesai"  : skakmat — plus nama pola/tema bila dikenal
 *  - "tinjau"   : navigasi solusi setelah selesai
 *
 * Kalimat fakta langkah (tangkapan/promosi/skak) dipinjam dari kamus papan
 * (`papan.komentator.*`); kalimat khusus soal dari `tekaTeki.komentator.*`.
 *
 * @param {object} p
 * @param {string} p.tahap
 * @param {string} [p.gaya]
 * @param {object|null} [p.fakta]  hasil faktaLangkah() langkah terkait
 * @param {"w"|"b"} p.giliran      pihak yang memecahkan soal
 * @param {number} [p.jumlahLangkah] N pada "mat dalam N"
 * @param {number} [p.sisa]        langkah pemain yang tersisa setelah ini
 * @param {number} [p.nomor]       nomor langkah (untuk tinjau)
 * @param {boolean} [p.sudahPecah] soal pernah dipecahkan
 * @param {boolean} [p.legal]      untuk "salah": percobaan legal atau bukan
 * @param {string[]} [p.tema]      kunci tema lichess soal ini
 * @param {string[]} [p.temaDikenal] tema yang punya terjemahan (filter)
 * @param {{from:string,to:string,bidak?:string}|null} [p.petunjuk]
 * @param {{matePutih:number|null}|null} [p.evalEngine]
 * @param {string|number} [p.benih] pembeda varian (mis. problemid)
 * @returns {Array<{kunci: string, ganti?: object}>}
 */
export function susunKomentarTekaTeki({
  tahap,
  gaya = "santai",
  fakta = null,
  giliran = "w",
  jumlahLangkah = 1,
  sisa = 0,
  nomor = 0,
  sudahPecah = false,
  legal = true,
  tema = [],
  temaDikenal = TEMA_DISEBUT,
  petunjuk = null,
  evalEngine = null,
  benih = "",
}) {
  const g = GAYA_KOMENTATOR.includes(gaya) ? gaya : "santai";
  const daftar = [];
  const pihak = giliran === "w" ? "putih" : "hitam";
  const lawan = giliran === "w" ? "hitam" : "putih";
  const gantiSoal = {
    pihak: `{{pihak:${pihak}}}`,
    lawan: `{{pihak:${lawan}}}`,
    n: String(jumlahLangkah),
    sisa: String(sisa),
    nomor: String(nomor),
    san: fakta?.san || "",
  };
  const benihDasar = `${benih}#${tahap}#${fakta?.san || ""}#${fakta?.ply || 0}`;
  const tambahSoal = (kunci, jumlahVarian, ganti = {}, prioritas = 3) => {
    daftar.push({
      kunci: `tekaTeki.komentator.${g}.${kunci}.${indeksVarian(benihDasar + kunci, jumlahVarian)}`,
      ganti: { ...gantiSoal, ...ganti },
      prioritas,
    });
  };
  // Kalimat fakta dari kamus papan — placeholder-nya dari sudut pelangkah.
  const tambahPapan = (kunci, jumlahVarian, ganti = {}, prioritas = 3) => {
    daftar.push({
      kunci: `papan.komentator.${g}.${kunci}.${indeksVarian(benihDasar + kunci, jumlahVarian)}`,
      ganti: { ...(fakta ? gantiDasar(fakta) : gantiSoal), ...ganti },
      prioritas,
    });
  };
  const pembukaFakta = () => {
    // Saat skakmat, kalimat "selesai" sudah cukup — kalimat tangkapan
    // ("partai ini bisa selesai cepat") justru janggal setelah mat.
    if (!fakta || fakta.skakmat) return;
    if (adalahPengorbanan(fakta)) {
      tambahSoal("pengorbanan", 2, { bidak: `{{bidak:${fakta.bidak}}}`, petak: fakta.ke }, 1);
      if (fakta.skak) tambahPapan("skakTambahan", 2, {}, 4);
      return;
    }
    const utama = peristiwaUtama(fakta);
    if (utama) {
      tambahPapan(utama.kunci, utama.n, utama.ganti, 1);
      if (fakta.skak && !fakta.skakmat) tambahPapan("skakTambahan", 2, {}, 4);
    } else if (fakta.skak && !fakta.skakmat) {
      tambahPapan("skak", 3, {}, 1);
    }
  };
  const catatanEngine = () => {
    const mate = evalEngine?.matePutih;
    if (mate === null || mate === undefined || mate === 0) return;
    tambahSoal("engineMat", 2, { mat: String(Math.abs(mate)) }, 5);
  };

  switch (tahap) {
    case "mulai": {
      if (jumlahLangkah <= 1) tambahSoal("mulaiSatu", 2, {}, 1);
      else tambahSoal("mulai", 3, {}, 1);
      if (sudahPecah) tambahSoal("mulaiSudah", 1, {}, 2);
      catatanEngine();
      break;
    }
    case "benar": {
      pembukaFakta();
      tambahSoal("benar", 3, {}, 1);
      catatanEngine();
      break;
    }
    case "lawan": {
      pembukaFakta();
      if (sisa <= 1) tambahSoal("lawanTerakhir", 2, {}, 1);
      else tambahSoal("lawan", 2, {}, 1);
      catatanEngine();
      break;
    }
    case "salah": {
      if (!legal || !fakta) {
        tambahSoal("ilegal", 2, {}, 1);
        break;
      }
      if (fakta.skak) {
        tambahSoal("salahSkak", 2, { jalan: String(fakta.jumlahLegalLawan) }, 1);
      } else if (fakta.tangkap && NILAI_BIDAK[fakta.tangkap] >= 3) {
        tambahSoal("salahTangkap", 2, { korban: `{{bidak:${fakta.tangkap}}}` }, 1);
      } else {
        tambahSoal("salah", 3, {}, 1);
      }
      if (sisa <= 1) tambahSoal("salahTerakhir", 2, {}, 2);
      break;
    }
    case "ilegal": {
      tambahSoal("ilegal", 2, {}, 1);
      break;
    }
    case "petunjuk": {
      const bidak = petunjuk?.bidak ? `{{bidak:${petunjuk.bidak}}}` : `{{bidak:p}}`;
      tambahSoal("petunjuk", 2, { bidak, dari: petunjuk?.from || "" }, 1);
      break;
    }
    case "selesai": {
      pembukaFakta();
      tambahSoal("selesai", 3, {}, 0);
      const dikenal = (tema || []).find((k) => temaDikenal.includes(k));
      if (dikenal) tambahSoal("selesaiTema", 2, { tema: `{{tema:${dikenal}}}` }, 2);
      break;
    }
    case "tinjau": {
      pembukaFakta();
      tambahSoal("tinjau", 2, {}, 2);
      break;
    }
    default:
      break;
  }
  return pangkas(daftar);
}

/** Batas jumlah kalimat per komentar — lebih dari ini terasa cerewet. */
const MAKS_SEGMEN = 4;

/**
 * Buang segmen berprioritas terendah (angka terbesar) sampai jumlahnya
 * ≤ MAKS_SEGMEN, tanpa mengubah urutan segmen yang tersisa.
 */
function pangkas(daftar) {
  const hasil = [...daftar];
  while (hasil.length > MAKS_SEGMEN) {
    let idx = -1;
    let terendah = -Infinity;
    hasil.forEach((seg, i) => {
      if (seg.prioritas >= terendah) {
        terendah = seg.prioritas;
        idx = i;
      }
    });
    hasil.splice(idx, 1);
  }
  return hasil.map(({ kunci, ganti }) => ({ kunci, ganti }));
}

/**
 * Ganti penanda `{{pihak:putih}}` / `{{bidak:n}}` pada teks hasil `t()`
 * dengan nama bidak/pihak dalam bahasa aktif. Dipisah dari `t()` karena
 * nilai `ganti` harus ikut diterjemahkan, bukan disisipkan mentah.
 */
export function isiNamaBidak(teks, t) {
  return String(teks)
    .replace(/\{\{pihak:(putih|hitam)\}\}/g, (_, p) => t(`papan.komentator.pihak.${p}`))
    .replace(/\{\{bidak:([pnbrqk])\}\}/g, (_, b) => t(`papan.komentator.bidak.${b}`))
    .replace(/\{\{tema:([A-Za-z0-9]+)\}\}/g, (_, k) => t(`tekaTeki.tema.${k}`));
}

/**
 * Rapikan kalimat gabungan: satukan spasi dan kapitalkan huruf pertama —
 * KECUALI bila kalimat diawali notasi SAN pion ("e4", "exd5", "b8=Q"),
 * karena "E4" bukan notasi catur yang benar.
 */
export function rapikanKalimat(teks) {
  const bersih = String(teks).replace(/\s+/g, " ").trim();
  if (!bersih || /^[a-h](?=[1-8x])/.test(bersih)) return bersih;
  return bersih[0].toUpperCase() + bersih.slice(1);
}
