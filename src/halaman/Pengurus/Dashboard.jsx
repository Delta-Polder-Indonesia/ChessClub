import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiPengurus,
  tokenPengurus,
  ambilDaftarAnggota,
  ambilDaftarHitam,
} from "../../lib/chessAnggota.js";
import PanelTurnamen from "./PanelTurnamen.jsx";
import Gerbang from "./Gerbang.jsx";
import { Tombol, Bidang } from "./ui.jsx";

/**
 * Dashboard pengurus — mengelola keanggotaan, daftar larangan, dan turnamen
 * lewat antarmuka web, tanpa perlu perintah terminal.
 *
 * Halaman ini sengaja TIDAK ditautkan dari menu publik. Aksesnya dijaga
 * token pengurus yang sama dengan endpoint /api/pengurus/*.
 */

/* -------------------------------------------------------- komponen kecil */

function Kartu({ label, nilai, catatan, warna = "slate" }) {
  const warnaTeks = {
    slate: "text-slate-900",
    merah: "text-red-700",
    hijau: "text-emerald-700",
    biru: "text-primary",
  }[warna];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${warnaTeks}`}>{nilai}</p>
      {catatan && <p className="mt-0.5 text-xs text-slate-500">{catatan}</p>}
    </div>
  );
}

/* --------------------------------------------------------- panel anggota */

function PanelAnggota({ anggota, hitam, muatUlang, beriTahu }) {
  const [sibuk, setSibuk] = useState("");
  const [cariNomor, setCariNomor] = useState("");
  const [hasilNomor, setHasilNomor] = useState(null);

  const jalankan = async (kunci, fn) => {
    setSibuk(kunci);
    try {
      await fn();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk("");
    }
  };

  const blokir = (username) => {
    const alasan = window.prompt(
      `Alasan memblokir "${username}"?`,
      "Terbukti menggunakan bantuan engine."
    );
    if (alasan === null) return;
    jalankan(`blokir-${username}`, async () => {
      await apiPengurus("/blokir", {
        metode: "POST",
        bodi: { username, keterangan: alasan },
      });
      beriTahu(`"${username}" dipindahkan ke daftar larangan.`, "sukses");
      await muatUlang();
    });
  };

  const buka = (username) => {
    if (!window.confirm(`Cabut larangan untuk "${username}"?`)) return;
    jalankan(`buka-${username}`, async () => {
      await apiPengurus("/buka", { metode: "POST", bodi: { username } });
      beriTahu(`Larangan "${username}" dicabut.`, "sukses");
      await muatUlang();
    });
  };

  const pindai = () =>
    jalankan("pindai", async () => {
      const h = await apiPengurus("/pindai", { metode: "POST" });
      beriTahu(
        `Pemindaian selesai: ${h.diperiksa} diperiksa, ${h.diblokir.length} diblokir.`,
        h.diblokir.length ? "peringatan" : "sukses"
      );
      await muatUlang();
    });

  const cekNomor = async (e) => {
    e.preventDefault();
    setHasilNomor(null);
    try {
      const h = await apiPengurus("/cek-nomor", {
        metode: "POST",
        bodi: { hp: cariNomor },
      });
      setHasilNomor(h);
    } catch (err) {
      beriTahu(err.message, "galat");
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">
            Anggota ({anggota.length})
          </h2>
          <Tombol
            anak={sibuk === "pindai" ? "Memindai…" : "Pindai ban fair play"}
            onClick={pindai}
            disabled={sibuk === "pindai"}
            jenis="utama"
          />
        </div>
        <p className="mb-3 text-xs leading-5 text-slate-500">
          Pemindaian memeriksa setiap anggota ke Chess.com. Yang akunnya ditutup
          karena pelanggaran fair play otomatis masuk daftar larangan.
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Akun</th>
                <th className="px-3 py-2 font-semibold">Panggilan</th>
                <th className="px-3 py-2 font-semibold">Kota</th>
                <th className="px-3 py-2 font-semibold">Elo</th>
                <th className="px-3 py-2 font-semibold">Verifikasi</th>
                <th className="px-3 py-2 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {anggota.map((a) => (
                <tr key={a.username} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      {a.username}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{a.panggilan || "—"}</td>
                  <td className="px-3 py-2 text-slate-700">{a.kota || "—"}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {a.elo ? `${a.elo} ${a.kontrol || ""}` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {a.terverifikasi ? (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                        {a.caraVerifikasi === "oauth" ? "login" : "kode"}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">belum</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Tombol
                      anak="Blokir"
                      jenis="bahaya"
                      kecil
                      onClick={() => blokir(a.username)}
                      disabled={sibuk === `blokir-${a.username}`}
                    />
                  </td>
                </tr>
              ))}
              {!anggota.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    Belum ada anggota.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-slate-900">
          Daftar Larangan ({hitam.length})
        </h2>
        <form onSubmit={cekNomor} className="mb-4 flex flex-wrap items-end gap-2">
          <Bidang
            label="Cek nomor HP di daftar larangan"
            value={cariNomor}
            onChange={(e) => setCariNomor(e.target.value)}
            placeholder="0812-3456-7890"
          />
          <Tombol anak="Periksa" onClick={cekNomor} />
          {hasilNomor && (
            <span
              className={`rounded px-2.5 py-1.5 text-xs font-semibold ${
                hasilNomor.diblokir
                  ? "bg-red-50 text-red-800"
                  : "bg-emerald-50 text-emerald-800"
              }`}
            >
              {hasilNomor.diblokir
                ? `Diblokir — cocok dengan ${hasilNomor.username} (${hasilNomor.cocokPada})`
                : "Aman, tidak ada di daftar larangan"}
            </span>
          )}
        </form>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Akun</th>
                <th className="px-3 py-2 font-semibold">Alasan</th>
                <th className="px-3 py-2 font-semibold">Sumber</th>
                <th className="px-3 py-2 font-semibold">Sejak</th>
                <th className="px-3 py-2 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {hitam.map((h) => (
                <tr key={h.username} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {h.username}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {h.alasan === "fair_play_violations"
                      ? "Pelanggaran fair play"
                      : "Keputusan pengurus"}
                    {h.keterangan && (
                      <span className="block text-xs text-slate-500">
                        {h.keterangan}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                        h.sumber === "otomatis"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {h.sumber}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {String(h.diblokirPada || "").slice(0, 10)}
                  </td>
                  <td className="px-3 py-2">
                    <Tombol
                      anak="Cabut"
                      kecil
                      onClick={() => buka(h.username)}
                      disabled={sibuk === `buka-${h.username}`}
                    />
                  </td>
                </tr>
              ))}
              {!hitam.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Daftar larangan kosong.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------- halaman */

export default function Dashboard() {
  const [masuk, setMasuk] = useState(Boolean(tokenPengurus.ambil()));
  const [tab, setTab] = useState("anggota");
  const [ringkas, setRingkas] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [hitam, setHitam] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [kabar, setKabar] = useState(null);

  // Timer disimpan agar pesan baru tidak ikut terhapus oleh timer pesan
  // sebelumnya — tanpa ini kabar kedua bisa lenyap dalam sekejap.
  const jamKabar = useRef(null);
  const beriTahu = useCallback((teks, jenis = "sukses") => {
    setKabar({ teks, jenis });
    if (jamKabar.current) clearTimeout(jamKabar.current);
    jamKabar.current = setTimeout(() => setKabar(null), 8000);
  }, []);

  useEffect(() => () => clearTimeout(jamKabar.current), []);

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

  if (!masuk) return <Gerbang onMasuk={() => setMasuk(true)} />;

  const keluar = () => {
    tokenPengurus.hapus();
    setMasuk(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Dashboard Pengurus
            </h1>
            <p className="text-sm text-slate-600">
              Komunitas Catur Indonesia
            </p>
          </div>
          <div className="flex gap-2">
            <Tombol anak="Muat ulang" onClick={muatUlang} disabled={memuat} />
            <Tombol anak="Keluar" onClick={keluar} />
          </div>
        </header>

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

        {ringkas && (
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kartu label="Anggota" nilai={ringkas.anggota} warna="biru" />
            <Kartu
              label="Daftar larangan"
              nilai={ringkas.daftarHitam}
              catatan={`${ringkas.otomatis} otomatis / ${ringkas.pengurus} pengurus`}
              warna={ringkas.daftarHitam ? "merah" : "slate"}
            />
            <Kartu
              label="Turnamen"
              nilai={ringkas.turnamen?.total ?? 0}
              catatan={`${ringkas.turnamen?.berlangsung ?? 0} berlangsung`}
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

        <nav className="mb-5 flex gap-1 border-b border-slate-200">
          {[
            ["anggota", "Anggota & Larangan"],
            ["turnamen", "Turnamen"],
          ].map(([kunci, label]) => (
            <button
              key={kunci}
              type="button"
              onClick={() => setTab(kunci)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === kunci
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {memuat && !ringkas ? (
          <p className="py-10 text-center text-sm text-slate-500">Memuat…</p>
        ) : tab === "anggota" ? (
          <PanelAnggota
            anggota={anggota}
            hitam={hitam}
            muatUlang={muatUlang}
            beriTahu={beriTahu}
          />
        ) : (
          <PanelTurnamen
            beriTahu={beriTahu}
            anggota={anggota}
            muatUlang={muatUlang}
          />
        )}
      </div>
    </div>
  );
}
