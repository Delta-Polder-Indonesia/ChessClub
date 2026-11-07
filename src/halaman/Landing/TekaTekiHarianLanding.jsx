/**
 * "Teka-teki Hari Ini" — pemikat yang BISA DIMAINKAN di halaman Landing.
 *
 * Tiga aturan produk yang disengaja:
 *
 * 1. SUMBER DATA = ARSIP LOKAL. Widget membaca
 *    `data/teka-teki-harian/terbaru.json` (snapshot statis buatan
 *    `scripts/ambil-teka-teki-harian.mjs`), BUKAN API Chess.com. Halaman depan
 *    jadi tetap cepat dan tetap hidup walau pihak ketiga sedang gangguan.
 *    Halaman penuh `/teka-teki-harian` justru memakai API supaya selalu
 *    menampilkan soal terbaru; keduanya sengaja berbeda peran.
 *
 * 2. BISA DIMAINKAN, bukan gambar mati. Pengunjung langsung mencoba langkah,
 *    lawan membalas otomatis, dan ada tombol petunjuk — inilah alasan orang
 *    tinggal lebih lama setelah membaca hero.
 *
 * 3. DIBATASI 5 SOAL PER HARI (dengan kartu kemajuan bergaya "Keep it up!"). Setelah soal kelima selesai, muncul dialog
 *    ajakan bergabung ke Blunder Skuad. Hitungannya disimpan per tanggal di
 *    localStorage supaya memuat ulang halaman tidak menambah jatah. Pemain
 *    yang ingin lanjut tanpa bergabung tetap bisa membuka halaman penuh.
 *
 * Komponen ini dimuat lazy dari `Landing.jsx`: papan interaktif (`PapanTekaTeki`
 * + chunk bidak ±126 KB) tidak diperlukan untuk elemen LCP halaman depan.
 *
 * Tipografi mengikuti `./gayaTeks.jsx` seperti seksi Landing lain; papannya
 * sendiri tetap milik domain catur (DESIGN.md §13).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chess } from "chess.js";
import { useI18n } from "../../lib/i18n.jsx";
import { Tombol } from "../../components/Tombol.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";
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

  // Keadaan pemutar.
  const [indeks, setIndeks] = useState(() => bacaProgres(hariIni).selesai);
  const [posisi, setPosisi] = useState(null);
  const [sisa, setSisa] = useState([]);
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [petunjuk, setPetunjuk] = useState(null);
  const [kesalahan, setKesalahan] = useState(null);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [promosi, setPromosi] = useState(null);
  /** `{ jenis: "benar" | "salah" | "selesai", kunci }` atau `null`. */
  const [pesan, setPesan] = useState(null);
  const [selesaiSoal, setSelesaiSoal] = useState(false);
  const [menungguLawan, setMenungguLawan] = useState(false);

  const jamLawan = useRef(null);
  const jamSalah = useRef(null);
  const jamBerikut = useRef(null);
  const jamDialog = useRef(null);

  /* -------------------------------------------------------------- data */

  useEffect(() => {
    let hidup = true;
    ambilSoalTerbaru()
      .then((semua) => {
        if (!hidup) return;
        // `ambilSoalTerbaru` mengembalikan urutan terbaru-dulu.
        const lima = semua.slice(0, BATAS_HARIAN);
        setDaftar(lima);
        // Progres yang sudah tercatat menunjuk soal ke berapa; jangan pernah
        // melewati batas daftar.
        setIndeks((i) => Math.min(i, Math.max(0, lima.length - 1)));
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

  const soal = daftar?.[indeks] || null;
  const jatahHabis = progres.selesai >= BATAS_HARIAN;
  const orientasi = soal ? warnaGiliran(soal.fen) : "w";

  /** Pasang satu soal dari keadaan bersih. */
  const pasangSoal = useCallback((data) => {
    window.clearTimeout(jamLawan.current);
    window.clearTimeout(jamSalah.current);
    window.clearTimeout(jamBerikut.current);
    setTerpilih(null);
    setSasaran([]);
    setPetunjuk(null);
    setKesalahan(null);
    setLangkahAkhir(null);
    setPromosi(null);
    setPesan(null);
    setSelesaiSoal(false);
    setMenungguLawan(false);
    setPosisi(data ? data.fen : null);
    setSisa(data ? data.langkah.slice() : []);
  }, []);

  useEffect(() => {
    pasangSoal(soal);
  }, [soal, pasangSoal]);

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
    setSelesaiSoal(true);
    setMenungguLawan(false);
    setPetunjuk(null);
    setPesan({ jenis: "selesai", kunci: "landing.harianSelesai" });

    // Efek samping (localStorage + timer) sengaja DI LUAR updater state:
    // React boleh memanggil updater lebih dari sekali (StrictMode), dan timer
    // ganda akan melompati satu soal.
    const jumlah = Math.min(BATAS_HARIAN, progres.selesai + 1);
    setProgres({ tanggal: hariIni, selesai: jumlah });
    simpanProgres(jumlah);

    if (jumlah >= BATAS_HARIAN) {
      // Beri jeda supaya pesan "tepat" sempat terbaca sebelum dialog.
      jamDialog.current = window.setTimeout(() => setDialogGabung(true), JEDA_BERIKUT);
    } else {
      jamBerikut.current = window.setTimeout(
        () => setIndeks((i) => i + 1),
        JEDA_BERIKUT
      );
    }
  }, [hariIni, progres.selesai, simpanProgres]);

  /** Lawan membalas otomatis; bila itu langkah terakhir, soal tuntas. */
  const mainkanLawan = useCallback(
    (daftarSisa, posisiKini) => {
      if (!daftarSisa.length) return;
      setMenungguLawan(true);
      const { from, to, promo } = parseLangkah(daftarSisa[0]);

      jamLawan.current = window.setTimeout(() => {
        try {
          const game = terapkan(posisiKini, { from, to, promo });
          const baru = daftarSisa.slice(1);
          setPosisi(game.fen());
          setSisa(baru);
          setLangkahAkhir({ from, to });
          setTerpilih(null);
          setSasaran([]);
          setMenungguLawan(false);
          if (!baru.length) tuntaskan();
        } catch {
          // Data snapshot rusak: jangan biarkan papan terkunci selamanya.
          setMenungguLawan(false);
          setPesan({ jenis: "salah", kunci: "landing.harianSalah" });
        }
      }, JEDA_LAWAN);
    },
    [tuntaskan]
  );

  function pilihPetak(petak) {
    if (!posisi || selesaiSoal || menungguLawan) return;
    const game = new Chess(posisi);
    const bidak = game.get(petak);
    if (bidak && bidak.color === game.turn()) {
      setPesan(null);
      setTerpilih(petak);
      setSasaran(game.moves({ square: petak, verbose: true }).map((m) => m.to));
    } else {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  function klikPetak(petak) {
    if (!posisi || selesaiSoal || menungguLawan) return;
    if (terpilih && sasaran.includes(petak)) {
      cobaLangkah(terpilih, petak);
      return;
    }
    if (terpilih === petak) {
      setTerpilih(null);
      setSasaran([]);
      return;
    }
    pilihPetak(petak);
  }

  function cobaLangkah(from, to, promo) {
    if (!posisi || selesaiSoal || menungguLawan || !sisa.length) return;

    const diharapkan = parseLangkah(sisa[0]);
    const legal = apakahLangkahLegal(posisi, from, to);
    const mintaPromosi = butuhPromosi(posisi, from, to);

    // Pion menuju baris terakhir: tanyakan bidak promosi dulu, jangan menilai
    // langkah yang belum lengkap.
    if (mintaPromosi.butuh && legal && !promo) {
      setPromosi({ from, to, warna: mintaPromosi.warna });
      setTerpilih(null);
      setSasaran([]);
      return;
    }

    let berikutnya = null;
    if (apakahLangkahSesuai(from, to, promo, diharapkan)) {
      try {
        berikutnya = terapkan(posisi, {
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
      setPesan({
        jenis: "salah",
        kunci: legal ? "landing.harianSalah" : "tekaTekiHarian.bukanLangkahLegal",
      });
      setKesalahan({ from, to });
      setTerpilih(null);
      setSasaran([]);
      jamSalah.current = window.setTimeout(() => setKesalahan(null), JEDA_SALAH);
      return;
    }

    const sisaBaru = sisa.slice(1);
    setPosisi(berikutnya.fen());
    setSisa(sisaBaru);
    setLangkahAkhir({ from, to });
    setTerpilih(null);
    setSasaran([]);
    setKesalahan(null);
    setPetunjuk(null);

    if (!sisaBaru.length) {
      tuntaskan();
      return;
    }
    setPesan({ jenis: "benar", kunci: "landing.harianBenar" });
    mainkanLawan(sisaBaru, berikutnya.fen());
  }

  function tampilkanPetunjuk() {
    if (!sisa.length || selesaiSoal) return;
    const { from, to } = parseLangkah(sisa[0]);
    setPetunjuk({ from, to });
  }

  /* ------------------------------------------------------------- render */

  // Snapshot belum ada / rusak → jangan tampilkan seksi kosong.
  if (!daftar || daftar.length === 0) return null;

  const nomorSoal = Math.min(indeks + 1, daftar.length);
  const jatahTerpakai = Math.min(progres.selesai, BATAS_HARIAN);
  const sisaJatah = Math.max(0, BATAS_HARIAN - jatahTerpakai);
  const deskKartu = jatahHabis
    ? t("landing.harianKartuDeskSelesai")
    : t("landing.harianKartuDeskSisa", { n: sisaJatah });
  /*
   * Teks kartu kemajuan mengikuti keadaan pemain, bukan satu kalimat statis:
   * belum mulai, sedang berjalan, lalu selesai. Polanya meniru kartu progres
   * "Keep it up!" di worldchess.com — satu judul penyemangat, satu kalimat
   * sisa jatah, lalu segmen + dua angka kecil.
   */
  const teksStatus = pesan
    ? t(pesan.kunci)
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
      <div className="relative mx-auto w-full max-w-[1440px]">
        <div className="grid items-center gap-x-6 gap-y-10 xl:grid-cols-[minmax(260px,0.95fr)_minmax(360px,1.3fr)_minmax(230px,0.85fr)] xl:gap-x-8">
          {/* Kiri: susunan mengikuti HomeWelcomeMessage, HomeRatingProgress, dan GameTowerProgress. */}
          <div
            data-component="HomeLayoutDesktopLeft"
            className="flex min-w-0 flex-col justify-center gap-y-6 xl:min-h-[440px]"
          >
            <header
              data-component="HomeWelcomeMessage"
              className="flex flex-col gap-y-2"
            >
              <h2 className="font-serif text-2xl font-semibold leading-tight text-grey-800">
                Lanjutkan kerja baikmu!
              </h2>
              <p className="max-w-[34rem] font-serif text-base leading-relaxed text-grey-600">
                Mainkan beberapa kali lagi untuk melihat kemampuanmu.
              </p>
            </header>

            <section
              aria-label="Progres teka-teki harian"
              data-component="HomeRatingProgress"
              className="flex min-w-0 items-center gap-4 py-2 sm:gap-5"
            >
              <div className="relative inline-flex h-[110px] w-[110px] shrink-0 items-center justify-center">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 110 110"
                  className="h-full w-full"
                  fill="none"
                >
                  <circle
                    r="54"
                    cx="55"
                    cy="55"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    strokeDasharray="254.469 339.292"
                    strokeDashoffset="0"
                    className="text-grey-200"
                    strokeLinecap="butt"
                    transform="rotate(135 55 55)"
                    shapeRendering="geometricPrecision"
                  />
                  <circle
                    r="54"
                    cx="55"
                    cy="55"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    strokeDasharray="254.469 339.292"
                    strokeDashoffset={254.469 * (1 - jatahTerpakai / BATAS_HARIAN)}
                    className="text-primary transition-[stroke-dashoffset] duration-700 ease-in-out"
                    strokeLinecap="butt"
                    transform="rotate(135 55 55)"
                    shapeRendering="geometricPrecision"
                  />
                </svg>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-y-1">
                    <p className="font-sans text-sm font-semibold text-grey-800">
                      Progres
                    </p>
                    <p className="font-sans text-sm text-grey-600">
                      Teka-teki harian
                    </p>
                  </div>
                  <span
                    role="img"
                    aria-label="Informasi progres harian"
                    title="Progres dihitung dari jumlah soal harian yang telah diselesaikan."
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center text-grey-600"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M12.03 18.01a.9.9 0 0 0 .67-.27.9.9 0 0 0 .27-.67.9.9 0 0 0-.27-.66.91.91 0 0 0-.67-.27.9.9 0 0 0-.67.27.91.91 0 0 0-.27.67c0 .26.1.48.28.66.18.18.4.27.66.27m-.61-3.94 1.15 0c.03-.52.13-.94.29-1.26.16-.32.5-.74 1.01-1.24.53-.53.93-1 1.19-1.43.26-.42.39-.9.39-1.46 0-.94-.33-1.68-1-2.24a3.51 3.51 0 0 0-2.33-.84c-.86 0-1.58.24-2.18.7-.6.47-1.04 1-1.32 1.6l1.1.46c.19-.43.46-.82.82-1.15.35-.33.86-.5 1.53-.5.78 0 1.34.21 1.7.64.35.42.53.89.53 1.4 0 .4-.11.78-.34 1.1-.22.32-.5.65-.87.98a6.06 6.06 0 0 0-1.35 1.62 3.6 3.6 0 0 0-.32 1.62M12 22.5a10.83 10.83 0 0 1-9.87-6.53c-.56-1.3-.84-2.7-.84-4.18a10.83 10.83 0 0 1 6.53-9.87c1.3-.57 2.7-.85 4.18-.85a10.83 10.83 0 0 1 9.87 6.53c.56 1.3.84 2.7.84 4.18a10.83 10.83 0 0 1-6.53 9.87c-1.3.57-2.7.85-4.18.85m0-1.19a9.2 9.2 0 0 0 6.76-2.77 9.2 9.2 0 0 0 2.76-6.75 9.2 9.2 0 0 0-2.76-6.76A9.2 9.2 0 0 0 12 2.26a9.2 9.2 0 0 0-6.76 2.77 9.2 9.2 0 0 0-2.76 6.76 9.2 9.2 0 0 0 2.76 6.75A9.2 9.2 0 0 0 12 21.31" />
                    </svg>
                  </span>
                </div>
                <p className="font-serif text-2xl font-semibold leading-tight text-grey-800">
                  {jatahTerpakai} dari {BATAS_HARIAN}
                </p>
                <p className="font-sans text-sm leading-relaxed text-grey-600">
                  {deskKartu}
                </p>
              </div>
            </section>

            <section
              aria-label="Jatah teka-teki harian"
              data-component="GameTowerProgress"
              className="flex min-w-0 flex-col gap-y-4 border-t border-grey-200 pt-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-grey-200 text-grey-800">
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                      <path d="M0.75 6.1 8 0.75l7.25 5.35v9.15H0.75V6.1Z" stroke="currentColor" strokeWidth="1.1" />
                    </svg>
                  </div>
                  <div className="flex min-w-0 flex-col gap-y-0.5">
                    <h3 className="font-sans text-base font-semibold text-grey-800">
                      Jatah harian
                    </h3>
                    <p className="font-sans text-sm text-grey-600">
                      Teka-teki
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-baseline gap-1 font-serif text-xl font-semibold text-grey-800">
                  <span>{jatahTerpakai}</span>
                  <span className="font-sans text-sm font-normal text-grey-600">
                    / {BATAS_HARIAN}
                  </span>
                </div>
              </div>

              <div
                role="progressbar"
                aria-label="Progres jatah teka-teki harian"
                aria-valuemin={0}
                aria-valuemax={BATAS_HARIAN}
                aria-valuenow={jatahTerpakai}
                aria-valuetext={t("landing.harianKemajuan", {
                  n: jatahTerpakai,
                  total: BATAS_HARIAN,
                })}
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
              <div className="flex items-center justify-between gap-3 font-sans text-xs text-grey-600">
                <span>{t("landing.harianKartuLabelJatah")}</span>
                <span>
                  {t("landing.harianKemajuan", {
                    n: jatahTerpakai,
                    total: BATAS_HARIAN,
                  })}
                </span>
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
          <div className="flex w-full min-w-0 justify-center">
            {jatahHabis ? (
              <div className="flex w-full max-w-[34rem] flex-col gap-3 border border-grey-200 bg-paper p-5 sm:p-6">
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
              <div className="w-full max-w-[34rem]">
                <div className="relative">
                  <PapanTekaTeki
                    fen={posisi || soal.fen}
                    orientasi={orientasi}
                    terpilih={terpilih}
                    sasaran={sasaran}
                    petunjuk={petunjuk}
                    kesalahan={kesalahan}
                    langkahAkhir={langkahAkhir}
                    panahMesin={petunjuk ? { ...petunjuk, warna: "bawaan" } : null}
                    terkunci={selesaiSoal || menungguLawan || !!promosi || !sisa.length}
                    membeku={menungguLawan}
                    onKlik={klikPetak}
                    onPilih={pilihPetak}
                    onJatuh={cobaLangkah}
                  />

                  {/* Pemilih promosi tetap berada di atas papan demo. */}
                  {promosi && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded bg-black/55 p-3">
                      <p className="font-sans text-xs font-bold uppercase tracking-wider text-white">
                        {t("tekaTekiHarian.promosiJudul")}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {PILIHAN_PROMOSI.map(([kode, kunci]) => (
                          <button
                            key={kode}
                            type="button"
                            onClick={() => {
                              const { from, to } = promosi;
                              setPromosi(null);
                              cobaLangkah(from, to, kode);
                            }}
                            className="rounded bg-white px-2.5 py-1.5 font-sans text-xs font-semibold text-grey-800 transition-colors hover:bg-grey-100"
                          >
                            {t(kunci)}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPromosi(null)}
                        className="font-sans text-xs font-semibold text-white/80 underline underline-offset-2"
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
                className="aspect-square w-full max-w-[34rem] animate-pulse border border-grey-200 bg-grey-50"
              />
            )}
          </div>

          {/* Kanan: konteks promosi dan kontrol demo, bukan panel permainan penuh. */}
          <aside
            aria-label="Informasi dan kontrol demo teka-teki harian"
            className="flex min-w-0 flex-col justify-center gap-y-7 lg:min-h-[440px]"
          >
            <header className="flex flex-col gap-y-3">
              <p className="font-sans text-sm font-semibold text-primary">
                {t("landing.harianLabel")}
              </p>
              <h3 className="font-serif text-2xl font-semibold leading-tight text-grey-800">
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
                    selesaiSoal
                      ? "text-primary"
                      : pesan?.jenis === "salah"
                        ? "text-accent-600"
                        : "text-grey-600"
                  }`}
                >
                  {teksStatus}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 font-sans">
                  <button
                    type="button"
                    onClick={tampilkanPetunjuk}
                    disabled={selesaiSoal || menungguLawan}
                    className="rounded border border-grey-200 px-3 py-2 text-sm font-semibold text-grey-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    {t("landing.harianPetunjuk")}
                  </button>
                  <button
                    type="button"
                    onClick={() => pasangSoal(soal)}
                    className="rounded border border-grey-200 px-3 py-2 text-sm font-semibold text-grey-700 transition-colors hover:border-primary hover:text-primary"
                  >
                    {t("landing.harianUlangi")}
                  </button>
                </div>
                <p className="mt-4 font-mono text-xs uppercase tracking-wider text-grey-600">
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
