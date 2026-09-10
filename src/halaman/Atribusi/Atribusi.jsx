/*
 * Halaman "Atribusi & lisensi" — atribusi fitur Analisa, ditata dengan markup
 * editorial koran (label kecil uppercase, judul font-black ber-border double,
 * serif, rata kiri-kanan) mengikuti pola Keberlanjutan. Tata letak grid kartu
 * dipertahankan. Tautan memakai <a> biasa — link sheet/eksternal.
 */
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

function Kartu({ judul, ikon, isi }) {
  return (
    <section className="bg-white border border-gray-400 rounded p-6 w-full flex flex-col items-center">
      <h2 className="text-base font-sans font-bold tracking-widest uppercase text-gray-900 flex flex-row items-center justify-center w-fit mx-auto mb-5 gap-2 border-b border-gray-900 pb-1.5">
        {ikon}
        {judul}
      </h2>
      <ul className="font-serif text-base leading-relaxed text-justify flex flex-col items-center gap-2 text-center text-gray-800">
        {isi}
      </ul>
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
      judul: t("analisa.atribusi.kode"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/images/color-icon/page-article.svg")}
              alt=""
              draggable="false"
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
            <span className="h-6 w-px bg-gray-400" />
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
      judul: t("analisa.atribusi.teknologi"),
      ikon: null,
      isi: (
        <>
          <li>
            <img
              src={berkasPublik("/images/color-icon/reactjs-ar21.svg")}
              alt=""
              draggable="false"
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
                <span className="text-gray-400">·</span>
              </span>
            ))}
          </li>
          <li className="text-sm text-gray-500">
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

  return (
    <HalamanIsi
      title={t("analisa.atribusi.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("analisa.atribusi.pendahuluan")}
      next={{ to: "/program-kami/analisa", judul: t("analisa.judul") }}
    >
      <section className="w-full relative bg-transparent pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-16 pt-12 md:pt-14 xl:pt-16">
        <div className="relative w-full mx-auto max-w-[1280px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <License size={44} class="fill-gray-900" />
            <div className="w-full border-b-4 border-double border-gray-900 pb-4">
              <p className="mb-1 font-sans text-sm font-bold tracking-widest text-gray-900 uppercase">
                {t("analisa.atribusi.judul")}
              </p>
              <h2 className="mb-2 text-3xl md:text-4xl leading-none font-black tracking-tight text-gray-900 uppercase">
                {t("analisa.atribusi.judulDaftar")}
              </h2>
              <p className="m-0 mx-auto max-w-[720px] text-base text-gray-900 italic">
                {t("analisa.atribusi.pendahuluan")}
              </p>
            </div>
          </div>
          <div className="w-full border-t border-gray-400 mb-10 md:mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {kartu.map((k) => (
              <Kartu key={k.judul} judul={k.judul} ikon={k.ikon} isi={k.isi} />
            ))}
          </div>
          <div className="mt-10 w-full px-6 py-8 text-center">
            <div className="mx-auto flex w-fit flex-col items-center gap-3">
              <License size={36} class="fill-gray-900" />
              <p className="max-w-[720px] font-serif text-base leading-6 text-justify text-gray-900 italic">
                {t("analisa.atribusi.lisensiProyekOleh")}
              </p>
              <code className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-mono text-gray-700">
                © 2025-2026 Delta-Polder-Indonesia (Bintang Toba) · MIT License
              </code>
            </div>
          </div>

          <div className="w-full mt-14 md:mt-16 pt-10 md:pt-12 flex flex-col items-center gap-6 text-center">
            <h3 className="pb-1 text-base sm:text-lg font-sans font-black tracking-tight uppercase text-gray-900 border-b border-gray-900">
              {t("analisa.atribusi.sosialJudul")}
            </h3>
            <p className="max-w-[640px] font-serif text-base leading-relaxed text-justify text-gray-800">
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
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    className="h-6 w-auto"
                  />
                </a>
              ))}
            </div>
            <div className="mt-2 w-full border border-gray-950 p-5 flex flex-col items-center gap-3">
              <h4 className="font-sans text-base font-bold tracking-wide text-gray-900 uppercase">
                {t("analisa.atribusi.sanggahanJudul")}
              </h4>
              <p className="mx-auto max-w-[720px] font-serif text-base leading-relaxed text-justify text-gray-900 italic">
                {t("analisa.atribusi.sanggahan")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </HalamanIsi>
  );
}