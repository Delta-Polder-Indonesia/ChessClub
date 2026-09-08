import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { Chess } from "chess.js";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece, DAFTAR_SET } from "../../components/chess/ChessPiece.jsx";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";
import { gunakanSuara, SUARA } from "../../lib/suara.js";
import { ambilPeringkatRush, kirimSkorRush } from "../../lib/api/rekorRush.js";

const KUNCI_USERNAME = "kci-rush-username";

/* ------------------------------------------------------------------ data */

const KUNCI_BEST = "kci-rush-teka-teki-terbaik";
const KUNCI_SET = "kci-teka-teki-set-bidak";
const KUNCI_WARNA = "kci-teka-teki-warna-papan";


const DURASI = [3, 5];
const NYAWA_AWAL = 3;

/** Seluruh pilihan warna papan + kunci label (sama dgn halaman Teka-Teki). */
const PILIHAN_WARNA = [
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

/** Langkah data "c4-c8" / "e7-e8q" → { from, to, promo }. */
function parseLangkah(teks) {
  return {
    from: teks.slice(0, 2),
    to: teks.slice(3, 5),
    promo: teks.length > 5 ? teks[5] : null,
  };
}

/** Terapkan satu langkah ke posisi; bidak pion ke baris terakhir → promosi. */
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

/** Tampilkan detik sebagai menit:detik (mis. "04:32"). */
function formatWaktu(totalDetik) {
  const m = Math.floor(totalDetik / 60);
  const d = totalDetik % 60;
  return `${String(m).padStart(2, "0")}:${String(d).padStart(2, "0")}`;
}

/* -------------------------------------------------------- skor anti-cheat
 * Skor dibungkus bersama nilai acak + tanggal + sidik (segel). Saat dibaca
 * lagi, bila sidik/campuran tidak cocok maka dianggap rusak (nilai 0). Ini
 * membuat pemain tidak bisa sekadar mengetik skor besar di localStorage.
 */
function bacaBungkus(kunci) {
  try {
    const mentah = localStorage.getItem(kunci);
    if (!mentah) return 0;
    const { n, c } = JSON.parse(mentah);
    const bilangan = Number(n) || 0;
    if (Number(c) !== (bilangan ^ 0x5a17) >>> 0) return 0;
    return bilangan;
  } catch {
    return 0;
  }
}

function bacaTerbaik() {
  return bacaBungkus(KUNCI_BEST);
}

function simpanBungkus(kunci, nilai) {
  try {
    const bilangan = Math.max(0, Math.floor(Number(nilai) || 0));
    const c = (bilangan ^ 0x5a17) >>> 0;
    localStorage.setItem(kunci, JSON.stringify({ n: bilangan, c }));
  } catch {
    /* abaikan */
  }
}

function bacaSetBidak() {
  try {
    const simpan = localStorage.getItem(KUNCI_SET);
    if (simpan && DAFTAR_SET.some((s) => s.id === simpan)) return simpan;
  } catch {
    /* abaikan */
  }
  return "merida";
}

function bacaWarnaPapan() {
  try {
    const simpan = localStorage.getItem(KUNCI_WARNA);
    if (simpan && PILIHAN_WARNA.some(([nilai]) => nilai === simpan))
      return simpan;
  } catch {
    /* abaikan */
  }
  return "green";
}

function bacaUsername() {
  try {
    return (localStorage.getItem(KUNCI_USERNAME) || "").trim();
  } catch {
    return "";
  }
}

/** Pilihan bidak promosi + kunci terjemahan (sama dgn halaman Teka-Teki). */
const PILIHAN_PROMOSI = ["q", "r", "b", "n"];
const KUCI_NAMA_PROMOSI = {
  q: "tekaTeki.promosiMenteri",
  r: "tekaTeki.promosiBenteng",
  b: "tekaTeki.promosiGajah",
  n: "tekaTeki.promosiKuda",
};

/** Tombol sakelar suara (ikon on/off). */
function TombolSuara({ nyala, onKlik, label }) {
  return (
    <button
      type="button"
      onClick={onKlik}
      aria-pressed={nyala}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition hover:bg-[#262421] hover:text-white"
    >
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        {nyala ? (
          <path
            d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M16 9l5 6M21 9l-5 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}

/** Panel papan peringkat online (baca). Menampilkan offline bila backend tak terjangkau. */
function PapanPeringkat({ durasi, segar }) {
  const { t } = useI18n();
  const [state, setState] = useState("memuat"); // memuat|siap|kosong|offline
  const [baris, setBaris] = useState([]);

  useEffect(() => {
    let aktif = true;
    setState("memuat");
    ambilPeringkatRush(durasi)
      .then((d) => {
        if (!aktif) return;
        const peringkat = Array.isArray(d?.peringkat) ? d.peringkat : [];
        setBaris(peringkat);
        setState(peringkat.length ? "siap" : "kosong");
      })
      .catch(() => {
        if (aktif) setState("offline");
      });
    return () => {
      aktif = false;
    };
  }, [durasi, segar]);

  const isi =
    state === "memuat" ? (
      <p className="px-1 py-4 text-sm text-slate-500">{t("tekaTekiRush.muatPeringkat")}</p>
    ) : state === "offline" ? (
      <p className="px-1 py-4 text-sm leading-relaxed text-slate-500">
        {t("tekaTekiRush.peringkatOffline")}
      </p>
    ) : state === "kosong" ? (
      <p className="px-1 py-4 text-sm text-slate-500">{t("tekaTekiRush.peringkatKosong")}</p>
    ) : (
      <ol className="flex flex-col gap-1">
        {baris.slice(0, 10).map((b) => (
          <li
            key={b.username}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
          >
            <span className="w-5 text-center font-bold tabular-nums text-slate-500">
              {b.peringkat}
            </span>
            <span className="min-w-0 flex-1 truncate text-slate-200">{b.username}</span>
            <span className="font-bold tabular-nums text-[#81b64c]">{b.skor}</span>
          </li>
        ))}
      </ol>
    );

  return (
    <div className="border-b border-[#312e2b] px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {t("tekaTekiRush.papanPeringkat")}
        </span>
        <span className="text-[11px] font-semibold text-slate-400">{durasi}′</span>
      </div>
      <div className="mt-2">{isi}</div>
    </div>
  );
}

/* ================================================================== page */

export default function TekaTekiRush() {
  const { t } = useI18n();
  const { nyala: suaraNyala, setNyala, mainkan, mainkanLangkah } = gunakanSuara();

  // Preferensi papan — dibagi dengan halaman Teka-Teki & Papan Interaktif.
  const [setBidak, setSetBidak] = useState(bacaSetBidak);
  const [warnaPapan, setWarnaPapan] = useState(bacaWarnaPapan);

  // Data soal.
  const semuaSoalRef = useRef([]);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [siap, setSiap] = useState(false);

  // Fase layar.
  const [fase, setFase] = useState("pilih");

  const [durasiMenit, setDurasiMenit] = useState(3);
  const [sisaWaktu, setSisaWaktu] = useState(3 * 60);
  const [nyawa, setNyawa] = useState(NYAWA_AWAL);
  const [skor, setSkor] = useState(0);
  const [targetRating, setTargetRating] = useState(800);
  const [riwayat, setRiwayat] = useState([]);
  const [tersegel, setTersegel] = useState(false);

  // Soal aktif.
  const [soal, setSoal] = useState(null);
  const [fen, setFen] = useState("");
  const [sisa, setSisa] = useState([]);
  const [orientasi, setOrientasi] = useState("w");
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [kesalahan, setKesalahan] = useState(null);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [komputer, setKomputer] = useState(false);
  const [transisi, setTransisi] = useState(false);
  const [promo, setPromo] = useState(null);

  const [flash, setFlash] = useState(null);
  const [berakhirKarena, setBerakhirKarena] = useState(null);
  const [rekorBaru, setRekorBaru] = useState(false);
  const [terbaik, setTerbaik] = useState(0);

  // Papan peringkat online.
  const [usernameForm, setUsernameForm] = useState(bacaUsername);
  const [segarRekor, setSegarRekor] = useState(0);
  const [simpanStatus, setSimpanStatus] = useState("idle"); // idle|kirim|ok|galat
  const [simpanPesan, setSimpanPesan] = useState("");

  const usedIdsRef = useRef(new Set());
  const nyawaRef = useRef(NYAWA_AWAL);
  const skorRef = useRef(0);
  const endedRef = useRef(false);
  const terbaikAwalRef = useRef(0);
  const timerRef = useRef(null);
  const delayRef = useRef(null);

  const terkunci = komputer || transisi || !!promo || fase !== "main";

  // Simpan preferensi papan (dibagi dengan halaman lain).
  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_SET, setBidak);
    } catch {
      /* abaikan */
    }
  }, [setBidak]);
  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_WARNA, warnaPapan);
    } catch {
      /* abaikan */
    }
  }, [warnaPapan]);

  /* --------------------------------------------------- muat data teka-teki */
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
        semuaSoalRef.current = daftar;
        setTerbaik(bacaTerbaik());
        setSiap(true);
      })
      .catch(() => {
        if (aktif) setGagalMuat(true);
      });
    return () => {
      aktif = false;
    };
  }, []);

  /* ------------------------------------------------------- judul halaman */
  useEffect(() => {
    document.title = `${t("tekaTekiRush.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  /* ---------------------------------------------------------- pembersihan */
  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      window.clearTimeout(delayRef.current);
    },
    []
  );

  /** Kunci frase akhir berdasarkan skor (gaya PuzzleDash). */
  const teksCapaian = useCallback(
    (n) => {
      if (n < 5) return t("tekaTekiRush.capaiSatu");
      if (n < 10) return t("tekaTekiRush.capaiLima");
      if (n < 20) return t("tekaTekiRush.capaiSepuluh");
      if (n < 30) return t("tekaTekiRush.capaiDuaPuluh");
      return t("tekaTekiRush.capaiTigaPuluh");
    },
    [t]
  );

  /** Akhiri permainan sekali saja. */
  const akhiri = useCallback(
    (karena) => {
      if (endedRef.current) return;
      endedRef.current = true;
      const nilai = skorRef.current;
      setBerakhirKarena(karena);
      // Sembunyikan label "rekor baru" bila sudah ternoda oleh permainan
      // tersegel sebelumnya (best disimpan apa adanya di localStorage).
      const bestLama = terbaikAwalRef.current;
      simpanBungkus(KUNCI_BEST, Math.max(bestLama, nilai));
      setTerbaik((lama) => Math.max(lama, nilai));
      setRekorBaru(nilai >= 1 && nilai > bestLama);
      setFase("selesai");
      mainkan(SUARA.menang);
    },
    [mainkan]
  );

  /** Pilih soal berikutnya: makin sulit & menghindari pengulangan. */
  const pilihSoal = useCallback((tgt) => {
    const semua = semuaSoalRef.current;
    if (!semua.length) return null;
    const lo = tgt - 150;
    const hi = tgt + 150;
    const inginPutih = Math.random() < 0.5;
    const kandidat = semua.filter(
      (p) =>
        p.rating >= lo &&
        p.rating <= hi &&
        !usedIdsRef.current.has(p.problemid) &&
        p.first.startsWith("White") === inginPutih
    );
    let kolam = kandidat;
    if (!kolam.length) {
      kolam = semua.filter(
        (p) => p.rating >= lo && p.rating <= hi && !usedIdsRef.current.has(p.problemid)
      );
    }
    if (!kolam.length) {
      kolam = semua.filter((p) => !usedIdsRef.current.has(p.problemid));
    }
    if (!kolam.length) kolam = semua;
    return kolam[Math.floor(Math.random() * kolam.length)];
  }, []);

  /** Muat soal baru ke papan & reset keadaan satu soal. */
  const muatSoalBerikut = useCallback(
    (tgt) => {
      if (endedRef.current) return;
      const s = pilihSoal(tgt);
      if (!s) {
        akhiri("nyawa");
        return;
      }
      usedIdsRef.current.add(s.problemid);
      setSoal(s);
      setFen(s.fen);
      setSisa(s.moves.split(";"));
      setOrientasi(s.first.toLowerCase().startsWith("black") ? "b" : "w");
      setTerpilih(null);
      setSasaran([]);
      setKesalahan(null);
      setLangkahAkhir(null);
      setPromo(null);
      setKomputer(false);
      setTransisi(false);
      setFlash(null);
    },
    [pilihSoal, akhiri]
  );

  /** Mulai sesi baru (nilai `tercegah` menandai sesi dari menu cepat). */
  const mulai = useCallback(
    (menit) => {
      window.clearTimeout(timerRef.current);
      window.clearTimeout(delayRef.current);
      endedRef.current = false;
      terbaikAwalRef.current = bacaTerbaik();
      usedIdsRef.current = new Set();
      nyawaRef.current = NYAWA_AWAL;
      skorRef.current = 0;
      setDurasiMenit(menit);
      setSisaWaktu(menit * 60);
      setNyawa(NYAWA_AWAL);
      setSkor(0);
      setRiwayat([]);
      setBerakhirKarena(null);
      setRekorBaru(false);
      const mulaiRating = 800;
      setTargetRating(mulaiRating);
      // Sesi berjalan → rekor disegel dengan nilai periksa (anti edit manual).
      setTersegel(true);
      setFase("main");
      muatSoalBerikut(mulaiRating);
      mainkan(SUARA.mulai);
    },
    [muatSoalBerikut, mainkan]
  );

  /* ----------------------------------------------------------- penghitung */
  useEffect(() => {
    if (fase !== "main") return undefined;
    const id = window.setInterval(() => {
      setSisaWaktu((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [fase]);

  useEffect(() => {
    if (fase === "main" && sisaWaktu <= 0) akhiri("waktu");
  }, [sisaWaktu, fase, akhiri]);

  /* --------------------------------------- balasan otomatis si lawan */
  useEffect(() => {
    if (fase !== "main" || !komputer) return undefined;
    if (!sisa.length) {
      setKomputer(false);
      return undefined;
    }
    const langkah = parseLangkah(sisa[0]);
    const tid = window.setTimeout(() => {
      if (endedRef.current) return;
      let g;
      try {
        g = terapkan(fen, langkah);
      } catch {
        setKomputer(false);
        return;
      }
      const lm = g.history({ verbose: true }).slice(-1)[0];
      setFen(g.fen());
      setLangkahAkhir({ from: langkah.from, to: langkah.to });
      setSisa((s) => s.slice(1));
      setKomputer(false);
      setKesalahan(null);
      if (lm) mainkanLangkah(lm, g, { lawan: true });
    }, 460);
    return () => window.clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, komputer, sisa]);

  /** Soal salah: kurangi nyawa & lanjut ke soal berikutnya. */
  const gagalSoal = useCallback(
    (from, to) => {
      const sisaNyawa = nyawaRef.current - 1;
      nyawaRef.current = sisaNyawa;
      setNyawa(sisaNyawa);
      setKesalahan({ from, to });
      setFlash({ jenis: "salah" });
      setTerpilih(null);
      setSasaran([]);
      mainkan(SUARA.tekaTekiSalah);
      setRiwayat((r) => [
        ...r,
        {
          fen: soal?.fen,
          rating: soal?.rating,
          warna: soal?.first.startsWith("White") ? "White" : "Black",
          benar: false,
        },
      ]);
      setTransisi(true);
      delayRef.current = window.setTimeout(() => {
        if (endedRef.current) return;
        if (sisaNyawa <= 0) {
          akhiri("nyawa");
          return;
        }
        muatSoalBerikut(targetRating);
      }, 900);
    },
    [mainkan, soal, akhiri, muatSoalBerikut, targetRating]
  );

  /** Coba satu langkah dari pemain. */
  const cobaLangkah = useCallback(
    (from, to, promoBidak) => {
      if (fase !== "main" || komputer || transisi || !sisa.length || !fen) return;

      const diharapkan = parseLangkah(sisa[0]);

      let butuhPromosi = false;
      let warnaPromosi = "w";
      let legal = false;
      try {
        const papan = new Chess(fen);
        const bidak = papan.get(from);
        if (bidak && bidak.type === "p" && (to.endsWith("8") || to.endsWith("1"))) {
          butuhPromosi = true;
          warnaPromosi = bidak.color;
        }
        legal = papan
          .moves({ square: from, verbose: true })
          .some((m) => m.to === to);
      } catch {
        /* abaikan */
      }

      if (butuhPromosi && legal && !promoBidak) {
        setPromo({ from, to, warna: warnaPromosi });
        setTerpilih(null);
        setSasaran([]);
        return;
      }
      // Langkah ilegal → tidak dikurangi nyawa.
      if (!legal) return;

      const sesuai =
        from === diharapkan.from &&
        to === diharapkan.to &&
        (!diharapkan.promo || promoBidak === diharapkan.promo);

      if (!sesuai) {
        gagalSoal(from, to);
        return;
      }

      let g;
      try {
        g = terapkan(fen, { from, to, promo: promoBidak });
      } catch {
        gagalSoal(from, to);
        return;
      }
      const langkah = g.history({ verbose: true }).slice(-1)[0];
      setFen(g.fen());
      setLangkahAkhir({ from, to });
      setTerpilih(null);
      setSasaran([]);
      setKesalahan(null);
      if (langkah) mainkanLangkah(langkah, g, {});

      const sisaBaru = sisa.slice(1);
      setSisa(sisaBaru);

      if (sisaBaru.length === 0) {
        const nilai = skorRef.current + 1;
        skorRef.current = nilai;
        setSkor(nilai);
        setFlash({ jenis: "benar" });
        setKomputer(false);
        setTransisi(true);
        mainkan(SUARA.tekaTekiTuntas);
        setRiwayat((r) => [
          ...r,
          {
            fen: soal?.fen,
            rating: soal?.rating,
            warna: soal?.first.startsWith("White") ? "White" : "Black",
            benar: true,
          },
        ]);
        const tgt = Math.min(targetRating + 30, 2400);
        setTargetRating(tgt);
        delayRef.current = window.setTimeout(() => {
          if (endedRef.current) return;
          muatSoalBerikut(tgt);
        }, 950);
      } else {
        setKomputer(true);
      }
    },
    [
      fase,
      komputer,
      transisi,
      sisa,
      fen,
      promo,
      mainkanLangkah,
      gagalSoal,
      muatSoalBerikut,
      targetRating,
      soal,
    ]
  );

  const pilihPetak = useCallback(
    (petak) => {
      if (terkunci || !fen || !sisa.length) return;
      try {
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
      } catch {
        /* abaikan */
      }
    },
    [terkunci, fen, sisa]
  );

  const klikPetak = useCallback(
    (petak) => {
      if (terkunci || !fen || !sisa.length) return;
      if (terpilih && sasaran.includes(petak)) {
        cobaLangkah(terpilih, petak);
        return;
      }
      pilihPetak(petak);
    },
    [terkunci, fen, sisa, terpilih, sasaran, cobaLangkah, pilihPetak]
  );

  const mulaiSeret = useCallback((petak) => pilihPetak(petak), [pilihPetak]);
  const selesaiSeret = useCallback(
    (from, to) => {
      if (!to || from === to) return;
      cobaLangkah(from, to);
    },
    [cobaLangkah]
  );

  const pilihPromosi = useCallback(
    (b) => {
      if (!promo) return;
      const { from, to } = promo;
      setPromo(null);
      cobaLangkah(from, to, b);
    },
    [promo, cobaLangkah]
  );
  const batalPromosi = useCallback(() => {
    setPromo(null);
    setTerpilih(null);
    setSasaran([]);
  }, []);

  // Escape menutup modal promosi.
  useEffect(() => {
    if (!promo) return undefined;
    function saatEscape(e) {
      if (e.key === "Escape") batalPromosi();
    }
    window.addEventListener("keydown", saatEscape);
    return () => window.removeEventListener("keydown", saatEscape);
  }, [promo, batalPromosi]);

  /* -------------------------------------------------------------- turunan */
  const giliranPemain =
    orientasi === "b" ? t("tekaTekiRush.hitam") : t("tekaTekiRush.putih");
  const warnaLow = sisaWaktu <= 30 && sisaWaktu > 0;

  const linkLichess = (f) =>
    `https://lichess.org/analysis/${f.replace(/ /g, "%20")}`;

  const teksHasil = useMemo(
    () =>
      berakhirKarena === "nyawa"
        ? t("tekaTekiRush.hasilNyawa")
        : t("tekaTekiRush.hasilWaktu"),
    [berakhirKarena, t]
  );

  const benarJumlah = riwayat.filter((r) => r.benar).length;
  const salahJumlah = riwayat.length - benarJumlah;

  const skorTerbaikMenit =
    durasiMenit === 3 ? t("tekaTekiRush.durasi3") : t("tekaTekiRush.durasi5");

  /* ====================================================== elemen kerangka */

  // Mikro-label khas panel (uppercase + spasi antar huruf), bukan teks rata.
  const MikroLabel = ({ children }) => (
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </span>
  );

  // Kembali ke menu mulai (hentikan sesi yang berjalan).
  const keMenu = useCallback(() => {
    window.clearTimeout(timerRef.current);
    window.clearTimeout(delayRef.current);
    endedRef.current = true;
    setPromo(null);
    setFlash(null);
    setKesalahan(null);
    setTersegel(false);
    setFase("pilih");
    mainkan(SUARA.selesai);
  }, [mainkan]);

  /** Simpan skor sesi ke papan peringkat online (berlaku di layar selesai). */
  const simpanSkorOnline = useCallback(async () => {
    const u = (usernameForm || "").trim();
    if (!u) {
      setSimpanStatus("galat");
      setSimpanPesan(t("tekaTekiRush.usernameAnda"));
      return;
    }
    setSimpanStatus("kirim");
    try {
      localStorage.setItem(KUNCI_USERNAME, u);
    } catch {
      /* abaikan */
    }
    try {
      await kirimSkorRush({ username: u, skor, durasiMenit });
      setSimpanStatus("ok");
      setSimpanPesan(t("tekaTekiRush.skorTersimpan"));
      setSegarRekor((x) => x + 1);
      mainkan(SUARA.prestasi);
    } catch (e) {
      setSimpanStatus("galat");
      setSimpanPesan(
        e?.status === 403
          ? t("tekaTekiRush.hanyaAnggota")
          : t("tekaTekiRush.gagalSimpanOnline")
      );
    }
  }, [usernameForm, skor, durasiMenit, t, mainkan]);

  // Judul & tombol kembali (konsisten dgn halaman Analisa / Papan).
  const kepala = (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#312e2b] bg-[#1e1c18] px-3 sm:px-4">
      {fase === "pilih" ? (
        <Link
          to="/program-kami/teka-teki"
          className="flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
          title={t("tekaTekiRush.kembali")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M19 12H5M11 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">{t("tekaTekiRush.kembali")}</span>
          <span className="sm:hidden">{t("tekaTekiRush.kembaliSingkat")}</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={keMenu}
          className="flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
          title={t("tekaTekiRush.kembaliKeMulai")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M19 12H5M11 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">{t("tekaTekiRush.kembaliKeMulai")}</span>
          <span className="sm:hidden">{t("tekaTekiRush.kembaliSingkat")}</span>
        </button>
      )}

      <div className="flex items-center gap-2">
        <span className="hidden text-[13px] font-semibold text-slate-200 md:inline">
          Blunder<span className="text-[#81b64c]">Skuad</span>
        </span>
        <span className="rounded-md border border-[#81b64c]/40 bg-[#81b64c]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#b8dc8e]">
          {t("tekaTekiRush.judul")}
        </span>
        {tersegel && (
          <span
            title={t("tekaTekiRush.skorDisegel")}
            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
        )}
      </div>
    </header>
  );

  // NAV KIRI: pengaturan papan + rekor + aksi sesi.
  const navKiri = (
    <aside className="flex w-full shrink-0 flex-col justify-between border-b border-r-0 border-[#312e2b] bg-[#1e1c18] lg:w-[236px] lg:border-b-0 lg:border-r">
      <div>
        <div className="border-b border-[#312e2b] px-4 py-4">
          <MikroLabel>{t("tekaTekiRush.pengaturan")}</MikroLabel>

          {/* Set bidak */}
          <label htmlFor="rush-set" className="mt-3 block">
            <MikroLabel>{t("tekaTekiRush.setBidak")}</MikroLabel>
            <select
              id="rush-set"
              value={setBidak}
              onChange={(e) => setSetBidak(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
            >
              {DAFTAR_SET.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </label>

          {/* Warna papan */}
          <label htmlFor="rush-warna" className="mt-3 block">
            <MikroLabel>{t("tekaTekiRush.warnaPapan")}</MikroLabel>
            <select
              id="rush-warna"
              value={warnaPapan}
              onChange={(e) => setWarnaPapan(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
            >
              {PILIHAN_WARNA.map(([nilai, kunci]) => (
                <option key={nilai} value={nilai}>
                  {t(kunci)}
                </option>
              ))}
            </select>
          </label>

          {/* Suara */}
          <div className="mt-4 flex items-center justify-between">
            <MikroLabel>{t("tekaTekiRush.suara")}</MikroLabel>
            <TombolSuara
              nyala={suaraNyala}
              onKlik={() => setNyala(!suaraNyala)}
              label={suaraNyala ? "Suara menyala" : "Suara mati"}
            />
          </div>
        </div>

        {/* Rekor */}
        <div className="px-4 py-4">
          <MikroLabel>{t("tekaTekiRush.rekorTinggi")}</MikroLabel>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-black tabular-nums text-[#fffaec]">
              {terbaik}
            </span>
            <span className="text-[11px] font-semibold text-[#81b64c]">
              {fase === "selesai" && rekorBaru ? t("tekaTekiRush.baru") : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Aksi saat bermain */}
      {fase === "main" && (
        <div className="border-t border-[#312e2b] px-4 py-3">
          <button
            type="button"
            onClick={() => akhiri("waktu")}
            className="w-full rounded-md border border-[#312e2b] bg-[#262421] py-2 text-sm font-semibold text-slate-300 transition hover:border-red-500/60 hover:text-red-300"
          >
            {t("tekaTekiRush.sesiBerhenti")}
          </button>
        </div>
      )}
    </aside>
  );

  // Panel tengah dipakai untuk skor-waktu-nyawa + papan (atau kartu mulai / hasil).
  const panelTengah = (anak) => (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#262421]">
      {anak}
    </main>
  );

  // Panel kanan: riwayat soal (main/selesai) atau panduan (pilih).
  const kananRiwayat = (
    <aside className="flex w-full shrink-0 flex-col border-t border-[#312e2b] bg-[#211f1c] lg:w-[360px] lg:border-l lg:border-t-0">
      <PapanPeringkat durasi={durasiMenit} segar={segarRekor} />
      <div className="shrink-0 border-b border-[#312e2b] px-4 py-3">
        <div className="flex items-baseline justify-between">
          <MikroLabel>{t("tekaTekiRush.soalDitemui")}</MikroLabel>
          <span className="text-[11px] tabular-nums text-slate-400">
            {riwayat.length}
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {riwayat.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-slate-500">
            {t("tekaTekiRush.belumAdaSoal")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {riwayat.map((r, i) => (
              <li key={i}>
                <a
                  href={linkLichess(r.fen)}
                  target="_blank"
                  rel="noreferrer"
                  title={t("tekaTekiRush.analisaLichess")}
                  className="flex items-center gap-2 rounded-md border border-[#312e2b] bg-[#262421] px-3 py-2 text-sm transition hover:border-slate-500"
                >
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      r.benar ? "bg-[#81b64c]" : "bg-red-500"
                    }`}
                  />
                  <span className="w-5 text-[11px] font-bold uppercase text-slate-500">
                    {r.warna[0]}
                  </span>
                  <span className="text-slate-300">#{riwayat.length - i}</span>
                  <span className="ml-auto font-semibold tabular-nums text-slate-400">
                    {r.rating}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );

  const kananMulai = (
    <aside className="flex w-full shrink-0 flex-col border-t border-[#312e2b] bg-[#211f1c] lg:w-[360px] lg:border-l lg:border-t-0">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <MikroLabel>{t("tekaTekiRush.caraMainJudul")}</MikroLabel>
        <ol className="mt-3 space-y-3">
          {["aturan1", "aturan2", "aturan3", "aturan4"].map((k, i) => (
            <li key={k} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#81b64c]/15 text-xs font-bold text-[#b8dc8e]">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-slate-300">{t(`tekaTekiRush.${k}`)}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-md border border-[#312e2b] bg-[#262421] p-3">
          <MikroLabel>{t("tekaTekiRush.rekorTinggi")}</MikroLabel>
          <div className="mt-1 text-2xl font-black tabular-nums text-[#fffaec]">
            {terbaik}
          </div>
        </div>
      </div>
    </aside>
  );

  /* ============================================================= layar */

  if (gagalMuat) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#262421] px-6 py-10">
        <p className="max-w-md rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm leading-6 text-red-300">
          {t("tekaTekiRush.gagalMuat")}
        </p>
      </div>
    );
  }

  if (!siap) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#262421] px-6 py-10">
        <p className="text-sm text-slate-400">{t("tekaTekiRush.memuat")}</p>
      </div>
    );
  }

  /* ------------------------------- FASE PILIH (menu mulai) ----------------- */
  if (fase === "pilih") {
    const tengah = (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#81b64c]/15 text-[#81b64c]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">
                {t("tekaTekiRush.judul")}
              </h1>
              <p className="text-sm text-slate-400">{t("tekaTekiRush.tagline")}</p>
            </div>
          </div>

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t("tekaTekiRush.durasiLabel")}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {DURASI.map((menit) => {
              const aktif = durasiMenit === menit;
              return (
                <button
                  key={menit}
                  type="button"
                  onClick={() => setDurasiMenit(menit)}
                  aria-pressed={aktif}
                  className={`rounded-lg border px-4 py-4 text-left transition ${
                    aktif
                      ? "border-[#81b64c] bg-[#81b64c]/10"
                      : "border-[#312e2b] bg-[#1e1c18] hover:border-slate-600"
                  }`}
                >
                  <span
                    className={`block text-3xl font-black tabular-nums leading-none ${
                      aktif ? "text-[#b8dc8e]" : "text-slate-200"
                    }`}
                  >
                    {menit}
                  </span>
                  <span className="mt-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
                    {t("tekaTekiRush.menitSingkat")}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => mulai(durasiMenit)}
            className="mt-6 w-full rounded-lg bg-[#81b64c] py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#1e1c18] transition hover:bg-[#92c45f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#81b64c]/60"
          >
            {t("tekaTekiRush.mulai")}
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex min-h-screen flex-col bg-[#262421] text-gray-200 font-sans select-none lg:h-screen lg:overflow-hidden">
        {kepala}
        <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
          {navKiri}
          {panelTengah(tengah)}
          {kananMulai}
        </div>
      </div>
    );
  }

  /* ------------------------------- FASE SELESAI ----------------- */
  if (fase === "selesai") {
    const tengah = (
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
        <div className="w-full max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            {teksHasil}
          </p>
          <div className="mt-4 text-7xl font-black leading-none tabular-nums text-[#fffaec]">
            {skor}
          </div>
          <p className="mt-3 text-base font-semibold text-[#81b64c]">
            {teksCapaian(skor)}
          </p>
          {rekorBaru && (
            <p className="mt-3 inline-block rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-sm font-bold text-amber-300">
              {t("tekaTekiRush.rekorBaru")}
            </p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-[#312e2b] bg-[#1e1c18] p-3">
              <MikroLabel>{t("tekaTekiRush.skor")}</MikroLabel>
              <p className="mt-1 text-xl font-bold text-white">{skor}</p>
            </div>
            <div className="rounded-lg border border-[#312e2b] bg-[#1e1c18] p-3">
              <MikroLabel>{t("tekaTekiRush.benarLabel")}</MikroLabel>
              <p className="mt-1 text-xl font-bold text-[#81b64c]">{benarJumlah}</p>
            </div>
            <div className="rounded-lg border border-[#312e2b] bg-[#1e1c18] p-3">
              <MikroLabel>{t("tekaTekiRush.salahLabel")}</MikroLabel>
              <p className="mt-1 text-xl font-bold text-red-400">{salahJumlah}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => mulai(durasiMenit)}
            className="mt-6 w-full rounded-lg bg-[#81b64c] py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#1e1c18] transition hover:bg-[#92c45f]"
          >
            {t("tekaTekiRush.mainLagi")}
          </button>
          <p className="mt-3 text-xs text-slate-500">
            {t("tekaTekiRush.skorTerbaik", { n: terbaik })} · {skorTerbaikMenit}
          </p>

          {/* Simpan skor ke papan peringkat online */}
          {skor >= 1 && (
            <div className="mt-6 rounded-lg border border-[#312e2b] bg-[#1e1c18] p-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t("tekaTekiRush.simpanSkor")} · {durasiMenit}′
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={usernameForm}
                  onChange={(e) => setUsernameForm(e.target.value)}
                  placeholder={t("tekaTekiRush.usernameAnda")}
                  autoComplete="username"
                  disabled={simpanStatus === "kirim"}
                  className="min-w-0 flex-1 rounded-md border border-slate-600 bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c]"
                />
                <button
                  type="button"
                  onClick={simpanSkorOnline}
                  disabled={simpanStatus === "kirim"}
                  className="shrink-0 rounded-md bg-[#81b64c] px-4 py-2 text-sm font-bold text-[#1e1c18] transition hover:bg-[#92c45f] disabled:opacity-60"
                >
                  {t("tekaTekiRush.simpanSkor")}
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {t("tekaTekiRush.hanyaAnggota")}
              </p>
              {simpanStatus !== "idle" && (
                <p
                  className={`mt-2 text-sm font-semibold ${
                    simpanStatus === "ok" ? "text-[#81b64c]" : "text-red-400"
                  }`}
                >
                  {simpanPesan}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div className="flex min-h-screen flex-col bg-[#262421] text-gray-200 font-sans select-none lg:h-screen lg:overflow-hidden">
        {kepala}
        <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
          {navKiri}
          {panelTengah(tengah)}
          {kananRiwayat}
        </div>
      </div>
    );
  }

  /* ------------------------------- FASE MAIN (bermain) ----------------- */
  const tengahMain = (
    <>
      {/* Bilah skor-waktu-nyawa */}
      <div className="flex shrink-0 items-stretch gap-2 px-3 pt-3 sm:px-4 sm:gap-3">
        <div className="flex min-w-[70px] flex-col items-center justify-center rounded-md border border-[#312e2b] bg-[#1e1c18] px-2 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {t("tekaTekiRush.skor")}
          </span>
          <span className="text-2xl font-black tabular-nums leading-tight text-[#81b64c]">
            {skor}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-[#312e2b] bg-[#1e1c18] px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${
                  i < nyawa ? "bg-red-500" : "bg-[#312e2b]"
                }`}
              />
            ))}
          </div>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {t("tekaTekiRush.nyawa")}
          </span>
        </div>
        <div
          className={`flex min-w-[86px] flex-col items-center justify-center rounded-md border px-2 py-1.5 ${
            warnaLow
              ? "border-red-500/50 bg-red-500/10"
              : "border-[#312e2b] bg-[#1e1c18]"
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${
              warnaLow ? "text-red-300" : "text-slate-500"
            }`}
          >
            {t("tekaTekiRush.waktu")}
          </span>
          <span
            className={`text-xl font-bold tabular-nums leading-tight ${
              warnaLow ? "text-red-300" : "text-[#fffaec]"
            }`}
          >
            {formatWaktu(sisaWaktu)}
          </span>
        </div>
      </div>

      {/* Profil: giliran + level soal */}
      <div className="flex shrink-0 items-center justify-between px-3 pt-3 sm:px-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`inline-block h-4 w-4 rounded-full border ${
              orientasi === "b"
                ? "border-slate-500 bg-slate-900"
                : "border-slate-500 bg-slate-100"
            }`}
          />
          <span className="text-sm font-semibold text-slate-200">
            {t("tekaTekiRush.melangkah", { warna: giliranPemain })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-[#312e2b] bg-[#1e1c18] px-2.5 py-1 text-[11px] font-semibold text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-[#81b64c]" />
          {t("tekaTekiRush.kesulitan", { n: targetRating })}
        </div>
      </div>

      {/* Papan */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-3">
        <div
          className="relative overflow-hidden rounded-md shadow-2xl ring-1 ring-black/20"
          style={{ width: "min(100%, calc(100vh - 250px))" }}
        >
          <PapanTekaTeki
            fen={fen}
            orientasi={orientasi}
            terpilih={terpilih}
            sasaran={sasaran}
            kesalahan={kesalahan}
            langkahAkhir={langkahAkhir}
            tanda={{ panah: [], petak: {} }}
            terkunci={terkunci}
            membeku={komputer}
            setBidak={setBidak}
            tema={warnaPapan}
            onKlik={klikPetak}
            onPilih={pilihPetak}
            onMulaiSeret={mulaiSeret}
            onSelesaiSeret={selesaiSeret}
          />

          {/* Umpan balik benar/salah */}
          {flash && (
            <div
              key={`${soal?.problemid}-${flash.jenis}-${skor}`}
              className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center"
            >
              <span
                className={`rounded-full px-4 py-1.5 text-sm font-extrabold shadow-lg ${
                  flash.jenis === "benar"
                    ? "bg-[#81b64c] text-[#1e1c18]"
                    : "bg-red-500 text-white"
                }`}
              >
                {flash.jenis === "benar"
                  ? t("tekaTekiRush.skakmat")
                  : t("tekaTekiRush.salah")}
              </span>
            </div>
          )}
        </div>

        {/* Modal promosi */}
        {promo && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
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
                  promo.warna === "w"
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
                    className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 p-1.5 transition hover:bg-slate-200"
                  >
                    <ChessPiece
                      piece={promo.warna === "w" ? p.toUpperCase() : p}
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
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#262421] text-gray-200 font-sans select-none lg:h-screen lg:overflow-hidden">
      {kepala}
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
        {navKiri}
        {panelTengah(tengahMain)}
        {kananRiwayat}
      </div>
    </div>
  );
}
