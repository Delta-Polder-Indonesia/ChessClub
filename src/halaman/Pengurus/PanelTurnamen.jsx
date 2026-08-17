import { useCallback, useEffect, useState } from "react";
import { apiPengurus, jenisTurnamen } from "../../lib/chessAnggota.js";
import { Tombol, Modal } from "./ui.jsx";
import { Lencana } from "./PanelTurnamen/bagian.jsx";
import FormulirTurnamen from "./PanelTurnamen/Formulir.jsx";
import RincianTurnamen from "./PanelTurnamen/Rincian.jsx";

/**
 * Pengelolaan turnamen untuk pengurus.
 *
 * Satu antarmuka untuk keempat jenis turnamen (Bulanan, Liga Musiman,
 * Terbuka, Liga Antar Komunitas) — yang membedakan hanya aturannya, dan
 * aturan itu datang dari server lewat /api/turnamen/jenis.
 *
 * Berkas ini sengaja tetap tipis: formulir pembuatan dan rincian
 * turnamen hidup di subfolder PanelTurnamen/ agar mudah dirawat.
 */
export default function PanelTurnamen({ beriTahu, muatUlang }) {
  const [jenis, setJenis] = useState({});
  const [daftar, setDaftar] = useState([]);
  const [pilih, setPilih] = useState(null);
  const [buatBaru, setBuatBaru] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const [saring, setSaring] = useState("");
  const [targetHapus, setTargetHapus] = useState(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const [j, d] = await Promise.all([jenisTurnamen(), apiPengurus("/turnamen")]);
      setJenis(j.jenis);
      setDaftar(d);
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setMemuat(false);
    }
  }, [beriTahu]);

  useEffect(() => {
    muat();
  }, [muat]);

  const simpanBaru = async (data) => {
    const t = await apiPengurus("/turnamen", { metode: "POST", bodi: data });
    beriTahu(`Turnamen "${t.nama}" dibuat.`, "sukses");
    setBuatBaru(false);
    await muat();
    muatUlang?.();
    setPilih(t.id);
  };

  const hapus = (t) => setTargetHapus(t);

  const konfirmasiHapus = async () => {
    const t = targetHapus;
    setTargetHapus(null);
    if (!t) return;
    try {
      await apiPengurus(`/turnamen/${t.id}/hapus`, { metode: "POST" });
      beriTahu("Turnamen dihapus.", "sukses");
      if (pilih === t.id) setPilih(null);
      await muat();
      muatUlang?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    }
  };

  const tampil = saring ? daftar.filter((t) => t.jenis === saring) : daftar;

  if (pilih) {
    return (
      <RincianTurnamen
        id={pilih}
        jenis={jenis}
        beriTahu={beriTahu}
        onTutup={() => setPilih(null)}
        onBerubah={() => {
          muat();
          muatUlang?.();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Tombol
            anak="Semua"
            kecil
            jenis={saring === "" ? "utama" : "biasa"}
            onClick={() => setSaring("")}
          />
          {Object.entries(jenis).map(([k, v]) => (
            <Tombol
              key={k}
              anak={v.label}
              kecil
              jenis={saring === k ? "utama" : "biasa"}
              onClick={() => setSaring(k)}
            />
          ))}
        </div>
        <Tombol
          anak={buatBaru ? "Tutup formulir" : "+ Turnamen baru"}
          jenis="utama"
          onClick={() => setBuatBaru((b) => !b)}
        />
      </div>

      {buatBaru && (
        <FormulirTurnamen
          jenis={jenis}
          onSimpan={simpanBaru}
          onBatal={() => setBuatBaru(false)}
        />
      )}

      {memuat ? (
        <p className="py-8 text-center text-sm text-slate-500">Memuat…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Nama</th>
                <th className="px-3 py-2 font-semibold">Jenis</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Mulai</th>
                <th className="px-3 py-2 font-semibold">Peserta</th>
                <th className="px-3 py-2 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setPilih(t.id)}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.nama}
                    </button>
                    {t.jumlahPengajuan > 0 && (
                      <span className="ml-2 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        {t.jumlahPengajuan} pengajuan
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {jenis[t.jenis]?.label || t.jenis}
                  </td>
                  <td className="px-3 py-2">
                    <Lencana status={t.status} />
                  </td>
                  <td className="px-3 py-2 text-slate-600">{t.mulai || "—"}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {t.jumlahPeserta}
                    {t.kuota ? ` / ${t.kuota}` : ""}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5">
                      <Tombol anak="Kelola" kecil onClick={() => setPilih(t.id)} />
                      <Tombol
                        anak="Hapus"
                        kecil
                        jenis="bahaya"
                        onClick={() => hapus(t)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!tampil.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    Belum ada turnamen. Tekan “+ Turnamen baru” untuk membuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        terbuka={Boolean(targetHapus)}
        judul="Hapus turnamen?"
        labelKonfirmasi="Hapus"
        jenisKonfirmasi="bahaya"
        onBatal={() => setTargetHapus(null)}
        onKonfirmasi={konfirmasiHapus}
      >
        "{targetHapus?.nama}" akan dihapus permanen beserta daftar peserta
        dan hasilnya.
      </Modal>
    </div>
  );
}
