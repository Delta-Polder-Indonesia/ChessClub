import { useMemo, useState } from "react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  flexRender,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
// PENTING: impor dari "react-router-dom", BUKAN "react-router". Spesifier
// "react-router" tidak terdaftar di optimizeDeps.include (vite.config.js),
// sehingga saat halaman lazy ini pertama dimuat Vite meng-optimasi ulang
// dependensi di tengah sesi → dua instance React → "Cannot read properties
// of null (reading 'useContext')" (uji e2e pembukaan jadi flaky).
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { TombolConten } from "../../components/TombolConten.jsx";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.jsx";

/**
 * Landing pembukaan — dibangun dari isi data, bukan dari kerangka halaman lain.
 *
 * Seluruh angka di halaman ini dihitung dari `public/data/buku-pembukaan.json`
 * (18.713 jalur, hasil olahan lichess-org/chess-openings, CC0). Skrip analisa
 * yang menghasilkan angka-angka tersebut dijalankan ulang setiap kali berkas
 * data berubah — tidak ada angka yang diketik dari ingatan.
 */

const HERO_IMAGE = "/images/ProgramKami/pembukaan-hero.webp";

/**
 * 72 keluarga pembukaan dengan partai terbanyak di buku — satu baris teratas
 * per keluarga (teks sebelum ":"). Tiap baris: [ECO, nama, partai, % putih,
 * % seri, % hitam]. Diurut menurun berdasarkan partai.
 */
const KATALOG = [
  ["C44", "Scotch Game: Lolli Variation", 22326, 53, 5, 42],
  ["B32", "Sicilian Defense: Löwenthal Variation", 17417, 48, 4, 48],
  ["B15", "Caro-Kann Defense: Tartakower Variation", 12566, 49, 6, 45],
  ["C58", "Italian Game: Two Knights Defense, Polerio Defense, Bishop Check Line", 11546, 47, 3, 50],
  ["C42", "Petrov's Defense: Stafford Gambit", 9844, 46, 3, 51],
  ["C02", "French Defense: Advance Variation, Paulsen Attack", 7366, 43, 5, 53],
  ["C47", "Four Knights Game: Scotch Variation Accepted", 7209, 55, 4, 41],
  ["C62", "Ruy Lopez: Steinitz Defense", 7135, 52, 5, 43],
  ["C41", "Philidor Defense: Exchange Variation", 6963, 51, 5, 45],
  ["C44", "Ponziani Opening", 6707, 55, 3, 42],
  ["A40", "Englund Gambit: Main Line", 6673, 45, 3, 53],
  ["B01", "Scandinavian Defense: Modern Variation", 6143, 43, 4, 52],
  ["C21", "Danish Gambit Accepted: Copenhagen Defense", 4026, 57, 3, 41],
  ["B03", "Alekhine Defense: Exchange Variation", 3630, 47, 5, 48],
  ["C20", "King's Pawn Game: Wayward Queen Attack", 3453, 48, 4, 48],
  ["B30", "Old Sicilian", 3118, 49, 4, 47],
  ["B00", "Pirc Defense", 2957, 32, 5, 63],
  ["D35", "Queen's Gambit Declined: Exchange Variation, Positional Variation", 2847, 53, 6, 41],
  ["A52", "Budapest Defense: Adler Variation", 2646, 48, 5, 48],
  ["C46", "Three Knights Opening", 2630, 63, 4, 33],
  ["C22", "Center Game: Normal Variation", 2511, 43, 4, 53],
  ["E76", "King's Indian Defense: Four Pawns Attack", 2153, 50, 4, 46],
  ["D20", "Queen's Gambit Accepted: Old Variation", 2149, 75, 3, 22],
  ["D85", "Grünfeld Defense: Exchange Variation", 2128, 47, 7, 47],
  ["D00", "Blackmar-Diemer Gambit Accepted: Teichmann Defense", 1989, 55, 4, 42],
  ["B00", "Owen Defense", 1849, 48, 4, 49],
  ["A06", "Zukertort Opening: Tennison Gambit", 1747, 45, 3, 52],
  ["A49", "Indian Defense: Przepiorka Variation", 1726, 48, 6, 47],
  ["D43", "Semi-Slav Defense", 1709, 52, 5, 43],
  ["D00", "London System: Accelerated Variation", 1565, 54, 5, 42],
  ["C25", "Vienna Game: Stanley Variation, Meitner-Mieses Gambit", 1553, 66, 2, 32],
  ["A43", "Benoni Defense: Old Benoni", 1481, 46, 4, 50],
  ["A05", "King's Indian Attack: Symmetrical Defense", 1387, 49, 6, 45],
  ["A40", "Horwitz Defense", 1278, 50, 3, 47],
  ["A22", "English Opening: King's English Variation, Two Knights Variation, Reversed Dragon", 1141, 53, 4, 43],
  ["C35", "King's Gambit Accepted: Cunningham Defense, Bertin Gambit", 1133, 55, 3, 43],
  ["D15", "Slav Defense: Three Knights Variation", 1112, 46, 5, 49],
  ["B00", "Nimzowitsch Defense: Declined Variation", 1099, 41, 4, 56],
  ["C40", "Elephant Gambit: Paulsen Countergambit", 1081, 39, 3, 57],
  ["B06", "Modern Defense", 1021, 49, 5, 47],
  ["D01", "Rapport-Jobava System", 962, 56, 3, 41],
  ["C30", "King's Gambit Declined: Queen's Knight Defense", 891, 50, 4, 46],
  ["C24", "Bishop's Opening: Vienna Hybrid", 889, 50, 4, 46],
  ["E06", "Catalan Opening: Closed", 872, 53, 6, 41],
  ["E27", "Nimzo-Indian Defense: Sämisch Variation", 830, 50, 4, 47],
  ["A58", "Benko Gambit Accepted: Fully Accepted Variation", 766, 43, 6, 51],
  ["B23", "Closed Sicilian", 736, 48, 4, 48],
  ["A40", "Queen's Pawn Game: Modern Defense", 716, 45, 4, 51],
  ["A01", "Nimzo-Larsen Attack: Modern Variation", 708, 59, 3, 38],
  ["C30", "King's Gambit", 648, 50, 4, 47],
  ["B07", "Czech Defense", 629, 53, 4, 44],
  ["A00", "Polish Opening", 589, 63, 4, 33],
  ["A02", "Bird Opening: From's Gambit, Lasker Variation", 573, 49, 5, 46],
  ["B00", "Duras Gambit", 515, 55, 3, 42],
  ["C40", "Latvian Gambit Accepted: Bilguer Variation", 506, 51, 4, 45],
  ["C21", "Danish Gambit Declined: Sorensen Defense", 466, 50, 4, 47],
  ["A80", "Dutch Defense: Raphael Variation", 432, 50, 5, 45],
  ["A54", "Old Indian Defense: Ukrainian Variation", 421, 39, 8, 53],
  ["D05", "Colle System: Traditional Colle", 419, 53, 6, 41],
  ["B06", "Pterodactyl Defense: Eastern, Anhanguera", 411, 43, 4, 53],
  ["A40", "English Defense", 389, 52, 3, 45],
  ["A48", "East Indian Defense", 380, 47, 5, 48],
  ["A57", "Benko Gambit: Zaitsev System", 375, 43, 4, 53],
  ["A45", "Trompowsky Attack: Classical Defense, Big Center Variation", 365, 48, 4, 48],
  ["A41", "Rat Defense: English Rat", 361, 42, 8, 50],
  ["A50", "Mexican Defense", 359, 38, 5, 57],
  ["D00", "Blackmar-Diemer Gambit: Netherlands Variation", 356, 53, 3, 44],
  ["B00", "Borg Defense", 354, 46, 3, 51],
  ["E11", "Bogo-Indian Defense: Exchange Variation", 344, 46, 5, 49],
  ["C40", "Latvian Gambit", 330, 56, 2, 41],
  ["A00", "Van Geet Opening: Napoleon Attack", 325, 53, 4, 43],
  ["D00", "Blackmar-Diemer Gambit Declined: O'Kelly Defense", 311, 54, 3, 43]
];

/** Pembuat kolom TanStack Table untuk `KATALOG`. */
const bantu = createColumnHelper();
/**
 * Fitur tabel katalog: filter global (pencarian) + pengurutan kolom.
 * Tanpa pagination/row-selection/kolom visibility — katalog selalu memuat
 * seluruh 72 baris sehingga kontrak aksesibilitas "N dari M" tetap utuh.
 */
const fitur = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

/**
 * Lima posisi berbeda yang dipakai 36 papan mini di blok papan, diambil apa
 * adanya dari susunan petak pada rancangan asli (urutan baris = tampilan layar,
 * baris paling atas dahulu — sudah termasuk orientasi papan).
 */
const POSISI_MINI = [
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR",
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR",
  "rnbqkbnr/ppp2ppp/8/3pp3/4P3/5N2/PPPP1PPP/RNBQKB1R",
  "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R",
  "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R",
];
/** Papan utama 408px, orientasi hitam. */
const POSISI_UTAMA =
  "R2KQBNR/PPP2PPP/2N1P3/3P1B2/3p4/2n2n2/ppp1pppp/r1bkqb1r";
/** 16 sel grid 4×4: variasi visual yang lebih ringan untuk halaman landing. */
const URUT_MINI = Array.from({ length: 16 }, (_, i) => i % 5);

const NAMA_JENIS = {
  K: "king",
  Q: "queen",
  R: "rook",
  B: "bishop",
  N: "knight",
  P: "pawn",
};

/** Pecah string petak 8×8 menjadi daftar { x, y, huruf } (kiri→kanan, atas→bawah). */
function daftarBidak(papan) {
  const hasil = [];
  papan.split("/").forEach((baris, y) => {
    let x = 0;
    for (const c of baris) {
      if (c >= "1" && c <= "8") {
        x += Number(c);
        continue;
      }
      hasil.push({ x, y, huruf: c });
      x += 1;
    }
  });
  return hasil;
}

/** Satu papan `cg-*`: DOM identik dengan rancangan, ukuran mengikuti induk. */
function PapanCg({ papan }) {
  return (
    <div
      className="cg-wrap"
      style={{ height: "100%", width: "100%", display: "table" }}
    >
      <cg-container style={{ width: "100%", height: "100%" }}>
        <cg-board>
          {daftarBidak(papan).map(({ x, y, huruf }) => (
            <piece
              key={`${x}-${y}`}
              className={`${huruf === huruf.toUpperCase() ? "white" : "black"} ${NAMA_JENIS[huruf.toUpperCase()]}`}
              style={{ left: `${x * 12.5}%`, top: `${y * 12.5}%` }}
            />
          ))}
        </cg-board>
      </cg-container>
    </div>
  );
}

/** Blok papan: kisi 4×4 berisi 16 papan mini + papan utama di kanan bawah. */
function PapanMaia() {
  return (
    <div className="relative flex aspect-square w-[440px] max-w-full items-center justify-center">
      <div className="absolute left-0 top-0 grid h-3/4 w-3/4 grid-cols-4 grid-rows-4 gap-0.5 bg-transparent">
        {URUT_MINI.map((idx, i) => (
          <div key={i} className="relative">
            <div className="h-full w-full">
              <div style={{ height: "100%", width: "100%" }}>
                <PapanCg papan={POSISI_MINI[idx]} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 right-0 z-10 h-3/4 w-3/4 overflow-hidden border border-grey-300 bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-md">
        <div className="h-full w-full">
          <div style={{ height: "100%", width: "100%" }}>
            <PapanCg papan={POSISI_UTAMA} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Kepala kolom katalog: label yang bisa diklik untuk mengurutkan kolom itu.
 * Satu pola untuk semua kolom, mengikuti `TombolUrutkan` di TabelData.jsx.
 */
function KepalaUrut({ kolom, anak }) {
  const arah = kolom.getIsSorted();
  return (
    <button
      type="button"
      onClick={() => kolom.toggleSorting(arah === "asc")}
      className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-grey-800"
    >
      {anak}
      {arah === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : arah === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" />
      )}
    </button>
  );
}

/** Kolom berisi angka: judul dan isinya rata kanan. */
const KOLOM_KANAN = new Set(["partai", "psh"]);
/** Gaya sel per kolom, sama persis dengan gaya tabel katalog sebelumnya. */
const GAYA_SEL = {
  eco: "px-3 py-2.5 font-mono text-[13px] font-semibold text-grey-800",
  nama: "px-3 py-2.5 whitespace-normal text-grey-800",
  partai:
    "px-3 py-2.5 text-right font-mono text-[13px] tabular-nums text-grey-800",
  psh: "px-3 py-2.5 text-right font-mono text-[13px] tabular-nums text-grey-600",
};

/** Tabel katalog yang bisa dicari menurut nama atau kode ECO. */
function KatalogBuku({ t, angka }) {
  const [kueri, setKueri] = useState("");
  const [pengurutan, setPengurutan] = useState([]);

  const kolom = useMemo(
    () =>
      bantu.columns([
        bantu.accessor((baris) => baris[0], {
          id: "eco",
          header: ({ column }) => (
            <KepalaUrut kolom={column} anak={t("bukuPembukaan.kolomEco")} />
          ),
          cell: ({ getValue }) => getValue(),
          sortingFn: "alphanumeric",
        }),
        bantu.accessor((baris) => baris[1], {
          id: "nama",
          header: ({ column }) => (
            <KepalaUrut kolom={column} anak={t("bukuPembukaan.kolomNama")} />
          ),
          cell: ({ getValue }) => getValue(),
          sortingFn: "alphanumeric",
        }),
        bantu.accessor((baris) => baris[2], {
          id: "partai",
          header: ({ column }) => (
            <KepalaUrut kolom={column} anak={t("bukuPembukaan.kolomPartai")} />
          ),
          cell: ({ getValue }) => angka.format(getValue()),
          sortingFn: "alphanumeric",
        }),
        bantu.accessor(
          (baris) => `${baris[3]} · ${baris[4]} · ${baris[5]}`,
          {
            id: "psh",
            header: ({ column }) => (
              <KepalaUrut kolom={column} anak={t("bukuPembukaan.kolomPSH")} />
            ),
            cell: ({ getValue }) => getValue(),
            sortingFn: "alphanumeric",
          },
        ),
      ]),
    [t, angka],
  );

  const tabel = useTable({
    features: fitur,
    data: KATALOG,
    columns: kolom,
    state: { sorting: pengurutan, globalFilter: kueri },
    onSortingChange: setPengurutan,
    onGlobalFilterChange: setKueri,
    globalFilterFn: "includesString",
  });

  const baris = tabel.getRowModel().rows;
  const kepala = tabel.getHeaderGroups()[0].headers;

  return (
    <div>
      <input
        type="search"
        value={kueri}
        onChange={(kejadian) => setKueri(kejadian.target.value)}
        placeholder={t("bukuPembukaan.katalogPlaceholder")}
        aria-label={t("bukuPembukaan.katalogPlaceholder")}
        className="w-full rounded border border-grey-300 bg-white px-4 py-2.5 font-sans text-sm text-grey-800 outline-none placeholder:text-grey-500 focus:border-slate-900"
      />
      <p aria-live="polite" className="m-0 mt-2 font-sans text-xs text-grey-600">
        {t("bukuPembukaan.katalogJumlah", {
          n: angka.format(baris.length),
          total: angka.format(KATALOG.length),
        })}
      </p>
      <div className="mt-3 max-h-[30rem] overflow-y-auto rounded border border-grey-200">
        {/* `<table>` ditulis langsung, bukan lewat komponen `Table` dari
            ui/table: pembungkus `overflow-x-auto` bawaannya membuat satu lapis
            scroll tambahan, sehingga header sticky di bawah ini tidak lagi
            menempel saat daftar digulir. */}
        <table className="w-full border-collapse font-sans text-sm">
          <TableHeader className="sticky top-0 bg-paper">
            <TableRow className="border-b border-grey-200 text-xs text-grey-600 hover:bg-transparent">
              {kepala.map((header) => (
                <TableHead
                  key={header.id}
                  className={
                    KOLOM_KANAN.has(header.column.id)
                      ? "px-3 py-2.5 text-right font-semibold text-grey-600"
                      : "px-3 py-2.5 font-semibold text-grey-600"
                  }
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {baris.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={kolom.length}
                  className="px-3 py-10 text-center text-sm text-grey-600"
                >
                  {t("bukuPembukaan.katalogKosong", { q: kueri.trim() })}
                </TableCell>
              </TableRow>
            ) : (
              baris.map((barisKatalog) => (
                <TableRow
                  key={barisKatalog.id}
                  data-katalog={`${barisKatalog.original[0]} ${barisKatalog.original[1]}`}
                  className="border-b border-grey-100 last:border-b-0 hover:bg-transparent"
                >
                  {barisKatalog.getAllCells().map((sel) => (
                    <TableCell key={sel.id} className={GAYA_SEL[sel.column.id]}>
                      {flexRender(sel.column.columnDef.cell, sel.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>
      <p className="m-0 mt-3 font-sans text-xs text-grey-600">
        {t("bukuPembukaan.katalogCatatan")}
      </p>
    </div>
  );
}

export default function Pembukaan() {
  const { t, bahasa } = useI18n();

  const angka = useMemo(
    () => new Intl.NumberFormat(bahasa === "en" ? "en-US" : "id-ID"),
    [bahasa],
  );

  return (
    <HalamanIsi
      title={t("bukuPembukaan.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("bukuPembukaan.deskripsi")}
      metaDescription={t("bukuPembukaan.metaDeskripsi")}
      image={gambar(HERO_IMAGE)}
      imageWidth={1672}
      imageHeight={941}
      heroImage={HERO_IMAGE}
      next={{ to: "/program-kami/ebook-panduan", judul: t("nav.eBookPanduan") }}
    >
      {/* ═══ Pembuka — editorial: judul, dua paragraf, papan ═══ */}
      <section className="w-full border-t border-grey-200 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <h2 className="m-0 font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
            {t("bukuPembukaan.introJudul")}
          </h2>
          <div className="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="flex flex-col gap-y-5">
              <p className="m-0 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
                {t("bukuPembukaan.introP1")}
              </p>
              <p className="m-0 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
                {t("bukuPembukaan.introP2")}
              </p>
              <div className="mt-1">
                <TombolConten to="/papan-interaktif">
                  {t("bukuPembukaan.ctaUtama")}
                </TombolConten>
              </div>
            </div>
            <PapanMaia />
          </div>

        </div>
      </section>

      {/* ═══ Katalog — naskah di kiri, tabel yang bisa dicari di kanan ═══ */}
      <section className="w-full border-t border-grey-200 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <div className="grid gap-x-16 gap-y-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="m-0 font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
                {t("bukuPembukaan.katalogJudul")}
              </h2>
              <p className="m-0 mt-4 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
                {t("bukuPembukaan.katalogPengantar")}
              </p>
              <Link
                to="/papan-interaktif"
                className="mt-6 inline-flex font-sans text-sm font-semibold text-slate-900 underline decoration-grey-300 underline-offset-4 hover:decoration-slate-900"
              >
                {t("bukuPembukaan.katalogCta")}
              </Link>
            </div>
            <div className="lg:col-span-8">
              <KatalogBuku t={t} angka={angka} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Penutup — satu langkah berikutnya yang jelas ═══ */}
      <section className="w-full border-t border-grey-200 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-14 md:px-8 md:py-16">
          <div className="max-w-3xl">
            <h2 className="m-0 font-serif font-light text-[clamp(2rem,3.2vw,3rem)] leading-[1.08] text-grey-800">
              {t("bukuPembukaan.penutupJudul")}
            </h2>
            <p className="m-0 mt-4 max-w-2xl font-serif text-base leading-[1.8] text-pretty text-grey-600">
              {t("bukuPembukaan.penutupIsi")}
            </p>
          </div>
        </div>
      </section>
    </HalamanIsi>
  );
}
