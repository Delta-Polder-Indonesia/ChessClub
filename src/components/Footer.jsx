import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n.jsx";

/**
 * Footer bergaya NACCL (nacorporatechess.com).
 *
 * Susunan dari atas ke bawah (semua rata tengah):
 *   1. Blok "Sponsor" — label kecil dengan garis biru vertikal di kiri,
 *      di bawahnya deretan logo sponsor sejajar horizontal.
 *   2. Deretan ikon media sosial.
 *   3. Baris menu horizontal ringkas.
 *   4. Baris copyright.
 *
 * Semua tautan/label diambil dari kolom footer lama agar tidak menambah
 * data baru yang tidak dimiliki komunitas. Daftar `SPONSORS` sengaja
 * dibiarkan kosong secara default — begitu file logo diletakkan di
 * `public/images/sponsors/*` dan dimasukkan ke array ini, otomatis
 * muncul. Bila kosong, blok sponsor disembunyikan.
 */

const SPONSORS = [
  //{ name: "Chess.com", src: "/images/chesscomlogo.webp", href: "https://www.chess.com/" },
];

const SOCIAL_LINKS = [
  { name: "Chess.com", href: "https://www.chess.com/club/blunder-skuad", img: "/images/chesscomlogo.webp" },
  // Contoh:
  // { name: "LinkedIn", href: "https://www.linkedin.com/", icon: "linkedin" },
];

export default function Footer() {
  const { t } = useI18n();

  const bottomLinks = [
    { title: t("footer.kontakKami"), href: "/hubungi-kami" },
    { title: t("footer.kodeEtik"), href: "/keberlanjutan/kode-etik-komunitas" },
    { title: t("footer.pendaftaranAnggota"), href: "/pendaftaran-anggota" },
    { title: t("footer.beritaKomunitas"), href: "/media-dan-informasi/berita-komunitas" },
    { title: t("footer.pengumumanLink"), href: "/media-dan-informasi/pengumuman" },
    { title: t("footer.programCatur"), href: "/program-kami/sekolah-catur/cara-bermain-catur" },
    { title: t("nav.turnamen"), href: "/turnamen" },
  ];

  return (
    <footer className="relative bg-white text-slate-700 px-6 md:px-10 xl:px-20 pt-12 md:pt-16 pb-8 md:pb-10">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-10 md:gap-12">
        {/* 1. Blok Sponsor */}
        {SPONSORS.length > 0 && (
          <section className="w-full flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="inline-block w-1 h-5 bg-[#0B2F9F]" aria-hidden="true" />
              <h2 className="text-sm md:text-base font-semibold text-slate-800 m-0">
                Sponsor
              </h2>
            </div>
            <div className="w-full flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
              {SPONSORS.map((s) => {
                const isExternal = /^https?:/.test(s.href);
                const img = (
                  <img
                    src={s.src}
                    alt={s.name}
                    title={s.name}
                    className="h-8 md:h-10 w-auto object-contain"
                    loading="lazy"
                  />
                );
                return isExternal ? (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center"
                    aria-label={s.name}
                  >
                    {img}
                  </a>
                ) : (
                  <Link
                    key={s.name}
                    to={s.href}
                    className="inline-flex items-center"
                    aria-label={s.name}
                  >
                    {img}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. Ikon media sosial */}
        {SOCIAL_LINKS.length > 0 && (
          <nav
            aria-label="Media sosial"
            className="flex items-center justify-center gap-5 -mb-4 md:-mb-6"
          >
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                title={s.name}
                aria-label={s.name}
                className="inline-flex items-center justify-center min-w-12 h-12 rounded-full text-slate-700 hover:text-[#0B2F9F] transition-colors"
              >
                {s.img ? (
                  <img
                    src={s.img}
                    alt=""
                    className="h-11 md:h-9 w-auto object-contain"
                    loading="lazy"
                  />
                ) : (
                  <SocialIcon name={s.icon} />
                )}
              </a>
            ))}
          </nav>
        )}

        {/* 3. Menu horizontal ringkas */}
        <nav
          aria-label="Menu footer"
          className="w-full flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm"
        >
          {bottomLinks.map((link, i) => (
            <span
              key={link.href + i}
              className={
                "inline-flex items-center" +
                (i > 0 ? " border-l border-slate-300 pl-6" : "")
              }
            >
              {link.href.startsWith("/") ? (
                <Link
                  to={link.href}
                  className="text-slate-700 hover:text-[#0B2F9F] hover:underline font-medium"
                  title={link.title}
                >
                  {link.title}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="text-slate-700 hover:text-[#0B2F9F] hover:underline font-medium"
                  title={link.title}
                >
                  {link.title}
                </a>
              )}
            </span>
          ))}
        </nav>

        {/* 4. Copyright */}
        <div className="w-full text-center text-xs md:text-sm text-slate-600">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}

/** Ikon SVG sederhana untuk media sosial. */
function SocialIcon({ name }) {
  switch (name) {
    case "linkedin":
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.58 0 4.24 2.36 4.24 5.42v6.32zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.27V1.73C24 .77 23.2 0 22.22 0z" />
        </svg>
      );
    case "chess":
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2c-2.2 0-4 1.8-4 4 0 1 .4 1.9 1 2.6L7 12h2l-1 6h8l-1-6h2l-2-3.4c.6-.7 1-1.6 1-2.6 0-2.2-1.8-4-4-4zm-6 18h12v2H6v-2z" />
        </svg>
      );
    case "facebook":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
        </svg>
      );
    case "instagram":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.42 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.06 1.17-.26 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.06-1.8-.26-2.23-.42a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.42-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.06-1.17.26-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.42C8.42 2.17 8.8 2.16 12 2.16zm0 3.68a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.4a1.44 1.44 0 1 0 0-2.88 1.44 1.44 0 0 0 0 2.88z" />
        </svg>
      );
    default:
      return null;
  }
}
