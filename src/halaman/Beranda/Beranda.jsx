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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.jsx";

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
  // Tombol "Coba lagi" mengulang permintaan yang gagal tanpa memuat ulang halaman.
  const [percobaan, setPercobaan] = useState(0);
  const { bahasa, t } = useI18n();

  useEffect(() => {
    let hidup = true;
    setTurnamen(null);
    setGagal(false);
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
  }, [percobaan]);

  return (
    <BagianBeranda id="turnamen" title="Informasi Jadwal Turnamen Catur">
      <p className="font-serif text-[1rem] leading-[1.8] text-grey-600 max-w-[62ch] text-pretty">
        Berikut rangkuman jadwal seluruh turnamen yang dikelola komunitas.
        Rincian lengkap, peserta, dan klasemen ada di halaman turnamen masing-masing.
      </p>

      <h3>Rangkuman Jadwal Turnamen</h3>
      {gagal ? (
        <div>
          <p>{t("beranda.jadwalGagal")}</p>
          <button
            type="button"
            onClick={() => setPercobaan((n) => n + 1)}
            className="text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {t("common.cobaLagi")}
          </button>
        </div>
      ) : turnamen === null ? (
        <p>{t("beranda.jadwalMemuat")}</p>
      ) : turnamen.length ? (
        <div className="overflow-auto max-h-[760px]">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow>
                <TableHead>Turnamen</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Tutup Daftar</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Tempat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turnamen.map((t, index) => {
                const j = jenis[t.jenis] || {};
                const href = j.slug ? `/turnamen/${j.slug}` : "";
                return (
                  <TableRow key={t.id}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      {j.label || t.jenis}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-slate-900">
                        {(TEKS_STATUS[bahasa] || TEKS_STATUS.id)[t.status] || t.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatTanggal(t.mulai)}
                    </TableCell>
                    <TableCell>
                      {formatTanggal(t.tutupDaftar)}
                    </TableCell>
                    <TableCell>{t.tempo || "—"}</TableCell>
                    <TableCell>{t.tempat || "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p>{t("beranda.jadwalKosong")}</p>
      )}
    </BagianBeranda>
  );
}