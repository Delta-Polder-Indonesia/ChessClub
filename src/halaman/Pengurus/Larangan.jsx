import { useMemo, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { Tombol, Bidang, Modal, Avatar } from "./ui.jsx";

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

  /* Hitungan sumber larangan */
  const jumlahOtomatis = useMemo(
    () => hitam.filter((h) => h.sumber === "otomatis").length,
    [hitam]
  );
  const jumlahPengurus = useMemo(
    () => hitam.filter((h) => h.sumber === "pengurus").length,
    [hitam]
  );

  /* Penyaringan data */
  const dataTersaring = useMemo(() => {
    let hasil = [...hitam];

    // Filter sumber (semua / otomatis / pengurus)
    if (filterSumber === "otomatis") {
      hasil = hasil.filter((h) => h.sumber === "otomatis");
    } else if (filterSumber === "pengurus") {
      hasil = hasil.filter((h) => h.sumber === "pengurus");
    }

    // Filter pencarian teks
    const q = cariAkun.trim().toLowerCase();
    if (q) {
      hasil = hasil.filter(
        (h) =>
          (h.username && h.username.toLowerCase().includes(q)) ||
          (h.alasan && h.alasan.toLowerCase().includes(q)) ||
          (h.keterangan && h.keterangan.toLowerCase().includes(q))
      );
    }

    // Urutkan dari yang paling baru diblokir
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
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              Daftar Larangan ({hitam.length})
            </h2>
            {jumlahOtomatis > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {jumlahOtomatis} Ban Otomatis Fair Play
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Daftar akun yang dilarang mengikuti kegiatan komunitas dan turnamen,
            baik karena pelanggaran fair play Chess.com maupun keputusan pengurus.
          </p>
        </div>
      </div>

      {/* ── Banner Informasi Ban Otomatis ──────────────────── */}
      {jumlahOtomatis > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50/80 p-4">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1 text-sm text-amber-900">
            <p className="font-semibold">
              Terdeteksi {jumlahOtomatis} akun terkena ban otomatis dari Chess.com
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              Sistem secara otomatis memindahkan akun yang ditutup karena
              pelanggaran fair play ke daftar ini saat pemindaian berkala.
            </p>
          </div>
          {filterSumber !== "otomatis" && (
            <button
              type="button"
              onClick={() => setFilterSumber("otomatis")}
              className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900 hover:bg-amber-300"
            >
              Filter Otomatis Saja →
            </button>
          )}
        </div>
      )}

      {/* ── Ringkasan Mini Tab ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setFilterSumber("semua")}
          className={`rounded-lg border p-4 text-left transition-all ${
            filterSumber === "semua"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Semua Larangan
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {hitam.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Total akun dilarang</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterSumber("otomatis")}
          className={`rounded-lg border p-4 text-left transition-all ${
            filterSumber === "otomatis"
              ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Ban Otomatis Fair Play
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {jumlahOtomatis}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Deteksi sistem Chess.com</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterSumber("pengurus")}
          className={`rounded-lg border p-4 text-left transition-all ${
            filterSumber === "pengurus"
              ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Manual Pengurus
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {jumlahPengurus}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Keputusan manual pengurus</p>
        </button>
      </div>

      {/* ── Pencarian & Cek Nomor HP ───────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Filter & Cari Akun */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            Cari Akun Terlarang
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={cariAkun}
              onChange={(e) => setCariAkun(e.target.value)}
              placeholder="Cari username atau alasan…"
              className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
            {cariAkun && (
              <button
                type="button"
                onClick={() => setCariAkun("")}
                className="rounded px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
              >
                Hapus
              </button>
            )}
          </div>
        </div>

        {/* Cek Nomor HP */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            Cek Nomor HP di Daftar Hitam
          </h3>
          <form onSubmit={cekNomor} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={cariNomor}
              onChange={(e) => setCariNomor(e.target.value)}
              placeholder="0812-3456-7890"
              className="flex-1 min-w-[180px] rounded border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
            <Tombol anak="Periksa" onClick={cekNomor} kecil />
          </form>
          {hasilNomor && (
            <div className="mt-2">
              <span
                className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${
                  hasilNomor.diblokir
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                {hasilNomor.diblokir
                  ? `⚠️ Nomor DIBLOKIR — cocok dengan @${hasilNomor.username} (${hasilNomor.cocokPada})`
                  : "✓ Aman, tidak ada di daftar larangan"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabel Daftar Larangan ──────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Menampilkan {dataTersaring.length} dari {hitam.length} Akun
            </span>
            {filterSumber !== "semua" && (
              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                Filter: {filterSumber === "otomatis" ? "Ban Otomatis" : "Manual"}
              </span>
            )}
          </div>
          {filterSumber !== "semua" && (
            <button
              type="button"
              onClick={() => setFilterSumber("semua")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Tampilkan Semua Larangan
            </button>
          )}
        </div>

        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 sticky top-0">
              <tr>
                <th className="px-4 py-2.5 text-center w-12">#</th>
                <th className="px-4 py-2.5">Akun Chess.com</th>
                <th className="px-4 py-2.5">Alasan Larangan</th>
                <th className="px-4 py-2.5">Sumber Deteksi</th>
                <th className="px-4 py-2.5">Tanggal Blokir</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataTersaring.map((h, index) => {
                const isOtomatis = h.sumber === "otomatis";
                return (
                  <tr
                    key={h.username}
                    className={`transition-colors ${
                      isOtomatis
                        ? "bg-amber-50/30 hover:bg-amber-50/60"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-center text-xs font-medium text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar username={h.username} />
                        <div>
                          <a
                            href={`https://www.chess.com/member/${encodeURIComponent(
                              h.username
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-slate-900 hover:text-primary hover:underline"
                            title={`Buka profil @${h.username} di Chess.com`}
                          >
                            @{h.username}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold ${
                          h.alasan === "fair_play_violations"
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : "bg-slate-100 text-slate-800 border border-slate-200"
                        }`}
                      >
                        {h.alasan === "fair_play_violations" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                        {h.alasan === "fair_play_violations"
                          ? "Pelanggaran Fair Play"
                          : "Keputusan Pengurus"}
                      </span>
                      {h.keterangan && (
                        <p
                          className="mt-1 max-w-md text-xs text-slate-600 truncate"
                          title={h.keterangan}
                        >
                          {h.keterangan}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isOtomatis
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isOtomatis ? "🤖 Otomatis Scan" : "👤 Pengurus"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                      {formatTanggal(h.diblokirPada)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Tombol
                        anak="Cabut"
                        kecil
                        onClick={() => setTargetBuka(h.username)}
                        disabled={sibuk === `buka-${h.username}`}
                      />
                    </td>
                  </tr>
                );
              })}
              {!dataTersaring.length && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {cariAkun || filterSumber !== "semua"
                      ? "Tidak ada akun terlarang yang cocok dengan kriteria filter."
                      : "Daftar larangan komunitas masih kosong."}
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
        komunitas. Tindakan pencabutan larangan ini tetap dicatat di jejak audit.
      </Modal>
    </div>
  );
}
