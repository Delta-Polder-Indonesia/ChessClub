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
 * 3. DIBATASI 5 SOAL PER HARI (dengan kartu kemajuan bergaya "Keep it up!"). Setelah soal kelima selesai, muncul dialog
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
      className="w-full pl-6 md:pl-8 pr-6 md:pr-8 pb-12 xl:pb-16 pt-12 xl:pt-16 overflow-hidden bg-[#121212] text-zinc-100"
    >
      <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px]">
        <div className="grid gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-x-12 lg:items-start">
          {/* Kiri: disesuaikan dengan tema gelap tanpa kotak kartu putih */}
          <div className="flex flex-col justify-center gap-y-6 lg:min-h-[440px] lg:max-w-[38rem]">
            <header className="flex flex-col gap-y-2">
              <h2 className="font-serif font-light text-3xl lg:text-4xl tracking-tight text-white [font-variant-numeric:lining-nums]">
                Lanjutkan kerja baikmu!
              </h2>
              <p className="max-w-[34rem] font-sans text-sm leading-relaxed text-zinc-400">
                Mainkan beberapa kali lagi untuk melihat kemampuanmu.
              </p>
            </header>

            <section
              aria-label="Progres teka-teki harian"
              data-kartu-peringkat
              className="flex items-center gap-6 border-t border-b border-zinc-800 py-6 sm:gap-8 bg-transparent"
            >
              <div className="flex items-center justify-center w-24 h-24 rounded-full border border-zinc-700">
                <div className="text-center">
                  <span className="block text-[10px] uppercase tracking-wider text-zinc-400">Peringkat</span>
                  <span className="text-base font-medium tabular-nums font-serif [font-variant-numeric:lining-nums]">
                    {jatahTerpakai} dari {BATAS_HARIAN}
                  </span>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-y-1">
                <p className="font-sans text-xs uppercase tracking-wider text-zinc-400">
                  Peringkat Perkiraan
                </p>
                <p className="font-sans text-sm leading-relaxed text-zinc-300">
                  {deskKartu}
                </p>
              </div>
            </section>

            <section
              aria-label="Progres menara teka-teki"
              data-kartu-menara
              className="flex flex-col gap-y-3 py-3 border-b border-zinc-800 bg-transparent"
            >
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-zinc-400">Menara (Level 1)</span>
                <span className="tabular-nums text-zinc-200 [font-variant-numeric:lining-nums]">
                  {jatahTerpakai} / {BATAS_HARIAN}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Progres teka-teki harian"
                aria-valuemin={0}
                aria-valuemax={BATAS_HARIAN}
                aria-valuenow={jatahTerpakai}
                aria-valuetext={t("landing.harianKemajuan", {
                  n: jatahTerpakai,
                  total: BATAS_HARIAN,
                })}
                className="h-1.5 w-full overflow-hidden bg-zinc-800"
              >
                <div
                  className="h-full bg-[red] transition-[width] duration-300"
                  style={{ width: `${(jatahTerpakai / BATAS_HARIAN) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-3 font-sans text-xs text-zinc-400">
                <span>{t("landing.harianKartuLabelJatah")}</span>
                <span>{t("landing.harianKemajuan", {
                  n: jatahTerpakai,
                  total: BATAS_HARIAN,
                })}</span>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-sans pt-2">
              <Tombol
                to={RUTE_HARIAN}
                variant="garis"
                className="h-11 px-5 border-zinc-700 text-white hover:border-zinc-500 bg-transparent"
                aria-label={`${t("landing.harianCta")}: ${t("landing.harianJudul")}`}
              >
                <span className="order-1">{t("landing.harianCta")}</span>
                <ArrowRightIcon className="size-4 order-2 ml-2" />
              </Tombol>
              {soal && (
                <a
                  href={soal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-xs font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  {t("landing.harianSumber")}
                </a>
              )}
            </div>
          </div>

          {/* Kanan: pemutar mini / keadaan jatah habis */}
          <div className="w-full max-w-[440px]">
            {jatahHabis ? (
              <div className="flex flex-col gap-3 rounded border border-zinc-800 bg-[#181715] p-6 text-zinc-100">
                <p className="font-sans text-sm font-semibold text-white">
                  {t("landing.harianTerkunciJudul", { total: BATAS_HARIAN })}
                </p>
                <p className="font-serif text-sm leading-relaxed text-zinc-400">
                  {t("landing.harianTerkunciDesk")}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDialogGabung(true)}
                    className="inline-flex items-center justify-center rounded bg-[#e24a2e] px-4 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-[#d03d21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                  >
                    {t("landing.harianGabung")}
                  </button>
                  <Tombol to={RUTE_HARIAN} variant="garis" className="h-10 px-4 border-zinc-700 text-white hover:border-zinc-500 bg-transparent">
                    {t("landing.harianCta")}
                  </Tombol>
                </div>
              </div>
            ) : soal ? (
              <>
                <div className="relative border border-zinc-800 p-3 bg-[#181715]">
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

                  {/* Pemilih bidak promosi */}
                  {promosi && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded bg-black/75 p-3">
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
                            className="rounded bg-zinc-800 border border-zinc-700 px-3 py-2 font-sans text-xs font-semibold text-white transition-colors hover:bg-zinc-700"
                          >
                            {t(kunci)}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPromosi(null)}
                        className="font-sans text-xs font-semibold text-zinc-400 underline underline-offset-2 hover:text-white"
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
                        ? "text-emerald-400"
                        : pesan?.jenis === "salah"
                          ? "text-red-400"
                          : "text-zinc-400"
                    }`}
                  >
                    {teksStatus}
                  </p>
                  <div className="flex items-center gap-2 font-sans">
                    <button
                      type="button"
                      onClick={tampilkanPetunjuk}
                      disabled={selesaiSoal || menungguLawan}
                      className="rounded border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-40"
                    >
                      {t("landing.harianPetunjuk")}
                    </button>
                    <button
                      type="button"
                      onClick={() => pasangSoal(soal)}
                      className="rounded border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                    >
                      {t("landing.harianUlangi")}
                    </button>
                  </div>
                </div>

                <p className="mt-1 font-mono text-[12px] uppercase tracking-wider text-zinc-500 [font-variant-numeric:lining-nums]">
                  {t("landing.harianNomorSoal", { n: nomorSoal, total: daftar.length })}
                  {" · "}
                  {t("landing.harianEdisi", { tanggal: soal.tanggal })}
                </p>
              </>
            ) : (
              <div
                aria-hidden="true"
                className="aspect-square w-full animate-pulse rounded border border-zinc-800 bg-zinc-900"
              />
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={dialogGabung} onOpenChange={setDialogGabung}>
        <AlertDialogContent className="bg-[#181715] border border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-serif">
              {t("landing.harianDialogJudul", { total: BATAS_HARIAN })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t("landing.harianDialogDesk", { total: BATAS_HARIAN })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              {t("landing.harianDialogNanti")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDialogGabung(false);
                navigasi(RUTE_GABUNG);
              }}
              className="bg-[#e24a2e] text-white hover:bg-[#d03d21]"
            >
              {t("landing.harianGabung")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
