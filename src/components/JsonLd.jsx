import { Helmet } from "react-helmet-async";
import { useI18n } from "../lib/i18n.jsx";
import { urlAbsolut } from "../lib/urlSitus.js";

const NAMA_BRAND = "Blunder Skuad";

/**
 * BreadcrumbList JSON-LD — membantu Google memahami hierarki navigasi.
 * Dipasang di setiap halaman yang punya breadcrumb.
 *
 * Properti `item` diubah ke URL ABSOLUT karena Google memperlakukannya
 * sebagai `@id` dan menolak URL relatif (mis. "/" atau "/tentang-kami")
 * dengan laporan "URL di kolom 'id' tidak valid". Item terakhir (halaman
 * yang sedang dibuka) boleh tanpa `item` sesuai spesifikasi BreadcrumbList.
 */
export function BreadcrumbJsonLd({ items }) {
  if (!items?.length) return null;
  const { t } = useI18n();

  const itemList = items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.label,
    ...(item.to ? { item: urlAbsolut(item.to) } : {}),
  }));

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: itemList,
        })}
      </script>
    </Helmet>
  );
}

/**
 * Article JSON-LD untuk halaman berita.
 * Brand utama publisher/author: Blunder Skuad.
 */
export function ArticleJsonLd({ title, description, datePublished, image }) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: description || "",
          datePublished: datePublished || undefined,
          image: image || undefined,
          author: { "@type": "Organization", name: NAMA_BRAND },
          publisher: { "@type": "Organization", name: NAMA_BRAND },
        })}
      </script>
    </Helmet>
  );
}
