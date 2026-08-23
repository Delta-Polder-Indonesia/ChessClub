import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiPengurus,
  tokenPengurus,
  adminPengguna,
  ambilDaftarAnggota,
  ambilDaftarHitam,
} from "../../lib/api/index.js";
import PanelTurnamen from "./PanelTurnamen.jsx";
import { PanelBerita, PanelPengumuman } from "./PanelKonten.jsx";
import PanelAnggota from "./Anggota.jsx";
import PanelLarangan from "./Larangan.jsx";
import PanelPesan from "./Pesan.jsx";
import { Tombol, Kartu } from "./ui.jsx";

/* ========================================================
   DATA NAVIGASI SIDEBAR
   ======================================================== */

const MENU_SIDEBAR = [
  {
    kunci: "dashboard",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    kunci: "anggota",
    label: "Anggota",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    kunci: "larangan",
    label: "Daftar Larangan",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  },
  {
    kunci: "pesan",
    label: "Pesan Masuk",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    kunci: "turnamen",
    label: "Turnamen",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  {
    kunci: "berita",
    label: "Berita Komunitas",
    icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
  },
  {
    kunci: "pengumuman",
    label: "Pengumuman",
    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  },
];

/* ========================================================
   KOMPONEN: Sidebar
   ========================================================
   Icon TIDAK PERNAH bergerak. Yang beranimasi hanya:
     - width sidebar        → transition-[width]
     - label max-width      → 0 ↔ 180px
     - label opacity        → 0 ↔ 1
     - label margin-left    → 0 ↔ 12px

   Tombol selalu pakai pl-4 (padding-left 16px).
   Icon selalu di pixel ke-16 dari kiri sidebar.
   ======================================================== */

function Sidebar({ tab, setTab, terbuka }) {
  return (
    <aside
      className={`
        bg-white border-r border-slate-200 min-h-screen
        flex flex-col shrink-0 overflow-hidden
        will-change-[width]
        transition-[width] duration-300
        ease-[cubic-bezier(0.22,1,0.36,1)]
        ${terbuka ? "w-64" : "w-[52px]"}
      `}
    >
      <nav className="flex-1 py-3 space-y-1">
        {MENU_SIDEBAR.map(({ kunci, label, icon }) => {
          const aktif = tab === kunci;
          return (
            <button
              key={kunci}
              type="button"
              onClick={() => setTab(kunci)}
              title={terbuka ? undefined : label}
              className={`
                w-full text-sm font-medium
                flex items-center
                py-2.5 pl-4 pr-3
                transition-colors duration-150
                ${aktif
                  ? "bg-primary text-white"
                  : "text-slate-700 hover:bg-slate-100"
                }
              `}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={icon}
                />
              </svg>

              <span
                className={`
                  overflow-hidden whitespace-nowrap
                  transform-gpu
                  transition-[max-width,opacity,margin]
                  duration-300
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${terbuka
                    ? "ml-3 max-w-[180px] opacity-100"
                    : "ml-0 max-w-0 opacity-0"
                  }
                `}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/* ========================================================
   KOMPONEN: Dropdown Notifikasi
   ========================================================
   Berisi pesan-pesan terbaru dari form "Hubungi Kami".
   Tiap item menampilkan nama pengirim, subjek, cuplikan isi,
   dan waktu relatif. Klik item menandai pesan dibaca lalu
   membukanya di panel Pesan.
   ======================================================== */

function waktuRelatif(iso) {
  if (!iso) return "";
  const sekarang = Date.now();
  const waktu = new Date(iso).getTime();
  if (Number.isNaN(waktu)) return "";
  const detik = Math.max(0, Math.round((sekarang - waktu) / 1000));
  if (detik < 60) return "baru saja";
  const menit = Math.round(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function cuplikan(teks, maks = 80) {
  const s = String(teks || "").replace(/\s+/g, " ").trim();
  return s.length > maks ? `${s.slice(0, maks - 1)}…` : s;
}

function DropdownNotifikasi({
  terbuka,
  pesan,
  memuat,
  onBuka,
  onBukaPesan,
  onTandaiSemua,
}) {
  return (
    <div
      className={`
        absolute right-0 mt-2 w-80 sm:w-96 z-50
        bg-white rounded-lg shadow-lg border border-slate-200
        origin-top-right transform-gpu
        transition-[opacity,transform] duration-200
        ease-[cubic-bezier(0.22,1,0.36,1)]
        ${terbuka
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }
      `}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Notifikasi</p>
          <p className="text-xs text-slate-500">
            Pesan masuk dari form Hubungi Kami
          </p>
        </div>
        {pesan.some((p) => !p.dibaca) && (
          <button
            type="button"
            onClick={onTandaiSemua}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="max-h-[26rem] overflow-y-auto">
        {memuat && pesan.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Memuat…
          </p>
        ) : pesan.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <svg
              className="mx-auto h-9 w-9 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.6}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-slate-500">Belum ada pesan masuk.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pesan.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onBukaPesan(p)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    p.dibaca ? "bg-white" : "bg-blue-50/40"
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {String(p.nama || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          p.dibaca
                            ? "font-medium text-slate-700"
                            : "font-bold text-slate-900"
                        }`}
                      >
                        {p.nama}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {waktuRelatif(p.tanggal)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-600">
                      {p.subjek || "(tanpa subjek)"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {cuplikan(p.pesan)}
                    </p>
                  </div>
                  {!p.dibaca && (
                    <span
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                      aria-label="belum dibaca"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 px-2 py-2">
        <button
          type="button"
          onClick={onBuka}
          className="w-full rounded-md px-3 py-2 text-center text-xs font-semibold text-primary hover:bg-blue-50"
        >
          Lihat semua pesan →
        </button>
      </div>
    </div>
  );
}

/* ========================================================
   KOMPONEN: Dropdown Profil
   ========================================================
   Selalu di-render (tidak di-unmount).
   Pakai pointer-events-none saat tertutup agar klik
   menembus ke bawah. Animasi: opacity + scale + translateY.
   ======================================================== */

function ItemDropdown({
  icon,
  label,
  onClick,
  disabled = false,
  bahaya = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left px-4 py-2 text-sm
        flex items-center gap-3
        transition-colors duration-100
        disabled:opacity-40
        ${bahaya
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-50"
        }
      `}
    >
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={icon}
        />
      </svg>
      {label}
    </button>
  );
}

function DropdownProfil({
  terbuka,
  pengguna,
  onTutup,
  onMuatUlang,
  onKeluar,
  memuat,
}) {
  return (
    <div
      className={`
        absolute right-0 mt-2 w-56 z-50
        bg-white rounded-lg shadow-lg border border-slate-200 py-2
        origin-top-right transform-gpu
        transition-[opacity,transform] duration-200
        ease-[cubic-bezier(0.22,1,0.36,1)]
        ${terbuka
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }
      `}
    >
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Masuk sebagai
        </p>
        <p className="truncate text-sm font-semibold text-slate-900">
          {pengguna ? (
            <a
              href={`https://www.chess.com/member/${encodeURIComponent(pengguna)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {pengguna}
            </a>
          ) : (
            "Pengurus"
          )}
        </p>
      </div>

      <ItemDropdown
        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        label="Muat ulang data"
        onClick={() => {
          onTutup();
          onMuatUlang();
        }}
        disabled={memuat}
      />
      <ItemDropdown
        icon="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        label="Keluar"
        onClick={() => {
          onTutup();
          onKeluar();
        }}
        bahaya
      />
    </div>
  );
}

/* ========================================================
   KOMPONEN: Ringkasan Dashboard
   ========================================================
   Kartu-kartu ikhtisar yang HANYA tampil di tab Dashboard.
   Tab lain (Anggota, Pesan, Turnamen, dst.) tidak memuatnya
   supaya ruang kerja tidak berkurang.
   ======================================================== */

const LABEL_MODE_VERIFIKASI = {
  wajib: "Wajib",
  opsional: "Opsional",
  off: "Nonaktif",
};

function RingkasanDashboard({ ringkas, belumBaca, onBuka, hitam }) {
  const jumlahKonten =
    (ringkas.konten?.berita ?? 0) + (ringkas.konten?.pengumuman ?? 0);

  // Daftar pemain yang kena ban OTOMATis (pemindaian fair play
  // ke Chess.com). Diurutkan dari yang terbaru.
  const banOtomatis = (hitam || [])
    .filter((h) => h.sumber === "otomatis")
    .sort(
      (a, b) =>
        new Date(b.diblokirPada || 0).getTime() -
        new Date(a.diblokirPada || 0).getTime()
    );

  const labelAlasan = {
    fair_play_violations: "Pelanggaran fair play",
    keputusan_pengurus: "Keputusan pengurus",
  };

  const formatTanggal = (iso) => {
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
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kartu label="Anggota" nilai={ringkas.anggota} warna="biru" />
        <Kartu
          label="Daftar larangan"
          nilai={ringkas.daftarHitam}
          catatan={`${ringkas.otomatis} otomatis / ${ringkas.pengurus} pengurus`}
          warna={ringkas.daftarHitam ? "merah" : "slate"}
        />
        <Kartu
          label="Pesan"
          nilai={ringkas.pesan?.total ?? 0}
          catatan={`${belumBaca} belum dibaca`}
          warna={belumBaca ? "merah" : "slate"}
        />
        <Kartu
          label="Turnamen"
          nilai={ringkas.turnamen?.total ?? 0}
          catatan={`${ringkas.turnamen?.berlangsung ?? 0} berlangsung`}
        />
        <Kartu
          label="Konten"
          nilai={jumlahKonten}
          catatan={`${ringkas.konten?.berita ?? 0} berita / ${ringkas.konten?.pengumuman ?? 0} pengumuman`}
          warna={jumlahKonten ? "hijau" : "slate"}
        />
        <Kartu
          label="Verifikasi"
          nilai={
            LABEL_MODE_VERIFIKASI[ringkas.verifikasi?.mode] ??
            ringkas.verifikasi?.mode ??
            "—"
          }
          catatan={
            ringkas.verifikasi?.oauthAktif
              ? "login Chess.com aktif"
              : "kode profil"
          }
          warna="hijau"
        />
      </div>

      {/* Aksi cepat */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-slate-900">Aksi cepat</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              kunci: "pesan",
              judul: "Pesan masuk",
              teks: `${belumBaca} belum dibaca`,
              ikon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
              sorot: belumBaca > 0,
            },
            {
              kunci: "turnamen",
              judul: "Turnamen",
              teks: `${ringkas.turnamen?.pendaftaran ?? 0} pendaftaran dibuka`,
              ikon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
              sorot: (ringkas.turnamen?.pendaftaran ?? 0) > 0,
            },
            {
              kunci: "berita",
              judul: "Berita komunitas",
              teks: `${ringkas.konten?.berita ?? 0} berita tersimpan`,
              ikon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2",
            },
            {
              kunci: "anggota",
              judul: "Anggota",
              teks: `${ringkas.anggotaTerdata ?? 0} data tercatat`,
              ikon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
            },
          ].map((aksi) => (
            <button
              key={aksi.kunci}
              type="button"
              onClick={() => onBuka(aksi.kunci)}
              className={`flex items-start gap-3 rounded-lg border bg-white p-4 text-left transition-colors hover:border-primary hover:bg-slate-50 ${
                aksi.sorot ? "border-amber-300" : "border-slate-200"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  aksi.sorot
                    ? "bg-amber-50 text-amber-700"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={aksi.ikon}
                  />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">
                  {aksi.judul}
                </span>
                <span className="block text-xs text-slate-500">{aksi.teks}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Daftar pemain yang kena ban otomatis (fair play) */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            Pemain terblokir otomatis
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {banOtomatis.length} akun terdeteksi
            </span>
            <button
              type="button"
              onClick={() => onBuka("larangan")}
              className="font-semibold text-primary hover:underline"
            >
              Kelola daftar larangan →
            </button>
          </div>
        </div>

        {banOtomatis.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-500">
              Belum ada anggota yang terdeteksi melakukan pelanggaran fair
              play. Jalankan pemindaian dari tab Anggota atau Turnamen untuk
              memeriksa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">Akun Chess.com</th>
                  <th className="px-3 py-2 font-semibold">Alasan</th>
                  <th className="px-3 py-2 font-semibold">Terdeteksi</th>
                </tr>
              </thead>
              <tbody>
                {banOtomatis.map((h, i) => (
                  <tr key={h.username} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-500 font-medium">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={`https://www.chess.com/member/${encodeURIComponent(
                          h.username
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline"
                      >
                        {h.username}
                      </a>
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
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {formatTanggal(h.diblokirPada)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ========================================================
   HALAMAN UTAMA: Dashboard
   ======================================================== */

export default function Dashboard() {
  const navigate = useNavigate();
  const [pengguna] = useState(() => adminPengguna.ambil());
  const [tab, setTab] = useState("dashboard");
  const [ringkas, setRingkas] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [hitam, setHitam] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [kabar, setKabar] = useState(null);
  const [menuProfile, setMenuProfile] = useState(false);
  const [sidebarTerbuka, setSidebarTerbuka] = useState(true);
  const [menuNotif, setMenuNotif] = useState(false);
  const [notif, setNotif] = useState([]);
  const [memuatNotif, setMemuatNotif] = useState(false);
  const [bukaPesanId, setBukaPesanId] = useState(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const belumDibacaSebelumnya = useRef(0);

  /* Timer notifikasi */
  const jamKabar = useRef(null);
  const beriTahu = useCallback((teks, jenis = "sukses") => {
    setKabar({ teks, jenis });
    if (jamKabar.current) clearTimeout(jamKabar.current);
    jamKabar.current = setTimeout(() => setKabar(null), 8000);
  }, []);

  useEffect(() => () => clearTimeout(jamKabar.current), []);

  /**
   * Tangani galat 401 dari panel anak: token ditolak (dicabut/diganti),
   * jangan biarkan pengguna mengira dashboard masih aktif — bersihkan
   * token dan muat ulang halaman. ProtectedRoute akan menampilkan
   * Gerbang kembali setelah verifikasi ulang gagal.
   */
  const tanganiGalat = useCallback(
    (e) => {
      if (e?.status === 401) {
        tokenPengurus.hapus();
        adminPengguna.hapus();
        navigate(0);
        return;
      }
      beriTahu(e?.message || "Terjadi kesalahan.", "galat");
    },
    [beriTahu, navigate]
  );

  /* Muat data — dipanggil saat pertama masuk dan lewat "Muat ulang data". */
  const muatUlang = useCallback(async () => {
    setMemuat(true);
    try {
      const [r, a, h] = await Promise.all([
        apiPengurus("/ringkasan"),
        ambilDaftarAnggota(),
        ambilDaftarHitam(),
      ]);
      setRingkas(r);
      setAnggota(a);
      setHitam(h);
    } catch (e) {
      tanganiGalat(e);
    } finally {
      setMemuat(false);
    }
  }, [tanganiGalat]);

  /**
   * Segarkan kartu ringkasan SAJA — dipakai oleh panel ringan (Pesan,
   * Konten) yang perubahannya tidak memengaruhi daftar anggota maupun
   * daftar larangan. Menghindari memanggil endpoint roster Chess.com
   * yang mahal setiap kali sebuah pesan ditandai dibaca.
   */
  const segarkanRingkasan = useCallback(async () => {
    try {
      const r = await apiPengurus("/ringkasan");
      setRingkas(r);
    } catch (e) {
      tanganiGalat(e);
    }
  }, [tanganiGalat]);

  /**
   * Ambil daftar pesan untuk dropdown lonceng (10 terbaru). Dipanggil
   * saat dropdown dibuka dan setiap 30 detik bila tab dashboard aktif.
   */
  const muatNotif = useCallback(async () => {
    setMemuatNotif(true);
    try {
      const data = await apiPengurus("/pesan");
      const terbaru = data.slice(0, 10);
      setNotif(terbaru);
      const belum = (data || []).filter((p) => !p.dibaca).length;
      // Tandai judul tab saat ada pesan belum dibaca.
      document.title =
        belum > 0
          ? `(${belum}) Dashboard Pengurus | Komunitas Catur Indonesia`
          : "Dashboard Pengurus | Komunitas Catur Indonesia";

      // Beri umpan balik saat pesan BARU tiba (jumlah belum dibaca naik).
      if (
        belumDibacaSebelumnya.current > 0 &&
        belum > belumDibacaSebelumnya.current
      ) {
        beriTahu(
          `${belum - belumDibacaSebelumnya.current} pesan baru masuk.`,
          "peringatan"
        );
      }
      belumDibacaSebelumnya.current = belum;
      setRingkas((r) =>
        r ? { ...r, pesan: { ...r.pesan, total: data.length, belumDibaca: belum } } : r
      );
    } catch (e) {
      // Bila gagal (mis. koneksi terputus), jangan tampilkan galat ke
      // pengguna — polling akan mencoba lagi.
      if (e?.status === 401) tanganiGalat(e);
    } finally {
      setMemuatNotif(false);
    }
  }, [beriTahu, tanganiGalat]);

  useEffect(() => {
    document.title = "Dashboard Pengurus | Komunitas Catur Indonesia";
    muatUlang();
    // polling ringan untuk notifikasi pesan masuk — dijeda saat tab
    // tersembunyi dan dilanjutkan (dengan muat segera) saat kembali.
    muatNotif();
    let id = setInterval(muatNotif, 30_000);
    const onVisibilitas = () => {
      if (document.visibilityState === "hidden") {
        if (id) clearInterval(id);
        id = null;
      } else if (!id) {
        muatNotif();
        id = setInterval(muatNotif, 30_000);
      }
    };
    document.addEventListener("visibilitychange", onVisibilitas);
    return () => {
      if (id) clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilitas);
      document.title = "Dashboard Pengurus | Komunitas Catur Indonesia";
    };
  }, [muatUlang, muatNotif]);

  // Muat ulang notifikasi setiap kali dropdown dibuka.
  useEffect(() => {
    if (menuNotif) muatNotif();
  }, [menuNotif, muatNotif]);

  const bukaPesan = useCallback(
    (p) => {
      setMenuNotif(false);
      setTab("pesan");
      setBukaPesanId(p.id);
      // Tandai dibaca di server agar badge langsung turun.
      if (!p.dibaca) {
        apiPengurus(`/pesan/${p.id}/baca`, { metode: "POST" })
          .then(muatNotif)
          .catch(() => {
            /* abaikan — panel pesan akan mencoba lagi */
          });
      }
    },
    [muatNotif]
  );

  const tandaiSemuaDibaca = useCallback(async () => {
    try {
      await apiPengurus("/pesan/semua-baca", { metode: "POST" });
      await muatNotif();
      beriTahu("Semua pesan ditandai dibaca.", "sukses");
    } catch (e) {
      tanganiGalat(e);
    }
  }, [muatNotif, beriTahu, tanganiGalat]);

  /**
   * Callback untuk PanelPesan: saat pesan di dalam panel dibaca/dihapus,
   * daftar notifikasi di header ikut disegarkan.
   */
  const onPesanBerubah = useCallback(async () => {
    await Promise.all([segarkanRingkasan(), muatNotif()]);
  }, [segarkanRingkasan, muatNotif]);

  /* Tutup dropdown saat klik di luar */
  useEffect(() => {
    if (!menuProfile && !menuNotif) return;
    const tutup = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setMenuProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setMenuNotif(false);
      }
    };
    document.addEventListener("mousedown", tutup);
    return () => document.removeEventListener("mousedown", tutup);
  }, [menuProfile, menuNotif]);

  const keluar = () => {
    tokenPengurus.hapus();
    adminPengguna.hapus();
    navigate(0);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-6 py-0">
        <div className="flex items-center justify-between">
          {/* Kiri: judul + toggle sidebar */}
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900">
              Dashboard Pengurus
            </h1>
            <button
              onClick={() => setSidebarTerbuka((s) => !s)}
              className="p-2 rounded-md hover:bg-slate-100 transition-colors duration-150"
              title={sidebarTerbuka ? "Tutup sidebar" : "Buka sidebar"}
            >
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Kanan: lonceng + profil */}
          <div className="flex items-center gap-2">
            {/* Lonceng notifikasi */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setMenuProfile(false);
                  setMenuNotif((v) => !v);
                }}
                className="relative p-2 rounded-md hover:bg-slate-100 transition-colors duration-150"
                title="Notifikasi pesan masuk"
                aria-haspopup="true"
                aria-expanded={menuNotif}
              >
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {ringkas?.pesan?.belumDibaca > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {ringkas.pesan.belumDibaca > 99
                      ? "99+"
                      : ringkas.pesan.belumDibaca}
                  </span>
                )}
              </button>

              <DropdownNotifikasi
                terbuka={menuNotif}
                pesan={notif}
                memuat={memuatNotif}
                onBuka={() => {
                  setMenuNotif(false);
                  setTab("pesan");
                }}
                onBukaPesan={bukaPesan}
                onTandaiSemua={tandaiSemuaDibaca}
              />
            </div>

            {/* Profil + dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setMenuProfile((v) => !v)}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors duration-150 focus:outline-none"
                title={pengguna ? `Masuk sebagai ${pengguna}` : ""}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 leading-tight">
                    {pengguna || "Pengurus"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Pengurus komunitas
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shrink-0 uppercase">
                  {(pengguna || "?").charAt(0)}
                </div>
              </button>

              <DropdownProfil
                terbuka={menuProfile}
                pengguna={pengguna}
                onTutup={() => setMenuProfile(false)}
                onMuatUlang={muatUlang}
                onKeluar={keluar}
                memuat={memuat}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex">
        <Sidebar tab={tab} setTab={setTab} terbuka={sidebarTerbuka} />

        {/* Konten utama */}
        <main className="flex-1 p-6 md:p-8 min-w-0 overflow-x-hidden">
          {/* Toast */}
          {kabar && (
            <p
              className={`mb-4 rounded-md border px-4 py-2.5 text-sm ${
                kabar.jenis === "galat"
                  ? "border-red-300 bg-red-50 text-red-800"
                  : kabar.jenis === "peringatan"
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-emerald-300 bg-emerald-50 text-emerald-800"
              }`}
            >
              {kabar.teks}
            </p>
          )}

          {/* Kartu ringkasan HANYA di tab Dashboard. */}
          {tab === "dashboard" &&
            (memuat && !ringkas ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Memuat…
              </p>
            ) : (
              ringkas && (
                <RingkasanDashboard
                  ringkas={ringkas}
                  belumBaca={ringkas.pesan?.belumDibaca ?? 0}
                  onBuka={setTab}
                  hitam={hitam}
                />
              )
            ))}

          {/* Panel konten */}
          {tab === "dashboard" ? null : tab === "anggota" ? (
            <PanelAnggota
              anggota={anggota}
              muatUlang={muatUlang}
              beriTahu={beriTahu}
            />
          ) : tab === "larangan" ? (
            <PanelLarangan
              hitam={hitam}
              muatUlang={muatUlang}
              beriTahu={beriTahu}
            />
          ) : tab === "pesan" ? (
            <PanelPesan
              beriTahu={beriTahu}
              muatUlang={onPesanBerubah}
              pesanTerpilihId={bukaPesanId}
              onPesanTerbuka={() => setBukaPesanId(null)}
            />
          ) : tab === "berita" ? (
            <PanelBerita beriTahu={beriTahu} muatUlang={segarkanRingkasan} />
          ) : tab === "pengumuman" ? (
            <PanelPengumuman beriTahu={beriTahu} muatUlang={segarkanRingkasan} />
          ) : (
            <PanelTurnamen
              beriTahu={beriTahu}
              anggota={anggota}
              muatUlang={muatUlang}
            />
          )}
        </main>
      </div>
    </div>
  );
}