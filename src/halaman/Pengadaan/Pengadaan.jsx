import {
  CorporateDivider,
  CorporatePage,
  CorporateSection,
  DocumentCard,
  DocumentGrid,
} from "../../components/CorporatePage.jsx";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

const SIDEBAR = [
  { id: "informasi-pengadaan", label: "Informasi Pengadaan", active: true },
  { id: "pengadaan-umum", label: "Pengadaan Umum" },
  { id: "peralatan-catur", label: "Pengadaan Peralatan Catur" },
  { id: "jasa-pelatih", label: "Pengadaan Jasa Pelatih" },
  { id: "pengadaan-kegiatan", label: "Pengadaan Kegiatan" },
  { id: "e-procurement", label: "E-Procurement" },
  { id: "e-katalog", label: "E-Katalog" },
  { id: "halo-proc", label: "HALOPROC" },
  { id: "registrasi-mitra", label: "Registrasi Mitra" },
  { id: "panduan-mitra", label: "Panduan Mitra" },
];

export default function Pengadaan() {
  const { t } = useI18n();

  return (
    <CorporatePage
      title={t("pengadaan.judul")}
      description={t("pengadaan.deskripsi")}
      image={gambar("/images/hero-about.jpg")}
      sidebar={SIDEBAR}
      next={{ to: "/karir", title: t("karir.judul") }}
    >
      <CorporateSection id="informasi-pengadaan" title={t("pengadaan.artikel")}>
        <CorporateSection id="panduan-pengadaan" title="Panduan Pengadaan Barang/Jasa Komunitas" className="pl-0 md:pl-0 pr-0 md:pr-0 xl:pr-0 pb-4 pt-0 md:pt-0" titleClassName="text-2xl md:text-3xl">
          <p>Silakan akses panduan pengadaan barang dan jasa Komunitas Catur Indonesia melalui dokumen berikut.</p>
          <DocumentCard title="Panduan PBJ Komunitas Catur Indonesia" />
        </CorporateSection>

        <CorporateSection id="e-procurement" title="Portal Pengadaan Digital" className="pl-0 md:pl-0 pr-0 md:pr-0 xl:pr-0 pb-4 pt-0 md:pt-0" titleClassName="text-2xl md:text-3xl">
          <p>
            Komunitas Catur Indonesia mengembangkan proses pengadaan yang transparan, terdokumentasi, dan mudah diikuti oleh mitra. Portal pengadaan digital menjadi satu pintu untuk penyampaian kebutuhan, penawaran, evaluasi, dan pemantauan pekerjaan.
          </p>
          <p>Manfaat utama portal pengadaan digital untuk mitra:</p>
          <ul>
            <li>Alur pendaftaran dan pengajuan penawaran yang lebih sederhana.</li>
            <li>Informasi kebutuhan barang dan jasa yang tersusun dalam satu katalog.</li>
            <li>Notifikasi kegiatan pengadaan dan status dokumen secara berkala.</li>
          </ul>
        </CorporateSection>

        <CorporateSection id="panduan-mitra" title="Dokumen Untuk Mitra" className="pl-0 md:pl-0 pr-0 md:pr-0 xl:pr-0 pb-8 pt-0 md:pt-0" titleClassName="text-2xl md:text-3xl">
          <p>Pelajari proses pendaftaran hingga penyelesaian pekerjaan melalui panduan berikut.</p>
          <DocumentGrid>
            <DocumentCard title="Pendaftaran Mitra" />
            <DocumentCard title="Mengajukan Penawaran" />
            <DocumentCard title="Evaluasi dan Klarifikasi" />
            <DocumentCard title="Review dan Menandatangani Kontrak" />
          </DocumentGrid>
        </CorporateSection>
      </CorporateSection>

      <CorporateDivider />

      <CorporateSection id="kolaborasi-mitra" title="Kolaborasi Mitra" className="pt-6 md:pt-8 xl:pt-0">
        <p>
          Kami menghubungkan kebutuhan komunitas dengan mitra yang memiliki kompetensi, integritas, dan komitmen terhadap pengembangan ekosistem catur Indonesia. Setiap proses dilakukan dengan prinsip keterbukaan, kewajaran, dan tanggung jawab.
        </p>
        <p>
          Mitra yang ingin mengikuti proses pengadaan dapat menyiapkan profil usaha, portofolio, dokumen legal, serta penawaran terbaik sesuai kebutuhan kegiatan.
        </p>
        <DocumentGrid>
          <DocumentCard title="Contoh Profil Mitra" />
        </DocumentGrid>
      </CorporateSection>

      <CorporateSection id="pengadaan-umum" title="Ketentuan Umum Pengadaan" className="pt-6 md:pt-8 xl:pt-0">
        <p>
          Pengadaan barang dan jasa dilaksanakan berdasarkan kebutuhan program, ketersediaan anggaran, kualitas layanan, ketepatan waktu, dan kepatuhan terhadap Kode Etik Komunitas Catur Indonesia.
        </p>
        <p>
          Untuk pertanyaan terkait proses pengadaan, silakan hubungi sekretariat melalui halaman <Link to="/hubungi-kami" className="text-primary">Hubungi Kami</Link>.
        </p>
      </CorporateSection>
    </CorporatePage>
  );
}
