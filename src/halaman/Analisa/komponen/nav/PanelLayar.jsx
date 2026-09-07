/*
 * Kerangka LAYAR untuk area kerja Analisa — pengganti modal.
 *
 * Dulu setiap menu di bilah navigasi (Akun, Basis Data, Impor) membuka popup
 * modal (`Popup.jsx`): latar digelapkan, papan tertutup, dan Esc/klik-luar
 * menutupnya. Sekarang area kerja berganti layar seperti halaman Pengurus
 * (`src/halaman/Pengurus/Dashboard.jsx`): bilah navigasi tetap di tempat,
 * isi area kerja yang berganti, dan tidak ada modal sama sekali.
 *
 * Perbedaan yang sengaja dibuat terhadap `Popup.jsx` yang lama:
 *  - tidak ada `fixed inset-0`, tidak ada latar digelapkan, tidak ada
 *    `role="dialog"`/`aria-modal` — ini panel biasa, bukan dialog;
 *  - tidak memasang pendengar Escape: tombol Escape milik papan catur
 *    (pintasan pemutar partai) dan tidak boleh direbut layar lain;
 *  - tidak ada klik-luar-menutup, karena tidak ada "luar";
 *  - tinggi mengikuti area kerja (`h-full min-h-0`) supaya tabel partai
 *    bisa menggulir sendiri tanpa menggulir seluruh halaman.
 *
 * Variabel tema tetap dibaca dari `.analisa-root`, sama seperti popup dulu,
 * sehingga panel ikut gelap/terang mengikuti tema papan.
 */

/**
 * @param {object}  props
 * @param {unknown} props.judul        Judul di kepala panel (boleh berupa node,
 *                                     mis. judul tabel + tombol kembali).
 * @param {string}  [props.subjudul]   Baris kecil di bawah judul.
 * @param {unknown} [props.bawahJudul] Isi bebas di bawah judul (ambil alih subjudul).
 * @param {unknown} [props.headerKanan] Deretan tombol di kanan kepala panel.
 * @param {string}  [props.className]  Kelas tambahan untuk kartu terluar.
 * @param {string}  [props.lebarMaks]  Kelas pembatas lebar isi, mis. "max-w-[720px]".
 *                                     Kosongkan bila isi boleh selebar area kerja
 *                                     (dipakai tabel basis data).
 */
export default function PanelLayar({
  judul,
  subjudul,
  bawahJudul,
  headerKanan,
  children,
  className = "",
  lebarMaks = "",
}) {
  const adaKepala = Boolean(judul || subjudul || bawahJudul || headerKanan);

  return (
    <section
      className={`flex h-full min-h-0 w-full flex-col select-text bg-backgroundBoxDarker ${className}`}
    >
      {adaKepala ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-base font-extrabold text-foreground">{judul}</p>
            {bawahJudul ? (
              <div className="mt-1.5">{bawahJudul}</div>
            ) : subjudul ? (
              <p className="mt-0.5 text-xs leading-4 text-foregroundGrey">{subjudul}</p>
            ) : null}
          </div>
          {headerKanan ? (
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
              {headerKanan}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
        {/* mx-auto supaya layar yang dibatasi lebarnya (mis. Impor) tetap
            terpusat di tengah area kerja, bukan menempel kiri. */}
        <div className={`mx-auto flex min-h-0 w-full flex-1 flex-col ${lebarMaks}`}>{children}</div>
      </div>
    </section>
  );
}
