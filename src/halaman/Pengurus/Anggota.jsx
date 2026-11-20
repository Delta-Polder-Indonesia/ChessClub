import { useEffect, useMemo, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { LencanaBan } from "../../components/Lencana.jsx";
import { Tombol, Avatar, Modal, MenuAksi, TooltipLabel } from "./ui.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.jsx";
import { Mail, Ban } from "lucide-react";

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
  const [terpilih, setTerpilih] = useState({});

  // Sinkronkan filter saat Dashboard mengubah filterAwal selagi panel
  // ter-mount (mis. klik sidebar mereset filter ke "semua").
  useEffect(() => {
    setFilterStatus(filterAwal);
  }, [filterAwal]);

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

  // Tutup modal kontak dengan Escape (paritas dengan komponen Modal).
  useEffect(() => {
    if (!kontak) return;
    const onEsc = (e) => {
      if (e.key === "Escape") setKontak(null);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [kontak]);

  /* Tarik ulang roster dari Chess.com. Endpoint ini memakai `paksa`, sehingga
     daftar anggota DAN profil benar-benar diambil ulang — bukan mengulang
     cache 12 jam / 1 jam (dulu tombol serupa tidak ada, jadi pengurus tidak
     punya cara menyusul anggota baru tanpa menunggu cache kedaluwarsa). */
  const segarkanRoster = () =>
    jalankan("segarkan", async () => {
      const h = await apiPengurus("/segarkan-roster", { metode: "POST" });
      beriTahu(
        `Roster disegarkan dari Chess.com: ${h.jumlah} anggota${h.diperbaruiPada ? ` (${new Date(h.diperbaruiPada).toLocaleString("id-ID")})` : ""}.`,
        "sukses"
      );
      await muatUlang();
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

  /* Klasifikasi anggota — satu predikat "kena ban" dipakai konsisten oleh
     semua filter agar akun yang sama tidak muncul di dua kategori. */
  const kenaBan = (a) =>
    Boolean(
      a.diblokirKomunitas ||
      a.alasanStatus === "fair_play_violations" ||
      (a.statusChess && a.statusChess.includes("closed"))
    );

  const anggotaTerblokir = useMemo(
    () => anggota.filter(kenaBan),
    [anggota]
  );

  const anggotaTerverifikasi = useMemo(
    () => anggota.filter((a) => a.terverifikasi && !kenaBan(a)),
    [anggota]
  );

  const anggotaAktif = useMemo(
    () => anggota.filter((a) => !kenaBan(a)),
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

  const jumlahTerpilih = Object.values(terpilih).filter(Boolean).length;
  const semuaTerpilih =
    anggotaTersaring.length > 0 &&
    anggotaTersaring.every((a) => terpilih[a.username]);

  const pilihSemua = (e) => {
    if (e.target.checked) {
      const baru = {};
      anggotaTersaring.forEach((a) => { baru[a.username] = true; });
      setTerpilih(baru);
    } else {
      setTerpilih({});
    }
  };

  const blokirTerpilih = async () => {
    const usernames = Object.keys(terpilih).filter((u) => terpilih[u]);
    if (!usernames.length) return;
    setSibuk("blokir-massal");
    try {
      for (const u of usernames) {
        await apiPengurus("/blokir", {
          metode: "POST",
          bodi: { username: u, keterangan: "Blokir massal dari dashboard" },
        });
      }
      beriTahu(`${usernames.length} akun dipindahkan ke daftar larangan.`, "sukses");
      setTerpilih({});
      await muatUlang();
    } catch (e) {
      beriTahu(e.message || "Gagal blokir massal.", "galat");
    } finally {
      setSibuk("");
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Peringatan Ban ─────────────────────────────────── */}
      {anggotaTerblokir.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-slate-700">
          <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">{anggotaTerblokir.length} akun</span>
          <span>di roster terdeteksi terkena batasan.</span>
          {filterStatus !== "terblokir" && (
            <button
              type="button"
              onClick={() => setFilterStatus("terblokir")}
              className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-600"
            >
              Lihat →
            </button>
          )}
        </p>
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
            anak={sibuk === "segarkan" ? "Menyegarkan…" : "Segarkan dari Chess.com"}
            onClick={segarkanRoster}
            kecil
            disabled={sibuk === "segarkan" || sibuk === "pindai"}
          />
          <Tombol
            anak={sibuk === "pindai" ? "Memindai…" : "Pindai Fair Play"}
            onClick={pindai}
            kecil
            disabled={sibuk === "pindai" || sibuk === "segarkan"}
          />
        </div>
      </div>

      {jumlahTerpilih > 0 && (
        <div className="flex items-center gap-3 text-sm mb-2">
          <span className="font-medium text-slate-700">
            {jumlahTerpilih} akun terpilih
          </span>
          <Tombol
            anak={sibuk === "blokir-massal" ? "Memproses…" : "Blokir terpilih"}
            jenis="biasa"
            onClick={blokirTerpilih}
            kecil
            disabled={sibuk === "blokir-massal"}
          />
          <button
            type="button"
            onClick={() => setTerpilih({})}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            Batalkan
          </button>
        </div>
      )}

      {/* ── Tabel ───────────────────────────────────────────── */}
      <div>
        <p className="text-xs text-slate-500 mb-1">
          Menampilkan <span className="font-medium text-slate-700">{anggotaTersaring.length}</span> dari {anggota.length} anggota
        </p>

        <div className="max-h-[480px] overflow-auto border border-slate-200 rounded-md">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-3 shrink-0">
                  <input
                    type="checkbox"
                    checked={semuaTerpilih}
                    onChange={pilihSemua}
                    aria-label="Pilih semua anggota"
                    className="size-4 accent-slate-800"
                  />
                </TableHead>
                <TableHead className="w-12 px-3 shrink-0">#</TableHead>
                <TableHead className="px-3 min-w-[260px] max-w-[320px]">Anggota</TableHead>
                <TableHead className="px-3 w-[140px] min-w-[120px] max-w-[160px]">Kota</TableHead>
                <TableHead className="px-3 w-[90px] shrink-0">Rating</TableHead>
                <TableHead className="px-3 w-[90px] shrink-0">LIVE</TableHead>
                <TableHead className="px-3 w-[140px] shrink-0">Status</TableHead>
                <TableHead className="w-20 px-3 shrink-0">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anggotaTersaring.map((a, index) => {
                const kenaBanBaris = kenaBan(a);

                return (
                  <TableRow key={a.username}>
                    <TableCell className="w-10 p-3 shrink-0">
                      <input
                        type="checkbox"
                        checked={!!terpilih[a.username]}
                        onChange={(e) =>
                          setTerpilih((s) => ({ ...s, [a.username]: e.target.checked }))}
                        aria-label={`Pilih ${a.username}`}
                        className="size-4 accent-slate-800"
                      />
                    </TableCell>
                    <TableCell className="p-3 w-12 shrink-0">{index + 1}</TableCell>
                    <TableCell className="p-3 min-w-[260px] max-w-[320px]">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar username={a.username} foto={a.foto} />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-sm font-medium text-slate-900 hover:underline min-w-0"
                              title={`@${a.username}`}
                            >
                              @{a.username}
                            </a>
                            {kenaBanBaris && <span className="shrink-0"><LencanaBan /></span>}
                          </div>
                          <p className="text-sm text-slate-500 truncate block max-w-[200px]" title={a.nama || a.panggilan || ""}>
                            {a.nama || a.panggilan || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-3 w-[140px] min-w-[120px] max-w-[160px] overflow-hidden">
                      <p className="text-sm text-slate-600 truncate" title={a.kota || ""}>
                        {a.kota || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="p-3">
                      {a.elo ? (
                        <span className="elo-pilih">{a.elo}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="p-3">{a.kontrol || "—"}</TableCell>
                    <TableCell className="p-3">
                      {kenaBanBaris ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {a.alasanStatus === "fair_play_violations" ? "Fair Play" : "Terblokir"}
                          </span>
                          {a.peringatan && (
                            <p className="mt-0.5 text-xs text-slate-500 max-w-[200px] truncate">
                              <TooltipLabel label={a.peringatan}>{a.peringatan}</TooltipLabel>
                            </p>
                          )}
                        </div>
                      ) : a.terverifikasi ? (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          Terverifikasi
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="w-24 p-3">
                      <MenuAksi
                        aksi={[
                          {
                            label: "Lihat kontak",
                            Ikon: Mail,
                            onClick: () => lihatKontak(a.username),
                            disabled: sibuk === `kontak-${a.username}`,
                          },
                          kenaBanBaris
                            ? {
                                label: "Dilarang",
                                Ikon: Ban,
                                onClick: () => {},
                                disabled: true,
                              }
                            : {
                                label: "Blokir akun",
                                Ikon: Ban,
                                onClick: () => setTargetBlokir(a.username),
                                disabled: sibuk === `blokir-${a.username}`,
                                bahaya: true,
                              },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {!anggotaTersaring.length && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                    {cari || filterStatus !== "semua"
                      ? "Tidak ada anggota yang cocok dengan filter."
                      : "Belum ada anggota dari roster klub."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                      "noopener noreferrer"
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
