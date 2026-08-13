import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import {
  ChevronDownIcon,
  FacebookIcon,
  XIcon,
  InstagramIcon,
  YoutubeIcon,
  LinkedinIcon,
} from "./icons.jsx";

const FOOTER_COLUMNS = [
  {
    id: "pengumuman",
    title: "Pengumuman",
    links: [
      { title: "Berita Komunitas", href: "/media-dan-informasi/berita-komunitas" },
      { title: "Pendaftaran Turnamen", href: "/turnamen/turnamen-bulanan" },
      { title: "Pengumuman", href: "/media-dan-informasi/pengumuman" },
      { title: "Jadwal Liga", href: "/turnamen/liga-musiman" },
      { title: "Musyawarah Anggota", href: "/keanggotaan" },
      { title: "Volunteer", href: "/hubungi-kami" },
    ],
  },
  {
    id: "network",
    title: "Network",
    links: [
      { title: "Chapter Sumatera Utara", href: "#" },
      { title: "Chapter DKI Jakarta", href: "#" },
      { title: "Chapter Jawa Barat", href: "#" },
      { title: "Chapter Jawa Timur", href: "#" },
      { title: "Chapter Sulawesi Selatan", href: "#" },
      { title: "Akademi Catur", href: "/program-kami/sekolah-catur" },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    links: [
      { title: "Papan Interaktif", href: "/program-kami" },
      { title: "Pendaftaran Anggota", href: "/keanggotaan/pendaftaran-anggota" },
      { title: "Kode Etik Komunitas", href: "/keanggotaan/kode-etik-komunitas" },
      { title: "Keterbukaan Informasi", href: "/media-dan-informasi" },
      { title: "Kontak Kami", href: "/hubungi-kami" },
      { title: "Sistem Pengaduan", href: "/hubungi-kami" },
    ],
  },
];

const SOCIALS = [
  { title: "Facebook", href: "#", Icon: FacebookIcon },
  { title: "X", href: "#", Icon: XIcon },
  { title: "Instagram", href: "#", Icon: InstagramIcon },
  { title: "YouTube", href: "#", Icon: YoutubeIcon },
  { title: "LinkedIn", href: "#", Icon: LinkedinIcon },
];

export default function Footer() {
  const [openSection, setOpenSection] = useState(null);

  return (
    <footer className="relative bg-[#F8FAFC] text-black px-6 md:px-10 xl:px-20 pt-16 md:pt-24 pb-10 md:pb-20">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 items-start justify-between flex-wrap gap-6 md:gap-14 xl:gap-x-24">
        {/* Logo + alamat */}
        <div className="flex flex-col items-center gap-4 text-grey-800 mb-0">
          <Link
            to="/"
            title="Logo Komunitas Catur Indonesia"
            className="mb-6"
          >
            <Logo variant="dark" />
          </Link>
          <div className="text-center">
            <p className="font-normal text-xs md:text-sm leading-relaxed xl:leading-loose">
              <strong className="font-semibold">Address:</strong> Sekretariat
              Komunitas Catur Indonesia, Jl. Gatot Subroto No. 11-13, Medan
              20152, Sumatera Utara, Indonesia
            </p>
            <p className="font-normal text-xs md:text-sm leading-relaxed xl:leading-loose">
              <strong className="font-semibold">Email:</strong>{" "}
              <a
                href="mailto:info@komunitascatur.or.id"
                title="Email"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:underline"
              >
                info@komunitascatur.or.id
              </a>
            </p>
          </div>
        </div>

        {/* Kolom tautan */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-6 flex-1">
          {FOOTER_COLUMNS.map((col) => (
            <div
              key={col.id}
              className="flex-1 w-full border-t md:border-0 border-solid border-slate-200 py-3 md:py-0"
            >
              <ul
                id={col.id}
                className="w-full max-w-[232px] md:w-auto flex flex-col gap-2"
              >
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSection(openSection === col.id ? null : col.id)
                    }
                    className="w-full text-grey-800 text-sm leading-relaxed font-bold tracking-wider flex items-center justify-between mb-2 cursor-pointer"
                  >
                    {col.title}
                    <span className="md:hidden text-grey-800">
                      <ChevronDownIcon
                        className={`transition-transform duration-200 ${
                          openSection === col.id ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>
                </li>
                <div
                  className={`flex flex-col gap-2 md:flex ${
                    openSection === col.id ? "flex" : "hidden"
                  }`}
                >
                  {col.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        className="text-grey-800 text-xs 2xl:text-sm hover:text-grey-800/80 hover:underline font-normal"
                        title={link.title}
                        aria-label={link.title}
                      >
                        {link.title}
                      </a>
                    </li>
                  ))}
                </div>
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Baris bawah */}
      <div className="w-full max-w-7xl mx-auto pt-6 md:pt-10">
        <div className="w-full h-[1px] bg-grey-200" />
        <div className="w-full flex flex-col-reverse xl:flex-row items-center justify-between gap-4 mt-6 md:mt-9">
          <div className="text-xs text-center leading-relaxed text-grey-800 flex gap-4 items-center justify-center xl:justify-start flex-wrap">
            © Copyright Komunitas Catur Indonesia 2025. All Right Reserved.
            <span className="hidden md:inline-block">/</span>
            <a
              href="#"
              title="Kebijakan Privasi"
              className="text-grey-800 underline"
            >
              Kebijakan Privasi
            </a>
            <span>/</span>
            <a
              href="#"
              title="Waspada Penipuan"
              className="text-grey-800 underline"
            >
              Waspada Penipuan
            </a>
          </div>
          <div className="flex items-center gap-4">
            {SOCIALS.map(({ title, href, Icon }) => (
              <a
                key={title}
                href={href}
                title={title}
                aria-label={title}
                target="_blank"
                referrerPolicy="no-referrer"
              >
                <i className="text-grey-800 transition-all duration-200 ease-in-out hover:text-blue-400">
                  <Icon />
                </i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
