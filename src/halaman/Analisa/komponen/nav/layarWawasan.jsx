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
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import { hashPgn } from "../../../../lib/pgnRingan.js";
import { AnalyzeContext } from "../../konteks/analyzeKonteks.js";
import { ambilDaftarPartai, ambilSemuaKoleksi } from "../../basisData.js";
import { bacaDaftarAkun } from "../../akun/daftarAkun.js";
import { agregasiWawasan } from "../../mesin/wawasan.js";
import { ambilPetaAnalisis, langgananAnalisis } from "../../mesin/analisisTersimpan.js";
import PanelLayar from "./PanelLayar.jsx";
import SelectDaftar from "./SelectDaftar.jsx";

const OPSI_WAKTU = [
  { nilai: "all", label: "Semua" },
  { nilai: "bullet", label: "Bullet" },
  { nilai: "blitz", label: "Blitz" },
  { nilai: "rapid", label: "Rapid" },
  { nilai: "classical", label: "Classical" },
  { nilai: "daily", label: "Daily" },
];

const OPSI_WARNA = [
  { nilai: "all", label: "Kedua warna" },
  { nilai: "white", label: "Putih" },
  { nilai: "black", label: "Hitam" },
];

const OPSI_TANGGAL = [
  { nilai: "all", label: "Semua waktu" },
  { nilai: "30d", label: "30 hari" },
  { nilai: "90d", label: "90 hari" },
  { nilai: "365d", label: "1 tahun" },
];

const BATAS_PARTAI_WAWASAN = 50;

export default function LayarWawasan() {
  const { t } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const [akun] = analyzeContext.akun;
  const platform = akun?.platform === "lichessOrg" ? "lichessOrg" : "chessCom";
  const username = String(akun?.username || "").trim();

  const [akunTersimpan] = useState(bacaDaftarAkun);
  const [koleksi, setKoleksi] = useState([]);
  const [partai, setPartai] = useState([]);
  const [filterWaktu, setFilterWaktu] = useState("all");
  const [filterWarna, setFilterWarna] = useState("all");
  const [filterTanggal, setFilterTanggal] = useState("all");
  const [muat, setMuat] = useState(false);

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
    if (!username) return;
    setMuat(true);
    try {
      const { partai: daftar } = await ambilDaftarPartai({
        koleksiId: `${platform}:${username.toLowerCase()}`,
        timeClass: filterWaktu === "all" ? "" : filterWaktu,
        limit: BATAS_PARTAI_WAWASAN,
        sertakanPgn: true,
        urut: "tanggal",
        arah: "desc",
      });
      setPartai(daftar || []);
    } catch {
      setPartai([]);
    } finally {
      setMuat(false);
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
   * Filter warna diterapkan di sini — bukan di wawasan.js — karena
   * agregasiWawasan menghitung hasilUmum + per-warna sekaligus. Yang ditukar
   * hanya angka Distribusi Hasil: kartu Pembukaan tetap menampilkan kedua
   * kolom "Sebagai Putih"/"Sebagai Hitam" (penyimpangan dari acuan yang
   * memotong semua kartu lewat filterGames — dicatat di README).
   *
   * Blok ini pernah menghitung `partaiFilter` yang tidak pernah dipakai;
   * variabel mati itu dihapus (error `no-unused-vars` yang membuat
   * `npm run lint` merah).
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

  function pilihAkun(kunci) {
    const pilihan = akunSitus.find((a) => a.username.toLowerCase() === kunci);
    analyzeContext.akun[1]({ platform, username: pilihan?.username || "" });
  }

  return (
    <PanelLayar>
      <div className="flex min-h-0 w-full flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <span className="text-xl font-bold text-foreground">{t("analisa.wawasan.judul")}</span>
          <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.wawasan.deskripsi")}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
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

        {!username ? (
          <div className="flex flex-col items-center gap-2 rounded-borderRoundness border border-dashed border-border bg-backgroundBox p-8">
            <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.pilihAkunPetunjuk")}</p>
          </div>
        ) : muat ? (
          <div className="flex flex-col items-center gap-2 rounded-borderRoundness border border-border bg-backgroundBox p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-foregroundGrey border-t-backgroundBoxBoxHighlighted" />
            <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.memuat")}</p>
          </div>
        ) : !wawasanTampil || wawasanTampil.totalPartai === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-borderRoundness border border-dashed border-border bg-backgroundBox p-8">
            <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.tanpaPartai")}</p>
          </div>
        ) : (
          <>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-borderRoundness border border-border bg-backgroundBox px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foregroundGrey">{t("analisa.wawasan.filterKecepatan")}:</span>
                <div className="flex rounded-borderRoundness bg-backgroundBoxBox p-0.5">
                  {OPSI_WAKTU.map((o) => (
                    <button
                      key={o.nilai}
                      type="button"
                      onClick={() => setFilterWaktu(o.nilai)}
                      className={`rounded-borderRoundness px-2 py-1 text-xs font-medium transition-colors ${
                        filterWaktu === o.nilai
                          ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark font-bold"
                          : "text-foregroundGrey hover:text-foreground"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foregroundGrey">{t("analisa.wawasan.filterWarna")}:</span>
                <div className="flex rounded-borderRoundness bg-backgroundBoxBox p-0.5">
                  {OPSI_WARNA.map((o) => (
                    <button
                      key={o.nilai}
                      type="button"
                      onClick={() => setFilterWarna(o.nilai)}
                      className={`rounded-borderRoundness px-2 py-1 text-xs font-medium transition-colors ${
                        filterWarna === o.nilai
                          ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark font-bold"
                          : "text-foregroundGrey hover:text-foreground"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foregroundGrey">{t("analisa.wawasan.filterRentang")}:</span>
                <div className="flex rounded-borderRoundness bg-backgroundBoxBox p-0.5">
                  {OPSI_TANGGAL.map((o) => (
                    <button
                      key={o.nilai}
                      type="button"
                      onClick={() => setFilterTanggal(o.nilai)}
                      className={`rounded-borderRoundness px-2 py-1 text-xs font-medium transition-colors ${
                        filterTanggal === o.nilai
                          ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark font-bold"
                          : "text-foregroundGrey hover:text-foreground"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* KPI Grid */}
            <KpiGrid wawasan={wawasanTampil} t={t} />

            {/* Dashboard 2 kolom */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <GrafikTrenRating points={wawasanTampil.trenRating} t={t} />
                <DistribusiHasil
                  umum={wawasanTampil.hasilUmum}
                  putih={wawasanTampil.sebagaiPutih}
                  hitam={wawasanTampil.sebagaiHitam}
                  t={t}
                />
              </div>
              <div className="flex flex-col gap-4">
                <KartuPembukaanTeratas
                  putih={wawasanTampil.pembukaPutih}
                  hitam={wawasanTampil.pembukaanHitam}
                  t={t}
                />
                <KartuTaktikal taktikal={wawasanTampil.taktikal} t={t} />
              </div>
            </div>
          </>
        )}
      </div>
    </PanelLayar>
  );
}

/* ============================================================ Sub-komponen */

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
      <div className="wawasan-card">
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
    <div className="wawasan-card">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="wawasan-card-title">{t("analisa.wawasan.trenJudul")}</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-foregroundGrey">
            {t("analisa.wawasan.terkini")}: <strong className="text-foreground">{lastRating}</strong>
          </span>
          <span className={`font-bold font-mono ${deltaClass}`}>{deltaStr}</span>
        </div>
      </div>
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={`${firstRating} to ${lastRating}`}>
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

function KartuPembukaanTeratas({ putih, hitam, t }) {
  const [warna, setWarna] = useState("white");
  const openings = warna === "white" ? putih : hitam;

  return (
    <div className="wawasan-card">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="wawasan-card-title">{t("analisa.wawasan.pembukaanJudul")}</h3>
        <div className="flex rounded-borderRoundness bg-backgroundBoxBox p-0.5">
          <button
            type="button"
            onClick={() => setWarna("white")}
            className={`rounded-borderRoundness px-2 py-1 text-xs font-medium transition-colors ${
              warna === "white" ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark font-bold" : "text-foregroundGrey hover:text-foreground"
            }`}
          >
            {t("analisa.wawasan.sebagaiPutih")} ({putih.length})
          </button>
          <button
            type="button"
            onClick={() => setWarna("black")}
            className={`rounded-borderRoundness px-2 py-1 text-xs font-medium transition-colors ${
              warna === "black" ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark font-bold" : "text-foregroundGrey hover:text-foreground"
            }`}
          >
            {t("analisa.wawasan.sebagaiHitam")} ({hitam.length})
          </button>
        </div>
      </div>

      {openings.length === 0 ? (
        <div className="flex items-center justify-center p-4">
          <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.tanpaPembukaan")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-foregroundGrey">
                <th className="py-1.5 px-2 text-left font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.nama")}</th>
                <th className="py-1.5 px-2 text-left font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.langkah")}</th>
                <th className="py-1.5 px-2 text-right font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.main")}</th>
                <th className="py-1.5 px-2 text-right font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.winRate")}</th>
                <th className="py-1.5 px-2 font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.hasil")}</th>
              </tr>
            </thead>
            <tbody>
              {openings.map((op, idx) => {
                const winPct = op.played > 0 ? (op.wins / op.played) * 100 : 0;
                const drawPct = op.played > 0 ? (op.draws / op.played) * 100 : 0;
                const lossPct = op.played > 0 ? (op.losses / op.played) * 100 : 0;
                return (
                  <tr key={`${op.name}-${idx}`} className="border-b border-border/30">
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5">
                        {op.eco && <span className="rounded border border-border bg-backgroundBoxBox px-1 py-0.5 font-mono text-[10px] text-highlightBest font-bold">{op.eco}</span>}
                        <span className="font-semibold text-foreground">{op.name}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[10px] text-foregroundGrey whitespace-nowrap">{op.moves || "\u2014"}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-foregroundGrey">{op.played}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-highlightBest">{op.winRate}%</td>
                    <td className="py-1.5 px-2">
                      <div className="flex h-2 w-16 overflow-hidden rounded-sm bg-backgroundBoxBox">
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
function KartuTaktikal({ taktikal, t }) {
  const butir = [
    { kunci: "blunder", nilai: taktikal.blunders, titik: "bg-highlightBlunder", laju: true },
    { kunci: "mistake", nilai: taktikal.mistakes, titik: "bg-highlightMistake" },
    { kunci: "inaccuracy", nilai: taktikal.inaccuracies, titik: "bg-highlightInaccuracy" },
    { kunci: "miss", nilai: taktikal.misses, titik: "bg-highlightMiss" },
  ];

  return (
    <div className="wawasan-card">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="wawasan-card-title">{t("analisa.wawasan.taktikalJudul")}</h3>
        <span className="text-xs text-foregroundGrey">
          <strong className="text-foreground">{taktikal.totalEvaluatedMoves}</strong>{" "}
          {t("analisa.wawasan.taktikal.langkahDinilai")}
        </span>
      </div>

      <div className="mt-3 rounded-borderRoundness border border-border bg-backgroundBoxBox p-3 flex flex-col gap-1">
        <span className="text-xs font-bold text-foregroundGrey">{t("analisa.wawasan.taktikal.akurasiLabel")}</span>
        <span className="text-2xl font-extrabold text-highlightBest font-mono">
          {taktikal.avgAccuracy !== null
            ? `${taktikal.avgAccuracy}%`
            : t("analisa.wawasan.taktikal.belumAdaEvaluasi")}
        </span>
        <span className="text-[10px] text-foregroundGrey">{t("analisa.wawasan.taktikal.akurasiKet")}</span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {butir.map((b) => (
          <div
            key={b.kunci}
            className="flex flex-col gap-0.5 rounded-borderRoundness border border-border bg-backgroundBoxBox p-2"
          >
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-foregroundGrey">
              <span className={`h-2 w-2 rounded-full ${b.titik}`} />
              {t(`analisa.wawasan.taktikal.${b.kunci}`)}
            </span>
            <span className="text-lg font-bold font-mono text-foreground">{b.nilai}</span>
            {b.laju ? (
              <span className="text-[10px] font-mono text-foregroundGrey">
                {taktikal.blundersPerGame > 0 ? `${taktikal.blundersPerGame}` : "0"}{" "}
                {t("analisa.wawasan.taktikal.perPartai")}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {/*
       * Keterangan jumlah partai yang benar-benar menyumbang angka. Acuan
       * menampilkan "No evaluations yet" tanpa rincian; baris ini tambahan
       * repo ini supaya "kenapa N/A padahal data sudah ditarik" terjawab:
       * akurasi hanya ada untuk partai yang dianalisis engine pada sesi ini
       * atau yang dikirim platform bersama arsipnya.
       */}
      <p className="mt-2 text-[10px] leading-4 text-foregroundGrey">
        {t("analisa.wawasan.taktikal.cakupan", {
          dinilai: taktikal.accuracyCount,
          dianalisis: taktikal.analyzedGamesCount,
        })}
      </p>
    </div>
  );
}
