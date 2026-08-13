import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function SyaratDanKetentuan() {
  return (
    <HalamanIsi
      title="Syarat & Ketentuan"
      parent="Keanggotaan"
      parentPath="/keanggotaan"
      description="Ketentuan administratif keanggotaan Komunitas Catur Indonesia."
      next={{
        to: "/keanggotaan/kode-etik-komunitas",
        judul: "Kode Etik Komunitas",
      }}
    >
      <PageArtikel title="Ketentuan utama">
        <ol>
          <li>Berusia sekurang-kurangnya 10 tahun, atau didampingi orang tua bila lebih muda.</li>
          <li>Mengisi data yang benar pada formulir pendaftaran.</li>
          <li>Menyetujui Kode Etik Komunitas.</li>
          <li>Keanggotaan ditinjau ulang bila tidak ada aktivitas selama 18 bulan.</li>
          <li>
            Komunitas berhak menolak atau mencabut keanggotaan jika terjadi
            pelanggaran berat terhadap kode etik.
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
