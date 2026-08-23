import { useEffect, useState } from "react";
import { ambilTurnamenPublik } from "../lib/api/index.js";
import { useI18n } from "../lib/i18n.jsx";
import { parseWaktuKomunitas } from "../lib/waktu.js";

/**
 * Tabel "Hasil Turnamen" untuk halaman publik /turnamen.
 *
 * Data diambil dari endpoint turnamen publik yang sama dengan halaman
 * jadwal, lalu disaring: hanya turnamen berstatus selesai (atau yang
 * sudah punya nama juara) yang tampil. Nama juara diisi pengurus dari
 * dashboard (tab "Juara Turnamen").
 */

const KATA = {
  id: {
    memuat: "Memuat hasil turnamen…",
    kosong:
      "Belum ada hasil turnamen yang dicatat. Arsip akan muncul di sini setelah sebuah rangkaian selesai.",
    gagal: "Hasil turnamen sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.",
    nomor: "#",
    nama: "Nama Turnamen",
    kategori: "Kategori",
    juara: "Juara",
    mulai: "Tanggal Mulai",
    selesai: "Tanggal Berakhir",
    belumAda: "belum ditetapkan",
  },
  en: {
    memuat: "Loading tournament results…",
    kosong:
      "No tournament results recorded yet. Past editions will appear here once a series is completed.",
    gagal: "Tournament results cannot be loaded right now. Please try again shortly.",
    nomor: "#",
    nama: "Tournament Name",
    kategori: "Category",
    juara: "Champion",
    mulai: "Start Date",
    selesai: "End Date",
    belumAda: "not decided yet",
  },
};

const LABEL_JENIS = {
  id: {
    bulanan: "Turnamen Bulanan",
    musiman: "Liga Musiman",
    terbuka: "Turnamen Terbuka",
    "antar-komunitas": "Liga Antar Komunitas",
  },
  en: {
    bulanan: "Monthly Tournament",
    musiman: "Seasonal League",
    terbuka: "Open Tournament",
    "antar-komunitas": "Inter-community League",
  },
};

function tanggal(nilai, bahasa) {
  if (!nilai) return "—";
  // Jam turnamen disimpan tanpa zona waktu; parse eksplisit sebagai
  // Asia/Jakarta agar tidak bergeser di zona browser pengunjung.
  const d = parseWaktuKomunitas(nilai);
  if (!d) return nilai;
  return d.toLocaleDateString(bahasa === "en" ? "en-GB" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function TabelHasilTurnamen() {
  const { bahasa } = useI18n();
  const k = KATA[bahasa] || KATA.id;
  const [daftar, setDaftar] = useState(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let hidup = true;
    ambilTurnamenPublik()
      .then((semua) => {
        if (!hidup) return;
        const arsip = semua
          .filter((t) => t.status === "selesai" || t.juara)
          .filter((t) => t.status !== "batal")
          .sort(
            (a, b) =>
              String(b.selesai || b.mulai || "").localeCompare(
                String(a.selesai || a.mulai || "")
              )
          );
        setDaftar(arsip);
      })
      .catch(() => hidup && setGagal(true));
    return () => {
      hidup = false;
    };
  }, []);

  if (gagal)
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        {k.gagal}
      </p>
    );

  if (daftar === null)
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        {k.memuat}
      </p>
    );

  if (daftar.length === 0)
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        {k.kosong}
      </p>
    );

  return (
    <div className="overflow-auto">
      <table className="tabel-kci tabel-peringkat">
        <thead>
          <tr>
            <th>{k.nomor}</th>
            <th>{k.nama}</th>
            <th>{k.kategori}</th>
            <th>{k.juara}</th>
            <th>{k.mulai}</th>
            <th>{k.selesai}</th>
          </tr>
        </thead>
        <tbody>
          {daftar.map((t, index) => (
            <tr key={t.id} className={index % 2 === 1 ? "bg-slate-50" : ""}>
              <td>{index + 1}</td>
              <td>{t.nama}</td>
              <td>{(LABEL_JENIS[bahasa] || LABEL_JENIS.id)[t.jenis] || t.jenis}</td>
              <td>
                {t.juara ? (
                  <a
                    href={`https://www.chess.com/member/${encodeURIComponent(
                      t.juara.trim()
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.juara}
                  </a>
                ) : (
                  <span className="text-slate-400">{k.belumAda}</span>
                )}
              </td>
              <td>{tanggal(t.mulai, bahasa)}</td>
              <td>{tanggal(t.selesai, bahasa)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
