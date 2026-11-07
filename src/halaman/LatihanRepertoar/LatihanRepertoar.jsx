import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";
import Back from "../PapanInteraktif/bersama/ikon/back.jsx";
import { BarisProfil } from "../PapanInteraktif/bersama/BarisProfil.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import {
  buatKartuDariJalur,
  cocokLangkahBuku,
  idJalurPembukaan,
  indeksJalurPembukaan,
  jadwalkanKartu,
  kartuBerikutnya,
  kelompokkanPerPembukaan,
  posisiAkhirJalur,
  progresJalur,
  uraiUci,
} from "./repertoarLogika.js";
import {
  bacaKartuRepertoar,
  hapusJalurRepertoar,
  simpanKartuRepertoar,
} from "./repertoarStorage.js";
import { FEN_AWAL } from "../PapanInteraktif/bersama/konstanta.js";
import { PENGATURAN_AWAL, usePengaturanPapan } from "../PapanInteraktif/bersama/gunakanPengaturanPapan.js";
import { usePengaturanBersama } from "../PapanInteraktif/bersama/PengaturanKonteks.jsx";
import { Link, useNavigate } from "react-router-dom";
import { useTandaBantu } from "../../lib/tandaBantu.js";
import PapanStatis from "../../components/PapanStatis.jsx";
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

/** Pola petak papan yang sah (a1–h8). */
const POLA_PETAK = /^[a-h][1-8]$/;

/**
 * Warna panel petunjuk dasbor per status latihan — netral saat menunggu,
 * hijau saat jawaban benar, kuning saat belum tepat, redup saat sesi selesai.
 */
const WARNA_PETUNJUK = {
  menunggu: "border-[#363431] bg-[#262421] text-gray-200",
  benar: "border-[#3f5a26] bg-[#243016] text-[#cfe8a6]",
  salah: "border-[#6b4c15] bg-[#2c2313] text-amber-200",
  selesai: "border-[#363431] bg-[#262421] text-gray-300",
};

export default function LatihanRepertoar({ pengaturan = null }) {
  const { t } = useI18n();
  const navigasi = useNavigate();
  // Terima pengaturan dari tata letak /papan-interaktif/* (konteks bersama);
  // tanpa itu buat state lokal agar komponen tetap berdiri sendiri.
  const pengaturanLokal = usePengaturanPapan();
  const pengaturanBersama = usePengaturanBersama();
  const pp = (pengaturan ?? pengaturanBersama ?? pengaturanLokal).nilai ?? PENGATURAN_AWAL;

  const [kartu, setKartu] = useState([]);
  const [memuatKartu, setMemuatKartu] = useState(true);
  const [tampilan, setTampilan] = useState("koleksi");
  const [jalurBuku, setJalurBuku] = useState([]);
  const [bukuSiap, setBukuSiap] = useState(false);
  const [memuatBuku, setMemuatBuku] = useState(false);
  const [galatBuku, setGalatBuku] = useState(false);
  const [pencarian, setPencarian] = useState("");
  const [jalurTerpilih, setJalurTerpilih] = useState(null);
  const [warnaLatihan, setWarnaLatihan] = useState("w");
  const [pesan, setPesan] = useState("");
  const [sekarang, setSekarang] = useState(Date.now());
  const [jalurAktif, setJalurAktif] = useState(null);
  const [kartuAktif, setKartuAktif] = useState(null);
  const [fen, setFen] = useState(FEN_AWAL);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [statusLatihan, setStatusLatihan] = useState("menunggu");
  const [langkahSalah, setLangkahSalah] = useState(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [jalurAkanDihapus, setJalurAkanDihapus] = useState(null);
  // Halaman pembukaan (gaya "Garis 1/2"): kunci pembukaan + indeks garis aktif.
  const [pembukaanAktif, setPembukaanAktif] = useState(null);
  const [indeksGaris, setIndeksGaris] = useState(0);
  const { tanda, tandaPetak, tandaPanah, hapusSemuaTanda } = useTandaBantu();

  useEffect(() => {
    let aktif = true;
    bacaKartuRepertoar()
      .then((data) => {
        if (aktif) setKartu(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (aktif) setMemuatKartu(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  // Status "jatuh tempo" dihitung dari `sekarang`; tanpa detak, tab yang
  // dibiarkan terbuka akan menampilkan jadwal basi (tombol Mulai tetap mati).
  useEffect(() => {
    const timer = setInterval(() => setSekarang(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Otomatis hapus pesan status setelah 5 detik agar layar tidak penuh teks.
  useEffect(() => {
    if (!pesan) return undefined;
    const timer = setTimeout(() => setPesan(""), 5000);
    return () => clearTimeout(timer);
  }, [pesan]);

  async function muatBuku() {
    if (bukuSiap || memuatBuku) return;
    setMemuatBuku(true);
    setGalatBuku(false);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/buku-pembukaan.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setJalurBuku(indeksJalurPembukaan(data));
      setBukuSiap(true);
    } catch {
      setGalatBuku(true);
    } finally {
      setMemuatBuku(false);
    }
  }

  function bukaTambah() {
    setTampilan("tambah");
    setPesan("");
    void muatBuku();
  }

  // Katalog berisi ribuan jalur; daftar ditampilkan bertahap supaya hasil
  // pencarian yang lebar tidak terpotong diam-diam di 60 baris pertama.
  const [batasKatalog, setBatasKatalog] = useState(60);

  useEffect(() => {
    setBatasKatalog(60);
  }, [pencarian]);

  const jalurCocok = useMemo(() => {
    const term = pencarian.trim().toLowerCase();
    if (!term) return jalurBuku;
    return jalurBuku.filter((jalur) => `${jalur.eco} ${jalur.nama}`.toLowerCase().includes(term));
  }, [jalurBuku, pencarian]);

  const jalurTersaring = useMemo(
    () => jalurCocok.slice(0, batasKatalog),
    [jalurCocok, batasKatalog],
  );

  /*
   * Pratinjau posisi akhir jalur untuk panel kanan. Cukup `PapanStatis`:
   * papan pemutar penuh (`PapanTekaTeki`) akan menarik chunk besar dan
   * mengaktifkan seret bidak yang tidak diperlukan di layar pemilihan.
   */
  const pratinjauJalur = useMemo(
    () => posisiAkhirJalur(jalurTerpilih?.moves),
    [jalurTerpilih],
  );

  const teksLangkahPratinjau = useMemo(() => {
    if (!pratinjauJalur) return "";
    return pratinjauJalur.san
      .map((langkah, indeks) =>
        indeks % 2 === 0 ? `${Math.floor(indeks / 2) + 1}. ${langkah}` : langkah,
      )
      .join(" ");
  }, [pratinjauJalur]);

  const daftarRepertoar = useMemo(() => {
    const map = new Map();
    for (const item of kartu) {
      let jalur = map.get(item.lineId);
      if (!jalur) {
        jalur = {
          lineId: item.lineId,
          eco: item.eco,
          nama: item.nama,
          warna: item.warna,
          jumlah: 0,
          jatuhTempo: 0,
          daftarKartu: [],
        };
        map.set(item.lineId, jalur);
      }
      jalur.jumlah += 1;
      jalur.daftarKartu.push(item);
      if (Number(item.dueAt) <= sekarang) jalur.jatuhTempo += 1;
    }
    return [...map.values()]
      .map((jalur) => ({ ...jalur, ...progresJalur(jalur.daftarKartu) }))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [kartu, sekarang]);

  const daftarPembukaan = useMemo(
    () => kelompokkanPerPembukaan(daftarRepertoar),
    [daftarRepertoar],
  );

  const pembukaanTerpilih = useMemo(
    () => daftarPembukaan.find((grup) => grup.kunci === pembukaanAktif) || null,
    [daftarPembukaan, pembukaanAktif],
  );

  const garisAktif = pembukaanTerpilih?.garis[indeksGaris] || null;

  function bukaPembukaan(jalur) {
    const kunci = `${jalur.eco}|${jalur.nama}`;
    const grup = daftarPembukaan.find((item) => item.kunci === kunci);
    if (!grup) return;
    const posisi = grup.garis.findIndex((item) => item.lineId === jalur.lineId);
    setPembukaanAktif(kunci);
    setIndeksGaris(posisi >= 0 ? posisi : 0);
    setTampilan("pembukaan");
    setPesan("");
  }

  function pindahGaris(arah) {
    if (!pembukaanTerpilih) return;
    const total = pembukaanTerpilih.garis.length;
    setIndeksGaris((lama) => (lama + arah + total) % total);
  }

  async function tambahJalur() {
    if (!jalurTerpilih) return;
    const lineId = idJalurPembukaan({
      eco: jalurTerpilih.eco,
      nama: jalurTerpilih.nama,
      warna: warnaLatihan,
    });
    if (kartu.some((item) => item.lineId === lineId)) {
      setPesan(t("papan.repertoarSudahAda"));
      return;
    }
    const baru = buatKartuDariJalur(jalurTerpilih, warnaLatihan);
    if (!baru.length) {
      setPesan(t("papan.repertoarJalurKosong"));
      return;
    }
    const berhasil = await simpanKartuRepertoar(baru);
    setKartu((lama) => [...lama, ...baru]);
    setSekarang(Date.now());
    if (!berhasil) {
      setPesan(t("papan.repertoarPenyimpananTerbatas"));
    } else {
      setPesan(t("papan.repertoarBerhasilTambah", { jumlah: baru.length }));
    }
    setTampilan("koleksi");
  }

  function mulaiLatihan(lineId) {
    const berikutnya = kartuBerikutnya(kartu, lineId, Date.now());
    if (!berikutnya) {
      setPesan(t("papan.repertoarBelumJatuhTempo"));
      return;
    }
    setJalurAktif(lineId);
    setKartuAktif(berikutnya);
    setFen(berikutnya.fen);
    setLangkahAkhir(null);
    setTerpilih(null);
    setSasaran([]);
    setLangkahSalah(null);
    setStatusLatihan("menunggu");
    hapusSemuaTanda();
    setTampilan("latihan");
    setPesan("");
  }

  function pilihPetak(square) {
    if (statusLatihan !== "menunggu" || !kartuAktif) return;
    if (!POLA_PETAK.test(square)) {
      setTerpilih(null);
      setSasaran([]);
      return;
    }
    if (terpilih === square) {
      setTerpilih(null);
      setSasaran([]);
      return;
    }
    try {
      const game = new Chess(fen);
      const piece = game.get(square);
      if (piece && piece.color === kartuAktif.warna && game.turn() === kartuAktif.warna) {
        setTerpilih(square);
        setSasaran(game.moves({ square, verbose: true }).map((move) => move.to));
      } else {
        setTerpilih(null);
        setSasaran([]);
      }
    } catch {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  function jawabLangkah(from, to) {
    if (statusLatihan !== "menunggu" || !kartuAktif) return;
    if (!POLA_PETAK.test(from) || !POLA_PETAK.test(to)) return;
    const game = new Chess(fen);
    let pindah;
    const piece = game.get(from);
    const promotion = piece?.type === "p" && (to.endsWith("1") || to.endsWith("8")) ? "q" : undefined;
    try {
      pindah = game.move({ from, to, ...(promotion ? { promotion } : {}) });
    } catch {
      pindah = null;
    }
    if (!pindah) {
      // Langkah ilegal (mis. seret jatuh ke petak yang tidak sah) — beri
      // feedback singkat ke pengguna alih-alih diam saja.
      setPesan(t("papan.repertoarLangkahIlegal"));
      setTerpilih(null);
      setSasaran([]);
      return;
    }

    setTerpilih(null);
    setSasaran([]);
    setLangkahSalah(null);
    setPesan("");
    if (cocokLangkahBuku(pindah, kartuAktif.expectedUci)) {
      // Papan dimajukan dengan langkah BUKU, bukan langkah pemain: pada
      // promosi, pilihan bidak pemain boleh berbeda dari buku tanpa membuat
      // jawabannya salah — posisi berikutnya harus tetap posisi buku.
      const buku = new Chess(fen);
      const urai = uraiUci(kartuAktif.expectedUci);
      let langkahBuku;
      try {
        langkahBuku = urai ? buku.move(urai) : null;
      } catch {
        langkahBuku = null;
      }
      if (langkahBuku) {
        setFen(buku.fen());
        setLangkahAkhir({ from: langkahBuku.from, to: langkahBuku.to });
        setStatusLatihan("benar");
      } else {
        setLangkahSalah(pindah.san);
        setStatusLatihan("salah");
      }
    } else {
      setLangkahSalah(pindah.san);
      setStatusLatihan("salah");
    }
  }

  async function nilaiKartu(nilai) {
    if (!kartuAktif || !jalurAktif || menyimpan) return;
    setMenyimpan(true);
    try {
      const waktu = Date.now();
      const diperbarui = jadwalkanKartu(kartuAktif, nilai, waktu);
      const berhasil = await simpanKartuRepertoar([diperbarui]);
      const daftarBaru = kartu.map((item) => (item.id === diperbarui.id ? diperbarui : item));
      setKartu(daftarBaru);
      setSekarang(waktu);
      const berikutnya = kartuBerikutnya(daftarBaru, jalurAktif, waktu);
      setKartuAktif(berikutnya);
      setLangkahSalah(null);
      setTerpilih(null);
      setSasaran([]);
      if (berikutnya) {
        setFen(berikutnya.fen);
        setLangkahAkhir(null);
        setStatusLatihan("menunggu");
      } else {
        setStatusLatihan("selesai");
      }
      if (!berhasil) setPesan(t("papan.repertoarPenyimpananTerbatas"));
    } finally {
      setMenyimpan(false);
    }
  }

  async function hapusJalur(lineId) {
    const berhasil = await hapusJalurRepertoar(lineId);
    setKartu((lama) => lama.filter((item) => item.lineId !== lineId));
    if (!berhasil) setPesan(t("papan.repertoarPenyimpananTerbatas"));
    else setPesan("");
  }

  /*
   * Tombol kembali di kepala halaman katalog. Dari sub-layar (tambah jalur /
   * halaman pembukaan) ia kembali ke katalog; dari katalog ia keluar dari mode
   * ini ke halaman sebelumnya (mundur riwayat) atau ke papan buku bila halaman
   * dibuka langsung tanpa riwayat.
   */
  function kembaliKeInduk() {
    if (tampilan !== "koleksi") {
      setTampilan("koleksi");
      setKartuAktif(null);
      setJalurAktif(null);
      return;
    }
    if ((window.history.state?.idx ?? 0) > 0) navigasi(-1);
    else navigasi("/papan-interaktif");
  }

  const jumlahJatuhTempo = kartu.filter((item) => Number(item.dueAt) <= sekarang).length;

  /*
   * Angka panel dasbor sesi latihan — semuanya turunan murni dari state yang
   * sudah ada (kartu tersimpan + progres jalur). Tidak ada state baru di sini,
   * jadi alur latihan, validasi langkah, dan penjadwalan kartu tidak berubah.
   */
  const sesiLatihan = useMemo(() => {
    if (!jalurAktif) return null;
    const kartuJalur = kartu
      .filter((item) => item.lineId === jalurAktif)
      .slice()
      .sort((a, b) => a.ply - b.ply);
    const ringkas = daftarRepertoar.find((item) => item.lineId === jalurAktif) || null;
    const dinilai = kartuJalur.filter((item) => item.lastGrade);
    const langsungBenar = dinilai.filter(
      (item) => item.lastGrade === "good" || item.lastGrade === "easy",
    );
    return {
      nama: ringkas?.nama || "",
      eco: ringkas?.eco || "",
      warna: ringkas?.warna || "w",
      total: kartuJalur.length,
      posisi: kartuAktif
        ? kartuJalur.filter((item) => item.ply <= kartuAktif.ply).length
        : 0,
      persen: ringkas?.persen ?? 0,
      matang: ringkas?.matang ?? 0,
      jatuhTempo: ringkas?.jatuhTempo ?? 0,
      dinilai: dinilai.length,
      benar: langsungBenar.length,
      akurasi: dinilai.length ? Math.round((langsungBenar.length / dinilai.length) * 100) : null,
      riwayat: kartuAktif ? kartuJalur.filter((item) => item.ply < kartuAktif.ply) : [],
    };
  }, [kartu, kartuAktif, daftarRepertoar, jalurAktif]);

  if (tampilan === "latihan") {
    const sisiAktif = sesiLatihan?.warna === "w" ? t("papan.pvePutih") : t("papan.pveHitam");
    return (
      <section aria-label={t("papan.repertoarJudul")} className="h-full min-h-0 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          {/* 60/40: papan sebagai fokus di kiri, dasbor latihan di kanan. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
            {/* Kolom papan: avatar lawan → papan → avatar pemain, semua center. */}
            <div className="flex flex-col items-center rounded-2xl border border-[#312e2b] bg-[#211f1c] p-4 shadow-[0_18px_45px_-30px_rgba(0,0,0,0.9)] sm:p-6">
              <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-3 lg:max-w-[min(560px,calc(100dvh-300px))]">
                {kartuAktif && (
                  <BarisProfil
                    nama={kartuAktif.warna === "w" ? t("papan.pveHitam") : t("papan.pvePutih")}
                    putih={kartuAktif.warna === "b"}
                    tangkapan={[]}
                    setBidak={pp.bidak}
                    tanpaJorokan
                    className="w-full"
                  />
                )}

                {kartuAktif ? (
                  <div className="w-full overflow-hidden rounded-lg shadow-[0_22px_50px_-24px_rgba(0,0,0,0.95)] ring-1 ring-black/40">
                    <PapanTekaTeki
                      fen={fen}
                      orientasi={kartuAktif.warna}
                      terpilih={terpilih}
                      sasaran={sasaran}
                      langkahAkhir={langkahAkhir}
                      terkunci={statusLatihan !== "menunggu"}
                      membeku={false}
                      tanda={tanda}
                      setBidak={pp.bidak}
                      tema={pp.warnaPapan}
                      onKlik={(square) => {
                        if (terpilih && sasaran.includes(square)) jawabLangkah(terpilih, square);
                        else pilihPetak(square);
                      }}
                      onJatuh={jawabLangkah}
                      onTandaPetak={tandaPetak}
                      onTandaPanah={tandaPanah}
                      onHapusTanda={hapusSemuaTanda}
                    />
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-[#363431] bg-[#262421] px-6 py-10 text-center">
                    <p className="text-sm text-gray-300">{t("papan.repertoarSesiSelesai")}</p>
                    <button
                      type="button"
                      onClick={() => setTampilan("koleksi")}
                      className="rounded-lg bg-[#81b64c] px-4 py-2 text-sm font-bold text-[#1e1c18] transition hover:bg-[#91c45a]"
                    >
                      {t("papan.repertoarKembali")}
                    </button>
                  </div>
                )}

                {kartuAktif && (
                  <BarisProfil
                    nama={t("papan.pveAnda")}
                    putih={kartuAktif.warna === "w"}
                    tangkapan={[]}
                    setBidak={pp.bidak}
                    namaDiBawah
                    tanpaJorokan
                    className="w-full"
                  />
                )}
              </div>
            </div>

            {/* Dasbor latihan: identitas, progres, posisi, akurasi, petunjuk,
                riwayat langkah, dan target. */}
            <aside className="flex min-w-0 flex-col gap-5 self-start rounded-2xl border border-[#312e2b] bg-[#211f1c] p-4 text-sm text-gray-200 shadow-[0_18px_45px_-30px_rgba(0,0,0,0.9)] sm:p-6">
              {/* Kepala panel: tombol kembali sejajar judul mode, lalu pembatas. */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTampilan("koleksi");
                    setKartuAktif(null);
                    setJalurAktif(null);
                  }}
                  title={t("papan.repertoarKembali")}
                  aria-label={t("papan.repertoarKembali")}
                  className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-[#312e2b] hover:text-white"
                >
                  <Back />
                </button>
                <h1 className="truncate text-lg font-bold text-white">
                  {t("papan.repertoarJudul")}
                </h1>
              </div>
              <div aria-hidden="true" className="h-px w-full bg-[#363431]" />

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[#2c2926] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#a3d168]">
                    {sesiLatihan?.eco || "—"}
                  </span>
                  <span className="rounded bg-[#2c2926] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-300">
                    {sisiAktif}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-bold leading-tight text-white">
                  {sesiLatihan?.nama || t("papan.repertoarSesi")}
                </h2>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {t("papan.repertoarProgresLatihan")}
                  </span>
                  <span className="text-sm font-bold text-[#a3d168]">
                    {sesiLatihan?.persen ?? 0}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={t("papan.repertoarProgresLatihan")}
                  aria-valuenow={sesiLatihan?.persen ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 w-full overflow-hidden rounded-full bg-[#312e2b]"
                >
                  <div
                    className="h-full rounded-full bg-[#81b64c] transition-[width] duration-500"
                    style={{ width: `${sesiLatihan?.persen ?? 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  {t("papan.repertoarJatuhTempo", { jumlah: sesiLatihan?.jatuhTempo ?? 0 })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#312e2b] bg-[#262421] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    {t("papan.repertoarPosisiSaatIni")}
                  </p>
                  <p className="mt-1 text-base font-bold text-white">
                    {sesiLatihan?.posisi ?? 0}
                    <span className="text-xs font-semibold text-gray-500">
                      {" / "}
                      {sesiLatihan?.total ?? 0}
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-[#312e2b] bg-[#262421] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    {t("papan.repertoarAkurasi")}
                  </p>
                  <p className="mt-1 text-base font-bold text-white">
                    {sesiLatihan?.akurasi === null || sesiLatihan?.akurasi === undefined
                      ? "—"
                      : `${sesiLatihan.akurasi}%`}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-gray-500">
                    {sesiLatihan?.dinilai
                      ? t("papan.repertoarAkurasiRincian", {
                          benar: sesiLatihan.benar,
                          total: sesiLatihan.dinilai,
                        })
                      : t("papan.repertoarAkurasiKosong")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {t("papan.repertoarPetunjuk")}
                </p>
                <div
                  aria-live="polite"
                  className={`rounded-xl border px-3 py-2.5 text-sm ${WARNA_PETUNJUK[statusLatihan] || WARNA_PETUNJUK.menunggu}`}
                >
                  {statusLatihan === "benar"
                    ? t("papan.repertoarJawabanBenar")
                    : statusLatihan === "salah"
                      ? t("papan.repertoarJawabanSalah")
                      : statusLatihan === "selesai"
                        ? t("papan.repertoarSesiSelesai")
                        : t("papan.repertoarInstruksi")}
                  {statusLatihan === "salah" && (
                    <p className="mt-1 text-xs font-semibold text-amber-300">
                      {t("papan.repertoarJawaban", { san: kartuAktif?.expectedSan || "" })}
                      {langkahSalah ? ` (${langkahSalah})` : ""}
                    </p>
                  )}
                </div>

                {statusLatihan === "benar" && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["again", "papan.repertoarLagi"],
                      ["hard", "papan.repertoarSulit"],
                      ["good", "papan.repertoarBaik"],
                      ["easy", "papan.repertoarMudah"],
                    ].map(([nilai, label]) => (
                      <button
                        key={nilai}
                        type="button"
                        onClick={() => void nilaiKartu(nilai)}
                        disabled={menyimpan}
                        className="rounded-lg border border-[#363431] bg-[#262421] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#81b64c] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {t(label)}
                      </button>
                    ))}
                  </div>
                )}
                {statusLatihan === "salah" && (
                  <button
                    type="button"
                    onClick={() => void nilaiKartu("again")}
                    disabled={menyimpan}
                    className="rounded-lg bg-[#81b64c] px-3 py-2.5 text-sm font-bold text-[#1e1c18] transition hover:bg-[#91c45a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("papan.repertoarUlangi")}
                  </button>
                )}
                {statusLatihan === "selesai" && (
                  <button
                    type="button"
                    onClick={() => setTampilan("koleksi")}
                    className="rounded-lg bg-[#81b64c] px-3 py-2.5 text-sm font-bold text-[#1e1c18] transition hover:bg-[#91c45a]"
                  >
                    {t("papan.repertoarKembali")}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {t("papan.repertoarRiwayatLangkah")}
                </p>
                {sesiLatihan?.riwayat.length ? (
                  <ol className="flex flex-wrap gap-1.5">
                    {sesiLatihan.riwayat.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-md border border-[#363431] bg-[#262421] px-2 py-1 text-[11px] font-semibold text-gray-200"
                      >
                        <span className="text-gray-500">{Math.floor(item.ply / 2) + 1}.</span>{" "}
                        {item.expectedSan}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-[11px] text-gray-500">{t("papan.repertoarRiwayatKosong")}</p>
                )}
              </div>

              <div className="flex flex-col gap-1 rounded-xl border border-[#312e2b] bg-[#262421] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {t("papan.repertoarTarget")}
                </p>
                <p className="text-xs text-gray-300">
                  {t("papan.repertoarMatang", {
                    matang: sesiLatihan?.matang ?? 0,
                    total: sesiLatihan?.total ?? 0,
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {t("papan.repertoarJatuhTempo", { jumlah: sesiLatihan?.jatuhTempo ?? 0 })}
                </p>
              </div>

              <p className="border-t border-[#312e2b] pt-3 text-[11px] leading-relaxed text-gray-500">
                {t("papan.repertoarJadwalLokal")}
              </p>
            </aside>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-[#312e2b] pb-4">
        {/* Tombol kembali satu baris dengan judul; deskripsi menjorok sejajar judul. */}
        <div className="flex min-w-0 items-start gap-1.5">
          <button
            type="button"
            onClick={kembaliKeInduk}
            title={t("papan.repertoarKembali")}
            aria-label={t("papan.repertoarKembali")}
            className="-mt-1 shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-[#312e2b] hover:text-white"
          >
            <Back />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white">{t("papan.repertoarJudul")}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/papan-interaktif"
            className="rounded-md border border-[#363431] px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-[#312e2b] hover:text-white"
          >
            {t("papan.repertoarJelajahBuku")}
          </Link>
          <button
            type="button"
            onClick={bukaTambah}
            className="rounded-md bg-[#81b64c] px-3 py-2 text-xs font-bold text-[#1e1c18] transition hover:bg-[#91c45a]"
          >
            {t("papan.repertoarTambahJalur")}
          </button>
        </div>
      </header>

      {pesan && <p role="status" className="mt-3 rounded-md border border-[#363431] bg-[#211f1c] px-3 py-2 text-xs text-gray-300">{pesan}</p>}

      {tampilan === "tambah" ? (
        <section className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
          <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-400">
              {t("papan.repertoarCari")}
              <input
                type="search"
                value={pencarian}
                onChange={(event) => setPencarian(event.target.value)}
                placeholder={t("papan.repertoarCariPlaceholder")}
                className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#81b64c]"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-400">
              {t("papan.repertoarWarna")}
              <select
                value={warnaLatihan}
                onChange={(event) => setWarnaLatihan(event.target.value)}
                className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#81b64c]"
              >
                <option value="w">{t("papan.pvePutih")}</option>
                <option value="b">{t("papan.pveHitam")}</option>
              </select>
            </label>
          </div>

          {memuatBuku ? (
            <p className="rounded-md bg-[#211f1c] p-4 text-sm text-gray-400">{t("papan.repertoarMemuatBuku")}</p>
          ) : galatBuku ? (
            <div className="rounded-md border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
              <p>{t("papan.repertoarGagalMuat")}</p>
              <button type="button" onClick={() => void muatBuku()} className="mt-2 underline">
                {t("common.cobaLagi")}
              </button>
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.8fr)]">
              <div
                data-katalog="pembukaan"
                className="min-h-[220px] overflow-y-auto rounded-md border border-[#312e2b] bg-[#211f1c]"
              >
                {!bukuSiap ? null : jalurTersaring.length ? (
                  <ul>
                    {jalurTersaring.map((jalur) => (
                      <li key={jalur.id} className="border-b border-[#312e2b] last:border-0">
                        <button
                          type="button"
                          onClick={() => setJalurTerpilih(jalur)}
                          aria-pressed={jalurTerpilih?.id === jalur.id}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                            jalurTerpilih?.id === jalur.id
                              ? "bg-[#363431] text-white"
                              : "text-gray-300 hover:bg-[#2c2926]"
                          }`}
                        >
                          <span className="shrink-0 rounded bg-[#81b64c]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#a3d168]">{jalur.eco}</span>
                          <span className="min-w-0 flex-1 truncate text-xs" title={jalur.nama}>{jalur.nama}</span>
                          <span className="shrink-0 text-[10px] text-gray-500">
                            {t("papan.repertoarPlyPendek", { jumlah: jalur.moves.length })}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-sm text-gray-400">{t("papan.repertoarTakAdaHasil")}</p>
                )}
                {bukuSiap && jalurCocok.length > jalurTersaring.length && (
                  <div className="border-t border-[#312e2b] p-2">
                    <button
                      type="button"
                      onClick={() => setBatasKatalog((batas) => batas + 60)}
                      className="w-full rounded-md border border-[#363431] px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-[#2c2926] hover:text-white"
                    >
                      {t("papan.repertoarMuatLagi", {
                        ditampilkan: jalurTersaring.length,
                        jumlah: jalurCocok.length,
                      })}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex min-h-[220px] flex-col gap-3 rounded-md border border-[#312e2b] bg-[#211f1c] p-4">
                {jalurTerpilih ? (
                  <>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#a3d168]">{jalurTerpilih.eco}</p>
                      <h2 className="mt-1 text-base font-bold text-white">{jalurTerpilih.nama}</h2>
                      <p className="mt-2 text-xs text-gray-500">{t("papan.repertoarPly", { jumlah: jalurTerpilih.moves.length })}</p>
                    </div>

                    {/* Isi ruang kosong di tengah panel: posisi akhir jalur. */}
                    {pratinjauJalur && (
                      <figure className="mt-auto flex flex-col items-center gap-2">
                        <div className="w-full max-w-[210px]">
                          <PapanStatis
                            fen={pratinjauJalur.fen}
                            orientasi={warnaLatihan}
                            terakhir={pratinjauJalur.terakhir}
                            setBidak={pp.bidak}
                            ariaLabel={t("papan.repertoarPratinjau", { nama: jalurTerpilih.nama })}
                          />
                        </div>
                        <figcaption className="w-full text-center font-mono text-[10px] leading-relaxed text-gray-500">
                          {teksLangkahPratinjau}
                        </figcaption>
                      </figure>
                    )}

                    <button
                      type="button"
                      onClick={() => void tambahJalur()}
                      className={`rounded-md bg-[#81b64c] px-3 py-2.5 text-sm font-bold text-[#1e1c18] hover:bg-[#91c45a] ${pratinjauJalur ? "" : "mt-auto"}`}
                    >
                      {t("papan.repertoarSimpanJalur")}
                    </button>
                  </>
                ) : (
                  <p className="my-auto text-sm text-gray-500">{t("papan.repertoarPilihJalur")}</p>
                )}
                <button
                  type="button"
                  onClick={() => setTampilan("koleksi")}
                  className="rounded-md border border-[#363431] px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-[#2c2926]"
                >
                  {t("papan.repertoarKembali")}
                </button>
              </div>
            </div>
          )}
        </section>
      ) : tampilan === "pembukaan" && pembukaanTerpilih && garisAktif ? (
        /*
         * Halaman pembukaan bergaya "Garis 1/2": papan pratinjau besar,
         * identitas pembukaan, progres, dan tombol mulai latihan.
         */
        <section
          aria-label={garisAktif.nama}
          className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="flex min-h-0 flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-[#211f1c] px-2 py-1 text-[11px] text-gray-400">
                {t("papan.repertoarGaris", {
                  indeks: indeksGaris + 1,
                  total: pembukaanTerpilih.garis.length,
                })}
              </span>
            </div>

            <div className="mx-auto w-full max-w-[380px]">
              {garisAktif.fenAkhir ? (
                <PapanStatis
                  fen={garisAktif.fenAkhir}
                  orientasi={garisAktif.warna}
                  setBidak={pp.bidak}
                  ariaLabel={t("papan.repertoarPratinjau", { nama: garisAktif.nama })}
                />
              ) : null}
            </div>

            {pembukaanTerpilih.garis.length > 1 && (
              <div className="mx-auto flex w-full max-w-[380px] items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => pindahGaris(-1)}
                  aria-label={t("papan.repertoarGarisSebelumnya")}
                  className="rounded-md border border-[#363431] px-3 py-1.5 text-xs text-gray-300 transition hover:bg-[#2c2926] hover:text-white"
                >
                  ←
                </button>
                <span className="text-[11px] text-gray-500">
                  {pembukaanTerpilih.garis
                    .map((baris) => (baris.warna === "w" ? t("papan.pvePutih") : t("papan.pveHitam")))
                    .join(" · ")}
                </span>
                <button
                  type="button"
                  onClick={() => pindahGaris(1)}
                  aria-label={t("papan.repertoarGarisBerikutnya")}
                  className="rounded-md border border-[#363431] px-3 py-1.5 text-xs text-gray-300 transition hover:bg-[#2c2926] hover:text-white"
                >
                  →
                </button>
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-3 rounded-lg border border-[#312e2b] bg-[#211f1c] p-4 text-sm text-gray-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#a3d168]">
              {garisAktif.eco} · {garisAktif.warna === "w" ? t("papan.pvePutih") : t("papan.pveHitam")}
            </p>
            <h1 className="text-lg font-bold leading-tight text-white">{garisAktif.nama}</h1>
            <p className="text-xs text-gray-400">
              {t("papan.repertoarSisiDimainkan", {
                sisi: garisAktif.warna === "w" ? t("papan.pvePutih") : t("papan.pveHitam"),
              })}
            </p>
            <p className="text-xs text-gray-400">
              {t("papan.repertoarJumlahPosisi", { jumlah: garisAktif.jumlah })}
            </p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">{t("papan.repertoarProgresLatihan")}</span>
                <span className="font-semibold text-[#a3d168]">{garisAktif.persen}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={t("papan.repertoarProgresLatihan")}
                aria-valuenow={garisAktif.persen}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 w-full overflow-hidden rounded-full bg-[#312e2b]"
              >
                <div
                  className="h-full rounded-full bg-[#81b64c] transition-[width] duration-300"
                  style={{ width: `${garisAktif.persen}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500">
                {t("papan.repertoarJatuhTempo", { jumlah: garisAktif.jatuhTempo })}
              </p>
            </div>

            <button
              type="button"
              disabled={!garisAktif.jatuhTempo}
              onClick={() => mulaiLatihan(garisAktif.lineId)}
              className="mt-auto rounded-md bg-[#81b64c] px-3 py-2.5 text-sm font-bold text-[#1e1c18] hover:bg-[#91c45a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {garisAktif.jatuhTempo ? t("papan.repertoarMulai") : t("papan.repertoarBelumJatuhTempo")}
            </button>
            <button
              type="button"
              onClick={() => setJalurAkanDihapus(garisAktif)}
              className="rounded-md border border-[#363431] px-3 py-2 text-xs text-gray-400 transition hover:border-red-800 hover:text-red-300"
            >
              {t("papan.repertoarHapus")}
            </button>
          </aside>
        </section>
      ) : (
        <section className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {memuatKartu ? (
            <p className="text-sm text-gray-400">{t("papan.repertoarMemuat")}</p>
          ) : daftarRepertoar.length ? (
            <>
              <div className="mb-3 flex flex-wrap gap-2 text-xs text-gray-400">
                <span className="rounded bg-[#211f1c] px-2 py-1">{t("papan.repertoarJumlahJalur", { jumlah: daftarRepertoar.length })}</span>
                <span className="rounded bg-[#211f1c] px-2 py-1">{t("papan.repertoarJumlahJatuhTempo", { jumlah: jumlahJatuhTempo })}</span>
              </div>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {daftarRepertoar.map((jalur) => (
                  <li
                    key={jalur.lineId}
                    data-kartu-repertoar={jalur.lineId}
                    className="flex flex-col gap-3 rounded-lg border border-[#312e2b] bg-[#211f1c] p-4 transition hover:border-[#45423d]"
                  >
                    {/* Papan mini + identitas: meniru kartu katalog pembukaan. */}
                    <div className="flex items-start gap-3">
                      <div className="w-[88px] shrink-0">
                        {jalur.fenAkhir ? (
                          <PapanStatis
                            fen={jalur.fenAkhir}
                            orientasi={jalur.warna}
                            setBidak={pp.bidak}
                            ariaLabel={t("papan.repertoarPratinjau", { nama: jalur.nama })}
                          />
                        ) : (
                          <div className="aspect-square w-full rounded border border-[#312e2b] bg-[#262421]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#a3d168]">
                          {jalur.eco} · {jalur.warna === "w" ? t("papan.pvePutih") : t("papan.pveHitam")}
                        </p>
                        <h2 className="mt-1 line-clamp-2 text-sm font-bold text-white" title={jalur.nama}>
                          {jalur.nama}
                        </h2>
                        <p className="mt-1 text-[11px] text-gray-500">
                          {t("papan.repertoarJumlahPosisi", { jumlah: jalur.jumlah })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">{t("papan.repertoarProgresLatihan")}</span>
                        <span className="font-semibold text-[#a3d168]">{jalur.persen}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={t("papan.repertoarProgresLatihan")}
                        aria-valuenow={jalur.persen}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-1.5 w-full overflow-hidden rounded-full bg-[#312e2b]"
                      >
                        <div
                          className="h-full rounded-full bg-[#81b64c] transition-[width] duration-300"
                          style={{ width: `${jalur.persen}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {t("papan.repertoarJatuhTempo", { jumlah: jalur.jatuhTempo })}
                      </p>
                    </div>

                    <div className="mt-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => bukaPembukaan(jalur)}
                        className="flex-1 rounded-md bg-[#81b64c] px-3 py-2 text-xs font-bold text-[#1e1c18] hover:bg-[#91c45a]"
                      >
                        {t("papan.repertoarMulaiBelajar")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setJalurAkanDihapus(jalur)}
                        title={t("papan.repertoarHapus")}
                        className="rounded-md border border-[#363431] px-3 py-2 text-xs text-gray-400 hover:border-red-800 hover:text-red-300"
                      >
                        {t("papan.repertoarHapus")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-lg border border-dashed border-[#45423d] bg-[#211f1c] px-6 py-12 text-center">
              <h2 className="text-base font-bold text-white">{t("papan.repertoarKosong")}</h2>
              <p className="text-sm text-gray-400">{t("papan.repertoarKosongDeskripsi")}</p>
              <button
                type="button"
                onClick={bukaTambah}
                className="rounded-md bg-[#81b64c] px-4 py-2 text-sm font-bold text-[#1e1c18] hover:bg-[#91c45a]"
              >
                {t("papan.repertoarTambahJalur")}
              </button>
            </div>
          )}
        </section>
      )}

      {/*
       * Konfirmasi sebelum menghapus. Progres latihan hanya ada di perangkat
       * ini, jadi satu klik tanpa konfirmasi berarti kehilangan jadwal yang
       * tidak bisa dikembalikan.
       */}
      <AlertDialog
        open={Boolean(jalurAkanDihapus)}
        onOpenChange={(terbuka) => {
          if (!terbuka) setJalurAkanDihapus(null);
        }}
      >
        <AlertDialogContent className="border-[#312e2b] bg-[#211f1c] text-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {t("papan.repertoarHapusJudul")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {t("papan.repertoarHapusDeskripsi", {
                nama: jalurAkanDihapus?.nama || "",
                jumlah: jalurAkanDihapus?.jumlah ?? 0,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#363431] bg-transparent text-gray-300 hover:bg-[#312e2b] hover:text-white">
              {t("papan.repertoarBatal")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 text-white hover:bg-red-600"
              onClick={() => {
                const lineId = jalurAkanDihapus?.lineId;
                setJalurAkanDihapus(null);
                if (lineId) void hapusJalur(lineId);
              }}
            >
              {t("papan.repertoarHapus")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
