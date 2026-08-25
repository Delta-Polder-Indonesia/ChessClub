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
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {klub ? `Anggota ${klub}` : "Daftar Anggota"} ({anggota.length})
            </h2>
            {anggotaTerblokir.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-800">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                {anggotaTerblokir.length} Terkena Ban
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Daftar seluruh anggota dari roster klub Chess.com. Pemindaian
            otomatis memeriksa integritas akun dan mendeteksi pelanggaran fair
            play.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tombol
            anak={sibuk === "pindai" ? "Memindai Roster…" : "🔍 Pindai Fair Play"}
            onClick={pindai}
            disabled={sibuk === "pindai"}
            jenis="utama"
          />
        </div>
      </div>

      {/* ── Banner Alert jika ada anggota kena Ban ─────────── */}
      {anggotaTerblokir.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50/90 p-4">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1 text-sm text-red-900">
            <p className="font-bold">
              Perhatian: {anggotaTerblokir.length} Akun di Roster Terdeteksi Terkena Ban!
            </p>
            <p className="mt-0.5 text-xs text-red-800">
              Akun:{" "}
              {anggotaTerblokir
                .map((a) => `@${a.username}`)
                .slice(0, 5)
                .join(", ")}
              {anggotaTerblokir.length > 5 ? " dan lainnya…" : "."} Akun ini
              otomatis dibatasi dari seluruh turnamen komunitas.
            </p>
          </div>
          {filterStatus !== "terblokir" && (
            <button
              type="button"
              onClick={() => setFilterStatus("terblokir")}
              className="rounded-full bg-red-200 px-3 py-1 text-xs font-bold text-red-900 hover:bg-red-300 shrink-0"
            >
              Filter Akun Terban Saja →
            </button>
          )}
        </div>
      )}

      {/* ── Filter Tab Tombol Cepat ────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilterStatus("semua")}
          className={`rounded-lg border p-3 text-left transition-all ${
            filterStatus === "semua"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Semua Anggota
          </p>
          <p className="mt-1 text-xl font-bold text-slate-900">{anggota.length}</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("aktif")}
          className={`rounded-lg border p-3 text-left transition-all ${
            filterStatus === "aktif"
              ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Anggota Aktif
          </p>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            {anggotaAktif.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("terblokir")}
          className={`rounded-lg border p-3 text-left transition-all ${
            filterStatus === "terblokir"
              ? "border-red-500 bg-red-50 ring-2 ring-red-500/20"
              : anggotaTerblokir.length > 0
                ? "border-red-200 bg-red-50/30 hover:bg-red-50/60"
                : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Terkena Ban
          </p>
          <p className="mt-1 text-xl font-bold text-red-700">
            {anggotaTerblokir.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("terverifikasi")}
          className={`rounded-lg border p-3 text-left transition-all ${
            filterStatus === "terverifikasi"
              ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Terverifikasi
          </p>
          <p className="mt-1 text-xl font-bold text-blue-700">
            {anggotaTerverifikasi.length}
          </p>
        </button>
      </div>

      {/* ── Pencarian ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama anggota, username Chess.com, atau kota…"
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
        </div>
        {(cari || filterStatus !== "semua") && (
          <button
            type="button"
            onClick={() => {
              setCari("");
              setFilterStatus("semua");
            }}
            className="rounded px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* ── Tabel Anggota ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Menampilkan {anggotaTersaring.length} dari {anggota.length} Anggota
          </p>
          {filterStatus !== "semua" && (
            <button
              type="button"
              onClick={() => setFilterStatus("semua")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Tampilkan Semua Anggota
            </button>
          )}
        </div>

        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 sticky top-0">
              <tr>
                <th className="px-4 py-2.5 text-center w-12">#</th>
                <th className="px-4 py-2.5">Profil Anggota</th>
                <th className="px-4 py-2.5">Kota</th>
                <th className="px-4 py-2.5">Elo Rating</th>
                <th className="px-4 py-2.5">Status Akun</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {anggotaTersaring.map((a, index) => {
                const kenaBan =
                  a.diblokirKomunitas ||
                  a.alasanStatus === "fair_play_violations" ||
                  (a.statusChess && a.statusChess.includes("closed"));

                return (
                  <tr
                    key={a.username}
                    className={`transition-colors ${
                      kenaBan
                        ? "bg-red-50/40 hover:bg-red-50/80"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-center text-xs font-medium text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar username={a.username} foto={a.foto} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-primary hover:underline"
                            >
                              @{a.username}
                            </a>
                            {kenaBan && <LencanaBan />}
                          </div>
                          <p className="text-xs text-slate-600 truncate">
                            {a.nama || a.panggilan || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{a.kota || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-800">
                      {a.elo ? (
                        <span className="font-semibold font-mono">
                          {a.elo}{" "}
                          <span className="text-xs font-normal text-slate-500">
                            {a.kontrol || ""}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {kenaBan ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                            {a.alasanStatus === "fair_play_violations"
                              ? "Ban Fair Play"
                              : "Terblokir"}
                          </span>
                          {a.peringatan && (
                            <p
                              className="mt-0.5 text-[11px] text-red-700 max-w-xs truncate"
                              title={a.peringatan}
                            >
                              {a.peringatan}
                            </p>
                          )}
                        </div>
                      ) : a.terverifikasi ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          Belum Verifikasi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <Tombol
                          anak="Kontak"
                          kecil
                          onClick={() => lihatKontak(a.username)}
                          disabled={sibuk === `kontak-${a.username}`}
                        />
                        {kenaBan ? (
                          <span className="inline-block rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-700">
                            Dilarang
                          </span>
                        ) : (
                          <Tombol
                            anak="Blokir"
                            jenis="bahaya"
                            kecil
                            onClick={() => setTargetBlokir(a.username)}
                            disabled={sibuk === `blokir-${a.username}`}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!anggotaTersaring.length && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {cari || filterStatus !== "semua"
                      ? "Tidak ada anggota yang cocok dengan kriteria filter."
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
        judul={`Blokir Akun @${targetBlokir || ""}?`}
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
        Tindakan ini akan memasukkan <strong>@{targetBlokir}</strong> ke daftar
        larangan komunitas.
      </Modal>

      {/* ── Modal Detail Kontak ────────────────────────────── */}
      {kontak && (
        <section
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setKontak(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900">
              Kontak @{kontak.username}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Data pribadi ini hanya dapat diakses oleh pengurus komunitas.
            </p>
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
                  <div key={label} className="flex justify-between gap-4">
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
