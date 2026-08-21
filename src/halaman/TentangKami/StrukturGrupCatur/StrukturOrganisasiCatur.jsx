import { PageArtikel } from "../../../components/PageBagian.jsx";
import { useAnggota } from "../../../lib/anggotaBersama.js";
import { useI18n } from "../../../lib/i18n.jsx";
import { KELOMPOK_PENGURUS } from "./dataPengurus.js";

const peran = (id) => KELOMPOK_PENGURUS.find((kelompok) => kelompok.id === id);

function NamaPengurus({ anggota }) {
  return (
    <li>
      <a
        href={`https://www.chess.com/member/${anggota.username.toLowerCase()}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        {anggota.username}
      </a>
    </li>
  );
}

function KotakPeran({ kelompok, utama = false, t }) {
  return (
    <section className={`kotak-peran-organisasi${utama ? " kotak-peran-utama" : ""}`}>
      <h3>{t(`pengurus.peran.${kelompok.id}`)}</h3>
      <ul>
        {kelompok.anggota.map((anggota) => (
          <NamaPengurus key={anggota.username} anggota={anggota} />
        ))}
      </ul>
    </section>
  );
}

export default function StrukturOrganisasiCatur() {
  const { t } = useI18n();
  const { anggota, status } = useAnggota();
  const jumlahAnggota = status === "siap" && anggota.length > 0 ? anggota.length : 219;

  const superAdmins = peran("super-admins");
  const admins = peran("admins");
  const koordinator = peran("event-coordinators");

  return (
    <PageArtikel title={t("strukturOrganisasiCatur.artikel")}>
      <p>{t("strukturOrganisasiCatur.p1")}</p>

      <figure className="organisasi-klub" aria-labelledby="judul-bagan-organisasi">
        <figcaption id="judul-bagan-organisasi" className="sr-only">
          {t("strukturOrganisasiCatur.caption")}
        </figcaption>

        <div className="kepala-organisasi-klub">
          <span>{t("strukturOrganisasiCatur.klub")}</span>
          <strong>BLUNDER SKUAD</strong>
        </div>

        <div className="garis-organisasi" aria-hidden="true" />
        <KotakPeran kelompok={superAdmins} utama t={t} />

        <div className="penghubung-cabang-organisasi" aria-hidden="true">
          <span />
        </div>

        <div className="cabang-organisasi">
          <KotakPeran kelompok={admins} t={t} />
          <KotakPeran kelompok={koordinator} t={t} />
        </div>

        <div className="penghubung-gabung-organisasi" aria-hidden="true">
          <span />
        </div>
        <div className="anggota-organisasi">
          <span>{t("strukturOrganisasiCatur.anggota")}</span>
          <strong>
            {jumlahAnggota} {t("strukturOrganisasiCatur.orang")}
          </strong>
          <small>{t("strukturOrganisasiCatur.roster")}</small>
        </div>
      </figure>

      <p className="catatan-organisasi">{t("strukturOrganisasiCatur.caption")}</p>
    </PageArtikel>
  );
}
