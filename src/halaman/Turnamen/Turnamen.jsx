import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import TabelHasilTurnamen from "../../components/TabelHasilTurnamen.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

const URL_KLUB = "https://www.chess.com/club/blunder-skuad";

/**
 * Halaman Turnamen — pintu masuk seluruh agenda kompetitif komunitas.
 * Lima tautan cepat mengarah ke layanan internal situs ini (pendaftaran
 * anggota, turnamen bulanan, turnamen terbuka, liga antar komunitas, dan
 * liga musiman), sedangkan isi artikel memakai platform serta istilah
 * yang benar-benar dipakai komunitas (Chess.com + klub Blunder Skuad).
 */
export default function Turnamen() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("turnamen.judul")}
      description={t("turnamen.deskripsi")}
      next={{ to: "/turnamen/turnamen-bulanan", judul: t("turnamen.nextJudul") }}
    >
      <PageArtikel title="Turnamen Komunitas">
        <h3><img src={gambar("/images/Turnamen/daftar.png")} alt="" style={{display:"inline",height:60,marginRight:6}}/><Link to="/pendaftaran-anggota">Pendaftaran Anggota</Link></h3>
        <h3><img src={gambar("/images/Turnamen/skor.png")} alt="" style={{display:"inline",height:60,marginRight:6}}/><Link to="/turnamen/turnamen-bulanan">Turnamen Bulanan</Link></h3>
        <h3><img src={gambar("/images/Turnamen/live.png")} alt="" style={{display:"inline",height:60,marginRight:6}}/><Link to="/turnamen/turnamen-terbuka">Turnamen Terbuka</Link></h3>
        <h3><img src={gambar("/images/Turnamen/chairs.png")} alt="" style={{display:"inline",height:60,marginRight:6}}/><Link to="/turnamen/liga-antar-komunitas">Liga Antar Komunitas</Link></h3>
        <h3><img src={gambar("/images/Turnamen/hasil.png")} alt="" style={{display:"inline",height:60,marginRight:6}}/><Link to="/turnamen/liga-musiman">Liga Musiman</Link></h3>

        <h2>Turnamen Komunitas</h2>
        <p>Jadwal turnamen diumumkan secara berkala melalui halaman <Link to="/turnamen/turnamen-bulanan">Turnamen Bulanan</Link> dan <Link to="/turnamen/liga-musiman">Liga Musiman</Link>. Permainan bisa dimainkan daring kapan saja selama periode turnamen ketika anda punya waktu luang, baik melalui versi website maupun aplikasi mobile <a href="https://www.chess.com/play/online" target="_blank" rel="noopener noreferrer">Chess.com</a>. Bergabung dengan <a href={URL_KLUB} target="_blank" rel="noopener noreferrer">klub komunitas kami</a> bersifat wajib — sangat sulit untuk berkoordinasi tanpa bergabung di klub.</p>

        <h4>Berapa kali harus main?</h4>
        <p>Tergantung jumlah peserta. Kami bisa melakukan sistem swiss atau kita bisa melakukan round robin. Waktu main bebas (ini yang sedikit membedakan dengan turnamen offline), setting waktu juga bebas. Silahkan gabung saja ke klub kami.</p>

        <h4>Apa syarat bermain?</h4>
        <p>Anda bisa bermain catur dari awal sampai selesai. <Link to="/pendaftaran-anggota">Mendaftar</Link> menjadi anggota komunitas, dan mendaftar turnamen jika masih terbuka. Anda juga diwajibkan bergabung di <a href={URL_KLUB} target="_blank" rel="noopener noreferrer">klub Chess.com kami</a>. Syarat penting adalah <strong>anda tidak curang</strong>. Menggunakan engine adalah tindakan buruk dan kami dengan keras melarangnya. Jika akun Chess.com anda terkena penutupan (violated terms of service) kapan pun, maka anda akan dikeluarkan dari komunitas dan dilarang bergabung kembali.</p>

        <h4>Verifikasi pemain?</h4>
        <p>Saat ini verifikasi dilakukan saat pendaftaran melalui akun Chess.com anda, sehingga identitas setiap peserta bisa dipastikan. Kedepannya bisa saja kami membutuhkan tatap muka di Zoom dan memperlihatkan kartu identitas anda.</p>

        <h4>Cara bermain?</h4>
        <p>Ketika anda sudah mendapatkan lawan sesuai pengundian dari panitia, anda diminta untuk bermain melawan pemain tersebut. Kapan? Selama periode turnamen, bebas tapi ada aturannya. Koordinasi waktu dilakukan melalui forum klub. Setelah komunikasi dengan lawan, kedua pemain harus online sesuai waktu luang mereka. Pemain yang pegang Putih wajib membuat papan dan melangkah pertama. Ketika Hitam sudah juga melangkah pertama, maka papan permainan sudah resmi dan harus dihitung hasilnya. Masih bisa dibatalkan, misalnya salah setting, atau Hitam sedang tidak online. Setelah permainan selesai, anda bisa membantu merekap skor, atau kami secara periodik akan merekap hasilnya.</p>

        <h4>Cara menghitung skor?</h4>
        <p>Bagaimana cara menghitung skor? Biasa. Menang 1, remis 1/2, dan kalah 0. Jika papan tidak dimainkan, maka kedua pemain mendapat skor 0. Kedepannya kami mencoba bermacam-macam variasi penghitungan. Bisa klub lawan klub. Bisa kelompok umur tertentu, dsb.</p>

        <h4>Pertandingan Kursi Empat</h4>
        <p>Apa itu kursi empat? Kursi empat terjemahan quad, atau kadang disebut pertandingan empat (quad match) adalah pertandingan yang hanya melibatkan 4 pemain. Pemain A lawan B, C lawan D, A lawan C, B lawan D, A lawan D, dan B lawan C. Warna diatur dan diacak. Pemain bermain 3 ronde pada hari (jam) tersebut dan menyelesaikannya. Untuk hadiahnya, silahkan tanya kepada admin sebelum membuat kursi empat apakah ada hadiahnya.</p>

        <h4>Kemenangan Berturut</h4>
        <p>Belum ada ketentuan khusus untuk Kemenangan Berturut (winning streak).</p>

        <h4>Hadiah Turnamen</h4>
        <p>Pada akhir turnamen, pemain-pemain dengan skor paling tinggi akan mendapat hadiah. Jika ada skor yang sama, maka hadiah dibagi rata untuk pemain tsb. Hadiah akan ditransfer ke rekening pemain lewat online banking dengan biaya transfer ditanggung pemenang.</p>

        <h4>Rating dan peringkat</h4>
        <p>Setiap permainan akan mempengaruhi rating/peringkat pemain. Kami menggunakan penghitungan ELO RATING dengan rating awal 1000. Jika anda punya FIDE rating yang sudah mapan, kami bisa mengkonversinya ke rating komunitas. Bagaimana dengan rating Chess.com? Kami tidak mengkonversinya, tetapi permainan tetap berjalan dengan sistem rating bawaan Chess.com. Peringkat bukan nilai yang dihitung untuk hadiah turnamen ini.</p>

        <h4>Klub Chess.com Komunitas</h4>
        <p>Untuk memudahkan berkomunikasi, kami menggunakan klub Chess.com dan kanal komunitas. Silahkan bergabung dalam <a href={URL_KLUB} target="_blank" rel="noopener noreferrer">klub kami</a>, atau hubungi pengurus melalui halaman <Link to="/hubungi-kami">Hubungi Kami</Link>.</p>

        <h4>Sponsor</h4>
        <p>Kami masih berkembang dan membutuhkan sponsor. Jika anda, komunitas, lembaga, atau perusahaan anda ingin mengadakan turnamen online, kami dengan senang hati akan memfasilitasinya.</p>

        <h4>Wasit Turnamen</h4>
        <p>Walau tidak ada wasit resmi dalam turnamen, kami mempunyai beberapa pemain yang menjadi wasit untuk memutuskan jika ada perselisian dan kita selesaikan secara kekeluargaan.</p>

        <h2 id="history">Hasil Turnamen</h2>
        <p>Rekap hasil turnamen komunitas dipublikasikan pada tabel berikut setiap kali sebuah rangkaian selesai. Nama juara diisikan oleh pengurus melalui dashboard internal.</p>
        <TabelHasilTurnamen />

        <p>Keterangan: Turnamen Bulanan adalah liga yang dimainkan rutin oleh anggota. Kursi Empat adalah turnamen mini yang diikuti oleh empat pemain. Turnamen Terbuka adalah turnaman langsung dengan ronde terjadwal. Untuk detail selengkapnya bisa dilihat di halaman <Link to="/keberlanjutan/pertanyaan-umum">tanya jawab</Link>.</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
