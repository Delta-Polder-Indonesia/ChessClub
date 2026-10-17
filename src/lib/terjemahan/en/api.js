/**
 * Kamus Inggris (EN) · kelompok api — API-layer error messages.
 *
 * Standard: the API layer carries no ready-made sentences; client-side
 * failures travel as `kodePesan` and are translated by `teksGalat(err, t)`
 * via the `api.*` keys in this file. Server `pesan` content is shown verbatim
 * and never comes from these keys. Keys in file: api.
 */

export const api = {
  umum: "Request failed. Please try again.",
  jaringan: "Could not reach the server. Check your internet connection and try again.",
  memuatRoster: "Failed to load the public Chess.com roster.",
  responsTidakSah: "The member API responded {status}.",
  formatTidakSah: "The member API returned an invalid format.",
  memuatAnggota: "The member list could not be loaded from the server or Chess.com.",
  memuatLarangan: "Failed to load the ban list.",
  mintaKode: "The verification code could not be requested. Try again.",
  periksaKode: "The code check failed. Try again.",
  pengajuanManual: "The manual application could not be sent. Try again.",
  pendaftaran: "Registration failed.",
  memuatCaraVerifikasi: "Verification configuration could not be loaded.",
  loginChesscom: "Chess.com login is unavailable.",
  responsLogin: "Chess.com login returned an invalid response.",
  tebusKode: "The access code could not be redeemed.",
  kirimPermintaanEbook: "The request could not be sent.",
  memuatBerita: "Failed to load community news.",
  memuatPengumuman: "Failed to load announcements.",
  csrf: "Failed to fetch the CSRF token.",
  csrfTidakSah: "Invalid CSRF token response.",
  gagalStatus: "Failed ({status}).",
  loginGagalStatus: "Login failed ({status}).",
  kirimPesan: "Failed to send the message.",
  papanPeringkatRush: "Failed to load the Rush leaderboard.",
  simpanSkorRush: "Failed to save the score to the leaderboard.",
  memuatJenisTurnamen: "Failed to load tournament categories.",
  memuatTurnamen: "Failed to load tournaments.",
  pengajuanTurnamen: "Tournament application failed.",
  turnamenTidakDitemukan: "Tournament not found.",
};
