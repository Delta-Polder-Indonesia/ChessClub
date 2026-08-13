import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function ProgramKami() {
  return (
    <HalamanIsi
      title="Program Kami"
      description="Empat pilar pembinaan Komunitas Catur Indonesia: kelas rutin, coaching clinic, simultan, dan sekolah catur."
      next={{ to: "/program-kami/kelas-dan-pelatihan", judul: "Kelas & Pelatihan" }}
    >
      <PageArtikel title="Sekilas Program">
        <p className="ql-align-justify">
          Program komunitas disusun agar pecatur dari segala usia memiliki jalur
          belajar yang jelas. Setiap pilar memiliki tujuan sendiri, tetapi
          saling menopang: kelas membangun dasar, coaching clinic menajamkan,
          simultan menumbuhkan nyali bertanding, dan sekolah catur merawat
          regenerasi.
        </p>
        <p>Pilar program yang dijalankan saat ini adalah sebagai berikut:</p>
        <ol>
          <li className="ql-align-justify">
            <Link to="/program-kami/kelas-dan-pelatihan">
              Kelas &amp; Pelatihan
            </Link>
            : kelas rutin pemula hingga mahir, daring dan luring.
          </li>
          <li className="ql-align-justify">
            <Link to="/program-kami/coaching-clinic">Coaching Clinic</Link>:
            sesi singkat bersama pelatih dan pecatur bergelar.
          </li>
          <li className="ql-align-justify">
            <Link to="/program-kami/simultan-dan-blindfold">
              Simultan &amp; Blindfold
            </Link>
            : pertunjukan simultan dan catur buta untuk anggota dan publik.
          </li>
          <li className="ql-align-justify">
            <Link to="/program-kami/sekolah-catur">Sekolah Catur</Link>:
            program ekstrakurikuler dan kemitraan dengan sekolah.
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
