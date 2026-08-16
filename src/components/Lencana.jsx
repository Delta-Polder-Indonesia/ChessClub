/** Lencana bersama: centang biru verifikasi & larangan fair play merah.
 * Dipakai di halaman Peringkat dan tab Keanggotaan agar tampilannya sama. */

/** Lencana centang biru untuk anggota terverifikasi. */
export function CentangBiru() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="inline-block w-4 h-4 ml-1 align-[-2px]"
      role="img"
      aria-label="terverifikasi"
    >
      <title>Akun terverifikasi</title>
      <path
        fill="#1d9bf0"
        d="M12 1.5l2.6 1.9 3.2-.2.9 3.1 2.7 1.8-1.3 2.9 1.3 2.9-2.7 1.8-.9 3.1-3.2-.2L12 22.5l-2.6-1.9-3.2.2-.9-3.1-2.7-1.8L3.9 13 2.6 10.1l2.7-1.8.9-3.1 3.2.2L12 1.5z"
      />
      <path
        fill="#fff"
        d="M10.8 15.6l-3-3 1.3-1.3 1.7 1.7 4.1-4.1 1.3 1.3-5.4 5.4z"
      />
    </svg>
  );
}

/** Lencana larangan merah untuk anggota yang akunnya kena ban fair play. */
export function LencanaBan() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="inline-block w-4 h-4 ml-1 align-[-2px]"
      role="img"
      aria-label="kena ban fair play"
    >
      <title>Akun ditutup Chess.com karena pelanggaran fair play</title>
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="#dc2626"
        strokeWidth="2.4"
      />
      <line
        x1="5.6"
        y1="5.6"
        x2="18.4"
        y2="18.4"
        stroke="#dc2626"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
