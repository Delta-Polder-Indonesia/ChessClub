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
 * 3. DIBATASI 5 SOAL PER HARI. Setelah soal kelima selesai, muncul dialog
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
import { JUDUL_SEKSI, LEAD_SEKSI, LABEL_SEKSI } from "./gayaTeks.jsx";

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
      <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px]">
        <div className="grid gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-x-12 lg:items-start">
          {/* Kiri: teks + jatah harian + ajakan */}
          <div className="flex flex-col gap-y-5">
            <p className={LABEL_SEKSI}>{t("landing.harianLabel")}</p>
            <h2 id="teka-teki-harian-judul" className={JUDUL_SEKSI}>
              {t("landing.harianJudul")}
            </h2>
            <p className={LEAD_SEKSI}>{t("landing.harianDesk")}</p>

            {/* Jatah harian — satu-satunya batas, berlaku juga antar-halaman */}
            <div className="flex flex-col gap-y-2">
              <p className="font-mono text-[12px] uppercase tracking-wider text-grey-600">
                {t("landing.harianKemajuan", {
                  n: jatahTerpakai,
                  total: BATAS_HARIAN,
                })}
              </p>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={BATAS_HARIAN}
                aria-valuenow={jatahTerpakai}
                aria-valuetext={t("landing.harianKemajuan", {
                  n: jatahTerpakai,
                  total: BATAS_HARIAN,
                })}
                aria-label={t("landing.harianNomorSoal", {
                  n: nomorSoal,
                  total: daftar.length,
                })}
                className="h-1 w-full max-w-[280px] overflow-hidden rounded bg-grey-200"
              >
                <span
                  className="block h-full bg-primary transition-[width] duration-300"
                  style={{
                    width: `${(jatahTerpakai / BATAS_HARIAN) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-sans">
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

          {/* Kanan: pemutar mini / keadaan jatah habis */}
          <div className="w-full max-w-[440px]">
            {jatahHabis ? (
              <div className="flex flex-col gap-3 rounded border border-grey-200 bg-paper p-5">
                <p className="font-sans text-sm font-bold text-grey-800">
                  {t("landing.harianTerkunciJudul", { total: BATAS_HARIAN })}
                </p>
                <p className="font-serif text-sm leading-relaxed text-grey-600">
                  {t("landing.harianTerkunciDesk")}
                </p>
                <div className="flex flex-wrap gap-3">
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
              <>
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

                  {/* Pemilih bidak promosi — hanya muncul saat memang perlu. */}
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

                {/* Status + kontrol ringkas */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
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
                  <div className="flex items-center gap-2 font-sans">
                    <button
                      type="button"
                      onClick={tampilkanPetunjuk}
                      disabled={selesaiSoal || menungguLawan}
                      className="rounded border border-grey-200 px-2.5 py-1 text-xs font-semibold text-grey-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
                    >
                      {t("landing.harianPetunjuk")}
                    </button>
                    <button
                      type="button"
                      onClick={() => pasangSoal(soal)}
                      className="rounded border border-grey-200 px-2.5 py-1 text-xs font-semibold text-grey-700 transition-colors hover:border-primary hover:text-primary"
                    >
                      {t("landing.harianUlangi")}
                    </button>
                  </div>
                </div>

                <p className="mt-1 font-mono text-[12px] uppercase tracking-wider text-grey-600">
                  {t("landing.harianNomorSoal", { n: nomorSoal, total: daftar.length })}
                  {" · "}
                  {t("landing.harianEdisi", { tanggal: soal.tanggal })}
                </p>
              </>
            ) : (
              <div
                aria-hidden="true"
                className="aspect-square w-full animate-pulse rounded border border-grey-200 bg-grey-50"
              />
            )}
          </div>
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
