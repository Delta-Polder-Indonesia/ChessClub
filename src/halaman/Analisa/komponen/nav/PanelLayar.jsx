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
        <div className="flex shrink-0 flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-3 border-b border-border px-3 sm:px-5 py-3 sm:py-3.5">
          <div className="min-w-0 w-full sm:w-auto">
            <p className="text-sm sm:text-base font-extrabold text-foreground truncate">{judul}</p>
            {bawahJudul ? (
              <div className="mt-1 sm:mt-1.5 overflow-x-auto">{bawahJudul}</div>
            ) : subjudul ? (
              <p className="mt-0.5 text-[11px] sm:text-xs leading-4 text-foregroundGrey">{subjudul}</p>
            ) : null}
          </div>
          {headerKanan ? (
            <div className="flex min-w-0 w-full sm:w-auto flex-wrap items-center justify-start sm:justify-end gap-2 mt-1 sm:mt-0">
              {headerKanan}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col px-3 sm:px-5 py-3 sm:py-4">
        <div className={`mx-auto flex min-h-0 w-full flex-1 flex-col ${lebarMaks}`}>{children}</div>
      </div>
    </section>
  );
}
