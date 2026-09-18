/*
 * Panel statistik pemain (kolom kanan layar akun) — hanya info profile.
 * UPDATE: tombol tarik data dihapus — tarik data dipindah ke Database
 * dengan filter periode (mingguan/bulanan/tahunan/semua).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip } from "recharts";
import { useI18n } from "../../../lib/i18n.jsx";
import { ambilDaftarPartai, bacaRevisiBasis } from "../basisData.js";
import { ringkasanOverview, riwayatRating, rekapPembukaan } from "./statsAkun.js";
import { analisisRiwayatAntiCheat, BATAS_PARTAI, KEDALAMAN_AGGREGAT } from "./antiCheatRiwayat.js";
import { MULTI_PV } from "../mesin/engine.js";
import { unduhLaporanPeninjauan } from "../mesin/laporanPeninjauan.js";
import { DAFTAR_FASE } from "../mesin/fase.js";
import { gunakanMesin } from "../konteks/mesin.jsx";
import Database from "../komponen/svg/database.jsx";
import DualRingSpinner from "../komponen/loading/DualRingSpinner.jsx";

const BIRU = "#4a9dd9";

const cachePartai = new Map();

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

function GrafikTahunan({ data }) {
  const [tahun, setTahun] = useState(null);
  const bars = tahun ? data.filter((x) => x.tahun === tahun) : data;
  const max = Math.max(1, ...data.map((x) => x.jumlah));
  return (
    <div className="relative">
      <svg viewBox="0 0 560 210" preserveAspectRatio="none" className="h-48 w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = 200 - f * 200;
          return <line key={f} x1={0} y1={y} x2={560} y2={y} stroke="var(--analisa-foregroundGrey)" strokeOpacity="0.2" strokeDasharray="3 3" />;
        })}
        {bars.map((x, i) => {
          const bw = bars.length ? (560 / bars.length) * 0.7 : 40;
          const cx = bars.length === 1 ? 280 : (i + 0.5) * (560 / bars.length);
          const h = (x.jumlah / max) * 200;
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

function BarisPembukaan({ e }) {
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

/*
 * Kartu hasil anti-cheat agregat. Warna level memakai token highlight yang
 * sama dengan label langkah (hijau → kuning → merah) supaya satu bahasa warna
 * berlaku di seluruh halaman Analisa.
 */
const KELAS_LEVEL = {
  rendah: "text-highlightBest",
  sedang: "text-highlightInaccuracy",
  tinggi: "text-highlightBlunder",
};

function BarisAntiCheat({ label, nilai, kelas }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-foregroundGrey">{label}</span>
      <span className={`font-bold ${kelas ?? "text-foreground"}`}>{nilai}</span>
    </div>
  );
}

function RingkasanAntiCheat({ agregat }) {
  const { t } = useI18n();
  const persen = (n) => (Number.isFinite(n) ? `${n.toFixed(1)}%` : "-");
  const cp = (n) => (Number.isFinite(n) ? `${n.toFixed(1)} cp` : "-");
  const rasio = (n) => (Number.isFinite(n) ? `${Math.round(n * 100)}%` : "-");
  const level = agregat.level ?? "tidakAda";
  const arah = agregat.tren?.arah ?? "tidakAda";

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.skor")}</span>
          <span className={`text-4xl font-bold leading-none ${KELAS_LEVEL[level] ?? "text-foreground"}`}>
            {Number.isFinite(agregat.skor) ? agregat.skor : "-"}
          </span>
        </div>
        <span className={`text-sm font-bold ${KELAS_LEVEL[level] ?? "text-foregroundGrey"}`}>
          {t(`analisa.antiCheat.level.${level}`)}
        </span>
      </div>

      <p className="text-xs leading-4 text-foregroundGrey">
        {agregat.andal
          ? t("analisa.antiCheat.riwayat.andal", { partai: agregat.jumlahPartai, langkah: agregat.jumlahLangkah })
          : t("analisa.antiCheat.riwayat.tidakAndal", { partai: agregat.jumlahPartai, langkah: agregat.jumlahLangkah })}
      </p>

      {Number.isFinite(agregat.rating) ? (
        <p className="text-xs leading-4 text-foregroundGrey">
          {t("analisa.antiCheat.riwayat.kalibrasi", { n: Math.round(agregat.rating) })}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.kecocokan")} nilai={persen(agregat.engineMatchRate)} />
        {agregat.kandidatSampel > 0 ? (
          <>
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.kecocokanTop3")}
              nilai={persen(agregat.kecocokanTop3)}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.rataPeringkat")}
              nilai={`${agregat.rataPeringkat ?? "-"} / ${MULTI_PV + 1}`}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.acplKandidat")}
              nilai={cp(agregat.acplKandidat)}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.kecocokanSulit")}
              nilai={persen(agregat.kecocokanSulit)}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.kecocokanMudah")}
              nilai={persen(agregat.kecocokanMudah)}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.streak")}
              nilai={String(agregat.streakTerpanjang ?? 0)}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.korelasiWaktu")}
              nilai={Number.isFinite(agregat.korelasiWaktuKualitas) ? agregat.korelasiWaktuKualitas.toFixed(2) : "-"}
            />
          </>
        ) : null}
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.acpl")} nilai={cp(agregat.acpl)} />
        {/* Metrik sepadan platform lain (mesin/akurasi.js) — lihat catatanMetrikBaku. */}
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.acplBaku")} nilai={cp(agregat.acplBaku)} />
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.akurasi")} nilai={persen(agregat.akurasi)} />
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.waktu")} nilai={rasio(agregat.konsistensiWaktu)} />
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.langkah")} nilai={String(agregat.jumlahLangkah)} />
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
        <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.perFase")}</span>
        {DAFTAR_FASE.map((f) => (
          <BarisAntiCheat
            key={f}
            label={t(`analisa.antiCheat.fase.${f}`)}
            nilai={`${persen(agregat.perFase[f].engineMatchRate)} · ${cp(agregat.perFase[f].acpl)}`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.riwayat.tren")}</span>
          <span className="text-xs font-bold text-foreground">{t(`analisa.antiCheat.riwayat.arah.${arah}`)}</span>
        </div>
        {Number.isFinite(agregat.tren?.kemiringan) ? (
          <span className="text-xs text-foregroundGrey">
            {t("analisa.antiCheat.riwayat.kemiringan", { n: agregat.tren.kemiringan.toFixed(1) })}
          </span>
        ) : null}
      </div>

      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border text-foregroundGrey">
            <th className="py-1 font-bold">{t("analisa.antiCheat.riwayat.kolomPartai")}</th>
            <th className="py-1 text-right font-bold">{t("analisa.antiCheat.riwayat.kolomLangkah")}</th>
            <th className="py-1 text-right font-bold">{t("analisa.antiCheat.riwayat.kolomSkor")}</th>
          </tr>
        </thead>
        <tbody>
          {agregat.partai.map((b, i) => (
            <tr key={`${b.id}-${i}`} className="border-b border-border/50 align-top">
              <td className="py-1">
                <span className="block truncate text-foreground">
                  {t("analisa.antiCheat.riwayat.vs", { lawan: b.lawan || "-" })}
                </span>
                <span className="block text-[11px] text-foregroundGrey">
                  {b.timestamp ? new Date(b.timestamp).toISOString().split("T")[0] : "-"}
                  {b.timeClass ? ` · ${b.timeClass}` : ""}
                </span>
              </td>
              <td className="py-1 text-right text-foregroundGrey">{b.langkahDinilai}</td>
              <td className={`py-1 text-right font-bold ${KELAS_LEVEL[b.level] ?? "text-foregroundGrey"}`}>
                {Number.isFinite(b.skor) ? b.skor : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardAkun({ platform, username }) {
  const { t } = useI18n();
  const [tab, setTab] = useState("overview");
  const [situs, setSitus] = useState(platform);
  const [waktu, setWaktu] = useState("any");
  const [rentang, setRentang] = useState("all");
  const koleksiIdAwal = `${platform}:${String(username || "").trim().toLowerCase()}`;
  const bacaCachePartai = (id) => {
    const entri = cachePartai.get(id);
    return entri && entri.revisi === bacaRevisiBasis() ? entri.daftar : null;
  };
  const [games, setGames] = useState(() => bacaCachePartai(koleksiIdAwal));
  const [gamesPgn, setGamesPgn] = useState(null);
  const user = String(username || "").trim();
  const tokenMuat = useRef(0);

  /* Ganti akun: buang partai akun lama secara sinkron saat render (bukan
   * menunggu efek), supaya statistik akun sebelumnya tidak tampil sejenak
   * di bawah nama akun baru. */
  const koleksiIdRef = useRef(koleksiIdAwal);
  if (koleksiIdRef.current !== koleksiIdAwal) {
    koleksiIdRef.current = koleksiIdAwal;
    setGames(bacaCachePartai(koleksiIdAwal));
    setGamesPgn(null);
  }

  /*
   * Anti-cheat agregat. Analisisnya mahal (Stockfish sekali per langkah), jadi
   * TIDAK pernah berjalan otomatis saat tab dibuka — pengguna menekan tombol,
   * melihat progres, dan bisa membatalkan. Lihat ./antiCheatRiwayat.js untuk
   * batas partai, kedalaman, dan cache.
   */
  const mesin = gunakanMesin();
  const [acHasil, setAcHasil] = useState(null);
  const [acStatus, setAcStatus] = useState("kosong"); // kosong | jalan | selesai | batal | galat
  const [acProgres, setAcProgres] = useState({ ke: 0, total: 0 });
  const [acPesan, setAcPesan] = useState("");
  const acController = useRef(null);

  const muatData = useCallback(async () => {
    const token = ++tokenMuat.current;
    const koleksiId = `${platform}:${user.toLowerCase()}`;
    const entri = cachePartai.get(koleksiId);
    if (entri && entri.revisi === bacaRevisiBasis()) {
      setGames(entri.daftar);
      return;
    }
    setGames(null);
    setGamesPgn(null);
    try {
      const daftar = (await ambilDaftarPartai({ koleksiId, limit: 0, sertakanPgn: false }))?.partai || [];
      if (token !== tokenMuat.current) return;
      if (daftar.length > 0) cachePartai.set(koleksiId, { revisi: bacaRevisiBasis(), daftar });
      setGames(daftar);
    } catch {
      if (token !== tokenMuat.current) return;
      setGames([]);
    }
  }, [platform, user]);

  useEffect(() => {
    if (user) muatData();
  }, [user, muatData]);

  useEffect(() => setSitus(platform), [platform]);

  useEffect(() => {
    setGamesPgn(null);
  }, [platform, user]);

  /* Ganti akun = hasil anti-cheat akun lama tidak boleh ikut terbaca. */
  useEffect(() => {
    acController.current?.abort();
    acController.current = null;
    setAcHasil(null);
    setAcStatus("kosong");
    setAcProgres({ ke: 0, total: 0 });
    setAcPesan("");
  }, [platform, user]);

  /* Keluar dari halaman: hentikan pencarian engine yang masih berjalan. */
  useEffect(
    () => () => {
      acController.current?.abort();
      acController.current = null;
    },
    []
  );

  const batalkanAntiCheat = useCallback(() => {
    acController.current?.abort();
    acController.current = null;
    mesin.setop();
    setAcStatus((sekarang) => (sekarang === "jalan" ? "batal" : sekarang));
  }, [mesin]);

  const jalankanAntiCheat = useCallback(async () => {
    acController.current?.abort();
    const controller = new AbortController();
    acController.current = controller;
    const { signal } = controller;

    setAcStatus("jalan");
    setAcPesan("");
    setAcProgres({ ke: 0, total: 0 });
    // Pesan galat dikumpulkan di variabel lokal, bukan dibaca dari state:
    // `setAcPesan` belum terlihat di dalam run yang sama.
    let pesanGalat = "";

    try {
      /*
       * Hanya `BATAS_PARTAI` partai terbaru yang teks PGN-nya dibaca dari
       * IndexedDB — bukan `limit: 0` seperti tab Pembukaan, yang menarik
       * seluruh arsip (ribuan teks PGN) ke memori.
       */
      const koleksiId = `${platform}:${user.toLowerCase()}`;
      const daftar =
        (await ambilDaftarPartai({ koleksiId, limit: BATAS_PARTAI, sertakanPgn: true, urut: "tanggal", arah: "desc" }))
          ?.partai || [];
      if (signal.aborted) return;

      const mesinSiap = await mesin.siapkan();
      if (signal.aborted) return;

      const keluaran = await analisisRiwayatAntiCheat({
        partai: daftar,
        username: user,
        mesin: mesinSiap,
        sinyal: signal,
        progres: ({ jenis, ke, total, pesan }) => {
          if (signal.aborted) return;
          if (jenis === "galat") {
            pesanGalat ||= pesan;
            setAcPesan(pesan);
            return;
          }
          setAcProgres({ ke, total });
        },
      });
      if (signal.aborted) return;

      setAcHasil(keluaran);
      setAcStatus(keluaran.dibatalkan ? "batal" : keluaran.agregat.jumlahPartai > 0 ? "selesai" : "galat");
      setAcPesan(pesanGalat || keluaran.galat[0]?.pesan || "");
    } catch (e) {
      if (signal.aborted) return;
      setAcStatus("galat");
      setAcPesan(e?.message ?? String(e));
    }
  }, [platform, user, mesin]);

  useEffect(() => {
    if (tab !== "openings" || !user) {
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
  }, [tab, platform, user]);

  const gamesEfektif = tab === "openings" ? gamesPgn : games;
  const filteredGames = useMemo(() => (gamesEfektif ? gamesEfektif.filter((p) => p.platform === situs) : gamesEfektif), [gamesEfektif, situs]);
  const opsi = useMemo(() => ({ rentang: tab === "ratings" ? rentang : "all", timeClass: waktu }), [rentang, waktu, tab]);

  const overview = useMemo(() => (filteredGames ? ringkasanOverview(filteredGames, user, opsi) : null), [filteredGames, user, opsi]);
  const ratings = useMemo(() => (filteredGames ? riwayatRating(filteredGames, user, { rentang }) : null), [filteredGames, user, rentang]);
  const openings = useMemo(() => (filteredGames ? rekapPembukaan(filteredGames, user, opsi) : null), [filteredGames, user, opsi]);

  const pilihanWaktu = ["any", "bullet", "blitz", "rapid", "classical"].filter((k) => games?.some((p) => p.timeClass === k));

  const tabKunci = [
    { k: "overview", label: t("analisa.statistik.overview") },
    { k: "ratings", label: t("analisa.statistik.ratings") },
    { k: "openings", label: t("analisa.statistik.openings") },
    { k: "antiCheat", label: t("analisa.statistik.antiCheat") },
  ];

  const acPersen = acProgres.total > 0 ? Math.round((acProgres.ke / acProgres.total) * 100) : 0;

  const totalPutih = openings?.putih.reduce((s, e) => s + e.jumlah, 0) || 0;
  const totalHitam = openings?.hitam.reduce((s, e) => s + e.jumlah, 0) || 0;

  if (!user) {
    return (
      <div className="flex h-full w-full flex-col p-1">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox">
          <KosongState isi={t("analisa.akun.kosongJudul")} sub={t("analisa.akun.kosongIsi")} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox">
        <div className="relative px-4 pt-4">
          <span className="block text-center text-xl font-bold text-foreground">{user}</span>
          <span className="absolute right-3 top-3 text-xs text-foregroundGrey">ⓘ</span>
        </div>

        {/* `flex-wrap`: empat tab tidak muat satu baris di panel sempit. */}
        <div className="flex flex-wrap border-b border-border px-4 pt-2">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {games == null || (tab === "openings" && gamesPgn == null) ? (
            <MuatNegara isi={t("analisa.statistik.memuat")} />
          ) : games.length === 0 ? (
            <KosongState isi={t("analisa.statistik.belumAdaData")} sub="Buka menu Database untuk tarik data dengan filter minggu/bulan/tahun." />
          ) : tab === "overview" && overview ? (
            <div className="flex min-h-full flex-col gap-3">
              <div className="pt-4 text-center text-lg font-bold text-foreground">{t("analisa.statistik.totalGame", { total: overview.total })}</div>
              {overview.total > 0 ? <BarHasil w={overview.w} d={overview.d} l={overview.l} tinggi="2rem" /> : null}
              <div className="mt-auto">
                <GrafikTahunan data={overview.tahunan} />
              </div>
            </div>
          ) : tab === "ratings" && ratings ? (
            <div className="flex flex-col gap-6 pt-2">
              <div className="text-center text-lg font-bold text-foreground">{t("analisa.statistik.totalGame", { total: ratings.total })}</div>
              {ratings.total > 0 ? (
                <div className="flex flex-col gap-4">
                  <BarHasil w={ratings.poin.filter((p) => p.outcome === "win").length} d={ratings.poin.filter((p) => p.outcome === "draw").length} l={ratings.poin.filter((p) => p.outcome === "loss").length} tinggi="2rem" />
                  <div className="mt-10">
                    <GrafikRiwayat poin={ratings.poin} min={ratings.min} max={ratings.max} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-foregroundGrey pt-2">
                    <span>{t("analisa.statistik.rendah")}: {ratings.min}</span>
                    <span>{t("analisa.statistik.tinggi")}: {ratings.max}</span>
                  </div>
                </div>
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
          ) : tab === "antiCheat" ? (
            <div className="flex flex-col gap-3 pt-4">
              <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.isi")}</p>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-4 text-foregroundGrey">
                <li>{t("analisa.antiCheat.riwayat.batas", { n: BATAS_PARTAI, user })}</li>
                <li>{t("analisa.antiCheat.riwayat.kedalaman", { n: KEDALAMAN_AGGREGAT })}</li>
                <li>{t("analisa.antiCheat.riwayat.multipv", { n: MULTI_PV })}</li>
                <li>{t("analisa.antiCheat.riwayat.cache")}</li>
              </ul>

              {acStatus === "jalan" ? (
                <div className="flex flex-col gap-2">
                  <div className="h-2 w-full overflow-hidden rounded-md bg-backgroundBoxBox">
                    <div
                      className="h-full bg-backgroundBoxBoxHighlighted transition-[width] duration-200"
                      style={{ width: `${acPersen}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-foregroundGrey">
                    <span>{t("analisa.antiCheat.riwayat.progres", { ke: acProgres.ke, total: acProgres.total || BATAS_PARTAI })}</span>
                    <button
                      type="button"
                      onClick={batalkanAntiCheat}
                      className="cursor-pointer font-bold text-foreground transition-colors hover:text-foregroundHighlighted"
                    >
                      {t("analisa.antiCheat.riwayat.batal")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={jalankanAntiCheat}
                  className="w-fit cursor-pointer rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-4 py-2 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover"
                >
                  {acHasil ? t("analisa.antiCheat.riwayat.mulaiUlang") : t("analisa.antiCheat.riwayat.mulai", { n: BATAS_PARTAI })}
                </button>
              )}

              {acStatus === "batal" ? (
                <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.dibatalkan")}</p>
              ) : null}
              {acStatus === "galat" ? (
                <p className="text-xs leading-4 text-warning">
                  {t("analisa.antiCheat.riwayat.gagal", { pesan: acPesan || "-" })}
                </p>
              ) : null}

              {acHasil && acHasil.agregat.jumlahPartai > 0 ? <RingkasanAntiCheat agregat={acHasil.agregat} /> : null}
              {acHasil && acHasil.agregat.jumlahPartai > 0 && Number.isFinite(acHasil.durasi?.totalMs) ? (
                <p className="text-xs leading-4 text-foregroundGrey">
                  {t("analisa.antiCheat.riwayat.waktu", {
                    detik: Math.max(1, Math.round(acHasil.durasi.totalMs / 1000)),
                    ms: acHasil.durasi.rataMs ?? 0,
                  })}
                </p>
              ) : null}
              {acHasil && acHasil.agregat.jumlahPartai > 0 ? (
                <button
                  type="button"
                  onClick={() => unduhLaporanPeninjauan(acHasil.agregat, { username: user })}
                  className="w-fit cursor-pointer rounded-borderRoundness border border-border bg-backgroundBoxBox px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted"
                >
                  {t("analisa.antiCheat.riwayat.unduh")}
                </button>
              ) : null}
              {acHasil && acHasil.agregat.jumlahPartai === 0 ? (
                <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.riwayat.tanpaPartai")}</p>
              ) : null}

              <p className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 text-xs leading-4 text-foregroundGrey">
                {t("analisa.antiCheat.disclaimer")}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
