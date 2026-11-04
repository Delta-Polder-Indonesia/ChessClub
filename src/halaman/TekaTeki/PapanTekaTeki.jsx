import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { ambilSumberBidak } from "../../components/chess/pemuatBidak.js";
import { GESER_ISEPIC, geseranDenganAsalEksplisit, petaBidak } from "./animasiBidak.js";
import { useI18n } from "../../lib/i18n.jsx";
import { TEMA_PAPAN } from "./temaPapan.js";
import RatingSVG from "../Analisa/komponen/svg/rating.jsx";
import ResultSVG from "../Analisa/komponen/svg/result.jsx";

/**
 * Label keterangan (tooltip) lencana papan. Semuanya lewat kamus
 * `papan.ikonLangkah.*`, `papan.ikonSkakmat`, dan `papan.ikonMahkota` supaya
 * versi Inggris ikut benar (sebelumnya teks Indonesia ditulis mentah di sini,
 * sehingga pengguna EN melihat tooltip berbahasa Indonesia).
 */

const FILE = ["a", "b", "c", "d", "e", "f", "g", "h"];

/**
 * Warna tanda bantu — mengikuti referensi chess.com.
 * Panah: fill rgba(..., 0.8) + opacity 0.8 (persis SVG chess.com, oranye).
 * Petak: warna bawaan KUNING; Shift/Ctrl/Alt → merah/hijau/biru.
 */
const WARNA_PANAH = {
  bawaan: "rgba(255, 170, 0, 0.8)", // oranye khas chess.com
  merah: "rgba(216, 60, 60, 0.8)",
  hijau: "rgba(0, 150, 80, 0.8)",
  biru: "rgba(60, 90, 216, 0.8)",
};
const WARNA_PETAK = {
  bawaan: "rgba(255, 255, 0, 0.5)", // kuning — tanda petak
  merah: "rgba(216, 60, 60, 0.5)",
  hijau: "rgba(0, 150, 80, 0.5)",
  biru: "rgba(60, 90, 216, 0.5)",
};

/**
 * Warna petak "Bantuan Langkah" (assisted play) — hijau aman, kuning
 * diperebutkan, merah merugikan. Lebih pekat dari tanda pengguna supaya
 * terbaca sekilas saat bidak sedang diseret di atasnya.
 */
const WARNA_BANTUAN = {
  hijau: "rgba(0, 170, 90, 0.55)",
  kuning: "rgba(230, 180, 0, 0.55)",
  merah: "rgba(220, 50, 50, 0.55)",
};

/** Warna tanda berdasarkan tombol pengubah: default=kuning, Shift=merah, Ctrl=hijau, Alt=biru. */
function warnaDariPeristiwa(e) {
  if (e.shiftKey) return "merah";
  if (e.ctrlKey || e.metaKey) return "hijau";
  if (e.altKey) return "biru";
  return "bawaan";
}

/* `petaBidak` dipakai bersama dengan logika animasi geser (animasiBidak.js)
   agar papan dan penyimpul langkah membaca FEN dengan cara yang sama. */

/** 64 petak dalam urutan tampilan: orientasi "w" = putih di bawah. */
function daftarPetak(orientasi) {
  const petak = [];
  const baris =
    orientasi === "w"
      ? ["8", "7", "6", "5", "4", "3", "2", "1"]
      : ["1", "2", "3", "4", "5", "6", "7", "8"];
  for (const b of baris) {
    const lajur = orientasi === "w" ? FILE : [...FILE].reverse();
    for (const l of lajur) petak.push(l + b);
  }
  return petak;
}

/** Pusat petak dalam satuan viewBox 100×100 sesuai orientasi papan.
 *  Saat terbalik, grid CSS membalik lajur ([h..a]) — sumbu-x ikut dicerminkan
 *  agar panah SVG jatuh tepat di petak yang sama dengan gridnya. */
function pusatPetak(petak, orientasi) {
  const kolom = FILE.indexOf(petak[0]);
  const baris = Number(petak[1]);
  const kolomLayar = orientasi === "w" ? kolom : 7 - kolom;
  return {
    x: (kolomLayar + 0.5) * 12.5,
    y: (orientasi === "w" ? 8 - baris + 0.5 : baris - 0.5) * 12.5,
  };
}

/** Selisih langkah dalam satuan petak (tidak terpengaruh orientasi). */
function langkahKotak(from, to) {
  return {
    dx: FILE.indexOf(to[0]) - FILE.indexOf(from[0]),
    dy: Number(to[1]) - Number(from[1]),
  };
}

/*
 * Geometri panah — direkayasa-balik dari SVG chess.com agar SAMA PERSIS.
 *
 * Referensi (panah lurus, e2-e4):
 *   points 54.875 85.75, 54.875 101.75, 53 101.75, 56.25 106.25,
 *           59.5 101.75, 57.625 101.75, 57.625 85.75
 *   transform rotate(180 56.25 81.25)  — pusat putar = petak asal
 *   fill rgba(255,170,0,0.8), opacity 0.8
 * → batang setengah-lebar 1.375 dari +4.5 hingga L−4.5; kepala segitiga
 *   berpunggung DATAR setengah-lebar 3.25; ujung tepat di tengah tujuan.
 *
 * Referensi (panah kuda, f1-e3): poligon 9 titik berbentuk SIKU —
 *   batang mengikuti kaki panjang, membelok di sudut, kepala masuk ke tujuan.
 */
const SETENGAH_BATANG = 1.375;
const SETENGAH_KEPALA = 3.25;
const JARAK_AWAL = 4.5;

/** Panah lurus (bidak, benteng, gajah, menteri, raja): 7 titik. */
function titikPanahLurus(s, t) {
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const L = Math.hypot(dx, dy) || 1;
  const u = { x: dx / L, y: dy / L };
  const n = { x: -u.y, y: u.x };
  const p = (depan, samping) => ({
    x: s.x + u.x * depan + n.x * samping,
    y: s.y + u.y * depan + n.y * samping,
  });
  return [
    p(JARAK_AWAL, -SETENGAH_BATANG),
    p(L - JARAK_AWAL, -SETENGAH_BATANG),
    p(L - JARAK_AWAL, -SETENGAH_KEPALA),
    p(L, 0),
    p(L - JARAK_AWAL, SETENGAH_KEPALA),
    p(L - JARAK_AWAL, SETENGAH_BATANG),
    p(JARAK_AWAL, SETENGAH_BATANG),
  ];
}

/** Panah langkah kuda: poligon siku 9 titik (sama dengan chess.com). */
function titikPanahKuda(s, t) {
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  // Kaki pertama = sumbu panjang, kaki kedua = sumbu pendek.
  let u1;
  let u2;
  let L1;
  let L2;
  if (Math.abs(dy) >= Math.abs(dx)) {
    u1 = { x: 0, y: Math.sign(dy) || 1 };
    u2 = { x: Math.sign(dx) || 1, y: 0 };
    L1 = Math.abs(dy);
    L2 = Math.abs(dx);
  } else {
    u1 = { x: Math.sign(dx) || 1, y: 0 };
    u2 = { x: 0, y: Math.sign(dy) || 1 };
    L1 = Math.abs(dx);
    L2 = Math.abs(dy);
  }
  // Kerangka lokal: sumbu x → u2, sumbu y → u1.
  const p = (x, y) => ({
    x: s.x + u2.x * x + u1.x * y,
    y: s.y + u2.y * x + u1.y * y,
  });
  return [
    p(-SETENGAH_BATANG, JARAK_AWAL),
    p(-SETENGAH_BATANG, L1 + SETENGAH_BATANG),
    p(L2 - JARAK_AWAL, L1 + SETENGAH_BATANG),
    p(L2 - JARAK_AWAL, L1 + SETENGAH_KEPALA),
    p(L2, L1),
    p(L2 - JARAK_AWAL, L1 - SETENGAH_KEPALA),
    p(L2 - JARAK_AWAL, L1 - SETENGAH_BATANG),
    p(SETENGAH_BATANG, L1 - SETENGAH_BATANG),
    p(SETENGAH_BATANG, JARAK_AWAL),
  ];
}

/** Titik-titik poligon panah dari petak ke petak. */
function titikPanah(from, to, orientasi) {
  const s = pusatPetak(from, orientasi);
  const t = pusatPetak(to, orientasi);
  const { dx, dy } = langkahKotak(from, to);
  const kuda =
    (Math.abs(dx) === 1 && Math.abs(dy) === 2) ||
    (Math.abs(dx) === 2 && Math.abs(dy) === 1);
  return kuda ? titikPanahKuda(s, t) : titikPanahLurus(s, t);
}

function titikKePoints(titik) {
  return titik
    .map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`)
    .join(" ");
}

/**
 * Satu petak papan (tombol + isinya). Dimemoisasi: papan induk menghitung
 * prop PRIMITIF per petak (bidak, penanda, ikon, …), sehingga langkah catur
 * hanya me-render ulang petak yang benar-benar berubah — bukan seluruh 64
 * petak. Ini yang membuat jeda klik→luncuran mendekati nol seperti papan
 * referensi (isepic/chess.com); diff DOM yang mahal terjadi di dalam sini
 * dan dilewati React untuk petak tak berubah.
 */
const Petak = memo(function Petak({
  sq,
  baris,
  kolom,
  bidak,
  bisaSeret,
  dipilih,
  jadiSasaran,
  jadiTangkap,
  jadiPetunjuk,
  jadiSalah,
  jadiAkhir,
  sedangDiseret,
  warnaMark,
  bantuan,
  ratingIkon,
  mahkota,
  skakmat,
  resign,
  warnaPapan,
  setBidak,
  onTekan,
  onKlik,
}) {
  const { t } = useI18n();

  /** Label lencana klasifikasi langkah; nilai di luar kamus ditampilkan apa adanya. */
  const labelIkonLangkah = (rating) => {
    const kunci = `papan.ikonLangkah.${rating}`;
    const teks = t(kunci);
    return teks === kunci ? rating : teks;
  };

  const terang = (baris + kolom) % 2 === 0;

  return (
    <button
      type="button"
      data-petak={sq}
      aria-label={t(
        bidak ? "tekaTeki.ariaPetakBidak" : "tekaTeki.ariaPetakKosong",
        {
          sq,
          bidak: bidak
            ? t(`tekaTeki.namaBidak.${bidak.toLowerCase()}`)
            : "",
          warna: bidak
            ? t(
                bidak === bidak.toUpperCase()
                  ? "tekaTeki.warnaPutih"
                  : "tekaTeki.warnaHitam"
              )
            : "",
        }
      )}
      onPointerDown={(e) => onTekan(e, sq)}
      onClick={() => onKlik(sq)}
      style={{
        backgroundColor: terang ? warnaPapan.terang : warnaPapan.gelap,
        touchAction: bisaSeret ? "none" : undefined,
      }}
      className={`relative flex items-center justify-center border-0 p-0 outline-none focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 ${bisaSeret ? "cursor-grab" : ""}`}
    >
      {jadiAkhir && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "rgba(205, 210, 106, 0.5)" }}
          aria-hidden="true"
        />
      )}
      {jadiPetunjuk && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "rgba(0, 150, 80, 0.5)" }}
          aria-hidden="true"
        />
      )}
      {jadiSalah && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "rgba(216, 60, 60, 0.55)" }}
          aria-hidden="true"
        />
      )}
      {dipilih && (
        <span
          data-bantu-pilih="1"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "rgba(255, 255, 0, 0.45)" }}
          aria-hidden="true"
        />
      )}

      {/* Tanda petak hasil klik kanan — di bawah bidak agar bidak tetap jelas. */}
      {warnaMark && (
        <span
          data-tanda-petak={warnaMark}
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: WARNA_PETAK[warnaMark] }}
          aria-hidden="true"
        />
      )}

      {/* Bantuan langkah (assisted play): hijau/kuning/merah pada petak
          tujuan yang sedang dilintasi saat bidak diseret. */}
      {bantuan && (
        <span
          data-bantuan={bantuan}
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: WARNA_BANTUAN[bantuan] }}
          aria-hidden="true"
        />
      )}

      {/* Koordinat: huruf lajur di baris bawah, angka baris di kolom kiri. */}
      {baris === 7 && (
        <span
          className="pointer-events-none absolute bottom-0.5 right-1 text-[9px] md:text-[10px] font-bold leading-none"
          style={{ color: terang ? warnaPapan.teksTerang : warnaPapan.teksGelap }}
        >
          {sq[0]}
        </span>
      )}
      {kolom === 0 && (
        <span
          className="pointer-events-none absolute top-0.5 left-1 text-[9px] md:text-[10px] font-bold leading-none"
          style={{ color: terang ? warnaPapan.teksTerang : warnaPapan.teksGelap }}
        >
          {sq[1]}
        </span>
      )}

      {/* Bidak — disembunyikan dari petak asal saat sedang diseret. */}
      {bidak && !sedangDiseret && (
        <span
          data-bidak={bidak}
          className="relative z-10 flex h-[88%] w-[88%] items-center justify-center drop-shadow pointer-events-none"
        >
          <ChessPiece piece={bidak} set={setBidak} className="h-full w-full" />
        </span>
      )}

      {/* Penanda petak tujuan legal: titik untuk petak kosong, CINCIN untuk
          tangkapan. "Ada bidak di petak tujuan" saja tidak cukup — en passant
          adalah satu-satunya langkah yang memakan bidak di petak kosong, jadi
          daftarnya ikut dipakai saat induk menyuplainya. */}
      {jadiSasaran && !bidak && !jadiTangkap && (
        <span
          data-bantu-sasaran="1"
          className="pointer-events-none absolute z-10 h-[30%] w-[30%] rounded-full bg-black/15"
          aria-hidden="true"
        />
      )}
      {jadiSasaran && (bidak || jadiTangkap) && (
        <span
          data-bantu-sasaran="1"
          data-tangkap={jadiTangkap ? "1" : undefined}
          className="pointer-events-none absolute inset-[3%] z-10 rounded-full border-4 border-black/30"
          aria-hidden="true"
        />
      )}

      {/* Ikon klasifikasi langkah (book/best/forced/blunder, …) di
          pojok kanan-atas petak tujuan — meniru vladimirshefer/
          chess-analysis: bundar ~50% petak, menjorok sedikit ke luar
          sudut. Tetap berada di dalam papan (overflow-hidden), jadi
          pada petak tepi (baris atas / kolom kanan layar) digeser
          ke dalam agar tidak terpotong. */}
      {ratingIkon && (
        <RatingSVG
          rating={ratingIkon}
          size="100%"
          title={labelIkonLangkah(ratingIkon)}
          className="pointer-events-none absolute z-[60] aspect-square w-[46%]"
          style={{
            top: baris === 0 ? "2%" : "-8%",
            right: kolom === 7 ? "2%" : "-8%",
          }}
        />
      )}

      {/* Lencana mahkota hijau — ikon "victory" (lingkaran hijau +
          mahkota putih) dari set hasil Analisa, dipasang di pojok
          kanan-atas petak raja PEMENANG saat posisi skakmat; posisi &
          ukuran sama dengan ikon klasifikasi langkah agar serasi.
          Tanpa rotasi, persis seperti board.jsx menandai pemenang. */}
      {mahkota && (
        <ResultSVG
          result="victory"
          size="100%"
          title={t("papan.ikonMahkota")}
          className="pointer-events-none absolute z-[60] aspect-square w-[46%]"
          style={{
            top: baris === 0 ? "2%" : "-8%",
            right: kolom === 7 ? "2%" : "-8%",
          }}
        />
      )}

      {/* Lencana skakmat — ikon "defeat" (raja tumbang) dari set hasil
          Analisa, diputar -90° persis seperti board.jsx menandai raja
          yang kalah. Dipasang di pojok kanan-atas petak raja lawan yang
          baru saja termat; posisi & ukuran sama dengan lencana lain. */}
      {skakmat && (
        <ResultSVG
          result="defeat"
          size="100%"
          title={t("papan.ikonSkakmat")}
          className="pointer-events-none absolute z-[60] aspect-square w-[46%]"
          style={{
            top: baris === 0 ? "2%" : "-8%",
            right: kolom === 7 ? "2%" : "-8%",
            transform: "rotate(-90deg)",
          }}
        />
      )}

      {/* Lencana resign — ikon bendera menyerah di atas raja yang
          menyerah. Posisi & ukuran sama dengan lencana lain. */}
      {resign && (
        <ResultSVG
          result="resign"
          size="100%"
          title={t("papan.ikonResign")}
          className="pointer-events-none absolute z-[60] aspect-square w-[46%]"
          style={{
            top: baris === 0 ? "2%" : "-8%",
            right: kolom === 7 ? "2%" : "-8%",
          }}
        />
      )}
    </button>
  );
});

export default function PapanTekaTeki({
  fen,
  orientasi = "w",
  terpilih = null,
  sasaran = [],
  // Petak tujuan yang berupa TANGKAPAN (dari `moves({verbose})` induk, yaitu
  // langkah dengan `captured` terisi). Induk yang tidak mengirim daftar ini
  // tetap memakai patokan lama: petak terisi = tangkapan.
  sasaranTangkap = [],
  petunjuk = null,
  kesalahan = null,
  langkahAkhir = null,
  tanda = { panah: [], petak: {} },
  panahMesin = null, // { from, to, warna } — saran engine, digambar terpisah dari tanda pengguna
  // Bantuan langkah saat menyeret (assisted play): petak tujuan diwarnai
  // hijau/kuning/merah dan panah merah menunjukkan balasan terbaik lawan.
  bantuanPetak = null, // { [petak]: "hijau" | "kuning" | "merah" }
  bantuanPanah = null, // { from, to, warna } — panah lawan dari posisi hipotetis
  ikonLangkah = null, // { petak, rating } — ikon klasifikasi langkah di pojok petak (book/best/blunder, …)
  ikonSkakmat = null, // { petak } — lencana skakmat di atas raja lawan yang termat
  ikonMahkota = null, // { petak } — mahkota hijau (victory) di atas raja pemenang
  ikonResign = null, // { petak } — ikon resign (bendera menyerah) di atas raja yang menyerah
  terkunci = false,
  membeku = false,
  setBidak = "merida",
  tema = "hijau",
  animasi = true, // luncurkan bidak saat posisi berganti (matikan bila perlu)
  onKlik,
  onPilih,
  onJatuh,
  onMulaiSeret,
  onSelesaiSeret,
  onBatalSeret,
  onLewatiPetak, // (petak|null) — petak tujuan yang sedang dilintasi saat seret
  onTandaPetak,
  onTandaPanah,
  onHapusTanda,
}) {
  const peta = petaBidak(fen);
  const petak = daftarPetak(orientasi);
  const giliran = fen.split(" ")[1] || "w";

  const akar = useRef(null);
  /** Penanda unik per instance papan (`data-papan`) — dipakai uji/harness untuk
   *  menautkan kueri DOM ke papan yang benar saat beberapa papan hidup. */
  const idPapanRef = useRef(null);
  if (idPapanRef.current === null) {
    idPapanRef.current = `papan-${Math.random().toString(36).slice(2, 9)}`;
  }
  // Geometri papan dalam koordinat viewport (kiri/atas/lebar petak).
  // Dibaca ulang saat seret dimulai & selama bergerak supaya bidak hantu
  // selalu menempel kursor walau halaman di-scroll/di-zoom di tengah seretan.
  const geometri = useRef({ kiri: 0, atas: 0, kotak: 0 });

  // Keadaan gerakan seret bidak.
  const seretRef = useRef(null); // { dari, x0, y0, pindah, pointerId }
  // `seret` hanya dipakai untuk MEMASANG/MELEPAS bidak hantu — posisinya
  // TIDAK lewat state React. Update posisi via state tiap pointermove
  // me-render ulang seluruh 64 petak sehingga bidak tertinggal dari kursor
  // (terasa seperti delay/lag); posisi kini digeser langsung di DOM (lihat
  // posisikanHantu) memakai transformasi GPU yang berjalan sinkron dengan
  // gerak kursor.
  const [seret, setSeret] = useState(null); // { from } → bidak hantu terpasang
  const hantuRef = useRef(null);
  // Posisi kursor yang datang sebelum elemen hantu sempat terpasang —
  // langsung dipakai begitu elemen dirender (efek di bawah).
  const posisiTertahanRef = useRef(null);
  const abaikanKlikRef = useRef(false);
  const baruBatalRef = useRef(false);
  const onBatalSeretRef = useRef(onBatalSeret);
  onBatalSeretRef.current = onBatalSeret;
  const onLewatiPetakRef = useRef(onLewatiPetak);
  onLewatiPetakRef.current = onLewatiPetak;
  const batalkanSeretRef = useRef(() => {});

  // Dispatcher stabil untuk <Petak> (memo): identitas fungsi TIDAK boleh
  // berubah tiap render (memo gagal), sedangkan isi `padaTekan`/`padaKlikPetak`
  // harus selalu versi terbaru. Solusinya: ref berisi fungsi terbaru,
  // dispatcher useCallback([]) meneruskan panggilan ke ref.
  const padaTekanRef = useRef(null);
  const onTekanPetak = useCallback((e, sq) => padaTekanRef.current(e, sq), []);
  const padaKlikPetakRef = useRef(null);
  const onKlikPetak = useCallback((sq) => padaKlikPetakRef.current(sq), []);

  // Keadaan animasi geser bidak (lihat blok "animasi geser bidak" di bawah).
  const fenSebelumRef = useRef(fen);
  const orientasiSebelumRef = useRef(orientasi);
  const lewatiGeserRef = useRef(null); // { ke, waktu } — bidak yang baru dilepas dari seret
  /** Animasi luncuran yang sedang berjalan: elemen bidak → objek `Animation`
   *  Web Animations API. Dipakai membatalkan animasi lama untuk elemen yang
   *  sama sebelum memasang yang baru (navigasi cepat antar-langkah). */
  const animasiJalanRef = useRef(new Map());

  // Keadaan tanda klik kanan.
  const kananRef = useRef(null); // { petak, warna }
  const [panahSementara, setPanahSementara] = useState(null); // { from, to, warna }
  // Petak terakhir yang dilaporkan ke induk saat seret — hanya perubahan yang
  // diteruskan, supaya pointermove (yang sangat sering) tidak memicu render.
  const lewatiRef = useRef(null);

  /** Petak yang berada tepat di bawah titik layar (x, y). */
  function cariPetak(x, y) {
    const el = document.elementFromPoint(x, y);
    return el?.closest?.("[data-petak]")?.getAttribute("data-petak") || null;
  }

  /* ---------------------------------------------------------- gerakan bidak */

  /** Kembalikan bidak ke petak asal — klik kanan saat drag, seperti chess.com. */
  function batalkanSeretInternal() {
    if (!seretRef.current) return;
    const id = seretRef.current.pointerId;
    seretRef.current = null;
    kananRef.current = null;
    setSeret(null);
    setPanahSementara(null);
    abaikanKlikRef.current = true;
    baruBatalRef.current = true;
    if (id != null) {
      try {
        akar.current?.releasePointerCapture(id);
      } catch {
        /* pointer capture tidak aktif */
      }
    }
    lewatiRef.current = null;
    onLewatiPetakRef.current?.(null);
    onBatalSeretRef.current?.();
  }
  batalkanSeretRef.current = batalkanSeretInternal;

  // Dengarkan klik kanan di seluruh dokumen selama seret, termasuk di luar papan.
  useEffect(() => {
    function saatKlikKanan(e) {
      if (!seretRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      batalkanSeretRef.current();
    }

    function onPointerDown(e) {
      if (e.button === 2) saatKlikKanan(e);
      // Kontak baru berarti niat baru. Klik sungguhan SELALU didahului
      // `pointerdown`; klik "hantu" yang peramban teruskan sesudah seret
      // berakhir tidak. Jadi penanda penelan dilepas di sini — kalau tidak,
      // seret yang dibatalkan (mis. `pointercancel`) meninggalkan penanda
      // hidup dan klik berikutnya di mana pun ikut hilang (BUG-3).
      else abaikanKlikRef.current = false;
    }
    function onMouseDown(e) {
      if (e.button === 2) saatKlikKanan(e);
    }
    function onContextMenu(e) {
      saatKlikKanan(e);
    }
    function onPointerMove(e) {
      if (e.buttons & 2) saatKlikKanan(e);
    }
    function onClick(e) {
      if (!abaikanKlikRef.current) return;
      abaikanKlikRef.current = false;
      // HANYA klik di dalam papan yang boleh ditelan. Klik "hantu" sesudah
      // seret di-retarget peramban ke elemen penangkap pointer — akar papan —
      // jadi masih lolos syarat ini. Klik pada tombol di luar papan (navigasi
      // langkah, menu, soal berikutnya) TIDAK boleh ikut termakan; itulah
      // gejala "klik pertama tidak bereaksi".
      if (!akar.current?.contains?.(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    }
    function onPointerUp() {
      if (baruBatalRef.current) baruBatalRef.current = false;
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerup", onPointerUp, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("mousedown", onMouseDown, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerup", onPointerUp, true);
    };
  }, []);

  /** Baca ulang posisi & ukuran papan dari DOM (koordinat viewport). */
  function bacaGeometri() {
    const rect = akar.current?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      geometri.current = {
        kiri: rect.left,
        atas: rect.top,
        kotak: rect.width / 8,
      };
    }
    return geometri.current;
  }

  /**
   * Geser bidak hantu LANGSUNG di DOM (tanpa React state) agar pusat bidak
   * selalu menempel tepat di titik kursor — tidak ada jeda render sehingga
   * bidak tidak pernah tertinggal saat diseret cepat.
   */
  function posisikanHantu(clientX, clientY) {
    posisiTertahanRef.current = { x: clientX, y: clientY };
    const el = hantuRef.current;
    if (!el) return;
    const { kiri, atas, kotak } = geometri.current;
    el.style.transform = `translate3d(${clientX - kiri - kotak / 2}px, ${
      clientY - atas - kotak / 2
    }px, 0)`;
  }

  // Begitu elemen hantu terpasang, langsung tempelkan ke posisi kursor
  // tertahan agar tidak ada satu frame pun bidak tampak di titik awal.
  useEffect(() => {
    if (seret && posisiTertahanRef.current) {
      posisikanHantu(posisiTertahanRef.current.x, posisiTertahanRef.current.y);
    }
  }, [seret]);

  /* ------------------------------------------------- animasi geser bidak */

  /*
   * Papan dirender dari FEN, jadi tanpa bantuan apa pun bidak "berkedip":
   * hilang di petak asal, muncul seketika di petak tujuan. Luncuran di sini
   * MENYALIN papan Report Analisa (`Analisa/komponen/game/board.jsx` →
   * `animateMove`): elemen bidak ASLI yang sudah dirender React di petak
   * tujuan digeser dengan Web Animations API (`element.animate`) dari
   * koordinat petak asal (diukur dari DOM) ke posisinya sendiri, 300 ms
   * `ease`, sambil dinaikkan sementara di atas bidak lain. Tidak ada klon,
   * tidak ada bidak yang disembunyikan, tidak ada efek pudar — perilakunya
   * sama dengan papan Analisa.
   *
   * Bidak yang DIMAKAN tetap ditampilkan di petak tujuan sebagai rangka
   * sementara (`data-tertangkap`) selama penyerang meluncur, lalu dilepas tepat
   * saat penyerang mendarat — supaya bidak lawan tidak "lenyap lebih dulu".
   *
   * Yang TIDAK dianimasikan (memang harus langsung):
   *   - posisi diganti (soal/partai baru, muat FEN/PGN, lompat beberapa
   *     langkah) — penyimpul mengembalikan daftar kosong;
   *   - papan dibalik (orientasi berubah);
   *   - bidak yang baru saja DISERET pengguna — bidaknya sudah dilepas di
   *     petak tujuan, meluncurkannya lagi justru terlihat mundur.
   */

  /**
   * Sorotan petak terpilih + titik sasaran disembunyikan selama bidak terbang.
   *
   * State-nya memang sudah dibersihkan begitu langkah diterapkan, tetapi render
   * yang membawa kebersihan itu bisa TERTAHAN (halaman berat menahan render
   * selama luncuran supaya luncurannya tidak patah). Kalau tidak dirapikan di
   * DOM, titik-titik sasaran dan sorotan kuning ikut "menempel" selama bidak
   * meluncur — terlihat aneh seperti bidak yang belum lepas dari petaknya.
   */
  const sembunyikanBantuPilih = useCallback((sembunyi) => {
    const wadah = akar.current;
    if (!wadah) return;
    for (const el of wadah.querySelectorAll("[data-bantu-pilih], [data-bantu-sasaran]")) {
      el.style.visibility = sembunyi ? "hidden" : "";
    }
  }, []);

  /**
   * Luncurkan satu bidak ke petaknya — pola `animateMove` papan Report Analisa.
   *
   * Elemen yang dianimasikan adalah elemen bidak ASLI yang sudah dirender React
   * di petak tujuan; ia digeser dari koordinat petak asal (diukur dari DOM) ke
   * posisinya sendiri dengan Web Animations API. Tidak ada klon dan tidak ada
   * elemen yang disembunyikan, jadi tidak mungkin ada bidak yang tertinggal
   * dalam keadaan tersembunyi. Animasi lama untuk elemen yang sama dibatalkan
   * lebih dulu supaya tidak ada dua luncuran pada satu bidak.
   */
  const animasikanBidak = useCallback(
    (el, dx, dy, ghostEl = null) => {
      if (typeof el?.animate !== "function") {
        ghostEl?.remove?.();
        return false;
      }
      animasiJalanRef.current.get(el)?.cancel?.();
      el.style.zIndex = "20";
      el.style.willChange = "transform";
      const gerak = el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: "translate(0px, 0px)" },
        ],
        { duration: GESER_ISEPIC.durasi, easing: GESER_ISEPIC.kurva }
      );
      animasiJalanRef.current.set(el, gerak);
      const bersih = () => {
        // Rangka bidak yang dimakan dilepas tepat saat penyerang mendarat.
        ghostEl?.remove?.();
        if (animasiJalanRef.current.get(el) !== gerak) return;
        animasiJalanRef.current.delete(el);
        el.style.zIndex = "";
        el.style.willChange = "";
        if (animasiJalanRef.current.size === 0) sembunyikanBantuPilih(false);
      };
      gerak.oncancel = bersih;
      if (gerak.finished?.then) gerak.finished.then(bersih).catch(bersih);
      else bersih();
      return true;
    },
    [sembunyikanBantuPilih]
  );

  /**
   * Rangka sementara bidak yang dimakan, ditempel di petak tujuan dan dibuang
   * saat penyerang mendarat (pola chess.com/lichess). Tanpa ini bidak lawan
   * hilang begitu FEN baru dirender — jadi nampak "lenyap lebih dulu" sebelum
   * penyerang sampai. Hanya dipakai pada luncuran yang benar-benar berjalan
   * (lajur FEN/klik); langkah yang diseret tidak meluncur jadi tidak berangka.
   */
  const buatGhostTertangkap = useCallback(
    (petakTujuanEl, kode) => {
      const sumber = ambilSumberBidak(setBidak, kode);
      if (!sumber || typeof document === "undefined") return null;
      const span = document.createElement("span");
      span.setAttribute("data-tertangkap", kode);
      span.setAttribute("aria-hidden", "true");
      span.className =
        "absolute z-[5] flex h-[88%] w-[88%] items-center justify-center pointer-events-none";
      const img = document.createElement("img");
      img.src = sumber;
      img.className = "h-full w-full";
      img.draggable = false;
      img.alt = "";
      span.appendChild(img);
      petakTujuanEl.appendChild(span);
      return span;
    },
    [setBidak]
  );

  /** Batalkan semua luncuran yang sedang berjalan dan rapikan gaya sementaranya. */
  const hentikanSemuaAnimasi = useCallback(() => {
    for (const gerak of [...animasiJalanRef.current.values()]) gerak.cancel?.();
    animasiJalanRef.current.clear();
    sembunyikanBantuPilih(false);
  }, [sembunyikanBantuPilih]);

  useLayoutEffect(() => {
    const fenLama = fenSebelumRef.current;
    const orientasiLama = orientasiSebelumRef.current;
    fenSebelumRef.current = fen;
    orientasiSebelumRef.current = orientasi;
    if (!animasi) return;
    if (orientasiLama !== orientasi) {
      // Papan dibalik: koordinat ukur berubah total — batalkan luncuran lama.
      hentikanSemuaAnimasi();
      return;
    }
    const wadah = akar.current;
    if (!wadah) return;
    const geseran = geseranDenganAsalEksplisit(fenLama, fen, langkahAkhir);
    if (!geseran.length) {
      // Bukan langkah (soal baru / muat FEN / reset papan), atau render ulang
      // dengan FEN yang sama: tidak ada luncuran yang sah.
      if (fenLama !== fen) hentikanSemuaAnimasi();
      return;
    }
    const papanRect = wadah.getBoundingClientRect();
    if (!papanRect.width) return;
    // Seret yang baru saja mendarat: dilewati sekali supaya bidak yang sudah
    // dilepas pengguna di petak tujuan tidak meluncur lagi (terlihat mundur).
    const lewati = lewatiGeserRef.current;
    lewatiGeserRef.current = null;
    const petaLama = petaBidak(fenLama);
    let ada = false;
    for (const g of geseran) {
      if (lewati && lewati.ke === g.ke && (!lewati.dari || lewati.dari === g.dari) && Date.now() - lewati.waktu < 1500) continue;
      const petakAsalEl = wadah.querySelector(`[data-petak="${g.dari}"]`);
      const petakTujuanEl = wadah.querySelector(`[data-petak="${g.ke}"]`);
      const bidakEl = petakTujuanEl?.querySelector?.("[data-bidak]");
      if (!petakAsalEl || !petakTujuanEl || !bidakEl) continue;
      const rectAsal = petakAsalEl.getBoundingClientRect();
      const rectTujuan = petakTujuanEl.getBoundingClientRect();
      if (!rectAsal.width || !rectTujuan.width) continue;
      const dx = rectAsal.left - rectTujuan.left;
      const dy = rectAsal.top - rectTujuan.top;
      if (!dx && !dy) continue;
      // Bidak yang dimakan tetap tampil selama penyerang meluncur.
      const tertangkap = petaLama[g.ke];
      const ghostEl =
        tertangkap && tertangkap !== g.bidak ? buatGhostTertangkap(petakTujuanEl, tertangkap) : null;
      if (animasikanBidak(bidakEl, dx, dy, ghostEl)) ada = true;
      else ghostEl?.remove?.();
    }
    if (ada) sembunyikanBantuPilih(true);
  }, [fen, orientasi, animasi, langkahAkhir, animasikanBidak, hentikanSemuaAnimasi, sembunyikanBantuPilih, buatGhostTertangkap]);

  // Papan dilepas di tengah luncuran (pindah halaman, soal baru): batalkan
  // semua animasi supaya tidak ada gaya sementara yang tertinggal di DOM.
  useEffect(() => () => hentikanSemuaAnimasi(), [hentikanSemuaAnimasi]);

  function mulaiSeret(e, petakAwal) {
    if (e.pointerType !== "touch") e.preventDefault();
    bacaGeometri();
    seretRef.current = {
      dari: petakAwal,
      x0: e.clientX,
      y0: e.clientY,
      pindah: false,
      terpilihSebelumnya: terpilih === petakAwal,
      pointerId: e.pointerId,
    };
    // Pasang bidak hantu. Posisi relatif papan dihitung di posisikanHantu —
    // tahan terhadap transform CSS pada elemen leluhur (mis. lg:translate-x-4
    // pada tata letak) karena hantu diposisikan absolut di dalam papan.
    setSeret({ from: petakAwal });
    // Frame berikutnya elemen hantu sudah terpasang: tempelkan ke kursor
    // sebelum browser sempat mengecat posisi awal (tanpa kedip/lompatan).
    requestAnimationFrame(() => posisikanHantu(e.clientX, e.clientY));
    try {
      akar.current?.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture tidak tersedia */
    }
    if (onMulaiSeret) onMulaiSeret(petakAwal);
    else onPilih?.(petakAwal);
  }

  function padaTekan(e, petakAwal) {
    if (e.button === 2) {
      // Klik kanan saat menyeret bidak → kembalikan ke petak asal.
      // baruBatalRef menahan event kanan yang sama agar tidak jadi panah/tanda.
      if (seretRef.current || baruBatalRef.current) {
        e.preventDefault();
        batalkanSeretInternal();
        return;
      }
      // Klik kanan: awal gerakan tanda (mark/panah).
      if (membeku) return;
      e.preventDefault();
      const warna = warnaDariPeristiwa(e);
      kananRef.current = { petak: petakAwal, warna };
      setPanahSementara({ from: petakAwal, to: petakAwal, warna: "bawaan" });
      try {
        akar.current?.setPointerCapture(e.pointerId);
      } catch {
        /* abaikan */
      }
      return;
    }
    if (e.button !== 0) return;
    /*
     * Klik kiri di mana pun menghapus tanda & panah pengguna — perilaku yang
     * sama dengan Analisa (`cleanArrows()` pada mousedown). Diletakkan SEBELUM
     * penjagaan `terkunci` supaya tanda tetap bisa dibersihkan saat giliran
     * komputer, soal sudah selesai, atau pemilih promosi terbuka.
     *
     * Tidak boleh dipindahkan ke `onClick` petak: menekan bidak sendiri
     * memulai seret + `setPointerCapture` pada elemen papan, sehingga event
     * `click` tidak mendarat di tombol petak dan `onKlik` (tempat induk
     * membersihkan tanda) tidak pernah dipanggil — itulah sebabnya dulu hanya
     * petak kosong/bidak lawan yang bisa menghapus gambar.
     */
    onHapusTanda?.();
    if (terkunci) return;
    baruBatalRef.current = false;
    const bidak = peta[petakAwal];
    const warnaBidak = bidak ? (bidak === bidak.toUpperCase() ? "w" : "b") : null;
    if (bidak && warnaBidak === giliran) {
      mulaiSeret(e, petakAwal);
    }
  }

  function padaGerak(e) {
    if (seretRef.current) {
      // Tombol kanan ditekan di tengah seret → batalkan (chess.com).
      if (e.buttons & 2) {
        batalkanSeretInternal();
        return;
      }
      const jarak = Math.hypot(
        e.clientX - seretRef.current.x0,
        e.clientY - seretRef.current.y0
      );
      if (jarak > 5) seretRef.current.pindah = true;
      // Geometri dibaca ulang tiap gerakan agar tetap akurat walau
      // halaman bergeser (scroll/zoom/resize) selama bidak diseret.
      // Posisi hantu digeser LANGSUNG di DOM — tanpa setState, tanpa
      // render ulang — jadi bidak mengikuti kursor tanpa delay.
      bacaGeometri();
      posisikanHantu(e.clientX, e.clientY);
      // Petak tujuan yang sedang dilintasi (bantuan langkah ala assisted play).
      const dilintasi = cariPetak(e.clientX, e.clientY);
      if (dilintasi !== lewatiRef.current) {
        lewatiRef.current = dilintasi;
        onLewatiPetakRef.current?.(dilintasi);
      }
    }
    if (kananRef.current) {
      const kini = cariPetak(e.clientX, e.clientY);
      setPanahSementara((p) => {
        if (!p) return p;
        const tujuan = kini && kini !== p.from ? kini : p.from;
        return { ...p, to: tujuan };
      });
    }
  }

  function padaLepas(e) {
    if (e.button === 0 && seretRef.current) {
      const { dari, pindah, terpilihSebelumnya } = seretRef.current;
      seretRef.current = null;
      setSeret(null);
      lewatiRef.current = null;
      onLewatiPetakRef.current?.(null);
      const tujuan = pindah ? cariPetak(e.clientX, e.clientY) || dari : dari;
      const klikUlang = !pindah && tujuan === dari && terpilihSebelumnya;
      if (pindah && tujuan !== dari) {
        abaikanKlikRef.current = true;
        // Bidak ini sudah dilepas pengguna tepat di petak tujuan — jangan
        // diluncurkan lagi dari petak asal saat FEN berikutnya tiba.
        lewatiGeserRef.current = { ke: tujuan, waktu: Date.now() };
      }
      if (onSelesaiSeret) onSelesaiSeret(dari, tujuan, klikUlang);
      else if (pindah && tujuan !== dari) onJatuh?.(dari, tujuan);
      return;
    }
    if (e.button === 2) {
      if (baruBatalRef.current) {
        kananRef.current = null;
        setPanahSementara(null);
        baruBatalRef.current = false;
        return;
      }
      if (!kananRef.current) return;
      const { petak: asal, warna } = kananRef.current;
      const tujuan = cariPetak(e.clientX, e.clientY);
      if (tujuan && tujuan !== asal) {
        // Seret klik kanan → gambar/hapus panah (selalu warna bawaan/oranye).
        onTandaPanah?.(asal, tujuan, "bawaan");
      } else if (tujuan) {
        // Klik kanan biasa → tandai petak (atau hapus tanda itu saja).
        onTandaPetak?.(asal, warna);
      }
      // Dilepas di luar papan → dibatalkan, tidak membuat tanda apa pun.
      kananRef.current = null;
      setPanahSementara(null);
    }
  }

  function padaBatal() {
    const adaSeret = !!seretRef.current;
    seretRef.current = null;
    kananRef.current = null;
    setSeret(null);
    setPanahSementara(null);
    if (adaSeret) {
      abaikanKlikRef.current = true;
      baruBatalRef.current = true;
      lewatiRef.current = null;
      onLewatiPetakRef.current?.(null);
      onBatalSeretRef.current?.();
    }
  }

  function padaKlikPetak(sq) {
    if (abaikanKlikRef.current) {
      abaikanKlikRef.current = false;
      return;
    }
    onKlik?.(sq);
  }

  // Selalu teruskan versi terbaru ke dispatcher stabil di atas.
  padaTekanRef.current = padaTekan;
  padaKlikPetakRef.current = padaKlikPetak;

  /* -------------------------------------------------------------- tampilan */

  // Di-memoisasi: identitas `warnaPapan` harus stabil antar render supaya
  // memo <Petak> tidak gagal hanya karena objek warna dibuat ulang.
  const warnaPapan = useMemo(() => {
    const palet = TEMA_PAPAN[tema] || TEMA_PAPAN.hijau;
    return {
      terang: palet.terang,
      gelap: palet.gelap,
      teksTerang: palet.gelap,
      teksGelap: palet.terang,
    };
  }, [tema]);

  return (
    <div
      ref={akar}
      data-papan={idPapanRef.current}
      onPointerMove={padaGerak}
      onPointerUp={padaLepas}
      onPointerCancel={padaBatal}
      onLostPointerCapture={padaBatal}
      onPointerDown={(e) => {
        if (e.button === 2 && (seretRef.current || baruBatalRef.current)) {
          e.preventDefault();
          batalkanSeretInternal();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (seretRef.current) batalkanSeretInternal();
      }}
      className={`relative w-full aspect-square select-none overflow-hidden rounded ring-1 ring-black/10 ${
        seret ? "cursor-grabbing" : ""
      }`}
    >
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {petak.map((sq, i) => {
          const baris = Math.floor(i / 8);
          const kolom = i % 8;
          const bidak = peta[sq] || "";
          const warnaBidak = bidak
            ? bidak === bidak.toUpperCase()
              ? "w"
              : "b"
            : null;

          return (
            <Petak
              key={sq}
              sq={sq}
              baris={baris}
              kolom={kolom}
              bidak={bidak}
              bisaSeret={!!bidak && warnaBidak === giliran && !terkunci}
              dipilih={terpilih === sq}
              jadiSasaran={sasaran.includes(sq)}
              jadiTangkap={sasaranTangkap.includes(sq)}
              jadiPetunjuk={!!petunjuk && (petunjuk.from === sq || petunjuk.to === sq)}
              jadiSalah={!!kesalahan && (kesalahan.from === sq || kesalahan.to === sq)}
              jadiAkhir={!!langkahAkhir && (langkahAkhir.from === sq || langkahAkhir.to === sq)}
              sedangDiseret={!!seret && seret.from === sq}
              warnaMark={tanda.petak[sq] || null}
              bantuan={bantuanPetak?.[sq] || null}
              ratingIkon={ikonLangkah?.petak === sq ? ikonLangkah.rating : null}
              mahkota={!!ikonMahkota && ikonMahkota.petak === sq}
              skakmat={!!ikonSkakmat && ikonSkakmat.petak === sq}
              resign={!!ikonResign && ikonResign.petak === sq}
              warnaPapan={warnaPapan}
              setBidak={setBidak}
              onTekan={onTekanPetak}
              onKlik={onKlikPetak}
            />
          );
        })}
      </div>

      {/* Lapisan panah — poligon persis ala chess.com (fill + opacity 0.8). */}
      <svg
        className="arrows pointer-events-none absolute inset-0 z-30 h-full w-full"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        {/* Saran langkah engine — lapisan sendiri agar tidak tercampur
            dengan panah/tanda buatan pengguna (klik tidak menghapusnya). */}
        {panahMesin && panahMesin.to !== panahMesin.from && (
          <polygon
            className="arrow"
            points={titikKePoints(titikPanah(panahMesin.from, panahMesin.to, orientasi))}
            fill={WARNA_PANAH[panahMesin.warna] || WARNA_PANAH.biru}
            style={{ opacity: 0.8 }}
          />
        )}

        {/* Balasan terbaik lawan dari posisi hipotetis (bantuan langkah). */}
        {bantuanPanah && bantuanPanah.to !== bantuanPanah.from && (
          <polygon
            data-bantuan-panah={`${bantuanPanah.from}${bantuanPanah.to}`}
            className="arrow"
            points={titikKePoints(titikPanah(bantuanPanah.from, bantuanPanah.to, orientasi))}
            fill={WARNA_PANAH[bantuanPanah.warna] || WARNA_PANAH.merah}
            style={{ opacity: 0.8 }}
          />
        )}

        {tanda.panah.map((p, i) => (
          <polygon
            key={`${p.from}-${p.to}-${i}`}
            data-arrow={`${p.from}${p.to}`}
            className="arrow"
            points={titikKePoints(titikPanah(p.from, p.to, orientasi))}
            fill={WARNA_PANAH[p.warna]}
            style={{ opacity: 0.8 }}
          />
        ))}

        {panahSementara && panahSementara.to !== panahSementara.from && (
          <polygon
            className="arrow"
            points={titikKePoints(
              titikPanah(panahSementara.from, panahSementara.to, orientasi)
            )}
            fill={WARNA_PANAH[panahSementara.warna]}
            style={{ opacity: 0.5 }}
          />
        )}
      </svg>

      {/* Bidak hantu yang mengikuti kursor saat diseret — diposisikan
          ABSOLUT relatif terhadap papan (bukan fixed/viewport) supaya
          tepat di bawah kursor walau ada transform CSS pada elemen leluhur.
          Ukuran memakai persentase papan (1/8 petak); posisi diatur
          LANGSUNG lewat `transform` pada ref-nya (lihat posisikanHantu)
          sehingga tidak ada re-render React saat kursor bergerak. */}
      {seret && peta[seret.from] && (
        <div
          ref={hantuRef}
          className="pointer-events-none absolute left-0 top-0 z-[70] will-change-transform"
          style={{ width: "12.5%", height: "12.5%" }}
          aria-hidden="true"
        >
          <div className="h-full w-full scale-110 drop-shadow-2xl">
            <ChessPiece piece={peta[seret.from]} set={setBidak} className="h-full w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
