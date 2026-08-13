import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import StickyMenu from "../../components/StickyMenu.jsx";
import { ambilDaftarAnggota } from "../../lib/chessAnggota.js";

const MENU_ELO = [
  { id: "semua", label: "Semua" },
  { id: "pemula", label: "Pemula" },
  { id: "1000", label: "1000" },
  { id: "2000", label: "2000" },
  { id: "master", label: "Master" },
];

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
          "akun tidak ditemukan"
        ) : a.gagal ? (
          "gagal memuat"
        ) : data.elo ? (
          <span className="elo-pilih">
            {data.elo}{" "}
            {opsi.length > 0 ? (
              <select
                aria-label={`Jenis rating ${a.username}`}
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
          "belum ada rating"
        )}
      </td>
      <td>{a.hilang || a.gagal ? "—" : sel(data.win)}</td>
      <td>{a.hilang || a.gagal ? "—" : sel(data.draw)}</td>
      <td>{a.hilang || a.gagal ? "—" : sel(data.loss)}</td>
    </tr>
  );
}

function TabelAnggota({ baris }) {
  if (!baris.length) {
    return <p>Tidak ada anggota pada kelompok ini.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="tabel-kci">
        <thead>
          <tr>
            <th>No.</th>
            <th>Foto</th>
            <th>Nama</th>
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
  const [anggota, setAnggota] = useState([]);
  const [status, setStatus] = useState("memuat");
  const [pesan, setPesan] = useState("");
  const [tab, setTab] = useState("semua");

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
      title="Keanggotaan"
      description="Daftar anggota yang terdaftar melalui akun Chess.com, dikelompokkan menurut Elo agar mudah dicari."
      submenu={
        <StickyMenu
          sections={MENU_ELO}
          activeId={tab}
          onSelect={setTab}
        />
      }
      next={{
        to: "/keanggotaan/pendaftaran-anggota",
        judul: "Pendaftaran Anggota",
      }}
    >
      <PageArtikel title="Daftar Anggota">
        <p className="ql-align-justify">
          Anggota baru mendaftar dengan username Chess.com pada halaman{" "}
          <Link to="/keanggotaan/pendaftaran-anggota">
            Pendaftaran Anggota
          </Link>
          . Setelah akun terverifikasi, nama masuk ke daftar ini secara
          otomatis. Elo dan W/D/L diambil dari Chess.com (diutamakan Rapid).
          Pilih tab di atas untuk menyaring: Semua, Pemula (di bawah 1000),
          1000, 2000, atau Master (3000 ke atas).
        </p>

        {status === "memuat" && <p>Memuat data dari Chess.com…</p>}
        {status === "gagal" && <p>{pesan}</p>}
        {status === "siap" && anggota.length === 0 && (
          <p>
            Belum ada anggota terdaftar. Silakan{" "}
            <Link to="/keanggotaan/pendaftaran-anggota">
              daftar dengan akun Chess.com
            </Link>
            .
          </p>
        )}
        {status === "siap" && anggota.length > 0 && (
          <TabelAnggota baris={tampil} />
        )}
      </PageArtikel>
    </HalamanIsi>
  );
}
