/**
 * Layar "Wawasan" — dashboard profil pemain.
 *
 * Menampilkan ringkasan performa: KPI, grafik tren rating, distribusi
 * hasil, pembukaan teratas, dan ringkasan akurasi. Data diambil dari
 * IndexedDB partai tersimpan via `ambilDaftarPartai`.
 *
 * Adaptasi dari fitur Profile Insights ChessGameReviewer — semua logika
 * agregasi ada di `mesin/wawasan.js`, komponen ini hanya merender.
 */
import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import { hashPgn } from "../../../../lib/pgnRingan.js";
import { segarkanKartuPemain, useKartuPemain } from "../../../../lib/pemainCatur.js";
import { AnalyzeContext } from "../../konteks/analyzeKonteks.js";
import { ambilDaftarPartai, ambilSemuaKoleksi } from "../../basisData.js";
import { bacaDaftarAkun } from "../../akun/daftarAkun.js";
import DashboardAkun from "../../akun/DashboardAkun.jsx";
import DaftarPembukaanAkun, { BarHasil } from "../../akun/DaftarPembukaanAkun.jsx";
import { agregasiWawasan, filterPartaiWawasan, hitungPembukaanTeratas } from "../../mesin/wawasan.js";
import { ambilPetaAnalisis, langgananAnalisis } from "../../mesin/analisisTersimpan.js";
import { akurasiMove, kerugianMove, pemainDariEntri, rataHarmonik, cpBaku, nilaiGrafikCp } from "../../mesin/akurasi.js";
import Refresh from "../svg/refresh.jsx";
import PanelLayar from "./PanelLayar.jsx";
import SelectDaftar from "./SelectDaftar.jsx";

const BENDERA = import.meta.glob("../flags/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

const OPSI_WAKTU = [
  { nilai: "all", kunci: "analisa.wawasan.filterSemua" },
  { nilai: "bullet", label: "Bullet" },
  { nilai: "blitz", label: "Blitz" },
  { nilai: "rapid", label: "Rapid" },
  { nilai: "daily", label: "Daily" },
];

const OPSI_WARNA = [
  { nilai: "all", kunci: "analisa.wawasan.filterKeduaWarna" },
  { nilai: "white", kunci: "analisa.wawasan.sebagaiPutih" },
  { nilai: "black", kunci: "analisa.wawasan.sebagaiHitam" },
];

const OPSI_TANGGAL = [
  { nilai: "all", kunci: "analisa.wawasan.filterSemuaWaktu" },
  { nilai: "30d", kunci: "analisa.wawasan.filter30Hari" },
  { nilai: "90d", kunci: "analisa.wawasan.filter90Hari" },
  { nilai: "365d", kunci: "analisa.wawasan.filter1Tahun" },
];

const TAB_RINGKASAN_PERINGKAT_AKUN = ["overview", "ratings"];

const KELAS_RATING = [
  { kunci: "rapid", label: "Rapid" },
  { kunci: "blitz", label: "Blitz" },
  { kunci: "bullet", label: "Bullet" },
  { kunci: "classical", label: "Classical" },
  { kunci: "daily", label: "Daily" },
];

export default function LayarWawasan() {
  const { t, bahasa: locale } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const [akun] = analyzeContext.akun;
  const platform = akun?.platform === "lichessOrg" ? "lichessOrg" : "chessCom";
  const username = String(akun?.username || "").trim();

  const [akunTersimpan] = useState(bacaDaftarAkun);
  const [koleksi, setKoleksi] = useState([]);
  const [semuaPartai, setSemuaPartai] = useState([]);
  const [filterWaktu, setFilterWaktu] = useState("all");
  const [filterWarna, setFilterWarna] = useState("all");
  const [filterTanggal, setFilterTanggal] = useState("all");
  const [muat, setMuat] = useState(false);
  const [galatMuat, setGalatMuat] = useState(false);
  const permintaanPartai = useRef(0);

  const partai = semuaPartai;

  useEffect(() => {
    let hidup = true;
    ambilSemuaKoleksi().then((list) => {
      if (hidup) setKoleksi(list);
    }).catch(() => {
      if (hidup) setKoleksi([]);
    });
    return () => { hidup = false; };
  }, []);

  const muatPartai = useCallback(async () => {
    const idPermintaan = ++permintaanPartai.current;
    if (!username) {
      setSemuaPartai([]);
      setGalatMuat(false);
      setMuat(false);
      return;
    }

    setMuat(true);
    setGalatMuat(false);
    try {
      const { partai: daftar } = await ambilDaftarPartai({
        koleksiId: `${platform}:${username.toLowerCase()}`,
        // Daily mencakup juga "correspondence" dari Lichess, jadi
        // kueri IndexedDB tidak boleh memangkasnya sebelum filter domain berjalan.
        timeClass: filterWaktu === "all" || filterWaktu === "daily" ? "" : filterWaktu,
        limit: 0,
        sertakanPgn: true,
        urut: "tanggal",
        arah: "desc",
      });
      if (idPermintaan === permintaanPartai.current) {
        setSemuaPartai(Array.isArray(daftar) ? daftar : []);
      }
    } catch {
      if (idPermintaan === permintaanPartai.current) setGalatMuat(true);
    } finally {
      if (idPermintaan === permintaanPartai.current) setMuat(false);
    }
  }, [username, platform, filterWaktu]);

  useEffect(() => {
    muatPartai();
  }, [muatPartai]);

  /*
   * Hasil analisis engine sesi ini (padanan prop `analysisMap` di acuan:
   * `analysisMap={state.analysis.resultsByGameId ?? {}}`). Peta di modul
   * `analisisTersimpan.js` dikunci dengan HASH TEKS PGN karena papan analisa
   * hanya menerima teks PGN, bukan id basis data; di sini kunci itu
   * diterjemahkan menjadi `p.id` supaya `hitungTaktikal` bisa memakai id
   * partai seperti acuan memakai `game.id`.
   *
   * `petaSesi` diisi ulang oleh langganan: menganalisis satu partai di papan
   * lalu kembali ke layar Wawasan harus langsung terlihat tanpa muat ulang.
   */
  const [petaSesi, setPetaSesi] = useState(ambilPetaAnalisis);
  useEffect(() => langgananAnalisis(() => setPetaSesi(ambilPetaAnalisis())), []);

  const petaAnalisis = useMemo(() => {
    if (Object.keys(petaSesi).length === 0) return {};
    const peta = {};
    for (const p of partai) {
      if (!p?.id || !p?.pgn) continue;
      const hasil = petaSesi[hashPgn(p.pgn)];
      if (hasil) peta[p.id] = hasil;
    }
    return peta;
  }, [partai, petaSesi]);

  const filter = useMemo(() => ({
    timeClass: filterWaktu,
    color: filterWarna,
    dateRange: filterTanggal,
  }), [filterWaktu, filterWarna, filterTanggal]);

  /* Label cadangan nama pembukaan diisi dari kamus, bukan hardcode: rantai
     `[Opening] → [ECOUrl] → Opening <ECO> → tidak diketahui` milik acuan
     memakai teks Inggris, di sini teksnya mengikuti bahasa antarmuka. */
  const labelPembukaan = useMemo(() => ({
    dariEco: (eco) => t("analisa.wawasan.pembukaan.dariEco", { eco }),
    tidakDiketahui: t("analisa.wawasan.pembukaan.tidakDiketahui"),
  }), [t]);

  const wawasan = useMemo(() => {
    if (!username || !partai.length) return null;
    return agregasiWawasan(partai, username, filter, petaAnalisis, labelPembukaan);
  }, [partai, username, filter, petaAnalisis, labelPembukaan]);

  /*
   * Seluruh partai akun tersimpan yang lolos filter Kecepatan + Rentang Wawasan.
   * Dipakai bersama oleh kartu Ringkasan & Peringkat (`DashboardAkun`) serta
   * Pembukaan Teratas (`KartuPembukaanTeratas`) agar seluruh kartu terintegrasi
   * dengan satu bilah filter Wawasan tanpa kontrol waktu/rentang terpisah.
   */
  const partaiAkunDifilter = useMemo(() => {
    if (!username || !semuaPartai.length) return [];
    return filterPartaiWawasan(semuaPartai, filter);
  }, [semuaPartai, username, filter]);

  const pembukaanAkun = useMemo(() => {
    if (!username || !partaiAkunDifilter.length) {
      return { rekapAkun: { putih: [], hitam: [] }, putih: [], hitam: [] };
    }

    const putih = hitungPembukaanTeratas(partaiAkunDifilter, username, "white", Infinity, labelPembukaan);
    const hitam = hitungPembukaanTeratas(partaiAkunDifilter, username, "black", Infinity, labelPembukaan);
    const keRekapAkun = (daftar) => {
      const total = daftar.reduce((jumlah, pembukaan) => jumlah + pembukaan.played, 0);
      return daftar.map((pembukaan) => ({
        nama: pembukaan.name,
        jumlah: pembukaan.played,
        persen: total > 0 ? Math.round((pembukaan.played / total) * 1000) / 10 : 0,
        w: pembukaan.wins,
        d: pembukaan.draws,
        l: pembukaan.losses,
      }));
    };

    return {
      rekapAkun: { putih: keRekapAkun(putih), hitam: keRekapAkun(hitam) },
      putih,
      hitam,
    };
  }, [partaiAkunDifilter, username, labelPembukaan]);

  /*
   * Cakupan filter warna memang terbatas pada KPI win rate + distribusi hasil.
   * Tren rating, akurasi/taktik, total partai, dan tab pembukaan tetap
   * memakai kedua warna. Label UI menyebut "Warna hasil" agar kontrol ini
   * tidak memberi kesan bahwa semua metrik ikut terfilter.
   */
  const wawasanTampil = useMemo(() => {
    if (!wawasan) return null;
    if (filterWarna === "all") return wawasan;
    return {
      ...wawasan,
      hasilUmum: filterWarna === "white" ? wawasan.sebagaiPutih : wawasan.sebagaiHitam,
      sebagaiPutih: filterWarna === "white" ? wawasan.sebagaiPutih : { wins: 0, losses: 0, draws: 0, total: 0, winRate: 0 },
      sebagaiHitam: filterWarna === "black" ? wawasan.sebagaiHitam : { wins: 0, losses: 0, draws: 0, total: 0, winRate: 0 },
    };
  }, [wawasan, filterWarna]);

  /*
   * Hanya kecepatan dan rentang tanggal yang bisa mengosongkan hasil —
   * filter warna tidak memotong daftar partai (lihat catatan wawasanTampil).
   * Dipakai untuk membedakan "belum ada partai tersimpan" dari "filter tidak
   * menemukan partai", persis dua keadaan kosong yang dibedakan acuan.
   */
  const filterMenyempit = filterWaktu !== "all" || filterTanggal !== "all";

  function aturUlangFilter() {
    setFilterWaktu("all");
    setFilterWarna("all");
    setFilterTanggal("all");
  }

  const daftarAkun = useMemo(() => {
    const unik = new Map();
    for (const a of [...akunTersimpan, ...koleksi, akun]) {
      const uname = String(a?.username || "").trim();
      if (!uname || !["chessCom", "lichessOrg"].includes(a?.platform)) continue;
      unik.set(`${a.platform}:${uname.toLowerCase()}`, { platform: a.platform, username: uname });
    }
    return [...unik.values()];
  }, [akunTersimpan, koleksi, akun]);

  const akunSitus = daftarAkun.filter((a) => a.platform === platform);

  function pilihSitus(situsBaru) {
    const pertama = daftarAkun.find((a) => a.platform === situsBaru);
    analyzeContext.akun[1]({ platform: situsBaru, username: pertama?.username || "" });
  }

  function pilihAkun(kunci) {
    const kunciKecil = String(kunci || "").toLowerCase();
    const pilihan = akunSitus.find((a) => a.username.toLowerCase() === kunciKecil);
    analyzeContext.akun[1]({ platform, username: pilihan?.username || "" });
  }

  return (
    <PanelLayar>
      <div className="flex min-h-0 w-full flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <span className="text-xl font-bold text-foreground">{t("analisa.wawasan.judul")}</span>
          <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.wawasan.deskripsi")}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-uji="wawasan-baris-akun">
          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-xs font-bold text-foregroundGrey">{t("analisa.statistik.situs")}</label>
            <SelectDaftar
              labelTeks={t("analisa.statistik.situs")}
              dataUji="wawasan-situs"
              nilai={platform}
              opsi={[
                { nilai: "chessCom", label: "Chess.com" },
                { nilai: "lichessOrg", label: "Lichess.org" },
              ]}
              onPilih={pilihSitus}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-xs font-bold text-foregroundGrey">{t("analisa.wawasan.pilihAkun")}</label>
            <SelectDaftar
              labelTeks={t("analisa.wawasan.pilihAkun")}
              dataUji="wawasan-akun"
              nilai={username}
              opsi={[
                { nilai: "", label: "—" },
                ...akunSitus.map((a) => ({ nilai: a.username, label: a.username })),
              ]}
              onPilih={pilihAkun}
            />
          </div>
        </div>

        {username ? (
          <KartuProfilWawasan
            key={`${platform}:${username.toLowerCase()}`}
            username={username}
            platform={platform}
            t={t}
            locale={locale}
          />
        ) : null}

        {!username ? (
          <div className="flex flex-col items-center gap-2 rounded-borderRoundness border border-dashed border-border bg-backgroundBox p-8">
            <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.pilihAkunPetunjuk")}</p>
          </div>
        ) : muat ? (
          <div className="flex flex-col items-center gap-2 rounded-borderRoundness border border-border bg-backgroundBox p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-foregroundGrey border-t-backgroundBoxBoxHighlighted" />
            <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.memuat")}</p>
          </div>
        ) : galatMuat ? (
          <div className="flex flex-col items-center gap-3 rounded-borderRoundness border border-dashed border-border bg-backgroundBox p-8" role="alert">
            <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.galatMuatPartai")}</p>
            <button
              type="button"
              onClick={muatPartai}
              className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted hover:text-foregroundBlackDark"
            >
              {t("analisa.wawasan.cobaMuatLagi")}
            </button>
          </div>
        ) : (
          <>
            {partai.length > 0 || filterMenyempit ? (
              <FilterBar
                filterWaktu={filterWaktu}
                filterWarna={filterWarna}
                filterTanggal={filterTanggal}
                onWaktu={setFilterWaktu}
                onWarna={setFilterWarna}
                onTanggal={setFilterTanggal}
                t={t}
              />
            ) : null}

            {!wawasanTampil || wawasanTampil.totalPartai === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-borderRoundness border border-dashed border-border bg-backgroundBox p-8">
                <p className="text-sm text-foregroundGrey">
                  {filterMenyempit
                    ? t("analisa.wawasan.tanpaHasilFilter")
                    : t("analisa.wawasan.tanpaPartai")}
                </p>
                {filterMenyempit ? (
                  <button
                    type="button"
                    onClick={aturUlangFilter}
                    className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted hover:text-foregroundBlackDark"
                  >
                    {t("analisa.wawasan.aturUlangFilter")}
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                {/* KPI Grid */}
                <KpiGrid wawasan={wawasanTampil} t={t} />

                {/* Dashboard 2 kolom */}
                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                  <div className="flex min-h-0 min-w-0 flex-col gap-4">
                    <GrafikTrenRating points={wawasanTampil.trenRating} t={t} />
                    <DistribusiHasil
                      umum={wawasanTampil.hasilUmum}
                      putih={wawasanTampil.sebagaiPutih}
                      hitam={wawasanTampil.sebagaiHitam}
                      t={t}
                    />
                    <KartuAkurasiPartai moves={analyzeContext.game[0]} players={analyzeContext.players[0]} />
                  </div>
                  <div className="flex min-h-0 min-w-0 flex-col gap-4">
                    <DashboardAkun
                      platform={platform}
                      username={username}
                      daftarTab={TAB_RINGKASAN_PERINGKAT_AKUN}
                      sebagaiKartu
                      partaiLuar={partaiAkunDifilter}
                    />
                    <KartuPembukaanTeratas
                      rekapAkun={pembukaanAkun.rekapAkun}
                      putih={pembukaanAkun.putih}
                      hitam={pembukaanAkun.hitam}
                      t={t}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PanelLayar>
  );
}

/* ============================================================ Sub-komponen */

function formatTanggalGabung(detik, locale) {
  if (!Number.isFinite(detik) || detik <= 0) return null;
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" })
      .format(new Date(detik * 1000));
  } catch {
    return null;
  }
}

function KartuProfilWawasan({ username, platform, t, locale }) {
  const kartuApi = useKartuPemain(username, !!username, platform);
  /*
   * Hasil muat ulang disimpan terpisah agar tidak ditimpa respons awal hook
   * yang mungkin baru tiba setelah refresh. `undefined` = belum ada override.
   */
  const [kartuUlang, setKartuUlang] = useState(undefined);
  const [memuat, setMemuat] = useState(false);
  const hidup = useRef(true);

  useEffect(() => {
    hidup.current = true;
    return () => {
      hidup.current = false;
    };
  }, []);

  async function muatUlang() {
    if (!username || memuat) return;
    setMemuat(true);
    try {
      const baru = await segarkanKartuPemain(username, platform);
      /* Ikuti acuan: kegagalan fetch mempertahankan profil yang sudah ada. */
      if (hidup.current && baru) setKartuUlang(baru);
    } catch {
      /* pertahankan kartu lama; API publik bisa gagal sementara */
    } finally {
      if (hidup.current) setMemuat(false);
    }
  }

  const kartu = kartuUlang !== undefined ? kartuUlang : kartuApi;
  const nama = String(kartu?.name || username).trim();
  const inisial = (nama || "?").slice(0, 1).toUpperCase();
  const negara = kartu?.country || (kartu?.flag ? kartu.flag.toUpperCase() : null);
  const kodeBendera = String(kartu?.flag || negara || "").trim().toLowerCase();
  const sumberBendera = kodeBendera ? BENDERA[`../flags/${kodeBendera}.svg`] : null;
  const srcBendera = typeof sumberBendera === "string" ? sumberBendera : null;
  const bergabung = formatTanggalGabung(kartu?.joined, locale);

  return (
    <section
      className="wawasan-card flex flex-col gap-4"
      data-uji="wawasan-profil"
      aria-label={t("analisa.wawasan.profilJudul")}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-backgroundBoxBox">
          {kartu?.avatar ? (
            <img
              className="h-full w-full object-cover"
              width={56}
              height={56}
              src={kartu.avatar}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span aria-hidden="true" className="text-lg font-bold text-foregroundGrey">{inisial}</span>
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-lg font-bold text-foreground">{nama}</span>
            {kartu?.title ? (
              <span className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-1.5 py-0.5 font-mono text-[0.65rem] font-bold text-backgroundBoxBoxHighlighted">
                {kartu.title}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foregroundGrey">
            <span className="truncate font-mono">@{username}</span>
            {negara ? (
              <span className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border px-1.5 py-0.5 font-mono text-[0.65rem] font-bold">
                {srcBendera ? (
                  <img
                    src={srcBendera}
                    alt=""
                    width={16}
                    height={12}
                    className="h-3 w-4 shrink-0 rounded-[2px] object-cover ring-1 ring-black/20"
                    loading="lazy"
                  />
                ) : null}
                {negara}
              </span>
            ) : null}
            {bergabung ? (
              <span>{t("analisa.wawasan.profilBergabung", { tanggal: bergabung })}</span>
            ) : null}
            {kartu?.status ? (
              <span className="rounded-borderRoundness border border-border px-1.5 py-0.5 text-[0.65rem] font-bold capitalize">
                {kartu.status}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={muatUlang}
          disabled={memuat}
          aria-label={t("analisa.wawasan.profilMuatUlang")}
          title={memuat ? t("analisa.wawasan.profilMemuat") : t("analisa.wawasan.profilMuatUlang")}
          aria-busy={memuat}
          data-uji="wawasan-profil-refresh"
          className="ml-auto grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-borderRoundness border border-border text-foregroundGrey transition-colors hover:border-borderHighlighted hover:text-foregroundHighlighted disabled:cursor-wait disabled:opacity-60"
        >
          <Refresh className={`h-4 w-4 ${memuat ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
        role="group"
        aria-label={t("analisa.wawasan.profilRating")}
      >
        {KELAS_RATING.map(({ kunci, label }) => {
          const nilai = kartu?.ratings?.[kunci];
          const puncak = kartu?.peak?.[kunci];
          return (
            <div
              key={kunci}
              className="flex flex-col gap-0.5 rounded-borderRoundness border border-border bg-backgroundBox px-3 py-2"
              data-uji={`wawasan-rating-${kunci}`}
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-wide text-foregroundGrey">{label}</span>
              <span className="font-mono text-lg font-bold tabular-nums text-foreground">{nilai ?? "—"}</span>
              {puncak != null ? (
                <span className="font-mono text-[0.65rem] text-foregroundGrey">
                  {t("analisa.wawasan.profilPuncak", { rating: puncak })}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FilterBar({ filterWaktu, filterWarna, filterTanggal, onWaktu, onWarna, onTanggal, t }) {
  const grup = [
    {
      kunci: "waktu",
      judul: t("analisa.wawasan.filterKecepatan"),
      opsi: OPSI_WAKTU,
      nilai: filterWaktu,
      onPilih: onWaktu,
    },
    {
      kunci: "warna",
      judul: t("analisa.wawasan.filterWarna"),
      opsi: OPSI_WARNA,
      nilai: filterWarna,
      onPilih: onWarna,
    },
    {
      kunci: "tanggal",
      judul: t("analisa.wawasan.filterRentang"),
      opsi: OPSI_TANGGAL,
      nilai: filterTanggal,
      onPilih: onTanggal,
    },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-borderRoundness border border-border bg-backgroundBox px-4 py-2"
      role="toolbar"
      aria-label={t("analisa.wawasan.filterJudul")}
    >
      {grup.map((g) => (
        <div key={g.kunci} className="flex items-center gap-2" role="radiogroup" aria-label={g.judul}>
          <span className="text-xs font-bold text-foregroundGrey">{g.judul}:</span>
          <div className="flex rounded-borderRoundness bg-backgroundBoxBox p-0.5">
            {g.opsi.map((o) => (
              <button
                key={o.nilai}
                type="button"
                role="radio"
                aria-checked={g.nilai === o.nilai}
                onClick={() => g.onPilih(o.nilai)}
                className={`rounded-borderRoundness px-2 py-1 text-xs font-medium transition-colors ${
                  g.nilai === o.nilai
                    ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark font-bold"
                    : "text-foregroundGrey hover:text-foreground"
                }`}
              >
                {o.kunci ? t(o.kunci) : o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiGrid({ wawasan, t }) {
  const streak = wawasan.streak;
  const streakLabel = streak.type === "none" || streak.count === 0
    ? t("analisa.wawasan.tidakAda")
    : `${streak.count} ${t(`analisa.wawasan.streak.${streak.type}`)}`;

  const items = [
    { label: t("analisa.wawasan.kpi.totalPartai"), value: wawasan.totalPartai },
    { label: t("analisa.wawasan.kpi.winRate"), value: `${wawasan.hasilUmum.winRate}%`, accent: true },
    { label: t("analisa.wawasan.kpi.streak"), value: streakLabel },
    { label: t("analisa.wawasan.kpi.akurasi"), value: wawasan.taktikal.avgAccuracy !== null ? `${wawasan.taktikal.avgAccuracy}%` : "N/A" },
    { label: t("analisa.wawasan.kpi.ratingPuncak"), value: wawasan.peakRating !== null ? String(wawasan.peakRating) : "N/A" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5" role="region" aria-label="KPI">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1 rounded-borderRoundness border border-border bg-backgroundBox p-3">
          <span className="text-xs text-foregroundGrey">{item.label}</span>
          <span className={`text-lg font-bold font-mono ${item.accent ? "text-backgroundBoxBoxHighlighted" : "text-foreground"}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function GrafikTrenRating({ points, t }) {
  if (!points || points.length === 0) {
    return (
      <div className="wawasan-card flex h-[300px] min-h-[300px] flex-col">
        <h3 className="wawasan-card-title">{t("analisa.wawasan.trenJudul")}</h3>
        <div className="flex items-center justify-center p-6">
          <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.tanpaDataRating")}</p>
        </div>
      </div>
    );
  }

  const ratings = points.map((p) => p.rating);
  const minR = Math.min(...ratings);
  const maxR = Math.max(...ratings);
  const yMin = Math.floor((minR - 15) / 25) * 25;
  const yMax = Math.ceil((maxR + 15) / 25) * 25;
  const yRange = yMax - yMin || 1;

  const width = 640;
  const height = 240;
  const padLeft = 50, padRight = 20, padTop = 20, padBottom = 35;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const coords = points.map((p, i) => ({
    x: points.length === 1 ? padLeft + plotW / 2 : padLeft + (i / (points.length - 1)) * plotW,
    y: padTop + plotH - ((p.rating - yMin) / yRange) * plotH,
    point: p,
  }));

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPoints =
    `${coords[0].x.toFixed(1)},${(padTop + plotH).toFixed(1)} ` +
    polylinePoints +
    ` ${coords[coords.length - 1].x.toFixed(1)},${(padTop + plotH).toFixed(1)}`;

  const firstRating = points[0].rating;
  const lastRating = points[points.length - 1].rating;
  const delta = lastRating - firstRating;
  const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
  const deltaClass = delta > 0 ? "text-highlightBest" : delta < 0 ? "text-highlightBlunder" : "text-foregroundGrey";
  const midRating = Math.round((yMin + yMax) / 2);

  return (
    <div className="wawasan-card flex h-[300px] min-h-[300px] flex-col">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="wawasan-card-title">{t("analisa.wawasan.trenJudul")}</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-foregroundGrey">
            {t("analisa.wawasan.terkini")}: <strong className="text-foreground">{lastRating}</strong>
          </span>
          <span className={`font-bold font-mono ${deltaClass}`}>{deltaStr}</span>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center overflow-hidden pt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${firstRating} to ${lastRating}`}>
          <defs>
            <linearGradient id="wawasanAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#81b64c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#81b64c" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} className="wawasan-grid" />
          <text x={padLeft - 8} y={padTop + 4} textAnchor="end" className="wawasan-axis-text">{yMax}</text>
          <line x1={padLeft} y1={padTop + plotH / 2} x2={width - padRight} y2={padTop + plotH / 2} className="wawasan-grid" />
          <text x={padLeft - 8} y={padTop + plotH / 2 + 4} textAnchor="end" className="wawasan-axis-text">{midRating}</text>
          <line x1={padLeft} y1={padTop + plotH} x2={width - padRight} y2={padTop + plotH} className="wawasan-grid" />
          <text x={padLeft - 8} y={padTop + plotH + 4} textAnchor="end" className="wawasan-axis-text">{yMin}</text>
          {/* Area fill */}
          <polygon points={areaPoints} fill="url(#wawasanAreaGradient)" />
          {/* Trend line */}
          <polyline points={polylinePoints} fill="none" stroke="#81b64c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Data points */}
           {coords.map((c, i) => (
             <circle key={c.point.gameId || i} cx={c.x} cy={c.y} r={points.length > 50 ? 2 : 3.5} className="wawasan-dot">
               <title>{`${c.point.date ? new Date(c.point.date * 1000).toLocaleDateString() : ""}: ${c.point.rating} (${c.point.result})`}</title>
             </circle>
           ))}
         </svg>
      </div>
    </div>
  );
}

function DistribusiHasil({ umum, putih, hitam, t }) {
  const baris = [
    { label: t("analisa.wawasan.hasil.semua"), counts: umum },
    { label: t("analisa.wawasan.hasil.putih"), counts: putih },
    { label: t("analisa.wawasan.hasil.hitam"), counts: hitam },
  ];

  return (
    <div className="wawasan-card">
      <h3 className="wawasan-card-title">{t("analisa.wawasan.distribusiJudul")}</h3>
      <p className="text-xs text-foregroundGrey">{t("analisa.statistik.totalGame", { total: umum.total })}</p>
      <div className="pt-2">
        <BarHasil w={umum.wins} d={umum.draws} l={umum.losses} tinggi="1.6rem" />
      </div>
      <div className="flex flex-col gap-3 pt-2">
        {baris.map((b) => (
          <BarisHasil key={b.label} label={b.label} counts={b.counts} />
        ))}
      </div>
      <div className="flex gap-4 pt-2 text-xs text-foregroundGrey border-t border-border mt-2">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-highlightBest" /> {t("analisa.wawasan.hasil.menang")}</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-foregroundGrey" /> {t("analisa.wawasan.hasil.seri")}</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-highlightBlunder" /> {t("analisa.wawasan.hasil.kalah")}</span>
      </div>
    </div>
  );
}

function BarisHasil({ label, counts }) {
  const { wins, losses, draws, total, winRate } = counts;
  const winPct = total > 0 ? (wins / total) * 100 : 0;
  const drawPct = total > 0 ? (draws / total) * 100 : 0;
  const lossPct = total > 0 ? (losses / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-xs text-foregroundGrey">
          <strong className="text-highlightBest">{winRate}%</strong> ({wins}M / {draws}S / {losses}K)
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-sm bg-backgroundBoxBox">
        {total === 0 ? (
          <div className="h-full w-full bg-backgroundBoxBox" />
        ) : (
          <>
            {winPct > 0 && <div className="h-full bg-highlightBest transition-[width] duration-300" style={{ width: `${winPct}%` }} />}
            {drawPct > 0 && <div className="h-full bg-foregroundGrey transition-[width] duration-300" style={{ width: `${drawPct}%` }} />}
            {lossPct > 0 && <div className="h-full bg-highlightBlunder transition-[width] duration-300" style={{ width: `${lossPct}%` }} />}
          </>
        )}
      </div>
    </div>
  );
}

export function KartuPembukaanTeratas({
  rekapAkun = { putih: [], hitam: [] },
  putih = [],
  hitam = [],
  t,
}) {
  const [warna, setWarna] = useState("all");
  const daftarAkunPutih = rekapAkun?.putih || [];
  const daftarAkunHitam = rekapAkun?.hitam || [];
  const jumlahSemua = daftarAkunPutih.length + daftarAkunHitam.length;
  const daftarTab = [
    { kunci: "all", label: t("analisa.wawasan.filterSemua"), jumlah: jumlahSemua },
    { kunci: "white", label: t("analisa.wawasan.sebagaiPutih"), jumlah: putih.length, daftar: putih },
    { kunci: "black", label: t("analisa.wawasan.sebagaiHitam"), jumlah: hitam.length, daftar: hitam },
  ];
  const aktif = daftarTab.find((item) => item.kunci === warna) || daftarTab[0];
  const modeSemua = aktif.kunci === "all";
  const openings = modeSemua ? [] : aktif.daftar;
  const kosong = modeSemua ? jumlahSemua === 0 : openings.length === 0;

  return (
    <div className="wawasan-card flex min-h-0 flex-1 flex-col" data-uji="wawasan-pembukaan">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="wawasan-card-title">{t("analisa.wawasan.pembukaanJudul")}</h3>
        <div
          className="flex rounded-borderRoundness bg-backgroundBoxBox p-0.5"
          role="tablist"
          aria-label={t("analisa.wawasan.pembukaanJudul")}
        >
          {daftarTab.map((tab) => {
            const terpilih = aktif.kunci === tab.kunci;
            return (
              <button
                key={tab.kunci}
                type="button"
                role="tab"
                data-uji={`wawasan-pembukaan-tab-${tab.kunci}`}
                aria-selected={terpilih}
                onClick={() => setWarna(tab.kunci)}
                className={`cursor-pointer rounded-borderRoundness px-2 py-1 text-xs font-medium transition-colors ${
                  terpilih
                    ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark font-bold"
                    : "text-foregroundGrey hover:text-foreground"
                }`}
              >
                {tab.label} ({tab.jumlah})
              </button>
            );
          })}
        </div>
      </div>

      {kosong ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.tanpaPembukaan")}</p>
        </div>
      ) : modeSemua ? (
        <div
          data-uji="wawasan-pembukaan-daftar"
          className="mt-2 min-h-0 flex-1"
        >
          <DaftarPembukaanAkun putih={daftarAkunPutih} hitam={daftarAkunHitam} />
        </div>
      ) : (
        <div
          data-uji="wawasan-pembukaan-daftar"
          className="mt-2 max-h-[34rem] min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]"
        >
          <table className="w-full table-fixed text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-backgroundBoxDarker shadow-[inset_0_-1px_0_0_var(--analisa-border)]">
              <tr className="text-foregroundGrey">
                <th className="w-[32%] py-1.5 px-1 text-left font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.nama")}</th>
                <th className="w-[35%] py-1.5 px-1 text-left font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.langkah")}</th>
                <th className="w-[11%] py-1.5 px-0.5 text-right font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.main")}</th>
                <th className="w-[12%] py-1.5 px-1 text-right font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.winRate")}</th>
                <th className="w-[10%] py-1.5 px-1 text-left font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.hasil")}</th>
              </tr>
            </thead>
            <tbody>
              {openings.map((op, idx) => {
                const winPct = op.played > 0 ? (op.wins / op.played) * 100 : 0;
                const drawPct = op.played > 0 ? (op.draws / op.played) * 100 : 0;
                const lossPct = op.played > 0 ? (op.losses / op.played) * 100 : 0;
                return (
                  <tr key={`${op.name}-${idx}`} className="border-b border-border/30">
                    <td className="min-w-0 overflow-hidden py-1 px-1">
                      <div className="flex min-w-0 items-center gap-1">
                        {op.eco && <span className="rounded border border-border bg-backgroundBoxBox px-1 py-0.5 font-mono text-[10px] text-highlightBest font-bold">{op.eco}</span>}
                        <span className="min-w-0 truncate font-semibold text-foreground" title={op.name}>{op.name}</span>
                      </div>
                    </td>
                    <td className="min-w-0 overflow-hidden py-1.5 px-1 font-mono text-[10px] text-foregroundGrey"><span className="block truncate" title={op.moves || "\u2014"}>{op.moves || "\u2014"}</span></td>
                    <td className="py-1 px-0.5 text-right font-mono text-foregroundGrey" title={`${op.played} kali dimainkan`}>{op.played}</td>
                    <td className="py-1 px-0.5 text-right font-mono font-bold text-highlightBest" title={`Win rate: ${op.winRate}%`}>{op.winRate}%</td>
                    <td className="min-w-0 py-1 px-1">
                      <div className="flex h-2 w-full max-w-16 overflow-hidden rounded-sm bg-backgroundBoxBox" title={`Menang ${op.wins}, seri ${op.draws}, kalah ${op.losses}`}>
                        {winPct > 0 && <div className="h-full bg-highlightBest" style={{ width: `${winPct}%` }} />}
                        {drawPct > 0 && <div className="h-full bg-foregroundGrey" style={{ width: `${drawPct}%` }} />}
                        {lossPct > 0 && <div className="h-full bg-highlightBlunder" style={{ width: `${lossPct}%` }} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Kartu "Akurasi & Kesalahan Taktikal" — tiruan `TacticalMistakesCard.tsx`
 * repo acuan ChessGameReviewer, baris demi baris:
 *   1. header: judul + "<n> evaluated moves";
 *   2. banner akurasi: label, angka (`avgAccuracy !== null ? "x%" : "No
 *      evaluations yet"`), dan subteks sumber metode;
 *   3. grid empat pil: Blunders (dengan "<x> / game"), Mistakes, Inaccuracies,
 *      Misses.
 *
 * Angka-angkanya datang dari `hitungTaktikal` (padanan `computeTacticalStats`),
 * jadi kartu ini TIDAK menghitung apa pun sendiri — persis seperti acuan yang
 * hanya merender `TacticalMistakeSummary`.
 */


function KartuAkurasiPartai({ moves, players }) {
  const [mode, setMode] = useState("cp");
  const [hoverIndex, setHoverIndex] = useState(null);
  const idGrafik = useId().replace(/:/g, "");
  const data = useMemo(() => {
    const daftarMoves = Array.isArray(moves) ? moves : [];
    // Pertahankan satu slot per ply, termasuk posisi tanpa evaluasi. Ini
    // menjaga jarak pada sumbu X dan membuat garis terputus pada celah eval,
    // seperti EvalChart en-croissant (`connectNulls={false}`).
    const langkah = daftarMoves.slice(1).map((move, offset) => {
      const index = offset + 1;
      const color = pemainDariEntri(move, index);
      const san = move?.san || move?.move || "";
      const kosong = {
        index,
        color,
        cpPutih: null,
        skorCpPutih: null,
        tipeSkor: null,
        nilaiCpGrafik: null,
        wdlPutih: null,
        accuracy: null,
        acpl: null,
        san,
      };
      const evaluasi = move?.previousStaticEvals?.[0];
      if (!Array.isArray(evaluasi)) return kosong;
      const cp = cpBaku(evaluasi);
      if (!Number.isFinite(cp)) return kosong;

      // Evaluasi UCI dan WDL adalah dari sisi pemain yang sedang jalan pada
      // posisi setelah langkah. 'color' di entri parseMove adalah sisi lawan
      // yang akan jalan; konversi eksplisit ini menjaga orientasi Putih.
      const sisiJalan = move?.color === "w" || move?.color === "b"
        ? move.color
        : (index % 2 === 0 ? "w" : "b");
      const cpPutih = sisiJalan === "w" ? cp : -cp;
      const cpMentah = Number(evaluasi[1]);
      const cpMentahPutih = sisiJalan === "w" ? cpMentah : -cpMentah;
      // EvalChart upstream memetakan mate langsung ke ±Infinity (y = ±1),
      // sedangkan evaluasi CP memakai sigmoid 0.004, bukan CP/1000 linear.
      const cpUntukGrafik = evaluasi[0] === "mate"
        ? (cpPutih > 0 ? Infinity : -Infinity)
        : cpMentahPutih;
      const wdlMentah = move?.kandidat?.find((item) => item?.peringkat === 1)?.wdl
        ?? move?.kandidat?.[0]?.wdl;
      const wdlValid = Array.isArray(wdlMentah)
        && wdlMentah.length === 3
        && wdlMentah.every((nilai) => Number.isFinite(nilai) && nilai >= 0)
        && wdlMentah.reduce((jumlah, nilai) => jumlah + nilai, 0) > 0;
      const wdlPutih = wdlValid
        ? (sisiJalan === "w"
          ? wdlMentah
          : [wdlMentah[2], wdlMentah[1], wdlMentah[0]])
        : null;
      return {
        ...kosong,
        cpPutih: Math.max(-1000, Math.min(1000, cpPutih)),
        skorCpPutih: evaluasi[0] === "mate" ? (sisiJalan === "w" ? Number(evaluasi[1]) : -Number(evaluasi[1])) : cpMentahPutih,
        tipeSkor: evaluasi[0],
        nilaiCpGrafik: nilaiGrafikCp(cpUntukGrafik),
        wdlPutih,
        accuracy: akurasiMove(move),
        acpl: kerugianMove(move),
      };
    });
    return {
      langkah,
      putih: langkah.filter((item) => item.color === "w"),
      hitam: langkah.filter((item) => item.color === "b"),
    };
  }, [moves]);

  const points = data.langkah;
  const titikWdl = points.filter((p) => p.wdlPutih);
  const wdlTersedia = titikWdl.length >= 2;
  const rata = (daftar, kunci) => {
    const nilai = daftar.map((item) => item[kunci]).filter(Number.isFinite);
    return nilai.length ? nilai.reduce((jumlah, angka) => jumlah + angka, 0) / nilai.length : null;
  };
  const format = (nilai) => Number.isFinite(nilai) ? nilai.toFixed(1) : "—";
  const width = 720, height = 190, left = 8, right = 8, top = 8, bottom = 8;
  const plotW = width - left - right, plotH = height - top - bottom;
  const nilaiGrafik = points.map((p) => ({
    ...p,
    nilai: mode === "wdl"
      ? (p.wdlPutih
        ? ((p.wdlPutih[0] + p.wdlPutih[1] / 2) / p.wdlPutih.reduce((a, b) => a + b, 0) - 0.5) * 2
        : null)
      : p.nilaiCpGrafik,
  }));
  const coords = nilaiGrafik.map((p, i) => ({
    ...p,
    x: nilaiGrafik.length < 2 ? width / 2 : left + i / (nilaiGrafik.length - 1) * plotW,
    y: Number.isFinite(p.nilai)
      ? top + (1 - Math.max(-1, Math.min(1, p.nilai))) / 2 * plotH
      : null,
  }));
  // Jangan hubungkan melewati posisi tanpa eval/WDL: upstream mempertahankan
  // node pada sumbu X dan memutus kurva pada nilai yang tidak tersedia.
  const segmen = [];
  let segmenAktif = [];
  for (const point of coords) {
    if (!Number.isFinite(point.y)) {
      if (segmenAktif.length) segmen.push(segmenAktif);
      segmenAktif = [];
      continue;
    }
    segmenAktif.push(point);
  }
  if (segmenAktif.length) segmen.push(segmenAktif);
  const pathLine = segmen.map((bagian) => bagian
    .map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ")).join(" ");
  const zero = top + plotH / 2;
  const area = segmen.filter((bagian) => bagian.length >= 2).map((bagian) =>
    `M ${bagian[0].x.toFixed(2)} ${zero} ${bagian.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ")} L ${bagian[bagian.length - 1].x.toFixed(2)} ${zero} Z`
  ).join(" ");
  const coordsValid = coords.filter((p) => Number.isFinite(p.y));
  const jumlahEvaluasi = coords.filter((p) => Number.isFinite(p.nilaiCpGrafik)).length;
  const titikAktif = coordsValid.find((p) => p.index === hoverIndex) ?? null;
  const judulTitik = (point) => `${Math.ceil(point.index / 2)}.${point.index % 2 === 0 ? ".." : ""} ${point.san}`;
  const skorTitik = (point) => {
    const nilai = point.skorCpPutih;
    const tanda = nilai > 0 ? "+" : nilai < 0 ? "-" : "";
    if (point.tipeSkor === "mate") return `${tanda}M${Math.abs(nilai)}`;
    return `${tanda}${(Math.abs(nilai) / 100).toFixed(2)}`;
  };
  const wdlTitik = (point) => `White: ${point.wdlPutih[0] / 10}% · Draw: ${point.wdlPutih[1] / 10}% · Black: ${point.wdlPutih[2] / 10}%`;

  return (
    <section className="wawasan-card flex flex-col gap-3" data-uji="wawasan-akurasi-partai">
      <h3 className="wawasan-card-title">Akurasi</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          { key: "w", name: players?.[0]?.name || "Putih", stats: data.putih },
          { key: "b", name: players?.[1]?.name || "Hitam", stats: data.hitam },
        ].map(({ key, name, stats }) => (
          <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-border bg-backgroundBox px-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-xs uppercase tracking-wide text-foregroundGrey">{name}</div>
              <div className="mt-1 font-mono text-xs tabular-nums text-foregroundGrey">{format(rata(stats, "acpl"))} ACPL</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-medium leading-none tabular-nums text-foreground">{format(rataHarmonik(stats.map((item) => item.accuracy).filter(Number.isFinite)))}%</div>
              <div className="mt-1 text-xs text-foregroundGrey">Akurasi</div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-md border border-border bg-[#1b1c1e]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="inline-flex items-center gap-0.5 rounded bg-black/40 p-0.5" role="group" aria-label="Jenis evaluasi">
            <button type="button" aria-pressed={mode === "cp"} onClick={() => setMode("cp")} className={`rounded px-2 py-1 text-[11px] font-semibold ${mode === "cp" ? "bg-[#383a3d] text-white" : "text-white/55 hover:text-white"}`}>CP</button>
            <button
              type="button"
              aria-pressed={mode === "wdl"}
              disabled={!wdlTersedia}
              title={wdlTersedia ? "Tampilkan estimasi WDL dari Stockfish" : "WDL belum tersedia pada cukup posisi yang dianalisis"}
              onClick={() => setMode("wdl")}
              className={`rounded px-2 py-1 text-[11px] font-semibold ${mode === "wdl" ? "bg-[#383a3d] text-white" : wdlTersedia ? "text-white/55 hover:text-white" : "cursor-not-allowed text-white/30"}`}
            >WDL</button>
          </div>
          <span className="text-[10px] tabular-nums text-white/45">
            {mode === "wdl" ? `${titikWdl.length} posisi WDL` : `${jumlahEvaluasi} evaluasi`}
          </span>
        </div>
        {coordsValid.length >= 2 ? (
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={mode === "wdl" ? "Grafik keunggulan berdasarkan WDL Stockfish dari perspektif Putih" : "Grafik evaluasi CP dari perspektif Putih"} className="block h-auto w-full">
            <defs>
              <clipPath id={`${idGrafik}-atas`}><rect x={left} y={top} width={plotW} height={plotH / 2} /></clipPath>
              <clipPath id={`${idGrafik}-bawah`}><rect x={left} y={zero} width={plotW} height={plotH / 2} /></clipPath>
            </defs>
            {[0, .5, 1].map((r) => <line key={r} x1={left} y1={top + plotH * r} x2={width-right} y2={top + plotH * r} stroke="#85898d" strokeOpacity={r === .5 ? .35 : .12} strokeDasharray={r === .5 ? "3 4" : "none"} />)}
            <path d={area} fill="#e5e7eb" fillOpacity=".88" clipPath={`url(#${idGrafik}-atas)`} />
            <path d={area} fill="#34383d" fillOpacity=".96" clipPath={`url(#${idGrafik}-bawah)`} />
            <path d={pathLine} fill="none" stroke="#b9bdc2" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
            {coordsValid.map((p) => (
              <circle
                key={p.index}
                cx={p.x}
                cy={p.y}
                r="7"
                fill="transparent"
                stroke="transparent"
                pointerEvents="all"
                tabIndex={0}
                role="img"
                aria-label={mode === "wdl" ? `${judulTitik(p)} · ${wdlTitik(p)}` : `${judulTitik(p)} · Advantage: ${skorTitik(p)}`}
                onMouseEnter={() => setHoverIndex(p.index)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(p.index)}
                onBlur={() => setHoverIndex(null)}
              >
                <title>{mode === "wdl" ? `${judulTitik(p)} · ${wdlTitik(p)}` : `${judulTitik(p)} · Advantage: ${skorTitik(p)}`}</title>
              </circle>
            ))}
          </svg>
        ) : (
          <div className="flex h-36 items-center justify-center px-4 text-center text-xs text-white/55">
            {mode === "wdl"
              ? "Grafik WDL memerlukan sedikitnya dua posisi dengan data WDL dari engine."
              : "Grafik akan tersedia setelah setidaknya dua langkah memiliki evaluasi engine."}
          </div>
        )}
        {titikAktif && (
          <div role="tooltip" className="pointer-events-none absolute left-3 top-12 z-20 max-w-[calc(100%-1.5rem)] rounded-md border border-white/15 bg-[#111315]/95 px-3 py-2 text-xs text-white shadow-lg">
            <div className="font-semibold">{judulTitik(titikAktif)}</div>
            <div className="mt-1 whitespace-pre-line text-white/75">
              {mode === "wdl" ? wdlTitik(titikAktif) : `Advantage: ${skorTitik(titikAktif)}`}
            </div>
          </div>
        )}
        <div className="flex justify-between border-t border-white/10 px-3 py-1.5 text-[10px] text-white/45">
          <span>{mode === "wdl" ? "Peluang Putih ↑" : "Keunggulan Putih ↑"}</span>
          <span>{mode === "wdl" ? "Peluang Hitam ↓" : "Keunggulan Hitam ↓"}</span>
        </div>
      </div>
    </section>
  );
}
