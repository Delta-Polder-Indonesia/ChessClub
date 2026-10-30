import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import { BreadcrumbJsonLd } from "../../components/JsonLd.jsx";
import { CentangBiru, LencanaBan } from "../../components/Lencana.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import {
  kenaBan,
  namaTampil,
  opsiKontrol,
  useAnggota,
} from "../../lib/anggotaBersama.js";

const URL_KLUB = "https://www.chess.com/club/blunder-skuad";
const URUTAN_KONTROL = ["Rapid", "Blitz", "Bullet", "Daily"];
const OPSI_RATING = ["utama", ...URUTAN_KONTROL];

function ratingKontrol(anggota, kontrol) {
  if (anggota?.hilang || anggota?.gagal) return null;
  if (kontrol === "utama") {
    if (anggota.elo === null || anggota.elo === undefined || anggota.elo === "") return null;
    const rating = Number(anggota.elo);
    return Number.isFinite(rating) ? rating : null;
  }
  const entri = opsiKontrol(anggota).find((opsi) => opsi.id === kontrol);
  if (!entri?.ada || entri.elo === null || entri.elo === undefined) return null;
  const rating = Number(entri.elo);
  return Number.isFinite(rating) ? rating : null;
}

function avatar(anggota, kelas = "h-12 w-12") {
  if (anggota.foto) {
    return (
      <img
        src={anggota.foto}
        alt={namaTampil(anggota)}
        width="48"
        height="48"
        loading="lazy"
        className={`${kelas} rounded-full object-cover ring-2 ring-white/70`}
      />
    );
  }
  return (
    <span className={`${kelas} grid shrink-0 place-items-center rounded-full bg-white/15 font-semibold text-white ring-2 ring-white/40`} aria-hidden="true">
      {(anggota.nama || anggota.username || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

function LabelPemain({ anggota, gelap = false }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${gelap ? "text-white" : "text-slate-900"}`}>
      <span className="truncate">{namaTampil(anggota)}</span>
      {anggota.terverifikasi && <CentangBiru />}
      {kenaBan(anggota) && <LencanaBan />}
    </span>
  );
}

function TanggalRoster({ tanggal, locale, t }) {
  if (!tanggal) return null;
  const nilai = new Date(tanggal);
  if (!Number.isFinite(nilai.getTime())) return null;
  const teks = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(nilai);
  return <span>{t("beranda.peringkatKlubDiperbarui", { tanggal: teks })}</span>;
}

export default function Karir() {
  const { anggota, status, menyegarkan, rosterDiperbaruiPada, muatUlang } = useAnggota();
  const { t, bahasa: locale } = useI18n();
  const [kontrol, setKontrol] = useState("utama");
  const [cari, setCari] = useState("");
  const [cakupan, setCakupan] = useState("semua");

  const daftarPeringkat = useMemo(() => {
    const tersusun = anggota
      .map((a, indeksSumber) => ({
        ...a,
        ratingAktif: ratingKontrol(a, kontrol),
        indeksSumber,
      }))
      .sort((a, b) => {
        if (a.ratingAktif === null && b.ratingAktif !== null) return 1;
        if (a.ratingAktif !== null && b.ratingAktif === null) return -1;
        if (a.ratingAktif !== null && b.ratingAktif !== null && a.ratingAktif !== b.ratingAktif) {
          return b.ratingAktif - a.ratingAktif;
        }
        return a.indeksSumber - b.indeksSumber;
      });
    let nomor = 0;
    return tersusun.map((a) => ({
      ...a,
      peringkatKontrol: a.ratingAktif === null ? null : ++nomor,
    }));
  }, [anggota, kontrol]);

  const jumlahBerperingkat = daftarPeringkat.filter((a) => a.ratingAktif !== null).length;
  const pemainTeratas = daftarPeringkat.find((a) => a.ratingAktif !== null) ?? null;
  const kunciCari = cari.trim().toLocaleLowerCase();
  const hasil = daftarPeringkat.filter((a) => {
    if (cakupan === "berperingkat" && a.ratingAktif === null) return false;
    if (!kunciCari) return true;
    return namaTampil(a).toLocaleLowerCase().includes(kunciCari)
      || String(a.username || "").toLocaleLowerCase().includes(kunciCari);
  });

  const namaKontrol = (id) => id === "utama" ? t("beranda.peringkatKlubUtama") : id;
  const jumlahPemain = t("beranda.peringkatJumlah", { jumlah: hasil.length });
  const judul = t("beranda.peringkatKlubJudul");
  const deskripsi = t("beranda.peringkatKlubDeskripsi");

  return (
    <div className="min-h-[70vh] bg-[#f4f6f9] text-slate-900">
      <MetaHalaman title={judul} description={deskripsi} image="/images/sekilas.jpg" />
      <BreadcrumbJsonLd items={[{ label: t("common.home"), to: "/" }, { label: judul }]} />

      <main className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <nav aria-label={judul} className="mb-5 text-xs text-slate-500">
          <Link to="/" className="transition hover:text-slate-900">{t("common.home")}</Link>
          <span className="px-2" aria-hidden="true">/</span>
          <span aria-current="page" className="text-slate-700">{judul}</span>
        </nav>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{t("beranda.peringkatKlubEyebrow")}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{judul}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{deskripsi}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {menyegarkan && <span role="status">{t("beranda.peringkatMenyegarkan")}</span>}
            <TanggalRoster tanggal={rosterDiperbaruiPada} locale={locale} t={t} />
            <button
              type="button"
              onClick={muatUlang}
              disabled={menyegarkan}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              {menyegarkan ? t("beranda.peringkatMenyegarkan") : t("beranda.muatUlang")}
            </button>
          </div>
        </div>

        <section aria-label={t("beranda.peringkatKlubPemainTeratas")} className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-[#101b33] via-[#172746] to-[#243d63] p-5 text-white shadow-xl sm:p-8">
          <div aria-hidden="true" className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-300/15 text-amber-200" aria-hidden="true">♔</span>
                {t("beranda.peringkatKlubPemainTeratas")}
              </div>
              {pemainTeratas ? (
                <div className="mt-5 flex min-w-0 items-center gap-4 sm:gap-6">
                  {avatar(pemainTeratas, "h-16 w-16 sm:h-20 sm:w-20")}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-blue-100">{t("beranda.peringkatKlubTeratasDalam", { kontrol: namaKontrol(kontrol) })}</p>
                    {pemainTeratas.username ? (
                      <a href={pemainTeratas.url || `https://www.chess.com/member/${pemainTeratas.username}`} target="_blank" rel="noreferrer noopener" className="mt-1 block text-xl font-bold tracking-tight text-white hover:underline sm:text-2xl">
                        <LabelPemain anggota={pemainTeratas} gelap />
                      </a>
                    ) : (
                      <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl"><LabelPemain anggota={pemainTeratas} gelap /></h2>
                    )}
                    {pemainTeratas.username && <p className="mt-1 truncate text-sm text-blue-200">@{pemainTeratas.username}</p>}
                  </div>
                  <div className="shrink-0 border-l border-white/15 pl-4 text-right sm:pl-7">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-200">{t("beranda.peringkatKlubRatingTeratas")}</p>
                    <p className="mt-1 font-mono text-3xl font-bold tabular-nums sm:text-4xl">{pemainTeratas.ratingAktif}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm text-blue-100">{t(status === "memuat" ? "beranda.peringkatMemuat" : "beranda.peringkatKlubBelumAdaRating")}</p>
              )}
              {pemainTeratas?.username && (
                <a href={pemainTeratas.url || `https://www.chess.com/member/${pemainTeratas.username}`} target="_blank" rel="noreferrer noopener" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-200 transition hover:text-white">
                  {t("beranda.peringkatKlubLihatChessCom")}
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:border-l lg:border-white/15 lg:pl-7">
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs text-blue-200">{t("beranda.peringkatKlubJumlahAnggota")}</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{anggota.length.toLocaleString(locale === "en" ? "en-US" : "id-ID")}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs text-blue-200">{t("beranda.peringkatKlubPunyaRating", { kontrol: namaKontrol(kontrol) })}</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{jumlahBerperingkat.toLocaleString(locale === "en" ? "en-US" : "id-ID")}</p>
              </div>
              <p className="col-span-2 text-xs leading-5 text-blue-100/75">{t("beranda.peringkatKlubSumber")}</p>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label={judul}>
          <div className="border-b border-slate-200 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("beranda.peringkatKlubPapanJudul")}</h2>
                <p className="mt-1 text-sm text-slate-500">{jumlahPemain}</p>
              </div>
              <label className="flex w-full max-w-sm flex-col gap-1.5 text-xs font-semibold text-slate-600 sm:w-auto">
                {t("beranda.peringkatKlubCari")}
                <input
                  type="search"
                  value={cari}
                  onChange={(event) => setCari(event.target.value)}
                  placeholder={t("beranda.peringkatKlubCariPlaceholder")}
                  className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500">{t("beranda.peringkatKlubPilihKontrol")}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t("beranda.peringkatKlubPilihKontrol")}>
                  {OPSI_RATING.map((opsi) => (
                    <button
                      key={opsi}
                      type="button"
                      aria-pressed={kontrol === opsi}
                      onClick={() => setKontrol(opsi)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${kontrol === opsi ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"}`}
                    >
                      {namaKontrol(opsi)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("beranda.peringkatKlubPilihCakupan")}>
                {[
                  ["semua", t("beranda.peringkatKlubSemua")],
                  ["berperingkat", t("beranda.peringkatKlubHanyaRating")],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={cakupan === id}
                    onClick={() => setCakupan(id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${cakupan === id ? "border-blue-700 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {status === "memuat" && anggota.length === 0 ? (
            <p role="status" className="p-6 text-sm text-slate-500">{t("beranda.peringkatMemuat")}</p>
          ) : null}
          {status === "gagal" && anggota.length === 0 ? (
            <div className="p-6 text-sm text-rose-700">
              <p>{t("beranda.peringkatGagal")}</p>
              <button type="button" onClick={muatUlang} className="mt-2 font-semibold underline">{t("common.cobaLagi")}</button>
            </div>
          ) : null}
          {status === "siap" && anggota.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">{t("beranda.peringkatKosong1")}<a href={URL_KLUB} target="_blank" rel="noreferrer noopener" className="text-blue-700 underline">BLUNDER SKUAD</a>{t("beranda.peringkatKosong2")}</p>
          ) : null}
          {anggota.length > 0 && hasil.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">{t("beranda.peringkatKlubTidakAdaHasil")}</p>
          ) : null}

          {hasil.length > 0 && (
            <div className="max-h-[min(70vh,780px)] overflow-auto rounded-b-2xl">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_rgba(15,23,42,0.08)]">
                  <tr>
                    <th scope="col" className="w-20 px-4 py-3 text-right">#</th>
                    <th scope="col" className="px-4 py-3">{t("beranda.peringkatKlubKolPemain")}</th>
                    <th scope="col" className="w-36 px-4 py-3 text-right">{t("beranda.peringkatKlubKolRating", { kontrol: namaKontrol(kontrol) })}</th>
                    <th scope="col" className="w-36 px-4 py-3 text-right">{t("beranda.peringkatKlubKolRekor")}</th>
                    <th scope="col" className="w-28 px-4 py-3 text-right">Chess.com</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hasil.map((a) => {
                    const dataKontrol = opsiKontrol(a).find((opsi) => opsi.id === (kontrol === "utama" ? "all" : kontrol));
                    const hasError = a.hilang || a.gagal;
                    return (
                      <tr key={a.username || a.playerId || namaTampil(a)} className="transition-colors hover:bg-blue-50/60">
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-500">{a.peringkatKontrol ? `#${a.peringkatKontrol}` : "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            {avatar(a, "h-10 w-10")}
                            <div className="min-w-0">
                              {a.username ? (
                                <a href={a.url || `https://www.chess.com/member/${a.username}`} target="_blank" rel="noreferrer noopener" aria-label={t("beranda.peringkatKlubLihatProfil", { username: namaTampil(a) })} className="font-semibold hover:text-blue-700 hover:underline">
                                  <LabelPemain anggota={a} />
                                </a>
                              ) : <LabelPemain anggota={a} />}
                              <p className="mt-0.5 truncate text-xs text-slate-500">{a.username ? `@${a.username}` : t("beranda.peringkatKlubTanpaUsername")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">{a.ratingAktif ?? <span className="font-sans text-xs font-normal text-slate-400">{hasError ? t("beranda.peringkatKlubDataTidakTersedia") : t("beranda.peringkatKlubBelumAdaRating")}</span>}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-600">{dataKontrol?.ada ? `${dataKontrol.win} / ${dataKontrol.draw} / ${dataKontrol.loss}` : "—"}</td>
                        <td className="px-4 py-3 text-right">{a.username ? <a href={a.url || `https://www.chess.com/member/${a.username}`} target="_blank" rel="noreferrer noopener" className="text-xs font-semibold text-blue-700 hover:underline">{t("beranda.peringkatKlubProfil")}</a> : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-4 text-xs leading-5 text-slate-500">{t("beranda.peringkatKlubCatatanRating")}</p>
      </main>
    </div>
  );
}
