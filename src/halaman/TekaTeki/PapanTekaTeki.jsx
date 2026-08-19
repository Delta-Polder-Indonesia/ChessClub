import React, { useRef, useState } from "react";
import { ChessPiece } from "../Beranda/ChessPieceSvg.jsx";

const FILE = ["a", "b", "c", "d", "e", "f", "g", "h"];

const NAMA_BIDAK = {
  p: "bidak",
  n: "kuda",
  b: "gajah",
  r: "benteng",
  q: "menteri",
  k: "raja",
};

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

/** Warna tanda berdasarkan tombol pengubah: Shift=merah, Ctrl=hijau, Alt=biru. */
function warnaDariPeristiwa(e) {
  if (e.shiftKey) return "merah";
  if (e.ctrlKey || e.metaKey) return "hijau";
  if (e.altKey) return "biru";
  return "bawaan";
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

/** Pusat petak dalam satuan viewBox 100×100 sesuai orientasi papan. */
function pusatPetak(petak, orientasi) {
  const kolom = FILE.indexOf(petak[0]);
  const baris = Number(petak[1]);
  return {
    x: (kolom + 0.5) * 12.5,
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
 *
 * Tanda bantu ala chess.com:
 *  - Klik kanan pada petak = tandai petak dengan warna kuning; klik kanan lagi
 *    pada petak yang sama = hapus tanda petak itu saja.
 *  - Tahan klik kanan lalu seret = gambar panah oranye (lurus; siku untuk
 *    langkah kuda).
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
  terkunci = false,
  membeku = false,
  onKlik,
  onPilih,
  onJatuh,
  onTandaPetak,
  onTandaPanah,
}) {
  const peta = petaBidak(fen);
  const petak = daftarPetak(orientasi);
  const giliran = fen.split(" ")[1] || "w";

  const akar = useRef(null);
  const ukuran = useRef(0);

  // Keadaan gerakan seret bidak.
  const seretRef = useRef(null); // { dari, x0, y0, pindah }
  const [seret, setSeret] = useState(null); // { from, x, y } → bidak hantu

  // Keadaan tanda klik kanan.
  const kananRef = useRef(null); // { petak, warna }
  const [panahSementara, setPanahSementara] = useState(null); // { from, to, warna }

  /** Petak yang berada tepat di bawah titik layar (x, y). */
  function cariPetak(x, y) {
    const el = document.elementFromPoint(x, y);
    return el?.closest?.("[data-petak]")?.getAttribute("data-petak") || null;
  }

  /* ---------------------------------------------------------- gerakan bidak */

  function mulaiSeret(e, petakAwal) {
    if (e.pointerType !== "touch") e.preventDefault();
    ukuran.current = akar.current?.getBoundingClientRect().width || 0;
    seretRef.current = { dari: petakAwal, x0: e.clientX, y0: e.clientY, pindah: false };
    setSeret({ from: petakAwal, x: e.clientX, y: e.clientY });
    try {
      akar.current?.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture tidak tersedia */
    }
    onPilih?.(petakAwal);
  }

  function padaTekan(e, petakAwal) {
    if (e.button === 2) {
      // Klik kanan: awal gerakan tanda (mark/panah).
      if (membeku) return;
      e.preventDefault();
      const warna = warnaDariPeristiwa(e);
      kananRef.current = { petak: petakAwal, warna };
      setPanahSementara({ from: petakAwal, to: petakAwal, warna });
      try {
        akar.current?.setPointerCapture(e.pointerId);
      } catch {
        /* abaikan */
      }
      return;
    }
    if (e.button !== 0 || terkunci) return;
    const bidak = peta[petakAwal];
    const warnaBidak = bidak ? (bidak === bidak.toUpperCase() ? "w" : "b") : null;
    if (bidak && warnaBidak === giliran) {
      mulaiSeret(e, petakAwal);
    }
  }

  function padaGerak(e) {
    if (seretRef.current) {
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
      if (pindah) {
        const tujuan = cariPetak(e.clientX, e.clientY);
        if (tujuan && tujuan !== dari) onJatuh?.(dari, tujuan);
      }
      seretRef.current = null;
      setSeret(null);
      return;
    }
    if (e.button === 2 && kananRef.current) {
      const { petak: asal, warna } = kananRef.current;
      const tujuan = cariPetak(e.clientX, e.clientY);
      if (tujuan && tujuan !== asal) {
        // Seret klik kanan → gambar/hapus panah.
        onTandaPanah?.(asal, tujuan, warna);
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
    seretRef.current = null;
    kananRef.current = null;
    setSeret(null);
    setPanahSementara(null);
  }

  /* -------------------------------------------------------------- tampilan */

  const ukuranKotak = ukuran.current ? ukuran.current / 8 : 0;

  return (
    <div
      ref={akar}
      onPointerMove={padaGerak}
      onPointerUp={padaLepas}
      onPointerCancel={padaBatal}
      onLostPointerCapture={padaBatal}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-full aspect-square select-none overflow-hidden rounded shadow-lg ring-1 ring-black/10 ${
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
          const warnaLabel = terang ? "text-[#739552]" : "text-[#ebecd0]";

          return (
            <button
              key={sq}
              type="button"
              data-petak={sq}
              aria-label={`petak ${sq}${
                bidak
                  ? `, ${NAMA_BIDAK[bidak.toLowerCase()]} ${bidak === bidak.toUpperCase() ? "putih" : "hitam"}`
                  : ", kosong"
              }`}
              onPointerDown={(e) => padaTekan(e, sq)}
              onClick={() => onKlik && onKlik(sq)}
              style={bisaSeret ? { touchAction: "none" } : undefined}
              className={`relative flex items-center justify-center border-0 p-0 outline-none focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 ${
                terang ? "bg-[#ebecd0]" : "bg-[#779556]"
              } ${bisaSeret ? "cursor-grab" : ""}`}
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
                <span className={`absolute bottom-0.5 right-1 text-[9px] md:text-[10px] font-bold leading-none ${warnaLabel}`}>
                  {sq[0]}
                </span>
              )}
              {kolom === 0 && (
                <span className={`absolute top-0.5 left-1 text-[9px] md:text-[10px] font-bold leading-none ${warnaLabel}`}>
                  {sq[1]}
                </span>
              )}

              {/* Bidak — disembunyikan dari petak asal saat sedang diseret. */}
              {bidak && !sedangDiseret && (
                <span className="relative z-10 flex h-[88%] w-[88%] items-center justify-center drop-shadow pointer-events-none">
                  <ChessPiece piece={bidak} className="h-full w-full" />
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
            <ChessPiece piece={peta[seret.from]} className="h-full w-full" />
          </div>
        </div>
      )}

      {membeku && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/10 backdrop-blur-[1px]"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
