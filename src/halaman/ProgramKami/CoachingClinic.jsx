import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function CoachingClinic() {
  return (
    <HalamanIsi
      title="Coaching Clinic"
      parent="Program Kami"
      parentPath="/program-kami"
      description="Sesi intensif bersama pelatih tamu dan pecatur bergelar untuk membedah partai, pembukaan, dan persiapan turnamen."
      next={{
        to: "/program-kami/simultan-dan-blindfold",
        judul: "Simultan & Blindfold",
      }}
    >
      <PageArtikel title="Format sesi">
        <p>
          Coaching Clinic bukan kelas semester, melainkan sesi pendek 90–120
          menit dengan satu tema. Contoh tema: struktur Isolated Queen Pawn,
          bertahan lawan serangan sayap raja, atau persiapan pertandingan
          kilat.
        </p>
        <p>
          Narasumber diundang dari pelatih internal maupun pecatur bergelar
          yang sedang berkunjung ke Sumatera Utara. Pendaftaran dibuka di kanal
          anggota paling lambat tiga hari sebelum sesi.
        </p>
        <p>
          Rekaman sesi daring disimpan di perpustakaan materi digital komunitas
          dan hanya dapat diakses anggota aktif.
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
