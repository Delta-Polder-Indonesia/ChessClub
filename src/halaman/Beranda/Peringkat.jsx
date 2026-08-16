/**
 * Halaman: PERINGKAT.
 *
 * SATU PINTU DATA — halaman ini TIDAK punya data sendiri. Sumbernya sama
 * persis dengan tab Keanggotaan (TentangKami/StrukturGrupCatur/Keanggotaan):
 * `useAnggota()` dari src/lib/anggotaBersama.js → GET /api/anggota.
 *
 * Artinya: begitu seorang anggota mendaftar dan akun Chess.com-nya
 * terverifikasi, namanya langsung muncul di kedua halaman tanpa perlu
 * menyunting berkas apa pun.
 *
 * Susunan tabel dibuat SAMA PERSIS dengan referensi
 * https://ligacatur.com/ratings — enam kolom, urutan identik:
 *
 *   #  |  Rating  |  Nama  |  Klub  |  Lichess  |  Chess.com
 *
 * Nama ditulis KAPITAL dengan lencana centang biru menempel di
 * belakangnya, kolom Klub berisi kode klub singkat, dan dua kolom
 * terakhir berisi username yang tertaut ke profil masing-masing.
 * Sel yang kosong dibiarkan benar-benar kosong, seperti aslinya.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TataLetakBeranda from "./TataLetakBeranda.jsx";
import {
  useAnggota,
  susunPeringkat,
  eloAnggota,
  namaTampil,
} from "../../lib/anggotaBersama.js";
import { TINGKATAN_RATING } from "../TentangKami/StrukturGrupCatur/Keanggotaan/TingkatanRating.jsx";

const PER_HALAMAN = 100;

/** Lencana centang biru untuk anggota terverifikasi. */
function CentangBiru() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="inline-block w-4 h-4 ml-1 align-[-2px]"
      role="img"
      aria-label="terverifikasi"
    >
      <title>Akun terverifikasi</title>
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

function BarisPeringkat({ a }) {
  const elo = eloAnggota(a);

  return (
    <tr>
      <td className="kol-no">{a.no ?? ""}</td>
      <td className="kol-rating">{elo === null ? "" : elo}</td>
      <td className="kol-nama">
        {namaTampil(a).toUpperCase()}
        {a.terverifikasi && <CentangBiru />}
      </td>
      <td className="kol-klub">{a.klub || ""}</td>
      <td className="kol-akun">
        {a.lichess ? (
          <a
            href={`https://lichess.org/@/${a.lichess}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {a.lichess}
          </a>
        ) : (
          ""
        )}
      </td>
      <td className="kol-akun">
        {a.username ? (
          <a
            href={a.url || `https://chess.com/member/${a.username}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {a.username}
          </a>
        ) : (
          ""
        )}
      </td>
    </tr>
  );
}

export default function Peringkat() {
  // Sumber data identik dengan tab Keanggotaan.
  const { anggota, status, pesan, muatUlang } = useAnggota();

  const [cari, setCari] = useState("");
  const [tingkat, setTingkat] = useState("semua");
  const [tampil, setTampil] = useState(PER_HALAMAN);

  const berperingkat = useMemo(() => susunPeringkat(anggota), [anggota]);

  const daftarKlub = useMemo(
    () => [...new Set(anggota.map((a) => a.klub).filter(Boolean))].sort(),
    [anggota]
  );
  const [klub, setKlub] = useState("semua");

  const hasil = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    return berperingkat.filter((a) => {
      if (klub !== "semua" && a.klub !== klub) return false;

      if (tingkat !== "semua") {
        const elo = eloAnggota(a);
        if (tingkat === "tanpa-rating") {
          if (elo !== null) return false;
        } else {
          const t = TINGKATAN_RATING.find((x) => x.id === tingkat);
          if (!t || elo === null) return false;
          if (t.max === null ? elo < t.min : elo < t.min || elo >= t.max)
            return false;
        }
      }

      if (!kunci) return true;
      return (
        namaTampil(a).toLowerCase().includes(kunci) ||
        (a.username || "").toLowerCase().includes(kunci) ||
        (a.lichess || "").toLowerCase().includes(kunci) ||
        (a.klub || "").toLowerCase().includes(kunci)
      );
    });
  }, [berperingkat, cari, klub, tingkat]);

  const terlihat = hasil.slice(0, tampil);

  const ubah = (setter) => (nilai) => {
    setter(nilai);
    setTampil(PER_HALAMAN);
  };

  return (
    <TataLetakBeranda
      id="peringkat"
      title="Peringkat"
      description="Peringkat anggota Komunitas Catur Indonesia berdasarkan Elo Chess.com."
      sectionTitle="Peringkat pemain Komunitas Catur Indonesia"
    >
      <p className="ql-align-justify">
        Anggota Komunitas Catur Indonesia yang terdaftar dan terverifikasi.
        Peringkat disusun dari Elo akun Chess.com masing-masing anggota
        (diutamakan Rapid) dan diperbarui otomatis. Daftar ini memakai data
        yang sama dengan{" "}
        <Link
          to="/tentang-kami/struktur-grup-catur#keanggotaan"
          className="text-primary"
        >
          Daftar Anggota
        </Link>{" "}
        — jadi satu kali mendaftar, nama Anda langsung muncul di kedua
        halaman. Belum terdaftar? Silakan isi{" "}
        <Link to="/pendaftaran-anggota" className="text-primary">
          formulir Pendaftaran Anggota
        </Link>
        , lalu verifikasi kepemilikan akun Chess.com Anda.
      </p>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-4">
        <label className="flex flex-col gap-1 text-sm text-grey-800">
          <span className="font-medium">Cari pemain</span>
          <input
            type="search"
            value={cari}
            onChange={(e) => ubah(setCari)(e.target.value)}
            placeholder="Nama, username, atau klub"
            className="border-0 border-b border-solid border-grey-300 outline-none py-1 pr-2 text-sm bg-transparent focus:border-primary min-w-[220px]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-grey-800">
          <span className="font-medium">Tingkatan</span>
          <select
            value={tingkat}
            onChange={(e) => ubah(setTingkat)(e.target.value)}
            className="border-0 border-b border-solid border-grey-300 outline-none py-1 pl-1 pr-8 text-sm bg-transparent focus:border-primary cursor-pointer"
          >
            <option value="semua">Semua tingkatan</option>
            <option value="tanpa-rating">Tanpa rating</option>
            {TINGKATAN_RATING.map((t) => (
              <option key={t.id} value={t.id}>
                {t.range}
              </option>
            ))}
          </select>
        </label>

        {daftarKlub.length > 0 && (
          <label className="flex flex-col gap-1 text-sm text-grey-800">
            <span className="font-medium">Klub</span>
            <select
              value={klub}
              onChange={(e) => ubah(setKlub)(e.target.value)}
              className="border-0 border-b border-solid border-grey-300 outline-none py-1 pl-1 pr-8 text-sm bg-transparent focus:border-primary cursor-pointer"
            >
              <option value="semua">Semua klub</option>
              {daftarKlub.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center gap-4 pb-1 ml-auto">
          <p className="text-sm text-slate-500">
            {terlihat.length} dari {hasil.length} pemain
          </p>
          <button
            type="button"
            onClick={muatUlang}
            className="text-sm text-primary underline underline-offset-2"
          >
            Muat ulang
          </button>
        </div>
      </div>

      {status === "memuat" && <p>Memuat data anggota…</p>}
      {status === "gagal" && <p>{pesan}</p>}

      {status === "siap" && anggota.length === 0 && (
        <p>
          Belum ada anggota terdaftar.{" "}
          <Link to="/pendaftaran-anggota" className="text-primary">
            Daftar dengan akun Chess.com
          </Link>{" "}
          untuk menjadi yang pertama.
        </p>
      )}

      {status === "siap" && anggota.length > 0 && hasil.length === 0 && (
        <p>Tidak ada pemain yang cocok dengan pencarian ini.</p>
      )}

      {status === "siap" && hasil.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="tabel-kci tabel-peringkat">
              <thead>
                <tr>
                  <th className="kol-no">#</th>
                  <th className="kol-rating">Rating</th>
                  <th className="kol-nama">Nama</th>
                  <th className="kol-klub">Klub</th>
                  <th className="kol-akun">Lichess</th>
                  <th className="kol-akun">Chess.com</th>
                </tr>
              </thead>
              <tbody>
                {terlihat.map((a) => (
                  <BarisPeringkat key={a.username} a={a} />
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
