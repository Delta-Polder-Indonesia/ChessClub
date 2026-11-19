/**
 * Kartu-kartu ringkasan — tampil di tab Dashboard.
 */
import { Kartu, TooltipLabel } from "./ui.jsx";

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
        <Kartu label="Anggota" nilai={ringkas.anggota} />
        <TooltipLabel label="Klik untuk membuka daftar larangan">
          <div onClick={() => onBuka("larangan", banOtomatis ? "otomatis" : "semua")}
            className="cursor-pointer transition-transform active:scale-95">
          <Kartu label="Daftar larangan" nilai={ringkas.daftarHitam}
            catatan={`${ringkas.otomatis} otomatis / ${ringkas.pengurus} pengurus`} />
        </div>
        </TooltipLabel>
        <Kartu label="Turnamen" nilai={ringkas.turnamen?.total ?? 0}
          catatan={`${ringkas.turnamen?.berlangsung ?? 0} berlangsung`} />
        <Kartu label="Konten" nilai={jumlahKonten}
          catatan={`${ringkas.konten?.berita ?? 0} berita / ${ringkas.konten?.pengumuman ?? 0} pengumuman`} />
        <Kartu label="Verifikasi"
          nilai={LABEL_MODE_VERIFIKASI[ringkas.verifikasi?.mode] ?? ringkas.verifikasi?.mode ?? "—"}
          catatan={ringkas.verifikasi?.oauthAktif ? "login Chess.com aktif" : "kode profil"} />
      </div>

      {/* Tindakan cepat: baris terbuka dengan pemisah tipis, tanpa kotak
          berlatar. Kotak berisi latar abu dilarang di panel Pengurus
          (dijaga uji-standar-desain). */}
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        <TooltipLabel label="Klik untuk membuka pesan masuk">
          <button
            type="button"
            onClick={() => onBuka("pesan")}
            className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Pesan Masuk
              </span>
              <span className="mt-0.5 block text-xs text-slate-600">
                {ringkas.pesan?.belumDibaca ?? 0} belum dibaca dari{" "}
                {ringkas.pesan?.total ?? 0} pesan
              </span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-primary">
              Buka
            </span>
          </button>
        </TooltipLabel>

        <TooltipLabel label="Klik untuk melihat larangan otomatis">
          <button
            type="button"
            onClick={() => onBuka("larangan", "otomatis")}
            className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Blokir Otomatis
              </span>
              <span className="mt-0.5 block text-xs text-slate-600">
                {banOtomatis} akun terblokir karena Fair Play
              </span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-primary">
              Buka
            </span>
          </button>
        </TooltipLabel>
      </div>
    </div>
  );
}