import { useCallback, useEffect, useMemo, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";

function unduhCsv(baris) {
  const kepala = ["timestamp", "action", "username", "ip", "status", "resourceId", "reason"];
  const isi = baris.map((e) =>
    kepala
      .map((k) => `"${String(e[k] || e.waktu || e.peristiwa || e.pengguna || "").replace(/"/g, '""')}"`)
      .join(",")
  );
  const blob = new Blob([[kepala.join(","), ...isi].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jejak-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PanelAudit({ beriTahu }) {
  const [data, setData] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [aksi, setAksi] = useState("");
  const [username, setUsername] = useState("");

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const q = new URLSearchParams();
      if (aksi.trim()) q.set("aksi", aksi.trim());
      if (username.trim()) q.set("username", username.trim());
      q.set("limit", "300");
      const jalur = `/audit?${q.toString()}`;
      const isi = await apiPengurus(jalur);
      setData(Array.isArray(isi) ? isi : []);
    } catch (e) {
      beriTahu?.(e?.message || "Gagal memuat jejak audit.", "galat");
    } finally {
      setMemuat(false);
    }
  }, [aksi, username, beriTahu]);

  useEffect(() => {
    muat();
  }, [muat]);

  const tampil = useMemo(() => data, [data]);

  return (
    <section>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="text-sm">
          <span className="block text-slate-600 mb-1">Aksi</span>
          <input
            value={aksi}
            onChange={(e) => setAksi(e.target.value)}
            placeholder="login, block, …"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-slate-600 mb-1">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={muat}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white"
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
      </div>
      {memuat ? (
        <p className="text-sm text-slate-500">Memuat jejak audit…</p>
      ) : !tampil.length ? (
        <p className="text-sm text-slate-500">Belum ada jejak (90 hari terakhir).</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Waktu</th>
                <th className="px-3 py-2">Aksi</th>
                <th className="px-3 py-2">Siapa</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Rincian</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((e, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                    {String(e.timestamp || e.waktu || "").replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="px-3 py-2 font-medium">{e.action || e.peristiwa}</td>
                  <td className="px-3 py-2">{e.username || e.pengguna || "—"}</td>
                  <td className="px-3 py-2">{e.status || "—"}</td>
                  <td className="px-3 py-2 text-slate-500">
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
