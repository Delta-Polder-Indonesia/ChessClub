/**
 * Helper kecil yang dipakai bersama oleh sub-halaman Kode E-Book.
 */

/** Waktu singkat id-ID, cth. "8 Sep 2026, 14.05". */
export function formatWaktu(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Sisa umur kode dalam menit (dibulatkan ke atas). */
export function sisaMenit(isoKedaluwarsa, kini) {
  return Math.max(0, Math.ceil((new Date(isoKedaluwarsa).getTime() - kini) / 60000));
}

/** Render tautan ke profil Chess.com yang aman (tidak membuat tautan kosong). */
export function tautanAkun(akun) {
  const id = (akun || "").trim();
  if (!id) return <span className="text-slate-400">—</span>;
  return (
    <a
      href={`https://www.chess.com/member/${encodeURIComponent(id)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      @{id}
    </a>
  );
}
