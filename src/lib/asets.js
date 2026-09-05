/**
 * Peta ukuran gambar publik: [lebar, tinggi, [lebarVarian…]]. Dihasilkan
 * `node scripts/optimumkan-gambar.mjs` — jangan disunting tangan;
 * `npm run uji:gambar` memastikan isinya tidak ketinggalan.
 */
import { UKUR as UKUR_GAMBAR } from "../data/ukur-gambar.js";
import { EBOOK_BASE } from "../data/ebook-storage.js";

/**
 * Alamat aset publik (gambar, favicon, dll).
 *
 * Vite mengganti import.meta.env.BASE_URL sesuai `base` pada vite.config.js
 * (mis. "/ChessClub/" di GitHub Pages). Foto JPG/PNG otomatis diarahkan ke
 * WebP hasil kompresi agar LCP/FCP tidak terbebani berkas 100–300 KiB.
 */
export function gambar(jalur) {
  const bersih = String(jalur || "")
    .replace(/^\//, "")
    .replace(/\.(jpe?g|png)$/i, ".webp");
  return `${import.meta.env.BASE_URL}${bersih}`;
}

/**
 * Alamat berkas publik dari folder `public/` (mis. PDF e-book) dengan base
 * yang benar. Berbeda dari gambar(): tidak mengubah ekstensi JPG/PNG ke WebP.
 */
export function berkasPublik(jalur) {
  const bersih = String(jalur || "").replace(/^\//, "");
  return `${import.meta.env.BASE_URL}${bersih}`;
}

/**
 * Alamat e-book PDF.
 *
 * Prioritas:
 * 1. EBOOK_BASE jika object storage sudah dikonfigurasi.
 * 2. Git LFS media endpoint GitHub sebagai sumber PDF sementara.
 *
 * Penting: mode preview dibungkus Google Docs Viewer agar header
 * Content-Disposition dari GitHub LFS tidak memaksa browser mengunduh PDF.
 * Mode unduh tetap mengarah langsung ke file PDF dan diberi parameter download.
 *
 * @param {string} jalur "/ebooks/Nama%20File.pdf"
 * @param {{unduh?: boolean}} [opsi] `unduh: true` = download langsung.
 */
export function urlEbook(jalur, opsi = {}) {
  const mentah = String(jalur || "").replace(/^\//, "");
  const nama = mentah.split("/").pop() || "";

  let dasar;
  if (EBOOK_BASE) {
    dasar = `${EBOOK_BASE.replace(/\/+$/, "")}/${nama}`;
  } else {
    // File PDF di public/ebooks saat ini masih memakai Git LFS. Endpoint
    // media.githubusercontent.com mengembalikan blob PDF aslinya, bukan pointer LFS.
    const githubMediaBase =
      "https://media.githubusercontent.com/media/Delta-Polder-Indonesia/ChessClub/main/public/ebooks";
    dasar = `${githubMediaBase}/${nama}`;
  }

  if (opsi.unduh) return `${dasar}?download=1`;

  // Google Docs Viewer menangani PDF sebagai viewer inline. Ini memisahkan
  // perilaku "Baca" dari perilaku download milik endpoint file asli.
  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(dasar)}`;
}

/**
 * Atribut <img> untuk hero full-bleed.
 *
 * Dulu hero punya dua berkas per gambar (varian -828w untuk ponsel +
 * 1280w untuk desktop). Kini setiap gambar di public/images hanya disimpan
 * satu berkas (varian terkecil hasil optimasi), jadi cukup <img> biasa —
 * bentuk objeknya tetap sama ({ src }) supaya pemanggil tidak perlu berubah.
 * Menerima jalur relatif ("/images/x.jpg") atau URL lengkap hasil gambar().
 */
export function sumberHero(jalur = "/images/hero-about.jpg") {
  const mentah = String(jalur || "/images/hero-about.jpg");
  const relatif = mentah.includes("/images/")
    ? `/images/${mentah.split("/images/").pop()}`
    : mentah;
  return {
    src: gambar(relatif),
  };
}

/** Basename React Router — tanpa garis miring di akhir. */
export function basisRouter() {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  return base || undefined;
}

/** Kunci manifest dari jalur apa pun: tanpa base, tanpa query, ekstensi .webp. */
function kunciManifest(jalur) {
  const mentah = String(jalur || "").split(/[?#]/)[0];
  const basis = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const tanpaBasis =
    basis && mentah.startsWith(`${basis}/`)
      ? mentah.slice(basis.length)
      : mentah;
  const bersih = tanpaBasis.startsWith("/") ? tanpaBasis : `/${tanpaBasis}`;
  return bersih.replace(/\.(jpe?g|png)$/i, ".webp");
}

/**
 * Atribut <img> responsif untuk gambar di public/images.
 *
 * Kandidat `srcSet` diambil dari manifest ukuran (src/data/ukur-gambar.js),
 * jadi hanya varian yang sungguh ada di public/ yang dijanjikan ke browser —
 * tidak ada tautan gambar yang mati. Gambar yang tidak terdaftar tetap
 * mendapat <img> biasa, sehingga pemanggil tidak perlu menangani dua bentuk.
 *
 * @param {string} jalur  "/images/x.jpg" | "/images/x.webp" (base otomatis)
 * @param {{sizes?: string}} [opsi] `sizes` = lebar tampilan per kondisi;
 *        default "100vw" supaya browser tidak pernah memilih terlalu kecil.
 * @returns {{src: string, srcSet?: string, sizes?: string, width?: number, height?: number}}
 */
export function sumberGambar(jalur, opsi = {}) {
  const kunci = kunciManifest(jalur);
  const catatan = UKUR_GAMBAR[kunci];
  const penuh = gambar(jalur);
  if (!catatan) return { src: penuh };

  const [lebar, tinggi, varian = []] = catatan;
  const kandidat = varian
    .filter((l) => l < lebar)
    .map((l) => `${gambar(kunci.replace(/\.webp$/i, `-${l}.webp`))} ${l}w`);
  kandidat.push(`${penuh} ${lebar}w`);

  return {
    src: penuh,
    srcSet: kandidat.join(", "),
    sizes: opsi.sizes ?? "100vw",
    width: lebar,
    height: tinggi,
  };
}

/**
 * Hangatkan satu gambar (hasil sumberGambar) di latar belakang.
 */
export function pramuatGambar(sumber) {
  if (typeof window === "undefined" || !sumber?.src) return null;
  const img = new window.Image();
  img.decoding = "async";
  if (sumber.srcSet) {
    img.srcset = sumber.srcSet;
    img.sizes = sumber.sizes;
  } else {
    img.src = sumber.src;
  }
  return img;
}
