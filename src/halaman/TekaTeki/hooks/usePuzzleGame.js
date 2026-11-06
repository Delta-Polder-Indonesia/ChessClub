/**
 * Hook inti permainan Teka-Teki: pemilihan petak, validasi langkah, promosi,
 * balasan lawan, dan penuntasan soal.
 *
 * Seluruh keputusan keadaan berada di `reduksiPapan` (murni). Hook ini hanya
 * menjalankan efek samping yang menyertainya — bunyi, pesan, timer — sehingga
 * logika permainan tidak lagi bercampur dengan markup halaman.
 */
import { useCallback, useEffect, useReducer, useRef } from "react";
import { Chess } from "chess.js";
import {
  apakahLangkahLegal,
  apakahLangkahSesuai,
  apakahSkakmat,
  butuhPromosi,
  parseLangkah,
  terapkan,
} from "../../../lib/tekaTeki.js";
import { faktaLangkah } from "../../../lib/komentator.js";
import { SUARA } from "../../../lib/suara.js";
import {
  KEADAAN_AWAL,
  langkahSolusi,
  reduksiPapan,
} from "../reducers/tekaTekiReducer.js";
import { useCallbackTerbaru } from "./useCallbackTerbaru.js";

const JEDA_LAWAN_MS = 700;
const JEDA_SALAH_MS = 700;
const JEDA_OTOMATIS_MS = 3000;

/** Fakta langkah (untuk komentator) dari koordinat asal/tujuan. */
export function faktaDariKoordinat(fen, from, to, promo) {
  try {
    const g = terapkan(fen, { from, to, promo });
    const san = g.history({ verbose: true }).slice(-1)[0]?.san;
    return san ? faktaLangkah(fen, san) : null;
  } catch {
    return null;
  }
}

/**
 * @param {object} opsi
 * @param {object|null} opsi.masalah soal aktif
 * @param {object} opsi.aksiSideEffect `{ bunyikan, bunyikanLangkah, setPesan, catatTerpecahkan, otomatis, pindahSoal, t }`
 */
export function usePuzzleGame({
  masalah,
  bunyikan,
  bunyikanLangkah,
  setPesan,
  catatTerpecahkan,
  otomatis,
  pindahSoal,
  t,
  indeks,
  hapusTanda,
}) {
  const [kondisi, dispatch] = useReducer(reduksiPapan, KEADAAN_AWAL);
  const timerSalah = useRef(null);
  const timerOtomatis = useRef(null);
  const timerSuara = useRef([]);

  const { fen, sisa, komputer, selesai, promosi, terpilih, sasaran, orientasi } = kondisi;
  const langkahPenuh = langkahSolusi(masalah);

  /* ------------------------------------------------------------- bersihkan */

  useEffect(
    () => () => {
      window.clearTimeout(timerSalah.current);
      window.clearTimeout(timerOtomatis.current);
      timerSuara.current.forEach((id) => window.clearTimeout(id));
      timerSuara.current = [];
    },
    []
  );

  const jadwalkanSuara = useCallback((ms, fn) => {
    const id = window.setTimeout(() => {
      timerSuara.current = timerSuara.current.filter((lain) => lain !== id);
      fn();
    }, ms);
    timerSuara.current.push(id);
  }, []);

  /* ---------------------------------------------------------------- aksi */

  const hapusTandaRef = useCallbackTerbaru(hapusTanda);

  /**
   * Pasang satu soal ke papan. `pertahankanSelesai` dipakai mode tinjau setelah
   * soal tuntas: papan kembali ke posisi awal, tetapi status selesai beserta
   * pesan tuntas dibiarkan supaya tombol maju & video tetap aktif.
   */
  const pasangSoal = useCallback(
    (soalBaru, { pertahankanSelesai = false } = {}) => {
      window.clearTimeout(timerSalah.current);
      window.clearTimeout(timerOtomatis.current);
      dispatch({ type: "PASANG_SOAL", soal: soalBaru, pertahankanSelesai });
      if (!pertahankanSelesai) setPesan(null);
      // Tanda bantu pemain tidak boleh menyeberang ke soal berikutnya.
      hapusTandaRef.current?.();
    },
    [hapusTandaRef, setPesan]
  );

  /** Batalkan lanjut-otomatis yang sudah dijadwalkan (dipakai navigasi tinjau). */
  const batalkanOtomatis = useCallback(() => {
    window.clearTimeout(timerOtomatis.current);
  }, []);

  const pilihPetak = useCallback(
    (petak) => {
      if (!masalah || komputer || selesai || !fen) return;
      const game = new Chess(fen);
      const bidak = game.get(petak);
      if (bidak && bidak.color === game.turn()) {
        const tujuan = game.moves({ square: petak, verbose: true }).map((m) => m.to);
        dispatch({ type: "PILIH_PETAK", petak, sasaran: tujuan });
      } else {
        dispatch({ type: "BERSIHKAN_PILIHAN" });
      }
    },
    [masalah, komputer, selesai, fen]
  );

  const cobaLangkah = useCallback(
    (from, to, promo) => {
      if (!sisa.length) return;
      const diharapkan = parseLangkah(sisa[0]);
      const promosiDiminta = butuhPromosi(fen, from, to);
      const langkahLegal = apakahLangkahLegal(fen, from, to);

      // Bidak sampai baris terakhir → pemain wajib memilih bidak promosi.
      if (promosiDiminta.butuh && langkahLegal && !promo) {
        dispatch({ type: "BUKA_PROMOSI", promosi: { from, to, warna: promosiDiminta.warna } });
        return;
      }

      let lanjut = null;
      if (apakahLangkahSesuai(from, to, promo, diharapkan)) {
        try {
          lanjut = terapkan(fen, { from, to, promo: diharapkan.promo || promo });
        } catch {
          /* langkah ilegal — lanjut tetap null */
        }
      }

      if (!lanjut) {
        window.clearTimeout(timerSalah.current);
        bunyikan(langkahLegal ? SUARA.tekaTekiSalah : SUARA.ilegal);

        /*
         * Skakmat alternatif: mate lain yang sah, bukan langkah di data.
         * Penilaian tetap ketat (harus persis solusi), tetapi pesannya
         * dibedakan supaya tidak menyesatkan.
         */
        const mateAlternatif =
          langkahLegal && sisa.length === 1 && apakahSkakmat(fen, { from, to, promo });
        setPesan({
          jenis: "salah",
          teks: t(mateAlternatif ? "tekaTeki.mateAlternatif" : "tekaTeki.salah"),
          /*
           * Nomor urut: wilayah `aria-live` hanya membacakan perubahan teks,
           * sehingga dua langkah salah berturut-turut dengan kalimat yang sama
           * tidak akan diumumkan dua kali tanpa penanda ini (dipakai sebagai
           * `key` simpul teks di StatusTekaTeki).
           */
          urut: Date.now(),
        });
        dispatch({
          type: "LANGKAH_SALAH",
          petak: { from, to },
          komentar: {
            tahap: "salah",
            legal: langkahLegal,
            fakta: langkahLegal ? faktaDariKoordinat(fen, from, to, promo) : null,
            sisa: Math.ceil(sisa.length / 2),
            fen,
          },
        });
        timerSalah.current = window.setTimeout(
          () => dispatch({ type: "HAPUS_KESALAHAN" }),
          JEDA_SALAH_MS
        );
        return;
      }

      const sisaBaru = sisa.slice(1);
      const langkahPemain = lanjut.history({ verbose: true }).slice(-1)[0];
      dispatch({
        type: "LANGKAH_BENAR",
        permainan: lanjut,
        langkah: { from, to },
        sisaBaru,
        fakta: faktaLangkah(fen, langkahPemain.san),
        sisaPemain: Math.ceil(sisaBaru.length / 2),
      });

      if (sisaBaru.length === 0) {
        bunyikanLangkah(langkahPemain, lanjut);
        jadwalkanSuara(220, () => bunyikan(SUARA.tekaTekiTuntas));
        setPesan({
          jenis: "selesai",
          teks: t(lanjut.isCheckmate() ? "tekaTeki.terpecahkan" : "tekaTeki.taktikTerpecahkan"),
        });
        if (masalah) catatTerpecahkan(masalah.problemid);
        if (otomatis) {
          window.clearTimeout(timerOtomatis.current);
          timerOtomatis.current = window.setTimeout(
            () => pindahSoal(indeks + 1),
            JEDA_OTOMATIS_MS
          );
        }
      } else {
        bunyikanLangkah(langkahPemain, lanjut);
        jadwalkanSuara(150, () => bunyikan(SUARA.tekaTekiBenar));
        setPesan({ jenis: "benar", teks: t("tekaTeki.benar") });
      }
    },
    [
      sisa,
      fen,
      bunyikan,
      bunyikanLangkah,
      setPesan,
      t,
      otomatis,
      masalah,
      catatTerpecahkan,
      pindahSoal,
      indeks,
      jadwalkanSuara,
    ]
  );

  const klikPetak = useCallback(
    (petak, { abaikanKlik = false, batalkanAbaikanKlik } = {}) => {
      if (abaikanKlik) {
        batalkanAbaikanKlik?.();
        return;
      }
      if (!masalah || !fen || komputer) return;
      if (!selesai && terpilih && sasaran.includes(petak)) {
        cobaLangkah(terpilih, petak);
        return;
      }
      if (!selesai && terpilih === petak) {
        dispatch({ type: "BERSIHKAN_PILIHAN" });
        return;
      }
      if (!selesai) {
        const game = new Chess(fen);
        const bidak = game.get(petak);
        if (bidak && bidak.color === game.turn()) {
          pilihPetak(petak);
          return;
        }
      }
      dispatch({ type: "BERSIHKAN_PILIHAN" });
    },
    [masalah, fen, komputer, selesai, terpilih, sasaran, cobaLangkah, pilihPetak]
  );

  const pilihPromosi = useCallback(
    (bidakPromosi) => {
      if (!promosi) return;
      const { from, to } = promosi;
      dispatch({ type: "BATAL_PROMOSI" });
      cobaLangkah(from, to, bidakPromosi);
    },
    [promosi, cobaLangkah]
  );

  const batalPromosi = useCallback(() => dispatch({ type: "BATAL_PROMOSI" }), []);

  const tampilPetunjuk = useCallback(() => {
    if (!sisa.length || selesai || komputer || promosi) return;
    window.clearTimeout(timerOtomatis.current);
    const d = parseLangkah(sisa[0]);
    let bidak = null;
    try {
      bidak = new Chess(fen).get(d.from)?.type || null;
    } catch {
      /* fen tidak sah — bidak tetap null */
    }
    dispatch({
      type: "TAMPILKAN_PETUNJUK",
      petunjuk: { from: d.from, to: d.to },
      petunjukKomentar: { ...d, bidak },
    });
  }, [sisa, selesai, komputer, promosi, fen]);

  /* Tangkap Escape selama dialog promosi terbuka (dipindah ke dialognya di
   * komponen PromotionDialog; di sini hanya disediakan aksinya). */

  const setOrientasi = useCallback(
    (fn) =>
      dispatch({
        type: "ORIENTASI",
        orientasi: typeof fn === "function" ? fn(orientasi) : fn,
      }),
    [orientasi]
  );

  /* --------------------------------------------------- balasan lawan */

  const masalahRef = useLatest(masalah);

  useEffect(() => {
    if (!komputer || selesai || !sisa.length) return undefined;
    const timer = window.setTimeout(() => {
      const diharapkan = parseLangkah(sisa[0]);
      try {
        const g = terapkan(fen, diharapkan);
        const langkahLawan = g.history({ verbose: true }).slice(-1)[0];
        bunyikanLangkah(langkahLawan, g, { lawan: true });
        dispatch({
          type: "LANGKAH_LAWAN",
          permainan: g,
          balasan: { from: diharapkan.from, to: diharapkan.to },
          fakta: faktaLangkah(fen, langkahLawan.san),
          // PEMAIN berikutnya bergerak setelah balasan ini.
          sisaPemain: Math.ceil((sisa.length - 1) / 2),
        });
        setPesan(null);
      } catch {
        // Posisi dan barisan harus selalu sinkron bila data tak dapat diterapkan.
        // Data rusak: pasang ulang soal yang sama agar papan & barisan tetap
        // sinkron (perilaku lama), bukan membiarkan papan menggantung.
        const soalAktif = masalahRef.current;
        if (!soalAktif) return;
        pasangSoal(soalAktif);
      }
    }, JEDA_LAWAN_MS);
    return () => window.clearTimeout(timer);
  }, [komputer, selesai, sisa, fen, bunyikanLangkah, setPesan, masalahRef, pasangSoal]);

  return {
    // keadaan
    kondisi,
    dispatch,
    langkahPenuh,
    orientasi,
    // aksi
    pasangSoal,
    pilihPetak,
    klikPetak,
    cobaLangkah,
    pilihPromosi,
    batalPromosi,
    tampilPetunjuk,
    batalkanOtomatis,
    setOrientasi,
    // info turunan
    bisaHint: !selesai && !komputer && !promosi && sisa.length > 0,
  };
}

/** Ref nilai terbaru tanpa menulis ref saat render. */
function useLatest(nilai) {
  const ref = useRef(nilai);
  useEffect(() => {
    ref.current = nilai;
  }, [nilai]);
  return ref;
}
