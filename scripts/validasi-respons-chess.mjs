/**
 * Validasi subset respons profil dan roster Chess.com yang benar-benar
 * dipakai skrip pengurus. Field lain dari respons eksternal tidak disimpan.
 */
import { periksaUsername } from "../src/lib/identitas.js";

const STATUS_CHESS_SAH = new Set([
  "closed",
  "closed:fair_play_violations",
  "basic",
  "premium",
  "mod",
  "staff",
]);

export function usernameRosterSah(anggota) {
  if (!anggota || typeof anggota !== "object" || Array.isArray(anggota)) return null;
  if (typeof anggota.username !== "string") return null;

  const mentah = anggota.username.trim();
  const hasil = periksaUsername(mentah);
  if (!hasil.sah || hasil.username !== mentah.toLowerCase()) return null;
  return hasil.username;
}

export function statusChessSah(profil) {
  if (!profil || typeof profil !== "object" || Array.isArray(profil)) return null;
  return typeof profil.status === "string" && STATUS_CHESS_SAH.has(profil.status)
    ? profil.status
    : null;
}

export function playerIdChessSah(profil) {
  if (!profil || typeof profil !== "object" || Array.isArray(profil)) return null;
  return Number.isSafeInteger(profil.player_id) && profil.player_id > 0
    ? profil.player_id
    : null;
}
