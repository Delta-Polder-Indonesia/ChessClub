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
import { mulaiLoginChessCom } from "../../lib/api/anggota.js";
import { muatAnggota, anggotaTersimpan } from "../../lib/anggotaBersama.js";
import { berkasPublik } from "../../lib/asets.js";
import { coba } from "../../lib/utils.js";
import {
  parseLangkah,
  terapkan,
  butuhPromosi,
  apakahLangkahLegal,
  apakahLangkahSesuai,
} from "../../lib/tekaTeki.js";
import CeklisHijau from "../Analisa/komponen/svg/checkbox-green.svg";
import CeklisMerah from "../Analisa/komponen/svg/checkbox-red.svg";
import License from "../Analisa/komponen/svg/license.jsx";

const KUNCI_USERNAME = "kci-rush-username";

/* ------------------------------------------------------------------ data */

const KUNCI_BEST = "kci-rush-teka-teki-terbaik";
const KUNCI_SET = "kci-teka-teki-set-bidak";
const KUNCI_WARNA = "kci-teka-teki-warna-papan";


const DURASI = [3, 5];
const NYAWA_AWAL = 3;

/** Mode latihan bebas (khusus dev): waktu tidak berjalan sehingga tidak
 *  berakhir karena waktu. Harus `false` di produksi — penghitung 3/5 menit
 *  adalah bagian dari permainan. */
const BEBAS_WAKTU = false;

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
  return (
    coba(() => {
      const mentah = localStorage.getItem(kunci);
      if (!mentah) return 0;
      const { n, c } = JSON.parse(mentah);
      const bilangan = Number(n) || 0;
      if (Number(c) !== (bilangan ^ 0x5a17) >>> 0) return 0;
      return bilangan;
    }, "baca skor tersegel") ?? 0
  );
}

function bacaTerbaik() {
  return bacaBungkus(KUNCI_BEST);
}

function simpanBungkus(kunci, nilai) {
  coba(() => {
    const bilangan = Math.max(0, Math.floor(Number(nilai) || 0));
    const c = (bilangan ^ 0x5a17) >>> 0;
    localStorage.setItem(kunci, JSON.stringify({ n: bilangan, c }));
  }, "simpan skor tersegel");
}

function bacaSetBidak() {
  const simpan = coba(() => localStorage.getItem(KUNCI_SET), "baca set bidak");
  if (simpan && DAFTAR_SET.some((s) => s.id === simpan)) return simpan;
  return "merida";
}

function bacaWarnaPapan() {
  const simpan = coba(() => localStorage.getItem(KUNCI_WARNA), "baca warna papan");
  if (simpan && PILIHAN_WARNA.some(([nilai]) => nilai === simpan)) return simpan;
  return "green";
}

function bacaUsername() {
  return (
    coba(() => localStorage.getItem(KUNCI_USERNAME), "baca username") || ""
  ).trim();
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
  // Tombol "Coba lagi" pada layar galat mengulang pemuatan data soal.
  const [percobaan, setPercobaan] = useState(0);

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
  const [rosterUsernames, setRosterUsernames] = useState(() =>
    anggotaTersimpan().map((a) => a.username)
  );
  const [cobaMulai, setCobaMulai] = useState(false);
  const [segarRekor, setSegarRekor] = useState(0);
  const [simpanStatus, setSimpanStatus] = useState("idle"); // idle|kirim|ok|galat
  const [simpanPesan, setSimpanPesan] = useState("");
  // Tiket HMAC dari login Chess.com; tidak disimpan di localStorage dan hanya
  // dipakai sekali oleh server untuk satu pengiriman skor.
  const [tiketRush, setTiketRush] = useState("");

  useEffect(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem("kci-hasil-verifikasi") || "null");
      if (data?.sukses && data.tiket && data.username) {
        setTiketRush(data.tiket);
        setUsernameForm(data.username);
        sessionStorage.removeItem("kci-hasil-verifikasi");
      }
    } catch {
      // Storage privat/nonaktif tidak boleh menjatuhkan halaman permainan.
    }
  }, []);

  const usedIdsRef = useRef(new Set());
  const nyawaRef = useRef(NYAWA_AWAL);
  const skorRef = useRef(0);
  const endedRef = useRef(false);
  const terbaikAwalRef = useRef(0);
  const timerRef = useRef(null);
  const delayRef = useRef(null);
  // Tenggat sesi dalam milidetik absolut (meniru `puzzleEndDateTime`
  // PuzzleDash asli): sisa waktu selalu dihitung ulang dari jam nyata,
  // bukan didekremen — berapa pun interval tertunda (tab di latar belakang,
  // mesin sibuk), penghitung tetap akurat dan tidak bisa "melambat".
  const berakhirPadaRef = useRef(0);
  // Bunyi peringatan "waktu menipis" cukup sekali per sesi.
  const sudahPeringatanRef = useRef(false);

  const terkunci = komputer || transisi || !!promo || fase !== "main";

  // Simpan preferensi papan (dibagi dengan halaman lain).
  useEffect(() => {
    coba(() => localStorage.setItem(KUNCI_SET, setBidak), "simpan set bidak");
  }, [setBidak]);
  useEffect(() => {
    coba(
      () => localStorage.setItem(KUNCI_WARNA, warnaPapan),
      "simpan warna papan"
    );
  }, [warnaPapan]);

  /* --------------------------------------------------- muat data teka-teki */
  useEffect(() => {
    let aktif = true;
    setGagalMuat(false);
    setSiap(false);
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
  }, [percobaan]);

  /* ------------------------------------------------------- judul halaman */
  useEffect(() => {
    document.title = `${t("tekaTekiRush.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  /* ------------------------------------------------------- roster anggota */
  useEffect(() => {
    let hidup = true;
    muatAnggota()
      .then((data) => {
        if (!hidup) return;
        setRosterUsernames((data || []).map((a) => a.username));
      })
      .catch(() => {
        /* abaikan; pakai cache bila ada */
      });
    return () => {
      hidup = false;
    };
  }, []);

  /* ---------------------------------------------------------- pembersihan */
  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      window.clearTimeout(delayRef.current);
    },
    []
  );

  /** Akhiri permainan sekali saja. */
  const akhiri = useCallback(
    (karena) => {
      if (endedRef.current) return;
      endedRef.current = true;
      // Hentikan semua timer transisi/penghitung yang masih terjadwal supaya
      // tidak ada callback `muatSoalBerikut` atau setState yang menyelinap
      // setelah fase berubah ke "selesai".
      window.clearTimeout(timerRef.current);
      window.clearTimeout(delayRef.current);
      setKomputer(false);
      setTransisi(false);
      setPromo(null);
      setFlash(null);
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
      berakhirPadaRef.current = Date.now() + menit * 60_000;
      sudahPeringatanRef.current = false;
      setNyawa(NYAWA_AWAL);
      setSkor(0);
      setRiwayat([]);
      setBerakhirKarena(null);
      setRekorBaru(false);
      setSimpanStatus("idle");
      setSimpanPesan("");
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
    if (fase !== "main" || BEBAS_WAKTU) return undefined;
    const detikSisa = () =>
      Math.max(0, Math.ceil((berakhirPadaRef.current - Date.now()) / 1000));
    setSisaWaktu(detikSisa());
    // 250 ms (bukan 1 dtk) supaya tampilan langsung benar saat kembali dari
    // tab yang dibekukan browser; nilai sama = React tanpa render ulang.
    const id = window.setInterval(() => setSisaWaktu(detikSisa()), 250);
    return () => window.clearInterval(id);
  }, [fase]);

  useEffect(() => {
    if (fase === "main" && !BEBAS_WAKTU && sisaWaktu <= 0) akhiri("waktu");
  }, [sisaWaktu, fase, akhiri]);

  /* Peringatan waktu menipis (sisa ≤ 30 dtk): bunyi sekali — pasangan dari
   * timer merah (warnaLow). Meniru PuzzleDash asli yang membunyikan
   * LowTime.mp3 tepat saat 30 detik tersisa. */
  useEffect(() => {
    if (fase !== "main" || BEBAS_WAKTU) return;
    if (sisaWaktu > 30 || sisaWaktu <= 0 || sudahPeringatanRef.current) return;
    sudahPeringatanRef.current = true;
    mainkan(SUARA.waktuSedikit);
  }, [sisaWaktu, fase, mainkan]);

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

      const promosiDiminta = butuhPromosi(fen, from, to);
      const legal = apakahLangkahLegal(fen, from, to);

      if (promosiDiminta.butuh && legal && !promoBidak) {
        setPromo({ from, to, warna: promosiDiminta.warna });
        setTerpilih(null);
        setSasaran([]);
        return;
      }
      // Langkah ilegal → tidak dikurangi nyawa.
      if (!legal) return;

      if (!apakahLangkahSesuai(from, to, promoBidak, diharapkan)) {
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
      if (terpilih === petak) {
        setTerpilih(null);
        setSasaran([]);
        return;
      }
      pilihPetak(petak);
    },
    [terkunci, fen, sisa, terpilih, sasaran, cobaLangkah, pilihPetak]
  );

  const mulaiSeret = useCallback((petak) => pilihPetak(petak), [pilihPetak]);
  const selesaiSeret = useCallback(
    (from, to, klikUlang) => {
      if (klikUlang) {
        setTerpilih(null);
        setSasaran([]);
        return;
      }
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
  const pasifWarna =
    orientasi === "b" ? t("tekaTekiRush.putih") : t("tekaTekiRush.hitam");
  const warnaLow = sisaWaktu <= 30 && sisaWaktu > 0;

  const linkLichess = (f) =>
    `https://lichess.org/analysis/${f.replace(/ /g, "%20")}`;

  const teksHasil = useMemo(() => {
    switch (berakhirKarena) {
      case "nyawa":
        return t("tekaTekiRush.hasilNyawa");
      case "berhenti":
        return t("tekaTekiRush.hasilBerhenti");
      default:
        return t("tekaTekiRush.hasilWaktu");
    }
  }, [berakhirKarena, t]);

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
    // Bersihkan semua state sesi agar tidak ada sisa (flash merah/hijau,
    // pilihan promosi, sorotan kesalahan) yang terbawa ke menu.
    setPromo(null);
    setFlash(null);
    setKesalahan(null);
    setKomputer(false);
    setTransisi(false);
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setSisaWaktu(durasiMenit * 60);
    setBerakhirKarena(null);
    setTersegel(false);
    setFase("pilih");
    mainkan(SUARA.selesai);
  }, [mainkan, durasiMenit]);

  /** Mulai login Chess.com untuk menerbitkan bukti identitas Rush. */
  const mulaiVerifikasiRush = useCallback(async () => {
    setSimpanStatus("kirim");
    setSimpanPesan("");
    try {
      const hasil = await mulaiLoginChessCom("/teka-teki-rush");
      window.location.assign(hasil.url);
    } catch (e) {
      setSimpanStatus("galat");
      setSimpanPesan(e?.message || t("tekaTekiRush.verifikasiGagal"));
    }
  }, [t]);

  /** Simpan skor sesi ke papan peringkat online (berlaku di layar selesai). */
  const simpanSkorOnline = useCallback(async () => {
    const u = (usernameForm || "").trim();
    if (!u) {
      setSimpanStatus("galat");
      setSimpanPesan(t("tekaTekiRush.usernameAnda"));
      return;
    }
    if (!tiketRush) {
      setSimpanStatus("galat");
      setSimpanPesan(t("tekaTekiRush.verifikasiDiperlukan"));
      return;
    }
    setSimpanStatus("kirim");
    coba(() => localStorage.setItem(KUNCI_USERNAME, u), "simpan username");
    try {
      await kirimSkorRush({
        username: u,
        skor,
        durasiMenit,
        tiketVerifikasi: tiketRush,
      });
      setTiketRush("");
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
  }, [usernameForm, skor, durasiMenit, tiketRush, t, mainkan]);

  // NAV KIRI: pengaturan papan + rekor + aksi sesi.
  const navKiri = (
    <aside className="flex w-full shrink-0 flex-col justify-between border-b border-r-0 border-[#312e2b] bg-[#1e1c18] lg:w-[236px] lg:border-b-0 lg:border-r">
      <div>
        <div className="border-b border-[#312e2b] px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[22px] font-bold leading-none text-white">
              Blunder<span className="text-[#81b64c]">Skuad</span>
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
        </div>

        {fase === "main" ? (
          <PapanPeringkat durasi={durasiMenit} segar={segarRekor} />
        ) : (
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
              label={suaraNyala ? t("papan.suaraNyala") : t("papan.suaraMati")}
            />
          </div>
        </div>
      )}

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

      {/* Aksi saat bermain + Lisensi & Atribusi */}
      <div>
        {fase === "main" && (
          <div className="px-4 pt-3 pb-2">
            <button
              type="button"
              onClick={() => akhiri("berhenti")}
              className="w-full rounded-md border border-[#312e2b] bg-[#262421] py-2 text-sm font-semibold text-slate-300 transition hover:border-red-500/60 hover:text-red-300"
            >
              {t("tekaTekiRush.sesiBerhenti")}
            </button>
          </div>
        )}

        <div className="border-t border-[#312e2b] px-4 py-3">
          <Link
            to="/program-kami/atribusi"
            className="flex items-center justify-center gap-1.5 text-xs text-slate-500 transition hover:text-white"
          >
            <License size={14} class="fill-current" />
            {t("tekaTekiRush.lisensiAtribusi")}
          </Link>
        </div>
      </div>
    </aside>
  );

  // Panel tengah dipakai untuk skor-waktu-nyawa + papan (atau kartu mulai / hasil).
  const panelTengah = (anak) => (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#262421]">
      {anak}
    </main>
  );

  // Panel kanan: kerangka kosong (isi akan diisi ulang).
  const kananRiwayat = (
    <aside className="flex w-full shrink-0 flex-col border-t border-[#312e2b] bg-[#211f1c] lg:w-[360px] lg:border-l lg:border-t-0">
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {t("tekaTekiRush.skor")}
        </span>
        <span className="text-xl font-black tabular-nums text-[#81b64c]">
          {skor}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="mt-4 grid grid-cols-5 gap-0.5">
          {riwayat.map((r, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold tabular-nums text-slate-500">
                {i + 1}
              </span>
              <span className="flex h-9 w-full items-center justify-center">
                <img
                  src={r.benar ? CeklisHijau : CeklisMerah}
                  alt=""
                  className="h-6 w-6"
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );

  const kananMulai = (
    <aside className="flex w-full shrink-0 flex-col border-t border-[#312e2b] bg-[#211f1c] lg:w-[360px] lg:border-l lg:border-t-0"></aside>
  );

  /* ============================================================= layar */

  if (gagalMuat) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#262421] px-6 py-10">
        <p className="max-w-md rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm leading-6 text-red-300">
          {t("tekaTekiRush.gagalMuat")}
        </p>
        <button
          type="button"
          onClick={() => setPercobaan((n) => n + 1)}
          className="rounded-full border border-red-800 px-5 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-950/60"
        >
          {t("common.cobaLagi")}
        </button>
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
            <img
              src={berkasPublik("/images/color-icon/puzzle-piece.svg")}
              alt=""
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-2xl font-extrabold text-white">
                {t("tekaTekiRush.judul")}
              </h1>
              <p className="text-sm text-slate-400">{t("tekaTekiRush.tagline")}</p>
            </div>
          </div>

          <input
            type="text"
            value={usernameForm}
            onChange={(e) => setUsernameForm(e.target.value)}
            placeholder={t("tekaTekiRush.usernamePlaceholder")}
            className={`mt-8 w-full border-0 border-b-2 bg-transparent px-1 py-2 text-left text-base text-white outline-none transition-colors duration-200 placeholder:text-slate-500 ${
              cobaMulai && !usernameForm.trim()
                ? "border-red-400"
                : "border-[#9b9b9b] focus:border-[#81b64c]"
            }`}
          />
          {cobaMulai && !usernameForm.trim() && (
            <p className="mt-2 text-xs text-red-400">{t("tekaTekiRush.usernameKosong")}</p>
          )}

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t("tekaTekiRush.durasiLabel")}
          </p>
          <div className="mt-3 flex gap-3">
            {DURASI.map((menit) => {
              const aktif = durasiMenit === menit;
              return (
                <label
                  key={menit}
                  className={`flex-1 cursor-pointer rounded-md border-2 px-4 py-3 text-center text-2xl font-extrabold tabular-nums transition ${
                    aktif
                      ? "border-[#81b64c] text-[#b8dc8e]"
                      : "border-[#363236] text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="durasiRush"
                    value={menit}
                    checked={aktif}
                    onChange={() => setDurasiMenit(menit)}
                    className="sr-only"
                  />
                  {menit}
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {t("tekaTekiRush.menitSingkat")}
                  </span>
                </label>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              if (!usernameForm.trim()) {
                setCobaMulai(true);
                return;
              }
              mulai(durasiMenit);
            }}
            className="mt-6 w-full rounded-lg bg-[#81b64c] py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#1e1c18] transition hover:bg-[#92c45f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#81b64c]/60"
          >
            {t("tekaTekiRush.mulai")}
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex min-h-screen flex-col bg-[#262421] text-gray-200 font-sans select-none lg:h-screen lg:overflow-hidden">
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
            <span className="text-2xl font-bold text-slate-400">/{riwayat.length}</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-400">
            {durasiMenit} {t("tekaTekiRush.menitSingkat")}
          </p>
          {rekorBaru && (
            <p className="mt-3 inline-block rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-sm font-bold text-amber-300">
              {t("tekaTekiRush.rekorBaru")}
            </p>
          )}

          <button
            type="button"
            onClick={() => mulai(durasiMenit)}
            className="mt-6 w-full rounded-lg bg-[#81b64c] py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#1e1c18] transition hover:bg-[#a3d168]"
          >
            {t("tekaTekiRush.mainLagi")}
</button>

          {/* Simpan skor ke papan peringkat online */}
          {skor >= 1 && (
            <div className="mt-6 text-left">
              <MikroLabel>
                {t("tekaTekiRush.simpanSkor")} · {durasiMenit}′
              </MikroLabel>
              <div className="mt-3 flex items-end gap-2">
                <input
                  type="text"
                  value={usernameForm}
                  onChange={(e) => setUsernameForm(e.target.value)}
                  placeholder={t("tekaTekiRush.usernameAnda")}
                  autoComplete="username"
                  disabled={simpanStatus === "kirim" || Boolean(tiketRush)}
                  className="min-w-0 flex-1 border-0 border-b-2 bg-transparent px-1 py-2 text-sm text-white outline-none transition-colors duration-200 placeholder:text-slate-500 disabled:opacity-60 focus:border-[#81b64c]"
                />
                {usernameForm.trim() &&
                  (rosterUsernames.some(
                    (u) =>
                      u && u.toLowerCase() === usernameForm.trim().toLowerCase()
                  ) ? (
                    <svg
                      viewBox="0 0 256 256"
                      className="mb-2 h-5 w-5 shrink-0 text-[#81b64c]"
                      aria-hidden="true"
                    >
                      <path
                        fill="currentColor"
                        d="M128 20a108 108 0 1 0 108 108A108.12 108.12 0 0 0 128 20m0 192a84 84 0 1 1 84-84 84.095 84.095 0 0 1-84 84m37.515-128.456-56 56-18.971-18.971a12 12 0 0 0-16.97 16.97l27.456 27.456a12 12 0 0 0 16.97 0l64.485-64.485a12 12 0 0 0-16.97-16.97"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 256 256"
                      className="mb-2 h-5 w-5 shrink-0 text-[#e05b47]"
                      aria-hidden="true"
                    >
                      <path
                        fill="currentColor"
                        d="M128 20a108 108 0 1 0 108 108A108.12 108.12 0 0 0 128 20m0 192a84 84 0 1 1 84-84 84.095 84.095 0 0 1-84 84m40.485-107.515L144.971 128l23.514 23.515a12 12 0 0 1-16.97 16.97L128 144.971l-23.515 23.514a12 12 0 0 1-16.97-16.97L111.029 128l-23.514-23.515a12 12 0 0 1 16.97-16.97L128 111.029l23.515-23.514a12 12 0 0 1 16.97 16.97"
                      />
                    </svg>
                  ))}
                {!tiketRush && (
                  <button
                    type="button"
                    onClick={mulaiVerifikasiRush}
                    disabled={simpanStatus === "kirim"}
                    className="shrink-0 rounded-md border border-[#81b64c] px-4 py-2 text-sm font-bold text-[#a3d168] transition hover:bg-[#81b64c]/10 disabled:opacity-60"
                  >
                    {t("tekaTekiRush.verifikasiChessCom")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={simpanSkorOnline}
                  disabled={simpanStatus === "kirim" || !tiketRush}
                  className="shrink-0 rounded-md bg-[#81b64c] px-4 py-2 text-sm font-bold text-[#1e1c18] transition hover:bg-[#a3d168] disabled:opacity-60"
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
      {/* Profil pemain + papan (mengikuti pola LayoutTekaTeki) */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-6">
        <div className="flex w-full max-w-[720px] lg:max-w-[calc(100vh_-_120px)] flex-col justify-between gap-3">
          {/* PROFIL PEMAIN ATAS (pihak yang menunggu giliran) */}
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
              <div
                className={`h-10 w-10 flex-shrink-0 flex flex-row justify-center items-end rounded-md shadow-md overflow-hidden ${
                  pasifWarna === "Putih" ? "bg-[#dbd9d6]" : "bg-[#474542]"
                }`}
              >
                <svg className="scale-x-[1.15]" height="32" width="32" viewBox="0 0 512 512">
                  <path
                    className={
                      pasifWarna === "Putih" ? "fill-[#ffffff]" : "fill-[#1d1c1a]"
                    }
                    d="M359.51,367.614c-19.106-7.148-40.877-18.276-40.877-32.676c0-9.533,0-21.444,0-37.782
                    c6.996-19.393,17.51-20.781,22.768-50.546c12.254-4.379,19.258-11.384,28.009-42.026c6.574-23.064-3.112-29.254-9.382-30.905
                    c0.128-1.229,0.256-2.466,0.359-3.917c2.369-34.543,22.425-137.078-47.012-149.332c-18.38-14.296-30.043-20.774-69.437-18.38
                    C219.001,2.042,200.046,7.547,173.632,0c-35.245,29.565-25.561,126.66-20.63,173.504c-6.199,1.388-16.889,7.148-10.052,31.08
                    c8.744,30.641,15.748,37.646,28.001,42.026c5.258,29.765,21.252,39.322,22.417,50.546c0,16.338,0,28.248,0,37.782
                    c0,14.4-23.494,26.55-40.877,32.676C119.058,379.397,25.911,414.275,34.073,512h443.856
                    C486.09,414.275,392.712,380.035,359.51,367.614z"
                  />
                </svg>
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-sm font-bold text-[#fffaec] truncate">{pasifWarna}</span>
                <span className="text-[11px] text-gray-400 font-medium truncate">
                  {t("tekaTekiRush.menungguGiliran")}
                </span>
              </div>
            </div>
            <div className="flex flex-row items-center flex-shrink-0 mr-[52px]">
              <div
                className={`flex text-nowrap justify-center items-center h-10 min-w-[100px] px-3 rounded-md text-lg font-mono font-bold shadow border ${
                  warnaLow
                    ? "border-red-500/80 bg-[#2a1113] text-[#ff7676] ring-2 ring-red-500/30"
                    : "border-[#81b64c] bg-[#f0f0f0] text-[#1e1d1c] ring-2 ring-[#81b64c]/40"
                }`}
              >
                {formatWaktu(sisaWaktu)}
              </div>
            </div>
          </div>

          {/* TENGAH: PAPAN (mengisi sisa tinggi) */}
          <div className="flex min-h-0 flex-1 flex-row items-stretch justify-center gap-3">
            <div className="relative flex-1 aspect-square overflow-hidden rounded-md shadow-2xl ring-1 ring-black/20">
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

            {/* Penanda arah papan: atas lawan, bawah pemain */}
            <div className="flex flex-col items-center justify-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg"
                  className={pasifWarna === "Putih" ? "fill-[#ffffff]" : "fill-[#1d1c1a]"}
                  aria-hidden="true"
                >
                  <path d="M96 448q-14 0-23-9t-9-23V96q0-14 9-23t23-9h320q14 0 23 9t9 23v320q0 14-9 23t-23 9zm304-48V112H112v288z" />
                </svg>
              </span>
              <span className="relative flex h-10 w-10 items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg"
                  className={giliranPemain === "Putih" ? "fill-[#ffffff]" : "fill-[#1d1c1a]"}
                  aria-hidden="true"
                >
                  <path d="M96 448q-14 0-23-9t-9-23V96q0-14 9-23t23-9h320q14 0 23 9t9 23v320q0 14-9 23t-23 9zm304-48V112H112v288z" />
                </svg>
              </span>
            </div>
          </div>

          {/* PROFIL PEMAIN BAWAH (giliran aktif) */}
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
              <div
                className={`h-10 w-10 flex-shrink-0 flex flex-row justify-center items-end rounded-md shadow-md overflow-hidden ${
                  giliranPemain === "Putih" ? "bg-[#dbd9d6]" : "bg-[#474542]"
                }`}
              >
                <svg className="scale-x-[1.15]" height="32" width="32" viewBox="0 0 512 512">
                  <path
                    className={
                      giliranPemain === "Putih" ? "fill-[#ffffff]" : "fill-[#1d1c1a]"
                    }
                    d="M359.51,367.614c-19.106-7.148-40.877-18.276-40.877-32.676c0-9.533,0-21.444,0-37.782
                    c6.996-19.393,17.51-20.781,22.768-50.546c12.254-4.379,19.258-11.384,28.009-42.026c6.574-23.064-3.112-29.254-9.382-30.905
                    c0.128-1.229,0.256-2.466,0.359-3.917c2.369-34.543,22.425-137.078-47.012-149.332c-18.38-14.296-30.043-20.774-69.437-18.38
                    C219.001,2.042,200.046,7.547,173.632,0c-35.245,29.565-25.561,126.66-20.63,173.504c-6.199,1.388-16.889,7.148-10.052,31.08
                    c8.744,30.641,15.748,37.646,28.001,42.026c5.258,29.765,21.252,39.322,22.417,50.546c0,16.338,0,28.248,0,37.782
                    c0,14.4-23.494,26.55-40.877,32.676C119.058,379.397,25.911,414.275,34.073,512h443.856
                    C486.09,414.275,392.712,380.035,359.51,367.614z"
                  />
                </svg>
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-sm font-bold text-[#fffaec] truncate">{giliranPemain}</span>
                <span className="text-[11px] font-bold text-gray-500">
                  {t("tekaTekiRush.melangkah", { warna: giliranPemain })}
                </span>
              </div>
            </div>
            <div className="flex flex-row items-center gap-2 flex-shrink-0 mr-[52px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="relative flex h-10 w-10 items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 512 512"
                    xmlns="http://www.w3.org/2000/svg"
                    className={i >= nyawa ? "fill-[#e05b47]" : "fill-[#3a3633]"}
                    aria-hidden="true"
                  >
                    <path d="M96 448q-14 0-23-9t-9-23V96q0-14 9-23t23-9h320q14 0 23 9t9 23v320q0 14-9 23t-23 9zm304-48V112H112v288z" />
                  </svg>
                  {i >= nyawa && (
                    <svg
                      className="absolute h-5 w-5 text-red-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  )}
                </span>
              ))}
            </div>
          </div>
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
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
        {navKiri}
        {panelTengah(tengahMain)}
        {kananRiwayat}
      </div>
    </div>
  );
}
