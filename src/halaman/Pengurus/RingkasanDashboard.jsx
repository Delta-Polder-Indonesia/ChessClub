/**
 * Kartu-kartu ringkasan — tampil di tab Dashboard.
 */
import { Kartu } from "./ui.jsx";
import { TooltipLabel } from "@/components/ui/tooltip.jsx";

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Kartu label="Anggota" nilai={ringkas.anggota} warna="biru" />
        <TooltipLabel side="right" label="Klik untuk membuka daftar larangan">
          <div onClick={() => onBuka("larangan", banOtomatis ? "otomatis" : "semua")}
            className="cursor-pointer transition-transform active:scale-95">
          <Kartu label="Daftar larangan" nilai={ringkas.daftarHitam}
            catatan={`${ringkas.otomatis} otomatis / ${ringkas.pengurus} pengurus`}
            warna={ringkas.daftarHitam ? "merah" : "slate"} />
        </div>
        </TooltipLabel>
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

      {/* Kartu aktivitas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <TooltipLabel side="right" label="Klik untuk membuka pesan masuk">
          <div
            onClick={() => onBuka("pesan")}
            className="cursor-pointer transition-transform active:scale-95 rounded-lg border border-slate-200 bg-white p-4 text-center"
          >
          <p className="text-2xl font-bold text-slate-900">
            {ringkas.pesan?.belumDibaca ?? 0}
          </p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            Pesan Masuk
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {ringkas.pesan?.total ?? 0} total
          </p>
        </div>
        </TooltipLabel>
        <TooltipLabel side="right" label="Klik untuk melihat larangan otomatis">
          <div
            onClick={() => onBuka("larangan", "otomatis")}
            className="cursor-pointer transition-transform active:scale-95 rounded-lg border border-slate-200 bg-white p-4 text-center"
          >
          <p className="text-2xl font-bold text-slate-700">
            {banOtomatis}
          </p>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            Blokir Otomatis
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Fair Play
          </p>
        </div>
        </TooltipLabel>
      </div>
    </div>
  );
}