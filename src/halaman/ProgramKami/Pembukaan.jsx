import { useMemo, useState } from "react";
// PENTING: impor dari "react-router-dom", BUKAN "react-router". Spesifier
// "react-router" tidak terdaftar di optimizeDeps.include (vite.config.js),
// sehingga saat halaman lazy ini pertama dimuat Vite meng-optimasi ulang
// dependensi di tengah sesi → dua instance React → "Cannot read properties
// of null (reading 'useContext')" (uji e2e pembukaan jadi flaky).
import { Link } from "react-router-dom";
import { Chess } from "chess.js";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { Tombol } from "../../components/Tombol.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";

/**
 * Landing pembukaan — dibangun dari isi data, bukan dari kerangka halaman lain.
 *
 * Seluruh angka di halaman ini dihitung dari `public/data/buku-pembukaan.json`
 * (18.713 jalur, hasil olahan lichess-org/chess-openings, CC0). Skrip analisa
 * yang menghasilkan angka-angka tersebut dijalankan ulang setiap kali berkas
 * data berubah — tidak ada angka yang diketik dari ingatan.
 */

/** Warna petak — sama dengan tema klasik papan interaktif dan Teka-teki. */
const PETAK_TERANG = "#f0d9b5";
const PETAK_GELAP = "#b58863";
/** Tinta petak asal–tujuan — warna sorotan langkah terakhir papan interaktif. */
const TINTA_LANGKAH = "rgba(205, 210, 106, 0.5)";
const HERO_IMAGE = "/images/ProgramKami/pembukaan-hero.webp";

/** Total baris berkas buku pembukaan. */
const TOTAL_JALUR = 18713;

/**
 * Empat langkah pertama terbanyak. `fen` dihasilkan chess.js dari posisi awal
 * (skrip analisa, bukan diketik tangan); `jumlah` = baris buku yang dibuka
 * dengan langkah itu; `balasan` = jawaban Hitam terbanyak jalurnya, dengan
 * keluarga terbesar di buku untuk balasan tersebut.
 */
const PINTU_MASUK = [
  {
    san: "1. e4",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    asal: "e2",
    tujuan: "e4",
    jumlah: 13342,
    deskripsi: "e4Deskripsi",
    balasan: [
      { san: "1… e5", jumlah: 5828, keluarga: "kelItalia" },
      { san: "1… c5", jumlah: 2230, keluarga: "kelSisilia" },
      { san: "1… d5", jumlah: 1512, keluarga: "kelSkandinavia" },
      { san: "1… e6", jumlah: 1359, keluarga: "kelPrancis" },
    ],
  },
  {
    san: "1. d4",
    fen: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1",
    asal: "d2",
    tujuan: "d4",
    jumlah: 4383,
    deskripsi: "d4Deskripsi",
    balasan: [
      { san: "1… d5", jumlah: 1932, keluarga: "kelGambitMenteri" },
      { san: "1… Nf6", jumlah: 1433, keluarga: "kelIndiaRaja" },
      { san: "1… e5", jumlah: 239, keluarga: "kelEnglund" },
    ],
  },
  {
    san: "1. c4",
    fen: "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1",
    asal: "c2",
    tujuan: "c4",
    jumlah: 402,
    deskripsi: "c4Deskripsi",
    balasan: [
      { san: "1… e5", jumlah: 110, keluarga: "kelInggris" },
      { san: "1… Nf6", jumlah: 85, keluarga: "kelInggris" },
      { san: "1… e6", jumlah: 62, keluarga: "kelInggris" },
    ],
  },
  {
    san: "1. Nf3",
    fen: "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1",
    asal: "g1",
    tujuan: "f3",
    jumlah: 246,
    deskripsi: "nf3Deskripsi",
    balasan: [
      { san: "1… d5", jumlah: 104, keluarga: "kelSeranganIndiaRaja" },
      { san: "1… Nf6", jumlah: 67, keluarga: "kelSeranganIndiaRaja" },
      { san: "1… c5", jumlah: 15, keluarga: "kelZukertort" },
    ],
  },
];

/** Baris statistik masthead: [kunci label, nilai, kelas pemisah hairline]. */
const STATISTIK = [
  ["statJalur", 18713, "py-5"],
  ["statNama", 3196, "py-5 border-l border-grey-200 pl-4 md:pl-6"],
  [
    "statKeluarga",
    155,
    "py-5 border-t border-grey-200 md:border-l md:border-t-0 md:pl-6",
  ],
  [
    "statEco",
    349,
    "py-5 border-l border-t border-grey-200 pl-4 md:border-t-0 md:pl-6",
  ],
];

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

/** Papan mini statis untuk satu posisi FEN, dengan tinta petak asal–tujuan. */
function PapanMini({ san, fen, asal, tujuan, label }) {
  const petak = useMemo(() => new Chess(fen).board(), [fen]);
  return (
    <div
      role="img"
      aria-label={label}
      data-papan-mini={san}
      className="w-[104px] shrink-0 overflow-hidden rounded ring-1 ring-black/10 sm:w-[140px]"
    >
      <div className="grid grid-cols-8">
        {petak.map((baris, y) =>
          baris.map((sel, x) => {
            const alamat = "abcdefgh"[x] + (8 - y);
            const terang = (x + y) % 2 === 0;
            const ditandai = alamat === asal || alamat === tujuan;
            const bidak = sel
              ? sel.color === "w"
                ? sel.type.toUpperCase()
                : sel.type
              : null;
            return (
              <div
                key={alamat}
                data-petak={alamat}
                className="relative aspect-square"
                style={{
                  backgroundColor: terang ? PETAK_TERANG : PETAK_GELAP,
                }}
              >
                {ditandai && (
                  <span
                    className="absolute inset-0"
                    style={{ backgroundColor: TINTA_LANGKAH }}
                    aria-hidden="true"
                  />
                )}
                {bidak && (
                  <span className="relative z-10 flex h-[88%] w-[88%] items-center justify-center">
                    <ChessPiece piece={bidak} set="merida" className="h-full w-full" />
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

/** Tabel katalog yang bisa dicari menurut nama atau kode ECO. */
function KatalogBuku({ t, angka }) {
  const [kueri, setKueri] = useState("");
  const hasil = useMemo(() => {
    const q = kueri.trim().toLowerCase();
    if (!q) return KATALOG;
    return KATALOG.filter(
      ([eco, nama]) =>
        eco.toLowerCase().includes(q) || nama.toLowerCase().includes(q),
    );
  }, [kueri]);

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
          n: angka.format(hasil.length),
          total: angka.format(KATALOG.length),
        })}
      </p>
      <div className="mt-3 max-h-[30rem] overflow-y-auto rounded border border-grey-200">
        <table className="w-full border-collapse font-sans text-sm">
          <thead className="sticky top-0 bg-paper">
            <tr className="border-b border-grey-200 text-xs text-grey-600">
              <th scope="col" className="px-3 py-2.5 text-left font-semibold">
                {t("bukuPembukaan.kolomEco")}
              </th>
              <th scope="col" className="px-3 py-2.5 text-left font-semibold">
                {t("bukuPembukaan.kolomNama")}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                {t("bukuPembukaan.kolomPartai")}
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">
                {t("bukuPembukaan.kolomPSH")}
              </th>
            </tr>
          </thead>
          <tbody>
            {hasil.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-sm text-grey-600">
                  {t("bukuPembukaan.katalogKosong", { q: kueri.trim() })}
                </td>
              </tr>
            ) : (
              hasil.map(([eco, nama, partai, p, s, h]) => (
                <tr
                  key={`${eco}-${nama}`}
                  data-katalog={`${eco} ${nama}`}
                  className="border-b border-grey-100 last:border-b-0"
                >
                  <td className="px-3 py-2.5 font-mono text-[13px] font-semibold text-grey-800">
                    {eco}
                  </td>
                  <td className="px-3 py-2.5 text-grey-800">{nama}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[13px] tabular-nums text-grey-800">
                    {angka.format(partai)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-[13px] tabular-nums text-grey-600">
                    {p} · {s} · {h}
                  </td>
                </tr>
              ))
            )}
          </tbody>
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
  const persen = (bagian) =>
    new Intl.NumberFormat(bahasa === "en" ? "en-US" : "id-ID", {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(bagian / TOTAL_JALUR);

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
      {/* ═══ Pembuka — editorial: judul, dua paragraf, baris angka ═══ */}
      <section className="w-full border-t border-grey-200 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <h2 className="m-0 font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
            {t("bukuPembukaan.introJudul")}
          </h2>
          <div className="mt-6 flex flex-col gap-y-5">
            <p className="m-0 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
              {t("bukuPembukaan.introP1")}
            </p>
            <p className="m-0 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
              {t("bukuPembukaan.introP2")}
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 border-y border-grey-200 md:grid-cols-4">
            {STATISTIK.map(([kunci, nilai, kelas]) => (
              <div key={kunci} className={kelas}>
                <dd className="m-0 font-mono text-2xl font-semibold tabular-nums text-grey-800">
                  {angka.format(nilai)}
                </dd>
                <dt className="mt-1 font-sans text-[13px] text-grey-600">
                  {t(`bukuPembukaan.${kunci}`)}
                </dt>
              </div>
            ))}
          </dl>
          <p className="m-0 mt-3 font-sans text-xs text-grey-600">
            {t("bukuPembukaan.sumberBaris")}
          </p>
        </div>
      </section>

      {/* ═══ Pohon langkah pertama — papan mini + balasan teratas ═══ */}
      <section className="w-full border-t border-grey-200 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <h2 className="m-0 font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
            {t("bukuPembukaan.pohonJudul")}
          </h2>
          <p className="m-0 mt-4 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
            {t("bukuPembukaan.pohonPengantar")}
          </p>

          <div className="mt-6 border-t border-grey-200">
            {PINTU_MASUK.map((pintu) => (
              <article
                key={pintu.san}
                data-langkah={pintu.san}
                className="grid grid-cols-[104px_1fr] items-start gap-5 border-b border-grey-200 py-8 sm:grid-cols-[140px_1fr] sm:gap-8"
              >
                <PapanMini
                  san={pintu.san}
                  fen={pintu.fen}
                  asal={pintu.asal}
                  tujuan={pintu.tujuan}
                  label={t("bukuPembukaan.ariaPapanMini", { langkah: pintu.san })}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="m-0 font-mono text-xl font-bold tracking-tight text-grey-800 sm:text-2xl">
                      {pintu.san}
                    </h3>
                    <p className="m-0 font-sans text-sm text-grey-600">
                      <span className="font-semibold tabular-nums text-grey-800">
                        {angka.format(pintu.jumlah)}
                      </span>{" "}
                      {t("bukuPembukaan.kataJalur")} ·{" "}
                      <span className="tabular-nums">{persen(pintu.jumlah)}</span>
                    </p>
                  </div>
                  <p className="m-0 mt-3 font-serif text-sm leading-[1.6] text-pretty text-grey-600">
                    {t(`bukuPembukaan.${pintu.deskripsi}`)}
                  </p>
                  <ul className="mt-5 flex list-none flex-wrap gap-2 p-0">
                    {pintu.balasan.map((b) => (
                      <li
                        key={b.san}
                        className="rounded border border-grey-200 px-3 py-2"
                      >
                        <span className="flex items-baseline gap-2">
                          <span className="font-mono text-[13px] font-semibold text-grey-800">
                            {b.san}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-grey-600">
                            {angka.format(b.jumlah)}
                          </span>
                        </span>
                        <span className="mt-0.5 block font-sans text-xs leading-snug text-grey-600">
                          {t(`bukuPembukaan.${b.keluarga}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <p className="m-0 mt-6 font-sans text-sm text-grey-600">
            {t("bukuPembukaan.lainnyaCatatan")}
          </p>
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

      {/* ═══ Di papan interaktif — daftar ringkas fitur buku ═══ */}
      <section className="w-full border-t border-grey-200 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <h2 className="m-0 font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
            {t("bukuPembukaan.alatJudul")}
          </h2>
          <ul className="mt-8 grid list-none gap-x-12 border-t border-grey-200 p-0 sm:grid-cols-2">
            {["alat1", "alat2", "alat3", "alat4", "alat5"].map((kunci) => (
              <li
                key={kunci}
                className="border-b border-grey-200 py-4 font-serif text-sm leading-[1.6] text-pretty text-grey-800"
              >
                {t(`bukuPembukaan.${kunci}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ Penutup ═══ */}
      <section className="w-full border-t border-grey-200 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <div className="rounded-lg border border-grey-200 p-8 md:p-10">
            <h2 className="m-0 font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
              {t("bukuPembukaan.penutupJudul")}
            </h2>
            <p className="m-0 mt-4 max-w-[62ch] font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
              {t("bukuPembukaan.penutupIsi")}
            </p>
            <div className="mt-8">
              <Tombol to="/papan-interaktif" variant="garis">
                {t("bukuPembukaan.ctaUtama")}
              </Tombol>
            </div>
          </div>
        </div>
      </section>
    </HalamanIsi>
  );
}
