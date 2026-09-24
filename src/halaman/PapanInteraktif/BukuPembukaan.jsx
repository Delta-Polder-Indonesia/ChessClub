import { useMemo, useState } from "react";

/**
 * Tab "Books": katalog pembukaan sebagai daftar berkelompok (bukan <select>).
 * Kotak pencarian menyaring nama atau kode ECO; klik baris memuat jalurnya.
 */
export default function BukuPembukaan({ kelompok, idDari, terpilihId, onPilih, t }) {
  const [cari, setCari] = useState("");
  const kataKunci = cari.trim().toLowerCase();

  const cocok = (entri) =>
    !kataKunci ||
    entri.nama.toLowerCase().includes(kataKunci) ||
    String(entri.eco || "").toLowerCase().includes(kataKunci);

  const hasil = useMemo(
    () =>
      kelompok
        .map((g) => ({ nama: g.nama, daftar: g.daftar.filter(cocok) }))
        .filter((g) => g.daftar.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kelompok, kataKunci]
  );

  const jumlahTotal = kelompok.reduce((n, g) => n + g.daftar.length, 0);
  const jumlahHasil = hasil.reduce((n, g) => n + g.daftar.length, 0);

  return (
    <div className="flex flex-col">
      <input
        type="search"
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder={t("papan.cariPembukaan")}
        aria-label={t("papan.cariPembukaan")}
        className="w-full rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
      />

      <p className="mt-2 text-[11px] text-gray-500">
        {t("papan.menampilkan", { n: jumlahHasil, total: jumlahTotal })}
      </p>

      {hasil.length === 0 ? (
        <p className="px-3 py-8 text-center text-xs text-gray-500">
          {kataKunci
            ? t("papan.tidakAdaHasil", { q: cari.trim() })
            : t("papan.petunjukAwal")}
        </p>
      ) : (
        <div className="mt-1 pr-1">
          {hasil.map((g) => (
            <div key={g.nama}>
              <p className="sticky top-0 z-10 border-y border-[#312e2b] bg-[#262421] px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {g.nama}
              </p>
              <ul>
                {g.daftar.map((entri) => {
                  const id = idDari.get(entri);
                  const aktif = id === terpilihId;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => onPilih(entri, id)}
                        aria-current={aktif ? "true" : undefined}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition ${
                          aktif
                            ? "bg-[#363431] text-white"
                            : "text-gray-300 hover:bg-[#2c2926]"
                        }`}
                      >
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 font-bold tabular-nums ${
                            aktif
                              ? "bg-[#81b64c] text-[#1e1c18]"
                              : "bg-[#81b64c]/15 text-[#a3d168]"
                          }`}
                        >
                          {entri.eco}
                        </span>
                        <span className="min-w-0 truncate" title={entri.nama}>
                          {entri.nama}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
