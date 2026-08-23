/**
 * Halaman: Informasi Jadwal Turnamen Catur (item pertama sidebar Beranda).
 *
 * Menampilkan rangkuman dua hal yang dikelola pengurus di dashboard:
 *   - seluruh jadwal turnamen yang dipublikasikan (semua status),
 *   - pengumuman resmi terbaru.
 * Detail dan klasemen tetap di halaman turnamen masing-masing.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BagianBeranda } from "./TataLetakBeranda.jsx";
import {
  ambilTurnamenPublik,
  ambilPengumumanPublik,
  jenisTurnamen,
} from "../../lib/api/index.js";
import { parseWaktuKomunitas } from "../../lib/waktu.js";
import LencanaStatus from "../../components/LencanaStatus.jsx";

function formatTanggal(nilai) {
  if (!nilai) return "—";
  // Jam turnamen disimpan tanpa zona waktu; parse eksplisit sebagai
  // Asia/Jakarta agar tidak bergeser di zona browser pengunjung.
  const d = parseWaktuKomunitas(nilai);
  if (!d) return nilai;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Beranda() {
  const [turnamen, setTurnamen] = useState(null);
  const [jenis, setJenis] = useState({});
  const [pengumuman, setPengumuman] = useState(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let hidup = true;
    Promise.all([
      ambilTurnamenPublik(),
      jenisTurnamen()
        .then((j) => j.jenis || {})
        .catch(() => ({})),
      ambilPengumumanPublik(),
    ])
      .then(([t, j, p]) => {
        if (!hidup) return;
        setTurnamen(t);
        setJenis(j);
        setPengumuman(p);
      })
      .catch(() => {
        if (hidup) setGagal(true);
      });
    return () => {
      hidup = false;
    };
  }, []);

  return (
    <BagianBeranda id="turnamen" title="Informasi Jadwal Turnamen Catur">
      <p className="ql-align-justify">
        Berikut rangkuman jadwal seluruh turnamen yang dikelola komunitas dan
        pengumuman resmi terbaru. Rincian lengkap, peserta, dan klasemen ada di
        halaman turnamen masing-masing.
      </p>

      <h3>Rangkuman Jadwal Turnamen</h3>
      {gagal ? (
        <p>Jadwal sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.</p>
      ) : turnamen === null ? (
        <p>Memuat jadwal…</p>
      ) : turnamen.length ? (
        <div className="overflow-auto max-h-[760px]">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th className="kol-turnamen">TURNAMEN</th>
                <th className="kol-jenis">JENIS</th>
                <th className="kol-status">STATUS</th>
                <th className="kol-mulai">MULAI</th>
                <th className="kol-tutup">TUTUP DAFTAR</th>
                <th className="kol-tempo">TEMPO</th>
                <th className="kol-tempat">TEMPAT</th>
              </tr>
            </thead>
            <tbody>
              {turnamen.map((t, index) => {
                const j = jenis[t.jenis] || {};
                const href = j.slug ? `/turnamen/${j.slug}` : "";
                return (
                  <tr key={t.id} className={index % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="kol-turnamen">
                      {t.tautan ? (
                        <a
                          href={t.tautan}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-medium text-primary hover:underline"
                          title="Buka turnamen"
                        >
                          {t.nama} <span aria-hidden="true">↗</span>
                        </a>
                      ) : href ? (
                        <Link
                          to={href}
                          className="font-medium text-primary hover:underline"
                        >
                          {t.nama}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-900">{t.nama}</span>
                      )}
                    </td>
                    <td className="kol-jenis">
                      {j.label || t.jenis}
                    </td>
                    <td className="kol-status">
                      <LencanaStatus status={t.status} />
                    </td>
                    <td className="kol-mulai">
                      {formatTanggal(t.mulai)}
                    </td>
                    <td className="kol-tutup">
                      {formatTanggal(t.tutupDaftar)}
                    </td>
                    <td className="kol-tempo">{t.tempo || "—"}</td>
                    <td className="kol-tempat">{t.tempat || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Belum ada jadwal turnamen yang dipublikasikan.</p>
      )}

      <h3>Rangkuman Pengumuman</h3>
      {gagal ? (
        <p>
          Pengumuman sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.
        </p>
      ) : pengumuman === null ? (
        <p>Memuat pengumuman…</p>
      ) : pengumuman.length ? (
        <div>
          {pengumuman.map((p) => (
            <article
              key={p.id}
              className="border-b border-slate-200 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900">{p.judul}</h4>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  {p.tanggal}
                </span>
              </div>
              <p className="mb-0! mt-1 text-sm leading-6 text-slate-600">
                {p.isi}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p>Belum ada pengumuman.</p>
      )}
    </BagianBeranda>
  );
}
