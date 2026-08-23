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

/** Historical alias retained for registration screens. */
export const GalatPendaftaran = GalatApi;
