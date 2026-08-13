import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function Turnamen() {
  return (
    <HalamanIsi
      title="Turnamen"
      description="Kalender pertandingan komunitas: bulanan, liga musiman, terbuka, dan antar komunitas."
      next={{ to: "/turnamen/turnamen-bulanan", judul: "Turnamen Bulanan" }}
    >
      <PageArtikel title="Wadah Bertanding">
        <p className="ql-align-justify">
          Turnamen adalah cara komunitas mengukur progres latihan. Semua event
          memakai kode etik fair play, dan hasilnya dicatat di papan peringkat
          internal.
        </p>
        <p>Kalender pertandingan komunitas terdiri atas:</p>
        <ol>
          <li className="ql-align-justify">
            <Link to="/turnamen/turnamen-bulanan">Turnamen Bulanan</Link>: Swiss
            lima ronde setiap bulan untuk semua kekuatan.
          </li>
          <li className="ql-align-justify">
            <Link to="/turnamen/liga-musiman">Liga Musiman</Link>: tiga musim
            setahun dengan klasemen yang berjalan.
          </li>
          <li className="ql-align-justify">
            <Link to="/turnamen/turnamen-terbuka">Turnamen Terbuka</Link>: event
            terbuka, termasuk yang dilaporkan ke sistem rating bila syarat
            terpenuhi.
          </li>
          <li className="ql-align-justify">
            <Link to="/turnamen/liga-antar-komunitas">
              Liga Antar Komunitas
            </Link>
            : pertandingan persahabatan dan liga antar klub.
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
