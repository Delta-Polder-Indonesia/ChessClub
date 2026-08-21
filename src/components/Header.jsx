import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo.jsx";
import {
  SearchIcon,
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  FlagIDIcon,
  FlagENIcon,
} from "./icons.jsx";
import {
  MENU_UTAMA,
  MENU_ATAS,
  menuAktif,
  semuaHalaman,
} from "../menu.js";
import { useI18n } from "../lib/i18n.jsx";

const SEARCH_PAGES = semuaHalaman();

function NavItemDesktop({ item, onNavigate, scrolled, pathname }) {
  const { t } = useI18n();
  const aktif = menuAktif(item.path, pathname);
  const judul = t(item.title);
  const [subBuka, setSubBuka] = useState({});
  const toggleSub = (key) =>
    setSubBuka((s) => ({ ...s, [key]: !s[key] }));
  return (
    <li className="relative group h-10 flex items-center">
      <Link
        to={item.path}
        title={judul}
        onClick={onNavigate}
        className={`flex items-center gap-1 transition-colors duration-200 ${
          scrolled
            ? aktif
              ? "text-primary"
              : "text-slate-800 hover:text-primary"
            : "text-white hover:text-blue-400"
        }`}
      >
        {judul}
        {item.children && <ChevronDownIcon className="size-4 opacity-80" />}
      </Link>
      {item.children && (
        <ul className="opacity-0 pointer-events-none absolute w-[288px] top-10 rounded-lg flex flex-col group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200 ease-in-out left-0 py-4 bg-white shadow-xl">
          {item.children.map((child) => (
            <li
              key={child.title}
              className="relative group/item transition-all duration-200 ease-in-out text-[#64748B] hover:text-[#1E293B]"
            >
              <div className="px-6 py-2 w-full border-0 border-l-4 border-solid border-white hover:border-primary transition-all duration-200 ease-in-out flex items-center justify-between gap-2">
                <Link
                  to={child.path}
                  title={t(child.title)}
                  onClick={onNavigate}
                  className="flex-1 w-full text-inherit hover:text-inherit font-normal text-sm"
                >
                  {t(child.title)}
                </Link>
                {child.children && (
                  <button
                    type="button"
                    aria-expanded={!!subBuka[child.title]}
                    aria-label={t("header.expand", { title: t(child.title) })}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSub(child.title);
                    }}
                    className={`cursor-pointer bg-transparent border-0 p-1 text-slate-400 transition-transform duration-200 ${
                      subBuka[child.title] ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDownIcon className="size-4 opacity-70" />
                  </button>
                )}
              </div>
              {child.children && subBuka[child.title] && (
                <ul className="pb-1">
                  {child.children.map((subchild) => (
                    <li
                      key={subchild.title}
                      className="text-[#64748B] hover:text-[#1E293B]"
                    >
                      <Link
                        to={subchild.path}
                        title={t(subchild.title)}
                        onClick={onNavigate}
                        className="block pl-10 py-2 border-0 border-l-4 border-solid border-white hover:border-primary text-inherit hover:text-inherit font-normal text-sm transition-all duration-200"
                      >
                        {t(subchild.title)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function MobileDrawer({ open, onClose, onNavigate }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(null);
  const [expandedChild, setExpandedChild] = useState(null);

  // Escape menutup drawer; gulir halaman dikunci selama drawer terbuka.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const sebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = sebelumnya;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-white overflow-y-auto">
      <div className="w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200">
        <Logo variant="dark" />
        <button
          type="button"
          aria-label={t("header.close")}
          onClick={onClose}
          className="cursor-pointer rounded-full flex items-center justify-center border-0 bg-transparent p-2 text-slate-800"
        >
          <CloseIcon className="size-6" />
        </button>
      </div>
      <div className="px-6 py-6 flex flex-col gap-6">
        <ul className="flex flex-col gap-1 font-semibold text-slate-900">
          {MENU_UTAMA.map((item) => (
            <li key={item.title} className="border-b border-slate-100">
              <div className="flex items-center justify-between py-4">
                <Link
                  to={item.path}
                  title={t(item.title)}
                  onClick={() => {
                    onNavigate();
                    onClose();
                  }}
                  className="flex-1"
                >
                  {t(item.title)}
                </Link>
                {item.children && (
                  <button
                    type="button"
                    aria-label={t("header.expand", { title: t(item.title) })}
                    onClick={() =>
                      setExpanded(expanded === item.title ? null : item.title)
                    }
                    className={`cursor-pointer p-2 text-slate-500 transition-transform duration-200 ${
                      expanded === item.title ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDownIcon />
                  </button>
                )}
              </div>
              {item.children && expanded === item.title && (
                <ul className="flex flex-col pb-4">
                  {item.children.map((child) => (
                    <li key={child.title}>
                      <div className="flex items-center border-l-4 border-solid border-white hover:border-primary transition-all duration-200">
                        <Link
                          to={child.path}
                          title={t(child.title)}
                          onClick={() => {
                            onNavigate();
                            onClose();
                          }}
                          className="flex-1 pl-4 py-2 text-sm font-normal text-[#64748B] hover:text-primary"
                        >
                          {t(child.title)}
                        </Link>
                        {child.children && (
                          <button
                            type="button"
                            aria-label={t("header.expand", { title: t(child.title) })}
                            onClick={() =>
                              setExpandedChild(
                                expandedChild === child.title ? null : child.title
                              )
                            }
                            className={`cursor-pointer p-2 text-slate-500 transition-transform duration-200 ${
                              expandedChild === child.title ? "rotate-180" : ""
                            }`}
                          >
                            <ChevronDownIcon className="size-4" />
                          </button>
                        )}
                      </div>
                      {child.children && expandedChild === child.title && (
                        <ul className="ml-4 mb-2">
                          {child.children.map((subchild) => (
                            <li key={subchild.title}>
                              <Link
                                to={subchild.path}
                                title={t(subchild.title)}
                                onClick={() => {
                                  onNavigate();
                                  onClose();
                                }}
                                className="block pl-4 py-2 text-sm font-normal text-[#64748B] hover:text-primary border-l-4 border-solid border-slate-100 hover:border-primary transition-all duration-200"
                              >
                                {t(subchild.title)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-4 text-sm text-slate-700">
          {MENU_ATAS.map((l) => (
            <li key={l.title}>
              <Link to={l.path} title={t(l.title)} onClick={onClose}>
                {t(l.title)}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/pendaftaran-anggota"
          title={t("common.daftarAnggota")}
          onClick={onClose}
          className="btn-registrasi text-center text-xs rounded-full px-4 py-2 border border-solid border-primary text-primary"
        >
          {t("common.daftarAnggota")}
        </Link>
      </div>
    </div>
  );
}

function SearchOverlay({ open, onClose, onNavigate }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const halaman = useMemo(
    () => SEARCH_PAGES.map((r) => ({ path: r.path, label: t(r.title) })),
    [t]
  );

  // Escape menutup overlay; gulir halaman dikunci selama terbuka.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const sebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = sebelumnya;
    };
  }, [open, onClose]);

  if (!open) return null;
  const q = query.trim().toLowerCase();
  const results = q
    ? halaman.filter((p) => p.label.toLowerCase().includes(q))
    : [];
  const bukaHasil = (r) => {
    onNavigate();
    onClose();
    navigate(r.path);
  };
  return (
    <div className="fixed inset-0 z-[70] bg-white overflow-y-auto">
      <div className="w-full mx-auto max-w-[1080px] xl:max-w-7xl px-6 lg:px-8 xl:px-0 py-5 flex items-center justify-between">
        <Logo variant="dark" />
        <button
          type="button"
          aria-label={t("header.closeSearch")}
          onClick={onClose}
          className="cursor-pointer rounded-full flex items-center justify-center border-0 bg-transparent p-2 text-slate-800"
        >
          <CloseIcon className="size-6" />
        </button>
      </div>
      <div className="w-full max-w-3xl mx-auto px-6 mt-16 md:mt-24">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // "Tekan Enter untuk mencari" — Enter membuka hasil pertama.
            const r = results[0];
            if (r) bukaHasil(r);
          }}
          className="flex items-center gap-4 border-b-2 border-solid border-primary pb-4"
        >
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("header.search")}
            className="flex-1 bg-transparent border-0 outline-none text-2xl md:text-3xl text-slate-900 placeholder:text-slate-300"
          />
          <button
            type="submit"
            aria-label={t("header.searchButton")}
            className="flex-none border-2 border-solid border-primary rounded-full size-12 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-200"
          >
            <ArrowRightIcon />
          </button>
        </form>
        <p className="text-sm text-slate-400 mt-3">{t("search.enter")}</p>
        {query.trim() && (
          <ul className="mt-8 flex flex-col gap-3">
            {results.length > 0 ? (
              results.map((r) => (
                <li key={r.path}>
                  <Link
                    to={r.path}
                    onClick={() => bukaHasil(r)}
                    className="block border-l-4 border-solid border-white hover:border-primary transition-all duration-200 px-4 py-2 text-slate-700 hover:text-primary"
                  >
                    {r.label}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-slate-500">
                {t("search.noResults", { query })}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function TombolBahasa() {
  const { bahasa, setBahasa, t } = useI18n();
  const Bendera = bahasa === "en" ? FlagENIcon : FlagIDIcon;
  return (
    <li className="hidden lg:block">
      <button
        type="button"
        title={t("common.pilihBahasa")}
        aria-label={t("common.pilihBahasa")}
        onClick={() => setBahasa(bahasa === "en" ? "id" : "en")}
        className="bg-transparent border-0 flex items-center gap-2 text-xs text-white cursor-pointer"
      >
        <span>{bahasa.toUpperCase()}</span>
        <Bendera />
      </button>
    </li>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavigate = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-white border-b border-slate-200"
            : "bg-transparent"
        }`}
      >
        <div
          className={`header-wrapper w-full mx-auto max-w-[1080px] xl:max-w-7xl px-6 lg:px-8 xl:px-0 flex items-center justify-between transition-all duration-200 ${
            scrolled ? "py-3" : "py-6"
          }`}
        >
          <Link
            to="/"
            title="Logo Komunitas Catur Indonesia"
            aria-label="Logo Komunitas Catur Indonesia"
            className="flex-none flex items-center gap-4 md:gap-6"
          >
            <Logo variant={scrolled ? "dark" : "light"} priority />
          </Link>
          <div className="flex flex-col lg:items-end">
            {/* Top bar — tersembunyi saat header menempel (seperti Pertamina) */}
            <ul
              className={`top-bar ${
                scrolled ? "hidden" : "hidden lg:flex"
              } flex-col lg:flex-row items-center justify-start lg:justify-end gap-x-6 gap-y-4 mb-4 lg:mb-2 lg:mt-0`}
            >
              <li className="relative">
                <ul className="flex items-center gap-x-6 gap-y-4 text-white">
                  {MENU_ATAS.map((l) => (
                    <li key={l.title} className="py-2">
                      <Link
                        to={l.path}
                        title={t(l.title)}
                        className="text-sm hover:text-blue-400 transition-colors duration-200"
                      >
                        {t(l.title)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <TombolBahasa />
              <li>
                <Link
                  to="/pendaftaran-anggota"
                  title={t("common.daftarAnggota")}
                  className="btn-registrasi text-xs rounded-full px-4 py-2 border border-solid border-slate-200 hover:border-primary hover:bg-primary transition-all duration-100 ease-in-out hover:text-white text-white"
                >
                  {t("common.daftarAnggota")}
                </Link>
              </li>
            </ul>

            <div className="flex items-center gap-2">
              {/* Nav utama */}
              <nav className="relative bg-transparent min-h-[48px] hidden lg:block">
                <ul className="flex flex-col md:flex-row items-start md:items-center gap-6 font-semibold">
                  {MENU_UTAMA.map((item) => (
                    <NavItemDesktop
                      key={item.title}
                      item={item}
                      onNavigate={handleNavigate}
                      scrolled={scrolled}
                      pathname={pathname}
                    />
                  ))}
                </ul>
              </nav>
              <button
                type="button"
                aria-label={t("header.search")}
                onClick={() => setSearchOpen(true)}
                className={`cursor-pointer rounded-full flex items-center justify-center border-0 bg-transparent p-2 transition-colors duration-200 ${
                  scrolled ? "text-slate-800" : "text-white"
                }`}
              >
                <SearchIcon className="size-6" />
              </button>
              <button
                type="button"
                aria-label={t("header.menu")}
                onClick={() => setMenuOpen(true)}
                className={`lg:hidden cursor-pointer rounded-full flex items-center justify-center border-0 bg-transparent p-2 transition-colors duration-200 ${
                  scrolled ? "text-slate-800" : "text-white"
                }`}
              >
                <MenuIcon className="size-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
      />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
      />
    </>
  );
}
