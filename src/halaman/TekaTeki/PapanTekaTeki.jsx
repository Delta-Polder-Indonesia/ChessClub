import React, { useEffect, useRef, useState } from "react";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { useI18n } from "../../lib/i18n.jsx";

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

/** Warna tanda berdasarkan tombol pengubah: default=merah, Shift=kuning, Ctrl=hijau, Alt=biru. */
function warnaDariPeristiwa(e) {
  if (e.shiftKey) return "bawaan";
  if (e.ctrlKey || e.metaKey) return "hijau";
  if (e.altKey) return "biru";
  return "merah";
}

/** Ubah bagian posisi FEN menjadi peta petak → huruf bidak. */
function petaBidak(fen) {
  const peta = {};
  const posisi = fen.split(" ")[0];
  let baris = 8;
  let kolom = 0;
  for (const ch of posisi) {
    if (ch === "/") {
      baris -= 1;
      kolom = 0;
    } else if (ch >= "1" && ch <= "8") {
      kolom += Number(ch);
    } else {
      peta[FILE[kolom] + baris] = ch;
      kolom += 1;
    }
  }
  return peta;
}

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
 * Papan catur interaktif untuk teka-teki — tampilan & perilaku ala chess.com.
 *
 * Gerakan bidak:
 *  - Klik bidak → klik petak tujuan (termasuk layar sentuh & keyboard).
 *  - Seret (drag & drop) bidak ke petak tujuan.
 *  - Klik kanan saat sedang menyeret (tahan kiri + drag) = batalkan:
 *    bidak kembali ke petak asal, seperti chess.com.
 *
 * Tanda bantu ala chess.com:
 *  - Klik kanan pada petak = tandai petak dengan warna kuning.
 *  - Tahan klik kanan lalu seret = gambar panah oranye (lurus; siku untuk
 *    langkah kuda).
 *  - Klik kanan pada petak yang sudah bertanda = hapus SEMUA tanda & panah.
 *  - Klik kiri pada petak kosong (tanpa aksi permainan) = hapus SEMUA tanda.
 *  - Shift/Ctrl/Alt saat menandai memilih warna merah/hijau/biru.
 */
export default function PapanTekaTeki({
  fen,
  orientasi = "w",
  terpilih = null,
  sasaran = [],
  petunjuk = null,
  kesalahan = null,
  langkahAkhir = null,
  tanda = { panah: [], petak: {} },
  panahMesin = null, // { from, to, warna } — saran engine, digambar terpisah dari tanda pengguna
  terkunci = false,
  membeku = false,
  setBidak = "merida",
  tema = "hijau",
  onKlik,
  onPilih,
  onJatuh,
  onMulaiSeret,
  onSelesaiSeret,
  onBatalSeret,
  onTandaPetak,
  onTandaPanah,
}) {
  const { t } = useI18n();
  const peta = petaBidak(fen);
  const petak = daftarPetak(orientasi);
  const giliran = fen.split(" ")[1] || "w";

  const akar = useRef(null);
  const ukuran = useRef(0);

  // Keadaan gerakan seret bidak.
  const seretRef = useRef(null); // { dari, x0, y0, pindah, pointerId }
  const [seret, setSeret] = useState(null); // { from, x, y } → bidak hantu
  const abaikanKlikRef = useRef(false);
  const baruBatalRef = useRef(false);
  const onBatalSeretRef = useRef(onBatalSeret);
  onBatalSeretRef.current = onBatalSeret;
  const batalkanSeretRef = useRef(() => {});

  // Keadaan tanda klik kanan.
  const kananRef = useRef(null); // { petak, warna }
  const [panahSementara, setPanahSementara] = useState(null); // { from, to, warna }

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

  function mulaiSeret(e, petakAwal) {
    if (e.pointerType !== "touch") e.preventDefault();
    ukuran.current = akar.current?.getBoundingClientRect().width || 0;
    seretRef.current = {
      dari: petakAwal,
      x0: e.clientX,
      y0: e.clientY,
      pindah: false,
      pointerId: e.pointerId,
    };
    setSeret({ from: petakAwal, x: e.clientX, y: e.clientY });
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
    if (e.button !== 0 || terkunci) return;
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
      setSeret((s) => (s ? { ...s, x: e.clientX, y: e.clientY } : s));
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
      const { dari, pindah } = seretRef.current;
      seretRef.current = null;
      setSeret(null);
      const tujuan = pindah ? cariPetak(e.clientX, e.clientY) || dari : dari;
      if (pindah && tujuan !== dari) abaikanKlikRef.current = true;
      if (onSelesaiSeret) onSelesaiSeret(dari, tujuan);
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
        // Klik kanan biasa → tandai petak (atau hapus semua tanda).
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

  /* -------------------------------------------------------------- tampilan */

  const ukuranKotak = ukuran.current ? ukuran.current / 8 : 0;
  const TEMA_PAPAN = {
    blue: { terang: "#d7e5f0", gelap: "#4f82a8" },
    brown: { terang: "#ead2ad", gelap: "#9b6847" },
    orange: { terang: "#f5d7a1", gelap: "#cf7e36" },
    green: { terang: "#e4e8d0", gelap: "#779556" },
    grey: { terang: "#dedede", gelap: "#8c8c8c" },
    "light-blue": { terang: "#e3eff3", gelap: "#80aec1" },
    "dark-blue": { terang: "#b9cad5", gelap: "#355772" },
    wood: { terang: "#e7c78f", gelap: "#a66a35" },
    "marble-brown": { terang: "#dfd1c0", gelap: "#947966" },
    "marble-green": { terang: "#d5ddd3", gelap: "#6f8a73" },
    metal: { terang: "#aeb2b3", gelap: "#596062" },
    klasik: { terang: "#f0d9b5", gelap: "#b58863" },
    hijau: { terang: "#ebecd0", gelap: "#779556" },
  };
  const palet = TEMA_PAPAN[tema] || TEMA_PAPAN.hijau;
  const warnaPapan = {
    terang: palet.terang,
    gelap: palet.gelap,
    teksTerang: palet.gelap,
    teksGelap: palet.terang,
  };

  return (
    <div
      ref={akar}
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
      {/* Animasi goyang saat langkah salah. */}
      <style>{`
        @keyframes kci-goyang {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .kci-goyang { animation: kci-goyang 0.16s ease-in-out 3; }
      `}</style>

      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {petak.map((sq, i) => {
          const baris = Math.floor(i / 8);
          const kolom = i % 8;
          const terang = (baris + kolom) % 2 === 0;
          const bidak = peta[sq] || "";
          const warnaBidak = bidak
            ? bidak === bidak.toUpperCase()
              ? "w"
              : "b"
            : null;
          const bisaSeret = bidak && warnaBidak === giliran && !terkunci;
          const dipilih = terpilih === sq;
          const jadiSasaran = sasaran.includes(sq);
          const jadiPetunjuk = petunjuk && (petunjuk.from === sq || petunjuk.to === sq);
          const jadiSalah = kesalahan && (kesalahan.from === sq || kesalahan.to === sq);
          const jadiAkhir = langkahAkhir && (langkahAkhir.from === sq || langkahAkhir.to === sq);
          const sedangDiseret = seret && seret.from === sq;
          const warnaMark = tanda.petak[sq];

          return (
            <button
              key={sq}
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
              onPointerDown={(e) => padaTekan(e, sq)}
              onClick={() => padaKlikPetak(sq)}
              style={{
                backgroundColor: terang ? warnaPapan.terang : warnaPapan.gelap,
                touchAction: bisaSeret ? "none" : undefined,
              }}
              className={`relative flex items-center justify-center border-0 p-0 outline-none focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 ${bisaSeret ? "cursor-grab" : ""}`}
            >
              {jadiAkhir && (
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: "rgba(205, 210, 106, 0.5)" }}
                  aria-hidden="true"
                />
              )}
              {jadiPetunjuk && (
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: "rgba(0, 150, 80, 0.5)" }}
                  aria-hidden="true"
                />
              )}
              {jadiSalah && (
                <span
                  className="kci-goyang absolute inset-0"
                  style={{ backgroundColor: "rgba(216, 60, 60, 0.55)" }}
                  aria-hidden="true"
                />
              )}
              {dipilih && (
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: "rgba(255, 255, 0, 0.45)" }}
                  aria-hidden="true"
                />
              )}

              {/* Tanda petak hasil klik kanan — di bawah bidak agar bidak tetap jelas. */}
              {warnaMark && (
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: WARNA_PETAK[warnaMark] }}
                  aria-hidden="true"
                />
              )}

              {/* Koordinat: huruf lajur di baris bawah, angka baris di kolom kiri. */}
              {baris === 7 && (
                <span
                  className="absolute bottom-0.5 right-1 text-[9px] md:text-[10px] font-bold leading-none"
                  style={{ color: terang ? warnaPapan.teksTerang : warnaPapan.teksGelap }}
                >
                  {sq[0]}
                </span>
              )}
              {kolom === 0 && (
                <span
                  className="absolute top-0.5 left-1 text-[9px] md:text-[10px] font-bold leading-none"
                  style={{ color: terang ? warnaPapan.teksTerang : warnaPapan.teksGelap }}
                >
                  {sq[1]}
                </span>
              )}

              {/* Bidak — disembunyikan dari petak asal saat sedang diseret. */}
              {bidak && !sedangDiseret && (
                <span className="relative z-10 flex h-[88%] w-[88%] items-center justify-center drop-shadow pointer-events-none">
                  <ChessPiece piece={bidak} set={setBidak} className="h-full w-full" />
                </span>
              )}

              {/* Penanda petak tujuan legal. */}
              {jadiSasaran && !bidak && (
                <span className="absolute z-10 h-[30%] w-[30%] rounded-full bg-black/15" aria-hidden="true" />
              )}
              {jadiSasaran && bidak && (
                <span className="absolute inset-[3%] z-10 rounded-full border-4 border-black/30" aria-hidden="true" />
              )}
            </button>
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

      {/* Bidak hantu yang mengikuti kursor saat diseret. */}
      {seret && peta[seret.from] && (
        <div
          className="pointer-events-none fixed z-[70]"
          style={{
            left: seret.x - ukuranKotak / 2,
            top: seret.y - ukuranKotak / 2,
            width: ukuranKotak,
            height: ukuranKotak,
          }}
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
