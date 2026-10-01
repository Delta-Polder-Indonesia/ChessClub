import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./icons.jsx";
import Hero from "./Hero.jsx";
import MetaHalaman from "./MetaHalaman.jsx";
import { BreadcrumbJsonLd } from "./JsonLd.jsx";
import { useI18n } from "../lib/i18n.jsx";

/** Kerangka halaman baru: hero + isi + blok Selanjutnya (sama seperti Pertamina). */
export function HalamanIsi({
  title,
  parent,
  parentPath,
  description,
  metaDescription,
  image,
  imageWidth,
  imageHeight,
  robots,
  next,
  submenu,
  children,
}) {
  const { t } = useI18n();
  const crumbs = [
    { label: t("common.home"), to: "/" },
    parent ? { label: parent, to: parentPath } : null,
    { label: title },
  ].filter(Boolean);

  return (
    <>
      <MetaHalaman
        title={title}
        description={metaDescription || description}
        image={image}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        robots={robots}
      />
      <BreadcrumbJsonLd items={crumbs} />
      <Hero title={title} description={description} crumbs={crumbs} />
      {submenu}
      {children}
      {next && <PageSelanjutnya to={next.to} judul={next.judul} />}
    </>
  );
}

/** Blok artikel — markup identik Sekilas / Visi Misi. */
export function PageArtikel({ title, lead, children, lebar = false }) {
  return (
<section
        className={`w-full relative bg-transparent pb-12 md:pb-12 xl:pb-16 pt-12 md:pt-12 xl:pt-24 ${
          lebar ? "px-6 md:px-10 xl:px-16" : "pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40"
        }`}
      >
        <div
          className={`relative w-full mx-auto flex flex-col gap-y-6 md:gap-y-8 lg:gap-y-10 ${
            lebar ? "max-w-[1400px]" : "md:max-w-[1024px]"
          }`}
        >
        {title && (
          <h2 className="focus:outline-none focus:ring-0 font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
            {title}
          </h2>
        )}
        {lead && (
          <div className="w-full">
            <div className="text-primary text-base md:text-base">{lead}</div>
          </div>
        )}
        <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
          <div className="relative z-[1] prose-kci max-w-none">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Masthead halaman artikel — judul + subjudul, garis 1px (mengikuti
 *  tipografi & token DESIGN.md). Tanpa label kecil di atas judul: kicker
 *  lama selalu mengulang judul Hero di atasnya (redundan). */
export function MastheadEditorial({ judul, subjudul }) {
  return (
    <section className="font-serif relative w-full bg-transparent pt-12 md:pt-12 xl:pt-24">
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-2 md:px-8 md:py-3 xl:px-0">
        <div className="relative mb-6 border-b border-grey-200 pb-3 text-center">
          <h2 className="mb-2 font-serif text-3xl md:text-4xl leading-tight font-semibold text-grey-800">
            {judul}
          </h2>
          <p className="m-0 text-sm text-grey-600 italic">{subjudul}</p>
        </div>
      </div>
    </section>
  );
}

/** Gambar + keterangan — sama seperti blok foto di Sekilas. */
export function PageGambar({ src, alt, caption }) {
  return (
    <div className="w-full relative pl-6 md:pl-8 xl:pl-20 pr-6 md:pr-8 xl:pr-20 pb-16">
      <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] border-guide flex justify-center items-center">
        <div className="flex flex-col justify-center items-center">
          <img
            src={src}
            alt={alt}
            width={1280}
            height={714}
            className="w-full h-auto object-cover"
            draggable="false"
            decoding="async"
            loading="lazy"
          />
          {caption && (
            <p className="text-[13px] font-normal text-slate-500 mt-2">{caption}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Bagian konten standar. `lebar` hanya untuk tabel, diagram, atau media yang
 * membutuhkan lebar container; teks bacaan tetap memakai measure prose. */
export function BagianKonten({ id, title, lead, lebar = false, children }) {
  return (
    <section
      id={id}
      className="w-full px-6 py-16 md:px-8 md:py-20"
    >
      <div className={`mx-auto w-full ${lebar ? "max-w-7xl" : "kontainer-konten"}`}>
        <div className={lebar ? "w-full" : "measure-konten"}>
          {title && (
            <h2 className="font-serif text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
              {title}
            </h2>
          )}
          {lead && (
            <p className="teks-lead-kci mt-3">
              {lead}
            </p>
          )}
        </div>
        <div className={title || lead ? "mt-8" : ""}>{children}</div>
      </div>
    </section>
  );
}

/** Lead artikel. Gunakan satu kali setelah judul/masthead. */
export function TeksPembuka({ children }) {
  return (
    <p className="teks-lead-kci measure-konten mb-8">
      {children}
    </p>
  );
}

/** Media informatif dengan dimensi, mode crop, dan caption yang konsisten. */
export function GambarKonten({
  src,
  alt,
  width,
  height,
  caption,
  mode = "contain",
  prioritas = false,
  className = "",
}) {
  if (!src || !alt || !width || !height) return null;

  return (
    <figure className={`media-konten ${className}`.trim()}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={prioritas ? "eager" : "lazy"}
        fetchPriority={prioritas ? "high" : "auto"}
        decoding="async"
        className={`media-konten__gambar ${mode === "cover" ? "object-cover" : "object-contain"}`}
      />
      {caption && <figcaption className="media-konten__caption">{caption}</figcaption>}
    </figure>
  );
}

/** Kutipan yang benar-benar berasal dari sumber; bukan heading dekoratif. */
export function KutipanKonten({ children, sumber }) {
  return (
    <figure className="kutipan-konten">
      <blockquote>{children}</blockquote>
      {sumber && <figcaption>{sumber}</figcaption>}
    </figure>
  );
}

/** Catatan pendukung non-darurat. Untuk error/warning interaktif gunakan
 * komponen alert bersama yang mempunyai semantik status. */
export function CatatanKonten({ title, children }) {
  return (
    <aside className="catatan-konten" aria-label={title || "Catatan"}>
      {title && <h3>{title}</h3>}
      <div>{children}</div>
    </aside>
  );
}

/** Navigasi "Selanjutnya" — identik blok Pertamina. */
export function PageSelanjutnya({ to, judul }) {
  const { t } = useI18n();
  if (!to || !judul) return null;
  return (
    <section className="w-full relative bg-transparent pl-6 md:pl-0 xl:pl-40 pr-6 md:pr-0 xl:pr-40 pb-24 md:pb-24 xl:pb-24 pt-6 md:pt-8 xl:pt-12">
      <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px]">
        <div className="w-full border-t my-1 md:my-1 border-grey-200" />
        <nav>
          <Link
            to={to}
            className="flex items-center justify-between gap-4 group"
          >
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm text-grey-600">
                {t("common.selanjutnya")}
              </span>
              <span className="text-sm sm:text-base font-semibold text-grey-800 group-hover:text-primary">
                {judul}
              </span>
            </div>
            <div className="flex-none flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full group-hover:bg-primary">
              <ArrowRightIcon className="text-primary group-hover:text-white" />
            </div>
          </Link>
        </nav>
      </div>
    </section>
  );
}
