import { useEffect, useState } from "react";
import PanelRiwayatMasuk from "./RiwayatMasuk.jsx";
import { infoAdmin, gantiPasswordAdmin, tokenPengurus, adminPengguna } from "../../lib/api/index.js";

const MENU_PENGATURAN = [
  {
    kunci: "akun",
    label: "Akun & Password",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    kunci: "riwayat-masuk",
    label: "Riwayat Masuk",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    kunci: "umum",
    label: "Pengaturan Umum",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

function PanelAkun({ beriTahu }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(adminPengguna.ambil() || "admin");
  const [passLama, setPassLama] = useState("");
  const [passBaru, setPassBaru] = useState("");
  const [passKonf, setPassKonf] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [lihat, setLihat] = useState(false);

  useEffect(() => {
    infoAdmin()
      .then((d) => {
        setInfo(d);
        if (d.username) setUsername(d.username);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const simpan = async (e) => {
    e.preventDefault();
    if (passBaru !== passKonf) {
      beriTahu?.("Konfirmasi password tidak cocok.", "error");
      return;
    }
    if (passBaru.length < 6) {
      beriTahu?.("Password baru minimal 6 karakter.", "error");
      return;
    }
    setSibuk(true);
    try {
      const res = await gantiPasswordAdmin({
        passwordLama: passLama,
        passwordBaru: passBaru,
        usernameBaru: username.trim().toLowerCase(),
      });
      // update token di sessionStorage agar tetap login dengan password baru
      tokenPengurus.simpan(passBaru);
      adminPengguna.simpan(res.username || username);
      beriTahu?.(res.pesan || "Password berhasil diganti.", "sukses");
      setPassLama("");
      setPassBaru("");
      setPassKonf("");
      const baru = await infoAdmin().catch(() => null);
      if (baru) setInfo(baru);
    } catch (err) {
      beriTahu?.(err.message || "Gagal ganti password.", "error");
    } finally {
      setSibuk(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Memuat info akun...</div>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Akun Saat Ini</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Username</span>
            <span className="font-mono font-bold text-slate-900">{info?.username || username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Sumber</span>
            <span className="text-slate-700">{info?.sumber === "file" ? "File (sudah diganti via dashboard)" : "Env / bawaan (admin/admin123)"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">File ada</span>
            <span className="text-slate-700">{info?.adaFile ? "Ya" : "Belum (masih pakai bawaan)"}</span>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">
          Bawaan: <code className="font-mono">admin / admin123</code>. Ganti di sini agar tersimpan di{" "}
          <code className="font-mono">data/rahasia/admin.json</code> (tidak masuk Git) dan langsung aktif tanpa restart.
        </p>
      </div>

      <form onSubmit={simpan} className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Ganti Username & Password</h3>

        <label className="flex flex-col gap-1.5 text-sm text-slate-700">
          Username baru
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="admin"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-slate-700">
          Password lama (verifikasi)
          <input
            type={lihat ? "text" : "password"}
            value={passLama}
            onChange={(e) => setPassLama(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="admin123"
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            Password baru
            <input
              type={lihat ? "text" : "password"}
              value={passBaru}
              onChange={(e) => setPassBaru(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="minimal 6 karakter"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            Konfirmasi password baru
            <input
              type={lihat ? "text" : "password"}
              value={passKonf}
              onChange={(e) => setPassKonf(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="ulang password baru"
              required
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setLihat((v) => !v)}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            {lihat ? "Sembunyikan password" : "Lihat password"}
          </button>
          <button
            type="submit"
            disabled={sibuk}
            className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            {sibuk ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </div>
      </form>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
        Tips: Setelah ganti, kamu akan tetap login dengan token baru. Untuk login berikutnya pakai password baru. File tersimpan di{" "}
        <code className="font-mono">data/rahasia/admin.json</code>. Hapus file itu untuk kembali ke bawaan env.
      </div>
    </div>
  );
}

export default function Pengaturan({ onKembali, beriTahu }) {
  const [bagian, setBagian] = useState("akun");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onKembali}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
          <h1 className="text-lg font-bold text-slate-900">Pengaturan</h1>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar navigasi pengaturan */}
        <aside className="w-56 bg-white border-r border-slate-200 shrink-0 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {MENU_PENGATURAN.map(({ kunci, label, icon }) => {
              const aktif = bagian === kunci;
              return (
                <button
                  key={kunci}
                  type="button"
                  onClick={() => setBagian(kunci)}
                  className={`
                    w-full text-sm font-medium
                    flex items-center gap-3
                    px-3 py-2.5 rounded-lg
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
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Konten utama */}
        <main className="flex-1 p-6 overflow-y-auto min-w-0">
          {bagian === "riwayat-masuk" && (
            <PanelRiwayatMasuk beriTahu={beriTahu} />
          )}

          {bagian === "akun" && (
            <PanelAkun beriTahu={beriTahu} />
          )}

          {bagian === "umum" && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm text-slate-500">
                Pengaturan umum akan segera tersedia.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
