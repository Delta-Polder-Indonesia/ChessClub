/*
 * Halaman "Atribusi & lisensi" — katalog atribusi editorial berkelompok,
 * dengan daftar baris tanpa kartu generik. Tautan memakai <a> biasa untuk
 * sumber eksternal.
 */
import { Children } from "react";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

/** Tautan media sosial — ditampilkan sebagai nama teks, tanpa ikon gambar. */
const TAUTAN_SOSIAL = [
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
  { nama: "React", href: "https://react.dev/", teknis: true },
  { nama: "Vite", href: "https://vitejs.dev/", teknis: true },
  { nama: "Tailwind CSS", href: "https://tailwindcss.com/", teknis: true },
  { nama: "Stockfish", href: "https://stockfishchess.org/", teknis: true },
  { nama: "chess.js", href: "https://github.com/jhlywa/chess.js", teknis: true },
  { nama: "onnxruntime-web", href: "https://onnxruntime.ai/docs/tutorials/web/", teknis: true },
];

function Tautan({ href, children, teknis = false }) {
  return (
    <a
      target="_blank"
      rel="noreferrer noopener"
      className={`${teknis ? "font-mono" : "font-sans"} font-medium text-grey-800 underline decoration-grey-300 underline-offset-4 transition-colors hover:decoration-grey-800`}
      href={href}
    >
      {children}
    </a>
  );
}

function ItemAtribusi({ judul, isi, varian }) {
  const anak = Children.toArray(isi.props.children);

  if (varian === "teknologi") {
    const [visual, keterangan, ...sumber] = anak;
    return (
      <article className="grid min-w-0 grid-cols-1 gap-4 py-6 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-start sm:gap-4">
        <div className="font-sans text-sm font-medium text-grey-500">{visual?.props?.children}</div>
        <div className="min-w-0">
          <h4 className="font-serif text-base font-semibold text-grey-800">{judul}</h4>
          <p className="mt-1 font-sans text-base leading-relaxed text-grey-600">{keterangan?.props?.children}</p>
          <p className="mt-3 font-sans text-sm leading-loose text-grey-700">
            {sumber[0]?.props?.children}
          </p>
          <p className="mt-3 font-sans text-base leading-relaxed text-grey-500">
            {sumber[1]?.props?.children}
          </p>
        </div>
      </article>
    );
  }

  const [keterangan, ...sumber] = anak;

  return (
    <article className="grid min-w-0 grid-cols-1 gap-4 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,13rem)] sm:items-start sm:gap-4">
      <div className="min-w-0">
        <h4 className="font-serif text-base font-semibold text-grey-800">{judul}</h4>
        <p className="mt-1 font-sans text-base leading-relaxed text-grey-600">{keterangan?.props?.children}</p>
      </div>
      {sumber.length ? (
        <ul className="m-0 flex min-w-0 max-w-full list-none flex-col gap-1 p-0 text-left font-sans text-sm leading-relaxed text-grey-700 [overflow-wrap:anywhere] sm:text-right">
          {sumber}
        </ul>
      ) : <span />}
    </article>
  );
}

function KelompokAtribusi({ id, penanda, judul, deskripsi, item }) {
  return (
    <section id={id} className="scroll-mt-12 grid grid-cols-1 gap-7 border-t border-grey-800 py-12 sm:py-14 lg:grid-cols-12 lg:gap-12" aria-labelledby={`${id}-judul`}>
      <div className="lg:col-span-4 lg:sticky lg:top-[88px] lg:self-start">
        <div>
          <span className="block font-sans text-xs uppercase tracking-wider text-grey-500">{penanda}</span>
          <h3 id={`${id}-judul`} className="mt-2 font-serif text-xl font-normal tracking-tight text-grey-800">{judul}</h3>
          <p className="mt-2.5 font-sans text-base leading-relaxed text-grey-600">{deskripsi}</p>
        </div>
      </div>
      <div className="divide-y divide-grey-200 border-y border-grey-200 lg:col-span-8">
        {item.map((k) => <ItemAtribusi key={k.judul} judul={k.judul} isi={k.isi} varian={k.varian} />)}
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
          <li>{t("analisa.atribusi.bidakOleh")}</li>
          <li>
            <Tautan href="https://github.com/cburnett/wikipedia-chess" teknis>
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
          <li>{t("analisa.atribusi.pembukaanOleh")}</li>
          <li>
            <Tautan href="https://github.com/lichess-org/chess-openings" teknis>
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
          <li>{t("analisa.atribusi.engineOleh")}</li>
          <li>
            <Tautan href="https://stockfishchess.org/">Stockfish</Tautan> ·{" "}
            <Tautan href="https://github.com/nmrugg/stockfish.js" teknis>
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
          <li>{t("analisa.atribusi.enginePemulaOleh")}</li>
          <li>
            <Tautan href="https://github.com/thomasahle/sunfish" teknis>thomasahle/sunfish</Tautan> ·{" "}
            <Tautan href="https://github.com/foo123/sunfish.js" teknis>foo123/sunfish.js</Tautan>
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
          <li>{t("analisa.atribusi.engineMenengahOleh")}</li>
          <li>
            <Tautan href="https://github.com/CSSLab/maia-platform-frontend" teknis>CSSLab/maia-platform-frontend</Tautan> ·{" "}
            <Tautan href="https://maiachess.com/">maiachess.com</Tautan>
          </li>
          <li>
            <Tautan href="https://www.gnu.org/licenses/gpl-3.0.html">GPL-3.0</Tautan> ·{" "}
            <Tautan href="https://github.com/onnx/onnx" teknis>onnxruntime-web (MIT)</Tautan>
          </li>
        </>
      ),
    },
    {
      judul: t("analisa.atribusi.kode"),
      ikon: null,
      isi: (
        <>
          <li>{t("analisa.atribusi.kodeOleh")}</li>
          <li>
            <Tautan href="https://github.com/wdeloo/Brilliant-Chess" teknis>
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
          <li>{t("analisa.atribusi.desainOleh")}</li>
          <li>
            <Tautan href="https://delta-polder-indonesia.github.io/BintangToba/" teknis>
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
      varian: "teknologi",
      isi: (
        <>
          <li>TECH</li>
          <li>{t("analisa.atribusi.teknologiOleh")}</li>
          <li>
            {TEKNOLOGI.map((k, i) => (
              <span key={k.nama}>
                {i > 0 ? " · " : ""}
                <Tautan href={k.href} teknis={k.teknis}>{k.nama}</Tautan>
              </span>
            ))}
          </li>
          <li>
            Diarsiteki &amp; kolaborasi pengembangan via{" "}
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
          <li>{t("analisa.atribusi.lisensiProyekRingkas")}</li>
          <li>
            <Tautan href="https://github.com/Delta-Polder-Indonesia/ChessClub/blob/main/LICENSE">
              {t("analisa.atribusi.lisensiCek")}
            </Tautan>
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
      <main className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <header className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="font-serif text-2xl font-normal text-grey-800">
              {t("analisa.atribusi.judulDaftar")}
            </h2>
          </div>
          <p className="max-w-2xl font-sans text-base leading-relaxed text-grey-700 lg:col-span-8">
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
              <span className="font-sans text-xs uppercase tracking-wider text-grey-500">
                {t("analisa.atribusi.lisensiProyek")}
              </span>
              <h3 className="mt-2 font-serif text-2xl font-normal text-grey-800">
                {t("analisa.atribusi.labelPenutup")}
              </h3>
              <p className="mt-4 font-sans text-base leading-relaxed text-grey-700 italic">
                {t("analisa.atribusi.lisensiProyekOleh")}
              </p>
              <p className="mt-5 font-sans text-xs text-grey-500">
                © 2025–2026 Delta-Polder-Indonesia (Bintang Toba) · MIT License
              </p>
            </div>

            <div className="border-t border-grey-200 pt-8 lg:col-span-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
              <span className="font-sans text-xs uppercase tracking-wider text-grey-500">
                {t("analisa.atribusi.sosialJudul")}
              </span>
              <p className="mt-3 font-sans text-base leading-relaxed text-grey-700">
                {t("analisa.atribusi.sosialDeskripsi")}
              </p>
              <nav aria-label={t("analisa.atribusi.sosialJudul")} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-grey-200 pt-5">
                {TAUTAN_SOSIAL.map((s) => (
                  <a
                    key={s.nama}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    title={s.nama}
                    aria-label={s.nama}
                    className="font-sans text-sm font-medium text-grey-800 underline decoration-grey-300 underline-offset-4 transition-colors hover:decoration-grey-800"
                  >
                    {s.nama}
                  </a>
                ))}
              </nav>
            </div>

            <div className="border-t border-grey-200 pt-8 lg:col-span-12">
              <h3 className="mt-2 font-serif text-2xl font-normal text-grey-800">
                {t("analisa.atribusi.sanggahanJudul")}
              </h3>
              <p className="mt-3 max-w-4xl font-sans text-base leading-relaxed text-grey-700">
                {t("analisa.atribusi.sanggahan")}
              </p>
            </div>
          </div>
        </section>
      </main>
    </HalamanIsi>
  );
}
