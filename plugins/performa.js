/**
 * Optimasi hasil build untuk PageSpeed / Lighthouse:
 *  1. Sisipkan CSS ke dalam HTML — hilangkan permintaan render-blocking.
 *  2. Preload font 400 & 700 (bobot yang dipakai judul + isi).
 *  3. Salin index.html ke setiap rute publik + 404.html supaya deep link
 *     Vercel tetap mengembalikan HTML route-specific saat URL dibuka langsung.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analisaLanding as analisaLandingId } from "../src/lib/terjemahan/id/program.js";
import { analisa as analisaId } from "../src/lib/terjemahan/id/analisa.js";

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
  "/keberlanjutan",
  "/keberlanjutan/syarat-dan-ketentuan",
  "/keberlanjutan/kode-etik-komunitas",
  "/keberlanjutan/pertanyaan-umum",
  "/hubungi-kami",
  "/beranda",
  "/beranda/turnamen",
  "/beranda/rangkuman-pengumuman",
  "/beranda/daftar-juara",
  "/beranda/peringkat",
  "/karir",
  "/program-kami/ebook-panduan",
];

const META_ANALISA = {
  "/program-kami/analisa": {
    judul: `${analisaLandingId.judul} | Blunder Skuad`,
    deskripsi: analisaLandingId.metaDeskripsi,
    robots: "index, follow",
  },
  "/program-kami/analisa/papan": {
    judul: `${analisaId.metaJudul} | Blunder Skuad`,
    deskripsi: analisaId.metaDeskripsi,
    robots: "noindex, follow",
  },
};

function escapeHtml(teks) {
  return String(teks).replace(/[&<>\"']/g, (karakter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
    "'": "&#39;",
  })[karakter]);
}

function metadataAnalisa(html, rute, siteUrl) {
  const meta = META_ANALISA[rute];
  if (!meta) return html;

  const dasar = String(siteUrl || "").replace(/\/+$/, "");
  const canonical = `${dasar}${rute}`;
  const gambar = `${dasar}/images/PapanAnalysa.webp`;
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
  hasil = gantiMeta(hasil, 'property="og:image"', gambar);
  hasil = gantiMeta(hasil, 'property="og:image:width"', "1600");
  hasil = gantiMeta(hasil, 'property="og:image:height"', "1200");
  hasil = gantiMeta(hasil, 'name="twitter:card"', "summary_large_image");
  hasil = gantiMeta(hasil, 'name="twitter:title"', meta.judul);
  hasil = gantiMeta(hasil, 'name="twitter:description"', meta.deskripsi);
  return gantiMeta(hasil, 'name="twitter:image"', gambar);
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

      await writeFile(path.join(dist, "404.html"), html);

      for (const rute of RUTE_PUBLIK) {
        const bersih = rute.replace(/^\/+|\/+$/g, "");
        if (!bersih) continue;
        const htmlRute = metadataAnalisa(html, rute, siteUrl);
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
