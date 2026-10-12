import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import {
  Bookmark,
  Plus,
  RotateCw,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import Profile from "../Analisa/komponen/svg/profile.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";
import { useEngineCatur } from "../../lib/gunakanEngineCatur.js";
import { nilaiDariSudutPelangkah } from "../../lib/bantuanSeret.js";
import { useBantuanSeret } from "../../lib/gunakanBantuanSeret.js";
import PanelEngine from "../../components/PanelEngine.jsx";
import {
  ambilArtikelPembukaan,
  lihatArtikelTercache,
} from "../../lib/artikelWikipedia.js";
import { normalkanPohonPembukaan } from "../../lib/namaPembukaan.js";
import { isForced } from "../Analisa/mesin/penilaian.js";
import { petakRajaPemenang, petakRajaTermat } from "../../lib/skakmat.js";
import { SUARA, useSuara, mainkanSuara } from "../../lib/suara.js";
import KartuKomentator from "../../components/KartuKomentator.jsx";
import { usePreferensiKomentator } from "../../components/usePreferensiKomentator.js";
import { ekspresiDariSkorAwan, faktaLangkah, statusTerminalFen } from "../../lib/komentator.js";
import {
  ambilBasisDataAwan,
  intipBasisDataAwan,
  saranAwanKomentator,
  skorLangkahAwan,
} from "../../lib/basisDataAwan.js";
import { FEN_AWAL, KUCI_NAMA_PROMOSI, PILIHAN_PROMOSI, TAB_PANEL } from "./konstanta.js";
import TombolKeAwal from "./TombolKeAwal.jsx";
import TombolMundur from "./TombolMundur.jsx";
import TombolMaju from "./TombolMaju.jsx";
import TombolKeAkhir from "./TombolKeAkhir.jsx";
import {
  ekstrakFenDariPgn,
  fenDanSanDariKoordinat,
  fenDariLangkah,
  kuciDariPindahan,
  modeDariPohon,
  pohonDariDaftar,
  ratingDariSnapshotEval,
  sanDariPgn,
  sanDiPosisi,
  statTurunan,
  susunKatalog,
  susunPgnDenganFen,
} from "./utilPapan.js";
import IkonTab from "./IkonTab.jsx";
import BukuPembukaan from "./BukuPembukaan.jsx";
import KartuArtikelPembukaan from "./KartuArtikelPembukaan.jsx";
import DaftarRiwayat from "./DaftarRiwayat.jsx";
import BilahEvaluasi from "./BilahEvaluasi.jsx";
import TangkapanBidak from "./TangkapanBidak.jsx";
import { susunTangkapan } from "./TangkapanBidakData.js";
import MasukanPgn from "./MasukanPgn.jsx";
import LangkahExplorer from "./LangkahExplorer.jsx";
import PanelBasisDataAwan from "./PanelBasisDataAwan.jsx";
import PopupPengaturan from "./PopupPengaturan.jsx";
import { usePengaturanPapan } from "./gunakanPengaturanPapan.js";
import { cariEngine } from "../../lib/engineCatur.js";

/* ------------------------------------------------- analisis Stockfish */
// Logika & panelnya berbagi pakai dengan halaman Teka-Teki:
// lihat src/lib/gunakanEngineCatur.js dan src/components/PanelEngine.jsx.


function Kerangka() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-40 rounded-lg bg-[#312e2b]" />
      <div className="mt-4 h-4 w-56 rounded bg-[#312e2b]" />
    </div>
  );
}

export default function PapanInteraktif({ tertanam = false, onBukaPengaturan = null, pengaturan = null } = {}) {
  const { t, bahasa } = useI18n();
  // Pengaturan dari Workspace (hidup lintas tab). Bila tidak diberikan,
  // pakai state lokal agar komponen tetap berdiri sendiri.
  const pengaturanLokal = usePengaturanPapan();
  const { nilai: pp, ubah: ubahPengaturan } = pengaturan ?? pengaturanLokal;
  const setBidakPapan = useCallback((v) => ubahPengaturan("bidak", v), [ubahPengaturan]);
  const setWarnaPapan = useCallback((v) => ubahPengaturan("warnaPapan", v), [ubahPengaturan]);
  const setAwanTampilanPenuh = useCallback((v) => ubahPengaturan("awanTampilanPenuh", v), [ubahPengaturan]);
  const setBantuanNyala = useCallback((v) => ubahPengaturan("bantuanNyala", v), [ubahPengaturan]);
  const setTampilPanahMesinPapan = useCallback((v) => ubahPengaturan("tampilPanahMesin", v), [ubahPengaturan]);

  const [pohon, setPohon] = useState(null);
  const [mode, setMode] = useState("koordinat"); // "koordinat" | "san"
  const [gagal, setGagal] = useState(false);
  // Penghitung percobaan muat buku — tombol "Coba lagi" menaikkannya agar
  // efek pemuatan data di bawah berjalan ulang.
  const [percobaan, setPercobaan] = useState(0);

  const [fen, setFen] = useState(FEN_AWAL);
  // FEN posisi awal partai saat ini — sama dengan FEN_AWAL kecuali pengguna
  // memuat FEN kustom / PGN ber-header FEN lewat dialog Review. Semua replay
  // riwayat (undo, lompat ply, tangkapan, ikon langkah) berangkat dari sini,
  // bukan selalu dari posisi awal standar.
  const [fenAwal, setFenAwal] = useState(FEN_AWAL);
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
  // Set bidak & warna papan kini dari Pengaturan (Workspace).
  const setBidak = pp.bidak;

  const [pgnTersalin, setPgnTersalin] = useState(false);
  const [, setFenTersalin] = useState(false);
  // Status tombol Bagikan: "idle" | "ok" | "gagal" (label tombol ikut berganti).
  const [statusBerbagi, setStatusBerbagi] = useState("idle");
  const [pilihan, setPilihan] = useState(-1); // id pembukaan terpilih di dropdown
  // Popup pengaturan hanya untuk tanpa onBukaPengaturan (mis. halaman
  // Teka-Teki); di /papan-interaktif tombol gear membuka layar Pengaturan.
  const [tampilSetting, setTampilSetting] = useState(false);
  // Tab aktif panel kanan: "analisa" | "books" | "explorer" | "games".
  const [tabPanel, setTabPanel] = useState("analisa");
  const [tampilPgn, setTampilPgn] = useState(false); // dialog Review (input PGN/FEN)
  // Basis data awan (chessdb.cn) — hanya dipanggil SETELAH partai keluar dari
  // buku pembukaan lokal; `posisi` menyimpan FEN yang datanya sedang tampil
  // supaya jawaban posisi lama tidak pernah menimpa posisi sekarang.
  const [awan, setAwan] = useState({
    status: "idle",
    posisi: null,
    langkah: [],
    akhir: null,
    jumlahDinilai: 0,
    jumlahBelumDinilai: 0,
  });
  // Sakelar "tampilkan semua langkah" untuk basis data awan (di Pengaturan
  // Papan). Bawaannya ON: begitu buku pembukaan habis, tab Partai langsung
  // memperlihatkan DAFTAR langkah dari basis data awan (bukan hanya satu baris
  // "langkah terbaik"). Dimatikan → panel kembali ringkas 1 langkah. Sengaja
  // TIDAK disimpan di localStorage: begitu pengguna keluar dari papan
  // interaktif, nilainya kembali ke bawaan.
  const awanTampilanPenuh = pp.awanTampilanPenuh;
  // Bantuan langkah saat menyeret (assisted play): petak tujuan diwarnai
  // hijau/kuning/merah + panah balasan lawan. Bawaannya MATI — ini alat
  // latihan, bukan analisa otomatis; dinyalakan dari Pengaturan Papan.
  const bantuanNyala = pp.bantuanNyala;
  const warnaPapan = pp.warnaPapan;
  // Tombol "Coba lagi": penghitung memicu ulang efek kueri, ref sekali-pakai
  // meminta kueri berikutnya melewati cache kegagalan klien (30 detik).
  const [awanUlang, setAwanUlang] = useState(0);
  const awanSegarkanRef = useRef(false);

  // Artikel Wikibooks tentang pembukaan aktif — berganti mengikuti langkah.
  const [artikelPembukaan, setArtikelPembukaan] = useState(null);
  const batalArtikelRef = useRef(null);

  // Analisis Stockfish (opsional, dimuat saat pertama dinyalakan). Pengaturan
  // Engine (Workspace) diteruskan ke sini: mesin, hash, threads, depth, MultiPV, skill.
  const opsiEngine = useMemo(
    () => ({
      url: cariEngine(pp.mesin).url,
      hash: pp.hashMb,
      threads: pp.threads,
      skill: pp.skillLevel,
      kedalaman: pp.kedalaman,
      multiPv: pp.multipv,
      tampilPanahMesin: pp.tampilPanahMesin,
      setTampilPanahMesin: setTampilPanahMesinPapan,
    }),
    [pp, setTampilPanahMesinPapan]
  );
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
  } = useEngineCatur(fen, opsiEngine);

  // Bantuan langkah tersimpan di Pengaturan (hidup lintas tab), tetapi engine
  // hanya dimulai saat dinyalakan. Papan yang dibuka ulang dengan bantuan
  // aktif harus menyalakan engine lagi (sekali saat mount).
  useEffect(() => {
    if (pp.bantuanNyala) nyalakanEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once: engine hanya dinyalakan sekali saat papan dibuka
  }, []);

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
  } = useSuara();

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

  /**
   * Nilai langkah terbaik posisi SEKARANG (sudut pandang pihak yang melangkah)
   * — pembanding untuk warna bantuan langkah. Diambil dari eval engine yang
   * sedang tampil; tanpa engine nilainya null dan petak hanya diberi kuning
   * netral (hook bantuan menanganinya).
   */
  const sisiSekarang = fen.split(" ")[1] === "b" ? "b" : "w";
  const nilaiTerbaikSekarang = useMemo(() => {
    const sumber = hasilEngine || hasilTertahan;
    if (!sumber) return null;
    return nilaiDariSudutPelangkah(sumber.cpPutih, sisiSekarang);
  }, [hasilEngine, hasilTertahan, sisiSekarang]);

  // Bantuan langkah ala "assisted play": worker engine TERPISAH, hanya hidup
  // saat sakelarnya nyala dan seret sedang berjalan (lihat useBantuanSeret).
  const bantuanSeret = useBantuanSeret({
    aktif: bantuanNyala,
    fen,
    nilaiTerbaik: nilaiTerbaikSekarang,
  });

  /* ----------------------------------------------------- muat data pohon */
  useEffect(() => {
    let aktif = true;
    setGagal(false);
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
  }, [percobaan]);

  useEffect(() => {
    document.title = `${t("papan.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  // Posisi berganti (langkah dimainkan, undo/redo, reset, PGN/FEN dimuat) →
  // bantuan langkah yang sedang tampil tidak lagi relevan.
  const bersihkanBantuanRef = useRef(bantuanSeret.bersihkan);
  bersihkanBantuanRef.current = bantuanSeret.bersihkan;
  useEffect(() => {
    bersihkanBantuanRef.current();
  }, [fen]);

  useEffect(
    () => () => {
      window.clearTimeout(timerSalah.current);
      window.clearTimeout(timerSalin.current);
    },
    []
  );

  /* ------------------------------------------------ pembukaan saat ini */
  // Buku pembukaan hanya valid dari posisi awal standar — partai dari FEN
  // kustom langsung dianggap di luar buku (saran datang dari basis data awan).
  const posisiKustom = fenAwal !== FEN_AWAL;
  const infoPembukaan = useMemo(() => {
    if (!pohon) return { nama: null, saran: [], cocok: false };
    if (posisiKustom) return { nama: null, saran: [], cocok: false };
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
  }, [pohon, jalur, fen, mode, posisiKustom]);

  /**
   * Masih ada lanjutan DI BUKU? Bukan sekadar `cocok`: 16.218 node buku adalah
   * daun (jalur teori habis di situ) — di posisi itu `cocok` masih true tetapi
   * `saran` kosong. Justru di situlah buku dianggap SELESAI sehingga tab Partai
   * berpindah ke basis data awan.
   */
  const masihDiBuku = infoPembukaan.cocok && infoPembukaan.saran.length > 0;

  /** Statistik posisi saat ini (diambil dari nama yang punya data statistik). */
  const _statTampil = useMemo(() => {
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
  const tangkapan = useMemo(() => susunTangkapan(riwayat, fenAwal), [riwayat, fenAwal]);

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

  /** Hapus semua tanda bantu pengguna (panah + mark petak) — satu pintu. */
  function hapusSemuaTanda() {
    setTanda({ panah: [], petak: {} });
  }

  function klikPetak(petak) {
    if (abaikanKlikRef.current) {
      abaikanKlikRef.current = false;
      return;
    }
    // Bersihkan panah/tanda lebih dulu — termasuk saat mengklik bidak.
    if (tanda.panah.length > 0 || Object.keys(tanda.petak).length > 0) {
      hapusSemuaTanda();
    }
    if (!fen || promosi) return;
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
    } catch { /* posisi rusak — deteksi promosi dilewati */ }

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
    // Cabang baru: buang semua langkah "masa depan" setelah undo — kalau
    // tidak, redo bisa memainkan jalur lama yang sudah tidak relevan.
    setRiwayatLengkap((lama) => [...lama.slice(0, riwayat.length), pindah.san]);
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
    // Sama seperti cobaLangkah: langkah baru memangkas riwayat masa depan.
    setRiwayatLengkap((lama) => [...lama.slice(0, riwayat.length), pindah.san]);
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

  // Petak asal yang sedang diseret — dipakai bantuan langkah; disimpan di ref
  // karena dipanggil dari callback pointermove (bukan render).
  const seretDariRef = useRef(null);

  const mulaiSeret = useCallback(
    (petak) => {
      if (!fen || promosi) return;
      const game = new Chess(fen);
      const bidak = game.get(petak);
      if (bidak && bidak.color === game.turn()) {
        abaikanKlikRef.current = false;
        seretDariRef.current = petak;
        pilihPetak(petak);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fen, promosi]
  );

  /**
   * Petak tujuan yang sedang dilintasi selama bidak diseret (dari PapanTekaTeki).
   * Petak yang sah → minta bantuan langkah ke engine; selain itu bantuan
   * yang tampil dibersihkan supaya warna/panah tidak menempel di petak lama.
   */
  const lewatiPetak = useCallback(
    (petak) => {
      if (!bantuanNyala) return;
      const dari = seretDariRef.current;
      if (!petak || !dari || petak === dari || !sasaran.includes(petak)) {
        bantuanSeret.bersihkan();
        return;
      }
      bantuanSeret.panggil({ dari, tujuan: petak });
    },
    // bantuanSeret stabil (useCallback) — cukup bergantung pada isi yang berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bantuanNyala, sasaran, bantuanSeret.panggil, bantuanSeret.bersihkan]
  );

  const selesaiSeret = useCallback(
    (from, to, klikUlang) => {
      seretDariRef.current = null;
      bersihkanBantuanRef.current();
      if (!fen || promosi) return;
      if (klikUlang) {
        setTerpilih(null);
        setSasaran([]);
        return;
      }
      if (!to || from === to) return;
      abaikanKlikRef.current = true;
      cobaLangkah(from, to);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fen, promosi]
  );

  const batalkanSeret = useCallback(() => {
    seretDariRef.current = null;
    bersihkanBantuanRef.current();
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
    setFenAwal(FEN_AWAL);
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
    setFen(fenAwal);
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
      const ulang = new Chess(fenAwal);
      for (const san of riwayat) {
        pindah = ulang.move(san);
      }
      game = ulang;
    } catch { /* replay gagal — jatuh ke bunyi klik */ }
    if (pindah && game) bunyikanLangkah(pindah, game);
    else bunyikan(SUARA.klik);
    const baru = riwayat.slice(0, -1);
    setRiwayat(baru);
    setJalur((lama) => lama.slice(0, -1));
    setFen(fenDariLangkah(baru, fenAwal) || fenAwal);
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
    setJalur(() => {
      // Rebuild jalur dari riwayat lengkap
      let game;
      try {
        game = new Chess(fenAwal);
      } catch {
        return [];
      }
      const jalurBaru = [];
      for (const san of riwayatLengkap) {
        let pindah;
        try {
          pindah = game.move(san);
        } catch {
          break;
        }
        if (!pindah) break;
        jalurBaru.push(kuciDariPindahan(pindah, mode));
      }
      return jalurBaru;
    });
    setFen(fenDariLangkah(riwayatLengkap, fenAwal) || fenAwal);
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
      let game;
      try {
        game = new Chess(fenAwal);
      } catch {
        return [];
      }
      const jalurBaru = [];
      for (const san of baru) {
        try {
          const pindah = game.move(san);
          if (pindah) jalurBaru.push(kuciDariPindahan(pindah, mode));
          else break;
        } catch {
          break;
        }
      }
      return jalurBaru;
    });
    setFen(fenDariLangkah(baru, fenAwal) || fenAwal);
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
      // Panah di dalam dialog atau di atas tab panel punya arti sendiri
      // (jebakan fokus dialog / pindah tab) — jangan curi untuk navigasi langkah.
      if (el.getAttribute?.("role") === "tab") return;
      if (el.closest?.('[role="dialog"]')) return;
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
    const bersih = () => {
      setPilihan(-1);
      setOrientasi("w");
      setTerpilih(null);
      setSasaran([]);
      setLangkahAkhir(null);
      setPromosi(null);
      setTanda({ panah: [], petak: {} });
    };
    const ruas = isi.split(/\s+/);
    // FEN: ruas pertama memuat "/" dan teks punya ≥6 ruas.
    if (ruas[0] && ruas[0].includes("/") && ruas.length >= 6) {
      let fenBaru;
      try {
        fenBaru = new Chess(isi).fen();
      } catch {
        return false;
      }
      // FEN dimuat sebagai posisi awal yang baru (mandiri): riwayat
      // dikosongkan karena FEN tidak menyimpan langkah-langkah sebelumnya.
      setFenAwal(fenBaru);
      setRiwayat([]);
      setRiwayatLengkap([]);
      setJalur([]);
      setFen(fenBaru);
      bersih();
      return true;
    }
    // Selain itu: anggap PGN — hormati header [FEN "…"] bila ada (partai dari
    // posisi kustom), kalau tidak mulai dari posisi awal standar.
    const daftar = sanDariPgn(isi);
    if (!daftar.length) return false;
    const fenHeader = ekstrakFenDariPgn(isi);
    let dasar = FEN_AWAL;
    if (fenHeader) {
      try {
        dasar = new Chess(fenHeader).fen();
      } catch {
        return false;
      }
    }
    const coba = new Chess(dasar);
    const sanAman = [];
    try {
      for (const san of daftar) {
        const pindah = coba.move(san);
        if (!pindah) return false;
        sanAman.push(pindah.san);
      }
    } catch {
      return false;
    }
    const jalurBaru = [];
    const main = new Chess(dasar);
    for (const san of sanAman) {
      const pindah = main.move(san);
      jalurBaru.push(kuciDariPindahan(pindah, mode));
    }
    setFenAwal(dasar);
    setRiwayat(sanAman);
    setRiwayatLengkap(sanAman);
    setJalur(jalurBaru);
    setFen(coba.fen());
    bersih();
    return true;
  }

  function salinPgn() {
    if (!riwayat.length && !posisiKustom) return;
    const teks = susunPgnDenganFen(riwayat, fenAwal);
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

  function _salinFen() {
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

  /** Bagikan partai: Web Share API bila tersedia, kalau tidak salin PGN/FEN. */
  async function bagikanPartai() {
    const teks = susunPgnDenganFen(riwayat, fenAwal) || fen;
    try {
      if (navigator.share) {
        await navigator.share({ title: t("papan.judul"), text: teks });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(teks);
      } else {
        setStatusBerbagi("gagal");
        return;
      }
      setStatusBerbagi("ok");
    } catch (e) {
      // AbortError = pengguna menutup lembar berbagi — bukan kegagalan.
      if (e?.name === "AbortError") return;
      setStatusBerbagi("gagal");
    } finally {
      window.clearTimeout(timerSalin.current);
      timerSalin.current = window.setTimeout(() => setStatusBerbagi("idle"), 2000);
    }
  }

  /** Navigasi keyboard antar-tab panel (panah/Home/End) — fokus ikut berpindah. */
  const tabRefs = useRef([]);
  function saatKunciTab(e) {
    const aktif = TAB_PANEL.findIndex((tab) => tab.id === tabPanel);
    let berikut = null;
    if (e.key === "ArrowRight") berikut = (aktif + 1) % TAB_PANEL.length;
    else if (e.key === "ArrowLeft") berikut = (aktif - 1 + TAB_PANEL.length) % TAB_PANEL.length;
    else if (e.key === "Home") berikut = 0;
    else if (e.key === "End") berikut = TAB_PANEL.length - 1;
    if (berikut === null) return;
    e.preventDefault();
    e.stopPropagation();
    setTabPanel(TAB_PANEL[berikut].id);
    tabRefs.current[berikut]?.focus();
  }

  function muatJalur(entri) {
    // Katalog selalu berangkat dari posisi awal standar.
    setFenAwal(FEN_AWAL);
    if (mode === "koordinat") {
      const hasil = fenDanSanDariKoordinat(entri.langkah);
      if (!hasil) return;
      setRiwayat(hasil.san);
      setRiwayatLengkap(hasil.san);
      setJalur([...entri.langkah]);
      setFen(hasil.fen);
    } else {
      const fenHasil = fenDariLangkah(entri.langkah, FEN_AWAL);
      if (!fenHasil) return;
      setRiwayat([...entri.langkah]);
      setRiwayatLengkap([...entri.langkah]);
      setJalur([...entri.langkah]);
      setFen(fenHasil);
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
   *   - remis sesudah langkah (pat/50-langkah/…) → dinilai sebagai 0.00
   *     pasti (posisi terminal tak punya snapshot eval),
   *   - skakmat/tak ada langkah sebelumnya → tanpa ikon klasifikasi.
   * Tanpa engine dan di luar buku, langkah biasa tidak diberi ikon.
   * (Skakmat punya lencana sendiri di atas raja lawan — lihat `ikonSkakmat`.)
   */
  const ikonLangkahAkhir = useMemo(() => {
    if (!riwayat.length) return null;
    const sanTerakhir = riwayat[riwayat.length - 1];
    const fenSebelum = fenDariLangkah(riwayat.slice(0, -1), fenAwal);
    if (!fenSebelum) return null;

    let game;
    let pindah;
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
    const rating = ratingDariSnapshotEval({
      san: sanTerakhir,
      warnaPenglangkah: pindah.color,
      fenSesudah: fen,
      sebelum,
      sesudah,
      statusTerminal: statusTerminalFen,
    });
    return rating ? { petak: kePetak, rating } : null;
    // hasilTertahan/hasilEngine jadi dependensi agar ikon terbarui begitu
    // snapshot eval posisi tersedia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riwayat, fen, fenAwal, infoPembukaan.cocok, infoPembukaan.nama, engineNyala, hasilTertahan]);

  /**
   * Rating per langkah riwayat — ikon kecil di DaftarRiwayat
   * ("1. e4 📖 e5 📖"). Kosakata & ambang sama dengan ikon di petak papan:
   *   - "book"   → langkah masih di jalur buku pembukaan (telusuri pohon),
   *   - "forced" → satu-satunya langkah legal,
   *   - engine   → best/miss/blunder/mistake/inaccuracy/good/excellent —
   *                butuh snapshot eval posisi sebelum & sesudah tiap langkah,
   *                terisi bertahap seiring posisi dianalisis engine.
   * Langkah yang belum bisa dinilai → null (tanpa ikon). Indeks = ply.
   */
  const ratingRiwayat = useMemo(() => {
    const hasil = new Array(riwayatLengkap.length).fill(null);

    // Buku pembukaan — telusuri pohon sepanjang jalur; semua ply yang masih
    // cocok adalah langkah buku (posisi FEN kustom tidak punya buku).
    if (pohon && !posisiKustom) {
      let node = pohon;
      for (let i = 0; i < jalur.length; i++) {
        if (!node.c || !node.c[jalur[i]]) break;
        node = node.c[jalur[i]];
        hasil[i] = "book";
      }
    }

    // Satu-satunya langkah legal tidak butuh engine; penilaian eval iya.
    let game;
    try {
      game = new Chess(fenAwal);
    } catch {
      return hasil;
    }
    for (let i = 0; i < riwayat.length; i++) {
      const fenSebelum = game.fen();
      let pindah;
      try {
        pindah = game.move(riwayat[i]);
      } catch {
        break;
      }
      if (!pindah) break;
      if (hasil[i]) continue; // sudah "book" — engine tidak menimpa buku
      try {
        if (isForced({ before: fenSebelum })) {
          hasil[i] = "forced";
          continue;
        }
      } catch {
        /* abaikan */
      }
      if (!engineNyala) continue;
      hasil[i] = ratingDariSnapshotEval({
        san: riwayat[i],
        warnaPenglangkah: pindah.color,
        fenSesudah: game.fen(),
        sebelum: snapshotEvalRef.current.get(fenSebelum),
        sesudah: snapshotEvalRef.current.get(game.fen()),
        statusTerminal: statusTerminalFen,
      });
    }
    return hasil;
    // hasilTertahan memicu hitung ulang saat snapshot eval posisi baru tersedia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riwayat, riwayatLengkap.length, jalur, fenAwal, pohon, posisiKustom, engineNyala, hasilTertahan]);

  /**
   * Komentator langsung — bahan mentah untuk KartuKomentator di tab analisa.
   * Fakta papan (skak/tangkapan/rokade/bidak menggantung) dihitung dari
   * chess.js dan selalu tersedia; penilaian + skor hanya ikut bila engine
   * menyala (memakai rating `ikonLangkahAkhir` dan snapshot eval yang sama
   * dengan ikon di petak, sehingga komentar & ikon selalu sejalan).
   */
  const preferensiKomentator = usePreferensiKomentator();
  const faktaKomentator = useMemo(() => {
    if (!riwayat.length) return null;
    const fenSebelum = fenDariLangkah(riwayat.slice(0, -1), fenAwal);
    if (!fenSebelum) return null;
    return faktaLangkah(fenSebelum, riwayat[riwayat.length - 1]);
  }, [riwayat, fenAwal]);
  const dataKomentator = useMemo(() => {
    if (!riwayat.length) {
      return { evalSesudah: null, saranTerbaik: null, engineMenilai: false };
    }
    const fenSebelum = fenDariLangkah(riwayat.slice(0, -1), fenAwal);
    if (!fenSebelum) {
      return { evalSesudah: null, saranTerbaik: null, engineMenilai: false };
    }
    const sebelum = engineNyala ? snapshotEvalRef.current.get(fenSebelum) : null;
    const sesudah = engineNyala ? snapshotEvalRef.current.get(fen) : null;
    return {
      evalSesudah: sesudah ? { cpPutih: sesudah.cpPutih, matePutih: sesudah.matePutih } : null,
      saranTerbaik: sebelum?.bestSan || null,
      engineMenilai: engineNyala && !sesudah,
    };
    // hasilTertahan memicu hitung ulang begitu snapshot eval posisi tersedia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riwayat, fen, fenAwal, engineNyala, hasilTertahan]);

  /**
   * Basis data awan (chessdb.cn) — LANJUTAN setelah buku pembukaan lokal habis.
   *
   * Buku lokal hanya memuat teori; begitu `masihDiBuku` menjadi false (langkah
   * keluar dari buku ATAU jalur buku sudah habis di daun) tidak ada lagi saran
   * langkah tanpa menyalakan engine. Di titik itulah chessdb.cn ditanyai (lewat
   * backend kita — browser dilarang CSP & CORS), dan hanya bila datanya memang
   * akan terlihat (komentator menyala atau tab Partai dibuka) supaya kueri ke
   * layanan publik itu tidak boros.
   */
  useEffect(() => {
    const perlu =
      !masihDiBuku &&
      // Posisi FEN kustom langsung boleh ditanyakan walau belum ada langkah.
      (riwayat.length > 0 || posisiKustom) &&
      // Partai yang sudah selesai (mat/remis) tidak perlu ditanyakan — kalimat
      // komentator sudah menutupnya.
      !faktaKomentator?.skakmat &&
      !faktaKomentator?.remis &&
      (preferensiKomentator.nyala || tabPanel === "games");
    if (!perlu) {
      setAwan((lama) =>
        lama.status === "idle"
          ? lama
          : { status: "idle", posisi: null, langkah: [], akhir: null, jumlahDinilai: 0, jumlahBelumDinilai: 0 }
      );
      return undefined;
    }
    setAwan({ status: "memuat", posisi: fen, langkah: [], akhir: null, jumlahDinilai: 0, jumlahBelumDinilai: 0 });
    const kendali = new AbortController();
    // Jeda kecil: pengguna sering menelusuri beberapa langkah cepat; kueri
    // hanya untuk posisi yang benar-benar berhenti ditampilkan.
    const segarkan = awanSegarkanRef.current;
    awanSegarkanRef.current = false;
    const jam = setTimeout(() => {
      ambilBasisDataAwan(fen, { signal: kendali.signal, segarkan })
        .then((hasil) => {
          setAwan({
            status: hasil.langkah.length ? "siap" : "kosong",
            posisi: fen,
            langkah: hasil.langkah,
            akhir: hasil.akhir,
            // Jumlah asli dari server — langkah "??" bisa dipotong batas
            // kirim, tetapi catatan panel tetap memakai angka sebenarnya.
            jumlahDinilai: hasil.jumlahDinilai ?? 0,
            jumlahBelumDinilai: hasil.jumlahBelumDinilai ?? 0,
          });
        })
        .catch((e) => {
          if (e?.name === "AbortError") return;
          setAwan({
            status: "galat",
            posisi: fen,
            langkah: [],
            akhir: null,
            jumlahDinilai: 0,
            jumlahBelumDinilai: 0,
            pesan: e?.message || null,
            kode: e?.kode || null,
          });
        });
    }, 350);
    return () => {
      clearTimeout(jam);
      kendali.abort();
    };
    // `riwayat.length` hanya penanda "sudah ada langkah"; perubahan `fen`
    // sudah mewakili langkah baru (undo/redo tidak memicu kueri baru).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, riwayat.length, masihDiBuku, tabPanel, preferensiKomentator.nyala, awanUlang, posisiKustom]);

  const cobaLagiAwan = useCallback(() => {
    awanSegarkanRef.current = true;
    setAwanUlang((n) => n + 1);
  }, []);

  /**
   * Tinjauan pasca-langkah dari basis data awan (chessdb.cn) — hanya saat
   * engine mati. `saran` = langkah terbaik untuk sisi kita di posisi SEBELUM
   * langkah terakhir ("langkah terbaik waktu itu …"); `ekspresi` = emosi
   * karakter dari skor langkah yang BARU kita mainkan (mis. -0,5 → bingung).
   * Data diintip dari cache klien (posisi itu baru saja tampil, hampir selalu
   * tersimpan) — TANPA kueri tambahan ke chessdb.cn.
   */
  const tinjauanAwan = useMemo(() => {
    if (engineNyala || riwayat.length === 0) return null;
    const fenSebelum = fenDariLangkah(riwayat.slice(0, -1), fenAwal);
    if (!fenSebelum) return null;
    const data = intipBasisDataAwan(fenSebelum);
    if (!data?.langkah?.length) return null;
    return {
      saran: saranAwanKomentator(data),
      ekspresi: ekspresiDariSkorAwan(skorLangkahAwan(data, riwayat[riwayat.length - 1])),
    };
  }, [riwayat, engineNyala, fenAwal]);

  /** Saran awan untuk kalimat komentator — hanya saat engine mati. */
  const saranAwan = tinjauanAwan?.saran ?? null;

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
  const _jumlahNama = infoPembukaan.nama ? infoPembukaan.nama.length : 0;

  let _giliranKini = "w";
  try {
    _giliranKini = new Chess(fen).turn();
  } catch {
    /* abaikan */
  }

  return (
    <div className={`flex flex-col ${tertanam ? "h-full w-full" : "min-h-screen lg:h-screen"} overflow-hidden bg-[#262421] text-gray-200 font-sans select-none`}>
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">


        {/* ═══════════════════════════════════════════════════════ */}
        {/* AREA UTAMA                                            */}
        {/* ═══════════════════════════════════════════════════════ */}
        <main className="flex-1 flex items-center justify-center bg-[#262421] min-w-0 overflow-hidden">
          <div className="flex h-full w-full max-w-[1280px] min-h-0 flex-col px-4 py-6 md:px-8">
          {gagal ? (
            <div className="flex flex-col items-start gap-3">
              <p className="rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {t("papan.gagalMuat")}
              </p>
              <button
                type="button"
                onClick={() => setPercobaan((n) => n + 1)}
                className="rounded-full border border-red-800 px-5 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-950/60"
              >
                {t("common.cobaLagi")}
              </button>
            </div>
          ) : !pohon ? (
            <div className="mx-auto max-w-[560px]">
              <p className="mb-6 text-sm text-slate-400">{t("papan.memuat")}</p>
              <Kerangka />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-3">
              <div className="mx-auto flex w-full max-w-[520px] shrink-0 flex-col justify-center overflow-y-auto lg:mx-0 lg:max-w-[min(520px,calc(100dvh-140px),calc(100vw-634px))]">
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
                  <BilahEvaluasi
                    cpPutih={hasilTertahan?.cpPutih ?? 0}
                    matePutih={hasilTertahan?.matePutih ?? null}
                    teksSkor={hasilTertahan?.teksSkor ?? ""}
                    orientasi={orientasi}
                    label={t("papan.engineSkor")}
                    adaEvaluasi={Boolean(hasilTertahan)}
                  />
                  <div className="relative min-w-0 flex-1">
                  <PapanTekaTeki
                    fen={fen}
                    orientasi={orientasi}
                    gayaGeser="analisa"
                    terpilih={terpilih}
                    sasaran={sasaran}
                    kesalahan={kesalahan}
                    langkahAkhir={langkahAkhir}
                    tanda={tanda}
                    panahMesin={tampilPanahMesin ? panahMesin : null}
                    bantuanPetak={bantuanNyala ? bantuanSeret.petakBantuan : null}
                    bantuanPanah={bantuanNyala ? bantuanSeret.panahBantuan : null}
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
                    onLewatiPetak={lewatiPetak}
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

              </div>

              {/* Kolom kontrol papan (gear & flip) — di samping papan, ala LayoutTekaTeki */}
              <div className="flex flex-col items-center gap-2 pt-14 lg:-ml-3">
                <button
                  type="button"
                  onClick={() => (onBukaPengaturan ? onBukaPengaturan() : setTampilSetting(!tampilSetting))}
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
                <div
                  role="tablist"
                  aria-label={t("papan.panel")}
                  onKeyDown={saatKunciTab}
                  className="flex flex-shrink-0 border-b border-[#312e2b] bg-[#1e1c18]"
                >
                  {TAB_PANEL.map((tab, indeks) => (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        tabRefs.current[indeks] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`tab-papan-${tab.id}`}
                      aria-selected={tabPanel === tab.id}
                      aria-controls={`panel-papan-${tab.id}`}
                      tabIndex={tabPanel === tab.id ? 0 : -1}
                      onClick={() => setTabPanel(tab.id)}
                      className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold border-b-2 transition-all ${
                        tabPanel === tab.id
                          ? "border-[#81b64c] text-white bg-[#262421]"
                          : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#262421]"
                      }`}
                    >
                      <IkonTab nama={tab.id} />
                      {t(tab.labelKey)}
                    </button>
                  ))}
                </div>
                <div
                  role="tabpanel"
                  id={`panel-papan-${tabPanel}`}
                  aria-labelledby={`tab-papan-${tabPanel}`}
                  className={`min-h-0 flex-1 p-4 ${
                    tabPanel === "analisa"
                      ? "flex flex-col overflow-hidden"
                      : "overflow-y-auto"
                  }`}
                >
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
                    // Penjelajah = artikel pembukaan saja (daftar langkah
                    // pembukuan kini tampil di tab Partai).
                    namaUtama ? (
                      <KartuArtikelPembukaan
                        artikel={artikelPembukaan}
                        t={t}
                      />
                    ) : !infoPembukaan.cocok ? (
                      <p className="mt-1.5 text-sm font-medium text-gray-400">
                        {t("papan.diLuarBuku")}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-sm font-medium text-gray-400">
                        {t("papan.petunjukAwal")}
                      </p>
                    )
                  ) : tabPanel === "games" ? (
                    // Partai = satu tempat untuk LANJUTAN langkah: selama buku
                    // masih punya saran, yang tampil tabel pembukuan; begitu
                    // buku selesai (langkah keluar buku ATAU jalur buku habis)
                    // tabel itu digantikan daftar langkah basis data awan
                    // (chessdb.cn) dengan judul yang sama-sama "Daftar Langkah".
                    masihDiBuku ? (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-100">{t("papan.daftarLangkah")}</p>
                          <span className="text-xs text-gray-500">{t("papan.basisData")}</span>
                        </div>
                        <LangkahExplorer langkah={infoPembukaan.saran} bahasa={bahasa} onPilih={mainkanSan} t={t} />
                      </div>
                    ) : (
                      <PanelBasisDataAwan
                        awan={awan}
                        fen={fen}
                        onPilih={mainkanSan}
                        onCobaLagi={cobaLagiAwan}
                        onNyalakanEngine={nyalakanEngine}
                        engineNyala={engineNyala}
                        tampilanPenuh={awanTampilanPenuh}
                        t={t}
                      />
                    )
                  ) : (
                    <>
                      {/* Toggle nyala/mati engine — pola baris "Analysis" di prompt.md */}
                      <div className="mb-3 flex shrink-0 items-center justify-between border-b border-[#312e2b] pb-3">
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
                          <span className="ml-1 font-normal text-gray-500">{cariEngine(pp.mesin).label}</span>
                        </p>
                      </div>

                      {/* Bantuan langkah: hanya status berjalan — petunjuk panjang dihapus. */}
                      {bantuanNyala &&
                        (bantuanSeret.status === "menghitung" || bantuanSeret.status === "menunggu") && (
                          <p className="mt-2 shrink-0 text-[11px] leading-snug text-gray-500">
                            {t("papan.bantuanMenghitung")}
                          </p>
                        )}

                      {/* Status posisi: komentator menggantikan nama pembukaan saat aktif. */}
                      <div className="mt-3 min-w-0 shrink-0 border-b border-[#312e2b] pb-3">
                        {preferensiKomentator.nyala ? (
                          <KartuKomentator
                            fakta={faktaKomentator}
                            rating={ikonLangkahAkhir?.rating || null}
                            evalSesudah={dataKomentator.evalSesudah}
                            namaPembukaan={infoPembukaan.cocok && namaUtama ? namaUtama[1] : null}
                            saranTerbaik={dataKomentator.saranTerbaik}
                            saranAwan={saranAwan}
                            ekspresiAwan={tinjauanAwan?.ekspresi ?? null}
                            engineNyala={engineNyala}
                            engineMenilai={dataKomentator.engineMenilai}
                            posisiAwal={riwayat.length === 0 && !posisiKustom}
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
                            {posisiKustom ? t("papan.posisiKustom") : t("papan.posisiAwal")}
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
                        <div className="mt-3 shrink-0 border-b border-[#312e2b] pb-3">
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

                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                        <DaftarRiwayat
                          langkah={riwayatLengkap}
                          aktifPly={riwayat.length - 1}
                          rating={ratingRiwayat}
                          onPilih={keLangkah}
                          t={t}
                        />
                      </div>

                    </>
                  )}
                </div>

                {/* Panel Kontrol Bawah Navigasi — menyatu di dasar panel ala LayoutTekaTeki */}
                <div className="mt-auto flex-shrink-0 space-y-3 rounded-b-lg border-t border-[#312e2b] bg-[#1e1c18] p-3">
                  <div className="flex items-center gap-1 rounded-lg border border-[#312e2b] bg-[#262421] p-1">
                    <TombolKeAwal
                      onClick={keAwal}
                      disabled={!riwayat.length}
                      t={t}
                    />
                    <TombolMundur
                      onClick={undo}
                      disabled={!riwayat.length}
                      t={t}
                    />
                    <TombolMaju
                      onClick={redo}
                      disabled={riwayat.length >= riwayatLengkap.length}
                      t={t}
                    />
                    <TombolKeAkhir
                      onClick={keAkhir}
                      disabled={riwayat.length >= riwayatLengkap.length}
                      t={t}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-300">
                    <button
                      type="button"
                      onClick={reset}
                      className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b]"
                    >
                      <Plus className="h-4 w-4 text-gray-400" />
                      <span>{t("papan.baru")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={salinPgn}
                      disabled={!riwayat.length && !posisiKustom}
                      title={t("papan.daftarLangkahPgn")}
                      className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Bookmark className="h-4 w-4 text-gray-400" />
                      <span>{pgnTersalin ? t("papan.tersalinSingkat") : t("papan.simpan")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTampilPgn(true)}
                      title={t("papan.inputPgnFen")}
                      className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b]"
                    >
                      <RotateCw className="h-4 w-4 text-gray-400" />
                      <span>{t("papan.tinjau")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={bagikanPartai}
                      title={t("papan.berbagi")}
                      className="flex flex-col items-center gap-1 rounded border border-[#312e2b] bg-[#262421] p-2 transition hover:bg-[#312e2b]"
                    >
                      <Share2 className="h-4 w-4 text-gray-400" />
                      <span>
                        {statusBerbagi === "ok"
                          ? t("papan.tersalinSingkat")
                          : statusBerbagi === "gagal"
                            ? t("papan.berbagiGagal")
                            : t("papan.berbagi")}
                      </span>
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
        <MasukanPgn onTerapkan={terapkanTeks} onTutup={() => setTampilPgn(false)} t={t} />
      )}
      {tampilSetting && (
        <PopupPengaturan
          onTutup={() => setTampilSetting(false)}
          t={t}
          bidak={setBidak}
          setBidak={setBidakPapan}
          suaraNyala={suaraNyala}
          setSuaraNyala={setSuaraNyala}
          tampilPanahMesin={tampilPanahMesin}
          setTampilPanahMesin={setTampilPanahMesin}
          awanTampilanPenuh={awanTampilanPenuh}
          setAwanTampilanPenuh={setAwanTampilanPenuh}
          bantuanNyala={bantuanNyala}
          setBantuanNyala={(nilai) => {
            setBantuanNyala(nilai);
            // Pembanding warna datang dari eval engine posisi sekarang —
            // menyalakan bantuan berarti menyalakan engine juga.
            if (nilai) nyalakanEngine();
          }}
          warnaPapan={warnaPapan}
          setWarnaPapan={setWarnaPapan}
          kartuKomentator={{
            nyala: preferensiKomentator.nyala,
            setNyala: preferensiKomentator.setNyala,
            gaya: preferensiKomentator.gaya,
            setGaya: preferensiKomentator.setGaya,
            t,
          }}
        />
      )}
    </div>
  );
}

/** Buang sisa markup wiki (pranala [[…]], templat {{…}}, tanda petik '''…''',
 *  tag HTML) dari sebaris teks agar terbaca seperti artikel biasa. */
