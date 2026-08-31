import { useCallback, useEffect, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { Tombol, Bidang, Modal } from "./ui.jsx";

/**
 * Pengelolaan konten komunitas (berita & pengumuman).
 *
 * Satu panel generik dipakai dua jenis konten yang bentuknya hampir sama
 * (judul, isi, tanggal, status) — perbedaannya hanya ringkasan yang khusus
 * untuk berita. PanelBerita dan PanelPengumuman tinggal mengatur konfigurasi.
 */

const STATUS = {
  draf: { teks: "Draf", kelas: "bg-slate-100 text-slate-700" },
  publik: { teks: "Publik", kelas: "bg-emerald-50 text-emerald-700" },
};

function Lencana({ status }) {
  const s = STATUS[status] || STATUS.draf;
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.kelas}`}>
      {s.teks}
    </span>
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

      <div className="grid gap-3 md:grid-cols-2">
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
          className="rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
      </label>

      <fieldset className="space-y-2 rounded border border-slate-200 p-3">
        <legend className="px-1 text-xs font-semibold text-slate-700">
          Gambar <span className="font-normal text-slate-500">(opsional)</span>
        </legend>
        <p className="text-xs leading-5 text-slate-500">
          Konten tanpa gambar tetap dapat diterbitkan. JPG, PNG, atau WebP
          sampai 8 MB; otomatis diperkecil. GIF animasi tidak didukung
          (animasinya hilang saat kompresi).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-blue-50">
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
              className="aspect-video w-full border border-slate-200 object-cover"
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

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
        Status
        <select
          value={data.status}
          onChange={(e) => ubah("status", e.target.value)}
          className="rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        >
          <option value="publik">Publik — langsung tampil di situs</option>
          <option value="draf">Draf — hanya terlihat di dashboard</option>
        </select>
      </label>

      {pesan && <p className="text-xs text-red-600">{pesan}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sibuk || memprosesGambar || !data.judul.trim()}
          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
        >
          {sibuk ? "Menyimpan…" : "Simpan"}
        </button>
        <Tombol anak="Batal" onClick={onBatal} />
      </div>
    </form>
  );
}

/* -------------------------------------------------------------- panel */

function PanelKonten({ konfig, beriTahu, muatUlang }) {
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [formulir, setFormulir] = useState(null); // null | {item:null} | {item}
  const [saring, setSaring] = useState("");
  const [targetHapus, setTargetHapus] = useState(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      setDaftar(await apiPengurus(`/${konfig.jalur}`));
    } catch (e) {
      beriTahu(e.message, "galat");
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

  const tampil = saring ? daftar.filter((x) => x.status === saring) : daftar;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap">
          <button
            type="button"
            onClick={() => setSaring("")}
            className={`-mb-px px-4 py-2.5 text-sm font-medium ${
              saring === ""
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Semua
          </button>
          {Object.entries(STATUS).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSaring(k)}
              className={`-mb-px px-4 py-2.5 text-sm font-medium ${
                saring === k
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {v.teks}
            </button>
          ))}
        </div>
        <Tombol
          anak={formulir ? "Tutup formulir" : `+ ${konfig.label} baru`}
          onClick={() => setFormulir((f) => (f ? null : { item: null }))}
        />
      </div>

      {formulir && (
        <FormulirKonten
          konfig={konfig}
          item={formulir.item}
          onSimpan={simpan}
          onBatal={() => setFormulir(null)}
        />
      )}

      {memuat ? (
        <p className="py-8 text-center text-sm text-slate-500">Memuat…</p>
      ) : (
        <div className="overflow-auto">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th>Gambar</th>
                <th>Judul</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((x) => (
                <tr key={x.id}>
                  <td>
                    {x.gambar ? (
                      <img
                        src={x.gambar}
                        alt=""
                        width={64}
                        height={40}
                        className="h-10 w-16 object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Tanpa gambar</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setFormulir({ item: x })}
                      className="text-left font-medium text-primary hover:underline"
                    >
                      {x.judul}
                    </button>
                  </td>
                  <td className="text-slate-600">{x.tanggal || "—"}</td>
                  <td>
                    <Lencana status={x.status} />
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <Tombol anak="Ubah" kecil onClick={() => setFormulir({ item: x })} />
                      <Tombol
                        anak="Hapus"
                        kecil
                        onClick={() => hapus(x)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!tampil.length && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Belum ada {konfig.label.toLowerCase()}. Tekan “+
                    {konfig.label} baru” untuk membuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
