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
export const RUTE_PUBLIK = [
  "/tentang-kami",
  "/tentang-kami/struktur-grup-catur",
  "/program-kami",
  "/program-kami/teka-teki",
  "/program-kami/analisa",
  "/program-kami/analisa/papan",
  "/program-kami/atribusi",
  "/program-kami/pembukaan",
  "/teka-teki",
  "/teka-teki-rush",
  "/quiz-catur",
  "/papan-interaktif",
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
  "/lengkapi-verifikasi",
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
  },
  "/program-kami/analisa": {
    judulKey: "analisaLanding.judul",
    deskripsiKey: "analisaLanding.metaDeskripsi",
    gambar: "/images/PapanAnalysa.webp",
    gambarUkuran: "1600",
    gambarTinggi: "1200",
  },
  "/program-kami/analisa/papan": {
    judulKey: "analisa.metaJudul",
    // analisa.metaDeskripsi 167 karakter — dipotong di cuplikan Google.
    deskripsi:
      "Analisis PGN dan FEN gratis dengan Stockfish lokal: label per langkah, grafik evaluasi, dan akurasi pemain. Data tetap di perangkat Anda.",
    robots: "noindex, follow",
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
  },
  "/program-kami/ebook-panduan": {
    judul: "E-Book & Panduan",
    deskripsi:
      "Pusat literasi resmi komunitas: kumpulan e-book dan panduan catur dalam format PDF yang bisa dibaca langsung di browser atau diunduh.",
  },
  "/teka-teki": {
    judulKey: "tekaTeki.judul",
    // tekaTeki.deskripsi 170 karakter — dipotong di cuplikan Google.
    deskripsi:
      "Latih naluri taktik dengan 5.486 soal skakmat dari partai nyata di basis data puzzle Lichess: skakmat dalam 1, 2, atau 3 langkah.",
    akhir: AKHIR_KORPORAT,
  },
  "/teka-teki-rush": {
    judulKey: "tekaTekiRush.judul",
    deskripsiKey: "tekaTekiRush.metaDeskripsi",
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
  "/lengkapi-verifikasi": {
    judulKey: "lengkapiVerifikasi.judul",
    deskripsiKey: "lengkapiVerifikasi.deskripsi",
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
  return String(teks).replace(/[&<>\"']/g, (karakter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
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
        const htmlRute = metadataRute(html, rute, siteUrl);
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
