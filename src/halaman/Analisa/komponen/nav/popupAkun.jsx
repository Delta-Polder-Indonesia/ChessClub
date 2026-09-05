/*
 * Popup "Tambah akun" — meniru modal Add account en-croissant:
 * dua kartu pilihan situs (Lichess / Chess.com) lalu kolom nama pengguna.
 * Setelah disimpan, Nav memuat seluruh partai akun itu dalam satu tabel.
 */
import { useMemo, useRef, useState } from "react";
import Popup from "./Popup.jsx";
import Gambar from "../Gambar.jsx";
import LichessLogo from "../svg/LichessLogo.jsx";
import ChessComLogo from "../svg/ChessComLogo.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import { bacaTeks, tulis } from "../../penyimpanan.js";

const ASET = (nama) => `${import.meta.env.BASE_URL}images/analisa/${nama}.svg`;

const SITUS = [
  { kunci: "chessCom", ikon: "chesscom", awalan: "chesscom", logo: ChessComLogo, tanpaLabel: true, logoClass: "h-[38px] w-auto fill-current" },
  { kunci: "lichessOrg", ikon: "lichess", awalan: "lichessorg", logo: LichessLogo, tanpaLabel: true, logoClass: "h-[30px] w-auto fill-current" },
];
const MAKS_RIWAYAT = 8;

function KartuSitus({ aktif, logo: Logo, ikon, label, tanpaLabel, logoClass, onClick }) {
  return (
    <button
      type="button"
      data-uji="kartu-situs"
      onClick={onClick}
      aria-pressed={aktif}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-borderRoundness border-2 px-2 py-3 transition-colors ${aktif
        ? "border-backgroundBoxBoxHighlighted bg-backgroundBoxBox text-foreground"
        : "border-border bg-backgroundBoxBox text-foregroundGrey hover:border-borderHighlighted hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"}`}
    >
      {Logo ? (
        <Logo className={logoClass ?? "h-[30px] w-[30px] fill-current"} />
      ) : (
        <Gambar alt="" src={ASET(ikon)} width={30} height={30} />
      )}
      {tanpaLabel ? null : <span className="text-[13px] font-bold">{label}</span>}
    </button>
  );
}

export default function PopupAkun({ onTutup, onTambah, lebarKiri = 0 }) {
  const { t } = useI18n();
  const [kunci, setKunci] = useState("chessCom");
  const [nama, setNama] = useState("");
  const [galat, setGalat] = useState(null);
  const inputRef = useRef(null);

  const situs = SITUS.find((s) => s.kunci === kunci) ?? SITUS[0];
  const riwayat = useMemo(() => {
    const mentah = bacaTeks("riwayat-" + situs.awalan, "");
    return (mentah ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  }, [situs.awalan]);

  function simpan() {
    const bersih = nama.trim();
    if (!bersih) {
      setGalat(t("analisa.akun.wajib"));
      inputRef.current?.focus();
      return;
    }
    tulis(situs.awalan, bersih);
    const lama = riwayat.filter((x) => x.toLowerCase() !== bersih.toLowerCase());
    tulis("riwayat-" + situs.awalan, [bersih, ...lama].slice(0, MAKS_RIWAYAT).join("\n"));
    onTambah(situs.kunci, bersih);
  }

  return (
    <Popup
      judul={t("analisa.akun.judul")}
      subjudul={t("analisa.akun.isi")}
      onTutup={onTutup}
      fullLayar
      lebarKiri={lebarKiri}
      className="max-w-none"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
        {t("analisa.akun.situs")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {SITUS.map((s) => (
          <KartuSitus
            key={s.kunci}
            aktif={kunci === s.kunci}
            ikon={s.ikon}
            logo={s.logo}
            tanpaLabel={s.tanpaLabel}
            logoClass={s.logoClass}
            label={t(`analisa.format.${s.kunci}`)}
            onClick={() => {
              setKunci(s.kunci);
              setGalat(null);
            }}
          />
        ))}
      </div>

      <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
        {t("analisa.akun.nama")}
      </p>
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        list="nav-akun-riwayat"
        value={nama}
        onChange={(e) => {
          setNama(e.currentTarget.value);
          if (galat) setGalat(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            simpan();
          }
        }}
        data-uji="nama-akun"
        placeholder={t(`analisa.format.${situs.kunci}`)}
        aria-label={t("analisa.akun.nama")}
        className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
      />
      <datalist id="nav-akun-riwayat">
        {riwayat.map((namaLama) => (
          <option key={namaLama} value={namaLama} />
        ))}
      </datalist>
      {riwayat.length > 0 ? (
        <p className="mt-1 text-[11px] text-foregroundGrey">{t("analisa.akun.riwayat")}</p>
      ) : null}
      {galat ? <p className="mt-1.5 text-xs text-lossRed">{galat}</p> : null}

      <div className="mt-5 flex flex-row justify-end gap-2">
        <button
          type="button"
          data-uji="tambah-akun"
          onClick={simpan}
          className="cursor-pointer rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-2 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover"
        >
          {t("analisa.akun.tambah")}
        </button>
      </div>
    </Popup>
  );
}
