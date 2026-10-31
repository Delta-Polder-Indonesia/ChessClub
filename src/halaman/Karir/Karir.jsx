import { useEffect, useMemo, useRef, useState } from "react";
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
import { kodeNegaraTampilan } from "../../lib/kodeNegara.js";
import {
  kenaBan,
  namaTampil,
  opsiKontrol,
  useAnggota,
} from "../../lib/anggotaBersama.js";
import { useKartuPemain } from "../../lib/pemainCatur.js";
import GrafikMiniRating from "../Analisa/komponen/GrafikMiniRating.jsx";
import { muatRiwayatRapid } from "./riwayatRapid.js";
import "./karir.css";

const URL_KLUB = "https://www.chess.com/club/blunder-skuad";
const URUTAN_KONTROL = ["Rapid", "Blitz", "Bullet", "Daily"];
const UKURAN_AVATAR_PERINGKAT = [96, 64, 48];
const KELAS_AVATAR_PERINGKAT = ["h-24 w-24", "h-16 w-16", "h-12 w-12"];
// Hanya bendera yang ditampilkan yang diunduh; SVG kecil tidak di-inline ke JS.
const BENDERA_NEGARA = import.meta.glob("../Analisa/komponen/flags/*.svg", {
  eager: true,
  query: "?url&no-inline",
  import: "default",
});

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
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-grey-800">
      <span className="truncate" title={namaTampil(anggota)}>{namaTampil(anggota)}</span>
      {anggota.terverifikasi && <span className="inline-flex shrink-0"><CentangBiru /></span>}
      {kenaBan(anggota) && <span className="inline-flex shrink-0"><LencanaBan /></span>}
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

// Satu pengamat dipakai seluruh baris, bukan satu IntersectionObserver per anggota.
const pemantauGrafik = new Map();
let pengamatGrafik;

function terlihatTanpaPengamat(elemen) {
  const kotak = elemen.getBoundingClientRect();
  const pembungkusTabel = elemen.closest("table")?.parentElement?.getBoundingClientRect();
  return kotak.bottom > 0 && kotak.top < window.innerHeight && kotak.right > 0 && kotak.left < window.innerWidth
    && (!pembungkusTabel || (kotak.right > pembungkusTabel.left && kotak.left < pembungkusTabel.right));
}

function periksaGrafik() {
  for (const [elemen, ubahTerlihat] of pemantauGrafik) ubahTerlihat(terlihatTanpaPengamat(elemen));
}

function amatiGrafik(elemen, ubahTerlihat) {
  pemantauGrafik.set(elemen, ubahTerlihat);
  if (typeof IntersectionObserver === "undefined") {
    if (pemantauGrafik.size === 1) {
      window.addEventListener("scroll", periksaGrafik, true);
      window.addEventListener("resize", periksaGrafik);
    }
    ubahTerlihat(terlihatTanpaPengamat(elemen));
    return () => {
      pemantauGrafik.delete(elemen);
      if (!pemantauGrafik.size) {
        window.removeEventListener("scroll", periksaGrafik, true);
        window.removeEventListener("resize", periksaGrafik);
      }
    };
  }
  if (!pengamatGrafik) {
    pengamatGrafik = new IntersectionObserver((entri) => {
      for (const item of entri) pemantauGrafik.get(item.target)?.(item.isIntersecting);
    });
  }
  pengamatGrafik.observe(elemen);
  return () => {
    pemantauGrafik.delete(elemen);
    pengamatGrafik.unobserve(elemen);
  };
}

function GrafikRapid({ username, nama, locale, t }) {
  const tempat = useRef(null);
  const [riwayat, setRiwayat] = useState(() => ({ status: username ? "menunggu" : "kosong", nilai: [] }));

  useEffect(() => {
    if (!username || !tempat.current) return undefined;
    let aktif = true;
    let selesai = false;
    let kontrol = null;
    let berhentiMengamati = () => {};
    berhentiMengamati = amatiGrafik(tempat.current, (terlihat) => {
      if (!terlihat) {
        kontrol?.abort();
        kontrol = null;
        return;
      }
      if (kontrol || selesai) return;
      const giliran = new AbortController();
      kontrol = giliran;
      setRiwayat({ status: "memuat", nilai: [] });
      muatRiwayatRapid(username, { signal: giliran.signal })
        .then((nilai) => {
          if (!aktif || giliran.signal.aborted) return;
          selesai = true;
          berhentiMengamati();
          setRiwayat({ status: nilai.length >= 2 ? "siap" : "kosong", nilai });
        })
        .catch(() => {
          if (!aktif || giliran.signal.aborted) return;
          selesai = true;
          berhentiMengamati();
          setRiwayat({ status: "gagal", nilai: [] });
        })
        .finally(() => {
          if (kontrol === giliran) kontrol = null;
        });
    });
    return () => {
      aktif = false;
      berhentiMengamati();
      kontrol?.abort();
    };
  }, [username]);

  let label = t("beranda.peringkatKlubGrafikRapidMemuat", { nama });
  if (riwayat.status === "kosong") label = t("beranda.peringkatKlubGrafikRapidKosong", { nama });
  if (riwayat.status === "gagal") label = t("beranda.peringkatKlubGrafikRapidGagal", { nama });

  if (riwayat.status === "siap") {
    const formatTanggal = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", { dateStyle: "medium" });
    const pertama = riwayat.nilai[0];
    const terakhir = riwayat.nilai.at(-1);
    label = t("beranda.peringkatKlubGrafikRapid", {
      nama,
      jumlah: riwayat.nilai.length,
      dari: formatTanggal.format(new Date(pertama.waktu * 1000)),
      sampai: formatTanggal.format(new Date(terakhir.waktu * 1000)),
      awal: pertama.rating,
      akhir: terakhir.rating,
    });
  }

  return (
    <span ref={tempat} className="inline-flex h-9 w-20 shrink-0 items-center justify-center text-grey-600" title={label}>
      {riwayat.status === "siap" ? (
        <GrafikMiniRating dataUji="grafik-rapid" nilai={riwayat.nilai.map(({ rating }) => rating)} label={label} className="h-9 w-20" />
      ) : <span data-uji="grafik-rapid-status" role="img" aria-label={label}>—</span>}
    </span>
  );
}

export default function Karir() {
  const { anggota, status, menyegarkan, rosterDiperbaruiPada, muatUlang } = useAnggota();
  const { t, bahasa: locale } = useI18n();
  const namaWilayah = useMemo(
    () => typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames([locale], { type: "region" }) : null,
    [locale],
  );
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
  const kartuPemainTeratas = useKartuPemain(pemainTeratas?.username, Boolean(pemainTeratas));
  const kontrolPuncak = kontrol === "utama"
    ? String(pemainTeratas?.kontrol || "Rapid").toLowerCase()
    : kontrol.toLowerCase();
  const rekorSepanjangMasa = kartuPemainTeratas?.peak?.[kontrolPuncak] ?? null;
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
          <div className="grid gap-x-5 gap-y-10 min-[980px]:grid-cols-[auto_minmax(0,1fr)] min-[980px]:items-start">
            <div className="min-w-0">
              <p className="mb-2 font-sans text-sm font-light leading-4 text-grey-600">{t("beranda.peringkatKlubPemainTeratas")}</p>
              <div className="flex min-w-0 items-end gap-4">
                <div className="flex min-w-0 items-end gap-2">
                  {pemainTeratas ? avatar(pemainTeratas, "h-[72px] w-[72px] min-[980px]:h-[108px] min-[980px]:w-[108px]", 108) : <span className="h-[72px] w-[72px] rounded-full border border-grey-200 min-[980px]:h-[108px] min-[980px]:w-[108px]" aria-hidden="true" />}
                  <span className="angka-utama-peringkat font-sans font-medium tracking-tight tabular-nums">{pemainTeratas?.ratingAktif ?? "—"}</span>
                </div>
                <div className="hidden min-w-0 flex-col pb-1 font-sans text-sm font-light leading-4 min-[980px]:flex">
                  {URUTAN_KONTROL.filter((id) => ratingKontrol(pemainTeratas, id) !== null).map((id) => (
                    <p key={id}><span className="text-grey-600">{namaKontrol(id)}</span> <span className="font-light tabular-nums text-grey-800">{ratingKontrol(pemainTeratas, id)}</span></p>
                  ))}
                </div>
              </div>
              {pemainTeratas && <p className="mt-2 truncate text-base font-light leading-6">{namaTampil(pemainTeratas)}</p>}
            </div>
            <div className="flex min-w-0 flex-wrap items-start gap-x-10 gap-y-5 min-[980px]:justify-end">
              <div className="min-w-0">
                <p className="font-sans text-sm font-light leading-4 text-grey-600">{t("beranda.peringkatKlubRekorSepanjangMasa")}</p>
                <p className="angka-fakta-peringkat mt-1 font-sans font-light tabular-nums">{rekorSepanjangMasa ?? "—"}</p>
              </div>
              <div className="min-w-0">
                <p className="font-sans text-sm font-light leading-4 text-grey-600">{t("beranda.peringkatKlubJumlahAnggota")}</p>
                <p className="angka-fakta-peringkat mt-1 font-sans font-light tabular-nums">{anggota.length.toLocaleString(locale === "en" ? "en-US" : "id-ID")}</p>
              </div>
              <div className="min-w-0">
                <p className="font-sans text-sm font-light leading-4 text-grey-600">{t("beranda.peringkatKlubPunyaRating", { kontrol: namaKontrol(kontrol) })}</p>
                <p className="angka-fakta-peringkat mt-1 font-sans font-light tabular-nums">{jumlahBerperingkat.toLocaleString(locale === "en" ? "en-US" : "id-ID")}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-0 mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] text-balance text-grey-800">{judul}</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-grey-600">
            {menyegarkan && <span role="status">{t("beranda.peringkatMenyegarkan")}</span>}
            <AksiKonten variant="sekunder" onClick={muatUlang} disabled={menyegarkan}>{menyegarkan ? t("beranda.peringkatMenyegarkan") : t("beranda.muatUlang")}</AksiKonten>
          </div>
        </div>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 font-sans text-sm font-light leading-4 text-grey-600">
          <span>{t("beranda.peringkatKlubDiperbaruiJudul")}</span>
          <TanggalRoster tanggal={rosterDiperbaruiPada} locale={locale} t={t} />
        </p>
        <section className="mt-10 border-t border-grey-200" aria-label={judul}>
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
              <TabelKonten className="min-w-[760px] text-left">
                <KepalaTabelKonten className="border-b border-grey-200 bg-transparent">
                  <tr>
                    <JudulKolomKonten scope="col" className="w-64">{t("beranda.peringkatKlubKolUrutanRating")}</JudulKolomKonten>
                    <JudulKolomKonten scope="col">{t("beranda.peringkatKlubKolPemain")}</JudulKolomKonten>
                    <JudulKolomKonten scope="col" className="w-48 text-right">{t("beranda.peringkatKlubKolRekor")}</JudulKolomKonten>
                    <JudulKolomKonten scope="col" className="w-24 text-right">{t("beranda.peringkatKlubKolPuncak")}</JudulKolomKonten>
                  </tr>
                </KepalaTabelKonten>
                <BadanTabelKonten className="divide-y divide-grey-200">
                  {hasil.map((a, indeks) => {
                    const opsi = opsiKontrol(a);
                    const dataKontrol = opsi.find((item) => item.id === (kontrol === "utama" ? "all" : kontrol));
                    const kontrolPuncakBaris = kontrol === "utama" ? (a.kontrol || "Rapid") : kontrol;
                    const dataPuncak = opsi.find((item) => item.id === kontrolPuncakBaris);
                    const ukuranAvatar = UKURAN_AVATAR_PERINGKAT[indeks] ?? 40;
                    const kelasAvatar = KELAS_AVATAR_PERINGKAT[indeks] ?? "h-10 w-10";
                    const paddingPemain = indeks === 0 ? "pt-5 pb-5" : indeks < 3 ? "pt-3 pb-3" : "py-2";
                    const kodeNegara = typeof a.negara === "string" ? a.negara.trim().toUpperCase() : "";
                    const kodeTampil = kodeNegaraTampilan(kodeNegara);
                    const bendera = kodeTampil && BENDERA_NEGARA[`../Analisa/komponen/flags/${kodeNegara.toLowerCase()}.svg`];
                    const namaNegara = kodeTampil && !kodeNegara.includes("-")
                      ? namaWilayah?.of(kodeNegara) || kodeTampil
                      : kodeTampil;
                    return (
                      <BarisTabelKonten key={a.username || a.playerId || namaTampil(a)} className="transition-colors hover:bg-grey-100">
                        <SelTabelKonten>
                          <div className={`flex items-end ${kontrol === "Rapid" ? "gap-3" : "gap-4"}`}>
                            <span className="w-6 shrink-0 text-right font-sans text-base font-light tabular-nums text-grey-600">{a.peringkatKontrol ?? "—"}</span>
                            {kontrol === "Rapid" && (
                              <GrafikRapid
                                key={a.ratingAktif === null ? "kosong" : a.username || "kosong"}
                                username={a.ratingAktif === null ? null : a.username}
                                nama={namaTampil(a)}
                                locale={locale}
                                t={t}
                              />
                            )}
                            <span className="angka-rating-tabel font-sans font-light tabular-nums">{a.ratingAktif ?? "—"}</span>
                          </div>
                        </SelTabelKonten>
                        <SelTabelKonten className={paddingPemain}>
                          <div className="flex min-w-96 items-center gap-2">
                            <span className="flex w-24 shrink-0 justify-center">
                              {avatar(a, kelasAvatar, ukuranAvatar)}
                            </span>
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <div className="min-w-0 max-w-40 flex-1 sm:max-w-64">
                                {a.username ? (
                                  <a href={a.url || `https://www.chess.com/member/${a.username}`} target="_blank" rel="noreferrer noopener" aria-label={t("beranda.peringkatKlubLihatProfil", { username: namaTampil(a) })} className="block h-6 font-light hover:text-primary hover:underline">
                                    <LabelPemain anggota={a} />
                                  </a>
                                ) : <LabelPemain anggota={a} />}
                                <p className="truncate text-sm leading-4 text-grey-600" title={a.username ? `@${a.username}` : undefined}>{a.username ? `@${a.username}` : t("beranda.peringkatKlubTanpaUsername")}</p>
                              </div>
                              <div className="w-24 shrink-0 text-sm leading-4 text-grey-600">
                                {/* Menahan label pembaca layar di dalam area gulir tabel. */}
                                <p className="relative flex h-6 items-center gap-1">
                                  <span className="sr-only">{t("beranda.peringkatKlubNegara")}: </span>
                                  {bendera && <img src={bendera} alt={t("beranda.peringkatKlubBendera", { negara: namaNegara })} width={24} height={16} loading="lazy" className="h-4 w-6 shrink-0 object-contain ring-1 ring-grey-200" />}
                                  <span>{kodeTampil || "—"}</span>
                                </p>
                                <p>{t("beranda.peringkatKlubUmur")}: —</p>
                              </div>
                            </div>
                          </div>
                        </SelTabelKonten>
                        <SelTabelKonten className="text-right tabular-nums text-grey-600">{dataKontrol?.ada ? `${dataKontrol.win} / ${dataKontrol.draw} / ${dataKontrol.loss}` : "—"}</SelTabelKonten>
                        <SelTabelKonten className="text-right tabular-nums text-grey-600">{dataPuncak?.puncak ?? "—"}</SelTabelKonten>
                      </BarisTabelKonten>
                    );
                  })}
                </BadanTabelKonten>
              </TabelKonten>
            </div>
          )}
        </section>
        <p className="mt-4 border-t border-grey-200 pt-4 text-xs leading-5 text-grey-600">{t("beranda.peringkatKlubCatatanRating")} {t("beranda.peringkatKlubCatatanNegara")}</p>
      </main>
    </div>
  );
}
