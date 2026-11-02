/**
 * Pemilih dialog lawan untuk mode Manusia vs Mesin.
 *
 * Menggabungkan tiga lapisan nyata dari papan permainan:
 * 1. Fakta papan terverifikasi (`faktaLangkah` dari `chess.js`): garpuan, pin,
 *    pengorbanan, pertukaran menteri, tangkapan untung vs pertukaran seimbang,
 *    pos terdepan kuda, benteng di lajur terbuka / baris ketujuh, dobrakan
 *    pusat, fianchetto, aktivasi raja babak akhir, serta perwira menggantung.
 * 2. Konteks teori pembukaan (`buku-analisa.json`) & lonjakan evaluasi Stockfish.
 * 3. Arsip komentar partai grandmaster & duel Manusia vs Mesin (`komentator-master.json`).
 *
 * Pemilihan varian deterministik dari benih langkah agar teks stabil di setiap
 * render tetapi bervariasi alami sepanjang partai.
 */

import { adalahPengorbanan } from "../../lib/komentator.js";

const GAMBAR = {
  taunting: "small_01_taunting.png",
  thinking: "small_02_thinking.png",
  shocked: "small_03_shocked.png",
  facepalm: "small_04_facepalm.png",
  triumphant: "small_05_triumphant.png",
  nervous: "small_06_nervous.png",
  smug: "small_07_smug.png",
  rage: "small_08_rage.png",
};

const NILAI_BIDAK = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const KANTUNG = {
  siap: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogSiap1" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogSiap2" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogSiap3" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogSiap4" },
  ],
  memuat: [
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogMemuat1" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogMemuat2" },
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogMemuat3" },
  ],
  berpikir: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogBerpikir1" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogBerpikir2" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogBerpikir3" },
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogBerpikir4" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogBerpikir5" },
  ],
  jawab: [
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawab1" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogJawab2" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawab3" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogJawab4" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogJawab5" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawab6" },
  ],
  jawabBuku: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogJawabBuku1" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabBuku2" },
  ],
  jawabTukar: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogJawabTukar1" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabTukar2" },
  ],
  jawabMakan: [
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabMakan1" },
    { gambar: GAMBAR.triumphant, kunci: "papan.pveDialogJawabMakan2" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogJawabMakan3" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabMakan4" },
  ],
  jawabTukarMenteri: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogJawabTukarMenteri1" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabTukarMenteri2" },
  ],
  jawabFork: [
    { gambar: GAMBAR.triumphant, kunci: "papan.pveDialogJawabFork1" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogJawabFork2" },
  ],
  jawabPin: [
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabPin1" },
  ],
  jawabPos: [
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabPos1" },
  ],
  jawabLajur: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogJawabLajur1" },
  ],
  jawabBarisTujuh: [
    { gambar: GAMBAR.triumphant, kunci: "papan.pveDialogJawabBarisTujuh1" },
  ],
  jawabDobrak: [
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogJawabDobrak1" },
  ],
  jawabFianchetto: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogJawabFianchetto1" },
  ],
  jawabRajaAkhir: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogJawabRajaAkhir1" },
  ],
  jawabAwasGantung: [
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogJawabAwasGantung1" },
  ],
  jawabMat: [
    { gambar: GAMBAR.triumphant, kunci: "papan.pveDialogJawabMat1" },
  ],
  jawabSkak: [
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogJawabSkak1" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabSkak2" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogJawabSkak3" },
  ],
  jawabRokade: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogJawabRokade1" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabRokade2" },
  ],
  jawabPromosi: [
    { gambar: GAMBAR.triumphant, kunci: "papan.pveDialogJawabPromosi1" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabPromosi2" },
  ],
  pemainBuku: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogPemainBuku1" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogPemainBuku2" },
  ],
  pemainFork: [
    { gambar: GAMBAR.shocked, kunci: "papan.pveDialogPemainFork1" },
  ],
  pemainKorban: [
    { gambar: GAMBAR.shocked, kunci: "papan.pveDialogPemainKorban1" },
  ],
  pemainTukarMenteri: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogPemainTukarMenteri1" },
  ],
  pemainUntung: [
    { gambar: GAMBAR.rage, kunci: "papan.pveDialogPemainUntung1" },
  ],
  pemainPos: [
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogPemainPos1" },
  ],
  pemainBlunder: [
    { gambar: GAMBAR.facepalm, kunci: "papan.pveDialogPemainBlunder1" },
  ],
  pemainGantung: [
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogPemainGantung1" },
  ],
  pemainMakan: [
    { gambar: GAMBAR.shocked, kunci: "papan.pveDialogPemainMakan1" },
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogPemainMakan2" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogPemainMakan3" },
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogPemainMakan4" },
  ],
  pemainSkak: [
    { gambar: GAMBAR.shocked, kunci: "papan.pveDialogPemainSkak1" },
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogPemainSkak2" },
    { gambar: GAMBAR.shocked, kunci: "papan.pveDialogPemainSkak3" },
  ],
  pemainRokade: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogPemainRokade1" },
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogPemainRokade2" },
  ],
  pemainPromosi: [
    { gambar: GAMBAR.shocked, kunci: "papan.pveDialogPemainPromosi1" },
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogPemainPromosi2" },
  ],
  tinjauPemain: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogTinjauPemain1" },
  ],
  tinjauMesin: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogTinjauMesin1" },
  ],
  tinjauBuku: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogTinjauBuku1" },
  ],
  giliran: [
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogGiliran1" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogGiliran2" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogGiliran3" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogGiliran4" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogGiliran5" },
  ],
  menang: [
    { gambar: GAMBAR.triumphant, kunci: "papan.pveDialogMenang1" },
    { gambar: GAMBAR.triumphant, kunci: "papan.pveDialogMenang2" },
    { gambar: GAMBAR.triumphant, kunci: "papan.pveDialogMenang3" },
  ],
  kalah: [
    { gambar: GAMBAR.facepalm, kunci: "papan.pveDialogKalah1" },
    { gambar: GAMBAR.shocked, kunci: "papan.pveDialogKalah2" },
    { gambar: GAMBAR.facepalm, kunci: "papan.pveDialogKalah3" },
  ],
  seri: [
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogSeri1" },
    { gambar: GAMBAR.nervous, kunci: "papan.pveDialogSeri2" },
  ],
  menyerah: [
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogMenyerah1" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogMenyerah2" },
  ],
  gagal: [
    { gambar: GAMBAR.rage, kunci: "papan.pveDialogGagal1" },
    { gambar: GAMBAR.facepalm, kunci: "papan.pveDialogGagal2" },
  ],
};

/**
 * Hash bilangan bulat (varian hash Wang/xorshift). Perlu hash sungguhan,
 * bukan modulo linear: benih bertambah dua tiap giliran mesin, sehingga
 * modulo pada kantung bergenap hanya akan menyentuh separuh varian.
 */
function acakDeterministik(benih) {
  let x = (benih + 1) * 2654435761;
  x = ((x >>> 16) ^ x) * 0x45d9f3b;
  x = ((x >>> 16) ^ x) * 0x45d9f3b;
  return ((x >>> 16) ^ x) >>> 0;
}

function pilihVarian(nama, benih) {
  const daftar = KANTUNG[nama];
  return daftar[acakDeterministik(benih) % daftar.length];
}

function susunInfoMaster(catatanMaster, bahasa, t) {
  if (!catatanMaster) return null;
  const kutipan = bahasa === "en" ? catatanMaster.en : catatanMaster.id;
  const labelLencana = catatanMaster.duelMesin
    ? t("papan.komentator.labelDuelMesin")
    : t("papan.komentator.labelArsipMaster");
  const atribusi = [
    catatanMaster.partai,
    catatanMaster.komentator
      ? t("papan.komentator.olehKomentator", { komentator: catatanMaster.komentator })
      : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    kutipan,
    labelLencana,
    atribusi,
    partai: catatanMaster.partai,
    komentator: catatanMaster.komentator,
  };
}

/** Apakah tangkapan benar-benar menghasilkan keuntungan materi bersih bagi pelangkah. */
function tangkapanMenguntungkan(fakta) {
  if (!fakta || !fakta.tangkap) return false;
  const nilaiKorban = NILAI_BIDAK[fakta.tangkap] || 0;
  const nilaiPenyerang = fakta.bisaDirebut ? NILAI_BIDAK[fakta.bidak] || 0 : 0;
  return nilaiKorban - nilaiPenyerang >= 1;
}

/**
 * Menentukan gambar ekspresi, teks dialog lawan, serta atribusi arsip master bila cocok.
 *
 * @param {object} ctx
 * @param {string} ctx.statusMesin  idle | memuat | mesin | pemain | gagal | selesai
 * @param {?object} ctx.hasil       { jenis, pemenang } bila partai usai
 * @param {string} ctx.warnaMesin   "w" | "b"
 * @param {?object} ctx.langkahDialog  langkah aktif: { san, oleh, tangkap, skak, rokade, promosi, petak }
 * @param {?object} [ctx.fakta]     hasil `faktaLangkah(fenSebelum, san)` langkah aktif
 * @param {?object} [ctx.catatanMaster] catatan dari `komentator-master.json`
 * @param {?string} [ctx.namaPembukaan] nama pembukaan dari buku pembukaan
 * @param {?object} [ctx.evaluasi]  `{ cpPutih, matePutih }` pada posisi saat ini
 * @param {?number} [ctx.selisihCpPemain] perubahan sentipion dari sudut pandang pemain
 * @param {boolean} [ctx.sedangTinjau] true saat pengguna menelusuri langkah sebelumnya
 * @param {string} [ctx.bahasa]     "id" | "en"
 * @param {number} [ctx.benih]      jumlah langkah yang sudah dimainkan
 * @param {Function} ctx.t          penerjemah i18n
 */
export function dialogMesin({
  statusMesin,
  hasil,
  warnaMesin,
  langkahDialog,
  fakta = null,
  catatanMaster = null,
  namaPembukaan = null,
  evaluasi = null,
  selisihCpPemain = null,
  sedangTinjau = false,
  bahasa = "id",
  benih = 0,
  t,
}) {
  const infoMaster =
    !hasil && statusMesin !== "gagal" ? susunInfoMaster(catatanMaster, bahasa, t) : null;

  const ambil = (nama, ganti = {}) => {
    const { gambar, kunci } = pilihVarian(nama, benih);
    return { gambar, teks: t(kunci, ganti), infoMaster };
  };

  if (hasil?.jenis === "seri") return ambil("seri");
  if (hasil?.jenis === "skakmat") {
    return hasil.pemenang === warnaMesin ? ambil("menang") : ambil("kalah");
  }
  if (hasil?.jenis === "menyerah") return ambil("menyerah");
  if (statusMesin === "gagal") return ambil("gagal");

  const san = fakta?.san || langkahDialog?.san || "";
  const petak = fakta?.ke || langkahDialog?.petak || "";
  const gantiDasar = {
    langkah: san,
    petak,
    pembukaan: namaPembukaan || "",
  };

  // Mode tinjau riwayat (Undo / Mundur / Maju): ulas langkah pada ply tersebut,
  // jangan berpura-pura menyuruh pemain melangkah seolah di ujung partai.
  if (sedangTinjau && langkahDialog) {
    if (namaPembukaan && (!fakta || fakta.ply <= 16)) {
      return ambil("tinjauBuku", gantiDasar);
    }
    if (langkahDialog.oleh === "pemain") {
      if (fakta?.tukarMenteri) return ambil("pemainTukarMenteri", gantiDasar);
      if (fakta?.fork) return ambil("pemainFork", { ...gantiDasar, petak: fakta.fork.petak });
      if (langkahDialog.skak) return ambil("pemainSkak", gantiDasar);
      if (langkahDialog.rokade) return ambil("pemainRokade", gantiDasar);
      if (langkahDialog.tangkap) return ambil("pemainMakan", gantiDasar);
      return ambil("tinjauPemain", gantiDasar);
    }
    if (fakta?.tukarMenteri) return ambil("jawabTukarMenteri", gantiDasar);
    if (fakta?.fork) return ambil("jawabFork", { ...gantiDasar, petak: fakta.fork.petak });
    if (langkahDialog.skak) return ambil("jawabSkak", gantiDasar);
    if (langkahDialog.rokade) return ambil("jawabRokade", gantiDasar);
    if (langkahDialog.tangkap) {
      return tangkapanMenguntungkan(fakta)
        ? ambil("jawabMakan", gantiDasar)
        : ambil("jawabTukar", gantiDasar);
    }
    return ambil("tinjauMesin", gantiDasar);
  }

  // Selama mesin menghitung, panel bereaksi konkret terhadap langkah pemain barusan.
  if (statusMesin === "memuat" || statusMesin === "mesin") {
    if (langkahDialog?.oleh === "pemain") {
      if (fakta?.tukarMenteri) return ambil("pemainTukarMenteri", gantiDasar);
      if (fakta?.fork) return ambil("pemainFork", { ...gantiDasar, petak: fakta.fork.petak });
      if (adalahPengorbanan(fakta)) return ambil("pemainKorban", gantiDasar);
      if (langkahDialog.skak) return ambil("pemainSkak", gantiDasar);
      if (langkahDialog.promosi) return ambil("pemainPromosi", gantiDasar);
      if (langkahDialog.rokade) return ambil("pemainRokade", gantiDasar);
      if (langkahDialog.tangkap) {
        return tangkapanMenguntungkan(fakta)
          ? ambil("pemainUntung", gantiDasar)
          : ambil("pemainMakan", gantiDasar);
      }
      if (selisihCpPemain !== null && selisihCpPemain <= -180) {
        return ambil("pemainBlunder", gantiDasar);
      }
      if (fakta?.sendiriMenggantung?.length) {
        return ambil("pemainGantung", {
          ...gantiDasar,
          petak: fakta.sendiriMenggantung[0].petak,
        });
      }
      if (fakta?.kudaPosTerdepan || fakta?.bentengBarisTujuh || fakta?.dobrakPusat) {
        return ambil("pemainPos", gantiDasar);
      }
      if (namaPembukaan && (!fakta || fakta.ply <= 14)) {
        return ambil("pemainBuku", gantiDasar);
      }
    }
    return statusMesin === "memuat" ? ambil("memuat") : ambil("berpikir");
  }

  // Sesudah mesin melangkah: jelaskan ide konkret atau ancaman nyata di papan.
  if (langkahDialog?.oleh === "mesin") {
    const matePutih = evaluasi?.matePutih ?? null;
    const mesinMauMat =
      matePutih !== null &&
      ((warnaMesin === "w" && matePutih > 0 && matePutih <= 6) ||
        (warnaMesin === "b" && matePutih < 0 && Math.abs(matePutih) <= 6));
    if (mesinMauMat) return ambil("jawabMat", gantiDasar);
    if (fakta?.tukarMenteri) return ambil("jawabTukarMenteri", gantiDasar);
    if (fakta?.fork) return ambil("jawabFork", { ...gantiDasar, petak: fakta.fork.petak });
    if (langkahDialog.skak) return ambil("jawabSkak", gantiDasar);
    if (langkahDialog.promosi) return ambil("jawabPromosi", gantiDasar);
    if (langkahDialog.rokade) return ambil("jawabRokade", gantiDasar);
    if (fakta?.tukarMenteri) return ambil("jawabTukarMenteri", gantiDasar);
    if (langkahDialog.tangkap) {
      if (!fakta) return ambil("jawabMakan", gantiDasar);
      return tangkapanMenguntungkan(fakta)
        ? ambil("jawabMakan", gantiDasar)
        : ambil("jawabTukar", gantiDasar);
    }
    if (fakta?.lawanTerpaku?.length) {
      return ambil("jawabPin", { ...gantiDasar, petak: fakta.lawanTerpaku[0].petak });
    }
    if (fakta?.bentengBarisTujuh) return ambil("jawabBarisTujuh", gantiDasar);
    if (fakta?.kudaPosTerdepan) return ambil("jawabPos", gantiDasar);
    if (fakta?.bentengLajurTerbuka) return ambil("jawabLajur", gantiDasar);
    if (fakta?.dobrakPusat) return ambil("jawabDobrak", gantiDasar);
    if (fakta?.fianchetto) return ambil("jawabFianchetto", gantiDasar);
    if (fakta?.rajaAktifAkhir) return ambil("jawabRajaAkhir", gantiDasar);
    if (namaPembukaan && (!fakta || fakta.ply <= 14)) {
      return ambil("jawabBuku", gantiDasar);
    }
    if (fakta?.lawanMenggantung?.length) {
      return ambil("jawabAwasGantung", {
        ...gantiDasar,
        petak: fakta.lawanMenggantung[0].petak,
      });
    }
    return ambil("jawab", gantiDasar);
  }

  if (statusMesin === "pemain") return ambil("giliran");
  return ambil("siap");
}
