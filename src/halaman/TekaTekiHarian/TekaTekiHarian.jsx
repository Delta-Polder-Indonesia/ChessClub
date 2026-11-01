import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Chess } from "chess.js";
import { useI18n } from "../../lib/i18n.jsx";
import { SUARA, useSuara } from "../../lib/suara.js";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";
import License from "../Analisa/komponen/svg/license.jsx";
import { ambilTekaTekiHarian } from "../../lib/api/tekaTekiHarian.js";
import { teksGalat } from "../../lib/api/core.js";
import {
  apakahLangkahLegal,
  apakahLangkahSesuai,
  butuhPromosi,
  parseLangkah,
  terapkan,
} from "../../lib/tekaTeki.js";
import {
  ambilSoalTanggal,
  geserTanggal,
  parsePgnTekaTeki,
  pasanganLangkah,
  tanggalHariIni,
  tanggalSah,
  tanggalTerbaca,
  warnaGiliran,
} from "../../lib/tekaTekiHarian.js";

/**
 * Halaman Teka-teki Harian.
 *
 * Sumber soal: RUTE API `GET /api/teka-teki-harian` (server meneruskan API
 * publik resmi Chess.com, `server/src/teka-teki-harian.js`) — jadi halaman ini
 * SELALU memuat soal terbaru, termasuk hari ini, tanpa perlu di-update.
 *
 * Bila API/Chess.com sedang tidak terjangkau, halaman TIDAK mati: ia jatuh ke
 * snapshot statis `public/data/teka-teki-harian/` (berkas yang sama yang
 * dipakai widget di landing) dan menandai bahwa soalnya dari arsip. Dengan
 * begitu pengunjung tetap bisa bermain walau layanan pihak ketiga bermasalah.
 *
 * Snapshot hanya berisi `tanggal`, `fen`, dan langkah solusi; judul/penulis/
 * media milik Chess.com tidak disimpan (lihat catatan di skrip pengumpul).
 *
 * Kebijakan langkah sengaja SAMA dengan halaman Teka-teki: hanya langkah solusi
 * yang diterima (skakmat alternatif pun ditolak) supaya penilaian konsisten.
 */

/** Progres lokal: tanggal-tanggal yang sudah diselesaikan di peramban ini. */
const KUNCI_SELESAI = "kci-teka-teki-harian-selesai";

/** Jeda sebelum lawan membalas (ms) — cukup untuk melihat bidak mendarat. */
const JEDA_LAWAN = 450;

/** Alamat arsip Chess.com bila data soal belum punya tautan sendiri. */
const URL_CHESSCOM = "https://www.chess.com/daily-chess-puzzle";

function bacaSelesai() {
  try {
    const mentah = JSON.parse(localStorage.getItem(KUNCI_SELESAI) || "{}");
    return mentah && typeof mentah === "object" && !Array.isArray(mentah)
      ? mentah
      : {};
  } catch {
    return {};
  }
}

export default function TekaTekiHarian() {
  const { t, bahasa } = useI18n();
  const { mainkan, mainkanLangkah } = useSuara();
  const [parameter, setParameter] = useSearchParams();

  const locale = bahasa === "en" ? "en-GB" : "id-ID";
  const hariIni = tanggalHariIni();
  const parameterTanggal = parameter.get("tanggal");
  const tanggal = tanggalSah(parameterTanggal) ? parameterTanggal : hariIni;

  /** "memuat" | "siap" | "kosong" | "galat" */
  const [status, setStatus] = useState("memuat");
  const [galat, setGalat] = useState(null);
  const [alasan, setAlasan] = useState(null);
  const [soal, setSoal] = useState(null);
  const [solusi, setSolusi] = useState([]);

  const [posisi, setPosisi] = useState(null);
  const [sisa, setSisa] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [kesalahan, setKesalahan] = useState(null);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [petunjuk, setPetunjuk] = useState(null);
  const [promosi, setPromosi] = useState(null);
  const [pesan, setPesan] = useState(null); // { jenis, kunci | teks }
  const [selesai, setSelesai] = useState(false);
  const [menungguLawan, setMenungguLawan] = useState(false);
  const [arsipSelesai, setArsipSelesai] = useState(bacaSelesai);
  /** Penghitung percobaan muat — "Coba lagi" menaikkannya agar efek muat
   *  berjalan ulang walau tanggalnya sama. */
  const [percobaan, setPercobaan] = useState(0);
  /** `true` bila soal dilayani dari snapshot lokal karena API gagal. */
  const [dariArsip, setDariArsip] = useState(false);

  const jamLawan = useRef(null);
  const jamKesalahan = useRef(null);
  const orientasi = useMemo(
    () => (posisi ? warnaGiliran(posisi) : soal?.fen ? warnaGiliran(soal.fen) : "w"),
    [posisi, soal]
  );

  /* ------------------------------------------------------------ pemuatan */

  useEffect(() => {
    let hidup = true;
    window.clearTimeout(jamLawan.current);

    setStatus("memuat");
    setGalat(null);
    setAlasan(null);
    setSelesai(false);
    setMenungguLawan(false);
    setRiwayat([]);
    setTerpilih(null);
    setSasaran([]);
    setKesalahan(null);
    setLangkahAkhir(null);
    setPetunjuk(null);
    setPromosi(null);
    setPesan(null);
    setDariArsip(false);

    /*
     * Urutan sumber: API dulu (soal terbaru, termasuk hari ini), lalu snapshot
     * lokal sebagai jaring pengaman. Snapshot TIDAK dipakai selama API sehat —
     * ia hanya menolong saat Chess.com lambat, limit, atau sedang down.
     */
    (async () => {
      const pakaiApi = async () => {
        const data = await ambilTekaTekiHarian(
          tanggal === hariIni ? undefined : tanggal
        );
        if (!data?.tersedia) {
          return {
            kosong: true,
            tanggal: data?.tanggal || tanggal,
            alasan: data?.alasan || "tidak-ada",
          };
        }
        const hasil = parsePgnTekaTeki(data.pgn, { fen: data.fen });
        if (!hasil.langkah.length) {
          return { kosong: true, tanggal, alasan: "data-tidak-lengkap" };
        }
        return {
          soal: {
            tanggal: data.tanggal || tanggal,
            url: data.url || `${URL_CHESSCOM}/${tanggal}`,
            judul: data.judul || "",
          },
          fen: hasil.fen,
          langkah: hasil.langkah,
          dariArsip: false,
        };
      };

      const pakaiSnapshot = async () => {
        const data = await ambilSoalTanggal(tanggal);
        if (!data) return null;
        return {
          soal: { tanggal: data.tanggal, url: data.url, judul: "" },
          fen: data.fen,
          langkah: data.langkah,
          dariArsip: true,
        };
      };

      try {
        const hasil = await pakaiApi();
        if (!hidup) return;
        if (hasil.kosong) {
          setSoal({ tanggal: hasil.tanggal, url: `${URL_CHESSCOM}/${hasil.tanggal}` });
          setSolusi([]);
          setSisa([]);
          setPosisi(null);
          setAlasan(hasil.alasan);
          setStatus("kosong");
          return;
        }
        terapkanHasil(hasil);
      } catch (e) {
        // API gagal → coba snapshot sebelum menyerah.
        try {
          const cadangan = await pakaiSnapshot();
          if (!hidup) return;
          if (cadangan) {
            terapkanHasil(cadangan);
            return;
          }
        } catch {
          /* snapshot juga tidak ada — jatuh ke keadaan galat di bawah */
        }
        if (!hidup) return;
        setGalat(e);
        setStatus("galat");
      }
    })();

    function terapkanHasil(hasil) {
      setSoal(hasil.soal);
      setSolusi(hasil.langkah);
      setPosisi(hasil.fen);
      setSisa(hasil.langkah.slice());
      setDariArsip(hasil.dariArsip);
      setStatus("siap");
    }

    return () => {
      hidup = false;
    };
  }, [tanggal, hariIni, percobaan]);

  // Bersihkan timer saat halaman ditinggalkan.
  useEffect(
    () => () => {
      window.clearTimeout(jamLawan.current);
      window.clearTimeout(jamKesalahan.current);
    },
    []
  );

  /* -------------------------------------------------------------- bantuan */

  const simpanSelesai = useCallback(
    (untukTanggal) => {
      if (!untukTanggal) return;
      setArsipSelesai((lama) => {
        const baru = { ...lama, [untukTanggal]: new Date().toISOString() };
        try {
          localStorage.setItem(KUNCI_SELESAI, JSON.stringify(baru));
        } catch {
          /* mode privat / kuota penuh — progres tetap jalan di sesi ini */
        }
        return baru;
      });
    },
    []
  );

  const tandaiSelesai = useCallback(() => {
    setSelesai(true);
    setMenungguLawan(false);
    setPetunjuk(null);
    setPesan({ jenis: "selesai", kunci: "tekaTekiHarian.terpecahkan" });
    mainkan(SUARA.tekaTekiTuntas);
    simpanSelesai(soal?.tanggal || tanggal);
  }, [mainkan, simpanSelesai, soal, tanggal]);

  /** Mainkan sisa langkah sampai habis, lalu tandai selesai. */
  const mainkanLawan = useCallback(
    (daftarSisa, posisiSekarang) => {
      if (!daftarSisa.length) return;
      const uci = daftarSisa[0];
      setMenungguLawan(true);

      jamLawan.current = window.setTimeout(() => {
        try {
          const { from, to, promo } = parseLangkah(uci);
          const game = terapkan(posisiSekarang, { from, to, promo });
          const san = game.history({ verbose: true }).slice(-1)[0]?.san || uci;
          const baru = daftarSisa.slice(1);

          setPosisi(game.fen());
          setSisa(baru);
          setRiwayat((r) => [...r, san]);
          setLangkahAkhir({ from, to });
          setTerpilih(null);
          setSasaran([]);
          setMenungguLawan(false);
          mainkanLangkah(game.history({ verbose: true }).slice(-1)[0], game);

          if (!baru.length) tandaiSelesai();
        } catch {
          // Data solusi rusak (tidak seharusnya terjadi karena server hanya
          // meneruskan PGN Chess.com). Buka kunci papan agar halaman tidak
          // macet selamanya.
          setMenungguLawan(false);
          setPesan({ jenis: "salah", kunci: "tekaTekiHarian.salah" });
        }
      }, JEDA_LAWAN);
    },
    [mainkanLangkah, tandaiSelesai]
  );

  /* -------------------------------------------------------------- langkah */

  function mulaiUlang() {
    window.clearTimeout(jamLawan.current);
    setPosisi(soal?.fen || null);
    setSisa(solusi.slice());
    setRiwayat([]);
    setSelesai(false);
    setMenungguLawan(false);
    setTerpilih(null);
    setSasaran([]);
    setKesalahan(null);
    setLangkahAkhir(null);
    setPetunjuk(null);
    setPromosi(null);
    setPesan(null);
  }

  function pilihPetak(petak) {
    if (!posisi || selesai || menungguLawan) return;
    const game = new Chess(posisi);
    const bidak = game.get(petak);
    if (bidak && bidak.color === game.turn()) {
      const langkah = game.moves({ square: petak, verbose: true });
      // Pemain mulai memilih: pesan lama ("Tepat! …" / "belum tepat") tidak
      // perlu menetap di layar.
      setPesan(null);
      setTerpilih(petak);
      setSasaran(langkah.map((m) => m.to));
    } else {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  function klikPetak(petak) {
    if (!posisi || selesai || menungguLawan) return;
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
    if (!posisi || selesai || menungguLawan || !sisa.length) return;

    const diharapkan = parseLangkah(sisa[0]);
    const legal = apakahLangkahLegal(posisi, from, to);
    const promosiDiminta = butuhPromosi(posisi, from, to);

    // Pion menuju baris terakhir: tanyakan bidak promosi dulu, jangan langsung
    // menilai langkah yang belum lengkap.
    if (promosiDiminta.butuh && legal && !promo) {
      setPromosi({ from, to, warna: promosiDiminta.warna });
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
      window.clearTimeout(jamKesalahan.current);
      mainkan(legal ? SUARA.tekaTekiSalah : SUARA.ilegal);
      setPesan({
        jenis: "salah",
        kunci: legal
          ? "tekaTekiHarian.salah"
          : "tekaTekiHarian.bukanLangkahLegal",
      });
      setKesalahan({ from, to });
      setTerpilih(null);
      setSasaran([]);
      jamKesalahan.current = window.setTimeout(() => setKesalahan(null), 700);
      return;
    }

    const san = berikutnya.history({ verbose: true }).slice(-1)[0]?.san || "";
    const sisaBaru = sisa.slice(1);

    setPosisi(berikutnya.fen());
    setSisa(sisaBaru);
    setRiwayat((r) => [...r, san]);
    setLangkahAkhir({ from, to });
    setTerpilih(null);
    setSasaran([]);
    setKesalahan(null);
    setPetunjuk(null);
    mainkanLangkah(berikutnya.history({ verbose: true }).slice(-1)[0], berikutnya);

    if (!sisaBaru.length) {
      tandaiSelesai();
      return;
    }
    // Selalu tampilkan "Tepat! Lawan membalas…" sebentar, lalu lawan bergerak.
    setPesan({ jenis: "benar", kunci: "tekaTekiHarian.benar" });
    mainkanLawan(sisaBaru, berikutnya.fen());
  }

  function tampilkanPetunjuk() {
    if (!sisa.length || selesai) return;
    const { from, to } = parseLangkah(sisa[0]);
    setPetunjuk({ from, to });
    setPesan({ jenis: "petunjuk", kunci: "tekaTekiHarian.petunjukTampil" });
  }

  /* ---------------------------------------------------------------- data */

  function pilihTanggal(baru) {
    if (!tanggalSah(baru)) return;
    const berikut = new URLSearchParams(parameter);
    if (baru === hariIni) berikut.delete("tanggal");
    else berikut.set("tanggal", baru);
    setParameter(berikut, { replace: false });
  }

  const teksPesan = pesan ? pesan.teks || t(pesan.kunci) : "";

  const jumlahLangkah = sisa.length;
  // Arsip teka-teki harian Chess.com dimulai 8 Mei 2007; tanggal ke depan
  // tidak mungkin punya soal, jadi "hari ini" adalah batas atasnya.
  const batasAwal = "2007-05-08";
  const batasAkhir = hariIni;
  const bisaMundur = tanggal > batasAwal;
  const bisaMaju = tanggal < batasAkhir;
  const sudahSelesaiSebelumnya = !!arsipSelesai[soal?.tanggal || tanggal];
  /* -------------------------------------------------------------- render */

  return (
    <>
      <MetaHalaman
        title={t("tekaTekiHarian.judul")}
        description={t("tekaTekiHarian.metaDeskripsi")}
        path="/teka-teki-harian"
      />

      <div className="flex min-h-screen flex-col bg-[#262421] text-gray-200">
        {/* Bar atas: jalan kembali, judul, dan tautan ke halaman asli. */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#312e2b] bg-[#211f1c] px-4 py-3">
          <Link
            to="/teka-teki/problem"
            className="text-xs font-bold uppercase tracking-wider text-gray-300 transition hover:text-white"
          >
            ← {t("tekaTekiHarian.kembali")}
          </Link>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white">
            {t("tekaTekiHarian.judul")}
          </h1>
          <a
            href={soal?.url || URL_CHESSCOM}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-emerald-300 underline-offset-4 transition hover:text-emerald-200 hover:underline"
          >
            Chess.com ↗
          </a>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">
          {/* ---------------------------------------------------- papan */}
          <section className="order-2 w-full lg:order-1 lg:flex-1">
            <div className="relative mx-auto w-full max-w-[min(92vw,620px)]">
              {status === "memuat" && (
                <div className="flex aspect-square w-full items-center justify-center rounded bg-[#211f1c] ring-1 ring-[#312e2b]">
                  <p className="text-sm font-semibold text-gray-400">
                    {t("tekaTekiHarian.memuat")}
                  </p>
                </div>
              )}

              {status === "galat" && (
                <div
                  role="alert"
                  className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded bg-[#211f1c] p-6 text-center ring-1 ring-[#312e2b]"
                >
                  <p className="text-sm text-gray-300">
                    {teksGalat(galat, t, "tekaTekiHarian.gagalMuat")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPercobaan((n) => n + 1)}
                    className="rounded-md bg-[#81b64c] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#6d9c3f]"
                  >
                    {t("tekaTekiHarian.coba")}
                  </button>
                </div>
              )}

              {(status === "kosong" ||
                (status === "siap" && !solusi.length)) && (
                <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded bg-[#211f1c] p-6 text-center ring-1 ring-[#312e2b]">
                  <p className="text-sm text-gray-300">
                    {t(
                      status === "siap"
                        ? "tekaTekiHarian.solusiTidakAda"
                        : alasan === "masa-depan"
                          ? "tekaTekiHarian.masaDepan"
                          : "tekaTekiHarian.tidakTersedia"
                    )}
                  </p>
                  {tanggal !== hariIni && (
                    <button
                      type="button"
                      onClick={() => pilihTanggal(hariIni)}
                      className="rounded-md bg-[#312e2b] px-4 py-2 text-sm font-bold text-gray-100 transition hover:bg-[#3d3a37]"
                    >
                      {t("tekaTekiHarian.keHariIni")}
                    </button>
                  )}
                </div>
              )}

              {status === "siap" && posisi && solusi.length > 0 && (
                <PapanTekaTeki
                  fen={posisi}
                  orientasi={orientasi}
                  terpilih={terpilih}
                  sasaran={sasaran}
                  petunjuk={petunjuk}
                  kesalahan={kesalahan}
                  langkahAkhir={langkahAkhir}
                  panahMesin={petunjuk ? { ...petunjuk, warna: "bawaan" } : null}
                  terkunci={selesai || menungguLawan || !!promosi || !solusi.length}
                  membeku={menungguLawan}
                  onKlik={klikPetak}
                  onPilih={pilihPetak}
                  onJatuh={cobaLangkah}
                />
              )}

              {promosi && (
                <div
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
                  onClick={() => setPromosi(null)}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("tekaTekiHarian.promosiJudul")}
                    className="flex flex-col items-center gap-3 rounded-lg bg-[#262421] p-4 ring-1 ring-[#3d3a37]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm font-bold text-white">
                      {t(
                        promosi.warna === "w"
                          ? "tekaTekiHarian.promosiPutih"
                          : "tekaTekiHarian.promosiHitam"
                      )}
                    </p>
                    <div className="flex gap-2">
                      {[
                        ["q", "promosiMenteri"],
                        ["r", "promosiBenteng"],
                        ["b", "promosiGajah"],
                        ["n", "promosiKuda"],
                      ].map(([kode, kunci]) => (
                        <button
                          key={kode}
                          type="button"
                          onClick={() => {
                            const { from, to } = promosi;
                            setPromosi(null);
                            cobaLangkah(from, to, kode);
                          }}
                          className="rounded-md bg-[#312e2b] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#3d3a37]"
                        >
                          {t(`tekaTekiHarian.${kunci}`)}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPromosi(null)}
                      className="text-xs font-semibold text-gray-400 transition hover:text-white"
                    >
                      {t("tekaTekiHarian.promosiBatal")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* --------------------------------------------------- panel */}
          <aside className="order-1 flex w-full flex-col gap-4 rounded-lg bg-[#211f1c] p-4 ring-1 ring-[#312e2b] lg:order-2 lg:w-[380px]">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                {tanggal === hariIni
                  ? t("tekaTekiHarian.hariIni")
                  : t("tekaTekiHarian.arsip")}{" "}
                · {tanggalTerbaca(soal?.tanggal || tanggal, locale)}
              </span>
              <h2 className="text-lg font-bold text-white">
                {soal?.judul || t("tekaTekiHarian.judul")}
              </h2>
              {sudahSelesaiSebelumnya && !selesai && (
                <span className="w-fit rounded bg-[#26331c] px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  {t("tekaTekiHarian.sudahSelesai")}
                </span>
              )}
              <p className="text-xs leading-relaxed text-gray-400">
                {t("tekaTekiHarian.pembuka")}
              </p>
              {dariArsip && (
                <p className="rounded bg-[#312e2b] px-2 py-1 text-[11px] font-semibold text-amber-300">
                  {t("tekaTekiHarian.dariArsip")}
                </p>
              )}
            </div>

            {/* Navigasi tanggal. */}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => pilihTanggal(geserTanggal(tanggal, -1))}
                disabled={!bisaMundur}
                aria-label={t("tekaTekiHarian.geserSebelumnya")}
                className="rounded-md bg-[#312e2b] px-3 py-2 text-sm font-bold text-gray-200 transition hover:bg-[#3d3a37] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ←
              </button>
              <label className="flex flex-1 flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {t("tekaTekiHarian.pilihTanggal")}
                <input
                  type="date"
                  value={tanggal}
                  max={batasAkhir}
                  min={batasAwal}
                  onChange={(e) => pilihTanggal(e.target.value)}
                  className="rounded-md border border-[#363431] bg-[#262421] px-2 py-1.5 text-sm font-normal normal-case tracking-normal text-gray-200 outline-none focus:border-[#81b64c]"
                />
              </label>
              <button
                type="button"
                onClick={() => pilihTanggal(geserTanggal(tanggal, 1))}
                disabled={!bisaMaju}
                aria-label={t("tekaTekiHarian.geserBerikutnya")}
                className="rounded-md bg-[#312e2b] px-3 py-2 text-sm font-bold text-gray-200 transition hover:bg-[#3d3a37] disabled:cursor-not-allowed disabled:opacity-40"
              >
                →
              </button>
            </div>

            {/* Status permainan. */}
            {status === "siap" && solusi.length > 0 && (
              <div className="flex flex-col gap-2 rounded-md bg-[#262421] p-3 ring-1 ring-[#312e2b]">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <span
                      className={`h-3 w-3 rounded-sm border ${
                        orientasi === "w"
                          ? "border-gray-400 bg-white"
                          : "border-gray-600 bg-[#1e1c18]"
                      }`}
                    />
                    {t("tekaTekiHarian.giliranMelangkah")}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-300">
                    {selesai
                      ? t("tekaTekiHarian.terpecahkan")
                      : jumlahLangkah === 1
                        ? t("tekaTekiHarian.satuLangkah")
                        : t("tekaTekiHarian.langkahTersisa", {
                            n: jumlahLangkah,
                          })}
                  </span>
                </div>
                <p
                  aria-live="polite"
                  className={`min-h-[1.25rem] text-sm font-semibold ${
                    selesai
                      ? "text-emerald-300"
                      : pesan?.jenis === "salah"
                        ? "text-red-400"
                        : "text-gray-200"
                  }`}
                >
                  {teksPesan}
                </p>
                {selesai && (
                  <p className="text-[11px] text-gray-400">
                    {t("tekaTekiHarian.terpecahkanCatatan")}
                  </p>
                )}
              </div>
            )}

            {/* Aksi. */}
            {status === "siap" && solusi.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={tampilkanPetunjuk}
                  disabled={selesai || menungguLawan}
                  className="rounded-md bg-[#312e2b] px-3 py-2 text-sm font-bold text-gray-100 transition hover:bg-[#3d3a37] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("tekaTekiHarian.petunjuk")}
                </button>
                <button
                  type="button"
                  onClick={mulaiUlang}
                  className="rounded-md bg-[#312e2b] px-3 py-2 text-sm font-bold text-gray-100 transition hover:bg-[#3d3a37]"
                >
                  {t("tekaTekiHarian.ulangi")}
                </button>
              </div>
            )}

            {/* Riwayat langkah (solusi yang sudah dimainkan). */}
            {riwayat.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {t("tekaTekiHarian.riwayat")}
                </span>
                <ol className="grid grid-cols-1 gap-1 text-sm text-gray-300">
                  {pasanganLangkah(
                    riwayat,
                    soal?.fen ? warnaGiliran(soal.fen) : "w"
                  ).map((baris) => (
                    <li key={baris.nomor} className="flex gap-2">
                      <span className="w-6 shrink-0 text-right text-gray-500">
                        {baris.nomor}.
                      </span>
                      <span className="w-20">{baris.putih || "…"}</span>
                      <span className="w-20 text-gray-400">
                        {baris.hitam || ""}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Atribusi + tautan sumber. */}
            <div className="mt-auto flex flex-col gap-2 border-t border-[#312e2b] pt-3">
              <p className="text-[11px] leading-relaxed text-gray-500">
                {t("tekaTekiHarian.sumber")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={soal?.url || URL_CHESSCOM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-300 underline-offset-4 transition hover:underline"
                >
                  {t("tekaTekiHarian.bukaDiChessCom")}
                </a>
                <Link
                  to="/program-kami/atribusi"
                  className="flex items-center gap-1 text-xs font-semibold text-gray-400 transition hover:text-white"
                >
                  <License size={12} class="fill-current" />
                  {t("papan.menuAtribusi")}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
