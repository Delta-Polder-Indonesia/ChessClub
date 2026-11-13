/**
 * "Teka-teki Hari Ini" — pemikat yang BISA DIMAINKAN di halaman Landing.
 *
 * Tiga aturan produk yang disengaja:
 *
 * 1. SUMBER DATA = ARSIP LOKAL. Widget membaca
 *    `data/teka-teki-harian/terbaru.json` (snapshot statis buatan
 *    `scripts/ambil-teka-teki-harian.mjs`), BUKAN API Chess.com. Halaman depan
 *    jadi tetap cepat dan tetap hidup walau pihak ketiga sedang gangguan.
 *    Halaman penuh `/teka-teki-harian` justru memakai API supaya selalu
 *    menampilkan soal terbaru; keduanya sengaja berbeda peran.
 *
 * 2. BISA DIMAINKAN, bukan gambar mati. Pengunjung langsung mencoba langkah,
 *    lawan membalas otomatis, dan ada tombol petunjuk — inilah alasan orang
 *    tinggal lebih lama setelah membaca hero.
 *
 * 3. DIBATASI 5 SOAL PER HARI. Kolom kiri menampilkan progres bergaya
 *    worldchess.com (judul penyemangat, cincin "0 dari 5", track jatah),
 *    semuanya lewat kamus i18n. Setelah soal kelima selesai, muncul dialog
 *    ajakan bergabung ke Blunder Skuad. Hitungannya disimpan per tanggal di
 *    localStorage supaya memuat ulang halaman tidak menambah jatah. Pemain
 *    yang ingin lanjut tanpa bergabung tetap bisa membuka halaman penuh.
 *
 * Komponen ini dimuat lazy dari `Landing.jsx`: papan interaktif (`PapanTekaTeki`
 * + chunk bidak ±126 KB) tidak diperlukan untuk elemen LCP halaman depan.
 *
 * Tipografi mengikuti `./gayaTeks.jsx` seperti seksi Landing lain; papannya
 * sendiri tetap milik domain catur (DESIGN.md §13).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import KerangkaTekaTekiHarian from "./KerangkaTekaTekiHarian.jsx";
import { Chess } from "chess.js";
import { useI18n } from "../../lib/i18n.jsx";
import { Tombol } from "../../components/Tombol.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";
import CincinKemajuan from "../../components/CincinKemajuan.jsx";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog.jsx";
import {
  apakahLangkahLegal,
  apakahLangkahSesuai,
  butuhPromosi,
  parseLangkah,
  terapkan,
} from "../../lib/tekaTeki.js";
import {
  ambilSoalTerbaru,
  tanggalHariIni,
  warnaGiliran,
} from "../../lib/tekaTekiHarian.js";

const RUTE_HARIAN = "/teka-teki-harian";
const RUTE_GABUNG = "/pendaftaran-anggota";

/** Jatah soal yang boleh dimainkan di halaman depan, per hari. */
const BATAS_HARIAN = 5;
/** Jeda sebelum soal berikutnya dipasang (ms) — cukup untuk melihat hasilnya. */
const JEDA_BERIKUT = 900;
/** Jeda balasan lawan (ms) — cukup untuk melihat bidak mendarat. */
const JEDA_LAWAN = 450;
/** Jeda kilat tanda langkah salah (ms). */
const JEDA_SALAH = 700;
/** Kunci localStorage progres harian (`{ tanggal, selesai }`). */
const KUNCI_PROGRES = "kci-harian-landing";

const PILIHAN_PROMOSI = [
  ["q", "tekaTekiHarian.promosiMenteri"],
  ["r", "tekaTekiHarian.promosiBenteng"],
  ["b", "tekaTekiHarian.promosiGajah"],
  ["n", "tekaTekiHarian.promosiKuda"],
];

/**
 * Progres hari ini dari localStorage — selalu berbentuk objek yang aman,
 * walau penyimpanan kosong, rusak, atau bertanggal kemarin.
 */
function bacaProgres(hariIni) {
  try {
    const mentah = JSON.parse(localStorage.getItem(KUNCI_PROGRES) || "{}");
    if (!mentah || typeof mentah !== "object" || Array.isArray(mentah)) {
      return { tanggal: hariIni, selesai: 0 };
    }
    if (mentah.tanggal !== hariIni) return { tanggal: hariIni, selesai: 0 };
    const selesai = Number(mentah.selesai);
    return {
      tanggal: hariIni,
      selesai: Number.isFinite(selesai)
        ? Math.max(0, Math.min(BATAS_HARIAN, Math.floor(selesai)))
        : 0,
    };
  } catch {
    return { tanggal: hariIni, selesai: 0 };
  }
}

export default function TekaTekiHarianLanding() {
  const { t } = useI18n();
  const navigasi = useNavigate();
  const hariIni = tanggalHariIni();

  /** `null` = memuat; `[]` = tidak ada snapshot (seksi disembunyikan). */
  const [daftar, setDaftar] = useState(null);
  const [progres, setProgres] = useState(() => bacaProgres(hariIni));
  const [dialogGabung, setDialogGabung] = useState(false);

  // Keadaan permainan per soal — diperbarui secara atomik saat beralih soal,
  // sehingga FEN dan identitas soal baru selalu tampil bersamaan.
  const [game, setGame] = useState(() => ({
    indeks: bacaProgres(hariIni).selesai,
    fen: null,
    langkah: [],
    posisi: null,
    sisa: [],
    terpilih: null,
    sasaran: [],
    petunjuk: null,
    kesalahan: null,
    langkahAkhir: null,
    promosi: null,
    pesan: null,
    selesaiSoal: false,
    menungguLawan: false,
  }));

  const jamLawan = useRef(null);
  const jamSalah = useRef(null);
  const jamBerikut = useRef(null);
  const jamDialog = useRef(null);
  /** Mencegah `tuntaskan()` dieksekusi lebih dari sekali untuk satu soal. */
  const selesaiRef = useRef(false);

  /* -------------------------------------------------------------- data */

  useEffect(() => {
    let hidup = true;
    ambilSoalTerbaru()
      .then((semua) => {
        if (!hidup) return;
        // `ambilSoalTerbaru` mengembalikan urutan terbaru-dulu.
        const lima = semua.slice(0, BATAS_HARIAN);
        setDaftar(lima);
      })
      .catch(() => {
        if (hidup) setDaftar([]);
      });
    return () => {
      hidup = false;
    };
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(jamLawan.current);
      window.clearTimeout(jamSalah.current);
      window.clearTimeout(jamBerikut.current);
      window.clearTimeout(jamDialog.current);
    },
    []
  );

  const soal = daftar?.[game.indeks] || null;
  const batasEfektif = Math.min(BATAS_HARIAN, daftar?.length ?? 0);
  const jatahHabis = batasEfektif > 0 && progres.selesai >= batasEfektif;
  const orientasi = soal ? warnaGiliran(soal.fen) : "w";

  /** Bersihkan semua timer aktif. */
  const clearSemuaTimer = useCallback(() => {
    window.clearTimeout(jamLawan.current);
    window.clearTimeout(jamSalah.current);
    window.clearTimeout(jamBerikut.current);
    window.clearTimeout(jamDialog.current);
    jamLawan.current = null;
    jamSalah.current = null;
    jamBerikut.current = null;
    jamDialog.current = null;
  }, []);

  /** Pasang satu soal dari keadaan bersih — transisi state atomik. */
  const pasangSoalBaru = useCallback(
    (data) => {
      clearSemuaTimer();
      selesaiRef.current = false;
      setGame((prev) => ({
        ...prev,
        indeks: data.indeks,
        fen: data.fen,
        langkah: data.langkah,
        posisi: data.fen,
        sisa: data.langkah.slice(),
        terpilih: null,
        sasaran: [],
        petunjuk: null,
        kesalahan: null,
        langkahAkhir: null,
        promosi: null,
        pesan: null,
        selesaiSoal: false,
        menungguLawan: false,
      }));
    },
    [clearSemuaTimer]
  );

  // Inisialisasi state permainan saat data soal termuat — indeks melanjutkan
  // dari progres harian yang tersimpan, tidak pernah melewati batas daftar.
  useEffect(() => {
    if (!daftar || daftar.length === 0) return;
    const indeksAwal = Math.min(progres.selesai, daftar.length - 1);
    const data = daftar[indeksAwal];
    pasangSoalBaru({
      indeks: indeksAwal,
      fen: data.fen,
      langkah: data.langkah,
    });
  }, [daftar, progres.selesai, pasangSoalBaru]);

  const simpanProgres = useCallback(
    (jumlah) => {
      try {
        localStorage.setItem(
          KUNCI_PROGRES,
          JSON.stringify({ tanggal: hariIni, selesai: jumlah })
        );
      } catch {
        /* mode privat / kuota penuh — jatah tetap berlaku di sesi ini */
      }
    },
    [hariIni]
  );

  /* ------------------------------------------------------------ pemutar */

  /** Soal tuntas: catat jatah, lalu dialog gabung atau soal berikutnya. */
  const tuntaskan = useCallback(() => {
    // Guards: soal sudah ditandai selesai — cegah eksekusi ganda (double
    // click, StrictMode, atau race condition timer).
    if (selesaiRef.current || game.selesaiSoal) return;
    selesaiRef.current = true;

    clearSemuaTimer(); // termasuk jamLawan — jangan biarkan balasan lawan
    // yang masih pending memicu tuntaskan() lagi.

    setGame((prev) => ({
      ...prev,
      selesaiSoal: true,
      menungguLawan: false,
      petunjuk: null,
      pesan: { jenis: "selesai", kunci: "landing.harianSelesai" },
    }));

    const jumlah = Math.min(BATAS_HARIAN, progres.selesai + 1);
    setProgres({ tanggal: hariIni, selesai: jumlah });
    simpanProgres(jumlah);

    if (jumlah >= batasEfektif && jumlah >= BATAS_HARIAN) {
      // Dialog kuota penuh muncul segera setelah soal terakhir selesai,
      // memberi waktu pesan "selesai" terbaca sebelum dialog dialirkan.
      setDialogGabung(true);
    } else if (jumlah >= batasEfektif) {
      // batasEfektif < BATAS_HARIAN: semua soal tersedia sudah selesai,
      // tapi kuota penuh belum tercapai — tidak ada dialog gabung.
    } else {
      jamBerikut.current = window.setTimeout(() => {
        const berikutnya = game.indeks + 1;
        if (berikutnya < daftar.length) {
          pasangSoalBaru({
            indeks: berikutnya,
            fen: daftar[berikutnya].fen,
            langkah: daftar[berikutnya].langkah,
          });
        }
      }, JEDA_BERIKUT);
    }
  }, [
    game.selesaiSoal,
    game.indeks,
    progres.selesai,
    batasEfektif,
    daftar,
    pasangSoalBaru,
    clearSemuaTimer,
    simpanProgres,
    hariIni,
  ]);

  /** Lawan membalas otomatis; bila itu langkah terakhir, soal tuntas. */
  const mainkanLawan = useCallback(
    (daftarSisa, posisiKini) => {
      if (!daftarSisa.length || game.selesaiSoal) return;
      // Bersihkan timer lawan yang mungkin masih aktif dari langkah sebelumnya.
      window.clearTimeout(jamLawan.current);
      jamLawan.current = null;
      setGame((prev) => ({ ...prev, menungguLawan: true }));
      const { from, to, promo } = parseLangkah(daftarSisa[0]);

      jamLawan.current = window.setTimeout(() => {
        try {
          const hasil = terapkan(posisiKini, { from, to, promo });
          const baru = daftarSisa.slice(1);
          setGame((prev) => ({
            ...prev,
            posisi: hasil.fen(),
            sisa: baru,
            langkahAkhir: { from, to },
            terpilih: null,
            sasaran: [],
            menungguLawan: false,
          }));
          if (!baru.length) tuntaskan();
        } catch {
          // Data snapshot rusak: jangan biarkan papan terkunci selamanya.
          setGame((prev) => ({
            ...prev,
            menungguLawan: false,
            pesan: { jenis: "salah", kunci: "landing.harianSalah" },
          }));
        }
      }, JEDA_LAWAN);
    },
    [tuntaskan, game.selesaiSoal]
  );

  function pilihPetak(petak) {
    if (!game.posisi || game.selesaiSoal || game.menungguLawan) return;
    const catur = new Chess(game.posisi);
    const bidak = catur.get(petak);
    if (bidak && bidak.color === catur.turn()) {
      setGame((prev) => ({
        ...prev,
        pesan: null,
        terpilih: petak,
        sasaran: catur.moves({ square: petak, verbose: true }).map((m) => m.to),
      }));
    } else {
      setGame((prev) => ({ ...prev, terpilih: null, sasaran: [] }));
    }
  }

  function klikPetak(petak) {
    if (!game.posisi || game.selesaiSoal || game.menungguLawan) return;
    if (game.terpilih && game.sasaran.includes(petak)) {
      cobaLangkah(game.terpilih, petak);
      return;
    }
    if (game.terpilih === petak) {
      setGame((prev) => ({ ...prev, terpilih: null, sasaran: [] }));
      return;
    }
    pilihPetak(petak);
  }

  function cobaLangkah(from, to, promo) {
    if (
      !game.posisi ||
      game.selesaiSoal ||
      game.menungguLawan ||
      !game.sisa.length
    )
      return;

    const diharapkan = parseLangkah(game.sisa[0]);
    const legal = apakahLangkahLegal(game.posisi, from, to);
    const mintaPromosi = butuhPromosi(game.posisi, from, to);

    // Pion menuju baris terakhir: tanyakan bidak promosi dulu, jangan menilai
    // langkah yang belum lengkap.
    if (mintaPromosi.butuh && legal && !promo) {
      setGame((prev) => ({
        ...prev,
        promosi: { from, to, warna: mintaPromosi.warna },
        terpilih: null,
        sasaran: [],
      }));
      return;
    }

    let berikutnya = null;
    if (apakahLangkahSesuai(from, to, promo, diharapkan)) {
      try {
        berikutnya = terapkan(game.posisi, {
          from,
          to,
          promo: diharapkan.promo || promo,
        });
      } catch {
        berikutnya = null;
      }
    }

    if (!berikutnya) {
      window.clearTimeout(jamSalah.current);
      setGame((prev) => ({
        ...prev,
        pesan: {
          jenis: "salah",
          kunci: legal
            ? "landing.harianSalah"
            : "tekaTekiHarian.bukanLangkahLegal",
        },
        kesalahan: { from, to },
        terpilih: null,
        sasaran: [],
      }));
      jamSalah.current = window.setTimeout(() => {
        setGame((prev) => ({ ...prev, kesalahan: null }));
      }, JEDA_SALAH);
      return;
    }

    const sisaBaru = game.sisa.slice(1);
    setGame((prev) => ({
      ...prev,
      posisi: berikutnya.fen(),
      sisa: sisaBaru,
      langkahAkhir: { from, to },
      terpilih: null,
      sasaran: [],
      kesalahan: null,
      petunjuk: null,
    }));

    if (!sisaBaru.length) {
      tuntaskan();
      return;
    }
    setGame((prev) => ({
      ...prev,
      pesan: { jenis: "benar", kunci: "landing.harianBenar" },
    }));
    mainkanLawan(sisaBaru, berikutnya.fen());
  }

  function tampilkanPetunjuk() {
    if (!game.sisa.length || game.selesaiSoal) return;
    const { from, to } = parseLangkah(game.sisa[0]);
    setGame((prev) => ({ ...prev, petunjuk: { from, to } }));
  }

  /* ------------------------------------------------------------- render */

  // Kerangka dipakai saat snapshot belum tersedia, termasuk ketika kosong.
  // Komponen yang sama juga menjadi fallback Suspense di Landing, sehingga
  // seksi ini tidak muncul mendadak setelah chunk papan catur dimuat.
  if (!daftar || daftar.length === 0) {
    return <KerangkaTekaTekiHarian />;
  }

  const nomorSoal = Math.min(game.indeks + 1, daftar.length);
  const jatahTerpakai = Math.min(progres.selesai, BATAS_HARIAN);
  const sisaJatah = Math.max(0, BATAS_HARIAN - jatahTerpakai);
  const deskKartu = jatahHabis
    ? t("landing.harianKartuDeskSelesai")
    : t("landing.harianKartuDeskSisa", { n: sisaJatah });
  const judulKartu = jatahHabis
    ? t("landing.harianKartuJudulSelesai")
    : jatahTerpakai === 0
      ? t("landing.harianKartuJudulMulai")
      : t("landing.harianKartuJudulLanjut");
  /*
   * Teks kartu kemajuan mengikuti keadaan pemain, bukan satu kalimat statis:
   * belum mulai, sedang berjalan, lalu selesai. Polanya meniru kartu progres
   * "Keep it up!" di worldchess.com — satu judul penyemangat, satu kalimat
   * sisa jatah, lalu segmen + dua angka kecil.
   */
  const teksStatus = game.pesan
    ? t(game.pesan.kunci)
    : t(
        orientasi === "w"
          ? "landing.harianGiliranPutih"
          : "landing.harianGiliranHitam"
      );

  return (
    <section
      aria-labelledby="teka-teki-harian-judul"
      className="w-full pl-6 md:pl-8 pr-6 md:pr-8 pb-12 xl:pb-16 pt-12 xl:pt-16 overflow-hidden"
    >
        <div className="relative mx-auto w-full max-w-7xl">
        <div className="grid items-center gap-x-6 gap-y-10 xl:grid-cols-12 xl:gap-x-8">
          {/*
           * Kiri: padanan HomeWelcomeMessage + HomeRatingProgress +
           * GameTowerProgress di acuan. Judul dan kalimatnya mengikuti keadaan
           * jatah (belum mulai / sedang jalan / selesai), cincin menampilkan
           * nomor soal, dan track di bawahnya menampilkan jatah terpakai.
           */}
          <div
            data-component="HomeLayoutDesktopLeft"
            data-kartu-harian
            className="flex min-w-0 flex-col justify-center gap-y-6 xl:col-span-3 xl:min-h-[440px]"
          >
            <header
              data-component="HomeWelcomeMessage"
              className="flex flex-col items-center gap-y-2 text-center"
            >
              <h2 className="font-serif text-3xl font-semibold leading-tight text-grey-800">
                {judulKartu}
              </h2>
              <p className="max-w-lg font-serif text-base leading-relaxed text-grey-600">
                {deskKartu}
              </p>
            </header>

            <section
              aria-label={t("landing.harianProgresAria")}
              data-component="HomeRatingProgress"
              className="flex min-w-0 justify-center"
            >
              <CincinKemajuan
                ukuran={200}
                nilai={jatahTerpakai}
                maks={BATAS_HARIAN}
                label={t("landing.harianRingLabel")}
                subLabel={t("landing.harianRingSub")}
                nilaiTeks={t("landing.harianRingNilai", {
                  n: jatahTerpakai,
                  total: BATAS_HARIAN,
                })}
                catatan={
                  jatahHabis
                    ? t("landing.harianRingCatatanTuntas")
                    : t("landing.harianRingCatatan", { n: sisaJatah })
                }
                ariaLabel={t("landing.harianRingAria", {
                  n: jatahTerpakai,
                  total: BATAS_HARIAN,
                })}
              />
            </section>

            <section
              aria-label={t("landing.harianTrackAria")}
              data-component="GameTowerProgress"
              className="flex min-w-0 flex-col gap-y-3 border-t border-grey-200 pt-4"
            >
              <div className="flex items-end justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-y-1">
                  <h3 className="font-sans text-sm font-semibold text-primary">
                    {t("landing.harianKartuLabelJatah")}
                  </h3>
                  <p className="flex items-baseline gap-1 font-serif text-2xl font-semibold text-grey-800">
                    {jatahTerpakai}
                    <span className="font-sans text-base font-normal text-grey-600">
                      /{BATAS_HARIAN}
                    </span>
                  </p>
                </div>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-5 shrink-0 text-grey-600"
                >
                  <rect x="3.5" y="1.5" width="2.2" height="2.6" />
                  <rect x="6.9" y="1.5" width="2.2" height="2.6" />
                  <rect x="10.3" y="1.5" width="2.2" height="2.6" />
                  <path d="M4.6 4.9h6.8v4.3H4.6z" />
                  <path d="M3.4 10h9.2v3.4H3.4z" />
                </svg>
              </div>

              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={BATAS_HARIAN}
                aria-valuenow={jatahTerpakai}
                aria-valuetext={t("landing.harianKemajuan", {
                  n: jatahTerpakai,
                  total: BATAS_HARIAN,
                })}
                aria-label={t("landing.harianTrackAria")}
                className="relative h-1.5 w-full bg-grey-200"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-300"
                  style={{ width: `${(jatahTerpakai / BATAS_HARIAN) * 100}%` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 bg-primary"
                  style={{ left: `${(jatahTerpakai / BATAS_HARIAN) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-3 font-sans text-sm text-grey-600">
                <span>
                  {t("landing.harianNomorSoal", {
                    n: nomorSoal,
                    total: daftar.length,
                  })}
                </span>
                <span>{t("landing.harianTrackSisa", { n: sisaJatah })}</span>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 font-sans">
              <Tombol
                to={RUTE_HARIAN}
                variant="garis"
                className="h-12 px-4 md:px-6"
                aria-label={`${t("landing.harianCta")}: ${t("landing.harianJudul")}`}
              >
                <span className="order-1">{t("landing.harianCta")}</span>
                <ArrowRightIcon className="size-5 order-2" />
              </Tombol>
              {soal && (
                <a
                  href={soal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm font-semibold text-grey-600 underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  {t("landing.harianSumber")}
                </a>
              )}
            </div>
          </div>

          {/* Tengah: papan demo menjadi fokus visual utama. */}
          <div className="flex w-full min-w-0 justify-center xl:col-span-6">
            {jatahHabis ? (
              <div className="flex w-full max-w-lg flex-col gap-3 border border-grey-200 bg-paper p-5 sm:p-6">
                <p className="font-sans text-base font-bold text-grey-800">
                  {t("landing.harianTerkunciJudul", { total: BATAS_HARIAN })}
                </p>
                <p className="font-serif text-base leading-relaxed text-grey-600">
                  {t("landing.harianTerkunciDesk")}
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setDialogGabung(true)}
                    className="tombol-kci inline-flex items-center justify-center rounded border border-primary bg-primary px-4 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {t("landing.harianGabung")}
                  </button>
                  <Tombol to={RUTE_HARIAN} variant="garis" className="h-11 px-4">
                    {t("landing.harianCta")}
                  </Tombol>
                </div>
              </div>
            ) : soal ? (
              <div className="w-full max-w-lg">
                <div className="relative">
                  <PapanTekaTeki
                    fen={game.posisi || soal.fen}
                    orientasi={orientasi}
                    terpilih={game.terpilih}
                    sasaran={game.sasaran}
                    petunjuk={game.petunjuk}
                    kesalahan={game.kesalahan}
                    langkahAkhir={game.langkahAkhir}
                    panahMesin={game.petunjuk ? { ...game.petunjuk, warna: "bawaan" } : null}
                    terkunci={
                      game.selesaiSoal ||
                      game.menungguLawan ||
                      !!game.promosi ||
                      !game.sisa.length
                    }
                    membeku={game.menungguLawan}
                    onKlik={klikPetak}
                    onPilih={pilihPetak}
                    onJatuh={cobaLangkah}
                  />

                  {/* Pemilih promosi tetap berada di atas papan demo. */}
                  {game.promosi && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded bg-black/55 p-3">
                      <p className="font-sans text-sm font-bold uppercase tracking-wider text-white">
                        {t("tekaTekiHarian.promosiJudul")}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {PILIHAN_PROMOSI.map(([kode, kunci]) => (
                          <button
                            key={kode}
                            type="button"
                            onClick={() => {
                              const { from, to } = game.promosi;
                              setGame((prev) => ({ ...prev, promosi: null }));
                              cobaLangkah(from, to, kode);
                            }}
                            className="rounded bg-white px-3 py-2 font-sans text-sm font-semibold text-grey-800 transition-colors hover:bg-grey-100"
                          >
                            {t(kunci)}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setGame((prev) => ({ ...prev, promosi: null }))}
                        className="font-sans text-sm font-semibold text-white/80 underline underline-offset-2"
                      >
                        {t("tekaTekiHarian.promosiBatal")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                aria-hidden="true"
                className="aspect-square w-full max-w-lg animate-pulse border border-grey-200 bg-grey-50"
              />
            )}
          </div>

          {/* Kanan: konteks promosi dan kontrol demo, bukan panel permainan penuh. */}
          <aside
            aria-label={t("landing.harianKontrolAria")}
            className="flex min-w-0 flex-col justify-center gap-y-7 xl:col-span-3 xl:min-h-[440px]"
          >
            <header className="flex flex-col gap-y-3">
              <p className="font-sans text-sm font-semibold text-primary">
                {t("landing.harianLabel")}
              </p>
              <h3
                id="teka-teki-harian-judul"
                className="font-serif text-2xl font-semibold leading-tight text-grey-800"
              >
                {t("landing.harianJudul")}
              </h3>
              <p className="font-serif text-base leading-relaxed text-grey-600">
                {t("landing.harianDesk")}
              </p>
            </header>

            {!jatahHabis && soal && (
              <section className="border-t border-grey-200 pt-5">
                <p
                  aria-live="polite"
                    className={`font-sans text-sm font-semibold ${
                    game.selesaiSoal
                      ? "text-primary"
                      : game.pesan?.jenis === "salah"
                        ? "text-red-700"
                        : "text-grey-600"
                  }`}
                >
                  {teksStatus}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 font-sans">
                  <button
                    type="button"
                    onClick={tampilkanPetunjuk}
                    disabled={game.selesaiSoal || game.menungguLawan}
                    className="rounded border border-grey-200 px-3 py-2 text-sm font-semibold text-grey-800 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    {t("landing.harianPetunjuk")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      pasangSoalBaru({
                        indeks: game.indeks,
                        fen: soal.fen,
                        langkah: soal.langkah,
                      })
                    }
                    className="rounded border border-grey-200 px-3 py-2 text-sm font-semibold text-grey-800 transition-colors hover:border-primary hover:text-primary"
                  >
                    {t("landing.harianUlangi")}
                  </button>
                </div>
                <p className="mt-4 font-mono text-sm uppercase tracking-wider text-grey-600">
                  {t("landing.harianNomorSoal", { n: nomorSoal, total: daftar.length })}
                  {" · "}
                  {t("landing.harianEdisi", { tanggal: soal.tanggal })}
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>

      {/* Dialog ajakan bergabung setelah 5 soal. Radix dipakai supaya fokus
      terkunci dan Escape berperilaku sama dengan dialog lain di situs. */}
      <AlertDialog open={dialogGabung} onOpenChange={setDialogGabung}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("landing.harianDialogJudul", { total: BATAS_HARIAN })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("landing.harianDialogDesk", { total: BATAS_HARIAN })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("landing.harianDialogNanti")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDialogGabung(false);
                navigasi(RUTE_GABUNG);
              }}
            >
              {t("landing.harianGabung")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
