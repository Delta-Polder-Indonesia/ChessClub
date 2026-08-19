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

/** Warna tanda bantu (panah & petak) — ala chess.com. */
const WARNA_TANDA = {
  hijau: "#16a34a",
  merah: "#dc2626",
  kuning: "#eab308",
  biru: "#2563eb",
};

/** Warna tanda berdasarkan tombol pengubah: Shift=merah, Ctrl=kuning, Alt=biru. */
function warnaDariPeristiwa(e) {
  if (e.shiftKey) return "merah";
  if (e.ctrlKey || e.metaKey) return "kuning";
  if (e.altKey) return "biru";
  return "hijau";
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

/** Koordinat garis panah — ujung dipangkas sedikit untuk ruang kepala panah. */
function garisPanah(from, to, orientasi) {
  const a = pusatPetak(from, orientasi);
  const b = pusatPetak(to, orientasi);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const panjang = Math.hypot(dx, dy) || 1;
  const ux = dx / panjang;
  const uy = dy / panjang;
  return {
    x1: a.x + ux * 2.4,
    y1: a.y + uy * 2.4,
    x2: b.x - ux * 4.6,
    y2: b.y - uy * 4.6,
  };
}

/**
 * Papan catur interaktif untuk teka-teki.
 *
 * Gerakan bidak:
 *  - Klik bidak → klik petak tujuan (termasuk layar sentuh & keyboard).
 *  - Seret (drag & drop) bidak ke petak tujuan.
 *
 * Tanda bantu ala chess.com:
 *  - Klik kanan pada petak = tandai petak dengan warna.
 *  - Tahan klik kanan lalu seret = gambar panah antar petak.
 *  - Klik kanan petak yang sudah ditandai = hapus semua tanda.
 *  - Shift/Ctrl/Alt saat menandai memilih warna merah/kuning/biru.
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
      } else {
        // Klik kanan biasa → tandai petak (atau hapus semua tanda).
        onTandaPetak?.(asal, warna);
      }
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
      className={`relative w-full aspect-square select-none overflow-hidden rounded-lg shadow-lg ring-1 ring-black/10 ${
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
          const warnaLabel = terang ? "text-[#8a5a3b]" : "text-[#f3e7d3]";

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
                terang ? "bg-[#ecd9b4]" : "bg-[#a2734f]"
              } ${bisaSeret ? "cursor-grab" : ""}`}
            >
              {jadiAkhir && <span className="absolute inset-0 bg-[#f5d76e]/45" aria-hidden="true" />}
              {jadiPetunjuk && <span className="absolute inset-0 bg-yellow-300/60" aria-hidden="true" />}
              {jadiSalah && <span className="kci-goyang absolute inset-0 bg-red-400/60" aria-hidden="true" />}
              {dipilih && <span className="absolute inset-0 bg-emerald-400/50" aria-hidden="true" />}

              {/* Tanda petak hasil klik kanan — di bawah bidak agar bidak tetap jelas. */}
              {warnaMark && (
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: WARNA_TANDA[warnaMark], opacity: 0.5 }}
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
                <span className="relative z-10 flex h-[84%] w-[84%] items-center justify-center drop-shadow pointer-events-none">
                  <ChessPiece piece={bidak} className="h-full w-full" />
                </span>
              )}

              {/* Penanda petak tujuan legal. */}
              {jadiSasaran && !bidak && (
                <span className="absolute z-10 h-[30%] w-[30%] rounded-full bg-black/25" aria-hidden="true" />
              )}
              {jadiSasaran && bidak && (
                <span className="absolute inset-[3%] z-10 rounded-full border-4 border-black/30" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {/* Lapisan panah (tanda klik kanan) + panah sementara saat menggambar. */}
      <svg
        className="pointer-events-none absolute inset-0 z-30 h-full w-full"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <defs>
          {Object.entries(WARNA_TANDA).map(([nama, warna]) => (
            <marker
              key={nama}
              id={`kci-kepala-${nama}`}
              orient="auto"
              markerUnits="userSpaceOnUse"
              markerWidth="4"
              markerHeight="4"
              refX="4"
              refY="2"
            >
              <path d="M0,0 L4,2 L0,4 Z" fill={warna} />
            </marker>
          ))}
        </defs>

        {tanda.panah.map((p, i) => {
          const g = garisPanah(p.from, p.to, orientasi);
          return (
            <line
              key={`${p.from}-${p.to}-${i}`}
              x1={g.x1}
              y1={g.y1}
              x2={g.x2}
              y2={g.y2}
              stroke={WARNA_TANDA[p.warna]}
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.9"
              markerEnd={`url(#kci-kepala-${p.warna})`}
            />
          );
        })}

        {panahSementara && panahSementara.to !== panahSementara.from && (() => {
          const g = garisPanah(panahSementara.from, panahSementara.to, orientasi);
          return (
            <line
              x1={g.x1}
              y1={g.y1}
              x2={g.x2}
              y2={g.y2}
              stroke={WARNA_TANDA[panahSementara.warna]}
              strokeWidth="2.8"
              strokeLinecap="round"
              opacity="0.65"
              markerEnd={`url(#kci-kepala-${panahSementara.warna})`}
            />
          );
        })()}
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
