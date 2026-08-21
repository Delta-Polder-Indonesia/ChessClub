import { useState } from "react";
import { apiPengurus } from "../../lib/chessAnggota.js";
import { LencanaBan } from "../../components/Lencana.jsx";
import { Tombol, Avatar, Modal } from "./ui.jsx";

export default function PanelAnggota({ anggota, muatUlang, beriTahu }) {
  const [sibuk, setSibuk] = useState("");
  const [kontak, setKontak] = useState(null);
  const [targetBlokir, setTargetBlokir] = useState(null);
  const klub = String(anggota.find((a) => a.klubChess)?.klubChess || "")
    .replace(/-/g, " ")
    .toUpperCase();

  const jalankan = async (kunci, fn) => {
    setSibuk(kunci);
    try {
      await fn();
    } catch (e) {
      beriTahu(e.message, "galat");
    } finally {
      setSibuk("");
    }
  };

  const konfirmasiBlokir = (alasan) => {
    const username = targetBlokir;
    setTargetBlokir(null);
    if (!username) return;
    jalankan(`blokir-${username}`, async () => {
      await apiPengurus("/blokir", {
        metode: "POST",
        bodi: { username, keterangan: alasan },
      });
      beriTahu(`"${username}" dipindahkan ke daftar larangan.`, "sukses");
      await muatUlang();
    });
  };

  const lihatKontak = (username) =>
    jalankan(`kontak-${username}`, async () => {
      const data = await apiPengurus(`/kontak/${username}`);
      setKontak({ username, data });
    });

  const pindai = () =>
    jalankan("pindai", async () => {
      const h = await apiPengurus("/pindai", { metode: "POST" });
      beriTahu(
        `Pemindaian selesai: ${h.diperiksa} diperiksa, ${h.diblokir.length} diblokir.`,
        h.diblokir.length ? "peringatan" : "sukses"
      );
      await muatUlang();
    });

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">
            {klub ? `Anggota ${klub}` : "Anggota"} ({anggota.length})
          </h2>
          <Tombol
            anak={sibuk === "pindai" ? "Memindai…" : "Pindai ban fair play"}
            onClick={pindai}
            disabled={sibuk === "pindai"}
            jenis="utama"
          />
        </div>
        <p className="mb-3 text-xs leading-5 text-slate-500">
          Daftar diambil dari roster klub Chess.com. Pemindaian memeriksa setiap
          akun pada roster; pelanggaran fair play otomatis masuk daftar larangan.
          Blokir di sini membatasi kegiatan situs dan turnamen, bukan menghapus
          akun dari klub Chess.com.
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-semibold w-12">#</th>
                  <th className="px-3 py-2 font-semibold">Profil</th>
                  <th className="px-3 py-2 font-semibold">Kota</th>
                  <th className="px-3 py-2 font-semibold">Elo</th>
                  <th className="px-3 py-2 font-semibold">Verifikasi</th>
                  <th className="px-3 py-2 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {anggota.map((a, index) => (
                  <tr key={a.username} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-slate-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <Avatar username={a.username} />
                        <div className="min-w-0">
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline flex items-center gap-1.5"
                          >
                            {a.username}
                            {a.alasanStatus && <LencanaBan />}
                          </a>
                          {a.panggilan && a.panggilan !== a.username && (
                            <p className="text-xs text-slate-500 truncate">{a.panggilan}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {a.kota || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {a.elo ? `${a.elo} ${a.kontrol || ""}` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {a.terverifikasi ? (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                          terverifikasi
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">belum</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1.5">
                        <Tombol
                          anak="Kontak"
                          kecil
                          onClick={() => lihatKontak(a.username)}
                          disabled={sibuk === `kontak-${a.username}`}
                        />
                        {a.diblokirKomunitas || a.alasanStatus ? (
                          <Tombol
                            anak="Diblokir"
                            kecil
                            jenis="bahaya"
                            disabled
                          />
                        ) : (
                          <Tombol
                            anak="Blokir"
                            jenis="bahaya"
                            kecil
                            onClick={() => setTargetBlokir(a.username)}
                            disabled={sibuk === `blokir-${a.username}`}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!anggota.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      Belum ada anggota dari roster klub.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Modal
        terbuka={Boolean(targetBlokir)}
        judul={`Blokir ${targetBlokir || ""}`}
        labelKonfirmasi="Blokir"
        jenisKonfirmasi="bahaya"
        butuhInput
        placeholderInput="Alasan pemblokiran…"
        nilaiBawaanInput="Terbukti menggunakan bantuan engine."
        catatanInput="Tindakan ini membatasi kegiatan situs dan turnamen, bukan mengeluarkan akun dari klub Chess.com."
        sibuk={sibuk === `blokir-${targetBlokir}`}
        onBatal={() => setTargetBlokir(null)}
        onKonfirmasi={konfirmasiBlokir}
      >
        Tindakan ini akan memasukkan{" "}
        <strong>{targetBlokir}</strong> ke daftar larangan komunitas.
      </Modal>

      {kontak && (
        <section
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setKontak(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900">
              Kontak {kontak.username}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Data pribadi ini hanya terlihat oleh pengurus.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Nama lengkap", kontak.data.namaLengkap],
                ["Panggilan", kontak.data.panggilan],
                ["HP / WhatsApp", kontak.data.hp],
                ["DANA", kontak.data.dana],
                ["Email", kontak.data.email],
                ["Kota", kontak.data.kota],
                ["Tanggal lahir", kontak.data.tanggalLahir],
                ["Klub", kontak.data.klub],
              ].map(([label, nilai]) =>
                nilai ? (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-medium text-slate-900 break-all">
                      {nilai}
                    </dd>
                  </div>
                ) : null
              )}
            </dl>
            <div className="mt-5 flex justify-end gap-2">
              {kontak.data.email && (
                <Tombol
                  anak="Email"
                  kecil
                  onClick={() =>
                    (window.location.href = `mailto:${kontak.data.email}`)
                  }
                />
              )}
              {kontak.data.hp && (
                <Tombol
                  anak="WhatsApp"
                  kecil
                  jenis="utama"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${String(kontak.data.hp).replace(
                        /^0/,
                        "62"
                      )}`,
                      "_blank",
                      "noopener"
                    )
                  }
                />
              )}
              <Tombol anak="Tutup" kecil onClick={() => setKontak(null)} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
