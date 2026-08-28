import { useEffect, useState } from "react";
import PanelRiwayatMasuk from "./RiwayatMasuk.jsx";
import {
  infoAdmin,
  gantiPasswordAdmin,
  tokenPengurus,
  adminPengguna,
  peranPengurus,
  daftarAdmins,
  tambahAdminBaru,
  hapusAdmin,
  ubahAdmin,
} from "../../lib/api/index.js";

const MENU_PENGATURAN = [
  {
    kunci: "kelola-admin",
    label: "Kelola Admin",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    masterOnly: true,
  },
  {
    kunci: "akun",
    label: "Akun & Password",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    masterOnly: true,
  },
  {
    kunci: "riwayat-masuk",
    label: "Riwayat Masuk",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    masterOnly: true,
  },
  {
    kunci: "umum",
    label: "Pengaturan Umum",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    masterOnly: false,
  },
];

function PanelKelolaAdmin({ beriTahu }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", password: "", role: "pengurus" });
  const [sibuk, setSibuk] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // username yang sedang diedit
  const [editData, setEditData] = useState({ password: "", role: "pengurus" });

  const muat = async () => {
    setLoading(true);
    try {
      const data = await daftarAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (e) {
      beriTahu?.(e.message || "Gagal memuat daftar admin.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muat();
  }, []);

  const tambah = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      beriTahu?.("Username dan password wajib diisi.", "error");
      return;
    }
    setSibuk(true);
    try {
      const res = await tambahAdminBaru(form);
      beriTahu?.(res.pesan || "Admin ditambahkan.", "sukses");
      setForm({ username: "", password: "", role: "pengurus" });
      await muat();
    } catch (err) {
      beriTahu?.(err.message || "Gagal tambah admin.", "error");
    } finally {
      setSibuk(false);
    }
  };

  const hapus = async (username) => {
    if (!confirm(`Hapus admin "${username}"?`)) return;
    try {
      const res = await hapusAdmin(username);
      beriTahu?.(res.pesan || "Admin dihapus.", "sukses");
      await muat();
    } catch (err) {
      beriTahu?.(err.message || "Gagal hapus admin.", "error");
    }
  };

  const simpanEdit = async (username) => {
    try {
      const payload = { username };
      if (editData.password) payload.password = editData.password;
      if (editData.role) payload.role = editData.role;
      const res = await ubahAdmin(payload);
      beriTahu?.(res.pesan || "Admin diperbarui.", "sukses");
      setEditTarget(null);
      setEditData({ password: "", role: "pengurus" });
      await muat();
    } catch (err) {
      beriTahu?.(err.message || "Gagal ubah admin.", "error");
    }
  };

  const masterCount = admins.filter((a) => a.role === "master").length;
  const pengurusCount = admins.filter((a) => a.role === "pengurus").length;

  if (loading) return <div className="text-sm text-slate-500">Memuat daftar admin...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Ringkasan Admin</h3>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="rounded bg-slate-50 p-3">
            <div className="text-lg font-bold text-slate-900">{admins.length}</div>
            <div className="text-xs text-slate-500">Total Admin</div>
          </div>
          <div className="rounded bg-amber-50 p-3">
            <div className="text-lg font-bold text-amber-800">{masterCount}</div>
            <div className="text-xs text-amber-700">Master Admin</div>
          </div>
          <div className="rounded bg-blue-50 p-3">
            <div className="text-lg font-bold text-blue-800">{pengurusCount}</div>
            <div className="text-xs text-blue-700">Admin Pengurus</div>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">
          <strong>Master Admin</strong> bisa akses Pengaturan, tambah/hapus admin, dan lihat riwayat masuk. <strong>Admin Pengurus</strong> hanya bisa kelola anggota, turnamen, pesan, berita — tidak bisa masuk Pengaturan.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Daftar Admin</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Dibuat</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.username} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono font-bold text-slate-900">@{a.username}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${a.role === "master" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                      {a.role === "master" ? "MASTER" : "PENGURUS"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {a.dibuatPada ? new Date(a.dibuatPada).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTarget(a.username);
                          setEditData({ password: "", role: a.role });
                        }}
                        className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => hapus(a.username)}
                        className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                        disabled={admins.length <= 1}
                      >
                        Hapus
                      </button>
                    </div>
                    {editTarget === a.username && (
                      <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-3 text-left space-y-2">
                        <div className="text-xs font-bold text-slate-700">Edit {a.username}</div>
                        <input
                          type="text"
                          value={editData.password}
                          onChange={(e) => setEditData((d) => ({ ...d, password: e.target.value }))}
                          placeholder="Password baru (kosongkan jika tidak ganti)"
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                        />
                        <select
                          value={editData.role}
                          onChange={(e) => setEditData((d) => ({ ...d, role: e.target.value }))}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                        >
                          <option value="pengurus">Admin Pengurus</option>
                          <option value="master">Master Admin</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => simpanEdit(a.username)}
                            className="rounded bg-primary px-3 py-1 text-xs font-bold text-white"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditTarget(null)}
                            className="rounded border border-slate-300 px-3 py-1 text-xs"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={tambah} className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Tambah Admin Baru</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            Username
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="contoh: pengurus1"
              className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            Password
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="minimal 6 karakter"
              className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-slate-700">
            Role
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="pengurus">Admin Pengurus</option>
              <option value="master">Master Admin</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sibuk}
            className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40"
          >
            {sibuk ? "Menambahkan..." : "Tambah Admin"}
          </button>
        </div>
        <p className="text-[11px] leading-5 text-slate-500">
          Admin Pengurus tidak bisa akses Pengaturan. Hanya Master yang bisa tambah/hapus admin dan lihat riwayat masuk.
        </p>
      </form>
    </div>
  );
}

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

  const isMaster = (info?.role || "").toLowerCase() === "master";

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-900">Akun Saat Ini (Master)</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Username</span>
            <span className="font-mono font-bold text-slate-900">{info?.username || username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role</span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${isMaster ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
              {isMaster ? "MASTER ADMIN" : "ADMIN PENGURUS"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Sumber</span>
            <span className="text-slate-700">{info?.sumber === "file" ? "File admins.json" : "Env / bawaan"}</span>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">
          Bawaan: <code className="font-mono">admin / admin123</code> sebagai Master. Ganti di sini agar tersimpan di{" "}
          <code className="font-mono">data/rahasia/admins.json</code> (tidak masuk Git) dan langsung aktif.
        </p>
      </div>

      <form onSubmit={simpan} className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Ganti Username & Password Sendiri</h3>

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
    </div>
  );
}

export default function Pengaturan({ onKembali, beriTahu }) {
  const [bagian, setBagian] = useState("kelola-admin");
  const peran = peranPengurus.ambil();
  const isMaster = (peran || "").toLowerCase() === "master";

  // jika bukan master, paksa tidak bisa akses pengaturan (sudah dicegah di Dashboard, tapi jaga-jaga)
  if (!isMaster) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onKembali}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Kembali
            </button>
            <h1 className="text-lg font-bold text-slate-900">Pengaturan</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="rounded-lg border border-red-200 bg-white p-8 max-w-md text-center">
            <h2 className="text-lg font-bold text-slate-900">Akses Ditolak</h2>
            <p className="mt-2 text-sm text-slate-600">Hanya Master Admin yang bisa masuk Pengaturan.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
          <h1 className="text-lg font-bold text-slate-900">Pengaturan (Master Admin)</h1>
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">MASTER ONLY</span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-56 bg-white border-r border-slate-200 shrink-0 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {MENU_PENGATURAN.filter((m) => !m.masterOnly || isMaster).map(({ kunci, label, icon }) => {
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
                    ${aktif ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"}
                  `}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto min-w-0">
          {bagian === "kelola-admin" && <PanelKelolaAdmin beriTahu={beriTahu} />}
          {bagian === "riwayat-masuk" && <PanelRiwayatMasuk beriTahu={beriTahu} />}
          {bagian === "akun" && <PanelAkun beriTahu={beriTahu} />}
          {bagian === "umum" && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm text-slate-500">Pengaturan umum akan segera tersedia.</p>
              <p className="mt-2 text-xs text-slate-400">Master Admin: {adminPengguna.ambil()} | Role: {peranPengurus.ambil()}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
