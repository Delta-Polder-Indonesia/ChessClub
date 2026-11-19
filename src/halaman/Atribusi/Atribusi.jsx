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
  { nama: "React", href: "https://react.dev/" },
  { nama: "Vite", href: "https://vitejs.dev/" },
  { nama: "Tailwind CSS", href: "https://tailwindcss.com/" },
  { nama: "Stockfish", href: "https://stockfishchess.org/" },
  { nama: "chess.js", href: "https://github.com/jhlywa/chess.js" },
  { nama: "onnxruntime-web", href: "https://onnxruntime.ai/docs/tutorials/web/" },
];

function Tautan({ href, children }) {
  return (
    <a
      target="_blank"
      rel="noreferrer noopener"
      className="font-sans text-slate-800 underline decoration-grey-300 underline-offset-4 transition-colors hover:decoration-slate-800"
      href={href}
    >
      {children}
    </a>
  );
}

function ItemAtribusi({ judul, isi, varian, nomor }) {
  const [keterangan, ...sumber] = Children.toArray(isi.props.children);
  const teknologi = varian === "teknologi";

  return (
    <article className="grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-grey-200 py-6 md:grid-cols-[1.75rem_minmax(0,1.3fr)_minmax(0,1fr)] md:gap-x-8">
      <span className="pt-0.5 font-sans text-sm text-grey-500">{String(nomor).padStart(2, "0")}</span>
      <div className="min-w-0">
        <h4 className="font-serif text-base font-semibold leading-snug text-grey-800">{judul}</h4>
        <p className="mt-1 font-serif text-base leading-relaxed text-grey-600">{keterangan?.props?.children}</p>
        {teknologi && sumber[1] ? (
          <p className="mt-3 font-serif text-sm leading-relaxed text-grey-600">{sumber[1].props?.children}</p>
        ) : null}
      </div>
      <div className="col-start-2 min-w-0 break-words font-sans text-sm leading-relaxed text-grey-700 md:col-start-auto">
        {teknologi
          ? sumber[0]?.props?.children
          : sumber.map((item, i) => <p key={i} className={i ? "mt-1" : undefined}>{item?.props?.children}</p>)}
      </div>
    </article>
  );
}

function KelompokAtribusi({ id, judul, deskripsi, item, nomorAwal }) {
  return (
    <section id={id} className="scroll-mt-12 grid grid-cols-1 gap-7 border-t border-grey-800 py-10 pb-16 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-14" aria-labelledby={`${id}-judul`}>
      <div className="lg:sticky lg:top-[88px] lg:self-start">
        <div>
          <h3 id={`${id}-judul`} className="font-serif text-xl font-semibold leading-snug text-grey-800">{judul}</h3>
          <p className="mt-2 font-serif text-base leading-relaxed text-grey-600">{deskripsi}</p>
        </div>
      </div>
      <div className="border-b border-grey-200">
        {item.map((k, i) => (
          <ItemAtribusi key={k.judul} judul={k.judul} isi={k.isi} varian={k.varian} nomor={nomorAwal + i} />
        ))}
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
          <li>{t("analisa.atribusi.teknologiOleh")}</li>
          <li>
            {TEKNOLOGI.map((k, i) => (
              <span key={k.nama}>
                {i > 0 ? " · " : ""}
                <Tautan href={k.href}>{k.nama}</Tautan>
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

  ];

  const kelompok = [
    {
      id: "kelompok-sumber",
      judul: t("analisa.atribusi.kelompok.sumber.judul"),
      deskripsi: t("analisa.atribusi.kelompok.sumber.deskripsi"),
      item: [kartu[0], kartu[1], kartu[7], kartu[8], kartu[9]],
      nomorAwal: 1,
    },
    {
      id: "kelompok-mesin",
      judul: t("analisa.atribusi.kelompok.mesin.judul"),
      deskripsi: t("analisa.atribusi.kelompok.mesin.deskripsi"),
      item: [kartu[2], kartu[3], kartu[4]],
      nomorAwal: 6,
    },
    {
      id: "kelompok-kode",
      judul: t("analisa.atribusi.kelompok.kode.judul"),
      deskripsi: t("analisa.atribusi.kelompok.kode.deskripsi"),
      item: [kartu[5], kartu[6], kartu[10]],
      nomorAwal: 9,
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
      <main className="w-full bg-paper px-6 pt-16 pb-20 font-serif md:px-8 md:pt-20 md:pb-24">
        <div className="mx-auto max-w-[1080px]">
          <header className="grid grid-cols-1 gap-6 pb-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              <h2 className="font-serif judul-konten font-light text-balance text-grey-800">
                {t("analisa.atribusi.judulDaftar")}
              </h2>
            </div>
            <p className="max-w-2xl font-serif text-base leading-relaxed text-grey-600 lg:pt-1 lg:text-lg">
              {t("analisa.atribusi.penjelasanKatalog")}
            </p>
          </header>

          <div>
            {kelompok.map((grup) => (
              <KelompokAtribusi key={grup.id} {...grup} />
            ))}
          </div>

          <section aria-label={t("analisa.atribusi.lisensiProyek")} className="border-t border-grey-800 pt-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-x-16">
              <div className="min-w-0">
                <h3 className="font-serif text-xl font-semibold leading-snug text-grey-800">
                  {t("analisa.atribusi.lisensiProyek")}
                </h3>
                <p className="mt-3 max-w-[65ch] font-serif text-base leading-relaxed text-grey-800">
                  {t("analisa.atribusi.lisensiProyekOleh")}
                </p>
                <p className="mt-4 font-sans text-sm leading-relaxed text-grey-600">
                  © 2025–2026 Delta-Polder-Indonesia (Bintang Toba) · MIT License
                </p>
                <p className="mt-3 font-sans text-sm">
                  <Tautan href="https://github.com/Delta-Polder-Indonesia/ChessClub/blob/main/LICENSE">
                    {t("analisa.atribusi.lisensiCek")}
                  </Tautan>
                </p>
              </div>

              <div className="min-w-0">
                <h3 className="font-serif text-xl font-semibold leading-snug text-grey-800">
                  {t("analisa.atribusi.sosialJudul")}
                </h3>
                <p className="mt-3 max-w-[65ch] font-serif text-base leading-relaxed text-grey-800">
                  {t("analisa.atribusi.sosialDeskripsi")}
                </p>
                <nav aria-label={t("analisa.atribusi.sosialJudul")} className="mt-6 max-w-[520px] border-t border-grey-200 font-sans text-sm">
                  {TAUTAN_SOSIAL.map((s) => (
                    <a
                      key={s.nama}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex min-h-11 items-center border-b border-grey-200 text-grey-800 transition-colors hover:text-slate-800"
                    >
                      {s.nama}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-4 border-t border-grey-200 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-16">
              <h3 className="font-serif text-xl font-semibold leading-snug text-grey-800">
                {t("analisa.atribusi.sanggahanJudul")}
              </h3>
              <p className="max-w-[75ch] font-serif text-base leading-relaxed text-grey-600">
                {t("analisa.atribusi.sanggahan")}
              </p>
            </div>
          </section>
        </div>
      </main>
    </HalamanIsi>
  );
}
