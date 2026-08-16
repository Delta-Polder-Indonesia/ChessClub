import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, ChevronDownIcon, MenuIcon } from "./icons.jsx";
import Hero from "./Hero.jsx";
import { useI18n } from "../lib/i18n.jsx";

/**
 * Kerangka halaman informasi korporat.
 *
 * Pola ini mengikuti halaman informasi Pertamina: hero besar dengan breadcrumb,
 * sidebar desktop yang menempel, menu ringkas untuk mobile, konten utama,
 * kartu dokumen, dan navigasi halaman berikutnya.
 */
export function CorporatePage({
  title,
  description,
  image = "/images/hero-about.jpg",
  sidebar = [],
  next,
  children,
}) {
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${title} | ${t("common.namaKomunitas")}`;
  }, [title, t]);

  const crumbs = [
    { label: t("common.home"), to: "/" },
    { label: title },
  ];

  return (
    <>
      <Hero
        title={title}
        description={null}
        crumbs={crumbs}
        image={image}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12 xl:gap-24 max-w-[1080px] xl:max-w-[1280px] relative w-full mx-auto pt-0 pb-12 lg:pt-20 lg:pb-20 px-6 md:px-8 xl:px-0">
        <CorporateSidebar title={title} items={sidebar} />
        <div className="relative w-full min-w-0">{children}</div>
      </div>
      {next && <CorporateNext to={next.to} title={next.title} />}
    </>
  );
}

export function CorporateSidebar({ title, items }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(items.find((item) => item.active)?.id || items[0]?.id);
  const current = items.find((item) => item.id === active) || items[0];

  useEffect(() => {
    const onHashChange = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id && items.some((item) => item.id === id)) setActive(id);
    };
    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [items]);

  useEffect(() => {
    const ids = items.map((item) => item.id).filter(Boolean);
    if (!ids.length) return undefined;
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el) => el !== null);
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  const pilih = (id) => {
    setActive(id);
    setOpen(false);
  };

  return (
    <>
      <aside className="hidden lg:block sticky top-[88px] h-[calc(100vh-96px)] overflow-y-auto transition-all duration-300 ease-in-out w-[220px] min-w-[220px]">
        <ul className="relative flex gap-y-3 flex-col text-sm after:block after:bg-slate-200 after:absolute after:h-full after:w-px after:left-0 after:z-[-1]" aria-label={`${title} navigation`}>
          {items.map((item) => (
            <li className="relative flex" key={item.id}>
              <SidebarItem item={item} aktif={item.id === active} onPilih={pilih} desktop />
            </li>
          ))}
        </ul>
      </aside>

      <div className="lg:hidden relative w-full">
        <div className="sticky top-0 bg-white z-20 border-b mb-6 transition-all duration-300 ease-in-out">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="w-full flex items-center justify-between py-3 text-sm bg-white"
          >
            <span className="font-medium text-[#0B2F9F] border-l-[#0B2F9F] border-l-4 pl-4 py-1">
              {current?.label || title}
            </span>
            <MenuIcon className="w-5 h-5 text-slate-600" />
          </button>
          {open && (
            <ul className="mt-2 py-4 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto relative flex gap-y-3 flex-col text-sm after:block after:bg-slate-200 after:absolute after:h-full after:w-px after:left-0 after:z-[-1]">
              {items.map((item) => (
                <li className="relative flex" key={item.id}>
                  <SidebarItem item={item} aktif={item.id === active} onPilih={pilih} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Satu item sidebar.
 *
 * - href diawali "/" → rute internal (mis. "/pengadaan/daftar-juara"):
 *   memakai <Link> React Router agar berpindah halaman TANPA refresh
 *   (SPA). Basename router (mis. "/ChessClub/") ditangani otomatis.
 * - selain itu (jangkar "#id" dalam halaman, atau URL penuh) → <a>
 *   biasa, sehingga scroll ke bagian/halaman yang dituju tetap jalan.
 */
function SidebarItem({ item, aktif, onPilih, desktop = false }) {
  const target = item.href || `#${item.id}`;
  const internal = /^\//.test(target);
  const kelasDesktop =
    "flex w-full py-2 pr-1 transition-all duration-300 ease-in-out hover:after:w-1 hover:after:h-full hover:after:bg-slate-600 hover:after:absolute hover:after:left-[-1px] hover:after:top-0 hover:after:z-1 pl-4";
  const kelasMobile =
    "flex w-full py-2 pr-1 pl-4 transition-all duration-300 ease-in-out";
  const kelasAktif = aktif
    ? "text-[#0B2F9F] after:w-1 after:h-full after:bg-[#0B2F9F] after:absolute after:left-[-1px] after:top-0 after:z-1 font-bold"
    : "text-slate-500 hover:text-slate-600";
  const className = `${desktop ? kelasDesktop : kelasMobile} ${kelasAktif}`;

  if (internal) {
    return (
      <Link to={target} onClick={() => onPilih(item.id)} className={className}>
        {item.label}
      </Link>
    );
  }
  return (
    <a href={target} onClick={() => onPilih(item.id)} className={className}>
      {item.label}
    </a>
  );
}

export function CorporateSection({ id, title, children, className = "", titleClassName = "" }) {
  return (
    <section
      id={id}
      className={`w-full relative bg-transparent pl-0 md:pl-2 pr-0 md:pr-2 xl:pr-20 pb-8 md:pb-8 xl:pb-8 pt-0 md:pt-8 xl:pt-0 ${className}`}
    >
      <div className="relative w-full mx-auto grid grid-cols-[1fr] grid-rows-[1fr] gap-y-6 md:gap-y-6 lg:gap-y-6 lg:max-w-[960px] xl:max-w-[1280px]">
        {title && (
          <h2 className={`focus:outline-none focus:ring-0 text-black font-semibold text-2xl md:text-3xl ${titleClassName}`}>
            {title}
          </h2>
        )}
        <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
          <div className="relative z-[1] prose-kci max-w-none">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function CorporateDivider({ className = "" }) {
  return <div className={`w-full border-t my-4 md:my-6 border-grey-200 ${className}`} />;
}

function PdfIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-none" aria-hidden="true">
      <path d="M8 0C6.9 0 6 0.9 6 2V30C6 31.1 6.9 32 8 32H28C29.1 32 30 31.1 30 30V8L22 0H8Z" fill="#E2E5E7" />
      <path d="M24 8H30L22 0V6C22 7.1 22.9 8 24 8Z" fill="#B0B7BD" />
      <path d="M30 14L24 8H30V14Z" fill="#CAD1D8" />
      <path d="M26 26C26 26.55 25.55 27 25 27H3C2.45 27 2 26.55 2 26V16C2 15.45 2.45 15 3 15H25C25.55 15 26 15.45 26 16V26Z" fill="#F15642" />
      <path d="M6.36 18.95C6.36 18.68 6.57 18.4 6.9 18.4H8.75C9.79 18.4 10.73 19.09 10.73 20.43C10.73 21.69 9.79 22.39 8.75 22.39H7.41V23.45C7.41 23.8 7.19 24 6.9 24C6.64 24 6.36 23.8 6.36 23.45V18.95ZM7.41 19.4V21.39H8.75C9.29 21.39 9.71 20.92 9.71 20.43C9.71 19.87 9.29 19.4 8.75 19.4H7.41Z" fill="white" />
      <path d="M12.29 24C12.03 24 11.74 23.86 11.74 23.5V18.96C11.74 18.68 12.03 18.47 12.29 18.47H14.12C17.78 18.47 17.7 24 14.2 24H12.29ZM12.8 19.44V23.03H14.12C16.28 23.03 16.38 19.44 14.12 19.44H12.8Z" fill="white" />
      <path d="M18.99 19.51V20.78H21.03C21.32 20.78 21.61 21.07 21.61 21.35C21.61 21.61 21.32 21.83 21.03 21.83H18.99V23.5C18.99 23.78 18.79 24 18.51 24C18.16 24 17.95 23.78 17.95 23.5V18.96C17.95 18.68 18.16 18.47 18.51 18.47H21.32C21.67 18.47 21.88 18.68 21.88 18.96C21.88 19.22 21.67 19.51 21.32 19.51H18.99Z" fill="white" />
      <path d="M25 27H6V28H25C25.55 28 26 27.55 26 27V26C26 26.55 25.55 27 25 27Z" fill="#CAD1D8" />
    </svg>
  );
}

export function DocumentCard({ title, href = "#", description = "Unduh dokumen" }) {
  return (
    <div className="flex gap-4 p-4 border border-[#E2E8F0] rounded-lg bg-white" role="region" aria-label={`Bagian unduh ${title}`}>
      <div className="flex-shrink-0"><PdfIcon /></div>
      <div className="flex flex-col flex-grow gap-2 min-w-0">
        <h3 className="text-sm text-slate-900 break-words">{title}</h3>
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
          className="text-[#E21F23] hover:text-blue-800 flex items-center gap-2 text-sm font-semibold"
        >
          <span>{description}</span>
          <ArrowRightIcon className="size-4" />
        </a>
      </div>
    </div>
  );
}

export function DocumentGrid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>;
}

export function CorporateTable({ rows }) {
  return (
    <div className="w-full overflow-x-auto justify-start items-center flex">
      <table className="table-fixed min-w-full text-sm md:text-base">
        <tbody>
          {rows.map(([label, value], index) => (
            <tr key={label} className={`py-4 px-4 lg:px-0 grid grid-cols-4 bg-white border-0 border-b border-solid border-slate-200 ${index === rows.length - 1 ? "border-b-0" : ""}`}>
              <td className="flex items-start font-bold w-full col-span-1 self-stretch flex-shrink-0 text-slate-900">{label}</td>
              <td className="flex items-start col-span-3 w-full self-stretch flex-shrink-0 text-slate-700">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CorporateNext({ to, title }) {
  const { t } = useI18n();
  return (
    <section className="w-full relative bg-transparent pl-6 md:pl-0 xl:pl-40 pr-6 md:pr-0 xl:pr-40 pb-24 md:pb-24 xl:pb-24 pt-6 md:pt-8 xl:pt-12">
      <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px]">
        <div className="w-full border-t my-1 md:my-1 border-grey-200" />
        <nav aria-label={t("common.selanjutnya")}>
          <Link to={to} className="flex items-center justify-between gap-4 group transition-colors">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm text-gray-600">{t("common.selanjutnya")}</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{title}</span>
            </div>
            <div className="flex-none flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full group-hover:bg-primary transition-colors">
              <ArrowRightIcon className="size-4 sm:size-5 text-primary group-hover:text-white" />
            </div>
          </Link>
        </nav>
      </div>
    </section>
  );
}
