import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function LigaMusiman() {
  return (
    <HalamanIsi
      title="Liga Musiman"
      parent="Turnamen"
      parentPath="/turnamen"
      description="Tiga musim kompetisi setahun dengan klasemen yang berjalan, bukan event sekali selesai."
      next={{ to: "/turnamen/turnamen-terbuka", judul: "Turnamen Terbuka" }}
    >
      <PageArtikel title="Musim dan format">
        <p>
          Liga Musiman dibagi menjadi Musim I (Januari–April), Musim II
          (Mei–Agustus), dan Musim III (September–Desember). Setiap pemain
          bermain minimal enam partai agar masuk klasemen resmi.
        </p>
        <p>
          Poin dihitung 1 untuk menang, ½ untuk remis, 0 untuk kalah. Tie-break
          memakai Sonneborn-Berger, kemudian hasil pertemuan langsung.
        </p>
        <p>
          Juara musim mendapat undangan langsung ke final Turnamen Terbuka
          akhir tahun.
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
