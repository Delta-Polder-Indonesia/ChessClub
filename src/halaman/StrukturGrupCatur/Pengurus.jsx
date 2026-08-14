import { PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

const JABATAN = [
  "pengurus.l1",
  "pengurus.l2",
  "pengurus.l3",
  "pengurus.l4",
  "pengurus.l5",
  "pengurus.l6",
  "pengurus.l7",
  "pengurus.l8",
];

export default function Pengurus() {
  const { t } = useI18n();
  return (
    <PageArtikel title={t("pengurus.artikel")}>
      <p>{t("pengurus.p1")}</p>
      <ul>
        {JABATAN.map((k) => (
          <li key={k}>{t(k)}</li>
        ))}
      </ul>
    </PageArtikel>
  );
}
