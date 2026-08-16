/**
 * Tata letak area Beranda / Pengadaan.
 *
 * Membungkus CorporatePage dengan sidebar sehingga setiap halaman
 * (Jadwal Turnamen, Daftar Juara, dst.) cukup memanggil:
 *
 *   <TataLetakBeranda id="turnamen" title="..." ...>
 *     ...konten...
 *   </TataLetakBeranda>
 *
 * Item sidebar aktif ditentukan otomatis dari prop `id`.
 */
import {
  CorporatePage,
  CorporateSection,
} from "../../components/CorporatePage.jsx";
import { sidebarBeranda, BERANDA_BERIKUT } from "./sidebar.js";

export default function TataLetakBeranda({
  id,
  title,
  description,
  image = "/images/sekilas.jpg",
  sectionId,
  sectionTitle,
  children,
}) {
  const next = BERANDA_BERIKUT[id];

  return (
    <CorporatePage
      title={title}
      description={description}
      image={image}
      sidebar={sidebarBeranda(id)}
      next={next}
    >
      <CorporateSection
        id={sectionId || id}
        title={sectionTitle || title}
        className="pb-10 md:pb-10 xl:pb-10 pt-6 md:pt-8 xl:pt-0"
      >
        {children}
      </CorporateSection>
    </CorporatePage>
  );
}
