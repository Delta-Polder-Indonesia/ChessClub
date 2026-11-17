/**
 * Komponen bersama rating & ulasan — ikon, avatar, deret bintang,
 * bar distribusi, kartu ulasan, ringkasan agregat.
 *
 * Dipakai oleh RatingUlasan (blok di Landing), HalamanTulisUlasan,
 * dan HalamanSemuaUlasan. Perubahan di sini langsung diterapkan ketiga
 * tempat.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import {
  formatRibuan,
  formatTanggalSingkat,
  warnaUntuk,
  waktuRelatif,
} from "./format-rating.js";

/* ==================== ikon-ikon ==================== */
export function BintangOutline({ className = "" }) {
  return <Star aria-hidden="true" className={className} strokeWidth={1.6} />;
}
export function BintangPadat({ className = "", style }) {
  return <Star aria-hidden="true" className={className} style={style} fill="currentColor" strokeWidth={1.6} />;
}
export function IkonInfo({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function PanahKanan({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
export function PanahKiri({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
export function Jempol({ arah = "naik", aktif = false, className = "" }) {
  const rotasi = arah === "turun" ? "rotate-180" : "";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${rotasi} ${className}`}
      fill={aktif ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 9 4-7h3l-1 7h9l-2 13H7zM2 9h5v13H2z" />
    </svg>
  );
}

/* ==================== avatar ==================== */
export function Avatar({ nama, size = "md" }) {
  const huruf = (nama || "?").split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 1).toUpperCase();
  const ukuranCls = size === "sm" ? "size-10 text-sm" : size === "lg" ? "size-14 text-xl" : "size-11 text-base";
  return (
    <span aria-hidden="true"
      className={`flex ${ukuranCls} flex-none items-center justify-center rounded-full font-semibold ${warnaUntuk(nama)}`}>
      {huruf}
    </span>
  );
}

/* ==================== pemilih bintang interaktif ==================== */
/**
 * Satu-satunya pemilih bintang yang bisa diklik. Dipakai hero Landing dan
 * form ulasan supaya markup serta bentuk bintangnya identik.
 *
 * @param {number} nilai 0..5
 * @param {'lg'|'xl'} ukuran
 * @param {(n:number)=>string} [labelSatuan] aria-label tiap tombol
 * @param {(n:number)=>string} [labelUntuk] teks di samping bintang (menerima nilai sorotan)
 */
export function PemilihBintang({
  nilai = 0,
  ukuran = "lg",
  onPilih,
  className = "",
  ariaLabel,
  ariaInvalid,
  ariaDescribedby,
  labelSatuan,
  labelUntuk,
}) {
  const [disorot, setDisorot] = useState(0);
  const bulat = Math.round(nilai);
  const tampil = disorot || bulat;
  const ukuranCls = ukuran === "xl" ? "size-10 sm:size-12" : "size-10";
  const gapCls = ukuran === "xl" ? "gap-1 sm:gap-3" : "gap-0.5";

  return (
    <div className={`flex flex-wrap items-center ${gapCls} ${className}`}
      role="radiogroup"
      aria-label={ariaLabel || `${bulat} dari 5 bintang`}
      aria-invalid={ariaInvalid || undefined}
      aria-describedby={ariaDescribedby || undefined}
      onMouseLeave={() => setDisorot(0)}>
      <div className="flex w-full flex-1 items-center justify-between">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={bulat === n}
            aria-label={labelSatuan ? labelSatuan(n) : `${n} bintang`}
            onMouseEnter={() => setDisorot(n)}
            onFocus={() => setDisorot(n)}
            onBlur={() => setDisorot(0)}
            onClick={() => onPilih?.(n)}
            className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50">
            <BintangPadat className={`${ukuranCls} ${tampil >= n ? "text-yellow-400" : "text-grey-300"}`} />
          </button>
        ))}
      </div>
      {labelUntuk ? (
        <span className="mt-1 w-full text-left font-sans text-sm font-medium text-foregroundGrey sm:mt-0 sm:w-32 sm:flex-none">
          {labelUntuk(tampil)}
        </span>
      ) : null}
    </div>
  );
}

/* ==================== deret bintang statis (dukung pecahan) ==================== */
/**
 * @param {number} nilai 0..5 (bisa pecahan untuk ringkasan)
 * @param {'sm'|'md'|'lg'|'xl'} ukuran
 */
export function DeretBintang({ nilai, ukuran = "md", className = "" }) {
  const ukuranCls =
    ukuran === "sm" ? "size-4"
      : ukuran === "lg" ? "size-10"
        : ukuran === "md" ? "size-6"
          : ukuran === "xl" ? "size-11"
            : "size-5";
  const gapCls = ukuran === "md" ? "gap-1" : "gap-0.5";

  const mak = Math.max(0, Math.min(5, nilai));
  return (
    <div className={`inline-flex items-center ${gapCls} text-yellow-400 ${className}`}
      role="img" aria-label={`${nilai.toFixed(1)} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const isi = Math.max(0, Math.min(1, mak - (n - 1)));
        return (
          <span key={n} className="relative inline-block">
            <BintangOutline className={ukuranCls} />
            {isi > 0 && (
              <span className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ width: `${isi * 100}%` }}>
                <BintangPadat className={ukuranCls} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ==================== Bar distribusi ==================== */
export function BarDistribusi({ persen }) {
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-grey-200">
      <div className="h-full rounded-full bg-yellow-400 transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, persen))}%` }} />
    </div>
  );
}

/* ==================== Ringkasan agregat (skor + bar mendatar) ==================== */
export function Ringkasan({ ulasan, locale }) {
  const total = ulasan.length;
  const rata = total ? ulasan.reduce((a, u) => a + u.bintang, 0) / total : 0;
  const distribusi = useMemo(() => {
    return [5, 4, 3, 2, 1].map((b) => {
      const hitung = ulasan.filter((u) => u.bintang === b).length;
      const persen = total ? Math.round((hitung / total) * 100) : 0;
      return { bintang: b, percentage: persen };
    });
  }, [ulasan, total]);
  const rataTeks = rata.toFixed(1).replace(".", locale === "id" ? "," : ".");

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
      <div className="flex flex-col items-center gap-1 md:min-w-[160px]">
        <span className="font-sans text-4xl font-semibold leading-none text-foreground sm:text-5xl md:text-6xl">{rataTeks}</span>
        <DeretBintang nilai={rata} ukuran="md" />
        <span className="mt-0.5 font-sans text-sm text-foregroundGrey">{formatRibuan(total, locale)}</span>
      </div>
      <div className="flex-1 space-y-2">
        {distribusi.map((row) => (
          <div key={row.bintang} className="flex items-center gap-2.5">
            <span className="w-3 text-right font-sans text-sm text-foregroundGrey">{row.bintang}</span>
            <BarDistribusi persen={row.percentage} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== Kartu ulasan tunggal ==================== */
export function KartuUlasan({ t, ulasan: u, padaVote, padat }) {
  return (
    <article
      className={`flex flex-col gap-3 rounded-2xl border border-grey-200 bg-white p-5 ${padat ? "" : "h-full"}`}
    >
      <header className="flex items-start gap-3">
        <Avatar nama={u.nama} size={padat ? "sm" : "md"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate font-sans text-base font-semibold text-foreground">{u.nama}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <DeretBintang nilai={u.bintang} ukuran="sm" />
            <span className="hidden font-sans text-xs text-foregroundGrey md:inline" aria-hidden="true">•</span>
            <time dateTime={new Date(u.ts).toISOString()}
              className="hidden font-sans text-xs text-foregroundGrey md:inline">
              {formatTanggalSingkat(u.ts)}
            </time>
            <span className="font-sans text-xs text-foregroundGrey">
              {waktuRelatif(u.ts, t)}
            </span>
          </div>
        </div>
      </header>

      <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground
                     line-clamp-4 md:line-clamp-none">
        {u.pesan}
      </p>

      <footer className="mt-auto flex items-center gap-3 pt-1">
        <span className="mr-auto hidden font-sans text-sm text-foregroundGrey md:inline">
          {t("landing.rating.apakahMembantu")}
        </span>
        <button type="button" onClick={() => padaVote?.(u.id, "naik")}
          aria-pressed={u.sayaSuka === true} aria-label={t("landing.rating.suka")}
          className={`inline-flex items-center gap-1.5 rounded px-2 py-1 font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            u.sayaSuka === true ? "text-primary" : "text-foregroundGrey hover:text-primary"
          }`}>
          <Jempol arah="naik" aktif={u.sayaSuka === true} className="size-5" />
          <span className="tabular-nums">{u.suka}</span>
        </button>
        <button type="button" onClick={() => padaVote?.(u.id, "turun")}
          aria-pressed={u.sayaSuka === false} aria-label={t("landing.rating.tidakSuka")}
          className={`flex size-8 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 ${
            u.sayaSuka === false ? "text-destructive" : "text-foregroundGrey hover:text-destructive"
          }`}>
          <Jempol arah="turun" aktif={u.sayaSuka === false} className="size-5" />
        </button>
      </footer>
    </article>
  );
}

/* ==================== Form tulis ulasan ==================== */
function KartuPertanyaanSurvei({ id, pertanyaan, nilai, opsi, onPilih }) {
  return (
    <fieldset className="w-full rounded-xl border border-grey-200 bg-white p-4 md:p-5">
      <legend className="sr-only">{pertanyaan}</legend>
      <div className="min-h-[2.5rem]">
        <p aria-hidden="true" className="min-w-0 pt-0.5 font-sans text-sm font-semibold leading-5 text-foreground">
          {pertanyaan}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {opsi.map((item) => {
          const inputId = `${id}-${item.value}`;
          return (
            <label key={item.value} htmlFor={inputId} className="cursor-pointer">
              <input
                id={inputId}
                type="radio"
                name={id}
                value={item.value}
                checked={nilai === item.value}
                onChange={() => onPilih(item.value)}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-10 min-w-[76px] items-center justify-center rounded-md border border-black bg-transparent px-3 font-sans text-xs font-semibold text-black transition-colors hover:bg-grey-100 peer-checked:border-2 peer-checked:border-black peer-checked:bg-grey-100 peer-checked:text-black peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2">
                {item.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * @param {number} bintangAwal nilai awal bintang (dipilih dari hero)
 * @param {function} onKirim(ulasan) dipanggil saat terkirim (object ulasan tanpa id/ts/suka)
 * @param {function} onBatal dipanggil saat batal
 */
export function FormUlasan({ t, bintangAwal = 0, onKirim, onBatal }) {
  const [bintang, setBintang] = useState(bintangAwal);
  const [nama, setNama] = useState("");
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState(null);
  const [jawabanSurvei, setJawabanSurvei] = useState({
    kerjaTim: "",
    tampilanPonsel: "",
    iklanJudi: "",
  });
  const pertanyaanSurvei = [
    { id: "kerjaTim", teks: t("landing.rating.surveiKerjaTim") },
    { id: "tampilanPonsel", teks: t("landing.rating.surveiTampilanPonsel") },
    { id: "iklanJudi", teks: t("landing.rating.surveiIklanJudi") },
  ];
  const opsiSurvei = [
    { value: "tidak", label: t("landing.rating.surveiTidak") },
    { value: "tidak-yakin", label: t("landing.rating.surveiTidakYakin") },
    { value: "ya", label: t("landing.rating.surveiYa") },
  ];

  useEffect(() => {
    if (bintangAwal > 0) setBintang(bintangAwal);
  }, [bintangAwal]);

  const pilihBintang = useCallback((n) => {
    setBintang(n);
    setError((sebelumnya) => sebelumnya?.field === "bintang" ? null : sebelumnya);
  }, []);

  const kirim = useCallback(
    (e) => {
      e.preventDefault();
      if (bintang < 1) { setError({ field: "bintang", key: "landing.rating.pilihBintang" }); return; }
      if (!pesan.trim()) { setError({ field: "pesan", key: "landing.rating.tulisPesan" }); return; }
      setError(null);
      onKirim({
        nama: nama.trim() || t("landing.rating.tamu"),
        bintang,
        // Field emoji di data lama memakai nilai bintang; tetap diisi
        // dengan skor bintang supaya bentuk data ulasan tidak berubah.
        emoji: bintang,
        survei: jawabanSurvei,
        pesan: pesan.trim(),
      });
    },
    [bintang, jawabanSurvei, nama, pesan, onKirim, t]
  );

  return (
    <form onSubmit={kirim} className="grid grid-cols-1 gap-8 rounded-2xl bg-paper p-5 md:p-6 lg:grid-cols-2 lg:gap-[12.5%] lg:px-0 lg:py-8">
      <div className="space-y-5">
        <header className="flex flex-col items-start gap-2">
          <h1 className="font-sans text-2xl font-semibold text-foreground md:text-3xl">
            {t("landing.rating.ajakJudul")}
          </h1>
          <p className="font-sans text-base text-foregroundGrey">
            {t("landing.rating.ajakSub")}
          </p>
        </header>
        <div className="space-y-1.5">
          <PemilihBintang
            nilai={bintang}
            ukuran="lg"
            onPilih={pilihBintang}
            ariaLabel={t("landing.rating.beriBintang")}
            ariaInvalid={error?.field === "bintang"}
            ariaDescribedby={error?.field === "bintang" ? "ulasan-error-bintang" : undefined}
            className="w-full justify-between"
          />
          <div className="min-h-5">
            {error?.field === "bintang" ? (
              <p id="ulasan-error-bintang" role="alert" className="font-sans text-sm text-destructive">
                {t(error.key)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ulasan-nama" className="block font-sans text-sm font-semibold text-foreground">
            {t("landing.rating.namaLabel")}{" "}
            <span className="font-normal text-foregroundGrey">({t("landing.rating.opsional")})</span>
          </label>
          <input id="ulasan-nama" type="text" value={nama} onChange={(e) => setNama(e.target.value)} maxLength={40}
            placeholder={t("landing.rating.namaPlaceholder")}
            className="w-full rounded-lg border-2 border-grey-400 bg-transparent px-3 py-2 font-sans text-sm outline-none placeholder:text-foregroundGrey transition-colors focus-visible:border-primary focus-visible:ring-0" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ulasan-pesan" className={`block font-sans text-sm font-semibold ${error?.field === "pesan" ? "text-destructive" : "text-foreground"}`}>
            {t("landing.rating.pesanLabel")}
          </label>
          <Textarea id="ulasan-pesan" value={pesan}
            onChange={(e) => {
              const nilai = e.target.value;
              setPesan(nilai);
              if (nilai.trim()) setError((sebelumnya) => sebelumnya?.field === "pesan" ? null : sebelumnya);
            }}
            aria-invalid={error?.field === "pesan" || undefined}
            aria-describedby={error?.field === "pesan" ? "ulasan-error-pesan" : undefined}
            rows={5} maxLength={600} placeholder={t("landing.rating.pesanPlaceholder")}
            className={`rounded-lg border-2 bg-transparent px-3 py-2 font-sans text-sm outline-none placeholder:text-foregroundGrey transition-colors focus-visible:ring-0 ${error?.field === "pesan" ? "border-destructive bg-destructive/5 focus-visible:border-destructive" : "border-grey-400 focus-visible:border-primary"}`} />
          <div className="flex min-h-5 items-start justify-between gap-3">
            {error?.field === "pesan" ? (
              <p id="ulasan-error-pesan" role="alert" className="font-sans text-sm text-destructive">
                {t(error.key)}
              </p>
            ) : <span aria-hidden="true" />}
            <p className="shrink-0 text-right font-sans text-xs text-foregroundGrey">{pesan.length}/600</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onBatal ? (
            <Button type="button" variant="ghost" onClick={onBatal}>{t("landing.rating.batal")}</Button>
          ) : null}
          <Button type="submit" variant="default">{t("landing.rating.kirim")}</Button>
        </div>
      </div>

      <section aria-labelledby="ulasan-survei-judul" className="space-y-4 lg:pt-1">
        <h2 id="ulasan-survei-judul" className="font-sans text-base font-semibold text-foreground">
          {t("landing.rating.beriTahuSelengkapnya")}
        </h2>
        <div className="space-y-4">
          {pertanyaanSurvei.map((pertanyaan) => (
            <KartuPertanyaanSurvei
              key={pertanyaan.id}
              id={pertanyaan.id}
              pertanyaan={pertanyaan.teks}
              nilai={jawabanSurvei[pertanyaan.id]}
              opsi={opsiSurvei}
              onPilih={(nilai) => setJawabanSurvei((sebelumnya) => ({
                ...sebelumnya,
                [pertanyaan.id]: nilai,
              }))}
            />
          ))}
        </div>
      </section>
    </form>
  );
}
