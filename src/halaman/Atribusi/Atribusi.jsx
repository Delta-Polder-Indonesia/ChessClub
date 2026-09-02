/*
 * Halaman "Atribusi & lisensi" — atribusi fitur Analisa yang dulu menjadi
 * popup panel pengaturan, kini halaman utuh mengikuti tata letak contoh
 * prompt.md (judul besar + kartu grid berdampingan), dengan palet terang
 * korporat situs ini. Tautan memakai <a> biasa — link sheet/eksternal.
 */
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import PieceSVG from "../Analisa/komponen/svg/piece.jsx";
import { KING, QUEEN, WHITE } from "chess.js";

function Tautan({ href, children }) {
  return (
    <a
      target="_blank"
      rel="noreferrer noopener"
      className="text-blue-600 hover:underline font-bold"
      href={href}
    >
      {children}
    </a>
  );
}

function Kartu({ judul, ikon, isi }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 w-full flex flex-col items-center">
      <h2 className="text-2xl font-bold flex flex-row items-center mx-auto mb-8 w-fit gap-2">
        {ikon}
        {judul}
      </h2>
      <ul className="text-sm sm:text-base flex flex-col items-center gap-2 text-center">
        {isi}
      </ul>
    </section>
  );
}

export default function Atribusi() {
  const { t } = useI18n();

  const bidak = (
    <div
      draggable
      role="img"
      aria-label={t("analisa.atribusi.bidak")}
      className="flex flex-row"
    >
      <PieceSVG
        className="rotate-[-20deg] relative top-1"
        piece={QUEEN}
        size={36}
        color={WHITE}
      />
      <PieceSVG
        className="rotate-12 relative bottom-1 right-2"
        piece={KING}
        size={36}
        color={WHITE}
      />
    </div>
  );

  const kartu = [
    {
      judul: t("analisa.atribusi.bidak"),
      ikon: bidak,
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {kartu.map((k) => (
              <Kartu key={k.judul} judul={k.judul} ikon={k.ikon} isi={k.isi} />
            ))}
          </div>
        </div>
      </section>
    </HalamanIsi>
  );
}