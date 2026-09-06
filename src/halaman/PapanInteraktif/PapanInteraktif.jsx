import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Plus,
  RotateCw,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import License from "../Analisa/komponen/svg/license.jsx";
import Profile from "../Analisa/komponen/svg/profile.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece, DAFTAR_SET } from "../../components/chess/ChessPiece.jsx";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";
import { gunakanEngineCatur } from "../../lib/gunakanEngineCatur.js";
import PanelEngine from "../../components/PanelEngine.jsx";
import {
  ambilArtikelPembukaan,
  lihatArtikelTercache,
} from "../../lib/artikelWikipedia.js";
import {
  normalkanPohonPembukaan,
  standarkanNamaPembukaan,
} from "../../lib/namaPembukaan.js";
import { isForced } from "../Analisa/mesin/penilaian.js";
import { petakRajaPemenang, petakRajaTermat } from "../../lib/skakmat.js";
import { SUARA, gunakanSuara, mainkanSuara } from "../../lib/suara.js";
import KartuKomentator, {
  gunakanPreferensiKomentator,
} from "../../components/KartuKomentator.jsx";
import { faktaLangkah } from "../../lib/komentator.js";

const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Urutan pilihan bidak promosi (menteri, benteng, gajah, kuda). */
const PILIHAN_PROMOSI = ["q", "r", "b", "n"];
const KUCI_NAMA_PROMOSI = {
  q: "tekaTeki.promosiMenteri",
  r: "tekaTeki.promosiBenteng",
  b: "tekaTeki.promosiGajah",
  n: "tekaTeki.promosiKuda",
};

/** Tab panel kanan — urutan & label (ikon digambar lokal, tanpa pustaka ikon). */
const TAB_PANEL = [
  { id: "analisa", label: "Analisa" },
  { id: "books", label: "Books" },
  { id: "explorer", label: "Explorer" },
  { id: "games", label: "Games" },
];

/** Ikon kecil gaya stroke untuk tab panel kanan (mengikuti gaya icons.jsx). */
function IkonTab({ nama, className = "h-4 w-4" }) {
  const umum = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };
  if (nama === "analisa") {
    return (
      <svg {...umum}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    );
  }
  if (nama === "books") {
    return (
      <svg {...umum}>
        <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
        <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  if (nama === "explorer") {
    return (
      <svg {...umum}>
        <circle cx="12" cy="12" r="9" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" />
      </svg>
    );
  }
  return (
    <svg {...umum}>
      <line x1="6" y1="11" x2="10" y2="11" />
      <line x1="8" y1="9" x2="8" y2="13" />
      <line x1="15" y1="12" x2="15.01" y2="12" />
      <line x1="18" y1="10" x2="18.01" y2="10" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  );
}


/** Pilihan warna papan (nilai + kunci terjemahan), mengikuti opsi pengaturan. */
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

/* ------------------------------------------------- analisis Stockfish */
// Logika & panelnya berbagi pakai dengan halaman Teka-Teki:
// lihat src/lib/gunakanEngineCatur.js dan src/components/PanelEngine.jsx.


/** Replay deret SAN menjadi FEN (dipakai untuk undo & memuat jalur katalog). */
function fenDariLangkah(daftarSan) {
  const game = new Chess();
  for (const san of daftarSan) game.move(san);
  return game.fen();
}

/** Susun deret SAN menjadi teks PGN sederhana ("1. e4 e5 2. Nf3 …"). */
function susunPgn(daftarSan) {
  const bagian = [];
  for (let i = 0; i < daftarSan.length; i += 2) {
    const nomor = i / 2 + 1;
    const putih = daftarSan[i];
    const hitam = daftarSan[i + 1];
    bagian.push(`${nomor}. ${putih}${hitam ? ` ${hitam}` : ""}`);
  }
  return bagian.join(" ");
}

/** Kumpulkan katalog (nama + jalur terpendek) lewat DFS dari pohon pembukaan. */
function susunKatalog(pohon) {
  const hasil = [];
  (function telusur(node, jalur) {
    if (node.n) {
      for (const [eco, nama] of node.n) {
        hasil.push({ eco, nama, langkah: [...jalur] });
      }
    }
    for (const [san, anak] of Object.entries(node.c || {})) {
      jalur.push(san);
      telusur(anak, jalur);
      jalur.pop();
    }
  })(pohon, []);
  hasil.sort((a, b) => (a.eco === b.eco ? a.nama.localeCompare(b.nama) : a.eco.localeCompare(b.eco)));
  return hasil;
}

/** Pola langkah koordinat ("e2e4") — dipakai untuk membedakan jenis kunci pohon. */
const POLA_KOORDINAT = /^[a-h][1-8][a-h][1-8]$/;

/** Ambil statistik dari satu entri (null bila entri tidak punya statistik). */
function statDariEntri(entri) {
  if (typeof entri.games !== "number") return null;
  const angka = (v) => (typeof v === "number" ? v : null);
  return {
    games: entri.games,
    whiteWin: angka(entri.white_win_rate),
    blackWin: angka(entri.black_win_rate),
    draw: angka(entri.draw_rate),
    rating: angka(entri.avg_rating),
  };
}

/**
 * Ubah buku pembukaan berformat "daftar rata" (format Lichess, mis.
 * [{ eco, opening, moves: "e2e4 e7e5 g1f3 …" }, …]) menjadi pohon langkah
 * ber-key koordinat: node = { "n"?: [[eco, nama, stat], …], "c"?: {…} }.
 * Konversi ini murni penyusunan string sehingga cepat (tidak butuh chess.js).
 */
function pohonDariDaftar(daftar) {
  const akar = {};
  for (const entri of daftar) {
    const eco = entri.eco || entri.code || "?";
    const nama = standarkanNamaPembukaan(entri.opening || entri.name);
    const langkah = String(entri.moves || entri.uci || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!nama || !langkah.length) continue;
    const stat = statDariEntri(entri);
    let node = akar;
    for (const k of langkah) {
      if (!node.c) node.c = {};
      if (!node.c[k]) node.c[k] = {};
      node = node.c[k];
    }
    if (!node.n) node.n = [];
    const ada = node.n.find(([e, n]) => e === eco && n === nama);
    if (!ada) {
      node.n.push([eco, nama, stat]);
    } else if (!ada[2] && stat) {
      ada[2] = stat; // lengkapi statistik pada nama duplikat yang belum punya
    }
  }
  return akar;
}

/** Tebak kunci pohon: koordinat ("e2e4") atau SAN ("e4", "Nf3", …). */
function modeDariPohon(pohon) {
  const kunci = Object.keys((pohon && pohon.c) || {});
  if (!kunci.length) return "koordinat";
  return kunci.every((k) => POLA_KOORDINAT.test(k)) ? "koordinat" : "san";
}

/** Kunci pohon untuk satu pindahan: koordinat atau SAN, sesuai mode. */
function kuciDariPindahan(pindah, mode) {
  return mode === "koordinat" ? `${pindah.from}${pindah.to}` : pindah.san;
}

/** Ubah satu langkah koordinat menjadi SAN pada posisi `game` (lalu undo). */
function sanDiPosisi(game, koordinat) {
  try {
    const pindah = game.move({ from: koordinat.slice(0, 2), to: koordinat.slice(2, 4) });
    if (pindah) {
      game.undo();
      return pindah.san;
    }
  } catch {}
  return koordinat;
}

/** Replay deret koordinat menjadi { fen, san } (untuk memuat jalur katalog). */
function fenDanSanDariKoordinat(daftarKoordinat) {
  const game = new Chess();
  const san = [];
  for (const k of daftarKoordinat) {
    let pindah;
    try {
      pindah = game.move({ from: k.slice(0, 2), to: k.slice(2, 4) });
    } catch {
      pindah = null;
    }
    if (!pindah) return null;
    san.push(pindah.san);
  }
  return { fen: game.fen(), san };
}

/** Format angka sesuai bahasa aktif (22.326 → "22.326" id / "22,326" en). */
function formatAngka(nilai, bahasa) {
  return new Intl.NumberFormat(bahasa === "en" ? "en-US" : "id-ID").format(nilai);
}

/** Ubah pecahan (0..1) menjadi persen berdesimal (0.527 → "52,7"/"52.7"). */
function statTurunan(node) {
  if (!node) return null;
  const milikNode = (node.n || []).map(([, , stat]) => stat).find((stat) => stat?.games);
  if (milikNode) return milikNode;
  for (const anak of Object.values(node.c || {})) {
    const stat = statTurunan(anak);
    if (stat) return stat;
  }
  return null;
}

function formatPersen(pecahan, bahasa) {
  return new Intl.NumberFormat(bahasa === "en" ? "en-US" : "id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(pecahan * 100);
}

function Kerangka() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-40 rounded-lg bg-[#312e2b]" />
      <div className="mt-4 h-4 w-56 rounded bg-[#312e2b]" />
    </div>
  );
}

export default function PapanInteraktif() {
  const { t, bahasa } = useI18n();

  const [pohon, setPohon] = useState(null);
  const [mode, setMode] = useState("koordinat"); // "koordinat" | "san"
  const [gagal, setGagal] = useState(false);

  const [fen, setFen] = useState(FEN_AWAL);
  const [riwayat, setRiwayat] = useState([]); // SAN, untuk PGN
  const [riwayatLengkap, setRiwayatLengkap] = useState([]); // semua langkah untuk navigasi forward
  const [jalur, setJalur] = useState([]); // kunci pohon, untuk menelusuri pembukaan
  const [orientasi, setOrientasi] = useState("w");

  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [kesalahan, setKesalahan] = useState(null);
  const [promosi, setPromosi] = useState(null); // { from, to, warna }

  const [tanda, setTanda] = useState({ panah: [], petak: {} });
  const [setBidak, setSetBidak] = useState("alpha");
  const [warnaPapan, setWarnaPapan] = useState("metal");

  const [pgnTersalin, setPgnTersalin] = useState(false);
  const [fenTersalin, setFenTersalin] = useState(false);
  const [pilihan, setPilihan] = useState(-1); // id pembukaan terpilih di dropdown
  const [tampilSetting, setTampilSetting] = useState(false);
  // Tab aktif panel kanan: "analisa" | "books" | "explorer" | "games".
  const [tabPanel, setTabPanel] = useState("analisa");
  const [tampilPgn, setTampilPgn] = useState(false); // dialog Review (input PGN/FEN)

  // Artikel Wikibooks tentang pembukaan aktif — berganti mengikuti langkah.
  const [artikelPembukaan, setArtikelPembukaan] = useState(null);
  const batalArtikelRef = useRef(null);

  // Analisis Stockfish (opsional, dimuat saat pertama dinyalakan).
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
  // agar bar evaluasi tidak hilang dan papan tidak goyang.
  const [hasilTertahan, setHasilTertahan] = useState(null);
  useEffect(() => {
    if (hasilEngine) setHasilTertahan(hasilEngine);
  }, [hasilEngine]);
  useEffect(() => {
    if (!engineNyala) setHasilTertahan(null);
  }, [engineNyala]);

  // Suara papan (berkas MP3 di public/SoundChess) — sakelarnya dibagi dengan
  // halaman Teka-Teki lewat localStorage.
  const {
    nyala: suaraNyala,
    setNyala: setSuaraNyala,
    mainkan: bunyikan,
    mainkanLangkah: bunyikanLangkah,
  } = gunakanSuara();

  const abaikanKlikRef = useRef(false);
  const timerSalah = useRef(null);
  const timerSalin = useRef(null);

  // Snapshot hasil engine per-FEN: tiap posisi yang dianalisis menyimpan
  // nilai eval paling akurat-nya, sehingga langkah yang baru dimainkan bisa
  // dinilai (best/blunder/…) dengan membandingkan posisi SEBELUM langkah
  // (eval & saran best engine sudah ada) dengan posisi SESUDAHNYA — tidak
  // menunggu eval posisi baru yang belum tentu siap saat ikon dihitung.
  const snapshotEvalRef = useRef(new Map());
  useEffect(() => {
    if (!engineNyala || !hasilEngine || !fen) return;
    const isiLama = snapshotEvalRef.current.get(fen);
    // bestUci hanya ada pada hasil final → selalu simpan; hasil sementara
    // disimpan bila belum ada snapshot (supaya ikon cepat muncul saat
    // navigasi undo/redo), lalu ditimpa hasil final yang lebih akurat.
    if (hasilEngine.bestUci || !isiLama) {
      snapshotEvalRef.current.set(fen, {
        cpPutih: hasilEngine.cpPutih,
        matePutih: hasilEngine.matePutih,
        bestSan: hasilEngine.pvSan?.[0] || null,
      });
    }
  }, [engineNyala, hasilEngine, fen]);

  /* ----------------------------------------------------- muat data pohon */
  useEffect(() => {
    let aktif = true;
    fetch(`${import.meta.env.BASE_URL}data/buku-pembukaan.json`)
      .then((respon) => {
        if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
        return respon.json();
      })
      .then((data) => {
        if (!aktif) return;
        // Daftar rata (format Lichess) → bangun pohon koordinat di tempat.
        // Objek pohon → pakai langsung (dukung kunci SAN lama maupun koordinat).
        if (Array.isArray(data)) {
          setPohon(pohonDariDaftar(data));
          setMode("koordinat");
        } else {
          const pohonBaku = normalkanPohonPembukaan(data);
          setPohon(pohonBaku);
          setMode(modeDariPohon(pohonBaku));
        }
      })
      .catch(() => {
        if (aktif) setGagal(true);
      });
    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => {
    document.title = `${t("papan.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  useEffect(
    () => () => {
      window.clearTimeout(timerSalah.current);
      window.clearTimeout(timerSalin.current);
    },
    []
  );

  /* ------------------------------------------------ pembukaan saat ini */
  const infoPembukaan = useMemo(() => {
    if (!pohon) return { nama: null, saran: [], cocok: false };
    let node = pohon;
    let namaTerdalam = null;
    let cocok = true;
    for (const k of jalur) {
      if (!node.c || !node.c[k]) {
        cocok = false;
        break;
      }
      node = node.c[k];
      if (node.n && node.n.length) namaTerdalam = node.n;
    }
    let saran = [];
    if (cocok) {
      const game = new Chess(fen);
      saran = Object.entries(node.c || {})
        .slice(0, 8)
        .map(([k, anak]) => ({
          k,
          san: mode === "koordinat" ? sanDiPosisi(game, k) : k,
          nama: anak.n && anak.n.length ? anak.n[0][1] : null,
          stat: statTurunan(anak),
        }));
    }
    return { nama: namaTerdalam, saran, cocok };
  }, [pohon, jalur, fen, mode]);

  /** Statistik posisi saat ini (diambil dari nama yang punya data statistik). */
  const statTampil = useMemo(() => {
    const tuple = infoPembukaan.nama
      ? infoPembukaan.nama.find(([, , s]) => s && typeof s.games === "number") ||
        null
      : null;
    const s = tuple ? tuple[2] : null;
    if (!s) return null;
    const pecahan = (v) => (typeof v === "number" ? v : null);
    return {
      games: s.games,
      rating: pecahan(s.rating),
      putih: pecahan(s.whiteWin),
      seri: pecahan(s.draw),
      hitam: pecahan(s.blackWin),
    };
  }, [infoPembukaan.nama]);

  const katalog = useMemo(() => (pohon ? susunKatalog(pohon) : []), [pohon]);

  // Bidak yang ditangkap tiap sisi (ikon di baris pemain), dihitung dari riwayat.
  const tangkapan = useMemo(() => susunTangkapan(riwayat), [riwayat]);

  /** Daftar untuk dropdown: satu wakil per nama (jalur terpendek), dikelompokkan
      menurut "keluarga" pembukaan (teks sebelum tanda titik dua, mis.
      "Caro-Kann Defense" → semua varian Caro-Kann). */
  const daftarPilih = useMemo(() => {
    const wakil = new Map();
    for (const k of katalog) {
      const ada = wakil.get(k.nama);
      if (!ada || k.langkah.length < ada.langkah.length) wakil.set(k.nama, k);
    }
    const kelompok = new Map();
    for (const k of wakil.values()) {
      const keluarga = (k.nama.split(":")[0] || k.nama).trim();
      if (!kelompok.has(keluarga)) kelompok.set(keluarga, []);
      kelompok.get(keluarga).push(k);
    }
    const urut = [...kelompok.entries()]
      .map(([nama, daftar]) => ({
        nama,
        daftar: daftar.sort((a, b) => a.nama.localeCompare(b.nama)),
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama));

    const rata = [];
    const idDari = new Map();
    for (const g of urut) {
      for (const entri of g.daftar) {
        const id = rata.length;
        idDari.set(entri, id);
        rata.push({ id, entri });
      }
    }
    return { kelompok: urut, rata, idDari };
  }, [katalog]);

  /* ------------------------------------------- artikel Wikibooks pembukaan */
  // Nama pembukaan atau jalur langkah berubah → referensi di bawahnya ikut
  // berganti. Hasil tersimpan di cache sesi (lihat src/lib/artikelWikipedia.js)
  // sehingga bolak-balik langkah tidak memukul API berulang kali.
  const namaArtikel = infoPembukaan.nama ? infoPembukaan.nama[0][1] : null;
  // Artikel hanya dimuat saat tab Explorer terbuka — jika tab lain aktif,
  // permintaan dibatalkan dan hasil lama dibersihkan agar tidak memakai
  // jaringan terus-menerus saat tidak dilihat.
  useEffect(() => {
    batalArtikelRef.current?.abort();
    if (tabPanel !== "explorer" || !namaArtikel) {
      setArtikelPembukaan(null);
      return undefined;
    }

    const konteksArtikel = { nama: namaArtikel, langkahSan: riwayat };
    const identitasArtikel = `${namaArtikel}|${riwayat.join(" ")}`;
    const tercache = lihatArtikelTercache(konteksArtikel, bahasa);
    if (tercache !== undefined) {
      setArtikelPembukaan({
        status: tercache ? "siap" : "kosong",
        data: tercache || null,
        untuk: identitasArtikel,
      });
    } else {
      setArtikelPembukaan({ status: "memuat", data: null, untuk: identitasArtikel });
    }

    // Tunda sebentar agar deretan langkah cepat tidak memicu permintaan
    // beruntun ke API Wikibooks.
    const pengaturWaktu = window.setTimeout(() => {
      const kontrol = new AbortController();
      batalArtikelRef.current = kontrol;
      ambilArtikelPembukaan(konteksArtikel, bahasa, kontrol.signal)
        .then((hasil) =>
          setArtikelPembukaan((kini) =>
            kini && kini.untuk === identitasArtikel
              ? {
                  status: hasil ? "siap" : "kosong",
                  data: hasil || null,
                  untuk: identitasArtikel,
                }
              : kini
          )
        )
        .catch(() =>
          setArtikelPembukaan((kini) =>
            kini && kini.untuk === identitasArtikel
              ? { status: "gagal", data: null, untuk: identitasArtikel }
              : kini
          )
        );
    }, 300);
    return () => {
      window.clearTimeout(pengaturWaktu);
      batalArtikelRef.current?.abort();
    };
  }, [namaArtikel, bahasa, riwayat, tabPanel]);

  /* ------------------------------------------------------ gerakan bidak */
  function pilihPetak(petak) {
    if (!fen || promosi) return;
    const game = new Chess(fen);
    const bidak = game.get(petak);
    if (bidak && bidak.color === game.turn()) {
      const tujuan = game.moves({ square: petak, verbose: true }).map((m) => m.to);
      setTerpilih(petak);
      setSasaran(tujuan);
    } else {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  function klikPetak(petak) {
    if (abaikanKlikRef.current) {
      abaikanKlikRef.current = false;
      return;
    }
    // Bersihkan panah/tanda lebih dulu — termasuk saat mengklik bidak.
    if (tanda.panah.length > 0 || Object.keys(tanda.petak).length > 0) {
      setTanda({ panah: [], petak: {} });
    }
    if (!fen || promosi) return;
    if (terpilih && sasaran.includes(petak)) {
      cobaLangkah(terpilih, petak);
      return;
    }
    pilihPetak(petak);
  }

  function cobaLangkah(from, to, promo) {
    const game = new Chess(fen);

    // Bidak menuju baris terakhir → wajib promosi.
    let butuhPromosi = false;
    let warnaPromosi = "w";
    try {
      const bidak = game.get(from);
      if (bidak && bidak.type === "p" && (to.endsWith("8") || to.endsWith("1"))) {
        butuhPromosi = true;
        warnaPromosi = bidak.color;
      }
    } catch {}

    if (butuhPromosi && !promo) {
      setPromosi({ from, to, warna: warnaPromosi });
      setTerpilih(null);
      setSasaran([]);
      return;
    }

    let pindah;
    try {
      pindah = game.move({ from, to, promotion: promo });
    } catch {
      pindah = null;
    }

    if (!pindah) {
      window.clearTimeout(timerSalah.current);
      bunyikan(SUARA.ilegal);
      setKesalahan({ from, to });
      setTerpilih(null);
      setSasaran([]);
      timerSalah.current = window.setTimeout(() => setKesalahan(null), 700);
      return;
    }

    bunyikanLangkah(pindah, game);
    setFen(game.fen());
    setRiwayat((lama) => [...lama, pindah.san]);
    setRiwayatLengkap((lama) => [...lama, pindah.san]);
    setJalur((lama) => [...lama, kuciDariPindahan(pindah, mode)]);
    setLangkahAkhir({ from, to });
    setTerpilih(null);
    setSasaran([]);
    setKesalahan(null);
    setPromosi(null);
  }

  /** Mainkan satu SAN (dipakai chip saran) — menangani promosi otomatis. */
  function mainkanSan(san) {
    const game = new Chess(fen);
    let pindah;
    try {
      pindah = game.move(san);
    } catch {
      return;
    }
    bunyikanLangkah(pindah, game);
    setFen(game.fen());
    setRiwayat((lama) => [...lama, pindah.san]);
    setRiwayatLengkap((lama) => [...lama, pindah.san]);
    setJalur((lama) => [...lama, kuciDariPindahan(pindah, mode)]);
    setLangkahAkhir({ from: pindah.from, to: pindah.to });
    setTerpilih(null);
    setSasaran([]);
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
  }, [promosi]);

  useEffect(() => {
    if (!tampilSetting) return;
    function saatEscape(e) {
      if (e.key === "Escape") setTampilSetting(false);
    }
    window.addEventListener("keydown", saatEscape);
    return () => window.removeEventListener("keydown", saatEscape);
  }, [tampilSetting]);

  const mulaiSeret = useCallback(
    (petak) => {
      if (!fen || promosi) return;
      const game = new Chess(fen);
      const bidak = game.get(petak);
      if (bidak && bidak.color === game.turn()) {
        abaikanKlikRef.current = false;
        pilihPetak(petak);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fen, promosi]
  );

  const selesaiSeret = useCallback(
    (from, to) => {
      if (!fen || promosi) return;
      if (!to || from === to) return;
      abaikanKlikRef.current = true;
      cobaLangkah(from, to);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fen, promosi]
  );

  const batalkanSeret = useCallback(() => {
    abaikanKlikRef.current = true;
    setTerpilih(null);
    setSasaran([]);
  }, []);

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

  /* ------------------------------------------------------ kontrol papan */
  function reset() {
    bunyikan(SUARA.mulai);
    setFen(FEN_AWAL);
    setRiwayat([]);
    setRiwayatLengkap([]);
    setJalur([]);
    setPilihan(-1);
    setOrientasi("w");
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setPromosi(null);
    setTanda({ panah: [], petak: {} });
  }

  function keAwal() {
    setFen(FEN_AWAL);
    setRiwayat([]);
    setJalur([]);
    setPilihan(-1);
    setOrientasi("w");
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setPromosi(null);
    setTanda({ panah: [], petak: {} });
  }

  function undo() {
    if (!riwayat.length) return;
    // Bunyi langkah yang sedang dikembalikan — persis seperti Analisa:
    // makan/rokade/skak/langkah, bukan bunyi klik acak.
    let pindah = null;
    let game = null;
    try {
      const ulang = new Chess();
      for (const san of riwayat) {
        pindah = ulang.move(san);
      }
      game = ulang;
    } catch {}
    if (pindah && game) bunyikanLangkah(pindah, game);
    else bunyikan(SUARA.klik);
    const baru = riwayat.slice(0, -1);
    setRiwayat(baru);
    setJalur((lama) => lama.slice(0, -1));
    setFen(fenDariLangkah(baru));
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setPromosi(null);
  }

  function redo() {
    if (riwayat.length >= riwayatLengkap.length) return;
    const langkahBerikutnya = riwayatLengkap[riwayat.length];
    const game = new Chess(fen);
    let pindah;
    try {
      pindah = game.move(langkahBerikutnya);
    } catch {
      return;
    }
    bunyikanLangkah(pindah, game);
    setFen(game.fen());
    setRiwayat((lama) => [...lama, pindah.san]);
    setJalur((lama) => [...lama, kuciDariPindahan(pindah, mode)]);
    setLangkahAkhir({ from: pindah.from, to: pindah.to });
    setTerpilih(null);
    setSasaran([]);
  }

  function keAkhir() {
    if (!riwayatLengkap.length) return;
    setRiwayat([...riwayatLengkap]);
    setJalur((lama) => {
      // Rebuild jalur dari riwayat lengkap
      const game = new Chess();
      const jalurBaru = [];
      for (const san of riwayatLengkap) {
        const pindah = game.move(san);
        if (pindah) {
          jalurBaru.push(kuciDariPindahan(pindah, mode));
        }
      }
      return jalurBaru;
    });
    setFen(fenDariLangkah(riwayatLengkap));
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setPromosi(null);
  }

  /** Lompat ke langkah ke-`ply` (jumlah langkah dari posisi awal). */
  function keLangkah(ply) {
    if (ply < 0 || ply > riwayatLengkap.length) return;
    const baru = riwayatLengkap.slice(0, ply);
    setRiwayat(baru);
    setJalur(() => {
      const game = new Chess();
      const jalurBaru = [];
      for (const san of baru) {
        try {
          const pindah = game.move(san);
          if (pindah) jalurBaru.push(kuciDariPindahan(pindah, mode));
        } catch {
          break;
        }
      }
      return jalurBaru;
    });
    setFen(fenDariLangkah(baru));
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setPromosi(null);
  }

  /* ------------------------------------------------- pintasan keyboard */
  // Navigasi langkah dengan tombol panah — persis seperti Analisa:
  //   ← mundur, → maju, ↑ ke awal, ↓ ke akhir.
  // Memakai ref agar penekanan tombol selalu memakai fungsi/keadaan terbaru
  // tanpa perlu memasang-ulang pendengar tiap render.
  const kunciNavigasiRef = useRef({});
  kunciNavigasiRef.current = {
    mundur: undo,
    maju: redo,
    keAwal,
    keAkhir,
    adaJalur: !!riwayatLengkap?.length,
    blokir: !!promosi,
  };
  useEffect(() => {
    let terakhirDitekan = 0;
    function saatKeydown(e) {
      if (!kunciNavigasiRef.current.adaJalur) return;
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

  /** Terapkan teks PGN atau FEN dari dialog Review ke papan (otomatis dideteksi). */
  function terapkanTeks(teks) {
    const isi = String(teks || "").trim();
    if (!isi) return false;
    const ruas = isi.split(/\s+/);
    // FEN: ruas pertama memuat "/" dan teks punya ≥6 ruas.
    if (ruas[0] && ruas[0].includes("/") && ruas.length >= 6) {
      try {
        new Chess(isi);
      } catch {
        return false;
      }
      setRiwayat([]);
      setRiwayatLengkap([]);
      setJalur([]);
      setFen(new Chess(isi).fen());
      setPilihan(-1);
      setOrientasi("w");
      setTerpilih(null);
      setSasaran([]);
      setLangkahAkhir(null);
      setPromosi(null);
      setTanda({ panah: [], petak: {} });
      return true;
    }
    // Selain itu: anggap PGN.
    const daftar = sanDariPgn(isi);
    if (!daftar.length) return false;
    const coba = new Chess();
    for (const raw of daftar) {
      let pindah = null;
      try {
        pindah = coba.move(raw.replace(/[!?]+$/, ""));
      } catch {
        pindah = null;
      }
      if (!pindah) return false;
    }
    const sanAman = [];
    const jalurBaru = [];
    const main = new Chess();
    for (const raw of daftar) {
      const pindah = main.move(raw.replace(/[!?]+$/, ""));
      sanAman.push(pindah.san);
      jalurBaru.push(kuciDariPindahan(pindah, mode));
    }
    setRiwayat(sanAman);
    setRiwayatLengkap(sanAman);
    setJalur(jalurBaru);
    setFen(main.fen());
    setPilihan(-1);
    setOrientasi("w");
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setPromosi(null);
    setTanda({ panah: [], petak: {} });
    return true;
  }

  function salinPgn() {
    if (!riwayat.length) return;
    const teks = susunPgn(riwayat);
    const selesai = () => {
      setPgnTersalin(true);
      window.clearTimeout(timerSalin.current);
      timerSalin.current = window.setTimeout(() => setPgnTersalin(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(teks).then(selesai).catch(selesai);
    } else {
      selesai();
    }
  }

  function salinFen() {
    const selesai = () => {
      setFenTersalin(true);
      window.clearTimeout(timerSalin.current);
      timerSalin.current = window.setTimeout(() => setFenTersalin(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fen).then(selesai).catch(selesai);
    } else {
      selesai();
    }
  }

  function muatJalur(entri) {
    if (mode === "koordinat") {
      const hasil = fenDanSanDariKoordinat(entri.langkah);
      if (!hasil) return;
      setRiwayat(hasil.san);
      setRiwayatLengkap(hasil.san);
      setJalur([...entri.langkah]);
      setFen(hasil.fen);
    } else {
      setRiwayat([...entri.langkah]);
      setRiwayatLengkap([...entri.langkah]);
      setJalur([...entri.langkah]);
      setFen(fenDariLangkah(entri.langkah));
    }
    setOrientasi("w");
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setPromosi(null);
    setTanda({ panah: [], petak: {} });
  }

  /* ------------------------------------------ ikon klasifikasi langkah */
  /**
   * Ikon kualitas langkah TERAKHIR pada posisi saat ini, di pojok petak
   * tujuan (sama seperti teka-teki / chess.com / lichess). Urutan prioritas:
   *   - "book"        → langkah di buku pembukaan (data pohon sudah dimuat),
   *   - "best"        → engine menyala & langkah = saran terbaiknya,
   *   - "forced"      → satu-satunya langkah legal,
   *   - engine        → best / miss / blunder / mistake / inaccuracy / good,
   *   - skakmat/tak ada langkah sebelumnya → tanpa ikon klasifikasi.
   * Tanpa engine dan di luar buku, langkah biasa tidak diberi ikon.
   * (Skakmat punya lencana sendiri di atas raja lawan — lihat `ikonSkakmat`.)
   */
  const ikonLangkahAkhir = useMemo(() => {
    if (!riwayat.length) return null;
    const sanTerakhir = riwayat[riwayat.length - 1];
    const fenSebelum = fenDariLangkah(riwayat.slice(0, -1));

    let game;
    let pindah = null;
    try {
      game = new Chess(fenSebelum);
      pindah = game.move(sanTerakhir);
    } catch {
      return null;
    }
    if (!pindah) return null;
    const kePetak = pindah.to;

    // Buku pembukaan — pohon di atas sudah menelusuri setiap langkah:
    // cocok === true berarti posisi saat ini masih di jalur buku.
    if (infoPembukaan.cocok && infoPembukaan.nama) {
      return { petak: kePetak, rating: "book" };
    }

    // Satu-satunya langkah legal (mis. raja wajib pindah atau blok skak).
    try {
      if (isForced({ before: fenSebelum })) {
        return { petak: kePetak, rating: "forced" };
      }
    } catch {
      /* abaikan */
    }

    // Penilaian butuh engine yang menyala.
    if (!engineNyala) return null;

    const sebelum = snapshotEvalRef.current.get(fenSebelum);
    const sesudah = snapshotEvalRef.current.get(fen);
    if (!sebelum) return null; // eval posisi sebelumnya belum siap

    // best — sama dengan saran utama engine.
    if (sebelum.bestSan && sebelum.bestSan === sanTerakhir) {
      return { petak: kePetak, rating: "best" };
    }

    const sudutPindah = pindah.color === "w" ? 1 : -1;
    const mateSebelum = sebelum.matePutih !== null ? sebelum.matePutih : null;
    const mateSesudah = sesudah?.matePutih;
    const nilaiSebelum =
      mateSebelum !== null
        ? Math.sign(mateSebelum) * 10000
        : sebelum.cpPutih ?? 0;
    const nilaiSesudah =
      mateSesudah !== null && mateSesudah !== undefined
        ? Math.sign(mateSesudah) * 10000
        : sesudah?.cpPutih;

    // miss — melewatkan skakmat yang bisa langsung diberikan.
    if (mateSebelum !== null && mateSebelum * sudutPindah > 0) {
      const dikasih =
        mateSesudah !== null && mateSesudah !== undefined
          ? mateSesudah * sudutPindah < 0
          : false;
      if (!dikasih) return { petak: kePetak, rating: "miss" };
    }

    // blunder — menyerahkan skakmat ke lawan, atau kerugian ≥ 4 pion.
    if (mateSesudah !== null && mateSesudah !== undefined) {
      if (mateSesudah * sudutPindah < 0) {
        return { petak: kePetak, rating: "blunder" };
      }
    }
    if (nilaiSesudah === undefined || nilaiSesudah === null) return null;
    const rugiPion = ((nilaiSebelum - nilaiSesudah) * sudutPindah) / 100;
    if (rugiPion >= 4) return { petak: kePetak, rating: "blunder" };
    if (rugiPion >= 1.2) return { petak: kePetak, rating: "mistake" };
    if (rugiPion >= 0.8) return { petak: kePetak, rating: "inaccuracy" };
    if (rugiPion >= 0.4) return { petak: kePetak, rating: "good" };
    return { petak: kePetak, rating: "excellent" };
    // hasilTertahan/hasilEngine jadi dependensi agar ikon terbarui begitu
    // snapshot eval posisi tersedia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riwayat, fen, infoPembukaan.cocok, infoPembukaan.nama, engineNyala, hasilTertahan]);

  /**
   * Komentator langsung — bahan mentah untuk KartuKomentator di tab analisa.
   * Fakta papan (skak/tangkapan/rokade/bidak menggantung) dihitung dari
   * chess.js dan selalu tersedia; penilaian + skor hanya ikut bila engine
   * menyala (memakai rating `ikonLangkahAkhir` dan snapshot eval yang sama
   * dengan ikon di petak, sehingga komentar & ikon selalu sejalan).
   */
  const preferensiKomentator = gunakanPreferensiKomentator();
  const faktaKomentator = useMemo(() => {
    if (!riwayat.length) return null;
    const fenSebelum = fenDariLangkah(riwayat.slice(0, -1));
    return faktaLangkah(fenSebelum, riwayat[riwayat.length - 1]);
  }, [riwayat]);
  const dataKomentator = useMemo(() => {
    if (!riwayat.length) {
      return { evalSesudah: null, saranTerbaik: null, engineMenilai: false };
    }
    const fenSebelum = fenDariLangkah(riwayat.slice(0, -1));
    const sebelum = engineNyala ? snapshotEvalRef.current.get(fenSebelum) : null;
    const sesudah = engineNyala ? snapshotEvalRef.current.get(fen) : null;
    return {
      evalSesudah: sesudah ? { cpPutih: sesudah.cpPutih, matePutih: sesudah.matePutih } : null,
      saranTerbaik: sebelum?.bestSan || null,
      engineMenilai: engineNyala && !sesudah,
    };
    // hasilTertahan memicu hitung ulang begitu snapshot eval posisi tersedia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riwayat, fen, engineNyala, hasilTertahan]);

  /**
   * Lencana skakmat — petak raja yang termat pada posisi yang sedang
   * ditampilkan. Kosong (tanpa lencana) selama permainan belum berakhir.
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

  /* ------------------------------------------------------------ tampilan */
  const namaUtama = infoPembukaan.nama ? infoPembukaan.nama[0] : null;
  const jumlahNama = infoPembukaan.nama ? infoPembukaan.nama.length : 0;

  let giliranKini = "w";
  try {
    giliranKini = new Chess(fen).turn();
  } catch {
    /* abaikan */
  }

  return (
    <div className="flex flex-col min-h-screen lg:h-screen overflow-hidden bg-[#262421] text-gray-200 font-sans select-none">
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SIDEBAR KIRI                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[220px] bg-[#1e1c18] flex flex-col justify-between py-4 border-r border-b lg:border-b-0 border-[#312e2b] flex-shrink-0 overflow-y-auto">
          <div>
            {/* Brand */}
            <div className="px-5 pb-4 mb-5 flex items-center border-b border-[#312e2b]">
              <span className="font-bold text-[22px] tracking-tight text-white leading-none">
                Blunder<span className="text-[#81b64c]">Skuad</span>
              </span>
            </div>

          </div>

          {/* Kaki sidebar */}
          <div className="px-4 pt-3 flex justify-center text-gray-500 text-xs border-t border-[#312e2b]">
            <Link
              to="/program-kami/atribusi"
              className="flex items-center gap-1.5 hover:text-white transition"
            >
              <License size={14} class="fill-current" />
              Lisensi & Atribusi
            </Link>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* AREA UTAMA                                            */}
        {/* ═══════════════════════════════════════════════════════ */}
        <main className="flex-1 flex items-center justify-center bg-[#262421] min-w-0 overflow-hidden">
          <div className="flex h-full w-full max-w-[1280px] min-h-0 flex-col px-4 py-6 md:px-8">
          {gagal ? (
            <p className="rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {t("papan.gagalMuat")}
            </p>
          ) : !pohon ? (
            <div className="mx-auto max-w-[560px]">
              <p className="mb-6 text-sm text-slate-400">{t("papan.memuat")}</p>
              <Kerangka />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-3">
              <div className="mx-auto flex w-full max-w-[520px] shrink-0 flex-col justify-center overflow-y-auto lg:mx-0">
                {/* ─── PROFIL HITAM (ATAS) ─── */}
                <div className="flex flex-row justify-between items-center pl-[42px] pr-1 mb-2">
                  <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 flex-shrink-0 flex flex-row justify-center items-end bg-[#474542] rounded-md shadow-md overflow-hidden">
                      <Profile height={32} width={32} class="fill-[#1d1c1a]" />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-sm font-bold text-[#fffaec] truncate">Hitam</span>
                      <div className="flex min-h-[15px] items-center overflow-hidden">
                        <TangkapanBidak daftar={tangkapan.olehHitam} set={setBidak} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                <div className="flex items-stretch gap-1.5">
                  {(() => {
                    // Bar evaluasi ala LayoutTekaTeki: skor tampil di dalam bar,
                    // hanya sisi yang menang yang terlihat.
                    const { teksSkor = "", cpPutih = 0, matePutih = null } =
                      hasilTertahan || {};
                    const advantageAmount =
                      matePutih !== null ? Number(matePutih) : Number(cpPutih);
                    const OLD_PERCENTS = [-400, 400];
                    const NEW_PERCENTS = [5, 95];
                    const rawPercent =
                      ((advantageAmount - OLD_PERCENTS[0]) *
                        (NEW_PERCENTS[1] - NEW_PERCENTS[0])) /
                        (OLD_PERCENTS[1] - OLD_PERCENTS[0]) +
                      NEW_PERCENTS[0];
                    let percent;
                    if (matePutih !== null) {
                      percent =
                        advantageAmount > 0
                          ? 100
                          : advantageAmount < 0
                            ? 0
                            : 50;
                    } else {
                      percent = Math.min(
                        Math.max(rawPercent, NEW_PERCENTS[0]),
                        NEW_PERCENTS[1]
                      );
                    }
                    const white = orientasi === "w";
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
                        aria-label={
                          hasilTertahan
                            ? `${t("papan.engineSkor")} ${displayAdvantage}`
                            : undefined
                        }
                      >
                        <div
                          className="w-full bg-[#ffffff]"
                          style={{
                            height: `${percent}%`,
                            transition: "height 1.5s",
                            willChange: "height",
                          }}
                        />
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
                  })()}
                  <div className="relative min-w-0 flex-1">
                  <PapanTekaTeki
                    fen={fen}
                    orientasi={orientasi}
                    terpilih={terpilih}
                    sasaran={sasaran}
                    kesalahan={kesalahan}
                    langkahAkhir={langkahAkhir}
                    tanda={tanda}
                    panahMesin={tampilPanahMesin ? panahMesin : null}
                    ikonLangkah={ikonLangkahAkhir}
                    ikonSkakmat={ikonSkakmat}
                    ikonMahkota={ikonMahkota}
                    terkunci={!!promosi}
                    membeku={false}
                    setBidak={setBidak}
                    tema={warnaPapan}
                    onKlik={klikPetak}
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
                        className="flex flex-col items-center gap-3 rounded-lg bg-white/95 p-4"
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
                </div>
                </div>

                {/* ─── PROFIL PUTIH (BAWAH) ─── */}
                <div className="flex flex-row justify-between items-center pl-[42px] pr-1 mt-3">
                  <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 flex-shrink-0 flex flex-row justify-center items-end bg-[#dbd9d6] rounded-md shadow-md overflow-hidden">
                      <Profile height={32} width={32} class="fill-[#ffffff]" />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-sm font-bold text-[#fffaec] truncate">Putih</span>
                      <div className="flex min-h-[15px] items-center overflow-hidden">
                        <TangkapanBidak daftar={tangkapan.olehPutih} set={setBidak} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Popup pengaturan */}
                  {tampilSetting && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                      onClick={() => setTampilSetting(false)}
                    ><div className="w-full max-w-sm rounded-lg border border-[#312e2b] bg-[#1e1c18] p-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white">{t("papan.pengaturanPapan")}</h3>
                          <button
                            type="button"
                            onClick={() => setTampilSetting(false)}
                            className="text-gray-400 transition hover:text-gray-200"
                            title={t("papan.tutup")}
                            aria-label={t("papan.tutup")}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-gray-400">
                              {t("papan.setBidak")}
                            </label>
                            <select
                              value={setBidak}
                              onChange={(e) => setSetBidak(e.target.value)}
                              className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                            >
                              {DAFTAR_SET.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.nama}
                                </option>
                              ))}
                            </select>
                          </div>
                          <label className="flex cursor-pointer items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-gray-400">
                              {t("papan.suara")}
                            </span>
                            <input
                              type="checkbox"
                              checked={suaraNyala}
                              onChange={(e) => setSuaraNyala(e.target.checked)}
                              className="h-4 w-4 accent-[#81b64c]"
                            />
                          </label>
                          <label className="flex cursor-pointer items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-gray-400">
                              {t("papan.enginePanahToggle")}
                            </span>
                            <input
                              type="checkbox"
                              checked={tampilPanahMesin}
                              onChange={(e) => setTampilPanahMesin(e.target.checked)}
                              aria-label={t("papan.enginePanahToggle")}
                              className="h-4 w-4 accent-[#81b64c]"
                            />
                          </label>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="warna-papan" className="text-sm font-semibold text-gray-400">{t("papan.warnaPapan")}</label>
                            <select
                              id="warna-papan"
                              value={warnaPapan}
                              onChange={(e) => setWarnaPapan(e.target.value)}
                              className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                            >
                              {PILIHAN_WARNA_PAPAN.map(([nilai, kunci]) => <option key={nilai} value={nilai}>{t(kunci)}</option>)}
                            </select>
                          </div>
                          <div className="border-t border-[#312e2b] pt-3">
                            <KartuKomentator
                              fakta={faktaKomentator}
                              rating={ikonLangkahAkhir?.rating || null}
                              evalSesudah={dataKomentator.evalSesudah}
                              namaPembukaan={infoPembukaan.cocok && namaUtama ? namaUtama[1] : null}
                              saranTerbaik={dataKomentator.saranTerbaik}
                              engineNyala={engineNyala}
                              engineMenilai={dataKomentator.engineMenilai}
                              posisiAwal={riwayat.length === 0}
                              nyala={preferensiKomentator.nyala}
                              setNyala={preferensiKomentator.setNyala}
                              gaya={preferensiKomentator.gaya}
                              setGaya={preferensiKomentator.setGaya}
                              t={t}
                              className=""
                              hanyaKontrol
                            />
                          </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setTampilSetting(false)}
                            className="rounded-md border border-[#81b64c] bg-[#81b64c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a3d168]"
                          >
                            {t("papan.tutup")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* Kolom kontrol papan (gear & flip) — di samping papan, ala LayoutTekaTeki */}
              <div className="flex flex-col items-center gap-2 pt-14 lg:-ml-3">
                <button
                  type="button"
                  onClick={() => setTampilSetting(!tampilSetting)}
                  aria-expanded={tampilSetting}
                  className={`p-2 rounded-md transition ${
                    tampilSetting
                      ? "text-white bg-[#312e2b]"
                      : "text-gray-500 hover:text-white hover:bg-[#312e2b]"
                  }`}
                  aria-label={t("papan.pengaturan")}
                  title={t("papan.pengaturan")}
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
                <button
                  type="button"
                  onClick={() => {
                    // Bunyikan saat dinyalakan supaya pengguna langsung dengar contohnya.
                    if (!suaraNyala) mainkanSuara(SUARA.tesSuara);
                    setSuaraNyala((n) => !n);
                  }}
                  aria-pressed={suaraNyala}
                  className={`p-2 rounded-md transition ${
                    suaraNyala
                      ? "text-gray-500 hover:text-white hover:bg-[#312e2b]"
                      : "text-[#b33430] hover:bg-[#312e2b]"
                  }`}
                  aria-label={suaraNyala ? t("papan.suaraNyala") : t("papan.suaraMati")}
                  title={suaraNyala ? t("papan.suaraNyala") : t("papan.suaraMati")}
                >
                  {suaraNyala ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOrientasi((o) => (o === "w" ? "b" : "w"))}
                  className="p-2 rounded-md text-gray-500 hover:text-white hover:bg-[#312e2b] transition"
                  aria-label={t("papan.flip")}
                  title={t("papan.flip")}
                >
                  <svg className="w-5 h-5" viewBox="0 0 120 120" fill="currentColor">
                    <path d="M 21.475246,117.78677 H 73.154894 L 56.373294,98.524495 H 40.73752 V 35.922099 H 59.999794 L 31.106383,2.2131167 2.2129751,35.922099 H 21.475246 Z" />
                    <path d="m 98.524909,2.2132354 -51.679643,0 16.781593,19.2622766 15.635776,0 V 84.077908 H 60.00036 L 88.893772,117.78689 117.78718,84.077908 H 98.524909 Z" />
                  </svg>
                </button>
              </div>

              <div className="min-w-0 flex-1">
                {/* Panel kanan — satu kolom utuh ala LayoutTekaTeki: tinggi tetap di lg supaya
                    kontrol dasar tidak ikut naik-turun saat isi tab pendek/kosong */}
                <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#312e2b] bg-[#211f1c]">
                {/* Header Tab Navigasi — pola panel kanan Chess.com (referensi prompt.md) */}
                <div className="flex flex-shrink-0 border-b border-[#312e2b] bg-[#1e1c18]">
                  {TAB_PANEL.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTabPanel(tab.id)}
                      className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold border-b-2 transition-all ${
                        tabPanel === tab.id
                          ? "border-[#81b64c] text-white bg-[#262421]"
                          : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#262421]"
                      }`}
                    >
                      <IkonTab nama={tab.id} />
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {tabPanel === "books" ? (
                    <BukuPembukaan
                      kelompok={daftarPilih.kelompok}
                      idDari={daftarPilih.idDari}
                      terpilihId={pilihan}
                      onPilih={(entri, id) => {
                        setPilihan(id);
                        muatJalur(entri);
                      }}
                      t={t}
                    />
                  ) : tabPanel === "explorer" ? (
                    namaUtama ? (
                      <KartuArtikelPembukaan
                        artikel={artikelPembukaan}
                        t={t}
                      />
                    ) : (
                      <p className="mt-1.5 text-sm font-medium text-gray-400">
                        {t("papan.petunjukAwal")}
                      </p>
                    )
                  ) : tabPanel === "games" ? (
                    infoPembukaan.saran.length > 0 ? (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-100">{t("papan.daftarLangkah")}</p>
                          <span className="text-xs text-gray-500">{t("papan.basisData")}</span>
                        </div>
                        <LangkahExplorer langkah={infoPembukaan.saran} bahasa={bahasa} onPilih={mainkanSan} t={t} />
                      </div>
                    ) : (
                      <p className="mt-1.5 text-sm font-medium text-gray-400">
                        {infoPembukaan.cocok
                          ? t("papan.petunjukAwal")
                          : t("papan.diLuarBuku")}
                      </p>
                    )
                  ) : (
                    <>
                      {/* Toggle nyala/mati engine — pola baris "Analysis" di prompt.md */}
                      <div className="mb-3 flex items-center justify-between border-b border-[#312e2b] pb-3">
                        <button
                          type="button"
                          id="sampel-toggle-engine"
                          role="switch"
                          aria-checked={engineNyala}
                          onClick={() => (engineNyala ? matikanEngine() : nyalakanEngine())}
                          className={`flex h-5 w-9 items-center rounded-full border transition ${
                            engineNyala
                              ? "border-[#81b64c] bg-[#81b64c]"
                              : "border-[#363431] bg-[#363431]"
                          }`}
                          aria-label={t("papan.engine")}
                          title={t("papan.engine")}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                              engineNyala ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <p className="pl-3 text-sm font-bold leading-none text-white">
                          {t("papan.engine")}{" "}
                          <span className="ml-1 font-normal text-gray-500">Stockfish 18</span>
                        </p>
                      </div>

                      {/* Status posisi: komentator menggantikan nama pembukaan saat aktif. */}
                      <div className="mt-3 min-w-0 border-b border-[#312e2b] pb-3">
                        {preferensiKomentator.nyala ? (
                          <KartuKomentator
                            fakta={faktaKomentator}
                            rating={ikonLangkahAkhir?.rating || null}
                            evalSesudah={dataKomentator.evalSesudah}
                            namaPembukaan={infoPembukaan.cocok && namaUtama ? namaUtama[1] : null}
                            saranTerbaik={dataKomentator.saranTerbaik}
                            engineNyala={engineNyala}
                            engineMenilai={dataKomentator.engineMenilai}
                            posisiAwal={riwayat.length === 0}
                            nyala={preferensiKomentator.nyala}
                            setNyala={preferensiKomentator.setNyala}
                            gaya={preferensiKomentator.gaya}
                            setGaya={preferensiKomentator.setGaya}
                            t={t}
                            className="w-full min-w-0"
                            sembunyikanKontrol
                          />
                        ) : riwayat.length === 0 ? (
                          <p className="truncate text-sm font-semibold text-gray-400">
                            {t("papan.posisiAwal")}
                          </p>
                        ) : infoPembukaan.cocok && namaUtama ? (
                          <p
                            className="truncate text-sm font-bold text-white"
                            title={namaUtama[1]}
                          >
                            {namaUtama[1]}
                          </p>
                        ) : (
                          <p className="truncate text-xs font-semibold text-amber-300">
                            {t("papan.diLuarBuku")}
                          </p>
                        )}
                      </div>

                  {engineNyala && (
                  <div className="mt-3 border-b border-[#312e2b] pb-3">
                  <PanelEngine
                    nyala={engineNyala}
                    status={statusEngine}
                    hasil={hasilEngine}
                    fen={fen}
                    kecepatan={kecepatanEngine}
                    setKecepatan={setKecepatanEngine}
                    permainanSelesai={permainanSelesai}
                    onNyalakan={nyalakanEngine}
                    onMatikan={matikanEngine}
                    onMainkan={mainkanSan}
                    tanpaBilah
                    tanpaJudul
                    tanpaDeskripsi
                    tanpaGaris
                    gelap
                    t={t}
                  />
                  </div>
                  )}

                      <DaftarRiwayat
                        langkah={riwayatLengkap}
                        aktifPly={riwayat.length - 1}
                        onPilih={keLangkah}
                      />

                    </>
                  )}
                </div>

                {/* Panel Kontrol Bawah Navigasi — menyatu di dasar panel ala LayoutTekaTeki */}
                <div className="mt-auto flex-shrink-0 space-y-3 rounded-b-lg border-t border-[#312e2b] bg-[#1e1c18] p-3">
                  <div className="flex items-center gap-1 rounded-lg border border-[#312e2b] bg-[#262421] p-1">
                    <button
                      type="button"
                      onClick={keAwal}
                      disabled={!riwayat.length}
                      title={t("papan.keAwal")}
                      aria-label={t("papan.keAwal")}
                      className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    >
                      ⏮
                    </button>
                    <button
                      type="button"
                      onClick={undo}
                      disabled={!riwayat.length}
                      title={t("papan.mundur")}
                      aria-label={t("papan.mundur")}
                      className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={redo}
                      disabled={riwayat.length >= riwayatLengkap.length}
                      title={t("papan.maju")}
                      aria-label={t("papan.maju")}
                      className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    >
                      ▶
                    </button>
                    <button
                      type="button"
                      onClick={keAkhir}
                      disabled={riwayat.length >= riwayatLengkap.length}
                      title={t("papan.keAkhir")}
                      aria-label={t("papan.keAkhir")}
                      className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    >
                      ⏭
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-300">
                    <button
                      type="button"
                      onClick={reset}
                      className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b]"
                    >
                      <Plus className="h-4 w-4 text-gray-400" />
                      <span>New</span>
                    </button>
                    <button
                      type="button"
                      onClick={salinPgn}
                      disabled={!riwayat.length}
                      title={t("papan.daftarLangkahPgn")}
                      className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Bookmark className="h-4 w-4 text-gray-400" />
                      <span>{pgnTersalin ? t("papan.tersalinSingkat") : "Save"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTampilPgn(true)}
                      title="Input PGN / FEN"
                      className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b]"
                    >
                      <RotateCw className="h-4 w-4 text-gray-400" />
                      <span>Review</span>
                    </button>
                    <button
                      type="button"
                      className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b]"
                    >
                      <Share2 className="h-4 w-4 text-gray-400" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      </div>

      {tampilPgn && (
        <MasukanPgn onTerapkan={terapkanTeks} onTutup={() => setTampilPgn(false)} />
      )}
    </div>
  );
}

/** Buang sisa markup wiki (pranala [[…]], templat {{…}}, tanda petik '''…''',
 *  tag HTML) dari sebaris teks agar terbaca seperti artikel biasa. */
function bersihTeksArtikel(teks) {
  return String(teks || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/?>/gi, "")
    .replace(/<\/ref>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/'{2,}/g, "")
    .replace(/^\s*[:*#;]+/, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.,;:!?])(?=[.,;:!?])/g, "$1")
    .trim();
}

/** Pecah ringkasan Wikibooks menjadi blok tersusun: baris `== judul ==` /
 *  `=== subjudul ===` menjadi judul bagian, sisanya paragraf isi. */
function susunBlokArtikel(teks) {
  const blok = [];
  for (const mentah of String(teks || "").split(/\r?\n/)) {
    const baris = bersihTeksArtikel(mentah);
    if (!baris) continue;
    const judul = /^(={2,6})\s*(.*?)\s*\1$/.exec(baris);
    if (judul) {
      const isi = bersihTeksArtikel(judul[2]);
      if (isi) {
        blok.push({
          jenis: judul[1].length === 2 ? "judul" : "subjudul",
          teks: isi,
        });
      }
      continue;
    }
    // Buang penanda judul yang tersisa di tengah baris (artefak
    // terjemahan), mis. "==3. d4==", agar jadi teks biasa.
    blok.push({ jenis: "paragraf", teks: baris.replace(/={2,}/g, "") });
  }
  return blok;
}

/**
 * Kartu "Tentang Pembukaan Ini" — ringkasan dari Wikibooks Chess Opening
 * Theory yang berganti otomatis mengikuti pembukaan aktif di papan.
 * Seluruh paragraf ringkasan ditampilkan langsung (tanpa tombol
 * "selengkapnya"); artikelnya sendiri baru dimuat saat tab Explorer terbuka.
 */
function KartuArtikelPembukaan({ artikel, t }) {
  const blok = useMemo(
    () =>
      artikel && artikel.data
        ? susunBlokArtikel(artikel.data.ringkasan)
        : [],
    [artikel]
  );

  if (!artikel) return null;
  const data = artikel.data;

  return (
    <div className="mt-3 border-t border-[#312e2b] pt-3">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {t("papan.artikelJudul")}
      </p>

      {artikel.status === "memuat" ? (
        <div
          className="mt-2 animate-pulse"
          role="status"
          aria-label={t("papan.artikelMemuat")}
        >
          <div className="h-3 w-2/5 rounded bg-[#312e2b]" />
          <div className="mt-2 h-3 w-full rounded bg-[#312e2b]" />
          <div className="mt-1.5 h-3 w-11/12 rounded bg-[#312e2b]" />
          <div className="mt-1.5 h-3 w-3/5 rounded bg-[#312e2b]" />
        </div>
      ) : artikel.status === "siap" && data ? (
        <div className="mt-2">
          <p className="m-0 text-sm font-bold text-white">{data.judul}</p>
          <div className="mt-1.5 flex items-start gap-3">
            {data.gambar && (
              <img
                src={data.gambar}
                alt=""
                width={72}
                height={72}
                loading="lazy"
                className="h-[72px] w-[72px] shrink-0 border border-[#363431] bg-[#262421] object-cover"
              />
            )}
            <div className="min-w-0">
              {blok.map((b, i) =>
                b.jenis === "judul" ? (
                  <p
                    key={i}
                    className="m-0 mb-1 mt-2.5 text-[13px] font-bold leading-snug text-gray-100 first:mt-0"
                  >
                    {b.teks}
                  </p>
                ) : b.jenis === "subjudul" ? (
                  <p
                    key={i}
                    className="m-0 mb-1 mt-2 text-xs font-semibold leading-snug text-gray-200"
                  >
                    {b.teks}
                  </p>
                ) : (
                  <p key={i} className="m-0 mb-1.5 text-xs leading-5 text-gray-400">
                    {b.teks}
                  </p>
                )
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-gray-500">
              Wikibooks · {data.bahasa.toUpperCase()} · CC BY-SA
              {data.terjemahanOtomatis &&
                ` · ${t("papan.artikelOtomatis")}`}
            </span>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#a3d168] hover:underline"
            >
              {t("papan.artikelBaca")} ↗
            </a>
          </div>
        </div>
      ) : (
        <p className="m-0 mt-1.5 text-xs text-gray-400">
          {t("papan.artikelKosong")}
        </p>
      )}
    </div>
  );
}

/**
 * Tab "Books": katalog pembukaan sebagai daftar berkelompok (bukan <select>).
 * Kotak pencarian menyaring nama atau kode ECO; klik baris memuat jalurnya.
 */
function BukuPembukaan({ kelompok, idDari, terpilihId, onPilih, t }) {
  const [cari, setCari] = useState("");
  const kataKunci = cari.trim().toLowerCase();

  const cocok = (entri) =>
    !kataKunci ||
    entri.nama.toLowerCase().includes(kataKunci) ||
    String(entri.eco || "").toLowerCase().includes(kataKunci);

  const hasil = useMemo(
    () =>
      kelompok
        .map((g) => ({ nama: g.nama, daftar: g.daftar.filter(cocok) }))
        .filter((g) => g.daftar.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kelompok, kataKunci]
  );

  const jumlahTotal = kelompok.reduce((n, g) => n + g.daftar.length, 0);
  const jumlahHasil = hasil.reduce((n, g) => n + g.daftar.length, 0);

  return (
    <div className="flex flex-col">
      <input
        type="search"
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder={t("papan.cariPembukaan")}
        aria-label={t("papan.cariPembukaan")}
        className="w-full rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
      />

      <p className="mt-2 text-[11px] text-gray-500">
        {t("papan.menampilkan", { n: jumlahHasil, total: jumlahTotal })}
      </p>

      {hasil.length === 0 ? (
        <p className="px-3 py-8 text-center text-xs text-gray-500">
          {kataKunci
            ? t("papan.tidakAdaHasil", { q: cari.trim() })
            : t("papan.petunjukAwal")}
        </p>
      ) : (
        <div className="mt-1 pr-1">
          {hasil.map((g) => (
            <div key={g.nama}>
              <p className="sticky top-0 z-10 border-y border-[#312e2b] bg-[#262421] px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {g.nama}
              </p>
              <ul>
                {g.daftar.map((entri) => {
                  const id = idDari.get(entri);
                  const aktif = id === terpilihId;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => onPilih(entri, id)}
                        aria-current={aktif ? "true" : undefined}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition ${
                          aktif
                            ? "bg-[#363431] text-white"
                            : "text-gray-300 hover:bg-[#2c2926]"
                        }`}
                      >
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 font-bold tabular-nums ${
                            aktif
                              ? "bg-[#81b64c] text-[#1e1c18]"
                              : "bg-[#81b64c]/15 text-[#a3d168]"
                          }`}
                        >
                          {entri.eco}
                        </span>
                        <span className="min-w-0 truncate" title={entri.nama}>
                          {entri.nama}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Daftar langkah (move log) — baris nomor + langkah Putih/Hitam yang bisa
 * diklik untuk melompat ke posisi tersebut (pola "Move Log" di prompt.md).
 * Langkah masa depan (setelah undo) dibuat redup sampai dipilih lagi.
 */
function DaftarRiwayat({ langkah, aktifPly, onPilih }) {
  if (!langkah.length) return null;
  const baris = [];
  for (let i = 0; i < langkah.length; i += 2) {
    const hitam = i + 1 < langkah.length ? langkah[i + 1] : null;
    baris.push({ nomor: i / 2 + 1, putihI: i, putih: langkah[i], hitamI: i + 1, hitam });
  }
  const kelas = (ply) => {
    if (ply === aktifPly) return "bg-[#363431] text-white";
    if (ply > aktifPly) return "text-gray-600 hover:bg-[#2c2926] hover:text-gray-300";
    return "text-gray-300 hover:bg-[#2c2926] hover:text-white";
  };
  return (
    <div className="mt-3 space-y-0.5">
      {baris.map((b) => (
        <div
          key={b.nomor}
          className="flex items-center gap-2 rounded px-1 py-0.5 transition hover:bg-[#2c2926]"
        >
          <span className="w-6 shrink-0 text-right text-xs text-gray-500">{b.nomor}.</span>
          <button
            type="button"
            onClick={() => onPilih(b.putihI + 1)}
            className={`flex-1 rounded px-2 py-1 text-left text-xs font-semibold transition ${kelas(
              b.putihI
            )}`}
          >
            {b.putih}
          </button>
          <button
            type="button"
            onClick={() => onPilih(b.hitamI + 1)}
            disabled={b.hitam === null}
            className={`flex-1 rounded px-2 py-1 text-left text-xs font-semibold transition ${
              b.hitam === null
                ? "cursor-default text-gray-600"
                : kelas(b.hitamI)
            }`}
          >
            {b.hitam ?? "…"}
          </button>
        </div>
      ))}
    </div>
  );
}

const NILAI_BIDAK = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/**
 * Hitung bidak yang ditangkap tiap sisi dari riwayat SAN. "olehPutih" berisi
 * bidak Hitam yang ditangkap Putih (tampil di baris Putih), "olehHitam"
 * sebaliknya. Hasil diurutkan dari bidak paling berharga, dengan jumlah per jenis.
 */
function susunTangkapan(daftarSan) {
  const kantongPutih = {}; // bidak hitam yang ditangkap Putih
  const kantongHitam = {}; // bidak putih yang ditangkap Hitam
  const game = new Chess();
  for (const san of daftarSan) {
    let pindah;
    try {
      pindah = game.move(san);
    } catch {
      break;
    }
    if (!pindah || !pindah.captured) continue;
    const kantong = pindah.color === "w" ? kantongPutih : kantongHitam;
    kantong[pindah.captured] = (kantong[pindah.captured] || 0) + 1;
  }
  const rapikan = (kantong, warnaTampil) =>
    Object.entries(kantong)
      .sort((a, b) => NILAI_BIDAK[b[0]] - NILAI_BIDAK[a[0]])
      .map(([jenis, jumlah]) => ({
        huruf: warnaTampil === "w" ? jenis.toUpperCase() : jenis,
        jumlah,
      }));
  return {
    olehPutih: rapikan(kantongPutih, "b"),
    olehHitam: rapikan(kantongHitam, "w"),
  };
}

/** Ikon bidak yang ditangkap: satu ikon per jenis + pengali bila lebih dari satu. */
function TangkapanBidak({ daftar, set }) {
  if (!daftar || daftar.length === 0) return null;
  return (
    <span className="flex items-center gap-1.5">
      {daftar.map(({ huruf, jumlah }) => (
        <span key={huruf} className="flex shrink-0 items-center">
          <ChessPiece piece={huruf} set={set} className="h-4 w-4 opacity-80" />
          {jumlah > 1 && (
            <span className="ml-0.5 text-[10px] font-semibold leading-none text-gray-500">
              {jumlah}×
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

/** Ambil daftar SAN dari teks PGN (abaikan nomor langkah, komentar, hasil akhir). */
function sanDariPgn(pgn) {
  const dibersihkan = String(pgn || "")
    .replace(/^\[[^\n]*\]/gm, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d+\.(\.\.)?/g, " ")
    .replace(/\b(1-0|0-1|1\/2-1\/2|½-½|\*)\b/g, " ");
  return dibersihkan.split(/\s+/).filter(Boolean);
}

/** Dialog Review: tempel PGN atau FEN lalu muat ke papan. */
function MasukanPgn({ onTerapkan, onTutup }) {
  const [teks, setTeks] = useState("");
  const [galat, setGalat] = useState(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onTutup}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Input PGN / FEN"
        className="w-full max-w-md rounded-lg border border-[#312e2b] bg-[#1e1c18] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Input PGN / FEN</h3>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="text-gray-400 transition hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <textarea
          value={teks}
          onChange={(e) => {
            setTeks(e.target.value);
            setGalat(false);
          }}
          rows={7}
          spellCheck={false}
          placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 … (atau tempel FEN)"
          className="w-full resize-y rounded-md border border-[#363431] bg-[#262421] p-3 font-mono text-xs leading-5 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-[#81b64c]"
        />
        {galat && (
          <p className="mt-2 text-xs font-medium text-red-400">
            PGN/FEN tidak dapat dimuat — periksa kembali isinya.
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onTutup}
            className="rounded-md border border-[#363431] bg-[#2c2926] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:bg-[#363431] hover:text-white"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              if (onTerapkan(teks)) onTutup();
              else setGalat(true);
            }}
            disabled={!teks.trim()}
            className="rounded-md bg-[#81b64c] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#a3d168] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Muat
          </button>
        </div>
      </div>
    </div>
  );
}

function LangkahExplorer({ langkah, bahasa, onPilih, t }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[510px] border-collapse text-left text-xs text-gray-300">
        <thead className="bg-[#2c2926] text-gray-200">
          <tr>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">{t("papan.kolomLangkah")}</th>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">{t("papan.kolomJumlah")}</th>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">{t("papan.kolomPersen")}<br /><span className="font-normal">{t("papan.kolomPutihSeriHitam")}</span></th>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">{t("papan.pembukaan")}</th>
          </tr>
        </thead>
        <tbody>
          {langkah.map((item) => {
            const stat = item.stat;
            return (
              <tr key={item.k} className="border-b border-[#312e2b] last:border-b-0 hover:bg-[#2c2926]">
                <td className="px-3 py-2 align-top">
                  <button type="button" onClick={() => onPilih(item.san)} className="font-bold text-[#a3d168] hover:underline">{item.san}</button>
                </td>
                <td className="px-3 py-2 align-top tabular-nums">{stat ? formatAngka(stat.games, bahasa) : "—"}</td>
                <td className="min-w-[145px] px-3 py-2 align-top">
                  {stat ? <HasilBar stat={stat} bahasa={bahasa} /> : "—"}
                </td>
                <td className="px-3 py-2 align-top text-gray-400">{item.nama || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HasilBar({ stat, bahasa }) {
  const putih = stat.whiteWin ?? 0;
  const seri = stat.draw ?? 0;
  const hitam = stat.blackWin ?? 0;
  return <>
    <div className="flex h-2 w-full overflow-hidden border border-[#555] bg-[#1e1d1c]">
      <span style={{ width: `${putih * 100}%` }} className="bg-[#e8e6e3]" />
      <span style={{ width: `${seri * 100}%` }} className="bg-[#8a8a8a]" />
      <span style={{ width: `${hitam * 100}%` }} className="bg-[#57534e]" />
    </div>
    <div className="mt-1 whitespace-nowrap text-[10px] text-gray-400">{formatPersen(putih, bahasa)}% / {formatPersen(seri, bahasa)}% / {formatPersen(hitam, bahasa)}%</div>
  </>;
}


