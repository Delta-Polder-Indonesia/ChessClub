import { useCallback, useEffect, useState } from "react";
import { apiPengurus } from "../../lib/chessAnggota.js";
import { Tombol, Modal } from "./ui.jsx";

export default function PanelPesan({
  beriTahu,
  muatUlang,
  pesanTerpilihId,
  onPesanTerbuka,
}) {
  const [pesan, setPesan] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [pesanTerpilih, setPesanTerpilih] = useState(null);
  const [sibuk, setSibuk] = useState("");
  const [targetHapus, setTargetHapus] = useState(null);

  // Bila Dashboard memberi id pesan (dari klik notifikasi), buka pesan
  // itu setelah daftar termuat.
  useEffect(() => {
    if (!pesanTerpilihId || !pesan.length) return;
    const ditemukan = pesan.find((p) => p.id === pesanTerpilihId);
    if (ditemukan) {
      setPesanTerpilih(ditemukan);
      if (!ditemukan.dibaca) tandaiDibaca(ditemukan.id);
    }
    onPesanTerbuka?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pesanTerpilihId, pesan]);

  const muatPesan = useCallback(async () => {
    setMemuat(true);
    try {
      const data = await apiPengurus("/pesan");
      setPesan(data);
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setMemuat(false);
    }
  }, [beriTahu]);

  useEffect(() => {
    muatPesan();
  }, [muatPesan]);

  const jalankan = async (kunci, fn, pesanSukses) => {
    setSibuk(kunci);
    try {
      await fn();
      if (pesanSukses) beriTahu(pesanSukses, "sukses");
      await muatPesan();
      muatUlang?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk("");
    }
  };

  const tandaiDibaca = (id) =>
    jalankan(
      `baca-${id}`,
      async () => {
        await apiPengurus(`/pesan/${id}/baca`, { metode: "POST" });
      },
      "Pesan ditandai sudah dibaca."
    );

  const hapusPesan = (id) => setTargetHapus(id);

  const konfirmasiHapus = () => {
    const id = targetHapus;
    setTargetHapus(null);
    if (!id) return;
    // Bila pesan yang sedang dibuka dihapus, panel rincian harus
    // dikosongkan — kalau tidak, ia terus menampilkan data yang sudah
    // tidak ada di daftar.
    if (pesanTerpilih?.id === id) setPesanTerpilih(null);
    jalankan(
      `hapus-${id}`,
      async () => {
        await apiPengurus(`/pesan/${id}/hapus`, { metode: "POST" });
      },
      "Pesan dihapus."
    );
  };

  const belumDibaca = pesan.filter((p) => !p.dibaca).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">
          Pesan Masuk ({pesan.length})
        </h2>
        {belumDibaca > 0 && (
          <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
            {belumDibaca} belum dibaca
          </span>
        )}
      </div>

      {memuat ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Memuat pesan…
        </p>
      ) : pesan.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Belum ada pesan masuk.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {pesan.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setPesanTerpilih(p);
                  if (!p.dibaca) tandaiDibaca(p.id);
                }}
                className={`rounded-lg border p-4 cursor-pointer transition-colors duration-150 ${
                  pesanTerpilih?.id === p.id
                    ? "border-primary bg-blue-50"
                    : p.dibaca
                      ? "border-slate-200 bg-white hover:bg-slate-50"
                      : "border-primary bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900 truncate">
                        {p.nama}
                      </p>
                      {!p.dibaca && (
                        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 truncate">{p.subjek}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(p.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Tombol
                    anak="×"
                    kecil
                    jenis="bahaya"
                    aria-label={`Hapus pesan dari ${p.nama}`}
                    title="Hapus pesan"
                    onClick={(e) => {
                      e.stopPropagation();
                      hapusPesan(p.id);
                    }}
                    disabled={sibuk === `hapus-${p.id}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {pesanTerpilih ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {pesanTerpilih.subjek}
                </h3>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold">Dari:</span>{" "}
                    {pesanTerpilih.nama} ({pesanTerpilih.email})
                  </p>
                  {pesanTerpilih.telepon && (
                    <p>
                      <span className="font-semibold">Telepon:</span>{" "}
                      {pesanTerpilih.telepon}
                    </p>
                  )}
                  {pesanTerpilih.organisasi && (
                    <p>
                      <span className="font-semibold">Organisasi:</span>{" "}
                      {pesanTerpilih.organisasi}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold">Tanggal:</span>{" "}
                    {new Date(pesanTerpilih.tanggal).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-slate-700 whitespace-pre-wrap">
                  {pesanTerpilih.pesan}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Tombol
                  anak="Balas via Email"
                  kecil
                  onClick={() => {
                    window.location.href = `mailto:${pesanTerpilih.email}?subject=Re: ${encodeURIComponent(pesanTerpilih.subjek)}`;
                  }}
                />
                <Tombol
                  anak="Hapus"
                  kecil
                  jenis="bahaya"
                  onClick={() => hapusPesan(pesanTerpilih.id)}
                  disabled={sibuk === `hapus-${pesanTerpilih.id}`}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-500">Pilih pesan untuk melihat detail</p>
            </div>
          )}
        </div>
      )}

      <Modal
        terbuka={Boolean(targetHapus)}
        judul="Hapus pesan?"
        labelKonfirmasi="Hapus"
        jenisKonfirmasi="bahaya"
        sibuk={sibuk === `hapus-${targetHapus}`}
        onBatal={() => setTargetHapus(null)}
        onKonfirmasi={konfirmasiHapus}
      >
        Pesan yang dihapus tidak dapat dikembalikan.
      </Modal>
    </div>
  );
}
