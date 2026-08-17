import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiPengurus,
  tokenPengurus,
  ambilDaftarAnggota,
  ambilDaftarHitam,
} from "../../lib/chessAnggota.js";
import PanelTurnamen from "./PanelTurnamen.jsx";
import { PanelBerita, PanelPengumuman } from "./PanelKonten.jsx";
import Gerbang from "./Gerbang.jsx";
import PanelAnggota from "./Anggota.jsx";
import PanelLarangan from "./Larangan.jsx";
import PanelPesan from "./Pesan.jsx";
import { Tombol, Kartu } from "./ui.jsx";

/* ========================================================
   DATA NAVIGASI SIDEBAR
   ======================================================== */

const MENU_SIDEBAR = [
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

function DropdownProfil({ terbuka, onTutup, onMuatUlang, onKeluar, memuat }) {
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
        <p className="text-sm font-semibold text-slate-900">Admin Pengurus</p>
        <p className="text-xs text-slate-500">admin@komunitascatur.or.id</p>
      </div>

      <ItemDropdown
        icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        label="Profil"
        onClick={onTutup}
      />
      <ItemDropdown
        icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
        label="Pengaturan"
        onClick={onTutup}
      />

      <div className="border-t border-slate-100 my-1" />

      <ItemDropdown
        icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        label="Muat ulang"
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
   HALAMAN UTAMA: Dashboard
   ======================================================== */

export default function Dashboard() {
  const [masuk, setMasuk] = useState(Boolean(tokenPengurus.ambil()));
  const [tab, setTab] = useState("anggota");
  const [ringkas, setRingkas] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [hitam, setHitam] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [kabar, setKabar] = useState(null);
  const [menuProfile, setMenuProfile] = useState(false);
  const [sidebarTerbuka, setSidebarTerbuka] = useState(true);
  const profileRef = useRef(null);

  /* Timer notifikasi */
  const jamKabar = useRef(null);
  const beriTahu = useCallback((teks, jenis = "sukses") => {
    setKabar({ teks, jenis });
    if (jamKabar.current) clearTimeout(jamKabar.current);
    jamKabar.current = setTimeout(() => setKabar(null), 8000);
  }, []);

  useEffect(() => () => clearTimeout(jamKabar.current), []);

  /* Muat data */
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
      if (e.status === 401) {
        tokenPengurus.hapus();
        setMasuk(false);
      } else {
        beriTahu(e.message, "galat");
      }
    } finally {
      setMemuat(false);
    }
  }, [beriTahu]);

  useEffect(() => {
    document.title = "Dashboard Pengurus | Komunitas Catur Indonesia";
    if (masuk) muatUlang();
  }, [masuk, muatUlang]);

  /* Tutup dropdown saat klik di luar */
  useEffect(() => {
    if (!menuProfile) return;
    const tutup = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setMenuProfile(false);
      }
    };
    document.addEventListener("mousedown", tutup);
    return () => document.removeEventListener("mousedown", tutup);
  }, [menuProfile]);

  if (!masuk) return <Gerbang onMasuk={() => setMasuk(true)} />;

  const keluar = () => {
    tokenPengurus.hapus();
    setMasuk(false);
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
            {/* Lonceng */}
            <button
              onClick={() => setTab("pesan")}
              className="relative p-2 rounded-md hover:bg-slate-100 transition-colors duration-150"
              title="Pesan masuk"
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
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {ringkas.pesan.belumDibaca}
                </span>
              )}
            </button>

            {/* Profil + dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setMenuProfile((v) => !v)}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors duration-150 focus:outline-none"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 leading-tight">
                    Admin Pengurus
                  </p>
                  <p className="text-xs text-slate-500">
                    admin@komunitascatur.or.id
                  </p>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  AP
                </div>
              </button>

              <DropdownProfil
                terbuka={menuProfile}
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

          {/* Kartu ringkasan */}
          {ringkas && (
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
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
                catatan={`${ringkas.pesan?.belumDibaca ?? 0} belum dibaca`}
                warna={ringkas.pesan?.belumDibaca ? "merah" : "slate"}
              />
              <Kartu
                label="Turnamen"
                nilai={ringkas.turnamen?.total ?? 0}
                catatan={`${ringkas.turnamen?.berlangsung ?? 0} berlangsung`}
              />
              <Kartu
                label="Konten"
                nilai={
                  (ringkas.konten?.berita ?? 0) +
                  (ringkas.konten?.pengumuman ?? 0)
                }
                catatan={`${ringkas.konten?.berita ?? 0} berita / ${ringkas.konten?.pengumuman ?? 0} pengumuman`}
                warna={
                  (ringkas.konten?.berita ?? 0) +
                    (ringkas.konten?.pengumuman ?? 0)
                    ? "hijau"
                    : "slate"
                }
              />
              <Kartu
                label="Verifikasi"
                nilai={ringkas.verifikasi?.mode ?? "—"}
                catatan={
                  ringkas.verifikasi?.oauthAktif
                    ? "login Chess.com aktif"
                    : "kode profil"
                }
                warna="hijau"
              />
            </div>
          )}

          {/* Panel konten */}
          {memuat && !ringkas ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Memuat…
            </p>
          ) : tab === "anggota" ? (
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
            <PanelPesan beriTahu={beriTahu} muatUlang={muatUlang} />
          ) : tab === "berita" ? (
            <PanelBerita beriTahu={beriTahu} muatUlang={muatUlang} />
          ) : tab === "pengumuman" ? (
            <PanelPengumuman beriTahu={beriTahu} muatUlang={muatUlang} />
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