import { useEffect, useRef, useState } from "react";
import { ambilSumberBidak, muatSet } from "./pemuatBidak.js";
import { antrekanLatar } from "../../lib/waktuSenggang.js";

// Pemanasan set lain dijadwalkan lewat penjadwal latar bersama: setelah
// halaman `load` + tenang, satu pekerjaan pada satu waktu, dan dilewati pada
// jaringan hemat/2G–3G. Sebelumnya blok ini menyala sendiri 4 dtk setelah
// `load`; pada audit PageSpeed /papan-interaktif 36 chunk bidak itu mendarat
// bersamaan dengan chunk yang menahan LCP. Set bawaan "merida"/"alpha" sudah
// dibawa glob eager (nol chunk), dan ChessPiece tetap memuat setnya sendiri
// lewat effect di bawah bila pengguna memilih set lain sebelum pemanasan jalan.
antrekanLatar(() => {
  for (const s of ["alpha", "bidak", "chesscom"]) {
    muatSet(s).catch(() => {
      /* diabaikan di sini; ChessPiece akan mencoba ulang sendiri */
    });
  }
});

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

  const sumber = piece ? (peta?.[piece] ?? ambilSumberBidak(set, piece)) : null;
  if (!sumber) return null;
  return <img src={sumber} alt="" className={className} draggable={false} />;
}
