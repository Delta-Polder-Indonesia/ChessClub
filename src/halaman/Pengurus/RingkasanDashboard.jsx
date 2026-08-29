/**
 * Kartu-kartu ringkasan + tabel ban otomatis — tampil di tab Dashboard.
 */
import { useState } from "react";
import { Kartu } from "./ui.jsx";

const LABEL_MODE_VERIFIKASI = {
  wajib: "Wajib",
  opsional: "Opsional",
  off: "Nonaktif",
};

const labelAlasan = {
  fair_play_violations: "Pelanggaran fair play",
  keputusan_pengurus: "Keputusan pengurus",
};

function formatTanggal(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function RingkasanDashboard({ ringkas, belumBaca, onBuka, hitam }) {
  const [cariBan, setCariBan] = useState("");
  const jumlahKonten =
    (ringkas.konten?.berita ?? 0) + (ringkas.konten?.pengumuman ?? 0);

  const banOtomatis = (hitam || [])
    .filter((h) => h.sumber === "otomatis")
    .sort((a, b) => new Date(b.diblokirPada || 0).getTime() - new Date(a.diblokirPada || 0).getTime());

  const banOtomatisTersaring = banOtomatis.filter((h) => {
    if (!cariBan.trim()) return true;
    const q = cariBan.toLowerCase();
    return (
      (h.username && h.username.toLowerCase().includes(q)) ||
      (h.alasan && h.alasan.toLowerCase().includes(q)) ||
      (h.keterangan && h.keterangan.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Banner Peringatan */}
      {banOtomatis.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50/90 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 font-bold text-lg">⚠️</span>
            <div>
              <p className="text-sm font-bold text-amber-950">
                Peringatan Fair Play: {banOtomatis.length} Akun Anggota Terdeteksi Terkena Ban!
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                Akun yang terdeteksi sistem Chess.com:{" "}
                <span className="font-semibold">
                  {banOtomatis.map((h) => `@${h.username}`).slice(0, 5).join(", ")}
                  {banOtomatis.length > 5 ? ` (+${banOtomatis.length - 5} lainnya)` : ""}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => onBuka("larangan", "otomatis")}
              className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs">
              Filter di Daftar Larangan →
            </button>
            <button type="button" onClick={() => onBuka("anggota", "terblokir")}
              className="rounded-full border border-amber-300 bg-white px-4 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors">
              Filter di Roster Anggota
            </button>
          </div>
        </div>
      )}

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <Kartu label="Anggota" nilai={ringkas.anggota} warna="biru" />
        <div onClick={() => onBuka("larangan", banOtomatis.length ? "otomatis" : "semua")}
          className="cursor-pointer transition-transform active:scale-95" title="Klik untuk membuka daftar larangan">
          <Kartu label="Daftar larangan" nilai={ringkas.daftarHitam}
            catatan={`${ringkas.otomatis} otomatis / ${ringkas.pengurus} pengurus`}
            warna={ringkas.daftarHitam ? "merah" : "slate"} />
        </div>
        <Kartu label="Pesan" nilai={ringkas.pesan?.total ?? 0}
          catatan={`${belumBaca} belum dibaca`} warna={belumBaca ? "merah" : "slate"} />
        <Kartu label="Turnamen" nilai={ringkas.turnamen?.total ?? 0}
          catatan={`${ringkas.turnamen?.berlangsung ?? 0} berlangsung`} />
        <Kartu label="Konten" nilai={jumlahKonten}
          catatan={`${ringkas.konten?.berita ?? 0} berita / ${ringkas.konten?.pengumuman ?? 0} pengumuman`}
          warna={jumlahKonten ? "hijau" : "slate"} />
        <Kartu label="Verifikasi"
          nilai={LABEL_MODE_VERIFIKASI[ringkas.verifikasi?.mode] ?? ringkas.verifikasi?.mode ?? "—"}
          catatan={ringkas.verifikasi?.oauthAktif ? "login Chess.com aktif" : "kode profil"}
          warna="hijau" />
      </div>

      {/* Aksi cepat */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-slate-900">Aksi cepat</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { kunci: "pesan", judul: "Pesan masuk", teks: `${belumBaca} belum dibaca`,
              ikon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
              sorot: belumBaca > 0 },
            { kunci: "turnamen", judul: "Turnamen", teks: `${ringkas.turnamen?.pendaftaran ?? 0} pendaftaran dibuka`,
              ikon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
              sorot: (ringkas.turnamen?.pendaftaran ?? 0) > 0 },
            { kunci: "larangan", filter: "otomatis", judul: "Daftar larangan",
              teks: `${banOtomatis.length} ban otomatis fair play`,
              ikon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
              sorot: banOtomatis.length > 0 },
          ].map((aksi) => (
            <button key={aksi.kunci} type="button"
              onClick={() => onBuka(aksi.kunci, aksi.filter || "semua")}
              className={`flex items-start gap-3 rounded-lg border bg-white p-4 text-left transition-colors hover:border-primary hover:bg-slate-50 ${aksi.sorot ? "border-amber-300" : "border-slate-200"}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${aksi.sorot ? "bg-amber-50 text-amber-700" : "bg-primary/10 text-primary"}`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={aksi.ikon} />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{aksi.judul}</span>
                <span className="block text-xs text-slate-500">{aksi.teks}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Tabel ban otomatis */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Pemain terblokir otomatis (Fair Play)</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {banOtomatis.length} akun
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onBuka("larangan", "otomatis")}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-primary hover:bg-slate-50">
              Buka di Panel Larangan →
            </button>
            <button type="button" onClick={() => onBuka("anggota", "terblokir")}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              Buka di Panel Anggota →
            </button>
          </div>
        </div>

        {banOtomatis.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-500">
              Belum ada anggota yang terdeteksi melakukan pelanggaran fair play.
              Jalankan pemindaian dari tab Anggota atau Turnamen untuk memeriksa.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {banOtomatis.length > 3 && (
              <div className="border-b border-slate-200 bg-slate-50 p-2.5">
                <input type="text" value={cariBan} onChange={(e) => setCariBan(e.target.value)}
                  placeholder="Cari akun terblokir…"
                  className="w-full max-w-xs rounded border border-slate-300 bg-white px-2.5 py-1 text-xs outline-none focus:border-primary" />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">Akun Chess.com</th>
                    <th className="px-3 py-2 font-semibold">Alasan</th>
                    <th className="px-3 py-2 font-semibold">Terdeteksi</th>
                    <th className="px-3 py-2 text-right font-semibold">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody>
                  {banOtomatisTersaring.map((h, i) => (
                    <tr key={h.username} className="border-t border-slate-100 hover:bg-amber-50/30 transition-colors">
                      <td className="px-3 py-2 text-slate-500 font-medium">{i + 1}</td>
                      <td className="px-3 py-2">
                        <a href={`https://www.chess.com/member/${encodeURIComponent(h.username)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="font-bold text-primary hover:underline">@{h.username}</a>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          {labelAlasan[h.alasan] || h.alasan || "—"}
                        </span>
                        {h.keterangan && (
                          <span className="mt-0.5 block max-w-md truncate text-xs text-slate-500" title={h.keterangan}>
                            {h.keterangan}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{formatTanggal(h.diblokirPada)}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => onBuka("larangan", "otomatis")}
                          className="rounded px-2 py-1 text-xs font-semibold text-primary hover:bg-slate-100">
                          Kelola di Larangan →
                        </button>
                      </td>
                    </tr>
                  ))}
                  {banOtomatisTersaring.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-500">
                        {`Tidak ada akun yang cocok dengan pencarian "${cariBan}".`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
