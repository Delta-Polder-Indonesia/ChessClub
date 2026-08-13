import { HalamanIsi, PageArtikel, PageGambar } from "../../components/PageBagian.jsx";

export default function Galeri() {
  return (
    <HalamanIsi
      title="Galeri"
      parent="Media & Informasi"
      parentPath="/media-dan-informasi"
      description="Foto kegiatan kelas, pertandingan, dan perayaan hari lahir komunitas."
      next={{
        to: "/media-dan-informasi/buletin-bulanan",
        judul: "Buletin Bulanan",
      }}
    >
      <PageArtikel title="Dokumentasi">
        <p className="ql-align-justify">
          Foto dipilih dari arsip Divisi Media. Untuk pemakaian ulang di luar
          kanal komunitas, hubungi humas terlebih dahulu.
        </p>
      </PageArtikel>

      <PageGambar
        src="/images/sekilas.jpg"
        alt="Kegiatan rutin sekretariat Medan"
        caption="Suasana kegiatan rutin komunitas di sekretariat Medan, 2025."
      />
      <PageGambar
        src="/images/tata-nilai.jpg"
        alt="Tata nilai komunitas"
        caption="Nilai-nilai yang dipegang teguh anggota komunitas dalam setiap pertandingan."
      />
      <PageGambar
        src="/images/tonggak-2024.jpg"
        alt="Arsip kegiatan 2024"
        caption="Dokumentasi kegiatan komunitas, 2024."
      />
    </HalamanIsi>
  );
}
