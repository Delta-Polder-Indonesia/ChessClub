/**
 * Sumber berkas PDF e-book — dipakai bersama oleh:
 *   - `api/ebook-preview.js`      (Vercel Serverless Function)
 *   - `plugins/ebook-preview.js`  (middleware dev & preview Vite)
 *   - `scripts/uji-ebook*.mjs`    (uji allowlist & pemilihan sumber)
 *
 * Kenapa perlu banyak sumber? Dulu PDF di `public/ebooks/` dilacak Git LFS, dan
 * checkout deploy yang tidak menarik LFS hanya menyajikan *pointer* teks
 * 132 byte sehingga pratinjau kosong. Kini PDF disimpan sebagai blob Git biasa
 * (`.gitattributes` kosong — lihat `scripts/keluar-dari-lfs.sh`), jadi berkas
 * statis umumnya sudah sah. Rantai sumber tetap dipertahankan (checkout lama,
 * atau koleksi di object storage): setiap kandidat diuji sampai ada yang
 * benar-benar mengembalikan PDF (magic bytes `%PDF`).
 */
import { DAFTAR_EBOOK } from "../halaman/Beranda/ebook-data.js";
import { EBOOK_BASE } from "./ebook-storage.js";

/**
 * Basis GitHub Media — isi asli berkas yang DULU dilacak Git LFS. Sumber
 * cadangan ini hanya berarti untuk checkout lama; sejak PDF jadi blob Git
 * biasa, path `media/...` tidak pernah berisi objek LFS lagi.
 */
export const GITHUB_MEDIA_BASE =
  "https://media.githubusercontent.com/media/Delta-Polder-Indonesia/ChessClub/main/public/ebooks";

/** Tanda tangan berkas PDF yang sah. */
export const MAGIC_PDF = "%PDF";

/** Ambil nama berkas polos (tanpa folder, tanpa query, sudah ter-decode). */
export function namaBerkasEbook(nilai) {
  const mentah = String(nilai || "").split(/[?#]/)[0];
  let bersih = mentah;
  try {
    bersih = decodeURIComponent(mentah);
  } catch {
    /* biarkan apa adanya bila encoding rusak */
  }
  return bersih.split("/").pop() || "";
}

/**
 * Cari entri e-book yang TERDAFTAR & tersedia berdasarkan nama berkas.
 * Berfungsi sebagai allowlist: proxy tidak boleh melayani berkas sembarang.
 */
export function cariEbookTerdaftar(nama) {
  const kunci = namaBerkasEbook(nama).toLowerCase();
  if (!kunci.endsWith(".pdf")) return null;
  return (
    DAFTAR_EBOOK.find(
      (item) => item.tersedia && namaBerkasEbook(item.file).toLowerCase() === kunci
    ) || null
  );
}

/** URL berkas di object storage (Supabase/R2/S3) bila `EBOOK_BASE` diisi. */
export function urlStorageEbook(nama) {
  if (!EBOOK_BASE) return "";
  return `${EBOOK_BASE.replace(/\/+$/, "")}/${encodeURIComponent(namaBerkasEbook(nama))}`;
}

/** URL cadangan di GitHub Media (isi asli berkas yang pernah dilacak LFS). */
export function urlGithubMediaEbook(nama) {
  return `${GITHUB_MEDIA_BASE}/${encodeURIComponent(namaBerkasEbook(nama))}`;
}

/**
 * Daftar sumber (urut prioritas) yang boleh dicoba oleh sisi server.
 *
 * @param {string} nama  nama berkas PDF
 * @param {{asal?: string}} [opsi] `asal` = origin situs (mis. https://x.vercel.app)
 *        agar berkas statis `/ebooks/…` hasil build ikut dicoba lebih dulu.
 */
export function sumberEbookServer(nama, opsi = {}) {
  const berkas = namaBerkasEbook(nama);
  const daftar = [];
  const storage = urlStorageEbook(berkas);
  if (storage) daftar.push(storage);
  if (opsi.asal) {
    daftar.push(`${String(opsi.asal).replace(/\/+$/, "")}/ebooks/${encodeURIComponent(berkas)}`);
  }
  daftar.push(urlGithubMediaEbook(berkas));
  return daftar;
}
