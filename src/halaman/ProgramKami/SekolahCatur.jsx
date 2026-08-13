import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function SekolahCatur() {
  return (
    <HalamanIsi
      title="Sekolah Catur"
      parent="Program Kami"
      parentPath="/program-kami"
      description="Kemitraan dengan sekolah untuk menumbuhkan catur sebagai kegiatan rutin, bukan sekadar lomba sesaat."
      next={{ to: "/turnamen", judul: "Turnamen" }}
    >
      <PageArtikel title="Cara bermitra">
        <p>
          Sekolah Catur adalah program pembinaan usia muda di lingkungan
          formal. Komunitas menyediakan kurikulum 12 pertemuan, pelatih
          pendamping, dan perangkat papan untuk masa perkenalan.
        </p>
        <p>
          Sekolah mitra menyediakan ruang, jadwal tetap, dan guru pendamping.
          Setelah satu semester, siswa yang menonjol diundang ke kelas komunitas
          dan turnamen pelajar.
        </p>
        <p>
          Pengajuan kemitraan dikirim ke{" "}
          <a href="mailto:info@komunitascatur.or.id">
            info@komunitascatur.or.id
          </a>{" "}
          dengan subjek “Sekolah Catur — [nama sekolah]”.
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
