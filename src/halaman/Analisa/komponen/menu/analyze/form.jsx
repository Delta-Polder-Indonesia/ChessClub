/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useContext, useEffect, useRef, useState } from "react";
import { AnalyzeContext } from "../../../konteks/analyze.jsx";
import Arrow from "../../svg/arrow.jsx";
import Image from "../../Gambar.jsx";
import { useI18n } from "../../../../../lib/i18n.jsx";
import { bacaAngka, bacaTeks, tulis } from "../../../penyimpanan.js";

const ASET = (nama) => `${import.meta.env.BASE_URL}images/analisa/${nama}.svg`;

/** Sumber partai yang bisa dipilih pengguna. "platform" = pakai nama pengguna. */
export const FORMATS = [
  { kunci: "chessCom", ikon: "chesscom", jenis: "platform" },
  { kunci: "lichessOrg", ikon: "lichess", jenis: "platform" },
  { kunci: "pgn", ikon: "pgn", jenis: "tempel" },
  { kunci: "fen", ikon: "json", jenis: "tempel" },
];

/**
 * Kedalaman analisis (ply).
 *
 * upstream menawarkan 15/18/21 dengan Stockfish multi-utas; engine milik
 * situs ini build "single" (satu utas) sehingga 18 ply bisa berarti menit per
 * partai panjang. Tangganya diturunkan dan tetap bisa dipilih pengguna.
 */
export const KEDALAMAN = [
  { kunci: "cepat", ikon: "quick", ply: 10 },
  { kunci: "sedang", ikon: "standard", ply: 13 },
  { kunci: "dalam", ikon: "deep", ply: 16 },
  { kunci: "maksimal", ikon: null, ply: 20 },
];

/* Kunci penyimpanan (awalan "kci-analisa-" ditambahkan oleh penyimpanan.js). */
const KUNCI_FORMAT = "format";
const KUNCI_KEDALAMAN = "kedalaman";

const baca = bacaAngka;
const simpan = tulis;

export default function Form({ setData, selectGame, depth, selected }) {
  const { t } = useI18n();
  const [isSelecting, setSelecting] = useState(false);
  const [value, setValue] = useState("");
  const [selectedIndex, select] = selected;
  const [kedalaman, setKedalaman] = depth;

  const formRef = useRef(null);
  const inputRef = useRef(null);
  const shiftPressed = useRef(false);

  const { data } = useContext(AnalyzeContext);
  const format = FORMATS[selectedIndex] ?? FORMATS[2];
  const platform = format.jenis === "platform";

  /*
   * Tombol tab "analisis baru" menulis ulang data konteks (format fen, kotak
   * kosong) tanpa melewati pemilih ini. Tanpa penjajaran, pemilih masih
   * menunjuk PGN padahal yang terkirim FEN.
   */
  useEffect(() => {
    const indeks = FORMATS.findIndex((f) => f.kunci.toLowerCase() === data?.format);
    if (indeks >= 0 && indeks !== selectedIndex) select(indeks);
  }, [data?.format, selectedIndex, select]);

  /*
   * Pulihkan pilihan sebelumnya — HANYA bila memang ada nilai tersimpan.
   * Versi lama selalu memanggil setKedalaman(), sehingga pilihan yang baru
   * saja diubah pengguna di panel Pengaturan langsung ditimpa kembali ke
   * nilai bawaan begitu tab "Analisis baru" dirender ulang.
   */
  useEffect(() => {
    const tersimpan = baca(KUNCI_KEDALAMAN, null);
    if (tersimpan === null) return;
    const cocok = KEDALAMAN.find((k) => k.ply === tersimpan);
    if (cocok) setKedalaman(cocok.ply);
  }, [setKedalaman]);

  useEffect(() => {
    const indeks = baca(KUNCI_FORMAT, 2);
    if (FORMATS[indeks]) select(indeks);
  }, [select]);

  /* Untuk platform: isi kotak dengan nama pengguna terakhir. */
  useEffect(() => {
    if (!platform) {
      setValue("");
      return;
    }
    try {
      setValue(bacaTeks(format.kunci === "chessCom" ? "chesscom" : "lichessorg", "") ?? "");
    } catch {
      setValue("");
    }
  }, [selectedIndex, format.kunci, platform]);

  function kirim(kejadian) {
    kejadian.preventDefault();
    const nilai = value.trim();

    if (platform) {
      tulis(format.kunci === "chessCom" ? "chesscom" : "lichessorg", nilai);
      if (!nilai) return;
      selectGame(nilai, format.kunci === "chessCom" ? "chessCom" : "lichessOrg");
      return;
    }

    setData({ format: format.kunci.toLowerCase(), string: nilai });
  }

  function gantiFormat(i) {
    select(i);
    setSelecting(false);
    simpan(KUNCI_FORMAT, i);
    inputRef.current?.focus();
  }

  function gantiKedalaman(ply) {
    setKedalaman(ply);
    simpan(KUNCI_KEDALAMAN, ply);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !shiftPressed.current) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
    if (e.key === "Shift") shiftPressed.current = true;
  }

  function onKeyUp(e) {
    if (e.key === "Shift") shiftPressed.current = false;
  }

  const penunjuk = platform
    ? t("analisa.form.namaPengguna", { platform: t(`analisa.format.${format.kunci}`) })
    : t(format.kunci === "pgn" ? "analisa.form.tempelPgn" : "analisa.form.tempelFen");

  return (
    <form ref={formRef} onSubmit={kirim} className="flex flex-col items-center gap-4">
      <textarea
        spellCheck={false}
        rows={1}
        value={value}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onChange={(e) => setValue(e?.currentTarget.value)}
        ref={inputRef}
        placeholder={penunjuk}
        aria-label={penunjuk}
        className="w-[85%] px-2 py-[13px] flex items-center transition-colors text-xl font-bold rounded-borderRoundness border-border hover:border-borderHighlighted focus:border-borderHighlighted border-solid border-[1px] bg-backgroundBoxBox outline-none placeholder:text-sm placeholder:text-placeholder placeholder:font-normal resize-none"
      />
      <p className="w-[85%] text-xs text-foregroundGrey -mt-2">
        {t(platform ? "analisa.form.hint" : format.kunci === "pgn" ? "analisa.form.contohPgn" : "analisa.form.contohFen")}
      </p>
      <div className="w-[85%] flex flex-col gap-2">
        <button
          type="button"
          className="flex flex-row gap-1 items-center justify-center w-full h-14 rounded-borderRoundness text-xl bg-backgroundBoxBox hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted transition-colors font-bold relative"
          onClick={(e) => {
            e.preventDefault();
            setSelecting((prev) => !prev);
          }}
        >
          <Image draggable={false} alt="" src={ASET(format.ikon)} width={28} height={28} />
          {t(`analisa.format.${format.kunci}`)}
          <div className={`absolute h-full right-6 top-0 flex flex-row items-center ${isSelecting ? "" : "rotate-180"}`}>
            <Arrow class="fill-foregroundGrey" />
          </div>
        </button>
        <div className="flex flex-col gap-2" style={{ display: isSelecting ? "" : "none" }}>
          <h6 className="mt-2 font-bold flex flex-row gap-1">
            <Image alt="" src={ASET("formats")} width={18} height={18} />
            {t("analisa.form.judul")}
          </h6>
          <ul className="grid grid-cols-2 gap-3">
            {FORMATS.map((f, i) => (
              <li key={f.kunci}>
                <button
                  type="button"
                  onClick={() => gantiFormat(i)}
                  className={`flex flex-row items-center justify-center gap-1 h-12 w-full hover:text-foregroundHighlighted rounded-borderRoundness text-md bg-backgroundBoxBox hover:bg-backgroundBoxBoxHover transition-colors font-bold border-backgroundBoxBoxHighlighted ${selectedIndex === i ? "border-[2px]" : ""}`}
                >
                  <Image draggable={false} alt="" src={ASET(f.ikon)} width={150} height={0} className="h-6 w-fit" />
                  {t(`analisa.format.${f.kunci}`)}
                </button>
              </li>
            ))}
          </ul>
          <h6 className="mt-2 font-bold flex flex-row gap-2">
            <Image alt="" src={ASET("type")} width={20} height={0} />
            {t("analisa.kedalaman.judul")}
          </h6>
          <ul className="grid grid-cols-4 gap-3">
            {KEDALAMAN.map((k) => (
              <li key={k.kunci}>
                <button
                  title={`${t("analisa.kedalaman.judul")}: ${k.ply}`}
                  type="button"
                  onClick={() => gantiKedalaman(k.ply)}
                  className={`flex flex-row items-center justify-center gap-1 h-10 w-full hover:text-foregroundHighlighted rounded-borderRoundness text-md bg-backgroundBoxBox hover:bg-backgroundBoxBoxHover transition-colors font-bold border-backgroundBoxBoxHighlighted ${kedalaman === k.ply ? "border-[2px]" : ""}`}
                >
                  {k.ikon ? <Image draggable={false} alt="" src={ASET(k.ikon)} width={150} height={0} className="h-5 w-fit" /> : null}
                  {t(`analisa.kedalaman.${k.kunci}`)}
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-foregroundGrey">{t("analisa.kedalaman.petunjuk")}</p>
        </div>
      </div>
      <input
        type="submit"
        className="w-[85%] h-16 cursor-pointer rounded-borderExtraRoundness text-2xl bg-backgroundBoxBoxHighlighted hover:bg-backgroundBoxBoxHighlightedHover transition-all font-extrabold hover:shadow-shadowBoxBoxHighlighted"
        value={platform ? t("analisa.form.daftarPartai") : t("analisa.form.analisa")}
      />
    </form>
  );
}
