import { useEffect, useRef, useState } from "react";
import { ambilSumberBidak, muatSet } from "./pemuatBidak.js";

// Pre-load set lain di WAKTU SENGGANG SETELAH `load` (bukan saat modul
// dievaluasi). Empat set × 12 bidak = ±48 request chunk kecil berdesakan di
// jalur kritis pemuatan halaman (Lighthouse mobile: deretan request detik
// 1,3–1,6 pada 4G lambat). Kini: set bawaan "merida" sudah dibawa oleh glob
// eager di atas (nol chunk), dan tiga set sisanya menunggu acara `load` lebih
// dulu supaya tidak bersaing dengan kebutuhan LCP. ChessPiece yang terlanjur
// tampil memuat setnya sendiri lewat effect di bawah (cache sama-sama dipakai).
if (typeof window !== "undefined") {
  const panaskanSet = () => {
    for (const s of ["alpha", "bidak", "chesscom"]) {
      muatSet(s).catch(() => {
        /* diabaikan di sini; ChessPiece akan mencoba ulang sendiri */
      });
    }
  };
  const jadwalkanPemanasan = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(panaskanSet, { timeout: 4000 });
    } else {
      window.setTimeout(panaskanSet, 2000);
    }
  };
  if (document.readyState === "complete") {
    jadwalkanPemanasan();
  } else {
    window.addEventListener("load", jadwalkanPemanasan, { once: true });
  }
}

export function ChessPiece({ piece, set = "merida", className = "w-full h-full" }) {
  const [peta, setPeta] = useState(() => undefined);
  const [percobaan, setPercobaan] = useState(0);
  const sudahCobaRef = useRef(0);

  useEffect(() => {
    sudahCobaRef.current = 0;
  }, [set]);

  useEffect(() => {
    let aktif = true;
    muatSet(set)
      .then((hasil) => {
        if (aktif) setPeta(hasil);
      })
      .catch(() => {
        if (!aktif) return;
        setPeta(null);
        // Satu kali percobaan ulang; cache sudah dilepas oleh muatSet.
        if (sudahCobaRef.current >= 1) return;
        sudahCobaRef.current += 1;
        setTimeout(() => {
          if (aktif) setPercobaan((n) => n + 1);
        }, 800);
      });
    return () => {
      aktif = false;
    };
  }, [set, percobaan]);

  const sumber = piece ? (peta ?? undefined) ?? ambilSumberBidak(set, piece) : null;
  if (!sumber) return null;
  return <img src={sumber} alt="" className={className} draggable={false} />;
}
