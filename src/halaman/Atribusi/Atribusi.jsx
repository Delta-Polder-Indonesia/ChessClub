/*
 * Halaman "Atribusi & lisensi" — katalog atribusi editorial berkelompok,
 * dengan daftar baris tanpa kartu generik. Tautan memakai <a> biasa untuk
 * sumber eksternal.
 */
import { Children } from "react";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar, berkasPublik } from "../../lib/asets.js";
import ChessComLogo from "../Analisa/komponen/svg/ChessComLogo.jsx";
import LichessLogo from "../Analisa/komponen/svg/LichessLogo.jsx";

/** Tautan platform sosial; URL dipertahankan dari implementasi sebelumnya. */
const KANAL_SOSIAL = [
  { nama: "Instagram", href: "https://www.instagram.com/" },
  { nama: "TikTok", href: "https://www.tiktok.com/" },
  { nama: "X (Twitter)", href: "https://x.com/" },
  { nama: "YouTube", href: "https://www.youtube.com/" },
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
      className="font-medium text-grey-800 underline decoration-grey-300 underline-offset-4 transition-colors hover:decoration-grey-800"
      href={href}
    >
      {children}
    </a>
  );
}

function ItemAtribusi({ judul, isi }) {
  const [visual, keterangan, ...sumber] = Children.toArray(isi.props.children);

  return (
    <article className="grid min-w-0 grid-cols-1 gap-4 py-6 sm:grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,14rem)] sm:items-baseline sm:gap-6">
      <ul aria-hidden="true" className="m-0 flex min-h-7 list-none items-center p-0 text-grey-800 [&_img]:max-h-8 [&_img]:max-w-11 [&_img]:object-contain [&_li]:m-0 [&_svg]:max-h-7 [&_svg]:max-w-full">
        {visual}
      </ul>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-grey-800">{judul}</h4>
        <p className="mt-1 font-sans text-sm leading-relaxed text-grey-600">{keterangan?.props?.children}</p>
      </div>
      {sumber.length ? (
        <ul className="m-0 flex min-w-0 max-w-full list-none flex-col gap-1 p-0 text-left font-mono text-xs leading-relaxed text-grey-700 [overflow-wrap:anywhere] sm:text-right">
          {sumber}
        </ul>
      ) : <span />}
    </article>
  );
}

function KelompokAtribusi({ id, penanda, judul, deskripsi, item }) {
  return (
    <section id={id} className="scroll-mt-12 grid grid-cols-1 gap-7 border-t border-grey-800 py-12 sm:py-14 lg:grid-cols-12 lg:gap-12" aria-labelledby={`${id}-judul`}>
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-12">
          <span className="block font-mono text-xs uppercase tracking-wider text-grey-500">{penanda}</span>
          <h3 id={`${id}-judul`} className="mt-2 text-lg font-semibold tracking-tight text-grey-800">{judul}</h3>
          <p className="mt-2.5 font-sans text-sm leading-relaxed text-grey-600">{deskripsi}</p>
        </div>
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
      id: "kelompok-sumber",
      penanda: t("analisa.atribusi.kelompok.sumber.penanda"),
      judul: t("analisa.atribusi.kelompok.sumber.judul"),
      deskripsi: t("analisa.atribusi.kelompok.sumber.deskripsi"),
      item: [kartu[0], kartu[1], kartu[7], kartu[8], kartu[9]],
    },
    {
      id: "kelompok-mesin",
      penanda: t("analisa.atribusi.kelompok.mesin.penanda"),
      judul: t("analisa.atribusi.kelompok.mesin.judul"),
      deskripsi: t("analisa.atribusi.kelompok.mesin.deskripsi"),
      item: [kartu[2], kartu[3], kartu[4]],
    },
    {
      id: "kelompok-kode",
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
      <main className="mx-auto w-full max-w-7xl px-6 pb-16 pt-14 md:px-8 md:pt-20 xl:px-0">
        <header className="grid grid-cols-1 gap-6 pb-10 sm:pb-12 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <h2 className="font-serif text-2xl font-normal leading-snug text-grey-800 md:text-3xl">
              {t("analisa.atribusi.judulDaftar")}
            </h2>
            <nav aria-label={t("analisa.atribusi.indeksAria")} className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-grey-200 pt-5 text-xs font-medium text-grey-700">
              {kelompok.map((grup) => (
                <a key={grup.id} href={`#${grup.id}`} className="transition-colors hover:text-grey-900 hover:underline hover:underline-offset-4">
                  {grup.penanda.replace("/", "—")} · {grup.judul}
                </a>
              ))}
            </nav>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-grey-700 lg:col-span-8">
            {t("analisa.atribusi.penjelasanKatalog")}
          </p>
        </header>

        <div>
          {kelompok.map((grup) => (
            <KelompokAtribusi key={grup.id} {...grup} />
          ))}
        </div>

        <section className="mt-8 border-t border-grey-800 pt-12 sm:pt-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <span className="font-mono text-xs uppercase tracking-wider text-grey-500">
                {t("analisa.atribusi.lisensiProyek")}
              </span>
              <h3 className="mt-2 font-serif text-2xl font-normal text-grey-800">
                {t("analisa.atribusi.labelPenutup")}
              </h3>
              <p className="mt-4 font-serif text-base leading-relaxed text-grey-700 italic">
                {t("analisa.atribusi.lisensiProyekOleh")}
              </p>
              <p className="mt-5 font-mono text-xs text-grey-500">
                © 2025–2026 Delta-Polder-Indonesia (Bintang Toba) · MIT License
              </p>
            </div>

            <div className="border-t border-grey-200 pt-8 lg:col-span-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
              <span className="font-mono text-xs uppercase tracking-wider text-grey-500">
                {t("analisa.atribusi.sosialJudul")}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-grey-700">
                {t("analisa.atribusi.sosialDeskripsi")}
              </p>
              <nav aria-label={t("analisa.atribusi.sosialJudul")} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-grey-200 pt-5">
                {KANAL_SOSIAL.map((kanal) => (
                  <a key={kanal.nama} href={kanal.href} target="_blank" rel="noreferrer noopener" className="text-xs font-medium text-grey-700 underline decoration-grey-300 underline-offset-4 transition-colors hover:text-grey-900 hover:decoration-grey-800">
                    {kanal.nama}
                  </a>
                ))}
              </nav>
            </div>

            <div className="border-t border-grey-200 pt-8 lg:col-span-12">
              <span className="font-mono text-xs uppercase tracking-wider text-grey-500">
                {t("analisa.atribusi.sanggahanJudul")}
              </span>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-grey-700">
                {t("analisa.atribusi.sanggahan")}
              </p>
            </div>
          </div>
        </section>
      </main>
    </HalamanIsi>
  );
}