import { Link } from "react-router-dom";
import { BagianBeranda } from "./TataLetakBeranda.jsx";

/** Ringkasan jalur resmi untuk melihat hasil kompetisi komunitas. */
export default function DaftarJuara() {
  return (
    <BagianBeranda id="daftar-juara" title="Daftar Juara">
      <p>
        Rekam jejak juara dan klasemen selalu mengikuti data turnamen yang
        dipublikasikan oleh pengurus. Setiap hasil dapat dilihat langsung pada
        turnamen terkait agar peserta memperoleh sumber informasi yang sama.
      </p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <Link
          to="/turnamen"
          className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="block text-base font-bold text-slate-900 group-hover:text-primary">
            Hasil & klasemen turnamen
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-slate-600">
            Lihat turnamen yang berlangsung, selesai, serta klasemen resminya.
          </span>
        </Link>
        <Link
          to="/beranda/peringkat"
          className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="block text-base font-bold text-slate-900 group-hover:text-primary">
            Peringkat anggota
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-slate-600">
            Bandingkan rating anggota dari data Chess.com yang tersedia.
          </span>
        </Link>
      </div>
    </BagianBeranda>
  );
}
