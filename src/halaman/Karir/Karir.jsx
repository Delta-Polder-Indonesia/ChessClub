import { useMemo, useState } from "react";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import { BreadcrumbJsonLd } from "../../components/JsonLd.jsx";
import Hero from "../../components/Hero.jsx";
import { Search } from "lucide-react";
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

function avatar(anggota, kelas = "h-12 w-12", ukuran = 48) {
  if (anggota.foto) {
    return (
      <img
        src={anggota.foto}
        alt={namaTampil(anggota)}
        width={ukuran}
        height={ukuran}
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

function LabelPemain({ anggota }) {
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
    if (cakupan === "tanpa-rating" && a.ratingAktif !== null) return false;
    if (!kunciCari) return true;
    return namaTampil(a).toLocaleLowerCase().includes(kunciCari)
      || String(a.username || "").toLocaleLowerCase().includes(kunciCari);
  });

  const namaKontrol = (id) => id === "utama" ? t("beranda.peringkatKlubUtama") : id;
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
        <section aria-label={t("beranda.peringkatKlubPemainTeratas")} className="mt-8 text-grey-800">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0">
              <p className="mb-3 text-sm text-grey-600">{t("beranda.peringkatKlubPemainTeratas")}</p>
              <div className="flex min-w-0 items-start gap-5 sm:gap-6">
                <div className="flex w-[108px] shrink-0 flex-col items-center">
                  {pemainTeratas ? avatar(pemainTeratas, "h-[108px] w-[108px]", 108) : <span className="h-[108px] w-[108px] rounded-full border border-grey-200" aria-hidden="true" />}
                  <span className="mt-2 font-sans text-3xl font-light leading-none tabular-nums">{pemainTeratas?.ratingAktif ?? "—"}</span>
                </div>
                <div className="min-w-0 pt-1">
                  <div className="space-y-2 text-sm leading-5">
                    {URUTAN_KONTROL.filter((id) => ratingKontrol(pemainTeratas, id) !== null).map((id) => (
                      <p key={id}><span className="text-grey-600">{namaKontrol(id)}</span> <span className="font-semibold tabular-nums text-grey-800">{ratingKontrol(pemainTeratas, id)}</span></p>
                    ))}
                  </div>
                  {pemainTeratas && <p className="mt-4 break-words text-base font-semibold">{namaTampil(pemainTeratas)}</p>}
                </div>
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 lg:gap-x-7">
              <div className="min-w-0">
                <p className="font-sans text-sm leading-5 text-grey-600">{t("beranda.peringkatKlubJumlahAnggota")}</p>
                <p className="mt-1 font-sans text-4xl font-normal leading-none tabular-nums">{anggota.length.toLocaleString(locale === "en" ? "en-US" : "id-ID")}</p>
              </div>
              <div className="min-w-0">
                <p className="font-sans text-sm leading-5 text-grey-600">{t("beranda.peringkatKlubPunyaRating", { kontrol: namaKontrol(kontrol) })}</p>
                <p className="mt-1 font-sans text-4xl font-normal leading-none tabular-nums">{jumlahBerperingkat.toLocaleString(locale === "en" ? "en-US" : "id-ID")}</p>
              </div>
              <div className="min-w-0">
                <p className="font-sans text-sm leading-5 text-grey-600">{t("beranda.peringkatKlubPilihKontrol")}</p>
                <p className="mt-1 font-sans text-base leading-5">{namaKontrol(kontrol)}</p>
              </div>
              <div className="min-w-0">
                <p className="font-sans text-sm leading-5 text-grey-600">{t("beranda.peringkatKlubDiperbaruiJudul")}</p>
                <p className="mt-1 font-sans text-sm leading-5 text-grey-600"><TanggalRoster tanggal={rosterDiperbaruiPada} locale={locale} t={t} /></p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-0 mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] text-balance text-grey-800">{judul}</h2>
            <p className="mt-2 text-sm text-grey-600">{t("beranda.peringkatJumlah", { jumlah: hasil.length })}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-grey-600">
            {menyegarkan && <span role="status">{t("beranda.peringkatMenyegarkan")}</span>}
            <AksiKonten variant="sekunder" onClick={muatUlang} disabled={menyegarkan}>{menyegarkan ? t("beranda.peringkatMenyegarkan") : t("beranda.muatUlang")}</AksiKonten>
          </div>
        </div>
        <section className="mt-8 border-t border-grey-200" aria-label={judul}>
          <div className="border-y border-grey-200 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-2" role="group" aria-label={t("beranda.peringkatKlubPilihKontrol")}>
                  {["Blitz", "Rapid", "utama"].map((opsi) => (
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
                <select aria-label={t("beranda.peringkatKlubPilihKontrol")} value={["Bullet", "Daily"].includes(kontrol) ? kontrol : ""} onChange={(event) => event.target.value && setKontrol(event.target.value)} className="h-10 w-[132px] border border-grey-400 bg-transparent px-3 text-sm text-grey-800">
                  <option value="">{t("beranda.peringkatKlubKontrolLainnya")}</option>
                  <option value="Bullet">Bullet</option>
                  <option value="Daily">Daily</option>
                </select>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t("beranda.peringkatKlubPilihCakupan")}>
                  {[
                    ["berperingkat", t("beranda.peringkatKlubHanyaRating")],
                    ["tanpa-rating", t("beranda.peringkatKlubTanpaRating")],
                    ["semua", t("beranda.peringkatKlubSemua")],
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
              <label className="flex h-10 w-full items-center gap-3 border border-grey-400 px-3 sm:w-60 xl:w-60">
                <input type="search" value={cari} onChange={(event) => setCari(event.target.value)} placeholder={t("beranda.peringkatKlubCariPlaceholder")} className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm text-grey-800 outline-none placeholder:text-grey-600 focus:ring-0" />
                <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="sr-only">{t("beranda.peringkatKlubCari")}</span>
              </label>
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
            <div className="overflow-x-auto">
              <TabelKonten className="min-w-[760px] text-left font-sans text-sm text-grey-800">
                <KepalaTabelKonten className="border-b border-grey-200 bg-transparent text-sm font-normal text-grey-600">
                  <tr>
                    <JudulKolomKonten scope="col" className="w-64">{t("beranda.peringkatKlubKolUrutanRating")}</JudulKolomKonten>
                    <JudulKolomKonten scope="col">{t("beranda.peringkatKlubKolPemain")}</JudulKolomKonten>
                    <JudulKolomKonten scope="col" className="w-48 text-right">{t("beranda.peringkatKlubKolRekor")}</JudulKolomKonten>
                    <JudulKolomKonten scope="col" className="w-24 text-right">{t("beranda.peringkatKlubProfil")}</JudulKolomKonten>
                  </tr>
                </KepalaTabelKonten>
                <BadanTabelKonten className="divide-y divide-grey-200">
                  {hasil.map((a) => {
                    const dataKontrol = opsiKontrol(a).find((opsi) => opsi.id === (kontrol === "utama" ? "all" : kontrol));
                    return (
                      <BarisTabelKonten key={a.username || a.playerId || namaTampil(a)} className="transition-colors hover:bg-grey-100">
                        <SelTabelKonten>
                          <div className="flex items-center gap-4">
                            <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-grey-600">{a.peringkatKontrol ?? "—"}</span>
                            <span className="font-sans text-2xl font-light tabular-nums">{a.ratingAktif ?? "—"}</span>
                          </div>
                        </SelTabelKonten>
                        <SelTabelKonten>
                          <div className="flex min-w-0 items-center gap-3">
                            {avatar(a, "h-12 w-12")}
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
                        <SelTabelKonten className="text-right font-mono text-sm tabular-nums text-grey-600">{dataKontrol?.ada ? `${dataKontrol.win} / ${dataKontrol.draw} / ${dataKontrol.loss}` : "—"}</SelTabelKonten>
                        <SelTabelKonten className="text-right">{a.username ? <a href={a.url || `https://www.chess.com/member/${a.username}`} target="_blank" rel="noreferrer noopener" className="font-semibold text-primary hover:underline">{t("beranda.peringkatKlubProfil")}</a> : "—"}</SelTabelKonten>
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
