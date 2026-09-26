import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Cpu, FlipVertical2, Settings, Volume2, VolumeX, X } from "lucide-react";
import { Chess } from "chess.js";
import PapanTekaTeki from "../../TekaTeki/PapanTekaTeki.jsx";
import { DAFTAR_SET } from "../../../components/chess/ChessPiece.jsx";
import { berkasPublik } from "../../../lib/asets.js";
import { EngineCatur } from "../../../lib/engineCatur.js";
import { useI18n } from "../../../lib/i18n.jsx";
import { SUARA, gunakanSuara } from "../../../lib/suara.js";
import { FEN_AWAL, PILIHAN_WARNA_PAPAN } from "../konstanta.js";
import { gunakanDialog } from "../gunakanDialog.js";
import { susunPgn } from "../utilPapan.js";

const PILIHAN_LEVEL_MESIN = [
  {
    id: "beginner",
    keterampilan: 0,
    waktu: 250,
    label: "papan.pveLevelBeginner",
    ringkas: "papan.pveLevelBeginnerRingkas",
  },
  {
    id: "casual",
    keterampilan: 4,
    waktu: 350,
    label: "papan.pveLevelCasual",
    ringkas: "papan.pveLevelCasualRingkas",
  },
  {
    id: "intermediate",
    keterampilan: 8,
    waktu: 500,
    label: "papan.pveLevelIntermediate",
    ringkas: "papan.pveLevelIntermediateRingkas",
  },
  {
    id: "advanced",
    keterampilan: 12,
    waktu: 700,
    label: "papan.pveLevelAdvanced",
    ringkas: "papan.pveLevelAdvancedRingkas",
  },
  {
    id: "expert",
    keterampilan: 16,
    waktu: 1000,
    label: "papan.pveLevelExpert",
    ringkas: "papan.pveLevelExpertRingkas",
  },
  {
    id: "master",
    keterampilan: 20,
    waktu: 1400,
    label: "papan.pveLevelMaster",
    ringkas: "papan.pveLevelMasterRingkas",
  },
];

function hasilAkhir(game) {
  if (game.isCheckmate()) {
    return { jenis: "skakmat", pemenang: game.turn() === "w" ? "b" : "w" };
  }
  if (game.isDraw()) return { jenis: "seri", pemenang: null };
  return null;
}

function nilaiEvaluasiPutih(info, giliran) {
  if (!info || (info.cp === null && info.mate === null)) return null;
  const pembalik = giliran === "w" ? 1 : -1;
  return {
    cp: Number.isFinite(info.cp) ? info.cp * pembalik : null,
    mate: Number.isFinite(info.mate) ? info.mate * pembalik : null,
  };
}

function persentaseEvaluasi(evaluasi) {
  if (!evaluasi) return 50;
  if (evaluasi.mate !== null) return evaluasi.mate > 0 ? 100 : evaluasi.mate < 0 ? 0 : 50;
  const nilai = Number(evaluasi.cp) || 0;
  return Math.min(95, Math.max(5, 50 + nilai / 8));
}

function teksEvaluasi(evaluasi) {
  if (!evaluasi) return "0.0";
  if (evaluasi.mate !== null) return `M${Math.abs(evaluasi.mate)}`;
  const nilai = (Number(evaluasi.cp) || 0) / 100;
  return `${nilai > 0 ? "+" : ""}${nilai.toFixed(1)}`;
}

function BilahEvaluasi({ evaluasi, orientasi, label }) {
  const persenPutih = persentaseEvaluasi(evaluasi);
  const putihDiAtas = orientasi === "w";
  return (
    <div
      className={`relative flex w-8 shrink-0 overflow-hidden rounded-sm border border-[#494640] bg-[#403d39] ${
        putihDiAtas ? "justify-start" : "justify-end"
      }`}
      role="img"
      aria-label={`${label}: ${teksEvaluasi(evaluasi)}`}
    >
      <div
        className="w-full bg-[#f7f7f5] transition-[height] duration-700"
        style={{ height: `${persenPutih}%` }}
      />
      <span
        className={`absolute left-1/2 z-10 -translate-x-1/2 text-[10px] font-bold leading-none ${
          persenPutih >= 52 ? "top-2 text-[#292723]" : "bottom-2 text-white"
        }`}
        style={{ writingMode: "vertical-rl" }}
      >
        {teksEvaluasi(evaluasi)}
      </span>
    </div>
  );
}

function dialogMesin({ statusMesin, hasil, warnaMesin, langkahDialog, t }) {
  if (hasil?.jenis === "seri") {
    return { gambar: "small_06_nervous.png", teks: t("papan.pveDialogSeri") };
  }
  if (hasil?.jenis === "skakmat") {
    return hasil.pemenang === warnaMesin
      ? { gambar: "small_05_triumphant.png", teks: t("papan.pveDialogMenang") }
      : { gambar: "small_04_facepalm.png", teks: t("papan.pveDialogKalah") };
  }
  if (statusMesin === "gagal") {
    return { gambar: "small_08_rage.png", teks: t("papan.pveDialogGagal") };
  }
  if (statusMesin === "memuat") {
    return { gambar: "small_06_nervous.png", teks: t("papan.pveDialogMemuat") };
  }
  if (statusMesin === "mesin") {
    return { gambar: "small_02_thinking.png", teks: t("papan.pveDialogBerpikir") };
  }
  if (langkahDialog?.oleh === "mesin") {
    return {
      gambar: "small_07_smug.png",
      teks: t("papan.pveDialogJawab", { langkah: langkahDialog.san }),
    };
  }
  if (statusMesin === "pemain") {
    return { gambar: "small_01_taunting.png", teks: t("papan.pveDialogGiliran") };
  }
  return { gambar: "small_02_thinking.png", teks: t("papan.pveDialogSiap") };
}

function PengaturanPermainan({
  onTutup,
  t,
  setBidak,
  setSetBidak,
  tema,
  setTema,
  suaraNyala,
  setSuaraNyala,
  onBalikPapan,
}) {
  const refDialog = gunakanDialog(onTutup);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onTutup}
    >
      <section
        ref={refDialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t("papan.pvePengaturan")}
        className="w-full max-w-sm rounded-lg border border-[#3b3935] bg-[#1e1c18] p-5 text-gray-200 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-white">{t("papan.pvePengaturan")}</h2>
          <button
            type="button"
            onClick={onTutup}
            className="rounded p-1 text-gray-400 transition hover:bg-[#312e2b] hover:text-white"
            aria-label={t("papan.tutup")}
            title={t("papan.tutup")}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-400">
            {t("papan.setBidak")}
            <select
              data-autofokus
              value={setBidak}
              onChange={(event) => setSetBidak(event.target.value)}
              className="rounded-md border border-[#4a4742] bg-[#262421] px-3 py-2 text-sm font-normal text-gray-100 outline-none focus:border-[#81b64c]"
            >
              {DAFTAR_SET.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.nama}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-400">
            {t("papan.pveTemaPapan")}
            <select
              value={tema}
              onChange={(event) => setTema(event.target.value)}
              className="rounded-md border border-[#4a4742] bg-[#262421] px-3 py-2 text-sm font-normal text-gray-100 outline-none focus:border-[#81b64c]"
            >
              {PILIHAN_WARNA_PAPAN.map(([nilai, kunci]) => (
                <option key={nilai} value={nilai}>
                  {t(kunci)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-between gap-4 border-y border-[#312e2b] py-3">
            <span className="text-sm font-semibold text-gray-300">{t("papan.suara")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={suaraNyala}
              onClick={() => setSuaraNyala(!suaraNyala)}
              className={`flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-semibold transition ${
                suaraNyala
                  ? "border-[#81b64c] bg-[#81b64c]/15 text-[#b7dc8c]"
                  : "border-[#4a4742] bg-[#262421] text-gray-400"
              }`}
            >
              {suaraNyala ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {suaraNyala ? t("papan.suaraNyala") : t("papan.suaraMati")}
            </button>
          </div>

          <button
            type="button"
            onClick={onBalikPapan}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-[#4a4742] px-3 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-[#81b64c] hover:text-white"
          >
            <FlipVertical2 className="h-4 w-4" aria-hidden="true" />
            {t("papan.pveBalikPapan")}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function ManusiaVsMesin() {
  const { t } = useI18n();
  const [fen, setFen] = useState(FEN_AWAL);
  const fenRef = useRef(FEN_AWAL);
  const [riwayat, setRiwayat] = useState([]);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [langkahDialog, setLangkahDialog] = useState(null);
  const [tanda, setTanda] = useState({ panah: [], petak: {} });
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [warnaPemain, setWarnaPemain] = useState("w");
  const [orientasiPapan, setOrientasiPapan] = useState("w");
  const warnaMesin = warnaPemain === "w" ? "b" : "w";
  const [levelMesin, setLevelMesin] = useState("casual");
  const tingkatAktif = useMemo(
    () => PILIHAN_LEVEL_MESIN.find((level) => level.id === levelMesin) || PILIHAN_LEVEL_MESIN[1],
    [levelMesin]
  );
  const [setBidak, setSetBidak] = useState("alpha");
  const [tema, setTema] = useState("metal");
  const { nyala: suaraNyala, setNyala: setSuaraNyala, mainkan, mainkanLangkah: bunyikanLangkah } = gunakanSuara();
  const [tampilPengaturan, setTampilPengaturan] = useState(false);
  const [aktif, setAktif] = useState(false);
  const [statusMesin, setStatusMesin] = useState("idle");
  const [hasil, setHasil] = useState(null);
  const [pesan, setPesan] = useState("");
  const [evaluasi, setEvaluasi] = useState(null);
  const [pgnTersalin, setPgnTersalin] = useState(false);
  const mesinRef = useRef(null);
  const timerSalinRef = useRef(null);

  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);

  const mainkanLangkah = useCallback(
    (from, to, promotion) => {
      const game = new Chess(fenRef.current);
      const piece = game.get(from);
      const promosi = promotion || (piece?.type === "p" && (to.endsWith("1") || to.endsWith("8")) ? "q" : undefined);
      let pindah;
      try {
        pindah = game.move({ from, to, ...(promosi ? { promotion: promosi } : {}) });
      } catch {
        pindah = null;
      }
      if (!pindah) {
        setPesan(t("papan.pveLangkahTidakSah"));
        mainkan(SUARA.ilegal);
        return false;
      }

      const fenBaru = game.fen();
      fenRef.current = fenBaru;
      setFen(fenBaru);
      setRiwayat((lama) => [...lama, pindah.san]);
      setLangkahAkhir({ from: pindah.from, to: pindah.to });
      setLangkahDialog({ san: pindah.san, oleh: pindah.color === warnaMesin ? "mesin" : "pemain" });
      setTerpilih(null);
      setSasaran([]);
      setPesan("");
      bunyikanLangkah(pindah, game, { lawan: pindah.color === warnaMesin });
      const terminal = hasilAkhir(game);
      if (terminal) {
        mesinRef.current?.tamat();
        mesinRef.current = null;
        setHasil(terminal);
        setStatusMesin("selesai");
        setAktif(false);
      } else {
        setStatusMesin(game.turn() === warnaMesin ? "mesin" : "pemain");
      }
      return true;
    },
    [mainkan, bunyikanLangkah, t, warnaMesin]
  );

  // Worker hanya hidup selama mesin harus menjawab. Kekuatan dipasang lewat
  // opsi UCI sebelum pencarian dimulai, lalu worker dilepas saat mode ditutup.
  useEffect(() => {
    if (!aktif) return undefined;
    let game;
    try {
      game = new Chess(fen);
    } catch {
      return undefined;
    }
    if (game.isGameOver() || game.turn() !== warnaMesin) return undefined;

    let hidup = true;
    const engine = (mesinRef.current ||= new EngineCatur({ hash: 16, threads: 1 }));
    setStatusMesin("memuat");
    engine
      .mulai()
      .then(() => {
        if (!hidup || fenRef.current !== fen) return;
        // Skill Level adalah opsi resmi Stockfish dengan rentang 0 sampai 20.
        // Label tingkat tetap memakai rentang rating pemain yang diminta UI.
        engine.kirim(`setoption name Skill Level value ${tingkatAktif.keterampilan}`);
        setStatusMesin("mesin");
        engine.analisis(fen, {
          movetime: tingkatAktif.waktu,
          padaInfo: (info) => {
            if (!hidup || fenRef.current !== fen) return;
            setEvaluasi(nilaiEvaluasiPutih(info, game.turn()));
          },
          padaSelesai: (uci, _info, error) => {
            if (!hidup || fenRef.current !== fen) return;
            if (error || !uci || uci.length < 4) {
              setStatusMesin("gagal");
              return;
            }
            mainkanLangkah(uci.slice(0, 2), uci.slice(2, 4), uci[4]);
          },
        });
      })
      .catch(() => {
        if (hidup) setStatusMesin("gagal");
      });

    return () => {
      hidup = false;
      engine.setop();
    };
  }, [aktif, fen, warnaMesin, tingkatAktif, mainkanLangkah]);

  useEffect(
    () => () => {
      mesinRef.current?.tamat();
      mesinRef.current = null;
      window.clearTimeout(timerSalinRef.current);
    },
    []
  );

  const bolehGerak = useMemo(() => {
    if (!aktif || hasil || statusMesin === "mesin" || statusMesin === "memuat") return false;
    try {
      return new Chess(fen).turn() === warnaPemain;
    } catch {
      return false;
    }
  }, [aktif, hasil, statusMesin, fen, warnaPemain]);

  function tujuanLegal(square) {
    try {
      const game = new Chess(fenRef.current);
      const piece = game.get(square);
      if (!piece || piece.color !== warnaPemain || game.turn() !== warnaPemain) return [];
      return game.moves({ square, verbose: true }).map((move) => move.to);
    } catch {
      return [];
    }
  }

  function pilihPetak(square) {
    if (!bolehGerak) return;
    if (terpilih === square) {
      setTerpilih(null);
      setSasaran([]);
      return;
    }
    const targets = tujuanLegal(square);
    if (targets.length) {
      setTerpilih(square);
      setSasaran(targets);
    } else {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  function klikPetak(square) {
    if (!bolehGerak) return;
    if (terpilih && sasaran.includes(square)) {
      mainkanLangkah(terpilih, square);
      return;
    }
    pilihPetak(square);
  }

  function bersihkanPartai() {
    fenRef.current = FEN_AWAL;
    setFen(FEN_AWAL);
    setRiwayat([]);
    setLangkahAkhir(null);
    setLangkahDialog(null);
    setTanda({ panah: [], petak: {} });
    setTerpilih(null);
    setSasaran([]);
    setHasil(null);
    setPesan("");
    setEvaluasi(null);
    setPgnTersalin(false);
  }

  function siapkanPartaiBaru() {
    mesinRef.current?.tamat();
    mesinRef.current = null;
    bersihkanPartai();
    setAktif(false);
    setStatusMesin("idle");
  }

  function mulaiPartai() {
    mesinRef.current?.tamat();
    mesinRef.current = null;
    bersihkanPartai();
    setAktif(true);
    setStatusMesin("pemain");
    mainkan(SUARA.mulai);
  }

  function aksiPartai() {
    if (aktif) {
      siapkanPartaiBaru();
      return;
    }
    mulaiPartai();
  }

  function tandaPetak(petak, warna) {
    setTanda((lama) => {
      if (lama.petak[petak]) return { panah: [], petak: {} };
      return { ...lama, petak: { ...lama.petak, [petak]: warna } };
    });
  }

  function tandaPanah(from, to, warna) {
    setTanda((lama) => {
      const ada = lama.panah.some((panah) => panah.from === from && panah.to === to);
      const panah = ada
        ? lama.panah.filter((item) => !(item.from === from && item.to === to))
        : [...lama.panah, { from, to, warna }];
      return { ...lama, panah };
    });
  }

  function hapusSemuaTanda() {
    setTanda({ panah: [], petak: {} });
  }

  function salinPgn() {
    if (!riwayat.length) return;
    const selesai = () => {
      setPgnTersalin(true);
      window.clearTimeout(timerSalinRef.current);
      timerSalinRef.current = window.setTimeout(() => setPgnTersalin(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(susunPgn(riwayat)).then(selesai).catch(selesai);
    } else {
      selesai();
    }
  }

  function statusTeks() {
    if (hasil?.jenis === "seri") return t("papan.pveHasilSeri");
    if (hasil?.jenis === "skakmat") {
      return t(hasil.pemenang === "w" ? "papan.pvePutihMenang" : "papan.pveHitamMenang");
    }
    if (!aktif) return t("papan.pveBelumMulai");
    if (statusMesin === "memuat") return t("papan.pveMesinMemuat");
    if (statusMesin === "mesin") return t("papan.pveMesinBerpikir");
    if (statusMesin === "gagal") return t("papan.pveMesinGagal");
    return t("papan.pveGiliranPemain");
  }

  const giliranPenuh = riwayat.reduce((baris, san, index) => {
    if (index % 2 === 0) baris.push({ nomor: Math.floor(index / 2) + 1, putih: san, hitam: "" });
    else baris[baris.length - 1].hitam = san;
    return baris;
  }, []);
  const dialog = dialogMesin({ statusMesin, hasil, warnaMesin, langkahDialog, t });

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:overflow-hidden">
      <section
        aria-label={t("papan.pveJudul")}
        className="mx-auto flex min-h-0 w-full items-center justify-center lg:overflow-hidden"
      >
        <div className="flex w-full max-w-[560px] items-stretch justify-center gap-1.5 lg:max-w-none">
          <BilahEvaluasi evaluasi={evaluasi} orientasi={orientasiPapan} label={t("papan.pveEvaluasi")} />
          <div className="aspect-square w-full max-w-[520px] lg:w-[min(520px,calc(100dvh-140px),calc(100vw-634px))]">
            <PapanTekaTeki
              fen={fen}
              orientasi={orientasiPapan}
              terpilih={terpilih}
              sasaran={sasaran}
              langkahAkhir={langkahAkhir}
              tanda={tanda}
              terkunci={!bolehGerak}
              membeku={false}
              setBidak={setBidak}
              tema={tema}
              onKlik={klikPetak}
              onPilih={pilihPetak}
              onJatuh={(from, to) => bolehGerak && mainkanLangkah(from, to)}
              onTandaPetak={tandaPetak}
              onTandaPanah={tandaPanah}
              onHapusTanda={hapusSemuaTanda}
            />
          </div>
        </div>
      </section>

      <aside className="flex min-h-0 flex-col gap-3 rounded-lg border border-[#312e2b] bg-[#211f1c] p-4 lg:overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#4a4742] bg-[#262421] text-[#a7cf73]">
              <Cpu className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">Stockfish 18</p>
              <p className="text-[11px] text-gray-500">{statusTeks()}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTampilPengaturan(true)}
            className="rounded-md border border-[#4a4742] p-2 text-gray-300 transition hover:border-[#81b64c] hover:text-white"
            aria-label={t("papan.pvePengaturan")}
            title={t("papan.pvePengaturan")}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <section aria-label={t("papan.pveDialogMesin")} className="flex min-h-[104px] items-center gap-3 rounded-md border border-[#3b3935] bg-[#262421] p-3">
          <img
            src={berkasPublik(`/engine_expressions/${dialog.gambar}`)}
            alt={t("papan.pveDialogAvatar")}
            className="h-16 w-16 shrink-0 object-contain"
            width="64"
            height="64"
          />
          <p className="text-[13px] leading-5 text-gray-200" aria-live="polite">
            {dialog.teks}
          </p>
        </section>

        {aktif ? (
          <section aria-label={t("papan.pveKonfigurasiAktif")} className="rounded-md border border-[#3b3935] bg-[#262421] px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              {t("papan.pveKonfigurasiAktif")}
            </p>
            <p className="mt-1 text-sm text-gray-200">
              {t("papan.pveRingkasanKonfigurasi", {
                warna: warnaPemain === "w" ? t("papan.pvePutih") : t("papan.pveHitam"),
                level: t(tingkatAktif.ringkas),
              })}
            </p>
          </section>
        ) : (
          <section aria-label={t("papan.pveKonfigurasi")} className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              {t("papan.pveKonfigurasi")}
            </p>
            <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-gray-400">
              {t("papan.pveWarnaPemain")}
              <select
                value={warnaPemain}
                onChange={(event) => {
                  setWarnaPemain(event.target.value);
                  setOrientasiPapan(event.target.value);
                }}
                className="rounded-md border border-[#4a4742] bg-[#262421] px-2.5 py-2 text-sm font-normal text-gray-200 outline-none focus:border-[#81b64c]"
              >
                <option value="w">{t("papan.pvePutih")}</option>
                <option value="b">{t("papan.pveHitam")}</option>
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-gray-400">
              {t("papan.pveLevel")}
              <select
                value={levelMesin}
                onChange={(event) => setLevelMesin(event.target.value)}
                className="rounded-md border border-[#4a4742] bg-[#262421] px-2.5 py-2 text-sm font-normal text-gray-200 outline-none focus:border-[#81b64c]"
              >
                {PILIHAN_LEVEL_MESIN.map((level) => (
                  <option key={level.id} value={level.id}>
                    {t(level.ringkas)}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs leading-5 text-gray-400">{t(tingkatAktif.label)}</p>
            <p className="text-xs text-gray-500">
              {t("papan.pveKekuatan", { nilai: tingkatAktif.keterampilan, waktu: tingkatAktif.waktu })}
            </p>
          </section>
        )}

        <button
          type="button"
          onClick={aksiPartai}
          className="rounded-md bg-[#81b64c] px-4 py-2.5 text-sm font-bold text-[#1e1c18] transition hover:bg-[#91c45a]"
        >
          {aktif ? t("papan.pvePartaiBaru") : t("papan.pveMulai")}
        </button>

        <section className="flex min-h-0 flex-1 flex-col border-t border-[#312e2b] pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400">
              {t("papan.pveRiwayat")}
            </h2>
            <button
              type="button"
              onClick={salinPgn}
              disabled={!riwayat.length}
              className="flex items-center gap-1 rounded border border-[#4a4742] px-2 py-1 text-[11px] font-semibold text-gray-300 transition hover:border-[#81b64c] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {pgnTersalin ? t("papan.tersalinSingkat") : t("papan.salinPgn")}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-[#262421] p-2 text-sm">
            {giliranPenuh.length ? (
              <ol className="space-y-1">
                {giliranPenuh.map((row) => (
                  <li key={row.nomor} className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-gray-200">
                    <span className="text-gray-500">{row.nomor}.</span>
                    <span>{row.putih}</span>
                    <span>{row.hitam}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-gray-500">{t("papan.pveRiwayatKosong")}</p>
            )}
          </div>
        </section>
      </aside>

      {tampilPengaturan && (
        <PengaturanPermainan
          onTutup={() => setTampilPengaturan(false)}
          t={t}
          setBidak={setBidak}
          setSetBidak={setSetBidak}
          tema={tema}
          setTema={setTema}
          suaraNyala={suaraNyala}
          setSuaraNyala={setSuaraNyala}
          onBalikPapan={() => setOrientasiPapan((orientasi) => (orientasi === "w" ? "b" : "w"))}
        />
      )}
    </div>
  );
}
