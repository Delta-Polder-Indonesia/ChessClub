import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Chess } from "chess.js";
import { ExternalLink, Lock, Pause, Play, Video } from "lucide-react";
import { ArrowRightIcon, ChevronStartIcon, ChevronLeftIcon, ChevronRightIcon, ChevronEndIcon } from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { DAFTAR_SET } from "../../components/chess/pemuatBidak.js";
import { antrekanLatar } from "../../lib/waktuSenggang.js";
import PapanTekaTeki from "./PapanTekaTeki.jsx";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import { useEngineCatur } from "../../lib/gunakanEngineCatur.js";
import { PILIHAN_KECEPATAN } from "../../components/panelEngineData.js";
import { standarkanNamaPembukaan } from "../../lib/namaPembukaan.js";
import { isForced } from "../Analisa/mesin/penilaian.js";
import { cariNamaPembukaan } from "../Analisa/mesin/buku.js";
import { petakRajaPemenang, petakRajaTermat } from "../../lib/skakmat.js";
import License from "../Analisa/komponen/svg/license.jsx";
import { SUARA, useSuara, mainkanSuara } from "../../lib/suara.js";
import KartuKomentator from "../../components/KartuKomentator.jsx";
import { usePreferensiKomentator } from "../../components/usePreferensiKomentator.js";
import { faktaLangkah, susunKomentarTekaTeki } from "../../lib/komentator.js";
import { coba } from "../../lib/utils.js";
import {
  parseLangkah,
  terapkan,
  butuhPromosi,
  apakahSkakmat,
  apakahLangkahLegal,
  apakahLangkahSesuai,
} from "../../lib/tekaTeki.js";
import { useTandaBantu } from "../../lib/tandaBantu.js";

const KUNCI_SELESAI = "kci-teka-teki-terpecahkan";
const KUNCI_POSISI = "kci-teka-teki-posisi";
const KUNCI_SET_BIDAK = "kci-teka-teki-set-bidak";
const KUNCI_WARNA_PAPAN = "kci-teka-teki-warna-papan";
const KUNCI_OTOMATIS = "kci-teka-teki-otomatis";
/**
 * "Ingat posisi terakhir". Bawaannya AKTIF (perilaku lama), tetapi kini bisa
 * dimatikan pemain — sebelumnya posisi selalu disimpan & dipulihkan tanpa
 * kendali dan tanpa pemberitahuan.
 */
const KUNCI_INGAT_POSISI = "kci-teka-teki-ingat-posisi";
const DURASI_KLIK_SINTETIS = 500;
/**
 * Kunci kamus label level (1–5) sesuai pita rating NACCL — sama dengan pilihan
 * selector Level. Dulu teksnya ditulis mentah sehingga pengguna EN melihat
 * "Sangat Mudah" walau selector-nya sudah "Very easy".
 */
const KUNCI_LEVEL = {
  1: "tekaTeki.sangatMudah",
  2: "tekaTeki.mudah",
  3: "tekaTeki.normal",
  4: "tekaTeki.sulit",
  5: "tekaTeki.sangatSulit",
};
function bandLevel(rating) {
  if (rating < 1000) return 1;
  if (rating < 1250) return 2;
  if (rating < 1550) return 3;
  if (rating < 1900) return 4;
  return 5;
}

/**
 * Pita rating untuk selector Level, mengikuti level NACCL (1–5).
 * Rating diambil dari rating puzzle Lichess tiap soal.
 */
const PITA_LEVEL = {
  1: (r) => r < 1000,
  2: (r) => r >= 1000 && r < 1250,
  3: (r) => r >= 1250 && r < 1550,
  4: (r) => r >= 1550 && r < 1900,
  5: (r) => r >= 1900,
};

/** Selector Tema: grup ala NACCL, hanya tema yang benar-benar ada di data. */
const DAFTAR_TEMA = [
  {
    grup: "tekaTeki.temaGrupSkakmat",
    isi: [
      ["backRankMate", "tekaTeki.tema.backRankMate"],
      ["smotheredMate", "tekaTeki.tema.smotheredMate"],
      ["promotion", "tekaTeki.tema.promotion"],
    ],
  },
  {
    grup: "tekaTeki.temaGrupTaktik",
    isi: [
      ["sacrifice", "tekaTeki.tema.sacrifice"],
      ["attraction", "tekaTeki.tema.attraction"],
      ["deflection", "tekaTeki.tema.deflection"],
      ["pin", "tekaTeki.tema.pin"],
      ["fork", "tekaTeki.tema.fork"],
      ["discoveredAttack", "tekaTeki.tema.discoveredAttack"],
      ["doubleCheck", "tekaTeki.tema.doubleCheck"],
      ["hangingPiece", "tekaTeki.tema.hangingPiece"],
      ["exposedKing", "tekaTeki.tema.exposedKing"],
    ],
  },
  {
    grup: "tekaTeki.temaGrupKarakteristik",
    isi: [
      ["endgame", "tekaTeki.tema.endgame"],
      ["middlegame", "tekaTeki.tema.middlegame"],
      ["opening", "tekaTeki.tema.opening"],
      ["master", "tekaTeki.tema.master"],
      ["kingsideAttack", "tekaTeki.tema.kingsideAttack"],
      ["queensideAttack", "tekaTeki.tema.queensideAttack"],
    ],
  },
];

/** Pilihan warna papan (nilai + kunci terjemahan), mengikuti halaman papan interaktif. */
const PILIHAN_WARNA_PAPAN = [
  ["blue", "papan.warnaBiru"],
  ["brown", "papan.warnaCokelat"],
  ["orange", "papan.warnaOranye"],
  ["green", "papan.warnaHijau"],
  ["grey", "papan.warnaAbu"],
  ["light-blue", "papan.warnaBiruMuda"],
  ["dark-blue", "papan.warnaBiruTua"],
  ["wood", "papan.warnaKayu"],
  ["marble-brown", "papan.warnaMarmerCokelat"],
  ["marble-green", "papan.warnaMarmerHijau"],
  ["metal", "papan.warnaMetal"],
];

/** Urutan pilihan bidak promosi (menteri, benteng, gajah, kuda). */
const PILIHAN_PROMOSI = ["q", "r", "b", "n"];
const KUCI_NAMA_PROMOSI = {
  q: "tekaTeki.promosiMenteri",
  r: "tekaTeki.promosiBenteng",
  b: "tekaTeki.promosiGajah",
  n: "tekaTeki.promosiKuda",
};

/**
 * Fakta langkah (untuk komentator) dari koordinat asal/tujuan. Mengembalikan
 * null bila langkah tidak legal pada posisi itu.
 */
function faktaDariKoordinat(fen, from, to, promo) {
  try {
    const g = terapkan(fen, { from, to, promo });
    const san = g.history({ verbose: true }).slice(-1)[0]?.san;
    return san ? faktaLangkah(fen, san) : null;
  } catch {
    return null;
  }
}

/** Susun teks PGN standar (lengkap dengan SetUp + FEN) untuk dikirim ke Papan Analisa. */
function bangunPgnUntukAnalisa(m) {
  if (!m) return "";
  if (m.pgnAnalisa) return m.pgnAnalisa;
  try {
    const catur = new Chess(m.fen);
    for (const teks of String(m.moves || "").split(";").filter(Boolean)) {
      const { from, to, promo } = parseLangkah(teks);
      catur.move({ from, to, ...(promo ? { promotion: promo } : {}) });
    }
    const header = [
      `[Event "${(m.judulSoal || m.turnamen || `Teka-Teki #${m.problemid}`).replace(/"/g, "'")}"]`,
      `[White "${(m.pemainPutih || "Putih").replace(/"/g, "'")}"]`,
      `[Black "${(m.pemainHitam || "Hitam").replace(/"/g, "'")}"]`,
      ...(m.eloPutih ? [`[WhiteElo "${m.eloPutih}"]`] : []),
      ...(m.eloHitam ? [`[BlackElo "${m.eloHitam}"]`] : []),
      `[SetUp "1"]`,
      `[FEN "${m.fen}"]`,
      `[Result "*"]`,
    ];
    const langkahPgn = catur.pgn().replace(/^\[[^\]]*\]\s*/gm, "").trim();
    return `${header.join("\n")}\n\n${langkahPgn || "*"}`;
  } catch {
    return "";
  }
}

function bacaTerpecahkan() {
  const simpan = coba(
    () => JSON.parse(localStorage.getItem(KUNCI_SELESAI) || "[]"),
    "baca daftar teka-teki terpecahkan"
  );
  return new Set(Array.isArray(simpan) ? simpan : []);
}

/**
 * Cari indeks soal yang belum terpecahkan, mulai dari indeks yang diminta
 * lalu melingkar satu kali. Mengembalikan -1 bila semua soal pada saringan
 * sudah terpecahkan.
 */
function cariIndeksBelumTerpecahkan(daftar, mulai, terpecahkan) {
  if (!Array.isArray(daftar) || daftar.length === 0) return -1;
  const awal = ((Math.trunc(Number(mulai) || 0) % daftar.length) + daftar.length) % daftar.length;
  for (let langkah = 0; langkah < daftar.length; langkah += 1) {
    const indeks = (awal + langkah) % daftar.length;
    if (!terpecahkan.has(daftar[indeks]?.problemid)) return indeks;
  }
  return -1;
}

function bacaPosisi() {
  const n = Number(
    coba(() => localStorage.getItem(KUNCI_POSISI), "baca posisi terakhir")
  );
  return Number.isInteger(n) && n >= 1 ? n : null;
}

function bacaSetBidak() {
  const simpan = coba(
    () => localStorage.getItem(KUNCI_SET_BIDAK),
    "baca set bidak"
  );
  if (simpan && DAFTAR_SET.some((s) => s.id === simpan)) return simpan;
  return "merida";
}

function bacaWarnaPapan() {
  const simpan = coba(
    () => localStorage.getItem(KUNCI_WARNA_PAPAN),
    "baca warna papan"
  );
  if (simpan && PILIHAN_WARNA_PAPAN.some(([nilai]) => nilai === simpan)) {
    return simpan;
  }
  return "green";
}

function bacaIngatPosisi() {
  // Bawaan aktif: hanya nilai "0" yang mematikan, sehingga pengguna lama
  // (belum punya kunci ini) tetap melanjutkan dari posisi terakhirnya.
  return coba(() => localStorage.getItem(KUNCI_INGAT_POSISI), "baca ingat posisi") !== "0";
}

function bacaOtomatis() {
  return (
    coba(() => localStorage.getItem(KUNCI_OTOMATIS), "baca mode otomatis") === "1"
  );
}

function _KerangkaTekaTeki() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-40 rounded-lg bg-slate-200" />
      <div className="mt-4 h-4 w-56 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
    </div>
  );
}

export default function TekaTeki() {
  const { t } = useI18n();
  const lokasi = useLocation();
  const navigate = useNavigate();
  const { id: idRute } = useParams();
  /*
   * Segmen terakhir, bukan segmen pertama: alamat kanonik memakai
   * `/teka-teki/problem/<nomor>`, sedangkan alamat lama `/teka-teki/<nomor>`
   * (dialihkan di App.jsx) tetap dibaca dengan cara yang sama. Untuk
   * `/teka-teki/problem` tanpa nomor, segmen terakhir = "problem" → bukan
   * angka → halaman memakai posisi tersimpan atau soal acak.
   */
  const idPath =
    idRute ||
    (lokasi.pathname.startsWith("/teka-teki/")
      ? decodeURIComponent(lokasi.pathname.split("/").filter(Boolean).pop() || "")
      : "");

  const [semuaSoal, setSemuaSoal] = useState(null);
  const [soalTambahan, setSoalTambahan] = useState(null);
  const [memuatKoleksi, setMemuatKoleksi] = useState(false);
  const [gagal, setGagal] = useState(false);
  // Tombol "Coba lagi" pada layar galat mengulang pemuatan data soal.
  const [percobaan, setPercobaan] = useState(0);
  const [videoGagal, setVideoGagal] = useState(false);
  const [indeks, setIndeks] = useState(0);
  const [filterKoleksi, setFilterKoleksi] = useState("lichess");
  const [filterPelatih, setFilterPelatih] = useState("semua");
  const [filterTipe, setFilterTipe] = useState("semua");
  const [filterLevel, setFilterLevel] = useState("semua");
  const [filterTema, setFilterTema] = useState("semua");
  const [filterGiliran, setFilterGiliran] = useState("semua");
  const lewatiRefilterRef = useRef(false);
  const koleksiSebelumnyaRef = useRef("lichess");

  const [fen, setFen] = useState("");
  const [sisa, setSisa] = useState([]);
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [petunjuk, setPetunjuk] = useState(null);
  const [kesalahan, setKesalahan] = useState(null);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [jalurFen, setJalurFen] = useState([]);
  const [orientasi, setOrientasi] = useState("w");
  const [tabPanelAktif, setTabPanelAktif] = useState("main");
  const [pesan, setPesan] = useState(null);
  /**
   * ID dari URL saat mount: bila bukan angka yang sah (di luar rentang soal)
   * dan BUKAN sekadar segmen "problem" dari URL kanonik `/teka-teki/problem`,
   * tampilkan pesan bahwa soal tidak ditemukan sebelum jatuh ke soal acak.
   */
  const idPathBermakna = useMemo(() => {
    const s = String(idPath || "").trim();
    return s && s !== "problem";
  }, [idPath]);
  /**
   * Komentator langsung — konteks tahap terakhir (mulai/benar/lawan/salah/
   * petunjuk/selesai/tinjau) beserta fakta langkah terkait. Kalimatnya
   * disusun ulang tiap render dari kamus, jadi ganti bahasa/gaya langsung
   * ikut tanpa menyimpan teks jadi.
   */
  const [komentar, setKomentar] = useState(null);
  const preferensiKomentator = usePreferensiKomentator();
  const [komputer, setKomputer] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [terpecahkan, setTerpecahkan] = useState(bacaTerpecahkan);

  const { tanda, tandaPetak, tandaPanah, hapusSemuaTanda } = useTandaBantu();

  const [posisiTersimpan, setPosisiTersimpan] = useState(bacaPosisi);
  const [nomorSoal, setNomorSoal] = useState("");
  const [galatNomor, setGalatNomor] = useState(null);
  const [setBidak, setSetBidak] = useState(bacaSetBidak);
  const [warnaPapan, setWarnaPapan] = useState(bacaWarnaPapan);
  const [otomatis, setOtomatis] = useState(bacaOtomatis);
  const [ingatPosisi, setIngatPosisi] = useState(bacaIngatPosisi);

  // Suara papan (MP3 di public/SoundChess) — sakelarnya dibagi dengan
  // halaman Papan Interaktif lewat localStorage.
  const {
    nyala: suaraNyala,
    setNyala: setSuaraNyala,
    mainkan: bunyikan,
    mainkanLangkah: bunyikanLangkah,
  } = useSuara();

  // Sedang menyeret bidak (klik kiri tahan). Klik kanan membatalkan.
  const [sedangSeret, setSedangSeret] = useState(false);
  const abaikanKlikRef = useRef(false);
  const timerAbaikanKlikRef = useRef(null);
  const batalkanAbaikanKlik = useCallback(() => {
    if (timerAbaikanKlikRef.current !== null) {
      window.clearTimeout(timerAbaikanKlikRef.current);
      timerAbaikanKlikRef.current = null;
    }
    abaikanKlikRef.current = false;
  }, []);
  const telanKlikBerikutnya = useCallback(() => {
    batalkanAbaikanKlik();
    abaikanKlikRef.current = true;
    const timer = window.setTimeout(() => {
      if (timerAbaikanKlikRef.current !== timer) return;
      timerAbaikanKlikRef.current = null;
      abaikanKlikRef.current = false;
    }, DURASI_KLIK_SINTETIS);
    timerAbaikanKlikRef.current = timer;
  }, [batalkanAbaikanKlik]);

  // Bidak sampai di baris terakhir → pemain wajib memilih bidak promosi.
  const [promosi, setPromosi] = useState(null); // { from, to, warna }

  const timerSalah = useRef(null);
  const timerOtomatis = useRef(null);
  // Dibaca `simpanPosisi` (useCallback ber-dependensi kosong) supaya preferensi
  // terbaru selalu terpakai tanpa memasang ulang callback-nya.
  const ingatPosisiRef = useRef(ingatPosisi);
  ingatPosisiRef.current = ingatPosisi;

  // Analisis Stockfish (opsional) — mengikuti posisi teka-teki saat ini.
  const {
    engineNyala,
    statusEngine: _statusEngine,
    kecepatanEngine,
    setKecepatanEngine,
    hasilEngine,
    permainanSelesai: _permainanSelesai,
    panahMesin,
    tampilPanahMesin,
    setTampilPanahMesin,
    nyalakanEngine,
    matikanEngine,
  } = useEngineCatur(fen);

  // Hasil evaluasi terakhir ditahan selama analisis posisi baru berjalan,
  // agar bar evaluasi tidak goyang. Bar tampil selama engine menyala dan
  // hanya hilang saat engine dimatikan.
  const [hasilTertahan, setHasilTertahan] = useState(null);
  useEffect(() => {
    if (hasilEngine) setHasilTertahan(hasilEngine);
  }, [hasilEngine]);
  useEffect(() => {
    if (!engineNyala) setHasilTertahan(null);
  }, [engineNyala]);

  // Tabel "langkah buku" (buku pembukaan) yang sama dengan halaman Analisa.
  // Dimuat sekali saat halaman dibuka; ikon "book" baru bisa muncul setelah
  // tabel siap — tanpa memblokir teka-teki.
  const bukuSiap = useRef(false);
  // Nomor versi naik saat buku pembukaan selesai dimuat; dipakai sebagai
  // dependensi `ikonLangkahAkhir` supaya posisi yang sedang tampil dihitung
  // ulang dan lencana "book" langsung muncul tanpa menunggu langkah berikutnya.
  const [, setVersiBuku] = useState(0);
  useEffect(() => {
    /*
     * Tabel buku ±160 KiB (buku-analisa.json 1,3 MB) jangan diunduh di jalur
     * kritis pemuatan halaman — PageSpeed mencatatnya dalam rantai request
     * kritis rute ini. Ditunda ke waktu senggang peramban, sama seperti halaman
     * Analisa (game.jsx); belum ada langkah yang butuh nama pembukaan pada
     * detik-detik pertama, dan `cariNamaPembukaan` men-cache janjinya.
     */
    let aktif = true;
    const muat = () =>
      cariNamaPembukaan()
        .then((cari) => {
          if (aktif && typeof cari === "function") {
            bukuSiap.current = cari;
            setVersiBuku((n) => n + 1);
          }
        })
        .catch(() => {});
    const batalMuat = antrekanLatar(muat);
    return () => {
      aktif = false;
      batalMuat();
    };
  }, []);

  /**
   * Klasifikasi langkah TERAKHIR pada posisi papan saat ini, untuk ikon di
   * pojok petak tujuan (ala chess.com / lichess, mengikuti port Brilliant-
   * Chess di repo ini):
   *   - "book"   → langkah pembukaan yang tercatat di buku,
   *   - "forced" → satu-satunya langkah legal pada posisi itu,
   *   - "best"   → langkah solusi teka-teki lainnya.
   * `jalurFen[i]` = posisi SETELAH langkah ke-i, jadi langkah ke-i dimulai
   * dari `jalurFen[i-1]`; buku dicek pada posisi setelah langkah.
   */
  const ikonLangkahAkhir = useMemo(() => {
    if (!jalurFen || jalurFen.length < 2) return null;
    const i = jalurFen.length - 1;
    const fenSebelum = jalurFen[i - 1];
    const fenSesudah = jalurFen[i];
    if (!fenSebelum || !fenSesudah) return null;

    let langkah;
    try {
      const g = new Chess(fenSebelum);
      const daftar = g.moves({ verbose: true });
      langkah =
        daftar.find((m) => m.after === fenSesudah) ||
        daftar.find((m) => {
          try {
            const uji = new Chess(fenSebelum);
            return uji.move(m.san)?.fen() === fenSesudah;
          } catch {
            return false;
          }
        }) ||
        null;
    } catch {
      return null;
    }
    if (!langkah) return null;

    let rating = "best";
    let namaBuku;
    try {
      namaBuku = bukuSiap.current?.(fenSesudah) || null;
    } catch {
      namaBuku = null;
    }
    if (namaBuku) {
      rating = "book";
    } else {
      try {
        if (isForced({ before: fenSebelum })) rating = "forced";
      } catch {
        /* abaikan — tetap "best" */
      }
    }
    return { petak: langkah.to, rating };
  }, [jalurFen]);

  /**
   * Lencana skakmat — petak raja LAWAN yang termat pada posisi yang sedang
   * ditampilkan. Hanya terisi bila posisi itu benar-benar skakmat, jadi
   * gambarnya muncul tepat saat langkah terakhir menutup permainan (dan tetap
   * tampil saat mode review / navigasi langkah setelah cekmat).
   */
  const ikonSkakmat = useMemo(() => {
    const petak = petakRajaTermat(fen);
    return petak ? { petak } : null;
  }, [fen]);

  /** Mahkota hijau (ikon victory ala Analisa) di atas raja PEMENANG saat
   *  posisi sedang ditampilkan adalah skakmat. */
  const ikonMahkota = useMemo(() => {
    const petak = petakRajaPemenang(fen);
    return petak ? { petak } : null;
  }, [fen]);

  /** Mainkan saran engine pada teka-teki — tetap divalidasi aturan soal:
      kalau sarannya bukan jawaban yang diharapkan, dihitung salah. */
  function mainkanSaranEngine(san) {
    if (!masalah || komputer || selesai || !sisa.length || !fen) return;
    const game = new Chess(fen);
    let pindah;
    try {
      pindah = game.move(san);
    } catch {
      pindah = null;
    }
    if (!pindah) return;
    setTerpilih(null);
    setSasaran([]);
    cobaLangkah(pindah.from, pindah.to, pindah.promotion);
  }

  const janjiKoleksiRef = useRef(null);
  const koleksiDimintaRef = useRef("lichess");
  const hidupKoleksiRef = useRef(true);
  useEffect(() => {
    hidupKoleksiRef.current = true;
    return () => {
      hidupKoleksiRef.current = false;
    };
  }, []);

  const unduhKoleksiTambahan = useCallback(() => {
    if (janjiKoleksiRef.current) return janjiKoleksiRef.current;
    const janji = fetch(`${import.meta.env.BASE_URL}data/teka-teki-video.json`)
      .then((respon) => {
        if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
        return respon.json();
      })
      .then((data) => {
        const mentah = data?.problems || [];
        if (!mentah.length) throw new Error("data tambahan kosong");
        return mentah.map((item) => {
          const videoBersih = urlVideoSah(item?.video);
          const tanggalBersih = tanggalVideoSah(item?.tanggal);
          return {
            ...item,
            ...(item?.pembukaan ? { pembukaan: standarkanNamaPembukaan(item.pembukaan) } : {}),
            video: videoBersih || undefined,
            tanggal: tanggalBersih || undefined,
          };
        });
      })
      .catch((err) => {
        janjiKoleksiRef.current = null;
        throw err;
      });
    janjiKoleksiRef.current = janji;
    return janji;
  }, []);

  const pilihKoleksi = useCallback(
    (koleksiBaru) => {
      if (koleksiBaru === filterKoleksi && !memuatKoleksi) return;
      koleksiDimintaRef.current = koleksiBaru;
      window.clearTimeout(timerOtomatis.current);
      setGalatNomor(null);
      setNomorSoal("");
      setFilterPelatih("semua");
      if (koleksiBaru === "lichess") {
        setMemuatKoleksi(false);
        if (filterTipe === "Mate in More" || filterTipe === "Tactical") {
          setFilterTipe("semua");
        }
        setFilterKoleksi("lichess");
        return;
      }
      if (soalTambahan) {
        setMemuatKoleksi(false);
        setFilterKoleksi(koleksiBaru);
        return;
      }
      setMemuatKoleksi(true);
      unduhKoleksiTambahan()
        .then((daftarTambahan) => {
          if (!hidupKoleksiRef.current) return;
          setSoalTambahan(daftarTambahan);
          setMemuatKoleksi(false);
          if (koleksiDimintaRef.current !== "lichess") {
            setFilterKoleksi(koleksiDimintaRef.current);
          }
        })
        .catch(() => {
          if (!hidupKoleksiRef.current) return;
          setMemuatKoleksi(false);
          if (koleksiDimintaRef.current !== "lichess") {
            setPesan({ jenis: "peringatan", teks: t("tekaTeki.gagalMuat") });
          }
        });
    },
    [filterKoleksi, filterTipe, memuatKoleksi, soalTambahan, unduhKoleksiTambahan, t]
  );

  const kolamAktif = useMemo(() => {
    if (filterKoleksi === "lichess") return semuaSoal;
    if (!soalTambahan) return null;
    if (filterKoleksi === "video") {
      return soalTambahan.filter((m) => Boolean(m.video));
    }
    if (filterKoleksi === "legenda") {
      return soalTambahan.filter((m) => (m.kurasi || "").split(" ").includes("legenda"));
    }
    if (filterKoleksi === "studi") {
      return soalTambahan.filter((m) => (m.kurasi || "").split(" ").includes("studi"));
    }
    return soalTambahan;
  }, [filterKoleksi, semuaSoal, soalTambahan]);

  const daftarPelatih = useMemo(() => {
    if (!kolamAktif || filterKoleksi === "lichess") return [];
    const hitung = new Map();
    for (const m of kolamAktif) {
      if (m.pelatih) hitung.set(m.pelatih, (hitung.get(m.pelatih) || 0) + 1);
    }
    return [...hitung.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1]);
  }, [kolamAktif, filterKoleksi]);

  const soal = useMemo(() => {
    if (!kolamAktif) return null;
    let hasil = kolamAktif;
    if (filterPelatih !== "semua") {
      hasil = hasil.filter((m) => m.pelatih === filterPelatih);
    }
    if (filterTipe !== "semua") hasil = hasil.filter((m) => m.type === filterTipe);
    if (filterLevel !== "semua")
      hasil = hasil.filter((m) => PITA_LEVEL[filterLevel](m.rating ?? 0));
    if (filterTema !== "semua")
      hasil = hasil.filter((m) => (m.tema || "").split(" ").includes(filterTema));
    if (filterGiliran !== "semua") hasil = hasil.filter((m) => m.first === filterGiliran);
    return hasil;
  }, [kolamAktif, filterPelatih, filterTipe, filterLevel, filterTema, filterGiliran]);

  const masalah = soal?.[indeks];

  const bukaDiAnalisa = useCallback(() => {
    if (!masalah) return;
    const pgn = bangunPgnUntukAnalisa(masalah);
    if (!pgn) return;
    window.clearTimeout(timerOtomatis.current);
    coba(
      () => sessionStorage.setItem("kci-analisa-impor-awal", pgn),
      "titip PGN ke papan analisa"
    );
    navigate("/program-kami/analisa/papan");
  }, [masalah, navigate]);
  const langkahPenuh = masalah ? masalah.moves.split(";") : [];
  const posisiLangkah = Math.max(0, langkahPenuh.length - sisa.length);

  const simpanPosisi = useCallback(
    (id) => {
      if (!ingatPosisiRef.current) return;
      if (semuaSoal && id > semuaSoal.length) return;
      coba(
        () => localStorage.setItem(KUNCI_POSISI, String(id)),
        "simpan posisi terakhir"
      );
      setPosisiTersimpan(id);
    },
    [semuaSoal]
  );

  /*
   * `replace: true` — nomor soal ditulis ke alamat supaya bisa dibagikan,
   * tetapi TIDAK menumpuk riwayat: tombol "kembali" tetap membawa pemain
   * keluar halaman, bukan berputar-putar antar soal.
   */
  const perbaruiUrlSoal = useCallback(
    (id) =>
      navigate(`/teka-teki/problem/${encodeURIComponent(String(id))}`, { replace: true }),
    [navigate]
  );

  useEffect(() => {
    let aktif = true;
    setGagal(false);
    fetch(`${import.meta.env.BASE_URL}data/teka-teki.json`)
      .then((respon) => {
        if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
        return respon.json();
      })
      .then(async (data) => {
        if (!aktif) return;
        const daftarMentah = data.problems || [];
        if (!daftarMentah.length) throw new Error("data kosong");
        const daftar = daftarMentah.map((item) =>
          item?.pembukaan
            ? { ...item, pembukaan: standarkanNamaPembukaan(item.pembukaan) }
            : item
        );
        const idParam = Number(idPath);

        if (Number.isInteger(idParam) && idParam > daftar.length) {
          try {
            const daftarTambahan = await unduhKoleksiTambahan();
            if (!aktif) return;
            const target = daftarTambahan.find((m) => m.problemid === idParam);
            if (target) {
              const koleksiTarget = target.video ? "video" : "arsip";
              const kolamTarget =
                koleksiTarget === "video"
                  ? daftarTambahan.filter((m) => Boolean(m.video))
                  : daftarTambahan;
              const idxTarget = kolamTarget.findIndex((m) => m.problemid === idParam);
              lewatiRefilterRef.current = true;
              koleksiSebelumnyaRef.current = koleksiTarget;
              koleksiDimintaRef.current = koleksiTarget;
              setSemuaSoal(daftar);
              setSoalTambahan(daftarTambahan);
              setFilterKoleksi(koleksiTarget);
              setIndeks(idxTarget >= 0 ? idxTarget : 0);
              terapkanSoal(target);
              perbaruiUrlSoal(target.problemid);
              return;
            }
          } catch {
            if (!aktif) return;
          }
        }

        let awalDiminta;
        let idTidakDitemukan = false;
        if (idParam >= 1 && idParam <= daftar.length) {
          awalDiminta = idParam - 1;
        } else {
          // Tandai bahwa ID dari URL tidak sah hanya bila segmen terakhir
          // BUKAN "problem" (URL kanonik `/teka-teki/problem`) dan ada isinya.
          if (idPathBermakna) idTidakDitemukan = true;
          // Posisi tersimpan hanya dipulihkan bila pemain masih mengaktifkan
          // "Ingat posisi" (lihat preferensi di panel pengaturan).
          const tersimpan = ingatPosisi ? bacaPosisi() : 0;
          awalDiminta =
            tersimpan >= 1 && tersimpan <= daftar.length
              ? tersimpan - 1
              : Math.floor(Math.random() * daftar.length);
        }

        // URL bernomor juga ditulis aplikasi saat berpindah soal. Jika URL
        // menunjuk tepat ke posisi terakhir yang tersimpan dan soal itu sudah
        // selesai, perlakukan sebagai pemulihan sesi — bukan permintaan review.
        // Deep-link bernomor yang berbeda dari posisi tersimpan tetap dapat
        // dibuka secara eksplisit untuk meninjau soal tertentu.
        const idValid = idParam >= 1 && idParam <= daftar.length;
        const idTersimpan = ingatPosisi ? bacaPosisi() : null;
        const sedangMemulihkanSoalSelesai =
          idValid &&
          idTersimpan === idParam &&
          terpecahkan.has(daftar[idParam - 1]?.problemid);
        const awal =
          idValid && !sedangMemulihkanSoalSelesai
            ? awalDiminta
            : cariIndeksBelumTerpecahkan(daftar, awalDiminta, terpecahkan);
        setSemuaSoal(daftar);
        if (awal === -1) {
          setIndeks(-1);
        } else {
          setIndeks(awal);
          terapkanSoal(daftar[awal]);
          perbaruiUrlSoal(daftar[awal].problemid);
          simpanPosisi(daftar[awal].problemid);
        }
        if (idTidakDitemukan) {
          setPesan({
            jenis: "peringatan",
            teks: t("tekaTeki.idSoalTidakDitemukan", {
              id: String(idPath),
              total: daftar.length,
            }),
          });
        }
      })
      .catch(() => {
        if (aktif) setGagal(true);
      });
    return () => {
      aktif = false;
    };
    // Dependensi yang sengaja dilepas: idPath, terapkanSoal, perbaruiUrlSoal,
    // dan simpanPosisi. Efek ini hanya boleh memuat data saat mount atau lewat
    // "Coba lagi" (percobaan), bukan saat perbaruiUrlSoal menulis ulang path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percobaan]);

  useEffect(() => {
    if (lewatiRefilterRef.current) {
      lewatiRefilterRef.current = false;
      return;
    }
    const gantiKoleksi = koleksiSebelumnyaRef.current !== filterKoleksi;
    koleksiSebelumnyaRef.current = filterKoleksi;
    if (!soal?.length) {
      setIndeks(-1);
      return;
    }
    const awalDiminta = gantiKoleksi ? 0 : Math.max(0, indeks);
    const safeIdx = cariIndeksBelumTerpecahkan(soal, awalDiminta, terpecahkan);
    if (safeIdx === -1) {
      setIndeks(-1);
      return;
    }
    setIndeks(safeIdx);
    terapkanSoal(soal[safeIdx]);
    perbaruiUrlSoal(soal[safeIdx].problemid);
    simpanPosisi(soal[safeIdx].problemid);
    // Dependensi yang sengaja dilepas: soal, indeks, terpecahkan, terapkanSoal,
    // perbaruiUrlSoal, dan simpanPosisi. Efek ini khusus re-filter: kalau
    // soal/indeks ikut dipantau, tiap pindah soal posisi yang sama akan
    // dipasang ulang. Riwayat dibaca saat filter berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKoleksi, filterPelatih, filterTipe, filterLevel, filterTema, filterGiliran]);

  useEffect(() => {
    document.title = `${t("tekaTeki.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  // Pesan salah dan peringatan otomatis hilang setelah beberapa detik.
  useEffect(() => {
    if (!pesan || (pesan.jenis !== "salah" && pesan.jenis !== "peringatan")) return;
    const durasi = pesan.jenis === "peringatan" ? 6000 : 3000;
    const timer = window.setTimeout(() => setPesan(null), durasi);
    return () => window.clearTimeout(timer);
  }, [pesan]);

  useEffect(() => {
    document.addEventListener("pointerdown", batalkanAbaikanKlik, true);
    return () => {
      document.removeEventListener("pointerdown", batalkanAbaikanKlik, true);
      batalkanAbaikanKlik();
      window.clearTimeout(timerSalah.current);
      window.clearTimeout(timerOtomatis.current);
    };
  }, [batalkanAbaikanKlik]);

  useEffect(() => {
    coba(
      () => localStorage.setItem(KUNCI_SET_BIDAK, setBidak),
      "simpan set bidak"
    );
  }, [setBidak]);

  useEffect(() => {
    coba(
      () => localStorage.setItem(KUNCI_WARNA_PAPAN, warnaPapan),
      "simpan warna papan"
    );
  }, [setWarnaPapan, warnaPapan]);

  useEffect(() => {
    coba(
      () => localStorage.setItem(KUNCI_OTOMATIS, otomatis ? "1" : "0"),
      "simpan mode otomatis"
    );
  }, [otomatis]);

  useEffect(() => {
    coba(
      () => localStorage.setItem(KUNCI_INGAT_POSISI, ingatPosisi ? "1" : "0"),
      "simpan preferensi ingat posisi"
    );
    // Saat dimatikan, posisi tersimpan lama langsung dibuang supaya tidak
    // terpakai lagi bila pemain mengaktifkannya kembali nanti.
    if (!ingatPosisi) {
      coba(() => localStorage.removeItem(KUNCI_POSISI), "hapus posisi tersimpan");
      setPosisiTersimpan(0);
    }
  }, [ingatPosisi]);

  /**
   * Pasang satu soal ke papan. `pertahankanSelesai` dipakai mode review
   * setelah soal tuntas: papan kembali ke posisi awal soal, tetapi status
   * selesai beserta pesan tuntas dibiarkan supaya tombol maju & video tetap aktif.
   */
  const terapkanSoal = useCallback((m, { pertahankanSelesai = false } = {}) => {
    batalkanAbaikanKlik();
    setFen(m.fen);
    setSisa(m.moves.split(";"));
    setJalurFen([m.fen]);
    setOrientasi(m.first === "Black to Move" ? "b" : "w");
    setTerpilih(null);
    setSasaran([]);
    setPetunjuk(null);
    setKesalahan(null);
    setLangkahAkhir(null);
    if (!pertahankanSelesai) {
      setPesan(null);
      setSelesai(false);
    }
    setKomputer(false);
    hapusSemuaTanda();
    setSedangSeret(false);
    setPromosi(null);
    setVideoGagal(false);
    setKomentar({ tahap: "mulai", fakta: null, fen: m.fen });
  }, [hapusSemuaTanda, batalkanAbaikanKlik]);

  const pindahSoal = useCallback(
    (indeksBaru, izinkanTerpecahkan = false) => {
      if (!soal || !soal.length) return;
      // Navigasi biasa melewati soal terpecahkan. Permintaan eksplisit lewat
      // input nomor boleh membuka ulang soal untuk ditinjau.
      const total = soal.length;
      const diminta = ((indeksBaru % total) + total) % total;
      const idx = izinkanTerpecahkan
        ? diminta
        : cariIndeksBelumTerpecahkan(soal, diminta, terpecahkan);
      window.clearTimeout(timerOtomatis.current);
      if (idx === -1) {
        setIndeks(-1);
        return;
      }
      const m = soal[idx];
      setIndeks(idx);
      terapkanSoal(m);
      perbaruiUrlSoal(m.problemid);
      simpanPosisi(m.problemid);
      bunyikan(SUARA.mulai);
    },
    [soal, terpecahkan, terapkanSoal, perbaruiUrlSoal, simpanPosisi, bunyikan]
  );

  const pilihAcak = () => {
    const tersedia = (soal || [])
      .map((m, indeks) => ({ m, indeks }))
      .filter(({ m }) => !terpecahkan.has(m.problemid));
    if (!tersedia.length) {
      setIndeks(-1);
      return;
    }
    const pilihan = tersedia[Math.floor(Math.random() * tersedia.length)];
    pindahSoal(pilihan.indeks);
  };

  function pilihPetak(petak) {
    if (!masalah || komputer || selesai || !fen) return;
    if (tanda.panah.length > 0 || Object.keys(tanda.petak).length > 0) {
      hapusSemuaTanda();
    }
    const game = new Chess(fen);
    const bidak = game.get(petak);
    if (bidak && bidak.color === game.turn()) {
      const tujuan = game
        .moves({ square: petak, verbose: true })
        .map((m) => m.to);
      setTerpilih(petak);
      setSasaran(tujuan);
    } else {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  function klikPetak(petak) {
    // Klik sintetik sesudah pointerup tidak boleh membatalkan pilihan hasil tap.
    if (abaikanKlikRef.current) {
      batalkanAbaikanKlik();
      return;
    }
    // Bersihkan panah/tanda lebih dulu — termasuk saat mengklik bidak
    // atau saat giliran komputer, agar panah selalu bisa dihapus.
    if (tanda.panah.length > 0 || Object.keys(tanda.petak).length > 0) {
      hapusSemuaTanda();
    }
    if (!masalah || !fen || komputer) return;

    if (!selesai && terpilih && sasaran.includes(petak)) {
      cobaLangkah(terpilih, petak);
      return;
    }
    if (!selesai && terpilih === petak) {
      setTerpilih(null);
      setSasaran([]);
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

    setTerpilih(null);
    setSasaran([]);
  }

  function cobaLangkah(from, to, promo) {
    if (!sisa.length) return;
    const diharapkan = parseLangkah(sisa[0]);

    // Bidak menuju baris terakhir → promosi wajib. Bila pemain belum memilih
    // bidak promosi, buka pemilihnya (jangan langsung dianggap salah).
    const promosiDiminta = butuhPromosi(fen, from, to);
    // Jangan buka dialog promosi untuk drop yang tidak legal.
    const langkahLegal = apakahLangkahLegal(fen, from, to);

    if (promosiDiminta.butuh && langkahLegal && !promo) {
      setPromosi({ from, to, warna: promosiDiminta.warna });
      setTerpilih(null);
      setSasaran([]);
      return;
    }

    let lanjut = null;

    // Langkah penutup tidak lagi istimewa: harus persis solusi, sama seperti
    // Rush. Skakmat legal lain (mate alternatif) tetap dihitung salah.
    // Untuk promosi, bidak harus sama dengan solusi — aturan itu ada di
    // apakahLangkahSesuai.
    if (apakahLangkahSesuai(from, to, promo, diharapkan)) {
      try {
        // Pilihan pemain dipakai bila data soal tidak menetapkan huruf promosi;
        // bila data menetapkannya, apakahLangkahSesuai sudah memastikan sama.
        lanjut = terapkan(fen, { from, to, promo: diharapkan.promo || promo });
      } catch { /* langkah ilegal — lanjut tetap null */ }
    }

    if (!lanjut) {
      window.clearTimeout(timerSalah.current);
      // Langkah tidak legal berbunyi lain dari jawaban keliru, supaya pemain
      // tahu bedanya "tidak boleh" dan "boleh tapi bukan solusinya".
      bunyikan(langkahLegal ? SUARA.tekaTekiSalah : SUARA.ilegal);

      /*
       * Skakmat alternatif: pemain menemukan mate LAIN yang sah, bukan langkah
       * yang tercatat di data. Kebijakan penilaian tetap ketat (harus persis
       * solusi, sama seperti Rush), tetapi memberi tahu pemain "belum tepat"
       * tanpa penjelasan menyesatkan — dia memang baru saja memberi skakmat.
       *
       * Pemeriksaan dibatasi ke langkah PENUTUP: hasil pemeriksaan seluruh
       * 5.486 soal menunjukkan 0 soal yang memungkinkan mate lebih awal dari
       * langkah penutup, jadi tidak ada kasus lain yang perlu ditangani.
       */
      const mateAlternatif =
        langkahLegal && sisa.length === 1 && apakahSkakmat(fen, { from, to, promo });
      setPesan({
        jenis: "salah",
        teks: t(mateAlternatif ? "tekaTeki.mateAlternatif" : "tekaTeki.salah"),
      });
      setKomentar({
        tahap: "salah",
        legal: langkahLegal,
        fakta: langkahLegal ? faktaDariKoordinat(fen, from, to, promo) : null,
        sisa: Math.ceil(sisa.length / 2), // langkah pemain yang masih harus ditemukan
        fen,
      });
      setKesalahan({ from, to });
      setTerpilih(null);
      setSasaran([]);
      timerSalah.current = window.setTimeout(() => setKesalahan(null), 700);
      return;
    }

    const sisaBaru = sisa.slice(1);
    // `lanjut` sudah berisi langkah pemain; ambil detailnya untuk memilih bunyi.
    const langkahPemain = lanjut.history({ verbose: true }).slice(-1)[0];
    setFen(lanjut.fen());
    setJalurFen((l) => [...l, lanjut.fen()]);
    setSisa(sisaBaru);
    setLangkahAkhir({ from, to });
    setTerpilih(null);
    setSasaran([]);
    setPetunjuk(null);
    setKesalahan(null);

    if (sisaBaru.length === 0) {
      // Teka-teki tuntas: bunyi langkah penutup dulu, lalu fanfar kemenangan.
      bunyikanLangkah(langkahPemain, lanjut);
      window.setTimeout(() => bunyikan(SUARA.tekaTekiTuntas), 220);
      setSelesai(true);
      setPesan({
        jenis: "selesai",
        teks: t(lanjut.isCheckmate() ? "tekaTeki.terpecahkan" : "tekaTeki.taktikTerpecahkan"),
      });
      setKomentar({ tahap: "selesai", fakta: faktaLangkah(fen, langkahPemain.san), fen: lanjut.fen() });
      catatTerpecahkan(masalah.problemid);
      if (otomatis) {
        window.clearTimeout(timerOtomatis.current);
        timerOtomatis.current = window.setTimeout(() => {
          pindahSoal(indeks + 1);
        }, 3000);
      }
    } else {
      bunyikanLangkah(langkahPemain, lanjut);
      window.setTimeout(() => bunyikan(SUARA.tekaTekiBenar), 150);
      setPesan({ jenis: "benar", teks: t("tekaTeki.benar") });
      setKomentar({
        tahap: "benar",
        fakta: faktaLangkah(fen, langkahPemain.san),
        sisa: Math.ceil(sisaBaru.length / 2), // langkah pemain tersisa setelah ini
        fen: lanjut.fen(),
      });
      setKomputer(true);
    }
  }

  function pilihPromosi(bidakPromosi) {
    if (!promosi) return;
    const { from, to } = promosi;
    setPromosi(null);
    cobaLangkah(from, to, bidakPromosi);
  }

  function batalPromosi() {
    setPromosi(null);
    setTerpilih(null);
    setSasaran([]);
  }

  useEffect(() => {
    if (!promosi) return;
    function saatEscape(e) {
      if (e.key === "Escape") batalPromosi();
    }
    window.addEventListener("keydown", saatEscape);
    return () => window.removeEventListener("keydown", saatEscape);
    // Dependensi yang sengaja dilepas: batalPromosi (fungsi biasa yang
    // identitasnya berubah tiap render); pendengar cukup dipasang selama
    // dialog promosi terbuka.
     
  }, [promosi]);

  useEffect(() => {
    if (!komputer || selesai || !sisa.length) return;
    const timer = window.setTimeout(() => {
      const diharapkan = parseLangkah(sisa[0]);
      try {
        const g = terapkan(fen, diharapkan);
        bunyikanLangkah(g.history({ verbose: true }).slice(-1)[0], g, {
          lawan: true,
        });
        setFen(g.fen());
        setJalurFen((l) => [...l, g.fen()]);
        setLangkahAkhir({ from: diharapkan.from, to: diharapkan.to });
        setSisa((s) => s.slice(1));
        setKomputer(false);
        setPesan(null);
        setKomentar({
          tahap: "lawan",
          fakta: faktaLangkah(fen, g.history({ verbose: true }).slice(-1)[0].san),
          // sisa langkah PEMAIN setelah balasan ini: sisa[0] adalah balasan
          // komputer, berikutnya bergantian pemain/komputer.
          sisa: Math.ceil((sisa.length - 1) / 2),
          fen: g.fen(),
        });
      } catch {
        // Posisi dan barisan harus selalu tetap sinkron bila data tak dapat diterapkan.
        terapkanSoal(masalah);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [komputer, fen, sisa, selesai, masalah, terapkanSoal, bunyikanLangkah]);

  function tampilPetunjuk() {
    if (!sisa.length || selesai || komputer || promosi) return;
    window.clearTimeout(timerOtomatis.current);
    const d = parseLangkah(sisa[0]);
    setPetunjuk({ from: d.from, to: d.to });
    let bidak = null;
    try {
      bidak = new Chess(fen).get(d.from)?.type || null;
    } catch { /* fen tidak sah — bidak tetap null */ }
    setKomentar({ tahap: "petunjuk", petunjuk: { ...d, bidak }, fen });
  }

  /* --------------------------------------------- navigasi langkah (|< < > >|) */

  function tutupBantu() {
    setTerpilih(null);
    setSasaran([]);
    setPetunjuk(null);
    setKesalahan(null);
    setPesan(null);
    setPromosi(null);
  }

  function tutupBantuTanpaPesan() {
    setTerpilih(null);
    setSasaran([]);
    setPetunjuk(null);
    setKesalahan(null);
    setPromosi(null);
  }

  /** |< — kembali ke posisi awal soal.
   *  Jika puzzle sudah selesai (cekmat), pertahankan status selesai
   *  agar tombol maju tetap bisa dipakai untuk review solusi.
   */
  function keAwalLangkah() {
    if (!masalah || komputer || promosi) return;
    window.clearTimeout(timerOtomatis.current);
    // Setelah cekmat (mode review) status selesai dipertahankan; sebelumnya
    // cabang ini menyalin ulang seluruh setter terapkanSoal.
    terapkanSoal(masalah, { pertahankanSelesai: selesai });
  }

  /** < — mundur satu langkah. */
  function mundurLangkah() {
    if (!langkahPenuh.length || komputer || promosi) return;
    window.clearTimeout(timerOtomatis.current);
    const posisi = Math.max(0, langkahPenuh.length - sisa.length);
    if (posisi <= 0) return;
    const baru = posisi - 1;
    // Bunyi langkah yang sedang dikembalikan (mode review) — persis seperti
    // Analisa: makan/rokade/skak/langkah.
    try {
      const d = parseLangkah(langkahPenuh[baru]);
      const g = terapkan(jalurFen[baru], d);
      bunyikanLangkah(g.history({ verbose: true }).slice(-1)[0], g);
    } catch { /* bunyi opsional — navigasi tetap jalan */ }
    setFen(jalurFen[baru]);
    setSisa(langkahPenuh.slice(baru));
    setJalurFen((l) => l.slice(0, baru + 1));
    setKomputer(false);
    // Saat review setelah cekmat, jangan hapus pesan selesai secara agresif;
    // cukup bersihkan bantuan visual agar navigasi tetap terasa review.
    if (selesai) {
      tutupBantuTanpaPesan();
    } else {
      tutupBantu();
    }
    if (baru >= 1) {
      const p = parseLangkah(langkahPenuh[baru - 1]);
      setLangkahAkhir({ from: p.from, to: p.to });
      if (selesai) {
        setKomentar({
          tahap: "tinjau",
          fakta: faktaDariKoordinat(jalurFen[baru - 1], p.from, p.to, p.promo),
          nomor: baru,
          fen: jalurFen[baru],
        });
      }
    } else {
      setLangkahAkhir(null);
      setKomentar({ tahap: "mulai", fakta: null, fen: jalurFen[0] });
    }
  }

  /** > — maju satu langkah mengikuti jalur solusi.
   *  Tombol ini dimatikan sebelum cekmat agar user tidak bisa
   *  melihat solusi dengan mudah. Hanya aktif setelah selesai.
   */
  function majuLangkah() {
    if (!langkahPenuh.length || komputer || promosi) return;
    window.clearTimeout(timerOtomatis.current);
    // Cegah maju sebelum cekmat — sesuai permintaan: tombol maju mati sebelum cekmate
    if (!selesai) return;
    const posisi = Math.max(0, langkahPenuh.length - sisa.length);
    if (posisi >= langkahPenuh.length) return;
    const d = parseLangkah(langkahPenuh[posisi]);
    try {
      const g = terapkan(fen, d);
      const fenBaru = g.fen();
      bunyikanLangkah(g.history({ verbose: true }).slice(-1)[0], g);
      setFen(fenBaru);
      setSisa(langkahPenuh.slice(posisi + 1));
      // `jalurFen[i]` = posisi SETELAH langkah ke-i, jadi posisi baru harus
      // ditambahkan SETELAH `jalurFen[posisi]` — bukan menggantikannya. Dulu
      // `slice(0, posisi)` (tanpa +1) membuang posisi sebelumnya, sehingga
      // indeks sesudahnya tergeser satu dan `mundurLangkah` mengembalikan
      // papan ke posisi yang sedang tampil (tombol mundur "tidak jalan").
      setJalurFen((l) => [...l.slice(0, posisi + 1), fenBaru]);
      setLangkahAkhir({ from: d.from, to: d.to });
      // Pertahankan status selesai = true agar tombol maju tetap aktif untuk review
      setKomputer(false);
      tutupBantuTanpaPesan();
      setKomentar({
        tahap: posisi + 1 >= langkahPenuh.length ? "selesai" : "tinjau",
        fakta: faktaLangkah(fen, g.history({ verbose: true }).slice(-1)[0].san),
        nomor: posisi + 1,
        fen: fenBaru,
      });
    } catch { /* posisi tidak sah — navigasi maju diabaikan */ }
  }

  /** >| — maju sampai posisi akhir solusi.
   *  Sama seperti maju, hanya aktif setelah cekmat.
   */
  function keAkhirLangkah() {
    if (!langkahPenuh.length || komputer || promosi) return;
    window.clearTimeout(timerOtomatis.current);
    if (!selesai) return;
    const posisi = Math.max(0, langkahPenuh.length - sisa.length);
    if (posisi >= langkahPenuh.length) return;
    let game;
    try {
      game = new Chess(fen);
    } catch {
      return;
    }
    const fens = [];
    let akhir = null;
    for (let i = posisi; i < langkahPenuh.length; i++) {
      const d = parseLangkah(langkahPenuh[i]);
      try {
        const mv = game.move({
          from: d.from,
          to: d.to,
          promotion: d.promo || undefined,
        });
        if (!mv) break;
      } catch {
        break;
      }
      fens.push(game.fen());
      akhir = { from: d.from, to: d.to };
    }
    if (!fens.length) return;
    setFen(fens[fens.length - 1]);
    setSisa([]);
    // Sama seperti `majuLangkah`: posisi-posisi baru menyambung SETELAH
    // `jalurFen[posisi]` (lihat catatan di sana).
    setJalurFen((l) => [...l.slice(0, posisi + 1), ...fens]);
    setLangkahAkhir(akhir);
    // Pertahankan selesai
    setKomputer(false);
    tutupBantuTanpaPesan();
    const fenSebelumAkhir =
      fens.length >= 2 ? fens[fens.length - 2] : posisi > 0 ? jalurFen[posisi] : fen;
    setKomentar({
      tahap: "selesai",
      fakta: akhir ? faktaDariKoordinat(fenSebelumAkhir, akhir.from, akhir.to, parseLangkah(langkahPenuh[langkahPenuh.length - 1]).promo) : null,
      nomor: langkahPenuh.length,
      fen: fens[fens.length - 1],
    });
  }

  /* ------------------------------------------------- pintasan keyboard */
  // Navigasi langkah dengan tombol panah — persis seperti Analisa:
  //   ← mundur, → maju, ↑ ke awal, ↓ ke akhir.
  // Memakai ref agar penekanan tombol selalu memakai fungsi/keadaan terbaru
  // tanpa perlu memasang-ulang pendengar tiap render.
  const kunciNavigasiRef = useRef({});
  kunciNavigasiRef.current = {
    mundur: mundurLangkah,
    maju: majuLangkah,
    keAwal: keAwalLangkah,
    keAkhir: keAkhirLangkah,
    adaSoal: !!langkahPenuh?.length,
    blokir: !!promosi || tabPanelAktif === "pengaturan",
  };
  useEffect(() => {
    let terakhirDitekan = 0;
    function saatKeydown(e) {
      if (!kunciNavigasiRef.current.adaSoal) return;
      if (kunciNavigasiRef.current.blokir) return;
      const el = e.target;
      const tipeFokus = ["text", "number", "password", "email", "search", "tel", "url"];
      if (el.tagName === "INPUT" && tipeFokus.includes(el.getAttribute("type") ?? "")) return;
      if (el.tagName === "TEXTAREA") return;
      if (el.tagName === "SELECT") return;
      const kini = Date.now();
      if (kini - terakhirDitekan < 25) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          kunciNavigasiRef.current.mundur?.();
          terakhirDitekan = kini;
          break;
        case "ArrowRight":
          e.preventDefault();
          kunciNavigasiRef.current.maju?.();
          terakhirDitekan = kini;
          break;
        case "ArrowUp":
          e.preventDefault();
          kunciNavigasiRef.current.keAwal?.();
          terakhirDitekan = kini;
          break;
        case "ArrowDown":
          e.preventDefault();
          kunciNavigasiRef.current.keAkhir?.();
          terakhirDitekan = kini;
          break;
      }
    }
    document.addEventListener("keydown", saatKeydown);
    return () => document.removeEventListener("keydown", saatKeydown);
  }, []);

  function catatTerpecahkan(id) {
    setTerpecahkan((lama) => {
      if (lama.has(id)) return lama;
      const baru = new Set(lama);
      baru.add(id);
      coba(
        () => localStorage.setItem(KUNCI_SELESAI, JSON.stringify([...baru])),
        "simpan daftar teka-teki terpecahkan"
      );
      return baru;
    });
  }

  function bukaNomor(e) {
    e.preventDefault();
    if (!soal?.length) return;
    const teks = nomorSoal.trim();
    const n = Number(teks);
    if (!/^\d+$/.test(teks) || n < 1 || n > soal.length) {
      setGalatNomor(t("tekaTeki.nomorTidakValid", { total: soal.length }));
      return;
    }
    setGalatNomor(null);
    setNomorSoal("");
    pindahSoal(n - 1, true);
  }

  // Klik kanan saat drag → bidak kembali ke petak asal (perilaku chess.com).
  const batalkanSeret = useCallback(() => {
    telanKlikBerikutnya();
    setSedangSeret(false);
    setTerpilih(null);
    setSasaran([]);
  }, [telanKlikBerikutnya]);

  const mulaiSeret = useCallback(
    (petak) => {
      batalkanAbaikanKlik();
      if (!masalah || komputer || selesai || !fen) return;
      const game = new Chess(fen);
      const bidak = game.get(petak);
      if (bidak && bidak.color === game.turn()) {
        setSedangSeret(true);
        pilihPetak(petak);
      }
    },
    // Dependensi yang sengaja dilepas: pilihPetak (fungsi biasa) dan tanda —
    // keduanya hanya dipakai pilihPetak untuk membersihkan panah/petak;
    // keadaan yang menggerbangi seret sudah ada di daftar ini.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masalah, komputer, selesai, fen, batalkanAbaikanKlik]
  );

  const selesaiSeret = useCallback(
    (from, to, klikUlang) => {
      setSedangSeret(false);
      telanKlikBerikutnya();
      if (!masalah || komputer || selesai || !fen) return;
      if (klikUlang) {
        setTerpilih(null);
        setSasaran([]);
        return;
      }
      if (!to || from === to) {
        // Dijatuhkan di petak asal / di luar papan → tetap terpilih.
        return;
      }
      cobaLangkah(from, to);
    },
    // Dependensi yang sengaja dilepas: cobaLangkah (fungsi biasa, identitasnya
    // berubah tiap render); keadaan yang menggerbangi penjatuhan bidak sudah
    // tercantum di daftar ini.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masalah, komputer, selesai, fen, sisa, terpilih, sasaran, telanKlikBerikutnya]
  );

  const _crumbs = [
    { label: t("common.home"), to: "/" },
    { label: t("tekaTeki.judul") },
  ];

  const sudahPecah = masalah ? terpecahkan.has(masalah.problemid) : false;

  /**
   * Segmen kalimat komentator untuk konteks terakhir. Dipisah dari state
   * `komentar` (yang hanya menyimpan tahap + fakta) supaya pergantian
   * bahasa/gaya langsung tercermin tanpa menyimpan teks jadi.
   */
  const segmenKomentar = useMemo(() => {
    if (!komentar || !masalah) return null;
    const giliranSoal = masalah.first === "Black to Move" ? "b" : "w";
    const jumlahLangkahSoal = Math.ceil(langkahPenuh.length / 2);
    return susunKomentarTekaTeki({
      tahap: komentar.tahap,
      gaya: preferensiKomentator.gaya,
      fakta: komentar.fakta || null,
      giliran: giliranSoal,
      jumlahLangkah: jumlahLangkahSoal,
      sisa: komentar.sisa !== undefined ? komentar.sisa : Math.ceil(sisa.length / 2),
      nomor: komentar.nomor || 0,
      sudahPecah,
      legal: komentar.legal !== false,
      tema: masalah.tema ? String(masalah.tema).split(/\s+/) : [],
      petunjuk: komentar.petunjuk || null,
      benih: masalah.problemid,
    });
  }, [komentar, masalah, langkahPenuh.length, sisa.length, sudahPecah, preferensiKomentator.gaya]);
  // Papan re-usable untuk ditempatkan di wadah gelap.
  /** Label tema dari kamus — dipakai keadaan memuat DAN keadaan siap supaya
   *  daftar tema tidak sempat tampil dalam bahasa Inggris bawaan
   *  (OPSI_TEMA_BAWAAN) lalu berganti bahasa saat data soal tiba. */
  const opsiTemaKamus = useMemo(
    () =>
      DAFTAR_TEMA.map((g) => ({
        grup: t(g.grup),
        isi: g.isi.map(([nilai, kunci]) => [nilai, t(kunci)]),
      })),
    [t]
  );

  const papanWadah = (
    <div className="relative h-full w-full">
      <PapanTekaTeki
        fen={fen}
        orientasi={orientasi}
        terpilih={terpilih}
        sasaran={sasaran}
        petunjuk={petunjuk}
        kesalahan={kesalahan}
        langkahAkhir={langkahAkhir}
        tanda={tanda}
        panahMesin={tampilPanahMesin ? panahMesin : null}
        ikonLangkah={
          kesalahan ? { petak: kesalahan.to, rating: "blunder" } : ikonLangkahAkhir
        }
        ikonSkakmat={kesalahan ? null : ikonSkakmat}
        ikonMahkota={kesalahan ? null : ikonMahkota}
        terkunci={komputer || selesai || !!promosi}
        membeku={komputer}
        setBidak={setBidak}
        tema={warnaPapan}
        sedangSeret={sedangSeret}
        onKlik={klikPetak}
        onPilih={pilihPetak}
        onMulaiSeret={mulaiSeret}
        onSelesaiSeret={selesaiSeret}
        onBatalSeret={batalkanSeret}
        onJatuh={cobaLangkah}
        onTandaPetak={tandaPetak}
        onTandaPanah={tandaPanah}
        onHapusTanda={hapusSemuaTanda}
      />
      {promosi && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={batalPromosi}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("tekaTeki.promosiJudul")}
            className="flex flex-col items-center gap-3 rounded-lg bg-white/95 p-4 shadow-xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-slate-700">
              {t(
                promosi.warna === "w"
                  ? "tekaTeki.promosiPutih"
                  : "tekaTeki.promosiHitam"
              )}
            </p>
            <div className="flex gap-2">
              {PILIHAN_PROMOSI.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => pilihPromosi(p)}
                  aria-label={t(KUCI_NAMA_PROMOSI[p])}
                  title={t(KUCI_NAMA_PROMOSI[p])}
                  className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 p-1.5 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChessPiece
                    piece={promosi.warna === "w" ? p.toUpperCase() : p}
                    set={setBidak}
                    className="h-full w-full"
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={batalPromosi}
              className="text-xs font-medium text-slate-500 underline-offset-2 transition hover:text-slate-700 hover:underline"
            >
              {t("tekaTeki.promosiBatal")}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Bar evaluasi re-usable untuk wadah gelap.
  // Meniru komponen Evaluation halaman Analisa (port Brilliant-Chess):
  // background #403d39, bar putih #ffffff dengan transisi 0.4s,
  // dua teks skor di atas & bawah bar, hanya yang menang yang tampil.
  const barEvaluasiWadah = (() => {
    const { teksSkor = "", cpPutih = 0, matePutih = null } =
      hasilTertahan || {};

    // advantageAmount = skor centipawn dari sudut pandang putih (cpPutih).
    const advantageAmount = matePutih !== null ? Number(matePutih) : Number(cpPutih);

    const OLD_PERCENTS = [-400, 400];
    const NEW_PERCENTS = [5, 95];
    const rawPercent =
      ((advantageAmount - OLD_PERCENTS[0]) * (NEW_PERCENTS[1] - NEW_PERCENTS[0])) /
        (OLD_PERCENTS[1] - OLD_PERCENTS[0]) +
      NEW_PERCENTS[0];
    let percent;
    if (matePutih !== null) {
      percent = advantageAmount > 0 ? 100 : advantageAmount < 0 ? 0 : 50;
    } else {
      percent = Math.min(Math.max(rawPercent, NEW_PERCENTS[0]), NEW_PERCENTS[1]);
    }

    const white = orientasi !== "hitam";
    const winning = white ? percent >= 50 : percent <= 50;

    let displayAdvantage;
    if (matePutih !== null) {
      displayAdvantage =
        advantageAmount !== 0
          ? "M" + Math.abs(advantageAmount)
          : white
            ? "1-0"
            : "0-1";
    } else {
      displayAdvantage = teksSkor || "";
    }

    return (
      <div
        className={`relative flex h-full w-9 shrink-0 flex-col overflow-hidden rounded-sm bg-[#403d39] ${white ? "justify-start" : "justify-end"}`}
        role="img"
        aria-label={hasilTertahan ? `${t("papan.engineSkor")} ${displayAdvantage}` : undefined}
      >
        {/* Isi putih — proporsi kemenangan (height = percent%) */}
        <div
          className="w-full bg-[#ffffff]"
          style={{
            height: `${percent}%`,
            transition: "height 0.4s",
            willChange: "height",
          }}
        />
        {/* Overlay dua teks skor (atas & bawah bar) */}
        <div className="absolute inset-0 flex w-full flex-col items-center justify-between py-1.5 text-[11px] font-bold">
          <div
            style={{ opacity: !winning ? 100 : 0 }}
            className={white ? "text-[#dedede]" : "text-[#262421]"}
          >
            {displayAdvantage}
          </div>
          <div
            style={{ opacity: winning ? 100 : 0 }}
            className={!white ? "text-[#dedede]" : "text-[#262421]"}
          >
            {displayAdvantage}
          </div>
        </div>
      </div>
    );
  })();

  return (
    <>
      {/*
        Satu halaman kanonik untuk pemutar teka-teki. Nomor soal di alamat
        (dipakai untuk berbagi) sengaja TIDAK menjadi kanonik sendiri —
        kalau tidak, 5.486 URL nyaris identik akan bersaing di hasil pencarian.
      */}
      <MetaHalaman
        title={t("tekaTeki.metaJudul")}
        description={t("tekaTeki.metaDeskripsi")}
        robots="index, follow"
        path="/teka-teki/problem"
      />
      {gagal ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#262421] px-6 py-10">
          <p className="max-w-md rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm leading-6 text-red-300">
            {t("tekaTeki.gagalMuat")}
          </p>
          <button
            type="button"
            onClick={() => setPercobaan((n) => n + 1)}
            className="rounded-full border border-red-800 px-5 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-950/60"
          >
            {t("common.cobaLagi")}
          </button>
        </div>
      ) : !masalah ? (
        kolamAktif && !memuatKoleksi ? (
          <div className="flex min-h-screen items-center justify-center bg-[#262421] px-6 py-10">
            <p className="max-w-md rounded-md border border-amber-900 bg-amber-950/40 px-4 py-3 text-sm leading-6 text-amber-300">
              {soal?.length && soal.every((m) => terpecahkan.has(m.problemid))
                ? t("tekaTeki.semuaTerpecahkan")
                : t("tekaTeki.tidakAdaSoal")}
            </p>
          </div>
        ) : (
          /* Kerangka layar penuh selama data soal diunduh. */
          <LayoutTekaTeki
            memuat
            nilaiKoleksi={filterKoleksi}
            onGantiKoleksi={pilihKoleksi}
            nilaiTotalSoal={0}
            opsiTema={opsiTemaKamus}
          />
        )
      ) : (
        <LayoutTekaTeki
              papan={papanWadah}
              barEvaluasi={barEvaluasiWadah}
              orientasi={orientasi}
              tabPanelAktif={tabPanelAktif}
              onGantiTabPanel={setTabPanelAktif}
              giliran={(fen && fen.split(" ")[1] === "b") ? "hitam" : "putih"}
              // langkahPenuh menyimpan setengah-langkah (ply), sedangkan label
              // "Skak dalam N langkah" harus menghitung langkah pihak yang
              // mencari solusi: mate-in-3 = 5 ply solusi, bukan 5 langkah.
              jumlahLangkah={Math.ceil(langkahPenuh.length / 2)}
              bukanSkakmat={masalah?.type === "Tactical"}
              selesai={selesai}
              videoUrl={masalah?.video || ""}
              videoPelatih={masalah?.pelatih || ""}
              videoJudulSoal={masalah?.judulSoal || ""}
              videoTurnamen={masalah?.turnamen || ""}
              videoTanggal={masalah?.tanggal || ""}
              videoGagal={videoGagal}
              catatanLangkah={masalah?.catatanLangkah || null}
              jumlahVariasi={masalah?.jumlahVariasi || 0}
              simbolNag={masalah?.simbolNag || ""}
              memuatKoleksi={memuatKoleksi}
              onPutarVideo={() => window.clearTimeout(timerOtomatis.current)}
              onGalatVideo={() => setVideoGagal(true)}
              onBukaKoleksiVideo={() => pilihKoleksi("video")}
              onBukaAnalisa={bukaDiAnalisa}
              nilaiKoleksi={filterKoleksi}
              onGantiKoleksi={pilihKoleksi}
              daftarPelatih={daftarPelatih}
              nilaiPelatih={filterPelatih}
              onGantiPelatih={setFilterPelatih}
              teksTingkat={masalah ? t(KUNCI_LEVEL[bandLevel(masalah.rating ?? 0)]) : ""}
              eloSoal={masalah ? masalah.rating : 1500}
              namaHitam={masalah ? masalah.pemainHitam : ""}
              eloHitam={masalah ? masalah.eloHitam : 0}
              namaPutih={masalah ? masalah.pemainPutih : ""}
              eloPutih={masalah ? masalah.eloPutih : 0}
              teksPembukaan={masalah ? masalah.pembukaan : ""}
              komentatorNyala={preferensiKomentator.nyala}
              teksTerpecahkan={t("tekaTeki.totalTerpecahkan", { n: terpecahkan.size })}
              teksCekmat={pesan?.jenis === "selesai" ? pesan.teks : ""}
              daftarSet={DAFTAR_SET}
              nilaiSetBidak={setBidak}
              onGantiSetBidak={setSetBidak}
              pilihanWarnaPapan={PILIHAN_WARNA_PAPAN.map(([nilai, kunci]) => [nilai, t(kunci)])}
              nilaiWarnaPapan={warnaPapan}
              onGantiWarnaPapan={setWarnaPapan}
              nilaiSuara={suaraNyala}
              onGantiSuara={setSuaraNyala}
              onAcak={pilihAcak}
              onLewati={() => pindahSoal(indeks + 1)}
              nilaiOtomatis={otomatis}
              onGantiOtomatis={setOtomatis}
              engineNyala={engineNyala}
              onGantiEngine={() => (engineNyala ? matikanEngine() : nyalakanEngine())}
              tampilPanahMesin={tampilPanahMesin}
              onGantiPanahMesin={setTampilPanahMesin}
              teksPanahMesin={t("papan.enginePanahToggle")}
              nilaiLevel={filterLevel}
              onGantiLevel={setFilterLevel}
              nilaiLangkah={
                filterTipe === "Mate in One"
                  ? "1"
                  : filterTipe === "Mate in Two"
                    ? "2"
                    : filterTipe === "Mate in Three"
                      ? "3"
                      : filterTipe === "Mate in More"
                        ? "4+"
                        : filterTipe === "Tactical"
                          ? "taktik"
                          : "semua"
              }
              onGantiLangkah={(v) =>
                setFilterTipe(
                  v === "semua"
                    ? "semua"
                    : v === "1"
                      ? "Mate in One"
                      : v === "2"
                        ? "Mate in Two"
                        : v === "3"
                          ? "Mate in Three"
                          : v === "4+"
                            ? "Mate in More"
                            : "Tactical"
                )
              }
              nilaiTema={filterTema}
              onGantiTema={setFilterTema}
              opsiTema={opsiTemaKamus}
              nilaiGiliran={filterGiliran}
              onGantiGiliran={setFilterGiliran}
              nilaiNomorSoal={nomorSoal}
              nilaiTotalSoal={soal.length}
              onGantiNomorSoal={setNomorSoal}
              nilaiIngatPosisi={ingatPosisi}
              onGantiIngatPosisi={setIngatPosisi}
              teksPosisiTersimpan={
                ingatPosisi && posisiTersimpan
                  ? t("tekaTeki.posisiTersimpan", { n: posisiTersimpan })
                  : ""
              }
              teksIngatNonaktif={ingatPosisi ? "" : t("tekaTeki.ingatNonaktif")}
              teksGalatNomor={galatNomor || ""}
              onBukaNomor={bukaNomor}
              bisaHint={!selesai && !komputer && !promosi && sisa.length > 0}
              onHint={tampilPetunjuk}
              kartuKomentator={
                <KartuKomentator
                  segmen={segmenKomentar}
                  posisiAwal={false}
                  nyala={preferensiKomentator.nyala}
                  setNyala={preferensiKomentator.setNyala}
                  gaya={preferensiKomentator.gaya}
                  setGaya={preferensiKomentator.setGaya}
                  t={t}
                  className=""
                  hanyaKontrol
                />
              }
              kecepatanEngine={kecepatanEngine}
              onGantiKecepatan={(ms) => setKecepatanEngine(Number(ms))}
              opsiKecepatan={PILIHAN_KECEPATAN.map(([ms, kunci]) => [ms, t(kunci)])}
              pvSanEngine={hasilEngine?.pvSan || []}
              onMainkanSaran={mainkanSaranEngine}
              onFlip={() => setOrientasi((o) => (o === "w" ? "b" : "w"))}
              onKeAwal={keAwalLangkah}
              onMundur={mundurLangkah}
              onMaju={majuLangkah}
              onKeAkhir={keAkhirLangkah}
              bisaMundur={!komputer && !promosi && posisiLangkah > 0}
              bisaMaju={!komputer && !promosi && selesai && posisiLangkah < langkahPenuh.length}
            />
      )}
    </>
  );
}

const PosisiAwal = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

const SIMBOL = {
  r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟",
  R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙",
};

function papanSampel() {
  const papan = PosisiAwal.map((baris) => baris.slice());
  papan[6][4] = null; papan[4][4] = "P";
  papan[1][4] = null; papan[3][4] = "p";
  papan[7][6] = null; papan[5][5] = "N";
  return papan;
}

/**
 * Kerangka papan selama data soal belum ada.
 *
 * Sebelumnya cabang "memuat" memakai papan contoh (`papanSampel`) yang
 * menggambar bidak sebagai GLIF UNICODE — pengguna melihat papan bergaya lain
 * (bukan set bidak SVG), plus "Skak dalam 1 langkah" dan rating 1500 palsu,
 * lalu semuanya berganti saat data tiba. Sekarang: 64 petak kosong di wadah
 * aspect-square yang sama, tanpa bidak dan tanpa angka palsu — tidak ada yang
 * "salah" untuk dilihat, dan ukurannya identik dengan papan asli.
 */
function KerangkaPapan() {
  return (
    <div aria-hidden="true" className="grid h-full w-full grid-cols-8 grid-rows-8 animate-pulse">
      {Array.from({ length: 64 }, (_, i) => {
        const r = Math.floor(i / 8);
        const c = i % 8;
        return (
          <div
            key={i}
            className={(r + c) % 2 === 0 ? "bg-[#3a3733]" : "bg-[#2f2d2a]"}
          />
        );
      })}
    </div>
  );
}

/** Bilah evaluasi netral untuk keadaan memuat (bukan "+0.3" palsu). */
function KerangkaBilahEvaluasi() {
  return (
    <div
      aria-hidden="true"
      className="h-full w-[30px] flex-shrink-0 animate-pulse rounded-md bg-[#312e2b]"
    />
  );
}

/** Validasi runtime URL video MP4 & tanggal harian agar hanya domain CSP sah yang pernah dirender. */
const POLA_URL_VIDEO_SAH =
  /^https:\/\/(media\.chesscomfiles\.com|chesscom-videos\.s3\.amazonaws\.com)\/[^\s"<>]+\.mp4$/i;
const POLA_TANGGAL_VIDEO_SAH = /^\d{4}-\d{2}-\d{2}$/;

function urlVideoSah(url) {
  const bersih = typeof url === "string" ? url.trim() : "";
  return POLA_URL_VIDEO_SAH.test(bersih) ? bersih : "";
}

function tanggalVideoSah(tanggal) {
  const bersih = typeof tanggal === "string" ? tanggal.trim() : "";
  return POLA_TANGGAL_VIDEO_SAH.test(bersih) ? bersih : "";
}

/** Opsi tema cadangan bila tidak dikirim dari halaman utama. */
const OPSI_TEMA_BAWAAN = [
  { grup: "Skakmat", isi: [["backRankMate", "Back Rank Mate"], ["smotheredMate", "Smothered Mate"], ["promotion", "Promotion"]] },
  { grup: "Taktik", isi: [["sacrifice", "Sacrifice"], ["attraction", "Attraction"], ["deflection", "Deflection"], ["pin", "Pin"], ["fork", "Fork"], ["discoveredAttack", "Discovered Attack"]] },
  { grup: "Karakteristik", isi: [["endgame", "Endgame"], ["middlegame", "Middlegame"], ["opening", "Opening"]] },
];

function LayoutTekaTeki({ papan = null, barEvaluasi = null, orientasi = "w", tabPanelAktif = "main", onGantiTabPanel = null, onFlip = null, giliran = "putih", jumlahLangkah = 1, bukanSkakmat = false, selesai = false, videoUrl = "", videoPelatih = "", videoJudulSoal = "", videoTurnamen = "", videoTanggal = "", videoGagal = false, catatanLangkah = null, jumlahVariasi = 0, simbolNag = "", memuatKoleksi = false, onPutarVideo = null, onGalatVideo = null, onBukaKoleksiVideo = null, onBukaAnalisa = null, nilaiKoleksi = "lichess", onGantiKoleksi = null, daftarPelatih = [], nilaiPelatih = "semua", onGantiPelatih = null, teksTingkat = "", teksTerpecahkan = "", teksCekmat = "", daftarSet = [], nilaiSetBidak = "merida", onGantiSetBidak = null, pilihanWarnaPapan = [], nilaiWarnaPapan = "green", onGantiWarnaPapan = null, nilaiSuara = true, onGantiSuara = null, onAcak = null, onLewati = null, nilaiOtomatis = false, onGantiOtomatis = null, engineNyala = false, onGantiEngine = null, tampilPanahMesin = true, onGantiPanahMesin = null, teksPanahMesin = "", nilaiLevel = "semua", onGantiLevel = null, nilaiLangkah = "semua", onGantiLangkah = null, nilaiTema = "semua", opsiTema = [], onGantiTema = null, nilaiGiliran = "semua", onGantiGiliran = null, nilaiNomorSoal = "", nilaiTotalSoal = 0, onGantiNomorSoal = null, nilaiIngatPosisi = true, onGantiIngatPosisi = null, teksPosisiTersimpan = "", teksIngatNonaktif = "", teksGalatNomor = "", onBukaNomor = null, bisaHint = false, onHint = null, kartuKomentator = null, kecepatanEngine = 800, opsiKecepatan = [], onGantiKecepatan = null, pvSanEngine = [], onMainkanSaran = null, onKeAwal = null, onMundur = null, onMaju = null, onKeAkhir = null, bisaMundur = false, bisaMaju = false, eloSoal = 1500, namaHitam = "", eloHitam = 0, namaPutih = "", eloPutih = 0, teksPembukaan = "", komentatorNyala = false, memuat = false }) {
  const { t } = useI18n();
  // Default prop sengaja kosong: teksnya selalu dari kamus.
  const labelPanahMesin = teksPanahMesin || t("papan.enginePanahToggle");
  const papanStatic = papanSampel();
  const file = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const daftarTema = opsiTema.length ? opsiTema : OPSI_TEMA_BAWAAN;
  const videoUrlAman = urlVideoSah(videoUrl);
  const videoTanggalAman = tanggalVideoSah(videoTanggal);
  const tautanSumberVideo = videoTanggalAman
    ? `https://www.chess.com/daily-chess-puzzle/${videoTanggalAman}`
    : "https://www.chess.com/daily-chess-puzzle";

  return (
    <div className="flex flex-col min-h-screen lg:h-screen overflow-hidden bg-[#262421] text-gray-200 font-sans select-none">
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SIDEBAR KIRI                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[220px] bg-[#1e1c18] flex flex-col justify-between py-4 border-r border-b lg:border-b-0 border-[#312e2b] flex-shrink-0">
          <div>
            {/* Brand */}
            <div className="px-5 mb-4 flex items-center">
              <span className="font-bold text-[22px] tracking-tight text-white leading-none">
                Blunder<span className="text-[#81b64c]">Skuad</span>
              </span>
            </div>

            {/* Filter Controls */}
            <div className="px-5 pt-1 space-y-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="wadah-koleksi" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelKoleksi")}</label>
                <select
                  id="wadah-koleksi"
                  value={nilaiKoleksi}
                  onChange={(e) => onGantiKoleksi && onGantiKoleksi(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                >
                  <option value="lichess">{t("tekaTeki.koleksiLichess")}</option>
                  <option value="video">{t("tekaTeki.koleksiVideo")}</option>
                  <option value="legenda">{t("tekaTeki.koleksiLegenda")}</option>
                  <option value="studi">{t("tekaTeki.koleksiStudi")}</option>
                  <option value="arsip">{t("tekaTeki.koleksiArsip")}</option>
                </select>
              </div>

              {daftarPelatih.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="wadah-pelatih" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelPelatih")}</label>
                  <select
                    id="wadah-pelatih"
                    value={nilaiPelatih}
                    onChange={(e) => onGantiPelatih && onGantiPelatih(e.target.value)}
                    className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                  >
                    <option value="semua">{t("tekaTeki.semuaPelatih")}</option>
                    {daftarPelatih.map(([nama, cacah]) => (
                      <option key={nama} value={nama}>
                        {nama} ({cacah})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label htmlFor="wadah-level" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelLevel")}</label>
                <select
                  id="wadah-level"
                  value={nilaiLevel}
                  onChange={(e) => onGantiLevel && onGantiLevel(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                >
                  <option value="semua">{t("tekaTeki.semuaLevel")}</option>
                  <option value="1">{t("tekaTeki.sangatMudah")}</option>
                  <option value="2">{t("tekaTeki.mudah")}</option>
                  <option value="3">{t("tekaTeki.normal")}</option>
                  <option value="4">{t("tekaTeki.sulit")}</option>
                  <option value="5">{t("tekaTeki.sangatSulit")}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="wadah-langkah" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelLangkah")}</label>
                <select
                  id="wadah-langkah"
                  value={nilaiLangkah}
                  onChange={(e) => onGantiLangkah && onGantiLangkah(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                >
                  <option value="semua">{t("tekaTeki.semua")}</option>
                  <option value="1">{t("tekaTeki.langkahSatu")}</option>
                  <option value="2">{t("tekaTeki.langkahDua")}</option>
                  <option value="3">{t("tekaTeki.langkahTiga")}</option>
                  {nilaiKoleksi !== "lichess" && (
                    <>
                      <option value="4+">{t("tekaTeki.langkahEmpatPlus")}</option>
                      <option value="taktik">{t("tekaTeki.langkahTaktik")}</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="wadah-tema" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelTema")}</label>
                <select
                  id="wadah-tema"
                  value={nilaiTema}
                  onChange={(e) => onGantiTema && onGantiTema(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                >
                  <option value="semua">{t("tekaTeki.semuaTema")}</option>
                  {daftarTema.map((g) => (
                    <optgroup key={g.grup} label={g.grup}>
                      {g.isi.map(([nilai, label]) => (
                        <option key={nilai} value={nilai}>
                          {label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="wadah-giliran" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelGiliran")}</label>
                <select
                  id="wadah-giliran"
                  value={nilaiGiliran}
                  onChange={(e) => onGantiGiliran && onGantiGiliran(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                >
                  <option value="semua">{t("tekaTeki.semuaGiliran")}</option>
                  <option value="White to Move">{t("tekaTeki.hanyaPutih")}</option>
                  <option value="Black to Move">{t("tekaTeki.hanyaHitam")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom sidebar */}
          <div className="px-4 space-y-3 mt-4">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (onBukaNomor) onBukaNomor(e);
              }}
            >
              <div className="relative px-1">
                <p className="mb-1.5 px-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelSoal")}</p>
                <input
                  type="number"
                  min={1}
                  max={nilaiTotalSoal || undefined}
                  value={nilaiNomorSoal}
                  onChange={(e) => onGantiNomorSoal && onGantiNomorSoal(e.target.value)}
                  aria-label={t("tekaTeki.rentangNomor", { total: nilaiTotalSoal || 1 })}
                  placeholder={`1–${nilaiTotalSoal || 1}`}
                  className="w-full bg-[#262421] text-sm text-gray-200 px-3 py-2.5 rounded-md border border-[#363431] focus:outline-none focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20 placeholder-gray-400"
                />
                {teksGalatNomor && (
                  <p role="alert" className="mt-1 px-1 text-[11px] font-medium text-red-400">
                    {teksGalatNomor}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-[#81b64c] hover:bg-[#a3d168] text-[#1e1c18] font-bold py-2.5 px-3 rounded-md text-sm transition shadow-lg shadow-[#81b64c]/20 cursor-pointer"
              >
                {t("tekaTeki.buka")}
              </button>
            </form>
            <button
              type="button"
              onClick={onHint}
              disabled={!bisaHint}
              title={t("tekaTeki.petunjuk")}
              className="w-full bg-[#363431] hover:bg-[#45423e] text-white font-semibold py-2.5 px-3 rounded-md text-sm transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#363431]"
            >
              <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6" />
                <path d="M10 22h4" />
                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
              </svg>
              {t("tekaTeki.petunjuk")}
            </button>
            <div className="pt-3 flex justify-center text-gray-300 text-xs border-t border-[#312e2b]">
              <Link
                to="/program-kami/atribusi"
                className="flex items-center gap-1.5 hover:text-white transition"
              >
                <License size={14} class="fill-current" />
                {t("papan.menuAtribusi")}
              </Link>
            </div>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* AREA UTAMA: PAPAN + BAR EVALUASI                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        <main className="flex-1 flex items-stretch justify-center p-6 bg-[#262421] min-w-0 overflow-hidden">
          {/* Sisakan ruang untuk padding dan dua profil; offset menyeimbangkan bilah evaluasi. */}
          <div className="flex flex-row items-stretch gap-3 w-full max-w-[720px] lg:max-w-[calc(100vh_-_106px)] lg:-translate-x-5 min-h-0">

            {/* Kolom kiri setinggi panel: profil atas → papan → profil bawah */}
            <div className="flex-1 flex min-h-0 min-w-0 flex-col justify-between">

              {/* ─── PROFIL PEMAIN HITAM (ATAS) ─── */}
              <div className={`relative z-10 flex flex-row justify-between items-center pl-[44px] pr-1 flex-shrink-0 ${orientasi === "w" ? "order-1" : "order-3"}`}>
                <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                  {/* Avatar Hitam */}
                  <div className="h-10 w-10 flex-shrink-0 flex flex-row justify-center items-end bg-[#474542] rounded-md shadow-md">
                    <svg className="scale-x-[1.15]" height="32" width="32" viewBox="0 0 512 512">
                      <path className="fill-[#1d1c1a]" d="M359.51,367.614c-19.106-7.148-40.877-18.276-40.877-32.676c0-9.533,0-21.444,0-37.782
                      c6.996-19.393,17.51-20.781,22.768-50.546c12.254-4.379,19.258-11.384,28.009-42.026c6.574-23.064-3.112-29.254-9.382-30.905
                      c0.128-1.229,0.256-2.466,0.359-3.917c2.369-34.543,22.425-137.078-47.012-149.332c-18.38-14.296-30.043-20.774-69.437-18.38
                      C219.001,2.042,200.046,7.547,173.632,0c-35.245,29.565-25.561,126.66-20.63,173.504c-6.199,1.388-16.889,7.148-10.052,31.08
                      c8.744,30.641,15.748,37.646,28.001,42.026c5.258,29.765,21.252,39.322,22.417,50.546c0,16.338,0,28.248,0,37.782
                      c0,14.4-23.494,26.55-40.877,32.676C119.058,379.397,25.911,414.275,34.073,512h443.856
                      C486.09,414.275,392.712,380.035,359.51,367.614z" />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2">
                      {namaHitam ? (
                        <span className="text-sm font-bold text-[#fffaec] truncate">{namaHitam}</span>
                      ) : (
                        <span className="text-sm font-bold text-[#fffaec] truncate">{t("tekaTeki.sisiHitam")}</span>
                      )}
                      {eloHitam > 0 && (
                        <span className="text-xs text-gray-300 font-medium">({eloHitam})</span>
                      )}
                    </div>
                    <div className="flex flex-row items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-gray-400 font-medium truncate">
                        {memuat
                          ? "—"
                          : bukanSkakmat
                            ? t("tekaTeki.taktikDalamN", { n: jumlahLangkah })
                            : t("tekaTeki.skakDalamN", { n: jumlahLangkah })}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Level soal: label di samping kiri kotak */}
                <div className="flex flex-row items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{t("tekaTeki.levelSoal")}</span>
                  <div className="flex text-nowrap justify-center items-center h-10 min-w-[100px] px-3 rounded-md bg-[#1e1d1c] text-sm font-bold shadow-inner border border-[#312e2b]">
                    {teksTingkat ? (
                      <span className="text-[#fffaec] truncate">{teksTingkat}</span>
                    ) : (
                      <span className="text-[#999]">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── TENGAH: BAR EVALUASI + PAPAN (mengisi sisa tinggi) ─── */}
              <div className="order-2 flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
              <div className="flex w-full flex-row items-stretch gap-2">
                {/* Bar Evaluasi */}
                {barEvaluasi ? (
                  <div className="self-stretch flex items-center justify-center">
                    {barEvaluasi}
                  </div>
                ) : memuat ? (
                  <div className="self-stretch flex items-center justify-center">
                    <KerangkaBilahEvaluasi />
                  </div>
                ) : (
                  <div className="w-[30px] flex-shrink-0 rounded-md overflow-hidden relative bg-[#ffffff] shadow-inner">
                    {/* Bagian putih (atas) */}
                    <div className="absolute top-0 left-0 right-0 bg-[#ffffff] transition-all duration-500" style={{ height: "48%" }}>
                      <div className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-gray-700">
                        +0.3
                      </div>
                    </div>
                    {/* Bagian hitam (bawah) */}
                    <div className="absolute bottom-0 left-0 right-0 bg-[#312e2b] transition-all duration-500" style={{ height: "52%" }}>
                      <div className="absolute top-1 left-0 right-0 text-center text-[9px] font-bold text-gray-400">
                      </div>
                    </div>
                    {/* Garis tengah */}
                    <div className="absolute left-0 right-0 h-[1px] bg-gray-400/30" style={{ top: "48%" }}></div>
                  </div>
                )}

                {/* Papan Catur */}
                <div className="relative aspect-square max-h-full max-w-full min-h-0 min-w-0 flex-1 shadow-2xl rounded-md overflow-hidden">
                  {papan ? (
                    papan
                  ) : memuat ? (
                    <KerangkaPapan />
                  ) : (
                    <div className="grid grid-cols-8 grid-rows-8 relative h-full w-full">
                      {papanStatic.map((row, r) =>
                        row.map((bidak, c) => {
                          const terang = (r + c) % 2 === 0;
                          // Highlight last move squares
                          const _isLastMove =
                            (r === 4 && c === 4) || // e4
                            (r === 6 && c === 4) || // e2 (from)
                            (r === 3 && c === 4) || // e5
                            (r === 1 && c === 4) || // e7 (from)
                            (r === 5 && c === 5) || // f3 (to)
                            (r === 7 && c === 6);   // g1 (from)
                          
                          const isHighlighted = (r === 5 && c === 5) || (r === 7 && c === 6);

                          let bgColor;
                          if (isHighlighted) {
                            bgColor = terang ? "bg-[#f6f669]" : "bg-[#baca2b]";
                          } else {
                            bgColor = terang ? "bg-[#eeeed2]" : "bg-[#769656]";
                          }

                          return (
                            <div
                              key={`${r}-${c}`}
                              className={`relative flex items-center justify-center select-none cursor-pointer hover:opacity-90 transition-opacity ${bgColor}`}
                              style={{ fontSize: "clamp(1.5rem, 7vw, 4.2rem)" }}
                            >
                              {/* Rank numbers (left side) */}
                              {c === 0 && (
                                <span className={`absolute top-[2px] left-[3px] font-bold leading-none ${terang ? "text-[#769656]" : "text-[#eeeed2]"}`}
                                  style={{ fontSize: "clamp(7px, 1.2vw, 12px)" }}
                                >
                                  {8 - r}
                                </span>
                              )}
                              {/* Piece */}
                              {bidak && (
                                <span
                                  className={`leading-none ${
                                    bidak.toUpperCase() === bidak
                                      ? "text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]"
                                      : "text-[#312e2b] drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]"
                                  }`}
                                  style={{
                                    filter: bidak.toUpperCase() === bidak
                                      ? "drop-shadow(0 1px 0 rgba(0,0,0,0.4))"
                                      : "drop-shadow(0 1px 0 rgba(0,0,0,0.2))"
                                  }}
                                >
                                  {SIMBOL[bidak]}
                                </span>
                              )}
                              {/* File letters (bottom row) */}
                              {r === 7 && (
                                <span className={`absolute bottom-[2px] right-[3px] font-bold leading-none ${terang ? "text-[#769656]" : "text-[#eeeed2]"}`}
                                  style={{ fontSize: "clamp(7px, 1.2vw, 12px)" }}
                                >
                                  {file[c]}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
              </div>

              {/* ─── PROFIL PEMAIN PUTIH (BAWAH) ─── */}
              <div className={`relative z-10 flex flex-row justify-between items-center pl-[44px] pr-1 flex-shrink-0 ${orientasi === "w" ? "order-3" : "order-1"}`}>
                <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                  {/* Avatar Putih */}
                  <div className="h-10 w-10 flex-shrink-0 flex flex-row justify-center items-end bg-[#dbd9d6] rounded-md shadow-md">
                    <svg className="scale-x-[1.15]" height="32" width="32" viewBox="0 0 512 512">
                      <path className="fill-[#ffffff]" d="M359.51,367.614c-19.106-7.148-40.877-18.276-40.877-32.676c0-9.533,0-21.444,0-37.782
                      c6.996-19.393,17.51-20.781,22.768-50.546c12.254-4.379,19.258-11.384,28.009-42.026c6.574-23.064-3.112-29.254-9.382-30.905
                      c0.128-1.229,0.256-2.466,0.359-3.917c2.369-34.543,22.425-137.078-47.012-149.332c-18.38-14.296-30.043-20.774-69.437-18.38
                      C219.001,2.042,200.046,7.547,173.632,0c-35.245,29.565-25.561,126.66-20.63,173.504c-6.199,1.388-16.889,7.148-10.052,31.08
                      c8.744,30.641,15.748,37.646,28.001,42.026c5.258,29.765,21.252,39.322,22.417,50.546c0,16.338,0,28.248,0,37.782
                      c0,14.4-23.494,26.55-40.877,32.676C119.058,379.397,25.911,414.275,34.073,512h443.856
                      C486.09,414.275,392.712,380.035,359.51,367.614z" />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2">
                      {namaPutih ? (
                        <span className="text-sm font-bold text-[#fffaec] truncate">{namaPutih}</span>
                      ) : (
                        <span className="text-sm font-bold text-[#fffaec] truncate">{t("tekaTeki.sisiPutih")}</span>
                      )}
                      {eloPutih > 0 && (
                        <span className="text-xs text-gray-300 font-medium">({eloPutih})</span>
                      )}
                    </div>
                    <div className="flex flex-row items-center gap-1.5 mt-0.5">
                      {teksTerpecahkan && (
                        <span className="text-[11px] font-bold text-gray-300">{teksTerpecahkan}</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Rating soal: label di samping kiri kotak */}
                <div className="flex flex-row items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{t("tekaTeki.ratingSoal")}</span>
                  <div className="flex text-nowrap justify-center items-center h-10 min-w-[100px] px-3 rounded-md bg-[#f0f0f0] text-[#1e1d1c] text-lg font-mono font-bold shadow border border-[#81b64c] ring-2 ring-[#81b64c]/40">
                    {memuat ? "—" : eloSoal}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PANEL KANAN                                            */}
        {/* ═══════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[480px] h-full bg-[#211f1c] border-t lg:border-t-0 lg:border-l border-[#312e2b] flex flex-col flex-shrink-0 min-h-0">
          {/* Tab panel kanan — pola visual mengikuti Teka-teki Harian. */}
          <div
            role="tablist"
            aria-label="Panel teka-teki"
            className="grid grid-cols-3 gap-1 rounded-lg border border-[#312e2b] bg-[#262421] p-1 m-3 mb-0"
          >
            {[
              ["main", "Main"],
              ["video", "Video"],
              ["pengaturan", t("tekaTeki.pengaturan")],
            ].map(([kunci, label]) => {
              const aktif = tabPanelAktif === kunci;
              return (
                <button
                  key={kunci}
                  type="button"
                  role="tab"
                  aria-selected={aktif}
                  data-tab={kunci}
                  onClick={() => onGantiTabPanel?.(kunci)}
                  className={`rounded-md px-2 py-1.5 text-xs font-bold transition ${
                    aktif
                      ? "bg-[#3d3a37] text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {tabPanelAktif === "main" && (
          <>
          {/* Komentator menggantikan nama opening book saat diaktifkan. */}
          {komentatorNyala && kartuKomentator ? (
            <div className="flex-shrink-0 min-w-0 border-b border-[#312e2b] bg-[#1e1c18] px-4 py-2">
              {React.cloneElement(kartuKomentator, {
                hanyaKontrol: false,
                sembunyikanKontrol: true,
                className: "w-full min-w-0",
              })}
            </div>
          ) : teksPembukaan ? (
            <div className="flex-shrink-0 min-w-0 border-b border-[#312e2b] bg-[#1e1c18] px-4 py-2 flex items-baseline gap-2">
              <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider flex-shrink-0">{t("papan.pembukaan")}</span>
              <span className="text-[11px] font-medium text-gray-300 truncate min-w-0" title={teksPembukaan}>{teksPembukaan}</span>
            </div>
          ) : null}

          {/* Ringkasan soal disusun bertingkat seperti piramida. */}
          <div className="flex-shrink-0 px-4 py-4">
            <div
              data-testid="main-turn-status"
              className="flex flex-col items-center gap-2.5 text-center"
            >
              <span
                data-testid="main-turn-icon"
                data-side={memuat ? undefined : giliran}
                data-piece={memuat ? undefined : giliran === "putih" ? "P" : "p"}
                aria-hidden="true"
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#dedcd9]/20"
              >
                {!memuat && (
                  <ChessPiece
                    piece={giliran === "putih" ? "P" : "p"}
                    set={nilaiSetBidak}
                    className="h-11 w-11 object-contain"
                  />
                )}
              </span>
              <span
                data-testid="main-turn-label"
                aria-live="polite"
                className="text-sm font-semibold text-[#fffaec]"
              >
                {memuat
                  ? "—"
                  : giliran === "putih"
                    ? t("tekaTeki.giliranPutih")
                    : t("tekaTeki.giliranHitam")}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!memuat && teksTingkat && (
                  <span
                    data-testid="main-turn-difficulty"
                    className="rounded-md bg-[#81b64c]/15 px-2.5 py-1 text-xs font-semibold text-[#a3d168]"
                  >
                    {teksTingkat}
                  </span>
                )}
                <span
                  data-testid="main-turn-rating"
                  className="rounded-md bg-[#312e2b] px-2.5 py-1 text-xs font-semibold text-gray-300"
                >
                  Elo {memuat ? "—" : eloSoal}
                </span>
              </div>
            </div>
          </div>

          {/* Konten utama panel dipertahankan seperti sebelumnya. */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 text-sm">
            {selesai && !memuat && !memuatKoleksi && (
              <div className="space-y-2.5 pt-1">
                {(Array.isArray(catatanLangkah) && catatanLangkah.length > 0 || jumlahVariasi > 0 || simbolNag) && (
                  <div
                    data-catatan-pgn="ada"
                    className="rounded-md border border-[#312e2b] bg-[#1e1c18] p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-300">
                        {t("tekaTeki.catatanPelatihJudul")}
                      </span>
                      {simbolNag && (
                        <span className="rounded bg-[#81b64c]/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#a3d168]">
                          {simbolNag}
                        </span>
                      )}
                    </div>
                    {Array.isArray(catatanLangkah) &&
                      catatanLangkah.map((teks, idxCatatan) => (
                        <p key={idxCatatan} className="text-xs leading-5 text-gray-300">
                          {teks}
                        </p>
                      ))}
                    {jumlahVariasi > 0 && (
                      <p className="text-xs text-gray-400">
                        {t("tekaTeki.variasiCabang", { n: jumlahVariasi })}
                      </p>
                    )}
                  </div>
                )}


              </div>
            )}
          </div>

          </>
          )}
          {tabPanelAktif === "video" && (
            <div role="tabpanel" data-panel="video" className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Video className="size-4 shrink-0 text-[#81b64c]" aria-hidden="true" />
                <span className="text-xs font-bold text-gray-200 uppercase tracking-wider truncate">
                  {t("tekaTeki.videoJudul")}
                </span>
              </div>
              {videoPelatih && (
                <span className="text-xs font-medium text-gray-300 truncate">
                  {t("tekaTeki.videoOleh", { pelatih: videoPelatih })}
                </span>
              )}
            </div>

            {(videoJudulSoal || videoTurnamen) && (
              <div className="rounded-md border border-[#312e2b] bg-[#1e1c18] px-3 py-2 space-y-0.5">
                {videoJudulSoal && (
                  <p className="text-xs font-semibold text-white truncate" title={videoJudulSoal}>
                    {videoJudulSoal}
                  </p>
                )}
                {videoTurnamen && (
                  <p className="text-xs text-gray-400 truncate" title={videoTurnamen}>
                    {videoTurnamen}
                  </p>
                )}
              </div>
            )}

            {/* Penguncian antarmuka (UI anti-spoiler): URL MP4 berasal dari
                dataset publik `data/teka-teki-video.json`, sehingga menunda
                render `<video>` hingga `selesai === true` bertujuan mencegah
                bocoran solusi di antarmuka latihan, bukan kontrol akses server. */}
            {memuat || memuatKoleksi ? (
              <p className="text-xs font-medium text-gray-400">
                {t("tekaTeki.videoMemuatKoleksi")}
              </p>
            ) : videoUrlAman ? (
              !selesai ? (
                <div
                  data-status-video="terkunci"
                  className="flex items-start gap-2.5 rounded-md border border-[#312e2b] bg-[#1e1c18] p-3"
                >
                  <Lock className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
                  <p className="text-xs leading-5 text-gray-300">
                    {t("tekaTeki.videoTerkunci")}
                  </p>
                </div>
              ) : (
                <div data-status-video="terbuka" className="space-y-2.5">
                  <p className="text-xs leading-5 text-gray-300">
                    {t("tekaTeki.videoSiap")}
                  </p>
                  {videoGagal ? (
                    <div className="rounded-md border border-[#312e2b] bg-[#1e1c18] p-3 space-y-2">
                      <p className="text-xs leading-5 text-gray-300">
                        {t("tekaTeki.videoGagal")}
                      </p>
                      <a
                        href={tautanSumberVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a3d168] hover:underline"
                      >
                        {t("tekaTeki.videoBukaSumber")}
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  ) : (
                    <video
                      key={videoUrlAman}
                      controls
                      preload="none"
                      playsInline
                      src={videoUrlAman}
                      onPlay={onPutarVideo || undefined}
                      onError={onGalatVideo || undefined}
                      className="w-full aspect-square max-h-72 rounded-md border border-[#312e2b] bg-black object-contain select-auto"
                    />
                  )}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <a
                      href={tautanSumberVideo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 hover:underline"
                    >
                      {t("tekaTeki.videoSumber")}
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                    {videoTanggalAman && (
                      <span className="font-mono text-xs text-gray-400">{videoTanggalAman}</span>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div
                data-status-video="kosong"
                className="rounded-md border border-[#312e2b] bg-[#1e1c18] p-3 space-y-3"
              >
                <p className="text-xs leading-5 text-gray-300">
                  {t("tekaTeki.videoTidakTersedia")}
                </p>
                {nilaiKoleksi !== "video" && onBukaKoleksiVideo && (
                  <button
                    type="button"
                    onClick={onBukaKoleksiVideo}
                    className="w-full rounded-md bg-[#363431] hover:bg-[#45423e] px-3 py-2 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    {t("tekaTeki.videoBukaKoleksi")}
                  </button>
                )}
              </div>
            )}

            </div>
          )}

          {tabPanelAktif === "pengaturan" && (
            <div
              role="tabpanel"
              data-panel="pengaturan"
              className="flex-1 overflow-y-auto min-h-0 p-4"
            >
              <p className="mb-3 text-sm font-bold text-white">
                {t("tekaTeki.pengaturan")}
              </p>
              <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3">
                          {daftarSet.length > 0 && onGantiSetBidak && (
                            <div className="flex items-center justify-between gap-3">
                              <label
                                htmlFor="sampel-pilih-set-bidak"
                                className="text-xs font-semibold text-gray-400"
                              >
                                {t("papan.setBidak")}
                              </label>
                              <select
                                id="sampel-pilih-set-bidak"
                                value={nilaiSetBidak}
                                onChange={(e) => onGantiSetBidak(e.target.value)}
                                className="w-32 shrink-0 rounded-md border border-[#363431] bg-[#262421] px-2 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                              >
                                {daftarSet.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.nama}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {onGantiSuara && (
                            <label className="flex cursor-pointer items-center justify-between gap-3">
                              <span className="text-xs font-semibold text-gray-400">
                                {t("papan.suara")}
                              </span>
                              <input
                                type="checkbox"
                                checked={nilaiSuara}
                                onChange={(e) => onGantiSuara(e.target.checked)}
                                className="h-4 w-4 accent-[#81b64c]"
                              />
                            </label>
                          )}
                          {onGantiEngine && (
                            <label className="flex cursor-pointer items-center justify-between gap-3">
                              <span className="text-xs font-semibold text-gray-400">
                                {t("papan.engine")}
                              </span>
                              <input
                                type="checkbox"
                                data-aksi="toggle-engine"
                                checked={engineNyala}
                                onChange={() => onGantiEngine()}
                                className="h-4 w-4 accent-[#81b64c]"
                              />
                            </label>
                          )}
                          {onGantiPanahMesin && (
                            <label className="flex cursor-pointer items-center justify-between gap-3">
                              <span className="text-xs font-semibold text-gray-400">
                                {labelPanahMesin}
                              </span>
                              <input
                                type="checkbox"
                                checked={tampilPanahMesin}
                                onChange={(e) => onGantiPanahMesin(e.target.checked)}
                                aria-label={labelPanahMesin}
                                className="h-4 w-4 accent-[#81b64c]"
                              />
                            </label>
                          )}
                          {onGantiIngatPosisi && (
                            <div className="grid gap-1">
                              <label className="flex cursor-pointer items-center justify-between gap-3">
                                <span className="text-xs font-semibold text-gray-400">
                                  {t("tekaTeki.ingatPosisi")}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={nilaiIngatPosisi}
                                  onChange={(e) => onGantiIngatPosisi(e.target.checked)}
                                  className="h-4 w-4 accent-[#81b64c]"
                                />
                              </label>
                              {(teksPosisiTersimpan || teksIngatNonaktif) && (
                                <p className="text-[11px] text-gray-500">
                                  {teksPosisiTersimpan || teksIngatNonaktif}
                                </p>
                              )}
                            </div>
                          )}
                          {kartuKomentator && (
                            <div className="border-t border-[#312e2b] pt-3">
                              {kartuKomentator}
                            </div>
                          )}
                          {pilihanWarnaPapan.length > 0 && onGantiWarnaPapan && (
                            <div className="flex items-center justify-between gap-3">
                              <label
                                htmlFor="sampel-warna-papan"
                                className="text-xs font-semibold text-gray-400"
                              >
                                {t("papan.warnaPapan")}
                              </label>
                              <select
                                id="sampel-warna-papan"
                                value={nilaiWarnaPapan}
                                onChange={(e) => onGantiWarnaPapan(e.target.value)}
                                className="w-32 shrink-0 rounded-md border border-[#363431] bg-[#262421] px-2 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                              >
                                {pilihanWarnaPapan.map(([nilai, label]) => (
                                  <option key={nilai} value={nilai}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
  
              </div>
            </div>
          )}

          {engineNyala && (
            <div className="flex-shrink-0 border-b border-[#312e2b] bg-[#1e1c18] px-3 py-2 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{t("tekaTeki.kecepatanMesin")}</span>
                <select
                  value={kecepatanEngine}
                  onChange={(e) => onGantiKecepatan && onGantiKecepatan(Number(e.target.value))}
                  className="rounded-md border border-[#363431] bg-[#262421] px-2 py-1 text-xs text-gray-200 outline-none transition focus:border-[#81b64c]"
                >
                  {opsiKecepatan.map(([ms, label]) => (
                    <option key={ms} value={ms}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {pvSanEngine.length > 0 && onMainkanSaran && (
                <button
                  type="button"
                  onClick={() => onMainkanSaran(pvSanEngine[0])}
                  className="w-full rounded-md bg-[#363431] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#45423e]"
                >
                  {t("tekaTeki.mainkanSaran", { san: pvSanEngine[0] })}
                </button>
              )}
            </div>
          )}

          {/* Navigation controls */}
          <div className="flex-shrink-0 mt-auto p-3 bg-[#1e1c18] border-t border-[#312e2b] space-y-3">
            <div className="flex items-center gap-1 bg-[#262421] p-1 rounded-lg border border-[#312e2b]">
              <button
                type="button"
                onClick={onKeAwal}
                disabled={!bisaMundur}
                title={t("papan.keAwal")}
                aria-label={t("papan.keAwal")}
                className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                <ChevronStartIcon className="size-5" />
              </button>
              <button
                type="button"
                onClick={onMundur}
                disabled={!bisaMundur}
                title={t("tekaTeki.mundurSatu")}
                aria-label={t("tekaTeki.mundurSatu")}
                className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <button
                type="button"
                onClick={onMaju}
                disabled={!bisaMaju}
                title={t("tekaTeki.majuSatu")}
                aria-label={t("tekaTeki.majuSatu")}
                className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                <ChevronRightIcon className="size-5" />
              </button>
              <button
                type="button"
                onClick={onKeAkhir}
                disabled={!bisaMaju}
                title={t("papan.keAkhir")}
                aria-label={t("papan.keAkhir")}
                className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                <ChevronEndIcon className="size-5" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-400">
              <button
                type="button"
                onClick={onFlip}
                title={t("tekaTeki.balikPapan")}
                aria-label={t("tekaTeki.balikPapan")}
                className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b] cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12,22q-3.57,0-6.32-2.25T2.2,14H4.25q0.7,2.65 2.85,4.32T12,20q2.15,0 4-1.06T18.9,16H16V14h6v6H20V18q-1.43,1.9-3.52,2.95T12,22ZM9.88,14.13Q9,13.25 9,12T9.88,9.88T12,9t2.13,0.88T15,12t-0.88,2.13T12,15T9.88,14.13ZM2,10V4H4V6Q5.43,4.1 7.53,3.05T12,2q3.58,0 6.32,2.25Q21.08,6.5 21.8,10H19.75q-0.7-2.65-2.85-4.32T12,4Q9.85,4 8,5.06T5.1,8H8v2H2Z" />
                </svg>
                <span>Balik</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!onGantiSuara) return;
                  if (!nilaiSuara) mainkanSuara(SUARA.tesSuara);
                  onGantiSuara(!nilaiSuara);
                }}
                aria-pressed={nilaiSuara}
                aria-label={nilaiSuara ? t("tekaTeki.suaraMatikan") : t("tekaTeki.suaraHidupkan")}
                title={nilaiSuara ? t("tekaTeki.suaraMatikan") : t("tekaTeki.suaraHidupkan")}
                className={`flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] rounded-lg transition border border-[#312e2b] cursor-pointer ${nilaiSuara ? "text-white" : "text-[#b33430]"}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4z" />
                  {nilaiSuara ? (
                    <>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </>
                  ) : (
                    <>
                      <line x1="22" y1="9" x2="16" y2="15" />
                      <line x1="16" y1="9" x2="22" y2="15" />
                    </>
                  )}
                </svg>
                <span className="text-xs font-semibold">
                  Suara
                </span>
              </button>
              {onGantiOtomatis && (
                <button
                  type="button"
                  data-aksi="toggle-otomatis"
                  onClick={() => onGantiOtomatis(!nilaiOtomatis)}
                  aria-label={
                    nilaiOtomatis
                      ? t("tekaTeki.otomatisMatikan")
                      : t("tekaTeki.otomatisNyalakan")
                  }
                  aria-pressed={nilaiOtomatis}
                  title={t("tekaTeki.lanjutOtomatis")}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border border-[#312e2b] p-2.5 transition cursor-pointer ${
                    nilaiOtomatis
                      ? "bg-[#81b64c]/20 text-[#a3d168]"
                      : "bg-[#262421] text-gray-400 hover:bg-[#312e2b] hover:text-white"
                  }`}
                >
                  {nilaiOtomatis ? (
                    <Pause className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Play className="h-5 w-5" aria-hidden="true" />
                  )}
                  <span className="text-xs font-semibold">
                    {nilaiOtomatis ? t("tekaTeki.jeda") : t("tekaTeki.autoLanjut")}
                  </span>
                </button>
              )}
              {onBukaAnalisa && (
                <button
                  type="button"
                  data-aksi="buka-analisa"
                  onClick={onBukaAnalisa}
                  disabled={!selesai || memuat || memuatKoleksi}
                  aria-label="Analisa"
                  title="Analisa"
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition border border-[#312e2b] ${
                    selesai && !memuat && !memuatKoleksi
                      ? "bg-[#262421] hover:bg-[#312e2b] hover:text-white cursor-pointer"
                      : "bg-[#262421] text-gray-500 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                    <path d="M19.6,21l-6.3-6.3q-0.75,0.6-1.72,0.95T9.5,16q-2.72,0-4.61-1.89Q3,12.23 3,9.5Q3,6.77 4.89,4.89T9.5,3t4.61,1.89T16,9.5q0,1.1-0.35,2.07T14.7,13.3L21,19.6L19.6,21ZM9.5,14q1.88,0 3.19-1.31T14,9.5T12.69,6.31T9.5,5T6.31,6.31T5,9.5t1.31,3.19T9.5,14Zm-2-1.5l0.75-2.45l-2-1.6H8.7L9.5,6l0.8,2.45h2.45l-2,1.6L11.5,12.5l-2-1.55l-2,1.55Z"/>
                  </svg>
                  <span>Analisa</span>
                </button>
              )}
              <button
                type="button"
                onClick={onAcak}
                title={t("tekaTeki.soalAcak")}
                aria-label={t("tekaTeki.soalAcak")}
                className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>{t("tekaTeki.acak")}</span>
              </button>
              <button
                type="button"
                onClick={onLewati}
                title={teksCekmat ? t("tekaTeki.selanjutnya") : t("tekaTeki.lewati")}
                aria-label={teksCekmat ? t("tekaTeki.selanjutnya") : t("tekaTeki.lewati")}
                className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b] cursor-pointer"
              >
                <ArrowRightIcon className="w-5 h-5" />
                <span>{teksCekmat ? t("tekaTeki.selanjutnya") : t("tekaTeki.lewati")}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
