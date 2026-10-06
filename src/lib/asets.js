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
 * (mis. "/" di Vercel). Foto JPG/PNG otomatis diarahkan ke
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
 * Alamat e-book PDF (pratinjau atau unduhan).
 *
 * SELALU same-origin (`/api/ebook-preview`). Endpoint itulah yang memilih
 * sumber sebenarnya — object storage bila `EBOOK_BASE` diisi, berkas statis
 * `/ebooks/…` hasil build, atau GitHub Media (cadangan) — lalu
 * mengembalikannya dengan `Content-Disposition: inline` supaya browser
 * MENAMPILKAN PDF, bukan mengunduhnya.
 *
 * @param {string} jalur "/ebooks/Nama%20File.pdf"
 * @param {{unduh?: boolean, tiket?: string}} [opsi] `unduh: true` = paksa
 * unduhan (attachment); `tiket` adalah tiket hasil penebusan kode.
 */
export function urlEbook(jalur, opsi = {}) {
  const nama = namaEbook(jalur);
  const dasar = `${import.meta.env.BASE_URL}api/ebook-preview?file=${encodeURIComponent(nama)}`;
  const params = [];
  if (opsi.unduh) params.push("unduh=1");
  if (opsi.tiket) params.push(`tiket=${encodeURIComponent(opsi.tiket)}`);
  return params.length ? `${dasar}&${params.join("&")}` : dasar;
}

/** Nama berkas polos dari entri e-book ("/ebooks/A%20B.pdf" → "A B.pdf"). */
function namaEbook(jalur) {
  const mentah = String(jalur || "").split(/[?#]/)[0];
  let bersih = mentah;
  try {
    bersih = decodeURIComponent(mentah);
  } catch {
    /* biarkan apa adanya */
  }
  return bersih.split("/").pop() || "";
}

/**
 * Daftar URL PDF yang boleh dicoba pembaca di browser, urut prioritas.
 *
 * Situs production berjalan di Vercel (punya /api). Pembaca mencoba proxy
 * Vercel, berkas statis, dan object storage sampai menemukan PDF asli, jadi
 * tombol "Baca" tidak bergantung pada satu sumber saja.
 */
export function sumberEbook(jalur) {
  const nama = namaEbook(jalur);
  const daftar = [urlEbook(jalur), berkasPublik(`/ebooks/${encodeURIComponent(nama)}`)];
  if (EBOOK_BASE) {
    daftar.push(`${EBOOK_BASE.replace(/\/+$/, "")}/${encodeURIComponent(nama)}`);
  }
  daftar.push(
    "https://media.githubusercontent.com/media/Delta-Polder-Indonesia/ChessClub/main/public/ebooks/" +
      encodeURIComponent(nama)
  );
  return [...new Set(daftar)];
}

/**
 * Atribut <img> untuk hero full-bleed.
 *
 * Hero menerima kandidat responsif dari manifest bila tersedia (misalnya
 * 828w untuk ponsel dan sumber penuh untuk desktop). Gambar lama yang belum
 * punya varian tetap aman: sumberGambar() mengembalikan satu URL saja.
 * Menerima jalur relatif ("/images/x.jpg") atau URL lengkap hasil gambar().
 */
export function sumberHero(jalur = "/images/hero-about.jpg") {
  const mentah = String(jalur || "/images/hero-about.jpg");
  const relatif = mentah.includes("/images/")
    ? `/images/${mentah.split("/images/").pop()}`
    : mentah;
  return sumberGambar(relatif, { sizes: "100vw" });
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

  // width/height selalu ikut: itulah yang membuat browser memesan ruang lebih
  // dulu sehingga gambar lazy tidak menggeser tata letak (CLS) saat diunduh.
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
