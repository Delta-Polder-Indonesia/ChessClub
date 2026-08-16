/**
 * Halaman: E-Book & Panduan.
 *
 * CATATAN: Ini konten TEMPAT (placeholder). Isi lengkapnya (daftar e-book
 * dan panduan catur) akan dilengkapi pada tahap upgrade berikutnya.
 */
import {
  DocumentGrid,
  DocumentCard,
} from "../../components/CorporatePage.jsx";
import { BagianBeranda } from "./TataLetakBeranda.jsx";

export default function EbookPanduan() {
  return (
    <BagianBeranda id="ebook-catur" title="E-Book & Panduan">
      <p>
        Halaman ini memuat koleksi e-book dan panduan catur yang dapat
        diunduh oleh anggota, dari tingkat pemula hingga lanjut.
      </p>
      <p>
        <em>(Daftar e-book akan dilengkapi pada tahap berikutnya.)</em>
      </p>
      <DocumentGrid>
        <DocumentCard title="Panduan Catur untuk Pemula" />
        <DocumentCard title="Strategi Pembukaan Catur" />
      </DocumentGrid>
    </BagianBeranda>
  );
}
