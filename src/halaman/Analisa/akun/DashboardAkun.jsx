/*
 * Dashboard akun pemain — meniru tata letak & rasa En Croissant
 * (github.com/franciscoBSalgueiro/en-croissant): kartu akun di sisi kiri,
 * kartu pemain di sisi kanan dengan tab Overview / Ratings / Openings,
 * selector berlabel "Website" & "Time control", hasil W/D/L sebagai bar
 * tersegmen berpersen, grafik batang (overview) & area (ratings) biru,
 * dan kolom Putih/Hitam untuk pembukaan.
 */
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnalyzeContext } from "../konteks/analyze.jsx";
import { useI18n } from "../../../lib/i18n.jsx";
import { useKartuPemain } from "../../../lib/pemainCatur.js";
import { ambilDaftarPartai } from "../basisData.js";
import { muatPartaiChessCom } from "./muatPartaiAkun.js";
import { ringkasanOverview, riwayatRating, rekapPembukaan } from "./statsAkun.js";
import Profile from "../komponen/svg/profile.jsx";
import Database from "../komponen/svg/database.jsx";

/** Biru khas chart En Croissant (mantine blue-filled). */
const BIRU = "#4a9dd9";

function formatRating(x) {
  return x == null ? "—" : String(x);
}

/** Bar W/D/L tersegmen ala En Croissant (hijau/abu/merah) + label % bila cukup lebar. */
function BarHasil({ w, d, l, tinggi = "1.4rem" }) {
  const total = w + d + l || 1;
  const seg = (nilai, warna) => {
    const pct = (nilai / total) * 100;
    return { pct, warna, tampil: pct > 15 };
  };
  const win = seg(w, "var(--analisa-winGreen)");
  const draw = seg(d, "var(--analisa-foregroundGrey)");
  const loss = seg(l, "var(--analisa-lossRed)");
  return (
    <div className="flex w-full overflow-hidden rounded-md" style={{ height: tinggi }}>
      {[win, draw, loss].map((s, i) => (
        <div
          key={i}
          className="flex h-full items-center justify-center overflow-hidden"
          style={{ width: `${s.pct}%`, backgroundColor: s.warna }}
        >
          {s.tampil ? (
            <span className="px-1 text-[0.7rem] font-bold leading-none text-white/90">{s.pct.toFixed(1)}%</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Grafik batang partai per tahun (Overview), bisa diklik untuk zoom tahun. */
function GrafikTahunan({ data }) {
  const [tahun, setTahun] = useState(null);
  const bars = tahun ? data.filter((x) => x.tahun === tahun) : data;
  const max = Math.max(1, ...data.map((x) => x.jumlah));
  return (
    <div className="relative">
      <svg viewBox="0 0 560 210" className="h-48 w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = 200 - f * 180;
          return <line key={f} x1={0} y1={y} x2={560} y2={y} stroke="var(--analisa-foregroundGrey)" strokeOpacity="0.2" strokeDasharray="3 3" />;
        })}
        {bars.map((x, i) => {
          const bw = bars.length ? (560 / bars.length) * 0.7 : 40;
          const cx = bars.length === 1 ? 280 : (i + 0.5) * (560 / bars.length);
          const h = (x.jumlah / max) * 160;
          return (
            <rect
              key={x.tahun}
              x={cx - bw / 2}
              y={200 - h}
              width={bw}
              height={h}
              rx="3"
              fill={tahun && x.tahun === tahun ? BIRU : "var(--analisa-foregroundGrey)"}
              opacity={tahun && x.tahun !== tahun ? 0.4 : 1}
            />
          );
        })}
        {bars.map((x, i) => {
          const cx = bars.length === 1 ? 280 : (i + 0.5) * (560 / bars.length);
          return (
            <text key={x.tahun} x={cx} y={196} textAnchor="middle" fontSize="12" fill="var(--analisa-foregroundGrey)">
              {x.tahun}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/** Grafik area riwayat rating (Ratings) biru dengan gradasi. */
function GrafikRiwayat({ poin, min, max }) {
  const W = 560;
  const H = 220;
  const pad = 10;
  const n = poin.length;
  if (n < 2) {
    return <div className="grid h-48 place-items-center text-sm text-foregroundGrey">—</div>;
  }
  const kisaran = max - min || 1;
  const pos = (i) => {
    const p = poin[i];
    const x = pad + (i / (n - 1)) * (W - pad * 2);
    const y = H - pad - ((p.rating - min) / kisaran) * (H - pad * 2);
    return [x, y];
  };
  const garis = poin.map((_, i) => pos(i).map((v) => Math.round(v)).join(",")).join(" ");
  const area = `${pad},${H - pad} ${garis} ${W - pad},${H - pad}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full">
      <defs>
        <linearGradient id="gradRating" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BIRU} stopOpacity="0.35" />
          <stop offset="100%" stopColor={BIRU} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = H - pad - f * (H - pad * 2);
        return (
          <line
            key={f}
            x1={pad}
            y1={y}
            x2={W - pad}
            y2={y}
            stroke="var(--analisa-foregroundGrey)"
            strokeOpacity="0.18"
            strokeDasharray="3 3"
          />
        );
      })}
      <polygon points={area} fill="url(#gradRating)" />
      <polyline points={garis} fill="none" stroke={BIRU} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {poin.length === 1 ? null : (
        <circle cx={pos(n - 1)[0]} cy={pos(n - 1)[1]} r="4" fill={BIRU} />
      )}
    </svg>
  );
}

/** Baris pembukaan ala En Croissant: nama + % + bar hasil. */
function BarisPembukaan({ e, totalWarna }) {
  return (
    <div className="flex flex-col gap-2 px-1 py-3">
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="truncate font-semibold text-foreground">{e.nama}</span>
        <span className="shrink-0 font-bold text-foregroundGrey">{e.persen}%</span>
      </div>
      <BarHasil w={e.w} d={e.d} l={e.l} tinggi="1rem" />
    </div>
  );
}

function MuatNegara({ isi, tombol, onKlik }) {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-backgroundBoxBoxHighlighted/20">
        <Database width={30} height={30} class="fill-backgroundBoxBoxHighlighted" />
      </div>
      <span className="max-w-xs text-sm text-foregroundGrey">{isi}</span>
      {tombol ? (
        <button
          type="button"
          onClick={onKlik}
          className="cursor-pointer rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-4 py-2 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover"
        >
          {tombol}
        </button>
      ) : null}
    </div>
  );
}

export default function DashboardAkun({ platform, username, onBukaTabel }) {
  const { t } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const setAkun = analyzeContext.akun[1];
  const [tab, setTab] = useState("overview");
  const [situs, setSitus] = useState(platform);
  const [waktu, setWaktu] = useState("any");
  const [rentang, setRentang] = useState("all");
  const [games, setGames] = useState(null); // null = memuat
  const [galat, setGalat] = useState(false);
  const [memuatLagi, setMemuatLagi] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const user = String(username || "").trim();

  const kartu = useKartuPemain(user, !!user);

  const muatData = useCallback(async (paksa = false) => {
    setMemuatLagi(paksa);
    setGames(null);
    setGalat(false);
    const koleksiId = `${platform}:${user.toLowerCase()}`;
    try {
      let daftar = (await ambilDaftarPartai({ koleksiId, limit: 0, sertakanPgn: false }))?.partai || [];
      if (daftar.length === 0 && platform === "chessCom") {
        await muatPartaiChessCom(user);
        daftar = (await ambilDaftarPartai({ koleksiId, limit: 0, sertakanPgn: false }))?.partai || [];
      }
      if (daftar.length === 0 && platform !== "chessCom") {
        daftar = (await ambilDaftarPartai({ platform, username: user, limit: 0, sertakanPgn: true }))?.partai || [];
      }
      const ts = daftar.reduce((m, p) => Math.max(m, Number(p.timestamp) || 0), 0);
      setLastUpdate(ts);
      setGames(daftar);
    } catch (e) {
      setGames([]);
      setGalat(true);
    } finally {
      setMemuatLagi(false);
    }
  }, [platform, user]);

  useEffect(() => {
    if (user) muatData();
  }, [user, muatData]);

  useEffect(() => setSitus(platform), [platform]);

  useEffect(() => {
    if (tab === "openings" && games && user) {
      (async () => {
        const koleksiId = `${platform}:${user.toLowerCase()}`;
        const denganPgn = await ambilDaftarPartai({ koleksiId, limit: 0, sertakanPgn: true });
        if (denganPgn.partai?.length) setGames(denganPgn.partai);
      })().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filteredGames = useMemo(() => (games ? games.filter((p) => p.platform === situs) : games), [games, situs]);
  const opsi = useMemo(() => ({ rentang: tab === "ratings" ? rentang : "all", waktu }), [rentang, waktu, tab]);

  const overview = useMemo(() => (filteredGames ? ringkasanOverview(filteredGames, user, opsi) : null), [filteredGames, user, opsi]);
  const ratings = useMemo(() => (filteredGames ? riwayatRating(filteredGames, user, { rentang }) : null), [filteredGames, user, rentang]);
  const openings = useMemo(() => (filteredGames ? rekapPembukaan(filteredGames, user, opsi) : null), [filteredGames, user, opsi]);

  const pilihanWaktu = ["any", "bullet", "blitz", "rapid", "classical"].filter((k) => games?.some((p) => p.timeClass === k));

  const tanggalUpdate = (ts) => {
    if (!ts) return "—";
    try {
      return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "numeric", year: "numeric" }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleDateString();
    }
  };

  const tabKunci = [
    { k: "overview", label: t("analisa.statistik.overview") },
    { k: "ratings", label: t("analisa.statistik.ratings") },
    { k: "openings", label: t("analisa.statistik.openings") },
  ];

  const totalGames = games?.length ?? 0;
  const totalPutih = openings?.putih.reduce((s, e) => s + e.jumlah, 0) || 0;
  const totalHitam = openings?.hitam.reduce((s, e) => s + e.jumlah, 0) || 0;

  return (
    <div className="flex h-full w-full flex-col gap-3 p-1">
      {/* ===== Kartu akun (kiri) ===== */}
      <div className="flex flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md ${platform === "chessCom" ? "bg-backgroundProfileWhite" : "bg-backgroundProfileBlack"}`}>
            {kartu?.avatar ? (
              <img className="h-full w-full object-cover" src={kartu.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              <Profile width={20} height={20} class={platform === "chessCom" ? "fill-foregroundProfileWhite" : "fill-foregroundProfileBlack"} />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{user}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => muatData(true)} title={t("analisa.statistik.tarik")} className="grid h-7 w-7 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted">
              <RefreshIkon />
            </button>
            <button type="button" onClick={onBukaTabel} title={t("analisa.statistik.bukaTabel")} className="grid h-7 w-7 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted">
              <Database width={15} height={15} class="fill-foregroundGrey" />
            </button>
            <button type="button" onClick={() => setAkun({ platform: "", username: "" })} title={t("analisa.akun.batal")} className="grid h-7 w-7 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-lossRed">
              <TrashIkon />
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          {["bullet", "blitz", "rapid"].map((k) => (
            <div key={k} className="flex items-center justify-between py-1">
              <span className="text-xs font-bold uppercase tracking-wide text-foregroundGrey">{k}</span>
              <span className="text-sm font-bold tabular-nums text-foreground">{formatRating(kartu?.ratings?.[k])}</span>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-foregroundGrey">{t("analisa.statistik.games")}</span>
            <span className="text-xs font-bold tabular-nums text-foreground">{totalGames} / {totalGames}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-backgroundBoxBox">
            <div className="h-full rounded-full" style={{ width: totalGames ? "100%" : "0%", backgroundColor: BIRU }} />
          </div>
          <div className="pt-1.5 text-xs text-foregroundGrey">{t("analisa.statistik.terakhir")} {tanggalUpdate(lastUpdate)}</div>
        </div>
      </div>

      {/* ===== Kartu pemain (kanan) ===== */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox">
        {/* Nama pemain + tombol info */}
        <div className="relative px-4 pt-4">
          <span className="block text-center text-xl font-bold text-foreground">{user}</span>
          <span className="absolute right-3 top-3 text-xs text-foregroundGrey">ⓘ</span>
        </div>

        {/* Tab bergaris ala Mantine outline */}
        <div className="flex border-b border-border px-4 pt-2">
          {tabKunci.map((x) => (
            <button
              key={x.k}
              type="button"
              onClick={() => setTab(x.k)}
              className={`-mb-px cursor-pointer border-b-2 px-4 py-2 text-sm font-bold transition-colors ${
                tab === x.k ? "border-[var(--analisa-backgroundBoxBoxHighlighted)] text-foreground" : "border-transparent text-foregroundGrey hover:text-foregroundHighlighted"
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>

        {/* Filter situs & waktu */}
        <div className="flex flex-wrap items-end gap-2 px-4 pt-3">
          <label className="flex flex-col gap-1 text-xs font-bold text-foregroundGrey">
            {t("analisa.statistik.situs")}
            <select value={situs} onChange={(e) => setSitus(e.target.value)} className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-sm text-foreground outline-none">
              <option value="chessCom">Chess.com</option>
              <option value="lichessOrg">Lichess.org</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-foregroundGrey">
            {t("analisa.statistik.waktu")}
            <select value={waktu} onChange={(e) => setWaktu(e.target.value)} className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-sm text-foreground outline-none">
              <option value="any">{t("analisa.statistik.semuaWaktu")}</option>
              {pilihanWaktu.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Rentang tanggal (hanya tab Ratings) */}
        {tab === "ratings" ? (
          <div className="flex items-center justify-center gap-1 px-4 pt-3">
            {["7d", "30d", "90d", "1y", "all"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRentang(r)}
                className={`cursor-pointer rounded-borderRoundness px-2.5 py-1 text-xs font-bold transition-colors ${
                  rentang === r ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark" : "text-foregroundGrey hover:text-foregroundHighlighted"
                }`}
              >
                {t(`analisa.statistik.rentang.${r}`)}
              </button>
            ))}
          </div>
        ) : null}

        {/* Isi tab */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {galat && !games ? (
            <MuatNegara isi={t("analisa.statistik.akunTidakDitemukan")} tombol={t("analisa.statistik.tarik")} onKlik={() => muatData(true)} />
          ) : games == null ? (
            <MuatNegara isi={memuatLagi ? t("analisa.statistik.tarikData") : t("analisa.statistik.memuat")} />
          ) : games.length === 0 ? (
            <MuatNegara isi={t("analisa.statistik.belumAdaData")} tombol={t("analisa.statistik.tarik")} onKlik={() => muatData(true)} />
          ) : tab === "overview" && overview ? (
            <div className="flex flex-col gap-3">
              <div className="pt-4 text-center text-lg font-bold text-foreground">{t("analisa.statistik.totalGame", { total: overview.total })}</div>
              {overview.total > 0 ? (
                <>
                  <BarHasil w={overview.w} d={overview.d} l={overview.l} tinggi="2rem" />
                  <GrafikTahunan data={overview.tahunan} />
                </>
              ) : null}
            </div>
          ) : tab === "ratings" && ratings ? (
            <div className="flex flex-col gap-3">
              <div className="pt-4 text-center text-lg font-bold text-foreground">{t("analisa.statistik.totalGame", { total: ratings.total })}</div>
              {ratings.total > 0 ? (
                <>
                  <BarHasil w={ratings.poin.filter((p) => p.outcome === "win").length} d={ratings.poin.filter((p) => p.outcome === "draw").length} l={ratings.poin.filter((p) => p.outcome === "loss").length} tinggi="2rem" />
                  <GrafikRiwayat poin={ratings.poin} min={ratings.min} max={ratings.max} />
                  <div className="flex items-center justify-between text-xs text-foregroundGrey">
                    <span>{t("analisa.statistik.rendah")}: {ratings.min}</span>
                    <span>{t("analisa.statistik.tinggi")}: {ratings.max}</span>
                  </div>
                </>
              ) : null}
            </div>
          ) : tab === "openings" && openings ? (
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <div>
                <div className="border-b border-border py-3 text-center text-sm font-bold text-foreground">{t("analisa.statistik.putih")}</div>
                {openings.putih.length ? openings.putih.map((e, i) => <BarisPembukaan key={e.nama + i} e={e} totalWarna={totalPutih} />) : <p className="py-4 text-center text-sm text-foregroundGrey">—</p>}
              </div>
              <div>
                <div className="border-b border-border py-3 text-center text-sm font-bold text-foreground">{t("analisa.statistik.hitam")}</div>
                {openings.hitam.length ? openings.hitam.map((e, i) => <BarisPembukaan key={e.nama + i} e={e} totalWarna={totalHitam} />) : <p className="py-4 text-center text-sm text-foregroundGrey">—</p>}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RefreshIkon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path fill="currentColor" d="M12 4a8 8 0 0 1 7.6 5.4l1.5-.6A10 10 0 0 0 12 2v2zm7.9 5.4-1.5.6a8 8 0 0 1 .6 4.2l1.9.4A10 10 0 0 0 19.9 9.4zM12 20a8 8 0 0 1-7.6-5.4l-1.5.6A10 10 0 0 0 12 22v-2zM4.1 14.6l1.5-.6A8 8 0 0 1 5 9.8l-1.9-.4A10 10 0 0 0 4.1 14.6zM12 8v4l3 2-1 1.5L10 13V8h2z" />
    </svg>
  );
}

function TrashIkon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path fill="currentColor" d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" />
    </svg>
  );
}
