import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function SimultanDanBlindfold() {
  return (
    <HalamanIsi
      title="Simultan & Blindfold"
      parent="Program Kami"
      parentPath="/program-kami"
      description="Pertunjukan simultan dan catur buta sebagai wadah unjuk nyali sekaligus meramaikan publik catur."
      next={{ to: "/program-kami/sekolah-catur", judul: "Sekolah Catur" }}
    >
      <PageArtikel title="Dua jenis acara">
        <p>
          Simultan mempertemukan satu pecatur kuat dengan banyak papan sekaligus.
          Peserta dari pemula hingga menengah dapat merasakan tekanan partai
          sungguhan tanpa harus masuk turnamen resmi.
        </p>
        <p>
          Blindfold (catur buta) ditampilkan pada hari-hari besar komunitas —
          misalnya hari lahir 10 Desember — sebagai tontonan edukatif. Pemain
          yang tampil sudah melalui seleksi internal demi menjaga kualitas dan
          keselamatan sesi.
        </p>
        <p>
          Usulan menjadi pemberi simultan dapat diajukan ke Divisi Program
          paling lambat 21 hari sebelum tanggal yang diinginkan.
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
