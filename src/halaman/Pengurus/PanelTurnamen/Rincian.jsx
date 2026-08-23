import { useCallback, useEffect, useState } from "react";
import { apiPengurus } from "../../../lib/api/index.js";
import { Tombol, Bidang, Modal } from "../ui.jsx";
import { Lencana, LABEL_STATUS, akunMasihBaru } from "./bagian.jsx";

/**
 * Rincian satu turnamen: status, pengajuan peserta, daftar peserta,
 * pencatatan hasil partai, dan klasemen.
 *
 * Dipisah dari PanelTurnamen.jsx agar berkas induk tetap ramping dan
 * setiap bagian bisa dipahami secara mandiri.
 */
const MENU_KONTEN = [
  { id: "pengajuan", label: "Pengajuan Peserta" },
  { id: "peserta", label: "Peserta" },
  { id: "hasil", label: "Catat Hasil" },
  { id: "klasemen", label: "Klasemen" },
  { id: "pengaturan", label: "Pengaturan" },
];

function IkonSampah() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function RincianTurnamen({ id, jenis, beriTahu, onTutup, onBerubah }) {
  const [t, setT] = useState(null);
  const [sibuk, setSibuk] = useState("");
  const [tabKonten, setTabKonten] = useState("pengajuan");
  const [pesertaBaru, setPesertaBaru] = useState("");
  const [timBaru, setTimBaru] = useState("");
  const [tautan, setTautan] = useState("");
  const [hasil, setHasil] = useState({ ronde: 1, putih: "", hitam: "", skor: "1-0" });
  const [targetTolak, setTargetTolak] = useState(null);

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
    if (diterima) {
      jalankan(
        `pengajuan-${pengajuan.username}`,
        () =>
          apiPengurus(`/turnamen/${id}/pengajuan-terima`, {
            metode: "POST",
            bodi: { username: pengajuan.username },
          }),
        `${pengajuan.username} diterima sebagai peserta.`
      );
      return;
    }
    setTargetTolak(pengajuan);
  };

  const konfirmasiTolak = (alasan) => {
    const pengajuan = targetTolak;
    setTargetTolak(null);
    if (!pengajuan) return;
    jalankan(
      `pengajuan-${pengajuan.username}`,
      () =>
        apiPengurus(`/turnamen/${id}/pengajuan-tolak`, {
          metode: "POST",
          bodi: {
            username: pengajuan.username,
            alasan: alasan || "Tidak lolos peninjauan pengurus.",
          },
        }),
      `Pengajuan ${pengajuan.username} ditolak.`
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

  if (!t) return <p className="py-6 text-sm text-slate-500">Memuat turnamen…</p>;

  const sifat = jenis[t.jenis] || {};

  return (
    <div>
      <div className="mb-5 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Lencana status={t.status} />
            <p className="text-xs text-slate-500">
              {sifat.label} · {t.sistem} · {t.tempo}
              {t.ronde ? ` · ${t.ronde} ronde` : ""} · {t.jumlahPeserta} peserta
              {t.kuota ? ` / ${t.kuota}` : ""}
            </p>
          </div>
          <ul className="flex flex-wrap items-center gap-x-6 font-semibold text-sm">
            {MENU_KONTEN.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setTabKonten(m.id)}
                  className={`transition-colors duration-200 ${
                    tabKonten === m.id
                      ? "text-primary"
                      : "text-slate-800 hover:text-primary"
                  }`}
                >
                  {m.label}
                </button>
              </li>
            ))}
            <li>
              <Tombol anak="Tutup" onClick={onTutup} kecil />
            </li>
          </ul>
        </div>
      </div>

      {tabKonten === "pengaturan" && (
        <>
      {/* status */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-600">Ubah status:</span>
        <select
          value={t.status}
          disabled={sibuk === "status"}
          onChange={(e) => ubahStatus(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-primary"
        >
          {["draf", "pendaftaran", "berlangsung", "selesai", "batal"].map((s) => (
            <option key={s} value={s}>
              {LABEL_STATUS[s].teks}
            </option>
          ))}
        </select>
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
        </>
      )}

      {tabKonten === "pengajuan" && (
      <section className="mb-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-900">Pengajuan Peserta</h4>
          <span className="text-xs text-slate-500">
            {(t.pengajuan || []).filter((p) => p.status === "menunggu").length} menunggu
          </span>
        </div>
        <p className="mb-3 text-xs leading-5 text-slate-500">
          Periksa profil dan usia akun sebelum menerima. Sistem sudah menolak
          non-anggota, anggota yang belum melengkapi data website, akun yang
          ditutup, username terlarang, serta identitas yang cocok dengan daftar larangan.
        </p>
        <div className="overflow-auto">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th>Player</th>
                <th>Akun dibuat</th>
                <th>Status akun</th>
                <th>Pengajuan</th>
                <th>Keputusan</th>
              </tr>
            </thead>
            <tbody>
              {(t.pengajuan || []).map((p) => (
                <tr key={p.username}>
                  <td>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold text-primary hover:underline"
                    >
                      {p.username} ↗
                    </a>
                    {p.panggilan && p.panggilan !== p.username && (
                      <span className="block text-xs text-slate-500">
                        {p.panggilan}
                      </span>
                    )}
                  </td>
                  <td className="text-xs text-slate-600">
                    {p.akunDibuatPada
                      ? new Date(p.akunDibuatPada).toLocaleDateString("id-ID")
                      : "—"}
                    {akunMasihBaru(p.akunDibuatPada) && (
                      <span className="mt-1 block font-semibold text-red-700">
                        Akun baru (&lt;30 hari)
                      </span>
                    )}
                  </td>
                  <td className="text-xs text-slate-600">
                    {p.statusChess || "aktif"}
                  </td>
                  <td>
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
                  <td>
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
                      <span className="text-xs text-slate-400">
                        Sudah diputuskan
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!t.pengajuan?.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    Belum ada player yang mengajukan diri.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {tabKonten === "peserta" && (
        <section>
          <h4 className="mb-2 text-sm font-bold text-slate-900">Peserta</h4>
          <form onSubmit={tambahPeserta} className="mb-3 flex flex-wrap items-end gap-2">
            <Bidang
              label="Username Chess.com"
              value={pesertaBaru}
              onChange={(e) => setPesertaBaru(e.target.value)}
              placeholder="namauser"
            />
            <Bidang
              label="Klub"
              value={timBaru}
              onChange={(e) => setTimBaru(e.target.value)}
              placeholder="nama komunitas"
            />
            <Tombol
              anak="Tambah"
              onClick={tambahPeserta}
              disabled={sibuk === "peserta"}
            />
          </form>
          <div className="overflow-auto">
            <table className="tabel-kci tabel-peringkat">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Rating</th>
                  <th>Nama</th>
                  <th>Klub</th>
                  <th>Chess.com</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {t.peserta.map((p, index) => (
                  <tr key={p.username}>
                    <td>{index + 1}</td>
                    <td className={p.dianulir ? "text-red-600 line-through" : ""}>
                      {p.rating ?? "—"}
                    </td>
                    <td>
                      <span
                        className={
                          p.dianulir
                            ? "font-semibold text-red-600 line-through"
                            : "font-semibold text-slate-800"
                        }
                      >
                        {p.panggilan || p.username}
                      </span>
                      {!p.anggota && (
                        <span className="ml-1 text-xs text-amber-700">tamu</span>
                      )}
                    </td>
                    <td className="text-slate-600">{p.tim || "—"}</td>
                    <td>
                      <a
                        href={`https://www.chess.com/member/${encodeURIComponent(
                          p.username
                        )}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-semibold text-primary hover:underline"
                      >
                        {p.username} ↗
                      </a>
                    </td>
                    <td>
                      <button
                        type="button"
                        aria-label={`Keluarkan ${p.panggilan || p.username}`}
                        title="Keluarkan peserta"
                        disabled={sibuk === "keluar"}
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
                        className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <IkonSampah />
                      </button>
                    </td>
                  </tr>
                ))}
                {!t.peserta.length && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                      Belum ada peserta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tabKonten === "hasil" && (
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
            <div className="max-h-60 overflow-y-auto">
              <table className="tabel-kci tabel-peringkat">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ronde</th>
                    <th>Putih</th>
                    <th
                      style={{
                        textAlign: "center",
                        paddingLeft: 24,
                        paddingRight: 24,
                      }}
                    >
                      Skor
                    </th>
                    <th>Hitam</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {t.hasil.map((h, i) => (
                    <tr key={i}>
                      <td className="text-slate-500">{i + 1}</td>
                      <td className="text-slate-600">{h.ronde}</td>
                      <td className="text-slate-800">{h.putih}</td>
                      <td
                        style={{
                          textAlign: "center",
                          paddingLeft: 24,
                          paddingRight: 24,
                        }}
                        className="font-bold text-slate-900"
                      >
                        {h.skor}
                      </td>
                      <td className="text-slate-800">{h.hitam}</td>
                      <td>
                        <button
                          type="button"
                          aria-label={`Hapus hasil partai ${i + 1}`}
                          title="Hapus hasil"
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
                          className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <IkonSampah />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* klasemen */}
      {tabKonten === "klasemen" && (
        <>
          {!t.klasemen?.length && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              Belum ada klasemen. Klasemen terbentuk otomatis setelah ada hasil
              yang dicatat.
            </p>
          )}
          {Boolean(t.klasemen?.length) && (
            <section>
              <h4 className="mb-2 text-sm font-bold text-slate-900">Klasemen</h4>
          <div className="overflow-auto">
            <table className="tabel-kci tabel-peringkat">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Rating</th>
                  <th>Pemain</th>
                  <th>Main</th>
                  <th>M/R/K</th>
                  <th>Poin</th>
                  <th>SB</th>
                </tr>
              </thead>
              <tbody>
                {t.klasemen.map((k) => (
                  <tr key={k.username}>
                    <td className="text-slate-500">{k.peringkat}</td>
                    <td className="text-slate-600">{k.rating ?? "—"}</td>
                    <td className="font-medium text-slate-800">
                      {k.panggilan}
                      {!k.resmi && (
                        <span
                          title="Belum memenuhi minimal partai"
                          aria-label="Belum memenuhi minimal partai"
                          className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-black align-middle text-[10px] font-bold text-black"
                        >
                          ?
                        </span>
                      )}
                    </td>
                    <td className="text-slate-600">{k.main}</td>
                    <td className="text-slate-600">
                      {k.menang}/{k.remis}/{k.kalah}
                    </td>
                    <td className="font-bold text-slate-900">{k.poin}</td>
                    <td className="text-slate-600">{k.sb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Boolean(t.klasemenTim?.length) && (
            <div className="mt-3 overflow-auto">
              <table className="tabel-kci tabel-peringkat">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tim</th>
                    <th>Pemain</th>
                    <th>Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {t.klasemenTim.map((k) => (
                    <tr key={k.tim}>
                      <td className="text-slate-500">{k.peringkat}</td>
                      <td className="font-medium text-slate-800">{k.tim}</td>
                      <td className="text-slate-600">{k.pemain}</td>
                      <td className="font-bold text-slate-900">{k.poin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </section>
          )}
        </>
      )}

      <Modal
        terbuka={Boolean(targetTolak)}
        judul={`Tolak pengajuan ${targetTolak?.username || ""}`}
        labelKonfirmasi="Tolak"
        jenisKonfirmasi="bahaya"
        butuhInput
        placeholderInput="Alasan penolakan (dikirim ke pengajuan)…"
        nilaiBawaanInput="Tidak lolos peninjauan pengurus."
        catatanInput="Alasan ini tampil pada kolom pengajuan dan terlihat oleh pengurus lain."
        sibuk={sibuk === `pengajuan-${targetTolak?.username}`}
        onBatal={() => setTargetTolak(null)}
        onKonfirmasi={konfirmasiTolak}
      >
        Menolak pengajuan akan mengembalikan pemain ke daftar pengajuan
        dengan status ditolak. Anda masih bisa menerimanya nanti bila
        berubah pikiran.
      </Modal>
    </div>
  );
}
