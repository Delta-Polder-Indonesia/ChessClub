import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import {
  ActivityIcon,
  BikeIcon,
  BookOpenIcon,
  BriefIcon,
  CloseIcon,
  HouseIcon,
  LinkIcon,
  MaximizeIcon,
  ServerIcon,
  TrendingUpIcon,
  UtensilsIcon,
} from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Galeri (/media-dan-informasi/galeri).
 *
 * Isi halaman di bawah Hero adalah replika 1:1 bagian galeri pada halaman
 * impeccable.style, dipetakan dari markup dan CSS referensinya
 * (`Downloads\page_content (3)\index.html` + `_astro\gallery.cvrb3iwg.css`).
 * Setiap nilai kelas di bawah berasal dari aturan CSS itu:
 *
 *   .gallery-shell            -> max-width 1560px, padding 0 clamp(20px,4vw,64px)
 *   .gallery-heading          -> judul "Gallery" rata kiri; paragraf pengantar
 *                                14px/1.5 muted. Referensi tidak memakai pita
 *                                hero, tetapi Hero KCI tetap dipertahankan
 *                                (keputusan pengguna), sehingga blok ini
 *                                berdampingan dengan judul Hero.
 *   #gallery-code             -> >=901px jadi grid 184px + 1fr, column-gap 36px;
 *                                rel proyek sticky di kolom pertama
 *   .gallery-niches           -> rel mendatar, w-fit, snap, cekung 3px;
 *                                >=901px jadi kolom vertikal sticky
 *   .gallery-niche            -> tinggi min 40px, font 500 12px/1.3, ikon 18px;
 *                                butir aktif hanya kertas putih (Elevated).
 *                                Tanpa bayangan: referensi memakai lift-1
 *                                yang bertumpuk dengan hairline rail, dan
 *                                DESIGN.md:55 meng forbid bayangan pada
 *                                keadaan terpilih
 *   .gallery-project          -> padding-top 30px, scroll-margin-top 90px;
 *                                proyek berikutnya dipisah garis rambut 32px
 *   .gallery-project-header h2-> clamp(2.4rem,3.4vw,3.3rem), leading 1
 *   .gallery-brief            -> blok kutip 96ch, ikon 20px, teks 14px/1.6
 *   .gallery-baseline-work    -> 5 kolom celah 14px (10px <=1050px);
 *                                <=700px jadi carousel geser 155px
 *   .gallery-work             -> 3 kolom celah 18px (12px <=1050px, 20px <=700px)
 *   .gallery-piece>button     -> rasio 16/10, tanpa border, cursor zoom-in
 *   .gallery-enlarge          -> lingkaran 30px (26px di baris kecil, sudut
 *                                kanan atas), transparan sampai hover/fokus
 *   .gallery-comparison-note  -> 14px/1.6, muted
 *   #gallery-lightbox         -> kartu kertas min(1560px,100%-32px) x 94dvh di
 *                                atas backdrop oklch(13% 0 0/.65)
 *   .gallery-footer-actions   -> rata kanan, hanya blok .gallery-method
 *
 * Dua penyimpangan yang disengaja dan belum berubah dari versi sebelumnya:
 * warna aksen memakai biru KCI (bukan teal --ks-patina-deep) dan judul proyek
 * memakai serif KCI; keduanya bentrok dengan DESIGN.md dan disetujui terpisah.
 * Teks proyek masih contoh berbahasa Inggris dari referensi.
 *
 * Bayangan lift-1/lift-2 milik referensi (foto, lencana, lightbox, toast)
 * semuanya dibuang 2026-09-28 atas permintaan pengguna: DESIGN.md:55 melarang
 * bayangan kecuali yang netral tipis, dan katalog Slop Impeccable menandai
 * "hairline border + wide shadow" sebagai AI slop. Konsekuensi yang diketahui:
 * foto tidak punya border maupun bayangan, jadi foto berlatar putih kehilangan
 * sudutnya di atas bg-grey-100. Pertimbangkan kembali setelah gambar asli KCI
 * terpasang, karena impediment itu milik gambar contoh, bukan desain halaman.
 */

/** Ikon tiap proyek, sesuai glyph SVG pada rail referensi. */
const IKON = {
  "09-luxury-hotel": HouseIcon,
  "02-kids-reading": BookOpenIcon,
  "03-italian-restaurant": UtensilsIcon,
  "01-observability": ActivityIcon,
  "07-vintage-moto-forum": BikeIcon,
  "08-perp-dex": TrendingUpIcon,
  "21-infra-platform": ServerIcon,
};

const PROYEK = [
  {
    id: "09-luxury-hotel",
    kecil: [
        "/Galeri_sample/2ebfbb7b9aea4568_thumb.webp",
        "/Galeri_sample/92c3c179f0ee2dac_thumb.webp",
        "/Galeri_sample/e9b413102497f739_thumb.webp",
        "/Galeri_sample/340841ea688fd47c_thumb.webp",
        "/Galeri_sample/1c16013c4eba4189_thumb.webp",
    ],
    besar: [
        "/Galeri_sample/eac7aa5710b8a35e.webp",
        "/Galeri_sample/d009bd6eb6399b7a.webp",
        "/Galeri_sample/e41a625c131eca65.webp",
    ],
  },
  {
    id: "02-kids-reading",
    kecil: [
        "/Galeri_sample/1cae1b1b38935a23_thumb.webp",
        "/Galeri_sample/5104cfa27f9046f5_thumb.webp",
        "/Galeri_sample/0391067819e161df_thumb.webp",
        "/Galeri_sample/c03ea3ec4dcb0079_thumb.webp",
        "/Galeri_sample/ca3805cff51ca072_thumb.webp",
    ],
    besar: [
        "/Galeri_sample/c4ecb101f8b3d722.webp",
        "/Galeri_sample/3ea63ec76802aab6.webp",
        "/Galeri_sample/a34a229c58c3067c.webp",
    ],
  },
  {
    id: "03-italian-restaurant",
    kecil: [
        "/Galeri_sample/d5459958cb817eb4_thumb.webp",
        "/Galeri_sample/d6cc45da7e5f791f_thumb.webp",
        "/Galeri_sample/d585c6246b214583_thumb.webp",
        "/Galeri_sample/93b9af6066bedbf1_thumb.webp",
        "/Galeri_sample/8304c588ffd83bcc_thumb.webp",
    ],
    besar: [
        "/Galeri_sample/95e472135260c675.webp",
        "/Galeri_sample/3dcede2c5849b9ec.webp",
        "/Galeri_sample/eeee378ff2395aa8.webp",
    ],
  },
  {
    id: "01-observability",
    kecil: [
        "/Galeri_sample/46012f4606a4c1f8_thumb.webp",
        "/Galeri_sample/83fe3bb8386eabbd_thumb.webp",
        "/Galeri_sample/9b545b8abc189677_thumb.webp",
        "/Galeri_sample/7c1708cabb5da1d1_thumb.webp",
        "/Galeri_sample/50a1e1cfcbb1aa44_thumb.webp",
    ],
    besar: [
        "/Galeri_sample/db5c49a920cda197.webp",
        "/Galeri_sample/42d9852f2e6eb2d2.webp",
        "/Galeri_sample/6d89341bc548cd06.webp",
    ],
  },
  {
    id: "07-vintage-moto-forum",
    kecil: [
        "/Galeri_sample/93118c88642a0173_thumb.webp",
        "/Galeri_sample/85013ccf9b7cf9f2_thumb.webp",
        "/Galeri_sample/ba11e12723ae59d9_thumb.webp",
        "/Galeri_sample/2431fb99ef3ff84a_thumb.webp",
        "/Galeri_sample/005e5668fa8b0bc6_thumb.webp",
    ],
    besar: [
        "/Galeri_sample/00a0dc8dda1edbe3.webp",
        "/Galeri_sample/487b4d07fe2d3357.webp",
        "/Galeri_sample/5e92c078544a22a1.webp",
    ],
  },
  {
    id: "08-perp-dex",
    kecil: [
        "/Galeri_sample/626c4262b9498347_thumb.webp",
        "/Galeri_sample/00fe1e1cf1150405_thumb.webp",
        "/Galeri_sample/8f323e79ee58a8e0_thumb.webp",
        "/Galeri_sample/e600dc8827dd3ed7_thumb.webp",
        "/Galeri_sample/7447826d7d965f4c_thumb.webp",
    ],
    besar: [
        "/Galeri_sample/b5850eeea1c2e703.webp",
        "/Galeri_sample/dad1077865502726.webp",
        "/Galeri_sample/03876e3147e7a59f.webp",
    ],
  },
  {
    id: "21-infra-platform",
    kecil: [
        "/Galeri_sample/078513e4fa67cc83_thumb.webp",
        "/Galeri_sample/84ec7190ef046bd0_thumb.webp",
        "/Galeri_sample/0c64a40f1d9108e7_thumb.webp",
        "/Galeri_sample/b84e50d3b1b3ad6c_thumb.webp",
        "/Galeri_sample/406b9f8b5b52caf8_thumb.webp",
    ],
    besar: [
        "/Galeri_sample/3bf3409d33dab1b1.webp",
        "/Galeri_sample/42b03de07823599c.webp",
        "/Galeri_sample/da2b2ab9842a3f1f.webp",
    ],
  },
];

/**
 * Satu lempeng foto - padanan `.gallery-piece`. `kecil` membedakan varian
 * `.gallery-baseline-work`: lencana 26px di sudut kanan atas, dan pada
 * <=700px lempeng melebar tetap 155px dengan snap per lempeng.
 */
function Lempeng({ src, alt, onBuka, labelBuka, kecil = false }) {
  return (
    <figure
      className={`relative m-0 min-w-0 ${
        kecil ? "max-[700px]:flex-none max-[700px]:basis-[155px] max-[700px]:snap-start" : ""
      }`}
    >
      <button
        type="button"
        onClick={onBuka}
        aria-label={`${labelBuka}: ${alt}`}
        className="group relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden rounded bg-grey-100 p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <img
          src={src}
          alt={alt}
          draggable="false"
          width={640}
          height={400}
          decoding="async"
          loading="lazy"
          className="block h-full w-full object-cover object-top"
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute grid place-items-center rounded-full bg-white text-grey-800 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 max-[700px]:opacity-100 pointer-coarse:opacity-100 motion-reduce:transition-none ${
            kecil ? "top-2 right-2 size-[26px]" : "right-2.5 bottom-2.5 size-[30px]"
          }`}
        >
          <MaximizeIcon className="size-4" />
        </span>
      </button>
    </figure>
  );
}

/**
 * Lightbox - padanan `#gallery-lightbox`. Satu dialog untuk semua proyek:
 * klik piece mana pun membuka daftar 8 gambar proyek itu (5 kecil + 3 besar),
 * kaki dialog berisi mundur, posisi, dan maju. Fokus terperangkap di dalam
 * dialog dan dikembalikan ke piece pemicu saat ditutup; Escape serta panah
 * kiri/kanan ditangani manual agar konsisten dengan mekanisme fokus itu.
 */
function Lightbox({ proyek, idx, setIdx, onTutup, t, onToast }) {
  const dialogRef = useRef(null);
  const tutupRef = useRef(null);
  const [gagal, setGagal] = useState(false);
  const total = proyek.daftar.length;
  const aktif = idx >= 0 ? proyek.daftar[idx] : null;

  useEffect(() => {
    if (idx < 0) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onTutup();
      else if (e.key === "ArrowRight") setIdx((i) => (i + 1) % total);
      else if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + total) % total);
      else if (e.key === "Tab") {
        // Perangkap fokus: hanya elemen yang benar-benar tampak ikut siklus.
        const fokusabel = Array.from(
          dialogRef.current?.querySelectorAll("button:not([disabled])") || []
        ).filter((n) => n.offsetParent !== null);
        if (fokusabel.length === 0) return;
        const pertama = fokusabel[0];
        const terakhir = fokusabel[fokusabel.length - 1];
        if (e.shiftKey && document.activeElement === pertama) {
          e.preventDefault();
          terakhir.focus();
        } else if (!e.shiftKey && document.activeElement === terakhir) {
          e.preventDefault();
          pertama.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    tutupRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [idx, total, setIdx, onTutup]);

  useEffect(() => {
    setGagal(false);
  }, [idx]);

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${proyek.id}`);
      onToast(t("galeri.lightbox.terSalin"));
    } catch {
      onToast(t("galeri.lightbox.salinGagal"));
    }
  };

  if (!aktif) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65"
      onClick={onTutup}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={proyek.judul}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[96dvh] w-[calc(100%_-_16px)] max-w-none flex-col overflow-hidden rounded-lg bg-white text-grey-800 min-[701px]:h-[94dvh] min-[701px]:w-[min(1560px,100%_-_32px)]"
      >
        {/* Kepala: judul proyek lalu baris model, di sebelah aksi salin dan
            tutup. Foto yang gagal dimuat tidak boleh mengosongkan dialog
            tanpa jalan keluar, jadi panggungnya diganti pesan. */}
        <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5 min-[701px]:gap-5 min-[701px]:px-5 min-[701px]:py-3">
          <div className="min-w-0">
            <h2 className="m-0 truncate text-base leading-[1.3] font-medium max-[700px]:text-sm">
              {proyek.judul}
            </h2>
            <p className="mt-[3px] mb-0 text-xs text-grey-600 max-[700px]:text-[11px]">
              {aktif.model}, variation {aktif.varian}
            </p>
          </div>
          <div className="flex flex-none items-center gap-0.5 min-[701px]:gap-4">
            <button
              type="button"
              onClick={salin}
              aria-label={t("galeri.lightbox.salinTautan")}
              title={t("galeri.lightbox.salin")}
              className="flex cursor-pointer rounded bg-transparent p-2 text-xs font-medium whitespace-nowrap text-inherit hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <LinkIcon className="size-[17px]" />
            </button>
            <button
              type="button"
              ref={tutupRef}
              onClick={onTutup}
              aria-label={t("galeri.lightbox.tutup")}
              className="flex cursor-pointer rounded bg-transparent p-2 text-inherit hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <CloseIcon className="size-[22px]" />
            </button>
          </div>
        </header>

        {/* Panggung gambar: latar dalam, gambar selebar panggung dan dapat
            digeser; lebar minimum 760px di layar kecil supaya tangkapan layar
            resolusi tinggi tetap terbaca saat diperbesar. */}
        <div className="min-h-0 flex-1 overflow-auto bg-grey-100">
          {gagal ? (
            <p className="mx-auto max-w-[55ch] p-7 text-center text-sm leading-relaxed text-grey-600">
              {t("galeri.lightbox.gagal")}
            </p>
          ) : (
            <img
              src={aktif.src}
              alt={aktif.alt}
              decoding="async"
              onError={() => setGagal(true)}
              className="block h-auto w-full min-w-[760px] min-[701px]:min-w-0"
            />
          )}
        </div>

        {/* Kaki: mundur - posisi - maju */}
        <footer className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-3 text-[13px] min-[701px]:gap-5 min-[701px]:px-5">
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + total) % total)}
            className="cursor-pointer rounded border border-slate-300 bg-white px-3 py-2 font-medium text-grey-800 hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("galeri.lightbox.sebelumnya")}
          </button>
          <p className="m-0 tabular-nums text-grey-600">
            {t("galeri.lightbox.posisi", { i: idx + 1, n: total })}
          </p>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % total)}
            className="cursor-pointer rounded border border-slate-300 bg-white px-3 py-2 font-medium text-grey-800 hover:bg-grey-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("galeri.lightbox.berikutnya")}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function Galeri() {
  const { t } = useI18n();
  const [aktif, setAktif] = useState(PROYEK[0].id);
  const [buka, setBuka] = useState(null);
  const [idx, setIdx] = useState(-1);
  const [toast, setToast] = useState("");
  // Piece pemicu agar fokus bisa dikembalikan ke tempat terakhir saat ditutup.
  const pemicuRef = useRef(null);

  const proyek = useMemo(
    () =>
      PROYEK.map((p) => {
        const judul = t(`galeri.proyek.${p.id}.judul`);
        return {
          ...p,
          judul,
          Ikon: IKON[p.id],
          // Teks alt mengikuti pola referensi: "<judul>, <model>, variation N".
          daftar: [
            ...p.kecil.map((src, i) => ({
              src: gambar(src),
              varian: i + 1,
              model: t("galeri.tanpa"),
              alt: `${judul}, ${t("galeri.tanpa")}, variation ${i + 1}`,
            })),
            ...p.besar.map((src, i) => ({
              src: gambar(src),
              varian: i + 1,
              model: t("galeri.dengan"),
              alt: `${judul}, ${t("galeri.dengan")}, variation ${i + 1}`,
            })),
          ],
        };
      }),
    [t]
  );

  // Scroll spy: rail tidak menyaring, hanya menyorot proyek yang sedang dibaca.
  // Proyek terakhir yang puncaknya melewati garis baca (30% tinggi layar) yang
  // dianggap aktif - determinant dan tanpa observer, jadi tidak melompat saat
  // gambar lambat dimuat.
  useEffect(() => {
    const seksi = PROYEK.map((p) => document.getElementById(p.id)).filter(Boolean);
    if (seksi.length === 0) return undefined;
    const hitung = () => {
      const garis = window.innerHeight * 0.3;
      let sekarang = seksi[0].id;
      for (const el of seksi) {
        if (el.getBoundingClientRect().top <= garis) sekarang = el.id;
      }
      setAktif((s) => (s === sekarang ? s : sekarang));
    };
    hitung();
    window.addEventListener("scroll", hitung, { passive: true });
    window.addEventListener("resize", hitung);
    return () => {
      window.removeEventListener("scroll", hitung);
      window.removeEventListener("resize", hitung);
    };
  }, []);

  // Toast "link disalin" menetap sendiri, seperti #gallery-status.
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const bukaFoto = useCallback((el, idProyek, i) => {
    pemicuRef.current = el;
    setBuka(idProyek);
    setIdx(i);
  }, []);

  const tutupFoto = useCallback(() => {
    setIdx(-1);
    setBuka(null);
    const el = pemicuRef.current;
    if (el) requestAnimationFrame(() => el.focus());
  }, []);

  const proyekBuka = buka ? proyek.find((p) => p.id === buka) : null;

  return (
    <HalamanIsi
      title={t("galeri.judul")}
      parent={t("nav.mediaDanInformasi")}
      parentPath="/media-dan-informasi"
      description={t("galeri.deskripsi")}
      next={{ to: "/keberlanjutan", judul: t("nav.keberlanjutan") }}
    >
      {/* .gallery-shell - lebar 1560px, padding lateral clamp(20px,4vw,64px),
          overflow-anchor:none supaya penandaan scroll tidak bergeser saat
          gambar lazily dimuat. */}
      <div className="mx-auto w-full max-w-[1560px] px-[clamp(20px,4vw,64px)] [overflow-anchor:none]">
        {/* .gallery-heading - judul "Gallery" rata kiri di pojok atas isi.
            Referensi tidak memakai pita hero maupun breadcrumb, hanya blok
            ini; Hero KCI tetap dipertahankan sesuai keputusan, jadi blok ini
            berdampingan dengan judul Hero. Selagi halaman ini masih template
            contoh, teks dan gambarnya akan diganti terpisah.
            Nilai: padding 28px 0 24px, judul weight 300 clamp(2.8rem,4vw,4rem)/1
            tracking -.02em, paragraf 14px/1.5 muted dengan margin-top 12px;
            pada <=700px judul 3rem dan paragraf 13px dengan margin-top 10px.

            Elemennya <p>, bukan <h1> seperti di referensi, karena Hero.jsx:62
            sudah menjadi satu-satunya h1 halaman ini. Aturan "skipped heading
            level" di katalog Slop menyorot struktur heading yang membingungkan;
            dua h1 untuk satu halaman/entity yang sama termasuk cacat itu. Kelas
            fontnya sengaja dibiarkan sama persis supaya nol pergeseran visual. */}
        <header className="pt-7 pb-6 max-[700px]:pt-[26px]">
          <p className="m-0 font-serif text-[clamp(2.8rem,4vw,4rem)] leading-none tracking-[-0.02em] text-grey-800 max-[700px]:text-[3rem]">
            {t("galeri.judul")}
          </p>
          <p className="mt-3 mb-0 text-sm leading-[1.5] text-grey-600 max-[700px]:mt-2.5 max-[700px]:text-[13px]">
            {t("galeri.pengantar")}
          </p>
        </header>

        {/* #gallery-code - <=900px satu kolom, >=901px rel proyek 184px di kiri
            dengan kolom-gap 36px dan align-items start. */}
        <div className="pt-1 min-[901px]:grid min-[901px]:grid-cols-[184px_minmax(0,1fr)] min-[901px]:items-start min-[901px]:gap-x-9 min-[901px]:pt-4">
          {/* .gallery-niches - rel mendatar w-fit dengan snap; >=901px berubah
              kolom vertikal sticky. Tautnya jangkar ke id proyek, bukan filter:
              seluruh proyek tetap tampil seperti referensi. Cekung dalam rail
              (inset shadow) dibuang; butir aktif ditandai kertas putih saja. */}
          <nav
            aria-label={t("galeri.pilihBrief")}
            className="flex w-fit max-w-full snap-x snap-proximity gap-[3px] overflow-x-auto rounded-[10px] bg-grey-100 p-1 min-[901px]:sticky min-[901px]:top-[100px] min-[901px]:max-w-none min-[901px]:flex-col min-[901px]:gap-[5px] min-[901px]:overflow-visible min-[901px]:bg-transparent min-[901px]:p-0 min-[901px]:shadow-none motion-reduce:snap-none"
          >
            {proyek.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                aria-current={aktif === p.id ? "location" : undefined}
                className={`inline-flex min-h-10 flex-none cursor-pointer snap-start items-center gap-2 rounded-md bg-transparent px-3 py-2 text-left text-xs leading-[1.3] font-medium whitespace-nowrap no-underline transition-[background-color,color,box-shadow] duration-[180ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${
                  aktif === p.id
                    ? "bg-white text-grey-800"
                    : "text-grey-600 hover:bg-white hover:text-grey-800"
                }`}
              >
                <p.Ikon
                  className={`size-[18px] flex-none ${aktif === p.id ? "text-primary" : ""}`}
                />
                {p.judul}
              </a>
            ))}
          </nav>

          <div className="min-w-0">
            {proyek.map((p) => (
              /* .gallery-project - padding-top 30px, scroll-margin-top 90px;
                 proyek berikutnya dipisah garis rambut 1px dan padding 32px. */
              <article
                key={p.id}
                id={p.id}
                className="pt-[30px] scroll-mt-[90px] [&+article]:border-t [&+article]:border-slate-200 [&+article]:pt-8"
              >
                <header className="mb-4 flex items-center justify-between gap-6">
                  <h2 className="m-0 font-serif text-[clamp(2.4rem,3.4vw,3.3rem)] leading-none font-normal text-grey-800">
                    {p.judul}
                  </h2>
                </header>

                {/* .gallery-brief - blok kutip 96ch; ikon 20px di kiri teks */}
                <blockquote className="mb-[26px] flex max-w-[96ch] items-start gap-3">
                  <BriefIcon className="mt-0.5 size-5 flex-none text-primary" />
                  <p className="m-0 text-sm leading-[1.6] text-grey-800">
                    {t(`galeri.proyek.${p.id}.brief`)}
                  </p>
                </blockquote>

                {/* .gallery-baselines - baris 5 foto kecil */}
                <div className="mb-[27px]">
                  <h3 className="mb-3 flex items-center gap-2 text-[13px] leading-[1.4] font-medium text-grey-800">
                    {t("galeri.tanpa")}
                    <span className="text-[11px] font-normal text-grey-600">
                      {t("galeri.running", { n: p.kecil.length })}
                    </span>
                  </h3>
                  <div className="grid grid-cols-5 gap-3.5 max-[1050px]:gap-2.5 max-[700px]:flex max-[700px]:w-fit max-[700px]:snap-x max-[700px]:snap-proximity max-[700px]:gap-2.5 max-[700px]:overflow-x-auto max-[700px]:p-2 max-[700px]:scroll-p-2">
                    {p.daftar.slice(0, p.kecil.length).map((f, i) => (
                      <Lempeng
                        key={f.src}
                        kecil
                        src={f.src}
                        alt={f.alt}
                        labelBuka={t("galeri.lightbox.buka")}
                        onBuka={(e) => bukaFoto(e.currentTarget, p.id, i)}
                      />
                    ))}
                  </div>
                </div>

                {/* .gallery-with-label - titik status 7px + judul + jumlah */}
                <h3 className="mb-3 flex items-center gap-2 text-[13px] leading-[1.4] font-medium text-grey-800">
                  <span
                    aria-hidden="true"
                    className="inline-block size-[7px] flex-none rounded-full bg-primary"
                  />
                  {t("galeri.dengan")}
                  <span className="text-[11px] font-normal text-grey-600">
                    {t("galeri.variasi", { n: p.besar.length })}
                  </span>
                </h3>

                {/* .gallery-work - 3 foto besar */}
                <div className="grid grid-cols-1 gap-5 min-[701px]:grid-cols-3 min-[701px]:gap-3 min-[1051px]:gap-[18px]">
                  {p.daftar.slice(p.kecil.length).map((f, i) => (
                    <Lempeng
                      key={f.src}
                      src={f.src}
                      alt={f.alt}
                      labelBuka={t("galeri.lightbox.buka")}
                      onBuka={(e) => bukaFoto(e.currentTarget, p.id, p.kecil.length + i)}
                    />
                  ))}
                </div>

                <p className="mt-4 mb-0 text-sm leading-[1.6] text-grey-600">
                  {t("galeri.catatan")}
                </p>
              </article>
            ))}

            {/* .gallery-footer-actions - blok <details> polos rata kanan. Tautan
                ".gallery-install" tidak diadopsi karena tidak ada padanannya di
                KCI. */}
            <div className="flex flex-wrap items-start justify-end gap-x-7 gap-y-3 pt-3 pb-10 max-[700px]:gap-x-4">
              <details className="min-w-0 max-w-[72ch] scroll-mt-[90px] py-3">
                <summary className="ml-auto w-fit cursor-pointer list-none text-sm font-medium text-grey-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-[700px]:text-[13px] [&::-webkit-details-marker]:hidden">
                  {t("galeri.tentang")}
                </summary>
                <div className="max-w-[72ch] pt-6 pb-2.5 text-left text-sm">
                  <p className="mt-0 mb-4">{t("galeri.metodeP1")}</p>
                  <p className="mt-0 mb-0">{t("galeri.metodeP2")}</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {proyekBuka && (
        <Lightbox
          proyek={proyekBuka}
          idx={idx}
          setIdx={setIdx}
          onTutup={tutupFoto}
          onToast={setToast}
          t={t}
        />
      )}

      {/* #gallery-status - umpan balik singkat setelah tautan disalin */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-lg bg-grey-800 px-5 py-3 text-sm text-white ${
          toast ? "block" : "hidden"
        }`}
      >
        {toast}
      </div>
    </HalamanIsi>
  );
}
