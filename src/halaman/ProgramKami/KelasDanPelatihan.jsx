import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function KelasDanPelatihan() {
  return (
    <HalamanIsi
      title="Kelas & Pelatihan"
      parent="Program Kami"
      parentPath="/program-kami"
      description="Kelas rutin komunitas untuk pemula, menengah, dan mahir — daring maupun di sekretariat Medan."
      next={{ to: "/program-kami/coaching-clinic", judul: "Coaching Clinic" }}
    >
      <PageArtikel title="Jalur belajar">
        <p>
          Kelas &amp; Pelatihan adalah tulang punggung pembinaan komunitas.
          Materi disusun berjenjang supaya anggota baru tidak kebingungan, dan
          anggota lama tetap punya tantangan.
        </p>
        <ol>
          <li>
            <strong>Pemula:</strong> peraturan, notasi, mat dasar, dan etiket
            bertanding.
          </li>
          <li>
            <strong>Menengah:</strong> struktur pembukaan, rencana tengah
            permainan, dan akhiran rook-pion.
          </li>
          <li>
            <strong>Mahir:</strong> analisis partai sendiri, persiapan lawan,
            dan latihan perhitungan.
          </li>
        </ol>
        <p>
          Jadwal daring diumumkan setiap minggu di kanal anggota. Kelas luring
          diadakan di sekretariat Medan pada akhir pekan. Kuota tiap sesi
          dibatasi agar pendampingan tetap personal.
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
