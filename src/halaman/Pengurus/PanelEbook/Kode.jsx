import { formatWaktu, sisaMenit } from "./bantuan.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.jsx";
import { Tombol, MenuAksi } from "../ui.jsx";
import { Copy, Trash2 } from "lucide-react";

/**
 * Halaman "Daftar kode akses": semua kode yang pernah diterbitkan.
 */
export default function EbookKode({ kode, kini, sibuk, onSalin, onHapus, onMuat }) {
  return (
    <section
      aria-labelledby="daftar-kode-judul"
      className="rounded-md border-2 border-slate-200 bg-white"
    >
      <div className="flex items-center justify-between border-b-2 border-slate-200 px-4 py-3">
        <div>
          <h3 id="daftar-kode-judul" className="text-sm font-semibold text-slate-900">
            Daftar kode akses
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Kode aktif 1 jam sejak diterbitkan, lalu kedaluwarsa otomatis.
          </p>
        </div>
        <Tombol kecil onClick={onMuat} disabled={sibuk}>
          Segarkan
        </Tombol>
      </div>
      {kode.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          Belum ada kode. Terbitkan kode pertama lewat halaman "Kode E-Book".
        </p>
      ) : (
        <div className="overflow-auto">
          <Table aria-describedby="daftar-kode-judul">
            <TableHeader>
              <TableRow>
                <TableHead>Panggilan</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Diterbitkan</TableHead>
                <TableHead>Kedaluwarsa</TableHead>
                <TableHead className="text-center">Unduhan</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kode.map((k) => (
                <TableRow key={k.kode}>
                  <TableCell className="font-medium text-slate-900">{k.panggilan}</TableCell>
                  <TableCell>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-slate-800">
                      {k.kode}
                    </span>
                  </TableCell>
                  <TableCell>
                    {k.kadaluarsa ? (
                      <span className="text-xs">Kedaluwarsa</span>
                    ) : (
                      <span
                        className="text-xs"
                        title={`Sisa ${sisaMenit(k.kedaluwarsa, kini)} menit lagi`}
                      >
                        Aktif · {sisaMenit(k.kedaluwarsa, kini)} mnt
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{formatWaktu(k.dibuat)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{formatWaktu(k.kedaluwarsa)}</TableCell>
                  <TableCell className="text-center text-xs">{k.jumlahUnduhan || 0}×</TableCell>
                  <TableCell className="max-w-[180px] truncate text-xs text-slate-500" title={k.catatan || ""}>
                    {k.catatan || "—"}
                  </TableCell>
                  <TableCell>
                    <MenuAksi
                      aksi={[
                        {
                          label: "Salin",
                          Ikon: Copy,
                          onClick: () => onSalin(k.kode),
                          disabled: sibuk,
                        },
                        {
                          label: "Hapus",
                          Ikon: Trash2,
                          onClick: () => onHapus(k),
                          disabled: sibuk,
                          bahaya: true,
                        },
                      ]}
                    />
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