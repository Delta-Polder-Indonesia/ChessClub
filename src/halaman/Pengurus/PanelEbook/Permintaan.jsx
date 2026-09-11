import { headerKolom, formatWaktu, tautanAkun } from "./bantuan.jsx";

/**
 * Halaman "Permintaan kode": pengajuan dari popup unduh yang belum diputus.
 */
export default function EbookPermintaan({ minta, cariMinta, onCariMinta, sibuk, onTerbitkan, onTolak }) {
  const tersaring = minta.filter((m) => {
    const kunci = cariMinta.trim().toLowerCase();
    if (!kunci) return true;
    return (
      m.nama?.toLowerCase().includes(kunci) ||
      m.akunChess?.toLowerCase().includes(kunci)
    );
  });

  return (
    <section
      aria-labelledby="permintaan-kode-judul"
      className="rounded-md border-2 border-slate-200 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 px-4 py-3">
        <div>
          <h3 id="permintaan-kode-judul" className="text-sm font-semibold text-slate-900">
            Permintaan kode
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Orang yang mengajukan lewat popup unduh. Cari namanya, lalu
            terbitkan kodenya dan kirimkan lewat WA/grup.
          </p>
        </div>
        <input
          type="search"
          value={cariMinta}
          onChange={(e) => onCariMinta(e.target.value)}
          placeholder="Cari nama / akun…"
          aria-label="Cari permintaan"
          className="w-56 rounded-md border-2 border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>
      {tersaring.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          {cariMinta.trim()
            ? "Tidak ada permintaan yang cocok dengan pencarian."
            : "Belum ada permintaan kode."}
        </p>
      ) : (
        <div className="overflow-auto">
          <table className="tabel-kci tabel-tebal" aria-describedby="permintaan-kode-judul">
            <thead>
              <tr>
                {headerKolom("Waktu")}
                {headerKolom("Nama asli")}
                {headerKolom("Akun Chess.com")}
                {headerKolom("Ingin mengunduh")}
                {headerKolom("Status")}
                {headerKolom("Aksi")}
              </tr>
            </thead>
            <tbody>
              {tersaring.map((m, i) => (
                <tr key={m.id || i} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                  <td className="whitespace-nowrap text-xs">{formatWaktu(m.waktu)}</td>
                  <td className="font-medium text-slate-900">{m.nama}</td>
                  <td>{tautanAkun(m.akunChess)}</td>
                  <td className="max-w-[200px] truncate text-xs text-slate-500" title={m.judul || ""}>
                    {m.judul || "—"}
                  </td>
                  <td>
                    {m.status === "menunggu" ? (
                      <span className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Menunggu
                      </span>
                    ) : m.status === "diterbitkan" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Diterbitkan
                        <span className="font-mono font-bold">{m.kode}</span>
                      </span>
                    ) : (
                      <span className="inline-flex rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Ditolak
                      </span>
                    )}
                  </td>
                  <td>
                    {m.status === "menunggu" ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={sibuk}
                          onClick={() => onTerbitkan(m)}
                          className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-40"
                        >
                          Terbitkan kode
                        </button>
                        <button
                          type="button"
                          disabled={sibuk}
                          onClick={() => onTolak(m)}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {formatWaktu(m.diputus)}
                      </span>
                    )}
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