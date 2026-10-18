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
 * Paragraf pengantar seksi — token `.section-lead` pada
 * `index.duybiyfa.css` (kelas yang dipakai seksi beranggota `<p
 * class="section-lead">` pada halaman sumber):
 *     .home-kinpaku .section-lead {
 *       max-width: 62ch;
 *       color: var(--ks-text);
 *       font-size: var(--ks-type-body-size);   // 1rem = 16px
 *       line-height: 1.8;
 *       text-wrap: pretty;
 *     }
 * Angka 16px/1.8/62ch diambil literal dari sana. Token
 * `--ks-type-body-size` = `1rem` dan `--ks-type-body-line` = `1.65` dari
 * `kinpaku_tokens.czfxn__5.css`.
 *
 * REVISI 2026-09-30: nilai sebelumnya `0.96rem`/1.55/60ch berasal dari kelas
 * `.ks-section-sub`, yang memang ada di sumber tapi BUKAN kelas yang dipakai
 * seksi ini. Diganti ke `.section-lead`.
 *
 * Warna sengaja tetap `text-grey-600`, bukan `var(--ks-text)` (oklch 22%) yang
 * dipakai sumber. Ini penyimpangan yang diketahui, belum disetujui.
 */
export const LEAD_SEKSI =
  "font-serif text-[1rem] leading-[1.8] text-grey-600 max-w-[62ch] text-pretty";

/** Varian di atas foto/latar gelap. */
export const LEAD_SEKSI_TERANG =
  "font-serif text-[1rem] leading-[1.8] text-white/80 max-w-[62ch] text-pretty";

/**
 * Label kecil di atas judul — padanan `.ks-section-eyebrow`/`.ks-subsection-label`
 * (`base.dh9lpkoi.css`): font mono, uppercase, `letter-spacing:.14em`.
 * Sumber memakai `.6875rem` (11px, token `--ks-type-eyebrow-size`); DESIGN.md
 * melarang teks konten di bawah 12px, jadi ukuran dibulatkan ke token `label`
 * situs sumber yang juga ada (`--ks-type-label-size:.75rem` = 12px, `text-xs`)
 * — bukan angka karangan, tetap token resmi sumber, hanya peran yang berbeda.
 */
export const LABEL_SEKSI =
  "inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.14em] text-primary";

/** Varian di atas foto/latar gelap. */
export const LABEL_SEKSI_TERANG =
  "inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.14em] text-white";

/**
 * Blok kepala seksi (judul + pengantar) — `.home-kinpaku .section-header` pada
 * `index.duybiyfa.css`:
 *     .home-kinpaku .section-header { gap: 12px; margin-bottom: 34px; display: grid; }
 * REVISI 2026-09-30a: sebelumnya `gap-[14px] mb-14` (14px / 56px) dari
 * `.ks-section-head`, kelas lain yang ada di sumber tapi bukan yang dipakai
 * seksi ini.
 *
 * REVISI 2026-09-30b: `max-w-[45rem]` (720px) DIHAPUS. Sumber tidak membatasi
 * lebar kepala seksi sama sekali — pembatasnya hanya ada di `.section-lead`
 * (`max-width:62ch`), yang sudah dibawa `LEAD_SEKSI`. Bagian `mb-14` (56px)
 * dibuang karena `.section-header` tidak punya jarak ke konten pada sumber;
 * jarak ke konten dibawa pemanggil lewat `mb-[34px]` di sini.
 *
 * Efek samping yang disengaja: judul TigaJalan, Testimoni, dan MaestroEdision
 * sekarang sama-sama melebar penuh. Kalau satu seksi butuh judulnya dibatasi,
 * tambahkan `max-w-[45rem]` pada pemanggilnya, bukan di token ini.
 */
export const KEPALA_SEKSI = "flex flex-col gap-3 mb-[34px]";

/**
 * Judul kartu — token `--ks-type-title-*` (dipakai berulang di
 * `sub_pages.dr6kqi_x.css`: `.tutorial-card-title`, `.gallery-card-title`,
 * `.rule-card-name`): `font-size:1.0625rem` (17px), `font-weight:600`,
 * `line-height:1.35`.
 *
 * REVISI 2026-09-30c: ditambah `text-balance`. Sumber menerapkan
 * `text-wrap:balance` ke semua judulnya, antara lain lewat
 * `.home-kinpaku .why-panel-title`.
 */
export const JUDUL_KARTU = "font-sans text-[1.0625rem] font-semibold leading-[1.35] text-balance text-grey-800";

/**
 * Deskripsi kartu — token `--ks-type-small-size` (`.rule-card-desc`):
 * `font-size:.875rem` (14px), `line-height:1.6`.
 *
 * REVISI 2026-09-30c: ditambah `text-pretty`, sama seperti sumber yang
 * memakai `text-wrap:pretty` pada body panel dan seksi.
 */
export const DESKRIPSI_KARTU = "font-serif text-sm leading-[1.6] text-pretty text-grey-600";

/**
 * Judul panel lebar (kartu unggulan dua kolom) — `.home-kinpaku .why-panel-title`
 * pada `index.duybiyfa.css`, dipakai sumber untuk heading di dalam bento tile
 *Lebar yang pada halaman asli berisi teks "Respects your design system.":
 *     .home-kinpaku .why-panel-title {
 *       font-size: clamp(1.5rem, 2vw, 1.85rem);
 *       font-weight: var(--ks-type-headline-weight);   // 300
 *       line-height: var(--ks-type-headline-line);     // 1.04
 *       letter-spacing: var(--ks-type-headline-track); // 0
 *       color: var(--ks-ink);
 *     }
 *     .home-kinpaku .why-panel-title { text-wrap: balance; }
 *                                     // max-width:60ch, margin-bottom:0 di dalam bento
 * Dipakai `TigaJalan.jsx` untuk judul ketiga kartu di seksi "Tiga jalan"
 * (kartu unggulan "Kurikulum terstruktur", serta kartu kecil "Papan Interaktif
 * & Teka-teki" dan "Report Analisa"). Berbeda dengan `JUDUL_KARTU` (17px/600)
 * yang dipakai kartu kecil di seksi lain.
 *
 * `max-width:60ch` milik sumber tidak dipasang karena lebar kartu featured
 * sudah ~45–55% kolom; `margin-bottom` juga 0 di dalam bento dan di sini
 * jarak diatur oleh `gap-4` pada induknya.
 */
export const JUDUL_PANEL =
  "font-serif text-[clamp(1.5rem,2vw,1.85rem)] font-light leading-[1.04] tracking-normal text-balance text-grey-800";

/**
 * Isi panel lebar — `.home-kinpaku .why-panel-body`:
 *     font-size: 1rem (16px); line-height: 1.65;
 *     color: var(--ks-text); text-wrap: pretty;
 * `1rem` = `--ks-type-body-size`, `1.65` = `--ks-type-body-line`. Warna
 * `text-grey-600` mengikuti keputusan yang sama seperti `LEAD_SEKSI`.
 */
export const DESKRIPSI_PANEL =
  "font-serif text-[1rem] leading-[1.65] text-grey-600 text-pretty";

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
