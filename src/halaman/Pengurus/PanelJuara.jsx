import { useCallback, useEffect, useRef, useState } from "react";
import { apiPengurus } from "../../lib/api/index.js";
import { parseWaktuKomunitas } from "../../lib/waktu.js";
import { Tombol, Bidang, Modal, MenuAksi, Sheet } from "./ui.jsx";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table.jsx";

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

/**
 * Input kategori turnamen: kotak teks + panah yang membuka <select> tersembunyi
 * (pakai showPicker bila didukung), plus opsi "tulis manual". Dipakai di
 * sheet tambah/ubah turnamen.
 */
function PemilihKategori({ jenis, jenisManual, disabled, onChangeJenis, onChangeManual }) {
  const ref = useRef(null);
  return (
    <div className="relative w-fit">
      <input
        value={
          jenis === "manual"
            ? jenisManual
            : LABEL_JENIS[jenis] || jenis || ""
        }
        onChange={(e) => {
          onChangeManual(e.target.value);
          onChangeJenis("manual");
        }}
        placeholder="pilih atau tulis kategori"
        maxLength={60}
        autoComplete="off"
        disabled={disabled}
        className={`relative z-10 w-40 min-w-[130px] pr-7 ${kelasIsian} ${
          disabled ? "cursor-not-allowed bg-slate-50 text-slate-400" : ""
        }`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Buka daftar kategori"
        disabled={disabled}
        onClick={() => {
          try {
            ref.current?.showPicker();
          } catch {
            ref.current?.focus();
          }
        }}
        className={`absolute right-1.5 top-1/2 z-20 -translate-y-1/2 rounded p-0.5 ${
          disabled ? "text-slate-400" : "text-slate-500 hover:text-slate-700"
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
        ref={ref}
        value={jenis}
        onChange={(e) => {
          const nilai = e.target.value;
          if (nilai !== "manual") onChangeManual("");
          onChangeJenis(nilai);
        }}
        disabled={disabled}
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
  );
}

export default function PanelJuara({ beriTahu }) {
  const [daftar, setDaftar] = useState(null);
  const [gagal, setGagal] = useState(false);

  const muat = useCallback(async () => {
    setGagal(false);
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
      beriTahu("Data juara gagal dimuat. Periksa koneksi lalu coba lagi.", "galat");
      setGagal(true);
    }
  }, [beriTahu]);

  useEffect(() => {
    muat();
  }, [muat]);

  const [sheet, setSheet] = useState(null); // null | {id:null} tambah | {id} ubah
  const [form, setForm] = useState({
    nama: "",
    jenis: "bulanan",
    jenisManual: "",
    juara: "",
    mulai: "",
    selesai: "",
  });
  const [sibukBaru, setSibukBaru] = useState(false);

  const bukaTambah = () => {
    setForm({
      nama: "",
      jenis: "bulanan",
      jenisManual: "",
      juara: "",
      mulai: "",
      selesai: "",
    });
    setSheet({ id: null });
  };

  const bukaUbah = (t) => {
    const resmi = Boolean(LABEL_JENIS[t.jenis]);
    setForm({
      nama: t.nama || "",
      jenis: resmi ? t.jenis : "manual",
      jenisManual: resmi ? "" : t.jenis || "",
      juara: t.juara || "",
      // Input tanggal hanya menerima YYYY-MM-DD; buang jam bila ada.
      mulai: (t.mulai || "").slice(0, 10),
      selesai: (t.selesai || "").slice(0, 10),
    });
    setSheet({ id: t.id });
  };

  const simpan = async () => {
    if (!sheet) return;
    const mentah = form.jenis === "manual" ? form.jenisManual.trim() : form.jenis;
    const cocokResmi = Object.entries(LABEL_JENIS).find(
      ([, label]) => label.toLowerCase() === mentah.toLowerCase()
    );
    const kategori = cocokResmi ? cocokResmi[0] : mentah;
    if (!form.nama.trim()) return;
    if (!kategori) {
      beriTahu("Tulis dulu nama kategori pada kolom manual.", "galat");
      return;
    }
    setSibukBaru(true);
    try {
      if (sheet.id) {
        await apiPengurus(`/turnamen/${sheet.id}/ubah`, {
          metode: "POST",
          bodi: {
            nama: form.nama.trim(),
            // Kategori ikut dikirim — dulu perubahan kategori di sheet ubah
            // hilang diam-diam karena tidak pernah disertakan di bodi.
            jenis: kategori,
            juara: form.juara.trim(),
            mulai: form.mulai,
            selesai: form.selesai,
          },
        });
        beriTahu(`"${form.nama.trim()}" diperbarui.`, "sukses");
      } else {
        await apiPengurus("/turnamen", {
          metode: "POST",
          bodi: {
            nama: form.nama.trim(),
            jenis: kategori,
            juara: form.juara.trim(),
            mulai: form.mulai,
            selesai: form.selesai,
            status: "selesai",
          },
        });
        beriTahu(`"${form.nama.trim()}" masuk ke tabel hasil.`, "sukses");
      }
      setSheet(null);
      await muat();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibukBaru(false);
    }
  };

  const [hapusTarget, setHapusTarget] = useState(null);
  const [sibukAksi, setSibukAksi] = useState(false);

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
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-slate-900">Juara Turnamen</h2>
        {gagal && (
          <button
            type="button"
            onClick={muat}
            className="rounded-md border-2 border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Coba Lagi
          </button>
        )}
      </div>

      {gagal ? null : daftar === null ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Memuat…
        </p>
      ) : (
        <>
          <div className="flex justify-end">
            <Tombol anak="+ Juara Turnamen" jenis="biasa" onClick={bukaTambah} />
          </div>

          {daftar.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              Belum ada turnamen yang dipublikasikan.
            </p>
) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nama Turnamen</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Juara</TableHead>
                  <TableHead>Tanggal Mulai</TableHead>
                  <TableHead>Tanggal Berakhir</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daftar.map((t, index) => (
                  <TableRow key={t.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{t.nama}</TableCell>
                    <TableCell>{LABEL_JENIS[t.jenis] || t.jenis}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>{tanggal(t.mulai)}</TableCell>
                    <TableCell>{tanggal(t.selesai)}</TableCell>
                    <TableCell className="w-24">
                      <MenuAksi
                        onUbah={() => bukaUbah(t)}
                        onHapus={() => setHapusTarget(t)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      <Sheet
        terbuka={sheet !== null}
        judul={sheet?.id ? "Ubah Turnamen" : "Tambah Juara Turnamen"}
        sibuk={sibukBaru}
        onTutup={() => setSheet(null)}
        kaki={
          <div className="flex justify-end gap-2">
            <Tombol anak="Batal" onClick={() => setSheet(null)} disabled={sibukBaru} />
            <Tombol
              anak={sibukBaru ? "Simpan…" : "Simpan"}
              jenis="biasa"
              disabled={sibukBaru || !form.nama.trim()}
              onClick={simpan}
            />
          </div>
        }
      >
        <div className="grid gap-4">
          <Bidang
            label="Nama Turnamen"
            value={form.nama}
            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            maxLength={100}
            autoComplete="off"
            placeholder="cth. Turnamen Bulanan Agustus"
          />
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
            Kategori
            <PemilihKategori
              jenis={form.jenis}
              jenisManual={form.jenisManual}
              onChangeJenis={(v) => setForm((f) => ({ ...f, jenis: v }))}
              onChangeManual={(v) => setForm((f) => ({ ...f, jenisManual: v }))}
            />
          </label>
          <Bidang
            label="Juara (username chess.com)"
            value={form.juara}
            onChange={(e) => setForm((f) => ({ ...f, juara: e.target.value }))}
            maxLength={100}
            autoComplete="off"
            placeholder="opsional"
          />
          <div className="grid gap-4">
            <Bidang
              label="Tanggal Mulai"
              type="date"
              value={form.mulai}
              onChange={(e) => setForm((f) => ({ ...f, mulai: e.target.value }))}
            />
            <Bidang
              label="Tanggal Berakhir"
              type="date"
              value={form.selesai}
              onChange={(e) =>
                setForm((f) => ({ ...f, selesai: e.target.value }))
              }
            />
          </div>
        </div>
      </Sheet>
    </div>
  );
}
