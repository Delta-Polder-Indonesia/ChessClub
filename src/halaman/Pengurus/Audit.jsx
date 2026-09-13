import { useCallback, useEffect, useMemo, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { KotakGalatMuat } from "./ui.jsx";

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function unduhCsv(baris) {
  const kepala = ["timestamp", "action", "username", "ip", "status", "resourceId", "reason"];
  // Nilai per kolom dengan fallback yang RELEVAN untuk kolom itu saja.
  // (Sebelumnya semua kolom memakai rantai `|| e.waktu || e.peristiwa ||
  // e.pengguna` sehingga kolom kosong terisi timestamp — CSV rusak.)
  const nilai = (e, k) => {
    if (k === "timestamp") return e.timestamp || e.waktu || "";
    if (k === "action") return e.action || e.peristiwa || "";
    if (k === "username") return e.username || e.pengguna || "";
    return e[k] ?? "";
  };
  const isi = baris.map((e) =>
    kepala
      .map((k) => `"${String(nilai(e, k)).replace(/"/g, '""')}"`)
      .join(",")
  );
  const blob = new Blob([[kepala.join(","), ...isi].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jejak-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  // Tunda pencabutan URL — revoke sinkron tepat setelah click() bisa
  // membatalkan unduhan di sebagian browser (mis. Firefox).
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export default function PanelAudit({ beriTahu }) {
  const [data, setData] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(false);
  const [aksi, setAksi] = useState("");
  const [username, setUsername] = useState("");
  // Nilai filter yang BENAR-BENAR dikirim ke server — hanya berubah saat
  // tombol "Saring" ditekan (atau Enter). Sebelumnya input `aksi`/`username`
  // menjadi dependensi useCallback+useEffect sehingga setiap ketikan
  // menembak GET /audit (boros + berisiko kena rate-limit 429).
  const [filterKirim, setFilterKirim] = useState({ aksi: "", username: "" });
  const [hari, setHari] = useState("");
  const [bulan, setBulan] = useState("");

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat(false);
    try {
      const q = new URLSearchParams();
      if (filterKirim.aksi) q.set("aksi", filterKirim.aksi);
      if (filterKirim.username) q.set("username", filterKirim.username);
      q.set("limit", "300");
      const jalur = `/audit?${q.toString()}`;
      const isi = await apiPengurus(jalur);
      setData(Array.isArray(isi) ? isi : []);
    } catch (e) {
      beriTahu?.(e?.message || "Gagal memuat jejak audit.", "galat");
      setGalat(true);
    } finally {
      setMemuat(false);
    }
  }, [filterKirim, beriTahu]);

  useEffect(() => {
    muat();
  }, [muat]);

  const terapkanFilter = (e) => {
    e?.preventDefault?.();
    const berikutnya = { aksi: aksi.trim(), username: username.trim() };
    setFilterKirim((s) =>
      s.aksi === berikutnya.aksi && s.username === berikutnya.username ? s : berikutnya
    );
  };

  const tampil = useMemo(() => {
    return data.filter((e) => {
      const ts = e.timestamp || e.waktu || "";
      if (!ts) return true;
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return true;
      if (hari && d.getDate() !== Number(hari)) return false;
      if (bulan && d.getMonth() + 1 !== Number(bulan)) return false;
      return true;
    });
  }, [data, hari, bulan]);

  return (
    <section>
      <form onSubmit={terapkanFilter} className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Aksi:
          <input
            value={aksi}
            onChange={(e) => setAksi(e.target.value)}
            placeholder="login, block, …"
            className="w-44 border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Username:
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="w-44 border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Hari:
          <select
            value={hari}
            onChange={(e) => setHari(e.target.value)}
            className="border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-sm outline-none focus:border-primary"
          >
            <option value="">Semua</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Bulan:
          <select
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-sm outline-none focus:border-primary"
          >
            <option value="">Semua</option>
            {BULAN.map((b, i) => (
              <option key={b} value={i + 1}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white"
        >
          Saring
        </button>
        <button
          type="button"
          onClick={() => unduhCsv(tampil)}
          className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-bold"
          disabled={!tampil.length}
        >
          Unduh CSV
        </button>
      </form>
      {memuat ? (
        <p className="text-sm text-slate-500">Memuat jejak audit…</p>
      ) : galat ? (
        <KotakGalatMuat
          pesan="Jejak audit gagal dimuat. Periksa koneksi lalu coba lagi."
          onCobaLagi={muat}
        />
      ) : !tampil.length ? (
        <p className="text-sm text-slate-500">Belum ada jejak (90 hari terakhir).</p>
      ) : (
        <div className="overflow-auto">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Aksi</th>
                <th>Siapa</th>
                <th>Status</th>
                <th>Rincian</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((e, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap text-slate-600">
                    {String(e.timestamp || e.waktu || "").replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="font-medium">{e.action || e.peristiwa}</td>
                  <td>{e.username || e.pengguna || "—"}</td>
                  <td>{e.status || "—"}</td>
                  <td className="text-slate-500">
                    {[e.resourceId, e.reason, e.jalur].filter(Boolean).join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
