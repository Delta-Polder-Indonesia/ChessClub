import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ambilTurnamenPublik,
  ambilSatuTurnamen,
  ajukanPesertaTurnamen,
} from "../lib/api/index.js";
import { useI18n } from "../lib/i18n.jsx";
import { parseWaktuKomunitas } from "../lib/waktu.js";
import { TEKS_STATUS } from "./LencanaStatus.jsx";

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
    memuatKlasemen: "Memuat klasemen…",
    gagalKlasemen:
      "Klasemen sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.",
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
    memuatKlasemen: "Loading standings…",
    gagalKlasemen:
      "Standings cannot be loaded right now. Please try again shortly.",
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
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [gagal, setGagal] = useState(false);
  // Tombol "Coba lagi" mengulang permintaan klasemen yang gagal.
  const [percobaan, setPercobaan] = useState(0);

  useEffect(() => {
    let hidup = true;
    setData(null);
    setGagal(false);
    ambilSatuTurnamen(id)
      .then((d) => hidup && setData(d))
      .catch(() => hidup && setGagal(true));
    return () => {
      hidup = false;
    };
  }, [id, percobaan]);

  if (gagal)
    return (
      <div className="py-3">
        <p className="text-sm text-gray-700">{k.gagalKlasemen}</p>
        <button
          type="button"
          onClick={() => setPercobaan((n) => n + 1)}
          className="mt-2 font-sans text-xs font-bold uppercase text-gray-900 underline underline-offset-2 hover:text-black"
        >
          {t("common.cobaLagi")}
        </button>
      </div>
    );
  if (!data) return <p className="py-3 text-sm text-gray-700">{k.memuatKlasemen}</p>;
  if (!data.klasemen?.length)
    return <p className="py-3 text-sm text-gray-700">{k.belumMain}</p>;

  return (
    <div className="mt-4 space-y-4">
      <div>
        <h4 className="mb-2 font-sans text-sm font-black tracking-tight uppercase text-gray-900">
          {k.klasemen}
        </h4>
        <div className="overflow-auto">
          <table className="w-full table-fixed border-collapse border-t-2 border-b-2 border-gray-900 text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-gray-900 bg-gray-50 text-xs font-bold text-gray-900 uppercase">
                <th className="w-14 py-2 pr-4">{k.peringkat}</th>
                <th className="py-2 pr-4">{k.pemain}</th>
                <th className="w-16 py-2 text-right">{k.main}</th>
                <th className="w-16 py-2 text-right">{k.poin}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {data.klasemen.map((b) => (
                <tr key={b.username}>
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-900">
                    {b.peringkat}
                  </td>
                  <td className="py-2.5 pr-4 font-bold text-gray-900">
                    {b.panggilan}
                    {b.resmi === false && (
                      <span className="ml-1.5 font-serif text-xs italic text-gray-700">
                        ({k.belumResmi})
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs text-gray-900">
                    {b.main}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs text-gray-900">
                    {b.poin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {Boolean(data.klasemenTim?.length) && (
        <div>
          <h4 className="mb-2 font-sans text-sm font-black tracking-tight uppercase text-gray-900">
            {k.klasemenTim}
          </h4>
          <div className="overflow-auto">
            <table className="w-full table-fixed border-collapse border-t-2 border-b-2 border-gray-900 text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-gray-900 bg-gray-50 text-xs font-bold text-gray-900 uppercase">
                  <th className="w-14 py-2 pr-4">{k.peringkat}</th>
                  <th className="py-2 pr-4">{k.tim}</th>
                  <th className="w-16 py-2 text-right">{k.poin}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {data.klasemenTim.map((b) => (
                  <tr key={b.tim}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-900">
                      {b.peringkat}
                    </td>
                    <td className="py-2.5 pr-4 font-bold text-gray-900">{b.tim}</td>
                    <td className="py-2.5 text-right font-mono text-xs text-gray-900">
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
    <article className="border-b-2 border-gray-900 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-sans text-lg font-black tracking-tight uppercase text-gray-900">
            {t.tautan ? (
              <a
                href={t.tautan}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-black hover:underline"
              >
                {t.nama} <span aria-hidden="true">↗</span>
              </a>
            ) : (
              t.nama
            )}
          </h3>
          <p className="mt-0.5 text-sm text-gray-800">
            {t.jumlahPeserta} {k.peserta}
            {t.kuota ? ` / ${t.kuota}` : ""}
          </p>
        </div>
        <span className="border border-gray-900 px-1 font-sans text-xs font-bold tracking-wide uppercase">
          {label}
        </span>
      </div>

      {t.deskripsi && (
        <p className="mt-3 font-serif text-sm leading-relaxed text-justify text-gray-900">
          {t.deskripsi}
        </p>
      )}

      {Boolean(baris.length) && (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
          {baris.map(([nama, nilai]) => (
            <div key={nama}>
              <dt className="font-sans text-[11px] font-bold tracking-widest uppercase text-gray-900">
                {nama}
              </dt>
              <dd className="font-serif text-gray-900">{nilai}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {t.status === "pendaftaran" && (
          <button
            type="button"
            onClick={() => setBukaDaftar((nilai) => !nilai)}
            className="rounded border border-black bg-transparent px-4 py-2 text-xs font-semibold text-black"
          >
            {k.tombolDaftar}
          </button>
        )}
        <button
          type="button"
          onClick={() => setBuka((b) => !b)}
          className="px-4 py-1.5 font-sans text-xs font-bold uppercase text-gray-900 hover:text-black"
        >
          {buka ? k.tutupRincian : k.lihat}
        </button>
        {t.tautan && (
          <a
            href={t.tautan}
            target="_blank"
            rel="noreferrer noopener"
            className="font-sans text-xs font-bold uppercase text-gray-900 hover:text-black hover:underline"
          >
            {k.bukaTurnamen} ↗
          </a>
        )}
      </div>

      {bukaDaftar && t.status === "pendaftaran" && (
        <form
          onSubmit={kirimPengajuan}
          className="mt-4 border border-gray-900 p-4"
        >
          <p className="mb-3 font-serif text-xs leading-5 text-gray-900">
            {k.catatanDaftar}
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-[11px] font-bold tracking-widest uppercase text-gray-900">
              {k.username}
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="namauser"
                autoComplete="off"
                className="border border-gray-900 bg-white px-3 py-2 text-sm outline-none focus:border-black"
              />
            </label>
            <button
              type="submit"
              disabled={mengirim || !username.trim()}
              className="rounded border border-black bg-transparent px-4 py-2 text-xs font-semibold text-black disabled:opacity-40"
            >
              {mengirim ? k.mengirim : k.kirimPengajuan}
            </button>
          </div>
          {pesanDaftar && (
            <p className="mt-3 text-sm font-medium text-emerald-600">{pesanDaftar}</p>
          )}
          {galatDaftar && (
            <p className="mt-3 text-sm text-red-700">
              {galatDaftar}{" "}
              {harusDaftarAnggota && (
                <Link
                  to="/pendaftaran-anggota"
                  className="font-bold text-gray-900 underline underline-offset-2 hover:text-black"
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
  const { bahasa, t } = useI18n();
  const k = KATA[bahasa] || KATA.id;
  const [daftar, setDaftar] = useState(null);
  const [gagal, setGagal] = useState(false);
  // Tombol "Coba lagi" mengulang permintaan jadwal yang gagal.
  const [percobaan, setPercobaan] = useState(0);

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
  }, [jenis, percobaan]);

  // Padding & lebar maksimum disamakan dengan PageArtikel agar blok jadwal
  // sejajar dengan artikel di atasnya, bukan menempel ke tepi layar.
  return (
    <section className="w-full relative bg-transparent pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-12 md:pb-12 xl:pb-16">
      <div className="relative mx-auto w-full md:max-w-[1024px]">
        <h2 className="mb-6 font-sans text-xl font-black tracking-tight uppercase text-gray-900 border-b-2 border-gray-900 pb-2">
          {k.jadwal}
        </h2>

        {gagal ? (
          <div className="border border-gray-900 p-4 text-sm text-gray-900">
            <p>{k.gagal}</p>
            <button
              type="button"
              onClick={() => setPercobaan((n) => n + 1)}
              className="mt-2 font-sans text-xs font-bold uppercase text-gray-900 underline underline-offset-2 hover:text-black"
            >
              {t("common.cobaLagi")}
            </button>
          </div>
        ) : daftar === null ? (
          <p className="border border-gray-900 p-4 text-sm text-gray-900">
            {k.memuat}
          </p>
        ) : daftar.length === 0 ? (
          <p className="border border-gray-900 p-4 text-sm text-gray-900">
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
