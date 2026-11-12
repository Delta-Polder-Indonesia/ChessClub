import { useId } from "react";
import { DAFTAR_SET } from "../../components/chess/pemuatBidak.js";
import { PILIHAN_WARNA_PAPAN } from "./bersama/konstanta.js";
import {
  BarisKomentatorPapan,
  BarisPilihan,
  BarisSakelar,
  KELAS_SELECT,
  PratinjauBidak,
  PratinjauPapan,
} from "./bersama/KontrolPengaturanPapan.jsx";

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
      <BarisKomentatorPapan
        t={t}
        nyala={kartuKomentator.nyala}
        setNyala={kartuKomentator.setNyala}
        gaya={kartuKomentator.gaya}
        setGaya={kartuKomentator.setGaya}
      />
    </div>
  );
}
