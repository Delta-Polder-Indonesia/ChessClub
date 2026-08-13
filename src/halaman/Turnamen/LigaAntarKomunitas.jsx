import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function LigaAntarKomunitas() {
  return (
    <HalamanIsi
      title="Liga Antar Komunitas"
      parent="Turnamen"
      parentPath="/turnamen"
      description="Pertandingan tim melawan komunitas dan klub lain di Sumatera maupun secara daring."
      next={{ to: "/media-dan-informasi", judul: "Media & Informasi" }}
    >
      <PageArtikel title="Format tim">
        <p>
          Liga Antar Komunitas dimainkan dalam format tim 4 papan + 1 cadangan.
          Satu klub boleh menurunkan lebih dari satu tim bila kuota memungkinkan.
        </p>
        <p>
          Undangan ke komunitas mitra dikirim Divisi Turnamen. Komunitas yang
          ingin menantang dapat menulis ke{" "}
          <a href="mailto:info@komunitascatur.or.id">
            info@komunitascatur.or.id
          </a>
          .
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
