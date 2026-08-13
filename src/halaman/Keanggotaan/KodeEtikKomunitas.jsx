import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function KodeEtikKomunitas() {
  return (
    <HalamanIsi
      title="Kode Etik Komunitas"
      parent="Keanggotaan"
      parentPath="/keanggotaan"
      description="Fair play, integritas, dan tata krama yang berlaku di papan, daring, maupun ruang diskusi."
      next={{ to: "/keanggotaan/pertanyaan-umum", judul: "Pertanyaan Umum" }}
    >
      <PageArtikel title="Yang wajib dipegang">
        <ol>
          <li>Tidak curang: dilarang engine, bantuan luar, atau identitas palsu.</li>
          <li>Hormati lawan, wasit, dan panitia — di papan maupun di kolom obrolan.</li>
          <li>Jangan menyebarkan kebencian, pelecehan, atau doxing.</li>
          <li>Laporkan dugaan kecurangan ke Divisi Turnamen, bukan di ruang publik.</li>
          <li>Langgar berulang dapat berujung skorsing hingga pencabutan keanggotaan.</li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
