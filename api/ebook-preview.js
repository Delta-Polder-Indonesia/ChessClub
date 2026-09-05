/**
 * Proxy pratinjau (dan unduhan) PDF e-book.
 *
 * Masalah yang diselesaikan:
 *   1. PDF di `public/ebooks/` dilacak Git LFS. Bila checkout deploy tidak
 *      menarik LFS, berkas statis yang tersaji hanya *pointer* teks 132 byte
 *      sehingga pratinjau kosong.
 *   2. GitHub Media mengirim `Content-Disposition: attachment`, sehingga
 *      browser MENGUNDUH berkas alih-alih menampilkannya.
 *
 * Endpoint ini memilih sumber PDF yang benar-benar berisi PDF (dicek lewat
 * magic bytes `%PDF`), lalu menyajikannya dari origin situs sendiri sebagai
 * `inline` (atau `attachment` bila `?unduh=1`). Permintaan `Range` diteruskan
 * apa adanya supaya pembaca PDF dapat memuat per bagian.
 *
 * Contoh:
 *   /api/ebook-preview?file=Problem%20Catur%20288.pdf
 *   /api/ebook-preview?file=Problem%20Catur%20288.pdf&unduh=1
 */
import { Readable } from "node:stream";
import {
  MAGIC_PDF,
  cariEbookTerdaftar,
  namaBerkasEbook,
  sumberEbookServer,
} from "../src/data/ebook-sumber.js";

/** Berkas terbesar ±35 MB; beri ruang waktu bagi instance dingin. */
export const config = { maxDuration: 60 };

/** Ingatan sumber yang terbukti valid selama instance masih hangat. */
const sumberTerpilih = new Map();

/** Origin situs ini (dipakai untuk mencoba berkas statis /ebooks/…). */
function asalSitus(req) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (!host) return "";
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  return `${proto}://${host}`;
}

/** Benarkah URL ini mengembalikan PDF? Hanya 4 byte pertama yang dibaca. */
async function berisiPdf(url) {
  const pembatal = new AbortController();
  try {
    const jawaban = await fetch(url, {
      headers: { Range: "bytes=0-3", Accept: "application/pdf,*/*" },
      redirect: "follow",
      signal: pembatal.signal,
    });
    if (!jawaban.ok || !jawaban.body) return false;
    const pembaca = jawaban.body.getReader();
    const { value } = await pembaca.read();
    return Buffer.from(value || []).subarray(0, 4).toString("latin1") === MAGIC_PDF;
  } catch {
    return false;
  } finally {
    // Putuskan koneksi bila server mengabaikan header Range (kirim berkas penuh).
    try {
      pembatal.abort();
    } catch {
      /* abaikan */
    }
  }
}

/** Pilih sumber pertama yang benar-benar berisi PDF. */
async function pilihSumber(nama, asal) {
  const tersimpan = sumberTerpilih.get(nama);
  if (tersimpan) return tersimpan;

  for (const kandidat of sumberEbookServer(nama, { asal })) {
    // eslint-disable-next-line no-await-in-loop -- sengaja berurutan: sumber tercepat dulu.
    if (await berisiPdf(kandidat)) {
      sumberTerpilih.set(nama, kandidat);
      return kandidat;
    }
  }
  return "";
}

export default async function handler(req, res) {
  const nama = namaBerkasEbook(req.query?.file);
  const buku = cariEbookTerdaftar(nama);

  if (!buku) {
    res.status(404).json({ error: "E-book tidak ditemukan." });
    return;
  }

  if (req.method && !["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ error: "Metode tidak didukung." });
    return;
  }

  const unduh = ["1", "true", "ya"].includes(String(req.query?.unduh || "").toLowerCase());
  const namaAman = nama.replace(/[\r\n\\"]/g, "_");

  try {
    const sumber = await pilihSumber(nama, asalSitus(req));
    if (!sumber) {
      res.status(502).json({
        error:
          "Berkas PDF tidak tersedia di sumber mana pun. Pastikan Git LFS ikut " +
          "diunduh saat build, atau atur EBOOK_BASE ke object storage.",
      });
      return;
    }

    const kepala = { Accept: "application/pdf,*/*" };
    if (req.headers.range) kepala.Range = req.headers.range;

    const hulu = await fetch(sumber, { headers: kepala, redirect: "follow" });
    if (!hulu.ok) {
      sumberTerpilih.delete(nama);
      res.status(502).json({ error: "Sumber PDF tidak dapat diakses." });
      return;
    }

    res.statusCode = hulu.status === 206 ? 206 : 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${unduh ? "attachment" : "inline"}; filename="${namaAman}"`
    );
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const panjang = hulu.headers.get("content-length");
    if (panjang) res.setHeader("Content-Length", panjang);
    const rentang = hulu.headers.get("content-range");
    if (rentang) res.setHeader("Content-Range", rentang);

    if (req.method === "HEAD" || !hulu.body) {
      res.end();
      return;
    }

    await new Promise((selesai, gagal) => {
      const aliran = Readable.fromWeb(hulu.body);
      aliran.on("error", gagal);
      res.on("close", () => aliran.destroy());
      aliran.pipe(res).on("finish", selesai).on("error", gagal);
    });
  } catch (error) {
    sumberTerpilih.delete(nama);
    console.error("[ebook-preview] gagal memuat PDF:", error?.message || error);
    if (!res.headersSent) {
      res.status(502).json({ error: "Gagal memuat dokumen PDF." });
    } else {
      res.end();
    }
  }
}
