import { useState } from "react";
import { PageArtikel } from "../../../components/PageBagian.jsx";
import { useI18n } from "../../../lib/i18n.jsx";

/**
 * Susunan pengurus publik BLUNDER SKUAD di Chess.com.
 * Data diperbarui dari halaman "About Club" pada 17 Agustus 2026.
 */
const KELOMPOK_PENGURUS = [
  {
    id: "super-admins",
    label: "Super Admins",
    anggota: [
      {
        username: "Run_na",
        negara: "Indonesia",
        kodeNegara: "id",
        bergabung: "2026-02-07",
        rating: 1261,
        foto: "https://images.chesscomfiles.com/uploads/v1/user/518428173.b755c283.80x80o.b9ae5a422460.jpg",
      },
      {
        username: "BS_cendikiawan_catur",
        nama: "Akhirul Ramadhani",
        negara: "Indonesia",
        kodeNegara: "id",
        bergabung: "2026-04-06",
        rating: null,
        foto: "https://images.chesscomfiles.com/uploads/v1/user/9451246.8edbf4e2.80x80o.f62a7d5e70a7.png",
      },
      {
        username: "RunaBlunder",
        negara: "Indonesia",
        kodeNegara: "id",
        bergabung: "2026-04-13",
        rating: 1426,
        foto: "https://images.chesscomfiles.com/uploads/v1/user/485821357.9661db62.80x80o.f4acf67fc0a3.png",
      },
      {
        username: "Blunder_Skuad",
        negara: "Indonesia",
        kodeNegara: "id",
        bergabung: "2026-05-18",
        rating: null,
        foto: "https://images.chesscomfiles.com/uploads/v1/user/534029747.e996a793.80x80o.7344f056b523.png",
      },
    ],
  },
  {
    id: "admins",
    label: "Admins",
    anggota: [
      {
        username: "MagnusJacksen",
        nama: "Magnuslokal",
        negara: "Indonesia",
        kodeNegara: "id",
        bergabung: "2026-07-29",
        rating: 186,
        foto: "https://images.chesscomfiles.com/uploads/v1/user/245737891.f524ab1f.80x80o.72a16a4524ed.png",
      },
    ],
  },
  {
    id: "event-coordinators",
    label: "Event Coordinators",
    anggota: [
      {
        username: "Regansa30",
        negara: "Indonesia",
        kodeNegara: "id",
        bergabung: "2026-02-10",
        rating: null,
        foto: "https://images.chesscomfiles.com/uploads/v1/user/514893365.4ea9b6b2.80x80o.bad315a5b517.jpg",
      },
      {
        username: "VeezerWhite",
        nama: "VeezerWhite",
        negara: "Indonesia",
        kodeNegara: "id",
        bergabung: "2026-05-24",
        rating: 785,
        foto: "https://images.chesscomfiles.com/uploads/v1/user/279257733.642a545b.80x80o.a68521645bd6.png",
      },
      {
        username: "SyahiraCallsMeDad",
        nama: "Muhammad Sabri Zhalifunnas",
        negara: "Palestine",
        kodeNegara: "ps",
        bergabung: "2026-07-30",
        rating: 2051,
        foto: "https://images.chesscomfiles.com/uploads/v1/user/389235981.25b925fa.80x80o.0cd071584f0d.png",
      },
    ],
  },
];

const BENDERA = { id: "🇮🇩", ps: "🇵🇸" };

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
          <span aria-hidden="true">{BENDERA[anggota.kodeNegara]}</span>
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
