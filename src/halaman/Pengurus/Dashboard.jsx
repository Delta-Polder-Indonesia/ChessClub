import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiPengurus,
  tokenPengurus,
  adminPengguna,
  peranPengurus,
  ambilDaftarAnggota,
  ambilDaftarHitam,
} from "../../lib/api/index.js";
import PanelTurnamen from "./PanelTurnamen.jsx";
import PanelJuara from "./PanelJuara.jsx";
import { PanelBerita, PanelPengumuman } from "./PanelKonten.jsx";
import PanelAnggota from "./Anggota.jsx";
import PanelLarangan from "./Larangan.jsx";
import PanelPesan from "./Pesan.jsx";
import Pengaturan from "./Pengaturan.jsx";
import Sidebar from "./Sidebar.jsx";
import DropdownNotifikasi from "./DropdownNotifikasi.jsx";
import DropdownProfil from "./DropdownProfil.jsx";
import RingkasanDashboard from "./RingkasanDashboard.jsx";

/* ========================================================
   HALAMAN UTAMA: Dashboard
   ======================================================== */

export default function Dashboard() {
  const navigate = useNavigate();
  const [pengguna] = useState(() => adminPengguna.ambil());
  const [peran] = useState(() => peranPengurus.ambil());
  const isMaster = (peran || "").toLowerCase() === "master";
  const [tab, setTab] = useState("dashboard");
  const [filterLarangan, setFilterLarangan] = useState("semua");
  const [filterAnggota, setFilterAnggota] = useState("semua");
  const [ringkas, setRingkas] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [hitam, setHitam] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [kabar, setKabar] = useState(null);
  const [menuProfile, setMenuProfile] = useState(false);
  const [tabPengaturan, setTabPengaturan] = useState(false);
  const [sidebarTerbuka, setSidebarTerbuka] = useState(true);
  const [judulRincian, setJudulRincian] = useState(null);
  const [menuNotif, setMenuNotif] = useState(false);
  const [notif, setNotif] = useState([]);
  const [memuatNotif, setMemuatNotif] = useState(false);
  const [bukaPesanId, setBukaPesanId] = useState(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const belumDibacaSebelumnya = useRef(0);

  const bukaTab = useCallback((kunciTab, filter = "semua") => {
    if (kunciTab === "larangan") setFilterLarangan(filter);
    if (kunciTab === "anggota") setFilterAnggota(filter);
    setTab(kunciTab);
  }, []);

  /* Timer notifikasi */
  const jamKabar = useRef(null);
  const beriTahu = useCallback((teks, jenis = "sukses") => {
    setKabar({ teks, jenis });
    if (jamKabar.current) clearTimeout(jamKabar.current);
    jamKabar.current = setTimeout(() => setKabar(null), 8000);
  }, []);

  useEffect(() => () => clearTimeout(jamKabar.current), []);

  const tanganiGalat = useCallback(
    (e) => {
      if (e?.status === 401) {
        tokenPengurus.hapus();
        adminPengguna.hapus();
        peranPengurus.hapus();
        navigate(0);
        return;
      }
      if (e?.status === 403) {
        beriTahu(e?.message || "Akses ditolak: hanya Master Admin.", "galat");
        return;
      }
      beriTahu(e?.message || "Terjadi kesalahan.", "galat");
    },
    [beriTahu, navigate]
  );

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

  /* Pindai fair play otomatis */
  useEffect(() => {
    let hidup = true;
    apiPengurus("/pindai-otomatis")
      .then((hasil) => {
        if (!hidup || !hasil?.dijalankan) return;
        Promise.all([ambilDaftarHitam(), ambilDaftarAnggota(), apiPengurus("/ringkasan")])
          .then(([h, a, r]) => {
            if (!hidup) return;
            setHitam(h);
            setAnggota(a);
            setRingkas(r);
            if (hasil.diblokir?.length > 0) {
              beriTahu(
                `⚠️ Peringatan Fair Play: ${hasil.diblokir.length} akun terdeteksi melanggar dan otomatis diblokir (${hasil.diblokir.map((u) => `@${u}`).join(", ")}).`,
                "peringatan"
              );
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
    return () => { hidup = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const segarkanRingkasan = useCallback(async () => {
    try {
      const r = await apiPengurus("/ringkasan");
      setRingkas(r);
    } catch (e) {
      tanganiGalat(e);
    }
  }, [tanganiGalat]);

  const muatNotif = useCallback(async () => {
    setMemuatNotif(true);
    try {
      const data = await apiPengurus("/pesan");
      const terbaru = data.slice(0, 10);
      setNotif(terbaru);
      const belum = (data || []).filter((p) => !p.dibaca).length;
      document.title =
        belum > 0
          ? `(${belum}) Dashboard Pengurus | Komunitas Catur Indonesia`
          : "Dashboard Pengurus | Komunitas Catur Indonesia";
      if (belumDibacaSebelumnya.current > 0 && belum > belumDibacaSebelumnya.current) {
        beriTahu(`${belum - belumDibacaSebelumnya.current} pesan baru masuk.`, "peringatan");
      }
      belumDibacaSebelumnya.current = belum;
      setRingkas((r) => r ? { ...r, pesan: { ...r.pesan, total: data.length, belumDibaca: belum } } : r);
    } catch (e) {
      if (e?.status === 401) tanganiGalat(e);
    } finally {
      setMemuatNotif(false);
    }
  }, [beriTahu, tanganiGalat]);

  useEffect(() => {
    document.title = "Dashboard Pengurus | Komunitas Catur Indonesia";
    muatUlang();
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

  useEffect(() => {
    if (menuNotif) muatNotif();
  }, [menuNotif, muatNotif]);

  const bukaPesan = useCallback(
    (p) => {
      setMenuNotif(false);
      setTab("pesan");
      setBukaPesanId(p.id);
      if (!p.dibaca) {
        apiPengurus(`/pesan/${p.id}/baca`, { metode: "POST" })
          .then(muatNotif)
          .catch(() => {});
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

  const onPesanBerubah = useCallback(async () => {
    await Promise.all([segarkanRingkasan(), muatNotif()]);
  }, [segarkanRingkasan, muatNotif]);

  useEffect(() => {
    if (!menuProfile && !menuNotif) return;
    const tutup = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setMenuProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setMenuNotif(false);
    };
    document.addEventListener("mousedown", tutup);
    return () => document.removeEventListener("mousedown", tutup);
  }, [menuProfile, menuNotif]);

  const keluar = () => {
    tokenPengurus.hapus();
    adminPengguna.hapus();
    peranPengurus.hapus();
    navigate(0);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Halaman Pengaturan (Full Layar) — hanya Master ── */}
      {tabPengaturan ? (
        isMaster ? (
          <Pengaturan onKembali={() => setTabPengaturan(false)} beriTahu={beriTahu} />
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
            <div className="rounded-lg border border-red-200 bg-white p-8 max-w-md">
              <h2 className="text-lg font-bold text-slate-900">Akses Ditolak</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Halaman Pengaturan hanya bisa diakses oleh <strong>Master Admin</strong>.
                Akun kamu saat ini adalah <strong>Admin Pengurus</strong>.
              </p>
              <button type="button" onClick={() => setTabPengaturan(false)}
                className="mt-5 rounded-full bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800">
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        )
      ) : (
      <>
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarTerbuka((s) => !s)}
              className="p-2 rounded-md hover:bg-slate-100 transition-colors duration-150"
              title={sidebarTerbuka ? "Tutup sidebar" : "Buka sidebar"}>
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-900">{judulRincian || "Dashboard Pengurus"}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Lonceng notifikasi */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setMenuProfile(false); setMenuNotif((v) => !v); }}
                className="relative p-2 rounded-md hover:bg-slate-100 transition-colors duration-150"
                title="Notifikasi pesan masuk" aria-haspopup="true" aria-expanded={menuNotif}>
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {ringkas?.pesan?.belumDibaca > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {ringkas.pesan.belumDibaca > 99 ? "99+" : ringkas.pesan.belumDibaca}
                  </span>
                )}
              </button>
              <DropdownNotifikasi terbuka={menuNotif} pesan={notif} memuat={memuatNotif}
                onBuka={() => { setMenuNotif(false); setTab("pesan"); }}
                onBukaPesan={bukaPesan} onTandaiSemua={tandaiSemuaDibaca} />
            </div>

            {/* Profil + dropdown */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setMenuProfile((v) => !v)}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors duration-150 focus:outline-none"
                title={pengguna ? `Masuk sebagai ${pengguna}` : ""}>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 leading-tight flex items-center justify-end gap-2">
                    {pengguna || "Pengurus"}
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isMaster ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                      {isMaster ? "MASTER" : "PENGURUS"}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">{isMaster ? "Master Admin" : "Admin Pengurus"}</p>
                </div>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 uppercase ${isMaster ? "bg-amber-600" : "bg-primary"}`}>
                  {(pengguna || "?").charAt(0)}
                </div>
              </button>
              <DropdownProfil terbuka={menuProfile} pengguna={pengguna} peran={peran}
                onTutup={() => setMenuProfile(false)} onMuatUlang={muatUlang}
                onKeluar={keluar} onBukaPengaturan={() => setTabPengaturan(true)} memuat={memuat} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex">
        <Sidebar tab={tab} setTab={setTab} terbuka={sidebarTerbuka} />

        <main className="flex-1 p-6 md:p-8 min-w-0 overflow-x-hidden">
          {kabar && (
            <p className={`mb-4 rounded-md border px-4 py-2.5 text-sm ${
              kabar.jenis === "galat" ? "border-red-300 bg-red-50 text-red-800"
              : kabar.jenis === "peringatan" ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
            }`}>{kabar.teks}</p>
          )}

          {tab === "dashboard" && (
            memuat && !ringkas ? (
              <p className="py-10 text-center text-sm text-slate-500">Memuat…</p>
            ) : (
              ringkas && <RingkasanDashboard ringkas={ringkas} belumBaca={ringkas.pesan?.belumDibaca ?? 0} onBuka={bukaTab} hitam={hitam} />
            )
          )}

          {tab === "anggota" && <PanelAnggota anggota={anggota} muatUlang={muatUlang} beriTahu={beriTahu} filterAwal={filterAnggota} />}
          {tab === "larangan" && <PanelLarangan hitam={hitam} muatUlang={muatUlang} beriTahu={beriTahu} filterAwal={filterLarangan} />}
          {tab === "pesan" && <PanelPesan beriTahu={beriTahu} muatUlang={onPesanBerubah} pesanTerpilihId={bukaPesanId} onPesanTerbuka={() => setBukaPesanId(null)} />}
          {tab === "berita" && <PanelBerita beriTahu={beriTahu} muatUlang={segarkanRingkasan} />}
          {tab === "pengumuman" && <PanelPengumuman beriTahu={beriTahu} muatUlang={segarkanRingkasan} />}
          {tab === "juara" && <PanelJuara beriTahu={beriTahu} />}
          {tab === "turnamen" && <PanelTurnamen beriTahu={beriTahu} anggota={anggota} muatUlang={muatUlang} saatBukaRincian={setJudulRincian} />}
        </main>
      </div>
      </>
      )}
    </div>
  );
}
