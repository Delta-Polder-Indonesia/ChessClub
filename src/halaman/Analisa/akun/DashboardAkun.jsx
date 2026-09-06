/* Dashboard akun pemain ala en-croissant: kartu akun + tab Overview/Ratings/Openings. */
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnalyzeContext } from "../konteks/analyze.jsx";
import { useI18n } from "../../../lib/i18n.jsx";
import { useKartuPemain } from "../../../lib/pemainCatur.js";
import { ambilDaftarPartai } from "../basisData.js";
import { muatPartaiChessCom } from "./muatPartaiAkun.js";
import { ringkasanOverview, riwayatRating, rekapPembukaan } from "./statsAkun.js";
import Profile from "../komponen/svg/profile.jsx";
import Database from "../komponen/svg/database.jsx";

/** Sederhanakan rating: tampilkan sebagai "1208". */
function formatRating(x) {
  return x == null ? "—" : String(x);
}

/** Bar menang/seri/kalah berwarna (seperti W/D/L stacked). */
function WdlBar({ w, d, l, tanpaWarna = false }) {
  const total = w + d + l || 1;
  const W = (t) => `${(w / total) * 100}%`;
  const D = (t) => `${(d / total) * 100}%`;
  const L = (t) => `${(l / total) * 100}%`;
  const kelas = { win: "bg-winGreen", draw: "bg-foregroundGrey", loss: "bg-lossRed" };
  return (
    <div className="flex h-5 w-full overflow-hidden rounded-md">
      <span className={`${kelas.win} h-full`} style={{ width: W() }} />
      <span className={`${kelas.draw} h-full`} style={{ width: D() }} />
      <span className={`${kelas.loss} h-full`} style={{ width: L() }} />
    </div>
  );
}

function WdlNums({ w, d, l }) {
  const total = w + d + l || 1;
  const p = (x) => Math.round((x / total) * 1000) / 10;
  return (
    <div className="flex w-full items-center justify-between text-sm font-bold">
      <span className="text-winGreen">{p(w)}%</span>
      <span className="text-foregroundGrey">{p(d)}%</span>
      <span className="text-lossRed">{p(l)}%</span>
    </div>
  );
}

/** Grafik batang partai per tahun (Overview). */
function GrafikTahunan({ data }) {
  const max = Math.max(1, ...data.map((x) => x.jumlah));
  return (
    <div className="flex h-52 items-end justify-around gap-3 border-b border-border pb-1">
      {data.map((x) => (
        <div key={x.tahun} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[11px] font-bold text-foreground">{x.jumlah}</span>
          <span className="w-full max-w-[38px] bg-evaluationBarWhite" style={{ height: `${(x.jumlah / max) * 78}%` }} />
          <span className="text-[11px] text-foregroundGrey">{x.tahun}</span>
        </div>
      ))}
      {data.length === 0 ? <span className="text-sm text-foregroundGrey">—</span> : null}
    </div>
  );
}

/** Grafik garis/area riwayat rating (Ratings). */
function GrafikRiwayat({ poin, min, max }) {
  const W = 560;
  const H = 220;
  const pad = 8;
  const n = poin.length;
  if (n < 2) {
    return <div className="grid h-52 place-items-center text-sm text-foregroundGrey">—</div>;
  }
  const kisaran = max - min || 1;
  const tonggak = (i) => {
    const p = poin[i];
    const x = pad + (i / (n - 1)) * (W - pad * 2);
    const y = H - pad - ((p.rating - min) / kisaran) * (H - pad * 2);
    return [x, y];
  };
  const garis = poin.map((_, i) => tonggak(i).map((v) => Math.round(v)).join(",")).join(" ");
  const area = `${pad},${H - pad} ${garis} ${W - pad},${H - pad}`;
  const warna = "var(--analisa-evaluationBarWhite)";
  const isi = "rgba(46, 139, 220, 0.15)";
  const titik = tonggak(n - 1);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-52 w-full">
        <polygon points={area} fill={isi} />
        <polyline points={garis} fill="none" stroke={warna} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={titik[0]} cy={titik[1]} r="4" fill={warna} />
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = H - pad - f * (H - pad * 2);
          return <line key={f} x1={pad} y1={y} x2={W - pad} y2={y} stroke="var(--analisa-foregroundGrey)" strokeOpacity="0.12" strokeDasharray="3 3" />;
        })}
      </svg>
      <div className="absolute left-0 top-0 text-[11px] font-bold text-foreground">{max}</div>
      <div className="absolute left-0 bottom-0 text-[11px] font-bold text-foreground">{min}</div>
    </div>
  );
}

/** Baris pembukaan untuk tab Openings. */
function BarisPembukaan({ e, label, t }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="truncate font-semibold text-foreground">{e.nama}</span>
        <span className="shrink-0 text-[12px] text-foregroundGrey">{label} {e.persen}%</span>
      </div>
      <WdlBar w={e.w} d={e.d} l={e.l} />
      <WdlNums w={e.w} d={e.d} l={e.l} />
    </div>
  );
}

function KeteranganMuat({ isi, tombol, onKlik, t }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-foregroundGrey">
      <span>{isi}</span>
      {tombol ? (
        <button type="button" onClick={onKlik} className="cursor-pointer rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-2 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover">
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
  const errorsContext = useContext(ErrorsContext);
  const [tab, setTab] = useState("overview");
  const [situs, setSitus] = useState("chessCom");
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
        daftar = await muatPartaiChessCom(user);
        daftar = daftar || [];
      }
      if (daftar.length === 0 && platform !== "chessCom") {
        // Lichess: baca dari basis data; jika belum ada, tampilkan ajakan.
        daftar = (await ambilDaftarPartai({ platform, username: user, limit: 0, sertakanPgn: true }))?.partai || [];
      }
      const ts = daftar.reduce((m, p) => Math.max(m, Number(p.timestamp) || 0), 0);
      setLastUpdate(ts);
      setGames(daftar);
    } catch (e) {
      if (e?.status === 404) {
        setGalat(true);
      } else {
        setGames([]);
        setGalat(true);
      }
    } finally {
      setMemuatLagi(false);
    }
  }, [platform, user]);

  useEffect(() => {
    if (user) muatData();
  }, [user, muatData]);

  // Saat berpindah ke tab Openings, muat ulang dengan PGN (header pembukaan).
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

  const opsi = useMemo(() => ({ rentang: tab === "ratings" ? rentang : "all", waktu }), [rentang, waktu, tab]);

  const overview = useMemo(() => (games ? ringkasanOverview(games, user, opsi) : null), [games, user, opsi]);
  const ratings = useMemo(() => (games ? riwayatRating(games, user, { rentang }) : null), [games, user, rentang]);
  const openings = useMemo(() => (games ? rekapPembukaan(games, user, opsi) : null), [games, user, opsi]);

  const pilihanWaktu = ["any", "bullet", "blitz", "rapid", "classical"].filter((k) => {
    if (!games) return false;
    return games.some((p) => p.timeClass === k);
  });

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

  return (
    <div className="flex h-full w-full flex-col gap-3 p-3">
      {/* Kartu akun */}
      <div className="flex flex-col gap-3 rounded-borderRoundness bg-backgroundBox p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-borderRoundness bg-backgroundProfileWhite">
            {kartu?.avatar ? (
              <img className="h-full w-full object-cover" src={kartu.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              <Profile width={30} height={30} class="fill-foregroundProfileWhite" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold text-foreground">{user}</div>
            <div className="text-xs text-foregroundGrey">{t("analisa.statistik.judul")}</div>
          </div>
          <button type="button" onClick={onBukaTabel} title={t("analisa.statistik.bukaTabel")} className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted">
            <Database width={16} height={16} class="fill-foregroundGrey" />
          </button>
          <button
            type="button"
            onClick={() => setAkun({ platform: "", username: "" })}
            title={t("analisa.akun.batal")}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-lossRed"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {["bullet", "blitz", "rapid"].map((k) => (
            <div key={k} className="rounded-borderRoundness bg-backgroundBoxBox px-2 py-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">{k}</div>
              <div className="text-sm font-bold text-foreground">{formatRating(kartu?.ratings?.[k])}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-foregroundGrey">
            <span>{t("analisa.statistik.games")}</span>
            <span className="font-bold text-foreground">{games ? games.length : "…"}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-backgroundBoxBox">
            <div className="h-full bg-evaluationBarWhite" style={{ width: "100%" }} />
          </div>
          <div className="text-[11px] text-foregroundGrey">{t("analisa.statistik.terakhir")} {tanggalUpdate(lastUpdate)}</div>
        </div>
      </div>

      {/* Header kanan: pemilih + tab + filter */}
      <div className="flex flex-col gap-2 rounded-borderRoundness bg-backgroundBox p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-lg font-bold text-foreground">{user}</span>
          <span className="text-xs text-foregroundGrey">ⓘ</span>
        </div>
        <div className="flex rounded-borderRoundness bg-backgroundBoxBox p-1">
          {tabKunci.map((x) => (
            <button
              key={x.k}
              type="button"
              onClick={() => setTab(x.k)}
              className={`flex-1 cursor-pointer rounded-borderRoundness px-2 py-1.5 text-sm font-bold transition-colors ${tab === x.k ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark" : "text-foregroundGrey hover:text-foregroundHighlighted"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex flex-col gap-1 text-[11px] font-bold text-foregroundGrey">
            {t("analisa.statistik.situs")}
            <select value={platform === "chessCom" ? "chessCom" : "lichessOrg"} onChange={(e) => setSitus(e.target.value)} className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-sm text-foreground outline-none">
              <option value="chessCom">Chess.com</option>
              <option value="lichessOrg">Lichess.org</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-foregroundGrey">
            {t("analisa.statistik.waktu")}
            <select value={waktu} onChange={(e) => setWaktu(e.target.value)} className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-sm text-foreground outline-none">
              <option value="any">{t("analisa.statistik.semuaWaktu")}</option>
              {pilihanWaktu.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
        </div>

        {tab === "ratings" ? (
          <div className="flex flex-wrap items-center gap-1">
            {["7d", "30d", "90d", "1y", "all"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRentang(r)}
                className={`cursor-pointer rounded-borderRoundness border px-2.5 py-1 text-xs font-bold transition-colors ${rentang === r ? "border-backgroundBoxBoxHighlighted bg-backgroundBoxBox text-foreground" : "border-border bg-backgroundBoxBox text-foregroundGrey hover:text-foregroundHighlighted"}`}
              >
                {t(`analisa.statistik.rentang.${r}`)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Konten tab */}
      <div className="flex flex-col gap-3 rounded-borderRoundness bg-backgroundBox p-3">
        {galat && !games ? (
          <KeteranganMuat isi={t("analisa.statistik.akunTidakDitemukan")} tombol={t("analisa.statistik.tarik")} onKlik={() => muatData(true)} />
        ) : games == null ? (
          <KeteranganMuat isi={memuatLagi ? t("analisa.statistik.tarikData") : t("analisa.statistik.memuat")} />
        ) : games.length === 0 ? (
          <KeteranganMuat isi={t("analisa.statistik.belumAdaData")} tombol={t("analisa.statistik.tarik")} onKlik={() => muatData(true)} />
        ) : tab === "overview" && overview ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm font-bold text-foreground">
              <span>{t("analisa.statistik.totalGame", { total: overview.total })}</span>
            </div>
            <div className="flex flex-col gap-1">
              <WdlBar w={overview.w} d={overview.d} l={overview.l} />
              <WdlNums w={overview.w} d={overview.d} l={overview.l} />
            </div>
            <GrafikTahunan data={overview.tahunan} />
          </div>
        ) : tab === "ratings" && ratings ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm font-bold text-foreground">
              <span>{t("analisa.statistik.totalGame", { total: ratings.total })}</span>
              <span className="text-xs text-foregroundGrey">
                {t("analisa.statistik.tinggi")}: {ratings.max} · {t("analisa.statistik.rendah")}: {ratings.min}
              </span>
            </div>
            <WdlBar w={ratings.poin.filter((p) => p.outcome === "win").length} d={ratings.poin.filter((p) => p.outcome === "draw").length} l={ratings.poin.filter((p) => p.outcome === "loss").length} />
            <GrafikRiwayat poin={ratings.poin} min={ratings.min} max={ratings.max} />
          </div>
        ) : tab === "openings" && openings ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-center text-sm font-bold text-foreground">{t("analisa.statistik.putih")}</div>
              {openings.putih.length ? openings.putih.map((e, i) => <BarisPembukaan key={e.nama + i} e={e} label={t("analisa.statistik.pembukaanLain")} t={t} />) : <p className="py-4 text-center text-sm text-foregroundGrey">—</p>}
            </div>
            <div>
              <div className="mb-1 text-center text-sm font-bold text-foreground">{t("analisa.statistik.hitam")}</div>
              {openings.hitam.length ? openings.hitam.map((e, i) => <BarisPembukaan key={e.nama + i} e={e} label={t("analisa.statistik.pembukaanLain")} t={t} />) : <p className="py-4 text-center text-sm text-foregroundGrey">—</p>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
