import { useMemo, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { LencanaBan } from "../../components/Lencana.jsx";
import { Tombol, Avatar, Modal } from "./ui.jsx";

export default function PanelAnggota({
  anggota = [],
  muatUlang,
  beriTahu,
  filterAwal = "semua",
}) {
  const [sibuk, setSibuk] = useState("");
  const [kontak, setKontak] = useState(null);
  const [targetBlokir, setTargetBlokir] = useState(null);
  const [filterStatus, setFilterStatus] = useState(filterAwal);
  const [cari, setCari] = useState("");

  const klub = String(anggota.find((a) => a.klubChess)?.klubChess || "")
    .replace(/-/g, " ")
    .toUpperCase();

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

  const konfirmasiBlokir = (alasan) => {
    const username = targetBlokir;
    setTargetBlokir(null);
    if (!username) return;
    jalankan(`blokir-${username}`, async () => {
      await apiPengurus("/blokir", {
        metode: "POST",
        bodi: { username, keterangan: alasan },
      });
      beriTahu(`"${username}" dipindahkan ke daftar larangan.`, "sukses");
      await muatUlang();
    });
  };

  const lihatKontak = (username) =>
    jalankan(`kontak-${username}`, async () => {
      const data = await apiPengurus(`/kontak/${username}`);
      setKontak({ username, data });
    });

  const pindai = () =>
    jalankan("pindai", async () => {
      const h = await apiPengurus("/pindai", { metode: "POST" });
      const jumlahBan = (h.diblokir || []).length;
      if (jumlahBan > 0) {
        beriTahu(
          `Pemindaian selesai: ${h.diperiksa} diperiksa, ${jumlahBan} akun terdeteksi melanggar dan otomatis diblokir (${h.diblokir.join(", ")}).`,
          "peringatan"
        );
        setFilterStatus("terblokir");
      } else {
        beriTahu(
          `Pemindaian selesai: ${h.diperiksa} akun diperiksa, semua aman tidak ada pelanggaran fair play baru.`,
          "sukses"
        );
      }
      await muatUlang();
    });

  /* Klasifikasi anggota */
  const anggotaTerblokir = useMemo(
    () =>
      anggota.filter(
        (a) =>
          a.diblokirKomunitas ||
          a.alasanStatus === "fair_play_violations" ||
          (a.statusChess && a.statusChess.includes("closed"))
      ),
    [anggota]
  );

  const anggotaTerverifikasi = useMemo(
    () => anggota.filter((a) => a.terverifikasi && !a.diblokirKomunitas),
    [anggota]
  );

  const anggotaAktif = useMemo(
    () =>
      anggota.filter(
        (a) =>
          !a.diblokirKomunitas &&
          a.alasanStatus !== "fair_play_violations" &&
          !(a.statusChess && a.statusChess.includes("closed"))
      ),
    [anggota]
  );

  /* Penyaringan daftar */
  const anggotaTersaring = useMemo(() => {
    let list = [...anggota];

    if (filterStatus === "terblokir") {
      list = anggotaTerblokir;
    } else if (filterStatus === "aktif") {
      list = anggotaAktif;
    } else if (filterStatus === "terverifikasi") {
      list = anggotaTerverifikasi;
    } else if (filterStatus === "belum-lengkap") {
      list = anggota.filter((a) => !a.dataSitusLengkap && !a.diblokirKomunitas);
    }

    const q = cari.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          (a.username && a.username.toLowerCase().includes(q)) ||
          (a.nama && a.nama.toLowerCase().includes(q)) ||
          (a.panggilan && a.panggilan.toLowerCase().includes(q)) ||
          (a.kota && a.kota.toLowerCase().includes(q))
      );
    }

    return list;
  }, [
    anggota,
    filterStatus,
    cari,
    anggotaTerblokir,
    anggotaAktif,
    anggotaTerverifikasi,
  ]);

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {klub ? `Anggota ${klub}` : "Daftar Anggota"}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {anggota.length} anggota terdaftar dari roster klub Chess.com
          </p>
        </div>
      </div>

      {/* ── Banner Alert ────────────────────────────────────── */}
      {anggotaTerblokir.length > 0 && (
        <div className="flex items-center gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm">
          <svg className="h-4 w-4 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="flex-1 text-red-800">
            <span className="font-semibold">{anggotaTerblokir.length} akun</span> di roster terdeteksi terkena ban.
            {filterStatus !== "terblokir" && (
              <button
                type="button"
                onClick={() => setFilterStatus("terblokir")}
                className="ml-2 font-semibold text-red-900 underline underline-offset-2 hover:text-red-700"
              >
                Lihat →
              </button>
            )}
          </p>
        </div>
      )}

      {/* ── Filter Tabs + Pencarian ──────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs ml-2">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama, username, atau kota…"
            className="w-full border-0 border-b border-slate-300 bg-transparent pl-9 pr-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-600"
          />
        </div>
        <div className="flex items-center gap-1">
          {[
            { kunci: "semua", label: "Semua", jumlah: anggota.length },
            { kunci: "aktif", label: "Aktif", jumlah: anggotaAktif.length },
            { kunci: "terverifikasi", label: "Terverifikasi", jumlah: anggotaTerverifikasi.length },
            { kunci: "terblokir", label: "Terblokir", jumlah: anggotaTerblokir.length },
          ].map((tab) => (
            <button
              key={tab.kunci}
              type="button"
              onClick={() => setFilterStatus(tab.kunci)}
              className={`
                -mb-px px-4 py-2.5 text-sm font-medium transition-colors
                ${filterStatus === tab.kunci
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
                }
              `}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${filterStatus === tab.kunci ? "text-slate-600" : "text-slate-400"}`}>
                {tab.jumlah}
              </span>
            </button>
          ))}
          <Tombol
            anak={sibuk === "pindai" ? "Memindai…" : "Pindai Fair Play"}
            onClick={pindai}
            kecil
            disabled={sibuk === "pindai"}
          />
        </div>
      </div>

      {/* ── Tabel ───────────────────────────────────────────── */}
      <div>
        <p className="text-xs text-slate-500 mb-1">
          Menampilkan <span className="font-medium text-slate-700">{anggotaTersaring.length}</span> dari {anggota.length} anggota
        </p>

        <div className="max-h-[480px] overflow-y-auto">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Anggota</th>
                <th>Kota</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {anggotaTersaring.map((a, index) => {
                const kenaBan =
                  a.diblokirKomunitas ||
                  a.alasanStatus === "fair_play_violations" ||
                  (a.statusChess && a.statusChess.includes("closed"));

                return (
                  <tr key={a.username} className={index % 2 === 1 ? "bg-slate-50" : ""}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar username={a.username} foto={a.foto} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              @{a.username}
                            </a>
                            {kenaBan && <LencanaBan />}
                          </div>
                          <p className="text-sm text-slate-500 truncate">
                            {a.nama || a.panggilan || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{a.kota || "—"}</td>
                    <td>
                      {a.elo ? (
                        <span className="elo-pilih">
                          {a.elo}
                          {a.kontrol && (
                            <span className="ml-1 text-sm text-slate-400">{a.kontrol}</span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {kenaBan ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                            {a.alasanStatus === "fair_play_violations" ? "Fair Play" : "Terblokir"}
                          </span>
                          {a.peringatan && (
                            <p className="mt-0.5 text-xs text-red-600 max-w-[200px] truncate" title={a.peringatan}>
                              {a.peringatan}
                            </p>
                          )}
                        </div>
                      ) : a.terverifikasi ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Terverifikasi
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Lihat kontak"
                          onClick={() => lihatKontak(a.username)}
                          disabled={sibuk === `kontak-${a.username}`}
                          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary disabled:opacity-40"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {kenaBan ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                            Dilarang
                          </span>
                        ) : (
                          <button
                            type="button"
                            title="Blokir akun"
                            onClick={() => setTargetBlokir(a.username)}
                            disabled={sibuk === `blokir-${a.username}`}
                            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!anggotaTersaring.length && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500" style={{ padding: "40px 0" }}>
                    {cari || filterStatus !== "semua"
                      ? "Tidak ada anggota yang cocok dengan filter."
                      : "Belum ada anggota dari roster klub."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Blokir Manual ────────────────────────────── */}
      <Modal
        terbuka={Boolean(targetBlokir)}
        judul={`Blokir @${targetBlokir || ""}?`}
        labelKonfirmasi="Blokir"
        jenisKonfirmasi="bahaya"
        butuhInput
        placeholderInput="Alasan pemblokiran…"
        nilaiBawaanInput="Terbukti menggunakan bantuan engine."
        catatanInput="Tindakan ini membatasi kegiatan situs dan turnamen komunitas."
        sibuk={sibuk === `blokir-${targetBlokir}`}
        onBatal={() => setTargetBlokir(null)}
        onKonfirmasi={konfirmasiBlokir}
      >
        Masukkan <strong>@{targetBlokir}</strong> ke daftar larangan komunitas.
      </Modal>

      {/* ── Modal Detail Kontak ────────────────────────────── */}
      {kontak && (
        <section
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setKontak(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Kontak @{kontak.username}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Data pribadi — untuk pengurus saja.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKontak(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Nama lengkap", kontak.data.namaLengkap],
                ["Panggilan", kontak.data.panggilan],
                ["HP / WhatsApp", kontak.data.hp],
                ["DANA", kontak.data.dana],
                ["Email", kontak.data.email],
                ["Kota", kontak.data.kota],
                ["Tanggal lahir", kontak.data.tanggalLahir],
                ["Klub", kontak.data.klub],
              ].map(([label, nilai]) =>
                nilai ? (
                  <div key={label} className="flex justify-between gap-4 py-1 border-b border-slate-100 last:border-0">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-medium text-slate-900 break-all">
                      {nilai}
                    </dd>
                  </div>
                ) : null
              )}
            </dl>
            <div className="mt-5 flex justify-end gap-2">
              {kontak.data.email && (
                <Tombol
                  anak="Email"
                  kecil
                  onClick={() =>
                    (window.location.href = `mailto:${kontak.data.email}`)
                  }
                />
              )}
              {kontak.data.hp && (
                <Tombol
                  anak="WhatsApp"
                  kecil
                  jenis="utama"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${String(kontak.data.hp).replace(
                        /^0/,
                        "62"
                      )}`,
                      "_blank",
                      "noopener"
                    )
                  }
                />
              )}
              <Tombol anak="Tutup" kecil onClick={() => setKontak(null)} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
