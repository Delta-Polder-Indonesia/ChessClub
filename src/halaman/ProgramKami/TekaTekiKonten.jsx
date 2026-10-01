import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Chess } from "chess.js";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { parseLangkah, terapkan } from "../../lib/tekaTeki.js";

/**
 * Halaman "Teka-teki & Tips" (/program-kami/teka-teki).
 *
 * Pintu masuk ke alat latihan taktik di /teka-teki. Seluruh kontennya
 * faktual: angka koleksi dihitung dari public/data/teka-teki.json, dan contoh
 * soal (#4457) disalin apa adanya dari berkas itu — solusinya 25. Rxe8+ Kxe8
 * 26. Qa8# (diverifikasi dengan chess.js; Kxe8 satu-satunya balasan legal).
 *
 * Mengikuti DESIGN.md: serif untuk bacaan, sans untuk
 * kontrol dan tabel data, mono untuk notasi serta angka; garis 1px datar
 * tanpa gradien/glow; tata letak asimetris, bukan grid kartu kembar.
 */

const RUTE_ALAT = "/teka-teki";
const RUTE_RUSH = "/program-kami/rush-teka-teki";
const FILE = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANK = ["8", "7", "6", "5", "4", "3", "2", "1"];

/* Warna petak = tema papan bawaan alat latihan ("hijau", lihat PapanTekaTeki). */
const PETAK_TERANG = "#ebecd0";
const PETAK_GELAP = "#779556";
/* Tanda langkah terakhir — tint kuning datar ala lichess; bukan pendar. */
const TINTA_LANGKAH = "rgba(255, 213, 79, 0.55)";

/** Contoh soal #4457 — salinan dari public/data/teka-teki.json. */
const CONTOH = {
  id: 4457,
  fen: "1R2nk1r/3pppb1/6p1/2P5/3P3p/2N1PQP1/3q1P1P/6K1 w - - 2 25",
  langkah: ["b8-e8", "f8-e8", "f3-a8"], // 25. Rxe8+ Kxe8 26. Qa8#
  pemain: "BeWater (2634) – Achanich (2449)",
  sumberTeks: "lichess.org/wjMcCNHZ",
  sumberUrl: "https://lichess.org/wjMcCNHZ/black#48",
};

/** Komposisi koleksi — dihitung dari public/data/teka-teki.json (total 5.486). */
const STATISTIK = [
  { label: "statBaris1", nilai: "statNilai1", jumlah: 1377 },
  { label: "statBaris2", nilai: "statNilai2", jumlah: 2991 },
  { label: "statBaris3", nilai: "statNilai3", jumlah: 1118 },
];
const TOTAL_SOAL = 5486;

/** Baris ringkasan koleksi: [kunciLabel, kunciNilai]. */
const RINGKASAN = [
  ["statTotalLabel", "statTotalNilai"],
  ["statPitaLabel", "statPitaNilai"],
  ["statGiliranLabel", "statGiliranNilai"],
  ["statSumberLabel", "statSumberNilai"],
];

const LANGKAH_CARA = ["cara1", "cara2", "cara3", "cara4"];

const TIPS = [
  { judul: "tips1Judul", isi: "tips1Isi" },
  { judul: "tips2Judul", isi: "tips2Isi" },
  { judul: "tips3Judul", isi: "tips3Isi" },
  { judul: "tips4Judul", isi: "tips4Isi" },
];

/** Susunan papan, SAN, dan petak langkah terakhir setelah `diputar` langkah. */
function posisiSolusi(diputar) {
  let fen = CONTOH.fen;
  const san = [];
  for (let i = 0; i < diputar; i += 1) {
    const g = terapkan(fen, parseLangkah(CONTOH.langkah[i]));
    san.push(g.history().slice(-1)[0]);
    fen = g.fen();
  }
  const terakhir = diputar ? parseLangkah(CONTOH.langkah[diputar - 1]) : null;
  return { papan: new Chess(fen).board(), san, terakhir };
}

/** Papan statis untuk posisi contoh — render saja, tanpa interaksi. */
function PapanContoh({ papan, terakhir }) {
  const { t } = useI18n();

  return (
    <div
      role="img"
      aria-label={t("tipsTekaTeki.demoAriaPapan")}
      className="w-full max-w-[420px] select-none"
    >
      <div className="grid aspect-square w-full grid-cols-8 overflow-hidden rounded border border-slate-300">
        {RANK.map((rank, baris) =>
          FILE.map((lajur, kolom) => {
            const terang = (baris + kolom) % 2 === 0;
            const petak = `${lajur}${rank}`;
            const bidak = papan[baris][kolom];
            const ditandai =
              terakhir && (petak === terakhir.from || petak === terakhir.to);
            return (
              <div
                key={petak}
                className="relative flex items-center justify-center"
                style={{ backgroundColor: terang ? PETAK_TERANG : PETAK_GELAP }}
              >
                {ditandai && (
                  <span
                    className="absolute inset-0"
                    style={{ backgroundColor: TINTA_LANGKAH }}
                  />
                )}
                {baris === 7 && (
                  <span
                    className="absolute bottom-0.5 right-1 font-mono text-[8px] font-bold leading-none"
                    style={{ color: terang ? PETAK_GELAP : PETAK_TERANG }}
                  >
                    {lajur}
                  </span>
                )}
                {kolom === 0 && (
                  <span
                    className="absolute left-1 top-0.5 font-mono text-[8px] font-bold leading-none"
                    style={{ color: terang ? PETAK_GELAP : PETAK_TERANG }}
                  >
                    {rank}
                  </span>
                )}
                {bidak && (
                  <div className="relative z-[1] flex h-[84%] w-[84%] items-center justify-center">
                    <ChessPiece
                      piece={
                        bidak.color === "w"
                          ? bidak.type.toUpperCase()
                          : bidak.type
                      }
                      set="merida"
                    />
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

export default function TekaTekiKonten() {
  const { t } = useI18n();
  const [diputar, setDiputar] = useState(0);

  const { papan, san, terakhir } = useMemo(
    () => posisiSolusi(diputar),
    [diputar],
  );

  const labelTombol =
    diputar === 0
      ? "demoPutar"
      : diputar < CONTOH.langkah.length
        ? "demoLanjut"
        : "demoUlangi";

  const barisContoh = [
    { label: "labelNomor", isi: <span className="font-mono">#{CONTOH.id}</span> },
    { label: "labelJenis", isi: t("tipsTekaTeki.nilaiJenis") },
    { label: "labelRating", isi: <span className="font-mono">{t("tipsTekaTeki.nilaiRating")}</span> },
    { label: "labelLevel", isi: t("tipsTekaTeki.nilaiLevel") },
    { label: "labelTema", isi: t("tipsTekaTeki.nilaiTema") },
    { label: "labelPartai", isi: CONTOH.pemain },
    { label: "labelPembukaan", isi: t("tipsTekaTeki.nilaiPembukaan") },
    {
      label: "labelSumber",
      isi: (
        <a
          href={CONTOH.sumberUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {CONTOH.sumberTeks}
        </a>
      ),
    },
  ];

  return (
    <HalamanIsi
      title={t("tipsTekaTeki.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("tipsTekaTeki.deskripsi")}
      metaDescription={t("tipsTekaTeki.metaDeskripsi")}
      next={{ to: RUTE_RUSH, judul: t("nav.tekaTekiRush") }}
    >
      <div className="font-serif">
        {/* ═══ Pengantar — judul di atas, narasi & CTA mengalir di bawahnya ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="flex flex-col gap-y-8">
              <h2 className="text-pretty text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
                {t("tipsTekaTeki.introJudul")}
              </h2>
              <div className="flex max-w-[68ch] flex-col gap-y-5 text-[15px] leading-relaxed text-grey-600 md:text-base">
                <p className="m-0">{t("tipsTekaTeki.intro1")}</p>
                <p className="m-0">{t("tipsTekaTeki.intro2")}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-4 font-sans">
                  <Link
                    to={RUTE_ALAT}
                    className="inline-flex items-center justify-center gap-2 rounded border border-primary bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {t("tipsTekaTeki.ctaUtama")}
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <Link
                    to={RUTE_RUSH}
                    className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {t("tipsTekaTeki.ctaRush")}
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Contoh soal — papan (5) + tabel data (7), solusi bisa diputar ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="text-pretty text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
              {t("tipsTekaTeki.demoJudul")}
            </h2>
            <p className="mt-4 max-w-[68ch] text-pretty text-[15px] leading-relaxed text-grey-600 md:text-base">
              {t("tipsTekaTeki.demoPengantar")}
            </p>

            <div className="mt-10 grid gap-x-16 gap-y-10 border-t border-grey-200 pt-10 lg:grid-cols-12">
              {/* Papan + pemutar solusi */}
              <div className="flex flex-col items-start gap-5 lg:col-span-5">
                <div className="flex w-full max-w-[420px] items-baseline justify-between font-sans text-xs text-grey-600">
                  <span className="font-mono font-semibold">
                    #{CONTOH.id}
                  </span>
                  <span>{t("tipsTekaTeki.demoGiliran")}</span>
                </div>

                <PapanContoh papan={papan} terakhir={terakhir} />

                <div className="flex w-full max-w-[420px] flex-col gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setDiputar((n) =>
                        n >= CONTOH.langkah.length ? 0 : n + 1,
                      )
                    }
                    className="inline-flex w-fit items-center justify-center gap-2 rounded border border-primary bg-primary px-5 py-2.5 font-sans text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {t(`tipsTekaTeki.${labelTombol}`)}
                  </button>

                  {/* Narasi langkah — diumumkan ke pembaca layar */}
                  <p
                    key={diputar}
                    aria-live="polite"
                    className="m-0 max-w-[52ch] text-[15px] leading-relaxed text-grey-800"
                  >
                    {t(`tipsTekaTeki.demoNarasi${diputar}`)}
                  </p>

                  {/* Notasi solusi — terbuka bertahap mengikuti pemutar */}
                  <div
                    className="flex flex-wrap items-center gap-2"
                    aria-hidden="true"
                  >
                    {CONTOH.langkah.map((_, i) => {
                      const sudah = i < san.length;
                      const nomor = i % 2 === 0 ? `${25 + i / 2}. ` : "";
                      return (
                        <span
                          key={i}
                          className={`rounded border px-2 py-1 font-mono text-[13px] leading-none ${
                            sudah
                              ? "border-slate-300 bg-white text-grey-800"
                              : "border-grey-200 text-grey-300"
                          }`}
                        >
                          {sudah ? `${nomor}${san[i]}` : "·"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tabel data soal — salinan metadata dari berkas soal */}
              <div className="lg:col-span-7">
                <dl className="m-0 border-t border-grey-200 font-sans text-sm">
                  {barisContoh.map((baris) => (
                    <div
                      key={baris.label}
                      className="grid gap-x-6 gap-y-1 border-b border-grey-200 py-3 sm:grid-cols-[170px_1fr]"
                    >
                      <dt className="text-grey-600">
                        {t(`tipsTekaTeki.${baris.label}`)}
                      </dt>
                      <dd className="m-0 font-medium text-grey-800">
                        {baris.isi}
                      </dd>
                    </div>
                  ))}
                </dl>
                <Link
                  to={`${RUTE_ALAT}?id=${CONTOH.id}`}
                  className="mt-6 inline-flex items-center gap-1.5 rounded font-sans text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("tipsTekaTeki.demoBuka")}
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Isi koleksi — judul (4) + distribusi & ringkasan (8) ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="grid gap-x-16 gap-y-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h2 className="text-pretty text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
                  {t("tipsTekaTeki.statJudul")}
                </h2>
                <p className="mt-4 max-w-[40ch] text-pretty text-[15px] leading-relaxed text-grey-600">
                  {t("tipsTekaTeki.statPengantar")}
                </p>
              </div>
              <div className="lg:col-span-8">
                <ul className="m-0 list-none border-t border-grey-200 p-0">
                  {STATISTIK.map((baris) => (
                    <li
                      key={baris.label}
                      className="border-b border-grey-200 py-4"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[15px] text-grey-800 md:text-base">
                          {t(`tipsTekaTeki.${baris.label}`)}
                        </span>
                        <span className="font-mono text-sm font-semibold text-grey-800">
                          {t(`tipsTekaTeki.${baris.nilai}`)}
                        </span>
                      </div>
                      {/* Batang sebanding nyata — panjang = persentase koleksi */}
                      <div
                        className="mt-2.5 h-1.5 w-full bg-grey-200"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(baris.jumlah / TOTAL_SOAL) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <dl className="m-0 font-sans text-sm">
                  {RINGKASAN.map(([kunciLabel, kunciNilai]) => (
                    <div
                      key={kunciLabel}
                      className="grid gap-x-6 gap-y-1 border-b border-grey-200 py-3 sm:grid-cols-[170px_1fr]"
                    >
                      <dt className="text-grey-600">
                        {t(`tipsTekaTeki.${kunciLabel}`)}
                      </dt>
                      <dd className="m-0 font-medium text-grey-800">
                        {t(`tipsTekaTeki.${kunciNilai}`)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Cara latihan — daftar bernomor (urutan = alur kerja) ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="text-balance text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
              {t("tipsTekaTeki.caraJudul")}
            </h2>
            <ol className="mt-10 grid list-none gap-x-12 gap-y-8 border-t border-grey-200 p-0 pt-10 sm:grid-cols-2">
              {LANGKAH_CARA.map((kunci, i) => (
                <li key={kunci} className="flex gap-4">
                  <span className="shrink-0 text-lg font-semibold text-primary">
                    {i + 1}
                  </span>
                  <p className="m-0 max-w-[52ch] text-[15px] leading-relaxed text-grey-600 md:text-base">
                    {t(`tipsTekaTeki.${kunci}`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ═══ Tips — judul (4) + daftar definisi bergaris (8) ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="grid gap-x-16 gap-y-10 lg:grid-cols-12">
              <h2 className="text-pretty text-2xl font-semibold leading-snug text-grey-800 md:text-3xl lg:col-span-4">
                {t("tipsTekaTeki.tipsJudul")}
              </h2>
              <dl className="m-0 lg:col-span-8">
                {TIPS.map((tip, i) => (
                  <div
                    key={tip.judul}
                    className={`py-5 ${i === 0 ? "" : "border-t border-grey-200"}`}
                  >
                    <dt className="text-lg font-semibold leading-snug text-grey-800">
                      {t(`tipsTekaTeki.${tip.judul}`)}
                    </dt>
                    <dd className="m-0 mt-2 max-w-[62ch] text-pretty text-[15px] leading-relaxed text-grey-600">
                      {t(`tipsTekaTeki.${tip.isi}`)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ═══ Penutup — panel datar + tautan ke alat ═══ */}
        <section className="w-full bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="rounded-lg border border-grey-200 p-8 md:p-10">
              <h2 className="text-balance text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
                {t("tipsTekaTeki.penutupJudul")}
              </h2>
              <p className="mt-4 max-w-[68ch] text-pretty text-[15px] leading-relaxed text-grey-600 md:text-base">
                {t("tipsTekaTeki.penutupIsi")}
              </p>
              <div className="mt-7">
                <Link
                  to={RUTE_ALAT}
                  className="inline-flex items-center justify-center gap-2 rounded border border-primary bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("tipsTekaTeki.ctaUtama")}
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
