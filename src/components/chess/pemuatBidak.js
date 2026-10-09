/**
 * Set bidak, jalur aset, dan pemuat set — dipisah dari ChessPiece.jsx
 * karena file komponen hanya boleh mengekspor komponen (aturan react-refresh).
 */

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
export function idSet(set) {
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
    // Set bawaan dicek lebih dulu (hasil glob eager, bukan fungsi); set lain
    // jatuh ke pemuat lazy. `muatSet` sudah menangani kedua bentuk nilai.
    const pemuat = PEMUAT_MERIDA[jalur] ?? PEMUAT_ASET[jalur];
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

export function ambilSumberBidak(set, piece) {
  if (!piece) return null;
  return syncCache.get(idSet(set))?.[piece] || null;
}

/**
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
const PEMUAT_ASET = import.meta.glob("../asets/*/*.{svg,png}", {
  query: "?url",
  import: "default",
});

/**
 * Set bawaan "merida" diimpor STATIS (eager). Tanpa ini, 12 chunk kecil
 * `wK-*.js`/`bK-*.js` menjadi tingkatan tambahan dalam rantai request kritis
 * pemuatan halaman (elemen LCP rute teka-teki adalah SVG bidak — audit
 * PageSpeed Desktop mencatat rantai 2,5 detik sampai ke chunk ini). Dengan
 * `eager`, berkas ≤ assetsInlineLimit langsung jadi data-URL di chunk
 * ChessPiece dan sisanya URL aset — nol request chunk terpisah. Set lain
 * tetap lazy lewat PEMUAT_ASET di bawah.
 */
const PEMUAT_MERIDA = import.meta.glob("../asets/merida/*.{svg,png}", {
  query: "?url",
  import: "default",
  eager: true,
});
