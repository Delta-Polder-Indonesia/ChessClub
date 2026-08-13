import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function Pengumuman() {
  return (
    <HalamanIsi
      title="Pengumuman"
      parent="Media & Informasi"
      parentPath="/media-dan-informasi"
      description="Pemberitahuan resmi: jadwal, pendaftaran, dan perubahan ketentuan."
      next={{ to: "/media-dan-informasi/galeri", judul: "Galeri" }}
    >
      <PageArtikel title="Berlaku saat ini">
        <ol>
          <li>
            <strong>Pendaftaran Turnamen Bulanan September</strong> dibuka
            hingga 31 Agustus 2026 pukul 21.00 WIB.
          </li>
          <li>
            <strong>Libur sekretariat</strong> pada 17 Agustus 2026. Kelas
            luring dialihkan ke sesi daring.
          </li>
          <li>
            <strong>Pemanggilan tim Liga Antar Komunitas</strong> diumumkan
            melalui surel anggota pada 20 Agustus 2026.
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
