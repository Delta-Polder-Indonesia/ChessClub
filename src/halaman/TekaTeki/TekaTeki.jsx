import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Chess } from "chess.js";
import { ArrowRightIcon } from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece, DAFTAR_SET } from "../../components/chess/ChessPiece.jsx";
import PapanTekaTeki from "./PapanTekaTeki.jsx";
import { gunakanEngineCatur } from "../../lib/gunakanEngineCatur.js";
import { PILIHAN_KECEPATAN } from "../../components/PanelEngine.jsx";
import { standarkanNamaPembukaan } from "../../lib/namaPembukaan.js";
import { isForced } from "../Analisa/mesin/penilaian.js";
import { cariNamaPembukaan } from "../Analisa/mesin/buku.js";
import { petakRajaPemenang, petakRajaTermat } from "../../lib/skakmat.js";
import License from "../Analisa/komponen/svg/license.jsx";
import { SUARA, gunakanSuara, mainkanSuara } from "../../lib/suara.js";
import KartuKomentator, {
  gunakanPreferensiKomentator,
} from "../../components/KartuKomentator.jsx";
import { faktaLangkah, susunKomentarTekaTeki } from "../../lib/komentator.js";

const KUNCI_SELESAI = "kci-teka-teki-terpecahkan";
const KUNCI_POSISI = "kci-teka-teki-posisi";
const KUNCI_SET_BIDAK = "kci-teka-teki-set-bidak";
const KUNCI_WARNA_PAPAN = "kci-teka-teki-warna-papan";
const KUNCI_OTOMATIS = "kci-teka-teki-otomatis";
const KUNCI_TIPE = {
  "Mate in One": "skakmat1",
  "Mate in Two": "skakmat2",
  "Mate in Three": "skakmat3",
};
/** Label level (1–5) sesuai pita rating NACCL, sama dengan pilihan selector Level. */
const NAMA_LEVEL = {
  1: "Sangat Mudah",
  2: "Mudah",
  3: "Normal",
  4: "Sulit",
  5: "Sangat Sulit",
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

/** Warna chip kategori hasil tablebase Syzygy; labelnya lewat t("tekaTeki.syzygyKat.*"). */
const PETA_KELAS_SYZYGY = {
  win: "text-emerald-300",
  "cursed-win": "text-lime-300",
  draw: "text-slate-300",
  "blessed-loss": "text-amber-300",
  loss: "text-red-300",
  unknown: "text-gray-400",
};

function parseLangkah(teks) {
  return {
    from: teks.slice(0, 2),
    to: teks.slice(3, 5),
    promo: teks.length > 5 ? teks[5] : null,
  };
}

/** Urutan pilihan bidak promosi (menteri, benteng, gajah, kuda). */
const PILIHAN_PROMOSI = ["q", "r", "b", "n"];
const KUCI_NAMA_PROMOSI = {
  q: "tekaTeki.promosiMenteri",
  r: "tekaTeki.promosiBenteng",
  b: "tekaTeki.promosiGajah",
  n: "tekaTeki.promosiKuda",
};

function terapkan(fen, { from, to, promo }) {
  const game = new Chess(fen);
  const opsi = { from, to };
  const bidak = game.get(from);
  if (bidak && bidak.type === "p" && (to.endsWith("8") || to.endsWith("1"))) {
    opsi.promotion = promo || "q";
  }
  game.move(opsi);
  return game;
}

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

function bacaTerpecahkan() {
  try {
    const simpan = JSON.parse(localStorage.getItem(KUNCI_SELESAI) || "[]");
    return new Set(Array.isArray(simpan) ? simpan : []);
  } catch {
    return new Set();
  }
}

function bacaPosisi() {
  try {
    const n = Number(localStorage.getItem(KUNCI_POSISI));
    return Number.isInteger(n) && n >= 1 ? n : null;
  } catch {
    return null;
  }
}

function bacaSetBidak() {
  try {
    const simpan = localStorage.getItem(KUNCI_SET_BIDAK);
    if (simpan && DAFTAR_SET.some((s) => s.id === simpan)) return simpan;
  } catch {}
  return "merida";
}

function bacaWarnaPapan() {
  try {
    const simpan = localStorage.getItem(KUNCI_WARNA_PAPAN);
    if (simpan && PILIHAN_WARNA_PAPAN.some(([nilai]) => nilai === simpan)) {
      return simpan;
    }
  } catch {}
  return "green";
}

function bacaOtomatis() {
  try {
    return localStorage.getItem(KUNCI_OTOMATIS) === "1";
  } catch {
    return false;
  }
}

function KerangkaTekaTeki() {
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
  const [params, setParams] = useSearchParams();

  const [semuaSoal, setSemuaSoal] = useState(null);
  const [gagal, setGagal] = useState(false);
  const [syzygy, setSyzygy] = useState(null);
  const [syzygyGagal, setSyzygyGagal] = useState(false);
  const [indeks, setIndeks] = useState(0);
  const [filterTipe, setFilterTipe] = useState("semua");
  const [filterLevel, setFilterLevel] = useState("semua");
  const [filterTema, setFilterTema] = useState("semua");
  const [filterGiliran, setFilterGiliran] = useState("semua");

  const [fen, setFen] = useState("");
  const [sisa, setSisa] = useState([]);
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [petunjuk, setPetunjuk] = useState(null);
  const [kesalahan, setKesalahan] = useState(null);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [jalurFen, setJalurFen] = useState([]);
  const [orientasi, setOrientasi] = useState("w");
  const [pesan, setPesan] = useState(null);
  /**
   * Komentator langsung — konteks tahap terakhir (mulai/benar/lawan/salah/
   * petunjuk/selesai/tinjau) beserta fakta langkah terkait. Kalimatnya
   * disusun ulang tiap render dari kamus, jadi ganti bahasa/gaya langsung
   * ikut tanpa menyimpan teks jadi.
   */
  const [komentar, setKomentar] = useState(null);
  const preferensiKomentator = gunakanPreferensiKomentator();
  const [komputer, setKomputer] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [terpecahkan, setTerpecahkan] = useState(bacaTerpecahkan);

  const [tanda, setTanda] = useState({ panah: [], petak: {} });

  const [posisiTersimpan, setPosisiTersimpan] = useState(bacaPosisi);
  const [nomorSoal, setNomorSoal] = useState("");
  const [galatNomor, setGalatNomor] = useState(null);
  const [setBidak, setSetBidak] = useState(bacaSetBidak);
  const [warnaPapan, setWarnaPapan] = useState(bacaWarnaPapan);
  const [otomatis, setOtomatis] = useState(bacaOtomatis);
  const [bukaPengaturan, setBukaPengaturan] = useState(false);

  // Suara papan (MP3 di public/SoundChess) — sakelarnya dibagi dengan
  // halaman Papan Interaktif lewat localStorage.
  const {
    nyala: suaraNyala,
    setNyala: setSuaraNyala,
    mainkan: bunyikan,
    mainkanLangkah: bunyikanLangkah,
  } = gunakanSuara();

  // Sedang menyeret bidak (klik kiri tahan). Klik kanan membatalkan.
  const [sedangSeret, setSedangSeret] = useState(false);
  const abaikanKlikRef = useRef(false);

  // Bidak sampai di baris terakhir → pemain wajib memilih bidak promosi.
  const [promosi, setPromosi] = useState(null); // { from, to, warna }

  const timerSalah = useRef(null);
  const timerOtomatis = useRef(null);

  // Analisis Stockfish (opsional) — mengikuti posisi teka-teki saat ini.
  const {
    engineNyala,
    statusEngine,
    kecepatanEngine,
    setKecepatanEngine,
    hasilEngine,
    permainanSelesai,
    panahMesin,
    tampilPanahMesin,
    setTampilPanahMesin,
    nyalakanEngine,
    matikanEngine,
  } = gunakanEngineCatur(fen);

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
  const [, paksaHitungUlang] = useState(0);
  useEffect(() => {
    let aktif = true;
    cariNamaPembukaan()
      .then((cari) => {
        if (aktif && typeof cari === "function") {
          bukuSiap.current = cari;
          paksaHitungUlang((n) => n + 1);
        }
      })
      .catch(() => {});
    return () => {
      aktif = false;
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

    let langkah = null;
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
    let namaBuku = null;
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
    let pindah = null;
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

  const soal = useMemo(() => {
    if (!semuaSoal) return null;
    let hasil = semuaSoal;
    if (filterTipe !== "semua") hasil = hasil.filter((m) => m.type === filterTipe);
    if (filterLevel !== "semua")
      hasil = hasil.filter((m) => PITA_LEVEL[filterLevel](m.rating ?? 0));
    if (filterTema !== "semua")
      hasil = hasil.filter((m) => (m.tema || "").split(" ").includes(filterTema));
    if (filterGiliran !== "semua") hasil = hasil.filter((m) => m.first === filterGiliran);
    return hasil;
  }, [semuaSoal, filterTipe, filterLevel, filterTema, filterGiliran]);

  const masalah = soal?.[indeks];
  const langkahPenuh = masalah ? masalah.moves.split(";") : [];
  const posisiLangkah = Math.max(0, langkahPenuh.length - sisa.length);

  const simpanPosisi = useCallback((id) => {
    try {
      localStorage.setItem(KUNCI_POSISI, String(id));
    } catch {}
    setPosisiTersimpan(id);
  }, []);

  useEffect(() => {
    let aktif = true;
    fetch(`${import.meta.env.BASE_URL}data/teka-teki.json`)
      .then((respon) => {
        if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
        return respon.json();
      })
      .then((data) => {
        if (!aktif) return;
        const daftarMentah = data.problems || [];
        if (!daftarMentah.length) throw new Error("data kosong");
        const daftar = daftarMentah.map((item) =>
          item?.pembukaan
            ? { ...item, pembukaan: standarkanNamaPembukaan(item.pembukaan) }
            : item
        );
        const idParam = Number(params.get("id"));
        let awal;
        if (idParam >= 1 && idParam <= daftar.length) {
          awal = idParam - 1;
        } else {
          const tersimpan = bacaPosisi();
          awal =
            tersimpan >= 1 && tersimpan <= daftar.length
              ? tersimpan - 1
              : Math.floor(Math.random() * daftar.length);
        }
        setSemuaSoal(daftar);
        setIndeks(awal);
        terapkanSoal(daftar[awal]);
        setParams({ id: String(daftar[awal].problemid) }, { replace: true });
        simpanPosisi(daftar[awal].problemid);
      })
      .catch(() => {
        if (aktif) setGagal(true);
      });
    return () => {
      aktif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!soal?.length) return;
    const safeIdx = Math.min(indeks, soal.length - 1);
    if (safeIdx !== indeks) {
      setIndeks(safeIdx);
    }
    terapkanSoal(soal[safeIdx]);
    setParams({ id: String(soal[safeIdx].problemid) }, { replace: true });
    simpanPosisi(soal[safeIdx].problemid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTipe, filterLevel, filterTema, filterGiliran]);

  useEffect(() => {
    document.title = `${t("tekaTeki.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  useEffect(() => {
    if (!fen) return;
    // Jangan tampilkan hasil atau status gagal dari posisi sebelumnya.
    setSyzygy(null);
    setSyzygyGagal(false);
    let aktif = true;
    const timer = window.setTimeout(() => {
      fetch(
        `https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`
      )
        .then((respon) => {
          if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
          return respon.json();
        })
        .then((data) => {
          if (aktif) {
            setSyzygy(data);
            setSyzygyGagal(false);
          }
        })
        .catch(() => {
          if (aktif) {
            setSyzygy(null);
            setSyzygyGagal(true);
          }
        });
    }, 300);
    return () => {
      aktif = false;
      window.clearTimeout(timer);
    };
  }, [fen]);

  // Pesan salah otomatis hilang setelah 3 detik.
  useEffect(() => {
    if (pesan?.jenis !== "salah") return;
    const timer = window.setTimeout(() => setPesan(null), 3000);
    return () => window.clearTimeout(timer);
  }, [pesan]);

  useEffect(
    () => () => {
      window.clearTimeout(timerSalah.current);
      window.clearTimeout(timerOtomatis.current);
    },
    []
  );

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_SET_BIDAK, setBidak);
    } catch {}
  }, [setBidak]);

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_WARNA_PAPAN, warnaPapan);
    } catch {}
  }, [warnaPapan]);

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_OTOMATIS, otomatis ? "1" : "0");
    } catch {}
  }, [otomatis]);

  const terapkanSoal = useCallback((m) => {
    setFen(m.fen);
    setSisa(m.moves.split(";"));
    setJalurFen([m.fen]);
    setOrientasi(m.first === "Black to Move" ? "b" : "w");
    setTerpilih(null);
    setSasaran([]);
    setPetunjuk(null);
    setKesalahan(null);
    setLangkahAkhir(null);
    setPesan(null);
    setKomputer(false);
    setSelesai(false);
    setTanda({ panah: [], petak: {} });
    setSedangSeret(false);
    setPromosi(null);
    setSyzygy(null);
    setSyzygyGagal(false);
    setKomentar({ tahap: "mulai", fakta: null, fen: m.fen });
  }, []);

  const pindahSoal = useCallback(
    (indeksBaru) => {
      if (!soal || !soal.length) return;
      const total = soal.length;
      const idx = ((indeksBaru % total) + total) % total;
      const m = soal[idx];
      // Timer dari soal sebelumnya tidak boleh menimpa navigasi manual.
      window.clearTimeout(timerOtomatis.current);
      setIndeks(idx);
      terapkanSoal(m);
      setParams({ id: String(m.problemid) }, { replace: true });
      simpanPosisi(m.problemid);
      bunyikan(SUARA.mulai);
    },
    [soal, terapkanSoal, setParams, simpanPosisi, bunyikan]
  );

  const pilihAcak = () =>
    pindahSoal(Math.floor(Math.random() * (soal?.length || 1)));

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
    // Klik sisa setelah drag-drop atau klik-kanan-batal tidak boleh jadi langkah.
    if (abaikanKlikRef.current) {
      abaikanKlikRef.current = false;
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
    let butuhPromosi = false;
    let warnaPromosi = "w";
    try {
      const papan = new Chess(fen);
      const bidak = papan.get(from);
      if (
        bidak &&
        bidak.type === "p" &&
        (to.endsWith("8") || to.endsWith("1"))
      ) {
        butuhPromosi = true;
        warnaPromosi = bidak.color;
      }
    } catch {}

    // Jangan buka dialog promosi untuk drop yang tidak legal.
    let langkahLegal = false;
    try {
      langkahLegal = new Chess(fen)
        .moves({ square: from, verbose: true })
        .some((langkah) => langkah.to === to);
    } catch {}

    if (butuhPromosi && langkahLegal && !promo) {
      setPromosi({ from, to, warna: warnaPromosi });
      setTerpilih(null);
      setSasaran([]);
      return;
    }

    let lanjut = null;

    if (sisa.length === 1) {
      try {
        const g = terapkan(fen, { from, to, promo });
        if (g.isCheckmate()) lanjut = g;
      } catch {}
    } else if (
      from === diharapkan.from &&
      to === diharapkan.to &&
      // Untuk promosi di tengah varian, bidak harus sama dengan solusi.
      (!diharapkan.promo || promo === diharapkan.promo)
    ) {
      try {
        lanjut = terapkan(fen, { from, to, promo: diharapkan.promo });
      } catch {}
    }

    if (!lanjut) {
      window.clearTimeout(timerSalah.current);
      // Langkah tidak legal berbunyi lain dari jawaban keliru, supaya pemain
      // tahu bedanya "tidak boleh" dan "boleh tapi bukan solusinya".
      bunyikan(langkahLegal ? SUARA.tekaTekiSalah : SUARA.ilegal);
      setPesan({ jenis: "salah", teks: t("tekaTeki.salah") });
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
      setPesan({ jenis: "selesai", teks: t("tekaTeki.terpecahkan") });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promosi]);

  useEffect(() => {
    if (!bukaPengaturan) return;
    function saatEscape(e) {
      if (e.key === "Escape") setBukaPengaturan(false);
    }
    window.addEventListener("keydown", saatEscape);
    return () => window.removeEventListener("keydown", saatEscape);
  }, [bukaPengaturan]);

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
    if (!sisa.length || selesai) return;
    const d = parseLangkah(sisa[0]);
    setPetunjuk({ from: d.from, to: d.to });
    let bidak = null;
    try {
      bidak = new Chess(fen).get(d.from)?.type || null;
    } catch {}
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
    if (selesai) {
      // Mode review setelah cekmat: reset papan tapi jangan hapus status selesai
      setFen(masalah.fen);
      setSisa(masalah.moves.split(";"));
      setJalurFen([masalah.fen]);
      setOrientasi(masalah.first === "Black to Move" ? "b" : "w");
      setTerpilih(null);
      setSasaran([]);
      setPetunjuk(null);
      setKesalahan(null);
      setLangkahAkhir(null);
      setKomputer(false);
      setTanda({ panah: [], petak: {} });
      setSedangSeret(false);
      setPromosi(null);
      setKomentar({ tahap: "mulai", fakta: null, fen: masalah.fen });
      // pesan dibiarkan hilang, tapi selesai tetap true → sudahPecah tetap tampil
    } else {
      terapkanSoal(masalah);
    }
  }

  /** < — mundur satu langkah. */
  function mundurLangkah() {
    if (!langkahPenuh.length || komputer || promosi) return;
    const posisi = Math.max(0, langkahPenuh.length - sisa.length);
    if (posisi <= 0) return;
    const baru = posisi - 1;
    // Bunyi langkah yang sedang dikembalikan (mode review) — persis seperti
    // Analisa: makan/rokade/skak/langkah.
    try {
      const d = parseLangkah(langkahPenuh[baru]);
      const g = terapkan(jalurFen[baru], d);
      bunyikanLangkah(g.history({ verbose: true }).slice(-1)[0], g);
    } catch {}
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
      setJalurFen((l) => [...l.slice(0, posisi), fenBaru]);
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
    } catch {}
  }

  /** >| — maju sampai posisi akhir solusi.
   *  Sama seperti maju, hanya aktif setelah cekmat.
   */
  function keAkhirLangkah() {
    if (!langkahPenuh.length || komputer || promosi) return;
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
    setJalurFen((l) => [...l.slice(0, posisi), ...fens]);
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
    blokir: !!promosi || !!bukaPengaturan,
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
      try {
        localStorage.setItem(KUNCI_SELESAI, JSON.stringify([...baru]));
      } catch {}
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
    pindahSoal(n - 1);
  }

  // Klik kanan saat drag → bidak kembali ke petak asal (perilaku chess.com).
  const batalkanSeret = useCallback(() => {
    abaikanKlikRef.current = true;
    setSedangSeret(false);
    setTerpilih(null);
    setSasaran([]);
  }, []);

  const mulaiSeret = useCallback(
    (petak) => {
      if (!masalah || komputer || selesai || !fen) return;
      const game = new Chess(fen);
      const bidak = game.get(petak);
      if (bidak && bidak.color === game.turn()) {
        abaikanKlikRef.current = false;
        setSedangSeret(true);
        pilihPetak(petak);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masalah, komputer, selesai, fen]
  );

  const selesaiSeret = useCallback(
    (from, to) => {
      setSedangSeret(false);
      if (!masalah || komputer || selesai || !fen) return;
      if (!to || from === to) {
        // Dijatuhkan di petak asal / di luar papan → tetap terpilih.
        return;
      }
      abaikanKlikRef.current = true;
      cobaLangkah(from, to);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masalah, komputer, selesai, fen, sisa, terpilih, sasaran]
  );

  function tandaPetak(petak, warna) {
    setTanda((lama) => {
      if (lama.petak[petak]) return { panah: [], petak: {} };
      return { ...lama, petak: { ...lama.petak, [petak]: warna } };
    });
  }

  function tandaPanah(from, to, warna) {
    setTanda((lama) => {
      const ada = lama.panah.some((p) => p.from === from && p.to === to);
      const panah = ada
        ? lama.panah.filter((p) => !(p.from === from && p.to === to))
        : [...lama.panah, { from, to, warna }];
      return { ...lama, panah };
    });
  }

  function hapusSemuaTanda() {
    setTanda({ panah: [], petak: {} });
  }

  const crumbs = [
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
    const evalEngine =
      engineNyala && hasilTertahan && komentar.fen === fen
        ? { matePutih: hasilTertahan.matePutih ?? null }
        : null;
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
      evalEngine,
      benih: masalah.problemid,
    });
  }, [komentar, masalah, langkahPenuh.length, sisa.length, sudahPecah, preferensiKomentator.gaya, engineNyala, hasilTertahan, fen]);
  const ikonKomentar =
    komentar?.tahap === "selesai"
      ? "best"
      : komentar?.tahap === "salah" && komentar.legal !== false
        ? "blunder"
        : komentar?.tahap === "benar" || komentar?.tahap === "tinjau"
          ? "best"
          : null;

  /** Label dwibahasa kategori Syzygy — mentah bila kategori di luar kamus. */
  function teksKategoriSyzygy(kat) {
    const hasil = t(`tekaTeki.syzygyKat.${kat}`);
    return hasil === `tekaTeki.syzygyKat.${kat}` ? kat : hasil;
  }

  // Papan re-usable untuk ditempatkan di wadah gelap.
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
  // background #403d39, bar putih #ffffff dengan transisi 1.5s,
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
            transition: "height 1.5s",
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
      {gagal ? (
        <div className="flex min-h-screen items-center justify-center bg-[#262421] px-6 py-10">
          <p className="max-w-md rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm leading-6 text-red-300">
            {t("tekaTeki.gagalMuat")}
          </p>
        </div>
      ) : !masalah ? (
        <div className="flex min-h-screen items-center justify-center bg-[#262421] px-6 py-10">
          {semuaSoal ? (
            <p className="max-w-md rounded-md border border-amber-900 bg-amber-950/40 px-4 py-3 text-sm leading-6 text-amber-300">
              {t("tekaTeki.tidakAdaSoal")}
            </p>
          ) : (
            <p className="animate-pulse text-sm text-gray-400">{t("tekaTeki.memuat")}</p>
          )}
        </div>
      ) : (
        <LayoutTekaTeki
              papan={papanWadah}
              barEvaluasi={barEvaluasiWadah}
              giliran={(fen && fen.split(" ")[1] === "b") ? "hitam" : "putih"}
              jumlahLangkah={langkahPenuh.length}
              syzygy={syzygy}
              fen={fen}
              teksKategoriSyzygy={teksKategoriSyzygy}
              PETA_KELAS_SYZYGY={PETA_KELAS_SYZYGY}
              syzygyJudul={t("tekaTeki.syzygyJudul")}
              syzygyDidukung={t("tekaTeki.syzygyDidukung")}
              syzygyDetail={t("tekaTeki.syzygyDetail")}
              syzygyCatatan={t("tekaTeki.syzygyCatatan")}
              teksSoal={masalah ? t("tekaTeki.soal", { n: indeks + 1, total: soal.length }) : ""}
              teksTingkat={masalah ? NAMA_LEVEL[bandLevel(masalah.rating ?? 0)] : ""}
              eloSoal={masalah ? masalah.rating : 1500}
              namaHitam={masalah ? masalah.pemainHitam : ""}
              eloHitam={masalah ? masalah.eloHitam : 0}
              namaPutih={masalah ? masalah.pemainPutih : ""}
              eloPutih={masalah ? masalah.eloPutih : 0}
              teksPembukaan={masalah ? masalah.pembukaan : ""}
              komentatorNyala={preferensiKomentator.nyala}
              teksTerpecahkan={t("tekaTeki.totalTerpecahkan", { n: terpecahkan.size })}
              teksCekmat={pesan?.jenis === "selesai" ? pesan.teks : ""}
              teksSudah={!pesan && sudahPecah ? t("tekaTeki.sudahTerpecahkan") : ""}
              daftarSet={DAFTAR_SET}
              nilaiSetBidak={setBidak}
              onGantiSetBidak={setSetBidak}
              pilihanWarnaPapan={PILIHAN_WARNA_PAPAN.map(([nilai, kunci]) => [nilai, t(kunci)])}
              nilaiWarnaPapan={warnaPapan}
              onGantiWarnaPapan={setWarnaPapan}
              nilaiSuara={suaraNyala}
              onGantiSuara={setSuaraNyala}
              onAcak={pilihAcak}
              onPertama={() => pindahSoal(0)}
              onLewati={() => pindahSoal(indeks + 1)}
              nilaiOtomatis={otomatis}
              onGantiOtomatis={(v) => setOtomatis(v)}
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
                        : "Mate in Three"
                )
              }
              nilaiTema={filterTema}
              onGantiTema={setFilterTema}
              opsiTema={DAFTAR_TEMA.map((g) => ({
                grup: t(g.grup),
                isi: g.isi.map(([nilai, kunci]) => [nilai, t(kunci)]),
              }))}
              nilaiGiliran={filterGiliran}
              onGantiGiliran={setFilterGiliran}
              nilaiNomorSoal={nomorSoal}
              onGantiNomorSoal={setNomorSoal}
              teksGalatNomor={galatNomor || ""}
              onBukaNomor={bukaNomor}
              bisaHint={!selesai && sisa.length > 0}
              onHint={tampilPetunjuk}
              teksSalah={pesan?.jenis === "salah" ? pesan.teks : ""}
              kartuKomentator={
                <KartuKomentator
                  segmen={segmenKomentar}
                  ikon={ikonKomentar}
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

const TAB = [
  {
    teks: "Hasil Karya Bintang Toba (2026)",
    tautan: "https://delta-polder-indonesia.github.io/BintangToba/index.html",
  },
];

/** Opsi tema cadangan bila tidak dikirim dari halaman utama. */
const OPSI_TEMA_BAWAAN = [
  { grup: "Skakmat", isi: [["backRankMate", "Back Rank Mate"], ["smotheredMate", "Smothered Mate"], ["promotion", "Promotion"]] },
  { grup: "Taktik", isi: [["sacrifice", "Sacrifice"], ["attraction", "Attraction"], ["deflection", "Deflection"], ["pin", "Pin"], ["fork", "Fork"], ["discoveredAttack", "Discovered Attack"]] },
  { grup: "Karakteristik", isi: [["endgame", "Endgame"], ["middlegame", "Middlegame"], ["opening", "Opening"]] },
];

function LayoutTekaTeki({ papan = null, barEvaluasi = null, onFlip = null, giliran = "putih", jumlahLangkah = 1, syzygy = null, fen = "", teksKategoriSyzygy = null, PETA_KELAS_SYZYGY = null, syzygyJudul = "", syzygyDidukung = "", syzygyDetail = "", syzygyCatatan = "", teksSoal = "", teksTingkat = "", teksTerpecahkan = "", teksCekmat = "", teksSudah = "", daftarSet = [], nilaiSetBidak = "merida", onGantiSetBidak = null, pilihanWarnaPapan = [], nilaiWarnaPapan = "green", onGantiWarnaPapan = null, nilaiSuara = true, onGantiSuara = null, onAcak = null, onLewati = null, nilaiOtomatis = false, onGantiOtomatis = null, engineNyala = false, onGantiEngine = null, tampilPanahMesin = true, onGantiPanahMesin = null, teksPanahMesin = "Panah saran engine", nilaiLevel = "semua", onGantiLevel = null, nilaiLangkah = "semua", onGantiLangkah = null, nilaiTema = "semua", opsiTema = [], onGantiTema = null, nilaiGiliran = "semua", onGantiGiliran = null, nilaiNomorSoal = "", onGantiNomorSoal = null, teksGalatNomor = "", onBukaNomor = null, bisaHint = false, onHint = null, teksSalah = "", kartuKomentator = null, kecepatanEngine = 800, opsiKecepatan = [], onGantiKecepatan = null, pvSanEngine = [], onMainkanSaran = null, onKeAwal = null, onMundur = null, onMaju = null, onKeAkhir = null, bisaMundur = false, bisaMaju = false, onPertama = null, eloSoal = 1500, namaHitam = "", eloHitam = 0, namaPutih = "", eloPutih = 0, teksPembukaan = "", komentatorNyala = false }) {
  const papanStatic = papanSampel();
  const file = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const daftarTema = opsiTema.length ? opsiTema : OPSI_TEMA_BAWAAN;

  // Pengaturan (gear): salinan perilaku dari halaman TekaTeki.
  const [bukaPengaturan, setBukaPengaturan] = useState(false);
  useEffect(() => {
    if (!bukaPengaturan) return;
    const saatEscape = (e) => {
      if (e.key === "Escape") setBukaPengaturan(false);
    };
    window.addEventListener("keydown", saatEscape);
    return () => window.removeEventListener("keydown", saatEscape);
  }, [bukaPengaturan]);

  return (
    <div className="flex flex-col min-h-screen lg:h-screen overflow-hidden bg-[#262421] text-gray-200 font-sans select-none">
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SIDEBAR KIRI                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[220px] bg-[#1e1c18] flex flex-col justify-between py-4 border-r border-b lg:border-b-0 border-[#312e2b] flex-shrink-0">
          <div>
            {/* Brand */}
            <div className="px-5 mb-6 flex items-center">
              <span className="font-bold text-[22px] tracking-tight text-white leading-none">
                Blunder<span className="text-[#81b64c]">Skuad</span>
              </span>
            </div>

            {/* Filter Controls */}
            <div className="px-5 pt-2 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="wadah-level" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Level</label>
                <select
                  id="wadah-level"
                  value={nilaiLevel}
                  onChange={(e) => onGantiLevel && onGantiLevel(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                >
                  <option value="semua">Semua Level</option>
                  <option value="1">Sangat Mudah</option>
                  <option value="2">Mudah</option>
                  <option value="3">Normal</option>
                  <option value="4">Sulit</option>
                  <option value="5">Sangat Sulit</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="wadah-langkah" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Langkah</label>
                <select
                  id="wadah-langkah"
                  value={nilaiLangkah}
                  onChange={(e) => onGantiLangkah && onGantiLangkah(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                >
                  <option value="semua">Semua</option>
                  <option value="1">1 Langkah</option>
                  <option value="2">2 Langkah</option>
                  <option value="3">3 Langkah</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="wadah-tema" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tema</label>
                <select
                  id="wadah-tema"
                  value={nilaiTema}
                  onChange={(e) => onGantiTema && onGantiTema(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                >
                  <option value="semua">Semua Tema</option>
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

              <div className="flex flex-col gap-1.5">
                <label htmlFor="wadah-giliran" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Giliran</label>
                <select
                  id="wadah-giliran"
                  value={nilaiGiliran}
                  onChange={(e) => onGantiGiliran && onGantiGiliran(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                >
                  <option value="semua">Semua Giliran</option>
                  <option value="White to Move">Hanya Putih</option>
                  <option value="Black to Move">Hanya Hitam</option>
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
                <p className="mb-1.5 px-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Soal</p>
                <input
                  type="number"
                  min={1}
                  value={nilaiNomorSoal}
                  onChange={(e) => onGantiNomorSoal && onGantiNomorSoal(e.target.value)}
                  placeholder="1–5486"
                  className="w-full bg-[#262421] text-sm text-gray-200 px-3 py-2.5 rounded-md border border-[#363431] focus:outline-none focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20 placeholder-gray-500"
                />
                {teksGalatNomor && (
                  <p role="alert" className="mt-1 px-1 text-[11px] font-medium text-red-400">
                    {teksGalatNomor}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-[#81b64c] hover:bg-[#a3d168] text-white font-bold py-2.5 px-3 rounded-md text-sm transition shadow-lg shadow-[#81b64c]/20 cursor-pointer"
              >
                Buka
              </button>
            </form>
            <button
              type="button"
              onClick={onHint}
              disabled={!bisaHint}
              title="Petunjuk"
              className="w-full bg-[#363431] hover:bg-[#45423e] text-white font-semibold py-2.5 px-3 rounded-md text-sm transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#363431]"
            >
              <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6" />
                <path d="M10 22h4" />
                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
              </svg>
              Hint
            </button>
            <div className="pt-3 flex justify-center text-gray-500 text-xs border-t border-[#312e2b]">
              <Link
                to="/program-kami/atribusi"
                className="flex items-center gap-1.5 hover:text-white transition"
              >
                <License size={14} class="fill-current" />
                Lisensi & Atribusi
              </Link>
            </div>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* AREA UTAMA: PAPAN + BAR EVALUASI                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        <main className="flex-1 flex items-stretch justify-center p-6 bg-[#262421] min-w-0 overflow-hidden">
          <div className="flex flex-row items-stretch gap-3 w-full max-w-[720px] lg:max-w-[calc(100vh_-_72px)] lg:translate-x-4 min-h-0">

            {/* Kolom kiri setinggi panel: profil atas → papan → profil bawah */}
            <div className="flex-1 flex min-h-0 min-w-0 flex-col justify-between">

              {/* ─── PROFIL PEMAIN HITAM (ATAS) ─── */}
              <div className="flex flex-row justify-between items-center pl-[44px] pr-1">
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
                        <span className="text-sm font-bold text-[#fffaec] truncate">Hitam</span>
                      )}
                      {eloHitam > 0 && (
                        <span className="text-xs text-gray-500 font-medium">({eloHitam})</span>
                      )}
                    </div>
                    <div className="flex flex-row items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-gray-400 font-medium truncate">
                        Skak dalam {jumlahLangkah} langkah
                      </span>
                    </div>
                  </div>
                </div>
                {/* Level soal: label di samping kiri kotak */}
                <div className="flex flex-row items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Level Soal</span>
                  <div className="flex text-nowrap justify-center items-center h-10 min-w-[100px] px-3 rounded-md bg-[#1e1d1c] text-sm font-bold shadow-inner border border-[#312e2b]">
                    {teksTingkat ? (
                      <span className="text-[#fffaec] truncate">{teksTingkat}</span>
                    ) : (
                      <span className="text-[#999]">Hitam</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── TENGAH: BAR EVALUASI + PAPAN (mengisi sisa tinggi) ─── */}
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
              <div className="flex w-full flex-row items-stretch gap-2">
                {/* Bar Evaluasi */}
                {barEvaluasi ? (
                  <div className="self-stretch flex items-center justify-center">
                    {barEvaluasi}
                  </div>
                ) : (
                  <div className="w-[30px] flex-shrink-0 rounded-md overflow-hidden relative bg-[#ffffff] shadow-inner">
                    {/* Bagian putih (atas) */}
                    <div className="absolute top-0 left-0 right-0 bg-[#ffffff] transition-all duration-500" style={{ height: "48%" }}>
                      <div className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-gray-600">
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
                <div className="flex-1 aspect-square shadow-2xl rounded-md overflow-hidden relative">
                  {papan ? (
                    papan
                  ) : (
                    <div className="grid grid-cols-8 grid-rows-8 relative h-full w-full">
                      {papanStatic.map((row, r) =>
                        row.map((bidak, c) => {
                          const terang = (r + c) % 2 === 0;
                          // Highlight last move squares
                          const isLastMove =
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
              <div className="flex flex-row justify-between items-center pl-[44px] pr-1">
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
                        <span className="text-sm font-bold text-[#fffaec] truncate">Putih</span>
                      )}
                      {eloPutih > 0 && (
                        <span className="text-xs text-gray-500 font-medium">({eloPutih})</span>
                      )}
                    </div>
                    <div className="flex flex-row items-center gap-1.5 mt-0.5">
                      {teksTerpecahkan && (
                        <span className="text-[11px] font-bold text-gray-500">{teksTerpecahkan}</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Rating soal: label di samping kiri kotak */}
                <div className="flex flex-row items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Rating Soal</span>
                  <div className="flex text-nowrap justify-center items-center h-10 min-w-[100px] px-3 rounded-md bg-[#f0f0f0] text-[#1e1d1c] text-lg font-mono font-bold shadow border border-[#81b64c] ring-2 ring-[#81b64c]/40">
                    {eloSoal}
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom kanan: tombol kontrol papan (posisi asli di atas) */}
            <div className="flex flex-col items-center gap-2 pt-14">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBukaPengaturan((v) => !v)}
                  aria-expanded={bukaPengaturan}
                  className={`p-2 rounded-md transition ${
                    bukaPengaturan
                      ? "text-white bg-[#312e2b]"
                      : "text-gray-500 hover:text-white hover:bg-[#312e2b]"
                  }`}
                  aria-label="Pengaturan"
                  title="Pengaturan"
                >
                  <svg className="w-5 h-5" viewBox="0 0 512 512" fill="currentColor">
                    <path d="M502.325,307.303l-39.006-30.805c-6.215-4.908-9.665-12.429-9.668-20.348c0-0.084,0-0.168,0-0.252
                      c-0.014-7.936,3.44-15.478,9.667-20.396l39.007-30.806c8.933-7.055,12.093-19.185,7.737-29.701l-17.134-41.366
                      c-4.356-10.516-15.167-16.86-26.472-15.532l-49.366,5.8c-7.881,0.926-15.656-1.966-21.258-7.586
                      c-0.059-0.06-0.118-0.119-0.177-0.178c-5.597-5.602-8.476-13.36-7.552-21.225l5.799-49.363
                      c1.328-11.305-5.015-22.116-15.531-26.472L337.004,1.939c-10.516-4.356-22.646-1.196-29.701,7.736l-30.805,39.005
                      c-4.908,6.215-12.43,9.665-20.349,9.668c-0.084,0-0.168,0-0.252,0c-7.935,0.014-15.477-3.44-20.395-9.667L204.697,9.675
                      c-7.055-8.933-19.185-12.092-29.702-7.736L133.63,19.072c-10.516,4.356-16.86,15.167-15.532,26.473l5.799,49.366
                      c0.926,7.881-1.964,15.656-7.585,21.257c-0.059,0.059-0.118,0.118-0.178,0.178c-5.602,5.598-13.36,8.477-21.226,7.552
                      l-49.363-5.799c-11.305-1.328-22.116,5.015-26.472,15.531L1.939,174.996c-4.356,10.516-1.196,22.646,7.736,29.701l39.006,30.805
                      c6.215,4.908,9.665,12.429,9.668,20.348c0,0.084,0,0.167,0,0.251c0.014,7.935-3.44,15.477-9.667,20.395L9.675,307.303
                      c-8.933,7.055-12.092,19.185-7.736,29.701l17.134,41.365c4.356,10.516,15.168,16.86,26.472,15.532l49.366-5.799
                      c7.882-0.926,15.656,1.965,21.258,7.586c0.059,0.059,0.118,0.119,0.178,0.178c5.597,5.603,8.476,13.36,7.552,21.226l-5.799,49.364
                      c-1.328,11.305,5.015,22.116,15.532,26.472l41.366,17.134c10.516,4.356,22.646,1.196,29.701-7.736l30.804-39.005
                      c4.908-6.215,12.43-9.665,20.348-9.669c0.084,0,0.168,0,0.251,0c7.936-0.014,15.478,3.44,20.396,9.667l30.806,39.007
                      c7.055,8.933,19.185,12.093,29.701,7.736l41.366-17.134c10.516-4.356,16.86-15.168,15.532-26.472l-5.8-49.366
                      c-0.926-7.881,1.965-15.656,7.586-21.257c0.059-0.059,0.119-0.119,0.178-0.178c5.602-5.597,13.36-8.476,21.225-7.552l49.364,5.799
                      c11.305,1.328,22.117-5.015,26.472-15.531l17.134-41.365C514.418,326.488,511.258,314.358,502.325,307.303z M281.292,329.698
                      c-39.68,16.436-85.172-2.407-101.607-42.087c-16.436-39.68,2.407-85.171,42.087-101.608c39.68-16.436,85.172,2.407,101.608,42.088
                      C339.815,267.771,320.972,313.262,281.292,329.698z" />
                  </svg>
                </button>

                {bukaPengaturan && (
                  <>
                    <div
                      aria-hidden="true"
                      className="fixed inset-0 z-40"
                      onClick={() => setBukaPengaturan(false)}
                    />
                    <div
                      role="dialog"
                      aria-modal="false"
                      aria-label="Pengaturan"
                      className="absolute right-full top-0 z-50 mr-3 w-64 max-w-[90vw] rounded-lg border border-[#312e2b] bg-[#1e1c18] p-4 shadow-xl ring-1 ring-black/50"
                    >
                      <p className="mb-3 text-sm font-bold text-white">Pengaturan</p>
                      <div className="flex flex-col gap-3">
                        {daftarSet.length > 0 && onGantiSetBidak && (
                          <div className="flex items-center justify-between gap-3">
                            <label
                              htmlFor="sampel-pilih-set-bidak"
                              className="text-xs font-semibold text-gray-400"
                            >
                              Bidak
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
                              Suara papan
                            </span>
                            <input
                              type="checkbox"
                              checked={nilaiSuara}
                              onChange={(e) => onGantiSuara(e.target.checked)}
                              className="h-4 w-4 accent-[#81b64c]"
                            />
                          </label>
                        )}
                        {onGantiPanahMesin && (
                          <label className="flex cursor-pointer items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-gray-400">
                              {teksPanahMesin}
                            </span>
                            <input
                              type="checkbox"
                              checked={tampilPanahMesin}
                              onChange={(e) => onGantiPanahMesin(e.target.checked)}
                              aria-label={teksPanahMesin}
                              className="h-4 w-4 accent-[#81b64c]"
                            />
                          </label>
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
                              Warna papan
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
                  </>
                )}
              </div>

              {onGantiSuara && (
                <button
                  type="button"
                  onClick={() => {
                    // Bunyikan saat dinyalakan supaya terdengar contohnya.
                    if (!nilaiSuara) mainkanSuara(SUARA.tesSuara);
                    onGantiSuara(!nilaiSuara);
                  }}
                  aria-pressed={nilaiSuara}
                  className={`p-2 rounded-md transition ${
                    nilaiSuara
                      ? "text-gray-500 hover:text-white hover:bg-[#312e2b]"
                      : "text-[#b33430] hover:bg-[#312e2b]"
                  }`}
                  aria-label={nilaiSuara ? "Matikan suara papan" : "Hidupkan suara papan"}
                  title={nilaiSuara ? "Matikan suara papan" : "Hidupkan suara papan"}
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
                </button>
              )}

              <button
                type="button"
                onClick={onFlip}
                className="p-2 rounded-md text-gray-500 hover:text-white hover:bg-[#312e2b] transition"
                aria-label="Balik papan"
                title="Balik papan"
              >
                <svg className="w-5 h-5" viewBox="0 0 120 120" fill="currentColor">
                  <path d="M 21.475246,117.78677 H 73.154894 L 56.373294,98.524495 H 40.73752 V 35.922099 H 59.999794 L 31.106383,2.2131167 2.2129751,35.922099 H 21.475246 Z" />
                  <path d="m 98.524909,2.2132354 -51.679643,0 16.781593,19.2622766 15.635776,0 V 84.077908 H 60.00036 L 88.893772,117.78689 117.78718,84.077908 H 98.524909 Z" />
                </svg>
              </button>

            </div>
          </div>
        </main>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PANEL KANAN                                            */}
        {/* ═══════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[480px] h-full bg-[#211f1c] border-t lg:border-t-0 lg:border-l border-[#312e2b] flex flex-col flex-shrink-0 min-h-0">
          {/* Tabs */}
          <div className="flex-shrink-0 flex border-b border-[#312e2b] bg-[#1e1c18]">
            {TAB.map((tab) =>
              tab.tautan ? (
                <a
                  key={tab.teks}
                  href={tab.tautan}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={tab.teks}
                  className="flex-1 px-2 py-3.5 flex items-center justify-center gap-2 text-center text-xs font-bold uppercase tracking-wider transition border-b-2 border-[#81b64c] text-white bg-[#262421] hover:bg-[#2c2926] hover:underline cursor-pointer"
                >
                  {tab.teks}
                </a>
              ) : (
                <button
                  key={tab.teks}
                  type="button"
                  className="flex-1 py-3.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition border-b-2 border-[#81b64c] text-white bg-[#262421]"
                >
                  {tab.teks}
                </button>
              )
            )}
          </div>

          {/* Nomor soal + status (di bawah teks soal) */}
          {(teksSoal || teksCekmat || teksSudah || teksSalah) && (
            <div className="flex-shrink-0 px-4 py-2 border-b border-[#312e2b] bg-[#262421] flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
                {teksSoal && <span className="text-[13px] font-bold text-white">{teksSoal}</span>}
                {teksCekmat && <span className="text-[13px] font-bold text-gray-300">{teksCekmat}</span>}
                {teksSudah && <span className="text-xs font-semibold text-emerald-300">{teksSudah}</span>}
                {teksSalah && <span className="text-[13px] font-bold text-red-400">{teksSalah}</span>}
              </div>
            </div>
          )}

          {/* Baris: giliran */}
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-[#312e2b] bg-[#1e1c18] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider min-w-0">
              <div className={`h-3 w-3 rounded-sm flex-shrink-0 ${giliran === "putih" ? "bg-white border border-gray-400" : "bg-[#312e2b] border border-gray-600"}`}></div>
              <span className={giliran === "putih" ? "text-white" : "text-gray-500"}>{giliran === "putih" ? "Putih" : "Hitam"}</span>
              <span className="text-gray-600">melangkah</span>
            </div>
          </div>

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
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">Pembukaan</span>
              <span className="text-[11px] font-medium text-gray-300 truncate min-w-0" title={teksPembukaan}>{teksPembukaan}</span>
            </div>
          ) : null}

          {/* Syzygy — salinan kata-kata dari bagian atas TekaTeki, warna tema gelap */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{syzygyJudul}</span>
              <span className="text-[11px] text-gray-500">{syzygyDidukung}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span
                className={`inline-block text-xs font-semibold ${
                  syzygy && PETA_KELAS_SYZYGY
                    ? PETA_KELAS_SYZYGY[syzygy.category] || "text-gray-400"
                    : "text-gray-400"
                }`}
              >
                {syzygy && teksKategoriSyzygy ? teksKategoriSyzygy(syzygy.category) : "—"}
              </span>
              <span className="text-xs text-gray-400">DTZ: {syzygy ? syzygy.dtz ?? "-" : "-"}</span>
              <span className="text-xs text-gray-400">DTM: {syzygy ? syzygy.dtm ?? "-" : "-"}</span>
              {syzygy && (
                <a
                  href={`https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs font-medium text-sky-400 hover:text-sky-300 hover:underline"
                >
                  {syzygyDetail}
                </a>
              )}
            </div>

            {syzygy && Array.isArray(syzygy.moves) && syzygy.moves.length > 0 && (
              <ul className="divide-y divide-[#312e2b]">
                {syzygy.moves.map((m) => (
                  <li key={m.san} className="flex items-center justify-between gap-2 py-1.5">
                    <span className="font-mono text-xs font-semibold text-gray-300">
                      {m.san}
                    </span>
                    <span
                      className={`shrink-0 text-[10px] font-semibold ${
                        PETA_KELAS_SYZYGY && (PETA_KELAS_SYZYGY[m.category] || "text-gray-400")
                      }`}
                    >
                      {teksKategoriSyzygy ? teksKategoriSyzygy(m.category) : m.category}
                      {typeof m.dtz === "number" ? ` · DTZ ${m.dtz}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-[11px] leading-4 text-gray-500">{syzygyCatatan}</p>
          </div>

          {engineNyala && (
            <div className="flex-shrink-0 border-b border-[#312e2b] bg-[#1e1c18] px-3 py-2 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Kecepatan mesin</span>
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
                  Mainkan saran ({pvSanEngine[0]})
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
                title="Ke awal"
                aria-label="Ke awal"
                className="flex-1 py-2.5 flex justify-center items-center rounded text-gray-400 transition text-lg font-bold hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                ⏮
              </button>
              <button
                type="button"
                onClick={onMundur}
                disabled={!bisaMundur}
                title="Mundur satu langkah"
                aria-label="Mundur satu langkah"
                className="flex-1 py-2.5 flex justify-center items-center rounded text-gray-400 transition text-lg font-bold hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={onMaju}
                disabled={!bisaMaju}
                title="Maju satu langkah"
                aria-label="Maju satu langkah"
                className="flex-1 py-2.5 flex justify-center items-center rounded text-gray-400 transition text-lg font-bold hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                ▶
              </button>
              <button
                type="button"
                onClick={onKeAkhir}
                disabled={!bisaMaju}
                title="Ke akhir"
                aria-label="Ke akhir"
                className="flex-1 py-2.5 flex justify-center items-center rounded text-gray-400 transition text-lg font-bold hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
              >
                ⏭
              </button>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-gray-400">
              <button
                type="button"
                onClick={onPertama}
                title="Soal pertama (nomor 1)"
                aria-label="Soal pertama (nomor 1)"
                className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>New</span>
              </button>
              <button
                type="button"
                onClick={() => onGantiEngine && onGantiEngine()}
                aria-pressed={engineNyala}
                aria-label="Engine"
                title="Engine (analisis mesin)"
                className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] rounded-lg transition border border-[#312e2b] cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  {engineNyala ? (
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  ) : (
                    <path d="M8 5.5v13l11-6.5-11-6.5z" />
                  )}
                </svg>
                <span className={`text-xs font-semibold ${engineNyala ? "text-[#81b64c]" : "text-white"}`}>
                  Engine
                </span>
              </button>
              <button
                type="button"
                onClick={() => onGantiOtomatis && onGantiOtomatis(!nilaiOtomatis)}
                aria-pressed={nilaiOtomatis}
                aria-label={nilaiOtomatis ? "Pause" : "Play"}
                title="Lanjut otomatis"
                className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] rounded-lg transition border border-[#312e2b] cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  {nilaiOtomatis ? (
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  ) : (
                    <path d="M8 5.5v13l11-6.5-11-6.5z" />
                  )}
                </svg>
                <span className={`text-xs font-semibold ${nilaiOtomatis ? "text-[#81b64c]" : "text-white"}`}>
                  {nilaiOtomatis ? "Pause" : "Auto Next"}
                </span>
              </button>
              <button
                type="button"
                onClick={onAcak}
                title="Soal acak"
                aria-label="Soal acak"
                className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>Acak</span>
              </button>
              <button
                type="button"
                onClick={onLewati}
                title={teksCekmat ? "Next" : "Lewati"}
                aria-label={teksCekmat ? "Next" : "Lewati"}
                className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b] cursor-pointer"
              >
                <ArrowRightIcon className="w-5 h-5" />
                <span>{teksCekmat ? "Next" : "Lewati"}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
