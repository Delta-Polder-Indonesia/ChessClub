import { useCallback, useEffect, useState } from "react";
import { apiPengurus, jenisTurnamen } from "../../lib/api/index.js";
import { Tombol, Modal, MenuAksi } from "./ui.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.jsx";
import { Lencana } from "./PanelTurnamen/Lencana.jsx";
import FormulirTurnamen from "./PanelTurnamen/Formulir.jsx";
import RincianTurnamen from "./PanelTurnamen/Rincian.jsx";
import { parseWaktuKomunitas } from "../../lib/waktu.js";

/**
 * Pengelolaan turnamen untuk pengurus.
 *
 * Fitur mengikuti versi lama (saring jenis, formulir lengkap, rincian),
 * tetapi markup tabelnya disamakan dengan panel Juara Turnamen:
 * komponen Table (garis tebal) dan aksi berbasis ikon.
 */
export default function PanelTurnamen({ beriTahu, muatUlang, saatBukaRincian }) {
  const [jenis, setJenis] = useState({});
  const [daftar, setDaftar] = useState([]);
  const [pilih, setPilih] = useState(null);
  const [buatBaru, setBuatBaru] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const [saring, setSaring] = useState("");
  const [targetHapus, setTargetHapus] = useState(null);
  const [terpilih, setTerpilih] = useState({});
  const [targetHapusMassal, setTargetHapusMassal] = useState(false);

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

  const konfirmasiHapusMassal = async () => {
    const ids = Object.keys(terpilih);
    setTargetHapusMassal(false);
    if (!ids.length) return;
    try {
      for (const id of ids) {
        await apiPengurus(`/turnamen/${id}/hapus`, { metode: "POST" });
      }
      beriTahu(`${ids.length} turnamen dihapus.`, "sukses");
      setTerpilih({});
      await muat();
      muatUlang?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    }
  };

  const tampil = saring ? daftar.filter((t) => t.jenis === saring) : daftar;
  const jumlahTerpilih = Object.values(terpilih).filter(Boolean).length;
  const semuaTerpilih = tampil.length > 0 && tampil.every((t) => terpilih[t.id]);
  const pilihSemua = (e) => {
    if (e.target.checked) {
      const baru = {};
      tampil.forEach((t) => { baru[t.id] = true; });
      setTerpilih(baru);
    } else {
      setTerpilih({});
    }
  };

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
      <div className="flex flex-wrap items-center gap-3">
        <Tombol
          anak={buatBaru ? "Tutup formulir" : "+ Turnamen baru"}
          onClick={() => setBuatBaru((b) => !b)}
        />
        {!buatBaru && (
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
        )}
        {jumlahTerpilih > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs font-medium text-slate-700">
              {jumlahTerpilih} turnamen terpilih
            </span>
            <button
              type="button"
              onClick={() => setTerpilih({})}
              className="rounded-md border-2 border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={() => setTargetHapusMassal(true)}
              className="rounded-md border-2 border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Hapus terpilih
            </button>
          </div>
        )}
      </div>

      {buatBaru && (
        <FormulirTurnamen
          jenis={jenis}
          onSimpan={simpanBaru}
          onBatal={() => setBuatBaru(false)}
        />
      )}

      {!buatBaru && (
        <>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={semuaTerpilih}
                        onChange={pilihSemua}
                        aria-label="Pilih semua turnamen"
                        className="size-4 accent-primary"
                      />
                    </TableHead>
                    <TableHead>#</TableHead>
                    <TableHead>Nama Turnamen</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Peserta</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tampil.map((t, index) => (
                    <TableRow key={t.id}>
                      <TableCell className="w-10">
                        <input
                          type="checkbox"
                          checked={!!terpilih[t.id]}
                          onChange={(e) =>
                            setTerpilih((s) => ({ ...s, [t.id]: e.target.checked }))
                          }
                          aria-label={`Pilih ${t.nama}`}
                          className="size-4 accent-primary"
                        />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => bukaRincian(t)}
                          className="font-medium text-primary hover:underline"
                        >
                          {t.nama}
                        </button>
                        {t.jumlahPengajuan > 0 && (
                          <span className="ml-2 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            {t.jumlahPengajuan} pengajuan
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{jenis[t.jenis]?.label || t.jenis}</TableCell>
                      <TableCell>
                        <Lencana status={t.status} />
                      </TableCell>
                      <TableCell>{tanggal(t.mulai)}</TableCell>
                      <TableCell>
                        {t.jumlahPeserta}
                        {t.kuota ? ` / ${t.kuota}` : ""}
                      </TableCell>
                      <TableCell className="w-24">
                        <MenuAksi
                          onUbah={() => bukaRincian(t)}
                          onHapus={() => setTargetHapus(t)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
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

      <Modal
        terbuka={targetHapusMassal}
        judul={`Hapus ${jumlahTerpilih} turnamen?`}
        labelKonfirmasi="Hapus semua"
        jenisKonfirmasi="bahaya"
        onBatal={() => setTargetHapusMassal(false)}
        onKonfirmasi={konfirmasiHapusMassal}
      >
        {jumlahTerpilih} turnamen akan dihapus permanen dan tidak dapat
        dikembalikan.
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
