/**
 * Middleware pratinjau e-book untuk Vite (mode `dev` dan `preview`).
 *
 * Di produksi (Vercel) jalur `/api/ebook-preview` dilayani oleh
 * `api/ebook-preview.js`. Saat pengembangan lokal, seluruh `/api/*` diteruskan
 * ke backend Node (port 8787) yang TIDAK punya rute ini — akibatnya tombol
 * "Baca" mengembalikan 404 dan pratinjau kosong.
 *
 * Plugin ini menyisipkan penangan yang sama SEBELUM proxy `/api`, sehingga
 * perilaku lokal = perilaku produksi:
 *   - berkas lokal `public/ebooks/*.pdf` dipakai bila isinya PDF asli,
 *   - selain itu jatuh ke object storage / GitHub Media (isi Git LFS),
 *   - respons selalu `Content-Disposition: inline` (atau attachment bila
 *     `?unduh=1`) dan mendukung `Range`.
 */
import { createReadStream } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import {
  MAGIC_PDF,
  cariEbookTerdaftar,
  namaBerkasEbook,
  urlGithubMediaEbook,
  urlStorageEbook,
} from "../src/data/ebook-sumber.js";

const JALUR_API = "/api/ebook-preview";

/**
 * PDF pengganti satu halaman (khusus dev/preview).
 *
 * Klon tanpa `git lfs pull` hanya punya *pointer* 132 byte, dan mesin
 * pengembangan tidak selalu boleh menghubungi GitHub. Daripada memunculkan
 * modal kosong, kembalikan PDF kecil yang menjelaskan keadaannya — pembaca
 * tetap bisa diuji, dan penyebabnya terbaca jelas.
 */
function pdfPengganti(judul) {
  const baris = [
    "Pratinjau contoh (mode pengembangan)",
    "",
    judul.slice(0, 60),
    "",
    "Isi PDF asli belum tersedia di mesin ini.",
    "Jalankan: git lfs install && git lfs pull",
    "atau isi EBOOK_BASE di src/data/ebook-storage.js.",
  ];
  const teks = baris
    .map((t, i) => {
      const aman = t.replace(/([\\()])/g, "\\$1");
      const ukuran = i === 0 ? 20 : i === 2 ? 16 : 12;
      return `BT /F1 ${ukuran} Tf 60 ${740 - i * 34} Td (${aman}) Tj ET`;
    })
    .join("\n");

  const objek = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [4 0 R] /Count 1 >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>",
    `<< /Length ${Buffer.byteLength(teks)} >>\nstream\n${teks}\nendstream`,
  ];

  let keluaran = "%PDF-1.4\n";
  const posisi = [];
  objek.forEach((isi, i) => {
    posisi.push(Buffer.byteLength(keluaran));
    keluaran += `${i + 1} 0 obj\n${isi}\nendobj\n`;
  });
  const awalXref = Buffer.byteLength(keluaran);
  keluaran += `xref\n0 ${objek.length + 1}\n0000000000 65535 f \n`;
  for (const p of posisi) keluaran += `${String(p).padStart(10, "0")} 00000 n \n`;
  keluaran += `trailer\n<< /Size ${objek.length + 1} /Root 1 0 R >>\nstartxref\n${awalXref}\n%%EOF\n`;
  return Buffer.from(keluaran, "latin1");
}

function kirimJson(res, status, isi) {
  const badan = JSON.stringify(isi);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(badan));
  res.end(badan);
}

/** Berkas lokal ada DAN benar-benar PDF (bukan pointer Git LFS)? */
async function berkasLokalSah(berkas) {
  try {
    const pegangan = await fsp.open(berkas, "r");
    try {
      const { buffer, bytesRead } = await pegangan.read(Buffer.alloc(4), 0, 4, 0);
      if (bytesRead < 4 || buffer.toString("latin1") !== MAGIC_PDF) return null;
      const info = await pegangan.stat();
      return info.size;
    } finally {
      await pegangan.close();
    }
  } catch {
    return null;
  }
}

/** Uraikan header Range sederhana: "bytes=awal-akhir". */
function uraikanRange(nilai, ukuran) {
  const cocok = /^bytes=(\d*)-(\d*)$/.exec(String(nilai || "").trim());
  if (!cocok) return null;
  const [, mulaiTeks, akhirTeks] = cocok;
  if (!mulaiTeks && !akhirTeks) return null;
  let mulai = mulaiTeks ? Number(mulaiTeks) : ukuran - Number(akhirTeks);
  let akhir = mulaiTeks ? (akhirTeks ? Number(akhirTeks) : ukuran - 1) : ukuran - 1;
  mulai = Math.max(0, mulai);
  akhir = Math.min(ukuran - 1, akhir);
  if (!Number.isFinite(mulai) || !Number.isFinite(akhir) || mulai > akhir) return null;
  return { mulai, akhir };
}

export function pratinjauEbook({ akar = process.cwd() } = {}) {
  const dirEbook = path.resolve(akar, "public/ebooks");

  const penangan = async (req, res, next) => {
    const url = new URL(req.url || "/", "http://lokal");
    if (url.pathname !== JALUR_API) return next();

    if (!["GET", "HEAD"].includes(req.method || "GET")) {
      res.setHeader("Allow", "GET, HEAD");
      kirimJson(res, 405, { error: "Metode tidak didukung." });
      return;
    }

    const nama = namaBerkasEbook(url.searchParams.get("file"));
    if (!cariEbookTerdaftar(nama)) {
      kirimJson(res, 404, { error: "E-book tidak ditemukan." });
      return;
    }

    const unduh = ["1", "true", "ya"].includes(
      String(url.searchParams.get("unduh") || "").toLowerCase()
    );
    const namaAman = nama.replace(/[\r\n\\"]/g, "_");
    const kepalaDasar = () => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `${unduh ? "attachment" : "inline"}; filename="${namaAman}"`
      );
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-cache");
    };

    // 1) Berkas lokal (paling cepat, tidak memakai kuota LFS).
    const berkas = path.join(dirEbook, nama);
    const ukuran = berkas.startsWith(dirEbook) ? await berkasLokalSah(berkas) : null;
    if (ukuran) {
      const rentang = uraikanRange(req.headers.range, ukuran);
      kepalaDasar();
      if (rentang) {
        res.statusCode = 206;
        res.setHeader("Content-Range", `bytes ${rentang.mulai}-${rentang.akhir}/${ukuran}`);
        res.setHeader("Content-Length", rentang.akhir - rentang.mulai + 1);
      } else {
        res.statusCode = 200;
        res.setHeader("Content-Length", ukuran);
      }
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      createReadStream(berkas, rentang ? { start: rentang.mulai, end: rentang.akhir } : {}).pipe(res);
      return;
    }

    // 2) Object storage → 3) isi Git LFS di GitHub Media.
    const kandidat = [urlStorageEbook(nama), urlGithubMediaEbook(nama)].filter(Boolean);
    for (const sumber of kandidat) {
      try {
        const kepala = { Accept: "application/pdf,*/*" };
        if (req.headers.range) kepala.Range = req.headers.range;
        // eslint-disable-next-line no-await-in-loop -- sengaja berurutan.
        const hulu = await fetch(sumber, { headers: kepala, redirect: "follow" });
        if (!hulu.ok || !hulu.body) continue;

        kepalaDasar();
        res.statusCode = hulu.status === 206 ? 206 : 200;
        const panjang = hulu.headers.get("content-length");
        if (panjang) res.setHeader("Content-Length", panjang);
        const rentang = hulu.headers.get("content-range");
        if (rentang) res.setHeader("Content-Range", rentang);
        if (req.method === "HEAD") {
          res.end();
          return;
        }
        Readable.fromWeb(hulu.body).pipe(res);
        return;
      } catch {
        /* coba sumber berikutnya */
      }
    }

    // 4) Tidak ada sumber yang bisa dijangkau (klon tanpa LFS + tanpa internet).
    //    Kirim PDF pengganti supaya pembaca tetap dapat dicoba secara lokal.
    console.warn(
      `[ebook] "${nama}" belum tersedia — menyajikan PDF pengganti. ` +
        "Jalankan `git lfs install && git lfs pull` untuk isi aslinya."
    );
    const pengganti = pdfPengganti(nama.replace(/\.pdf$/i, ""));
    kepalaDasar();
    res.statusCode = 200;
    res.setHeader("Content-Length", pengganti.length);
    res.setHeader("X-Ebook-Pengganti", "1");
    if (req.method === "HEAD") res.end();
    else res.end(pengganti);
  };

  const bungkus = (req, res, next) => {
    penangan(req, res, next).catch((e) => {
      kirimJson(res, 500, { error: String(e?.message || e) });
    });
  };

  return {
    name: "kci-pratinjau-ebook",
    configureServer(server) {
      server.middlewares.use(bungkus);
    },
    configurePreviewServer(server) {
      server.middlewares.use(bungkus);
    },
  };
}

export default pratinjauEbook;
