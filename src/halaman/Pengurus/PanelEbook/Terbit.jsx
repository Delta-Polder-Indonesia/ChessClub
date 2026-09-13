import { useState } from "react";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Tombol } from "../ui.jsx";
import {
  Alert,
  Alertjudul,
  AlertKeterangan,
} from "../../../components/ui/alert.jsx";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog.jsx";
import { formatWaktu } from "./bantuan.jsx";

/**
 * Halaman "Kode E-Book" (terbitkan): formulir panggilan peminjam + catatan.
 *
 * Tombol "Buka" membuka dialog konfirmasi, "Lanjut" memanggil onTerbit();
 * dialog menampilkan hasil: sukses (Alert hijau) atau gagal (Alert merah).
 */
export default function EbookTerbit({ onTerbit, sibuk, kodeBaru, onTutupKodeBaru, onSalin }) {
  const [panggilan, setPanggilan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [salahPanggilan, setSalahPanggilan] = useState(false);
  const [dialogTerbit, setDialogTerbit] = useState(false);
  const [hasilTerbit, setHasilTerbit] = useState(null);

  // Enter di input tetap dibawa ke dialog konfirmasi, bukan terbit langsung.
  function kirim(e) {
    e.preventDefault();
    setDialogTerbit(true);
  }

  async function lanjut() {
    // Sorot input panggilan bila kosong — sebelumnya `salahPanggilan` hanya
    // pernah di-set false sehingga border merah tidak pernah tampil.
    setSalahPanggilan(!panggilan.trim());
    const hasil = await onTerbit(panggilan, catatan);
    setHasilTerbit(hasil);
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={kirim}
        noValidate
        className="flex flex-wrap items-end gap-3 rounded-md border-2 border-slate-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Panggilan peminjam
          <input
            type="text"
            name="panggilan"
            value={panggilan}
            onChange={(e) => {
              setPanggilan(e.target.value);
              setSalahPanggilan(false);
            }}
            placeholder="cth. Budi"
            maxLength={30}
            autoComplete="off"
            className={`w-52 rounded-md border-2 px-2.5 py-1.5 text-sm outline-none ${
              salahPanggilan
                ? "border-red-500 focus:border-red-500"
                : "border-slate-300 focus:border-primary"
            }`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Catatan (opsional)
          <input
            type="text"
            name="catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="cth. anggota baru, latihan rutin"
            maxLength={120}
            autoComplete="off"
            className="w-72 rounded-md border-2 border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <AlertDialog
          open={dialogTerbit}
          onOpenChange={(terbuka) => {
            setDialogTerbit(terbuka);
            if (!terbuka) setHasilTerbit(null);
          }}
        >
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="rounded-md bg-[#0B2F9F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a2a8e] disabled:opacity-40"
            >
              Buka
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            {hasilTerbit ? (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {hasilTerbit.status === "sukses"
                      ? "Kode berhasil diterbitkan"
                      : "Gagal menerbitkan kode"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                {hasilTerbit.status === "sukses" ? (
                  <Alert variasi="sukses">
                    <CheckCircle2Icon />
                    <Alertjudul>
                      Kode {hasilTerbit.kode} untuk {hasilTerbit.panggilan}
                    </Alertjudul>
                    <AlertKeterangan>
                      Kode aktif 1 jam dan sudah terkirim lewat WA/grup.
                      Sampaikan ke peminjam: isi nama asli, akun Chess.com, dan
                      kode ini pada popup unduh.
                    </AlertKeterangan>
                  </Alert>
                ) : (
                  <Alert variasi="gagal">
                    <AlertCircleIcon />
                    <Alertjudul>{hasilTerbit.pesan}</Alertjudul>
                    <AlertKeterangan>
                      Periksa isi nama peminjam atau bagian yang ditolak, lalu
                      coba terbitkan lagi.
                    </AlertKeterangan>
                  </Alert>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel>Tutup</AlertDialogCancel>
                </AlertDialogFooter>
              </>
            ) : (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>Yakin menerbitkan kode?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Kode akan dibuat untuk {panggilan.trim() || "peminjam"}{" "}
                    dan dikirim lewat WA/grup. Batas akses 1 jam dihitung
                    setelah menekan tombol Lanjut. Setelah terbit, kode langsung
                    aktif sampai masa berlakunya habis.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <button
                    type="button"
                    disabled={sibuk}
                    onClick={lanjut}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#0B2F9F] px-4 text-sm font-semibold text-white hover:bg-[#0a2a8e] disabled:opacity-40"
                  >
                    {sibuk ? "Memproses…" : "Lanjut"}
                  </button>
                </AlertDialogFooter>
              </>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </form>

      {kodeBaru && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center gap-3 rounded-md border-2 border-emerald-200 bg-white px-4 py-3 text-sm"
        >
          <div className="flex-1">
            <p className="text-emerald-800">
              Kode untuk <span className="font-semibold">{kodeBaru.panggilan}</span>:
              <span className="ml-2 rounded bg-white px-2 py-0.5 font-mono font-bold tracking-wide text-emerald-900 ring-1 ring-emerald-300">
                {kodeBaru.kode}
              </span>
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Berlaku sampai {formatWaktu(kodeBaru.kedaluwarsa)} WIB. Sampaikan
              ke peminjam, lalu dia mengisi nama asli + akun Chess.com + kode
              ini pada popup unduh.
            </p>
          </div>
          <Tombol kecil onClick={() => onSalin(kodeBaru.kode)} disabled={sibuk}>
            Salin kode
          </Tombol>
          <Tombol
            kecil
            onClick={onTutupKodeBaru}
            aria-label="Tutup notifikasi kode terbit"
          >
            Tutup
          </Tombol>
        </div>
      )}
    </div>
  );
}