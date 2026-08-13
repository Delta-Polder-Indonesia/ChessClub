import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo.jsx";
import {
  SearchIcon,
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  FlagIDIcon,
} from "./icons.jsx";
import {
  MENU_UTAMA,
  MENU_ATAS,
  menuAktif,
  semuaHalaman,
} from "../menu.js";

const SEARCH_PAGES = semuaHalaman();

function NavItemDesktop({ item, onNavigate, scrolled, pathname }) {
  const aktif = menuAktif(item.path, pathname);
  return (
    <li className="relative group h-10 flex items-center">
      <Link
        to={item.path}
        title={item.title}
        onClick={onNavigate}
        className={`flex items-center gap-1 transition-colors duration-200 ${
          scrolled
            ? aktif
              ? "text-primary"
              : "text-slate-800 hover:text-primary"
            : "text-white hover:text-blue-400"
        }`}
      >
        {item.title}
        {item.children && <ChevronDownIcon className="size-4 opacity-80" />}
      </Link>
      {item.children && (
        <ul className="opacity-0 pointer-events-none absolute w-[288px] top-10 rounded-lg flex flex-col group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 ease-in-out left-0 py-4 bg-white shadow-xl">
          {item.children.map((child) => (
            <li
              key={child.title}
              className="relative group/item transition-all duration-200 ease-in-out text-[#64748B] hover:text-[#1E293B]"
            >
              <div className="px-6 py-2 w-full border-0 border-l-4 border-solid border-white hover:border-primary transition-all duration-200 ease-in-out flex items-center justify-between">
                <Link
                  to={child.path}
                  title={child.title}
                  onClick={onNavigate}
                  className="flex-1 w-full text-inherit hover:text-inherit font-normal text-sm"
                >
                  {child.title}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function MobileDrawer({ open, onClose, onNavigate }) {
  const [expanded, setExpanded] = useState(null);
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-white overflow-y-auto">
      <div className="w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200">
        <Logo variant="dark" />
        <button
          type="button"
          aria-label="close"
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
                  title={item.title}
                  onClick={() => {
                    onNavigate();
                    onClose();
                  }}
                  className="flex-1"
                >
                  {item.title}
                </Link>
                {item.children && (
                  <button
                    type="button"
                    aria-label={`expand ${item.title}`}
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
                      <Link
                        to={child.path}
                        title={child.title}
                        onClick={() => {
                          onNavigate();
                          onClose();
                        }}
                        className="block pl-4 py-2 text-sm font-normal text-[#64748B] hover:text-primary border-l-4 border-solid border-white hover:border-primary transition-all duration-200"
                      >
                        {child.title}
                      </Link>
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
              <Link to={l.path} title={l.title} onClick={onClose}>
                {l.title}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/keanggotaan/pendaftaran-anggota"
          title="Daftar Anggota"
          onClick={onClose}
          className="btn-registrasi text-center text-xs rounded-full px-4 py-2 border border-solid border-primary text-primary"
        >
          Daftar Anggota
        </Link>
      </div>
    </div>
  );
}

function SearchOverlay({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState("");
  if (!open) return null;
  const results = query.trim()
    ? SEARCH_PAGES.filter((p) =>
        p.title.toLowerCase().includes(query.trim().toLowerCase())
      )
    : [];
  return (
    <div className="fixed inset-0 z-[70] bg-white overflow-y-auto">
      <div className="w-full mx-auto max-w-[1080px] xl:max-w-7xl px-6 lg:px-8 xl:px-0 py-5 flex items-center justify-between">
        <Logo variant="dark" />
        <button
          type="button"
          aria-label="close search"
          onClick={onClose}
          className="cursor-pointer rounded-full flex items-center justify-center border-0 bg-transparent p-2 text-slate-800"
        >
          <CloseIcon className="size-6" />
        </button>
      </div>
      <div className="w-full max-w-3xl mx-auto px-6 mt-16 md:mt-24">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex items-center gap-4 border-b-2 border-solid border-primary pb-4"
        >
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik kata kunci pencarian"
            aria-label="Pencarian"
            className="flex-1 bg-transparent border-0 outline-none text-2xl md:text-3xl text-slate-900 placeholder:text-slate-300"
          />
          <button
            type="submit"
            aria-label="search button"
            className="flex-none border-2 border-solid border-primary rounded-full size-12 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-200"
          >
            <ArrowRightIcon />
          </button>
        </form>
        <p className="text-sm text-slate-400 mt-3">Tekan Enter untuk mencari</p>
        {query.trim() && (
          <ul className="mt-8 flex flex-col gap-3">
            {results.length > 0 ? (
              results.map((r) => (
                <li key={r.title}>
                  <Link
                    to={r.path}
                    onClick={() => {
                      onNavigate();
                      onClose();
                    }}
                    className="block border-l-4 border-solid border-white hover:border-primary transition-all duration-200 px-4 py-2 text-slate-700 hover:text-primary"
                  >
                    {r.title}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-slate-500">
                Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Header() {
  const { pathname } = useLocation();
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
            <Logo variant={scrolled ? "dark" : "light"} />
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
                        title={l.title}
                        className="text-sm hover:text-blue-400 transition-colors duration-200"
                      >
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="hidden lg:block">
                <button
                  type="button"
                  className="bg-transparent border-0 flex items-center gap-2 text-xs text-white cursor-pointer"
                >
                  <span>ID</span>
                  <FlagIDIcon />
                </button>
              </li>
              <li>
                <Link
                  to="/keanggotaan/pendaftaran-anggota"
                  title="Daftar Anggota"
                  className="btn-registrasi text-xs rounded-full px-4 py-2 border border-solid border-slate-200 hover:border-primary hover:bg-primary transition-all duration-100 ease-in-out hover:text-white text-white"
                >
                  Daftar Anggota
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
                aria-label="search"
                onClick={() => setSearchOpen(true)}
                className={`cursor-pointer rounded-full flex items-center justify-center border-0 bg-transparent p-2 transition-colors duration-200 ${
                  scrolled ? "text-slate-800" : "text-white"
                }`}
              >
                <SearchIcon className="size-6" />
              </button>
              <button
                type="button"
                aria-label="menu"
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
