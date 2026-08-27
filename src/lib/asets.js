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
