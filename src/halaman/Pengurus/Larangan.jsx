import { useState } from "react";
import { apiPengurus } from "../../lib/chessAnggota.js";
import { Tombol, Bidang } from "./ui.jsx";

export default function PanelLarangan({ hitam, muatUlang, beriTahu }) {
  const [sibuk, setSibuk] = useState("");
  const [cariNomor, setCariNomor] = useState("");
  const [hasilNomor, setHasilNomor] = useState(null);

  const jalankan = async (kunci, fn) => {
    setSibuk(kunci);
    try {
      await fn();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk("");
    }
  };

  const buka = (username) => {
    if (!window.confirm(`Cabut larangan untuk "${username}"?`)) return;
    jalankan(`buka-${username}`, async () => {
      await apiPengurus("/buka", { metode: "POST", bodi: { username } });
      beriTahu(`Larangan "${username}" dicabut.`, "sukses");
      await muatUlang();
    });
  };

  const cekNomor = async (e) => {
    e.preventDefault();
    setHasilNomor(null);
    try {
      const h = await apiPengurus("/cek-nomor", {
        metode: "POST",
        bodi: { hp: cariNomor },
      });
      setHasilNomor(h);
    } catch (err) {
      beriTahu(err.message, "galat");
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-base font-bold text-slate-900">
          Daftar Larangan ({hitam.length})
        </h2>
        <form
          onSubmit={cekNomor}
          className="mb-4 flex flex-wrap items-end gap-2"
        >
          <Bidang
            label="Cek nomor HP di daftar larangan"
            value={cariNomor}
            onChange={(e) => setCariNomor(e.target.value)}
            placeholder="0812-3456-7890"
          />
          <Tombol anak="Periksa" onClick={cekNomor} />
          {hasilNomor && (
            <span
              className={`rounded px-2.5 py-1.5 text-xs font-semibold ${
                hasilNomor.diblokir
                  ? "bg-red-50 text-red-800"
                  : "bg-emerald-50 text-emerald-800"
              }`}
            >
              {hasilNomor.diblokir
                ? `Diblokir — cocok dengan ${hasilNomor.username} (${hasilNomor.cocokPada})`
                : "Aman, tidak ada di daftar larangan"}
            </span>
          )}
        </form>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-semibold w-12">#</th>
                  <th className="px-3 py-2 font-semibold">Akun</th>
                  <th className="px-3 py-2 font-semibold">Alasan</th>
                  <th className="px-3 py-2 font-semibold">Sumber</th>
                  <th className="px-3 py-2 font-semibold">Sejak</th>
                  <th className="px-3 py-2 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {hitam.map((h, index) => (
                  <tr key={h.username} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {h.username}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {h.alasan === "fair_play_violations"
                        ? "Pelanggaran fair play"
                        : "Keputusan pengurus"}
                      {h.keterangan && (
                        <span className="block text-xs text-slate-500">
                          {h.keterangan}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                          h.sumber === "otomatis"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {h.sumber}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {String(h.diblokirPada || "").slice(0, 10)}
                    </td>
                    <td className="px-3 py-2">
                      <Tombol
                        anak="Cabut"
                        kecil
                        onClick={() => buka(h.username)}
                        disabled={sibuk === `buka-${h.username}`}
                      />
                    </td>
                  </tr>
                ))}
                {!hitam.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      Daftar larangan kosong.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
