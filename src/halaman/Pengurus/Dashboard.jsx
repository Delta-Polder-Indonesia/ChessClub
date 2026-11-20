import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import PanelEbook from "./PanelEbook.jsx";
import { PanelBerita, PanelPengumuman } from "./PanelKonten.jsx";
import PanelAnggota from "./Anggota.jsx";
import PanelLarangan from "./Larangan.jsx";
import PanelPesan from "./Pesan.jsx";
import Pengaturan from "./Pengaturan.jsx";
import Sidebar from "./Sidebar.jsx";
import { MENU_SIDEBAR } from "./SidebarData.js";
import DropdownNotifikasi from "./DropdownNotifikasi.jsx";
import DropdownPesan from "./DropdownPesan.jsx";
import Mail from "../Analisa/komponen/svg/mail.jsx";
import DropdownProfil from "./DropdownProfil.jsx";
import RingkasanDashboard from "./RingkasanDashboard.jsx";
import { KotakGalatMuat, SkeletonTabel } from "./ui.jsx";
import { TooltipLabel } from "@/components/ui/tooltip.jsx";
import Marquee from "../../components/ui/marquee.jsx";

// Judul header mengikuti menu sidebar yang sedang aktif (kunci → label),
// termasuk sub-menu e-book. "Dashboard" tetap tampil sebagai "Dashboard
// Pengurus" agar tidak mengubah perilaku awal.
const JUDUL_TAB = Object.fromEntries(
  MENU_SIDEBAR.flatMap((m) => [
    [m.kunci, m.kunci === "dashboard" ? "Dashboard Pengurus" : m.label],
    ...(m.anak || []).map((s) => [`${m.kunci}/${s.kunci}`, s.label]),
  ])
);

// Jalur breadcrumb untuk header (root = "Dashboard Pengurus").
const BREADCRUMB = {
  dashboard: ["Dashboard Pengurus"],
  anggota: ["Dashboard Pengurus", "Anggota"],
  larangan: ["Dashboard Pengurus", "Daftar Larangan"],
  pesan: ["Dashboard Pengurus", "Pesan Masuk"],
  turnamen: ["Dashboard Pengurus", "Turnamen"],
  juara: ["Dashboard Pengurus", "Juara Turnamen"],
  berita: ["Dashboard Pengurus", "Berita Komunitas"],
  pengumuman: ["Dashboard Pengurus", "Pengumuman"],
  ebook: ["Dashboard Pengurus", "Kode E-Book"],
  "ebook/terbit": ["Dashboard Pengurus", "Kode E-Book", "Kode E-Book"],
  "ebook/minta": ["Dashboard Pengurus", "Kode E-Book", "Permintaan kode"],
  "ebook/kode": ["Dashboard Pengurus", "Kode E-Book", "Daftar kode akses"],
  "ebook/unduhan": ["Dashboard Pengurus", "Kode E-Book", "Jejak unduhan"],
  kelolaAdmin: ["Pengaturan", "Kelola Admin"],
  akun: ["Pengaturan", "Akun & Password"],
  riwayatMasuk: ["Pengaturan", "Riwayat Masuk"],
  jejakAudit: ["Pengaturan", "Jejak Audit"],
  umum: ["Pengaturan", "Pengaturan Umum"],
};

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
  // Muat awal gagal total → tampilkan kotak galat + tombol coba lagi,
  // bukan area konten kosong yang hanya ditemani toast 8 detik.
  const [galatMuat, setGalatMuat] = useState(false);
  const [kabar, setKabar] = useState(null);
  const [menuProfile, setMenuProfile] = useState(false);
  const [tabPengaturan, setTabPengaturan] = useState(false);
  const [sidebarTerbuka, setSidebarTerbuka] = useState(true);
  const [halamanEbook, setHalamanEbook] = useState("terbit");
  const [judulRincian, setJudulRincian] = useState(null);
  const [menuNotif, setMenuNotif] = useState(false);
  const [menuPesan, setMenuPesan] = useState(false);
  const [notif, setNotif] = useState([]);
  const [memuatNotif, setMemuatNotif] = useState(false);
  const [notifEbook, setNotifEbook] = useState([]);
  const [memuatNotifEbook, setMemuatNotifEbook] = useState(false);
  const [bukaPesanId, setBukaPesanId] = useState(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const pesanRef = useRef(null);
  const belumDibacaSebelumnya = useRef(0);

  const bukaTab = useCallback((kunciTab, filter = "semua") => {
    if (kunciTab === "larangan") setFilterLarangan(filter);
    if (kunciTab === "anggota") setFilterAnggota(filter);
    setTab(kunciTab);
  }, []);

  /**
   * Klik langsung dari Sidebar selalu membuka panel dengan filter "semua".
   * Tanpa ini, filterAnggota/filterLarangan bekas bukaTab (mis. dari banner
   * dashboard "terblokir"/"otomatis") menetap di state dan ikut terbawa saat
   * panel re-mount lewat sidebar.
   */
  const pilihTabSidebar = useCallback((kunciTab) => {
    if (kunciTab === "anggota") setFilterAnggota("semua");
    if (kunciTab === "larangan") setFilterLarangan("semua");
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
    setGalatMuat(false);
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
      // 401/403 sudah ditangani tanganiGalat (keluar/toast); kegagalan lain
      // pada muat awal perlu kotak galat permanen yang bisa dicoba lagi.
      if (e?.status !== 401 && e?.status !== 403) setGalatMuat(true);
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
                `Peringatan fair play: ${hasil.diblokir.length} akun terdeteksi melanggar dan otomatis diblokir (${hasil.diblokir.map((u) => `@${u}`).join(", ")}).`,
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

  const muatNotifEbook = useCallback(async () => {
    setMemuatNotifEbook(true);
    try {
      const data = await apiPengurus("/ebook/minta");
      const menunggu = (data || []).filter((m) => m.status === "menunggu");
      setNotifEbook(menunggu);
    } catch (e) {
      if (e?.status === 401) tanganiGalat(e);
    } finally {
      setMemuatNotifEbook(false);
    }
  }, [tanganiGalat]);

  useEffect(() => {
    document.title = "Dashboard Pengurus | Komunitas Catur Indonesia";
    muatUlang();
    muatNotif();
    muatNotifEbook();
    let id = setInterval(() => {
      muatNotif();
      muatNotifEbook();
    }, 30_000);
    const onVisibilitas = () => {
      if (document.visibilityState === "hidden") {
        if (id) clearInterval(id);
        id = null;
      } else if (!id) {
        muatNotif();
        muatNotifEbook();
        id = setInterval(() => {
          muatNotif();
          muatNotifEbook();
        }, 30_000);
      }
    };
    document.addEventListener("visibilitychange", onVisibilitas);
    return () => {
      if (id) clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilitas);
      document.title = "Dashboard Pengurus | Komunitas Catur Indonesia";
    };
  }, [muatUlang, muatNotif, muatNotifEbook]);

  useEffect(() => {
    if (menuNotif) {
      muatNotif();
      muatNotifEbook();
    }
  }, [menuNotif, muatNotif, muatNotifEbook]);

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

  /** Feed campur untuk lonceng: pesan masuk + permintaan e-book. */
  const barisNotif = useMemo(() => {
    const dariPesan = notif.map((p) => ({
      jenis: "pesan",
      kunci: `pesan-${p.id}`,
      waktu: p.tanggal,
      nama: p.nama,
      subjek: p.subjek,
      teks: p.pesan,
      dibaca: !!p.dibaca,
      sumber: p,
    }));
    const dariEbook = notifEbook.map((m) => ({
      jenis: "ebook",
      kunci: `ebook-${m.id}`,
      waktu: m.waktu,
      nama: m.nama,
      subjek: `Permintaan kode e-book${m.akunChess ? ` (@${m.akunChess})` : ""}`,
      teks: m.judul ? `Ingin mengunduh: ${m.judul}` : "Ingin mengunduh e-book",
      dibaca: false,
      sumber: m,
    }));
    const dariFairPlay = (hitam || [])
      .filter((h) => h.sumber === "otomatis")
      .sort((a, b) => new Date(b.diblokirPada || 0) - new Date(a.diblokirPada || 0))
      .slice(0, 5)
      .map((h) => ({
        jenis: "fairplay",
        kunci: `fairplay-${h.username}`,
        waktu: h.diblokirPada,
        nama: `@${h.username}`,
        subjek: "Pelanggaran fair play",
        teks: h.keterangan || h.alasan || "Diblokir otomatis",
        // Catatan fair play bersifat informasional, bukan notifikasi berstatus baca.
        dibaca: true,
        sumber: h,
      }));
    return [...dariPesan, ...dariEbook, ...dariFairPlay]
      .filter((b) => b.waktu)
      .sort((a, b) => new Date(b.waktu) - new Date(a.waktu))
      .slice(0, 20);
  }, [notif, notifEbook, hitam]);

  // Badge hanya menghitung item yang memang memiliki status belum dibaca.
  // Peringatan fair play tetap tampil di daftar, tetapi bukan penghitung badge.
  const jumlahBelumDibaca =
    (ringkas?.pesan?.belumDibaca ?? 0) + notifEbook.length;

  const pilihNotif = useCallback(
    (b) => {
      setMenuNotif(false);
      if (b.jenis === "fairplay") {
        bukaTab("larangan", "otomatis");
        return;
      }
      if (b.jenis === "ebook") {
        setHalamanEbook("minta");
        setTab("ebook");
        return;
      }
      bukaPesan(b.sumber);
    },
    [bukaPesan, bukaTab]
  );

  useEffect(() => {
    if (!menuProfile && !menuNotif && !menuPesan) return;
    const tutup = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setMenuProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setMenuNotif(false);
      if (pesanRef.current && !pesanRef.current.contains(e.target)) setMenuPesan(false);
    };
    document.addEventListener("mousedown", tutup);
    return () => document.removeEventListener("mousedown", tutup);
  }, [menuProfile, menuNotif, menuPesan]);

  const keluar = () => {
    tokenPengurus.hapus();
    adminPengguna.hapus();
    peranPengurus.hapus();
    navigate(0);
  };

  const kunciJudul = tab === "ebook" ? `ebook/${halamanEbook}` : tab;
  const judulTab = JUDUL_TAB[kunciJudul] || "Dashboard Pengurus";

  const breadcrumb = useMemo(() => {
    if (tabPengaturan) return ["Pengaturan"];
    return BREADCRUMB[kunciJudul] || ["Dashboard Pengurus"];
  }, [tabPengaturan, kunciJudul]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* ── Halaman Pengaturan (Full Layar) — hanya Master ── */}
      {tabPengaturan ? (
        isMaster ? (
          <Pengaturan onKembali={() => setTabPengaturan(false)} beriTahu={beriTahu} kabar={kabar} />
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
            <div className="rounded-lg border border-slate-200 bg-white p-8 max-w-md">
              <h2 className="text-lg font-bold text-slate-900">Akses Ditolak</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Halaman Pengaturan hanya bisa diakses oleh <strong>Master Admin</strong>.
                Akun kamu saat ini adalah <strong>Admin Pengurus</strong>.
              </p>
              <button type="button" onClick={() => setTabPengaturan(false)}
                className="mt-5 rounded-md border-2 border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        )
      ) : (
      <>
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <TooltipLabel side="right" label={sidebarTerbuka ? "Tutup sidebar" : "Buka sidebar"}>
              <button onClick={() => setSidebarTerbuka((s) => !s)}
                className="p-2 rounded-md hover:bg-slate-100 transition-colors duration-150">
              {sidebarTerbuka ? (
                <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16.5,16V8l-4,4l4,4ZM5,21q-0.83,0-1.41-0.59T3,19V5Q3,4.17 3.59,3.59T5,3H19q0.83,0 1.41,0.59T21,5V19q0,0.82-0.59,1.41T19,21H5Zm3-2V5H5V19H8Zm2,0h9V5H10V19ZM8,19H5H8Z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.5,8v8l4-4l-4-4ZM5,21q-0.83,0-1.41-0.59T3,19V5Q3,4.17 3.59,3.59T5,3H19q0.83,0 1.41,0.59T21,5V19q0,0.82-0.59,1.41T19,21H5Zm3-2V5H5V19H8Zm2,0h9V5H10V19ZM8,19H5H8Z" />
                </svg>
              )}
            </button>
            </TooltipLabel>
            <h1 className="text-lg font-bold text-slate-900">{judulRincian || judulTab}</h1>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              {breadcrumb.map((item, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className="text-slate-300">/</span>}
                  <span>{item}</span>
                </Fragment>
              ))}
            </div>
          </div>

          {/* Notifikasi backend (permintaan terlalu banyak, peringatan fair play,
              pesan baru, dst.) mengisi ruang di samping judul sampai tepi lonceng —
              bukan kotak toast di dalam konten yang sebelumnya menggeser tata letak. */}
          <div className="flex min-w-0 flex-1 items-center justify-end">
            {kabar && <Marquee ringan items={[kabar.teks]} />}
          </div>

          <div className="flex items-center gap-2">
            {/* Lonceng notifikasi */}
            <div className="relative" ref={notifRef}>
              <TooltipLabel side="right" label="Notifikasi pesan masuk">
                <button onClick={() => { setMenuProfile(false); setMenuPesan(false); setMenuNotif((v) => !v); }}
                  className="relative p-2 rounded-md hover:bg-slate-100 transition-colors duration-150"
                  aria-haspopup="true" aria-expanded={menuNotif}>
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {jumlahBelumDibaca > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 bg-slate-900 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {jumlahBelumDibaca > 99 ? "99+" : jumlahBelumDibaca}
                  </span>
                )}
              </button>
              </TooltipLabel>
              <DropdownNotifikasi terbuka={menuNotif} baris={barisNotif} memuat={memuatNotif || memuatNotifEbook}
                onBuka={() => { setMenuNotif(false); setTab("pesan"); }}
                onPilih={pilihNotif} onTandaiSemua={tandaiSemuaDibaca} />
            </div>

            {/* Amplop pesan masuk */}
            <div className="relative" ref={pesanRef}>
              <TooltipLabel side="right" label="Pesan masuk">
                <button onClick={() => { setMenuProfile(false); setMenuNotif(false); setMenuPesan((v) => !v); }}
                className="relative p-2 rounded-md hover:bg-slate-100 transition-colors duration-150"
                aria-haspopup="true" aria-expanded={menuPesan}>
                <Mail className="w-5 h-5 text-slate-600" />
                {ringkas?.pesan?.belumDibaca > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 bg-slate-900 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {ringkas.pesan.belumDibaca > 99 ? "99+" : ringkas.pesan.belumDibaca}
                  </span>
                )}
              </button>
              </TooltipLabel>
              <DropdownPesan terbuka={menuPesan} pesan={notif} memuat={memuatNotif}
                onBuka={() => { setMenuPesan(false); setTab("pesan"); }}
                onBukaPesan={bukaPesan} />
            </div>

            {/* Profil + dropdown */}
            <div className="relative" ref={profileRef}>
              <TooltipLabel side="right" label={pengguna ? `Masuk sebagai ${pengguna}` : ""}>
                <button onClick={() => setMenuProfile((v) => !v)}
                  aria-label={pengguna ? `Masuk sebagai ${pengguna}` : "Profil pengurus"}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors duration-150 focus:outline-none">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 leading-tight flex items-center justify-end gap-2">
                    {pengguna || "Pengurus"}
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${isMaster ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                      {isMaster ? "MASTER" : "PENGURUS"}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">{isMaster ? "Master Admin" : "Admin Pengurus"}</p>
                </div>
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-slate-900 text-sm font-semibold shrink-0 uppercase border-2 border-slate-900">
                  {(pengguna || "?").charAt(0)}
                </div>
              </button>
              </TooltipLabel>
              <DropdownProfil terbuka={menuProfile} pengguna={pengguna} peran={peran}
                onTutup={() => setMenuProfile(false)} onMuatUlang={muatUlang}
                onKeluar={keluar} onBukaPengaturan={() => setTabPengaturan(true)} memuat={memuat} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">
        <Sidebar tab={tab} setTab={pilihTabSidebar} terbuka={sidebarTerbuka} halamanEbook={halamanEbook} onPilihEbook={(hal) => { setHalamanEbook(hal); bukaTab("ebook"); }} />

        <main className="flex-1 p-6 md:p-8 min-w-0 overflow-y-auto min-h-0">
          {tab === "dashboard" && (
            memuat && !ringkas ? (
              <SkeletonTabel jumlahBaris={4} />
            ) : ringkas ? (
              <RingkasanDashboard ringkas={ringkas} onBuka={bukaTab} hitam={hitam} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="text-sm font-medium text-slate-800">
                  Ringkasan dashboard gagal dimuat. Periksa koneksi lalu coba lagi.
                </p>
                <button
                  type="button"
                  onClick={muatUlang}
                  className="rounded-md border-2 border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Coba Lagi
                </button>
              </div>
            )
          )}

          {/* galatMuat: kegagalan muatUlang juga berdampak ke tab Anggota &
              Larangan (datanya dari state bersama) — tampilkan kotak galat
              permanen dengan tombol coba lagi, bukan tabel kosong. */}
          {tab === "anggota" && (
            galatMuat && !memuat && !anggota.length ? (
              <KotakGalatMuat
                pesan="Daftar anggota gagal dimuat. Periksa koneksi lalu coba lagi."
                onCobaLagi={muatUlang}
              />
            ) : (
              <PanelAnggota anggota={anggota} muatUlang={muatUlang} beriTahu={beriTahu} filterAwal={filterAnggota} />
            )
          )}
          {tab === "larangan" && (
            galatMuat && !memuat && !hitam.length ? (
              <KotakGalatMuat
                pesan="Daftar larangan gagal dimuat. Periksa koneksi lalu coba lagi."
                onCobaLagi={muatUlang}
              />
            ) : (
              <PanelLarangan hitam={hitam} muatUlang={muatUlang} beriTahu={beriTahu} filterAwal={filterLarangan} />
            )
          )}
          {tab === "pesan" && <PanelPesan beriTahu={beriTahu} muatUlang={onPesanBerubah} pesanTerpilihId={bukaPesanId} onPesanTerbuka={() => setBukaPesanId(null)} />}
          {tab === "berita" && <PanelBerita beriTahu={beriTahu} muatUlang={segarkanRingkasan} />}
          {tab === "pengumuman" && <PanelPengumuman beriTahu={beriTahu} muatUlang={segarkanRingkasan} />}
          {tab === "juara" && <PanelJuara beriTahu={beriTahu} />}
          {tab === "ebook" && <PanelEbook beriTahu={beriTahu} halaman={halamanEbook} onGantiHalaman={setHalamanEbook} />}
          {tab === "turnamen" && <PanelTurnamen beriTahu={beriTahu} muatUlang={muatUlang} saatBukaRincian={setJudulRincian} />}
        </main>
      </div>
      </>
      )}
    </div>
  );
}
