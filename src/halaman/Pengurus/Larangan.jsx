import { useMemo, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { Tombol, Modal, Avatar } from "./ui.jsx";

export default function PanelLarangan({
  hitam = [],
  muatUlang,
  beriTahu,
  filterAwal = "semua",
}) {
  const [sibuk, setSibuk] = useState("");
  const [cariNomor, setCariNomor] = useState("");
  const [hasilNomor, setHasilNomor] = useState(null);
  const [targetBuka, setTargetBuka] = useState(null);
  const [filterSumber, setFilterSumber] = useState(filterAwal);
  const [cariAkun, setCariAkun] = useState("");

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

  const jumlahOtomatis = useMemo(
    () => hitam.filter((h) => h.sumber === "otomatis").length,
    [hitam]
  );
  const jumlahPengurus = useMemo(
    () => hitam.filter((h) => h.sumber === "pengurus").length,
    [hitam]
  );

  const dataTersaring = useMemo(() => {
    let hasil = [...hitam];

    if (filterSumber === "otomatis") {
      hasil = hasil.filter((h) => h.sumber === "otomatis");
    } else if (filterSumber === "pengurus") {
      hasil = hasil.filter((h) => h.sumber === "pengurus");
    }

    const q = cariAkun.trim().toLowerCase();
    if (q) {
      hasil = hasil.filter(
        (h) =>
          (h.username && h.username.toLowerCase().includes(q)) ||
          (h.alasan && h.alasan.toLowerCase().includes(q)) ||
          (h.keterangan && h.keterangan.toLowerCase().includes(q))
      );
    }

    hasil.sort(
      (a, b) =>
        new Date(b.diblokirPada || 0).getTime() -
        new Date(a.diblokirPada || 0).getTime()
    );

    return hasil;
  }, [hitam, filterSumber, cariAkun]);

  const formatTanggal = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Daftar Larangan</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {hitam.length} akun dilarang mengikuti kegiatan komunitas dan turnamen
          </p>
        </div>
      </div>

      {/* ── Banner Alert ────────────────────────────────────── */}
      {jumlahOtomatis > 0 && (
        <div className="flex items-center gap-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="flex-1 text-amber-800">
            <span className="font-semibold">{jumlahOtomatis} akun</span> terdeteksi terkena ban otomatis dari Chess.com.
            {filterSumber !== "otomatis" && (
              <button
                type="button"
                onClick={() => setFilterSumber("otomatis")}
                className="ml-2 font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
              >
                Lihat →
              </button>
            )}
          </p>
        </div>
      )}

      {/* ── Filter Tabs + Pencarian + Cek HP ──────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 ml-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={cariAkun}
              onChange={(e) => setCariAkun(e.target.value)}
              placeholder="Cari username atau alasan…"
              className="w-52 border-0 border-b border-slate-300 bg-transparent pl-9 pr-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-600"
            />
          </div>
          <div className="h-4 w-px bg-slate-300" />
          <form className="flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              value={cariNomor}
              onChange={(e) => setCariNomor(e.target.value)}
              placeholder="Cek nomor HP: 0812-3456-7890"
              className="w-52 border-0 border-b border-slate-300 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-600"
            />
            <Tombol
              anak="Periksa"
              onClick={cekNomor}
              kecil
              disabled={!cariNomor.trim()}
            />
          </form>
          {hasilNomor && (
            <span className={`text-xs font-medium ${hasilNomor.diblokir ? "text-red-600" : "text-emerald-600"}`}>
              {hasilNomor.diblokir
                ? `Diblokir — cocok dengan @${hasilNomor.username}`
                : "Aman"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[
            { kunci: "semua", label: "Semua", jumlah: hitam.length },
            { kunci: "otomatis", label: "Otomatis", jumlah: jumlahOtomatis },
            { kunci: "pengurus", label: "Pengurus", jumlah: jumlahPengurus },
          ].map((tab) => (
            <button
              key={tab.kunci}
              type="button"
              onClick={() => setFilterSumber(tab.kunci)}
              className={`
                -mb-px px-4 py-2.5 text-sm font-medium transition-colors
                ${filterSumber === tab.kunci
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
                }
              `}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${filterSumber === tab.kunci ? "text-slate-600" : "text-slate-400"}`}>
                {tab.jumlah}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabel ───────────────────────────────────────────── */}
      <div>
        <p className="text-xs text-slate-500 mb-1">
          Menampilkan <span className="font-medium text-slate-700">{dataTersaring.length}</span> dari {hitam.length} akun
        </p>

        <div className="max-h-[480px] overflow-y-auto">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Akun</th>
                <th>Alasan</th>
                <th>Sumber</th>
                <th>Tanggal Blokir</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataTersaring.map((h, index) => {
                const isOtomatis = h.sumber === "otomatis";
                return (
                  <tr key={h.username} className={index % 2 === 1 ? "bg-slate-50" : ""}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar username={h.username} />
                        <a
                          href={`https://www.chess.com/member/${encodeURIComponent(h.username)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          @{h.username}
                        </a>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                        h.alasan === "fair_play_violations"
                          ? "bg-red-600 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {h.alasan === "fair_play_violations" ? "Fair Play" : "Keputusan Pengurus"}
                      </span>
                      {h.keterangan && (
                        <p className="mt-0.5 text-sm text-slate-500 max-w-[240px] truncate" title={h.keterangan}>
                          {h.keterangan}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className={isOtomatis ? "text-amber-700" : "text-slate-600"}>
                        {isOtomatis ? "Otomatis" : "Pengurus"}
                      </span>
                    </td>
                    <td>{formatTanggal(h.diblokirPada)}</td>
                    <td>
                      <button
                        type="button"
                        title="Cabut larangan"
                        onClick={() => setTargetBuka(h.username)}
                        disabled={sibuk === `buka-${h.username}`}
                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary disabled:opacity-40"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M9 14l6-6M5.586 15H21m-6.414-6.414A3 3 0 1112.828 9H15a3 3 0 110 6h-2.172" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!dataTersaring.length && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500" style={{ padding: "40px 0" }}>
                    {cariAkun || filterSumber !== "semua"
                      ? "Tidak ada akun yang cocok dengan filter."
                      : "Daftar larangan masih kosong."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Konfirmasi Cabut Larangan ────────────────── */}
      <Modal
        terbuka={Boolean(targetBuka)}
        judul={`Cabut Larangan @${targetBuka || ""}?`}
        labelKonfirmasi="Cabut Larangan"
        jenisKonfirmasi="bahaya"
        sibuk={sibuk === `buka-${targetBuka}`}
        onBatal={() => setTargetBuka(null)}
        onKonfirmasi={konfirmasiBuka}
      >
        Pengguna ini akan dapat kembali mendaftar dan mengikuti kegiatan
        komunitas. Pencabutan tetap dicatat di jejak audit.
      </Modal>
    </div>
  );
}
