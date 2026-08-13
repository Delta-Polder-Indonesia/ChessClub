import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import StickyMenu from "../../components/StickyMenu.jsx";
import { ambilDaftarAnggota } from "../../lib/chessAnggota.js";
import { useI18n } from "../../lib/i18n.jsx";

function sel(nilai) {
  return nilai === null || nilai === undefined || nilai === "" ? "—" : nilai;
}

function lolosFilter(a, tab) {
  const elo = Number(a.elo);
  const ada = Number.isFinite(elo);
  if (tab === "semua") return true;
  if (tab === "pemula") return !ada || elo < 1000;
  if (tab === "1000") return ada && elo >= 1000 && elo < 2000;
  if (tab === "2000") return ada && elo >= 2000 && elo < 3000;
  if (tab === "master") return ada && elo >= 3000;
  return true;
}

function BarisAnggota({ a, no }) {
  const { t } = useI18n();
  const opsi = Object.keys(a.ratings || {});
  const awal = opsi.includes(a.kontrol) ? a.kontrol : opsi[0] || "";
  const [kontrol, setKontrol] = useState(awal);
  const data = (kontrol && a.ratings?.[kontrol]) || {
    elo: a.elo,
    win: a.win,
    draw: a.draw,
    loss: a.loss,
  };

  return (
    <tr>
      <td>{no}</td>
      <td>
        {a.foto ? (
          <img
            src={a.foto}
            alt={a.nama || a.username}
            width="40"
            height="40"
            className="foto-anggota"
          />
        ) : (
          <span className="foto-anggota foto-anggota-kosong">
            {(a.nama || a.username || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </td>
      <td>{a.nama || a.username}</td>
      <td>
        {a.url ? (
          <a href={a.url} target="_blank" rel="noreferrer noopener">
            {a.username}
          </a>
        ) : (
          a.username
        )}
      </td>
      <td>
        {a.hilang ? (
          t("keanggotaan.akunHilang")
        ) : a.gagal ? (
          t("keanggotaan.gagal")
        ) : data.elo ? (
          <span className="elo-pilih">
            {data.elo}{" "}
            {opsi.length > 0 ? (
              <select
                aria-label={t("keanggotaan.ratingType", { username: a.username })}
                value={kontrol}
                onChange={(e) => setKontrol(e.target.value)}
              >
                {opsi.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            ) : (
              `(${a.kontrol})`
            )}
          </span>
        ) : (
          t("keanggotaan.belumRating")
        )}
      </td>
      <td>{a.hilang || a.gagal ? "—" : sel(data.win)}</td>
      <td>{a.hilang || a.gagal ? "—" : sel(data.draw)}</td>
      <td>{a.hilang || a.gagal ? "—" : sel(data.loss)}</td>
    </tr>
  );
}

function TabelAnggota({ baris }) {
  const { t } = useI18n();
  if (!baris.length) {
    return <p>{t("keanggotaan.tidakAda")}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="tabel-kci">
        <thead>
          <tr>
            <th>{t("keanggotaan.no")}</th>
            <th>{t("keanggotaan.foto")}</th>
            <th>{t("keanggotaan.nama")}</th>
            <th>Chess.com</th>
            <th>Elo</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
          </tr>
        </thead>
        <tbody>
          {baris.map((a, i) => (
            <BarisAnggota key={a.username} a={a} no={i + 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Keanggotaan() {
  const { t } = useI18n();
  const [anggota, setAnggota] = useState([]);
  const [status, setStatus] = useState("memuat");
  const [pesan, setPesan] = useState("");
  const [tab, setTab] = useState("semua");

  const MENU_ELO = [
    { id: "semua", label: t("keanggotaan.tabSemua") },
    { id: "pemula", label: t("keanggotaan.tabPemula") },
    { id: "1000", label: "1000" },
    { id: "2000", label: "2000" },
    { id: "master", label: t("keanggotaan.tabMaster") },
  ];

  useEffect(() => {
    let hidup = true;
    ambilDaftarAnggota()
      .then((data) => {
        if (!hidup) return;
        setAnggota(Array.isArray(data) ? data : []);
        setStatus("siap");
      })
      .catch((err) => {
        if (!hidup) return;
        setPesan(err.message);
        setStatus("gagal");
      });
    return () => {
      hidup = false;
    };
  }, []);

  const tampil = useMemo(
    () => anggota.filter((a) => lolosFilter(a, tab)),
    [anggota, tab]
  );

  return (
    <HalamanIsi
      title={t("keanggotaan.judul")}
      description={t("keanggotaan.deskripsi")}
      submenu={
        <StickyMenu
          sections={MENU_ELO}
          activeId={tab}
          onSelect={setTab}
        />
      }
      next={{
        to: "/keanggotaan/pendaftaran-anggota",
        judul: t("keanggotaan.nextJudul"),
      }}
    >
      <PageArtikel title={t("keanggotaan.artikel")}>
        <p className="ql-align-justify">{t("keanggotaan.intro")}</p>

        {status === "memuat" && <p>{t("keanggotaan.memuat")}</p>}
        {status === "gagal" && <p>{pesan}</p>}
        {status === "siap" && anggota.length === 0 && (
          <p>
            {t("keanggotaan.kosong1")}
            <Link to="/keanggotaan/pendaftaran-anggota">
              {t("keanggotaan.kosong2")}
            </Link>
            {t("keanggotaan.kosong3")}
          </p>
        )}
        {status === "siap" && anggota.length > 0 && (
          <TabelAnggota baris={tampil} />
        )}
      </PageArtikel>
    </HalamanIsi>
  );
}
