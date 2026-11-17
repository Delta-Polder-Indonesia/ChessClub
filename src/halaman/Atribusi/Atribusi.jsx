/*
 * Halaman "Atribusi & lisensi" — katalog atribusi editorial berkelompok,
 * dengan daftar baris tanpa kartu generik. Tautan memakai <a> biasa untuk
 * sumber eksternal.
 */
import { Children } from "react";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar, berkasPublik } from "../../lib/asets.js";
import License from "../Analisa/komponen/svg/license.jsx";
import ChessComLogo from "../Analisa/komponen/svg/ChessComLogo.jsx";
import LichessLogo from "../Analisa/komponen/svg/LichessLogo.jsx";

/** Ikon logo media sosial — href mengarah laman resmi masing-masing platform. */
const IKON_SOSIAL = [
  { nama: "Instagram", src: "/images/color-icon/logo-instagram.svg", href: "https://www.instagram.com/" },
  { nama: "TikTok", src: "/images/color-icon/logo-tiktok.svg", href: "https://www.tiktok.com/" },
  { nama: "X (Twitter)", src: "/images/color-icon/logo-x.svg", href: "https://x.com/" },
  { nama: "YouTube", src: "/images/color-icon/logo-youtube.svg", href: "https://www.youtube.com/" },
];

/** Teknologi & layanan tempat proyek ini dibangun dan dijalankan. */
const TEKNOLOGI = [
  { nama: "GitHub", href: "https://github.com/" },
  { nama: "Vercel", href: "https://vercel.com/" },
  { nama: "Supabase", href: "https://supabase.com/" },
  { nama: "React", href: "https://react.dev/" },
  { nama: "Vite", href: "https://vitejs.dev/" },
  { nama: "Tailwind CSS", href: "https://tailwindcss.com/" },
  { nama: "Stockfish", href: "https://stockfishchess.org/" },
  { nama: "chess.js", href: "https://github.com/jhlywa/chess.js" },
  { nama: "onnxruntime-web", href: "https://onnxruntime.ai/docs/tutorials/web/" },
  { nama: "Arena AI", href: "https://arena.ai/" },
  { nama: "OpenCode", href: "https://opencode.ai/" },
];

function Tautan({ href, children }) {
  return (
    <a
      target="_blank"
      rel="noreferrer noopener"
      className="text-primary hover:underline font-bold"
      href={href}
    >
      {children}
    </a>
  );
}

function ItemAtribusi({ judul, isi }) {
  const [visual, keterangan, ...sumber] = Children.toArray(isi.props.children);

  return (
    <article className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,auto)] sm:items-start sm:gap-8">
      <div className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-start gap-4">
        <ul className="m-0 flex min-h-11 w-16 list-none items-center p-0 [&_img]:max-h-10 [&_img]:max-w-16 [&_img]:object-contain [&_li]:m-0">
          {visual}
        </ul>
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-grey-800">{judul}</h3>
          <ul className="mt-1 flex list-none flex-col gap-1 p-0 font-sans text-sm leading-relaxed text-grey-600">
            {keterangan}
          </ul>
        </div>
      </div>
      {sumber.length ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-left font-mono text-xs leading-relaxed text-primary sm:items-end sm:text-right">
          {sumber}
        </ul>
      ) : null}
    </article>
  );
}

function KelompokAtribusi({ penanda, judul, deskripsi, item }) {
  return (
    <section className="grid grid-cols-1 gap-7 py-10 sm:py-12 lg:grid-cols-12 lg:gap-12" aria-label={judul}>
      <div className="lg:col-span-4">
        <span className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-grey-500">{penanda}</span>
        <h3 className="text-lg font-semibold tracking-tight text-grey-800">{judul}</h3>
        <p className="mt-2 font-sans text-sm leading-relaxed text-grey-600">{deskripsi}</p>
      </div>
      <div className="divide-y divide-grey-200 border-y border-grey-200 lg:col-span-8">
        {item.map((k) => <ItemAtribusi key={k.judul} judul={k.judul} isi={k.isi} />)}
      </div>
    </section>
  );
}

export default function Atribusi() {
  const { t } = useI18n();

  const kartu = [
    {
      judul: t("analisa.atribusi.bidak"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/images/color-icon/pawn-solo.svg")}
              alt=""
              draggable="false"
              width={90}
              height={90}
              decoding="async"
              loading="lazy"
              className="h-14 w-auto"
            />
          </li>
          <li>{t("analisa.atribusi.bidakOleh")}</li>
          <li>
            <Tautan href="https://github.com/cburnett/wikipedia-chess">
              cburnett/wikipedia-chess
            </Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.pembukaan"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/images/color-icon/Landscape-Lichess-logo.svg")}
              alt=""
              draggable="false"
              width={3300}
              height={1353}
              decoding="async"
              loading="lazy"
              className="h-12 w-auto"
            />
          </li>
          <li>{t("analisa.atribusi.pembukaanOleh")}</li>
          <li>
            <Tautan href="https://github.com/lichess-org/chess-openings">
              lichess-org/chess-openings
            </Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.engine"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={gambar("/images/stockfish.webp")}
              alt=""
              draggable="false"
              width={256}
              height={256}
              decoding="async"
              loading="lazy"
              className="h-24 w-auto"
            />
          </li>
          <li>{t("analisa.atribusi.engineOleh")}</li>
          <li>
            <Tautan href="https://stockfishchess.org/">Stockfish</Tautan> ·{" "}
            <Tautan href="https://github.com/nmrugg/stockfish.js">
              nmrugg/stockfish.js
            </Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.enginePemula"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/AtribusiDanlisensi/Sunfish.webp")}
              alt=""
              draggable="false"
              width={545}
              height={267}
              decoding="async"
              loading="lazy"
              className="h-20 w-auto"
            />
          </li>
          <li>{t("analisa.atribusi.enginePemulaOleh")}</li>
          <li>
            <Tautan href="https://github.com/thomasahle/sunfish">thomasahle/sunfish</Tautan> ·{" "}
            <Tautan href="https://github.com/foo123/sunfish.js">foo123/sunfish.js</Tautan>
          </li>
          <li>
            <Tautan href="https://www.gnu.org/licenses/gpl-3.0.html">GPL-3.0</Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.engineMenengah"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/images/color-icon/training.svg")}
              alt=""
              draggable="false"
              width={90}
              height={90}
              decoding="async"
              loading="lazy"
              className="h-14 w-auto"
            />
          </li>
          <li>{t("analisa.atribusi.engineMenengahOleh")}</li>
          <li>
            <Tautan href="https://github.com/CSSLab/maia-platform-frontend">CSSLab/maia-platform-frontend</Tautan> ·{" "}
            <Tautan href="https://maiachess.com/">maiachess.com</Tautan>
          </li>
          <li>
            <Tautan href="https://www.gnu.org/licenses/gpl-3.0.html">GPL-3.0</Tautan> ·{" "}
            <Tautan href="https://github.com/onnx/onnx">onnxruntime-web (MIT)</Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.kode"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/images/color-icon/page-article.svg")}
              alt=""
              draggable="false"
              width={90}
              height={90}
              decoding="async"
              loading="lazy"
              className="h-14 w-auto"
            />
          </li>
          <li>{t("analisa.atribusi.kodeOleh")}</li>
          <li>
            <Tautan href="https://github.com/wdeloo/Brilliant-Chess">
              wdeloo/Brilliant-Chess
            </Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.desain"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/images/color-icon/page-blog.svg")}
              alt=""
              draggable="false"
              width={90}
              height={90}
              decoding="async"
              loading="lazy"
              className="h-14 w-auto"
            />
          </li>
          <li>{t("analisa.atribusi.desainOleh")}</li>
          <li>
            <Tautan href="https://delta-polder-indonesia.github.io/BintangToba/">
              Delta-Polder-Indonesia/BintangToba
            </Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.suara"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/images/color-icon/today.svg")}
              alt=""
              draggable="false"
              width={90}
              height={90}
              decoding="async"
              loading="lazy"
              className="h-14 w-auto"
            />
          </li>
          <li>{t("analisa.atribusi.suaraOleh")}</li>
          <li>
            <Tautan href="https://www.chess.com/">Chess.com</Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.logo"),
      ikon: null,
      isi: (
        <>
          <li className="flex flex-row items-center gap-3">
            <ChessComLogo className="h-[26px] w-auto fill-current" />
            <span className="h-6 w-px bg-slate-300" />
            <LichessLogo className="h-[20px] w-auto fill-current" />
          </li>
          <li>{t("analisa.atribusi.logoOleh")}</li>
          <li>
            <Tautan href="https://www.chess.com/">Chess.com</Tautan> ·{" "}
            <Tautan href="https://lichess.org/">lichess.org</Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.tekaTekiHarian"),
      ikon: null,
      isi: (
        <>
          <li className="flex flex-row items-center gap-3">
            <ChessComLogo className="h-[26px] w-auto fill-current" />
          </li>
          <li>{t("analisa.atribusi.tekaTekiHarianOleh")}</li>
          <li>
            <Tautan href="https://www.chess.com/daily-chess-puzzle">
              Chess.com
            </Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.teknologi"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/images/color-icon/reactjs-ar21.svg")}
              alt=""
              draggable="false"
              width={120}
              height={60}
              decoding="async"
              loading="lazy"
              className="h-14 w-auto"
            />
          </li>
          <li>{t("analisa.atribusi.teknologiOleh")}</li>
          <li className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base">
            {TEKNOLOGI.map((k) => (
              <span key={k.nama} className="inline-flex items-center gap-1">
                <Tautan href={k.href}>{k.nama}</Tautan>
                <span className="text-slate-400">·</span>
              </span>
            ))}
          </li>
          <li className="text-sm text-slate-500">
            Diarsiteki & kolaborasi via{" "}
            <Tautan href="https://arena.ai/">Arena AI</Tautan> menggunakan{" "}
            <Tautan href="https://opencode.ai/">OpenCode</Tautan>.
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.lisensiProyek"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/AtribusiDanlisensi/Konstitusi.webp")}
              alt=""
              draggable="false"
              width={640}
              height={640}
              decoding="async"
              loading="lazy"
              className="h-20 w-auto"
            />
          </li>
          <li>{t("analisa.atribusi.lisensiProyekOleh")}</li>
          <li>
            <a
              target="_blank"
              rel="noreferrer noopener"
              className="font-bold text-primary hover:underline"
              href="https://github.com/Delta-Polder-Indonesia/ChessClub/blob/main/LICENSE"
            >
              {t("analisa.atribusi.lisensiCek")}
            </a>
          </li>
        </>
      ),
    },
  ];

  const kelompok = [
    {
      penanda: t("analisa.atribusi.kelompok.sumber.penanda"),
      judul: t("analisa.atribusi.kelompok.sumber.judul"),
      deskripsi: t("analisa.atribusi.kelompok.sumber.deskripsi"),
      item: [kartu[0], kartu[1], kartu[7], kartu[8], kartu[9]],
    },
    {
      penanda: t("analisa.atribusi.kelompok.mesin.penanda"),
      judul: t("analisa.atribusi.kelompok.mesin.judul"),
      deskripsi: t("analisa.atribusi.kelompok.mesin.deskripsi"),
      item: [kartu[2], kartu[3], kartu[4]],
    },
    {
      penanda: t("analisa.atribusi.kelompok.kode.penanda"),
      judul: t("analisa.atribusi.kelompok.kode.judul"),
      deskripsi: t("analisa.atribusi.kelompok.kode.deskripsi"),
      item: [kartu[5], kartu[6], kartu[10], kartu[11]],
    },
  ];

  return (
    <HalamanIsi
      title={t("analisa.atribusi.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("analisa.atribusi.pendahuluan")}
      heroImage="/images/ProgramKami/atribusi-lisensi-hero.webp"
      heroImageAlt="Patung Dewi Keadilan memegang timbangan di samping papan dan bidak catur"
      next={{ to: "/program-kami/analisa", judul: t("analisa.judul") }}
    >
      <section className="relative w-full bg-transparent px-6 pb-16 pt-12 md:px-8 md:pt-14 xl:px-0 xl:pt-16">
        <div className="relative mx-auto w-full max-w-7xl">
          <header className="grid grid-cols-1 items-end gap-6 border-b border-grey-200 pb-8 sm:pb-10 lg:grid-cols-12 lg:gap-12">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-grey-800 sm:text-4xl lg:col-span-6">
              {t("analisa.atribusi.judulDaftar")}
            </h2>
            <p className="m-0 text-sm leading-relaxed text-grey-600 sm:text-[15px] lg:col-span-6">
              {t("analisa.atribusi.pendahuluan")}
            </p>
          </header>
          <div className="divide-y divide-grey-200">
            {kelompok.map((grup) => (
              <KelompokAtribusi key={grup.penanda} {...grup} />
            ))}
          </div>
          <div className="mt-10 w-full px-6 py-8 text-center">
            <div className="mx-auto flex w-fit flex-col items-center gap-3">
              <License size={36} class="fill-gray-900" />
              <p className="max-w-[720px] font-serif text-base leading-6 text-grey-800 italic">
                {t("analisa.atribusi.lisensiProyekOleh")}
              </p>
              <code className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono text-grey-600">
                © 2025-2026 Delta-Polder-Indonesia (Bintang Toba) · MIT License
              </code>
            </div>
          </div>

          <div className="w-full mt-14 md:mt-16 pt-10 md:pt-12 flex flex-col items-center gap-6 text-center">
            <h3 className="pb-1 text-base sm:text-lg font-serif font-semibold text-grey-800 border-b border-grey-200">
              {t("analisa.atribusi.sosialJudul")}
            </h3>
            <p className="max-w-[640px] font-serif text-base leading-relaxed text-grey-800">
              {t("analisa.atribusi.sosialDeskripsi")}
            </p>
            <div className="flex flex-row items-center justify-center gap-5">
              {IKON_SOSIAL.map((s) => (
                <a
                  key={s.nama}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={s.nama}
                  aria-label={s.nama}
                  className="inline-flex items-center justify-center transition-opacity hover:opacity-70"
                >
                  <img
                    src={berkasPublik(s.src)}
                    alt=""
                    width={s.lebar ?? 24}
                    height={s.tinggi ?? 24}
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    className="h-6 w-auto"
                  />
                </a>
              ))}
            </div>
            <div className="mt-2 w-full border border-slate-300 p-5 flex flex-col items-center gap-3">
              <h4 className="font-sans text-base font-bold tracking-wide text-grey-800 uppercase">
                {t("analisa.atribusi.sanggahanJudul")}
              </h4>
              <p className="mx-auto max-w-[720px] font-serif text-base leading-relaxed text-grey-800 italic">
                {t("analisa.atribusi.sanggahan")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </HalamanIsi>
  );
}