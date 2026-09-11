import { headerKolom, formatWaktu, tautanAkun } from "./bantuan.jsx";

/**
 * Halaman "Jejak unduhan": siapa yang mengunduh, memakai kode siapa, buku apa.
 */
export default function EbookUnduhan({ unduhan }) {
  return (
    <section
      aria-labelledby="jejak-unduhan-judul"
      className="rounded-md border-2 border-slate-200 bg-white"
    >
      <div className="border-b-2 border-slate-200 px-4 py-3">
        <h3 id="jejak-unduhan-judul" className="text-sm font-semibold text-slate-900">
          Jejak unduhan
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Siapa yang mengunduh, memakai kode siapa, dan buku apa — terbaru di
          atas (maksimal 1000 catatan terakhir).
        </p>
      </div>
      {unduhan.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          Belum ada unduhan yang tercatat.
        </p>
      ) : (
        <div className="overflow-auto">
          <table className="tabel-kci tabel-tebal" aria-describedby="jejak-unduhan-judul">
            <thead>
              <tr>
                {headerKolom("Waktu")}
                {headerKolom("Nama asli")}
                {headerKolom("Akun Chess.com")}
                {headerKolom("Kode")}
                {headerKolom("Buku")}
              </tr>
            </thead>
            <tbody>
              {unduhan.map((u, i) => (
                <tr key={u.id || i} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                  <td className="whitespace-nowrap text-xs">{formatWaktu(u.waktu)}</td>
                  <td className="font-medium text-slate-900">{u.nama}</td>
                  <td>{tautanAkun(u.akunChess)}</td>
                  <td className="whitespace-nowrap text-xs">
                    <span className="font-mono">{u.kode}</span>
                    <span className="ml-1 text-slate-500">({u.panggilan})</span>
                  </td>
                  <td
                    className="max-w-[280px] truncate text-xs"
                    title={u.judul || ""}
                  >
                    {u.judul || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}