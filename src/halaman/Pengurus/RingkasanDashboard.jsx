/**
 * Kartu-kartu ringkasan — tampil di tab Dashboard.
 */
import { useState } from "react";
import { apiPengurus } from "../../lib/api/pengurus.js";
import { Kartu } from "./ui.jsx";

const LABEL_MODE_VERIFIKASI = {
  wajib: "Wajib",
  opsional: "Opsional",
  off: "Nonaktif",
};

const TINGKAT_WARNA = {
  kritis: "border-red-200 bg-red-50 text-red-800",
  peringatan: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function RingkasanDashboard({ ringkas, onBuka, hitam, beriTahu, muatUlang }) {
  const [memindai, setMemindai] = useState(false);

  const jumlahKonten =
    (ringkas.konten?.berita ?? 0) + (ringkas.konten?.pengumuman ?? 0);

  const banOtomatis = (hitam || []).filter((h) => h.sumber === "otomatis").length;
  const pindai = ringkas.verifikasi?.pindaiTerakhir || { pernah: false };
  const peringatan = Array.isArray(ringkas.peringatan) ? ringkas.peringatan : [];

  /* "Pindai sekarang" menjalankan SATU batch dan melanjutkan kursor yang
     tersimpan, jadi menekan berulang kali benar-benar menyusuri seluruh
     roster. Aman terhadap batas durasi fungsi serverless. */
  const pindaiSekarang = async () => {
    if (memindai) return;
    setMemindai(true);
    try {
      const hasil = await apiPengurus("/pindai", { metode: "POST" });
      const diblokir = hasil?.diblokir?.length ?? 0;
      const dicabut = hasil?.dicabut?.length ?? 0;
      const ditandai = hasil?.ditandai?.length ?? 0;
      const sisa =
        hasil?.selesai === false
          ? " Putaran belum tuntas — tekan lagi untuk melanjutkan sisa akun."
          : "";
      beriTahu?.(
        `${hasil?.diperiksa ?? 0} akun diperiksa: ${diblokir} ban fair play, ` +
          `${dicabut} verifikasi dicabut, ${ditandai} perlu ditindak.${sisa}`,
        diblokir || dicabut ? "peringatan" : "sukses"
      );
      await muatUlang?.();
    } catch (e) {
      beriTahu?.(e?.message || e?.pesan || "Pemindaian gagal dijalankan.", "galat");
    } finally {
      setMemindai(false);
    }
  };

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
          warna={ringkas.verifikasi?.mode === "wajib" ? "hijau" : "merah"} />
      </div>

      {/* Peringatan ketersediaan & konfigurasi. Tanpa ini, deployment yang
          longgar atau menyimpan data di /tmp tetap terlihat "sehat". */}
      {peringatan.length > 0 && (
        <div className="space-y-2">
          {peringatan.map((p) => (
            <div
              key={p.kode}
              className={`rounded-lg border px-4 py-2.5 text-sm ${TINGKAT_WARNA[p.tingkat] || TINGKAT_WARNA.info}`}
            >
              <span className="font-semibold">{p.kode}</span>
              <span className="mx-2 opacity-40">—</span>
              {p.pesan}
            </div>
          ))}
        </div>
      )}

      {/* Pemindaian ban fair play */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900">Pemindaian fair play</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
              Memeriksa akun Chess.com anggota dan roster klub. Akun yang kena ban
              fair play, ditutup, atau hilang otomatis dicabut verifikasinya dan
              masuk daftar larangan. Berjalan terjadwal tiap 6 jam; tombol ini
              memicunya segera.
            </p>
          </div>
          <button
            type="button"
            onClick={pindaiSekarang}
            disabled={memindai}
            className="shrink-0 rounded-md border-2 border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {memindai ? "Memindai…" : "Pindai sekarang"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kartu label="Perlu diperiksa ulang" nilai={ringkas.perluVerifikasiUlang ?? 0}
            catatan="ditandai pemindaian otomatis"
            warna={ringkas.perluVerifikasiUlang ? "merah" : "slate"} />
          <Kartu label="Belum terverifikasi" nilai={ringkas.belumTerverifikasi ?? 0}
            catatan="anggota tanpa bukti kepemilikan akun"
            warna={ringkas.belumTerverifikasi ? "merah" : "hijau"} />
          <Kartu label="Ban fair play otomatis" nilai={ringkas.otomatis ?? 0}
            catatan="tercatat dari pemindaian"
            warna={ringkas.otomatis ? "merah" : "slate"} />
          <Kartu label="Pengajuan menunggu" nilai={ringkas.verifikasi?.pengajuanMenunggu ?? 0}
            catatan="perlu diperiksa pengurus"
            warna={ringkas.verifikasi?.pengajuanMenunggu ? "merah" : "slate"} />
        </div>

        <dl className="mt-4 grid gap-x-6 gap-y-1.5 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Terakhir dipindai</dt>
            <dd className="font-medium text-slate-800">
              {pindai.pernah
                ? new Date(pindai.diperbaruiPada || pindai.waktu).toLocaleString("id-ID")
                : "belum pernah"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Putaran terakhir tuntas</dt>
            <dd className="font-medium text-slate-800">
              {!pindai.pernah ? "—" : pindai.selesai ? "ya" : `belum (sisa dari @${pindai.kursor})`}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Terakhir diperiksa / gagal</dt>
            <dd className="font-medium text-slate-800">
              {pindai.pernah ? `${pindai.diperiksa ?? 0} / ${pindai.gagal ?? 0}` : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Verifikasi dicabut terakhir</dt>
            <dd className="font-medium text-slate-800">{pindai.pernah ? (pindai.dicabut ?? 0) : "—"}</dd>
          </div>
        </dl>
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
