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
  { id: "3d_chesskid", nama: "3D ChessKid", png: true },
  { id: "3d_plastic", nama: "3D Plastic", png: true },
  { id: "3d_staunton", nama: "3D Staunton", png: true },
  { id: "3d_wood", nama: "3D Wood", png: true },
  { id: "8_bit", nama: "8-Bit", png: true },
  { id: "8qetl", nama: "8qetl", png: true },
  { id: "bases", nama: "Bases", png: true },
  { id: "book", nama: "Book", png: true },
  { id: "bubblegum", nama: "Bubblegum", png: true },
  { id: "ca09k", nama: "ca09k", png: true },
  { id: "cases", nama: "Cases", png: true },
  { id: "classic", nama: "Classic", png: true },
  { id: "club", nama: "Club", png: true },
  { id: "condal", nama: "Condal", png: true },
  { id: "dash", nama: "Dash", png: true },
  { id: "ejgfv", nama: "ejgfv", png: true },
  { id: "game_room", nama: "Game Room", png: true },
  { id: "glass", nama: "Glass", png: true },
  { id: "gothic", nama: "Gothic", png: true },
  { id: "graffiti", nama: "Graffiti", png: true },
  { id: "icy_sea", nama: "Icy Sea", png: true },
  { id: "light", nama: "Light", png: true },
  { id: "lolz", nama: "Lolz", png: true },
  { id: "luca", nama: "Luca", png: true },
  { id: "marble", nama: "Marble", png: true },
  { id: "maya", nama: "Maya", png: true },
  { id: "metal", nama: "Metal", png: true },
  { id: "modern", nama: "Modern", png: true },
  { id: "nature", nama: "Nature", png: true },
  { id: "neo_wood", nama: "Neo Wood", png: true },
  { id: "neon", nama: "Neon", png: true },
  { id: "newspaper", nama: "Newspaper", png: true },
  { id: "ocean", nama: "Ocean", png: true },
  { id: "sky", nama: "Sky", png: true },
  { id: "space", nama: "Space", png: true },
  { id: "tigers", nama: "Tigers", png: true },
  { id: "tournament", nama: "Tournament", png: true },
  { id: "vintage", nama: "Vintage", png: true },
  { id: "wood", nama: "Wood", png: true },
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
  const kode = KODE_ASET[piece];
  if (!kode) return null;
  if (set === "chesscom") {
    return `../../asets/ChessCom/${kode.toLowerCase()}.png`;
  }
  const entri = DAFTAR_SET.find((s) => s.id === set);
  if (entri?.png) {
    return `../../asets/${set}/${kode.toLowerCase()}.png`;
  }
  return `../../asets/${set}/${kode}.svg`;
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
    const pemuat = PEMUAT_BAWAAN[jalur] ?? PEMUAT_ASET[jalur];
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
    // Hasil SEPARUH (ada aset yang tak ketemu di hasil glob — mis. nama chunk
    // berubah setelah deploy baru) juga tidak dikunci: bidak yang berhasil
    // tetap dipakai sekarang, dan pemanggilan berikutnya boleh mencoba lagi.
    if (Object.keys(hasil).length < entri.length) cacheSet.delete(id);
    return hasil;
  });
  // Pelepasan cache untuk SETIAP penolakan, bukan hanya peta kosong di atas.
  // `Promise.all` menolak begitu SATU chunk gagal diunduh — yaitu SEBELUM
  // `.then` di atas berjalan — sehingga tanpa baris ini janji yang sudah
  // ditolak tersimpan di `cacheSet` selamanya: percobaan ulang `ChessPiece`
  // (yang mengandalkan "cache sudah dilepas oleh muatSet") selalu menerima
  // janji yang sama, dan papan tetap kosong untuk set itu seumur sesi walau
  // koneksi sudah pulih.
  janji.catch(() => {
    cacheSet.delete(id);
    syncCache.delete(id);
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
const PEMUAT_ASET = import.meta.glob(
  [
    "../../asets/*/*.{svg,png}",
    // Set bawaan (merida & alpha) diimpor statis di bawah; kecualikan dari
    // glob lazy ini agar Vite tidak memperingatkan tumpang tindih
    // (dynamic + static).
    "!../../asets/merida/*.{svg,png}",
    "!../../asets/alpha/*.{svg,png}",
  ],
  {
    query: "?url",
    import: "default",
  },
);

/**
 * Dua set BAWAAN diimpor STATIS (eager): `merida` (bawaan halaman teka-teki)
 * dan `alpha` (bawaan Papan Interaktif + Manusia vs Mesin). Tanpa ini, 12 chunk
 * kecil `wK-*.js`/`bK-*.js` menjadi tingkatan tambahan dalam rantai request
 * kritis pemuatan halaman (elemen LCP rute teka-teki adalah SVG bidak — audit
 * PageSpeed Desktop mencatat rantai 2,5 detik sampai ke chunk ini), dan di
 * Papan Interaktif bidak baru muncul setelah 12 chunk itu mendarat — render
 * pertama terlihat sebagai papan kosong. Dengan `eager`, berkas ≤
 * assetsInlineLimit langsung jadi data-URL di chunk ChessPiece dan sisanya URL
 * aset — nol request chunk terpisah. Set lain tetap lazy lewat PEMUAT_ASET.
 */
const PEMUAT_BAWAAN = import.meta.glob(
  ["../../asets/merida/*.{svg,png}", "../../asets/alpha/*.{svg,png}"],
  {
    query: "?url",
    import: "default",
    eager: true,
  },
);
