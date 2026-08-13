import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import { PageArtikel } from "../components/PageBagian.jsx";

export default function TidakDitemukan() {
  return (
    <>
      <Hero
        title="Halaman tidak ditemukan"
        description="Alamat yang Anda tuju tidak ada di situs ini."
        crumbs={[{ label: "Home", to: "/" }, { label: "404" }]}
      />
      <PageArtikel title="Kembali">
        <p>
          Periksa kembali tautan, atau kembali ke{" "}
          <Link to="/">beranda Tentang Kami</Link>.
        </p>
      </PageArtikel>
    </>
  );
}
