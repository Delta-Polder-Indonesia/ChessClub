/**
 * Optimasi hasil build untuk PageSpeed / Lighthouse:
 *  1. Sisipkan CSS ke dalam HTML — hilangkan permintaan render-blocking.
 *  2. Preload font 400 & 700 (bobot yang dipakai judul + isi).
 *  3. Salin index.html ke setiap rute publik + 404.html supaya GitHub Pages
 *     mengembalikan HTTP 200 (bukan 404) saat URL dalam dibuka langsung.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Rute publik — harus selaras dengan RUTE_HALAMAN di src/App.jsx. */
export const RUTE_PUBLIK = [
  "/tentang-kami",
  "/tentang-kami/struktur-grup-catur",
  "/program-kami",
  "/program-kami/teka-teki",
  "/program-kami/pembukaan",
  "/program-kami/sekolah-catur/cara-bermain-catur",
  "/teka-teki",
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
  "/beranda/daftar-juara",
  "/beranda/peringkat",
  "/beranda/ebook-panduan",
  "/karir",
];

function lepasRegex(teks) {
  return teks.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function awalanAset(html) {
  const cocok = html.match(/src="([^"]*\/)assets\/[^"]+\.js"/);
  return cocok ? cocok[1] : "/";
}

export function performaHalaman() {
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
        const berkas = path.join(dist, `${bersih}.html`);
        await mkdir(path.dirname(berkas), { recursive: true });
        await writeFile(berkas, html);
        const folder = path.join(dist, bersih, "index.html");
        await mkdir(path.dirname(folder), { recursive: true });
        await writeFile(folder, html);
      }
    },
  };
}
