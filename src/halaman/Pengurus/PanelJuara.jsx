import { useCallback, useEffect, useRef, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { parseWaktuKomunitas } from "../../lib/waktu.js";
import { Tombol, Modal } from "./ui.jsx";

/**
 * Panel "Juara Turnamen".
 */

const LABEL_JENIS = {
  bulanan: "Turnamen Bulanan",
  musiman: "Liga Musiman",
  terbuka: "Turnamen Terbuka",
  "antar-komunitas": "Liga Antar Komunitas",
};

function tanggal(nilai) {
  if (!nilai) return "—";
  // Jam turnamen disimpan tanpa zona waktu; parse eksplisit sebagai
  // Asia/Jakarta agar tidak bergeser di zona browser.
  const d = parseWaktuKomunitas(nilai);
  if (!d) return nilai;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const kelasIsian =
  "rounded border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-primary";

function IkonPensil() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function IkonSampah() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

export default function PanelJuara({ beriTahu }) {
  const [daftar, setDaftar] = useState(null);
  const [gagal, setGagal] = useState(false);

  const muat = useCallback(async () => {
    try {
      const data = await apiPengurus("/turnamen");
      // Saringan disamakan persis dengan tabel "Hasil Turnamen" publik.
      const arsip = data
        .filter((t) => t.status !== "batal" && (t.status === "selesai" || t.juara))
        .sort((a, b) =>
          String(b.selesai || b.mulai || "").localeCompare(
            String(a.selesai || a.mulai || "")
          )
        );
      setDaftar(arsip);
    } catch {
      setGagal(true);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  const [baru, setBaru] = useState({
    nama: "",
    jenis: "bulanan",
    juara: "",
    mulai: "",
    selesai: "",
  });
  const [sibukBaru, setSibukBaru] = useState(false);
  const [jenisManual, setJenisManual] = useState("");
  const refJenis = useRef(null);

  const simpanBaru = async () => {
    const mentah =
      baru.jenis === "manual" ? jenisManual.trim() : baru.jenis;
    const cocokResmi = Object.entries(LABEL_JENIS).find(
      ([, label]) => label.toLowerCase() === mentah.toLowerCase()
    );
    const kategori = cocokResmi ? cocokResmi[0] : mentah;
    if (!baru.nama.trim()) return;
    if (!editId && !kategori) {
      beriTahu("Tulis dulu nama kategori pada kolom manual.", "galat");
      return;
    }
    setSibukBaru(true);
    try {
      if (editId) {
        await apiPengurus(`/turnamen/${editId}/ubah`, {
          metode: "POST",
          bodi: {
            nama: baru.nama.trim(),
            juara: baru.juara.trim(),
            mulai: baru.mulai,
            selesai: baru.selesai,
          },
        });
        beriTahu(`"${baru.nama.trim()}" diperbarui.`, "sukses");
      } else {
        await apiPengurus("/turnamen", {
          metode: "POST",
          bodi: {
            nama: baru.nama.trim(),
            jenis: kategori,
            juara: baru.juara.trim(),
            mulai: baru.mulai,
            selesai: baru.selesai,
            status: "selesai",
          },
        });
        beriTahu(`"${baru.nama.trim()}" masuk ke tabel hasil.`, "sukses");
      }
      setEditId(null);
      setJenisManual("");
      setBaru((b) => ({
        nama: "",
        jenis: b.jenis,
        juara: "",
        mulai: "",
        selesai: "",
      }));
      await muat();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibukBaru(false);
    }
  };

  const [editId, setEditId] = useState(null);
  const [hapusTarget, setHapusTarget] = useState(null);
  const [sibukAksi, setSibukAksi] = useState(false);

  // Pensil pada tabel bawah mengisi baris input ATAS dengan data lama;
  // penyimpanan lewat tombol Simpan milik baris input tersebut.
  const mulaiEdit = (t) => {
    const resmi = Boolean(LABEL_JENIS[t.jenis]);
    setEditId(t.id);
    setJenisManual(resmi ? "" : t.jenis || "");
    setBaru({
      nama: t.nama || "",
      jenis: resmi ? t.jenis : "manual",
      juara: t.juara || "",
      // Input tanggal hanya menerima YYYY-MM-DD; buang jam bila ada.
      mulai: (t.mulai || "").slice(0, 10),
      selesai: (t.selesai || "").slice(0, 10),
    });
  };

  const batalEdit = () => {
    setEditId(null);
    setJenisManual("");
    setBaru((b) => ({
      nama: "",
      jenis: b.jenis,
      juara: "",
      mulai: "",
      selesai: "",
    }));
  };

  const konfirmasiHapus = async () => {
    const t = hapusTarget;
    if (!t) return;
    setSibukAksi(true);
    try {
      await apiPengurus(`/turnamen/${t.id}/hapus`, { metode: "POST" });
      beriTahu(`"${t.nama}" dihapus.`, "sukses");
      setHapusTarget(null);
      await muat();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibukAksi(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-slate-900">Juara Turnamen</h2>

      {gagal ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Data juara sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.
        </p>
      ) : daftar === null ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Memuat…
        </p>
      ) : (
        <>
          <div className="overflow-auto">
            <table
              className="tabel-kci tanpa-garis-bawah"
              style={{ marginBottom: 0 }}
            >
              <thead>
                <tr>
                  <th>Nama Turnamen</th>
                  <th>Kategori</th>
                  <th>Juara</th>
                  <th>Tanggal Mulai</th>
                  <th>Tanggal Berakhir</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input
                      value={baru.nama}
                      onChange={(e) =>
                        setBaru((b) => ({ ...b, nama: e.target.value }))
                      }
                      placeholder="Nama turnamen"
                      maxLength={100}
                      autoComplete="off"
                      className={`w-52 min-w-[150px] ${kelasIsian}`}
                    />
                  </td>
                  <td>
                    <div className="relative w-fit">
                      <input
                        value={
                          baru.jenis === "manual"
                            ? jenisManual
                            : LABEL_JENIS[baru.jenis] || baru.jenis || ""
                        }
                        onChange={(e) => {
                          setJenisManual(e.target.value);
                          setBaru((b) =>
                            b.jenis === "manual" ? b : { ...b, jenis: "manual" }
                          );
                        }}
                        placeholder="pilih atau tulis kategori"
                        maxLength={60}
                        autoComplete="off"
                        disabled={Boolean(editId)}
                        className={`relative z-10 w-40 min-w-[130px] pr-7 ${kelasIsian} ${
                          editId
                            ? "cursor-not-allowed bg-slate-50 text-slate-400"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Buka daftar kategori"
                        disabled={Boolean(editId)}
                        onClick={() => {
                          try {
                            refJenis.current?.showPicker();
                          } catch {
                            refJenis.current?.focus();
                          }
                        }}
                        className={`absolute right-1.5 top-1/2 z-20 -translate-y-1/2 rounded p-0.5 ${
                          editId
                            ? "text-slate-400"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                      <select
                        ref={refJenis}
                        value={baru.jenis}
                        onChange={(e) => {
                          const nilai = e.target.value;
                          if (nilai !== "manual") setJenisManual("");
                          setBaru((b) => ({ ...b, jenis: nilai }));
                        }}
                        disabled={Boolean(editId)}
                        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                      >
                        {Object.entries(LABEL_JENIS).map(([nilai, label]) => (
                          <option key={nilai} value={nilai}>
                            {label}
                          </option>
                        ))}
                        <option value="manual">Lainnya — tulis manual</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <input
                      value={baru.juara}
                      onChange={(e) =>
                        setBaru((b) => ({ ...b, juara: e.target.value }))
                      }
                      placeholder="username chess.com"
                      maxLength={100}
                      autoComplete="off"
                      className={`w-44 min-w-[130px] ${kelasIsian}`}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={baru.mulai}
                      onChange={(e) =>
                        setBaru((b) => ({ ...b, mulai: e.target.value }))
                      }
                      className={`w-36 ${kelasIsian}`}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={baru.selesai}
                      onChange={(e) =>
                        setBaru((b) => ({ ...b, selesai: e.target.value }))
                      }
                      className={`w-36 ${kelasIsian}`}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-1">
            {editId && (
              <Tombol
                anak="Batal"
                kecil
                disabled={sibukBaru}
                onClick={batalEdit}
              />
            )}
            <Tombol
              anak={sibukBaru ? "…" : "Simpan"}
              jenis="utama"
              kecil
              disabled={sibukBaru || !baru.nama.trim()}
              onClick={simpanBaru}
            />
          </div>

          {daftar.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              Belum ada turnamen yang dipublikasikan.
            </p>
          ) : (
            <div className="overflow-auto">
          <table className="tabel-kci tabel-peringkat">
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Turnamen</th>
                <th>Kategori</th>
                <th>Juara</th>
                <th>Tanggal Mulai</th>
                <th>Tanggal Berakhir</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((t, index) => (
                <tr key={t.id} className={index % 2 === 1 ? "bg-slate-50" : ""}>
                  <td>{index + 1}</td>
                  <td>{t.nama}</td>
                  <td>{LABEL_JENIS[t.jenis] || t.jenis}</td>
                  <td>
                    {t.juara ? (
                      <a
                        href={`https://www.chess.com/member/${encodeURIComponent(
                          t.juara.trim()
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.juara}
                      </a>
                    ) : (
                      <span className="text-slate-400">belum ditetapkan</span>
                    )}
                  </td>
                  <td>{tanggal(t.mulai)}</td>
                  <td>{tanggal(t.selesai)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Ubah"
                        onClick={() => mulaiEdit(t)}
                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary"
                      >
                        <IkonPensil />
                      </button>
                      <button
                        type="button"
                        title="Hapus"
                        onClick={() => setHapusTarget(t)}
                        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <IkonSampah />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
            </div>
          )}
        </>
      )}

      <Modal
        terbuka={Boolean(hapusTarget)}
        judul="Hapus turnamen ini?"
        jenisKonfirmasi="bahaya"
        labelKonfirmasi={sibukAksi ? "Menghapus…" : "Hapus"}
        sibuk={sibukAksi}
        onKonfirmasi={konfirmasiHapus}
        onBatal={() => setHapusTarget(null)}
      >
        “{hapusTarget?.nama}” akan dihapus permanen dari daftar hasil,
        termasuk dari halaman publik Turnamen.
      </Modal>
    </div>
  );
}
