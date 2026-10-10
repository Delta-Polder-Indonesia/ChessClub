/*
 * Kerangka visual halaman Hubungi Kami.
 *
 * Disalin dari template portofolio MIT "modern-portfolio" (Sanidhya Kumar Verma,
 * https://github.com/sanidhyy/modern-portfolio) agar tampilannya sama persis.
 * Perbedaan yang disengaja:
 *  - tautan Nav memakai path yang sama dengan referensi (/, /about, /services,
 *    /work, /testimonials, /contact); path ini belum tentu ada di ChessClub;
 *  - tautan sosial dan logo diganti; tautan sosial dapat diedit pemilik situs;
 *  - breakpoint `xl` referensi (1200px) ditulis eksplisit sebagai `min-[1200px]`,
 *    sedangkan `lg` referensi (960px) ditulis sebagai `min-[960px]`, karena
 *    tema Tailwind ChessClub memakai breakpoint bawaan.
 */
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiChatBubbleBottomCenterText,
  HiEnvelope,
  HiHome,
  HiRectangleGroup,
  HiUser,
  HiViewColumns,
} from "react-icons/hi2";
import {
  RiDribbbleLine,
  RiFacebookLine,
  RiGithubLine,
  RiInstagramLine,
  RiPinterestLine,
  RiYoutubeLine,
} from "react-icons/ri";

import { berkasPublik } from "../../../lib/asets.js";

const navData = [
  { name: "home", path: "/", Icon: HiHome },
  { name: "about", path: "/about", Icon: HiUser },
  { name: "services", path: "/services", Icon: HiRectangleGroup },
  { name: "work", path: "/work", Icon: HiViewColumns },
  {
    name: "testimonials",
    path: "/testimonials",
    Icon: HiChatBubbleBottomCenterText,
  },
  { name: "contact", path: "/contact", Icon: HiEnvelope },
];

export function Navigasi() {
  const pathname = useLocation().pathname;

  return (
    <nav className="flex flex-col items-center min-[1200px]:justify-center gap-y-4 fixed h-max bottom-0 mt-auto min-[1200px]:right-[2%] z-50 top-0 w-full min-[1200px]:w-16 min-[1200px]:max-w-md min-[1200px]:h-screen">
      <div className="flex w-full min-[1200px]:flex-col items-center justify-between min-[1200px]:justify-center gap-y-10 px-4 md:px-40 min-[1200px]:!px-0 h-20 min-[1200px]:h-max py-8 bg-white/10 backdrop-blur-xs text-3xl min-[1200px]:text-xl min-[1200px]:rounded-full">
        {navData.map((link) => (
          <Link
            prefetch="intent"
            className={`${
              link.path === pathname ? "text-[#f13024]" : ""
            } relative flex items-center group hover:text-[#f13024] transition-all duration-300`}
            to={link.path}
            key={link.path}
          >
            <div
              role="tooltip"
              className="absolute pr-14 right-0 hidden min-[1200px]:group-hover:flex"
            >
              <div className="bg-white relative flex text-[#131424] items-center p-1.5 rounded-[3px]">
                <div className="text-[12px] leading-none font-semibold capitalize">
                  {link.name}
                </div>

                <div
                  className="border-solid border-l-white border-l-8 border-y-transparent border-y-[6px] border-r-0 absolute -right-2"
                  aria-hidden
                />
              </div>
            </div>

            <div>
              <link.Icon aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function Kepala() {
  return (
    <header className="absolute z-30 w-full items-center px-16 min-[1200px]:h-22.5">
      <div className="mx-auto px-[15px] min-[640px]:!max-w-[640px] min-[768px]:!max-w-[768px] min-[960px]:!max-w-[960px] min-[1200px]:!max-w-[1200px]">
        <div className="flex flex-col min-[960px]:flex-row justify-between items-center gap-y-6 py-8">
          <Link prefetch="intent" to="/">
            <img
              src={berkasPublik("/images/kontak/logo.svg")}
              alt="logo"
              width={220}
              height={48}
            />
          </Link>

          <Sosial />
        </div>
      </div>
    </header>
  );
}

// Tautan sosial: ikon dan urutannya sama dengan referensi. Tautan diisi
// pemilik situs; GitHub menunjuk repo ChessClub.
const sosialData = [
  { name: "YouTube", link: "https://youtube.com", Icon: RiYoutubeLine },
  { name: "Instagram", link: "https://instagram.com", Icon: RiInstagramLine },
  { name: "Facebook", link: "https://facebook.com", Icon: RiFacebookLine },
  { name: "Dribbble", link: "https://dribbble.com", Icon: RiDribbbleLine },
  { name: "Pinterest", link: "https://pinterest.com", Icon: RiPinterestLine },
  {
    name: "Github",
    link: "https://github.com/sanidhyy/modern-portfolio",
    Icon: RiGithubLine,
  },
];

export function Sosial() {
  return (
    <div className="flex items-center gap-x-5 text-lg">
      {sosialData.map((social) => (
        <Link
          key={social.name}
          title={social.name}
          to={social.link}
          target="_blank"
          rel="noreferrer noopener"
          className={`${
            social.name === "Github"
              ? "bg-[#f13024] rounded-full p-1.25 hover:text-white"
              : "hover:text-[#f13024]"
          } transition-all duration-300`}
        >
          <social.Icon aria-hidden />
          <span className="sr-only">{social.name}</span>
        </Link>
      ))}
    </div>
  );
}

export function SudutKiri() {
  return (
    <div className="absolute left-0 top-0 mix-blend-color-dodge z-10 w-50 min-[1200px]:w-100 opacity-50 pointer-events-none select-none">
      <img
        src={berkasPublik("/images/kontak/top-left-img.webp")}
        alt="left cover bg"
        width={400}
        height={400}
        loading="lazy"
        decoding="async"
        style={{ color: "transparent" }}
      />
    </div>
  );
}

const transisiVarian = {
  initial: { x: "100%", width: "100%" },
  animate: { x: "0%", width: "0%" },
  exit: { x: ["0%", "100%"], width: ["0%", "100%"] },
};

export function Transisi() {
  return (
    <>
      <motion.div
        role="status"
        className="fixed top-0 bottom-0 right-full w-screen h-screen z-30 bg-[#2e2257]"
        variants={transisiVarian}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ delay: 0.2, duration: 0.6, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        role="status"
        className="fixed top-0 bottom-0 right-full w-screen h-screen z-20 bg-[#3b2d71]"
        variants={transisiVarian}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ delay: 0.4, duration: 0.6, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        role="status"
        className="fixed top-0 bottom-0 right-full w-screen h-screen z-10 bg-[#4b3792]"
        variants={transisiVarian}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ delay: 0.6, duration: 0.6, ease: "easeInOut" }}
        aria-hidden
      />
    </>
  );
}

