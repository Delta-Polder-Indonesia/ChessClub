import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Chess } from "chess.js";
import Hero from "../../components/Hero.jsx";
import { PageSelanjutnya } from "../../components/PageBagian.jsx";
import { SettingsIcon, ShuffleIcon } from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece, DAFTAR_SET } from "../../components/chess/ChessPiece.jsx";
import PapanTekaTeki from "./PapanTekaTeki.jsx";

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
const KUNCI_SUSAH = {
  "Mate in One": "mudah",
  "Mate in Two": "menengah",
  "Mate in Three": "sulit",
};

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
  win: "bg-emerald-100 text-emerald-800",
  "cursed-win": "bg-lime-100 text-lime-800",
  draw: "bg-slate-200 text-slate-700",
  "blessed-loss": "bg-amber-100 text-amber-800",
  loss: "bg-red-100 text-red-800",
  unknown: "bg-slate-100 text-slate-600",
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
  return "hijau";
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

  // Sedang menyeret bidak (klik kiri tahan). Klik kanan membatalkan.
  const [sedangSeret, setSedangSeret] = useState(false);
  const abaikanKlikRef = useRef(false);

  // Bidak sampai di baris terakhir → pemain wajib memilih bidak promosi.
  const [promosi, setPromosi] = useState(null); // { from, to, warna }

  const timerSalah = useRef(null);
  const timerOtomatis = useRef(null);

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
        const daftar = data.problems || [];
        if (!daftar.length) throw new Error("data kosong");
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
          if (aktif) setSyzygy(data);
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
  }, []);

  const pindahSoal = useCallback(
    (indeksBaru) => {
      if (!soal || !soal.length) return;
      const total = soal.length;
      const idx = ((indeksBaru % total) + total) % total;
      const m = soal[idx];
      setIndeks(idx);
      terapkanSoal(m);
      setParams({ id: String(m.problemid) }, { replace: true });
      simpanPosisi(m.problemid);
    },
    [soal, terapkanSoal, setParams, simpanPosisi]
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
    if (!masalah || !fen || komputer) return;
    // Klik sisa setelah drag-drop atau klik-kanan-batal tidak boleh jadi langkah.
    if (abaikanKlikRef.current) {
      abaikanKlikRef.current = false;
      return;
    }

    if (tanda.panah.length > 0 || Object.keys(tanda.petak).length > 0) {
      hapusSemuaTanda();
    }

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

    if (butuhPromosi && !promo) {
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
    } else if (from === diharapkan.from && to === diharapkan.to) {
      try {
        lanjut = terapkan(fen, { from, to, promo: promo || diharapkan.promo });
      } catch {}
    }

    if (!lanjut) {
      window.clearTimeout(timerSalah.current);
      setPesan({ jenis: "salah", teks: t("tekaTeki.salah") });
      setKesalahan({ from, to });
      setTerpilih(null);
      setSasaran([]);
      timerSalah.current = window.setTimeout(() => setKesalahan(null), 700);
      return;
    }

    const sisaBaru = sisa.slice(1);
    setFen(lanjut.fen());
    setJalurFen((l) => [...l, lanjut.fen()]);
    setSisa(sisaBaru);
    setLangkahAkhir({ from, to });
    setTerpilih(null);
    setSasaran([]);
    setPetunjuk(null);
    setKesalahan(null);

    if (sisaBaru.length === 0) {
      setSelesai(true);
      setPesan({ jenis: "selesai", teks: t("tekaTeki.terpecahkan") });
      catatTerpecahkan(masalah.problemid);
      if (otomatis) {
        window.clearTimeout(timerOtomatis.current);
        timerOtomatis.current = window.setTimeout(() => {
          pindahSoal(indeks + 1);
        }, 1200);
      }
    } else {
      setPesan({ jenis: "benar", teks: t("tekaTeki.benar") });
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
        setFen(g.fen());
        setJalurFen((l) => [...l, g.fen()]);
        setLangkahAkhir({ from: diharapkan.from, to: diharapkan.to });
      } catch {}
      setSisa((s) => s.slice(1));
      setKomputer(false);
      setPesan(null);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [komputer, fen, sisa, selesai]);

  function tampilPetunjuk() {
    if (!sisa.length || selesai) return;
    const d = parseLangkah(sisa[0]);
    setPetunjuk({ from: d.from, to: d.to });
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

  /** |< — kembali ke posisi awal soal. */
  function keAwalLangkah() {
    if (!masalah || komputer) return;
    terapkanSoal(masalah);
  }

  /** < — mundur satu langkah. */
  function mundurLangkah() {
    if (!langkahPenuh.length || komputer || promosi) return;
    const posisi = Math.max(0, langkahPenuh.length - sisa.length);
    if (posisi <= 0) return;
    const baru = posisi - 1;
    setFen(jalurFen[baru]);
    setSisa(langkahPenuh.slice(baru));
    setJalurFen((l) => l.slice(0, baru + 1));
    setSelesai(false);
    setKomputer(false);
    tutupBantu();
    if (baru >= 1) {
      const p = parseLangkah(langkahPenuh[baru - 1]);
      setLangkahAkhir({ from: p.from, to: p.to });
    } else {
      setLangkahAkhir(null);
    }
  }

  /** > — maju satu langkah mengikuti jalur solusi. */
  function majuLangkah() {
    if (!langkahPenuh.length || komputer || promosi) return;
    const posisi = Math.max(0, langkahPenuh.length - sisa.length);
    if (posisi >= langkahPenuh.length) return;
    const d = parseLangkah(langkahPenuh[posisi]);
    try {
      const g = terapkan(fen, d);
      const fenBaru = g.fen();
      setFen(fenBaru);
      setSisa(langkahPenuh.slice(posisi + 1));
      setJalurFen((l) => [...l.slice(0, posisi), fenBaru]);
      setLangkahAkhir({ from: d.from, to: d.to });
      setSelesai(false);
      setKomputer(false);
      tutupBantu();
    } catch {}
  }

  /** >| — maju sampai posisi akhir solusi. */
  function keAkhirLangkah() {
    if (!langkahPenuh.length || komputer || promosi) return;
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
    setSelesai(false);
    setKomputer(false);
    tutupBantu();
  }

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

  /** Label dwibahasa kategori Syzygy — mentah bila kategori di luar kamus. */
  function teksKategoriSyzygy(kat) {
    const hasil = t(`tekaTeki.syzygyKat.${kat}`);
    return hasil === `tekaTeki.syzygyKat.${kat}` ? kat : hasil;
  }

  return (
    <>
      <Hero
        title={t("tekaTeki.judul")}
        description={t("tekaTeki.deskripsi")}
        crumbs={crumbs}
      />

      <main className="px-6 md:px-8">
        <div className="mx-auto max-w-[1024px] py-10 md:py-16">
          {gagal ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {t("tekaTeki.gagalMuat")}
            </p>
          ) : !masalah ? (
            <div className="mx-auto max-w-[560px]">
              {semuaSoal ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                  {t("tekaTeki.tidakAdaSoal")}
                </p>
              ) : (
                <>
                  <p className="mb-6 text-sm text-slate-500">
                    {t("tekaTeki.memuat")}
                  </p>
                  <KerangkaTekaTeki />
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="mx-auto w-full max-w-[520px] shrink-0 lg:mx-0">
                <div className="relative">
                  <PapanTekaTeki
                    fen={fen}
                    orientasi={orientasi}
                    terpilih={terpilih}
                    sasaran={sasaran}
                    petunjuk={petunjuk}
                    kesalahan={kesalahan}
                    langkahAkhir={langkahAkhir}
                    tanda={tanda}
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

                {/* Tombol navigasi di bawah papan catur */}
                <div className="relative mt-3 border-t border-[#d8d8d8] pt-3">
                  <div className="flex flex-nowrap items-center justify-start gap-1.5 overflow-x-auto sm:justify-center">
                    <button
                      type="button"
                      onClick={pilihAcak}
                      title={t("tekaTeki.acak")}
                      aria-label={t("tekaTeki.acak")}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9]"
                    >
                      <ShuffleIcon />
                    </button>
                    <button
                      type="button"
                      onClick={keAwalLangkah}
                      disabled={komputer || posisiLangkah <= 0}
                      title={t("papan.keAwal")}
                      aria-label={t("papan.keAwal")}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      |&lt;
                    </button>
                    <button
                      type="button"
                      onClick={mundurLangkah}
                      disabled={komputer || posisiLangkah <= 0}
                      title={t("papan.mundur")}
                      aria-label={t("papan.mundur")}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtomatis((v) => !v)}
                      title={
                        otomatis
                          ? t("tekaTeki.otomatisMatikan")
                          : t("tekaTeki.otomatisNyalakan")
                      }
                      aria-label={
                        otomatis
                          ? t("tekaTeki.otomatisMatikan")
                          : t("tekaTeki.otomatisNyalakan")
                      }
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9]"
                    >
                      {otomatis ? "⏸" : "▶"}
                    </button>
                    <button
                      type="button"
                      onClick={majuLangkah}
                      disabled={komputer || posisiLangkah >= langkahPenuh.length}
                      title={t("papan.maju")}
                      aria-label={t("papan.maju")}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      &gt;
                    </button>
                    <button
                      type="button"
                      onClick={keAkhirLangkah}
                      disabled={komputer || posisiLangkah >= langkahPenuh.length}
                      title={t("papan.keAkhir")}
                      aria-label={t("papan.keAkhir")}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40"
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
                      Flip
                    </button>
                    <button
                      type="button"
                      onClick={tampilPetunjuk}
                      disabled={selesai || !sisa.length}
                      className="border border-[#b8b8b8] bg-[#f7f7f7] px-2 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40"
                      title={t("tekaTeki.petunjuk")}
                      aria-label={t("tekaTeki.petunjuk")}
                    >
                      💡
                    </button>
                    <button
                      type="button"
                      onClick={() => setBukaPengaturan((v) => !v)}
                      title={t("tekaTeki.pengaturan")}
                      aria-label={t("tekaTeki.pengaturan")}
                      aria-expanded={bukaPengaturan}
                      className={`border border-[#b8b8b8] px-2 py-1.5 text-xs font-semibold text-[#333] transition ${
                        bukaPengaturan
                          ? "bg-[#e9e9e9]"
                          : "bg-[#f7f7f7] hover:bg-[#e9e9e9]"
                      }`}
                    >
                      <SettingsIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => pindahSoal(indeks + 1)}
                      title={
                        selesai
                          ? t("tekaTeki.selanjutnya")
                          : t("tekaTeki.lewati")
                      }
                      aria-label={
                        selesai
                          ? t("tekaTeki.selanjutnya")
                          : t("tekaTeki.lewati")
                      }
                      className="shrink-0 whitespace-nowrap border border-[#b8b8b8] bg-white px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9]"
                    >
                      {selesai
                        ? t("tekaTeki.selanjutnya")
                        : t("tekaTeki.lewati")}
                    </button>
                  </div>

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
                        aria-label={t("tekaTeki.pengaturan")}
                        className="absolute bottom-full left-1/2 z-50 mb-2 w-64 max-w-[90vw] -translate-x-1/2 rounded-lg bg-white p-4 shadow-xl ring-1 ring-black/10"
                      >
                        <p className="mb-3 text-sm font-bold text-slate-800">
                          {t("tekaTeki.pengaturan")}
                        </p>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-3">
                            <label htmlFor="saring-level" className="text-xs font-semibold text-slate-500">{t("tekaTeki.labelLevel")}</label>
                            <select
                              id="saring-level"
                              value={filterLevel}
                              onChange={(e) => setFilterLevel(e.target.value)}
                              className="w-36 shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="semua">{t("tekaTeki.semuaLevel")}</option>
                              <option value="1">1 · {t("tekaTeki.sangatMudah")}</option>
                              <option value="2">2 · {t("tekaTeki.mudah")}</option>
                              <option value="3">3 · {t("tekaTeki.normal")}</option>
                              <option value="4">4 · {t("tekaTeki.sulit")}</option>
                              <option value="5">5 · {t("tekaTeki.sangatSulit")}</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <label htmlFor="saring-langkah" className="text-xs font-semibold text-slate-500">{t("tekaTeki.labelLangkah")}</label>
                            <select
                              id="saring-langkah"
                              value={
                                filterTipe === "Mate in One"
                                  ? "1"
                                  : filterTipe === "Mate in Two"
                                    ? "2"
                                    : filterTipe === "Mate in Three"
                                      ? "3"
                                      : "semua"
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                setFilterTipe(
                                  v === "1"
                                    ? "Mate in One"
                                    : v === "2"
                                      ? "Mate in Two"
                                      : v === "3"
                                        ? "Mate in Three"
                                        : "semua"
                                );
                              }}
                              className="w-36 shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="semua">{t("tekaTeki.semua")}</option>
                              <option value="1">{t("tekaTeki.langkahSatu")}</option>
                              <option value="2">{t("tekaTeki.langkahDua")}</option>
                              <option value="3">{t("tekaTeki.langkahTiga")}</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <label htmlFor="saring-tema" className="text-xs font-semibold text-slate-500">{t("tekaTeki.labelTema")}</label>
                            <select
                              id="saring-tema"
                              value={filterTema}
                              onChange={(e) => setFilterTema(e.target.value)}
                              className="w-36 shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="semua">{t("tekaTeki.semuaTema")}</option>
                              {DAFTAR_TEMA.map((g) => (
                                <optgroup key={g.grup} label={t(g.grup)}>
                                  {g.isi.map(([nilai, kunci]) => (
                                    <option key={nilai} value={nilai}>
                                      {t(kunci)}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <label htmlFor="saring-giliran" className="text-xs font-semibold text-slate-500">{t("tekaTeki.labelGiliran")}</label>
                            <select
                              id="saring-giliran"
                              value={filterGiliran}
                              onChange={(e) => setFilterGiliran(e.target.value)}
                              className="w-36 shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            >
                              <option value="semua">{t("tekaTeki.semuaGiliran")}</option>
                              <option value="White to Move">{t("tekaTeki.hanyaPutih")}</option>
                              <option value="Black to Move">{t("tekaTeki.hanyaHitam")}</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <label htmlFor="pilih-set-bidak" className="text-xs font-semibold text-slate-500">{t("tekaTeki.labelBidak")}</label>
                            <select
                              id="pilih-set-bidak"
                              value={setBidak}
                              onChange={(e) => setSetBidak(e.target.value)}
                              className="w-32 shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            >
                              {DAFTAR_SET.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.nama}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <label htmlFor="warna-papan" className="text-xs font-semibold text-slate-500">{t("papan.warnaPapan")}</label>
                            <select
                              id="warna-papan"
                              value={warnaPapan}
                              onChange={(e) => setWarnaPapan(e.target.value)}
                              className="w-32 shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            >
                              {PILIHAN_WARNA_PAPAN.map(([nilai, kunci]) => (
                                <option key={nilai} value={nilai}>
                                  {t(kunci)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="m-0 text-base font-bold text-slate-950 md:text-lg">
                    {t("tekaTeki.soal", {
                      n: masalah.problemid,
                      total: soal.length,
                    })}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`inline-block h-3 w-3 rounded-full ${
                        masalah.first === "White to Move"
                          ? "bg-white ring-1 ring-slate-400"
                          : "bg-slate-800"
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-600">
                      {t(
                        masalah.first === "White to Move"
                          ? "tekaTeki.giliranPutih"
                          : "tekaTeki.giliranHitam"
                      )}
                    </span>
                    <span className="rounded px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {t(`tekaTeki.${KUNCI_TIPE[masalah.type]}`)}
                    </span>
                    <span className="rounded px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {t(`tekaTeki.${KUNCI_SUSAH[masalah.type]}`)}
                    </span>
                  </div>
                </div>

                {pesan?.jenis === "benar" && (
                  <div aria-live="polite" className="mt-4">
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                      {pesan.teks}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <form onSubmit={bukaNomor} className="flex items-center gap-2">
                    <input
                      id="nomor-soal"
                      type="number"
                      min={1}
                      max={soal.length}
                      value={nomorSoal}
                      onChange={(e) => setNomorSoal(e.target.value)}
                      placeholder={`1–${soal.length}`}
                      className="w-24 min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {t("tekaTeki.buka")}
                    </button>
                  </form>

                  {pesan?.jenis === "salah" ? (
                    <p
                      role="status"
                      className="text-sm font-semibold text-red-600"
                    >
                      {pesan.teks}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      {t("tekaTeki.totalTerpecahkan", { n: terpecahkan.size })}
                    </p>
                  )}

                  {galatNomor && (
                    <p role="alert" className="text-xs font-medium text-red-600">
                      {galatNomor}
                    </p>
                  )}
                </div>

                {/* Syzygy Tablebase */}
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Syzygy Tablebase</h3>
                    <span className="text-xs text-slate-500">{t("tekaTeki.syzygyDidukung")}</span>
                  </div>

                  {!fen ? null : syzygyGagal ? (
                    <p className="text-sm text-amber-700">
                      {t("tekaTeki.syzygyGagal")}
                    </p>
                  ) : !syzygy ? (
                    <p className="text-sm text-slate-500">{t("tekaTeki.syzygyMenganalisis")}</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            PETA_KELAS_SYZYGY[syzygy.category] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {teksKategoriSyzygy(syzygy.category)}
                        </span>
                        <span className="text-xs text-slate-600">
                          DTZ: {syzygy.dtz ?? "-"}
                        </span>
                        <span className="text-xs text-slate-600">
                          DTM: {syzygy.dtm ?? "-"}
                        </span>
                        <a
                          href={`https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {t("tekaTeki.syzygyDetail")}
                        </a>
                      </div>

                      {Array.isArray(syzygy.moves) && syzygy.moves.length > 0 && (
                        <ul className="mt-2 max-h-72 divide-y divide-slate-100 overflow-y-auto pr-1">
                          {syzygy.moves.map((m) => (
                            <li
                              key={m.san}
                              className="flex items-center justify-between gap-2 py-1.5"
                            >
                              <span className="font-mono text-xs font-semibold text-slate-800">
                                {m.san}
                              </span>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  PETA_KELAS_SYZYGY[m.category] ||
                                  "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {teksKategoriSyzygy(m.category)}
                                {typeof m.dtz === "number" ? ` · DTZ ${m.dtz}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="mt-2 text-[11px] leading-4 text-slate-500">
                        {t("tekaTeki.syzygyCatatan")}
                      </p>
                    </>
                  )}
                </div>

                {pesan?.jenis === "selesai" && (
                  <p className="mt-2 text-sm font-bold text-slate-800">
                    {pesan.teks}
                  </p>
                )}

                {sudahPecah && !pesan && (
                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                    {t("tekaTeki.sudahTerpecahkan")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sumber data di tengah halaman */}
        <div className="mt-8 text-center">
          <p 
            className="text-xs leading-6 text-slate-400"
            dangerouslySetInnerHTML={{ __html: t("tekaTeki.sumber") }}
          />
        </div>
      </main>

      <PageSelanjutnya
        to="/program-kami/sekolah-catur/cara-bermain-catur"
        judul={t("tekaTeki.selanjutnyaJudul")}
      />
    </>
  );
}