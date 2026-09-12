/*
 * Layar "Basis Data Permainan" (Database) — arsitektur terinspirasi
 * dari sistem manajemen database en-croissant (https://github.com/franciscoBSalgueiro/en-croissant).
 *
 * Menggunakan SVG icons konsisten tanpa emoji, tipografi terstruktur,
 * dan integrasi langsung ke IndexedDB peramban.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { flexRender } from "@tanstack/react-table";
import {
  useLegacyTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table/legacy";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import PanelLayar from "./PanelLayar.jsx";
import Database from "../svg/database.jsx";
import SquareFillEqual from "../svg/square-fill-equal.jsx";
import SquareFillMinus from "../svg/square-fill-minus.jsx";
import SquareFillPlus from "../svg/square-fill-plus.jsx";
import Trash from "../svg/trash.jsx";
import Download from "../svg/download.jsx";
import Back from "../svg/back.jsx";
import DualRingSpinner from "../loading/DualRingSpinner.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import {
  ambilDaftarPartai,
  ambilPartai,
  ambilSemuaKoleksi,
  bacaRevisiBasis,
  bersihkanBasisData,
  eksporPgnKoleksi,
  hapusKoleksi,
  hapusPartai,
  hitungStatistikBasisData,
  hitungStatistikKoleksiRingan,
  imporPgnKeBasisData,
} from "../../basisData.js";
import { muatPartaiChessCom } from "../../akun/muatPartaiAkun.js";

/* ── Konstanta ─────────────────────────────────────────────────────── */

/** Biru aksen (mantine blue) — dipakai spinner loading tab Pemain & Event. */
const BIRU = "#4a9dd9";

/*
 * Cache sesi ringkasan Database: daftar koleksi + statistik seluruh basis +
 * statistik per koleksi. Disimpan bersama `revisi` basis data — setiap tulis
 * (unduh akun di menu Akun, impor, hapus, gabung, bersihkan) menaikkan revisi,
 * jadi cache ini otomatis basi saat data benar-benar berubah. Membuka layar
 * ini lagi tanpa perubahan tidak perlu memindai ulang IndexedDB.
 */
let cacheRingkasan = null;

/*
 * Pilihan yang bertahan saat layar dilepas: mode panel kanan ("data"/"tabel")
 * dan tab tabel ("partai"/"pemain"/"event"). Layar di-unmount begitu pindah
 * menu (mis. ke Bermain), jadi disimpan di sini agar kembali ke Database
 * tetap menampilkan tabel yang sedang dibuka — bukan ringkasan awal.
 */
let modeTersimpan = "data";
let tampilanTersimpan = "partai";

/*
 * Cache rekap tab Pemain & Event — key = koleksiId ("" = semua koleksi),
 * value = { revisi, daftar }. Bertahan lintas buka-tutup layar dalam sesi
 * yang sama; revisi basis yang naik otomatis membuatnya basi.
 */
const rekapPemainCache = new Map();
const rekapEventCache = new Map();

/*
 * Cache sesi halaman terakhir tabel Partai: satu entri { kunci, revisi,
 * total, daftar } untuk kueri yang paling baru dijalankan. Kunci mencakup
 * koleksi + cari + filter + urut + halaman. Tabel Partai selalu di-refetch
 * setiap layar dibuka ulang; dengan cache ini kembali ke Database tidak lagi
 * menarik ulang data yang sudah pernah dilihat selama revisi basis masih sama.
 */
let cacheTabelPartai = null;

const BARIS_PER_HALAMAN = 50;
const JUMLAH_BARIS_SKELETON = 7; // jumlah baris skeleton
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

/* ── Dropdown Custom ─────────────────────────────────────────────── */

/*
 * Dropdown pilihan untuk toolbar. Pengganti <select> native: dropdown
 * bawaan peramban digambar oleh OS dan warna sorotannya (biru) tidak bisa
 * diganti CSS — makanya "gantung" sendiri. Panel ini milik kita sendiri:
 * latar hitam-abu (#2a2a2a) dan sorotan/item terpilih warna HITAM.
 */
function DropdownPilih({ ariaLabel, nilai, opsi, onPilih, sejajar = "kiri" }) {
  const [terbuka, setTerbuka] = useState(false);
  const wadahRef = useRef(null);

  useEffect(() => {
    if (!terbuka) return undefined;
    function klikLuar(e) {
      if (!wadahRef.current?.contains(e.target)) setTerbuka(false);
    }
    function tekanEsc(e) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tekanEsc);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tekanEsc);
    };
  }, [terbuka]);

  const aktif = opsi.find((o) => o.nilai === nilai) ?? opsi[0];

  return (
    <div ref={wadahRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={terbuka}
        onClick={() => setTerbuka((b) => !b)}
        className="flex cursor-pointer items-center justify-between gap-2 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-xs text-foreground outline-none transition-colors hover:border-borderHighlighted"
      >
        <span className="max-w-[220px] truncate">{aktif?.label ?? ""}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-foregroundGrey transition-transform ${terbuka ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {terbuka ? (
        <ul
          role="listbox"
          className={`absolute top-full z-[1200] mt-1 w-max min-w-full max-w-[320px] overflow-y-auto rounded-borderRoundness border border-border bg-[#2a2a2a] py-1 shadow-2xl ${
            sejajar === "kanan" ? "right-0" : "left-0"
          }`}
        >
          {opsi.map((o) => {
            const dipilih = o.nilai === nilai;
            return (
              <li key={o.nilai || "_default"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={dipilih}
                  onClick={() => {
                    onPilih(o.nilai);
                    setTerbuka(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 whitespace-nowrap px-3 py-1.5 text-left text-xs transition-colors hover:bg-black hover:text-white ${
                    dipilih ? "bg-black font-semibold text-white" : "text-foreground"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {dipilih ? <IkonCheck className="h-3 w-3 shrink-0 text-foregroundHighlighted" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/* ── Utilitas Statistik Koleksi & Format Ukuran ───────────────────── */

/** Format byte → "220 KB" / "7.36 MB" (gaya kartu En Croissant). */
function formatUkuran(byte) {
  const b = Number(byte) || 0;
  if (b <= 0) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(b < 1024 * 10 ? 0 : 1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/* ── Komponen Baris Skeleton ───────────────────────────────────────── */

function BarisSkeleton() {
  return (
    <tr className="h-[56px] border-b border-border/50">
      {/* Pemain — struktur sama persis dengan BarisPartai */}
      <td className="py-2 pl-4 pr-2 w-[38%] min-w-44 overflow-hidden">
        <div className="grid h-5 grid-cols-2 items-center gap-x-2 text-[13px] leading-5">
          <span className="h-2.5 w-20 rounded-sm bg-foregroundGrey/15" />
          <span className="h-2.5 w-24 rounded-sm bg-foregroundGrey/15" />
        </div>
      </td>

      {/* Hasil */}
      <td className="py-2 px-2 whitespace-nowrap">
        <div className="flex h-5 items-center gap-1.5">
          <span className="h-2.5 w-9 rounded-sm bg-foregroundGrey/15" />
          <span className="h-3.5 w-3.5 rounded-sm bg-foregroundGrey/10" />
        </div>
      </td>

      {/* Event */}
      <td className="py-2 px-2 whitespace-nowrap">
        <span className="block h-2.5 w-28 rounded-sm bg-foregroundGrey/15" />
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

      {/* Situs */}
      <td className="py-2 px-2 whitespace-nowrap">
        <span className="block h-2.5 w-12 rounded-sm bg-foregroundGrey/10" />
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
      subKolom: [
        { label: t("analisa.basisData.putih"), kiri: true },
        { label: t("analisa.basisData.hitam"), kiri: false },
      ],
    },
    {
      kunci: "hasil",
      label: t("analisa.basisData.hasilTabel"),
      align: "text-left",
      padding: "py-2 px-2",
    },
    {
      kunci: "eventSitus",
      label: "Event",
      align: "text-left",
      padding: "py-2 px-2 hidden sm:table-cell",
      tanpaSort: true,
      kelasTh: "hidden sm:table-cell",
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
      align: "text-center",
      padding: "py-2 px-2",
    },
    {
      kunci: "situs",
      label: "Situs",
      align: "text-left",
      padding: "py-2 px-2 hidden lg:table-cell",
      tanpaSort: true,
      kelasTh: "hidden lg:table-cell",
    },
  ];

  return (
    <thead className="sticky top-0 bg-backgroundBox border-b border-border z-10 select-none">
      <tr>
        {kolom.map((k) => (
          <th
            key={k.kunci}
            className={`${k.padding} ${k.align} text-xs font-semibold uppercase tracking-wide text-foregroundGrey ${k.kelasTh || ""}`}
          >
            {k.subKolom ? (
              <div className="grid grid-cols-2 gap-x-2">
                {k.subKolom.map((sub) => (
                  <button
                    key={sub.label}
                    type="button"
                    onClick={() => ubahUrut(k.kunci)}
                    className={`inline-flex items-center cursor-pointer transition-colors hover:text-foregroundHighlighted justify-start`}
                  >
                    {sub.label}
                    {!sub.kiri && (
                      <IkonSort aktif={urut.kolom === k.kunci} arah={urut.arah} />
                    )}
                  </button>
                ))}
              </div>
            ) : k.tanpaSort ? (
              k.label
            ) : (
              <button
                type="button"
                onClick={() => ubahUrut(k.kunci)}
                className="inline-flex items-center hover:text-foregroundHighlighted transition-colors cursor-pointer"
              >
                {k.label}
                <IkonSort aktif={urut.kolom === k.kunci} arah={urut.arah} />
              </button>
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/* ── Komponen Baris Data Partai ─────────────────────────────────────── */

function BarisPartai({ game, locale, tanganiAnalisa }) {
  const whiteWon = game.result === "white";
  const blackWon = game.result === "black";

  return (
    <tr
      onClick={() => tanganiAnalisa(game)}
      className={`cursor-pointer select-none border-b border-border/50 transition-colors hover:bg-backgroundBoxHover group ${TINGGI_BARIS}`}
    >
      {/* Pemain — putih di kiri, hitam di kanan, nama di atas ELO di bawah */}
      <td className="py-2 pl-4 pr-2 w-[38%] min-w-44 overflow-hidden">
        <div className="grid grid-cols-2 items-center gap-x-2 text-[13px] leading-5">
          <div className="min-w-0">
            <div className="truncate font-medium">{game.whiteName || "Putih"}</div>
            <div className="truncate text-[10px] tabular-nums text-foregroundGrey">
              {game.whiteElo || ""}
            </div>
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{game.blackName || "Hitam"}</div>
            <div className="truncate text-[10px] tabular-nums text-foregroundGrey">
              {game.blackElo || ""}
            </div>
          </div>
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

      {/* Event - hidden on mobile */}
      <td className="px-2 py-2 whitespace-nowrap text-xs text-foregroundGrey hidden sm:table-cell">
        <div className="truncate max-w-[120px]">{game.event || "—"}</div>
      </td>

      {/* Tanggal */}
      <td className="py-2 px-2 whitespace-nowrap text-xs text-foregroundGrey">
        <div>{formatTanggal(game.timestamp, locale)}</div>
        <div className="text-[10px] text-foregroundGrey/75 font-mono uppercase tracking-wider">
          {game.timeClass || ""}
        </div>
      </td>

      {/* Langkah */}
      <td className="py-2 px-2 text-center whitespace-nowrap text-xs font-semibold tabular-nums text-foreground">
        {game.plyCount ?? "-"}
      </td>

      {/* Situs - hidden on mobile/tablet */}
      <td className="py-2 px-2 whitespace-nowrap text-[10px] uppercase tracking-wider text-foregroundGrey/75 hidden lg:table-cell">
        <div className="truncate max-w-[100px]">{game.site || game.url || ""}</div>
      </td>

    </tr>
  );
}

/* ── Tabel Ringkasan (mode "data") ──────────────────────────────────── */

/* Varian tampilan ringkas: hanya sebagian partai terbaru koleksi yang
 * dimuat (tanpa teks PGN) lalu difilter di memori. Internal paginasi
 * memakai @tanstack/react-table — tidak menarik seluruh baris sekaligus. */
const BATAS_MUAT_RINGKAS = 400;
const PERIODE_MUNDUR = [
  { nilai: "mingguan", hari: 7 },
  { nilai: "bulanan", hari: 31 },
  { nilai: "tahunan", hari: 366 },
  { nilai: "semua", hari: 0 },
];

function HeaderKolom({ kolom, t }) {
  const label = flexRender(kolom.column.columnDef.header, kolom.getContext());
  if (!kolom.column.getCanSort()) return label;
  return (
    <button
      type="button"
      onClick={kolom.column.getToggleSortingHandler()}
      className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-foregroundHighlighted"
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 ${
          kolom.column.getIsSorted() ? "text-foregroundHighlighted" : "text-foregroundGrey"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

function MenuKolom({ t, nilai, onPilih }) {
  const [terbuka, setTerbuka] = useState(false);
  const wadahRef = useRef(null);

  useEffect(() => {
    if (!terbuka) return undefined;
    function klikLuar(e) {
      if (!wadahRef.current?.contains(e.target)) setTerbuka(false);
    }
    function tekanEsc(e) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tekanEsc);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tekanEsc);
    };
  }, [terbuka]);

  const opsi = [
    { nilai: "mingguan", label: t("analisa.basisData.periodeMingguan") },
    { nilai: "bulanan", label: t("analisa.basisData.periodeBulanan") },
    { nilai: "tahunan", label: t("analisa.basisData.periodeTahunan") },
    { nilai: "semua", label: t("analisa.basisData.periodeSemua") },
  ];

  return (
    <div ref={wadahRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={terbuka}
        onClick={() => setTerbuka((b) => !b)}
        className="flex cursor-pointer items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-xs text-foreground outline-none transition-colors hover:border-borderHighlighted"
      >
        {t("analisa.basisData.kolom")}
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-foregroundGrey transition-transform ${terbuka ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {terbuka ? (
        <ul
          role="listbox"
          aria-label={t("analisa.basisData.kolom")}
          className="absolute right-0 top-full z-[1200] mt-1 w-max min-w-[140px] overflow-hidden rounded-borderRoundness border border-border bg-[#2a2a2a] py-1 shadow-2xl"
        >
          {opsi.map((o) => {
            const dipilih = o.nilai === nilai;
            return (
              <li key={o.nilai}>
                <button
                  type="button"
                  role="option"
                  aria-selected={dipilih}
                  onClick={() => {
                    onPilih(o.nilai);
                    setTerbuka(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 whitespace-nowrap px-3 py-1.5 text-left text-xs transition-colors hover:bg-black hover:text-white ${
                    dipilih ? "bg-black font-semibold text-white" : "text-foreground"
                  }`}
                >
                  <span>{o.label}</span>
                  {dipilih ? (
                    <IkonCheck className="h-3 w-3 shrink-0 text-foregroundHighlighted" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function TabelRingkasan({ koleksiId, t, locale }) {
  /* null = masih memuat; [] = sudah dimuat tapi kosong */
  const [daftar, setDaftar] = useState(null);
  const [periode, setPeriode] = useState("semua");
  const [cari, setCari] = useState("");
  const [sorting, setSorting] = useState([]);

  useEffect(() => {
    let hidup = true;
    if (!koleksiId) {
      setDaftar([]);
      return undefined;
    }
    setDaftar(null);
    (async () => {
      try {
        const hasil = await ambilDaftarPartai({
          koleksiId,
          limit: BATAS_MUAT_RINGKAS,
          sertakanPgn: false,
          urut: "tanggal",
          arah: "desc",
        });
        if (hidup) setDaftar(hasil?.partai || []);
      } catch {
        if (hidup) setDaftar([]);
      }
    })();
    return () => {
      hidup = false;
    };
  }, [koleksiId]);

  const dataTampil = useMemo(() => {
    const g = daftar || [];
    const p = PERIODE_MUNDUR.find((x) => x.nilai === periode);
    const batas = p?.hari ? Date.now() - p.hari * 86400000 : 0;
    const q = cari.trim().toLowerCase();
    return g.filter((baris) => {
      if (batas > 0 && baris.timestamp && baris.timestamp < batas) return false;
      if (!q) return true;
      const teks = `${baris.whiteName || ""} ${baris.blackName || ""} ${
        baris.event || ""
      } ${baris.site || ""}`.toLowerCase();
      return teks.includes(q);
    });
  }, [daftar, periode, cari]);

  const kolom = useMemo(
    () => [
      {
        id: "nomor",
        header: "#",
        enableSorting: false,
        cell: (info) => info.row.index + 1,
      },
      {
        accessorKey: "whiteName",
        header: t("analisa.basisData.putih"),
        cell: (info) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{info.row.original.whiteName || "—"}</div>
            <div className="truncate text-[10px] tabular-nums text-foregroundGrey">
              {info.row.original.whiteElo || ""}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "blackName",
        header: t("analisa.basisData.hitam"),
        cell: (info) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{info.row.original.blackName || "—"}</div>
            <div className="truncate text-[10px] tabular-nums text-foregroundGrey">
              {info.row.original.blackElo || ""}
            </div>
          </div>
        ),
      },
      {
        id: "hasil",
        header: t("analisa.basisData.hasilTabel"),
        enableSorting: false,
        cell: (info) => {
          const g = info.row.original;
          const whiteWon = g.result === "white";
          const blackWon = g.result === "black";
          return (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-semibold text-foregroundGrey">
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
          );
        },
      },
      {
        accessorKey: "event",
        header: t("analisa.basisData.event"),
        enableSorting: false,
        cell: (info) => (
          <div className="truncate whitespace-nowrap text-xs text-foregroundGrey">
            {info.row.original.event || "—"}
          </div>
        ),
      },
      {
        accessorKey: "timestamp",
        header: t("analisa.basisData.tanggal"),
        cell: (info) => (
          <div className="whitespace-nowrap">
            <div className="text-xs text-foregroundGrey">
              {formatTanggal(info.row.original.timestamp, locale)}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-foregroundGrey/75">
              {info.row.original.timeClass || ""}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "plyCount",
        header: t("analisa.basisData.langkah"),
        cell: (info) => (
          <div className="text-center text-xs font-semibold tabular-nums text-foreground">
            {info.row.original.plyCount ?? "-"}
          </div>
        ),
      },
      {
        accessorKey: "site",
        header: t("analisa.basisData.situs"),
        enableSorting: false,
        cell: (info) => (
          <div className="truncate whitespace-nowrap text-[10px] uppercase tracking-wider text-foregroundGrey/75">
            {info.row.original.site || info.row.original.url || ""}
          </div>
        ),
      },
    ],
    [t, locale],
  );

  const tabel = useLegacyTable({
    data: dataTampil,
    columns: kolom,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const aktifHal = tabel.getState().pagination.pageIndex + 1;
  const totalHal = tabel.getPageCount();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Toolbar: pencarian + filter periode pada tombol Kolom - responsive */}
      <div className="flex shrink-0 flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2">
        <div className="relative w-full sm:w-56">
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
        <MenuKolom t={t} nilai={periode} onPilih={setPeriode} />
      </div>

      {daftar === null ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
          <DualRingSpinner color={BIRU} />
          <p className="text-sm text-foregroundGrey">{t("analisa.basisData.memuatData")}</p>
        </div>
      ) : dataTampil.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
          <Database width={32} height={32} className="fill-foregroundGrey/30" />
          <p className="font-bold text-foreground">
            {daftar.length === 0
              ? t("analisa.basisData.kosongJudul")
              : t("analisa.partai.tidakCocok")}
          </p>
        </div>
      ) : (
        <>
          <div className="relative min-h-0 w-full flex-1 overflow-y-auto overflow-x-auto border border-border rounded-borderRoundness bg-backgroundBox [scrollbar-gutter:stable] -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full">
            <table className="w-full min-w-[640px] sm:min-w-[820px] table-fixed border-collapse text-sm">
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead className="sticky top-0 z-10 select-none border-b border-border bg-backgroundBox">
                <tr>
                  {tabel.getHeaderGroups()[0].headers.map((h) => (
                    <th
                      key={h.id}
                      className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey"
                    >
                      <HeaderKolom kolom={h} t={t} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabel.getRowModel().rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/50 transition-colors hover:bg-backgroundBoxHover"
                  >
                    {r.getVisibleCells().map((c) => (
                      <td
                        key={c.id}
                        className={`px-2 py-2 align-middle ${
                          c.column.id === "nomor"
                            ? "whitespace-nowrap text-xs tabular-nums text-foregroundGrey"
                            : c.column.id === "langkah"
                              ? "text-right"
                              : ""
                        }`}
                      >
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginasi ringkas */}
          <div className="flex shrink-0 items-center justify-between gap-2 text-xs">
            <span className="text-foregroundGrey">
              {t("analisa.basisData.baris", {
                jumlah: tabel.getRowCount(),
                total: dataTampil.length,
              })}
            </span>
            <div className="flex items-center gap-2">
              {totalHal > 1 ? (
                <span className="text-foregroundGrey">
                  {t("analisa.basisData.halaman", { aktif: aktifHal, total: totalHal })}
                </span>
              ) : null}
              <button
                type="button"
                disabled={!tabel.getCanPreviousPage()}
                onClick={() => tabel.previousPage()}
                className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1 text-xs text-foreground transition-colors hover:bg-backgroundBoxBoxHover disabled:opacity-40 disabled:hover:bg-backgroundBoxBox cursor-pointer disabled:cursor-not-allowed"
              >
                {t("analisa.basisData.sebelumnya")}
              </button>
              <button
                type="button"
                disabled={!tabel.getCanNextPage()}
                onClick={() => tabel.nextPage()}
                className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1 text-xs text-foreground transition-colors hover:bg-backgroundBoxBoxHover disabled:opacity-40 disabled:hover:bg-backgroundBoxBox cursor-pointer disabled:cursor-not-allowed"
              >
                {t("analisa.basisData.berikutnya")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Komponen Utama ────────────────────────────────────────────────── */

export default function LayarDatabase({
  onTutup,
  onAnalisa,
  onBukaAkun,
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
  const [mode, setMode] = useState(modeTersimpan);
  // Statistik per koleksi (jumlah/pemain/event/ukuran) — di-cache di sini.
  const [statMap, setStatMap] = useState({});

  /* Tab tampilan mode tabel: "partai" (default) | "pemain" | "event". */
  const [tampilan, setTampilan] = useState(tampilanTersimpan);
  const [rekapPemain, setRekapPemain] = useState([]);
  const [rekapEvent, setRekapEvent] = useState([]);
  const [memuatPemain, setMemuatPemain] = useState(false);
  const [memuatEvent, setMemuatEvent] = useState(false);

  /* ── State Tarik Data dengan filter periode (minggu/bulan/tahun) ── */
  const [tarikPeriode, setTarikPeriode] = useState("bulanan");
  const [sedangTarik, setSedangTarik] = useState(false);
  const [progresTarik, setProgresTarik] = useState({ current: 0, total: 0, bulan: null });

  /* Simpan pilihan mode & tab agar bertahan saat layar dilepas lalu dibuka lagi. */
  useEffect(() => {
    modeTersimpan = mode;
  }, [mode]);
  useEffect(() => {
    tampilanTersimpan = tampilan;
  }, [tampilan]);

  /* Turunan */
  const totalHal = Math.max(1, Math.ceil(totalPartai / BARIS_PER_HALAMAN));
  const aktifHal = Math.min(hal, totalHal);
  const koleksi = koleksiList.find((k) => k.id === koleksiTerpilih) || null;
  // Koleksi yang tampil di kolom kiri, difilter oleh kotak pencarian koleksi.
  const daftarKoleksi = cariKoleksi
    ? koleksiList.filter((k) => (k.label || "").toLowerCase().includes(cariKoleksi.toLowerCase()))
    : koleksiList;

  // Penyaringan rekap Pemain & Event di memori (data sudah dimuat penuh):
  // kotak cari yang sama ikut menyaring kedua tab itu, tanpa tarik ulang.
  const cariBawah = cari.toLowerCase();
  const daftarPemainTampil = cariBawah
    ? rekapPemain.filter((e) => (e.nama || "").toLowerCase().includes(cariBawah))
    : rekapPemain;
  const daftarEventTampil = cariBawah
    ? rekapEvent.filter((e) => (e.nama || "").toLowerCase().includes(cariBawah))
    : rekapEvent;

  /* ── Pemuat Data ───────────────────────────────────────────────── */

  // Penjaga request basi: pemicu yang beruntun (ketikan kotak cari, ganti
  // koleksi, ganti layar) tidak boleh membuat hasil lama menimpa yang
  // lebih baru.
  const tokenPartai = useRef(0);
  const tokenMetadata = useRef(0);

  // Penggabungan pembacaan ringkasan yang beruntun: bila pemuatan metadata
  // masih berjalan (mis. layar dibuka ulang saat scan pertama belum selesai),
  // panggilan kedua menunggu hasil yang sama — tidak memindai basis dua kali.
  const janjiRingkasan = useRef(null);

  async function muatMetadata() {
    const token = ++tokenMetadata.current;
    const revisi = bacaRevisiBasis();
    if (cacheRingkasan?.revisi === revisi) {
      if (token === tokenMetadata.current) {
        setKoleksiList(cacheRingkasan.koleksi);
        setStats(cacheRingkasan.stats);
        setStatMap(cacheRingkasan.statMap);
      }
      return;
    }
    // Pembacaan yang sama sedang berjalan → ikut menunggu, jangan dobel.
    if (janjiRingkasan.current) {
      try {
        await janjiRingkasan.current;
      } catch {
        /* abaikan */
      }
      if (token === tokenMetadata.current && cacheRingkasan?.revisi === bacaRevisiBasis()) {
        setKoleksiList(cacheRingkasan.koleksi);
        setStats(cacheRingkasan.stats);
        setStatMap(cacheRingkasan.statMap);
      }
      return;
    }
    const pekerjaan = (async () => {
      const [semuaKoleksi, st] = await Promise.all([
        ambilSemuaKoleksi(),
        hitungStatistikBasisData(),
      ]);
      // Statistik per koleksi (jumlah/pemain/event/ukuran) dihitung dari
      // metadata ringan (lihat hitungStatistikKoleksiRingan di basisData.js)
      // — versi lama membaca teks PGN penuh SETIAP koleksi, sehingga membuka
      // layar Database berulang kali menumpuk ribuan teks PGN di memori.
      // Dilakukan berurutan agar puncak memorinya kecil.
      const map = {};
      for (const k of semuaKoleksi) {
        try {
          map[k.id] = await hitungStatistikKoleksiRingan(k.id);
        } catch {
          map[k.id] = null;
        }
      }
      return { revisi, koleksi: semuaKoleksi, stats: st, statMap: map };
    })();
    janjiRingkasan.current = pekerjaan;
    try {
      const ringkasan = await pekerjaan;
      cacheRingkasan = ringkasan;
      if (token === tokenMetadata.current) {
        setKoleksiList(ringkasan.koleksi);
        setStats(ringkasan.stats);
        setStatMap(ringkasan.statMap);
      }
    } catch {
      /* abaikan */
    } finally {
      janjiRingkasan.current = null;
    }
  }

  async function muatPartai() {
    const token = ++tokenPartai.current;
    const revisi = bacaRevisiBasis();
    const kunci = JSON.stringify([
      koleksiTerpilih,
      cariDebounce,
      filterHasil,
      filterWaktu,
      urut,
      hal,
    ]);
    // Koleksi pertama belum terpilih otomatis (daftar koleksi masih dimuat):
    // skip dulu — effect ini akan berjalan ulang setelah auto-pilih.
    if (!koleksiTerpilih && koleksiList.length > 0) return;
    const tersimpan = cacheTabelPartai;
    if (tersimpan && tersimpan.kunci === kunci && tersimpan.revisi === revisi) {
      if (token === tokenPartai.current) {
        setDaftarPartai(tersimpan.daftar);
        setTotalPartai(tersimpan.total);
        setMemuat(false);
      }
      return;
    }
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
        cari: cariDebounce,
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

      if (token !== tokenPartai.current) return; // ada pemicu yang lebih baru
      cacheTabelPartai = { kunci, revisi, total: hasil.total || 0, daftar: hasil.partai || [] };
      setDaftarPartai(hasil.partai || []);
      setTotalPartai(hasil.total || 0);
    } catch {
      if (token === tokenPartai.current) {
        setDaftarPartai([]);
        setTotalPartai(0);
      }
    } finally {
      if (token === tokenPartai.current) setMemuat(false);
    }
  }

  /* ── Effects ───────────────────────────────────────────────────── */

  useEffect(() => {
    muatMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setHal(1);
  }, [koleksiTerpilih, cari, filterHasil, filterWaktu, urut]);

  // Kotak cari di-debounce: tanpa ini setiap ketikan memicu penelusuran
  // kursor baru ke IndexedDB (dan membuka transaksi baru) — mengetik cepat
  // beberapa kata menumpuk belasan kueri paralel.
  const tundaCari = useRef(null);
  const [cariDebounce, setCariDebounce] = useState(cari);
  useEffect(() => {
    window.clearTimeout(tundaCari.current);
    tundaCari.current = window.setTimeout(() => setCariDebounce(cari), 300);
    return () => window.clearTimeout(tundaCari.current);
  }, [cari]);

  useEffect(() => {
    muatPartai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [koleksiTerpilih, cariDebounce, filterHasil, filterWaktu, urut, hal]);

  /*
   * Rekap pemain & event — dihitung lazily (hanya saat tab-nya dibuka) dan
   * di-cache per (koleksi, revisi basis) di LEVEL MODUL: layar ini dilepas
   * setiap pindah menu Akun ↔ Database, jadi cache useRef ikut hilang dan
   * memindai ulang basis tiap kali. Keduanya cukup membaca METADATA (field
   * `event` sudah diuraikan dari header [Event] saat partai disimpan) — teks
   * PGN tidak pernah ditarik ke sini.
   */
  useEffect(() => {
    if (tampilan !== "pemain") return undefined;
    // Koleksi pertama belum terpilih otomatis: tunggu auto-pilih, effect ini
    // akan berjalan ulang begitu koleksi pertama siap.
    if (!koleksiTerpilih && koleksiList.length > 0) return undefined;
    let hidup = true;
    const revisi = bacaRevisiBasis();
    const kunciCache = koleksiTerpilih || "";
    const cache = rekapPemainCache.get(kunciCache);
    if (cache && cache.revisi === revisi) {
      setRekapPemain(cache.daftar);
      setMemuatPemain(false);
      return undefined;
    }
    (async () => {
      setMemuatPemain(true);
      try {
        const hasil = await ambilDaftarPartai({
          koleksiId: koleksiTerpilih || undefined,
          limit: 0,
          urut: "tanggal",
          arah: "desc",
          sertakanPgn: false, // metadata saja — murah
        });
        const peta = new Map();
        const tambah = (nama, hasilMain, ts, p, sisi) => {
          if (!nama) return;
          const e =
            peta.get(nama) ||
            {
              nama,
              main: 0,
              menang: 0,
              seri: 0,
              kalah: 0,
              terakhir: 0,
              putih: 0,
              hitam: 0,
              elo: 0,
              partai: [],
            };
          e.main += 1;
          e[hasilMain] += 1;
          e[sisi] += 1;
          if (ts > e.terakhir) e.terakhir = ts;
          const elo = Number(sisi === "putih" ? p.whiteElo : p.blackElo) || 0;
          if (ts >= e.terakhir && elo > 0) e.elo = elo;
          // Metadata ringan per partai — untuk baris rincian kartu (tanpa PGN).
          e.partai.push({
            id: p.id,
            whiteName: p.whiteName,
            blackName: p.blackName,
            elo,
            result: p.result,
            sisi,
          });
          peta.set(nama, e);
        };
        for (const p of hasil?.partai || []) {
          const ts = p.timestamp || 0;
          if (p.result === "white") {
            tambah(p.whiteName, "menang", ts, p, "putih");
            tambah(p.blackName, "kalah", ts, p, "hitam");
          } else if (p.result === "black") {
            tambah(p.whiteName, "kalah", ts, p, "putih");
            tambah(p.blackName, "menang", ts, p, "hitam");
          } else {
            tambah(p.whiteName, "seri", ts, p, "putih");
            tambah(p.blackName, "seri", ts, p, "hitam");
          }
        }
        const daftar = Array.from(peta.values()).sort(
          (a, b) => b.main - a.main || a.nama.localeCompare(b.nama),
        );
        rekapPemainCache.set(kunciCache, { revisi, daftar });
        if (hidup) setRekapPemain(daftar);
      } catch {
        if (hidup) setRekapPemain([]);
      } finally {
        if (hidup) setMemuatPemain(false);
      }
    })();
    return () => {
      hidup = false;
    };
  }, [tampilan, koleksiTerpilih]);

  useEffect(() => {
    if (tampilan !== "event") return undefined;
    // Lihat catatan guard di effect tab Pemain.
    if (!koleksiTerpilih && koleksiList.length > 0) return undefined;
    let hidup = true;
    const revisi = bacaRevisiBasis();
    const kunciCache = koleksiTerpilih || "";
    const cache = rekapEventCache.get(kunciCache);
    if (cache && cache.revisi === revisi) {
      setRekapEvent(cache.daftar);
      setMemuatEvent(false);
      return undefined;
    }
    (async () => {
      setMemuatEvent(true);
      try {
        // Metadata saja: field `event` sudah diuraikan dari header [Event]
        // saat partai disimpan (normalisasiDataPartai), jadi tidak perlu
        // menarik teks PGN penuh ribuan partai ke memori.
        const hasil = await ambilDaftarPartai({
          koleksiId: koleksiTerpilih || undefined,
          limit: 0,
          urut: "tanggal",
          arah: "desc",
          sertakanPgn: false,
        });
        const peta = new Map();
        let butuhPgn = false;
        for (const p of hasil?.partai || []) {
          // Partai warisan tanpa event teruraikan → perlu fallback baca PGN.
          const nama = p.event?.trim() || "—";
          if (nama === "—") butuhPgn = true;
          const e = peta.get(nama) || { nama, jumlah: 0, terakhir: 0 };
          e.jumlah += 1;
          if ((p.timestamp || 0) > e.terakhir) e.terakhir = p.timestamp || 0;
          peta.set(nama, e);
        }

        // Basis lama: satu kali tarik PGN untuk koleksi ini lalu cache —
        // tidak diulang tiap kali layar ini dibuka.
        if (butuhPgn) {
          const lengkap = await ambilDaftarPartai({
            koleksiId: koleksiTerpilih || undefined,
            limit: 0,
            urut: "tanggal",
            arah: "desc",
            sertakanPgn: true,
          });
          const petaPenuh = new Map();
          for (const p of lengkap?.partai || []) {
            const m = /\[Event\s+"([^"]*)"\]/.exec(p.pgn || "");
            const nama = m?.[1]?.trim() || p.event?.trim() || "—";
            const e = petaPenuh.get(nama) || { nama, jumlah: 0, terakhir: 0 };
            e.jumlah += 1;
            if ((p.timestamp || 0) > e.terakhir) e.terakhir = p.timestamp || 0;
            petaPenuh.set(nama, e);
          }
          const daftarPenuh = Array.from(petaPenuh.values()).sort(
            (a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama),
          );
          rekapEventCache.set(kunciCache, { revisi, daftar: daftarPenuh });
          if (hidup) setRekapEvent(daftarPenuh);
          if (hidup) setMemuatEvent(false);
          return;
        }

        const daftar = Array.from(peta.values()).sort(
          (a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama),
        );
        rekapEventCache.set(kunciCache, { revisi, daftar });
        if (hidup) setRekapEvent(daftar);
      } catch {
        if (hidup) setRekapEvent([]);
      } finally {
        if (hidup) setMemuatEvent(false);
      }
    })();
    return () => {
      hidup = false;
    };
  }, [tampilan, koleksiTerpilih]);

  // Bila belum ada koleksi yang dipilih, pilih koleksi pertama otomatis.
  useEffect(() => {
    if (!koleksiTerpilih && koleksiList.length > 0) {
      setKoleksiTerpilih(koleksiList[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /* ── Tarik data dengan filter periode ── */
  async function tanganiTarikData() {
    if (!koleksi) {
      tampilkanNotif("Pilih koleksi dulu.");
      return;
    }
    if (koleksi.platform !== "chessCom") {
      tampilkanNotif("Tarik data filter baru tersedia untuk Chess.com saja.");
      return;
    }
    if (sedangTarik) return;
    setSedangTarik(true);
    setProgresTarik({ current: 0, total: 0, bulan: null });
    try {
      const username = koleksi.username;
      const hasil = await muatPartaiChessCom(username, {
        periode: tarikPeriode,
        paksa: true,
        onProgress: (cur, tot, bulan) => {
          setProgresTarik({ current: cur, total: tot, bulan });
        },
      });
      // refresh cache ringkasan
      cacheRingkasan = null;
      await muatMetadata();
      await muatPartai();
      tampilkanNotif(`Berhasil tarik ${hasil.length} partai (${tarikPeriode}).`);
    } catch (e) {
      if (e?.cooldown) {
        tampilkanNotif("Terlalu sering, coba lagi 1 menit.");
      } else {
        tampilkanNotif(`Gagal tarik: ${e?.message || "unknown"}`);
      }
    } finally {
      setSedangTarik(false);
      setProgresTarik({ current: 0, total: 0, bulan: null });
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

  const toolbarTabel =
    mode === "tabel" ? (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-grow">
          {/* Pemilih Koleksi */}
          <DropdownPilih
            ariaLabel={t("analisa.basisData.koleksi")}
            nilai={koleksiTerpilih}
            onPilih={setKoleksiTerpilih}
            opsi={[
              {
                nilai: "",
                label: `${t("analisa.basisData.semuaKoleksi")} (${stats?.totalPartai || 0})`,
              },
              ...koleksiList.map((k) => ({
                nilai: k.id,
                label: `${k.label} (${k.jumlahPartai})`,
              })),
            ]}
          />

          {/* Filter Hasil */}
          <DropdownPilih
            ariaLabel={t("analisa.basisData.filterHasil")}
            nilai={filterHasil}
            onPilih={setFilterHasil}
            opsi={[
              { nilai: "", label: t("analisa.basisData.semuaHasil") },
              { nilai: "white", label: `${t("analisa.basisData.menang")} Putih` },
              { nilai: "black", label: `${t("analisa.basisData.menang")} Hitam` },
              { nilai: "draw", label: t("analisa.basisData.seri") },
            ]}
          />

          {/* Filter Waktu — sejajar kanan agar tidak meluber keluar panel */}
          <DropdownPilih
            ariaLabel={t("analisa.basisData.filterWaktu")}
            nilai={filterWaktu}
            onPilih={setFilterWaktu}
            sejajar="kanan"
            opsi={[
              { nilai: "", label: t("analisa.basisData.semuaWaktu") },
              { nilai: "blitz", label: "Blitz" },
              { nilai: "rapid", label: "Rapid" },
              { nilai: "bullet", label: "Bullet" },
              { nilai: "classical", label: "Klasik" },
            ]}
          />
        </div>
      </div>
    ) : null;

  return (
    <PanelLayar
      judul={
        mode === "tabel" ? (
          <span className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMode("data")}
              title={t("analisa.basisData.kembaliKeData")}
              aria-label={t("analisa.basisData.kembaliKeData")}
              className="flex h-8 shrink-0 cursor-pointer items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted px-1"
            >
              <Back className="h-6 w-10" />
            </button>
            <span className="min-w-0 truncate text-lg sm:text-2xl leading-6 sm:leading-8 font-extrabold text-foreground">
              {koleksi && koleksi.username
                ? `${koleksi.username} ${koleksi.platform === "chessCom" ? "Chess.com" : koleksi.platform === "lichessOrg" ? "Lichess.org" : koleksi.platform}`
                : koleksi?.label || t("analisa.basisData.judul")}
            </span>
          </span>
        ) : (
          t("analisa.basisData.judul")
        )
      }
      bawahJudul={
        mode === "data" && stats && stats.totalPartai > 0 ? (
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
      headerKanan={toolbarTabel}
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

        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 lg:flex-row">
          {/* ── Kolom Kiri: daftar profil / koleksi (sembunyi dalam mode tabel biar tabel full layar) ── */}
          <div
            className={`flex w-full shrink-0 flex-col gap-3 lg:w-[300px] lg:min-h-0 lg:max-h-none max-h-[45vh] sm:max-h-[38vh] lg:overflow-visible ${
              mode === "tabel" ? "hidden" : "flex"
            }`}
          >
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
                  onClick={() => onBukaAkun?.()}
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

            </div>

          {/* ── Kolom Kanan: Data / Tabel ─────────────────────────── */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
            {mode === "data" ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-borderRoundness border border-border bg-backgroundBox p-4">
                {koleksi ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode("tabel")}
                      className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-2.5 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover cursor-pointer"
                    >
                      <span>{t("analisa.basisData.explore")}</span>
                      <span aria-hidden="true">→</span>
                    </button>

                    <TabelRingkasan
                      koleksiId={koleksiTerpilih}
                      t={t}
                      locale={locale}
                    />

                    {/* ── Panel Tarik Data dengan Filter Periode - responsive */}
                    <div className="shrink-0 rounded-borderRoundness border border-border bg-backgroundBoxBox p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-foregroundGrey">Tarik Data</div>
                        <span className="text-[10px] text-foregroundGrey/70 leading-3">Filter: minggu / bulan / tahun agar tidak stag 1jt game</span>
                      </div>
                      <div className="mt-3 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                        <DropdownPilih
                          ariaLabel="Periode tarik"
                          nilai={tarikPeriode}
                          onPilih={setTarikPeriode}
                          opsi={[
                            { nilai: "mingguan", label: "Mingguan (7 hari)" },
                            { nilai: "bulanan", label: "Bulanan (31 hari)" },
                            { nilai: "tahunan", label: "Tahunan (366 hari)" },
                            { nilai: "semua", label: "Semua (hati-hati 1jt)" },
                          ]}
                        />
                        <button
                          type="button"
                          disabled={sedangTarik || !koleksi}
                          onClick={tanganiTarikData}
                          className="inline-flex items-center gap-1.5 rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3 py-1.5 text-xs font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {sedangTarik ? <DualRingSpinner color="#000" /> : <Download className="h-3.5 w-3.5 shrink-0" />}
                          <span>{sedangTarik ? "Menarik..." : "Tarik Data"}</span>
                        </button>
                        {sedangTarik && progresTarik.total > 0 ? (
                          <span className="text-[11px] text-foregroundGrey">
                            {progresTarik.current}/{progresTarik.total} {progresTarik.bulan ? `${progresTarik.bulan.tahun}-${progresTarik.bulan.bulan}` : ""}
                          </span>
                        ) : null}
                      </div>
                      {tarikPeriode === "semua" ? (
                        <p className="mt-2 text-[11px] leading-4 text-lossRed/80">⚠️ Semua = unduh seluruh arsip. Jika akun punya 1jt partai, browser bisa stag. Gunakan Mingguan/Bulanan dulu.</p>
                      ) : null}
                    </div>

                    <hr className="shrink-0 border-border" />

                    <div className="shrink-0">
                      <div className="text-xs font-bold uppercase tracking-wide text-foregroundGrey">{t("analisa.basisData.aksi")}</div>
                      <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5">
                        <button type="button" onClick={tanganiEksporPgn} className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer">
                          <Download className="h-3.5 w-3.5 shrink-0" />
                          <span>{t("analisa.basisData.eksporPgn")}</span>
                        </button>
                        <button type="button" onClick={() => setModalImpor(true)} className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer">
                          <IkonPlus className="h-3.5 w-3.5 shrink-0" />
                          <span>{t("analisa.basisData.imporPgn")}</span>
                        </button>
                        <button type="button" onClick={tanganiHapusKoleksi} className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-lossRed transition-colors hover:bg-backgroundBoxBoxHover cursor-pointer">
                          <Trash className="h-3.5 w-3.5 shrink-0" />
                          <span>{t("analisa.basisData.hapusKoleksi")}</span>
                        </button>
                        {!koleksiTerpilih && totalPartai > 0 ? (
                          <button type="button" onClick={tanganiKosongkanSemua} className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-lossRed transition-colors hover:bg-backgroundBoxBoxHover cursor-pointer">
                            <Trash className="h-3.5 w-3.5 shrink-0" />
                            <span>{t("analisa.basisData.hapusSemua")}</span>
                          </button>
                        ) : null}
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
      {/* Toolbar tabel: tab tampilan (Partai/Pemain/Event) + pencarian kecil - responsive */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 pb-2.5 shrink-0">
        <div
          role="tablist"
          aria-label={t("analisa.basisData.judul")}
          className="flex shrink-0 rounded-borderRoundness border border-border bg-backgroundBoxBox p-0.5 w-full sm:w-auto overflow-x-auto"
        >
          {[
            { k: "partai", label: t("analisa.basisData.dataGames") },
            { k: "pemain", label: t("analisa.basisData.dataPlayers") },
            { k: "event", label: t("analisa.basisData.dataEvents") },
          ].map((tab) => (
            <button
              key={tab.k}
              type="button"
              role="tab"
              aria-selected={tampilan === tab.k}
              onClick={() => setTampilan(tab.k)}
              className={`cursor-pointer rounded-borderRoundness px-3 py-1 text-xs font-bold transition-colors ${
                tampilan === tab.k
                  ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark"
                  : "text-foregroundGrey hover:text-foregroundHighlighted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pencarian berlaku untuk semua tab: tab Partai menyaring nama
            pemain/event/isi PGN via basis, tab Pemain & Event menyaring
            rekap yang sudah dimuat secara langsung. */}
        <div className="relative w-full sm:w-56">
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

      {tampilan === "partai" ? (
        <>
      {/* ── Tabel Permainan ─────────────────────────────────────── */}
      {/* Tanpa flex-1: kotak mengikuti jumlah baris — kalau barisnya sedikit,
          paginasi langsung nempel di bawah tabel (tidak ada ruang kosong
          jauh di tengah). Kalau barisnya banyak, kotak menyusut sampai
          tinggi layar lalu scroll, jadi ruangnya tetap terpakai penuh. */}
      <div className="relative w-full min-h-0 overflow-y-auto overflow-x-auto border border-border rounded-borderRoundness bg-backgroundBox [scrollbar-gutter:stable] -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full">
        <table className="w-full min-w-[600px] sm:min-w-[760px] table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: "16.6%" }} />
            <col style={{ width: "16.6%" }} />
            <col style={{ width: "16.6%" }} />
            <col style={{ width: "16.6%" }} />
            <col style={{ width: "16.6%" }} />
            <col style={{ width: "17%" }} />
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
                    tanganiAnalisa={tanganiAnalisa}
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
                  onClick={() => onBukaAkun()}
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
      {/* Nempel langsung di bawah kotak tabel (tanpa mt-auto) — jaraknya
          cukup dari gap-3 kolom induk, tidak ada lompatan ke dasar panel. */}
      <div className="shrink-0">
        {totalHal > 1 ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-foregroundGrey">
                {t("analisa.basisData.halaman", {
                  aktif: aktifHal,
                  total: totalHal,
                })}{" "}
                ({totalPartai} partai)
              </span>
            </div>
<div className="flex flex-wrap items-center gap-1 sm:gap-2">
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
      ) : tampilan === "pemain" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {memuatPemain ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <DualRingSpinner color={BIRU} />
              <p className="text-sm text-foregroundGrey">{t("analisa.basisData.memuatData")}</p>
            </div>
          ) : daftarPemainTampil.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-foregroundGrey">
              {cari ? t("analisa.partai.tidakCocok") : t("analisa.partai.tidakAda")}
            </div>
          ) : (
            <div className="relative w-full min-h-0 overflow-y-auto overflow-x-auto border border-border rounded-borderRoundness bg-backgroundBox [scrollbar-gutter:stable] -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full">
              <table className="w-full min-w-[480px] sm:min-w-[560px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead className="sticky top-0 bg-backgroundBox border-b border-border z-10 select-none">
                  <tr>
                    <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">ID</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.pemain")}
                    </th>
                    <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.seri")}
                    </th>
                    <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.menang")}
                    </th>
                    <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.kalah")}
                    </th>
                    <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.tanggal")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daftarPemainTampil.map((e, i) => (
                    <tr
                      key={e.nama}
                      className="border-b border-border/50 transition-colors hover:bg-backgroundBoxHover"
                    >
                      <td className="py-2 pl-4 pr-2 whitespace-nowrap text-xs tabular-nums text-foregroundGrey">
                        {i + 1}
                      </td>
                      <td className="py-2 px-2 truncate text-[13px] font-medium text-foreground">
                        {e.nama}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap text-xs tabular-nums text-foregroundGrey">
                        {e.seri}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap text-xs tabular-nums text-winGreen">
                        {e.menang}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap text-xs tabular-nums text-lossRed">
                        {e.kalah}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-xs text-foregroundGrey">
                        {formatTanggal(e.terakhir, locale) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {memuatEvent ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <DualRingSpinner color={BIRU} />
              <p className="text-sm text-foregroundGrey">{t("analisa.basisData.memuatData")}</p>
            </div>
          ) : daftarEventTampil.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-foregroundGrey">
              {cari ? t("analisa.partai.tidakCocok") : t("analisa.partai.tidakAda")}
            </div>
          ) : (
            <div className="relative w-full min-h-0 overflow-y-auto overflow-x-auto border border-border rounded-borderRoundness bg-backgroundBox [scrollbar-gutter:stable] -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full">
              <table className="w-full min-w-[400px] sm:min-w-[480px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "45%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "25%" }} />
                </colgroup>
                <thead className="sticky top-0 bg-backgroundBox border-b border-border z-10 select-none">
                  <tr>
                    <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">ID</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      Event
                    </th>
                    <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.dataGames")}
                    </th>
                    <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.terakhirMain")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daftarEventTampil.map((e, i) => (
                    <tr
                      key={e.nama}
                      className="border-b border-border/50 transition-colors hover:bg-backgroundBoxHover"
                    >
                      <td className="py-2 pl-4 pr-2 whitespace-nowrap text-xs tabular-nums text-foregroundGrey">
                        {i + 1}
                      </td>
                      <td className="py-2 px-2 truncate text-[13px] font-medium text-foreground">
                        {e.nama}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap text-xs tabular-nums text-foreground">
                        {e.jumlah}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-xs text-foregroundGrey">
                        {formatTanggal(e.terakhir, locale) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
              </>
            )}
          </div>
        </div>
      </div>
    </PanelLayar>
  );
}