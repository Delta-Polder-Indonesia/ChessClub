import { useMemo, useState } from "react";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import { BreadcrumbJsonLd } from "../../components/JsonLd.jsx";
import Hero from "../../components/Hero.jsx";
import { AksiKonten } from "../../components/konten/AksiKonten.jsx";
import {
  BadanTabelKonten,
  BarisTabelKonten,
  KepalaTabelKonten,
  JudulKolomKonten,
  SelTabelKonten,
  TabelKonten,
} from "../../components/konten/TabelKonten.jsx";
import { CentangBiru, LencanaBan } from "../../components/Lencana.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";
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
    <div className="min-h-screen bg-paper text-slate-900">
      <MetaHalaman title={judul} description={deskripsi} image={gambar("/images/hero-about.jpg")} />
      <BreadcrumbJsonLd items={[{ label: t("common.home"), to: "/" }, { label: t("karir.judul") }]} />
      <Hero
        title={t("karir.judul")}
        description={t("karir.deskripsi")}
        crumbs={[
          { label: t("common.home"), to: "/" },
          { label: t("karir.judul") },
        ]}
        image={gambar("/images/hero-about.jpg")}
      />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{t("beranda.peringkatKlubEyebrow")}</p>
            <h2 className="mt-2 font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] text-balance text-slate-900">{judul}</h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">{deskripsi}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {menyegarkan && <span role="status">{t("beranda.peringkatMenyegarkan")}</span>}
            <TanggalRoster tanggal={rosterDiperbaruiPada} locale={locale} t={t} />
            <AksiKonten variant="sekunder" onClick={muatUlang} disabled={menyegarkan}>
              {menyegarkan ? t("beranda.peringkatMenyegarkan") : t("beranda.muatUlang")}
            </AksiKonten>
          </div>
        </div>

        <section aria-label={t("beranda.peringkatKlubPemainTeratas")} className="relative overflow-hidden rounded-lg bg-grey-800 p-5 text-white shadow-sm sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)] lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-200">
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">{t("beranda.peringkatKlubRatingTeratas")}</p>
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
              <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                <p className="text-xs text-blue-200">{t("beranda.peringkatKlubJumlahAnggota")}</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{anggota.length.toLocaleString(locale === "en" ? "en-US" : "id-ID")}</p>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                <p className="text-xs text-blue-200">{t("beranda.peringkatKlubPunyaRating", { kontrol: namaKontrol(kontrol) })}</p>
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums">{jumlahBerperingkat.toLocaleString(locale === "en" ? "en-US" : "id-ID")}</p>
              </div>
              <p className="col-span-2 text-xs leading-5 text-blue-100/75">{t("beranda.peringkatKlubSumber")}</p>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-lg border border-slate-200 bg-white shadow-sm" aria-label={judul}>
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
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{t("beranda.peringkatKlubPilihKontrol")}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t("beranda.peringkatKlubPilihKontrol")}>
                  {OPSI_RATING.map((opsi) => (
                    <AksiKonten
                      key={opsi}
                      variant={kontrol === opsi ? "utama" : "sekunder"}
                      aria-pressed={kontrol === opsi}
                      onClick={() => setKontrol(opsi)}
                      className="min-h-10 px-3"
                    >
                      {namaKontrol(opsi)}
                    </AksiKonten>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("beranda.peringkatKlubPilihCakupan")}>
                {[
                  ["semua", t("beranda.peringkatKlubSemua")],
                  ["berperingkat", t("beranda.peringkatKlubHanyaRating")],
                ].map(([id, label]) => (
                  <AksiKonten
                    key={id}
                    variant={cakupan === id ? "utama" : "sekunder"}
                    aria-pressed={cakupan === id}
                    onClick={() => setCakupan(id)}
                    className="min-h-10 px-3"
                  >
                    {label}
                  </AksiKonten>
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
              <AksiKonten variant="teks" onClick={muatUlang} className="mt-2">{t("common.cobaLagi")}</AksiKonten>
            </div>
          ) : null}
          {status === "siap" && anggota.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">{t("beranda.peringkatKosong1")}<a href={URL_KLUB} target="_blank" rel="noreferrer noopener" className="text-blue-700 underline">BLUNDER SKUAD</a>{t("beranda.peringkatKosong2")}</p>
          ) : null}
          {anggota.length > 0 && hasil.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">{t("beranda.peringkatKlubTidakAdaHasil")}</p>
          ) : null}

          {hasil.length > 0 && (
            <div className="max-h-[min(70vh,780px)] overflow-auto rounded-b-lg">
              <TabelKonten className="min-w-[680px] text-left font-sans text-sm text-slate-900">
                <KepalaTabelKonten className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 shadow-sm">
                  <tr>
                    <JudulKolomKonten scope="col" className="w-20 text-right">#</JudulKolomKonten>
                    <JudulKolomKonten scope="col">{t("beranda.peringkatKlubKolPemain")}</JudulKolomKonten>
                    <JudulKolomKonten scope="col" className="w-36 text-right">{t("beranda.peringkatKlubKolRating", { kontrol: namaKontrol(kontrol) })}</JudulKolomKonten>
                    <JudulKolomKonten scope="col" className="w-36 text-right">{t("beranda.peringkatKlubKolRekor")}</JudulKolomKonten>
                    <JudulKolomKonten scope="col" className="w-28 text-right">Chess.com</JudulKolomKonten>
                  </tr>
                </KepalaTabelKonten>
                <BadanTabelKonten className="divide-y divide-slate-100">
                  {hasil.map((a) => {
                    const dataKontrol = opsiKontrol(a).find((opsi) => opsi.id === (kontrol === "utama" ? "all" : kontrol));
                    const hasError = a.hilang || a.gagal;
                    return (
                      <BarisTabelKonten key={a.username || a.playerId || namaTampil(a)} className="transition-colors hover:bg-blue-50/60">
                        <SelTabelKonten className="text-right font-mono text-xs tabular-nums text-slate-500">{a.peringkatKontrol ? `#${a.peringkatKontrol}` : "—"}</SelTabelKonten>
                        <SelTabelKonten>
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
                        </SelTabelKonten>
                        <SelTabelKonten className="text-right font-mono font-bold tabular-nums text-slate-900">{a.ratingAktif ?? <span className="font-sans text-xs font-normal text-slate-400">{hasError ? t("beranda.peringkatKlubDataTidakTersedia") : t("beranda.peringkatKlubBelumAdaRating")}</span>}</SelTabelKonten>
                        <SelTabelKonten className="text-right font-mono text-xs tabular-nums text-slate-600">{dataKontrol?.ada ? `${dataKontrol.win} / ${dataKontrol.draw} / ${dataKontrol.loss}` : "—"}</SelTabelKonten>
                        <SelTabelKonten className="text-right">{a.username ? <a href={a.url || `https://www.chess.com/member/${a.username}`} target="_blank" rel="noreferrer noopener" className="text-xs font-semibold text-blue-700 hover:underline">{t("beranda.peringkatKlubProfil")}</a> : "—"}</SelTabelKonten>
                      </BarisTabelKonten>
                    );
                  })}
                </BadanTabelKonten>
              </TabelKonten>
            </div>
          )}
        </section>

        <p className="mt-4 text-xs leading-5 text-slate-500">{t("beranda.peringkatKlubCatatanRating")}</p>
      </main>
    </div>
  );
}
