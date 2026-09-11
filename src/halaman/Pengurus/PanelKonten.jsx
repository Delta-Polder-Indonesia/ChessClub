import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
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
  const [terpilih, setTerpilih] = useState(() => new Set());
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

  const hapus = (x) => setTargetHapus(x);

  const konfirmasiHapus = async () => {
    const x = targetHapus;
    setTargetHapus(null);
    if (!x) return;
    try {
      await apiPengurus(`/${konfig.jalur}/${x.id}/hapus`, { metode: "POST" });
      beriTahu(`${konfig.label} dihapus.`, "sukses");
      if (formulir?.item?.id === x.id) setFormulir(null);
      await muat();
      muatUlang?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    }
  };

  const konfirmasiHapusMassal = async () => {
    const ids = [...terpilih];
    setTargetHapusMassal(false);
    if (!ids.length) return;
    try {
      for (const id of ids) {
        await apiPengurus(`/${konfig.jalur}/${id}/hapus`, { metode: "POST" });
      }
      beriTahu(`${ids.length} ${konfig.label.toLowerCase()} dihapus.`, "sukses");
      setTerpilih(new Set());
      await muat();
      muatUlang?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    }
  };

  const tampil = daftar.filter((x) => {
    const cocokStatus = !saring || x.status === saring;
    const q = cari.trim().toLowerCase();
    const cocokCari =
      !q ||
      (x.judul || "").toLowerCase().includes(q) ||
      (x.ringkasan || "").toLowerCase().includes(q) ||
      (x.tanggal || "").includes(q);
    return cocokStatus && cocokCari;
  });

  const semuaTerpilih = tampil.length > 0 && tampil.every((x) => terpilih.has(x.id));

  const toggleSemua = () => {
    setTerpilih((s) => {
      const baru = new Set(s);
      if (semuaTerpilih) {
        tampil.forEach((x) => baru.delete(x.id));
      } else {
        tampil.forEach((x) => baru.add(x.id));
      }
      return baru;
    });
  };

  const togglePilih = (id) => {
    setTerpilih((s) => {
      const baru = new Set(s);
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      return baru;
    });
  };

  const bereskanSeleksi = () => setTerpilih(new Set());

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
          {terpilih.size > 0 && (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs font-medium text-slate-700">
                {terpilih.size} {konfig.label.toLowerCase()} terpilih
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
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={semuaTerpilih}
                    onChange={toggleSemua}
                    aria-label="Pilih semua"
                    className="size-4 accent-primary"
                  />
                </TableHead>
                <TableHead>Gambar</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
{tampil.map((x) => (
                <TableRow key={x.id} className={terpilih.has(x.id) ? "bg-blue-50/50" : ""}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={terpilih.has(x.id)}
                      onChange={() => togglePilih(x.id)}
                      aria-label={`Pilih ${x.judul}`}
                      className="size-4 accent-primary"
                    />
                  </TableCell>
                  <TableCell>
                    {x.gambar ? (
                      <img
                        src={x.gambar}
                        alt=""
                        width={64}
                        height={40}
                        className="h-10 w-16 rounded border border-slate-200 object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Tanpa gambar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setFormulir({ item: x })}
                      className="text-left font-medium text-primary hover:underline"
                    >
                      {x.judul}
                    </button>
                  </TableCell>
                  <TableCell className="text-slate-600">{x.tanggal || "—"}</TableCell>
                  <TableCell>
                    <Lencana status={x.status} />
                  </TableCell>
                  <TableCell className="w-24">
                    <MenuAksi
                      onUbah={() => setFormulir({ item: x })}
                      onHapus={() => hapus(x)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {!tampil.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                    Belum ada {konfig.label.toLowerCase()}. Tekan “+
                    {konfig.label} baru” untuk membuat.
                  </TableCell>
                </TableRow>
)}
            </TableBody>
          </Table>
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
        judul={`Hapus ${terpilih.size} ${konfig.label.toLowerCase()}?`}
        labelKonfirmasi="Hapus semua"
        jenisKonfirmasi="bahaya"
        onBatal={() => setTargetHapusMassal(false)}
        onKonfirmasi={konfirmasiHapusMassal}
      >
        {terpilih.size} data akan dihapus permanen dan tidak dapat dikembalikan.
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
