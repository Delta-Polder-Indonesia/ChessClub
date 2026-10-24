/*
 * Panel statistik pemain (kolom kanan layar akun) — hanya info profile.
 * UPDATE: tombol tarik data dihapus — tarik data dipindah ke Database
 * dengan filter periode (mingguan/bulanan/tahunan/semua).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useI18n } from "../../../lib/i18n.jsx";
import { ambilDaftarPartai, bacaRevisiBasis } from "../basisData.js";
import { ringkasanOverview, riwayatRating, rekapPembukaan } from "./statsAkun.js";
import DaftarPembukaanAkun from "./DaftarPembukaanAkun.jsx";
import Database from "../komponen/svg/database.jsx";
import DualRingSpinner from "../komponen/loading/DualRingSpinner.jsx";

const BIRU = "#4a9dd9";

const cachePartai = new Map();

function GrafikBulanan({ data }) {
  if (!data || data.length === 0) {
    return <div className="grid h-48 place-items-center text-sm text-foregroundGrey">—</div>;
  }
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis
            dataKey="bulan"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(v) => {
              if (!v) return "";
              const [y, m] = String(v).split("-");
              const d = new Date(Number(y), Number(m) - 1, 1);
              return isNaN(d.getTime()) ? v : d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
            }}
            stroke="currentColor"
            className="text-xs text-foregroundGrey"
          />
          <YAxis allowDecimals={false} stroke="currentColor" className="text-xs text-foregroundGrey" />
          <Tooltip
            cursor={{ fill: "transparent" }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const [y, m] = String(label).split("-");
              const d = new Date(Number(y), Number(m) - 1, 1);
              const nama = isNaN(d.getTime()) ? label : d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
              return (
                <div className="rounded-lg border border-border bg-white p-2.5 text-xs text-black shadow-sm">
                  <div className="font-bold">{nama}</div>
                  <div>Partai: <span className="font-semibold">{payload[0].value}</span></div>
                </div>
              );
            }}
          />
          <Bar dataKey="jumlah" fill={BIRU} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function GrafikRiwayat({ poin }) {
  if (!poin || poin.length < 2) {
    return <div className="grid h-48 place-items-center text-sm text-foregroundGrey">—</div>;
  }

  const dataChart = poin.map((p) => ({
    tanggal: p.ts ? new Date(p.ts).toISOString().split("T")[0] : "",
    rating: p.rating,
    oppRating: p.oppRating,
    outcome: p.outcome,
    oppName: p.oppName,
  }));

  return (
    <div className="mt-4 h-48 w-full">
      <AreaChart
        accessibilityLayer
        data={dataChart}
        margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={BIRU} stopOpacity={0.4} />
            <stop offset="95%" stopColor={BIRU} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="tanggal"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value) => {
            if (!value) return "";
            const d = new Date(value);
            return isNaN(d.getTime()) ? value : d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
          }}
          stroke="currentColor"
          className="text-xs text-foregroundGrey"
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            const item = payload[0].payload;
            return (
              <div className="rounded-lg border-2 border-black bg-white p-2.5 text-xs text-black shadow-[4px_4px_0px_0px_#000]">
                <div className="font-bold">{label}</div>
                <div>Rating: <span className="font-semibold">{item.rating}</span></div>
                {item.oppName && <div>Lawan: {item.oppName} ({item.oppRating})</div>}
                <div>Hasil: <span className="uppercase font-bold">{item.outcome}</span></div>
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="rating" stroke={BIRU} strokeWidth={2.5} fillOpacity={1} fill="url(#colorRating)" />
      </AreaChart>
    </div>
  );
}

function MuatNegara({ isi }) {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <DualRingSpinner color={BIRU} />
      <span className="max-w-xs text-sm text-foregroundGrey">{isi}</span>
    </div>
  );
}

function KosongState({ isi, sub }) {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-backgroundBoxBoxHighlighted/20">
        <Database width={30} height={30} class="fill-backgroundBoxBoxHighlighted" />
      </div>
      <span className="max-w-xs text-sm font-bold text-foreground">{isi}</span>
      {sub ? <span className="max-w-xs text-xs leading-4 text-foregroundGrey">{sub}</span> : null}
    </div>
  );
}

const SEMUA_TAB_AKUN = ["overview", "ratings", "openings"];

export default function DashboardAkun({
  platform,
  username,
  daftarTab = SEMUA_TAB_AKUN,
  sebagaiKartu = false,
  partaiLuar = null,
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState(() => daftarTab[0] || "overview");
  const [situs, setSitus] = useState(platform);
  const [waktu, setWaktu] = useState("any");
  const [rentang, setRentang] = useState("all");
  const pakaiPartaiLuar = Array.isArray(partaiLuar);
  const koleksiIdAwal = `${platform}:${String(username || "").trim().toLowerCase()}`;
  const bacaCachePartai = (id) => {
    const entri = cachePartai.get(id);
    return entri && entri.revisi === bacaRevisiBasis() ? entri.daftar : null;
  };
  const [games, setGames] = useState(() => (pakaiPartaiLuar ? partaiLuar : bacaCachePartai(koleksiIdAwal)));
  const [gamesPgn, setGamesPgn] = useState(null);
  // `true` = muat terakhir GAGAL (bukan "akun kosong") — tampilkan kabar
  // galat, bukan panel kosong yang menuduh pengguna belum punya data.
  const [galatBasis, setGalatBasis] = useState(false);
  const user = String(username || "").trim();
  const tokenMuat = useRef(0);

  /* Ganti akun: buang partai akun lama secara sinkron saat render (bukan
   * menunggu efek), supaya statistik akun sebelumnya tidak tampil sejenak
   * di bawah nama akun baru. */
  const koleksiIdRef = useRef(koleksiIdAwal);
  if (!pakaiPartaiLuar && koleksiIdRef.current !== koleksiIdAwal) {
    koleksiIdRef.current = koleksiIdAwal;
    setGames(bacaCachePartai(koleksiIdAwal));
    setGamesPgn(null);
  }

  const muatData = useCallback(async () => {
    if (pakaiPartaiLuar) return;
    const token = ++tokenMuat.current;
    const koleksiId = `${platform}:${user.toLowerCase()}`;
    const entri = cachePartai.get(koleksiId);
    if (entri && entri.revisi === bacaRevisiBasis()) {
      setGames(entri.daftar);
      return;
    }
    setGames(null);
    setGamesPgn(null);
    setGalatBasis(false);
    try {
      const hasil = await ambilDaftarPartai({ koleksiId, limit: 0, sertakanPgn: false });
      if (token !== tokenMuat.current) return;
      setGalatBasis(Boolean(hasil?.galat));
      const daftar = hasil?.partai || [];
      if (daftar.length > 0) cachePartai.set(koleksiId, { revisi: bacaRevisiBasis(), daftar });
      setGames(daftar);
    } catch {
      if (token !== tokenMuat.current) return;
      setGalatBasis(true);
      setGames([]);
    }
  }, [pakaiPartaiLuar, platform, user]);

  useEffect(() => {
    if (user && !pakaiPartaiLuar) muatData();
  }, [user, pakaiPartaiLuar, muatData]);

  useEffect(() => setSitus(platform), [platform]);

  useEffect(() => {
    setGamesPgn(null);
  }, [platform, user]);

  useEffect(() => {
    if (pakaiPartaiLuar || tab !== "openings" || !user) {
      setGamesPgn(null);
      return undefined;
    }
    let hidup = true;
    setGamesPgn(null);
    (async () => {
      const koleksiId = `${platform}:${user.toLowerCase()}`;
      try {
        const denganPgn = await ambilDaftarPartai({ koleksiId, limit: 0, sertakanPgn: true });
        if (hidup) setGamesPgn(denganPgn.partai?.length ? denganPgn.partai : []);
      } catch {
        if (hidup) setGamesPgn([]);
      }
    })();
    return () => {
      hidup = false;
    };
  }, [pakaiPartaiLuar, tab, platform, user]);

  const sumberPartai = pakaiPartaiLuar ? partaiLuar : (tab === "openings" ? gamesPgn : games);
  const filteredGames = useMemo(
    () => (pakaiPartaiLuar ? partaiLuar : (sumberPartai ? sumberPartai.filter((p) => p.platform === situs) : sumberPartai)),
    [pakaiPartaiLuar, partaiLuar, sumberPartai, situs],
  );
  const opsi = useMemo(
    () => (pakaiPartaiLuar ? { rentang: "all", timeClass: "any" } : { rentang: tab === "ratings" ? rentang : "all", timeClass: waktu }),
    [pakaiPartaiLuar, rentang, waktu, tab],
  );
  const opsiRating = useMemo(
    () => ({ rentang: pakaiPartaiLuar ? "all" : rentang }),
    [pakaiPartaiLuar, rentang],
  );

  const overview = useMemo(() => (filteredGames ? ringkasanOverview(filteredGames, user, opsi) : null), [filteredGames, user, opsi]);
  const ratings = useMemo(() => (filteredGames ? riwayatRating(filteredGames, user, opsiRating) : null), [filteredGames, user, opsiRating]);
  const openings = useMemo(() => (filteredGames ? rekapPembukaan(filteredGames, user, opsi) : null), [filteredGames, user, opsi]);

  const pilihanWaktu = ["any", "bullet", "blitz", "rapid", "classical"].filter((k) => sumberPartai?.some((p) => p.timeClass === k));

  const tabKunci = [
    { k: "overview", label: t("analisa.statistik.overview") },
    { k: "ratings", label: t("analisa.statistik.ratings") },
    { k: "openings", label: t("analisa.statistik.openings") },
  ].filter((x) => daftarTab.includes(x.k));
  const tabAktif = tabKunci.some((x) => x.k === tab) ? tab : (tabKunci[0]?.k || "overview");

  const kelasPembungkus = sebagaiKartu
    ? "flex min-w-0 flex-col"
    : "flex h-full w-full flex-col p-1";
  const kelasKartu = sebagaiKartu
    ? "flex h-[300px] min-h-[300px] flex-col overflow-hidden rounded-[0.5rem] border border-border bg-backgroundBox"
    : "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox";
  const kelasIsi = sebagaiKartu
    ? "min-h-0 flex-1 overflow-y-auto px-4 pb-4"
    : "min-h-0 flex-1 overflow-y-auto px-4 pb-4";

  if (!user) {
    return (
      <div className={kelasPembungkus} data-uji="dashboard-akun">
        <div className={kelasKartu}>
          <KosongState isi={t("analisa.akun.kosongJudul")} sub={t("analisa.akun.kosongIsi")} />
        </div>
      </div>
    );
  }

  return (
    <div className={kelasPembungkus} data-uji="dashboard-akun">
      <div className={kelasKartu}>
        {!sebagaiKartu ? (
          <div className="relative px-4 pt-4">
            <span className="block text-center text-xl font-bold text-foreground">{user}</span>
            <span className="absolute right-3 top-3 text-xs text-foregroundGrey">ⓘ</span>
          </div>
        ) : null}

        {/* Tab membungkus agar tidak meluber di panel sempit. */}
        <div className="flex flex-wrap border-b border-border px-4 pt-2">
          {tabKunci.map((x) => (
            <button
              key={x.k}
              type="button"
              data-uji={`dashboard-akun-tab-${x.k}`}
              onClick={() => setTab(x.k)}
              className={`-mb-px cursor-pointer border-b-2 px-4 py-2 text-sm font-bold transition-colors ${
                tabAktif === x.k ? "border-[var(--analisa-backgroundBoxBoxHighlighted)] text-foreground" : "border-transparent text-foregroundGrey hover:text-foregroundHighlighted"
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>

        {!sebagaiKartu ? (
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
        ) : null}

        {!sebagaiKartu && tabAktif === "ratings" ? (
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

        <div className={kelasIsi}>
          {!pakaiPartaiLuar && (games == null || (tabAktif === "openings" && gamesPgn == null)) ? (
            <MuatNegara isi={t("analisa.statistik.memuat")} />
          ) : (filteredGames?.length ?? 0) === 0 ? (
            !pakaiPartaiLuar && galatBasis ? (
              <KosongState isi={t("analisa.statistik.galatBasis")} sub={t("analisa.statistik.galatBasisSub")} />
            ) : (
              <KosongState isi={t("analisa.statistik.belumAdaData")} sub="Buka menu Database untuk tarik data dengan filter minggu/bulan/tahun." />
            )
          ) : tabAktif === "overview" && overview ? (
            <div className="flex min-h-full flex-col gap-3" data-uji="dashboard-akun-overview">
              <div className="mt-auto">
                    <GrafikBulanan data={overview.bulanan} />
                  </div>
            </div>
          )           : tabAktif === "ratings" && ratings ? (
            <div className={`flex flex-col ${sebagaiKartu ? "gap-3 pt-4" : "gap-6 pt-2"}`} data-uji="dashboard-akun-ratings">
              {ratings.total > 0 ? (
                <div className="flex flex-col gap-4">
                  <div className={sebagaiKartu ? "mt-1" : "mt-10"}>
                    <GrafikRiwayat poin={ratings.poin} min={ratings.min} max={ratings.max} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-foregroundGrey pt-2">
                    <span>{t("analisa.statistik.rendah")}: {ratings.min}</span>
                    <span>{t("analisa.statistik.tinggi")}: {ratings.max}</span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : tabAktif === "openings" && openings ? (
            <DaftarPembukaanAkun putih={openings.putih} hitam={openings.hitam} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
