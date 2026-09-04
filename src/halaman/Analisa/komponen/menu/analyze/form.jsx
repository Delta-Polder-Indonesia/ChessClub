/*
 * Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa
 * cek README.
 *
 * Penyesuaian lokal (gaya en-croissant, sesuai permintaan pengguna):
 *  - Pemilih sumber disusun seperti modal "Import game" en-croissant: satu
 *    baris kartu pilihan (Akun / PGN / FEN) dengan tepi aksen saat aktif;
 *    isinya berganti di bawahnya. Untuk Akun, pemilihan situs memakai kartu
 *    logo Chess.com & Lichess seperti modal "Add account" en-croissant,
 *    lengkap dengan nama pengguna + saran riwayat + validasi.
 *  - PGN memakai area tempel besar; FEN memakai kotak satu baris dengan
 *    galat validasi inline (merah) sebelum dikirim ke engine, meniru
 *    perilaku TextInput FEN en-croissant.
 *  - Kedalaman analisis tetap tersedia (dipakai panel Pengaturan juga).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "../../Gambar.jsx";
import Lens from "../../svg/lens.jsx";
import { useI18n } from "../../../../../lib/i18n.jsx";
import { bacaAngka, bacaTeks, tulis } from "../../../penyimpanan.js";
import { Chess } from "chess.js";

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
const KUNCI_SUMBER = "sumber";
const KUNCI_SUMBER_PLATFORM = "sumber-platform";
const KUNCI_KEDALAMAN = "kedalaman";
const AWALAN_RIWAYAT = "riwayat-";
const MAKS_RIWAYAT = 8;

/** Kategori sumber. "akun" punya sub-pilihan situs (Chess.com/Lichess). */
const SUMBER = [
  { kunci: "akun", ikon: "formats" },
  { kunci: "pgn", ikon: "pgn" },
  { kunci: "fen", ikon: "json" },
];
/** Situs untuk kategori "akun" — urutan sama dengan FORMATS[0..1]. */
const PLATFORM = [
  { kunci: "chessCom", ikon: "chesscom", indeks: 0 },
  { kunci: "lichessOrg", ikon: "lichess", indeks: 1 },
];

const baca = bacaAngka;
const simpan = tulis;

/** Baca daftar nama pengguna yang pernah dipakai untuk satu situs. */
function bacaRiwayat(awalan) {
  const mentah = bacaTeks(AWALAN_RIWAYAT + awalan, "");
  return (mentah ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
}
/** Simpan nama pengguna terbaru di urutan teratas (maks MAKS_RIWAYAT). */
function simpanRiwayat(awalan, nama) {
  const lama = bacaRiwayat(awalan).filter((x) => x.toLowerCase() !== nama.toLowerCase());
  simpan(AWALAN_RIWAYAT + awalan, [nama, ...lama].slice(0, MAKS_RIWAYAT).join("\n"));
}

/**
 * Kartu pilihan ala GenericCard en-croissant: kotak dengan tepi 2px;
 * saat dipilih tepinya memakai aksen hijau situs ini (+ hover ringan).
 */
function KartuPilih({ aktif, onClick, dataUji, children, className = "" }) {
  return (
    <button
      type="button"
      data-uji={dataUji}
      aria-pressed={aktif}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-borderRoundness border-2 px-2 py-3 text-sm font-bold transition-colors cursor-pointer select-none ${aktif
        ? "border-backgroundBoxBoxHighlighted bg-backgroundBoxBox text-foreground"
        : "border-border bg-backgroundBoxBox text-foregroundGrey hover:border-borderHighlighted hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"} ${className}`}
    >
      {children}
    </button>
  );
}

export default function Form({ setData, selectGame, depth, selected: _selected }) {
  const { t } = useI18n();
  const [sumber, setSumber] = useState(() => {
    const tersimpan = bacaTeks(KUNCI_SUMBER, null);
    return SUMBER.some((s) => s.kunci === tersimpan) ? tersimpan : "pgn";
  });
  const [platformKunci, setPlatformKunci] = useState(() => {
    const tersimpan = bacaTeks(KUNCI_SUMBER_PLATFORM, null);
    return PLATFORM.some((p) => p.kunci === tersimpan) ? tersimpan : "chessCom";
  });
  const [kedalaman, setKedalaman] = depth;

  const [namaAkun, setNamaAkun] = useState("");
  const [pgn, setPgn] = useState("");
  const [fen, setFen] = useState("");
  const [galatNama, setGalatNama] = useState(null);
  const [galatFen, setGalatFen] = useState(null);

  const formRef = useRef(null);
  const inputAkunRef = useRef(null);
  const shiftPressed = useRef(false);

  const platform = PLATFORM.find((p) => p.kunci === platformKunci) ?? PLATFORM[0];
  const situs = platform.ikon;
  const riwayat = useMemo(
    () => bacaRiwayat(platformKunci === "chessCom" ? "chesscom" : "lichessorg"),
    [platformKunci]
  );

  /* Pulihkan kedalaman tersimpan — HANYA bila memang ada nilai tersimpan. */
  useEffect(() => {
    const tersimpan = baca(KUNCI_KEDALAMAN, null);
    if (tersimpan === null) return;
    const cocok = KEDALAMAN.find((k) => k.ply === tersimpan);
    if (cocok) setKedalaman(cocok.ply);
  }, [setKedalaman]);

  /* Saat situs akun berganti, isi nama dengan nama terakhir untuk situs itu. */
  useEffect(() => {
    if (sumber !== "akun") return;
    try {
      const tersimpan = bacaTeks(platformKunci === "chessCom" ? "chesscom" : "lichessorg", "") ?? "";
      setNamaAkun(tersimpan);
      setGalatNama(null);
    } catch {
      setNamaAkun("");
    }
  }, [sumber, platformKunci]);

  function gantiSumber(kunci) {
    setSumber(kunci);
    setGalatNama(null);
    setGalatFen(null);
    simpan(KUNCI_SUMBER, kunci);
  }

  function gantiSitus(kunci) {
    setPlatformKunci(kunci);
    simpan(KUNCI_SUMBER_PLATFORM, kunci);
  }

  function gantiKedalaman(ply) {
    setKedalaman(ply);
    simpan(KUNCI_KEDALAMAN, ply);
  }

  function kirimAkun(kejadian) {
    kejadian?.preventDefault();
    const nilai = namaAkun.trim();
    if (!nilai) {
      setGalatNama(t("analisa.form.wajibNama"));
      inputAkunRef.current?.focus();
      return;
    }
    const awalan = platformKunci === "chessCom" ? "chesscom" : "lichessorg";
    tulis(awalan, nilai);
    simpanRiwayat(awalan, nilai);
    selectGame(nilai, platformKunci);
  }

  function kirimTempel(kejadian, kunci) {
    kejadian?.preventDefault();
    if (kunci === "pgn") {
      setData({ format: "pgn", string: pgn });
      return;
    }
    const nilaiFen = fen.trim();
    if (nilaiFen) {
      try {
        // eslint-disable-next-line no-new
        new Chess(nilaiFen);
      } catch {
        setGalatFen(t("analisa.galat.fenJudul"));
        return;
      }
    }
    setGalatFen(null);
    setData({ format: "fen", string: nilaiFen });
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !shiftPressed.current) {
      // PGN bebas memakai Enter untuk baris baru; akun & FEN kirim langsung.
      if (sumber === "akun" || sumber === "fen") {
        e.preventDefault();
        e.currentTarget.form?.requestSubmit();
      }
    }
    if (e.key === "Shift") shiftPressed.current = true;
  }

  function onKeyUp(e) {
    if (e.key === "Shift") shiftPressed.current = false;
  }

  const ikonKategori = (kunci) => {
    if (kunci === "akun") {
      return (
        <span className="flex flex-row items-center gap-1">
          <Image alt="" src={ASET("chesscom")} width={22} height={22} />
          <Image alt="" src={ASET("lichess")} width={22} height={22} />
        </span>
      );
    }
    const ikon = SUMBER.find((s) => s.kunci === kunci)?.ikon;
    return ikon ? <Image alt="" src={ASET(ikon)} width={26} height={26} /> : null;
  };
  const labelKategori = (kunci) => t(kunci === "akun" ? "analisa.form.dariAkun" : `analisa.format.${kunci}`);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Baris kartu sumber — gaya modal Import en-croissant */}
      <div className="w-[88%]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
          {t("analisa.form.judul")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SUMBER.map((s) => (
            <KartuPilih
              key={s.kunci}
              aktif={sumber === s.kunci}
              onClick={() => gantiSumber(s.kunci)}
              dataUji={`kategori-${s.kunci}`}
            >
              {ikonKategori(s.kunci)}
              <span>{labelKategori(s.kunci)}</span>
            </KartuPilih>
          ))}
        </div>
        {sumber === "akun" ? (
          <p className="mt-1.5 text-center text-[11px] leading-4 text-foregroundGrey">
            {t("analisa.form.dariAkunIsi")}
          </p>
        ) : (
          <p className="mt-1.5 text-center text-[11px] leading-4 text-foregroundGrey">
            {t(sumber === "pgn" ? "analisa.form.hintPgn" : "analisa.form.hintFen")}
          </p>
        )}
      </div>

      {/* Isian — berganti sesuai sumber */}
      <div className="w-[88%] rounded-borderRoundness border border-border bg-backgroundBoxDarker p-3.5">
        {sumber === "akun" ? (
          <form ref={formRef} onSubmit={kirimAkun} className="flex flex-col gap-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                {t("analisa.form.situs")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORM.map((p) => (
                  <KartuPilih
                    key={p.kunci}
                    aktif={platformKunci === p.kunci}
                    onClick={() => gantiSitus(p.kunci)}
                    dataUji={`pilih-${p.kunci === "chessCom" ? "chesscom" : "lichess"}`}
                    className="!py-2.5"
                  >
                    <Image alt="" src={ASET(p.ikon)} width={26} height={26} />
                    <span className="text-[13px]">{t(`analisa.format.${p.kunci}`)}</span>
                  </KartuPilih>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                {t("analisa.form.namaPenggunaLabel")}
              </p>
              <input
                ref={inputAkunRef}
                type="text"
                autoComplete="off"
                list={`daftar-${situs}`}
                value={namaAkun}
                onChange={(e) => {
                  setNamaAkun(e.currentTarget.value);
                  if (galatNama) setGalatNama(null);
                }}
                onKeyDown={onKeyDown}
                onKeyUp={onKeyUp}
                data-uji="nama-akun"
                placeholder={t("analisa.form.namaPengguna", { platform: t(`analisa.format.${platformKunci}`) })}
                aria-label={t("analisa.form.namaPenggunaLabel")}
                className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
              />
              <datalist id={`daftar-${situs}`}>
                {riwayat.map((nama) => (
                  <option key={nama} value={nama} />
                ))}
              </datalist>
              {galatNama ? (
                <p data-uji="galat-akun" className="mt-1.5 text-xs text-lossRed">{galatNama}</p>
              ) : null}
              <p className="mt-1.5 text-[11px] leading-4 text-foregroundGrey">
                {t("analisa.form.hintAkun")}
              </p>
            </div>

            <button
              type="submit"
              data-uji="tombol-akun"
              aria-label={t("analisa.form.daftarPartai")}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-borderExtraRoundness bg-backgroundBoxBoxHighlighted font-extrabold text-foregroundBlackDark transition-all hover:bg-backgroundBoxBoxHighlightedHover hover:shadow-shadowBoxBoxHighlighted"
            >
              <Lens class="fill-foregroundBlackDark" size={20} />
              {t("analisa.form.daftarPartai")}
            </button>
          </form>
        ) : sumber === "pgn" ? (
          <form
            onSubmit={(e) => kirimTempel(e, "pgn")}
            className="flex flex-col gap-3"
          >
            <label className="text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
              {t("analisa.format.pgn")}
            </label>
            <textarea
              spellCheck={false}
              rows={8}
              value={pgn}
              onChange={(e) => setPgn(e.currentTarget.value)}
              data-uji="isi-pgn"
              placeholder={t("analisa.form.tempelPgn")}
              aria-label={t("analisa.format.pgn")}
              className="resize-y rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
            />
            <p className="text-[11px] leading-4 text-foregroundGrey">
              {t("analisa.form.contohPgn")}
            </p>
            <button
              type="submit"
              data-uji="tombol-analisis"
              aria-label={t("analisa.form.analisa")}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-borderExtraRoundness bg-backgroundBoxBoxHighlighted font-extrabold text-foregroundBlackDark transition-all hover:bg-backgroundBoxBoxHighlightedHover hover:shadow-shadowBoxBoxHighlighted"
            >
              <Lens class="fill-foregroundBlackDark" size={20} />
              {t("analisa.form.analisa")}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => kirimTempel(e, "fen")} className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
              {t("analisa.format.fen")}
            </label>
            <textarea
              spellCheck={false}
              rows={2}
              value={fen}
              onChange={(e) => {
                setFen(e.currentTarget.value);
                if (galatFen) setGalatFen(null);
              }}
              onKeyDown={onKeyDown}
              data-uji="isi-fen"
              placeholder={t("analisa.form.tempelFen")}
              aria-label={t("analisa.format.fen")}
              className="resize-none rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
            />
            {galatFen ? (
              <p data-uji="galat-fen" className="text-xs text-lossRed">{galatFen}</p>
            ) : (
              <p className="text-[11px] leading-4 text-foregroundGrey">
                {t("analisa.form.contohFen")}
              </p>
            )}
            <button
              type="submit"
              data-uji="tombol-analisis"
              aria-label={t("analisa.form.analisa")}
              className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-borderExtraRoundness bg-backgroundBoxBoxHighlighted font-extrabold text-foregroundBlackDark transition-all hover:bg-backgroundBoxBoxHighlightedHover hover:shadow-shadowBoxBoxHighlighted"
            >
              <Lens class="fill-foregroundBlackDark" size={20} />
              {t("analisa.form.analisa")}
            </button>
          </form>
        )}
      </div>

      {/* Kedalaman analisis — tetap dipakai panel Pengaturan juga */}
      <div className="w-[88%]">
        <div className="flex flex-col gap-2">
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
            {t("analisa.kedalaman.judul")}
          </p>
          <ul className="grid grid-cols-4 gap-2">
            {KEDALAMAN.map((k) => (
              <li key={k.kunci}>
                <button
                  title={`${t("analisa.kedalaman.judul")}: ${k.ply}`}
                  type="button"
                  onClick={() => gantiKedalaman(k.ply)}
                  aria-pressed={kedalaman === k.ply}
                  data-uji={`kedalaman-${k.kunci}`}
                  className={`flex h-9 w-full cursor-pointer flex-row items-center justify-center gap-1 rounded-borderRoundness text-xs font-bold transition-colors ${kedalaman === k.ply
                    ? "border-[2px] border-backgroundBoxBoxHighlighted bg-backgroundBoxBox text-foreground"
                    : "border border-border bg-backgroundBoxBox text-foregroundGrey hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"}`}
                >
                  {k.ikon ? (
                    <Image draggable={false} alt="" src={ASET(k.ikon)} width={80} height={0} className="h-4 w-fit" />
                  ) : null}
                  {t(`analisa.kedalaman.${k.kunci}`)}
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[11px] leading-4 text-foregroundGrey">{t("analisa.kedalaman.petunjuk")}</p>
        </div>
      </div>
    </div>
  );
}
