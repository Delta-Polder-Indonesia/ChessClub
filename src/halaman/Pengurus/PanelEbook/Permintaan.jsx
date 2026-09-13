import { formatWaktu, tautanAkun } from "./bantuan.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.jsx";
import { MenuAksi } from "../ui.jsx";
import { Check, X } from "lucide-react";

/**
 * Halaman "Permintaan kode": pengajuan dari popup unduh yang belum diputus.
 */
export default function EbookPermintaan({ minta, cariMinta, onCariMinta, sibuk, onTerbitkan, onTolak }) {
  const tersaring = minta.filter((m) => {
    const kunci = cariMinta.trim().toLowerCase();
    if (!kunci) return true;
    return (
      m.nama?.toLowerCase().includes(kunci) ||
      m.akunChess?.toLowerCase().includes(kunci)
    );
  });

  return (
    <section
      aria-labelledby="permintaan-kode-judul"
      className="rounded-md border-2 border-slate-200 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 px-4 py-3">
        <div>
          <h3 id="permintaan-kode-judul" className="text-sm font-semibold text-slate-900">
            Permintaan kode
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Orang yang mengajukan lewat popup unduh. Cari namanya, lalu
            terbitkan kodenya dan kirimkan lewat WA/grup.
          </p>
        </div>
        <input
          type="search"
          value={cariMinta}
          onChange={(e) => onCariMinta(e.target.value)}
          placeholder="Cari nama / akun…"
          aria-label="Cari permintaan"
          className="w-56 rounded-md border-2 border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>
      {tersaring.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          {cariMinta.trim()
            ? "Tidak ada permintaan yang cocok dengan pencarian."
            : "Belum ada permintaan kode."}
        </p>
      ) : (
        <div className="overflow-auto">
          <Table aria-describedby="permintaan-kode-judul">
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Nama asli</TableHead>
                <TableHead>Akun Chess.com</TableHead>
                <TableHead>Ingin mengunduh</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tersaring.map((m) => (
                <TableRow key={m.id || m.waktu}>
                  <TableCell className="whitespace-nowrap text-xs">{formatWaktu(m.waktu)}</TableCell>
                  <TableCell className="font-medium text-slate-900">{m.nama}</TableCell>
                  <TableCell>{tautanAkun(m.akunChess)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-slate-500" title={m.judul || ""}>
                    {m.judul || "—"}
                  </TableCell>
                  <TableCell>
                    {m.status === "menunggu" ? (
                      <span className="text-xs">Menunggu</span>
                    ) : m.status === "diterbitkan" ? (
                      <span className="text-xs">
                        Diterbitkan{" "}
                        <span className="font-mono font-bold">{m.kode}</span>
                      </span>
                    ) : (
                      <span className="text-xs">Ditolak</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {m.status === "menunggu" ? (
                      <MenuAksi
                        aksi={[
                          {
                            label: "Terbitkan kode",
                            Ikon: Check,
                            onClick: () => onTerbitkan(m),
                            disabled: sibuk,
                          },
                          {
                            label: "Tolak",
                            Ikon: X,
                            onClick: () => onTolak(m),
                            disabled: sibuk,
                            bahaya: true,
                          },
                        ]}
                      />
                    ) : (
                      <span className="text-xs text-slate-400">
                        {formatWaktu(m.diputus)}
                      </span>
                    )}
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