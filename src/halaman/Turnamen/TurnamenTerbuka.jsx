import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function TurnamenTerbuka() {
  return (
    <HalamanIsi
      title="Turnamen Terbuka"
      parent="Turnamen"
      parentPath="/turnamen"
      description="Event terbuka untuk umum, termasuk format yang dilaporkan ke sistem rating bila syarat terpenuhi."
      next={{
        to: "/turnamen/liga-antar-komunitas",
        judul: "Liga Antar Komunitas",
      }}
    >
      <PageArtikel title="Untuk siapa">
        <p>
          Turnamen Terbuka menerima peserta dari luar komunitas. Ini wadah
          mempertemukan pecatur Medan dengan tamu dari kota lain, sekaligus
          menguji kesiapan anggota di lapangan yang lebih ramai.
        </p>
        <p>
          Bila jumlah pecatur berating mencukupi, panitia dapat mengajukan
          laporan rating sesuai ketentuan federasi. Informasi itu selalu
          tertulis di prospektus masing-masing event.
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
