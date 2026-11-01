/**
 * Optimasi hasil build untuk PageSpeed / Lighthouse:
 *  1. Sisipkan CSS ke dalam HTML — hilangkan permintaan render-blocking.
 *  2. Preload font 400 & 700 (bobot yang dipakai judul + isi).
 *  3. Salin index.html ke setiap rute publik + 404.html, dengan metadata
 *     rute (lihat META_RUTE) — supaya deep link Vercel dan Googlebot melihat
 *     judul, deskripsi, dan rel=canonical milik rute itu sendiri, bukan beranda.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ID } from "../src/lib/terjemahan/id/index.js";

/** Rute publik — harus selaras dengan RUTE_HALAMAN di src/App.jsx. */
/**
 * Rute LAMA yang kini hanya berfungsi sebagai pengalihan ke alamat resminya.
 *
 * Sengaja dipisah dari RUTE_PUBLIK: rute seperti ini TIDAK dipra-render, TIDAK
 * masuk `sitemap.xml`, dan TIDAK diberi metadata sendiri — kalau ikut, mesin
 * pencari melihat dua alamat untuk satu halaman yang sama. Pengalihannya
 * dipasang rangkap: redirect 308 di `vercel.json` (untuk pemuat halaman penuh)
 * dan `<Navigate>` di `src/App.jsx` (untuk navigasi di dalam aplikasi).
 */
export const RUTE_ALIH = {
  "/teka-teki": "/teka-teki/problem",
};

/**
 * Rute layar-penuh berlatar gelap (harus selaras dengan `TANPA_KERANGKA` di
 * `src/components/PageLayout.jsx`).
 *
 * HTML tiap rute disalin dari `index.html`, yang masih membawa sisa optimasi
 * LCP beranda: `<link rel=preload>` + `<div id=boot-hero>` (foto
 * `tonggak-2015.webp`). Di rute ini elemen itu salah halaman — pengunjung
 * melihat foto beranda sampai chunk halaman dimuat, lalu layar berganti
 * total jadi gelap: itulah kedipan sekali saat membuka rute.
 */
export const RUTE_LATAR_GELAP = [
  "/teka-teki/problem",
  "/teka-teki-rush",
  "/teka-teki-harian",
  "/quiz-catur",
  "/papan-interaktif",
  "/papan-interaktif/manusia-vs-mesin",
  "/papan-interaktif/latihan-repertoar",
  "/papan-interaktif/hand-brain",
  "/papan-interaktif/turing-test",
  "/papan-interaktif/pengaturan",
];

/**
 * JSON yang di-fetch saat halaman terbuka, per rute. Dipreload di `<head>`
 * dengan `as="fetch"` supaya unduhan mulai bersamaan dengan parse HTML, bukan
 * setelah React + chunk halaman siap — fetch `teka-teki.json` inilah yang
 * menunda render elemen LCP (SVG bidak) pada audit PageSpeed. `crossorigin`
 * wajib untuk `as="fetch"` (mode fetch default = cors); same-origin + atribut
 * ini terbukti memakai ulang preload di Chrome (peramban yang dipakai PSI).
 * href harus sama persis dengan `fetch(BASE_URL + "data/teka-teki.json")`
 * di TekaTeki/TekaTekiRush.
 */
export const PRELOAD_JSON_RUTE = {
  "/teka-teki/problem": "data/teka-teki.json",
  "/teka-teki-rush": "data/teka-teki.json",
};

export const RUTE_PUBLIK = [
  "/tentang-kami",
  "/tentang-kami/struktur-grup-catur",
  "/program-kami",
  "/program-kami/teka-teki",
  "/program-kami/analisa",
  "/program-kami/analisa/papan",
  "/program-kami/atribusi",
  "/program-kami/pembukaan",
  "/program-kami/rush-teka-teki",
  "/program-kami/kuis-catur",
  "/program-kami/manusia-vs-mesin",
  "/teka-teki/problem",
  "/teka-teki-rush",
  "/teka-teki-harian",
  "/quiz-catur",
  "/papan-interaktif",
  "/papan-interaktif/manusia-vs-mesin",
  "/papan-interaktif/latihan-repertoar",
  "/papan-interaktif/hand-brain",
  "/papan-interaktif/turing-test",
  "/papan-interaktif/pengaturan",
  "/turnamen",
  "/turnamen/turnamen-bulanan",
  "/turnamen/liga-musiman",
  "/turnamen/turnamen-terbuka",
  "/turnamen/liga-antar-komunitas",
  "/media-dan-informasi",
  "/media-dan-informasi/berita-komunitas",
  "/media-dan-informasi/pengumuman",
  "/media-dan-informasi/galeri",
  "/pendaftaran-anggota",
  "/keberlanjutan",
  "/keberlanjutan/syarat-dan-ketentuan",
  "/keberlanjutan/kode-etik-komunitas",
  "/keberlanjutan/pertanyaan-umum",
  "/bantuan",
  "/privasi",
  "/ketentuan",
  "/hubungi-kami",
  "/beranda",
  "/beranda/turnamen",
  "/beranda/rangkuman-pengumuman",
  "/beranda/daftar-juara",
  "/beranda/peringkat",
  "/karir",
  "/program-kami/ebook-panduan",
];

const AKHIR_KORPORAT = " | Komunitas Catur Indonesia";
const AKHIR_BLUNDER = " | Blunder Skuad";

/** Nilai kunci titik (mis. "program.judul") dari kamus Indonesia. */
function teksKamus(kunci) {
  const nilai = String(kunci)
    .split(".")
    .reduce((obj, k) => (obj ? obj[k] : undefined), ID);
  return typeof nilai === "string" ? nilai : "";
}

/**
 * Metadata per rute yang disalin ke HTML hasil build.
 *
 * Tanpa tabel ini, salinan `index.html` di setiap rute mengirim `<title>`,
 * `meta description`, dan `rel=canonical` milik beranda. Google membacanya
 * sebagai puluhan duplikat "/" (kanonikal collapse) dan tidak mengindeks
 * rutenya — gejala "Dirayapi - saat ini tidak diindeks" di Search Console.
 *
 * Judul/deskripsi diambil dari kamus ID lewat `judulKey`/`deskripsiKey`
 * supaya teks tidak disalin dua kali; `judul`/`deskripsi` dipakai untuk
 * halaman yang prop meta-nya memang string literal di komponenya. Akhiran
 * judul mengikuti `<title>` yang dipasang runtime: halaman ber-CorporatePage
 * dan halaman yang hanya mengatur `document.title` memakai "Komunitas Catur
 * Indonesia", halaman ber-MetaHalaman memakai "Blunder Skuad".
 */
export const META_RUTE = {
  "/": {
    judulKey: "common.judulBeranda",
    // 157 karakter — lebih panjang dari ini dipotong di cuplikan Google
    // (dipangkas dari 182; meta description index.html ikut disamakan).
    deskripsi:
      "Blunder Skuad — Komunitas Catur Indonesia: wadah bermain, belajar, dan bertumbuh bagi pecatur. Turnamen, peringkat anggota, kelas pelatihan, kabar komunitas.",
    gambar: "/images/landing-hero.webp",
    gambarUkuran: "828",
    gambarTinggi: "462",
  },
  "/tentang-kami": {
    judulKey: "nav.tentangKami",
    // hero.deskripsi terlalu panjang untuk cuplikan — diringkas di sini.
    deskripsi:
      "Sejarah, visi-misi, tata nilai, dan makna logo Komunitas Catur Indonesia, komunitas catur terverifikasi di Chess.com sejak 10 Desember 2015.",
    akhir: AKHIR_KORPORAT,
  },
  "/tentang-kami/struktur-grup-catur": {
    judulKey: "strukturGrupCatur.judul",
    deskripsiKey: "strukturGrupCatur.deskripsi",
  },
  "/program-kami": { judulKey: "program.judul", deskripsiKey: "program.deskripsi" },
  "/program-kami/teka-teki": {
    judulKey: "tipsTekaTeki.judul",
    deskripsiKey: "tipsTekaTeki.deskripsi",
    gambar: "/images/ProgramKami/teka-teki-hero.webp",
    gambarUkuran: "1672",
    gambarTinggi: "941",
  },
  "/program-kami/analisa": {
    judulKey: "analisaLanding.judul",
    deskripsiKey: "analisaLanding.metaDeskripsi",
    gambar: "/images/ProgramKami/analisa-hero.webp",
    gambarUkuran: "1672",
    gambarTinggi: "941",
  },
  "/program-kami/analisa/papan": {
    judulKey: "analisa.metaJudul",
    // analisa.metaDeskripsi 167 karakter — dipotong di cuplikan Google.
    deskripsi:
      "Analisis PGN dan FEN gratis dengan Stockfish lokal: label per langkah, grafik evaluasi, dan akurasi pemain. Data tetap di perangkat Anda.",
    // Sejak papan analisa dipromosikan untuk SEO, rute ini IKUT diindeks dan
    // karenanya WAJIB ada di public/sitemap.xml (dijaga `uji:seo`).
    robots: "index, follow",
    gambar: "/images/PapanAnalysa.webp",
    gambarUkuran: "1600",
    gambarTinggi: "1200",
  },
  "/program-kami/atribusi": {
    judulKey: "analisa.atribusi.judul",
    // analisa.atribusi.pendahuluan 183 karakter — dipotong di cuplikan Google.
    deskripsi:
      "Sumber dan lisensi fitur analisis: tampilan dipindah dari Brilliant-Chess (MIT), engine Stockfish dan chess.js lokal, proyek berlisensi MIT.",
  },
  "/program-kami/pembukaan": {
    judulKey: "bukuPembukaan.judul",
    deskripsiKey: "bukuPembukaan.deskripsi",
    gambar: "/images/ProgramKami/pembukaan-hero.webp",
    gambarUkuran: "1672",
    gambarTinggi: "941",
  },
  "/program-kami/rush-teka-teki": {
    judulKey: "rushLanding.judul",
    deskripsiKey: "rushLanding.deskripsi",
    gambar: "/images/ProgramKami/rush-teka-teki-hero.webp",
    gambarUkuran: "1672",
    gambarTinggi: "941",
  },
  "/program-kami/kuis-catur": {
    judulKey: "kuisLanding.judul",
    deskripsiKey: "kuisLanding.deskripsi",
    gambar: "/images/ProgramKami/kuis-catur-hero.webp",
    gambarUkuran: "1672",
    gambarTinggi: "941",
  },
  "/program-kami/manusia-vs-mesin": {
    judulKey: "manusiaVsMesinLanding.judul",
    deskripsiKey: "manusiaVsMesinLanding.deskripsi",
    gambar: "/images/ProgramKami/analisa-hero.webp",
    gambarUkuran: "1672",
    gambarTinggi: "941",
  },
  "/program-kami/ebook-panduan": {
    judul: "E-Book & Panduan",
    deskripsi:
      "Pusat literasi resmi komunitas: kumpulan e-book dan panduan catur dalam format PDF yang bisa dibaca langsung di browser atau diunduh.",
  },
  "/teka-teki/problem": {
    /*
     * Satu halaman kanonik untuk pemutar teka-teki. Judul & deskripsi dibaca
     * dari kamus (`tekaTeki.metaJudul` / `tekaTeki.metaDeskripsi`) supaya HTML
     * pra-render dan DOM yang di-render React memakai teks yang PERSIS sama.
     */
    judulKey: "tekaTeki.metaJudul",
    deskripsiKey: "tekaTeki.metaDeskripsi",
  },
  "/teka-teki-rush": {
    judulKey: "tekaTekiRush.judul",
    deskripsiKey: "tekaTekiRush.metaDeskripsi",
    akhir: AKHIR_KORPORAT,
  },
  "/teka-teki-harian": {
    judulKey: "tekaTekiHarian.judul",
    deskripsiKey: "tekaTekiHarian.metaDeskripsi",
    akhir: AKHIR_KORPORAT,
  },
  "/quiz-catur": {
    judulKey: "quiz.judul",
    deskripsiKey: "quiz.tagline",
    akhir: AKHIR_KORPORAT,
  },
  "/papan-interaktif": {
    judulKey: "papan.judul",
    deskripsiKey: "papan.deskripsi",
    akhir: AKHIR_KORPORAT,
  },
  "/papan-interaktif/manusia-vs-mesin": {
    judul: "Manusia vs Mesin",
    deskripsi:
      "Bermain catur melawan mesin: atur level Stockfish atau gaya manusia Maia, pilih warna, lalu asah taktikmu.",
    akhir: AKHIR_KORPORAT,
  },
  "/papan-interaktif/latihan-repertoar": {
    judul: "Latihan Repertoar",
    deskripsi:
      "Hafalkan jalur pembukaan favoritmu dengan kartu pengulangan berjarak sampai mendarah daging.",
    akhir: AKHIR_KORPORAT,
  },
  "/papan-interaktif/hand-brain": {
    judul: "Hand & Brain",
    deskripsi:
      "Varian seru dua pemain di satu perangkat: otak memilih jenis bidak, tangan mengeksekusi langkahnya.",
    akhir: AKHIR_KORPORAT,
  },
  "/papan-interaktif/turing-test": {
    judul: "Turing Test",
    deskripsi:
      "Tebak langkah mana yang dimainkan manusia dan mana yang dipilih mesin dari partai sungguhan.",
    akhir: AKHIR_KORPORAT,
  },
  "/papan-interaktif/pengaturan": {
    judul: "Pengaturan Papan",
    deskripsi:
      "Atur set bidak, warna papan, engine analisa, dan suara untuk seluruh mode papan interaktif.",
    akhir: AKHIR_KORPORAT,
    robots: "noindex, follow",
  },
  "/turnamen": { judulKey: "turnamen.judul", deskripsiKey: "turnamen.deskripsi" },
  "/turnamen/turnamen-bulanan": {
    judulKey: "turnamenBulanan.judul",
    deskripsiKey: "turnamenBulanan.deskripsi",
  },
  "/turnamen/liga-musiman": {
    judulKey: "ligaMusiman.judul",
    deskripsiKey: "ligaMusiman.deskripsi",
  },
  "/turnamen/turnamen-terbuka": {
    judulKey: "turnamenTerbuka.judul",
    deskripsiKey: "turnamenTerbuka.deskripsi",
  },
  "/turnamen/liga-antar-komunitas": {
    judulKey: "ligaAntar.judul",
    deskripsiKey: "ligaAntar.deskripsi",
  },
  "/media-dan-informasi": { judulKey: "media.judul", deskripsiKey: "media.deskripsi" },
  "/media-dan-informasi/berita-komunitas": {
    judulKey: "berita.judul",
    deskripsiKey: "berita.deskripsi",
  },
  "/media-dan-informasi/pengumuman": {
    judulKey: "pengumuman.judul",
    deskripsiKey: "pengumuman.deskripsi",
  },
  "/media-dan-informasi/galeri": {
    judulKey: "galeri.judul",
    deskripsiKey: "galeri.deskripsi",
  },
  "/pendaftaran-anggota": {
    judulKey: "pendaftaran.judul",
    deskripsiKey: "pendaftaran.deskripsi",
  },
  "/keberlanjutan": {
    judulKey: "keberlanjutan.judul",
    deskripsiKey: "keberlanjutan.deskripsi",
  },
  "/keberlanjutan/syarat-dan-ketentuan": {
    judulKey: "syarat.judul",
    deskripsiKey: "syarat.deskripsi",
  },
  "/keberlanjutan/kode-etik-komunitas": {
    judulKey: "kodeEtik.judul",
    deskripsiKey: "kodeEtik.deskripsi",
  },
  "/keberlanjutan/pertanyaan-umum": {
    judulKey: "pertanyaan.judul",
    deskripsiKey: "pertanyaan.deskripsi",
  },
  "/bantuan": {
    judulKey: "bantuan.judul",
    deskripsiKey: "bantuan.deskripsi",
  },
  "/privasi": {
    judulKey: "privasi.judul",
    deskripsiKey: "privasi.deskripsi",
  },
  "/ketentuan": {
    judulKey: "ketentuan.judul",
    deskripsiKey: "ketentuan.deskripsi",
  },
  "/hubungi-kami": {
    judulKey: "hubungi.judul",
    deskripsiKey: "hubungi.deskripsi",
    akhir: AKHIR_KORPORAT,
  },
  "/karir": { judulKey: "karir.judul", deskripsiKey: "karir.deskripsi", akhir: AKHIR_KORPORAT },
  "/beranda": {
    judul: "Beranda",
    deskripsi: "Jadwal turnamen, daftar juara, peringkat, dan sumber belajar komunitas.",
    akhir: AKHIR_KORPORAT,
  },
  "/beranda/turnamen": {
    judul: "Jadwal Turnamen",
    deskripsi:
      "Informasi jadwal turnamen catur komunitas: pendaftaran, format pertandingan, dan tanggal main.",
    akhir: AKHIR_KORPORAT,
  },
  "/beranda/rangkuman-pengumuman": {
    judul: "Rangkuman Pengumuman",
    deskripsiKey: "pengumuman.deskripsi",
    akhir: AKHIR_KORPORAT,
  },
  "/beranda/daftar-juara": {
    judul: "Daftar Juara",
    deskripsi: "Daftar juara turnamen internal dan eksternal Komunitas Catur Indonesia.",
    akhir: AKHIR_KORPORAT,
  },
  "/beranda/peringkat": {
    judul: "Peringkat Pemain",
    deskripsi:
      "Peringkat pemain BLUNDER SKUAD: rating, partisipasi turnamen, dan lencana skakmat anggota.",
    akhir: AKHIR_KORPORAT,
  },
};

/** Judul + deskripsi sebuah rute; kamus yang jadi sumber utama. */
export function metadataUntukRute(rute) {
  const meta = META_RUTE[rute];
  if (!meta) {
    throw new Error(
      `META_RUTE belum punya entri untuk rute ${rute}. Tambah entrijya ` +
        `supaya rute ini tidak dikirim sebagai duplikat beranda.`,
    );
  }
  const judulInti = meta.judul || teksKamus(meta.judulKey);
  const deskripsi = meta.deskripsi || teksKamus(meta.deskripsiKey);
  if (!judulInti || !deskripsi) {
    throw new Error(
      `Metadata rute ${rute} tidak lengkap (judul="${judulInti}", ` +
        `deskripsi="${deskripsi}") — periksa kunci terjemahannya.`,
    );
  }
  return {
    judul: judulInti.includes("|") ? judulInti : `${judulInti}${meta.akhir ?? AKHIR_BLUNDER}`,
    deskripsi,
    robots: meta.robots ?? "index, follow",
    gambar: meta.gambar ?? "",
    gambarUkuran: meta.gambarUkuran ?? "",
    gambarTinggi: meta.gambarTinggi ?? "",
  };
}

function escapeHtml(teks) {
  return String(teks).replace(/[&<>"']/g, (karakter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[karakter]);
}

/**
 * Tulis metadata rute ke salinan `index.html`. Dipakai untuk SEMUA rute publik:
 * tanpa ini, setiap rute mengirim kanonikal beranda dan Google menganggapnya
 * duplikat. Diekspor agar `scripts/uji-seo.mjs` bisa mengujinya tanpa build.
 */
export function metadataRute(html, rute, siteUrl) {
  const meta = metadataUntukRute(rute);

  const dasar = String(siteUrl || "").replace(/\/+$/, "");
  const canonical = rute === "/" ? `${dasar}/` : `${dasar}${rute}`;
  const gambar = meta.gambar ? `${dasar}${meta.gambar}` : "";
  const gantiMeta = (hasil, nama, content) =>
    hasil.replace(
      new RegExp(`<meta ${nama} content="[^"]*" />`),
      `<meta ${nama} content="${escapeHtml(content)}" />`,
    );
  const gantiLink = (hasil, rel, href) =>
    hasil.replace(
      new RegExp(`<link rel="${rel}" href="[^"]*" />`),
      `<link rel="${rel}" href="${escapeHtml(href)}" />`,
    );

  let hasil = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(meta.judul)}</title>`,
  );
  hasil = gantiMeta(hasil, 'name="description"', meta.deskripsi);
  hasil = gantiMeta(hasil, 'name="robots"', meta.robots);
  hasil = gantiLink(hasil, "canonical", canonical);
  hasil = gantiMeta(hasil, 'property="og:type"', "website");
  hasil = gantiMeta(hasil, 'property="og:url"', canonical);
  hasil = gantiMeta(hasil, 'property="og:title"', meta.judul);
  hasil = gantiMeta(hasil, 'property="og:description"', meta.deskripsi);
  if (gambar) {
    hasil = gantiMeta(hasil, 'property="og:image"', gambar);
    hasil = gantiMeta(hasil, 'property="og:image:width"', meta.gambarUkuran);
    hasil = gantiMeta(hasil, 'property="og:image:height"', meta.gambarTinggi);
    hasil = gantiMeta(hasil, 'name="twitter:card"', "summary_large_image");
    hasil = gantiMeta(hasil, 'name="twitter:image"', gambar);
  }
  hasil = gantiMeta(hasil, 'name="twitter:title"', meta.judul);
  return gantiMeta(hasil, 'name="twitter:description"', meta.deskripsi);
}

/**
 * Modul halaman yang PASTI dibutuhkan sebuah rute — dipakai menyisipkan
 * `<link rel="modulepreload">` ke HTML pra-render.
 *
 * Tanpa ini, chunk halaman baru ditemukan SETELAH bundel utama dijalankan dan
 * React.lazy memanggil import()-nya: satu rangkaian round trip tambahan
 * (audit PageSpeed: TekaTeki 254 ms → chess 250 ms → ChessPiece 231 ms →
 * pemuatBidak 241 ms, semuanya setelah chunk index). Dengan modulepreload,
 * unduhannya mulai bersamaan dengan parse HTML.
 *
 * Hanya rute yang chunk halamannya pasti dipakai yang didaftarkan: menambah
 * entri di sini berarti pengunjung rute itu mengunduh lebih awal. Rute ringan
 * (halaman teks) sengaja dibiarkan mengandalkan prefetch saat tautannya
 * terlihat (src/lib/prefetch.js).
 *
 * Satu modul boleh menyeret chunk bersama (mis. PapanInteraktif juga menarik
 * chunk Workspace); daftar preload mengikuti `imports` manifest rekursif.
 */
export const MODUL_RUTE = {
  "/teka-teki/problem": ["src/halaman/TekaTeki/TekaTeki.jsx"],
  "/teka-teki-rush": ["src/halaman/TekaTekiRush/TekaTekiRush.jsx"],
  "/teka-teki-harian": ["src/halaman/TekaTekiHarian/TekaTekiHarian.jsx"],
  "/quiz-catur": ["src/halaman/QuizCatur/QuizCatur.jsx"],
  "/papan-interaktif": ["src/halaman/PapanInteraktif/PapanInteraktif.jsx"],
  "/papan-interaktif/manusia-vs-mesin": ["src/halaman/ManusiaVsMesin/ManusiaVsMesin.jsx"],
  "/papan-interaktif/latihan-repertoar": ["src/halaman/LatihanRepertoar/LatihanRepertoar.jsx"],
  "/papan-interaktif/hand-brain": ["src/halaman/HandBrain/HandBrain.jsx"],
  "/papan-interaktif/turing-test": ["src/halaman/TuringTest/TuringTest.jsx"],
  "/papan-interaktif/pengaturan": ["src/halaman/PapanInteraktif/LayarPengaturan.jsx"],
};

/** Berkas (relatif dist) yang harus diunduh untuk satu entri manifest,
 *  termasuk seluruh `imports`-nya secara rekursif. Entri semu `index.html`
 *  (bundel utama) dilewati: berkas itu sudah dimuat lewat <script type=module>. */
function berkasModul(manifest, kunci, hasil = new Set()) {
  if (kunci === "index.html") return hasil;
  const entri = manifest[kunci];
  if (!entri) return hasil;
  if (entri.file && !entri.file.endsWith(".css")) hasil.add(entri.file);
  for (const impor of entri.imports || []) berkasModul(manifest, impor, hasil);
  return hasil;
}

/** Tag modulepreload untuk satu rute (string kosong bila tidak ada).
 *  `html` dipakai menyaring berkas yang sudah dipreload Vite (vendor-react). */
export function modulePreloadRute(manifest, rute, html) {
  const modul = MODUL_RUTE[rute];
  if (!manifest || !modul) return "";
  const dasar = process.env.VITE_BASE_PUBLIC || "/";
  const berkas = new Set();
  for (const m of modul) for (const f of berkasModul(manifest, m)) berkas.add(f);
  return [...berkas]
    .filter((f) => !html.includes(`href="${dasar}${f}"`))
    .map((f) => `    <link rel="modulepreload" crossorigin href="${dasar}${f}" />`)
    .join("\n");
}

/**
 * Sesuaikan "kerangka" HTML rute berlatar gelap: buang sisa shell beranda
 * (`<link rel=preload>` gambar hero + `<div id=boot-hero>`) dan pasang latar
 * gelap inline pada `<body>`.
 *
 * DUA LANGKAH INI WAJIB BERBARENGAN. Membuang `#boot-hero` saja hanya menukar
 * kedipan foto beranda dengan kedipan putih: `body` memakai `--color-paper`
 * (#f8f8f8, src/index.css) sedangkan halamannya `#262421`, sehingga kanvas
 * terang tampil sampai React menutupinya. Inline `style` pada `<body>` menang
 * atas aturan stylesheet `body{background-color:…}`, dan karena `<html>` tidak
 * punya latar sendiri, latar `body` ter-propagasi ke kanvas — seluruh viewport
 * gelap sejak paint pertama, bahkan sebelum `#root` diisi apa pun.
 *
 * `#boot-hero` yang tersisa di `index.html` (beranda), `404.html`, dan rute
 * ber-kerangka TIDAK disentuh: di sana elemen itu memang dipakai untuk LCP.
 *
 * Untuk rute dalam `PRELOAD_JSON_RUTE`, `<link rel=preload as=fetch>` ikut
 * disisipkan ke `<head>` supaya JSON soal mulai diunduh bersamaan dengan parse
 * HTML (lihat catatan di PRELOAD_JSON_RUTE).
 */
export function kerangkaRute(html, rute) {
  if (!RUTE_LATAR_GELAP.includes(rute)) return html;
  const hasil = html
    .replace(
      /\s*<link rel="preload" as="image" href="\/images\/tonggak-2015\.webp"[^>]*\/>/,
      "",
    )
    .replace(/\s*<div id="boot-hero"[\s\S]*?<\/div>/, "")
    // Anchor ke `</head>`: tag body ASLI selalu sesudahnya. Tanpa anchor,
    // `.replace("<body>", …)` bisa mengenai teks `<body>` di komentar CSS pada
    // <head> — latar gelap menempel ke komentar, tag aslinya tetap tanpa latar,
    // dan kedipan putih kembali. (Pernah terjadi; lihat uji-seo 2b.)
    .replace(
      /(<\/head>[\s\S]*?)<body>/,
      '$1<body style="background-color:#262421">',
    )
    // Kerangka statis (lihat #boot-shell di index.html): rute gelap tidak lagi
    // berupa persegi gelap kosong sebelum React siap. `hidden` dilepas hanya di
    // sini — rute ber-kerangka tetap memakai #boot-hero dan tidak pernah
    // menampilkan kerangka ini.
    .replace(
      '<div id="boot-shell" aria-hidden="true" hidden>',
      '<div id="boot-shell" aria-hidden="true">',
    )
    // Warna chrome peramban (address bar Android/iOS) mengikuti latar halaman.
    .replace(
      "</head>",
      '  <meta name="theme-color" content="#262421" />\n    <meta name="color-scheme" content="dark" />\n  </head>',
    );
  const json = PRELOAD_JSON_RUTE[rute];
  const dasar = process.env.VITE_BASE_PUBLIC || "/";
  // PageSpeed mengidentifikasi avatar komentator sebagai LCP pada halaman
  // teka-teki. Karena komponennya dirender oleh React setelah JavaScript,
  // browser tidak menemukannya dari HTML awal. Batasi preload ke rute ini
  // agar tidak mengunduh gambar yang tidak diperlukan di halaman lain.
  const preloadAvatar =
    rute === "/teka-teki/problem"
      ? `    <link rel="preload" as="image" href="${dasar}engine_expressions/coachdavid.png" fetchpriority="high" />`
      : "";
  if (!json && !preloadAvatar) return hasil;
  const preloads = [
    json ? `    <link rel="preload" as="fetch" href="${dasar}${json}" crossorigin />` : "",
    preloadAvatar,
  ].filter(Boolean);
  return hasil.replace("<head>", `<head>\n${preloads.join("\n")}`);
}

/** Ganti meta robots HTML menjadi noindex (dipakai salinan 404.html). */
function tanpaIndeks(html) {
  return html.replace(
    /<meta name="robots" content="[^"]*" \/>/,
    '<meta name="robots" content="noindex, follow" />',
  );
}

function lepasRegex(teks) {
  return teks.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function awalanAset(html) {
  const cocok = html.match(/src="([^"]*\/)assets\/[^"]+\.js"/);
  return cocok ? cocok[1] : "/";
}

export function performaHalaman({ siteUrl } = {}) {
  return {
    name: "performa-halaman",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        let hasil = html;
        const preloads = [];
        const awalan = awalanAset(hasil);

        for (const [nama, aset] of Object.entries(ctx.bundle)) {
          if (aset.type === "asset" && nama.endsWith(".css")) {
            const pola = new RegExp(
              `<link[^>]+href="[^"]*${lepasRegex(nama)}"[^>]*>`,
              "i",
            );
            if (pola.test(hasil)) {
              const css =
                typeof aset.source === "string"
                  ? aset.source
                  : Buffer.from(aset.source).toString("utf8");
              hasil = hasil.replace(pola, `<style>${css}</style>`);
            }
          }
          if (/\.woff2$/i.test(nama) && /(?:400|700)/.test(nama)) {
            preloads.push(
              `<link rel="preload" href="${awalan}${nama}" as="font" type="font/woff2" crossorigin />`,
            );
          }
        }

        if (preloads.length) {
          hasil = hasil.replace(
            "<head>",
            `<head>\n    ${preloads.join("\n    ")}`,
          );
        }
        return hasil;
      },
    },
    async closeBundle() {
      const dist = path.resolve("dist");
      const indexPath = path.join(dist, "index.html");
      let html;
      try {
        html = await readFile(indexPath, "utf8");
      } catch {
        return;
      }
      // Manifest build (vite.config.js: build.manifest) — dipakai menambahkan
      // modulepreload chunk halaman ke HTML tiap rute.
      let manifest;
      try {
        manifest = JSON.parse(
          await readFile(path.join(dist, ".vite", "manifest.json"), "utf8")
        );
      } catch {
        // Tanpa manifest (mis. manifest dimatikan) preload halaman dilewati;
        // HTML rute tetap ditulis seperti biasa.
        manifest = undefined;
      }

      // Beranda: tulis ulang metadata dari siteUrl agar canonical, og:url, dan
      // og:image mengikuti alamat situs (VITE_SITE_URL / domain kustom), bukan
      // alamat yang di-hardcode di index.html.
      html = metadataRute(html, "/", siteUrl);
      await writeFile(indexPath, html);
      // Salinan 404 dipakai GitHub Pages; di Vercel fallback SPA yang
      // menghasilkan halaman ini. noindex menjaga alamat ngawur tetap tidak
      // masuk indeks.
      await writeFile(path.join(dist, "404.html"), tanpaIndeks(html));

      for (const rute of RUTE_PUBLIK) {
        const bersih = rute.replace(/^\/+|\/+$/g, "");
        if (!bersih) continue;
        const praMuat = modulePreloadRute(manifest, rute, html);
        const htmlDasar = kerangkaRute(metadataRute(html, rute, siteUrl), rute);
        // Sisipkan sebelum </head>: entry + vendor-react sudah dimuat Vite.
        const htmlRute = praMuat
          ? htmlDasar.replace("</head>", `${praMuat}\n  </head>`)
          : htmlDasar;
        const berkas = path.join(dist, `${bersih}.html`);
        await mkdir(path.dirname(berkas), { recursive: true });
        await writeFile(berkas, htmlRute);
        const folder = path.join(dist, bersih, "index.html");
        await mkdir(path.dirname(folder), { recursive: true });
        await writeFile(folder, htmlRute);
      }
    },
  };
}
