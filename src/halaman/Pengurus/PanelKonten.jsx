import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react";
import { flexRender } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import { apiPengurus } from "../../lib/api/index.js";
import { Tombol, Bidang, Modal, MenuAksi, KotakGalatMuat } from "./ui.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.jsx";

/**
 * Pengelolaan konten komunitas (berita & pengumuman).
 *
 * Satu panel generik dipakai dua jenis konten yang bentuknya hampir sama
 * (judul, isi, tanggal, status) — perbedaannya hanya ringkasan yang khusus
 * untuk berita. PanelBerita dan PanelPengumuman tinggal mengatur konfigurasi.
 */

const STATUS = {
  draf: { teks: "Draf" },
  publik: { teks: "Publik" },
};

function Lencana({ status }) {
  const s = STATUS[status] || STATUS.draf;
  return (
    <span className="text-sm text-slate-700">{s.teks}</span>
  );
}

/**
 * Header kolom yang bisa diurutkan — ikon panah berubah mengikuti arah
 * urutan (naik/turun/netral), pola template tabel shadcn.
 */
function TombolUrutkan({ kolom, anak }) {
  const arah = kolom.getIsSorted();
  return (
    <button
      type="button"
      onClick={() => kolom.toggleSorting(arah === "asc")}
      className="inline-flex items-center gap-1 font-medium text-slate-700 transition-colors hover:text-slate-900"
    >
      {anak}
      {arah === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : arah === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5" />
      )}
    </button>
  );
}

/**
 * Dropdown pilih kolom yang tampil di tabel konten — pola portal sama seperti
 * MenuStatus/MenuAksi, dengan checkbox per kolom yang bisa disembunyikan.
 */
function MenuKolom({ tabel }) {
  const [terbuka, setTerbuka] = useState(false);
  const [posisi, setPosisi] = useState(null);
  const tombolRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!terbuka) return;
    const el = tombolRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPosisi({
      top: r.bottom + 4,
      left: r.left,
    });
  }, [terbuka]);

  useEffect(() => {
    if (!terbuka) return;
    function cekKlik(e) {
      if (tombolRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setTerbuka(false);
    }
    function cekEsc(e) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", cekKlik);
    document.addEventListener("keydown", cekEsc);
    return () => {
      document.removeEventListener("mousedown", cekKlik);
      document.removeEventListener("keydown", cekEsc);
    };
  }, [terbuka]);

  const nama = { gambar: "Gambar", judul: "Judul", tanggal: "Tanggal", status: "Status" };
  const kolom = tabel.getAllColumns().filter((c) => c.getCanHide());
  if (!kolom.length) return null;

  return (
    <div ref={tombolRef} className="inline-flex">
      <button
        type="button"
        onClick={() => setTerbuka((t) => !t)}
        aria-haspopup="menu"
        aria-expanded={terbuka}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border-2 border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        Kolom
        <ChevronDown className="size-4" />
      </button>
      {terbuka &&
        posisi &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Pilih kolom"
            style={{ top: posisi.top, left: posisi.left }}
            className="fixed z-50 min-w-[10rem] rounded-md border border-slate-200 bg-white p-1 shadow-lg"
          >
            {kolom.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={c.getIsVisible()}
                  onChange={() => c.toggleVisibility()}
                  className="size-4 accent-primary"
                />
                {nama[c.id] || c.id}
              </label>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/* ------------------------------------------------------- formulir konten */

/** Kecilkan gambar sebelum disimpan agar data konten tetap ringan. */
function kompresGambar(file) {
  return new Promise((resolve, reject) => {
    // Catatan: GIF animasi didukung server, tetapi kompresi sisi klien
    // melalui <canvas> hanya menyimpan satu bingkai dan animasinya
    // hilang. Agar pengurus tidak terkaget, GIF animasi ditolak di
    // sini; unggah JPG/PNG/WebP atau pasang URL gambar langsung.
    if (!file?.type?.match(/^image\/(jpeg|png|webp)$/)) {
      reject(new Error("Pilih berkas JPG, PNG, atau WebP."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Ukuran gambar asli maksimal 8 MB."));
      return;
    }

    const pembaca = new FileReader();
    pembaca.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    pembaca.onload = () => {
      const gambar = new Image();
      gambar.onerror = () => reject(new Error("Format gambar tidak dapat diproses."));
      gambar.onload = () => {
        const batas = 1600;
        const skala = Math.min(1, batas / Math.max(gambar.width, gambar.height));
        const kanvas = document.createElement("canvas");
        kanvas.width = Math.max(1, Math.round(gambar.width * skala));
        kanvas.height = Math.max(1, Math.round(gambar.height * skala));
        kanvas.getContext("2d").drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
        const hasil = kanvas.toDataURL("image/webp", 0.82);
        if (hasil.length > 1_900_000) {
          reject(new Error("Gambar masih terlalu besar. Pilih gambar lain yang lebih kecil."));
          return;
        }
        resolve(hasil);
      };
      gambar.src = pembaca.result;
    };
    pembaca.readAsDataURL(file);
  });
}

function FormulirKonten({ konfig, item, onSimpan, onBatal }) {
  const [data, setData] = useState({
    judul: item?.judul || "",
    tanggal: item?.tanggal || "",
    ringkasan: item?.ringkasan || "",
    isi: item?.isi || "",
    gambar: item?.gambar || "",
    altGambar: item?.altGambar || item?.judul || "",
    status: item?.status || "publik",
  });
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [memprosesGambar, setMemprosesGambar] = useState(false);

  const ubah = (k, v) => {
    setData((d) => ({ ...d, [k]: v }));
    setPesan("");
  };

  const pilihGambar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMemprosesGambar(true);
    setPesan("");
    try {
      const gambar = await kompresGambar(file);
      setData((d) => ({
        ...d,
        gambar,
        altGambar: d.altGambar || d.judul || file.name.replace(/\.[^.]+$/, ""),
      }));
    } catch (err) {
      setPesan(err.message || "Gagal memproses gambar.");
    } finally {
      setMemprosesGambar(false);
      e.target.value = "";
    }
  };

  const kirim = async (e) => {
    e.preventDefault();
    setSibuk(true);
    setPesan("");
    try {
      await onSimpan(data);
    } catch (err) {
      setPesan(err.message || "Gagal menyimpan.");
    } finally {
      setSibuk(false);
    }
  };

  return (
    <form onSubmit={kirim} className="mb-6 space-y-3">
      <h3 className="text-sm font-bold text-slate-900">
        {item ? `Ubah ${konfig.label}` : `${konfig.label} Baru`}
      </h3>

      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
        <Bidang
          label="Judul"
          value={data.judul}
          onChange={(e) => ubah("judul", e.target.value)}
          placeholder={`contoh: ${konfig.contohJudul}`}
        />
        <Bidang
          label="Tanggal"
          type="date"
          value={data.tanggal}
          onChange={(e) => ubah("tanggal", e.target.value)}
        />
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Status
          <select
            value={data.status}
            onChange={(e) => ubah("status", e.target.value)}
            className="rounded-md border-2 border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          >
            <option value="publik">Publik</option>
            <option value="draf">Draf</option>
          </select>
        </label>
      </div>

      {konfig.punyaRingkasan && (
        <Bidang
          label="Ringkasan"
          value={data.ringkasan}
          onChange={(e) => ubah("ringkasan", e.target.value)}
          placeholder="Cuplikan pendek yang tampil di bawah judul"
        />
      )}

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
        Isi
        <textarea
          rows={6}
          value={data.isi}
          onChange={(e) => ubah("isi", e.target.value)}
          className="rounded-md border-2 border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
      </label>

      <fieldset className="space-y-2 rounded-md border-2 border-slate-200 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-700">
          Gambar <span className="font-normal text-slate-500">(opsional)</span>
        </legend>
        <p className="text-xs leading-5 text-slate-500">
          Konten tanpa gambar tetap dapat diterbitkan. JPG, PNG, atau WebP
          sampai 8 MB; otomatis diperkecil. GIF animasi tidak didukung
          (animasinya hilang saat kompresi).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-md border-2 border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-blue-50">
            {memprosesGambar ? "Memproses…" : data.gambar ? "Ganti gambar" : "Pilih gambar"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pilihGambar}
              disabled={memprosesGambar}
              className="sr-only"
            />
          </label>
          {data.gambar && (
            <button
              type="button"
              onClick={() => setData((d) => ({ ...d, gambar: "", altGambar: "" }))}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Hapus gambar
            </button>
          )}
        </div>
        {data.gambar && (
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <img
              src={data.gambar}
              alt="Pratinjau gambar konten"
              className="aspect-video w-full rounded-md border-2 border-slate-200 object-cover"
            />
            <Bidang
              label="Teks alternatif gambar"
              value={data.altGambar}
              onChange={(e) => ubah("altGambar", e.target.value)}
              placeholder="Jelaskan isi gambar untuk pembaca layar"
            />
          </div>
        )}
      </fieldset>

      {pesan && <p className="text-xs text-red-600">{pesan}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sibuk || memprosesGambar || !data.judul.trim()}
          className="rounded-md border-2 border-primary bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
        >
          {sibuk ? "Menyimpan…" : "Simpan"}
        </button>
        <Tombol anak="Batal" onClick={onBatal} />
      </div>
    </form>
  );
}

/* -------------------------------------------------------------- panel */

/**
 * Dropdown filter status — menggantikan tab Semua/Draf/Publik menjadi satu
 * tombol (ikon template: tombol + ChevronDown), berisi pilian status.
 */
function MenuStatus({ nilai, onPilih, labelBaru, onBuatBaru }) {
  const [terbuka, setTerbuka] = useState(false);
  const [posisi, setPosisi] = useState(null);
  const tombolRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!terbuka) return;
    const el = tombolRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPosisi({
      top: r.bottom + 4,
      left: r.left,
    });
  }, [terbuka]);

  useEffect(() => {
    if (!terbuka) return;
    function cekKlik(e) {
      if (tombolRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setTerbuka(false);
    }
    function cekEsc(e) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", cekKlik);
    document.addEventListener("keydown", cekEsc);
    return () => {
      document.removeEventListener("mousedown", cekKlik);
      document.removeEventListener("keydown", cekEsc);
    };
  }, [terbuka]);

  const pilihan = [
    { nilai: "", label: "Semua" },
    { nilai: "draf", label: "Draf" },
    { nilai: "publik", label: "Publik" },
  ];
  const labelAktif = pilihan.find((p) => p.nilai === nilai)?.label || "Semua";

  return (
    <div ref={tombolRef} className="inline-flex">
      <button
        type="button"
        onClick={() => setTerbuka((t) => !t)}
        aria-haspopup="menu"
        aria-expanded={terbuka}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border-2 border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <span className="sr-only">Status: {labelAktif}</span>
        {labelAktif}
        <ChevronDown className="size-4" />
      </button>
      {terbuka &&
        posisi &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Status dan tindakan"
            style={{ top: posisi.top, left: posisi.left }}
            className="fixed z-50 min-w-[9rem] rounded-md border border-slate-200 bg-white p-1 shadow-lg"
          >
            {pilihan.map((p) => (
              <button
                key={p.label}
                type="button"
                role="menuitemradio"
                aria-checked={p.nilai === nilai}
                onClick={() => {
                  setTerbuka(false);
                  onPilih(p.nilai);
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm ${
                  p.nilai === nilai
                    ? "bg-slate-100 font-semibold text-slate-900"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
            <div className="my-1 h-px bg-slate-100" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setTerbuka(false);
                onBuatBaru();
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm font-semibold text-primary hover:bg-blue-50"
            >
              + {labelBaru} baru
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

function PanelKonten({ konfig, beriTahu, muatUlang }) {
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(false);
  const [formulir, setFormulir] = useState(null); // null | {item:null} | {item}
  const [saring, setSaring] = useState("");
  const [cari, setCari] = useState("");
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [targetHapus, setTargetHapus] = useState(null);
  const [targetHapusMassal, setTargetHapusMassal] = useState(false);

  const muat = useCallback(async () => {
    setMemuat(true);
    setGalat(false);
    try {
      setDaftar(await apiPengurus(`/${konfig.jalur}`));
    } catch (e) {
      beriTahu(e.message, "galat");
      setGalat(true);
    } finally {
      setMemuat(false);
    }
  }, [konfig.jalur, beriTahu]);

  useEffect(() => {
    muat();
  }, [muat]);

  const simpan = async (data) => {
    const jalur = formulir?.item
      ? `/${konfig.jalur}/${formulir.item.id}/ubah`
      : `/${konfig.jalur}`;
    const hasil = await apiPengurus(jalur, { metode: "POST", bodi: data });
    beriTahu(
      formulir?.item
        ? `${konfig.label} "${hasil.judul}" diperbarui.`
        : `${konfig.label} "${hasil.judul}" dibuat.`,
      "sukses"
    );
    setFormulir(null);
    await muat();
    muatUlang?.();
  };

  const konfirmasiHapus = async () => {
    const x = targetHapus;
    setTargetHapus(null);
    if (!x) return;
    try {
      await apiPengurus(`/${konfig.jalur}/${x.id}/hapus`, { metode: "POST" });
      beriTahu(`${konfig.label} dihapus.`, "sukses");
      if (formulir?.item?.id === x.id) setFormulir(null);
      setRowSelection((s) => {
        const baru = { ...s };
        delete baru[x.id];
        return baru;
      });
      await muat();
      muatUlang?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    }
  };

  const konfirmasiHapusMassal = async () => {
    const ids = Object.keys(rowSelection);
    setTargetHapusMassal(false);
    if (!ids.length) return;
    try {
      for (const id of ids) {
        await apiPengurus(`/${konfig.jalur}/${id}/hapus`, { metode: "POST" });
      }
      beriTahu(`${ids.length} ${konfig.label.toLowerCase()} dihapus.`, "sukses");
      setRowSelection({});
      await muat();
      muatUlang?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    }
  };

  // WAJIB useMemo: tabel meng-auto-reset pageIndex setiap kali referensi
  // `data` berubah. Tanpa memo, filter ini menghasilkan array baru di tiap
  // render sehingga klik "Berikutnya" selalu dipatahkan (halaman melompat
  // balik ke 1) dan paginasi tidak pernah bisa dipakai.
  const tampil = useMemo(
    () =>
      daftar.filter((x) => {
        const cocokStatus = !saring || x.status === saring;
        const q = cari.trim().toLowerCase();
        const cocokCari =
          !q ||
          (x.judul || "").toLowerCase().includes(q) ||
          (x.ringkasan || "").toLowerCase().includes(q) ||
          (x.tanggal || "").includes(q);
        return cocokStatus && cocokCari;
      }),
    [daftar, saring, cari]
  );

  const kolom = useMemo(
    () => [
      {
        id: "pilih",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={
              table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()
            }
            // Nilai target dikirim EKSPLISIT: toggleAllPageRowsSelected() tanpa
            // argumen menghitung sendiri nilai tujuannya dan di wrapper legacy
            // TanStack v9 hasilnya salah saat halaman aktif bukan halaman
            // pertama (klik tidak memilih apa pun).
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            aria-label="Pilih semua"
            className="size-4 accent-primary"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Pilih baris"
            className="size-4 accent-primary"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "gambar",
        header: "Gambar",
        cell: ({ row }) =>
          row.original.gambar ? (
            <img
              src={row.original.gambar}
              alt=""
              width={64}
              height={40}
              className="h-10 w-16 rounded border border-slate-200 object-cover"
            />
          ) : (
            <span className="text-xs text-slate-400">Tanpa gambar</span>
          ),
        enableSorting: false,
      },
      {
        accessorKey: "judul",
        header: ({ column }) => <TombolUrutkan kolom={column} anak="Judul" />,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setFormulir({ item: row.original })}
            className="text-left font-medium text-primary hover:underline"
          >
            {row.original.judul}
          </button>
        ),
      },
      {
        accessorKey: "tanggal",
        header: ({ column }) => <TombolUrutkan kolom={column} anak="Tanggal" />,
        cell: ({ row }) => (
          <span className="text-slate-600">{row.original.tanggal || "—"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <TombolUrutkan kolom={column} anak="Status" />,
        cell: ({ row }) => <Lencana status={row.original.status} />,
      },
      {
        id: "aksi",
        header: "Aksi",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <MenuAksi
            onUbah={() => setFormulir({ item: row.original })}
            onHapus={() => setTargetHapus(row.original)}
          />
        ),
      },
    ],
    [konfig.label]
  );

  const tabel = useLegacyTable({
    data: tampil,
    columns: kolom,
    // WAJIB: tanpa ini id baris = indeks baris ("0","1",…), sehingga kunci
    // rowSelection bukan id item dan hapus massal mengirim id yang salah
    // (server membalas 404 "Berita tidak ditemukan.").
    getRowId: (baris) => baris.id,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const jumlahTampil = tabel.getFilteredRowModel().rows.length;
  const jumlahTerpilih = tabel.getFilteredSelectedRowModel().rows.length;

  const bereskanSeleksi = () => setRowSelection({});

  return (
    <div>
      {!formulir && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <MenuStatus
            nilai={saring}
            onPilih={setSaring}
            labelBaru={konfig.label}
            onBuatBaru={() => setFormulir((f) => (f ? null : { item: null }))}
          />
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder={`Cari judul ${konfig.label.toLowerCase()}…`}
              aria-label={`Cari ${konfig.label.toLowerCase()}`}
              className="h-9 w-56 rounded-md border-2 border-slate-200 bg-white pl-8 pr-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary"
            />
          </div>
          <MenuKolom tabel={tabel} />
          {jumlahTerpilih > 0 && (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs font-medium text-slate-700">
                {jumlahTerpilih} {konfig.label.toLowerCase()} terpilih
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={bereskanSeleksi}
                  className="h-9 rounded-md border-2 border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  onClick={() => setTargetHapusMassal(true)}
                  className="h-9 rounded-md border-2 border-red-300 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Hapus terpilih
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {formulir && (
        <FormulirKonten
          konfig={konfig}
          item={formulir.item}
          onSimpan={simpan}
          onBatal={() => setFormulir(null)}
        />
      )}

      {!formulir &&
        (memuat ? (
          <p className="py-8 text-center text-sm text-slate-500">Memuat…</p>
        ) : galat ? (
          <KotakGalatMuat
            pesan={`${konfig.label} gagal dimuat. Periksa koneksi lalu coba lagi.`}
            onCobaLagi={muat}
          />
        ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              {tabel.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {tabel.getRowModel().rows.length ? (
                tabel.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="data-[state=selected]:bg-slate-100"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  {/* Lebar baris kosong mengikuti jumlah kolom yang SEDANG
                      tampil — hardcoded 6 akan salah bila pengguna
                      menyembunyikan kolom lewat menu "Kolom". */}
                  <TableCell
                    colSpan={tabel.getVisibleLeafColumns().length}
                    className="py-8 text-center text-slate-500"
                  >
                    {daftar.length === 0
                      ? `Belum ada ${konfig.label.toLowerCase()}. Buka dropdown filter status di atas, lalu pilih “+ ${konfig.label} baru” untuk membuat.`
                      : "Tidak ada hasil yang cocok dengan filter atau pencarian saat ini."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <p className="text-sm text-slate-600">
              {jumlahTerpilih} dari {jumlahTampil} {konfig.label.toLowerCase()} terpilih.
            </p>
            <div className="flex items-center gap-2">
              <Tombol kecil={true} anak="Sebelumnya" disabled={!tabel.getCanPreviousPage()} onClick={() => tabel.previousPage()} />
              <span className="text-sm text-slate-600">
                Halaman {tabel.getState().pagination.pageIndex + 1} dari{" "}
                {Math.max(1, tabel.getPageCount())}
              </span>
              <Tombol kecil={true} anak="Berikutnya" disabled={!tabel.getCanNextPage()} onClick={() => tabel.nextPage()} />
            </div>
          </div>
        </div>
      ))}

      <Modal
        terbuka={Boolean(targetHapus)}
        judul={`Hapus ${konfig.label.toLowerCase()}?`}
        labelKonfirmasi="Hapus"
        jenisKonfirmasi="bahaya"
        onBatal={() => setTargetHapus(null)}
        onKonfirmasi={konfirmasiHapus}
      >
        "{targetHapus?.judul}" akan dihapus permanen.
      </Modal>

      <Modal
        terbuka={targetHapusMassal}
        judul={`Hapus ${jumlahTerpilih} ${konfig.label.toLowerCase()}?`}
        labelKonfirmasi="Hapus semua"
        jenisKonfirmasi="bahaya"
        onBatal={() => setTargetHapusMassal(false)}
        onKonfirmasi={konfirmasiHapusMassal}
      >
        {jumlahTerpilih} data akan dihapus permanen dan tidak dapat dikembalikan.
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------ panel jadi */

export function PanelBerita(props) {
  return (
    <PanelKonten
      {...props}
      konfig={{
        jalur: "berita",
        label: "Berita",
        punyaRingkasan: true,
        contohJudul: "Coaching clinic struktur pion bersama pelatih tamu",
      }}
    />
  );
}

export function PanelPengumuman(props) {
  return (
    <PanelKonten
      {...props}
      konfig={{
        jalur: "pengumuman",
        label: "Pengumuman",
        punyaRingkasan: false,
        contohJudul: "Pendaftaran Turnamen Bulanan September dibuka",
      }}
    />
  );
}
