import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Hero from "../../components/Hero.jsx";
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

const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Urutan pilihan bidak promosi (menteri, benteng, gajah, kuda). */
const PILIHAN_PROMOSI = ["q", "r", "b", "n"];
const KUCI_NAMA_PROMOSI = {
  q: "tekaTeki.promosiMenteri",
  r: "tekaTeki.promosiBenteng",
  b: "tekaTeki.promosiGajah",
  n: "tekaTeki.promosiKuda",
};


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
      <div className="h-40 rounded-lg bg-slate-200" />
      <div className="mt-4 h-4 w-56 rounded bg-slate-200" />
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
  useEffect(() => {
    batalArtikelRef.current?.abort();
    if (!namaArtikel) {
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
  }, [namaArtikel, bahasa, riwayat]);

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
      setKesalahan({ from, to });
      setTerpilih(null);
      setSasaran([]);
      timerSalah.current = window.setTimeout(() => setKesalahan(null), 700);
      return;
    }

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
   *   - skakmat/tak ada langkah sebelumnya → tanpa ikon.
   * Tanpa engine dan di luar buku, langkah biasa tidak diberi ikon.
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

  /* ------------------------------------------------------------ tampilan */
  const crumbs = [
    { label: t("common.home"), to: "/" },
    { label: t("papan.remah") },
  ];

  const namaUtama = infoPembukaan.nama ? infoPembukaan.nama[0] : null;
  const jumlahNama = infoPembukaan.nama ? infoPembukaan.nama.length : 0;

  return (
    <>
      <Hero
        title={t("papan.judul")}
        description={t("papan.deskripsi")}
        crumbs={crumbs}
      />

      <main className="bg-[#f5f5f5] px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-[1180px]">
          <section className="p-4 md:p-6">
            <div className="mb-5 border-b border-[#d8d8d8] pb-4">
              <h2 className="text-xl font-bold text-[#333]">{t("papan.penjelajah")}</h2>
              <p className="mt-1 text-sm leading-6 text-[#555]">{t("papan.penjelajahDeskripsi")}</p>
            </div>
          {gagal ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {t("papan.gagalMuat")}
            </p>
          ) : !pohon ? (
            <div className="mx-auto max-w-[560px]">
              <p className="mb-6 text-sm text-slate-500">{t("papan.memuat")}</p>
              <Kerangka />
            </div>
          ) : (
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="mx-auto w-full max-w-[480px] shrink-0 lg:mx-0">
                <div className="flex items-stretch gap-1.5">
                  <div
                    className={`flex w-3.5 shrink-0 flex-col justify-end overflow-hidden rounded-sm border ${
                      engineNyala
                        ? "visible border-[#aaa] bg-[#414141]"
                        : "invisible border-transparent bg-transparent"
                    }`}
                    role="img"
                    aria-label={
                      hasilTertahan
                        ? `${t("papan.engineSkor")} ${hasilTertahan.teksSkor}`
                        : undefined
                    }
                  >
                    <div
                      className="w-full bg-[#f4f4f4] transition-[height] duration-300"
                      style={{
                        height: `${(hasilTertahan ? hasilTertahan.poinPutih : 0.5) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="relative min-w-0 flex-1">
                  <PapanTekaTeki
                    fen={fen}
                    orientasi={orientasi}
                    terpilih={terpilih}
                    sasaran={sasaran}
                    kesalahan={kesalahan}
                    langkahAkhir={langkahAkhir}
                    tanda={tanda}
                    panahMesin={panahMesin}
                    ikonLangkah={ikonLangkahAkhir}
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

                <div className="mt-3 border-t border-[#d8d8d8] pt-3">
                  {/* Tombol navigasi utama */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={keAwal}
                      disabled={!riwayat.length}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40"
                      title={t("papan.keAwal")}
                      aria-label={t("papan.keAwal")}
                    >
                      |&lt;
                    </button>
                    <button
                      type="button"
                      onClick={undo}
                      disabled={!riwayat.length}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40"
                      title={t("papan.mundur")}
                      aria-label={t("papan.mundur")}
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      onClick={redo}
                      disabled={riwayat.length >= riwayatLengkap.length}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40"
                      title={t("papan.maju")}
                      aria-label={t("papan.maju")}
                    >
                      &gt;
                    </button>
                    <button
                      type="button"
                      onClick={keAkhir}
                      disabled={riwayat.length >= riwayatLengkap.length}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40"
                      title={t("papan.keAkhir")}
                      aria-label={t("papan.keAkhir")}
                    >
                      &gt;|
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientasi((o) => (o === "w" ? "b" : "w"))}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9]"
                      title={t("papan.flip")}
                      aria-label={t("papan.flip")}
                    >
                      {t("papan.flip")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTampilSetting(!tampilSetting)}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9]"
                      title={t("papan.pengaturan")}
                      aria-label={t("papan.pengaturan")}
                    >
                      ⚙️
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9]"
                      title={t("papan.resetPapan")}
                    >
                      {t("papan.reset")}
                    </button>
                    <select
                      value={pilihan}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setPilihan(id);
                        const item = daftarPilih.rata[id];
                        if (item) muatJalur(item.entri);
                      }}
                      aria-label={t("papan.pilihPembukaan")}
                      className="max-w-[120px] border border-[#b8b8b8] bg-white px-2 py-1.5 text-xs text-[#333] outline-none focus:border-[#3977b9]"
                      title={t("papan.pilihPembukaan")}
                    >
                      <option value={-1}>{t("papan.pilihPembukaan")}</option>
                      {daftarPilih.kelompok.map((g) => (
                        <optgroup key={g.nama} label={g.nama}>
                          {g.daftar.map((entri) => (
                            <option
                              key={daftarPilih.idDari.get(entri)}
                              value={daftarPilih.idDari.get(entri)}
                            >
                              {entri.nama}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Popup pengaturan */}
                  {tampilSetting && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                      onClick={() => setTampilSetting(false)}
                    >
                      <div
                        className="w-full max-w-sm rounded-lg bg-white p-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-lg font-bold text-[#333]">{t("papan.pengaturanPapan")}</h3>
                          <button
                            type="button"
                            onClick={() => setTampilSetting(false)}
                            className="text-slate-400 transition hover:text-slate-600"
                            title={t("papan.tutup")}
                            aria-label={t("papan.tutup")}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-600">
                              {t("papan.setBidak")}
                            </label>
                            <select
                              value={setBidak}
                              onChange={(e) => setSetBidak(e.target.value)}
                              className="border border-[#bcbcbc] bg-white px-3 py-2 text-sm text-[#333] outline-none focus:border-[#3977b9]"
                            >
                              {DAFTAR_SET.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.nama}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="warna-papan" className="text-sm font-semibold text-slate-600">{t("papan.warnaPapan")}</label>
                            <select
                              id="warna-papan"
                              value={warnaPapan}
                              onChange={(e) => setWarnaPapan(e.target.value)}
                              className="border border-[#bcbcbc] bg-white px-3 py-2 text-sm text-[#333] outline-none focus:border-[#3977b9]"
                            >
                              {PILIHAN_WARNA_PAPAN.map(([nilai, kunci]) => <option key={nilai} value={nilai}>{t(kunci)}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setTampilSetting(false)}
                            className="rounded border border-[#3977b9] bg-[#3977b9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2d5f8f]"
                          >
                            {t("papan.tutup")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input FEN */}
                  <div className="mt-3 border-t border-[#d8d8d8] pt-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-500">{t("papan.posisiFen")}</label>
                      <div className="flex gap-1.5">
                        <div className="flex-1 min-w-0 overflow-x-auto border border-[#bcbcbc] bg-white px-2 py-1.5">
                          <span className="font-mono text-[11px] text-[#333] whitespace-nowrap">
                            {fen}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={salinFen}
                          className="border border-[#b8b8b8] bg-[#f7f7f7] px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9]"
                        >
                          {fenTersalin ? t("papan.tersalinSingkat") : t("papan.salin")}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Daftar langkah (PGN) */}
                  <div className="mt-3 border-t border-[#d8d8d8] pt-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-500">{t("papan.daftarLangkahPgn")}</label>
                      <div className="flex gap-1.5">
                        <div className="flex-1 min-w-0 overflow-x-auto border border-[#bcbcbc] bg-white px-2 py-1.5">
                          <span className="font-mono text-[11px] text-[#333] whitespace-nowrap">
                            {riwayat.length ? susunPgn(riwayat) : t("papan.posisiAwal")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={salinPgn}
                          disabled={!riwayat.length}
                          className="border border-[#b8b8b8] bg-[#f7f7f7] px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {pgnTersalin ? t("papan.tersalinSingkat") : t("papan.salin")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t("papan.pembukaan")}
                  </p>
                  {namaUtama ? (
                    <div className="mt-1.5">
                      <p className="text-lg font-bold text-slate-900">
                        {namaUtama[1]}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                          {namaUtama[0]}
                        </span>
                        {jumlahNama > 1 && (
                          <span
                            title={infoPembukaan.nama.map((n) => n[1]).join(" • ")}
                            className="text-xs text-slate-500"
                          >
                            +{jumlahNama - 1} {t("papan.variasi")}
                          </span>
                        )}
                      </div>

                      {statTampil && (
                        <div className="mt-3 border-t border-slate-200 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {t("papan.statistik")}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span>
                              <span className="font-bold text-slate-800">
                                {formatAngka(statTampil.games, bahasa)}
                              </span>{" "}
                              {t("papan.partai")}
                            </span>
                            {typeof statTampil.rating === "number" && (
                              <span>
                                {t("papan.ratingRata")}{" "}
                                <span className="font-bold text-slate-800">
                                  {formatAngka(statTampil.rating, bahasa)}
                                </span>
                              </span>
                            )}
                          </div>

                          {(statTampil.putih !== null ||
                            statTampil.hitam !== null) && (
                            <>
                              <div
                                className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-200"
                                role="img"
                                aria-label={t("papan.statistik")}
                              >
                                {statTampil.putih !== null && (
                                  <div
                                    style={{ width: `${statTampil.putih * 100}%` }}
                                    className="bg-slate-800"
                                  />
                                )}
                                {statTampil.seri !== null && (
                                  <div
                                    style={{ width: `${statTampil.seri * 100}%` }}
                                    className="bg-slate-400"
                                  />
                                )}
                                {statTampil.hitam !== null && (
                                  <div
                                    style={{ width: `${statTampil.hitam * 100}%` }}
                                    className="bg-slate-500"
                                  />
                                )}
                              </div>

                              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                                {statTampil.putih !== null && (
                                  <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-slate-800" />
                                    {t("papan.menangPutih")}{" "}
                                    {formatPersen(statTampil.putih, bahasa)}%
                                  </span>
                                )}
                                {statTampil.seri !== null && (
                                  <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                                    {t("papan.seri")}{" "}
                                    {formatPersen(statTampil.seri, bahasa)}%
                                  </span>
                                )}
                                {statTampil.hitam !== null && (
                                  <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-slate-500" />
                                    {t("papan.menangHitam")}{" "}
                                    {formatPersen(statTampil.hitam, bahasa)}%
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <KartuArtikelPembukaan
                        nama={namaUtama[1]}
                        artikel={artikelPembukaan}
                        t={t}
                      />
                    </div>
                  ) : (
                    <p className="mt-1.5 text-sm font-medium text-slate-600">
                      {infoPembukaan.cocok && !riwayat.length
                        ? t("papan.petunjukAwal")
                        : t("papan.belumAdaNama")}
                    </p>
                  )}

                  {!infoPembukaan.cocok && (
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      {t("papan.diLuarBuku")}
                    </p>
                  )}

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
                    t={t}
                  />

                  {infoPembukaan.saran.length > 0 && (
                    <div className="mt-5 border-t border-[#d8d8d8] pt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-bold text-[#333]">{t("papan.daftarLangkah")}</p>
                        <span className="text-xs text-[#666]">{t("papan.basisData")}</span>
                      </div>
                      <LangkahExplorer langkah={infoPembukaan.saran} bahasa={bahasa} onPilih={mainkanSan} t={t} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sumber data di tengah halaman */}
          <div className="mt-8 text-center">
            <p 
              className="text-xs leading-6 text-slate-400"
              dangerouslySetInnerHTML={{ __html: t("papan.sumber") }}
            />
          </div>
          </section>
        </div>
      </main>
    </>
  );
}

/** Paragraf ringkasan artikel; hanya dua paragraf pertama yang tampil
 *  sebelum pengguna menekan tombol "selengkapnya". */
function ParagrafArtikel({ teks, penuh }) {
  const paragraf = useMemo(
    () => String(teks || "").split(/\n+/).filter((p) => p.trim()),
    [teks]
  );
  const tampil = penuh ? paragraf : paragraf.slice(0, 2);
  return (
    <>
      {tampil.map((p, i) => (
        <p key={i} className="m-0 mb-1.5 text-xs leading-5 text-[#555] last:mb-0">
          {p}
        </p>
      ))}
    </>
  );
}

/**
 * Kartu "Tentang Pembukaan Ini" — ringkasan dari Wikibooks Chess Opening
 * Theory yang berganti otomatis mengikuti pembukaan aktif di papan.
 */
function KartuArtikelPembukaan({ nama, artikel, t }) {
  const [penuh, setPenuh] = useState(false);
  useEffect(() => {
    setPenuh(false);
  }, [nama]);

  if (!artikel) return null;
  const data = artikel.data;
  const jumlahParagraf = data
    ? String(data.ringkasan || "").split(/\n+/).filter((p) => p.trim()).length
    : 0;

  return (
    <div className="mt-3 border-t border-[#d8d8d8] pt-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t("papan.artikelJudul")}
      </p>

      {artikel.status === "memuat" ? (
        <div
          className="mt-2 animate-pulse"
          role="status"
          aria-label={t("papan.artikelMemuat")}
        >
          <div className="h-3 w-2/5 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-full rounded bg-slate-200" />
          <div className="mt-1.5 h-3 w-11/12 rounded bg-slate-200" />
          <div className="mt-1.5 h-3 w-3/5 rounded bg-slate-200" />
        </div>
      ) : artikel.status === "siap" && data ? (
        <div className="mt-2">
          <p className="m-0 text-sm font-bold text-[#333]">{data.judul}</p>
          <div className="mt-1.5 flex items-start gap-3">
            {data.gambar && (
              <img
                src={data.gambar}
                alt=""
                width={72}
                height={72}
                loading="lazy"
                className="h-[72px] w-[72px] shrink-0 border border-[#d8d8d8] bg-white object-cover"
              />
            )}
            <div className="min-w-0">
              <ParagrafArtikel teks={data.ringkasan} penuh={penuh} />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">
              Wikibooks · {data.bahasa.toUpperCase()} · CC BY-SA
              {data.terjemahanOtomatis &&
                ` · ${t("papan.artikelOtomatis")}`}
            </span>
            <span className="flex items-center gap-3">
              {jumlahParagraf > 2 && (
                <button
                  type="button"
                  onClick={() => setPenuh((v) => !v)}
                  className="text-xs font-semibold text-[#1d5f9e] hover:underline"
                >
                  {penuh
                    ? t("papan.artikelRingkas")
                    : t("papan.artikelSelengkapnya")}
                </button>
              )}
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#1d5f9e] hover:underline"
              >
                {t("papan.artikelBaca")} ↗
              </a>
            </span>
          </div>
        </div>
      ) : (
        <p className="m-0 mt-1.5 text-xs text-slate-500">
          {t("papan.artikelKosong")}
        </p>
      )}
    </div>
  );
}

function LangkahExplorer({ langkah, bahasa, onPilih, t }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[510px] border-collapse text-left text-xs text-[#333]">
        <thead className="bg-[#e8e8e8] text-[#333]">
          <tr>
            <th className="border-b border-[#cfcfcf] px-3 py-2 font-bold">{t("papan.kolomLangkah")}</th>
            <th className="border-b border-[#cfcfcf] px-3 py-2 font-bold">{t("papan.kolomJumlah")}</th>
            <th className="border-b border-[#cfcfcf] px-3 py-2 font-bold">{t("papan.kolomPersen")}<br /><span className="font-normal">{t("papan.kolomPutihSeriHitam")}</span></th>
            <th className="border-b border-[#cfcfcf] px-3 py-2 font-bold">{t("papan.pembukaan")}</th>
          </tr>
        </thead>
        <tbody>
          {langkah.map((item) => {
            const stat = item.stat;
            return (
              <tr key={item.k} className="border-b border-[#e1e1e1] last:border-b-0 hover:bg-[#f7f7f7]">
                <td className="px-3 py-2 align-top">
                  <button type="button" onClick={() => onPilih(item.san)} className="font-bold text-[#1d5f9e] hover:underline">{item.san}</button>
                </td>
                <td className="px-3 py-2 align-top tabular-nums">{stat ? formatAngka(stat.games, bahasa) : "—"}</td>
                <td className="min-w-[145px] px-3 py-2 align-top">
                  {stat ? <HasilBar stat={stat} bahasa={bahasa} /> : "—"}
                </td>
                <td className="px-3 py-2 align-top text-[#666]">{item.nama || "—"}</td>
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
    <div className="flex h-2 w-full overflow-hidden border border-[#aaa] bg-white">
      <span style={{ width: `${putih * 100}%` }} className="bg-[#f4f4f4]" />
      <span style={{ width: `${seri * 100}%` }} className="bg-[#aaa]" />
      <span style={{ width: `${hitam * 100}%` }} className="bg-[#414141]" />
    </div>
    <div className="mt-1 whitespace-nowrap text-[10px] text-[#555]">{formatPersen(putih, bahasa)}% / {formatPersen(seri, bahasa)}% / {formatPersen(hitam, bahasa)}%</div>
  </>;
}


