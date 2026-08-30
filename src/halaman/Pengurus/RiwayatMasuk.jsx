import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ambilRiwayatMasuk,
  hapusRiwayatMasuk,
  bersihkanRiwayatMasuk,
} from "../../lib/api/index.js";
import { Tombol, Modal, Avatar } from "./ui.jsx";

/* ========================================================
   UTILITAS FORMAT WAKTU & PERANGKAT
   ======================================================== */

function formatWaktuLengkap(iso) {
  if (!iso) {
    return {
      hari: "—",
      tanggalBulan: "—",
      tahun: "—",
      jam: "—",
      lengkap: "—",
      relatif: "—",
    };
  }
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");

    const hari = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      timeZone: "Asia/Jakarta",
    }).format(d);

    const tanggalBulan = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      timeZone: "Asia/Jakarta",
    }).format(d);

    const tahun = new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(d);

    const jam =
      new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      }).format(d) + " WIB";

    // Waktu relatif
    const selisih = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
    let relatif = "baru saja";
    if (selisih >= 60 && selisih < 3600) {
      relatif = `${Math.round(selisih / 60)} menit lalu`;
    } else if (selisih >= 3600 && selisih < 86400) {
      relatif = `${Math.round(selisih / 3600)} jam lalu`;
    } else if (selisih >= 86400 && selisih < 604800) {
      relatif = `${Math.round(selisih / 86400)} hari lalu`;
    } else if (selisih >= 604800) {
      relatif = `${hari}, ${tanggalBulan} ${tahun}`;
    }

    return {
      hari,
      tanggalBulan,
      tahun,
      jam,
      lengkap: `${hari}, ${tanggalBulan} ${tahun} pukul ${jam}`,
      relatif,
    };
  } catch {
    return {
      hari: "—",
      tanggalBulan: "—",
      tahun: "—",
      jam: "—",
      lengkap: iso || "—",
      relatif: "—",
    };
  }
}

function ringkasPerangkat(ua) {
  if (!ua) return "Browser Web";
  const s = String(ua);

  let peramban = "Browser";
  if (s.includes("Edg/")) peramban = "Edge";
  else if (s.includes("Chrome/")) peramban = "Chrome";
  else if (s.includes("Firefox/")) peramban = "Firefox";
  else if (s.includes("Safari/") && !s.includes("Chrome")) peramban = "Safari";
  else if (s.includes("Opera") || s.includes("OPR/")) peramban = "Opera";

  let os = "Desktop";
  if (s.includes("Windows")) os = "Windows";
  else if (s.includes("Macintosh") || s.includes("Mac OS")) os = "macOS";
  else if (s.includes("Android")) os = "Android";
  else if (s.includes("iPhone") || s.includes("iPad") || s.includes("iOS"))
    os = "iOS";
  else if (s.includes("Linux")) os = "Linux";

  return `${peramban} (${os})`;
}

/* ========================================================
   KOMPONEN UTAMA: PanelRiwayatMasuk
   ======================================================== */

export default function PanelRiwayatMasuk({ beriTahu }) {
  const [riwayat, setRiwayat] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [cari, setCari] = useState("");
  const [filterWaktu, setFilterWaktu] = useState("semua");
  const [filterAkun, setFilterAkun] = useState("semua");
  const [sibuk, setSibuk] = useState("");
  const [targetHapus, setTargetHapus] = useState(null);
  const [konfirmasiBersihkan, setKonfirmasiBersihkan] = useState(false);

  const muatData = useCallback(async () => {
    setMemuat(true);
    try {
      const data = await ambilRiwayatMasuk();
      setRiwayat(Array.isArray(data) ? data : []);
    } catch (e) {
      beriTahu?.(e.message || "Gagal memuat riwayat masuk.", "galat");
    } finally {
      setMemuat(false);
    }
  }, [beriTahu]);

  useEffect(() => {
    muatData();
  }, [muatData]);

  const jalankan = async (kunci, fn, pesanSukses) => {
    setSibuk(kunci);
    try {
      await fn();
      if (pesanSukses) beriTahu?.(pesanSukses, "sukses");
      await muatData();
    } catch (e) {
      beriTahu?.(e.message || "Terjadi kesalahan.", "galat");
    } finally {
      setSibuk("");
    }
  };

  const eksekusiHapus = () => {
    const id = targetHapus?.id;
    setTargetHapus(null);
    if (!id) return;
    jalankan(
      `hapus-${id}`,
      async () => {
        await hapusRiwayatMasuk(id);
      },
      "Satu catatan riwayat masuk berhasil dihapus."
    );
  };

  const eksekusiBersihkan = () => {
    setKonfirmasiBersihkan(false);
    jalankan(
      "bersihkan-semua",
      async () => {
        await bersihkanRiwayatMasuk();
      },
      "Seluruh riwayat masuk berhasil dibersihkan."
    );
  };

  /* Statistik ringkas */
  const akunUnik = useMemo(() => {
    const setAkun = new Set(riwayat.map((r) => r.username).filter(Boolean));
    return Array.from(setAkun).sort();
  }, [riwayat]);

  const jumlahHariIni = useMemo(() => {
    const sekarang = new Date();
    const tglSekarang = sekarang.toISOString().slice(0, 10);
    return riwayat.filter(
      (r) => r.waktu && r.waktu.slice(0, 10) === tglSekarang
    ).length;
  }, [riwayat]);

  /* Penyaringan data */
  const hasilTersaring = useMemo(() => {
    let hasil = [...riwayat];

    // Filter teks (username atau IP)
    const q = cari.trim().toLowerCase();
    if (q) {
      hasil = hasil.filter(
        (r) =>
          (r.username && r.username.toLowerCase().includes(q)) ||
          (r.ip && r.ip.toLowerCase().includes(q))
      );
    }

    // Filter akun Chess.com
    if (filterAkun !== "semua") {
      hasil = hasil.filter((r) => r.username === filterAkun);
    }

    // Filter rentang waktu
    if (filterWaktu !== "semua") {
      const kini = Date.now();
      if (filterWaktu === "hari-ini") {
        const tglSekarang = new Date().toISOString().slice(0, 10);
        hasil = hasil.filter(
          (r) => r.waktu && r.waktu.slice(0, 10) === tglSekarang
        );
      } else if (filterWaktu === "7-hari") {
        const batas = kini - 7 * 24 * 60 * 60 * 1000;
        hasil = hasil.filter(
          (r) => r.waktu && new Date(r.waktu).getTime() >= batas
        );
      } else if (filterWaktu === "30-hari") {
        const batas = kini - 30 * 24 * 60 * 60 * 1000;
        hasil = hasil.filter(
          (r) => r.waktu && new Date(r.waktu).getTime() >= batas
        );
      }
    }

    return hasil;
  }, [riwayat, cari, filterAkun, filterWaktu]);

  return (
    <div className="space-y-6">
      {/* ── Header Bagian ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              Riwayat Masuk Pengurus
            </h2>
            <span className="text-xs font-semibold text-slate-600">
              {riwayat.length} Catatan
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Mendeteksi dan mencatat siapa saja yang login ke bagian pengurus
            berdasarkan akun Chess.com, hari, tanggal, bulan, tahun, jam, serta
            alamat IP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tombol
            anak={memuat ? "Memuat…" : "Muat Ulang"}
            onClick={muatData}
            disabled={memuat || sibuk !== ""}
          />
          {riwayat.length > 0 && (
            <Tombol
              anak="Bersihkan Semua"
              jenis="bahaya"
              onClick={() => setKonfirmasiBersihkan(true)}
              disabled={sibuk !== ""}
            />
          )}
        </div>
      </div>

      {/* ── Statistik Kartu ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-b border-slate-300 pb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Sesi Masuk
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {riwayat.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Sepanjang riwayat</p>
        </div>

        <div className="border-b border-slate-300 pb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Akun Pengurus
          </p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {akunUnik.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Akun Chess.com unik</p>
        </div>

        <div className="border-b border-slate-300 pb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Hari Ini
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {jumlahHariIni}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Aktivitas masuk hari ini</p>
        </div>

        <div className="border-b border-slate-300 pb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Masuk Terakhir
          </p>
          <p className="mt-1 truncate text-lg font-bold text-slate-900">
            {riwayat[0]?.username ? `@${riwayat[0].username}` : "—"}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {riwayat[0]?.waktu
              ? formatWaktuLengkap(riwayat[0].waktu).relatif
              : "Belum ada"}
          </p>
        </div>
      </div>

      {/* ── Filter & Pencarian ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Cari Akun/IP:
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="contoh: magnuscarlsen atau IP"
            className="w-64 border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-sm outline-none focus:border-primary"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          Akun Pengurus:
          <select
            value={filterAkun}
            onChange={(e) => setFilterAkun(e.target.value)}
            className="border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-sm outline-none focus:border-primary"
          >
            <option value="semua">Semua Akun ({akunUnik.length})</option>
            {akunUnik.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          Rentang Waktu:
          <select
            value={filterWaktu}
            onChange={(e) => setFilterWaktu(e.target.value)}
            className="border-0 border-b border-slate-300 bg-transparent px-1 py-1 text-sm outline-none focus:border-primary"
          >
            <option value="semua">Semua Waktu</option>
            <option value="hari-ini">Hari Ini</option>
            <option value="7-hari">7 Hari Terakhir</option>
            <option value="30-hari">30 Hari Terakhir</option>
          </select>
        </label>

        {(cari || filterAkun !== "semua" || filterWaktu !== "semua") && (
          <button
            type="button"
            onClick={() => {
              setCari("");
              setFilterAkun("semua");
              setFilterWaktu("semua");
            }}
            className="rounded px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* ── Tabel Riwayat ─────────────────────────────────── */}
      {memuat ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Memuat catatan riwayat masuk…
        </div>
      ) : riwayat.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-3 text-sm font-bold text-slate-900">
            Belum ada riwayat masuk tercatat
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Setiap kali pengurus memasukkan username Chess.com dan token di
            gerbang login, jejaknya akan otomatis tersimpan dan muncul di sini.
          </p>
        </div>
      ) : hasilTersaring.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Tidak ada riwayat yang cocok dengan filter pencarian.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Coba gunakan kata kunci atau rentang tanggal lain.
          </p>
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>#</th>
                <th>Akun Chess.com</th>
                <th>Hari</th>
                <th>Tanggal, Bulan, Tahun</th>
                <th>Jam / Waktu</th>
                <th>Alamat IP</th>
                <th>Perangkat</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {hasilTersaring.map((item, idx) => {
                const waktu = formatWaktuLengkap(item.waktu);
                const perangkat = ringkasPerangkat(item.userAgent);

                return (
                  <tr key={item.id || idx}>
                    {/* Nomor Urut */}
                    <td className="text-center text-xs font-medium text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Akun Chess.com */}
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar username={item.username || "pengurus"} />
                        <div>
                          <a
                            href={`https://www.chess.com/member/${encodeURIComponent(
                              item.username || ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-slate-900 hover:text-primary hover:underline"
                            title={`Buka profil ${item.username} di Chess.com`}
                          >
                            {item.username || "pengurus"}
                          </a>
                          <p className="text-[11px] text-slate-400">
                            Pengurus Komunitas
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Hari */}
                    <td className="whitespace-nowrap text-slate-700">
                      {waktu.hari}
                    </td>

                    {/* Tanggal, Bulan, Tahun */}
                    <td className="whitespace-nowrap">
                      <p className="font-semibold text-slate-800">
                        {waktu.tanggalBulan}
                      </p>
                      <p className="text-xs text-slate-400">{waktu.tahun}</p>
                    </td>

                    {/* Jam / Waktu */}
                    <td className="whitespace-nowrap">
                      <p className="font-mono text-xs font-semibold text-slate-900">
                        {waktu.jam}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {waktu.relatif}
                      </p>
                    </td>

                    {/* Alamat IP */}
                    <td className="whitespace-nowrap">
                      <code className="text-xs text-slate-700">
                        {item.ip || "127.0.0.1"}
                      </code>
                    </td>

                    {/* Perangkat */}
                    <td
                      className="text-xs text-slate-600 max-w-[160px] truncate"
                      title={item.userAgent || perangkat}
                    >
                      {perangkat}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-700">
                        Masuk
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="whitespace-nowrap">
                      <Tombol
                        anak="Hapus"
                        kecil
                        jenis="bahaya"
                        title="Hapus entri riwayat ini"
                        onClick={() => setTargetHapus(item)}
                        disabled={sibuk === `hapus-${item.id}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Konfirmasi Hapus Satu Entri ──────────────── */}
      <Modal
        terbuka={Boolean(targetHapus)}
        judul="Hapus Catatan Riwayat Masuk?"
        labelKonfirmasi="Hapus"
        jenisKonfirmasi="bahaya"
        sibuk={sibuk === `hapus-${targetHapus?.id}`}
        onBatal={() => setTargetHapus(null)}
        onKonfirmasi={eksekusiHapus}
      >
        {targetHapus && (
          <p>
            Hapus catatan masuk untuk akun{" "}
            <span className="font-bold text-slate-900">
              {targetHapus.username}
            </span>{" "}
            pada{" "}
            <span className="font-medium text-slate-700">
              {formatWaktuLengkap(targetHapus.waktu).lengkap}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>
        )}
      </Modal>

      {/* ── Modal Konfirmasi Bersihkan Semua ───────────────── */}
      <Modal
        terbuka={konfirmasiBersihkan}
        judul="Bersihkan Seluruh Riwayat Masuk?"
        labelKonfirmasi="Bersihkan Semua"
        jenisKonfirmasi="bahaya"
        sibuk={sibuk === "bersihkan-semua"}
        onBatal={() => setKonfirmasiBersihkan(false)}
        onKonfirmasi={eksekusiBersihkan}
      >
        <p>
          Anda akan menghapus seluruh catatan riwayat masuk pengurus (
          {riwayat.length} sesi). Tindakan ini tidak dapat dikembalikan.
        </p>
      </Modal>
    </div>
  );
}
