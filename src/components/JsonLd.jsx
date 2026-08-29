import { Helmet } from "react-helmet-async";
import { useI18n } from "../lib/i18n.jsx";

/**
 * BreadcrumbList JSON-LD — membantu Google memahami hierarki navigasi.
 * Dipasang di setiap halaman yang punya breadcrumb.
 */
export function BreadcrumbJsonLd({ items }) {
  if (!items?.length) return null;
  const { t } = useI18n();
  const namaKomunitas = t("common.namaKomunitas") || "Komunitas Catur Indonesia";

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
 */
export function ArticleJsonLd({ title, description, datePublished, image }) {
  const { t } = useI18n();
  const namaKomunitas = t("common.namaKomunitas") || "Komunitas Catur Indonesia";

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
          author: { "@type": "Organization", name: namaKomunitas },
          publisher: { "@type": "Organization", name: namaKomunitas },
        })}
      </script>
    </Helmet>
  );
}
