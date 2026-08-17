import { useState } from "react";
import { PageArtikel } from "../../../components/PageBagian.jsx";
import { useI18n } from "../../../lib/i18n.jsx";

/**
 * Susunan pengurus publik BLUNDER SKUAD di Chess.com.
 *
 * Data diperbarui dari halaman "About Club" pada 17 Agustus 2026. Nilai
 * rating mengikuti angka yang ditampilkan Chess.com saat pembaruan, bukan
 * rating turnamen internal komunitas.
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
  const inisial = anggota.username.slice(0, 1).toUpperCase();

  if (gagal || !anggota.foto) {
    return (
      <span className="avatar-pengurus avatar-pengurus-kosong" aria-hidden="true">
        {inisial}
      </span>
    );
  }

  return (
    <img
      src={anggota.foto}
      alt=""
      width="80"
      height="80"
      loading="lazy"
      referrerPolicy="no-referrer"
      className="avatar-pengurus"
      onError={() => setGagal(true)}
    />
  );
}

function KartuPengurus({ anggota, bahasa, t }) {
  const url = `https://www.chess.com/member/${anggota.username.toLowerCase()}`;

  return (
    <article className="kartu-pengurus">
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="tautan-avatar-pengurus"
        aria-label={`${t("pengurus.bukaProfil")} ${anggota.username}`}
      >
        <Avatar anggota={anggota} />
      </a>

      <div className="min-w-0 flex-1">
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="nama-pengurus"
        >
          {anggota.username}
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M7.5 4.5h-3v11h11v-3M10 4.5h5.5V10M15 5l-7 7" />
          </svg>
        </a>
        {anggota.nama && anggota.nama !== anggota.username && (
          <p className="nama-asli-pengurus">{anggota.nama}</p>
        )}
        <p className="negara-pengurus">
          <span aria-hidden="true">{BENDERA[anggota.kodeNegara]}</span>
          {anggota.negara}
        </p>
        <p className="tanggal-pengurus">
          {t("pengurus.bergabung")} {formatTanggal(anggota.bergabung, bahasa)}
        </p>
      </div>

      <div className="rating-pengurus" aria-label={`${t("pengurus.rating")}: ${anggota.rating ?? t("pengurus.belumDinilai")}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8.5 4.5h7l1 3.5-2 3v4.5h2v3h-9v-3h2V11l-2-3 1-3.5Z" />
        </svg>
        <strong>{anggota.rating ?? t("pengurus.belumDinilai")}</strong>
        {anggota.rating !== null && <span>{t("pengurus.rating")}</span>}
      </div>
    </article>
  );
}

export default function Pengurus() {
  const { t, bahasa } = useI18n();

  return (
    <PageArtikel title={t("pengurus.artikel")}>
      <p>{t("pengurus.p1")}</p>

      <div className="daftar-pengurus" aria-label={t("pengurus.artikel")}>
        {KELOMPOK_PENGURUS.map((kelompok) => (
          <section key={kelompok.id} aria-labelledby={kelompok.id} className="kelompok-pengurus">
            <div className="kepala-kelompok-pengurus">
              <h3 id={kelompok.id}>{kelompok.label}</h3>
              <span>{kelompok.anggota.length}</span>
            </div>
            <div className="grid-pengurus">
              {kelompok.anggota.map((anggota) => (
                <KartuPengurus
                  key={anggota.username}
                  anggota={anggota}
                  bahasa={bahasa}
                  t={t}
                />
              ))}
            </div>
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
