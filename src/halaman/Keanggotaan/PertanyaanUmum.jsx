import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function PertanyaanUmum() {
  return (
    <HalamanIsi
      title="Pertanyaan Umum"
      parent="Keanggotaan"
      parentPath="/keanggotaan"
      description="Jawaban singkat soal biaya, usia, domisili, dan cara mulai bertanding."
      next={{ to: "/hubungi-kami", judul: "Hubungi Kami" }}
    >
      <PageArtikel title="Pertanyaan yang Sering Diajukan">
        <ol>
          <li className="ql-align-justify">
            <strong>Apakah ada iuran wajib?</strong> Tidak ada iuran bulanan
            wajib. Beberapa event memungut biaya administrasi. Anggota aktif
            mendapat potongan.
          </li>
          <li className="ql-align-justify">
            <strong>Apakah anak-anak boleh gabung?</strong> Boleh. Di bawah 10
            tahun perlu pendamping orang tua atau guru pada kegiatan luring.
          </li>
          <li className="ql-align-justify">
            <strong>Saya tinggal di luar Medan, bisa?</strong> Bisa. Kelas daring
            dan turnamen daring terbuka untuk seluruh Indonesia. Chapter daerah
            menyusul sesuai minat.
          </li>
          <li className="ql-align-justify">
            <strong>Bagaimana cara daftar?</strong> Buka Pendaftaran Anggota,
            masukkan username Chess.com. Jika akun ada, nama Anda otomatis
            masuk daftar keanggotaan beserta Elo dan rekor W/D/L dari
            Chess.com.
          </li>
          <li className="ql-align-justify">
            <strong>Bagaimana ikut turnamen pertama?</strong> Daftar sebagai
            anggota, lalu ikuti Turnamen Bulanan. Pemula tetap diterima; grup
            dapat dipisah berdasarkan kekuatan.
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
