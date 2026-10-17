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
 *
 * Standar pesan galat (berlaku untuk SEMUA modul di folder ini):
 * - `message` hanya diisi dari `pesan` milik server (konten nyata);
 *   pesan cadangan sisi klien TIDAK lagi ditulis dalam bahasa apa pun.
 * - Kegagalan sisi klien (jaringan, format tak sah, dsb.) dibawa lewat
 *   `kodePesan` — kunci terjemahan `api.<kodePesan>` — dan diterjemahkan
 *   lapisan tampilan lewat `teksGalat(err, t)`.
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
      kodePesan = null,
      cause = undefined,
    } = {}
  ) {
    super(pesan || "");
    if (cause !== undefined) this.cause = cause;
    this.name = "GalatApi";
    this.galat = galat;
    this.diblokir = diblokir;
    this.alasan = alasan;
    this.status = status;
    this.kode = kode;
    this.perluVerifikasi = perluVerifikasi;
    this.kodePesan = kodePesan;
  }
}

/**
 * Teks galat untuk tampilan, menurut urutan baku:
 * 1. `err.message` — pesan milik server (konten nyata), ditampilkan apa adanya;
 * 2. terjemahan `api.<kodePesan>` — kegagalan sisi klien (jaringan, dsb.);
 * 3. `kunciCadangan` — kunci domain bila pemanggil memilikinya;
 * 4. `api.umum` — cadangan terakhir.
 */
export function teksGalat(err, t, kunciCadangan = "") {
  if (err?.message) return err.message;
  const ganti = { status: err?.status ?? "" };
  if (typeof t === "function") {
    if (err?.kodePesan) {
      const teks = t(`api.${err.kodePesan}`, ganti);
      if (teks && teks !== `api.${err.kodePesan}`) return teks;
    }
    if (kunciCadangan) {
      const cadangan = t(kunciCadangan, ganti);
      if (cadangan && cadangan !== kunciCadangan) return cadangan;
    }
    const umum = t("api.umum", ganti);
    if (umum && umum !== "api.umum") return umum;
  }
  return err?.message || "";
}

/**
 * Pesan baku untuk permintaan yang tidak pernah sampai ke server (offline,
 * CORS, DNS). fetch() asli melempar TypeError berbahasa Inggris ("Failed to
 * fetch") — jangan biarkan pesan teknis itu tampil mentah di layar pengunjung;
 * kegagalan transport dibawa sebagai `kodePesan: "jaringan"` dan diterjemahkan
 * lapisan tampilan (kunci `api.jaringan`).
 */
export const KODE_PESAN_JARINGAN = "jaringan";

/**
 * fetch() ke jalur API dengan jaminan pesan ramah: hanya kegagalan
 * TRANSPORT (sebelum ada respons) yang dibungkus kode "jaringan". Galat HTTP
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
    throw new GalatApi("", { status: 0, kodePesan: KODE_PESAN_JARINGAN });
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
 * `pesan` server dipertahankan apa adanya; bila tidak ada, kegagalan dibawa
 * sebagai `kodePesan` (kunci `api.<kodePesan>`, default "umum") untuk
 * diterjemahkan lapisan tampilan.
 */
export function galatDariRespons(res, body, kodePesan = "umum") {
  return new GalatApi(String(body?.pesan || ""), {
    galat: body?.galat && typeof body.galat === "object" ? body.galat : {},
    diblokir: Boolean(body?.diblokir),
    alasan: body?.alasan ?? null,
    status: res?.status ?? 0,
    kode: body?.kodeVerifikasi ?? body?.kode ?? null,
    perluVerifikasi: Boolean(body?.perluVerifikasi),
    kodePesan: body?.pesan ? null : kodePesan,
  });
}

/** Historical alias retained for registration screens. */
export const GalatPendaftaran = GalatApi;
