import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react";
import { flexRender } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.jsx";
import { Tombol } from "./ui.jsx";

/* ------------------------------------------------------ header sort */
function TombolUrutkan({ kolom, anak }) {
  const arah = kolom.getIsSorted();
  return (
    <button
      type="button"
      onClick={() => kolom.toggleSorting(arah === "asc")}
      className="inline-flex items-center gap-1 font-medium text-slate-700 transition-colors hover:text-slate-900"
    >
      {anak}
      {arah === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : arah === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" />
      )}
    </button>
  );
}

/* ----------------------------------------- dropdown visibility kolom */
function MenuKolom({ tabel }) {
  const [terbuka, setTerbuka] = useState(false);
  const [posisi, setPosisi] = useState(null);
  const tombolRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!terbuka) return;
    const el = tombolRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPosisi({ top: r.bottom + 4, left: r.left });
  }, [terbuka]);

  useEffect(() => {
    if (!terbuka) return;
    const cekKlik = (e) => {
      if (tombolRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setTerbuka(false);
    };
    const cekEsc = (e) => e.key === "Escape" && setTerbuka(false);
    document.addEventListener("mousedown", cekKlik);
    document.addEventListener("keydown", cekEsc);
    return () => {
      document.removeEventListener("mousedown", cekKlik);
      document.removeEventListener("keydown", cekEsc);
    };
  }, [terbuka]);

  const kolom = tabel.getAllColumns().filter((c) => c.getCanHide());
  if (!kolom.length) return null;

  return (
    <div ref={tombolRef} className="inline-flex">
      <button
        type="button"
        onClick={() => setTerbuka((t) => !t)}
        aria-haspopup="menu"
        aria-expanded={terbuka}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border-2 border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        Kolom
        <ChevronDown className="size-3.5" />
      </button>
      {terbuka &&
        posisi &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Pilih kolom"
            style={{ top: posisi.top, left: posisi.left }}
            className="fixed z-50 min-w-[10rem] rounded-md border border-slate-200 bg-white p-1 shadow-lg"
          >
            {kolom.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={c.getIsVisible()}
                  onChange={c.getToggleVisibilityHandler()}
                  className="size-3.5 accent-[#0B2F9F]"
                />
                <span>{typeof c.columnDef.header === "string" ? c.columnDef.header : c.id}</span>
              </label>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/* ================================================ TabelData komponen */

/**
 * Tabel data generik dengan sorting, pagination, dan dropdown kolom.
 *
 * @param {object} props
 * @param {Array} props.data          — array data (diasumsikan sudah stabil/referenced)
 * @param {Array} props.kolom         — kolom react-table (header boleh string — akan dibungkus TombolUrutkan otomatis jika enableSorting !== false)
 * @param {ReactNode} [props.ruangKosong] — konten saat data kosong
 * @param {string} [props.labelItem]  — label item untuk footer (mis. "admin", "catatan masuk")
 * @param {number} [props.pageSize]   — jumlah baris per halaman (default 10)
 */
export default function TabelData({
  data,
  kolom,
  ruangKosong = null,
  labelItem = "item",
  pageSize = 10,
}) {
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  const kolomOtomatis = useMemo(
    () =>
      kolom.map((k) => ({
        ...k,
        header:
          typeof k.header === "function"
            ? k.header
            : ({ column }) =>
                k.enableSorting === false ? (
                  <span className="text-sm font-medium text-slate-700">{k.header}</span>
                ) : (
                  <TombolUrutkan kolom={column} anak={k.header} />
                ),
      })),
    [kolom]
  );

  const tabel = useLegacyTable({
    data,
    columns: kolomOtomatis,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const jumlahTampil = tabel.getFilteredRowModel().rows.length;

  if (!data.length) {
    return <>{ruangKosong}</>;
  }

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <MenuKolom tabel={tabel} />
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            {tabel.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {tabel.getRowModel().rows.length ? (
              tabel.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={kolom.length}
                  className="py-8 text-center text-slate-500"
                >
                  Tidak ada data yang cocok dengan filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <p className="text-sm text-slate-600">
            {jumlahTampil} {labelItem}.
          </p>
          <div className="flex items-center gap-2">
            <Tombol
              kecil={true}
              anak="Sebelumnya"
              disabled={!tabel.getCanPreviousPage()}
              onClick={() => tabel.previousPage()}
            />
            <span className="text-sm text-slate-600">
              Halaman {tabel.getState().pagination.pageIndex + 1} dari{" "}
              {tabel.getPageCount()}
            </span>
            <Tombol
              kecil={true}
              anak="Berikutnya"
              disabled={!tabel.getCanNextPage()}
              onClick={() => tabel.nextPage()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
