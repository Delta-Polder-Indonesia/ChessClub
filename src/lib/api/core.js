/** Shared transport primitives for every browser-to-server API feature. */
const DASAR = (import.meta.env?.VITE_API_DASAR || "").replace(/\/$/, "");
export const urlApi = (jalur) => `${DASAR}${jalur}`;

/** Error response with API status and field-level validation details. */
export class GalatApi extends Error {
  constructor(pesan, { galat = {}, diblokir = false, alasan = null, status = 0 } = {}) {
    super(pesan);
    this.name = "GalatApi";
    this.galat = galat;
    this.diblokir = diblokir;
    this.alasan = alasan;
    this.status = status;
  }
}

/**
 * Pesan baku untuk permintaan yang tidak pernah sampai ke server (offline,
 * CORS, DNS). fetch() asli melempar TypeError berbahasa Inggris ("Failed to
 * fetch") — tanpa pembungkus ini pesan teknis tersebut tampil mentah di
 * layar pengunjung.
 */
export const PESAN_JARINGAN =
  "Koneksi ke server gagal. Periksa internet Anda lalu coba lagi.";

/**
 * fetch() ke jalur API dengan jaminan pesan ramah: hanya kegagalan
 * TRANSPORT (sebelum ada respons) yang diganti PESAN_JARINGAN. Galat HTTP
 * (4xx/5xx) tetap dikembalikan sebagai respons agar pemanggil bisa membaca
 * pesan server dan statusnya.
 */
export async function fetchApi(jalur, opsi = {}) {
  try {
    return await fetch(urlApi(jalur), opsi);
  } catch {
    throw new GalatApi(PESAN_JARINGAN, { status: 0 });
  }
}

/** Historical alias retained for registration screens. */
export const GalatPendaftaran = GalatApi;
