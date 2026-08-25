import { useCallback, useEffect, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { Modal } from "./ui.jsx";

function waktuPesan(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const selisih = Math.max(0, Date.now() - d.getTime());
  const jam = selisih / (1000 * 60 * 60);
  if (jam < 24) {
    const detik = Math.round(selisih / 1000);
    if (detik < 60) return "Baru saja";
    const menit = Math.round(detik / 60);
    if (menit < 60) return `${menit} mnt lalu`;
    return `${Math.round(jam)} jam lalu`;
  }
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function cuplikan(teks, maks = 60) {
  const s = String(teks || "").replace(/\s+/g, " ").trim();
  return s.length > maks ? `${s.slice(0, maks - 1)}…` : s;
}

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
  const [terpilih, setTerpilih] = useState(new Set());
  const [targetHapusBanyak, setTargetHapusBanyak] = useState(false);

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
      setTerpilih(new Set());
      muatUlang?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk("");
    }
  };

  const tandaiDibaca = (id) => {
    apiPengurus(`/pesan/${id}/baca`, { metode: "POST" })
      .then(muatPesan)
      .catch(() => {});
  };

  const togglePilih = (id) => {
    setTerpilih((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const toggleSemua = () => {
    setTerpilih((prev) => {
      if (prev.size === pesan.length) return new Set();
      return new Set(pesan.map((p) => p.id));
    });
  };

  const konfirmasiHapus = () => {
    const id = targetHapus;
    setTargetHapus(null);
    if (!id) return;
    if (pesanTerpilih?.id === id) setPesanTerpilih(null);
    jalankan(
      `hapus-${id}`,
      async () => {
        await apiPengurus(`/pesan/${id}/hapus`, { metode: "POST" });
      },
      "Pesan dihapus."
    );
  };

  const konfirmasiHapusBanyak = () => {
    const ids = [...terpilih];
    setTargetHapusBanyak(false);
    if (ids.length === 0) return;
    jalankan(
      "hapus-banyak",
      async () => {
        await apiPengurus("/pesan/hapus-banyak", {
          metode: "POST",
          bodi: { ids },
        });
      },
      `${ids.length} pesan dihapus.`
    );
  };

  const bukaPesan = (p) => {
    setPesanTerpilih(p);
    if (!p.dibaca) tandaiDibaca(p.id);
  };

  const belumDibaca = pesan.filter((p) => !p.dibaca).length;
  const adaTerpilih = terpilih.size > 0;
  const semuaDipilih = pesan.length > 0 && terpilih.size === pesan.length;

  /* ── Detail pesan: full page ──────────────────────────── */
  if (pesanTerpilih) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setPesanTerpilih(null)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke daftar
        </button>

        <div>
          <div className="pb-4">
            <h2 className="text-base font-semibold text-slate-900">
              {pesanTerpilih.subjek}
            </h2>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{pesanTerpilih.nama}</span>
              <span>&lt;{pesanTerpilih.email}&gt;</span>
              <span className="ml-auto text-xs text-slate-400">
                {new Date(pesanTerpilih.tanggal).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Jakarta",
                })} WIB
              </span>
            </div>
            {(pesanTerpilih.telepon || pesanTerpilih.organisasi) && (
              <div className="mt-2 flex gap-4 text-xs text-slate-500">
                {pesanTerpilih.telepon && <span>HP: {pesanTerpilih.telepon}</span>}
                {pesanTerpilih.organisasi && <span>Organisasi: {pesanTerpilih.organisasi}</span>}
              </div>
            )}
          </div>
          <div className="py-4 flex justify-center">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-w-2xl w-full">
              {pesanTerpilih.pesan}
            </p>
          </div>
          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = `mailto:${pesanTerpilih.email}?subject=Re: ${encodeURIComponent(pesanTerpilih.subjek)}`;
              }}
              className="rounded px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 hover:bg-slate-50"
            >
              Balas via Email
            </button>
            <button
              type="button"
              onClick={() => setTargetHapus(pesanTerpilih.id)}
              className="rounded px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        </div>

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

  /* ── Daftar pesan: email-style list ───────────────────── */
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pesan Masuk</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {pesan.length} pesan{belumDibaca > 0 && <>, <span className="font-medium text-slate-700">{belumDibaca} belum dibaca</span></>}
          </p>
        </div>
        {adaTerpilih && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{terpilih.size} dipilih</span>
            <button
              type="button"
              onClick={() => setTargetHapusBanyak(true)}
              className="rounded px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50"
            >
              Hapus Semua
            </button>
          </div>
        )}
      </div>

      {memuat ? (
        <p className="py-10 text-center text-sm text-slate-500">Memuat pesan…</p>
      ) : pesan.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">Belum ada pesan masuk.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-200">
            <label className="flex items-center w-full px-4 py-2 gap-4 text-xs font-medium text-slate-500 select-none">
              <input
                type="checkbox"
                checked={semuaDipilih}
                onChange={toggleSemua}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="w-40">Nama</span>
              <span className="w-48">Subjek</span>
              <span className="flex-1">Pesan</span>
              <span className="w-16 text-right">Waktu</span>
            </label>
            {pesan.map((p) => (
              <div
                key={p.id}
                className={`flex items-center w-full px-4 py-3 gap-4 transition-colors hover:bg-slate-50 ${
                  !p.dibaca ? "bg-blue-50/30" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={terpilih.has(p.id)}
                  onChange={() => togglePilih(p.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                />
                <button
                  type="button"
                  onClick={() => bukaPesan(p)}
                  className={`flex-1 min-w-0 flex items-center gap-4 text-left ${!p.dibaca ? "font-semibold text-black" : "text-slate-500"}`}
                >
                  {!p.dibaca && (
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                  {p.dibaca && <span className="w-2 shrink-0" />}
                  <span className="shrink-0 w-36 truncate text-sm">
                    {p.nama}
                  </span>
                  <span className="shrink-0 w-44 truncate text-sm">
                    {p.subjek}
                  </span>
                  <span className="flex-1 truncate text-sm opacity-60">
                    {cuplikan(p.pesan)}
                  </span>
                  <span className="shrink-0 w-16 text-right text-xs opacity-60 whitespace-nowrap">
                    {waktuPesan(p.tanggal)}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </>
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

      <Modal
        terbuka={targetHapusBanyak}
        judul={`Hapus ${terpilih.size} pesan?`}
        labelKonfirmasi="Hapus Semua"
        jenisKonfirmasi="bahaya"
        sibuk={sibuk === "hapus-banyak"}
        onBatal={() => setTargetHapusBanyak(false)}
        onKonfirmasi={konfirmasiHapusBanyak}
      >
        Pesan yang dihapus tidak dapat dikembalikan.
      </Modal>
    </div>
  );
}
