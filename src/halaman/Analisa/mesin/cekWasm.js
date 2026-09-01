/**
 * Pemeriksaan kemampuan peramban sebelum analisis berat dijalankan.
 *
 * Dipakai halaman Analisa untuk memutuskan ukuran tabel hash dan untuk
 * menampilkan peringatan bila WebAssembly tidak tersedia (mis. peramban
 * sangat tua atau mode tanpa JS). Fungsi deteksinya diwarisi dari
 * Brilliant-Chess (MIT) — hanya cara pemakaiannya yang berbeda: engine yang
 * dimuat selalu build "single" milik proyek ini, jadi SharedArrayBuffer tidak
 * diperlukan sama sekali.
 */

/** WebAssembly 1.0 bisa dijalankan? */
export function wasmSupported() {
  if (typeof WebAssembly !== "object") return false;
  if (typeof WebAssembly.validate !== "function") return false;
  return WebAssembly.validate(Uint8Array.of(0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
}

/** SharedArrayBuffer + memori bersama tersedia? (tidak wajib, hanya_info) */
export function wasmThreadsSupported() {
  if (!wasmSupported()) return false;
  if (typeof SharedArrayBuffer !== "function") return false;
  if (typeof Atomics !== "object") return false;
  try {
    const memori = new WebAssembly.Memory({ shared: true, initial: 8, maximum: 16 });
    if (!(memori.buffer instanceof SharedArrayBuffer)) return false;
    memori.grow(8);
    return true;
  } catch {
    return false;
  }
}

function perangkatSeluler() {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|kaios|blackberry|bb10|tizen/i.test(navigator.userAgent ?? "");
}

/**
 * Ukuran tabel hash (MB) untuk engine analisis.
 *
 * Upstream memakai `memoriPerkiraan / 4` — di ponsel hasilnya bisa 256 MB dan
 * worker-nya sering mati kehabisan memori. Build "single" di repo ini tidak
 * mengambil manfaat besar dari hash raksasa, jadi angkanya dibatasi.
 */
export function hashUntukEngine() {
  if (typeof navigator === "undefined") return 32;
  if (perangkatSeluler()) return 16;
  const gib = typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : 4;
  if (gib <= 2) return 32;
  if (gib <= 4) return 64;
  return 128;
}
