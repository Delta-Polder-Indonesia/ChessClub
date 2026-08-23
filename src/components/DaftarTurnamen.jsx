import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ambilTurnamenPublik,
  ambilSatuTurnamen,
  ajukanPesertaTurnamen,
} from "../lib/api/index.js";
import { useI18n } from "../lib/i18n.jsx";
import { parseWaktuKomunitas } from "../lib/waktu.js";
import { WARNA_STATUS, TEKS_STATUS } from "./LencanaStatus.jsx";

/**
 * Bagian dinamis untuk keempat halaman turnamen publik.
 *
 * Halaman turnamen tetap memuat artikel penjelasan dari i18n (aturan main
 * yang jarang berubah), lalu komponen ini menempel di bawahnya berisi
 * jadwal, peserta, dan klasemen yang datang dari dashboard pengurus.
 *
 * Bila belum ada turnamen yang dipublikasikan, komponen ini menampilkan
 * pesan tenang — bukan galat — supaya halaman tetap rapi.
 */

const KATA = {
  id: {
    memuat: "Memuat jadwal…",
    kosong:
      "Belum ada jadwal yang dipublikasikan untuk kategori ini. Pantau halaman Pengumuman untuk kabar terbaru.",
    gagal: "Jadwal sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.",
    jadwal: "Jadwal & Klasemen",
    mulai: "Mulai",
    tutup: "Tutup pendaftaran",
    tempo: "Tempo",
    ronde: "Ronde",
    tempat: "Tempat",
    hadiah: "Hadiah",
    biaya: "Biaya",
    peserta: "peserta",
    lihat: "Lihat klasemen",
    tutupRincian: "Tutup",
    klasemen: "Klasemen",
    klasemenTim: "Klasemen Tim",
    peringkat: "#",
    pemain: "Pemain",
    tim: "Tim",
    main: "Main",
    poin: "Poin",
    belumMain: "Belum ada partai yang dicatat.",
    belumResmi: "belum memenuhi minimal partai",
    daftar: "Daftar jadi anggota untuk ikut",
    bukaTurnamen: "Buka turnamen",
    tombolDaftar: "Daftar sebagai peserta",
    username: "Username Chess.com",
    kirimPengajuan: "Kirim pengajuan",
    mengirim: "Mengirim…",
    pengajuanTerkirim: "Pengajuan terkirim dan sedang menunggu persetujuan pengurus.",
    daftarAnggotaDulu: "Daftar menjadi anggota",
    catatanDaftar: "Hanya anggota BLUNDER SKUAD yang sudah melengkapi data diri di website yang dapat mengajukan diri. Pengurus akan memeriksa akun sebelum menerima peserta.",
  },
  en: {
    memuat: "Loading schedule…",
    kosong:
      "No schedule has been published for this category yet. Check the Announcements page for updates.",
    gagal: "The schedule cannot be loaded right now. Please try again shortly.",
    jadwal: "Schedule & Standings",
    mulai: "Starts",
    tutup: "Registration closes",
    tempo: "Time control",
    ronde: "Rounds",
    tempat: "Venue",
    hadiah: "Prize",
    biaya: "Entry fee",
    peserta: "players",
    lihat: "View standings",
    tutupRincian: "Close",
    klasemen: "Standings",
    klasemenTim: "Team Standings",
    peringkat: "#",
    pemain: "Player",
    tim: "Team",
    main: "Played",
    poin: "Points",
    belumMain: "No games recorded yet.",
    belumResmi: "minimum games not met",
    daftar: "Join as a member to play",
    bukaTurnamen: "Open tournament",
    tombolDaftar: "Register as participant",
    username: "Chess.com username",
    kirimPengajuan: "Submit application",
    mengirim: "Submitting…",
    pengajuanTerkirim: "Your application was submitted and is awaiting staff approval.",
    daftarAnggotaDulu: "Register as a member",
    catatanDaftar: "Only BLUNDER SKUAD members who have completed their personal data on the website may apply. Staff will review the account before accepting a participant.",
  },
};

function tanggal(nilai, bahasa) {
  if (!nilai) return "—";
  // Jam turnamen disimpan tanpa zona waktu; parse eksplisit sebagai
  // Asia/Jakarta agar tidak bergeser di zona browser pengunjung.
  const d = parseWaktuKomunitas(nilai);
  if (!d) return nilai;
  return d.toLocaleDateString(bahasa === "en" ? "en-GB" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Klasemen({ id, k }) {
  const [data, setData] = useState(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let hidup = true;
    ambilSatuTurnamen(id)
      .then((d) => hidup && setData(d))
      .catch(() => hidup && setGagal(true));
    return () => {
      hidup = false;
    };
  }, [id]);

  if (gagal) return <p className="py-3 text-sm text-slate-500">{k.gagal}</p>;
  if (!data) return <p className="py-3 text-sm text-slate-500">{k.memuat}</p>;
  if (!data.klasemen?.length)
    return <p className="py-3 text-sm text-slate-500">{k.belumMain}</p>;

  return (
    <div className="mt-4 space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-bold text-slate-900">{k.klasemen}</h4>
        <div className="overflow-auto max-h-[760px]">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th className="kol-peringkat">{k.peringkat}</th>
                <th className="kol-pemain">{k.pemain}</th>
                <th className="kol-main">{k.main}</th>
                <th className="kol-poin">{k.poin}</th>
              </tr>
            </thead>
            <tbody>
              {data.klasemen.map((b, index) => (
                <tr key={b.username} className={index % 2 === 1 ? "bg-slate-50" : ""}>
                  <td className="kol-peringkat">{b.peringkat}</td>
                  <td className="kol-pemain">
                    {b.panggilan}
                    {b.resmi === false && (
                      <span className="ml-1.5 text-xs font-normal text-amber-700">
                        ({k.belumResmi})
                      </span>
                    )}
                  </td>
                  <td className="kol-main">{b.main}</td>
                  <td className="kol-poin">{b.poin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {Boolean(data.klasemenTim?.length) && (
        <div>
          <h4 className="mb-2 text-sm font-bold text-slate-900">
            {k.klasemenTim}
          </h4>
          <div className="overflow-auto max-h-[760px]">
            <table className="tabel-kci tabel-peringkat">
              <thead>
                <tr>
                  <th className="kol-peringkat">{k.peringkat}</th>
                  <th className="kol-tim">{k.tim}</th>
                  <th className="kol-poin">{k.poin}</th>
                </tr>
              </thead>
              <tbody>
                {data.klasemenTim.map((b, index) => (
                  <tr key={b.tim} className={index % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="kol-peringkat">{b.peringkat}</td>
                    <td className="kol-tim">
                      {b.tim}
                    </td>
                    <td className="kol-poin">
                      {b.poin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KartuTurnamen({ t, k, bahasa }) {
  const [buka, setBuka] = useState(false);
  const [bukaDaftar, setBukaDaftar] = useState(false);
  const [username, setUsername] = useState("");
  const [pesanDaftar, setPesanDaftar] = useState("");
  const [galatDaftar, setGalatDaftar] = useState("");
  const [harusDaftarAnggota, setHarusDaftarAnggota] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const warna = WARNA_STATUS[t.status] || WARNA_STATUS.pendaftaran;
  const label = (TEKS_STATUS[bahasa] || TEKS_STATUS.id)[t.status] || t.status;

  const baris = [
    [k.mulai, tanggal(t.mulai, bahasa)],
    [k.tutup, tanggal(t.tutupDaftar, bahasa)],
    [k.tempo, t.tempo || "—"],
    [k.ronde, t.ronde || "—"],
    [k.tempat, t.tempat || "—"],
    [k.hadiah, t.hadiah || "—"],
  ].filter(([, v]) => v && v !== "—");

  const kirimPengajuan = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setMengirim(true);
    setGalatDaftar("");
    setPesanDaftar("");
    setHarusDaftarAnggota(false);
    try {
      await ajukanPesertaTurnamen(t.id, username.trim());
      setPesanDaftar(k.pengajuanTerkirim);
      setUsername("");
    } catch (err) {
      setGalatDaftar(err.message || "Pengajuan gagal.");
      setHarusDaftarAnggota(Boolean(err.galat?.harusDaftarAnggota));
    } finally {
      setMengirim(false);
    }
  };

  return (
    <article className="border-b border-slate-200 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {t.tautan ? (
              <a
                href={t.tautan}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-primary hover:underline"
              >
                {t.nama} <span aria-hidden="true">↗</span>
              </a>
            ) : (
              t.nama
            )}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {t.jumlahPeserta} {k.peserta}
            {t.kuota ? ` / ${t.kuota}` : ""}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold ${warna}`}
        >
          {label}
        </span>
      </div>

      {t.deskripsi && (
        <p className="mt-3 text-sm leading-6 text-slate-700">{t.deskripsi}</p>
      )}

      {Boolean(baris.length) && (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
          {baris.map(([nama, nilai]) => (
            <div key={nama}>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                {nama}
              </dt>
              <dd className="font-medium text-slate-800">{nilai}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {t.status === "pendaftaran" && (
          <button
            type="button"
            onClick={() => setBukaDaftar((nilai) => !nilai)}
            className="bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            {k.tombolDaftar}
          </button>
        )}
        <button
          type="button"
          onClick={() => setBuka((b) => !b)}
          className="px-4 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:text-primary"
        >
          {buka ? k.tutupRincian : k.lihat}
        </button>
        {t.tautan && (
          <a
            href={t.tautan}
            target="_blank"
            rel="noreferrer noopener"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {k.bukaTurnamen} ↗
          </a>
        )}
      </div>

      {bukaDaftar && t.status === "pendaftaran" && (
        <form
          onSubmit={kirimPengajuan}
          className="mt-4 border-y border-slate-200 bg-slate-50 px-4 py-4"
        >
          <p className="mb-3 text-xs leading-5 text-slate-600">{k.catatanDaftar}</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-medium text-slate-700">
              {k.username}
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="namauser"
                autoComplete="off"
                className="border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={mengirim || !username.trim()}
              className="bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              {mengirim ? k.mengirim : k.kirimPengajuan}
            </button>
          </div>
          {pesanDaftar && (
            <p className="mt-3 text-sm font-medium text-emerald-700">{pesanDaftar}</p>
          )}
          {galatDaftar && (
            <p className="mt-3 text-sm text-red-700">
              {galatDaftar}{" "}
              {harusDaftarAnggota && (
                <Link
                  to="/pendaftaran-anggota"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  {k.daftarAnggotaDulu}
                </Link>
              )}
            </p>
          )}
        </form>
      )}

      {buka && <Klasemen id={t.id} k={k} />}
    </article>
  );
}

export default function DaftarTurnamen({ jenis }) {
  const { bahasa } = useI18n();
  const k = KATA[bahasa] || KATA.id;
  const [daftar, setDaftar] = useState(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let hidup = true;
    setDaftar(null);
    setGagal(false);
    ambilTurnamenPublik(jenis)
      .then((d) => hidup && setDaftar(d))
      .catch(() => hidup && setGagal(true));
    return () => {
      hidup = false;
    };
  }, [jenis]);

  // Padding & lebar maksimum disamakan dengan PageArtikel agar blok jadwal
  // sejajar dengan artikel di atasnya, bukan menempel ke tepi layar.
  return (
    <section className="w-full relative bg-transparent pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-12 md:pb-12 xl:pb-16">
      <div className="relative mx-auto w-full md:max-w-[1024px]">
        <h2 className="mb-6 font-semibold text-2xl md:text-3xl text-black">
          {k.jadwal}
        </h2>

        {gagal ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            {k.gagal}
          </p>
        ) : daftar === null ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            {k.memuat}
          </p>
        ) : daftar.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            {k.kosong}
          </p>
        ) : (
          <div>
            {daftar.map((t) => (
              <KartuTurnamen key={t.id} t={t} k={k} bahasa={bahasa} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
