import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { EngineCatur } from "./engineCatur.js";

const KUNCI_TAMPILAN_PANAH_MESIN = "chessclub.tampilanPanahMesin";

/** Preferensi panah dibagi oleh Papan Interaktif dan Teka-Teki. */
function bacaTampilanPanahMesin() {
  try {
    return globalThis.localStorage?.getItem(KUNCI_TAMPILAN_PANAH_MESIN) !== "0";
  } catch {
    return true;
  }
}

/**
 * Probabilitas menang Putih dari skor centipawn — kurva logistik ala Lichess.
 * +100 cp ≈ 64%, +300 cp ≈ 85%, −50 cp ≈ 43%, dst.
 */
function probMenangPutih(cp) {
  const persen = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
  return Math.min(100, Math.max(0, persen)) / 100;
}

/** Deret langkah UCI ("e2e4", "e7e8q", …) → deret SAN pada posisi `fen`. */
export function sanDariUci(fen, daftarUci) {
  const game = new Chess(fen);
  const san = [];
  for (const u of daftarUci) {
    let pindah = null;
    try {
      pindah = game.move({
        from: u.slice(0, 2),
        to: u.slice(2, 4),
        promotion: u.length > 4 ? u[4] : undefined,
      });
    } catch {
      pindah = null;
    }
    if (!pindah) break;
    san.push(pindah.san);
  }
  return san;
}

/**
 * Ubah keluaran "info" UCI menjadi bentuk siap tampil. Skor UCI selalu
 * relatif terhadap pihak yang melangkah — di sini dinormalisasi menjadi
 * sudut pandang Putih agar konsisten dengan bilah evaluasi.
 */
function susunHasilEngine(info, fen, giliran) {
  const arah = giliran === "w" ? 1 : -1;
  let teksSkor;
  let cpPutih;
  let matePutih = null;
  if (info.mate !== null) {
    matePutih = info.mate * arah;
    cpPutih = matePutih > 0 ? 10000 : -10000;
    teksSkor = `${matePutih > 0 ? "+" : "-"}M${Math.abs(matePutih)}`;
  } else {
    cpPutih = Math.round(info.cp * arah);
    teksSkor = `${cpPutih >= 0 ? "+" : "-"}${(Math.abs(cpPutih) / 100).toFixed(2)}`;
  }
  return {
    teksSkor,
    cpPutih,
    matePutih,
    poinPutih: probMenangPutih(cpPutih),
    pvSan: sanDariUci(fen, info.pv),
    pvUci: info.pv,
    kedalaman: info.kedalaman,
  };
}

/**
 * Hook analisis Stockfish untuk satu posisi FEN yang berubah-ubah.
 *
 * Dipakai halaman Papan Interaktif dan Teka-Teki. Satu-satunya penggerak
 * adalah `fen` (plus tombol nyala dan durasi analisis): setiap posisi baru
 * otomatis dianalisis; pencarian lama dihentikan dengan rapi lewat antrean
 * di dalam EngineCatur. Worker (±7 MB) hanya diunduh saat pertama
 * dinyalakan dan dibuang sepenuhnya saat komponen dilepas.
 *
 * @param {string} fen posisi saat ini (boleh string kosong saat belum siap)
 */
export function gunakanEngineCatur(fen) {
  const [engineNyala, setEngineNyala] = useState(false);
  const [statusEngine, setStatusEngine] = useState("mati"); // mati | memuat | siap | gagal
  const [kecepatanEngine, setKecepatanEngine] = useState(800); // movetime (ms)
  const [hasilEngine, setHasilEngine] = useState(null);
  const [tampilPanahMesin, setTampilPanahMesin] = useState(bacaTampilanPanahMesin);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(
        KUNCI_TAMPILAN_PANAH_MESIN,
        tampilPanahMesin ? "1" : "0"
      );
    } catch {
      /* localStorage tidak tersedia atau penuh — preferensi tetap berlaku sesi ini. */
    }
  }, [tampilPanahMesin]);

  const engineRef = useRef(null);
  const fenRef = useRef(fen);

  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);

  useEffect(() => {
    if (!engineNyala || !fen) return undefined;

    // Posisi akhir (skakmat/remis) tidak perlu dianalisis.
    let selesai = false;
    try {
      selesai = new Chess(fen).isGameOver();
    } catch {
      selesai = false;
    }
    if (selesai) {
      engineRef.current?.setop();
      setHasilEngine(null);
      return undefined;
    }

    const giliran = fen.split(" ")[1] === "b" ? "b" : "w";
    const engine = (engineRef.current ||= new EngineCatur());

    const minta = () => {
      // Posisi berganti → hapus panah lama agar tidak menyesatkan sebelum
      // balasan pertama engine tiba.
      setHasilEngine(null);
      engine.analisis(fen, {
        movetime: kecepatanEngine,
        padaInfo: (info) => {
          if (fenRef.current !== fen) return;
          setHasilEngine(susunHasilEngine(info, fen, giliran));
        },
        padaSelesai: (uci) => {
          if (fenRef.current !== fen) return;
          setHasilEngine((lama) => (lama ? { ...lama, bestUci: uci } : lama));
        },
      });
    };

    let hidup = true;
    engine
      .mulai()
      .then(() => {
        if (!hidup) return;
        setStatusEngine("siap");
        minta();
      })
      .catch(() => {
        if (hidup) setStatusEngine("gagal");
      });

    return () => {
      hidup = false;
      engine.setop();
    };
  }, [engineNyala, fen, kecepatanEngine]);

  // Worker dibuang sepenuhnya saat halaman ditutup.
  useEffect(
    () => () => {
      engineRef.current?.tamat();
      engineRef.current = null;
    },
    []
  );

  /** Apakah posisi saat ini sudah selesai (untuk pesan di panel engine). */
  const permainanSelesai = useMemo(() => {
    if (!fen) return false;
    try {
      return new Chess(fen).isGameOver();
    } catch {
      return false;
    }
  }, [fen]);

  /** Panah saran engine (biru) — terpisah dari tanda buatan pengguna. */
  const panahMesin = useMemo(() => {
    if (!engineNyala || !hasilEngine) return null;
    const u = hasilEngine.bestUci || hasilEngine.pvUci?.[0];
    if (!u || u.length < 4) return null;
    return { from: u.slice(0, 2), to: u.slice(2, 4), warna: "biru" };
  }, [engineNyala, hasilEngine]);

  const nyalakanEngine = useCallback(() => {
    setEngineNyala(true);
    setStatusEngine((s) => (s === "siap" ? s : "memuat"));
  }, []);

  const matikanEngine = useCallback(() => {
    setEngineNyala(false);
    setStatusEngine("mati");
    setHasilEngine(null);
    engineRef.current?.setop();
  }, []);

  return {
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
  };
}
