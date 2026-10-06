import { useEffect, useRef, useState } from "react";

/**
 * Renderer bidak catur dengan pemuatan aset per-set & cache sinkron.
 *
 * Vite membuat chunk terpisah untuk setiap SVG, dan aset yang sudah dimuat
 * disimpan di `syncCache` sehingga saat bidak berpindah petak, render
 * pertamanya langsung sinkron (tanpa kedip/blink).
 *
 * CATATAN: `import.meta.glob` adalah makro compile-time Vite. Panggilannya
 * harus tetap berupa call langsung — jangan dibungkus guard runtime seperti
 * `typeof import.meta !== "undefined" && ...`, karena saat berkas ini
 * diproses tanpa transform glob (unit test via esbuild, impor Node-side),
 * hasilnya `{}` dan seluruh papan jadi kosong tanpa error apa pun.
 */
const PEMUAT_ASET = import.meta.glob("../../asets/*/*.{svg,png}", {
  query: "?url",
  import: "default",
});

export const DAFTAR_SET = [
  { id: "bidak", nama: "Chessnut" },
  { id: "alpha", nama: "Alpha" },
  { id: "california", nama: "California" },
  { id: "cardinal", nama: "Cardinal" },
  { id: "cburnett", nama: "CBurnett" },
  { id: "dubrovny", nama: "Dubrovny" },
  { id: "gioco", nama: "Gioco" },
  { id: "governor", nama: "Governor" },
  { id: "icpieces", nama: "ICPieces" },
  { id: "maestro", nama: "Maestro" },
  { id: "merida", nama: "Merida" },
  { id: "staunty", nama: "Staunty" },
  { id: "tatiana", nama: "Tatiana" },
  { id: "chesscom", nama: "Chess.com" },
];

const NAMA_BIDAK = {
  K: "Raja putih", Q: "Menteri putih", R: "Benteng putih", B: "Gajah putih", N: "Kuda putih", P: "Bidak putih",
  k: "Raja hitam", q: "Menteri hitam", r: "Benteng hitam", b: "Gajah hitam", n: "Kuda hitam", p: "Bidak hitam",
};
const KODE_ASET = { K: "wK", Q: "wQ", R: "wR", B: "wB", N: "wN", P: "wP", k: "bK", q: "bQ", r: "bR", b: "bB", n: "bN", p: "bP" };
const KODE_CHESSNUT = {
  K: "raja-putih", Q: "ratu-putih", R: "benteng-putih", B: "gajah-putih", N: "kuda-putih", P: "bidak-putih",
  k: "raja-hitam", q: "ratu-hitam", r: "benteng-hitam", b: "gajah-hitam", n: "kuda-hitam", p: "bidak-hitam",
};

const cacheSet = new Map();
const syncCache = new Map();

/** Set sah; apa pun di luar daftar jatuh ke set bawaan "bidak". */
function idSet(set) {
  return DAFTAR_SET.some((item) => item.id === set) ? set : "bidak";
}

export function jalurAset(set, piece) {
  if (set === "bidak") {
    const kode = KODE_CHESSNUT[piece];
    return kode ? `../../asets/bidak/${kode}.svg` : null;
  }
  if (set === "chesscom") {
    const kode = KODE_ASET[piece];
    return kode ? `../../asets/ChessCom/${kode.toLowerCase()}.png` : null;
  }
  const kode = KODE_ASET[piece];
  return kode ? `../../asets/${set}/${kode}.svg` : null;
}

export function muatSet(set) {
  const id = idSet(set);
  const tersimpan = cacheSet.get(id);
  if (tersimpan) return tersimpan;

  const tugas = Object.keys(NAMA_BIDAK).map(async (piece) => {
    const jalur = jalurAset(id, piece);
    if (!jalur) {
      console.warn(`[ChessPiece] Kode aset tidak dikenal: ${id}/${piece}`);
      return [piece, null];
    }
    const pemuat = PEMUAT_ASET[jalur];
    if (!pemuat) {
      console.warn(`[ChessPiece] Aset tidak ada di hasil glob: ${jalur}`);
      return [piece, null];
    }
    const res = typeof pemuat === "function" ? await pemuat() : pemuat;
    const url = typeof res === "string" ? res : (res?.default ?? null);
    if (!url) console.warn(`[ChessPiece] Pemuat aset kosong: ${jalur}`);
    return [piece, url];
  });

  const janji = Promise.all(tugas).then((entri) => {
    const hasil = Object.fromEntries(entri.filter(([, v]) => v != null));
    // Peta kosong = semua aset gagal. Jangan dikunci selamanya: lepas cache
    // supaya pemanggilan berikutnya bisa mencoba ulang (kegagalan chunk
    // biasanya hanya sementara, mis. koneksi putus sesaat).
    if (Object.keys(hasil).length === 0) {
      cacheSet.delete(id);
      syncCache.delete(id);
      throw new Error(`[ChessPiece] Gagal memuat seluruh aset set "${id}"`);
    }
    syncCache.set(id, hasil);
    return hasil;
  });
  cacheSet.set(id, janji);
  return janji;
}

// Pre-load set bawaan di WAKTU SENGGANG (bukan saat modul dievaluasi).
// Dulu empat set × 12 bidak = ±48 request chunk kecil langsung berdesakan
// di jalur kritis pemuatan halaman (Lighthouse mobile: deretan request di
// detik 1,3–1,6 pada 4G lambat). `?url` memang hanya mengembalikan string
// URL, tetapi chunk JS-nya sendiri tetap harus diunduh. Pemanasan kini
// menunggu idle; ChessPiece yang terlanjur tampil lebih dulu memuat set-nya
// sendiri lewat effect di bawah (cache sama-sama dipakai).
if (typeof window !== "undefined") {
  const panaskanSet = () => {
    for (const s of ["alpha", "merida", "bidak", "chesscom"]) {
      muatSet(s).catch(() => {
        /* diabaikan di sini; ChessPiece akan mencoba ulang sendiri */
      });
    }
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(panaskanSet, { timeout: 4000 });
  } else {
    window.setTimeout(panaskanSet, 2000);
  }
}

export function ambilSumberBidak(set, piece) {
  if (!piece) return null;
  return syncCache.get(idSet(set))?.[piece] || null;
}

export function ChessPiece({ piece, set = "merida", className = "w-full h-full" }) {
  const id = idSet(set);
  const [peta, setPeta] = useState(() => syncCache.get(id) ?? null);
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

  const sumber = piece ? (peta ?? syncCache.get(id))?.[piece] : null;
  if (!sumber) return null;
  return <img src={sumber} alt={NAMA_BIDAK[piece] || ""} className={className} draggable={false} />;
}
