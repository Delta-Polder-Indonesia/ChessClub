import { useMemo, useState } from "react";
import { useAnggota } from "../../../../lib/anggotaBersama.js";
import { useI18n } from "../../../../lib/i18n.jsx";
import { TINGKATAN_RATING } from "./TingkatanRating.jsx";

function sel(nilai) {
  return nilai === null || nilai === undefined || nilai === "" ? "—" : nilai;
}

function lolosFilter(a, tab) {
  const elo = Number(a.elo);
  const ada = Number.isFinite(elo);
  if (tab === "semua") return true;
  if (tab === "tanpa-rating") return !ada;

  const tingkat = TINGKATAN_RATING.find((item) => item.id === tab);
  if (!tingkat || !ada) return false;
  if (tingkat.max === null) return elo >= tingkat.min;
  // Batas bawah inklusif, batas atas eksklusif agar rating tidak masuk dua kelompok.
  return elo >= tingkat.min && elo < tingkat.max;
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
        ) : data.elo !== null && data.elo !== undefined && data.elo !== "" ? (
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

const OPSI_ELO = (t) => [
  { id: "semua", label: t("keanggotaan.tabSemua") },
  { id: "tanpa-rating", label: t("keanggotaan.tabTanpaRating") },
  ...TINGKATAN_RATING.map((tingkat) => ({
    id: tingkat.id,
    label: `${tingkat.range} · ${t(`keanggotaan.tingkatan.${tingkat.id}.label`)}`,
  })),
];

export default function DaftarAnggota() {
  const { t } = useI18n();
  const [tab, setTab] = useState("semua");

  // Satu pintu: sumber data yang sama dengan halaman Peringkat.
  const { anggota, status, pesan } = useAnggota();

  const tampil = useMemo(
    () => anggota.filter((a) => lolosFilter(a, tab)),
    [anggota, tab]
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-slate-500">
          {t("keanggotaan.jumlah", { jumlah: anggota.length })}
        </p>
        <label className="flex items-center gap-2 text-sm text-grey-800">
          <span className="font-medium">{t("keanggotaan.saringElo")}</span>
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            aria-label={t("keanggotaan.saringElo")}
            className="border-0 border-b border-solid border-grey-300 outline-none py-1 pl-1 pr-8 text-sm bg-transparent focus:border-primary cursor-pointer"
          >
            {OPSI_ELO(t).map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {status === "memuat" && <p>{t("keanggotaan.memuat")}</p>}
      {status === "gagal" && <p>{pesan}</p>}
      {status === "siap" && anggota.length === 0 && (
        <p>
          {t("keanggotaan.kosong1").replace("Silakan ", "")}
          {t("keanggotaan.kosong3")}
        </p>
      )}
      {status === "siap" && anggota.length > 0 && (
        <TabelAnggota baris={tampil} />
      )}
    </>
  );
}
