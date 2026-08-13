import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function MediaDanInformasi() {
  return (
    <HalamanIsi
      title="Media & Informasi"
      description="Kanal resmi berita, pengumuman, galeri, dan buletin Komunitas Catur Indonesia."
      next={{
        to: "/media-dan-informasi/berita-komunitas",
        judul: "Berita Komunitas",
      }}
    >
      <PageArtikel title="Satu Sumber Resmi">
        <p className="ql-align-justify">
          Semua informasi resmi komunitas hanya dikeluarkan melalui kanal ini
          dan surel info@komunitascatur.or.id. Waspadai undangan turnamen atau
          pungutan yang tidak tercantum di halaman Pengumuman.
        </p>
        <p>Kanal yang tersedia adalah sebagai berikut:</p>
        <ol>
          <li className="ql-align-justify">
            <Link to="/media-dan-informasi/berita-komunitas">
              Berita Komunitas
            </Link>
            : laporan kegiatan, wawancara, dan liputan turnamen.
          </li>
          <li className="ql-align-justify">
            <Link to="/media-dan-informasi/pengumuman">Pengumuman</Link>: jadwal,
            pendaftaran, dan pemberitahuan resmi.
          </li>
          <li className="ql-align-justify">
            <Link to="/media-dan-informasi/galeri">Galeri</Link>: foto kegiatan
            sekretariat, kelas, dan pertandingan.
          </li>
          <li className="ql-align-justify">
            <Link to="/media-dan-informasi/buletin-bulanan">
              Buletin Bulanan
            </Link>
            : ringkasan bulanan untuk anggota dan publik.
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
