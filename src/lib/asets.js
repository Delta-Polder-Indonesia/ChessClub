/**
 * Peta ukuran gambar publik: [lebar, tinggi, [lebarVarian…]]. Dihasilkan
 * `node scripts/optimumkan-gambar.mjs` — jangan disunting tangan;
 * `npm run uji:gambar` memastikan isinya tidak ketinggalan.
 */
import { UKUR as UKUR_GAMBAR } from "../data/ukur-gambar.js";

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
 * srcset hero: 828w untuk layar PSI mobile, 1280w untuk desktop.
 * Menerima jalur relatif ("/images/x.jpg") atau URL lengkap hasil gambar().
 */
export function sumberHero(jalur = "/images/hero-about.jpg") {
  const mentah = String(jalur || "/images/hero-about.jpg");
  const relatif = mentah.includes("/images/")
    ? `/images/${mentah.split("/images/").pop()}`
    : mentah;
  const penuh = gambar(relatif);
  const kecil = penuh.replace(/\.webp$/i, "-828.webp");
  return {
    src: kecil,
    srcSet: `${kecil} 828w, ${penuh} 1280w`,
    sizes: "100vw",
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
    .filter((l) => l < lebar) // varian yang lebih lebar dari aslinya tak pernah dipakai
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
 *
 * srcSet + sizes ikut dipasang supaya yang diunduh kandidat yang AKAN dipakai
 * browser — bukan berkas penuh 80 KiB yang belum tentu ditampilkan. Ini yang
 * dipakai karusel Landing untuk menyiapkan sampul sebelah tanpa menggeruk
 * kuota pengunjung ponsel.
 */
export function pramuatGambar(sumber) {
  if (typeof window === "undefined" || !sumber?.src) return null;
  const img = new window.Image();
  img.decoding = "async";
  if (sumber.srcSet) {
    // Hanya srcSet + sizes: browser memilih kandidat yang sama seperti saat
    // gambar ini benar-benar tampil (varian kecil), tanpa ikut menarik berkas
    // aslinya yang bisa 4× lebih besar.
    img.srcset = sumber.srcSet;
    img.sizes = sumber.sizes;
  } else {
    img.src = sumber.src;
  }
  return img;
}
