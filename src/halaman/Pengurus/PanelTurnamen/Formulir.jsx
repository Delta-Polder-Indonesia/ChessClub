import { useState } from "react";
import { Tombol, Bidang } from "../ui.jsx";

/**
 * Formulir untuk membuat turnamen baru.
 *
 * Server memvalidasi seluruh field; umpan balik per-field ditampilkan
 * tepat di bawah input yang bermasalah.
 */
export default function FormulirTurnamen({ jenis, onSimpan, onBatal }) {
  const kunciJenis = Object.keys(jenis);
  const [data, setData] = useState({
    jenis: kunciJenis[0] || "bulanan",
    nama: "",
    status: "draf",
    mulai: "",
    selesai: "",
    tutupDaftar: "",
    tempo: "",
    ronde: "",
    kuota: "",
    biaya: "",
    hadiah: "",
    tempat: "Daring — Chess.com",
    tautan: "",
    deskripsi: "",
  });
  const [galat, setGalat] = useState({});
  const [sibuk, setSibuk] = useState(false);

  const sifat = jenis[data.jenis];
  const ubah = (k, v) => {
    setData((d) => ({ ...d, [k]: v }));
    setGalat((g) => (g[k] ? { ...g, [k]: undefined } : g));
  };

  const kirim = async (e) => {
    e.preventDefault();
    setSibuk(true);
    setGalat({});
    try {
      await onSimpan({
        ...data,
        tempo: data.tempo || sifat?.tempoBawaan,
        ronde: data.ronde === "" ? sifat?.rondeBawaan : Number(data.ronde),
        kuota: data.kuota === "" ? null : Number(data.kuota),
      });
    } catch (err) {
      setGalat(err.galat || {});
      if (!err.galat) throw err;
    } finally {
      setSibuk(false);
    }
  };

  return (
    <form
      onSubmit={kirim}
      className="mb-6 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h3 className="mb-3 text-sm font-bold text-slate-900">Turnamen Baru</h3>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Jenis
          <select
            value={data.jenis}
            onChange={(e) => ubah("jenis", e.target.value)}
            className="rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          >
            {kunciJenis.map((k) => (
              <option key={k} value={k}>
                {jenis[k].label}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2">
          <Bidang
            label="Nama turnamen"
            value={data.nama}
            onChange={(e) => ubah("nama", e.target.value)}
            placeholder="contoh: Turnamen Bulanan Agustus 2026"
          />
          {galat.nama && (
            <p className="mt-1 text-xs text-red-600">{galat.nama}</p>
          )}
        </div>

        <Bidang
          label="Tanggal mulai"
          type="date"
          value={data.mulai}
          onChange={(e) => ubah("mulai", e.target.value)}
        />
        <Bidang
          label="Tanggal selesai"
          type="date"
          value={data.selesai}
          onChange={(e) => ubah("selesai", e.target.value)}
        />
        <Bidang
          label="Tutup pendaftaran"
          type="date"
          value={data.tutupDaftar}
          onChange={(e) => ubah("tutupDaftar", e.target.value)}
        />
        <Bidang
          label={`Tempo (bawaan ${sifat?.tempoBawaan || "-"})`}
          value={data.tempo}
          onChange={(e) => ubah("tempo", e.target.value)}
          placeholder={sifat?.tempoBawaan}
        />
        <Bidang
          label={`Jumlah ronde (bawaan ${sifat?.rondeBawaan ?? 0})`}
          type="number"
          value={data.ronde}
          onChange={(e) => ubah("ronde", e.target.value)}
          placeholder={String(sifat?.rondeBawaan ?? 0)}
        />
        <Bidang
          label="Kuota peserta"
          type="number"
          value={data.kuota}
          onChange={(e) => ubah("kuota", e.target.value)}
          placeholder="kosongkan bila tanpa batas"
        />
        <Bidang
          label="Biaya pendaftaran"
          value={data.biaya}
          onChange={(e) => ubah("biaya", e.target.value)}
          placeholder="contoh: Rp 25.000 / GRATIS"
        />
        <Bidang
          label="Hadiah"
          value={data.hadiah}
          onChange={(e) => ubah("hadiah", e.target.value)}
          placeholder="contoh: Rp 1.000.000"
        />
        <Bidang
          label="Tempat"
          value={data.tempat}
          onChange={(e) => ubah("tempat", e.target.value)}
          placeholder="Daring — Chess.com"
        />
      </div>

      <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-slate-700">
        Deskripsi / catatan
        <textarea
          rows={3}
          value={data.deskripsi}
          onChange={(e) => ubah("deskripsi", e.target.value)}
          placeholder="Format, peraturan khusus, atau info tambahan untuk peserta…"
          className="rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
      </label>

      <div className="mt-3">
        <Bidang
          label="Tautan turnamen (opsional)"
          type="url"
          value={data.tautan}
          onChange={(e) => ubah("tautan", e.target.value)}
          placeholder="https://www.chess.com/play/arena/..."
        />
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Jika diisi, nama turnamen di Beranda akan langsung membuka tautan ini.
        </p>
        {galat.tautan && (
          <p className="mt-1 text-xs text-red-600">{galat.tautan}</p>
        )}
        {galat.selesai && (
          <p className="mt-1 text-xs text-red-600">{galat.selesai}</p>
        )}
      </div>

      <p className="mt-3 rounded bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
        <strong>{sifat?.label}</strong> — sistem {sifat?.sistem}
        {sifat?.bolehNonAnggota
          ? ", terbuka untuk non-anggota"
          : ", khusus anggota komunitas"}
        {sifat?.beregu && ", peserta beregu"}
        {sifat?.klasemenBerjalan && ", klasemen berjalan"}
        {sifat?.minPartai && ` (minimal ${sifat.minPartai} partai)`}.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={sibuk || !data.nama.trim()}
          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
        >
          {sibuk ? "Menyimpan…" : "Simpan"}
        </button>
        <Tombol anak="Batal" onClick={onBatal} />
      </div>
    </form>
  );
}
