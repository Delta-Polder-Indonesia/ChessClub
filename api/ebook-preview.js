/**
 * Proxy preview PDF e-book.
 *
 * GitHub LFS dapat mengirim Content-Disposition: attachment. Browser lalu
 * mengunduh PDF walaupun URL dipasang sebagai iframe. Endpoint ini mengambil
 * blob PDF dari GitHub Media lalu mengembalikannya sebagai `inline` dari
 * origin situs sendiri, sehingga tombol Baca benar-benar membuka viewer.
 */
import { DAFTAR_EBOOK } from "../src/halaman/Beranda/ebook-data.js";

const GITHUB_MEDIA_BASE =
  "https://media.githubusercontent.com/media/Delta-Polder-Indonesia/ChessClub/main/public/ebooks";

function namaFileDariPath(jalur) {
  try {
    return decodeURIComponent(String(jalur || "")).split("/").pop() || "";
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  const nama = namaFileDariPath(req.query?.file);

  // Hanya izinkan file yang memang terdaftar sebagai e-book.
  const buku = DAFTAR_EBOOK.find((item) => {
    const terdaftar = namaFileDariPath(item.file);
    return terdaftar === nama && item.tersedia;
  });

  if (!buku || !nama.toLowerCase().endsWith(".pdf")) {
    res.status(404).json({ error: "E-book tidak ditemukan." });
    return;
  }

  const sumber = `${GITHUB_MEDIA_BASE}/${encodeURIComponent(nama)}`;

  try {
    const upstream = await fetch(sumber, {
      headers: { Accept: "application/pdf" },
      redirect: "follow",
    });

    if (!upstream.ok) {
      res.status(502).json({ error: "Sumber PDF tidak dapat diakses." });
      return;
    }

    const tipe = upstream.headers.get("content-type") || "application/pdf";
    if (!tipe.toLowerCase().includes("pdf")) {
      res.status(502).json({ error: "Sumber bukan PDF yang valid." });
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    const namaAman = nama.replace(/[\r\n\\\"]/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${namaAman}"`);
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).send(buffer);
  } catch (error) {
    console.error("[ebook-preview] gagal mengambil PDF:", error?.message || error);
    res.status(502).json({ error: "Gagal memuat dokumen PDF." });
  }
}
