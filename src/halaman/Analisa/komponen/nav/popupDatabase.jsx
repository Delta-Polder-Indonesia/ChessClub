/*
 * Popup / Panel "Basis Data Permainan" (Database) — arsitektur terinspirasi
 * dari sistem manajemen database en-croissant (https://github.com/franciscoBSalgueiro/en-croissant).
 *
 * Menggunakan SVG icons konsisten tanpa emoji, tipografi terstruktur,
 * dan integrasi langsung ke IndexedDB peramban.
 */
import { useEffect, useState } from "react";
import Popup from "./Popup.jsx";
import Database from "../svg/database.jsx";
import SquareFillEqual from "../svg/square-fill-equal.jsx";
import SquareFillMinus from "../svg/square-fill-minus.jsx";
import SquareFillPlus from "../svg/square-fill-plus.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import {
  ambilDaftarPartai,
  ambilPartai,
  ambilSemuaKoleksi,
  bersihkanBasisData,
  eksporPgnKoleksi,
  gabungkanPemain,
  hapusKoleksi,
  hapusPartai,
  hitungStatistikBasisData,
  imporPgnKeBasisData,
} from "../../basisData.js";

/* ── Konstanta ─────────────────────────────────────────────────────── */

const BARIS_PER_HALAMAN = 50;
const JUMLAH_BARIS_SKELETON = 7;
const TINGGI_BARIS = "h-[56px]"; // tinggi konsisten per baris
const LEBAR_JENDELA_HALAMAN = 5; // jumlah tombol nomor halaman yang tampil

/* ── Utilitas ──────────────────────────────────────────────────────── */

function formatTanggal(timestamp, locale = "id") {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

function daftarHalaman(aktif, total) {
  return Array.from({ length: LEBAR_JENDELA_HALAMAN }, (_, i) => aktif + i).filter(
    (hlm) => hlm <= total,
  );
}

/* ── SVG Ikon Internal ─────────────────────────────────────────────── */

function IkonDownload({ className = "h-3.5 w-3.5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IkonPlus({ className = "h-3.5 w-3.5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IkonTrash({ className = "h-3.5 w-3.5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function IkonCopy({ className = "h-3.5 w-3.5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IkonCheck({ className = "h-3.5 w-3.5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IkonSearch({ className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IkonPlay({ className = "h-3 w-3" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IkonSort({ aktif, arah }) {
  if (!aktif) {
    return (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-1 opacity-25 inline-block"
        aria-hidden="true"
      >
        <polyline points="7 15 12 20 17 15" />
        <polyline points="7 9 12 4 17 9" />
      </svg>
    );
  }

  return arah === "asc" ? (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-1 text-foregroundHighlighted inline-block"
      aria-hidden="true"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ) : (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-1 text-foregroundHighlighted inline-block"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ── Utilitas Statistik Koleksi & Format Ukuran ───────────────────── */

/** Format byte → "220 KB" / "7.36 MB" (gaya kartu En Croissant). */
function formatUkuran(byte) {
  const b = Number(byte) || 0;
  if (b <= 0) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(b < 1024 * 10 ? 0 : 0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Statistik satu koleksi untuk panel "Data" & kartu kiri: jumlah partai,
 * banyak pemain unik, banyak event unik (dari header `[Event]`), dan ukuran
 * total PGN (byte). Dipanggil sekali per koleksi lalu di-cache di `statMap`.
 */
async function hitungStatistikKoleksi(koleksiId) {
  const hasil = await ambilDaftarPartai({ koleksiId, limit: 0, sertakanPgn: true });
  const partai = hasil?.partai || [];
  const pemain = new Set();
  const event = new Set();
  let ukuran = 0;
  for (const p of partai) {
    pemain.add(p.whiteName);
    pemain.add(p.blackName);
    const cocok = /\[Event\s+"([^"]*)"\]/.exec(p.pgn || "");
    if (cocok) event.add(cocok[1]);
    ukuran += (p.pgn || "").length;
  }
  // Hapus entri kosong agar player/event tak terhitung sebagai nama kosong.
  pemain.delete("");
  return { jumlah: partai.length, pemain: pemain.size, event: event.size, ukuran };
}

/* ── Komponen Baris Skeleton ───────────────────────────────────────── */

function BarisSkeleton() {
  return (
    <tr className="h-[56px] border-b border-border/50">
      {/* Pemain — struktur sama persis dengan BarisPartai */}
      <td className="py-2 pl-4 pr-2 w-[38%] min-w-44 overflow-hidden">
        <div className="flex h-5 flex-row items-center gap-1.5 text-[13px] leading-5">
          <span className="h-3 w-3 shrink-0 rounded-sm bg-evaluationBarWhite" />
          <span className="h-2.5 w-24 rounded-sm bg-foregroundGrey/15" />
          <span className="h-2.5 w-8 rounded-sm bg-foregroundGrey/10" />
        </div>
        <div className="flex h-5 flex-row items-center gap-1.5 text-[13px] leading-5">
          <span className="h-3 w-3 shrink-0 rounded-sm bg-evaluationBarBlack" />
          <span className="h-2.5 w-20 rounded-sm bg-foregroundGrey/15" />
          <span className="h-2.5 w-8 rounded-sm bg-foregroundGrey/10" />
        </div>
      </td>

      {/* Hasil */}
      <td className="py-2 px-2 whitespace-nowrap">
        <div className="flex h-5 items-center gap-1.5">
          <span className="h-2.5 w-9 rounded-sm bg-foregroundGrey/15" />
          <span className="h-3.5 w-3.5 rounded-sm bg-foregroundGrey/10" />
        </div>
      </td>

      {/* Tanggal */}
      <td className="py-2 px-2 whitespace-nowrap">
        <div className="space-y-1.5">
          <span className="block h-2.5 w-16 rounded-sm bg-foregroundGrey/15" />
          <span className="block h-2 w-10 rounded-sm bg-foregroundGrey/10" />
        </div>
      </td>

      {/* Langkah */}
      <td className="py-2 px-2 text-right whitespace-nowrap">
        <span className="ml-auto block h-2.5 w-5 rounded-sm bg-foregroundGrey/15" />
      </td>

      {/* Aksi — tombol senyap seperti baris biasa */}
      <td className="py-2 pl-2 pr-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <span className="h-6 w-[110px] rounded bg-backgroundBoxBox" />
          <span className="h-6 w-6 rounded border border-border bg-backgroundBoxBox" />
          <span className="h-6 w-6 rounded border border-border bg-backgroundBoxBox" />
        </div>
      </td>
    </tr>
  );
}

/* ── Komponen Header Tabel ─────────────────────────────────────────── */

function HeaderTabel({ urut, ubahUrut, t }) {
  const kolom = [
    {
      kunci: "pemain",
      label: t("analisa.basisData.pemain"),
      align: "text-left",
      padding: "py-2 pl-4 pr-2",
    },
    {
      kunci: "hasil",
      label: t("analisa.basisData.hasilTabel"),
      align: "text-left",
      padding: "py-2 px-2",
    },
    {
      kunci: "tanggal",
      label: t("analisa.basisData.tanggal"),
      align: "text-left",
      padding: "py-2 px-2",
    },
    {
      kunci: "langkah",
      label: t("analisa.basisData.langkah"),
      align: "text-right",
      padding: "py-2 px-2",
    },
  ];

  return (
    <thead className="sticky top-0 bg-backgroundBox border-b border-border z-10 select-none">
      <tr>
        {kolom.map((k) => (
          <th
            key={k.kunci}
            className={`${k.padding} ${k.align} text-xs font-semibold uppercase tracking-wide text-foregroundGrey`}
          >
            <button
              type="button"
              onClick={() => ubahUrut(k.kunci)}
              className="inline-flex items-center hover:text-foregroundHighlighted transition-colors cursor-pointer"
            >
              {k.label}
              <IkonSort aktif={urut.kolom === k.kunci} arah={urut.arah} />
            </button>
          </th>
        ))}
        <th className="py-2 pl-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
          {t("analisa.basisData.aksi")}
        </th>
      </tr>
    </thead>
  );
}

/* ── Komponen Baris Data Partai ─────────────────────────────────────── */

function BarisPartai({ game, locale, salinSuksesId, tanganiAnalisa, tanganiSalinPgn, tanganiHapusPartai, t }) {
  const whiteWon = game.result === "white";
  const blackWon = game.result === "black";
  const eloPutih = Number(game.whiteElo) > 0 ? `(${game.whiteElo})` : "";
  const eloHitam = Number(game.blackElo) > 0 ? `(${game.blackElo})` : "";
  const isCopied = salinSuksesId === game.id;

  return (
    <tr
      onClick={() => tanganiAnalisa(game)}
      className={`cursor-pointer select-none border-b border-border/50 transition-colors hover:bg-backgroundBoxHover group ${TINGGI_BARIS}`}
    >
      {/* Pemain */}
      <td className="py-2 pl-4 pr-2 w-[38%] min-w-44 overflow-hidden">
        <div className="flex flex-row items-center gap-1.5 text-[13px] leading-5">
          <div
            className={`h-3 min-h-3 w-3 min-w-3 shrink-0 rounded-sm bg-evaluationBarWhite ${
              whiteWon ? "border-2 border-winGreen" : ""
            }`}
          />
          <span className="truncate font-medium">
            {game.whiteName || "Putih"}
          </span>
          <span className="text-foregroundGrey text-[11px] font-mono">
            {eloPutih}
          </span>
        </div>
        <div className="flex flex-row items-center gap-1.5 text-[13px] leading-5">
          <div
            className={`h-3 w-3 shrink-0 rounded-sm bg-evaluationBarBlack ${
              blackWon ? "border-2 border-winGreen" : ""
            }`}
          />
          <span className="truncate font-medium">
            {game.blackName || "Hitam"}
          </span>
          <span className="text-foregroundGrey text-[11px] font-mono">
            {eloHitam}
          </span>
        </div>
      </td>

      {/* Hasil */}
      <td className="py-2 px-2 whitespace-nowrap">
        <div className="flex flex-row items-center gap-1.5">
          <span className="font-semibold text-xs font-mono text-foregroundGrey">
            {whiteWon ? "1 - 0" : blackWon ? "0 - 1" : "½ - ½"}
          </span>
          {whiteWon ? (
            <SquareFillPlus className="h-3.5 w-3.5 shrink-0 text-winGreen" />
          ) : blackWon ? (
            <SquareFillMinus className="h-3.5 w-3.5 shrink-0 text-lossRed" />
          ) : (
            <SquareFillEqual className="h-3.5 w-3.5 shrink-0 text-foregroundGrey" />
          )}
        </div>
      </td>

      {/* Tanggal */}
      <td className="py-2 px-2 whitespace-nowrap text-xs text-foregroundGrey">
        <div>{formatTanggal(game.timestamp, locale)}</div>
        <div className="text-[10px] text-foregroundGrey/75 font-mono uppercase tracking-wider">
          {game.timeClass || ""}
        </div>
      </td>

      {/* Langkah */}
      <td className="py-2 px-2 text-right whitespace-nowrap text-xs font-semibold tabular-nums text-foreground">
        {game.plyCount ?? "-"}
      </td>

      {/* Aksi */}
      <td className="py-2 pl-2 pr-4 text-right whitespace-nowrap">
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => tanganiAnalisa(game)}
            title={t("analisa.basisData.analisaSekarang")}
            className="inline-flex items-center gap-1 rounded bg-backgroundBoxBoxHighlighted px-2.5 py-1 text-[11px] font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover cursor-pointer"
          >
            <IkonPlay className="h-2.5 w-2.5 fill-foregroundBlackDark shrink-0" />
            <span>{t("analisa.basisData.analisaSekarang")}</span>
          </button>
          <button
            type="button"
            onClick={() => tanganiSalinPgn(game)}
            title={t("analisa.basisData.salinPgn")}
            className="inline-flex items-center justify-center h-6 w-6 rounded border border-border bg-backgroundBoxBox text-foregroundGrey transition-colors hover:text-foregroundHighlighted hover:border-borderHighlighted cursor-pointer"
          >
            {isCopied ? (
              <IkonCheck className="h-3 w-3 text-winGreen" />
            ) : (
              <IkonCopy className="h-3 w-3" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => tanganiHapusPartai(e, game)}
            title={t("analisa.basisData.hapusPartai")}
            className="inline-flex items-center justify-center h-6 w-6 rounded border border-border bg-backgroundBoxBox text-lossRed transition-colors hover:bg-backgroundBoxBoxHover hover:border-lossRed/50 cursor-pointer"
          >
            <IkonTrash className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Komponen Utama ────────────────────────────────────────────────── */

export default function PopupDatabase({
  onTutup,
  onAnalisa,
  onBukaAkun,
  lebarKiri = 0,
}) {
  const { t, bahasa: locale } = useI18n();

  /* State */
  const [koleksiList, setKoleksiList] = useState([]);
  const [koleksiTerpilih, setKoleksiTerpilih] = useState("");
  const [cari, setCari] = useState("");
  const [cariKoleksi, setCariKoleksi] = useState("");
  const [filterHasil, setFilterHasil] = useState("");
  const [filterWaktu, setFilterWaktu] = useState("");
  const [urut, setUrut] = useState({ kolom: "tanggal", arah: "desc" });
  const [hal, setHal] = useState(1);

  const [daftarPartai, setDaftarPartai] = useState([]);
  const [totalPartai, setTotalPartai] = useState(0);
  const [stats, setStats] = useState(null);
  const [memuat, setMemuat] = useState(true);

  const [modalImpor, setModalImpor] = useState(false);
  const [teksPgn, setTeksPgn] = useState("");
  const [prosesImpor, setProsesImpor] = useState(false);

  const [salinSuksesId, setSalinSuksesId] = useState(null);
  const [notifikasi, setNotifikasi] = useState(null);

  // Mode panel kanan: "data" (ringkasan + tools) atau "tabel" (browse/analisa).
  const [mode, setMode] = useState("data");
  // Statistik per koleksi (jumlah/pemain/event/ukuran) — di-cache di sini.
  const [statMap, setStatMap] = useState({});
  const [mergeA, setMergeA] = useState("");
  const [mergeB, setMergeB] = useState("");

  /* Turunan */
  const totalHal = Math.max(1, Math.ceil(totalPartai / BARIS_PER_HALAMAN));
  const aktifHal = Math.min(hal, totalHal);
  const stat = koleksiTerpilih ? statMap[koleksiTerpilih] || null : null;
  const koleksi = koleksiList.find((k) => k.id === koleksiTerpilih) || null;
  // Koleksi yang tampil di kolom kiri, difilter oleh kotak pencarian koleksi.
  const daftarKoleksi = cariKoleksi
    ? koleksiList.filter((k) => (k.label || "").toLowerCase().includes(cariKoleksi.toLowerCase()))
    : koleksiList;

  /* ── Pemuat Data ───────────────────────────────────────────────── */

  async function muatMetadata() {
    try {
      const [semuaKoleksi, st] = await Promise.all([
        ambilSemuaKoleksi(),
        hitungStatistikBasisData(),
      ]);
      setKoleksiList(semuaKoleksi);
      setStats(st);
    } catch {
      /* abaikan */
    }
  }

  async function muatPartai() {
    setMemuat(true);
    try {
      let plat = "";
      let user = "";
      if (koleksiTerpilih) {
        const [p, ...rest] = koleksiTerpilih.split(":");
        plat = p;
        user = rest.join(":");
      }

      const hasil = await ambilDaftarPartai({
        koleksiId: koleksiTerpilih || undefined,
        platform: plat || undefined,
        username: user || undefined,
        cari,
        hasil: filterHasil || undefined,
        timeClass: filterWaktu || undefined,
        urut: urut.kolom,
        arah: urut.arah,
        limit: BARIS_PER_HALAMAN,
        offset: (hal - 1) * BARIS_PER_HALAMAN,
        // Tabel hanya butuh metadata. Teks PGN (bagian terberat tiap rekaman)
        // baru diambil untuk satu partai saat ditekan Analisa / Salin.
        sertakanPgn: false,
      });

      setDaftarPartai(hasil.partai || []);
      setTotalPartai(hasil.total || 0);
    } catch {
      setDaftarPartai([]);
      setTotalPartai(0);
    } finally {
      setMemuat(false);
    }
  }

  /* ── Effects ───────────────────────────────────────────────────── */

  useEffect(() => {
    muatMetadata();
  }, []);

  useEffect(() => {
    setHal(1);
  }, [koleksiTerpilih, cari, filterHasil, filterWaktu, urut]);

  useEffect(() => {
    muatPartai();
  }, [koleksiTerpilih, cari, filterHasil, filterWaktu, urut, hal]);

  // Bila belum ada koleksi yang dipilih, pilih koleksi pertama otomatis.
  useEffect(() => {
    if (!koleksiTerpilih && koleksiList.length > 0) {
      setKoleksiTerpilih(koleksiList[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [koleksiList]);

  // Hitung statistik (jumlah/pemain/event/ukuran) untuk semua koleksi sekaligus,
  // lalu cache di `statMap` untuk kartu kiri & panel "Data".
  useEffect(() => {
    (async () => {
      const map = {};
      await Promise.all(
        koleksiList.map(async (k) => {
          try {
            map[k.id] = await hitungStatistikKoleksi(k.id);
          } catch {
            map[k.id] = null;
          }
        }),
      );
      setStatMap(map);
    })();
  }, [koleksiList]);

  /* ── Aksi / Handler ────────────────────────────────────────────── */

  function tampilkanNotif(pesan) {
    setNotifikasi(pesan);
    setTimeout(() => setNotifikasi(null), 3000);
  }

  /** Ambil teks PGN satu partai (baris tabel sengaja tidak membawanya). */
  async function pgnPartai(game) {
    if (game?.pgn) return game.pgn;
    if (!game?.id) return "";
    try {
      const penuh = await ambilPartai(game.id);
      return penuh?.pgn || "";
    } catch {
      return "";
    }
  }

  async function tanganiAnalisa(game) {
    const pgn = await pgnPartai(game);
    if (!pgn) {
      tampilkanNotif(t("analisa.basisData.pgnTidakAda"));
      return;
    }
    onAnalisa({ format: "pgn", string: pgn });
    onTutup();
  }

  async function tanganiSalinPgn(game) {
    const pgn = await pgnPartai(game);
    if (!pgn) {
      tampilkanNotif(t("analisa.basisData.pgnTidakAda"));
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(pgn);
      }
      setSalinSuksesId(game.id);
      tampilkanNotif(t("analisa.basisData.pgnDisalin"));
      setTimeout(() => setSalinSuksesId(null), 2000);
    } catch {
      tampilkanNotif("Gagal menyalin PGN.");
    }
  }

  async function tanganiEksporPgn() {
    try {
      let plat = "";
      let user = "";
      if (koleksiTerpilih) {
        const [p, ...rest] = koleksiTerpilih.split(":");
        plat = p;
        user = rest.join(":");
      }

      const pgnString = await eksporPgnKoleksi({
        koleksiId: koleksiTerpilih || undefined,
        platform: plat || undefined,
        username: user || undefined,
        cari,
        hasil: filterHasil || undefined,
        timeClass: filterWaktu || undefined,
      });

      if (!pgnString) {
        tampilkanNotif("Tidak ada partai untuk diekspor.");
        return;
      }

      const blob = new Blob([pgnString], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const namaFile = `kci-catur-${
        koleksiTerpilih
          ? koleksiTerpilih.replace(":", "-")
          : "semua"
      }-${Date.now()}.pgn`;
      a.href = url;
      a.download = namaFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      tampilkanNotif(t("analisa.basisData.eksporPgnSukses"));
    } catch {
      tampilkanNotif("Gagal mengekspor PGN.");
    }
  }

  async function tanganiHapusPartai(e, game) {
    e.stopPropagation();
    if (!window.confirm(t("analisa.basisData.konfirmasiHapusPartai"))) return;
    await hapusPartai(game.id);
    await muatMetadata();
    await muatPartai();
    tampilkanNotif("Partai berhasil dihapus dari basis data.");
  }

  async function tanganiHapusKoleksi() {
    if (!koleksiTerpilih) return;
    const kol = koleksiList.find((k) => k.id === koleksiTerpilih);
    const label = kol?.label || koleksiTerpilih;
    const jlh = kol?.jumlahPartai || totalPartai;
    if (
      !window.confirm(
        t("analisa.basisData.konfirmasiHapusKoleksi", {
          koleksi: label,
          jumlah: jlh,
        }),
      )
    )
      return;

    await hapusKoleksi(koleksiTerpilih);
    setKoleksiTerpilih("");
    await muatMetadata();
    await muatPartai();
    tampilkanNotif(`Koleksi ${label} berhasil dihapus.`);
  }

  async function tanganiKosongkanSemua() {
    if (!window.confirm(t("analisa.basisData.konfirmasiHapusSemua"))) return;
    await bersihkanBasisData();
    setKoleksiTerpilih("");
    await muatMetadata();
    await muatPartai();
    tampilkanNotif("Seluruh basis data telah dikosongkan.");
  }

  /** Hapus partai duplikat (sidik jari sama) dalam koleksi terpilih. */
  async function tanganiHapusDuplikat() {
    if (!koleksiTerpilih) return;
    if (!window.confirm(t("analisa.basisData.konfirmasiHapusDuplikat"))) return;
    const hasil = await ambilDaftarPartai({ koleksiId: koleksiTerpilih, limit: 0, sertakanPgn: true });
    const partai = hasil?.partai || [];
    const terlihat = new Set();
    let hapus = 0;
    for (const p of partai) {
      const sidik = `${p.whiteName}|${p.blackName}|${p.timestamp}|${p.result}|${p.pgn}`;
      if (terlihat.has(sidik)) {
        await hapusPartai(p.id);
        hapus++;
      } else {
        terlihat.add(sidik);
      }
    }
    if (hapus > 0) {
      await muatMetadata();
      await muatPartai();
    }
    tampilkanNotif(`${hapus} partai duplikat dihapus.`);
  }

  /** Hapus partai tanpa PGN / tanpa langkah dalam koleksi terpilih. */
  async function tanganiHapusKosong() {
    if (!koleksiTerpilih) return;
    if (!window.confirm(t("analisa.basisData.konfirmasiHapusKosong"))) return;
    const hasil = await ambilDaftarPartai({ koleksiId: koleksiTerpilih, limit: 0, sertakanPgn: true });
    const partai = hasil?.partai || [];
    let hapus = 0;
    for (const p of partai) {
      const kosong = !p.pgn || String(p.pgn).trim() === "" || !(p.plyCount > 0);
      if (kosong) {
        await hapusPartai(p.id);
        hapus++;
      }
    }
    if (hapus > 0) {
      await muatMetadata();
      await muatPartai();
    }
    tampilkanNotif(`${hapus} partai kosong dihapus.`);
  }

  /** Gabungkan dua pemain dalam koleksi terpilih (namaA → namaB). */
  async function tanganiGabungPemain() {
    const a = mergeA.trim();
    const b = mergeB.trim();
    if (!koleksiTerpilih || !a || !b) {
      tampilkanNotif(t("analisa.basisData.mergePerluNama"));
      return;
    }
    if (a.toLowerCase() === b.toLowerCase()) {
      tampilkanNotif(t("analisa.basisData.mergeSama"));
      return;
    }
    if (
      !window.confirm(
        t("analisa.basisData.konfirmasiGabungPemain", { asal: a, tujuan: b }),
      )
    )
      return;
    const hasil = await gabungkanPemain(koleksiTerpilih, a, b);
    if (hasil.diubah > 0) {
      await muatMetadata();
      await muatPartai();
    }
    setMergeA("");
    setMergeB("");
    tampilkanNotif(
      hasil.diubah > 0
        ? t("analisa.basisData.gabungSukses", { jumlah: hasil.diubah, nama: hasil.nama })
        : t("analisa.basisData.gabungTidakAda"),
    );
  }

  async function tanganiSimpanImporPgn() {
    if (!teksPgn.trim()) return;
    setProsesImpor(true);
    try {
      const res = await imporPgnKeBasisData(teksPgn);
      setModalImpor(false);
      setTeksPgn("");
      await muatMetadata();
      await muatPartai();
      tampilkanNotif(
        t("analisa.basisData.imporSukses", { jumlah: res.tersimpan || 1 }),
      );
    } catch {
      tampilkanNotif("Gagal mengimpor PGN. Periksa format PGN Anda.");
    } finally {
      setProsesImpor(false);
    }
  }

  function ubahUrut(kolom) {
    setUrut((lama) =>
      lama.kolom === kolom
        ? { kolom, arah: lama.arah === "asc" ? "desc" : "asc" }
        : { kolom, arah: kolom === "tanggal" ? "desc" : "asc" },
    );
  }

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <Popup
      judul={t("analisa.basisData.judul")}
      onTutup={onTutup}
      fullLayar
      lebarKiri={lebarKiri}
      className="max-w-none"
      bawahJudul={
        stats && stats.totalPartai > 0 ? (
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-foregroundGrey">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Database
                width={14}
                height={14}
                className="fill-foregroundHighlighted"
              />
              {t("analisa.basisData.jumlahPartai", {
                jumlah: stats.totalPartai,
              })}
            </span>
            <span className="text-border">/</span>
            <span className="flex items-center gap-1 text-winGreen font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-winGreen" />
              {stats.putihMenang} {t("analisa.basisData.menang")} Putih
            </span>
            <span className="flex items-center gap-1 text-lossRed font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-lossRed" />
              {stats.hitamMenang} {t("analisa.basisData.menang")} Hitam
            </span>
            <span className="flex items-center gap-1 text-foregroundGrey font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-foregroundGrey" />
              {stats.seri} {t("analisa.basisData.seri")}
            </span>
          </div>
        ) : null
      }
      headerKanan={null}
    >
      <div className="flex flex-1 min-h-0 flex-col gap-3">
      {/* ── Toast Notifikasi ────────────────────────────────────── */}
      {notifikasi && (
        <div className="mb-3 flex items-center justify-between rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-2 text-xs font-semibold text-foregroundBlackDark transition-all">
          <div className="flex items-center gap-2">
            <IkonCheck className="h-4 w-4 shrink-0 text-foregroundBlackDark" />
            <span>{notifikasi}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotifikasi(null)}
            className="ml-2 text-xs opacity-75 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          {/* ── Kolom Kiri: daftar profil / koleksi ───────────────── */}
          <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[300px] lg:min-h-0">
            {/* Pencarian koleksi */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-foregroundGrey">
                <IkonSearch className="h-4 w-4" />
              </div>
              <input
                type="search"
                value={cariKoleksi}
                onChange={(e) => setCariKoleksi(e.target.value)}
                placeholder={t("analisa.basisData.cariKoleksi")}
                aria-label={t("analisa.basisData.cariKoleksi")}
                className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox pl-9 pr-3 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
              />
            </div>

            {koleksiList.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-borderRoundness border border-border bg-backgroundBox p-6 text-center">
                <Database width={32} height={32} className="fill-foregroundGrey/30" />
                <p className="font-bold text-foreground">{t("analisa.basisData.belumAdaKoleksi")}</p>
                <p className="max-w-[220px] text-xs leading-5 text-foregroundGrey">{t("analisa.basisData.kosongIsi")}</p>
                <button
                  type="button"
                  onClick={() => {
                    onTutup();
                    onBukaAkun?.();
                  }}
                  className="cursor-pointer rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-1.5 text-xs font-bold text-foregroundBlackDark hover:bg-backgroundBoxBoxHighlightedHover"
                >
                  {t("analisa.akun.tambahBaru")}
                </button>
              </div>
            ) : daftarKoleksi.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-borderRoundness border border-border bg-backgroundBox p-6 text-center">
                <IkonSearch className="h-6 w-6 text-foregroundGrey/50" />
                <p className="text-sm text-foregroundGrey">{t("analisa.partai.tidakCocok")}</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
                {daftarKoleksi.map((k) => {
                  const aktif = k.id === koleksiTerpilih;
                  const st = statMap[k.id];
                  return (
                    <div
                      key={k.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setKoleksiTerpilih(k.id);
                        setMode("data");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setKoleksiTerpilih(k.id);
                          setMode("data");
                        }
                      }}
                      aria-pressed={aktif}
                      className={`flex cursor-pointer flex-col gap-2.5 rounded-[0.4rem] border p-3.5 transition-colors ${
                        aktif
                          ? "border-[var(--analisa-backgroundBoxBoxHighlighted)] bg-backgroundBox ring-1 ring-[var(--analisa-backgroundBoxBoxHighlighted)]"
                          : "border-border bg-backgroundBox hover:border-borderHighlighted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Database
                          width={16}
                          height={16}
                          className={`shrink-0 ${aktif ? "fill-foregroundHighlighted" : "fill-foregroundGrey"}`}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{k.label}</span>
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          aria-hidden="true"
                          className={`shrink-0 ${aktif ? "text-[#f5a623]" : "text-foregroundGrey/40"}`}
                        >
                          <path
                            fill="currentColor"
                            d="M12 2l2.9 6.26 6.86.6-5.2 4.5 1.55 6.7L12 17.1 5.89 20.6l1.55-6.7-5.2-4.5 6.86-.6z"
                          />
                        </svg>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">
                            {t("analisa.basisData.dataGames")}
                          </div>
                          <div className="text-base font-bold tabular-nums text-foreground">
                            {st?.jumlah ?? k.jumlahPartai ?? "…"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">
                            {t("analisa.basisData.storage")}
                          </div>
                          <div className="text-base font-bold tabular-nums text-foreground">
                            {st ? formatUkuran(st.ukuran) : "…"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onTutup();
                onBukaAkun?.();
              }}
              title={t("analisa.akun.tambahBaru")}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer"
            >
              <IkonPlus className="h-4 w-4" />
              <span>{t("analisa.akun.tambahBaru")}</span>
            </button>
          </div>

          {/* ── Kolom Kanan: Data / Tabel ─────────────────────────── */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            {mode === "data" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-borderRoundness border border-border bg-backgroundBox p-4">
                {koleksi ? (
                  <>
                    <label className="flex w-fit items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        defaultChecked
                        disabled
                        className="h-3.5 w-3.5 rounded border-border bg-backgroundBoxBox accent-[#4a9dd9]"
                      />
                      {t("analisa.basisData.indexed")}
                    </label>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-foregroundGrey">{t("analisa.basisData.data")}</div>
                      <div className="mt-2 grid grid-cols-3 gap-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">{t("analisa.basisData.dataGames")}</div>
                          <div className="text-xl font-bold tabular-nums text-foreground">{stat?.jumlah ?? "…"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">{t("analisa.basisData.dataPlayers")}</div>
                          <div className="text-xl font-bold tabular-nums text-foreground">{stat?.pemain ?? "…"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">{t("analisa.basisData.dataEvents")}</div>
                          <div className="text-xl font-bold tabular-nums text-foreground">{stat?.event ?? "…"}</div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMode("tabel")}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-2.5 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover cursor-pointer"
                    >
                      <span>{t("analisa.basisData.explore")}</span>
                      <span aria-hidden="true">→</span>
                    </button>

                    <hr className="border-border" />

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-foregroundGrey">{t("analisa.basisData.advanced")}</div>
                      <div className="mt-3 flex flex-col gap-4">
                        <div>
                          <p className="text-sm font-bold text-foreground">{t("analisa.basisData.mergePlayers")}</p>
                          <p className="mt-1 text-xs leading-5 text-foregroundGrey">{t("analisa.basisData.mergePlayersDesc")}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={mergeA}
                              onChange={(e) => setMergeA(e.target.value)}
                              placeholder={t("analisa.basisData.player1")}
                              className="min-w-0 flex-1 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey focus:border-[#4a9dd9]"
                            />
                            <button
                              type="button"
                              onClick={tanganiGabungPemain}
                              disabled={!mergeA.trim() || !mergeB.trim()}
                              title={t("analisa.basisData.mergePlayers")}
                              className="rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-2 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-backgroundBoxBoxHighlighted cursor-pointer"
                            >
                              {t("analisa.basisData.merge")} →
                            </button>
                            <input
                              type="text"
                              value={mergeB}
                              onChange={(e) => setMergeB(e.target.value)}
                              placeholder={t("analisa.basisData.player2")}
                              className="min-w-0 flex-1 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey focus:border-[#4a9dd9]"
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-foreground">{t("analisa.basisData.batchDelete")}</p>
                          <p className="mt-1 text-xs leading-5 text-foregroundGrey">{t("analisa.basisData.batchDeleteDesc")}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={tanganiHapusDuplikat}
                              className="rounded-borderRoundness bg-[#4a9dd9] px-3.5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                            >
                              {t("analisa.basisData.removeDuplicates")}
                            </button>
                            <button
                              type="button"
                              onClick={tanganiHapusKosong}
                              className="rounded-borderRoundness bg-[#4a9dd9] px-3.5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                            >
                              {t("analisa.basisData.removeEmpty")}
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-foreground">{t("analisa.basisData.aksi")}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <button type="button" onClick={tanganiEksporPgn} className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer">
                              <IkonDownload className="h-3.5 w-3.5 shrink-0" />
                              <span>{t("analisa.basisData.eksporPgn")}</span>
                            </button>
                            <button type="button" onClick={() => setModalImpor(true)} className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer">
                              <IkonPlus className="h-3.5 w-3.5 shrink-0" />
                              <span>{t("analisa.basisData.imporPgn")}</span>
                            </button>
                            <button type="button" onClick={tanganiHapusKoleksi} className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-lossRed transition-colors hover:bg-backgroundBoxBoxHover cursor-pointer">
                              <IkonTrash className="h-3.5 w-3.5 shrink-0" />
                              <span>{t("analisa.basisData.hapusKoleksi")}</span>
                            </button>
                            {!koleksiTerpilih && totalPartai > 0 ? (
                              <button type="button" onClick={tanganiKosongkanSemua} className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-lossRed transition-colors hover:bg-backgroundBoxBoxHover cursor-pointer">
                                <IkonTrash className="h-3.5 w-3.5 shrink-0" />
                                <span>{t("analisa.basisData.hapusSemua")}</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
                    <Database width={32} height={32} className="fill-foregroundGrey/30" />
                    <p className="font-bold text-foreground">{t("analisa.basisData.belumAdaKoleksi")}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setMode("data")}
                  className="inline-flex w-fit items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer"
                >
                  <span aria-hidden="true">←</span>
                  {t("analisa.basisData.kembaliKeData")}
                </button>
      {/* ── Bilah Kontrol / Filter ──────────────────────────────── */}
      <div className="flex flex-col gap-2.5 pb-2.5 shrink-0">
        {/* Baris 1: Koleksi + Filter + Aksi Global */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0 flex-grow">
            {/* Pemilih Koleksi */}
            <select
              value={koleksiTerpilih}
              onChange={(e) => setKoleksiTerpilih(e.target.value)}
              aria-label={t("analisa.basisData.koleksi")}
              className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-xs font-semibold text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted cursor-pointer"
            >
              <option value="">
                {t("analisa.basisData.semuaKoleksi")} (
                {stats?.totalPartai || 0})
              </option>
              {koleksiList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label} ({k.jumlahPartai})
                </option>
              ))}
            </select>

            {/* Filter Hasil */}
            <select
              value={filterHasil}
              onChange={(e) => setFilterHasil(e.target.value)}
              aria-label={t("analisa.basisData.filterHasil")}
              className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted cursor-pointer"
            >
              <option value="">
                {t("analisa.basisData.semuaHasil")}
              </option>
              <option value="white">
                {t("analisa.basisData.menang")} Putih
              </option>
              <option value="black">
                {t("analisa.basisData.menang")} Hitam
              </option>
              <option value="draw">{t("analisa.basisData.seri")}</option>
            </select>

            {/* Filter Waktu */}
            <select
              value={filterWaktu}
              onChange={(e) => setFilterWaktu(e.target.value)}
              aria-label={t("analisa.basisData.filterWaktu")}
              className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted cursor-pointer"
            >
              <option value="">
                {t("analisa.basisData.semuaWaktu")}
              </option>
              <option value="blitz">Blitz</option>
              <option value="rapid">Rapid</option>
              <option value="bullet">Bullet</option>
              <option value="classical">Klasik</option>
            </select>
          </div>

          {/* Tombol Aksi Global */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={tanganiEksporPgn}
              title={t("analisa.basisData.eksporPgn")}
              className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer"
            >
              <IkonDownload className="h-3.5 w-3.5 shrink-0" />
              <span>{t("analisa.basisData.eksporPgn")}</span>
            </button>
            <button
              type="button"
              onClick={() => setModalImpor(true)}
              title={t("analisa.basisData.imporPgn")}
              className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer"
            >
              <IkonPlus className="h-3.5 w-3.5 shrink-0" />
              <span>{t("analisa.basisData.imporPgn")}</span>
            </button>
            {koleksiTerpilih ? (
              <button
                type="button"
                onClick={tanganiHapusKoleksi}
                title={t("analisa.basisData.hapusKoleksi")}
                className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-lossRed transition-colors hover:bg-backgroundBoxBoxHover cursor-pointer"
              >
                <IkonTrash className="h-3.5 w-3.5 shrink-0" />
                <span>{t("analisa.basisData.hapusKoleksi")}</span>
              </button>
            ) : totalPartai > 0 ? (
              <button
                type="button"
                onClick={tanganiKosongkanSemua}
                title={t("analisa.basisData.hapusSemua")}
                className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-lossRed transition-colors hover:bg-backgroundBoxBoxHover cursor-pointer"
              >
                <IkonTrash className="h-3.5 w-3.5 shrink-0" />
                <span>{t("analisa.basisData.hapusSemua")}</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Baris 2: Kolom Pencarian */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-foregroundGrey">
            <IkonSearch className="h-4 w-4" />
          </div>
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={t("analisa.basisData.cariPlaceholder")}
            aria-label={t("analisa.basisData.cariPlaceholder")}
            className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox pl-9 pr-3 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
          />
        </div>
      </div>

      {/* ── Modal Impor PGN ─────────────────────────────────────── */}
      {modalImpor && (
        <div className="mb-4 flex flex-col gap-2.5 rounded-borderRoundness border border-border bg-backgroundBoxBox p-3.5 animate-fadeIn">
          <p className="text-xs font-bold text-foreground">
            {t("analisa.basisData.imporPgnJudul")}
          </p>
          <textarea
            rows={5}
            value={teksPgn}
            onChange={(e) => setTeksPgn(e.target.value)}
            placeholder={t("analisa.form.tempelPgn")}
            className="w-full resize-y rounded-borderRoundness border border-border bg-backgroundBox p-2 font-mono text-xs text-foreground outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setModalImpor(false);
                setTeksPgn("");
              }}
              className="rounded-borderRoundness border border-border bg-backgroundBox px-3 py-1 text-xs text-foregroundGrey hover:text-foreground cursor-pointer"
            >
              {t("analisa.basisData.imporPgnBatal")}
            </button>
            <button
              type="button"
              disabled={!teksPgn.trim() || prosesImpor}
              onClick={tanganiSimpanImporPgn}
              className="rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3 py-1 text-xs font-bold text-foregroundBlackDark hover:bg-backgroundBoxBoxHighlightedHover disabled:opacity-40 cursor-pointer"
            >
              {prosesImpor
                ? t("analisa.impor.memuat")
                : t("analisa.basisData.imporPgnSimpan")}
            </button>
          </div>
        </div>
      )}

      {/* ── Tabel Permainan ─────────────────────────────────────── */}
      <div className="relative w-full flex-1 min-h-0 overflow-y-scroll overflow-x-auto border border-border rounded-borderRoundness bg-backgroundBox [scrollbar-gutter:stable]">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: "38%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>

          <HeaderTabel urut={urut} ubahUrut={ubahUrut} t={t} />

          <tbody>
            {memuat && daftarPartai.length === 0
              ? Array.from({ length: JUMLAH_BARIS_SKELETON }, (_, i) => (
                  <BarisSkeleton key={`skeleton-${i}`} />
                ))
              : daftarPartai.map((game, i) => (
                  <BarisPartai
                    key={game.id || i}
                    game={game}
                    locale={locale}
                    salinSuksesId={salinSuksesId}
                    tanganiAnalisa={tanganiAnalisa}
                    tanganiSalinPgn={tanganiSalinPgn}
                    tanganiHapusPartai={tanganiHapusPartai}
                    t={t}
                  />
                ))}
          </tbody>
        </table>

        {!memuat && daftarPartai.length === 0 ? (
          <div className="absolute inset-x-0 top-[35px] bottom-0 flex items-center justify-center px-4 pointer-events-none">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <Database width={32} height={32} className="fill-foregroundGrey/30 mb-1" />
              <p className="font-bold text-foreground">
                {t("analisa.basisData.kosongJudul")}
              </p>
              <p className="max-w-md text-xs leading-5 text-foregroundGrey">
                {cari || filterHasil || filterWaktu
                  ? t("analisa.partai.tidakCocok")
                  : t("analisa.basisData.kosongIsi")}
              </p>
              {onBukaAkun && !cari && !filterHasil && !filterWaktu ? (
                <button
                  type="button"
                  onClick={() => {
                    onTutup();
                    onBukaAkun();
                  }}
                  className="pointer-events-auto mt-2 inline-flex items-center gap-1.5 rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-1.5 text-xs font-bold text-foregroundBlackDark hover:bg-backgroundBoxBoxHighlightedHover cursor-pointer"
                >
                  <span>{t("analisa.basisData.bukaAkun")}</span>
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Navigasi Paginasi ───────────────────────────────────── */}
      <div className="mt-auto min-h-[32px] shrink-0 pt-3">
        {totalHal > 1 ? (
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-foregroundGrey">
                {t("analisa.basisData.halaman", {
                  aktif: aktifHal,
                  total: totalHal,
                })}{" "}
                ({totalPartai} partai)
              </span>
              <span className="text-foregroundGrey">
                {t("analisa.basisData.subjudul")}
              </span>
            </div>
<div className="flex items-center gap-2">
              {daftarHalaman(aktifHal, totalHal).map((hlm) => (
                <button
                  key={hlm}
                  type="button"
                  onClick={() => setHal(hlm)}
                  aria-current={aktifHal === hlm ? "page" : undefined}
                  className={`rounded-borderRoundness px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                    aktifHal === hlm
                      ? "border border-border bg-backgroundBoxBox font-bold text-foregroundHighlighted"
                      : "border border-border bg-backgroundBoxBox text-foreground hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"
                  }`}
                >
                  {hlm}
                </button>
              ))}
              <button
                type="button"
                disabled={aktifHal <= 1}
                onClick={() => setHal((h) => Math.max(1, h - 1))}
                className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1 text-xs text-foreground transition-colors hover:bg-backgroundBoxBoxHover disabled:opacity-40 disabled:hover:bg-backgroundBoxBox cursor-pointer"
              >
                {t("analisa.basisData.sebelumnya")}
              </button>
              <button
                type="button"
                disabled={aktifHal >= totalHal}
                onClick={() => setHal((h) => Math.min(totalHal, h + 1))}
                className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1 text-xs text-foreground transition-colors hover:bg-backgroundBoxBoxHover disabled:opacity-40 disabled:hover:bg-backgroundBoxBox cursor-pointer"
              >
                {t("analisa.basisData.berikutnya")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
}