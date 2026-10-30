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
        className={`${kelas} rounded-full object-cover ring-1 ring-grey-200`}
      />
    );
  }
  return (
    <span className={`${kelas} grid shrink-0 place-items-center rounded-full border border-grey-200 bg-grey-100 font-semibold text-grey-800`} aria-hidden="true">
      {(anggota.nama || anggota.username || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

function LabelPemain({ anggota, gelap = false }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 text-grey-800`}>
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
    <div className="min-h-screen bg-paper text-grey-800">
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
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("beranda.peringkatKlubEyebrow")}</p>
            <h2 className="mt-2 font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] text-balance text-grey-800">{judul}</h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-grey-600">{deskripsi}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-grey-600">
            {menyegarkan && <span role="status">{t("beranda.peringkatMenyegarkan")}</span>}
            <TanggalRoster tanggal={rosterDiperbaruiPada} locale={locale} t={t} />
            <AksiKonten variant="sekunder" onClick={muatUlang} disabled={menyegarkan}>
              {menyegarkan ? t("beranda.peringkatMenyegarkan") : t("beranda.muatUlang")}
            </AksiKonten>
          </div>
        </div>

        <section aria-label={t("beranda.peringkatKlubPemainTeratas")} className="border-y border-grey-200 py-6 text-grey-800 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-grey-600">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-grey-200 text-grey-800" aria-hidden="true">♔</span>
                {t("beranda.peringkatKlubPemainTeratas")}
              </div>
              {pemainTeratas ? (
                <div className="mt-5 flex min-w-0 items-center gap-4 sm:gap-6">
                  {avatar(pemainTeratas, "h-16 w-16 sm:h-20 sm:w-20")}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-grey-600">{t("beranda.peringkatKlubTeratasDalam", { kontrol: namaKontrol(kontrol) })}</p>
                    {pemainTeratas.username ? (
                      <a href={pemainTeratas.url || `https://www.chess.com/member/${pemainTeratas.username}`} target="_blank" rel="noreferrer noopener" className="mt-1 block text-xl font-bold tracking-tight text-grey-800 hover:underline sm:text-2xl">
                        <LabelPemain anggota={pemainTeratas} gelap />
                      </a>
                    ) : (
                      <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl"><LabelPemain anggota={pemainTeratas} gelap /></h2>
                    )}
                    {pemainTeratas.username && <p className="mt-1 truncate text-sm text-grey-600">@{pemainTeratas.username}</p>}
                  </div>
                  <div className="shrink-0 border-l border-grey-200 pl-4 text-right sm:pl-7">
                    <p className="text-xs font-semibold uppercase tracking-wide text-grey-600">{t("beranda.peringkatKlubRatingTeratas")}</p>
                    <p className="mt-1 font-mono text-3xl font-bold tabular-nums sm:text-4xl">{pemainTeratas.ratingAktif}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm text-grey-600">{t(status === "memuat" ? "beranda.peringkatMemuat" : "beranda.peringkatKlubBelumAdaRating")}</p>
              )}
              {pemainTeratas?.username && (
                <a href={pemainTeratas.url || `https://www.chess.com/member/${pemainTeratas.username}`} target="_blank" rel="noreferrer noopener" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-grey-600 transition hover:text-white">
                  {t("beranda.peringkatKlubLihatChessCom")}
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:border-l lg:border-grey-200 lg:pl-7">
              <div className="border-b border-grey-200 pb-3">
                <p className="text-sm text-grey-600">{t("beranda.peringkatKlubJumlahAnggota")}</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{anggota.length.toLocaleString(locale === "en" ? "en-US" : "id-ID")}</p>
              </div>
              <div className="border-b border-grey-200 pb-3">
                <p className="text-sm text-grey-600">{t("beranda.peringkatKlubPunyaRating", { kontrol: namaKontrol(kontrol) })}</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{jumlahBerperingkat.toLocaleString(locale === "en" ? "en-US" : "id-ID")}</p>
              </div>
              <p className="col-span-2 text-xs leading-5 text-grey-600">{t("beranda.peringkatKlubSumber")}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 border-t border-grey-200" aria-label={judul}>
          <div className="border-b border-grey-200 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-grey-800">{t("beranda.peringkatKlubPapanJudul")}</h2>
                <p className="mt-1 text-sm text-grey-600">{jumlahPemain}</p>
              </div>
              <label className="flex w-full max-w-sm flex-col gap-1.5 text-sm font-semibold text-grey-800 sm:w-auto">
                {t("beranda.peringkatKlubCari")}
                <input
                  type="search"
                  value={cari}
                  onChange={(event) => setCari(event.target.value)}
                  placeholder={t("beranda.peringkatKlubCariPlaceholder")}
                  className="h-10 rounded-none border-0 border-b border-grey-600 bg-white px-1 text-sm font-normal text-grey-800 outline-none placeholder:text-grey-600 focus:border-primary focus:ring-0"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grey-600">{t("beranda.peringkatKlubPilihKontrol")}</p>
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
            <p role="status" className="p-6 text-sm text-grey-600">{t("beranda.peringkatMemuat")}</p>
          ) : null}
          {status === "gagal" && anggota.length === 0 ? (
            <div className="py-6 text-sm text-rose-700">
              <p>{t("beranda.peringkatGagal")}</p>
              <AksiKonten variant="teks" onClick={muatUlang} className="mt-2">{t("common.cobaLagi")}</AksiKonten>
            </div>
          ) : null}
          {status === "siap" && anggota.length === 0 ? (
            <p className="p-6 text-sm text-grey-600">{t("beranda.peringkatKosong1")}<a href={URL_KLUB} target="_blank" rel="noreferrer noopener" className="text-primary underline">BLUNDER SKUAD</a>{t("beranda.peringkatKosong2")}</p>
          ) : null}
          {anggota.length > 0 && hasil.length === 0 ? (
            <p className="p-6 text-sm text-grey-600">{t("beranda.peringkatKlubTidakAdaHasil")}</p>
          ) : null}

          {hasil.length > 0 && (
            <div className="max-h-[min(70vh,780px)] overflow-auto">
              <TabelKonten className="min-w-[680px] text-left font-sans text-sm text-grey-800">
                <KepalaTabelKonten className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wide text-grey-600">
                  <tr>
                    <JudulKolomKonten scope="col" className="w-20 text-right">#</JudulKolomKonten>
                    <JudulKolomKonten scope="col">{t("beranda.peringkatKlubKolPemain")}</JudulKolomKonten>
                    <JudulKolomKonten scope="col" className="w-36 text-right">{t("beranda.peringkatKlubKolRating", { kontrol: namaKontrol(kontrol) })}</JudulKolomKonten>
                    <JudulKolomKonten scope="col" className="w-36 text-right">{t("beranda.peringkatKlubKolRekor")}</JudulKolomKonten>
                    <JudulKolomKonten scope="col" className="w-28 text-right">Chess.com</JudulKolomKonten>
                  </tr>
                </KepalaTabelKonten>
                <BadanTabelKonten className="divide-y divide-grey-200">
                  {hasil.map((a) => {
                    const dataKontrol = opsiKontrol(a).find((opsi) => opsi.id === (kontrol === "utama" ? "all" : kontrol));
                    const hasError = a.hilang || a.gagal;
                    return (
                      <BarisTabelKonten key={a.username || a.playerId || namaTampil(a)} className="transition-colors hover:bg-grey-100">
                        <SelTabelKonten className="text-right font-mono text-xs tabular-nums text-grey-600">{a.peringkatKontrol ? `#${a.peringkatKontrol}` : "—"}</SelTabelKonten>
                        <SelTabelKonten>
                          <div className="flex min-w-0 items-center gap-3">
                            {avatar(a, "h-10 w-10")}
                            <div className="min-w-0">
                              {a.username ? (
                                <a href={a.url || `https://www.chess.com/member/${a.username}`} target="_blank" rel="noreferrer noopener" aria-label={t("beranda.peringkatKlubLihatProfil", { username: namaTampil(a) })} className="font-semibold hover:text-primary hover:underline">
                                  <LabelPemain anggota={a} />
                                </a>
                              ) : <LabelPemain anggota={a} />}
                              <p className="mt-0.5 truncate text-xs text-grey-600">{a.username ? `@${a.username}` : t("beranda.peringkatKlubTanpaUsername")}</p>
                            </div>
                          </div>
                        </SelTabelKonten>
                        <SelTabelKonten className="text-right font-mono font-semibold tabular-nums text-grey-800">{a.ratingAktif ?? <span className="font-sans text-xs font-normal text-grey-600">{hasError ? t("beranda.peringkatKlubDataTidakTersedia") : t("beranda.peringkatKlubBelumAdaRating")}</span>}</SelTabelKonten>
                        <SelTabelKonten className="text-right font-mono text-xs tabular-nums text-grey-600">{dataKontrol?.ada ? `${dataKontrol.win} / ${dataKontrol.draw} / ${dataKontrol.loss}` : "—"}</SelTabelKonten>
                        <SelTabelKonten className="text-right">{a.username ? <a href={a.url || `https://www.chess.com/member/${a.username}`} target="_blank" rel="noreferrer noopener" className="text-xs font-semibold text-primary hover:underline">{t("beranda.peringkatKlubProfil")}</a> : "—"}</SelTabelKonten>
                      </BarisTabelKonten>
                    );
                  })}
                </BadanTabelKonten>
              </TabelKonten>
            </div>
          )}
        </section>

        <p className="mt-4 border-t border-grey-200 pt-4 text-xs leading-5 text-grey-600">{t("beranda.peringkatKlubCatatanRating")}</p>
      </main>
    </div>
  );
}
