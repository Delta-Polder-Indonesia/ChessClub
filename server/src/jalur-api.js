/**
 * Normalisasi jalur API.
 *
 * Klien lama memakai /api/*. Klien baru boleh memakai /api/v1/* yang
 * dipetakan ke rute yang sama. Prefiks versi tidak mengubah perilaku.
 */
export const VERSI_API_KANONIK = "v1";

export function jalurKanonik(jalurMentah) {
  const jalur = String(jalurMentah || "/").split("?")[0];
  if (jalur === "/api/v1") return "/api";
  if (jalur.startsWith("/api/v1/")) return `/api/${jalur.slice("/api/v1/".length)}`;
  return jalur;
}

export function adalahJalurPengurus(jalur) {
  const kanonik = jalurKanonik(jalur);
  return kanonik === "/api/pengurus" || kanonik.startsWith("/api/pengurus/");
}
