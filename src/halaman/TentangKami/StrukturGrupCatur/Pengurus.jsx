import { useState } from "react";
import { PageArtikel } from "../../../components/PageBagian.jsx";
import { useI18n } from "../../../lib/i18n.jsx";
import { BENDERA_PENGURUS, KELOMPOK_PENGURUS } from "./dataPengurus.js";

function formatTanggal(tanggal, bahasa) {
  return new Intl.DateTimeFormat(bahasa === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${tanggal}T00:00:00Z`));
}

function Avatar({ anggota }) {
  const [gagal, setGagal] = useState(false);

  if (gagal || !anggota.foto) {
    return (
      <span className="foto-pengurus foto-pengurus-kosong" aria-hidden="true">
        {anggota.username.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={anggota.foto}
      alt=""
      width="64"
      height="64"
      loading="lazy"
      referrerPolicy="no-referrer"
      className="foto-pengurus"
      onError={() => setGagal(true)}
    />
  );
}

function BarisPengurus({ anggota, bahasa, t }) {
  const url = `https://www.chess.com/member/${anggota.username.toLowerCase()}`;

  return (
    <li className="baris-pengurus">
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${t("pengurus.bukaProfil")} ${anggota.username}`}
        className="tautan-foto-pengurus"
      >
        <Avatar anggota={anggota} />
      </a>

      <div className="identitas-pengurus">
        <a href={url} target="_blank" rel="noreferrer noopener">
          {anggota.username}
        </a>
        {anggota.nama && anggota.nama !== anggota.username && (
          <span className="nama-lengkap-pengurus">{anggota.nama}</span>
        )}
        <span className="negara-pengurus">
          <span aria-hidden="true">{BENDERA_PENGURUS[anggota.kodeNegara]}</span>
          {anggota.negara}
        </span>
      </div>

      <div className="bergabung-pengurus">
        <span>{t("pengurus.bergabung")}</span>
        <strong>{formatTanggal(anggota.bergabung, bahasa)}</strong>
      </div>

      <div className="nilai-pengurus">
        <span>{t("pengurus.rating")}</span>
        <strong>{anggota.rating ?? t("pengurus.belumDinilai")}</strong>
      </div>
    </li>
  );
}

export default function Pengurus() {
  const { t, bahasa } = useI18n();

  return (
    <PageArtikel title={t("pengurus.artikel")}>
      <p>{t("pengurus.p1")}</p>

      <div className="daftar-pengurus">
        {KELOMPOK_PENGURUS.map((kelompok) => (
          <section key={kelompok.id} className="kelompok-pengurus" aria-labelledby={kelompok.id}>
            <h3 id={kelompok.id}>{kelompok.label}</h3>
            <ul aria-label={kelompok.label}>
              {kelompok.anggota.map((anggota) => (
                <BarisPengurus
                  key={anggota.username}
                  anggota={anggota}
                  bahasa={bahasa}
                  t={t}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="sumber-pengurus">
        {t("pengurus.sumber")} {" "}
        <a
          href="https://www.chess.com/clubs/about/blunder-skuad"
          target="_blank"
          rel="noreferrer noopener"
        >
          BLUNDER SKUAD di Chess.com
        </a>
        <span> · {t("pengurus.diperbarui")}</span>
      </p>
    </PageArtikel>
  );
}
