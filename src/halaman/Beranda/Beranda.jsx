/**
 * Halaman: Informasi Jadwal Turnamen Catur (item pertama sidebar Beranda).
 *
 * Menampilkan seluruh jadwal turnamen yang dipublikasikan (semua status).
 * Detail dan klasemen tetap di halaman turnamen masing-masing. Rangkuman
 * pengumuman kini dipindah ke halaman terpisah (RangkumanPengumuman).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BagianBeranda } from "./TataLetakBeranda.jsx";
import {
  ambilTurnamenPublik,
  jenisTurnamen,
} from "../../lib/api/index.js";
import { useI18n } from "../../lib/i18n.jsx";
import { parseWaktuKomunitas } from "../../lib/waktu.js";
import { TEKS_STATUS } from "../../components/LencanaStatus.jsx";

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
  const [gagal, setGagal] = useState(false);
  const { bahasa } = useI18n();

  useEffect(() => {
    let hidup = true;
    Promise.all([
      ambilTurnamenPublik(),
      jenisTurnamen()
        .then((j) => j.jenis || {})
        .catch(() => ({})),
    ])
      .then(([t, j]) => {
        if (!hidup) return;
        setTurnamen(t);
        setJenis(j);
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
        Berikut rangkuman jadwal seluruh turnamen yang dikelola komunitas.
        Rincian lengkap, peserta, dan klasemen ada di halaman turnamen masing-masing.
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
                      <span className="text-xs font-semibold text-slate-900">
                        {(TEKS_STATUS[bahasa] || TEKS_STATUS.id)[t.status] || t.status}
                      </span>
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
    </BagianBeranda>
  );
}