/**
 * Halaman: PERINGKAT.
 *
 * Konten mengikuti referensi https://ligacatur.com/ratings :
 * judul "Peringkat pemain Liga Catur Indonesia", paragraf pengantar berisi
 * tautan Pairing Rating / pendaftaran / Grup WA, lalu tabel peringkat dengan
 * kolom PERSIS seperti aslinya:
 *
 *   #  |  Rating  |  Nama  |  Klub  |  Lichess  |  Chess.com
 *
 * Tambahan yang tetap menjaga bentuk tabel: kotak pencarian, penyaring klub,
 * tombol "hanya yang punya Chess.com" (setara parameter ?chesscom=true pada
 * situs referensi), dan penampil bertahap (muat lebih banyak).
 */
import { useMemo, useState } from "react";
import TataLetakBeranda from "./TataLetakBeranda.jsx";
import { PEMAIN, DAFTAR_KLUB } from "../../data/peringkatPemain.js";

const PER_HALAMAN = 100;

/** Lencana centang biru — padanan bluecheck.gif pada situs referensi. */
function CentangBiru() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="inline-block w-4 h-4 ml-1 align-[-2px]"
      aria-label="terverifikasi"
      role="img"
    >
      <path
        fill="#1d9bf0"
        d="M12 1.5l2.6 1.9 3.2-.2.9 3.1 2.7 1.8-1.3 2.9 1.3 2.9-2.7 1.8-.9 3.1-3.2-.2L12 22.5l-2.6-1.9-3.2.2-.9-3.1-2.7-1.8L3.9 13 2.6 10.1l2.7-1.8.9-3.1 3.2.2L12 1.5z"
      />
      <path
        fill="#fff"
        d="M10.8 15.6l-3-3 1.3-1.3 1.7 1.7 4.1-4.1 1.3 1.3-5.4 5.4z"
      />
    </svg>
  );
}

function TautanKlub({ klub }) {
  if (!klub) return null;
  const url = `https://ligacatur.com/teamprofile?Team=${encodeURIComponent(
    klub.kode
  )}&Name=${encodeURIComponent(klub.nama)}`;
  return (
    <a href={url} target="_blank" rel="noreferrer noopener" title={klub.nama}>
      {klub.kode}
    </a>
  );
}

function BarisPemain({ p, no }) {
  return (
    <tr>
      <td>{no}</td>
      <td className="font-semibold text-slate-900">{p.rating}</td>
      <td className="whitespace-nowrap">
        {p.nama}
        {p.terverifikasi && <CentangBiru />}
      </td>
      <td>
        <TautanKlub klub={p.klub} />
      </td>
      <td>
        {p.lichess ? (
          <a
            href={`https://lichess.org/@/${p.lichess}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {p.lichess}
          </a>
        ) : null}
      </td>
      <td>
        {p.chesscom ? (
          <a
            href={`https://chess.com/member/${p.chesscom}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {p.chesscom}
          </a>
        ) : null}
      </td>
    </tr>
  );
}

export default function Peringkat() {
  const [cari, setCari] = useState("");
  const [klub, setKlub] = useState("semua");
  const [hanyaChesscom, setHanyaChesscom] = useState(false);
  const [tampil, setTampil] = useState(PER_HALAMAN);

  // Nomor urut (#) mengikuti peringkat GLOBAL, bukan urutan hasil saringan —
  // sama seperti halaman referensi.
  const berperingkat = useMemo(
    () => PEMAIN.map((p, i) => ({ ...p, no: i + 1 })),
    []
  );

  const hasil = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    return berperingkat.filter((p) => {
      if (klub !== "semua" && p.klub?.kode !== klub) return false;
      if (hanyaChesscom && !p.chesscom) return false;
      if (!kunci) return true;
      return (
        p.nama.toLowerCase().includes(kunci) ||
        (p.lichess || "").toLowerCase().includes(kunci) ||
        (p.chesscom || "").toLowerCase().includes(kunci) ||
        (p.klub?.kode || "").toLowerCase().includes(kunci) ||
        (p.klub?.nama || "").toLowerCase().includes(kunci)
      );
    });
  }, [berperingkat, cari, klub, hanyaChesscom]);

  const terlihat = hasil.slice(0, tampil);

  const ubah = (setter) => (nilai) => {
    setter(nilai);
    setTampil(PER_HALAMAN);
  };

  return (
    <TataLetakBeranda
      id="peringkat"
      title="Peringkat"
      description="Peringkat pemain berdasarkan Pairing Rating: nama, klub, akun Lichess, dan Chess.com."
      sectionTitle="Peringkat pemain Liga Catur Indonesia"
    >
      <p className="ql-align-justify">
        Pemain-pemain Liga Catur Indonesia yang terdaftar dan terverifikasi.
        Rating yang ada di sini adalah{" "}
        <a
          href="https://ligacatur.com/pairingrating"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary"
        >
          Pairing Rating
        </a>
        . Klik{" "}
        <a
          href="https://ligacatur.com/register"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary"
        >
          di sini untuk mendaftar
        </a>{" "}
        menjadi anggota Liga Catur Indonesia, dan untuk verifikasinya, silahkan
        gabung ke{" "}
        <a
          href="https://ligacatur.com/group"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary"
        >
          Grup WA
        </a>{" "}
        dan kirim pesan ke Admin.
      </p>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-4">
        <label className="flex flex-col gap-1 text-sm text-grey-800">
          <span className="font-medium">Cari pemain</span>
          <input
            type="search"
            value={cari}
            onChange={(e) => ubah(setCari)(e.target.value)}
            placeholder="Nama, klub, atau username"
            className="border-0 border-b border-solid border-grey-300 outline-none py-1 pr-2 text-sm bg-transparent focus:border-primary min-w-[220px]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-grey-800">
          <span className="font-medium">Klub</span>
          <select
            value={klub}
            onChange={(e) => ubah(setKlub)(e.target.value)}
            className="border-0 border-b border-solid border-grey-300 outline-none py-1 pl-1 pr-8 text-sm bg-transparent focus:border-primary cursor-pointer"
          >
            <option value="semua">Semua klub</option>
            {DAFTAR_KLUB.map((kode) => (
              <option key={kode} value={kode}>
                {kode}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-grey-800 pb-1">
          <input
            type="checkbox"
            checked={hanyaChesscom}
            onChange={(e) => ubah(setHanyaChesscom)(e.target.checked)}
          />
          <span>Hanya yang punya Chess.com</span>
        </label>

        <p className="text-sm text-slate-500 pb-1 ml-auto">
          Menampilkan {terlihat.length} dari {hasil.length} pemain
        </p>
      </div>

      {hasil.length === 0 ? (
        <p>Tidak ada pemain yang cocok dengan pencarian ini.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="tabel-kci tabel-peringkat">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Rating</th>
                  <th>Nama</th>
                  <th>Klub</th>
                  <th>Lichess</th>
                  <th>Chess.com</th>
                </tr>
              </thead>
              <tbody>
                {terlihat.map((p) => (
                  <BarisPemain
                    key={`${p.no}-${p.nama}`}
                    p={p}
                    no={p.no}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {tampil < hasil.length && (
            <button
              type="button"
              onClick={() => setTampil((n) => n + PER_HALAMAN)}
              className="mt-2 inline-flex items-center rounded border border-grey-300 px-4 py-2 text-sm font-medium text-grey-800 hover:border-primary hover:text-primary transition-colors"
            >
              Muat {Math.min(PER_HALAMAN, hasil.length - tampil)} pemain lagi
            </button>
          )}
        </>
      )}
    </TataLetakBeranda>
  );
}
