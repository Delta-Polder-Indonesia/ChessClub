/* Bagian atribusi fitur Analisa — ditulis ulang untuk ChessClub (bukan port). */
import PieceSVG from "./svg/piece.jsx";
import { useI18n } from "../../../lib/i18n.jsx";
import { KING, QUEEN, WHITE } from "chess.js";

/**
 * Atribusi aset & kode pihak ketiga yang ikut dipindah.
 *
 * upstream menampilkan ini sebagai halaman terpisah (App Router); di proyek
 * ini ia jadi bagian paling bawah panel pengaturan supaya tetap reachable
 * tanpa menambah rute. Tautan memakai <a> biasa — next/link tidak ada di sini.
 * Gambar aset sengaja tidak dirujuk: berkas megaphone.svg/stockfish.webp tidak
 * ikut disalin, dan uji-gambar akan menuntutnya ada di /public.
 */
function Tautan({ href, children }) {
  return (
    <a target="_blank" rel="noreferrer noopener" className="text-blue-600 hover:underline font-bold" href={href}>
      {children}
    </a>
  );
}

function Bagian({ judul, ikon, isi }) {
  return (
    <section className="bg-backgroundBox p-4 w-full rounded-borderRoundness">
      <h2 className="text-lg font-bold flex flex-row items-center gap-2 mb-3">
        {ikon}
        {judul}
      </h2>
      <ul className="text-sm flex flex-col gap-1">{isi}</ul>
    </section>
  );
}

function Atribusi() {
  const { t } = useI18n();
  const bidak = (
    <div draggable role="img" aria-label={t("analisa.atribusi.bidak")} className="flex flex-row">
      <PieceSVG className="rotate-[-20deg] relative top-1" piece={QUEEN} size={32} color={WHITE} />
      <PieceSVG className="rotate-12 relative bottom-1 right-2" piece={KING} size={32} color={WHITE} />
    </div>
  );

  return (
    <section className="flex flex-col gap-3 p-3">
      <h1 className="block bg-backgroundBoxBox font-bold text-nowrap p-3 text-foreground rounded-borderRoundness">
        {t("analisa.atribusi.judul")}
      </h1>
      <p className="text-xs text-foregroundGrey">{t("analisa.atribusi.pendahuluan")}</p>
      <div className="grid grid-cols-1 gap-3">
        <Bagian
          judul={t("analisa.atribusi.bidak")}
          ikon={bidak}
          isi={
            <>
              <li>{t("analisa.atribusi.bidakOleh")}</li>
              <li>
                <Tautan href="https://github.com/cburnett/wikipedia-chess">cburnett/wikipedia-chess</Tautan>
              </li>
            </>
          }
        />
        <Bagian
          judul={t("analisa.atribusi.pembukaan")}
          ikon={null}
          isi={
            <>
              <li>{t("analisa.atribusi.pembukaanOleh")}</li>
              <li>
                <Tautan href="https://github.com/lichess-org/chess-openings">lichess-org/chess-openings</Tautan>
              </li>
            </>
          }
        />
        <Bagian
          judul={t("analisa.atribusi.engine")}
          ikon={null}
          isi={
            <>
              <li>{t("analisa.atribusi.engineOleh")}</li>
              <li>
                <Tautan href="https://stockfishchess.org/">Stockfish</Tautan> ·{" "}
                <Tautan href="https://github.com/nmrugg/stockfish.js">nmrugg/stockfish.js</Tautan>
              </li>
            </>
          }
        />
        <Bagian
          judul={t("analisa.atribusi.kode")}
          ikon={null}
          isi={
            <>
              <li>{t("analisa.atribusi.kodeOleh")}</li>
              <li>
                <Tautan href="https://github.com/wdeloo/Brilliant-Chess">wdeloo/Brilliant-Chess</Tautan>
              </li>
            </>
          }
        />
      </div>
    </section>
  );
}

export { Atribusi as default };
