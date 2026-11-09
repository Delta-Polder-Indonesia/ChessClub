import { useLayoutEffect } from "react";
import { urlKanonik } from "../lib/urlSitus.js";

/** Penanda elemen kanonik milik komponen ini. */
const PENANDA = "data-kanonik-kci";

/**
 * Satu-satunya penulis `<link rel="canonical">` di situs ini.
 *
 * Alasan komponen ini ada, dan alasan tag ini TIDAK lagi ditulis Helmet:
 *
 *  1. Helmet MENAMBAH tag baru tanpa menyentuh `<link rel="canonical">`
 *     yang sudah ada di `index.html`. Hasilnya dua kanonikal sekaligus —
 *     satu dari HTML statis (rute dinamis seperti
 *     `/program-kami/ebook-panduan/<id>` mendapat salinan beranda, jadi
 *     kanonikalnya "/"), satu dari Helmet — dan Google melaporkannya
 *     sebagai "Duplikat, tanpa ada versi kanonis pilihan pengguna".
 *     Komponen ini memakai ulang SATU elemen dan membuang kanonikal lain
 *     yang bukan miliknya, termasuk peninggalan injeksi build.
 *  2. Bila dua `<Helmet>` menulis kanonikal, instance yang mount
 *     BELAKANGAN yang menang (react-helmet-async membalik daftar instance
 *     sebelum deduplikasi). Kerangka halaman mount setelah isinya, jadi
 *     kanonikal bawaan di `PageLayout` akan menimpa kanonikal eksplisit
 *     halaman seperti `/teka-teki/problem` milik `/teka-teki/problem/2500`.
 *     Penulis imperatif + peletakan `<Kanonik />` SEBELUM `<Outlet />`
 *     membuat halaman yang justru menang.
 *
 * Dipasang di dua tempat: `PageLayout` (bawaan untuk semua halaman publik)
 * dan `MetaHalaman` (kanonikal halaman, boleh memakai path eksplisit).
 */
export default function Kanonik({ path }) {
  const href = urlKanonik(path);

  // useLayoutEffect, bukan useEffect: kanonikal harus sudah benar sebelum
  // peramban mengecat halaman, jadi tidak ada frame dengan kanonikal
  // beranda pada rute dinamis.
  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const head = document.head;
    let el = head.querySelector(`link[rel="canonical"][${PENANDA}]`);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      el.setAttribute(PENANDA, "1");
      head.appendChild(el);
    }
    // Boleh ada tepat satu kanonikal. Yang bukan milik komponen ini —
    // statis index.html atau sisa Helmet — dibuang.
    for (const lain of head.querySelectorAll('link[rel="canonical"]')) {
      if (lain !== el) lain.remove();
    }
    if (el.getAttribute("href") !== href) el.setAttribute("href", href);
  }, [href]);

  return null;
}
