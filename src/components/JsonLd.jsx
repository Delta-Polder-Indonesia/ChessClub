import { Helmet } from "react-helmet-async";
import { useI18n } from "../lib/i18n.jsx";

const NAMA_BRAND = "Blunder Skuad";

/**
 * BreadcrumbList JSON-LD — membantu Google memahami hierarki navigasi.
 * Dipasang di setiap halaman yang punya breadcrumb.
 */
export function BreadcrumbJsonLd({ items }) {
  if (!items?.length) return null;
  const { t } = useI18n();

  const itemList = items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.label,
    ...(item.to ? { item: item.to } : {}),
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
