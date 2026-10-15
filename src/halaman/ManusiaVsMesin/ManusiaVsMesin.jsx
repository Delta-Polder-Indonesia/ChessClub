import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Brain, Cpu, Flag, FlipVertical2, Plus, Settings, Share2, Volume2, VolumeX, X } from "lucide-react";
import { Chess } from "chess.js";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { DAFTAR_SET } from "../../components/chess/pemuatBidak.js";
import { berkasPublik } from "../../lib/asets.js";
import { EngineCatur, URL_ENGINE_SUNFISH } from "../../lib/engineCatur.js";
import { useEngineCatur } from "../../lib/gunakanEngineCatur.js";
import { useMesinMaia } from "../../lib/gunakanMesinMaia.js";
import { useI18n } from "../../lib/i18n.jsx";
import { SUARA, useSuara } from "../../lib/suara.js";
import { FEN_AWAL, KUCI_NAMA_PROMOSI, PILIHAN_PROMOSI, PILIHAN_WARNA_PAPAN } from "../PapanInteraktif/bersama/konstanta.js";
import { PENGATURAN_AWAL, usePengaturanPapan } from "../PapanInteraktif/bersama/gunakanPengaturanPapan.js";
import { usePengaturanBersama } from "../PapanInteraktif/bersama/PengaturanKonteks.jsx";
import BilahEvaluasi from "../PapanInteraktif/bersama/BilahEvaluasi.jsx";
import { BarisProfil } from "../PapanInteraktif/bersama/BarisProfil.jsx";
import { susunTangkapan } from "../PapanInteraktif/bersama/TangkapanBidakData.js";
import { useDialog } from "../PapanInteraktif/bersama/gunakanDialog.js";
import TombolKeAwal from "../PapanInteraktif/bersama/TombolKeAwal.jsx";
import TombolMundur from "../PapanInteraktif/bersama/TombolMundur.jsx";
import TombolMaju from "../PapanInteraktif/bersama/TombolMaju.jsx";
import TombolKeAkhir from "../PapanInteraktif/bersama/TombolKeAkhir.jsx";
import { fenDariLangkah, susunPgn } from "../PapanInteraktif/bersama/utilPapan.js";
import { dialogMesin } from "./dialogMesin.js";
import IkonPutih from "../PapanInteraktif/bersama/ikon/white--sm.svg";
import IkonHitam from "../PapanInteraktif/bersama/ikon/black--sm.svg";
import IkonAcak from "../PapanInteraktif/bersama/ikon/random.svg";
import {
  PILIHAN_LEVEL_MESIN,
  PILIHAN_RATING_MAIA,
  PROFIL_SUNFISH,
  RATING_MAIA_BAKU,
  TAB_LEVEL_MESIN,
  langkahMesinSah,
  perintahProfilSunfish,
} from "./mesinLemah.js";
import { GESTUR, gesturLawan, petakRagu, posisiSulit } from "./gerakLawan.js";
import { useTandaBantu } from "../../lib/tandaBantu.js";

const NAMA_MESIN = "Hikaru Nakamura";
const AVATAR_MESIN = berkasPublik("/engine_expressions/hikaru.png");

/**
 * Ambil instance engine untuk jenis mesin level aktif, mengganti worker lama
 * bila jenisnya berbeda. Dua level bisa memakai binari yang berbeda
 * (Stockfish atau sunfish), sedangkan satu `EngineCatur` terikat pada satu URL.
 */
function ambilEngine(mesinRef, jenisRef, jenis) {
  if (mesinRef.current && jenisRef.current !== jenis) {
    mesinRef.current.tamat();
    mesinRef.current = null;
  }
  if (!mesinRef.current) {
    mesinRef.current = new EngineCatur(
      "sunfish" === jenis ? { url: URL_ENGINE_SUNFISH, hash: 16, threads: 1 } : { hash: 16, threads: 1 }
    );
    jenisRef.current = jenis;
  }
  return mesinRef.current;
}

function hasilAkhir(game) {
  if (game.isCheckmate()) {
    return { jenis: "skakmat", pemenang: game.turn() === "w" ? "b" : "w" };
  }
  if (game.isDraw()) return { jenis: "seri", pemenang: null };
  return null;
}

/**
 * Cari petak raja milik sisi tertentu (`"w"` atau `"b"`) pada posisi `fen`.
 * Untuk menempelkan lencana hasil (mahkota, raja tumbang, resign) di atas
 * petak raja yang tepat.
 *
 * @param {string} fen posisi papan
 * @param {string} warna "w" atau "b"
 * @returns {string|null} petak raja (mis. "e1") atau null bila tidak ditemukan
 */
function petakRajaWarna(fen, warna) {
  try {
    const game = new Chess(fen);
    for (const baris of game.board()) {
      for (const kotak of baris) {
        if (kotak && kotak.type === "k" && kotak.color === warna) return kotak.square;
      }
    }
  } catch { /* posisi tak terbaca */ }
  return null;
}

/**
 * Bangun instance Chess dengan histori posisi PENUH dari awal partai (mode
 * ini selalu berangkat dari `FEN_AWAL`), lewat replay deret SAN.
 *
 * `new Chess(fen)` memuat satu posisi tanpa histori — `_positionCount`
 * internalnya dibuang setiap `load()` — sehingga `isThreefoldRepetition()`
 * tidak akan pernah bernilai benar walau repetisi sungguhan sudah terjadi.
 * Deteksi akhir permainan wajib memakai instance yang mengumpulkan histori
 * dari langkah pertama, bukan instance sekali-muat seperti itu.
 *
 * @returns {import("chess.js").Chess|null} null bila replay gagal (SAN tidak
 *   sah) — pemanggil wajib menyediakan alternatif, jangan melempar.
 */
function gameDenganHistoriPenuh(daftarSan) {
  let game;
  try {
    game = new Chess();
  } catch {
    return null;
  }
  for (const san of daftarSan) {
    let pindah;
    try {
      pindah = game.move(san);
    } catch {
      pindah = null;
    }
    if (!pindah) return null;
  }
  return game;
}

function KonfirmasiMenyerah({ onTutup, onYa, t }) {
  const refDialog = useDialog(onTutup);

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

/**
 * Dialog hasil akhir partai (skakmat, remis, atau menyerah) gaya chess.com.
 * Tiga tombol: X menutup dialog agar pengguna bisa menelusuri riwayat langkah,
 * "Partai baru" kembali ke layar pemilihan warna/level, "Tanding ulang"
 * langsung memulai partai baru dengan pengaturan yang sama.
 */
function DialogSelesai({ hasil, statusTeks, onTutup, onPartaiBaru, onTandingUlang, t }) {
  const refDialog = useDialog(onTutup);
  const alasan =
    hasil.jenis === "skakmat"
      ? t("papan.pveSelesaiAlasanSkakmat")
      : hasil.jenis === "seri"
        ? t("papan.pveSelesaiAlasanSeri")
        : t("papan.pveSelesaiAlasanMenyerah");

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
        aria-label={t("papan.pveSelesaiJudul")}
        className="w-full max-w-xs rounded-lg border border-[#3b3935] bg-[#1e1c18] p-5 text-gray-200 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white">{t("papan.pveSelesaiJudul")}</h2>
            <p className="mt-1 text-sm font-semibold text-gray-200">{statusTeks}</p>
            <p className="mt-1 text-xs text-gray-400">{alasan}</p>
          </div>
          <button
            type="button"
            data-autofokus
            onClick={onTutup}
            aria-label={t("papan.tutup")}
            title={t("papan.tutup")}
            className="shrink-0 rounded p-1 text-gray-400 transition hover:bg-[#312e2b] hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPartaiBaru}
            className="rounded-md border border-[#4a4742] px-3 py-2 text-sm font-semibold text-gray-200 transition hover:border-[#81b64c] hover:text-white"
          >
            {t("papan.pvePartaiBaru")}
          </button>
          <button
            type="button"
            onClick={onTandingUlang}
            className="rounded-md bg-[#81b64c] px-3 py-2 text-sm font-bold text-[#1e1c18] transition hover:bg-[#91c45a]"
          >
            {t("papan.pveTandingUlang")}
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
  const refDialog = useDialog(onTutup);

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

export default function ManusiaVsMesin({ pengaturan = null }) {
  const { t } = useI18n();
  // Terima pengaturan dari tata letak /papan-interaktif/* (konteks bersama);
  // tanpa itu buat state lokal agar komponen tetap berdiri sendiri.
  const pengaturanLokal = usePengaturanPapan();
  const pengaturanBersama = usePengaturanBersama();
  const pp = (pengaturan ?? pengaturanBersama ?? pengaturanLokal).nilai ?? PENGATURAN_AWAL;

  const [fen, setFen] = useState(FEN_AWAL);
  const fenRef = useRef(FEN_AWAL);
  const [riwayat, setRiwayat] = useState([]);
  const riwayatRef = useRef([]);
  // Semua langkah yang pernah dimainkan, termasuk "masa depan" saat pengguna
  // menelusuri mundur — sumber untuk redo/ke akhir, persis ala mode Buku.
  const [riwayatLengkap, setRiwayatLengkap] = useState([]);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [langkahDialog, setLangkahDialog] = useState(null);
  const { tanda, tandaPetak, tandaPanah, hapusSemuaTanda } = useTandaBantu();
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [warnaPemain, setWarnaPemain] = useState("w");
  const [orientasiPapan, setOrientasiPapan] = useState("w");
  // Pilihan pemilih warna: "w" | "b" | "acak". "acak" baru diresolusi jadi
  // warna nyata saat Mulai ditekan, supaya papan pratinjau tetap masuk akal.
  const [warnaPilihan, setWarnaPilihan] = useState("w");
  const warnaMesin = warnaPemain === "w" ? "b" : "w";
  const [levelMesin, setLevelMesin] = useState("new-to-chess");
  // Tab pemilih engine: "stockfish" (daftar elo 100–3200; di bawah 2000
  // engine yang dipakai tetap sunfish) atau "maia" (rating pilih sendiri).
  // Tab hanya mengubah daftar level yang tampil; level yang benar-benar
  // dipakai tetap `levelMesin`.
  const [tabLevel, setTabLevel] = useState("stockfish");
  // Rating Maia dipisah dari `levelMesin` karena satu level menengah bisa
  // dipakai untuk seluruh rentang 600–2600 — Maia 3 menerima rating kontinu,
  // jadi tidak perlu satu entri per kekuatan seperti level Stockfish UCI_Elo
  // atau profil sunfish.
  const [ratingMaia, setRatingMaia] = useState(RATING_MAIA_BAKU);
  const tingkatAktif = useMemo(
    () => PILIHAN_LEVEL_MESIN.find((level) => level.id === levelMesin) || PILIHAN_LEVEL_MESIN[0],
    [levelMesin]
  );
  // Mesin Maia bersifat tunggal per tab (worker + sesi ONNX berat), jadi
  // pengait ini hanya memantau keadaannya dan menyalurkan rating pilihan.
  // `mintaLangkahMaia` sengaja dipisah: identitasnya stabil (useCallback),
  // sehingga efek giliran mesin tidak berulang setiap render.
  const maia = useMesinMaia({ rating: ratingMaia });
  const { mintaLangkah: mintaLangkahMaia, tamat: tamatMaia, mengunduh: maiaMengunduh, progres: progresMaia } = maia;
  // Inisialisasi tampilan papan dari pengaturan bersama (bila ada);
  // dialog pengaturan permainan bisa menimpa lokal selama sesi.
  const [setBidak, setSetBidak] = useState(pp.bidak ?? "alpha");
  const [tema, setTema] = useState(pp.warnaPapan ?? "metal");
  const { nyala: suaraNyala, setNyala: setSuaraNyala, mainkan, mainkanLangkah: bunyikanLangkah } = useSuara();
  const [tampilPengaturan, setTampilPengaturan] = useState(false);
  const [konfirmasiMenyerah, setKonfirmasiMenyerah] = useState(false);
  const [promosi, setPromosi] = useState(null); // { from, to, warna }
  const [tampilDialogSelesai, setTampilDialogSelesai] = useState(false);
  const [aktif, setAktif] = useState(false);
  // Evaluasi objektif memakai pintu yang sama dengan mode Buku. Worker ini
  // sengaja terpisah dari worker lawan: level lawan boleh dilemahkan tanpa
  // ikut memalsukan nilai pada bilah evaluasi.
  const {
    hasilEngine: hasilEvaluasi,
    nyalakanEngine: nyalakanEvaluasi,
    matikanEngine: matikanEvaluasi,
  } = useEngineCatur(fen);
  const [statusMesin, setStatusMesin] = useState("idle");
  const [hasil, setHasil] = useState(null);
  const [, setPesan] = useState("");
  const [pgnTersalin, setPgnTersalin] = useState(false);
  const mesinRef = useRef(null);
  // Jenis binari yang sedang dimuat worker ("sunfish" atau "stockfish") dan
  // benih derau per partai: benih tetap selama satu partai supaya kesalahan
  // lawan konsisten, dan berbeda tiap partai baru.
  const jenisMesinRef = useRef(null);
  const benihMesinRef = useRef(1);
  const langkahAkhirRef = useRef(null);
  const papanRef = useRef(null);
  // Gestur klik lawan yang sedang berjalan: { dari, ke }. Berlaku hanya
  // beberapa ratus milidetik; menaikkan token membatalkan gerakan yang
  // sedang berjalan tanpa perlu menunggu Promise-nya.
  const lawanKlikRef = useRef(null);
  const tokenLawanRef = useRef(0);
  const timerSalinRef = useRef(null);

  useEffect(() => {
    if (!promosi) return;
    function saatEscape(e) {
      if (e.key === "Escape") batalPromosi();
    }
    window.addEventListener("keydown", saatEscape);
    return () => window.removeEventListener("keydown", saatEscape);
  }, [promosi]);

  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);

  // Mulai Stockfish evaluator bersama saat partai dimulai.
  useEffect(() => {
    if (aktif) nyalakanEvaluasi();
    else matikanEvaluasi();
  }, [aktif, nyalakanEvaluasi, matikanEvaluasi]);

  // Evaluasi hanya berlaku untuk FEN yang benar-benar dihitung olehnya.
  // `useEngineCatur` sendiri sudah mengatur ulang `hasilEvaluasi` ke null
  // begitu posisi berganti (lihat efeknya), tetapi menahan objek lama di
  // state terpisah di sini dulu membuat bilah macet menampilkan evaluasi
  // posisi SEBELUMNYA selama engine masih menghitung posisi baru — nilai
  // lama tidak pernah tersentuh karena effect-nya mengabaikan reset ke null.
  // Memakai `hasilEvaluasi` langsung (dijaga identitas FEN-nya di sini, bukan
  // sekadar dipercaya) memastikan bilah masuk status "belum dievaluasi"
  // tepat saat FEN berganti, tanpa menunggu siklus render tambahan.
  const evaluasiAktif = useMemo(() => {
    if (!hasilEvaluasi || hasilEvaluasi.fen !== fen) return null;
    return hasilEvaluasi;
  }, [hasilEvaluasi, fen]);

  useEffect(() => {
    riwayatRef.current = riwayat;
  }, [riwayat]);

  // Dibaca efek mesin tanpa ikut jadi dependensi: petak tujuan langkah lawan
  // adalah pusat "tunnel vision" profil sunfish.
  useEffect(() => {
    langkahAkhirRef.current = langkahAkhir;
  }, [langkahAkhir]);

  const mainkanLangkah = useCallback(
    (from, to, promotion) => {
      const game = new Chess(fenRef.current);
      const piece = game.get(from);
      // Pemain: promosi tanpa pilihan → buka dialog (jangan langsung "q").
      // Mesin (promotion dari UCI) tetap memakai huruf yang dikirim engine.
      const bidakPromosi =
        promotion ||
        (piece?.type === "p" && (to.endsWith("1") || to.endsWith("8")) ? "q" : undefined);
      let pindah;
      try {
        pindah = game.move({ from, to, ...(bidakPromosi ? { promotion: bidakPromosi } : {}) });
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
      // Konteks langkah untuk pemilih dialog: siapa yang jalan dan peristiwa
      // apa saja yang terjadi (tangkapan, skak, rokade, promosi).
      setLangkahDialog({
        san: pindah.san,
        oleh: pindah.color === warnaMesin ? "mesin" : "pemain",
        tangkap: Boolean(pindah.captured),
        skak: game.inCheck(),
        rokade: pindah.san.startsWith("O-O"),
        promosi: Boolean(pindah.promotion),
      });
      setTerpilih(null);
      setSasaran([]);
      setPesan("");
      bunyikanLangkah(pindah, game, { lawan: pindah.color === warnaMesin });
      // Deteksi akhir permainan (termasuk threefold repetition) wajib memakai
      // histori penuh partai, bukan `game` (satu FEN + satu langkah): lihat
      // `gameDenganHistoriPenuh`. Kalau replay gagal (semestinya tidak
      // terjadi — semua SAN di sini sudah pernah tervalidasi), `game` dipakai
      // sebagai jatuhan sehingga skakmat/remis posisi tetap terdeteksi.
      const daftarSanBaru = [...riwayatRef.current, pindah.san];
      const terminal = hasilAkhir(gameDenganHistoriPenuh(daftarSanBaru) || game);
      if (terminal) {
        mesinRef.current?.tamat();
        mesinRef.current = null;
        setHasil(terminal);
        setStatusMesin("selesai");
        // `aktif` TIDAK diset false di sini: daftar langkah dan navigasi
        // harus tetap tampil setelah partai selesai agar pengguna bisa
        // mereview langkah-langkahnya. `hasil` sudah cukup untuk mencegah
        // langkah baru (lihat `bolehGerak`).
        setTampilDialogSelesai(true);
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
      let jumlahLangkah;
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

    // Maia 3 bukan engine UCI: ia model kebijakan manusia (ONNX) yang
    // dijalankan onnxruntime-web di worker sendiri. Tidak ada `go depth`,
    // tidak ada opsi kekuatan UCI (UCI_Elo/Skill Level) — kekuatannya
    // ditentukan oleh rating yang disuapkan ke model, dan satu inferensi
    // cukup untuk satu langkah.
    if ("maia" === tingkatAktif.mesin) {
      setStatusMesin("memuat");
      mintaLangkahMaia(fen)
        .then((hasilMaia) => {
          if (!hidup || fenRef.current !== fen) return;
          if (!hasilMaia?.uci) return; // tidak ada langkah sah: partai selesai
          setStatusMesin("mesin");
          mainstreamkanLangkahLawan(
            hasilMaia.uci.slice(0, 2),
            hasilMaia.uci.slice(2, 4),
            hasilMaia.uci[4],
            // Maia tidak mengeluarkan centipawn — hanya policy dan WDL.
            // Peluang menangnya dipetakan balik ke cp memakai kurva yang sama
            // dengan bilah evaluasi, supaya gestur "mesin ragu" (yang
            // menilai posisi tipis) tetap punya angka untuk dipakai.
            { cp: hasilMaia.cp }
          );
        })
        .catch(() => {
          if (hidup) setStatusMesin("gagal");
        });
      return () => {
        hidup = false;
        tokenLawanRef.current += 1;
        lawanKlikRef.current = null;
      };
    }

    const pakaiSunfish = "sunfish" === tingkatAktif.mesin;
    const engine = ambilEngine(mesinRef, jenisMesinRef, tingkatAktif.mesin);
    setStatusMesin("memuat");
    engine
      .mulai()
      .then(() => {
        if (!hidup || fenRef.current !== fen) return;
        if (pakaiSunfish) {
          // Level bawah: kekuatan diatur dengan merusak penilaian engine dari
          // dalam (lihat mesinLemah.js), bukan dengan mengacak pilihan langkah.
          const perintah = perintahProfilSunfish(PROFIL_SUNFISH[tingkatAktif.profilSunfish], {
            benih: benihMesinRef.current,
            petakLawan: langkahAkhirRef.current?.to ?? null,
          });
          for (const baris of perintah) engine.kirim(baris);
        } else {
          // Kekuatan Stockfish memakai kalibrasi resmi protokol UCI —
          // UCI_LimitStrength + UCI_Elo — bukan Skill Level manual, supaya
          // kekuatan riil BENAR-BY-CONSTRUCTION sama dengan angka label
          // rating di UI. `uciElo` wajib berada di rentang resmi 1320–3190:
          // nilai di luar rentang ditolak diam-diam oleh engine (dan akan
          // diam ke lantai default 1320, level terlemah).
          engine.kirim("setoption name UCI_LimitStrength value true");
          engine.kirim(`setoption name UCI_Elo value ${tingkatAktif.uciElo}`);
        }
        setStatusMesin("mesin");
        engine.analisis(fen, {
          movetime: tingkatAktif.waktu,
          kedalaman: tingkatAktif.kedalaman ?? null,
          padaSelesai: (uci, info, error) => {
            if (!hidup || fenRef.current !== fen) return;
            if (error) {
              setStatusMesin("gagal");
              return;
            }
            // Sunfish bisa menjawab langkah tidak sah (konsep skak "raja boleh
            // dimakan") atau "(none)". Itu bukan galat yang perlu dilihat
            // pemain: langkah sah acak menggantikannya.
            const pilihan = langkahMesinSah(fen, uci);
            if (!pilihan) return; // tidak ada langkah sah: partai memang selesai
            mainstreamkanLangkahLawan(
              pilihan.uci.slice(0, 2),
              pilihan.uci.slice(2, 4),
              pilihan.uci[4],
              info
            );
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
  }, [
    aktif,
    fen,
    warnaMesin,
    tingkatAktif,
    mainstreamkanLangkahLawan,
    mintaLangkahMaia,
    riwayat.length,
    riwayatLengkap.length,
  ]);

  useEffect(
    () => () => {
      mesinRef.current?.tamat();
      mesinRef.current = null;
      // Worker Maia (sesi ONNX 45 MB) tidak diurus `mesinRef` karena ia bukan
      // engine UCI. Mode ini satu-satunya pemakainya, jadi ia dilepas di sini
      // juga — kalau tidak, memori model tetap tergenggam setelah pemain
      // berpindah mode. Bobotnya tetap di IndexedDB, bukan unduh ulang.
      tamatMaia();
      window.clearTimeout(timerSalinRef.current);
    },
    [tamatMaia]
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
    if (!bolehGerak || promosi) return;
    if (terpilih && sasaran.includes(square)) {
      // Pion ke baris terakhir → buka dialog pemilihan bidak promosi.
      try {
        const game = new Chess(fenRef.current);
        const bidak = game.get(terpilih);
        if (bidak?.type === "p" && (square.endsWith("1") || square.endsWith("8"))) {
          setPromosi({ from: terpilih, to: square, warna: bidak.color });
          setTerpilih(null);
          setSasaran([]);
          return;
        }
      } catch { /* posisi rusak — deteksi promosi dilewati */ }
      mainkanLangkah(terpilih, square);
      return;
    }
    pilihPetak(square);
  }

  function pilihPromosi(bidakPromosi) {
    if (!promosi) return;
    const { from, to } = promosi;
    setPromosi(null);
    mainkanLangkah(from, to, bidakPromosi);
  }

  function batalPromosi() {
    setPromosi(null);
    setTerpilih(null);
    setSasaran([]);
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
    hapusSemuaTanda();
    setTerpilih(null);
    setSasaran([]);
    setHasil(null);
    setPesan("");
    setPgnTersalin(false);
    setPromosi(null);
    setTampilDialogSelesai(false);
  }

  function pilihWarna(id) {
    setWarnaPilihan(id);
    // "acak" baru dipilih saat Mulai; dua opsi lain langsung memutar papan.
    if (id === "w" || id === "b") {
      setWarnaPemain(id);
      setOrientasiPapan(id);
    }
  }

  function mulaiPartai() {
    mesinRef.current?.tamat();
    mesinRef.current = null;
    jenisMesinRef.current = null;
    benihMesinRef.current = (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
    if (warnaPilihan === "acak") {
      const hasilAcak = Math.random() < 0.5 ? "w" : "b";
      setWarnaPemain(hasilAcak);
      setOrientasiPapan(hasilAcak);
    }
    bersihkanPartai();
    setTampilDialogSelesai(false);
    setAktif(true);
    setStatusMesin("pemain");
    mainkan(SUARA.mulai);
  }

  function menyerah() {
    if (!aktif || hasil) return;
    setKonfirmasiMenyerah(false);
    mesinRef.current?.tamat();
    mesinRef.current = null;
    // Sama seperti skakmat/remis: `aktif` tetap true agar riwayat langkah
    // bisa direview setelah menyerah; `hasil` mengunci papan lewat `bolehGerak`.
    setHasil({ jenis: "menyerah" });
    setStatusMesin("selesai");
    setTampilDialogSelesai(true);
    mainkan(SUARA.klik);
  }

  function keHalamanUtama() {
    mesinRef.current?.tamat();
    mesinRef.current = null;
    jenisMesinRef.current = null;
    bersihkanPartai();
    setTampilDialogSelesai(false);
    setAktif(false);
    setStatusMesin("idle");
    mainkan(SUARA.klik);
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
    setPromosi(null);
    // Efek mesin di bawah tetap diam selama pengguna menelusuri riwayat (lihat
    // guard `riwayat.length < riwayatLengkap.length` di sana) dan tidak
    // menyentuh `statusMesin` pada jalur itu. Tanpa baris ini, status
    // "mesin"/"memuat" yang tertinggal dari SEBELUM navigasi (mis. undo tepat
    // saat mesin masih berpikir) terus mengunci papan lewat `bolehGerak`
    // walau FEN yang tampil sekarang sebenarnya giliran pemain. Efek mesin
    // akan menetapkan ulang status begitu navigasi sampai ke langkah
    // terakhir dan memang giliran mesin.
    setStatusMesin("pemain");
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
    if (statusMesin === "memuat") {
      // Mengunduh bobot Maia 45 MB terasa lama; persennya ditampilkan supaya
      // pemain tahu ini memang sedang mengunduh, bukan macet.
      return maiaMengunduh ? t("papan.pveMaiaMengunduh", { persen: progresMaia }) : t("papan.pveMesinMemuat");
    }
    if (statusMesin === "mesin") return t("papan.pveMesinBerpikir");
    if (statusMesin === "gagal") {
      // Maia bisa gagal karena alasan yang tidak dimiliki engine lain:
      // peramban yang tidak mendukung WebAssembly SIMD, kuota penyimpanan
      // penuh, atau unduhan bobot terputus. Katakan terus terang.
      return "maia" === tingkatAktif.mesin ? t("papan.pveMaiaGagal") : t("papan.pveMesinGagal");
    }
    return t("papan.pveGiliranPemain");
  }

  // Daftar disusun dari riwayat lengkap agar langkah yang sedang ditelusuri
  // masih terlihat; yang belum dimasuki posisi aktif tampil redup.
  const giliranPenuh = riwayatLengkap.reduce((baris, san, index) => {
    if (index % 2 === 0) baris.push({ nomor: Math.floor(index / 2) + 1, putih: san, hitam: "" });
    else baris[baris.length - 1].hitam = san;
    return baris;
  }, []);
  const dialog = dialogMesin({
    statusMesin,
    hasil,
    warnaMesin,
    langkahDialog,
    benih: riwayatLengkap.length,
    t,
  });
  // Worker aktif berarti mesin masih memuat atau menghitung. Ikon kembali ke
  // cip segera setelah giliran mesin selesai, gagal, atau partai berakhir.
  const IkonMesin = statusMesin === "memuat" || statusMesin === "mesin" ? Brain : Cpu;
  const tangkapan = useMemo(() => susunTangkapan(riwayat, FEN_AWAL), [riwayat]);
  // Petak raja untuk lencana hasil: mahkota di pemenang, raja tumbang /
  // resign di yang kalah. Hanya dihitung saat partai benar-benar selesai.
  const lencanaHasil = useMemo(() => {
    if (!hasil) return null;
    if (hasil.jenis === "skakmat") {
      const kalah = hasil.pemenang === "w" ? "b" : "w";
      return {
        pemenang: petakRajaWarna(fen, hasil.pemenang),
        kalah: petakRajaWarna(fen, kalah),
        ikonKalah: "defeat",
      };
    }
    if (hasil.jenis === "menyerah") {
      const kalah = warnaPemain; // pemain selalu yang menyerah di mode ini
      return {
        pemenang: petakRajaWarna(fen, warnaMesin),
        kalah: petakRajaWarna(fen, kalah),
        ikonKalah: "resign",
      };
    }
    return null; // remis tanpa lencana
  }, [hasil, fen, warnaPemain, warnaMesin]);
  // Susunan profil tetap: mesin di atas, pemain di bawah, apa pun orientasi papan.
  const barisSisi = (sisi) => ({
    nama: sisi === warnaPemain ? t("papan.pveAnda") : NAMA_MESIN,
    putih: sisi === "w",
    tangkapan: sisi === "w" ? tangkapan.olehPutih : tangkapan.olehHitam,
    avatar: sisi === warnaPemain ? null : AVATAR_MESIN,
  });

  return (
    // Konten dibatasi 1280px + padding md:px-8 dan kolom papan maksimal 520px,
    // sama seperti halaman papan buku, sehingga lebar panel kanan ikut selalu sama.
    <div className="mx-auto grid h-full min-h-0 w-full max-w-[1280px] grid-cols-1 gap-3 overflow-x-hidden overflow-y-auto p-2 sm:gap-4 sm:p-4 md:px-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:overflow-hidden">
      <section
        aria-label={t("papan.pveJudul")}
        className="mx-auto flex min-h-0 w-full items-start justify-center sm:items-center lg:overflow-y-auto"
      >
        <div className="mx-auto flex w-full max-w-[520px] min-w-0 flex-col sm:my-auto lg:w-[min(520px,calc(100dvh-140px),calc(100vw-634px))]">
          <BarisProfil {...barisSisi(warnaMesin)} setBidak={setBidak} className="mb-2" />
          <div className="flex w-full items-stretch justify-center gap-1.5">
            {/* Evaluasi objektif Stockfish dari hook yang sama dengan Buku.
                Tidak memakai skor lawan yang sengaja dilemahkan. `evaluasiAktif`
                hanya terisi bila hasilnya benar-benar milik FEN yang sedang
                tampil — posisi berganti langsung membuat bilah "belum
                dievaluasi" sampai hasil FEN baru datang. */}
            <BilahEvaluasi
              cpPutih={evaluasiAktif?.cpPutih ?? 0}
              matePutih={evaluasiAktif?.matePutih ?? null}
              teksSkor={evaluasiAktif?.teksSkor ?? ""}
              orientasi={orientasiPapan}
              label={t("papan.pveEvaluasi")}
              adaEvaluasi={Boolean(evaluasiAktif)}
            />
            <div className="aspect-square min-w-0 flex-1" ref={papanRef}>
              <div className="relative h-full w-full">
                <PapanTekaTeki
                  fen={fen}
                  orientasi={orientasiPapan}
                  terpilih={terpilih}
                  sasaran={sasaran}
                  langkahAkhir={langkahAkhir}
                  tanda={tanda}
                  terkunci={!bolehGerak || !!promosi}
                  membeku={false}
                  setBidak={setBidak}
                  tema={tema}
                  ikonMahkota={lencanaHasil?.pemenang ? { petak: lencanaHasil.pemenang } : null}
                  ikonSkakmat={lencanaHasil?.ikonKalah === "defeat" && lencanaHasil.kalah ? { petak: lencanaHasil.kalah } : null}
                  ikonResign={lencanaHasil?.ikonKalah === "resign" && lencanaHasil.kalah ? { petak: lencanaHasil.kalah } : null}
                  onKlik={klikPetak}
                  onPilih={pilihPetak}
                  onJatuh={(from, to) => {
                    if (!bolehGerak || promosi) return;
                    try {
                      const game = new Chess(fenRef.current);
                      const bidak = game.get(from);
                      if (bidak?.type === "p" && (to.endsWith("1") || to.endsWith("8"))) {
                        setPromosi({ from, to, warna: bidak.color });
                        setTerpilih(null);
                        setSasaran([]);
                        return;
                      }
                    } catch { /* posisi rusak — deteksi promosi dilewati */ }
                    mainkanLangkah(from, to);
                  }}
                  onTandaPetak={tandaPetak}
                  onTandaPanah={tandaPanah}
                  onHapusTanda={hapusSemuaTanda}
                />

                {promosi && (
                  <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={batalPromosi}
                  >
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label={t("tekaTeki.promosiJudul")}
                      className="flex flex-col items-center gap-3 rounded-lg border border-[#3b3935] bg-[#1e1c18] p-4 shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-sm font-semibold text-gray-200">
                        {t(
                          promosi.warna === "w"
                            ? "tekaTeki.promosiPutih"
                            : "tekaTeki.promosiHitam"
                        )}
                      </p>
                      <div className="flex gap-2">
                        {PILIHAN_PROMOSI.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => pilihPromosi(p)}
                            aria-label={t(KUCI_NAMA_PROMOSI[p])}
                            title={t(KUCI_NAMA_PROMOSI[p])}
                            className="flex h-14 w-14 items-center justify-center rounded-md bg-[#262421] p-1.5 transition hover:bg-[#312e2b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#81b64c]"
                          >
                            <ChessPiece
                              piece={promosi.warna === "w" ? p.toUpperCase() : p}
                              set={setBidak}
                              className="h-full w-full"
                            />
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={batalPromosi}
                        className="text-xs font-medium text-gray-400 underline-offset-2 transition hover:text-gray-200 hover:underline"
                      >
                        {t("tekaTeki.promosiBatal")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

      <aside className="flex min-h-0 min-w-0 flex-col gap-3 rounded-lg border border-[#312e2b] bg-[#211f1c] p-4 text-sm text-gray-200 lg:overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-3">
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

        <section
          aria-label={t("papan.pveDialogMesin")}
          className="flex min-h-[88px] shrink-0 items-center gap-2 sm:gap-3"
        >
          <img
            src={berkasPublik(`/engine_expressions/${dialog.gambar}`)}
            alt={t("papan.pveDialogAvatar")}
            className="h-12 w-12 shrink-0 object-contain sm:h-16 sm:w-16"
            width="64"
            height="64"
          />
          <div className="relative min-w-0 flex-1 rounded-md border border-[#3b3935] bg-[#262421] p-2.5 sm:p-3">
            {/* Ekor bubble ala bot-speech-content-tip — menunjuk avatar di kiri. */}
            <span
              aria-hidden="true"
              className="absolute -left-[5px] top-5 h-2.5 w-2.5 rotate-45 border-b border-l border-[#3b3935] bg-[#262421]"
            />
            <p className="text-[13px] leading-5 text-gray-200" aria-live="polite">
              {dialog.teks}
            </p>
          </div>
        </section>

        {/* Kartu konfigurasi hanya tampil sebelum partai berjalan. Baris atas
            (tab engine sejajar pemilih warna) diam; hanya daftar level di
            bawahnya yang di-scroll, sehingga tombol Main tetap menempel di
            dasar sidebar walau daftar panjang. */}
        {!aktif ? (
          <section
            aria-label={t("papan.pveKonfigurasi")}
            className="flex min-h-0 flex-1 flex-col gap-3"
          >
            {/* Baris atas diam (tidak ikut scroll): tab engine sejajar
                dengan pemilih warna. */}
            <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  {t("papan.pveLevel")}
                </p>
                <div
                  role="tablist"
                  aria-label={t("papan.pveLevel")}
                  className="flex gap-1 rounded-md border border-[#4a4742] bg-[#262421] p-1"
                >
                  {TAB_LEVEL_MESIN.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={tabLevel === tab.id}
                      onClick={() => {
                        setTabLevel(tab.id);
                        // Klik tab langsung memilih level pertama tab itu bila
                        // level aktif bukan milik tab tersebut.
                        const kini = PILIHAN_LEVEL_MESIN.find((level) => level.id === levelMesin);
                        if (kini?.tab !== tab.id) {
                          const pertama = PILIHAN_LEVEL_MESIN.find((level) => level.tab === tab.id);
                          if (pertama) setLevelMesin(pertama.id);
                        }
                      }}
                      className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold transition ${
                        tabLevel === tab.id
                          ? "bg-[#3a3633] text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {t(tab.judul)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pemilih warna ala play-side-selector: tiga kotak berisi SVG
                  dari bersama/ikon (pion putih/hitam + ikon
                  acak). "Acak" baru dipilih saat Mulai ditekan; sebelum itu
                  papan tetap memakai warna terakhir. */}
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  {t("papan.pveWarnaPemain")}
                </p>
                <div
                  role="radiogroup"
                  aria-label={t("papan.pveWarnaPemain")}
                  className="flex items-center gap-2"
                >
                  {[
                    { id: "w", label: t("papan.pvePutih"), gambar: IkonPutih },
                    { id: "acak", label: t("papan.pveAcak"), gambar: IkonAcak },
                    { id: "b", label: t("papan.pveHitam"), gambar: IkonHitam },
                  ].map((opsi) => (
                    <button
                      key={opsi.id}
                      type="button"
                      role="radio"
                      aria-checked={warnaPilihan === opsi.id}
                      aria-label={opsi.label}
                      title={opsi.label}
                      onClick={() => pilihWarna(opsi.id)}
                      className={`h-10 w-10 overflow-hidden rounded-md border-2 transition ${
                        warnaPilihan === opsi.id
                          ? "border-[#81b64c]"
                          : "border-[#4a4742] hover:border-gray-500"
                      }`}
                    >
                      <img src={opsi.gambar} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Daftar level — satu-satunya bagian yang di-scroll. Tab dan
                pemilih warna di atas tidak ikut tergulir. */}
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {/* Tab Maia menampilkan daftar rating sebagai tombol, bukan
                  <select>: Maia menerima rating kontinu, jadi 21 penanda
                  dipilih langsung tanpa dua langkah membuka menu. */}
              {tabLevel === "maia" ? (
                <>
                  <ul className="grid grid-cols-3 gap-1.5">
                  {PILIHAN_RATING_MAIA.map((rating) => (
                    <li key={rating}>
                      <button
                        type="button"
                        onClick={() => {
                          setLevelMesin("maia");
                          setRatingMaia(rating);
                        }}
                        aria-pressed={levelMesin === "maia" && ratingMaia === rating}
                        className={`w-full rounded-md border px-2 py-1.5 text-xs font-semibold transition ${
                          levelMesin === "maia" && ratingMaia === rating
                            ? "border-[#81b64c] bg-[#2c2926] text-white"
                            : "border-[#4a4742] bg-[#262421] text-gray-300 hover:border-gray-500 hover:text-white"
                        }`}
                      >
                        {rating}
                      </button>
                    </li>
                  ))}
                  </ul>
                  {/* Keterangan extrapolasi — kunci lama `pveMesinMaia` yang
                      tadinya mati; rating di luar 1100–1900 bukan kekuatan
                      tervalidasi pelatihan model. */}
                  <p className="mt-2 text-[11px] leading-4 text-gray-500">
                    {t("papan.pveMesinMaia", { rating: ratingMaia })}
                  </p>
                </>
              ) : (
                <ul className="space-y-1.5">
                  {PILIHAN_LEVEL_MESIN.filter((level) => level.tab === tabLevel).map((level) => (
                    <li key={level.id}>
                      <button
                        type="button"
                        onClick={() => setLevelMesin(level.id)}
                        aria-pressed={levelMesin === level.id}
                        className={`w-full rounded-md border px-3 py-2 text-left text-xs font-semibold transition ${
                          levelMesin === level.id
                            ? "border-[#81b64c] bg-[#2c2926] text-white"
                            : "border-[#4a4742] bg-[#262421] text-gray-300 hover:border-gray-500 hover:text-white"
                        }`}
                      >
                        {t(level.ringkas)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : null}

        {/* Slot riwayat: hanya saat BPK berjalan. Sebelum itu ruangnya dipakai
            fitur pra-partai lain. */}
        {aktif ? (
          <section className="flex min-h-0 max-h-52 flex-1 flex-col border-t border-[#312e2b] pt-3 lg:max-h-none">
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
            <TombolKeAwal
              onClick={keAwal}
              disabled={!riwayat.length}
              t={t}
            />
            <TombolMundur
              onClick={undo}
              disabled={!riwayat.length}
              t={t}
            />
            <TombolMaju
              onClick={redo}
              disabled={riwayat.length >= riwayatLengkap.length}
              t={t}
            />
            <TombolKeAkhir
              onClick={keAkhir}
              disabled={riwayat.length >= riwayatLengkap.length}
              t={t}
            />
          </div>
        ) : null}

        {/* Baris aksi dasar. Saat bermain susunannya identik dengan mode Buku
            Pembukaan; sebelum mulai, satu-satunya jalan keluar panel ini tombol Mulai. */}
        {aktif ? (
          <div className="grid shrink-0 grid-cols-4 gap-1 text-[10px] font-semibold text-gray-300 sm:gap-2 sm:text-xs">
            <button
              type="button"
              onClick={() => setKonfirmasiMenyerah(true)}
              disabled={Boolean(hasil)}
              className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b] disabled:cursor-not-allowed disabled:opacity-40"
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
              className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#262421]"
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
            className="w-full shrink-0 rounded-md bg-[#81b64c] px-4 py-3 text-sm font-bold text-[#1e1c18] transition hover:bg-[#91c45a]"
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

      {tampilDialogSelesai && hasil && (
        <DialogSelesai
          hasil={hasil}
          statusTeks={statusTeks()}
          onTutup={() => {
            setTampilDialogSelesai(false);
            mainkan(SUARA.klik);
          }}
          onPartaiBaru={keHalamanUtama}
          onTandingUlang={mulaiPartai}
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
