import { BagianBeranda } from "./TataLetakBeranda.jsx";
import TabelHasilTurnamen from "../../components/TabelHasilTurnamen.jsx";

/**
 * Tab Beranda "Daftar Juara".
 *
 * Isinya adalah tabel hasil turnamen yang sama persis dengan yang tampil di
 * bawah halaman /turnamen (komponen TabelHasilTurnamen): turnamen berstatus
 * selesai atau yang sudah diberi nama juara oleh pengurus lewat dashboard
 * (tab "Juara Turnamen"). Karena komponen yang sama dipakai di dua halaman,
 * data dan aturan penyaringannya tidak mungkin berbeda satu sama lain, dan
 * setiap pembaruan di dashboard otomatis tampil di keduanya.
 */
export default function DaftarJuara() {
  return (
    <BagianBeranda id="daftar-juara" title="Daftar Juara">
      <TabelHasilTurnamen />
    </BagianBeranda>
  );
}
