/** Shared transport primitives for every browser-to-server API feature. */
const DASAR = (import.meta.env?.VITE_API_DASAR || "").replace(/\/$/, "");
export const urlApi = (jalur) => `${DASAR}${jalur}`;

/**
 * Error response with API status and field-level validation details.
 *
 * `kode` carries a machine-readable reason (e.g. an verification-ticket
 * cause) so screens can show a specific, actionable message instead of a
 * generic one. `perluVerifikasi` is set by the backend whenever a member
 * registration was rejected because server-verified proof is missing,
 * expired, already used, or bound to another username.
 */
export class GalatApi extends Error {
  constructor(
    pesan,
    {
      galat = {},
      diblokir = false,
      alasan = null,
      status = 0,
      kode = null,
      perluVerifikasi = false,
    } = {}
  ) {
    super(pesan);
    this.name = "GalatApi";
    this.galat = galat;
    this.diblokir = diblokir;
    this.alasan = alasan;
    this.status = status;
    this.kode = kode;
    this.perluVerifikasi = perluVerifikasi;
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
  } catch (galat) {
    // Pembatalan (AbortController) BUKAN kegagalan jaringan: pemanggil
    // memang tidak menginginkan hasilnya lagi. Menyamarkannya sebagai
    // "koneksi gagal" hanya memunculkan pesan yang salah di layar.
    if (galat?.name === "AbortError") throw galat;
    throw new GalatApi(PESAN_JARINGAN, { status: 0 });
  }
}

/**
 * Baca body JSON respons tanpa melempar: respons error boleh saja kosong
 * atau bukan JSON (proxy, halaman pemeliharaan), dan itu tidak boleh
 * mengubah jenis kegagalan yang dilihat pemanggil.
 */
export async function bacaJsonRespons(res) {
  try {
    const data = await res.json();
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

/**
 * Bangun GalatApi dari respons HTTP gagal beserta body yang sudah dibaca.
 * Pesan, rincian per-field, dan kode sebab dari server dipertahankan agar
 * layar bisa menampilkan penyebab yang sebenarnya, bukan pesan umum.
 */
export function galatDariRespons(res, body, pesanCadangan = "Permintaan gagal.") {
  return new GalatApi(String(body?.pesan || pesanCadangan), {
    galat: body?.galat && typeof body.galat === "object" ? body.galat : {},
    diblokir: Boolean(body?.diblokir),
    alasan: body?.alasan ?? null,
    status: res?.status ?? 0,
    kode: body?.kodeVerifikasi ?? body?.kode ?? null,
    perluVerifikasi: Boolean(body?.perluVerifikasi),
  });
}

/** Historical alias retained for registration screens. */
export const GalatPendaftaran = GalatApi;
