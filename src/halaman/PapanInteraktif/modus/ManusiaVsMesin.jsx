import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Brain, Cpu, Flag, FlipVertical2, Plus, Settings, Share2, Volume2, VolumeX, X } from "lucide-react";
import { Chess } from "chess.js";
import Profile from "../../Analisa/komponen/svg/profile.jsx";
import PapanTekaTeki from "../../TekaTeki/PapanTekaTeki.jsx";
import { DAFTAR_SET } from "../../../components/chess/ChessPiece.jsx";
import { berkasPublik } from "../../../lib/asets.js";
import { EngineCatur } from "../../../lib/engineCatur.js";
import { useI18n } from "../../../lib/i18n.jsx";
import { SUARA, gunakanSuara } from "../../../lib/suara.js";
import { FEN_AWAL, PILIHAN_WARNA_PAPAN } from "../konstanta.js";
import TangkapanBidak, { susunTangkapan } from "../TangkapanBidak.jsx";
import { gunakanDialog } from "../gunakanDialog.js";
import { fenDariLangkah, susunPgn } from "../utilPapan.js";
import { GESTUR, gesturLawan, petakRagu, posisiSulit } from "./gerakLawan.js";

const NAMA_MESIN = "Hikaru Nakamura";
const AVATAR_MESIN = berkasPublik("/engine_expressions/hikaru.png");

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

function BilahEvaluasi({ evaluasi, label }) {
  const persenPutih = persentaseEvaluasi(evaluasi);
  const teks = teksEvaluasi(evaluasi);
  const fillDiAtas = persenPutih >= 52;
  return (
    <div
      className="relative flex w-9 shrink-0 flex-col overflow-hidden self-stretch rounded-sm border border-[#494640] bg-[#403d39]"
      role="img"
      aria-label={`${label}: ${teks}`}
    >
      <div
        className="w-full shrink-0 bg-[#f7f7f5] transition-[height] duration-700"
        style={{ height: `${persenPutih}%` }}
      />
      <span
        className={`pointer-events-none absolute inset-x-0 z-10 flex justify-center py-1.5 text-[10px] font-bold leading-none ${
          fillDiAtas ? "top-0 text-[#292723]" : "bottom-0 text-white"
        }`}
      >
        {teks}
      </span>
    </div>
  );
}

function BarisProfil({ nama, putih, tangkapan, setBidak, avatar, namaDiBawah = false, className = "" }) {
  const labelNama = (
    <span
      className={`truncate text-sm font-bold text-[#fffaec] ${namaDiBawah ? "leading-tight" : ""}`}
    >
      {nama}
    </span>
  );
  const labelTangkapan = (
    <div className="flex min-h-[15px] items-center overflow-hidden">
      <TangkapanBidak daftar={tangkapan} set={setBidak} />
    </div>
  );
  return (
    <div className={`flex items-center justify-between gap-3 pl-[42px] pr-1 ${className}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-end justify-center overflow-hidden rounded-md shadow-md ${
            putih ? "bg-[#dbd9d6]" : "bg-[#474542]"
          }`}
        >
          {avatar ? (
            <img src={avatar} alt="" className="h-8 w-8 object-contain" loading="lazy" />
          ) : (
            <Profile height={32} width={32} class={putih ? "fill-[#ffffff]" : "fill-[#1d1c1a]"} />
          )}
        </div>
        <div className={`flex min-w-0 flex-col ${namaDiBawah ? "justify-end" : "justify-center"}`}>
          {namaDiBawah ? labelTangkapan : labelNama}
          {namaDiBawah ? labelNama : labelTangkapan}
        </div>
      </div>
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
  if (hasil?.jenis === "menyerah") {
    return { gambar: "small_04_facepalm.png", teks: t("papan.pveDialogMenyerah") };
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

function KonfirmasiMenyerah({ onTutup, onYa, t }) {
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
        aria-label={t("papan.pveKonfirmasiMenyerah")}
        className="w-full max-w-xs rounded-lg border border-[#3b3935] bg-[#1e1c18] p-5 text-gray-200 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-sm font-bold text-white">{t("papan.pveKonfirmasiMenyerah")}</h2>
        <p className="mt-2 text-xs leading-5 text-gray-400">{t("papan.pveKonfirmasiMenyerahKet")}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            data-autofokus
            onClick={onTutup}
            className="rounded-md border border-[#4a4742] px-3 py-2 text-sm font-semibold text-gray-200 transition hover:border-[#81b64c] hover:text-white"
          >
            {t("papan.pveTidak")}
          </button>
          <button
            type="button"
            onClick={onYa}
            className="rounded-md border border-red-800 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950/60"
          >
            {t("papan.pveYa")}
          </button>
        </div>
      </section>
    </div>
  );
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
  const riwayatRef = useRef([]);
  // Semua langkah yang pernah dimainkan, termasuk "masa depan" saat pengguna
  // menelusuri mundur — sumber untuk redo/ke akhir, persis ala mode Buku.
  const [riwayatLengkap, setRiwayatLengkap] = useState([]);
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
  const [konfirmasiMenyerah, setKonfirmasiMenyerah] = useState(false);
  const [aktif, setAktif] = useState(false);
  const [statusMesin, setStatusMesin] = useState("idle");
  const [hasil, setHasil] = useState(null);
  const [pesan, setPesan] = useState("");
  const [evaluasi, setEvaluasi] = useState(null);
  const [pgnTersalin, setPgnTersalin] = useState(false);
  const mesinRef = useRef(null);
  const papanRef = useRef(null);
  // Gestur klik lawan yang sedang berjalan: { dari, ke }. Berlaku hanya
  // beberapa ratus milidetik; menaikkan token membatalkan gerakan yang
  // sedang berjalan tanpa perlu menunggu Promise-nya.
  const lawanKlikRef = useRef(null);
  const tokenLawanRef = useRef(0);
  const timerSalinRef = useRef(null);

  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);

  useEffect(() => {
    riwayatRef.current = riwayat;
  }, [riwayat]);

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
      // Cabang baru: langkah baru memangkas riwayat "masa depan", supaya redo
      // tidak memutar jalur lama yang sudah tidak relevan.
      setRiwayatLengkap((lama) => [...lama.slice(0, riwayatRef.current.length), pindah.san]);
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

  /**
   * Langkah lawan memakai klik move: mesin mengklik bidaknya sendiri (sorotan
   * petak, titik tujuan, dan bidaknya bergoyang), diam beberapa detik, baru
   * melangkah. Di posisi yang dinilai sulit mesin kadang melirik satu-dua
   * bidak lain lebih dulu seperti sedang bimbang — langkah yang dijalankan
   * tetap hasil pencarian engine, gestur ini murni tampilan.
   *
   * Seluruh gesturnya ada di `gerakLawan.js` dan hanya dipakai mode ini.
   */
  const mainstreamkanLangkahLawan = useCallback(
    async (from, to, promosi, info) => {
      const token = (tokenLawanRef.current += 1);
      let jumlahLangkah = 0;
      try {
        jumlahLangkah = new Chess(fenRef.current).moves().length;
      } catch {
        jumlahLangkah = 0;
      }
      const ragu =
        posisiSulit(info, jumlahLangkah) && Math.random() < GESTUR.peluangRagu
          ? petakRagu(fenRef.current, warnaMesin, from)
          : [];
      // Petak yang boleh diproses selama jendela gestur: bidak yang dilirik
      // dan bidak yang benar-benar akan dijalankan. Selain itu diabaikan,
      // supaya klik pemain tidak menyelinap di tengah giliran mesin.
      lawanKlikRef.current = { dari: from, ke: to, boleh: [...ragu, from] };
      const selesai = await gesturLawan(papanRef.current, {
        dari: from,
        ragu,
        padaKlik: () => mainkan(SUARA.klik),
        masihBerlaku: () => token === tokenLawanRef.current,
      });
      if (!selesai || token !== tokenLawanRef.current) return;
      lawanKlikRef.current = null;
      mainkanLangkah(from, to, promosi);
    },
    [mainkan, mainkanLangkah, warnaMesin]
  );

  // Worker hanya hidup selama mesin harus menjawab. Kekuatan dipasang lewat
  // opsi UCI sebelum pencarian dimulai, lalu worker dilepas saat mode ditutup.
  useEffect(() => {
    if (!aktif) return undefined;
    // Saat pengguna menelusuri riwayat, mesin tetap diam dan baru menjawab
    // setelah posisi kembali ke langkah terakhir yang sudah dimainkan.
    if (riwayat.length < riwayatLengkap.length) return undefined;
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
          padaSelesai: (uci, info, error) => {
            if (!hidup || fenRef.current !== fen) return;
            if (error || !uci || uci.length < 4) {
              setStatusMesin("gagal");
              return;
            }
            mainstreamkanLangkahLawan(uci.slice(0, 2), uci.slice(2, 4), uci[4], info);
          },
        });
      })
      .catch(() => {
        if (hidup) setStatusMesin("gagal");
      });

    return () => {
      hidup = false;
      // Gestur klik lawan yang masih menunggu jeda harus dibatalkan, kalau tidak
      // bidaknya melangkah pada posisi yang sudah tidak berlaku.
      tokenLawanRef.current += 1;
      lawanKlikRef.current = null;
      engine.setop();
    };
  }, [aktif, fen, warnaMesin, tingkatAktif, mainstreamkanLangkahLawan, riwayat.length, riwayatLengkap.length]);

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

  function tujuanLegal(square, warnaBoleh = warnaPemain) {
    try {
      const game = new Chess(fenRef.current);
      const piece = game.get(square);
      if (!piece || piece.color !== warnaBoleh || game.turn() !== warnaBoleh) return [];
      return game.moves({ square, verbose: true }).map((move) => move.to);
    } catch {
      return [];
    }
  }

  function pilihPetak(square, warnaBoleh = warnaPemain) {
    const jendelaLawan = lawanKlikRef.current;
    if (!bolehGerak && !(jendelaLawan && (jendelaLawan.boleh || [jendelaLawan.dari]).includes(square)))
      return;
    if (terpilih === square) {
      setTerpilih(null);
      setSasaran([]);
      return;
    }
    const targets = tujuanLegal(square, warnaBoleh);
    if (targets.length) {
      setTerpilih(square);
      setSasaran(targets);
    } else {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  function klikPetak(square) {
    // Jendela klik lawan: hanya petak asalnya yang diproses, dan tetap bukan
    // pemain yang memindahkan bidak — mesin melangkah sendiri setelah jeda.
    const lawan = lawanKlikRef.current;
    if (lawan) {
      const boleh = lawan.boleh || [lawan.dari];
      if (boleh.includes(square)) pilihPetak(square, warnaMesin);
      return;
    }
    if (!bolehGerak) return;
    if (terpilih && sasaran.includes(square)) {
      mainkanLangkah(terpilih, square);
      return;
    }
    pilihPetak(square);
  }

  function bersihkanPartai() {
    tokenLawanRef.current += 1;
    lawanKlikRef.current = null;
    fenRef.current = FEN_AWAL;
    setFen(FEN_AWAL);
    riwayatRef.current = [];
    setRiwayat([]);
    setRiwayatLengkap([]);
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

  function mulaiPartai() {
    mesinRef.current?.tamat();
    mesinRef.current = null;
    bersihkanPartai();
    setAktif(true);
    setStatusMesin("pemain");
    mainkan(SUARA.mulai);
  }

  function menyerah() {
    if (!aktif || hasil) return;
    mesinRef.current?.tamat();
    mesinRef.current = null;
    setKonfirmasiMenyerah(false);
    setHasil({ jenis: "menyerah", pemenang: warnaMesin });
    setStatusMesin("selesai");
    setAktif(false);
    mainkan(SUARA.klik);
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

  /* ------------------------------------- navigasi langkah ala mode Buku */
  /** Menampilkan ulang posisi dari daftar SAN tanpa menyentuh mesin. */
  function terapkanNavigasi(daftarSan) {
    const fenBaru = fenDariLangkah(daftarSan, FEN_AWAL) || FEN_AWAL;
    fenRef.current = fenBaru;
    setFen(fenBaru);
    setRiwayat(daftarSan);
    setLangkahAkhir(null);
    setTerpilih(null);
    setSasaran([]);
  }

  function keAwal() {
    if (!riwayat.length) return;
    mainkan(SUARA.klik);
    terapkanNavigasi([]);
  }

  function undo() {
    if (!riwayat.length) return;
    mainkan(SUARA.klik);
    terapkanNavigasi(riwayat.slice(0, -1));
  }

  function redo() {
    if (riwayat.length >= riwayatLengkap.length) return;
    const sanBerikut = riwayatLengkap[riwayat.length];
    const game = new Chess(fenRef.current);
    let pindah;
    try {
      pindah = game.move(sanBerikut);
    } catch {
      return;
    }
    bunyikanLangkah(pindah, game);
    terapkanNavigasi([...riwayat, pindah.san]);
  }

  function keAkhir() {
    if (riwayat.length >= riwayatLengkap.length) return;
    mainkan(SUARA.klik);
    terapkanNavigasi([...riwayatLengkap]);
  }

  function salinPgn() {
    if (!riwayatLengkap.length) return;
    const selesai = () => {
      setPgnTersalin(true);
      window.clearTimeout(timerSalinRef.current);
      timerSalinRef.current = window.setTimeout(() => setPgnTersalin(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(susunPgn(riwayatLengkap)).then(selesai).catch(selesai);
    } else {
      selesai();
    }
  }

  function statusTeks() {
    if (hasil?.jenis === "seri") return t("papan.pveHasilSeri");
    if (hasil?.jenis === "menyerah") return t("papan.pveHasilMenyerah");
    if (hasil?.jenis === "skakmat") {
      return t(hasil.pemenang === "w" ? "papan.pvePutihMenang" : "papan.pveHitamMenang");
    }
    if (!aktif) return t("papan.pveBelumMulai");
    if (statusMesin === "memuat") return t("papan.pveMesinMemuat");
    if (statusMesin === "mesin") return t("papan.pveMesinBerpikir");
    if (statusMesin === "gagal") return t("papan.pveMesinGagal");
    return t("papan.pveGiliranPemain");
  }

  // Daftar disusun dari riwayat lengkap agar langkah yang sedang ditelusuri
  // masih terlihat; yang belum dimasuki posisi aktif tampil redup.
  const giliranPenuh = riwayatLengkap.reduce((baris, san, index) => {
    if (index % 2 === 0) baris.push({ nomor: Math.floor(index / 2) + 1, putih: san, hitam: "" });
    else baris[baris.length - 1].hitam = san;
    return baris;
  }, []);
  const dialog = dialogMesin({ statusMesin, hasil, warnaMesin, langkahDialog, t });
  // Ikon kartu mesin: lambang cip saat diam, lambang otak selama worker hidup
  // (baru dimuat maupun sedang berpikir). Kembali kecip begitu mesin selesai
  // menjawab, gagal, atau pertandingan berakhir.
  const IkonMesin = statusMesin === "memuat" || statusMesin === "mesin" ? Brain : Cpu;
  const tangkapan = useMemo(() => susunTangkapan(riwayat, FEN_AWAL), [riwayat]);
  // Susunan profil tetap: mesin di atas, pemain di bawah, apa pun orientasi papan.
  const barisSisi = (sisi) => ({
    nama: sisi === warnaPemain ? t("papan.pveAnda") : NAMA_MESIN,
    putih: sisi === "w",
    tangkapan: sisi === "w" ? tangkapan.olehPutih : tangkapan.olehHitam,
    avatar: sisi === warnaPemain ? null : AVATAR_MESIN,
  });

  return (
    // Konten dibatasi 1280px + padding md:px-8 dan kolom papan maksimal 520px,
    // sama seperti mode Analisa, sehingga lebar panel kanan ikut selalu sama.
    <div className="mx-auto grid h-full min-h-0 w-full max-w-[1280px] grid-cols-1 gap-4 overflow-y-auto p-4 md:px-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:overflow-hidden">
      <section
        aria-label={t("papan.pveJudul")}
        className="mx-auto flex min-h-0 w-full items-center justify-center lg:overflow-y-auto"
      >
        <div className="mx-auto my-auto flex w-full max-w-[520px] flex-col lg:w-[min(520px,calc(100dvh-140px),calc(100vw-634px))]">
          <BarisProfil {...barisSisi(warnaMesin)} setBidak={setBidak} className="mb-2" />
          <div className="flex w-full items-stretch justify-center gap-1.5">
            <BilahEvaluasi evaluasi={evaluasi} label={t("papan.pveEvaluasi")} />
            <div className="aspect-square w-full" ref={papanRef}>
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
          <BarisProfil
            {...barisSisi(warnaPemain)}
            setBidak={setBidak}
            namaDiBawah
            className="mt-3"
          />
        </div>
      </section>

      <aside className="flex min-h-0 flex-col gap-3 rounded-lg border border-[#312e2b] bg-[#211f1c] p-4 lg:overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#4a4742] bg-[#262421] text-[#a7cf73]">
              <IkonMesin className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{NAMA_MESIN}</p>
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

        {/* Kartu konfigurasi hanya tampil sebelum partido berjalan. Saat itu
           slot ini dipakai fitur pra-partai lain. */}
        {!aktif ? (
          <section aria-label={t("papan.pveKonfigurasi")} className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              {t("papan.pveKonfigurasi")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-gray-400">
                {t("papan.pveWarnaPemain")}
                <select
                  value={warnaPemain}
                  onChange={(event) => {
                    setWarnaPemain(event.target.value);
                    setOrientasiPapan(event.target.value);
                  }}
                  className="w-full rounded-md border border-[#4a4742] bg-[#262421] px-2.5 py-2 text-sm font-normal text-gray-200 outline-none focus:border-[#81b64c]"
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
                  className="w-full rounded-md border border-[#4a4742] bg-[#262421] px-2.5 py-2 text-sm font-normal text-gray-200 outline-none focus:border-[#81b64c]"
                >
                  {PILIHAN_LEVEL_MESIN.map((level) => (
                    <option key={level.id} value={level.id}>
                      {t(level.ringkas)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        ) : null}

        {/* Slot riwayat: hanya saat BPK berjalan. Sebelum itu ruangnya dipakai
            fitur pra-partai lain. */}
        {aktif ? (
          <section className="flex min-h-0 flex-1 flex-col border-t border-[#312e2b] pt-3">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              {t("papan.pveRiwayat")}
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-[#262421] p-2 text-sm">
              {giliranPenuh.length ? (
                <ol className="space-y-1">
                  {giliranPenuh.map((row, index) => (
                    <li key={row.nomor} className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-gray-200">
                      <span className="text-gray-500">{row.nomor}.</span>
                      <span className={index * 2 < riwayat.length ? undefined : "text-gray-600"}>
                        {row.putih}
                      </span>
                      <span className={index * 2 + 1 < riwayat.length ? undefined : "text-gray-600"}>
                        {row.hitam}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-gray-500">{t("papan.pveRiwayatKosong")}</p>
              )}
            </div>
          </section>
        ) : null}

        {/* Navigasi langkah — susunan, ikon, dan penonjolan status identik dengan
            mode Buku Pembukaan. */}
        {aktif ? (
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[#312e2b] bg-[#262421] p-1">
            <button
              type="button"
              onClick={keAwal}
              disabled={!riwayat.length}
              title={t("papan.keAwal")}
              aria-label={t("papan.keAwal")}
              className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={undo}
              disabled={!riwayat.length}
              title={t("papan.mundur")}
              aria-label={t("papan.mundur")}
              className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={riwayat.length >= riwayatLengkap.length}
              title={t("papan.maju")}
              aria-label={t("papan.maju")}
              className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={keAkhir}
              disabled={riwayat.length >= riwayatLengkap.length}
              title={t("papan.keAkhir")}
              aria-label={t("papan.keAkhir")}
              className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              ⏭
            </button>
          </div>
        ) : null}

        {/* Baris aksi dasar. Saat bermain susunannya identik dengan mode Buku
            Pembukaan; sebelum mulai, satu-satunya jalan keluar panel ini tombol Mulai. */}
        {aktif ? (
          <div className="grid shrink-0 grid-cols-4 gap-2 text-xs font-semibold text-gray-300">
            <button
              type="button"
              onClick={() => setKonfirmasiMenyerah(true)}
              className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b]"
            >
              <Flag className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span>{t("papan.pveMenyerah")}</span>
            </button>
            <button
              type="button"
              onClick={salinPgn}
              disabled={!riwayatLengkap.length}
              title={t("papan.daftarLangkahPgn")}
              className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Bookmark className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span>{pgnTersalin ? t("papan.tersalinSingkat") : t("papan.simpan")}</span>
            </button>
            <button
              type="button"
              onClick={mulaiPartai}
              disabled={!riwayatLengkap.length}
              title={t("papan.baru")}
              className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span>{t("papan.baru")}</span>
            </button>
            <button
              type="button"
              disabled
              title={t("papan.berbagi")}
              className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 text-gray-300 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Share2 className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span>{t("papan.berbagi")}</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={mulaiPartai}
            className="shrink-0 rounded-md bg-[#81b64c] px-4 py-2.5 text-sm font-bold text-[#1e1c18] transition hover:bg-[#91c45a]"
          >
            {t("papan.pveMulai")}
          </button>
        )}
      </aside>

      {konfirmasiMenyerah && (
        <KonfirmasiMenyerah
          onTutup={() => setKonfirmasiMenyerah(false)}
          onYa={menyerah}
          t={t}
        />
      )}

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
