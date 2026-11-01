import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Chess } from "chess.js";
import { useI18n } from "../../lib/i18n.jsx";
import { SUARA, useSuara } from "../../lib/suara.js";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";
import { SelisihMateri } from "./SelisihMateri.jsx";
import License from "../Analisa/komponen/svg/license.jsx";
import {
  ChevronStartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronEndIcon,
} from "../../components/icons.jsx";
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

/* --------------------------------------------------------------- ikon kecil
 * Empat ikon di bawah hanya dipakai panel kanan halaman ini (kontrol langkah
 * dan menu aksi). Ikon umum tetap diambil dari `components/icons.jsx`; yang
 * belum ada di sana dibuat lokal supaya tidak mengubah berkas bersama.
 */

function IkonUlang({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

// Ikon balik papan: dua panah melingkar bertukar arah (path dari desainer).
function IkonBalik({ className = "" }) {
  return (
    <svg
      viewBox="-240 -1200 1440 1440"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="20"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M204-318q-22-38-33-78t-11-82q0-134 93-228t227-94h7l-64-64 56-56 160 160-160 160-56-56 64-64h-7q-100 0-170 70.5T240-478q0 26 6 51t18 49l-60 60ZM481-40 321-200l160-160 56 56-64 64h7q100 0 170-70.5T720-482q0-26-6-51t-18-49l60-60q22 38 33 78t11 82q0 134-93 228t-227 94h-7l64 64-56 56Z" />
    </svg>
  );
}

function IkonSalin({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

function IkonTitik({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

/* ------------------------------------------------------- bantu tanggal panel */

/** `"2026-11-01"` → Date UTC (aman dari pergeseran zona waktu). */
function keTanggalUTC(nilai) {
  const [tahun, bulan, hari] = String(nilai).split("-").map(Number);
  return new Date(Date.UTC(tahun, (bulan || 1) - 1, hari || 1));
}

/** Huruf hari versi sempit menurut bahasa situs (id-ID: S S R K J S M). */
function hurufHari(nilai, locale) {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "narrow",
      timeZone: "UTC",
    }).format(keTanggalUTC(nilai));
  } catch {
    return "";
  }
}

/** Nama bulan + tahun untuk kepala kalender (mis. "November 2026"). */
function namaBulan(nilai, locale) {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(keTanggalUTC(nilai));
  } catch {
    return nilai;
  }
}

/** Angka 1..jumlah hari pada bulan tanggal tersebut. */
function jumlahHariBulan(nilai) {
  const [tahun, bulan] = String(nilai).split("-").map(Number);
  return new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
}

/** Geseran hari pertama bulan dari awal pekan SENIN (0..6). */
function geserAwalPekan(nilai) {
  const hari = keTanggalUTC(`${String(nilai).slice(0, 7)}-01`).getUTCDay();
  return (hari + 6) % 7;
}

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
  /**
   * FEN awal soal. WAJIB disimpan terpisah: `posisi` berubah tiap langkah,
   * sedangkan "Ulangi dari awal" dan orientasi papan harus memakai posisi
   * pembuka. Sebelum ini `mulaiUlang()` membaca `soal.fen` yang tidak pernah
   * ada (FEN hidup di state `posisi`), sehingga papan hilang saat diulang.
   */
  const [posisiAwal, setPosisiAwal] = useState(null);
  /** Balik papan manual (putih/hitam di bawah) — tombol di panel kanan. */
  const [balik, setBalik] = useState(false);
  /** Tab panel kanan: "utama" | "kalender" | "info". */
  const [tab, setTab] = useState("utama");
  /** Riwayat posisi setelah tiap langkah (untuk baris kontrol ⏮ ◀ ▶ ⏭). */
  const [jejak, setJejak] = useState([]);
  /** Indeks tinjauan: `null` = mengikuti posisi terkini. */
  const [tinjau, setTinjau] = useState(null);
  /** Menu "aksi lain" + status salin FEN. */
  const [aksiTerbuka, setAksiTerbuka] = useState(false);
  const [tersalin, setTersalin] = useState(false);

  const jamLawan = useRef(null);
  const jamKesalahan = useRef(null);
  const jamSalin = useRef(null);

  /*
   * Orientasi mengikuti PIHAK YANG MELANGKAH DI POSISI PEMBUKA — bukan posisi
   * terkini. Dulu nilainya diturunkan dari `posisi`, sehingga papan berputar
   * setiap kali langkah dimainkan (putih di bawah → hitam di bawah → …).
   */
  const orientasi = useMemo(() => {
    const dasar = posisiAwal ? warnaGiliran(posisiAwal) : "w";
    return balik ? (dasar === "w" ? "b" : "w") : dasar;
  }, [posisiAwal, balik]);

  /** FEN yang sedang ditampilkan papan (menghormati mode tinjauan). */
  const fenTampil = useMemo(() => {
    if (tinjau === null) return posisi;
    if (tinjau === 0) return posisiAwal;
    return jejak[tinjau - 1]?.fen || posisiAwal;
  }, [tinjau, posisi, posisiAwal, jejak]);

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
    setJejak([]);
    setTinjau(null);
    setAksiTerbuka(false);
    setTersalin(false);

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
      setPosisiAwal(hasil.fen);
      setSisa(hasil.langkah.slice());
      setDariArsip(hasil.dariArsip);
      setJejak([]);
      setTinjau(null);
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
      window.clearTimeout(jamSalin.current);
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
          setJejak((j) => [...j, { fen: game.fen(), from, to, san }]);
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
    setPosisi(posisiAwal);
    setSisa(solusi.slice());
    setRiwayat([]);
    setJejak([]);
    setTinjau(null);
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
    if (!posisi || selesai || menungguLawan || tinjau !== null) return;
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
    if (!posisi || selesai || menungguLawan || tinjau !== null) return;
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
    if (!posisi || selesai || menungguLawan || !sisa.length || tinjau !== null)
      return;

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
    setJejak((j) => [...j, { fen: berikutnya.fen(), from, to, san }]);
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

  /* -------------------------------------------------------- panel kanan */

  /** Tiga tab panel, meniru susunan kartu panel ChessCompass. */
  const TAB_PANEL = [
    { kunci: "utama", label: "tekaTekiHarian.panelUtama" },
    { kunci: "kalender", label: "tekaTekiHarian.panelKalender" },
    { kunci: "info", label: "tekaTekiHarian.panelInfo" },
  ];

  /**
   * Tujuh hari terakhir MENUJU tanggal yang sedang dibuka — strip kalender di
   * bawah indikator giliran. Berpatokan pada `tanggal` (bukan `hariIni`) supaya
   * saat menelusuri arsip, strip tetap menunjukkan hari-hari di sekitar soal
   * yang sedang dipelajari; saat membuka hari ini, keduanya sama.
   */
  const stripHari = useMemo(() => {
    const hasil = [];
    for (let mundur = 6; mundur >= 0; mundur -= 1) {
      const tgl = geserTanggal(tanggal, -mundur);
      hasil.push({
        tanggal: tgl,
        angka: Number(tgl.slice(8, 10)),
        huruf: hurufHari(tgl, locale),
        sekarang: tgl === hariIni,
        dibuka: tgl === tanggal,
        selesai: Boolean(arsipSelesai[tgl]),
      });
    }
    return hasil;
  }, [tanggal, hariIni, arsipSelesai, locale]);

  /** Sel kalender bulan penuh untuk tab "Kalender". */
  const selKalender = useMemo(() => {
    const sel = [];
    const geser = geserAwalPekan(tanggal);
    for (let i = 0; i < geser; i += 1) sel.push(null);
    const jumlah = jumlahHariBulan(tanggal);
    for (let hari = 1; hari <= jumlah; hari += 1) {
      const tgl = `${String(tanggal).slice(0, 7)}-${String(hari).padStart(2, "0")}`;
      sel.push({
        tanggal: tgl,
        angka: hari,
        sekarang: tgl === hariIni,
        dibuka: tgl === tanggal,
        selesai: Boolean(arsipSelesai[tgl]),
        bisa: tgl <= batasAkhir && tgl >= batasAwal,
      });
    }
    return sel;
  }, [tanggal, hariIni, arsipSelesai, batasAkhir, batasAwal]);

  /** Huruf kepala kalender: dimulai Senin, mengikuti kebiasaan Indonesia. */
  const hurufPekan = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => hurufHari(geserTanggal("2024-01-01", i), locale)),
    [locale]
  );

  const adaJejak = jejak.length > 0;
  const sedangTinjau = tinjau !== null;
  const bisaMundurTinjau = adaJejak && (sedangTinjau ? tinjau > 0 : true);
  const bisaMajuTinjau = sedangTinjau;

  /**
   * Berpindah posisi tinjauan. `null` berarti mengikuti posisi terkini; angka
   * `0` adalah posisi pembuka, `n` = setelah n langkah.
   */
  function bukaTinjau(ke) {
    if (!adaJejak) return;
    if (ke === null || ke >= jejak.length) {
      setTinjau(null);
      return;
    }
    setTinjau(Math.max(0, ke));
  }

  /** Salin FEN posisi yang sedang tampil (menu aksi lain di panel kanan). */
  async function salinFen() {
    const fen = fenTampil || "";
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(fen);
    } catch {
      /* clipboard diblokir peramban — status di bawah tetap memberi umpan balik */
    }
    setAksiTerbuka(false);
    setTersalin(true);
    window.clearTimeout(jamSalin.current);
    jamSalin.current = window.setTimeout(() => setTersalin(false), 2000);
  }
  /* -------------------------------------------------------------- render */

  const gayaTombolIkon =
    "flex h-10 w-10 items-center justify-center rounded-md border border-[#3b3935] bg-[#2b2825] text-gray-300 transition hover:border-[#4a4741] hover:text-white disabled:cursor-not-allowed disabled:opacity-35";
  const gayaStrip =
    "flex flex-col items-center gap-0.5 rounded-md px-0.5 py-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#81b64c]";

  return (
    <>
      <MetaHalaman
        title={t("tekaTekiHarian.judul")}
        description={t("tekaTekiHarian.metaDeskripsi")}
        path="/teka-teki-harian"
      />

      {/*
       * Kerangka halaman mengikuti POLA KELUARGA PAPAN INTERAKTIF, dengan
       * susunan area kerja seperti panel teka-teki harian ChessCompass:
       * sidebar kiri (kontrol halaman) — papan besar persegi — panel kanan
       * setinggi papan (giliran, kalender, aksi, kontrol langkah).
       *
       * Halaman ini tidak lagi bernaung di bawah Teka-teki Catur: tidak ada
       * bilah "Kembali ke Teka-teki Catur". Yang dibagi dengan keluarga papan
       * adalah kerangka, tema gelap, dan `PapanTekaTeki`.
       */}
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#262421] font-sans text-gray-200 lg:flex-row">
        {/* ═══════════════════════════════════════════════════════ */}
        {/* SIDEBAR KIRI — dipertahankan seperti semula             */}
        {/* ═══════════════════════════════════════════════════════ */}
        <aside className="flex w-full shrink-0 flex-col justify-between overflow-y-auto border-b border-[#312e2b] bg-[#1e1c18] lg:w-[240px] lg:border-b-0 lg:border-r">
          <div>
            <div className="border-b border-[#312e2b] px-4 py-4">
              <Link to="/" className="text-[22px] font-bold leading-none text-white">
                Blunder<span className="text-[#81b64c]">Skuad</span>
              </Link>
              <h1 className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {t("tekaTekiHarian.judul")}
              </h1>
            </div>

            {/* Panel kanan sudah menampilkan tanggal edisi, indikator giliran,
                pemilih tanggal, tombol Petunjuk, dan Ulangi; jadi sidebar kiri
                hanya menyisakan umpan balik langkah, riwayat, dan Lisensi. */}
            <div className="flex flex-col gap-4 px-4 py-4">
              {dariArsip && (
                <p className="rounded bg-[#312e2b] px-2 py-1 text-[11px] font-semibold leading-snug text-amber-300">
                  {t("tekaTekiHarian.dariArsip")}
                </p>
              )}

              {status === "siap" && solusi.length > 0 && (
                <div className="flex flex-col gap-1.5">
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

              {riwayat.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    {t("tekaTekiHarian.riwayat")}
                  </span>
                  <ol className="grid grid-cols-1 gap-1 text-sm text-gray-300">
                    {pasanganLangkah(
                      riwayat,
                      posisiAwal ? warnaGiliran(posisiAwal) : "w"
                    ).map((baris) => (
                      <li key={baris.nomor} className="flex gap-2">
                        <span className="w-6 shrink-0 text-right text-gray-500">
                          {baris.nomor}.
                        </span>
                        <span className="w-16">{baris.putih || "…"}</span>
                        <span className="w-16 text-gray-400">{baris.hitam || ""}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#312e2b] px-4 py-3">
            <Link
              to="/program-kami/atribusi"
              className="flex items-center justify-center gap-1.5 text-xs text-gray-300 transition hover:text-white"
            >
              <License size={14} class="fill-current" />
              {t("papan.menuAtribusi")}
            </Link>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* AREA KERJA: PAPAN BESAR + PANEL KANAN SETINGGI PAPAN    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
          <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-3 p-3 sm:p-4 md:px-6 lg:flex-row lg:items-stretch lg:gap-4">
            {/* ------------------------------------------------ papan */}
            <section className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-2 lg:flex-row lg:gap-3">
              <div
                className="relative w-full"
                style={{ maxWidth: "min(100%, 640px, calc(100dvh - 96px))" }}
              >
                <div className="relative aspect-square w-full">
                  {status === "memuat" && (
                    <div className="flex h-full w-full items-center justify-center rounded bg-[#211f1c] ring-1 ring-[#312e2b]">
                      <p className="text-sm font-semibold text-gray-400">
                        {t("tekaTekiHarian.memuat")}
                      </p>
                    </div>
                  )}

                  {status === "galat" && (
                    <div
                      role="alert"
                      className="flex h-full w-full flex-col items-center justify-center gap-3 rounded bg-[#211f1c] p-6 text-center ring-1 ring-[#312e2b]"
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

                  {(status === "kosong" || (status === "siap" && !solusi.length)) && (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded bg-[#211f1c] p-6 text-center ring-1 ring-[#312e2b]">
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

                  {status === "siap" && fenTampil && solusi.length > 0 && (
                    <PapanTekaTeki
                      fen={fenTampil}
                      orientasi={orientasi}
                      terpilih={sedangTinjau ? null : terpilih}
                      sasaran={sedangTinjau ? [] : sasaran}
                      petunjuk={sedangTinjau ? null : petunjuk}
                      kesalahan={kesalahan}
                      langkahAkhir={sedangTinjau ? null : langkahAkhir}
                      panahMesin={
                        petunjuk && !sedangTinjau
                          ? { ...petunjuk, warna: "bawaan" }
                          : null
                      }
                      terkunci={
                        selesai ||
                        menungguLawan ||
                        !!promosi ||
                        !solusi.length ||
                        sedangTinjau
                      }
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
                        className="flex flex-col items-center gap-3 rounded-lg border border-[#3b3935] bg-[#1e1c18] p-4 shadow-xl"
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
              </div>

              {/* Selisih materi: rel sempit di kanan papan (turun ke bawah
                  papan pada layar sempit). */}
              <SelisihMateri fen={status === "siap" ? fenTampil : ""} />
            </section>

            {/* ------------------------------------ panel kanan (ChessCompass) */}
            <aside
              aria-label={t("tekaTekiHarian.panelAria")}
              className="flex w-full shrink-0 flex-col gap-3 self-stretch rounded-xl border border-[#312e2b] bg-[#211f1c] p-3 shadow-sm lg:w-[336px] lg:overflow-y-auto"
            >
              {/* Tab panel */}
              <div
                role="tablist"
                aria-label={t("tekaTekiHarian.panelAria")}
                className="grid grid-cols-3 gap-1 rounded-lg border border-[#312e2b] bg-[#262421] p-1"
              >
                {TAB_PANEL.map((tabPanel) => {
                  const aktif = tab === tabPanel.kunci;
                  return (
                    <button
                      key={tabPanel.kunci}
                      type="button"
                      role="tab"
                      aria-selected={aktif}
                      data-tab={tabPanel.kunci}
                      onClick={() => setTab(tabPanel.kunci)}
                      className={`rounded-md px-2 py-1.5 text-xs font-bold transition ${
                        aktif
                          ? "bg-[#3d3a37] text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {t(tabPanel.label)}
                    </button>
                  );
                })}
              </div>

              {tab === "utama" && (
                <>
                  {/* Judul soal dari Chess.com (bila ada) */}
                  {soal?.judul && (
                    <p className="text-center text-sm font-bold leading-snug text-white">
                      {soal.judul}
                    </p>
                  )}

                  {/* Status: sisi yang melangkah + edisi (baris, seperti panel
                      "status with-side" pada rujukan). */}
                  <div className="flex items-center gap-3 border-b border-[#312e2b] pb-3">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#312e2b] text-2xl leading-none text-gray-100"
                    >
                      {orientasi === "w" ? "♙" : "♟"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {t(
                          orientasi === "w"
                            ? "tekaTekiHarian.giliranPutih"
                            : "tekaTekiHarian.giliranHitam"
                        )}
                      </p>
                      <p className="truncate text-[11px] text-gray-400">
                        {tanggalTerbaca(soal?.tanggal || tanggal, locale)} ·{" "}
                        {tanggal === hariIni
                          ? t("tekaTekiHarian.hariIni")
                          : t("tekaTekiHarian.arsip")}
                      </p>
                    </div>
                    {status === "siap" && solusi.length > 0 && (
                      <span className="shrink-0 rounded bg-[#312e2b] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                        {selesai
                          ? t("tekaTekiHarian.terpecahkan")
                          : jumlahLangkah === 1
                            ? t("tekaTekiHarian.satuLangkah")
                            : t("tekaTekiHarian.langkahTersisa", { n: jumlahLangkah })}
                      </span>
                    )}
                  </div>

                  {/* Strip kalender tujuh hari */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-gray-400">
                      <span>{namaBulan(tanggal, locale)}</span>
                      <button
                        type="button"
                        onClick={() => setTab("kalender")}
                        className="text-[11px] font-semibold text-emerald-300 underline-offset-4 transition hover:underline"
                      >
                        {t("tekaTekiHarian.kalenderLengkap")}
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {stripHari.map((hari) => (
                        <button
                          key={hari.tanggal}
                          type="button"
                          data-hari={hari.tanggal}
                          aria-current={hari.dibuka ? "date" : undefined}
                          aria-label={t("tekaTekiHarian.kalenderAriaHari", {
                            tanggal: tanggalTerbaca(hari.tanggal, locale),
                            status: hari.selesai
                              ? t("tekaTekiHarian.statusSelesai")
                              : t("tekaTekiHarian.statusBelum"),
                          })}
                          onClick={() => pilihTanggal(hari.tanggal)}
                          className={`${gayaStrip} ${
                            hari.dibuka
                              ? "bg-[#81b64c] text-[#1e1c18]"
                              : hari.sekarang
                                ? "bg-[#312e2b] text-white"
                                : "text-gray-300 hover:bg-[#2b2825]"
                          }`}
                        >
                          <span className="text-[10px] font-semibold uppercase opacity-70">
                            {hari.huruf}
                          </span>
                          <span className="text-sm font-bold leading-none">
                            {hari.angka}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`mt-0.5 h-1 w-1 rounded-full ${
                              hari.selesai
                                ? hari.dibuka
                                  ? "bg-[#1e1c18]"
                                  : "bg-emerald-300"
                                : "bg-transparent"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("info")}
                      className="mt-1 text-xs font-semibold text-gray-400 underline-offset-4 transition hover:text-white hover:underline"
                    >
                      {t("tekaTekiHarian.caraKerja")}
                    </button>
                  </div>

                  {/* Aksi utama + dua ikon */}
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 border-t border-[#312e2b] pt-3">
                    <button
                      type="button"
                      onClick={tampilkanPetunjuk}
                      disabled={selesai || menungguLawan || !solusi.length}
                      className="flex items-center justify-center gap-2 rounded-md bg-[#81b64c] px-3 py-2.5 text-sm font-bold text-[#1e1c18] transition hover:bg-[#a3d168] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="h-4 w-4"
                      >
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
                      </svg>
                      {t("tekaTekiHarian.petunjuk")}
                    </button>
                    <button
                      type="button"
                      onClick={mulaiUlang}
                      aria-label={t("tekaTekiHarian.ulangi")}
                      title={t("tekaTekiHarian.ulangi")}
                      className={gayaTombolIkon}
                    >
                      <IkonUlang className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={salinFen}
                      aria-label={t("tekaTekiHarian.salinFen")}
                      title={
                        tersalin
                          ? t("tekaTekiHarian.salinFenBerhasil")
                          : t("tekaTekiHarian.salinFen")
                      }
                      className={`${gayaTombolIkon} ${
                        tersalin ? "text-emerald-300" : ""
                      }`}
                    >
                      {tersalin ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          className="h-4 w-4"
                        >
                          <path d="m5 13 4 4L19 7" />
                        </svg>
                      ) : (
                        <IkonSalin className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Baris navigasi: [balik papan] [⏮ ◀ ▶ ⏭] [⋯] — tiga
                      kelompok seperti panel rujukan. */}
                  <div className="mt-auto flex items-center justify-between border-t border-[#312e2b] pt-2">
                    <button
                      type="button"
                      onClick={() => setBalik((b) => !b)}
                      aria-label={t("tekaTekiHarian.balikPapan")}
                      aria-pressed={balik}
                      title={t("tekaTekiHarian.balikPapan")}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition hover:bg-[#2b2825] hover:text-white"
                    >
                      <IkonBalik className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => bukaTinjau(0)}
                        disabled={!bisaMundurTinjau}
                        aria-label={t("tekaTekiHarian.langkahPertama")}
                        title={t("tekaTekiHarian.langkahPertama")}
                        className="flex h-9 w-8 items-center justify-center rounded-md text-gray-300 transition hover:bg-[#2b2825] hover:text-white disabled:opacity-30"
                      >
                        <ChevronStartIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          bukaTinjau(sedangTinjau ? tinjau - 1 : jejak.length - 1)
                        }
                        disabled={!bisaMundurTinjau}
                        aria-label={t("tekaTekiHarian.langkahSebelumnya")}
                        title={t("tekaTekiHarian.langkahSebelumnya")}
                        className="flex h-9 w-8 items-center justify-center rounded-md text-gray-300 transition hover:bg-[#2b2825] hover:text-white disabled:opacity-30"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => bukaTinjau((sedangTinjau ? tinjau : 0) + 1)}
                        disabled={!bisaMajuTinjau}
                        aria-label={t("tekaTekiHarian.langkahBerikutnya")}
                        title={t("tekaTekiHarian.langkahBerikutnya")}
                        className="flex h-9 w-8 items-center justify-center rounded-md text-gray-300 transition hover:bg-[#2b2825] hover:text-white disabled:opacity-30"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => bukaTinjau(null)}
                        disabled={!bisaMajuTinjau}
                        aria-label={t("tekaTekiHarian.langkahTerakhir")}
                        title={t("tekaTekiHarian.langkahTerakhir")}
                        className="flex h-9 w-8 items-center justify-center rounded-md text-gray-300 transition hover:bg-[#2b2825] hover:text-white disabled:opacity-30"
                      >
                        <ChevronEndIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAksiTerbuka((v) => !v)}
                        aria-expanded={aksiTerbuka}
                        aria-label={t("tekaTekiHarian.aksiLain")}
                        title={t("tekaTekiHarian.aksiLain")}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition hover:bg-[#2b2825] hover:text-white"
                      >
                        <IkonTitik className="h-4 w-4" />
                      </button>
                      {aksiTerbuka && (
                        <div className="absolute bottom-full right-0 z-20 mb-1 w-52 rounded-md border border-[#3b3935] bg-[#2b2825] p-1 text-xs shadow-xl">
                          <button
                            type="button"
                            onClick={() => {
                              setAksiTerbuka(false);
                              setTab("info");
                            }}
                            className="block w-full rounded px-2 py-1.5 text-left text-gray-200 transition hover:bg-[#3d3a37]"
                          >
                            {t("tekaTekiHarian.caraKerja")}
                          </button>
                          <a
                            href={soal?.url || URL_CHESSCOM}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded px-2 py-1.5 text-left text-gray-200 transition hover:bg-[#3d3a37]"
                          >
                            {t("tekaTekiHarian.bukaDiChessCom")}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {sedangTinjau && (
                    <p
                      aria-live="polite"
                      className="rounded bg-[#312e2b] px-2 py-1 text-center text-[11px] font-semibold text-amber-300"
                    >
                      {t("tekaTekiHarian.tinjauLangkah", {
                        n: tinjau,
                        total: jejak.length,
                      })}
                    </p>
                  )}
                </>
              )}

              {tab === "kalender" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                    <span>{namaBulan(tanggal, locale)}</span>
                    <button
                      type="button"
                      onClick={() => setTab("utama")}
                      className="text-[11px] text-emerald-300 underline-offset-4 hover:underline"
                    >
                      {t("tekaTekiHarian.panelUtama")}
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-gray-500">
                    {hurufPekan.map((huruf, i) => (
                      <span key={`${huruf}-${i}`}>{huruf}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {selKalender.map((sel, i) =>
                      sel ? (
                        <button
                          key={sel.tanggal}
                          type="button"
                          data-kalender-hari={sel.tanggal}
                          disabled={!sel.bisa}
                          aria-current={sel.dibuka ? "date" : undefined}
                          aria-label={t("tekaTekiHarian.kalenderAriaHari", {
                            tanggal: tanggalTerbaca(sel.tanggal, locale),
                            status: sel.selesai
                              ? t("tekaTekiHarian.statusSelesai")
                              : t("tekaTekiHarian.statusBelum"),
                          })}
                          onClick={() => {
                            pilihTanggal(sel.tanggal);
                            setTab("utama");
                          }}
                          className={`relative flex aspect-square items-center justify-center rounded-md text-xs font-semibold transition ${
                            sel.dibuka
                              ? "bg-[#81b64c] text-[#1e1c18]"
                              : sel.sekarang
                                ? "bg-[#312e2b] text-white"
                                : "text-gray-300 hover:bg-[#2b2825]"
                          } disabled:cursor-not-allowed disabled:opacity-25`}
                        >
                          {sel.angka}
                          {sel.selesai && (
                            <span
                              aria-hidden="true"
                              className={`absolute bottom-1 h-1 w-1 rounded-full ${
                                sel.dibuka ? "bg-[#1e1c18]" : "bg-emerald-300"
                              }`}
                            />
                          )}
                        </button>
                      ) : (
                        <span key={`kosong-${i}`} aria-hidden="true" />
                      )
                    )}
                  </div>
                  <p className="mt-1 border-t border-[#312e2b] pt-2 text-[11px] leading-relaxed text-gray-500">
                    {t("tekaTekiHarian.kalenderCatatan")}
                  </p>
                </div>
              )}

              {tab === "info" && (
                <div className="flex flex-col gap-3 text-xs leading-relaxed text-gray-400">
                  <h2 className="text-sm font-bold text-white">
                    {t("tekaTekiHarian.caraKerjaJudul")}
                  </h2>
                  {["caraKerjaPoin1", "caraKerjaPoin2", "caraKerjaPoin3"].map((kunci) => (
                    <p key={kunci} className="border-l-2 border-[#3b3935] pl-2">
                      {t(`tekaTekiHarian.${kunci}`)}
                    </p>
                  ))}
                  <p className="border-t border-[#312e2b] pt-2 text-[11px] text-gray-500">
                    {t("tekaTekiHarian.sumber")}
                  </p>
                  <a
                    href={soal?.url || URL_CHESSCOM}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-300 underline-offset-4 transition hover:underline"
                  >
                    {t("tekaTekiHarian.bukaDiChessCom")}
                  </a>
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
