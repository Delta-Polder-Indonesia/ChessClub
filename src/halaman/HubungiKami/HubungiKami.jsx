import { useState } from "react";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function HubungiKami() {
  const { t } = useI18n();
  const [kirim, setKirim] = useState(false);

  return (
    <HalamanIsi
      title={t("hubungi.judul")}
      description={t("hubungi.deskripsi")}
    >
      <PageArtikel title={t("hubungi.sekretariat")}>
        <p>{t("hubungi.alamat")}</p>
        <p>
          <strong>{t("common.surel")}:</strong>{" "}
          <a href="mailto:info@komunitascatur.or.id">
            info@komunitascatur.or.id
          </a>
        </p>
        <p className="ql-align-justify">{t("hubungi.jam")}</p>
      </PageArtikel>

      <PageArtikel title={t("hubungi.kirimPesan")}>
        {kirim ? (
          <p>{t("hubungi.terkirim")}</p>
        ) : (
          <form
            className="flex flex-col gap-6 max-w-xl"
            onSubmit={(e) => {
              e.preventDefault();
              setKirim(true);
            }}
          >
            <label className="flex flex-col gap-2 text-sm text-grey-800">
              {t("hubungi.nama")}
              <input
                required
                name="nama"
                className="border-0 border-b border-solid border-grey-200 outline-none py-2 text-base bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-grey-800">
              {t("hubungi.surel")}
              <input
                required
                type="email"
                name="email"
                className="border-0 border-b border-solid border-grey-200 outline-none py-2 text-base bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-grey-800">
              {t("hubungi.pesan")}
              <textarea
                required
                name="pesan"
                rows={5}
                className="border-0 border-b border-solid border-grey-200 outline-none py-2 text-base bg-transparent resize-none"
              />
            </label>
            <button
              type="submit"
              className="self-start text-xs rounded-full px-4 py-2 border border-solid border-primary text-primary"
            >
              {t("hubungi.kirim")}
            </button>
          </form>
        )}
      </PageArtikel>
    </HalamanIsi>
  );
}
