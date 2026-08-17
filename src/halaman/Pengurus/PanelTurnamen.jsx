import { useCallback, useEffect, useState } from "react";
import { apiPengurus, jenisTurnamen } from "../../lib/chessAnggota.js";
import { Tombol, Bidang } from "./ui.jsx";

/**
 * Pengelolaan turnamen untuk pengurus.
 *
 * Satu antarmuka untuk keempat jenis turnamen (Bulanan, Liga Musiman,
 * Terbuka, Liga Antar Komunitas) — yang membedakan hanya aturannya, dan
 * aturan itu datang dari server lewat /api/turnamen/jenis.
 */

const LABEL_STATUS = {
  draf: { teks: "Draf", kelas: "bg-slate-100 text-slate-700" },
  pendaftaran: { teks: "Pendaftaran", kelas: "bg-blue-50 text-blue-700" },
  berlangsung: { teks: "Berlangsung", kelas: "bg-amber-50 text-amber-800" },
  selesai: { teks: "Selesai", kelas: "bg-emerald-50 text-emerald-700" },
  batal: { teks: "Batal", kelas: "bg-red-50 text-red-700" },
};

function akunMasihBaru(iso) {
  if (!iso) return false;
  const umurHari = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return Number.isFinite(umurHari) && umurHari < 30;
}

function Lencana({ status }) {
  const s = LABEL_STATUS[status] || LABEL_STATUS.draf;
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.kelas}`}>
      {s.teks}
    </span>
  );
}

/* ------------------------------------------------------- formulir baru */

function FormulirTurnamen({ jenis, onSimpan, onBatal }) {
  const kunciJenis = Object.keys(jenis);
  const [data, setData] = useState({
    jenis: kunciJenis[0] || "bulanan",
    nama: "",
    status: "draf",
    mulai: "",
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
          label="Hadiah"
          value={data.hadiah}
          onChange={(e) => ubah("hadiah", e.target.value)}
          placeholder="contoh: Rp 1.000.000"
        />
      </div>

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

/* ------------------------------------------------------ rincian turnamen */

function RincianTurnamen({ id, jenis, beriTahu, onTutup, onBerubah }) {
  const [t, setT] = useState(null);
  const [sibuk, setSibuk] = useState("");
  const [pesertaBaru, setPesertaBaru] = useState("");
  const [timBaru, setTimBaru] = useState("");
  const [tautan, setTautan] = useState("");
  const [hasil, setHasil] = useState({ ronde: 1, putih: "", hitam: "", skor: "1-0" });

  const muat = useCallback(async () => {
    try {
      const data = await apiPengurus(`/turnamen/${id}`);
      setT(data);
      setTautan(data.tautan || "");
    } catch (e) {
      beriTahu(e.message, "galat");
    }
  }, [id, beriTahu]);

  useEffect(() => {
    muat();
  }, [muat]);

  const jalankan = async (kunci, fn, pesanSukses) => {
    setSibuk(kunci);
    try {
      await fn();
      if (pesanSukses) beriTahu(pesanSukses, "sukses");
      await muat();
      onBerubah?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk("");
    }
  };

  if (!t) return <p className="py-6 text-sm text-slate-500">Memuat turnamen…</p>;

  const sifat = jenis[t.jenis] || {};

  const ubahStatus = (status) =>
    jalankan(
      "status",
      () => apiPengurus(`/turnamen/${id}/ubah`, { metode: "POST", bodi: { status } }),
      `Status diubah menjadi "${status}".`
    );

  const simpanTautan = (e) => {
    e.preventDefault();
    const nilai = tautan.trim();
    if (nilai && !/^https:\/\//i.test(nilai)) {
      beriTahu("Tautan turnamen harus diawali https://", "galat");
      return;
    }
    jalankan(
      "tautan",
      () =>
        apiPengurus(`/turnamen/${id}/ubah`, {
          metode: "POST",
          bodi: { tautan: nilai },
        }),
      nilai
        ? "Tautan turnamen disimpan. Nama turnamen di Beranda sekarang dapat diklik."
        : "Tautan turnamen dihapus."
    );
  };

  const tambahPeserta = (e) => {
    e.preventDefault();
    if (!pesertaBaru.trim()) return;
    jalankan(
      "peserta",
      async () => {
        await apiPengurus(`/turnamen/${id}/peserta`, {
          metode: "POST",
          bodi: { username: pesertaBaru.trim(), tim: timBaru.trim() || undefined },
        });
        setPesertaBaru("");
        setTimBaru("");
      },
      "Peserta ditambahkan."
    );
  };

  const catat = (e) => {
    e.preventDefault();
    if (!hasil.putih || !hasil.hitam) return;
    jalankan(
      "hasil",
      async () => {
        await apiPengurus(`/turnamen/${id}/hasil`, { metode: "POST", bodi: hasil });
        setHasil((h) => ({ ...h, putih: "", hitam: "" }));
      },
      "Hasil dicatat."
    );
  };

  const putuskanPengajuan = (pengajuan, diterima) => {
    const alasan = diterima
      ? ""
      : window.prompt(
          `Alasan menolak pengajuan ${pengajuan.username}:`,
          "Tidak lolos peninjauan pengurus."
        );
    if (!diterima && alasan === null) return;
    jalankan(
      `pengajuan-${pengajuan.username}`,
      () =>
        apiPengurus(
          `/turnamen/${id}/${diterima ? "pengajuan-terima" : "pengajuan-tolak"}`,
          {
            metode: "POST",
            bodi: { username: pengajuan.username, alasan },
          }
        ),
      diterima
        ? `${pengajuan.username} diterima sebagai peserta.`
        : `Pengajuan ${pengajuan.username} ditolak.`
    );
  };

  const pindai = () =>
    jalankan("pindai", async () => {
      const h = await apiPengurus(`/turnamen/${id}/pindai`, { metode: "POST" });
      beriTahu(
        h.dianulir.length
          ? `${h.dianulir.length} peserta dianulir karena ban fair play: ${h.dianulir.join(", ")}`
          : `${h.diperiksa} peserta diperiksa, semuanya bersih.`,
        h.dianulir.length ? "peringatan" : "sukses"
      );
    });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{t.nama}</h3>
            <Lencana status={t.status} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {sifat.label} · {t.sistem} · {t.tempo}
            {t.ronde ? ` · ${t.ronde} ronde` : ""} · {t.jumlahPeserta} peserta
            {t.kuota ? ` / ${t.kuota}` : ""}
          </p>
        </div>
        <Tombol anak="Tutup" onClick={onTutup} kecil />
      </div>

      {/* status */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-600">Ubah status:</span>
        {["draf", "pendaftaran", "berlangsung", "selesai", "batal"].map((s) => (
          <Tombol
            key={s}
            anak={LABEL_STATUS[s].teks}
            kecil
            jenis={t.status === s ? "utama" : "biasa"}
            onClick={() => ubahStatus(s)}
            disabled={sibuk === "status" || t.status === s}
          />
        ))}
        <Tombol
          anak={sibuk === "pindai" ? "Memindai…" : "Pindai peserta"}
          kecil
          jenis="bahaya"
          onClick={pindai}
          disabled={sibuk === "pindai" || !t.jumlahPeserta}
        />
      </div>

      <form
        onSubmit={simpanTautan}
        className="mb-5 border-y border-slate-200 bg-slate-50/60 px-3 py-3"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[260px] flex-1">
            <Bidang
              label="Tautan turnamen"
              type="url"
              value={tautan}
              onChange={(e) => setTautan(e.target.value)}
              placeholder="https://www.chess.com/play/arena/..."
            />
          </div>
          <Tombol
            anak={sibuk === "tautan" ? "Menyimpan…" : "Simpan tautan"}
            jenis="utama"
            onClick={simpanTautan}
            disabled={sibuk === "tautan"}
          />
          {/^https:\/\//i.test(tautan) && (
            <a
              href={tautan}
              target="_blank"
              rel="noreferrer noopener"
              className="px-2 py-2 text-xs font-semibold text-primary hover:underline"
            >
              Uji tautan ↗
            </a>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Player yang mengklik nama turnamen di Beranda akan diarahkan langsung
          ke alamat ini. Kosongkan lalu simpan untuk menghapus tautan.
        </p>
      </form>

      <section className="mb-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-900">Pengajuan Peserta</h4>
          <span className="text-xs text-slate-500">
            {(t.pengajuan || []).filter((p) => p.status === "menunggu").length} menunggu
          </span>
        </div>
        <p className="mb-3 text-xs leading-5 text-slate-500">
          Periksa profil dan usia akun sebelum menerima. Sistem sudah menolak
          non-anggota, akun yang ditutup, username terlarang, serta identitas
          terverifikasi yang cocok dengan daftar larangan.
        </p>
        <div className="overflow-x-auto border border-slate-200">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Akun dibuat</th>
                <th className="px-3 py-2">Status akun</th>
                <th className="px-3 py-2">Pengajuan</th>
                <th className="px-3 py-2">Keputusan</th>
              </tr>
            </thead>
            <tbody>
              {(t.pengajuan || []).map((p) => (
                <tr key={p.username} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold text-primary hover:underline"
                    >
                      {p.username} ↗
                    </a>
                    {p.panggilan && p.panggilan !== p.username && (
                      <span className="block text-xs text-slate-500">{p.panggilan}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {p.akunDibuatPada
                      ? new Date(p.akunDibuatPada).toLocaleDateString("id-ID")
                      : "—"}
                    {akunMasihBaru(p.akunDibuatPada) && (
                      <span className="mt-1 block font-semibold text-red-700">
                        Akun baru (&lt;30 hari)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {p.statusChess || "aktif"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs font-semibold ${
                        p.status === "menunggu"
                          ? "text-amber-700"
                          : p.status === "diterima"
                            ? "text-emerald-700"
                            : "text-red-700"
                      }`}
                    >
                      {p.status}
                    </span>
                    {p.alasan && (
                      <span className="block max-w-[220px] text-xs text-slate-500">
                        {p.alasan}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {p.status === "menunggu" ? (
                      <div className="flex gap-1.5">
                        <Tombol
                          anak="Terima"
                          kecil
                          jenis="utama"
                          onClick={() => putuskanPengajuan(p, true)}
                          disabled={sibuk === `pengajuan-${p.username}`}
                        />
                        <Tombol
                          anak="Tolak"
                          kecil
                          jenis="bahaya"
                          onClick={() => putuskanPengajuan(p, false)}
                          disabled={sibuk === `pengajuan-${p.username}`}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Sudah diputuskan</span>
                    )}
                  </td>
                </tr>
              ))}
              {!t.pengajuan?.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                    Belum ada player yang mengajukan diri.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* peserta */}
        <section>
          <h4 className="mb-2 text-sm font-bold text-slate-900">Peserta</h4>
          <form onSubmit={tambahPeserta} className="mb-3 flex flex-wrap items-end gap-2">
            <Bidang
              label="Username Chess.com"
              value={pesertaBaru}
              onChange={(e) => setPesertaBaru(e.target.value)}
              placeholder="namauser"
            />
            {sifat.beregu && (
              <Bidang
                label="Tim"
                value={timBaru}
                onChange={(e) => setTimBaru(e.target.value)}
                placeholder="nama komunitas"
              />
            )}
            <Tombol
              anak="Tambah"
              onClick={tambahPeserta}
              disabled={sibuk === "peserta"}
            />
          </form>
          <ul className="divide-y divide-slate-100 rounded border border-slate-200">
            {t.peserta.map((p) => (
              <li
                key={p.username}
                className="flex items-center justify-between px-3 py-1.5 text-sm"
              >
                <span className={p.dianulir ? "text-red-600 line-through" : "text-slate-800"}>
                  {p.panggilan}{" "}
                  <span className="text-xs text-slate-500">({p.username})</span>
                  {p.tim && (
                    <span className="ml-1 rounded bg-slate-100 px-1.5 text-xs">
                      {p.tim}
                    </span>
                  )}
                  {!p.anggota && (
                    <span className="ml-1 text-xs text-amber-700">tamu</span>
                  )}
                </span>
                <Tombol
                  anak="×"
                  kecil
                  onClick={() =>
                    jalankan(
                      "keluar",
                      () =>
                        apiPengurus(`/turnamen/${id}/peserta-keluar`, {
                          metode: "POST",
                          bodi: { username: p.username },
                        }),
                      "Peserta dikeluarkan."
                    )
                  }
                />
              </li>
            ))}
            {!t.peserta.length && (
              <li className="px-3 py-4 text-center text-sm text-slate-500">
                Belum ada peserta.
              </li>
            )}
          </ul>
        </section>

        {/* hasil */}
        <section>
          <h4 className="mb-2 text-sm font-bold text-slate-900">Catat Hasil</h4>
          <form onSubmit={catat} className="mb-3 grid grid-cols-2 gap-2">
            <Bidang
              label="Ronde"
              type="number"
              min="1"
              value={hasil.ronde}
              onChange={(e) => setHasil({ ...hasil, ronde: Number(e.target.value) })}
            />
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
              Hasil
              <select
                value={hasil.skor}
                onChange={(e) => setHasil({ ...hasil, skor: e.target.value })}
                className="rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              >
                <option value="1-0">Putih menang</option>
                <option value="0-1">Hitam menang</option>
                <option value="0.5-0.5">Remis</option>
              </select>
            </label>
            {["putih", "hitam"].map((sisi) => (
              <label
                key={sisi}
                className="flex flex-col gap-1 text-xs font-medium capitalize text-slate-700"
              >
                {sisi}
                <select
                  value={hasil[sisi]}
                  onChange={(e) => setHasil({ ...hasil, [sisi]: e.target.value })}
                  className="rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">— pilih —</option>
                  {t.peserta
                    .filter((p) => !p.dianulir)
                    .map((p) => (
                      <option key={p.username} value={p.username}>
                        {p.panggilan}
                      </option>
                    ))}
                </select>
              </label>
            ))}
            <div className="col-span-2">
              <Tombol
                anak="Catat hasil"
                jenis="utama"
                onClick={catat}
                disabled={sibuk === "hasil" || !hasil.putih || !hasil.hitam}
              />
            </div>
          </form>

          {Boolean(t.hasil?.length) && (
            <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto rounded border border-slate-200 text-xs">
              {t.hasil.map((h, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-slate-700">
                    R{h.ronde}: {h.putih} <strong>{h.skor}</strong> {h.hitam}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      jalankan(
                        "hapusHasil",
                        () =>
                          apiPengurus(`/turnamen/${id}/hasil-hapus`, {
                            metode: "POST",
                            bodi: { indeks: i },
                          }),
                        "Hasil dihapus."
                      )
                    }
                    className="text-red-600 hover:underline"
                  >
                    hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* klasemen */}
      {Boolean(t.klasemen?.length) && (
        <section className="mt-6">
          <h4 className="mb-2 text-sm font-bold text-slate-900">Klasemen</h4>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-1.5">#</th>
                  <th className="px-3 py-1.5">Pemain</th>
                  <th className="px-3 py-1.5">Main</th>
                  <th className="px-3 py-1.5">M/R/K</th>
                  <th className="px-3 py-1.5">Poin</th>
                  <th className="px-3 py-1.5">SB</th>
                </tr>
              </thead>
              <tbody>
                {t.klasemen.map((k) => (
                  <tr key={k.username} className="border-t border-slate-100">
                    <td className="px-3 py-1.5 text-slate-500">{k.peringkat}</td>
                    <td className="px-3 py-1.5 font-medium text-slate-800">
                      {k.panggilan}
                      {!k.resmi && (
                        <span className="ml-1 text-xs text-amber-700">
                          belum memenuhi minimal partai
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600">{k.main}</td>
                    <td className="px-3 py-1.5 text-slate-600">
                      {k.menang}/{k.remis}/{k.kalah}
                    </td>
                    <td className="px-3 py-1.5 font-bold text-slate-900">{k.poin}</td>
                    <td className="px-3 py-1.5 text-slate-600">{k.sb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Boolean(t.klasemenTim?.length) && (
            <div className="mt-3 overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-1.5">#</th>
                    <th className="px-3 py-1.5">Tim</th>
                    <th className="px-3 py-1.5">Pemain</th>
                    <th className="px-3 py-1.5">Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {t.klasemenTim.map((k) => (
                    <tr key={k.tim} className="border-t border-slate-100">
                      <td className="px-3 py-1.5 text-slate-500">{k.peringkat}</td>
                      <td className="px-3 py-1.5 font-medium text-slate-800">{k.tim}</td>
                      <td className="px-3 py-1.5 text-slate-600">{k.pemain}</td>
                      <td className="px-3 py-1.5 font-bold text-slate-900">{k.poin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- panel */

export default function PanelTurnamen({ beriTahu, muatUlang }) {
  const [jenis, setJenis] = useState({});
  const [daftar, setDaftar] = useState([]);
  const [pilih, setPilih] = useState(null);
  const [buatBaru, setBuatBaru] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const [saring, setSaring] = useState("");

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const [j, d] = await Promise.all([jenisTurnamen(), apiPengurus("/turnamen")]);
      setJenis(j.jenis);
      setDaftar(d);
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setMemuat(false);
    }
  }, [beriTahu]);

  useEffect(() => {
    muat();
  }, [muat]);

  const simpanBaru = async (data) => {
    const t = await apiPengurus("/turnamen", { metode: "POST", bodi: data });
    beriTahu(`Turnamen "${t.nama}" dibuat.`, "sukses");
    setBuatBaru(false);
    await muat();
    muatUlang?.();
    setPilih(t.id);
  };

  const hapus = async (t) => {
    if (!window.confirm(`Hapus turnamen "${t.nama}"? Tindakan ini permanen.`))
      return;
    try {
      await apiPengurus(`/turnamen/${t.id}/hapus`, { metode: "POST" });
      beriTahu("Turnamen dihapus.", "sukses");
      if (pilih === t.id) setPilih(null);
      await muat();
      muatUlang?.();
    } catch (e) {
      beriTahu(e.message, "galat");
    }
  };

  const tampil = saring ? daftar.filter((t) => t.jenis === saring) : daftar;

  if (pilih) {
    return (
      <RincianTurnamen
        id={pilih}
        jenis={jenis}
        beriTahu={beriTahu}
        onTutup={() => setPilih(null)}
        onBerubah={() => {
          muat();
          muatUlang?.();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Tombol
            anak="Semua"
            kecil
            jenis={saring === "" ? "utama" : "biasa"}
            onClick={() => setSaring("")}
          />
          {Object.entries(jenis).map(([k, v]) => (
            <Tombol
              key={k}
              anak={v.label}
              kecil
              jenis={saring === k ? "utama" : "biasa"}
              onClick={() => setSaring(k)}
            />
          ))}
        </div>
        <Tombol
          anak={buatBaru ? "Tutup formulir" : "+ Turnamen baru"}
          jenis="utama"
          onClick={() => setBuatBaru((b) => !b)}
        />
      </div>

      {buatBaru && (
        <FormulirTurnamen
          jenis={jenis}
          onSimpan={simpanBaru}
          onBatal={() => setBuatBaru(false)}
        />
      )}

      {memuat ? (
        <p className="py-8 text-center text-sm text-slate-500">Memuat…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Nama</th>
                <th className="px-3 py-2 font-semibold">Jenis</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Mulai</th>
                <th className="px-3 py-2 font-semibold">Peserta</th>
                <th className="px-3 py-2 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setPilih(t.id)}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.nama}
                    </button>
                    {t.jumlahPengajuan > 0 && (
                      <span className="ml-2 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        {t.jumlahPengajuan} pengajuan
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {jenis[t.jenis]?.label || t.jenis}
                  </td>
                  <td className="px-3 py-2">
                    <Lencana status={t.status} />
                  </td>
                  <td className="px-3 py-2 text-slate-600">{t.mulai || "—"}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {t.jumlahPeserta}
                    {t.kuota ? ` / ${t.kuota}` : ""}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5">
                      <Tombol anak="Kelola" kecil onClick={() => setPilih(t.id)} />
                      <Tombol
                        anak="Hapus"
                        kecil
                        jenis="bahaya"
                        onClick={() => hapus(t)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!tampil.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    Belum ada turnamen. Tekan “+ Turnamen baru” untuk membuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
