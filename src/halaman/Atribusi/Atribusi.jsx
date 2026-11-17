/*
 * Halaman "Atribusi & lisensi" — katalog atribusi editorial berkelompok,
 * dengan daftar baris tanpa kartu generik. Tautan memakai <a> biasa untuk
 * sumber eksternal.
 */
import { Children } from "react";
import { Link } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar, sumberGambar, berkasPublik } from "../../lib/asets.js";
import ChessComLogo from "../Analisa/komponen/svg/ChessComLogo.jsx";
import LichessLogo from "../Analisa/komponen/svg/LichessLogo.jsx";

/** Kanal sosial — href mengarah laman resmi tiap platform. */
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

function ItemAtribusi({ judul, badge, isi }) {
  const [visual, keterangan, ...sumber] = Children.toArray(isi.props.children);

  return (
    <article className="grid min-w-0 grid-cols-1 gap-4 py-6 sm:grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,14rem)] sm:items-baseline sm:gap-6">
      <ul aria-hidden="true" className="m-0 flex min-h-7 list-none items-center p-0 text-grey-800 [&_img]:max-h-8 [&_img]:max-w-11 [&_img]:object-contain [&_li]:m-0">
        {visual}
      </ul>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-grey-800">
          {judul}
          {badge ? (
            <span className="ml-1.5 inline-block rounded bg-grey-100 px-1.5 py-0.5 font-mono text-[10px] font-normal text-grey-600">
              {badge}
            </span>
          ) : null}
        </h4>
        <p className="mt-1 text-sm leading-relaxed text-grey-600">{keterangan?.props?.children}</p>
      </div>
      {sumber.length ? (
        <ul className="m-0 flex min-w-0 max-w-full list-none flex-col gap-1 p-0 text-left font-mono text-xs leading-relaxed text-grey-800 [overflow-wrap:anywhere] sm:text-right">
          {sumber}
        </ul>
      ) : <span />}
    </article>
  );
}

function KelompokAtribusi({ id, penanda, judul, deskripsi, item }) {
  return (
    <section id={id} className="scroll-mt-12 grid grid-cols-1 gap-8 border-t border-grey-800 py-12 sm:py-14 lg:grid-cols-12 lg:gap-12" aria-labelledby={`${id}-judul`}>
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-12">
          <span className="block font-mono text-xs uppercase tracking-wider text-grey-500">{penanda}</span>
          <h3 id={`${id}-judul`} className="mt-2 text-lg font-semibold tracking-tight text-grey-800">{judul}</h3>
          <p className="mt-2.5 font-sans text-sm leading-relaxed text-grey-600">{deskripsi}</p>
        </div>
      </div>
      <div className="divide-y divide-grey-200 border-y border-grey-200 lg:col-span-8">
        {item.map((k) => <ItemAtribusi key={k.judul} judul={k.judul} badge={k.badge} isi={k.isi} />)}
      </div>
    </section>
  );
}

export default function Atribusi() {
  const { t } = useI18n();
  const fotoHero = sumberGambar("/images/ProgramKami/atribusi-lisensi-hero.webp", {
    sizes: "(min-width: 1024px) 40vw, 100vw",
  });

  const kartu = [
    {
      judul: t("analisa.atribusi.bidak"),
      badge: "CC-BY-SA-3.0",
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
      badge: "CC0-1.0",
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
      badge: "GPL-3.0",
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
      badge: "GPL-3.0",
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
      badge: "GPL-3.0 · MIT",
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
      badge: "MIT",
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
      badge: "MIT",
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
      badge: "© Chess.com",
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
      badge: "Merek dagang",
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
      badge: "API publik",
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
            {TEKNOLOGI.map((k, i) => (
              <span key={k.nama} className="inline-flex items-center gap-1">
                <Tautan href={k.href}>{k.nama}</Tautan>
                {i < TEKNOLOGI.length - 1 ? <span className="text-slate-400">·</span> : null}
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
      badge: "MIT",
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
      image="/images/ProgramKami/atribusi-lisensi-hero.webp"
      imageWidth={1672}
      imageHeight={653}
      tampilkanHero={false}
      next={{ to: "/program-kami/analisa", judul: t("analisa.judul") }}
    >
      <div className="border-b border-grey-200">
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <nav aria-label={t("analisa.atribusi.breadcrumbAria")} className="flex flex-wrap items-center gap-2 pt-8 font-mono text-xs text-grey-500">
            <Link to="/" className="transition-colors hover:text-grey-800">{t("common.home")}</Link>
            <span aria-hidden="true">/</span>
            <Link to="/program-kami" className="transition-colors hover:text-grey-800">{t("nav.programKami")}</Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-grey-800">{t("analisa.atribusi.judul")}</span>
          </nav>

          <header className="grid grid-cols-1 items-start gap-8 py-10 sm:py-14 lg:grid-cols-12 lg:gap-12 lg:py-16">
            <div className="lg:col-span-7">
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-grey-500">
                {t("analisa.atribusi.labelEditorial")}
              </p>
              <h1 className="mt-4 font-serif text-4xl font-normal leading-tight tracking-tight text-grey-800 sm:text-5xl lg:leading-[1.12]">
                {t("analisa.atribusi.judulEditorial")}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-grey-700">
                {t("analisa.atribusi.pendahuluan")}
              </p>
              <nav aria-label={t("analisa.atribusi.indeksAria")} className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-grey-200 pt-5 text-xs font-medium text-grey-700">
                {kelompok.map((grup) => (
                  <a key={grup.id} href={`#${grup.id}`} className="transition-colors hover:text-grey-900 hover:underline hover:underline-offset-4">
                    {grup.penanda.replace("/", "—")} · {grup.judul}
                  </a>
                ))}
              </nav>
            </div>

            <figure className="min-w-0 lg:col-span-5">
              <img
                {...fotoHero}
                alt={t("analisa.atribusi.visualAlt")}
                decoding="async"
                fetchPriority="high"
                draggable="false"
                className="aspect-[4/3] w-full bg-grey-100 object-cover object-[72%_center] grayscale contrast-105"
              />
              <figcaption className="mt-3 flex items-center justify-between gap-3 text-xs text-grey-500">
                <span>{t("analisa.atribusi.visualCaption")}</span>
                <span className="shrink-0 font-mono text-[11px]">{t("analisa.atribusi.periode")}</span>
              </figcaption>
            </figure>
          </header>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-6 py-14 md:px-10 md:py-20">
        <section className="grid grid-cols-1 gap-6 pb-10 sm:pb-12 lg:grid-cols-12">
          <h2 className="font-serif text-2xl font-normal text-grey-800 lg:col-span-4">
            {t("analisa.atribusi.judulDaftar")}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-grey-700 lg:col-span-8">
            {t("analisa.atribusi.penjelasanKatalog")}
          </p>
        </section>

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
                {t("analisa.atribusi.sanggahanJudul")}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-grey-700">
                {t("analisa.atribusi.sanggahan")}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-grey-700">
                {t("analisa.atribusi.sosialDeskripsi")}
              </p>
              <nav aria-label={t("analisa.atribusi.sosialJudul")} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-grey-200 pt-5">
                {KANAL_SOSIAL.map((s) => (
                  <a
                    key={s.nama}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs font-medium text-grey-700 underline decoration-grey-300 underline-offset-4 transition-colors hover:text-grey-900 hover:decoration-grey-800"
                  >
                    {s.nama}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </section>
      </main>
    </HalamanIsi>
  );
}