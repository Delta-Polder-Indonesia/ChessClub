import { useId } from "react";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { DAFTAR_SET } from "../../components/chess/pemuatBidak.js";
import { Switch } from "../../components/ui/switch.jsx";
import { GAYA_KOMENTATOR } from "../../lib/komentator.js";
import { TEMA_PAPAN } from "../TekaTeki/temaPapan.js";
import { PILIHAN_WARNA_PAPAN } from "./bersama/konstanta.js";

const BIDAK_PRATINJAU = ["R", "N", "B", "Q", "K", "P"];

function PratinjauBidak({ set }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-[11.5rem] shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[0.25rem] border border-border bg-[#272727] px-1.5"
    >
      {BIDAK_PRATINJAU.map((bidak) => (
        <ChessPiece key={bidak} piece={bidak} set={set} className="h-6 w-6 object-contain" />
      ))}
    </div>
  );
}

function PratinjauPapan({ tema }) {
  const palet = TEMA_PAPAN[tema] ?? TEMA_PAPAN.metal;
  return (
    <div
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 grid-cols-8 overflow-hidden rounded-[0.25rem] border border-border"
    >
      {Array.from({ length: 64 }, (_, i) => (
        <span
          key={i}
          style={{
            backgroundColor:
              (Math.floor(i / 8) + (i % 8)) % 2 === 0 ? palet.terang : palet.gelap,
          }}
        />
      ))}
    </div>
  );
}

function BarisPilihan({ judul, deskripsi, pratinjau, sejajar = false, children }) {
  if (sejajar) {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-border py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{judul}</p>
          <p className="mt-0.5 text-xs leading-5 text-foregroundGrey">{deskripsi}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pratinjau}
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="border-b border-border py-3">
      <p className="text-sm font-semibold text-foreground">{judul}</p>
      <p className="mt-0.5 text-xs leading-5 text-foregroundGrey">{deskripsi}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {pratinjau}
        {children}
      </div>
    </div>
  );
}

function BarisSakelar({ judul, deskripsi, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{judul}</p>
        <p className="mt-0.5 text-xs leading-5 text-foregroundGrey">{deskripsi}</p>
      </div>
      <Switch
        size="sm"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={judul}
      />
    </div>
  );
}

const KELAS_SELECT =
  "h-10 w-auto max-w-full rounded-borderRoundness border border-border bg-[#272727] px-2 text-sm text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-[#81b64c]";

/**
 * Isi pengaturan papan TANPA bingkai dialog — dipakai LayarPengaturan
 * (sidebar Pengaturan, khusus mode Analisa).
 *
 * @param {object} p
 * @param {string} p.t                 fungsi terjemahan
 * @param {string} p.bidak             id set bidak yang sedang aktif
 * @param {(id: string) => void} p.setBidak  ganti set bidak
 * @param {object} p.kartuKomentator   preferensi komentator
 *        (nyala, setNyala, gaya, setGaya, t)
 */
export function IsiPengaturanPapan({
  t,
  bidak,
  setBidak,
  suaraNyala,
  setSuaraNyala,
  tampilPanahMesin,
  setTampilPanahMesin,
  awanTampilanPenuh,
  setAwanTampilanPenuh,
  bantuanNyala,
  setBantuanNyala,
  warnaPapan,
  setWarnaPapan,
  tampilKoordinat,
  setTampilKoordinat,
  tampilTitikLangkah,
  setTampilTitikLangkah,
  sorotLangkahAkhir,
  setSorotLangkahAkhir,
  promosiOtomatis,
  setPromosiOtomatis,
  kartuKomentator,
}) {
  const idSetBidak = useId();
  const idWarnaPapan = useId();
  const idKoordinat = useId();
  const idKomentator = useId();
  const nilaiKomentator = kartuKomentator.nyala ? kartuKomentator.gaya : "tidak";
  const labelGaya = (g) =>
    t(`papan.komentator.gaya${g.charAt(0).toUpperCase() + g.slice(1)}`);
  return (
    <div className="flex flex-col [&>*:first-child]:pt-0">
      <BarisPilihan
        judul={t("papan.setBidak")}
        deskripsi={t("papan.setBidakDeskripsi")}
        pratinjau={<PratinjauBidak set={bidak} />}
      >
        <select
          id={idSetBidak}
          data-autofokus
          value={bidak}
          onChange={(e) => setBidak(e.target.value)}
          aria-label={t("papan.setBidak")}
          className={KELAS_SELECT}
        >
          {DAFTAR_SET.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </select>
      </BarisPilihan>
      <BarisPilihan
        judul={t("papan.warnaPapan")}
        deskripsi={t("papan.warnaPapanDeskripsi")}
        pratinjau={<PratinjauPapan tema={warnaPapan} />}
      >
        <select
          id={idWarnaPapan}
          value={warnaPapan}
          onChange={(e) => setWarnaPapan(e.target.value)}
          aria-label={t("papan.warnaPapan")}
          className={KELAS_SELECT}
        >
          {PILIHAN_WARNA_PAPAN.map(([nilai, kunci]) => <option key={nilai} value={nilai}>{t(kunci)}</option>)}
        </select>
      </BarisPilihan>
      <BarisPilihan
        judul={t("papan.koordinatPapan")}
        deskripsi={t("papan.koordinatPapanDeskripsi")}
        sejajar
      >
        <select
          id={idKoordinat}
          value={tampilKoordinat}
          onChange={(e) => setTampilKoordinat(e.target.value)}
          aria-label={t("papan.koordinatPapan")}
          className={KELAS_SELECT}
        >
          <option value="tidak">{t("papan.koordinatTidak")}</option>
          <option value="tepi">{t("papan.koordinatTepi")}</option>
          <option value="semua">{t("papan.koordinatSemua")}</option>
        </select>
      </BarisPilihan>
      <BarisSakelar
        judul={t("papan.titikLangkah")}
        deskripsi={t("papan.titikLangkahDeskripsi")}
        checked={tampilTitikLangkah}
        onCheckedChange={setTampilTitikLangkah}
      />
      <BarisSakelar
        judul={t("papan.sorotLangkahAkhir")}
        deskripsi={t("papan.sorotLangkahAkhirDeskripsi")}
        checked={sorotLangkahAkhir}
        onCheckedChange={setSorotLangkahAkhir}
      />
      <BarisSakelar
        judul={t("papan.promosiOtomatis")}
        deskripsi={t("papan.promosiOtomatisDeskripsi")}
        checked={promosiOtomatis}
        onCheckedChange={setPromosiOtomatis}
      />
      <BarisSakelar
        judul={t("papan.suara")}
        deskripsi={t("papan.suaraDeskripsi")}
        checked={suaraNyala}
        onCheckedChange={setSuaraNyala}
      />
      <BarisSakelar
        judul={t("papan.enginePanahToggle")}
        deskripsi={t("papan.enginePanahToggleDeskripsi")}
        checked={tampilPanahMesin}
        onCheckedChange={setTampilPanahMesin}
      />
      <BarisSakelar
        judul={t("papan.bantuanToggle")}
        deskripsi={t("papan.bantuanToggleDeskripsi")}
        checked={bantuanNyala}
        onCheckedChange={setBantuanNyala}
      />
      <BarisSakelar
        judul={t("papan.awanTampilanPenuh")}
        deskripsi={t("papan.awanTampilanPenuhDeskripsi")}
        checked={awanTampilanPenuh}
        onCheckedChange={setAwanTampilanPenuh}
      />
      <BarisPilihan
        judul={t("papan.komentator.judul")}
        deskripsi={t("papan.komentator.bicaraSaatLangkah")}
        sejajar
      >
        <select
          id={idKomentator}
          value={nilaiKomentator}
          onChange={(e) => {
            const nilai = e.target.value;
            if (nilai === "tidak") {
              kartuKomentator.setNyala(false);
              return;
            }
            kartuKomentator.setGaya(nilai);
            kartuKomentator.setNyala(true);
          }}
          aria-label={t("papan.komentator.judul")}
          className={KELAS_SELECT}
        >
          <option value="tidak">{t("papan.komentator.tidakDitampilkan")}</option>
          {GAYA_KOMENTATOR.map((g) => (
            <option key={g} value={g}>
              {labelGaya(g)}
            </option>
          ))}
        </select>
      </BarisPilihan>
    </div>
  );
}
