/**
 * Halaman: PERINGKAT.
 *
 * SATU PINTU DATA — halaman ini TIDAK punya data sendiri. Sumbernya sama
 * persis dengan tab Keanggotaan (TentangKami/StrukturGrupCatur/Keanggotaan):
 * `useAnggota()` dari src/lib/anggotaBersama.js → GET /api/anggota.
 *
 * Artinya: begitu sebuah akun muncul di roster klub BLUNDER SKUAD pada
 * Chess.com, namanya otomatis tampil di kedua halaman tanpa perlu
 * menyunting berkas apa pun.
 *
 * Susunan tabel:
 *
 *   #  |  PROFILE  |  Nama  |  Rating  |  W/D/L  |  Game History  |  Chess.com
 *
 * - PROFILE: foto profil Chess.com (avatar); bila kosong, ditampilkan
 *   lingkaran dengan huruf awal nama.
 * - RATING: Elo pemain pada kontrol waktu yang sedang dipilih.
 * - GAME HISTORY: jumlah TOTAL permainan (menang + seri + kalah) pemain
 *   pada kontrol waktu yang sedang dipilih.
 *
 * Nama ditulis KAPITAL dengan lencana centang biru menempel di
 * belakangnya. Anggota yang akun Chess.com-nya kena ban fair play
 * ditandai lingkaran larangan MERAH di belakang nama, dan tetap tampil
 * sampai pengurus menghapusnya dari daftar anggota.
 * Pemilih jenis permainan ada di deretan filter atas
 * (di samping "Cari pemain" dan "Tingkatan") dan berlaku GLOBAL untuk
 * seluruh tabel:
 *
 *   All Games · Blitz · Bullet · Rapid · Daily
 *
 * Ganti ke Blitz (misalnya) → kolom W/D/L dan GAME HISTORY semua pemain
 * ikut menampilkan data Blitz, tanpa memuat ulang halaman dan tanpa
 * mengubah urutan peringkat. Pemain tanpa data pada kontrol terpilih
 * ditampilkan kosong.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BagianBeranda } from "./TataLetakBeranda.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { CentangBiru, LencanaBan } from "../../components/Lencana.jsx";
import {
  useAnggota,
  susunPeringkat,
  eloAnggota,
  namaTampil,
  opsiKontrol,
  kenaBan,
  KONTROL,
} from "../../lib/anggotaBersama.js";
import { TINGKATAN_RATING } from "../TentangKami/StrukturGrupCatur/Keanggotaan/TingkatanRating.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.jsx";

/** Pilihan kontrol waktu GLOBAL untuk seluruh tabel ("all" = All Games). */
const OPSI_KONTROL = [
  { id: "all", label: "All Games" },
  ...KONTROL.map((k) => ({ id: k, label: k })),
];

const URL_KLUB = "https://www.chess.com/club/blunder-skuad";

function BarisPeringkat({ a, kontrol }) {
  const opsi = useMemo(() => opsiKontrol(a), [a]);

  // Data kontrol global terpilih; null bila pemain tidak punya data di
  // kontrol itu (misal Blitz dipilih tapi ia belum pernah main Blitz).
  const aktif = opsi.find((o) => o.id === kontrol) || null;
  const bermasalah = a.hilang || a.gagal;
  const tampilkan = !bermasalah && aktif;

  return (
    <TableRow>
      <TableCell className="w-12 text-right text-slate-500 tabular-nums">
        {a.no ?? ""}
      </TableCell>
      <TableCell className="w-14">
        {a.foto ? (
          <img
            src={a.foto}
            alt={a.username || "foto profil"}
            width="40"
            height="40"
            loading="lazy"
            className="foto-anggota outline-2 outline-black"
          />
        ) : (
          <span className="foto-anggota flex h-10 w-10 items-center justify-center bg-white text-sm font-bold text-black outline-2 outline-black">
            {(a.nama || a.username || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap font-medium text-slate-900">
        {namaTampil(a).toUpperCase()}
        {a.terverifikasi && <CentangBiru />}
        {kenaBan(a) && <LencanaBan />}
      </TableCell>
      <TableCell className="w-24 text-center font-bold text-slate-900 tabular-nums">
        {aktif?.elo === null || aktif?.elo === undefined ? "" : aktif.elo}
      </TableCell>
      <TableCell className="w-28 whitespace-nowrap text-center">
        {tampilkan ? (
          <span className="text-xs text-slate-500 tabular-nums">
            {aktif.win} / {aktif.draw} / {aktif.loss}
          </span>
        ) : (
          ""
        )}
      </TableCell>
      <TableCell className="w-32 text-center font-semibold text-slate-900 tabular-nums">
        {tampilkan ? aktif.total : ""}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {a.username ? (
          <a
            href={a.url || `https://chess.com/member/${a.username}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary hover:underline"
          >
            {a.username}
          </a>
        ) : (
          ""
        )}
      </TableCell>
    </TableRow>
  );
}

export default function Peringkat() {
  // Sumber data identik dengan tab Keanggotaan.
  const { anggota, status, menyegarkan, muatUlang } = useAnggota();
  const { t } = useI18n();
  const adaData = anggota.length > 0;

  const [cari, setCari] = useState("");
  const [tingkat, setTingkat] = useState("semua");
  const [kontrol, setKontrol] = useState("all");

  const berperingkat = useMemo(() => susunPeringkat(anggota), [anggota]);

  const hasil = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    return berperingkat.filter((a) => {
      if (tingkat !== "semua") {
        const elo = eloAnggota(a);
        if (tingkat === "tanpa-rating") {
          if (elo !== null) return false;
        } else {
          const t = TINGKATAN_RATING.find((x) => x.id === tingkat);
          if (!t || elo === null) return false;
          if (t.max === null ? elo < t.min : elo < t.min || elo >= t.max)
            return false;
        }
      }

      if (!kunci) return true;
      return (
        namaTampil(a).toLowerCase().includes(kunci) ||
        (a.username || "").toLowerCase().includes(kunci)
      );
    });
  }, [berperingkat, cari, tingkat]);

  const ubah = (setter) => (nilai) => setter(nilai);

  return (
    <BagianBeranda
      id="peringkat"
      title="Peringkat pemain BLUNDER SKUAD"
    >
      <p className="ql-align-justify">
        Peringkat disusun dari akun pada{" "}
        <a
          href={URL_KLUB}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary"
        >
          klub BLUNDER SKUAD di Chess.com
        </a>{" "}
        dengan Elo Chess.com masing-masing pemain (diutamakan Rapid).
        Keanggotaan memakai roster publik yang sama dengan{" "}
        <Link
          to="/tentang-kami/struktur-grup-catur#keanggotaan"
          className="text-primary"
        >
          Daftar Anggota
        </Link>{" "}
        dan diperbarui otomatis. Chess.com memperbarui roster klub maksimal
        setiap 12 jam; rating dan rekor pemain disegarkan saat data dimuat.
      </p>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-4">
        <label className="flex flex-col gap-1 text-sm text-grey-800">
          <span className="font-medium">Cari pemain</span>
          <input
            type="search"
            value={cari}
            onChange={(e) => ubah(setCari)(e.target.value)}
            placeholder="Nama atau username"
            className="border-0 border-b border-solid border-grey-300 outline-none py-1 pr-2 text-sm bg-transparent focus:border-primary min-w-[220px]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-grey-800">
          <span className="font-medium">Tingkatan</span>
          <select
            value={tingkat}
            onChange={(e) => ubah(setTingkat)(e.target.value)}
            className="border-0 border-b border-solid border-grey-300 outline-none py-1 pl-1 pr-8 text-sm bg-transparent focus:border-primary cursor-pointer"
          >
            <option value="semua">Semua tingkatan</option>
            <option value="tanpa-rating">Tanpa rating</option>
            {TINGKATAN_RATING.map((t) => (
              <option key={t.id} value={t.id}>
                {t.range}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-grey-800">
          <span className="font-medium">Kontrol waktu</span>
          <select
            value={kontrol}
            onChange={(e) => setKontrol(e.target.value)}
            className="border-0 border-b border-solid border-grey-300 outline-none py-1 pl-1 pr-8 text-sm bg-transparent focus:border-primary cursor-pointer"
          >
            {OPSI_KONTROL.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-row items-center gap-4 pb-1 ml-auto whitespace-nowrap">
          <p className="text-sm text-slate-500 shrink-0">
            {t("beranda.peringkatJumlah", { jumlah: hasil.length })}
          </p>
          <button
            type="button"
            onClick={muatUlang}
            className="text-sm text-primary underline underline-offset-2 shrink-0"
          >
            {t("beranda.muatUlang")}
          </button>
        </div>
      </div>

      {status === "memuat" && <p>{t("beranda.peringkatMemuat")}</p>}
      {status === "gagal" && <p>{t("beranda.peringkatGagal")}</p>}
      {menyegarkan && adaData && (
        <p className="mb-3 text-xs text-slate-500">
          {t("beranda.peringkatMenyegarkan")}
        </p>
      )}

      {status === "siap" && !adaData && (
        <p>
          {t("beranda.peringkatKosong1")}{" "}
          <a
            href={URL_KLUB}
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary"
          >
            klub BLUNDER SKUAD
          </a>
          {t("beranda.peringkatKosong2")}
        </p>
      )}

      {adaData && hasil.length === 0 && (
        <p>Tidak ada pemain yang cocok dengan pencarian ini.</p>
      )}

      {adaData && hasil.length > 0 && (
        <div className="overflow-auto max-h-[760px]">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">#</TableHead>
                <TableHead className="w-14">Profile</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="w-24 text-center">Rating</TableHead>
                <TableHead className="w-28 text-center">W/D/L</TableHead>
                <TableHead className="w-32 text-center">Game History</TableHead>
                <TableHead>Chess.com</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasil.map((a) => (
                <BarisPeringkat key={a.username} a={a} kontrol={kontrol} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </BagianBeranda>
  );
}
