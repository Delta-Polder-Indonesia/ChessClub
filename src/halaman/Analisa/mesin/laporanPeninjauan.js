/**
 * Laporan peninjauan anti-cheat untuk pengurus turnamen/komunitas.
 *
 * Meringkas keluaran `agregatSkorPemain` (lihat ./antiCheat.js) menjadi
 * berkas teks siap lampir berita acara — TANPA analisis ulang: semua angka
 * sudah dihitung. Laporan ini INDIKASI STATISTIK untuk ditinjau manusia,
 * bukan vonis; sanggahan wajib menyertai setiap laporan (aturan yang sama
 * dengan `summary/deteksiEngine.jsx`).
 *
 * Semua fungsi murni kecuali `unduhLaporanPeninjauan` (memakai Blob +
 * anchor, dijaga `typeof document` supaya aman diuji di Node/jsdom).
 */

/** Label baku laporan teks — bisa diganti lewat `opsi.kata` (mis. i18n). */
const KATA_BAKU = Object.freeze({
  judul: "LAPORAN PENINJAUAN ANTI-CHEAT (INDIKASI STATISTIK — BUKAN VONIS)",
  pemain: "Pemain",
  dibuat: "Dibuat",
  partai: "Partai dianalisis",
  langkah: "Langkah dinilai",
  ratingAcuan: "Rating acuan (median)",
  keandalan: "Keandalan",
  cukup: "cukup untuk gambaran awal",
  terbatas: "TERBATAS — belum menggambarkan apa pun",
  skor: "Skor kecurigaan",
  kalibrasi: "dikalibrasi rating",
  tanpaKalibrasi: "tanpa kalibrasi rating (rating tidak tersedia)",
  kecocokan: "Kecocokan top-1",
  kecocokanTop3: "Dalam top-3 engine",
  peringkat: "Rata-rata peringkat kandidat",
  acpl: "ACPL antarposisi",
  acplKandidat: "ACPL vs kandidat terbaik",
  akurasi: "Akurasi (harmonic mean, metode lichess/en-croissant)",
  akurasiAritmetik: "Akurasi (rata-rata aritmetik)",
  acplBaku: "ACPL baku (eval dipotong ±1000, mate = ±1000)",
  anotasi: "Anotasi NAG",
  catatanMetrik:
    "Skor gabungan adalah heuristik, bukan probabilitas kecurangan yang terkalibrasi; bobot dan ambang masih perlu diuji pada korpus partai berlabel. Untuk skor, kecocokan top-1 hanya dihitung pada posisi tanpa peringkat MultiPV valid agar satu keputusan tidak dihitung dua kali; persentase top-1 yang ditampilkan tetap memakai seluruh sampel valid. Metrik berlabel 'metode lichess/en-croissant' memakai kurva win chance dan harmonic mean sehingga bisa disandingkan dengan angka lichess; ACPL antarposisi memakai konvensi lama modul ini (clamp 1000 cp/langkah, mate 10000) dan tetap menjadi masukan skor kecurigaan.",
  kehilanganMenang: "Rata kehilangan peluang menang (WDL, permille)",
  konsistensi: "Konsistensi waktu pikir",
  korelasi: "Korelasi waktu pikir ↔ kualitas (Spearman)",
  streak: "Rentetan langkah terbaik terpanjang",
  sulit: "Kecocokan posisi sulit (≤20 cp)",
  mudah: "Kecocokan posisi mudah (≥100 cp)",
  komponen: "Komponen skor (0–100)",
  tren: "Tren antarpartai",
  perPartai: "RINCIAN PER PARTAI",
  kolom: ["#", "Tanggal", "Warna", "Lawan", "Langkah", "Cocok%", "ACPL", "Akurasi", "ACPLbaku", "Peringkat", "Skor", "Level"],
  tanpaData: "Tidak ada partai yang bisa dianalisis.",
  sanggahan:
    "Angka di atas adalah indikasi statistik untuk ditinjau manusia, bukan bukti atau tuduhan. Pemain kuat, kontrol waktu panjang, dan akhirpartai sederhana juga menaikkan kecocokan dengan engine. Keputusan apa pun harus lewat peninjauan partai aslinya.",
});

/** Anotasi NAG menjadi satu baris ringkas; "-" bila tidak ada hitungan. */
function formatAnotasi(anotasi) {
  if (!anotasi || typeof anotasi !== "object") return "-";
  const bagian = Object.entries(anotasi)
    .filter(([, n]) => Number(n) > 0)
    .map(([simbol, n]) => `${simbol} ${n}`);
  return bagian.length ? bagian.join(" · ") : "tidak ada";
}

function fmt(nilai, akhiran = "") {
  return Number.isFinite(nilai) ? `${nilai}${akhiran}` : "-";
}

function barisTabel(kolom) {
  const lebar = [4, 12, 6, 18, 8, 8, 8, 8, 9, 10, 6, 8];
  return kolom.map((sel, i) => String(sel ?? "").slice(0, lebar[i]).padEnd(lebar[i])).join(" ");
}

/**
 * Bangun laporan teks dari keluaran `agregatSkorPemain`.
 * @param {object} agregat hasil `agregatSkorPemain` (boleh kosong).
 * @param {{ username?: string, kata?: object }} [opsi]
 * @returns {string} isi berkas teks.
 */
export function buatLaporanPeninjauan(agregat, { username = "", kata = {} } = {}) {
  const k = { ...KATA_BAKU, ...kata };
  const a = agregat ?? {};
  const garis = "=".repeat(78);
  const halus = "-".repeat(78);
  const out = [];

  out.push(garis);
  out.push(k.judul);
  out.push(garis);
  out.push(`${k.pemain}: ${a.username || username || "-"}`);
  out.push(`${k.dibuat}: ${new Date().toISOString()}`);
  out.push(`${k.partai}: ${a.jumlahPartai ?? 0} · ${k.langkah}: ${a.jumlahLangkah ?? 0}`);
  out.push(`${k.ratingAcuan}: ${fmt(a.rating)}`);
  out.push(`${k.keandalan}: ${a.andal ? k.cukup : k.terbatas}`);
  out.push("");
  out.push(
    `${k.skor}: ${fmt(a.skor)} (${a.level ?? "tanpa data"}) — ${
      Number.isFinite(a.rating) ? `${k.kalibrasi} ${a.rating}` : k.tanpaKalibrasi
    }`
  );
  out.push(`${k.kecocokan}: ${fmt(a.engineMatchRate, "%")} · ${k.kecocokanTop3}: ${fmt(a.kecocokanTop3, "%")}`);
  out.push(`${k.peringkat}: ${fmt(a.rataPeringkat)} (skala 1–6)`);
  out.push(`${k.acpl}: ${fmt(a.acpl, " cp")} · ${k.acplKandidat}: ${fmt(a.acplKandidat, " cp")}`);
  out.push(`${k.akurasi}: ${fmt(a.akurasi, "%")} · ${k.akurasiAritmetik}: ${fmt(a.akurasiAritmetik, "%")}`);
  out.push(`${k.acplBaku}: ${fmt(a.acplBaku, " cp")}`);
  out.push(`${k.anotasi}: ${formatAnotasi(a.anotasi)}`);
  out.push(`${k.kehilanganMenang}: ${fmt(a.rataKehilanganMenang)}`);
  out.push(`${k.konsistensi}: ${fmt(a.konsistensiWaktu)} · ${k.streak}: ${fmt(a.streakTerpanjang)}`);
  out.push(`${k.korelasi}: ${fmt(a.korelasiWaktuKualitas)}`);
  out.push(`${k.sulit}: ${fmt(a.kecocokanSulit, "%")} · ${k.mudah}: ${fmt(a.kecocokanMudah, "%")}`);

  if (a.komponen) {
    out.push(
      `${k.komponen}: kecocokan ${fmt(a.komponen.kecocokan)} · peringkat ${fmt(a.komponen.peringkat)} · acpl ${fmt(
        a.komponen.acpl
      )} · waktu ${fmt(a.komponen.waktu)}`
    );
  }
  if (a.tren) {
    out.push(
      `${k.tren}: ${a.tren.arah ?? "-"}${
        Number.isFinite(a.tren.kemiringan) ? ` (${a.tren.kemiringan} poin/partai)` : ""
      }`
    );
  }

  out.push("");
  out.push(halus);
  out.push(k.perPartai);
  out.push(halus);
  const daftar = Array.isArray(a.partai) ? a.partai : [];
  if (!daftar.length) {
    out.push(k.tanpaData);
  } else {
    out.push(barisTabel(k.kolom));
    daftar.forEach((b, i) => {
      const tanggal = b.timestamp ? new Date(b.timestamp).toISOString().slice(0, 10) : "-";
      out.push(
        barisTabel([
          i + 1,
          tanggal,
          b.warna === "w" ? "putih" : b.warna === "b" ? "hitam" : "-",
          b.lawan || "-",
          b.langkahDinilai ?? 0,
          fmt(b.engineMatchRate),
          fmt(b.acpl),
          fmt(b.akurasi),
          fmt(b.acplBaku),
          fmt(b.rataPeringkat),
          fmt(b.skor),
          b.level ?? "-",
        ])
      );
    });
  }

  out.push("");
  out.push(halus);
  out.push(`CATATAN METODE: ${k.catatanMetrik}`);
  out.push("");
  out.push(`SANGGAHAN: ${k.sanggahan}`);
  out.push(halus);
  return out.join("\n");
}

/** Versi JSON — untuk diproses alat lain / diarsipkan terstruktur. */
export function buatLaporanJson(agregat, { username = "" } = {}) {
  const a = agregat ?? {};
  return JSON.stringify(
    {
      jenis: "laporan-peninjauan-anticheat",
      /*
       * v3: menambah metrik sepadan platform lain (`akurasi`,
       * `akurasiAritmetik`, `acplBaku`, `anotasi`) + `catatanMetode`.
       * Bentuk lama (v2) tetap terbaca; yang berubah hanya tambahan kunci.
       */
      versi: 3,
      dibuat: new Date().toISOString(),
      username: a.username || username || "",
      rating: a.rating ?? null,
      jumlahPartai: a.jumlahPartai ?? 0,
      jumlahLangkah: a.jumlahLangkah ?? 0,
      andal: Boolean(a.andal),
      skor: a.skor ?? null,
      level: a.level ?? null,
      komponen: a.komponen ?? null,
      metrik: {
        engineMatchRate: a.engineMatchRate ?? null,
        kecocokanTop3: a.kecocokanTop3 ?? null,
        kecocokanTop5: a.kecocokanTop5 ?? null,
        rataPeringkat: a.rataPeringkat ?? null,
        acpl: a.acpl ?? null,
        acplKandidat: a.acplKandidat ?? null,
        // Metrik sepadan platform lain (./akurasi.js).
        akurasi: a.akurasi ?? null,
        akurasiAritmetik: a.akurasiAritmetik ?? null,
        akurasiSampel: a.akurasiSampel ?? 0,
        acplBaku: a.acplBaku ?? null,
        anotasi: a.anotasi ?? null,
        rataKehilanganMenang: a.rataKehilanganMenang ?? null,
        konsistensiWaktu: a.konsistensiWaktu ?? null,
        korelasiWaktuKualitas: a.korelasiWaktuKualitas ?? null,
        kecocokanSulit: a.kecocokanSulit ?? null,
        kecocokanMudah: a.kecocokanMudah ?? null,
        streakTerpanjang: a.streakTerpanjang ?? 0,
      },
      tren: a.tren ?? null,
      partai: Array.isArray(a.partai) ? a.partai : [],
      catatanMetode: KATA_BAKU.catatanMetrik,
      sanggahan: KATA_BAKU.sanggahan,
    },
    null,
    2
  );
}

/**
 * Unduh laporan teks sebagai berkas. `false` bila bukan di peramban.
 * @returns {boolean} berhasil memicu unduhan.
 */
export function unduhLaporanPeninjauan(agregat, { username = "", format = "teks" } = {}) {
  if (typeof document === "undefined" || typeof Blob === "undefined") return false;
  const isi = format === "json" ? buatLaporanJson(agregat, { username }) : buatLaporanPeninjauan(agregat, { username });
  const nama = `laporan-anticheat-${(agregat?.username || username || "pemain").replace(/[^a-z0-9_-]+/gi, "_")}-${new Date()
    .toISOString()
    .slice(0, 10)}.${format === "json" ? "json" : "txt"}`;
  const url = URL.createObjectURL(new Blob([isi], { type: "text/plain;charset=utf-8" }));
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = nama;
  document.body.appendChild(tautan);
  tautan.click();
  tautan.remove();
  URL.revokeObjectURL(url);
  return true;
}
