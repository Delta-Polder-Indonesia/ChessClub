/**
 * Proxy pratinjau (dan unduhan) PDF e-book.
 *
 * Model perpustakaan: MEMBACA bebas (pratinjau tanpa tiket) supaya pengunjung
 * bisa menilai isi buku dulu; MENGUNDUH wajib tiket hasil tebus kode pengurus.
 * Endpoint ini yang memilih sumber privat di server — lalu mengembalikannya
 * dengan `Content-Disposition: inline` supaya browser MENAMPILKAN PDF (mode
 * baca), atau `attachment` saat `?unduh=1` (wajib tiket).
 *
 * Contoh:
 *   /api/ebook-preview?file=Problem%20Catur%20288.pdf            (baca)
 *   /api/ebook-preview?file=Problem%20Catur%20288.pdf&unduh=1&tiket=<tiket>
 *
 * Sumber PDF dicek lewat magic bytes `%PDF`, lalu disajikan dari origin situs
 * sendiri. Permintaan `Range` diteruskan apa adanya supaya pembaca PDF dapat
 * memuat per bagian.
 */
import { Readable } from "node:stream";
import {
  MAGIC_PDF,
  cariEbookTerdaftar,
  namaBerkasEbook,
  sumberEbookServer,
} from "../src/data/ebook-sumber.js";
import { konfigurasi } from "../server/src/konfigurasi.js";
import { sumberEbookPrivat } from "../server/src/ebook-storage.js";
import { periksaTiketUnduh } from "../server/src/tiket-ebook.js";

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
async function berisiPdf(kandidat) {
  const pembatal = new AbortController();
  try {
    const jawaban = await fetch(kandidat.url, {
      headers: {
        ...kandidat.headers,
        Range: "bytes=0-3",
        Accept: "application/pdf,*/*",
      },
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

  /*
   * Urutan sumber: storage privat (bila produksi sudah dikonfigurasi) lebih
   * dulu, lalu berkas statis hasil build dan sumber cadangan. Sejak membaca
   * dibuka untuk umum, produksi HARUS tetap dapat melayani berkas statis —
   * tanpa itu, situs yang belum mengunggah koleksi ke storage privat akan
   * menjawab 503 dan pembaca kosong.
   */
  const kandidat = [
    ...(konfigurasi.produksi ? sumberEbookPrivat(nama) : []),
    ...sumberEbookServer(nama, { asal }).map((url) => ({ url, headers: {} })),
  ];
  for (const item of kandidat) {
     
    if (await berisiPdf(item)) {
      sumberTerpilih.set(nama, item);
      return item;
    }
  }
  return null;
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

  // Membaca bebas; mengunduh wajib tiket. Tanpa aturan ini, siapa pun dapat
  // melewati modal redemption dengan memanggil proxy langsung pakai `unduh=1`
  // lalu menyimpan seluruh koleksi.
  const tiketSah = periksaTiketUnduh(req.query?.tiket, nama);
  if (unduh && !tiketSah) {
    res.status(403).json({ error: "Tiket akses unduhan tidak sah atau sudah kedaluwarsa." });
    return;
  }

  try {
    const sumber = await pilihSumber(nama, asalSitus(req));
    if (!sumber) {
      // Semua kandidat gagal: berkas statis hasil build, storage privat, dan
      // cadangan. Penyebab tersering di produksi: PDF belum ikut ter-deploy
      // (atau isinya masih pointer Git LFS) DAN storage privat belum diisi.
      res.status(konfigurasi.produksi ? 503 : 502).json({
        error: konfigurasi.produksi
          ? "Berkas PDF tidak ditemukan di deployment maupun storage privat."
          : "Berkas PDF tidak tersedia di sumber lokal atau cadangan.",
      });
      return;
    }

    const kepala = {
      ...sumber.headers,
      Accept: "application/pdf,*/*",
    };
    if (req.headers.range) kepala.Range = req.headers.range;

    const hulu = await fetch(sumber.url, { headers: kepala, redirect: "follow" });
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
    // Mode baca: boleh di-cache browser (privat) supaya halaman berikutnya tidak
    // mengunduh ulang berkas besar. Mode unduh memakai tiket, jadi tidak boleh
    // disimpan: CDN tidak pernah melayani salinan PDF setelah tiket kedaluwarsa.
    res.setHeader("Cache-Control", unduh ? "private, no-store" : "private, max-age=300");
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
