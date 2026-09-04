/*
 * Popup / Panel "Basis Data Permainan" (Database) — arsitektur terinspirasi
 * dari sistem manajemen database en-croissant (https://github.com/franciscoBSalgueiro/en-croissant).
 *
 * Menggunakan SVG icons konsisten tanpa emoji, tipografi terstruktur,
 * dan integrasi langsung ke IndexedDB peramban.
 */
import { useEffect, useState } from "react";
import Popup from "./Popup.jsx";
import Database from "../svg/database.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import {
  ambilDaftarPartai,
  ambilSemuaKoleksi,
  bersihkanBasisData,
  eksporPgnKoleksi,
  hapusKoleksi,
  hapusPartai,
  hitungStatistikBasisData,
  imporPgnKeBasisData,
} from "../../basisData.js";

const BARIS_PER_HALAMAN = 50;

function formatTanggal(timestamp, locale = "id") {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

/* --- SVG Icons Internal --- */
function IkonDownload({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IkonPlus({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IkonTrash({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function IkonCopy({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IkonCheck({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IkonSearch({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IkonPlay({ className = "h-3 w-3" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IkonSort({ aktif, arah }) {
  if (!aktif) {
    return (
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 opacity-25 inline-block" aria-hidden="true">
        <polyline points="7 15 12 20 17 15" />
        <polyline points="7 9 12 4 17 9" />
      </svg>
    );
  }
  return arah === "asc" ? (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-foregroundHighlighted inline-block" aria-hidden="true">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ) : (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-foregroundHighlighted inline-block" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function PopupDatabase({ onTutup, onAnalisa, onBukaAkun }) {
  const { t, bahasa: locale } = useI18n();

  const [koleksiList, setKoleksiList] = useState([]);
  const [koleksiTerpilih, setKoleksiTerpilih] = useState("");
  const [cari, setCari] = useState("");
  const [filterHasil, setFilterHasil] = useState("");
  const [filterWaktu, setFilterWaktu] = useState("");
  const [urut, setUrut] = useState({ kolom: "tanggal", arah: "desc" });
  const [hal, setHal] = useState(1);

  const [daftarPartai, setDaftarPartai] = useState([]);
  const [totalPartai, setTotalPartai] = useState(0);
  const [stats, setStats] = useState(null);
  const [memuat, setMemuat] = useState(true);

  const [modalImpor, setModalImpor] = useState(false);
  const [teksPgn, setTeksPgn] = useState("");
  const [prosesImpor, setProsesImpor] = useState(false);

  const [salinSuksesId, setSalinSuksesId] = useState(null);
  const [notifikasi, setNotifikasi] = useState(null);

  // Muat daftar koleksi & statistik
  async function muatMetadata() {
    try {
      const [semuaKoleksi, st] = await Promise.all([
        ambilSemuaKoleksi(),
        hitungStatistikBasisData(),
      ]);
      setKoleksiList(semuaKoleksi);
      setStats(st);
    } catch {
      /* abaikan */
    }
  }

  // Muat partai berdasarkan filter aktif
  async function muatPartai() {
    setMemuat(true);
    try {
      let plat = "";
      let user = "";
      if (koleksiTerpilih) {
        const [p, ...rest] = koleksiTerpilih.split(":");
        plat = p;
        user = rest.join(":");
      }

      const hasil = await ambilDaftarPartai({
        koleksiId: koleksiTerpilih || undefined,
        platform: plat || undefined,
        username: user || undefined,
        cari,
        hasil: filterHasil || undefined,
        timeClass: filterWaktu || undefined,
        urut: urut.kolom,
        arah: urut.arah,
        limit: BARIS_PER_HALAMAN,
        offset: (hal - 1) * BARIS_PER_HALAMAN,
      });

      setDaftarPartai(hasil.partai || []);
      setTotalPartai(hasil.total || 0);
    } catch {
      setDaftarPartai([]);
      setTotalPartai(0);
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    muatMetadata();
  }, []);

  useEffect(() => {
    setHal(1);
  }, [koleksiTerpilih, cari, filterHasil, filterWaktu, urut]);

  useEffect(() => {
    muatPartai();
  }, [koleksiTerpilih, cari, filterHasil, filterWaktu, urut, hal]);

  const totalHal = Math.max(1, Math.ceil(totalPartai / BARIS_PER_HALAMAN));
  const aktifHal = Math.min(hal, totalHal);

  function tampilkanNotif(pesan) {
    setNotifikasi(pesan);
    setTimeout(() => setNotifikasi(null), 3000);
  }

  // Aksi: Analisa
  function tanganiAnalisa(game) {
    if (!game?.pgn) return;
    onAnalisa({ format: "pgn", string: game.pgn });
    onTutup();
  }

  // Aksi: Salin PGN
  async function tanganiSalinPgn(game) {
    if (!game?.pgn) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(game.pgn);
      }
      setSalinSuksesId(game.id);
      tampilkanNotif(t("analisa.basisData.pgnDisalin"));
      setTimeout(() => setSalinSuksesId(null), 2000);
    } catch {
      tampilkanNotif("Gagal menyalin PGN.");
    }
  }

  // Aksi: Ekspor PGN multi-game
  async function tanganiEksporPgn() {
    try {
      let plat = "";
      let user = "";
      if (koleksiTerpilih) {
        const [p, ...rest] = koleksiTerpilih.split(":");
        plat = p;
        user = rest.join(":");
      }

      const pgnString = await eksporPgnKoleksi({
        koleksiId: koleksiTerpilih || undefined,
        platform: plat || undefined,
        username: user || undefined,
        cari,
        hasil: filterHasil || undefined,
        timeClass: filterWaktu || undefined,
      });

      if (!pgnString) {
        tampilkanNotif("Tidak ada partai untuk diekspor.");
        return;
      }

      const blob = new Blob([pgnString], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const namaFile = `kci-catur-${koleksiTerpilih ? koleksiTerpilih.replace(":", "-") : "semua"}-${Date.now()}.pgn`;
      a.href = url;
      a.download = namaFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      tampilkanNotif(t("analisa.basisData.eksporPgnSukses"));
    } catch {
      tampilkanNotif("Gagal mengekspor PGN.");
    }
  }

  // Aksi: Hapus 1 Partai
  async function tanganiHapusPartai(e, game) {
    e.stopPropagation();
    if (!window.confirm(t("analisa.basisData.konfirmasiHapusPartai"))) return;
    await hapusPartai(game.id);
    await muatMetadata();
    await muatPartai();
    tampilkanNotif("Partai berhasil dihapus dari basis data.");
  }

  // Aksi: Hapus Koleksi
  async function tanganiHapusKoleksi() {
    if (!koleksiTerpilih) return;
    const kol = koleksiList.find((k) => k.id === koleksiTerpilih);
    const label = kol?.label || koleksiTerpilih;
    const jlh = kol?.jumlahPartai || totalPartai;
    if (!window.confirm(t("analisa.basisData.konfirmasiHapusKoleksi", { koleksi: label, jumlah: jlh }))) return;

    await hapusKoleksi(koleksiTerpilih);
    setKoleksiTerpilih("");
    await muatMetadata();
    await muatPartai();
    tampilkanNotif(`Koleksi ${label} berhasil dihapus.`);
  }

  // Aksi: Kosongkan Semua
  async function tanganiKosongkanSemua() {
    if (!window.confirm(t("analisa.basisData.konfirmasiHapusSemua"))) return;
    await bersihkanBasisData();
    setKoleksiTerpilih("");
    await muatMetadata();
    await muatPartai();
    tampilkanNotif("Seluruh basis data telah dikosongkan.");
  }

  // Aksi: Impor PGN Manual
  async function tanganiSimpanImporPgn() {
    if (!teksPgn.trim()) return;
    setProsesImpor(true);
    try {
      const res = await imporPgnKeBasisData(teksPgn);
      setModalImpor(false);
      setTeksPgn("");
      await muatMetadata();
      await muatPartai();
      tampilkanNotif(t("analisa.basisData.imporSukses", { jumlah: res.tersimpan || 1 }));
    } catch {
      tampilkanNotif("Gagal mengimpor PGN. Periksa format PGN Anda.");
    } finally {
      setProsesImpor(false);
    }
  }

  function ubahUrut(kolom) {
    setUrut((lama) =>
      lama.kolom === kolom
        ? { kolom, arah: lama.arah === "asc" ? "desc" : "asc" }
        : { kolom, arah: kolom === "tanggal" ? "desc" : "asc" }
    );
  }

  return (
    <Popup
      judul={t("analisa.basisData.judul")}
      subjudul={t("analisa.basisData.subjudul")}
      onTutup={onTutup}
      className="max-w-[900px] w-full"
    >
      {/* Toast Notifikasi */}
      {notifikasi ? (
        <div className="mb-3 flex items-center justify-between rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-2 text-xs font-semibold text-foregroundBlackDark transition-all">
          <div className="flex items-center gap-2">
            <IkonCheck className="h-4 w-4 shrink-0 text-foregroundBlackDark" />
            <span>{notifikasi}</span>
          </div>
          <button type="button" onClick={() => setNotifikasi(null)} className="ml-2 text-xs opacity-75 hover:opacity-100 cursor-pointer">
            ✕
          </button>
        </div>
      ) : null}

      {/* Ringkasan Statistik */}
      {stats && stats.totalPartai > 0 ? (
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3.5 py-2.5 text-xs text-foregroundGrey">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Database width={14} height={14} className="fill-foregroundHighlighted" />
              {t("analisa.basisData.jumlahPartai", { jumlah: stats.totalPartai })}
            </span>
            <span className="text-border">/</span>
            <span className="flex items-center gap-1 text-winGreen font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-winGreen" />
              {stats.putihMenang} {t("analisa.basisData.menang")} Putih
            </span>
            <span className="flex items-center gap-1 text-lossRed font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-lossRed" />
              {stats.hitamMenang} {t("analisa.basisData.menang")} Hitam
            </span>
            <span className="flex items-center gap-1 text-foregroundGrey font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-foregroundGrey" />
              {stats.seri} {t("analisa.basisData.seri")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {stats.platformCounts.chessCom > 0 ? (
              <span className="rounded-sm border border-border bg-backgroundBox px-2 py-0.5 text-[11px] font-mono">
                Chess.com: {stats.platformCounts.chessCom}
              </span>
            ) : null}
            {stats.platformCounts.lichessOrg > 0 ? (
              <span className="rounded-sm border border-border bg-backgroundBox px-2 py-0.5 text-[11px] font-mono">
                Lichess: {stats.platformCounts.lichessOrg}
              </span>
            ) : null}
            {stats.platformCounts.impor > 0 ? (
              <span className="rounded-sm border border-border bg-backgroundBox px-2 py-0.5 text-[11px] font-mono">
                Impor: {stats.platformCounts.impor}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Bilah Kontrol / Filter */}
      <div className="flex flex-col gap-2.5 pb-2.5">
        {/* Baris 1: Pemilih Koleksi / Akun + Tombol Aksi Global */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-grow min-w-0">
            <select
              value={koleksiTerpilih}
              onChange={(e) => setKoleksiTerpilih(e.target.value)}
              aria-label={t("analisa.basisData.koleksi")}
              className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-xs font-semibold text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted cursor-pointer"
            >
              <option value="">{t("analisa.basisData.semuaKoleksi")} ({stats?.totalPartai || 0})</option>
              {koleksiList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label} ({k.jumlahPartai})
                </option>
              ))}
            </select>

            {/* Filter Hasil */}
            <select
              value={filterHasil}
              onChange={(e) => setFilterHasil(e.target.value)}
              aria-label={t("analisa.basisData.filterHasil")}
              className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted cursor-pointer"
            >
              <option value="">{t("analisa.basisData.semuaHasil")}</option>
              <option value="white">{t("analisa.basisData.menang")} Putih</option>
              <option value="black">{t("analisa.basisData.menang")} Hitam</option>
              <option value="draw">{t("analisa.basisData.seri")}</option>
            </select>

            {/* Filter Waktu */}
            <select
              value={filterWaktu}
              onChange={(e) => setFilterWaktu(e.target.value)}
              aria-label={t("analisa.basisData.filterWaktu")}
              className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted cursor-pointer"
            >
              <option value="">{t("analisa.basisData.semuaWaktu")}</option>
              <option value="blitz">Blitz</option>
              <option value="rapid">Rapid</option>
              <option value="bullet">Bullet</option>
              <option value="classical">Klasik</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={tanganiEksporPgn}
              title={t("analisa.basisData.eksporPgn")}
              className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer"
            >
              <IkonDownload className="h-3.5 w-3.5 shrink-0" />
              <span>{t("analisa.basisData.eksporPgn")}</span>
            </button>
            <button
              type="button"
              onClick={() => setModalImpor(true)}
              title={t("analisa.basisData.imporPgn")}
              className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer"
            >
              <IkonPlus className="h-3.5 w-3.5 shrink-0" />
              <span>{t("analisa.basisData.imporPgn")}</span>
            </button>
            {koleksiTerpilih ? (
              <button
                type="button"
                onClick={tanganiHapusKoleksi}
                title={t("analisa.basisData.hapusKoleksi")}
                className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-lossRed transition-colors hover:bg-backgroundBoxBoxHover cursor-pointer"
              >
                <IkonTrash className="h-3.5 w-3.5 shrink-0" />
                <span>{t("analisa.basisData.hapusKoleksi")}</span>
              </button>
            ) : totalPartai > 0 ? (
              <button
                type="button"
                onClick={tanganiKosongkanSemua}
                title={t("analisa.basisData.hapusSemua")}
                className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-lossRed transition-colors hover:bg-backgroundBoxBoxHover cursor-pointer"
              >
                <IkonTrash className="h-3.5 w-3.5 shrink-0" />
                <span>{t("analisa.basisData.hapusSemua")}</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Baris 2: Kolom Pencarian dengan Ikon */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-foregroundGrey">
            <IkonSearch className="h-4 w-4" />
          </div>
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={t("analisa.basisData.cariPlaceholder")}
            aria-label={t("analisa.basisData.cariPlaceholder")}
            className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox pl-9 pr-3 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
          />
        </div>
      </div>

      {/* Modal / Dialog Input Impor PGN */}
      {modalImpor ? (
        <div className="mb-4 rounded-borderRoundness border border-border bg-backgroundBoxBox p-3.5 flex flex-col gap-2.5 animate-fadeIn">
          <p className="text-xs font-bold text-foreground">{t("analisa.basisData.imporPgnJudul")}</p>
          <textarea
            rows={5}
            value={teksPgn}
            onChange={(e) => setTeksPgn(e.target.value)}
            placeholder={t("analisa.form.tempelPgn")}
            className="w-full resize-y rounded-borderRoundness border border-border bg-backgroundBox p-2 font-mono text-xs text-foreground outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setModalImpor(false);
                setTeksPgn("");
              }}
              className="rounded-borderRoundness border border-border bg-backgroundBox px-3 py-1 text-xs text-foregroundGrey hover:text-foreground cursor-pointer"
            >
              {t("analisa.basisData.imporPgnBatal")}
            </button>
            <button
              type="button"
              disabled={!teksPgn.trim() || prosesImpor}
              onClick={tanganiSimpanImporPgn}
              className="rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3 py-1 text-xs font-bold text-foregroundBlackDark hover:bg-backgroundBoxBoxHighlightedHover disabled:opacity-40 cursor-pointer"
            >
              {prosesImpor ? t("analisa.impor.memuat") : t("analisa.basisData.imporPgnSimpan")}
            </button>
          </div>
        </div>
      ) : null}

      {/* Tabel Permainan */}
      <div className="w-full overflow-auto max-h-[380px] border border-border rounded-borderRoundness bg-backgroundBox">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-backgroundBox border-b border-border z-10 select-none">
            <tr>
              <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                <button type="button" onClick={() => ubahUrut("pemain")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors cursor-pointer">
                  {t("analisa.basisData.pemain")}<IkonSort aktif={urut.kolom === "pemain"} arah={urut.arah} />
                </button>
              </th>
              <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                <button type="button" onClick={() => ubahUrut("hasil")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors cursor-pointer">
                  {t("analisa.basisData.hasilTabel")}<IkonSort aktif={urut.kolom === "hasil"} arah={urut.arah} />
                </button>
              </th>
              <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                <button type="button" onClick={() => ubahUrut("tanggal")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors cursor-pointer">
                  {t("analisa.basisData.tanggal")}<IkonSort aktif={urut.kolom === "tanggal"} arah={urut.arah} />
                </button>
              </th>
              <th className="py-2 px-2 text-right text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                <button type="button" onClick={() => ubahUrut("langkah")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors cursor-pointer">
                  {t("analisa.basisData.langkah")}<IkonSort aktif={urut.kolom === "langkah"} arah={urut.arah} />
                </button>
              </th>
              <th className="py-2 pl-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                {t("analisa.basisData.aksi")}
              </th>
            </tr>
          </thead>
          <tbody>
            {daftarPartai.map((game, i) => {
              const whiteWon = game.result === "white";
              const blackWon = game.result === "black";
              const eloPutih = Number(game.whiteElo) > 0 ? `(${game.whiteElo})` : "";
              const eloHitam = Number(game.blackElo) > 0 ? `(${game.blackElo})` : "";
              const isCopied = salinSuksesId === game.id;

              return (
                <tr
                  key={game.id || i}
                  onClick={() => tanganiAnalisa(game)}
                  className="cursor-pointer select-none border-b border-border/50 transition-colors hover:bg-backgroundBoxHover group"
                >
                  <td className="py-2 pl-4 pr-2 w-[38%] min-w-44 overflow-hidden">
                    <div className="flex flex-row items-center gap-1.5 text-[13px] leading-5">
                      <div className={`h-3 min-h-3 w-3 min-w-3 shrink-0 bg-evaluationBarWhite rounded-sm ${whiteWon ? "border-2 border-winGreen" : ""}`} />
                      <span className="truncate font-medium">{game.whiteName || "Putih"}</span>
                      <span className="text-foregroundGrey text-[11px] font-mono">{eloPutih}</span>
                    </div>
                    <div className="flex flex-row items-center gap-1.5 text-[13px] leading-5">
                      <div className={`h-3 w-3 shrink-0 bg-evaluationBarBlack rounded-sm ${blackWon ? "border-2 border-winGreen" : ""}`} />
                      <span className="truncate font-medium">{game.blackName || "Hitam"}</span>
                      <span className="text-foregroundGrey text-[11px] font-mono">{eloHitam}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <div className="flex flex-row items-center gap-1.5">
                      <span className="font-semibold text-xs font-mono text-foregroundGrey">
                        {whiteWon ? "1 - 0" : blackWon ? "0 - 1" : "½ - ½"}
                      </span>
                      <span className={`inline-block h-2 w-2 rounded-full ${whiteWon ? "bg-winGreen" : blackWon ? "bg-lossRed" : "bg-foregroundGrey"}`} />
                    </div>
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap text-xs text-foregroundGrey">
                    <div>{formatTanggal(game.timestamp, locale)}</div>
                    <div className="text-[10px] text-foregroundGrey/75 font-mono uppercase tracking-wider">{game.timeClass || ""}</div>
                  </td>
                  <td className="py-2 px-2 text-right whitespace-nowrap text-xs font-semibold tabular-nums text-foreground">
                    {game.plyCount ?? "-"}
                  </td>
                  <td className="py-2 pl-2 pr-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => tanganiAnalisa(game)}
                        title={t("analisa.basisData.analisaSekarang")}
                        className="inline-flex items-center gap-1 rounded bg-backgroundBoxBoxHighlighted px-2.5 py-1 text-[11px] font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover cursor-pointer"
                      >
                        <IkonPlay className="h-2.5 w-2.5 fill-foregroundBlackDark shrink-0" />
                        <span>{t("analisa.basisData.analisaSekarang")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => tanganiSalinPgn(game)}
                        title={t("analisa.basisData.salinPgn")}
                        className="inline-flex items-center justify-center h-6 w-6 rounded border border-border bg-backgroundBoxBox text-foregroundGrey transition-colors hover:text-foregroundHighlighted hover:border-borderHighlighted cursor-pointer"
                      >
                        {isCopied ? <IkonCheck className="h-3 w-3 text-winGreen" /> : <IkonCopy className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => tanganiHapusPartai(e, game)}
                        title={t("analisa.basisData.hapusPartai")}
                        className="inline-flex items-center justify-center h-6 w-6 rounded border border-border bg-backgroundBoxBox text-lossRed transition-colors hover:bg-backgroundBoxBoxHover hover:border-lossRed/50 cursor-pointer"
                      >
                        <IkonTrash className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!memuat && daftarPartai.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-foregroundGrey">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Database width={32} height={32} className="fill-foregroundGrey/30 mb-1" />
                    <p className="font-bold text-foreground">{t("analisa.basisData.kosongJudul")}</p>
                    <p className="max-w-md text-xs leading-5 text-foregroundGrey">
                      {cari || filterHasil || filterWaktu
                        ? t("analisa.partai.tidakCocok")
                        : t("analisa.basisData.kosongIsi")}
                    </p>
                    {onBukaAkun && !cari && !filterHasil ? (
                      <button
                        type="button"
                        onClick={() => {
                          onTutup();
                          onBukaAkun();
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-1.5 text-xs font-bold text-foregroundBlackDark hover:bg-backgroundBoxBoxHighlightedHover cursor-pointer"
                      >
                        <span>{t("analisa.basisData.bukaAkun")}</span>
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Navigasi Paginasi */}
      {totalHal > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="text-foregroundGrey">
            {t("analisa.basisData.halaman", { aktif: aktifHal, total: totalHal })} ({totalPartai} partai)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={aktifHal <= 1}
              onClick={() => setHal((h) => Math.max(1, h - 1))}
              className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1 text-xs text-foreground transition-colors hover:bg-backgroundBoxBoxHover disabled:opacity-40 disabled:hover:bg-backgroundBoxBox cursor-pointer"
            >
              {t("analisa.basisData.sebelumnya")}
            </button>
            <button
              type="button"
              disabled={aktifHal >= totalHal}
              onClick={() => setHal((h) => Math.min(totalHal, h + 1))}
              className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1 text-xs text-foreground transition-colors hover:bg-backgroundBoxBoxHover disabled:opacity-40 disabled:hover:bg-backgroundBoxBox cursor-pointer"
            >
              {t("analisa.basisData.berikutnya")}
            </button>
          </div>
        </div>
      ) : null}
    </Popup>
  );
}
