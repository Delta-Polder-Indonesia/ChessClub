import { headerKolom, formatWaktu, sisaMenit } from "./bantuan.jsx";
import { Tombol } from "../ui.jsx";

/**
 * Halaman "Daftar kode akses": semua kode yang pernah diterbitkan.
 */
export default function EbookKode({ kode, kini, sibuk, onSalin, onHapus, onMuat }) {
  return (
    <section
      aria-labelledby="daftar-kode-judul"
      className="rounded-md border-2 border-slate-200 bg-white"
    >
      <div className="flex items-center justify-between border-b-2 border-slate-200 px-4 py-3">
        <div>
          <h3 id="daftar-kode-judul" className="text-sm font-semibold text-slate-900">
            Daftar kode akses
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Kode aktif 1 jam sejak diterbitkan, lalu kedaluwarsa otomatis.
          </p>
        </div>
        <Tombol kecil onClick={onMuat} disabled={sibuk}>
          Segarkan
        </Tombol>
      </div>
      {kode.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          Belum ada kode. Terbitkan kode pertama lewat halaman "Kode E-Book".
        </p>
      ) : (
        <div className="overflow-auto">
          <table className="tabel-kci tabel-tebal" aria-describedby="daftar-kode-judul">
            <thead>
              <tr>
                {headerKolom("Panggilan")}
                {headerKolom("Kode")}
                {headerKolom("Status")}
                {headerKolom("Diterbitkan")}
                {headerKolom("Kedaluwarsa")}
                {headerKolom("Unduhan")}
                {headerKolom("Catatan")}
                {headerKolom("Aksi")}
              </tr>
            </thead>
            <tbody>
              {kode.map((k, i) => (
                <tr key={k.kode} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                  <td className="font-medium text-slate-900">{k.panggilan}</td>
                  <td>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-slate-800">
                      {k.kode}
                    </span>
                  </td>
                  <td>
                    {k.kadaluarsa ? (
                      <span className="inline-flex rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Kedaluwarsa
                      </span>
                    ) : (
                      <span
                        className="inline-flex rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        title={`Sisa ${sisaMenit(k.kedaluwarsa, kini)} menit lagi`}
                      >
                        Aktif · {sisaMenit(k.kedaluwarsa, kini)} mnt
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-xs">{formatWaktu(k.dibuat)}</td>
                  <td className="whitespace-nowrap text-xs">{formatWaktu(k.kedaluwarsa)}</td>
                  <td className="text-center text-xs">{k.jumlahUnduhan || 0}×</td>
                  <td className="max-w-[180px] truncate text-xs text-slate-500" title={k.catatan || ""}>
                    {k.catatan || "—"}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSalin(k.kode)}
                        disabled={sibuk}
                        className="text-xs font-medium text-primary hover:underline disabled:opacity-40"
                      >
                        Salin
                      </button>
                      <button
                        type="button"
                        onClick={() => onHapus(k)}
                        disabled={sibuk}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                      >
                        Hapus
                      </button>
                    </div>
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