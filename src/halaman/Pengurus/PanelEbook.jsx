import { useCallback, useEffect, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { Modal, KotakGalatMuat } from "./ui.jsx";
import EbookTerbit from "./PanelEbook/Terbit.jsx";
import EbookPermintaan from "./PanelEbook/Permintaan.jsx";
import EbookKode from "./PanelEbook/Kode.jsx";
import EbookUnduhan from "./PanelEbook/Unduhan.jsx";

/**
 * Panel "Kode E-Book" — gerbang unduh e-book model perpustakaan.
 *
 * Wadah ini memuat data sekali lalu menampilkan satu dari empat halaman
 * (Terbit, Permintaan, Daftar kode, Jejak unduhan) lewat bar tab.
 */
export default function PanelEbook({ beriTahu, halaman, onGantiHalaman }) {
  const [halamanDalam, setHalamanDalam] = useState("terbit");
  const halamanAktif = halaman ?? halamanDalam;
  const aturHalaman = onGantiHalaman ?? setHalamanDalam;
  const [kode, setKode] = useState([]);
  const [unduhan, setUnduhan] = useState([]);
  const [minta, setMinta] = useState([]);
  const [cariMinta, setCariMinta] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [kodeBaru, setKodeBaru] = useState(null);
  const [targetHapus, setTargetHapus] = useState(null);
  const [kini, setKini] = useState(() => Date.now());

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat(false);
    try {
      const [daftarKode, jejak, pengajuan] = await Promise.all([
        apiPengurus("/ebook/kode"),
        apiPengurus("/ebook/unduhan"),
        apiPengurus("/ebook/minta"),
      ]);
      setKode(Array.isArray(daftarKode) ? daftarKode : []);
      setUnduhan(Array.isArray(jejak) ? jejak : []);
      setMinta(Array.isArray(pengajuan) ? pengajuan : []);
    } catch (e) {
      beriTahu(e.message, "galat");
      setGalat(true);
    } finally {
      setMemuat(false);
    }
  }, [beriTahu]);

  useEffect(() => {
    muat();
  }, [muat]);

  // Segarkan badge "sisa menit" tiap setengah menit.
  useEffect(() => {
    const jam = setInterval(() => setKini(Date.now()), 30_000);
    return () => clearInterval(jam);
  }, []);

  /** Terbitkan kode; mengembalikan hasil untuk dialog (sukses/gagal). */
  async function terbit(panggilan, catatan) {
    const siapa = panggilan.trim();
    if (!siapa) {
      return { status: "gagal", pesan: "Nama panggilan harus diisi dulu." };
    }
    setSibuk(true);
    try {
      const hasil = await apiPengurus("/ebook/kode", {
        metode: "POST",
        bodi: { panggilan: siapa, catatan: catatan.trim() },
      });
      setKodeBaru(hasil);
      beriTahu(`Kode ${hasil.kode} untuk ${hasil.panggilan} terbit (berlaku 1 jam).`);
      await muat();
      return {
        status: "sukses",
        kode: hasil.kode,
        panggilan: hasil.panggilan,
      };
    } catch (e) {
      beriTahu(e.message, "galat");
      return { status: "gagal", pesan: e.message };
    } finally {
      setSibuk(false);
    }
  }

  async function hapus() {
    if (!targetHapus) return;
    setSibuk(true);
    try {
      await apiPengurus("/ebook/kode/hapus", {
        metode: "POST",
        bodi: { kode: targetHapus.kode },
      });
      beriTahu(`Kode ${targetHapus.kode} dihapus.`);
      setTargetHapus(null);
      await muat();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk(false);
    }
  }

  async function setujui(m) {
    setSibuk(true);
    try {
      const kodeHasil = await apiPengurus(`/ebook/minta/${m.id}/terbitkan`, {
        metode: "POST",
      });
      setKodeBaru(kodeHasil);
      beriTahu(`Kode ${kodeHasil.kode} terbit untuk ${kodeHasil.panggilan} — sampaikan lewat WA/grup.`);
      await muat();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk(false);
    }
  }

  async function tolak(m) {
    setSibuk(true);
    try {
      await apiPengurus(`/ebook/minta/${m.id}/tolak`, { metode: "POST" });
      beriTahu(`Permintaan ${m.nama} ditolak.`);
      await muat();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk(false);
    }
  }

  function salinManual(kodeTeks) {
    try {
      const ta = document.createElement("textarea");
      ta.value = kodeTeks;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) {
        beriTahu(`Kode ${kodeTeks} disalin.`);
      } else {
        beriTahu("Gagal menyalin — salin manual dari tabel.", "galat");
      }
    } catch {
      beriTahu("Gagal menyalin — salin manual dari tabel.", "galat");
    }
  }

  function salin(kodeTeks) {
    // Clipboard API hanya tersedia di konteks aman (https/localhost).
    const papan = navigator.clipboard;
    if (papan?.writeText) {
      papan.writeText(kodeTeks).then(
        () => beriTahu(`Kode ${kodeTeks} disalin.`),
        () => salinManual(kodeTeks),
      );
    } else {
      salinManual(kodeTeks);
    }
  }

  const aktif = kode.filter((k) => !k.kadaluarsa);
  const menunggu = minta.filter((m) => m.status === "menunggu").length;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b-2 border-slate-200 pb-5">
        <h2 className="text-lg font-semibold text-slate-900">Kode E-Book</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Gerbang unduh e-book model perpustakaan: {menunggu} permintaan
          menunggu, {aktif.length} kode aktif, {unduhan.length}{" "}
          unduhan tercatat
        </p>
      </div>

      {galat && !memuat && (
        <KotakGalatMuat
          pesan="Data e-book gagal dimuat. Periksa koneksi lalu coba lagi."
          onCobaLagi={muat}
        />
      )}

      {/* ── Halaman aktif ──────────────────────────────────── */}
      {memuat ? (
        <p className="py-8 text-center text-sm text-slate-500">Memuat…</p>
      ) : halamanAktif === "terbit" ? (
        <EbookTerbit
          onTerbit={terbit}
          sibuk={sibuk}
          kodeBaru={kodeBaru}
          onTutupKodeBaru={() => setKodeBaru(null)}
          onSalin={salin}
        />
      ) : halamanAktif === "minta" ? (
        <EbookPermintaan
          minta={minta}
          cariMinta={cariMinta}
          onCariMinta={setCariMinta}
          sibuk={sibuk}
          onTerbitkan={setujui}
          onTolak={tolak}
        />
      ) : halamanAktif === "kode" ? (
        <EbookKode
          kode={kode}
          kini={kini}
          sibuk={sibuk}
          onSalin={salin}
          onHapus={setTargetHapus}
          onMuat={muat}
        />
      ) : (
        <EbookUnduhan unduhan={unduhan} />
      )}

      <Modal
        terbuka={!!targetHapus}
        judul="Hapus kode akses?"
        anak={
          targetHapus && (
            <p>
              Kode <span className="font-mono font-bold">{targetHapus.kode}</span> atas
              nama <strong>{targetHapus.panggilan}</strong> tidak bisa dipakai lagi
              setelah dihapus. Jejak unduhan yang sudah tercatat tetap tersimpan.
            </p>
          )
        }
        labelKonfirmasi="Hapus"
        jenisKonfirmasi="bahaya"
        sibuk={sibuk}
        onKonfirmasi={hapus}
        onBatal={() => setTargetHapus(null)}
      />
    </div>
  );
}