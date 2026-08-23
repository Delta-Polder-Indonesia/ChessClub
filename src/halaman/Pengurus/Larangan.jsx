import { useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { Tombol, Bidang, Modal } from "./ui.jsx";

export default function PanelLarangan({ hitam, muatUlang, beriTahu }) {
  const [sibuk, setSibuk] = useState("");
  const [cariNomor, setCariNomor] = useState("");
  const [hasilNomor, setHasilNomor] = useState(null);
  const [targetBuka, setTargetBuka] = useState(null);

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

  const konfirmasiBuka = () => {
    const username = targetBuka;
    setTargetBuka(null);
    if (!username) return;
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

      <Modal
        terbuka={Boolean(targetBuka)}
        judul={`Cabut larangan ${targetBuka || ""}`}
        labelKonfirmasi="Cabut larangan"
        jenisKonfirmasi="bahaya"
        sibuk={sibuk === `buka-${targetBuka}`}
        onBatal={() => setTargetBuka(null)}
        onKonfirmasi={konfirmasiBuka}
      >
        Pengguna ini akan dapat kembali mendaftar dan mengikuti kegiatan
        komunitas. Tindakan ini tetap tercatat di jejak audit.
      </Modal>

        <div className="max-h-[400px] overflow-auto">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th>#</th>
                <th>Akun</th>
                <th>Alasan</th>
                <th>Sumber</th>
                <th>Sejak</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {hitam.map((h, index) => (
                <tr key={h.username}>
                  <td className="font-medium text-slate-500">{index + 1}</td>
                  <td className="font-medium text-slate-900">{h.username}</td>
                  <td className="text-slate-700">
                    {h.alasan === "fair_play_violations"
                      ? "Pelanggaran fair play"
                      : "Keputusan pengurus"}
                    {h.keterangan && (
                      <span className="block text-xs text-slate-500">
                        {h.keterangan}
                      </span>
                    )}
                  </td>
                  <td>
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
                  <td className="text-xs text-slate-500">
                    {String(h.diblokirPada || "").slice(0, 10)}
                  </td>
                  <td>
                    <Tombol
                      anak="Cabut"
                      kecil
                      onClick={() => setTargetBuka(h.username)}
                      disabled={sibuk === `buka-${h.username}`}
                    />
                  </td>
                </tr>
              ))}
              {!hitam.length && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    Daftar larangan kosong.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
