/**
 * Pemilih dialog lawan untuk mode Manusia vs Mesin. Meniru obrolan bot catur
 * daring (chess.com bots, coach Lichess): kalimatnya dikelompokkan per situasi
 * — siap, berpikir, menjawab, bereaksi atas tangkapan/skak/rokade/promosi —
 * dan dicampur tips pembelajaran supaya panelnya sekaligus jadi pelatih kecil.
 * Pemilihan varian deterministik dari jumlah langkah agar teks tidak
 * berganti-ganti setiap render, tetapi tetap terasa hidup antar langkah.
 */

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

// Setiap entri menunjuk kunci terjemahan papan.pveDialog… dan ekspresi wajah
// yang cocok dengan nadanya. Jumlah varian per situasi harus sama dengan
// jumlah kunci di kamus id/en.
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
  jawabMakan: [
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabMakan1" },
    { gambar: GAMBAR.triumphant, kunci: "papan.pveDialogJawabMakan2" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogJawabMakan3" },
    { gambar: GAMBAR.smug, kunci: "papan.pveDialogJawabMakan4" },
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
  pemainMakan: [
    { gambar: GAMBAR.shocked, kunci: "papan.pveDialogPemainMakan1" },
    { gambar: GAMBAR.rage, kunci: "papan.pveDialogPemainMakan2" },
    { gambar: GAMBAR.shocked, kunci: "papan.pveDialogPemainMakan3" },
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
  giliran: [
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogGiliran1" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogGiliran2" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogGiliran3" },
    { gambar: GAMBAR.thinking, kunci: "papan.pveDialogGiliran4" },
    { gambar: GAMBAR.taunting, kunci: "papan.pveDialogGiliran5" },
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

/**
 * Menentukan gambar ekspresi dan teks dialog lawan.
 *
 * @param {object} ctx
 * @param {string} ctx.statusMesin  idle | memuat | mesin | pemain | gagal | selesai
 * @param {?object} ctx.hasil       { jenis, pemenang } bila partai usai
 * @param {string} ctx.warnaMesin   "w" | "b"
 * @param {?object} ctx.langkahDialog  langkah terakhir: { san, oleh, tangkap, skak, rokade, promosi }
 * @param {number} ctx.benih        jumlah langkah yang sudah dimainkan
 * @param {Function} ctx.t          penerjemah i18n
 */
export function dialogMesin({ statusMesin, hasil, warnaMesin, langkahDialog, benih = 0, t }) {
  const ambil = (nama, ganti) => {
    const { gambar, kunci } = pilihVarian(nama, benih);
    return { gambar, teks: t(kunci, ganti) };
  };

  if (hasil?.jenis === "seri") return ambil("seri");
  if (hasil?.jenis === "skakmat") {
    return hasil.pemenang === warnaMesin ? ambil("menang") : ambil("kalah");
  }
  if (hasil?.jenis === "menyerah") return ambil("menyerah");
  if (statusMesin === "gagal") return ambil("gagal");

  // Selama mesin menghitung, panel dipakai untuk bereaksi atas langkah pemain
  // barusan — persis kebiasaan bot daring yang berkomentar sambil berpikir.
  if (statusMesin === "memuat" || statusMesin === "mesin") {
    if (langkahDialog?.oleh === "pemain") {
      if (langkahDialog.skak) return ambil("pemainSkak");
      if (langkahDialog.promosi) return ambil("pemainPromosi");
      if (langkahDialog.rokade) return ambil("pemainRokade");
      if (langkahDialog.tangkap) return ambil("pemainMakan");
    }
    return statusMesin === "memuat" ? ambil("memuat") : ambil("berpikir");
  }

  if (langkahDialog?.oleh === "mesin") {
    const ganti = { langkah: langkahDialog.san };
    if (langkahDialog.skak) return ambil("jawabSkak", ganti);
    if (langkahDialog.promosi) return ambil("jawabPromosi", ganti);
    if (langkahDialog.rokade) return ambil("jawabRokade", ganti);
    if (langkahDialog.tangkap) return ambil("jawabMakan", ganti);
    return ambil("jawab", ganti);
  }

  if (statusMesin === "pemain") return ambil("giliran");
  return ambil("siap");
}
