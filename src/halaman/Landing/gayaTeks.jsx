/**
 * Gaya tipografi "adopsi Impeccable" — pilot HANYA untuk `src/halaman/Landing/`.
 *
 * Nilai di berkas ini disalin presisi dari token desain situs sumber
 * (`Delta-Polder-Indonesia/Halaman_sample`, berkas
 * `_astro/kinpaku_tokens.czfxn__5.css` + aturan `h2`/`.ks-section*` pada
 * `_astro/base.dh9lpkoi.css` dan kelas kartu pada `_astro/sub_pages.dr6kqi_x.css`),
 * BUKAN perkiraan. Sumber tiap peran dicatat di komentar masing-masing
 * konstanta dan di `.agents/skills/kci-frontend/references/standar-galeri.md`
 * §2b (tabel lengkap + satu-satunya penyimpangan yang disengaja: ukuran label,
 * dibulatkan ke atas dari 11px sumber ke 12px karena DESIGN.md melarang teks
 * konten di bawah 12px).
 *
 * Rincian dan batas pilot ada di `standar-galeri.md` §2b. JANGAN impor berkas
 * ini dari halaman lain atau dari komponen catur (Analisa/Papan
 * Interaktif/Teka-teki/Quiz/Rush) — domain itu punya rumah visualnya sendiri
 * (DESIGN.md §13).
 */

/**
 * Judul seksi — token `--ks-type-headline-*` (dipakai situs sumber sebagai
 * `h2` bawaan di `base.dh9lpkoi.css`, dan hampir identik dengan
 * `.gallery-project-header h2` pada halaman Galeri):
 * size `clamp(2.4rem,3.6vw,3.4rem)`, weight 300, line-height 1.04, tracking 0.
 * Font tetap serif KCI (penyimpangan yang sudah disetujui terpisah untuk
 * Galeri; sumber aslinya "Alumni Sans", bukan serif).
 */
export const JUDUL_SEKSI =
  "font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800";

/** Varian di atas foto/latar gelap. */
export const JUDUL_SEKSI_TERANG =
  "font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-white";

/**
 * Paragraf pengantar seksi — token `.ks-section-sub` pada `base.dh9lpkoi.css`:
 * `font-size:.96rem` (15.36px), `line-height:1.55`, `max-width:60ch`, warna muted.
 */
export const LEAD_SEKSI = "font-serif text-[0.96rem] leading-[1.55] text-grey-600 max-w-[60ch]";

/** Varian di atas foto/latar gelap. */
export const LEAD_SEKSI_TERANG = "font-serif text-[0.96rem] leading-[1.55] text-white/80 max-w-[60ch]";

/**
 * Label kecil di atas judul — padanan `.ks-section-eyebrow`/`.ks-subsection-label`
 * (`base.dh9lpkoi.css`): font mono, uppercase, `letter-spacing:.14em`.
 * Sumber memakai `.6875rem` (11px, token `--ks-type-eyebrow-size`); DESIGN.md
 * melarang teks konten di bawah 12px, jadi ukuran dibulatkan ke token `label`
 * situs sumber yang juga ada (`--ks-type-label-size:.75rem` = 12px, `text-xs`)
 * — bukan angka karangan, tetap token resmi sumber, hanya peran yang berbeda.
 */
export const LABEL_SEKSI =
  "inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-primary";

/** Varian di atas foto/latar gelap. */
export const LABEL_SEKSI_TERANG =
  "inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-white";

/**
 * Blok kepala seksi (label + judul + pengantar) — `gap:14px` dari
 * `.ks-section-head` (`base.dh9lpkoi.css`), lebar `max-width:720px` (setara
 * `45rem`). Bungkus label/judul/pengantar dengan ini, lalu beri jarak ke
 * konten di bawahnya dengan `mb-14` (56px, `margin-bottom` asli
 * `.ks-section-head`) pada pemanggil.
 */
export const KEPALA_SEKSI = "flex flex-col gap-[14px] max-w-[45rem] mb-14";

/**
 * Judul kartu — token `--ks-type-title-*` (dipakai berulang di
 * `sub_pages.dr6kqi_x.css`: `.tutorial-card-title`, `.gallery-card-title`,
 * `.rule-card-name`): `font-size:1.0625rem` (17px), `font-weight:600`,
 * `line-height:1.35`.
 */
export const JUDUL_KARTU = "font-serif text-[1.0625rem] font-semibold leading-[1.35] text-grey-800";

/**
 * Deskripsi kartu — token `--ks-type-small-size` (`.rule-card-desc`):
 * `font-size:.875rem` (14px), `line-height:1.6`.
 */
export const DESKRIPSI_KARTU = "font-serif text-sm leading-[1.6] text-grey-600";

/**
 * Judul di ruang sempit (poster/kartu besar, bukan seksi penuh lebar) — token
 * `--ks-type-subhead-size` (1.25rem = 20px), dipasangkan dengan weight dan
 * tracking dari satu-satunya pemakaian konkret token ini di sumber
 * (`.site-header-brand`: `font-weight:600`, `letter-spacing:-.01em`).
 * Dipakai untuk overlay sampul e-book — `JUDUL_SEKSI` (headline, hingga
 * 3.4rem) terlalu besar untuk kartu selebar ~240–340px.
 */
export const JUDUL_POSTER = "font-serif text-[1.25rem] font-semibold leading-[1.3] tracking-[-0.01em] text-white";

/** Titik status 7px — padanan `.gallery-status-dot`. */
export function TitikLabel({ terang = false }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-[7px] flex-none rounded-full ${terang ? "bg-white" : "bg-primary"}`}
    />
  );
}
