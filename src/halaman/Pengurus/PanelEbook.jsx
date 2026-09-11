import { useCallback, useEffect, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { Tombol, Modal, KotakGalatMuat } from "./ui.jsx";

/** Waktu singkat id-ID, cth. "8 Sep 2026, 14.05". */
function formatWaktu(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Sisa umur kode dalam menit (dibulatkan ke atas). */
function sisaMenit(isoKedaluwarsa, kini) {
  return Math.max(0, Math.ceil((new Date(isoKedaluwarsa).getTime() - kini) / 60000));
}

/**
 * Panel "Kode E-Book" — gerbang unduh e-book model perpustakaan.
 *
 * Pengurus menerbitkan kode akses 1 jam atas nama panggilan peminjam,
 * lalu memantau siapa yang mengunduh buku apa lewat jejak unduhan.
 */
export default function PanelEbook({ beriTahu }) {
  const [kode, setKode] = useState([]);
  const [unduhan, setUnduhan] = useState([]);
  const [minta, setMinta] = useState([]);
  const [cariMinta, setCariMinta] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(false);
  const [panggilan, setPanggilan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [salahPanggilan, setSalahPanggilan] = useState(false);
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

  async function terbitkan(e) {
    e.preventDefault();
    const siapa = panggilan.trim();
    if (!siapa) {
      setSalahPanggilan(true);
      return;
    }
    setSalahPanggilan(false);
    setSibuk(true);
    try {
      const hasil = await apiPengurus("/ebook/kode", {
        metode: "POST",
        bodi: { panggilan: siapa, catatan: catatan.trim() },
      });
      setKodeBaru(hasil);
      setPanggilan("");
      setCatatan("");
      beriTahu(`Kode ${hasil.kode} untuk ${hasil.panggilan} terbit (berlaku 1 jam).`);
      await muat();
    } catch (e2) {
      beriTahu(e2.message, "galat");
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

  function salin(kodeTeks) {
    // Clipboard API hanya tersedia di konteks aman (https/localhost).
    // Fallback: pilih teks di elemen <textarea> tersembunyi lalu execCommand.
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

  /** Render tautan ke profil Chess.com yang aman (tidak membuat tautan kosong). */
  function tautanAkun(akun) {
    const id = (akun || "").trim();
    if (!id) return <span className="text-slate-400">—</span>;
    return (
      <a
        href={`https://www.chess.com/member/${encodeURIComponent(id)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        @{id}
      </a>
    );
  }

  const aktif = kode.filter((k) => !k.kadaluarsa);
  const mintaTersaring = minta.filter((m) => {
    const kunci = cariMinta.trim().toLowerCase();
    if (!kunci) return true;
    return (
      m.nama?.toLowerCase().includes(kunci) ||
      m.akunChess?.toLowerCase().includes(kunci)
    );
  });

  const headerKolom = (teks) => <th scope="col">{teks}</th>;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-lg font-semibold text-slate-900">Kode E-Book</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Gerbang unduh e-book model perpustakaan: {minta.filter((m) => m.status === "menunggu").length}{" "}
          permintaan menunggu, {aktif.length} kode aktif, {unduhan.length}{" "}
          unduhan tercatat
        </p>
      </div>

      {/* ── Terbitkan kode ─────────────────────────────────── */}
      <form
        onSubmit={terbitkan}
        noValidate
        className="flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Panggilan peminjam
          <input
            type="text"
            name="panggilan"
            value={panggilan}
            onChange={(e) => {
              setPanggilan(e.target.value);
              setSalahPanggilan(false);
            }}
            placeholder="cth. Budi"
            maxLength={30}
            autoComplete="off"
            className={`w-52 rounded border px-2.5 py-1.5 text-sm outline-none ${
              salahPanggilan
                ? "border-red-500 focus:border-red-500"
                : "border-slate-300 focus:border-primary"
            }`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Catatan (opsional)
          <input
            type="text"
            name="catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="cth. anggota baru, latihan rutin"
            maxLength={120}
            autoComplete="off"
            className="w-72 rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
        </label>
        {/* Tombol submit HARUS type="submit" agar Enter di input bisa
            mengirimkan form. Komponen <Tombol> hardcoded type="button",
            jadi kita pakai <button> native di sini. */}
        <button
          type="submit"
          disabled={sibuk}
          className="rounded-lg border border-black px-4 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-40"
        >
          {sibuk ? "Menerbitkan…" : "Terbitkan kode (1 jam)"}
        </button>
      </form>

      {galat && !memuat && (
        <KotakGalatMuat
          pesan="Data e-book gagal dimuat. Periksa koneksi lalu coba lagi."
          onCobaLagi={muat}
        />
      )}

      {kodeBaru && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center gap-3 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm"
        >
          <div className="flex-1">
            <p className="text-emerald-800">
              Kode untuk <span className="font-semibold">{kodeBaru.panggilan}</span>:
              <span className="ml-2 rounded bg-white px-2 py-0.5 font-mono font-bold tracking-wide text-emerald-900 ring-1 ring-emerald-300">
                {kodeBaru.kode}
              </span>
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Berlaku sampai {formatWaktu(kodeBaru.kedaluwarsa)} WIB. Sampaikan
              ke peminjam, lalu dia mengisi nama asli + akun Chess.com + kode
              ini pada popup unduh.
            </p>
          </div>
          <Tombol kecil onClick={() => salin(kodeBaru.kode)} disabled={sibuk}>
            Salin kode
          </Tombol>
          <Tombol
            kecil
            onClick={() => setKodeBaru(null)}
            aria-label="Tutup notifikasi kode terbit"
          >
            Tutup
          </Tombol>
        </div>
      )}

      {/* ── Permintaan kode ────────────────────────────────── */}
      <section
        aria-labelledby="permintaan-kode-judul"
        className="rounded border border-slate-200 bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <div>
            <h3 id="permintaan-kode-judul" className="text-sm font-semibold text-slate-900">
              Permintaan kode
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Orang yang mengajukan lewat popup unduh. Cari namanya, lalu
              terbitkan kodenya dan kirimkan lewat WA/grup.
            </p>
          </div>
          <input
            type="search"
            value={cariMinta}
            onChange={(e) => setCariMinta(e.target.value)}
            placeholder="Cari nama / akun…"
            aria-label="Cari permintaan"
            className="w-56 rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
        </div>
        {memuat ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Memuat…</p>
        ) : mintaTersaring.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            {cariMinta.trim()
              ? "Tidak ada permintaan yang cocok dengan pencarian."
              : "Belum ada permintaan kode."}
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="tabel-kci" aria-describedby="permintaan-kode-judul">
              <thead>
                <tr>
                  {headerKolom("Waktu")}
                  {headerKolom("Nama asli")}
                  {headerKolom("Akun Chess.com")}
                  {headerKolom("Ingin mengunduh")}
                  {headerKolom("Status")}
                  {headerKolom("Aksi")}
                </tr>
              </thead>
              <tbody>
                {mintaTersaring.map((m, i) => (
                  <tr key={m.id || i} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="whitespace-nowrap text-xs">{formatWaktu(m.waktu)}</td>
                    <td className="font-medium text-slate-900">{m.nama}</td>
                    <td>{tautanAkun(m.akunChess)}</td>
                    <td className="max-w-[200px] truncate text-xs text-slate-500" title={m.judul || ""}>
                      {m.judul || "—"}
                    </td>
                    <td>
                      {m.status === "menunggu" ? (
                        <span className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Menunggu
                        </span>
                      ) : m.status === "diterbitkan" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Diterbitkan
                          <span className="font-mono font-bold">{m.kode}</span>
                        </span>
                      ) : (
                        <span className="inline-flex rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Ditolak
                        </span>
                      )}
                    </td>
                    <td>
                      {m.status === "menunggu" ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={sibuk}
                            onClick={() => setujui(m)}
                            className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-40"
                          >
                            Terbitkan kode
                          </button>
                          <button
                            type="button"
                            disabled={sibuk}
                            onClick={() => tolak(m)}
                            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {formatWaktu(m.diputus)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Tabel kode ─────────────────────────────────────── */}
      <section
        aria-labelledby="daftar-kode-judul"
        className="rounded border border-slate-200 bg-white"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 id="daftar-kode-judul" className="text-sm font-semibold text-slate-900">
            Daftar kode akses
          </h3>
          <Tombol kecil onClick={muat} disabled={memuat || sibuk}>
            Segarkan
          </Tombol>
        </div>
        {memuat ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Memuat…</p>
        ) : kode.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Belum ada kode. Terbitkan kode pertama lewat formulir di atas.
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="tabel-kci" aria-describedby="daftar-kode-judul">
              <thead>
                <tr>
                  {headerKolom("Panggilan")}
                  {headerKolom("Kode")}
                  {headerKolom("Status")}
                  {headerKolom("Diterbitkan")}
                  {headerKolom("Kedaluwarsa")}
                  {headerKolom("Unduhan")}
                  {headerKolom("Catatan")}
                  {headerKolom("Aksi")}
                </tr>
              </thead>
              <tbody>
                {kode.map((k, i) => (
                  <tr key={k.kode} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="font-medium text-slate-900">{k.panggilan}</td>
                    <td>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-slate-800">
                        {k.kode}
                      </span>
                    </td>
                    <td>
                      {k.kadaluarsa ? (
                        <span className="inline-flex rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Kedaluwarsa
                        </span>
                      ) : (
                        <span
                          className="inline-flex rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          title={`Sisa ${sisaMenit(k.kedaluwarsa, kini)} menit lagi`}
                        >
                          Aktif · {sisaMenit(k.kedaluwarsa, kini)} mnt
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-xs">{formatWaktu(k.dibuat)}</td>
                    <td className="whitespace-nowrap text-xs">{formatWaktu(k.kedaluwarsa)}</td>
                    <td className="text-center text-xs">{k.jumlahUnduhan || 0}×</td>
                    <td className="max-w-[180px] truncate text-xs text-slate-500" title={k.catatan || ""}>
                      {k.catatan || "—"}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => salin(k.kode)}
                          disabled={sibuk}
                          className="text-xs font-medium text-primary hover:underline disabled:opacity-40"
                        >
                          Salin
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetHapus(k)}
                          disabled={sibuk}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Jejak unduhan ──────────────────────────────────── */}
      <section
        aria-labelledby="jejak-unduhan-judul"
        className="rounded border border-slate-200 bg-white"
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 id="jejak-unduhan-judul" className="text-sm font-semibold text-slate-900">
            Jejak unduhan
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Siapa yang mengunduh, memakai kode siapa, dan buku apa — terbaru di
            atas (maksimal 1000 catatan terakhir).
          </p>
        </div>
        {memuat ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Memuat…</p>
        ) : unduhan.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Belum ada unduhan yang tercatat.
          </p>
        ) : (
          <div className="overflow-auto">
            <table className="tabel-kci" aria-describedby="jejak-unduhan-judul">
              <thead>
                <tr>
                  {headerKolom("Waktu")}
                  {headerKolom("Nama asli")}
                  {headerKolom("Akun Chess.com")}
                  {headerKolom("Kode")}
                  {headerKolom("Buku")}
                </tr>
              </thead>
              <tbody>
                {unduhan.map((u, i) => (
                  <tr key={u.id || i} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                    <td className="whitespace-nowrap text-xs">{formatWaktu(u.waktu)}</td>
                    <td className="font-medium text-slate-900">{u.nama}</td>
                    <td>{tautanAkun(u.akunChess)}</td>
                    <td className="whitespace-nowrap text-xs">
                      <span className="font-mono">{u.kode}</span>
                      <span className="ml-1 text-slate-500">({u.panggilan})</span>
                    </td>
                    <td
                      className="max-w-[280px] truncate text-xs"
                      title={u.judul || ""}
                    >
                      {u.judul || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
  