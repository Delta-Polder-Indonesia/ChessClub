/**
 * Kartu-kartu ringkasan — tampil di tab Dashboard.
 */
import { Kartu } from "./ui.jsx";

const LABEL_MODE_VERIFIKASI = {
  wajib: "Wajib",
  opsional: "Opsional",
  off: "Nonaktif",
};

export default function RingkasanDashboard({ ringkas, onBuka, hitam }) {
  const jumlahKonten =
    (ringkas.konten?.berita ?? 0) + (ringkas.konten?.pengumuman ?? 0);

  const banOtomatis = (hitam || []).filter((h) => h.sumber === "otomatis").length;

  return (
    <div className="space-y-6">
      {/* Kartu ringkasan */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-5">
        <Kartu label="Anggota" nilai={ringkas.anggota} warna="biru" />
        <div onClick={() => onBuka("larangan", banOtomatis ? "otomatis" : "semua")}
          className="cursor-pointer transition-transform active:scale-95" title="Klik untuk membuka daftar larangan">
          <Kartu label="Daftar larangan" nilai={ringkas.daftarHitam}
            catatan={`${ringkas.otomatis} otomatis / ${ringkas.pengurus} pengurus`}
            warna={ringkas.daftarHitam ? "merah" : "slate"} />
        </div>
        <Kartu label="Turnamen" nilai={ringkas.turnamen?.total ?? 0}
          catatan={`${ringkas.turnamen?.berlangsung ?? 0} berlangsung`} />
        <Kartu label="Konten" nilai={jumlahKonten}
          catatan={`${ringkas.konten?.berita ?? 0} berita / ${ringkas.konten?.pengumuman ?? 0} pengumuman`}
          warna={jumlahKonten ? "hijau" : "slate"} />
        <Kartu label="Verifikasi"
          nilai={LABEL_MODE_VERIFIKASI[ringkas.verifikasi?.mode] ?? ringkas.verifikasi?.mode ?? "—"}
          catatan={ringkas.verifikasi?.oauthAktif ? "login Chess.com aktif" : "kode profil"}
          warna="hijau" />
      </div>

      <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <p className="text-4xl font-black tracking-tight text-slate-400 sm:text-5xl">
          Tahap Renovasi
        </p>
        <p className="mt-3 max-w-md text-sm text-slate-500">
          Dashboard sedang ditata ulang. Bagian lain akan menyusul kembali setahap demi setahap.
        </p>
      </div>
    </div>
  );
}