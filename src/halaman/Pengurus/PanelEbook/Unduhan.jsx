import { formatWaktu, tautanAkun } from "./bantuan.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.jsx";

/**
 * Halaman "Jejak unduhan": siapa yang mengunduh, memakai kode siapa, buku apa.
 */
export default function EbookUnduhan({ unduhan }) {
  return (
    <section
      aria-labelledby="jejak-unduhan-judul"
      className="rounded-md border-2 border-slate-200 bg-white"
    >
      <div className="border-b-2 border-slate-200 px-4 py-3">
        <h3 id="jejak-unduhan-judul" className="text-sm font-semibold text-slate-900">
          Jejak unduhan
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Siapa yang mengunduh, memakai kode siapa, dan buku apa — terbaru di
          atas (maksimal 1000 catatan terakhir).
        </p>
      </div>
      {unduhan.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          Belum ada unduhan yang tercatat.
        </p>
      ) : (
        <div className="overflow-auto">
          <Table aria-describedby="jejak-unduhan-judul">
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Nama asli</TableHead>
                <TableHead>Akun Chess.com</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Buku</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unduhan.map((u) => (
                <TableRow key={u.id || u.waktu}>
                  <TableCell className="whitespace-nowrap text-xs">{formatWaktu(u.waktu)}</TableCell>
                  <TableCell className="font-medium text-slate-900">{u.nama}</TableCell>
                  <TableCell>{tautanAkun(u.akunChess)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    <span className="font-mono">{u.kode}</span>
                    <span className="ml-1 text-slate-500">({u.panggilan})</span>
                  </TableCell>
                  <TableCell
                    className="max-w-[280px] truncate text-xs"
                    title={u.judul || ""}
                  >
                    {u.judul || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}