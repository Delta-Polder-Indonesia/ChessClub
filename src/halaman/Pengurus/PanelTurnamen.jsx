import { useCallback, useEffect, useState } from "react";
import { apiPengurus, jenisTurnamen } from "../../lib/api/index.js";
import { Tombol, Modal } from "./ui.jsx";
import { Lencana } from "./PanelTurnamen/bagian.jsx";
import FormulirTurnamen from "./PanelTurnamen/Formulir.jsx";
import RincianTurnamen from "./PanelTurnamen/Rincian.jsx";
import { parseWaktuKomunitas } from "../../lib/waktu.js";

/**
 * Pengelolaan turnamen untuk pengurus.
 *
 * Fitur mengikuti versi lama (saring jenis, formulir lengkap, rincian),
 * tetapi markup tabelnya disamakan dengan panel Juara Turnamen:
 * tabel-kci/tabel-peringkat, baris belang, dan aksi berbasis ikon.
 */
export default function PanelTurnamen({ beriTahu, muatUlang, saatBukaRincian }) {
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

  // Header Dashboard kembali ke "Dashboard Pengurus" bila panel ditutup
  // (termasuk saat berpindah menu sidebar tanpa menekan Tutup).
  useEffect(() => () => saatBukaRincian?.(null), [saatBukaRincian]);

  const bukaRincian = (t) => {
    setPilih(t.id);
    saatBukaRincian?.(t.nama || "");
  };

  const tutupRincian = () => {
    setPilih(null);
    saatBukaRincian?.(null);
  };

  const simpanBaru = async (data) => {
    const t = await apiPengurus("/turnamen", { metode: "POST", bodi: data });
    beriTahu(`Turnamen "${t.nama}" dibuat.`, "sukses");
    setBuatBaru(false);
    await muat();
    muatUlang?.();
    bukaRincian(t);
  };

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
        onTutup={tutupRincian}
        onBerubah={() => {
          muat();
          muatUlang?.();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-slate-900">Turnamen</h2>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={saring}
          onChange={(e) => setSaring(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-primary"
        >
          <option value="">Semua turnamen</option>
          {Object.entries(jenis).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
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
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Memuat…
        </p>
      ) : tampil.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Belum ada turnamen. Tekan “+ Turnamen baru” untuk membuat.
        </p>
      ) : (
        <div className="overflow-auto">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Turnamen</th>
                <th>Kategori</th>
                <th>Status</th>
                <th>Tanggal Mulai</th>
                <th>Peserta</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((t, index) => (
                <tr key={t.id} className={index % 2 === 1 ? "bg-slate-50" : ""}>
                  <td>{index + 1}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => bukaRincian(t)}
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
                  <td>{jenis[t.jenis]?.label || t.jenis}</td>
                  <td>
                    <Lencana status={t.status} />
                  </td>
                  <td>{tanggal(t.mulai)}</td>
                  <td>
                    {t.jumlahPeserta}
                    {t.kuota ? ` / ${t.kuota}` : ""}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Kelola"
                        onClick={() => bukaRincian(t)}
                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
                      >
                        <IkonPensil />
                      </button>
                      <button
                        type="button"
                        title="Hapus"
                        onClick={() => setTargetHapus(t)}
                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <IkonSampah />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

function tanggal(nilai) {
  if (!nilai) return "—";
  // Jam turnamen disimpan tanpa zona waktu; parse eksplisit sebagai
  // Asia/Jakarta agar tidak bergeser di zona browser.
  const d = parseWaktuKomunitas(nilai);
  if (!d) return nilai;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function IkonPensil() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function IkonSampah() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}
