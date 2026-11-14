/**
 * Rating & Ulasan — tata letak meniru blok "Beri rating aplikasi ini"
 * Google Play Store (versi ringan, disesuaikan token desain KCI):
 *
 *   1. Hero polos (tanpa kotak): judul "Beri rating aplikasi ini" + sub
 *      "Sampaikan pendapat Anda" + bintang interaktif besar (outline
 *      default, terisi kuning saat dipilih) + tautan teks "Tulis ulasan".
 *   2. Kepala seksi "Rating dan ulasan" dengan tombol panah-kanan
 *      (bundar) + paragraf verifikasi dengan ikon ⓘ.
 *   3. Ringkasan mendatar: kiri = skor besar (4,8) + deret bintang
 *      (dukung bintang pecahan untuk skor rata-rata) + jumlah ulasan
 *      terformat ribuan; kanan = baris distribusi 5→1 dengan progress
 *      bar (tanpa angka hitung di kanan, sesuai referensi).
 *   4. Daftar kartu ulasan penuh-lebar: avatar isi berwarna (tak berbingkai,
 *      putih di atas warna primer/acak), nama + menu ⋮, bintang + tanggal
 *      DD/MM/YY + pil "n minggu yang lalu", pesan (line-clamp), dan bar
 *      "Apakah ulasan ini membantu?" dengan jempol-naik+angka dan
 *      jempol-turun ikon polos (tanpa angka).
 *
 * Penyimpanan: localStorage (`kci-ulasan-tamu`) — ulasan tamu + status vote
 * persisten per perangkat. Seed awal 6 ulasan (3 dari Testimoni lama + 3
 * tambahan) agar distribusi tak kosong saat kunjungan pertama.
 */
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { useI18n } from "../../lib/i18n.jsx";

/**
 * Batang distribusi rating inline (tidak pakai komponen Progress shadcn
 * yang otomatis menambah track+indicator sendiri, sebab sebelumnya
 * menyebabkan bar ter-render ganda). Track = abu, indicator = kuning.
 */
function BarDistribusi({ persen }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-grey-200">
      <div
        className="h-full rounded-full bg-yellow-400 transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, persen))}%` }}
      />
    </div>
  );
}

const KUNCI_SIMPAN = "kci-ulasan-tamu";

/* ---------- ikon-ikon kecil ---------- */
function BintangOutline({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill="none" stroke="currentColor" strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.8l-5.9 2.8 1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
    </svg>
  );
}
function BintangPadat({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill="currentColor">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.8l-5.9 2.8 1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
    </svg>
  );
}
/** Ikon info ⓘ (lingkaran dengan huruf i) */
function IkonInfo({ className = "" }) {
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
/** Panah kanan (bundar) */
function PanahKanan({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
/** Tiga titik vertikal (menu lainnya) */
function TigaTitik({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}
      fill="currentColor">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}
function Jempol({ arah = "naik", aktif = false, className = "" }) {
  const rotasi = arah === "turun" ? "rotate-180" : "";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"
      className={`${rotasi} ${className}`}
      fill={aktif ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 9 4-7h3l-1 7h9l-2 13H7zM2 9h5v13H2z" />
    </svg>
  );
}

/* ---------- angka dengan pemisah ribuan gaya Indonesia ---------- */
function formatRibuan(n, locale) {
  try {
    return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US").format(n);
  } catch {
    return String(n);
  }
}
/** Tanggal DD/MM/YY (contoh: 05/11/26) */
function formatTanggalSingkat(ts) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/* ---------- palet warna avatar (dipilih deterministik dari nama) ---------- */
const WARNA_AVATAR = [
  "bg-purple-600 text-white",
  "bg-emerald-600 text-white",
  "bg-rose-600 text-white",
  "bg-amber-500 text-white",
  "bg-sky-600 text-white",
  "bg-indigo-600 text-white",
  "bg-teal-600 text-white",
  "bg-pink-600 text-white",
];
function warnaUntuk(nama) {
  let hash = 0;
  for (let i = 0; i < (nama || "").length; i++) {
    hash = (hash * 31 + nama.charCodeAt(i)) >>> 0;
  }
  return WARNA_AVATAR[hash % WARNA_AVATAR.length];
}

/* ---------- avatar lingkaran isi berwarna (tanpa bingkai) ---------- */
function Avatar({ nama }) {
  const huruf = (nama || "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 1)
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={`flex size-11 flex-none items-center justify-center rounded-full font-sans text-base font-semibold ${warnaUntuk(nama)}`}
    >
      {huruf}
    </span>
  );
}

/* ---------- deret bintang (dukung nilai pecahan untuk ringkasan) ---------- */
/**
 * @param {number} nilai - nilai 0..5 (bisa pecahan untuk ringkasan)
 * @param {boolean} bisaUbah - jadikan radio button interaktif (nilai dianggap bulat)
 * @param {'sm'|'md'|'lg'|'xl'} ukuran
 */
function DeretBintang({ nilai, ukuran = "md", onPilih, bisaUbah = false }) {
  const ukuranCls =
    ukuran === "sm" ? "size-4"
      : ukuran === "lg" ? "size-6"
        : ukuran === "xl" ? "size-11"
          : "size-5";
  const gapCls = bisaUbah ? (ukuran === "xl" ? "gap-1.5" : "gap-0.5") : "gap-0.5";

  if (bisaUbah) {
    const bulat = Math.round(nilai);
    return (
      <div className={`inline-flex items-center ${gapCls} text-yellow-400`}
        role="radiogroup" aria-label={`${bulat} dari 5 bintang`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={bulat === n}
            aria-label={`${n} bintang`}
            onClick={() => onPilih?.(n)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50"
          >
            {n <= nilai
              ? <BintangPadat className={ukuranCls} />
              : <BintangOutline className={ukuranCls} />}
          </button>
        ))}
      </div>
    );
  }

  // Statis: dukung pecahan — render bintang berlapis: outline selalu ada,
  // lalu bintang padat di dalam wadah dengan clip-path lebar = persen isi.
  const mak = Math.max(0, Math.min(5, nilai));
  return (
    <div className={`inline-flex items-center ${gapCls} text-yellow-400`}
      role="img" aria-label={`${nilai.toFixed(1)} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const isi = Math.max(0, Math.min(1, mak - (n - 1)));
        return (
          <span key={n} className="relative inline-block">
            <BintangOutline className={ukuranCls} />
            {isi > 0 && (
              <span className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ width: `${isi * 100}%` }}>
                <BintangPadat className={`${ukuranCls} shrink-0`}
                  style={{ width: "1em", height: "1em" }} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* ---------- emoji picker ---------- */
const EMOJI_LIST = (t) => [
  { value: 1, emoji: "😞", label: t("landing.rating.emoji1") },
  { value: 2, emoji: "😕", label: t("landing.rating.emoji2") },
  { value: 3, emoji: "😐", label: t("landing.rating.emoji3") },
  { value: 4, emoji: "😊", label: t("landing.rating.emoji4") },
  { value: 5, emoji: "🤩", label: t("landing.rating.emoji5") },
];

/* ---------- waktu relatif ---------- */
function waktuRelatif(ts, t) {
  const detik = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (detik < 60) return t("landing.rating.baruSaja");
  const menit = Math.floor(detik / 60);
  if (menit < 60) return t("landing.rating.yangLalu", { n: menit, satuan: t("landing.rating.menit") });
  const jam = Math.floor(menit / 60);
  if (jam < 24) return t("landing.rating.yangLalu", { n: jam, satuan: t("landing.rating.jam") });
  const hari = Math.floor(jam / 24);
  if (hari < 7) return t("landing.rating.yangLalu", { n: hari, satuan: t("landing.rating.hari") });
  const minggu = Math.floor(hari / 7);
  if (minggu < 5) return t("landing.rating.yangLalu", { n: minggu, satuan: t("landing.rating.minggu") });
  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return t("landing.rating.yangLalu", { n: bulan, satuan: t("landing.rating.bulan") });
  const tahun = Math.floor(bulan / 12);
  return t("landing.rating.yangLalu", { n: tahun, satuan: t("landing.rating.tahun") });
}

/* ---------- ringkasan agregat (skor + distribusi mendatar) ---------- */
function Ringkasan({ ulasan, locale }) {
  const total = ulasan.length;
  const rata = total ? ulasan.reduce((a, u) => a + u.bintang, 0) / total : 0;
  const distribusi = useMemo(() => {
    return [5, 4, 3, 2, 1].map((b) => {
      const hitung = ulasan.filter((u) => u.bintang === b).length;
      const persen = total ? Math.round((hitung / total) * 100) : 0;
      return { bintang: b, percentage: persen };
    });
  }, [ulasan, total]);

  // Angka desimal pakai koma untuk Indonesia, titik untuk Inggris
  const rataTeks = rata.toFixed(1).replace(".", locale === "id" ? "," : ".");

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
      {/* kiri: skor besar + bintang + jumlah */}
      <div className="flex flex-col items-center gap-1 md:min-w-[140px] md:items-start">
        <span className="font-sans text-5xl font-semibold leading-none text-foreground md:text-6xl">
          {rataTeks}
        </span>
        <DeretBintang nilai={rata} ukuran="md" />
        <span className="mt-0.5 font-sans text-sm text-foregroundGrey">
          {formatRibuan(total, locale)}
        </span>
      </div>

      {/* kanan: bar distribusi */}
      <div className="flex-1 space-y-2">
        {distribusi.map((row) => (
          <div key={row.bintang} className="flex items-center gap-2.5">
            <span className="w-3 text-right font-sans text-sm text-foregroundGrey">
              {row.bintang}
            </span>
            <BarDistribusi persen={row.percentage} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- form tulis ulasan ---------- */
function FormUlasan({ t, bintangAwal = 0, onKirim, onBatal }) {
  const [bintang, setBintang] = useState(bintangAwal);
  const [emoji, setEmoji] = useState(bintangAwal > 0 ? bintangAwal : null);
  const [nama, setNama] = useState("");
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState(null);
  const daftarEmoji = EMOJI_LIST(t);

  useEffect(() => {
    if (bintangAwal > 0) {
      setBintang(bintangAwal);
      setEmoji(bintangAwal);
    }
  }, [bintangAwal]);

  const pilihBintang = useCallback((n) => {
    setBintang(n);
    setEmoji(n);
    setError(null);
  }, []);

  const kirim = useCallback(
    (e) => {
      e.preventDefault();
      if (bintang < 1) {
        setError(t("landing.rating.pilihBintang"));
        return;
      }
      if (!pesan.trim()) {
        setError(t("landing.rating.tulisPesan"));
        return;
      }
      const ulasan = {
        id: crypto.randomUUID ? crypto.randomUUID() : `u-${Date.now()}`,
        nama: nama.trim() || t("landing.rating.tamu"),
        bintang,
        emoji: emoji ?? bintang,
        pesan: pesan.trim(),
        ts: Date.now(),
        suka: 0,
        tidakSuka: 0,
        tamu: true,
      };
      onKirim(ulasan);
    },
    [bintang, emoji, nama, pesan, onKirim, t]
  );

  return (
    <form
      onSubmit={kirim}
      className="space-y-5 rounded-2xl bg-paper p-5 md:p-6"
      id="form-ulasan"
    >
      {/* langkah 1: bintang */}
      <div className="space-y-2">
        <label className="block font-sans text-sm font-semibold text-foreground">
          {t("landing.rating.beriBintang")}
        </label>
        <DeretBintang nilai={bintang} ukuran="lg" bisaUbah onPilih={pilihBintang} />
      </div>

      {/* langkah 2: emoji */}
      <div className="space-y-2">
        <p className="font-sans text-sm font-medium text-foreground">
          {t("landing.rating.bagaimanaPengalaman")}
        </p>
        <div className="flex flex-wrap gap-2">
          {daftarEmoji.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => pilihBintang(item.value)}
              className={`flex size-11 items-center justify-center rounded-lg text-2xl transition-all ${
                (emoji ?? bintang) === item.value
                  ? "scale-110 bg-backgroundBox"
                  : "hover:bg-backgroundBox"
              }`}
              aria-label={item.label}
              title={item.label}
            >
              {item.emoji}
            </button>
          ))}
        </div>
        {emoji ? (
          <p className="font-sans text-sm text-foregroundGrey">
            {daftarEmoji.find((e) => e.value === emoji)?.label}
          </p>
        ) : null}
      </div>

      {/* langkah 3: nama */}
      <div className="space-y-1.5">
        <label htmlFor="ulasan-nama" className="block font-sans text-sm font-semibold text-foreground">
          {t("landing.rating.namaLabel")}{" "}
          <span className="font-normal text-foregroundGrey">
            ({t("landing.rating.opsional")})
          </span>
        </label>
        <input
          id="ulasan-nama"
          type="text"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          maxLength={40}
          placeholder={t("landing.rating.namaPlaceholder")}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-sans text-sm outline-none placeholder:text-foregroundGrey focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* langkah 4: pesan */}
      <div className="space-y-1.5">
        <label htmlFor="ulasan-pesan" className="block font-sans text-sm font-semibold text-foreground">
          {t("landing.rating.pesanLabel")}
        </label>
        <Textarea
          id="ulasan-pesan"
          value={pesan}
          onChange={(e) => { setPesan(e.target.value); setError(null); }}
          rows={4}
          maxLength={600}
          placeholder={t("landing.rating.pesanPlaceholder")}
        />
        <p className="text-right font-sans text-xs text-foregroundGrey">
          {pesan.length}/600
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 font-sans text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onBatal}>
          {t("landing.rating.batal")}
        </Button>
        <Button type="submit" variant="default">
          {t("landing.rating.kirim")}
        </Button>
      </div>
    </form>
  );
}

/* ---------- kartu ulasan tunggal ---------- */
function KartuUlasan({ t, ulasan: u, padaVote }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-paper p-5">
      <header className="flex items-start gap-3">
        <Avatar nama={u.nama} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate font-sans text-base font-semibold text-foreground">
              {u.nama}
            </span>
            <button
              type="button"
              aria-label={t("landing.rating.lainnya")}
              className="-mr-1 -mt-0.5 flex size-8 items-center justify-center rounded-full text-foregroundGrey transition-colors hover:bg-backgroundBox hover:text-foreground"
            >
              <TigaTitik className="size-5" />
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <DeretBintang nilai={u.bintang} ukuran="sm" />
            <span className="font-sans text-xs text-foregroundGrey" aria-hidden="true">•</span>
            <time
              dateTime={new Date(u.ts).toISOString()}
              className="font-sans text-xs text-foregroundGrey"
            >
              {formatTanggalSingkat(u.ts)}
            </time>
            <span className="rounded-full bg-grey-200 px-2 py-0.5 font-sans text-[11px] text-foregroundGrey">
              {waktuRelatif(u.ts, t)}
            </span>
          </div>
        </div>
      </header>

      <p className="line-clamp-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
        {u.pesan}
      </p>

      <footer className="flex items-center gap-3 pt-1">
        <span className="mr-auto font-sans text-sm text-foregroundGrey">
          {t("landing.rating.apakahMembantu")}
        </span>
        <button
          type="button"
          onClick={() => padaVote(u.id, "naik")}
          aria-pressed={u.sayaSuka === true}
          aria-label={t("landing.rating.suka")}
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-sans text-sm transition-colors ${
            u.sayaSuka
              ? "bg-primary/10 text-primary"
              : "text-foregroundGrey hover:bg-backgroundBox"
          }`}
        >
          <Jempol arah="naik" aktif={u.sayaSuka} className="size-5" />
          <span className="tabular-nums">{u.suka}</span>
        </button>
        <button
          type="button"
          onClick={() => padaVote(u.id, "turun")}
          aria-pressed={u.sayaSuka === false}
          aria-label={t("landing.rating.tidakSuka")}
          className={`flex size-8 items-center justify-center rounded-full transition-colors ${
            u.sayaSuka === false
              ? "bg-destructive/10 text-destructive"
              : "text-foregroundGrey hover:bg-backgroundBox"
          }`}
        >
          <Jempol arah="turun" aktif={u.sayaSuka === false} className="size-5" />
        </button>
      </footer>
    </article>
  );
}

/* ---------- seed data awal ---------- */
function dataAwal(t) {
  const now = Date.now();
  const hr = 3600 * 1000;
  const mgg = 7 * 24 * hr;
  return [
    {
      id: "seed-1",
      nama: t("landing.testimoniLeadNama"),
      bintang: 5,
      emoji: 5,
      pesan: t("landing.testimoniLeadKutip"),
      ts: now - 12 * mgg - 2 * hr,
      suka: 20,
      tidakSuka: 0,
    },
    {
      id: "seed-2",
      nama: t("landing.testimoniKutip1Nama"),
      bintang: 4,
      emoji: 4,
      pesan: t("landing.testimoniKutip1Kutip"),
      ts: now - 3 * mgg - 5 * hr,
      suka: 9,
      tidakSuka: 1,
    },
    {
      id: "seed-3",
      nama: t("landing.testimoniKutip2Nama"),
      bintang: 5,
      emoji: 5,
      pesan: t("landing.testimoniKutip2Kutip"),
      ts: now - 1 * mgg - 12 * hr,
      suka: 7,
      tidakSuka: 0,
    },
    {
      id: "seed-4",
      nama: "Dandy Chawnima",
      bintang: 4,
      emoji: 4,
      pesan: t("landing.rating.seed4"),
      ts: now - 1 * mgg - 3 * hr,
      suka: 20,
      tidakSuka: 0,
    },
    {
      id: "seed-5",
      nama: "Aulia S.",
      bintang: 4,
      emoji: 4,
      pesan: t("landing.rating.seed5"),
      ts: now - 5 * 24 * hr,
      suka: 2,
      tidakSuka: 0,
    },
    {
      id: "seed-6",
      nama: "Rendi H.",
      bintang: 5,
      emoji: 5,
      pesan: t("landing.rating.seed6"),
      ts: now - 2 * 24 * hr - 1 * hr,
      suka: 3,
      tidakSuka: 0,
    },
  ];
}

/* ---------- localStorage ---------- */
function bacaUlasan(seed) {
  try {
    const mentah = globalThis.localStorage?.getItem(KUNCI_SIMPAN);
    if (mentah) {
      const data = JSON.parse(mentah);
      if (Array.isArray(data)) return data;
    }
  } catch { /* rusak — pakai seed */ }
  return seed;
}
function simpanUlasan(daftar) {
  try { globalThis.localStorage?.setItem(KUNCI_SIMPAN, JSON.stringify(daftar)); }
  catch { /* kuota — abaikan */ }
}

/* ---------- toast ---------- */
function Toast({ terbuka, pesan, onTutup }) {
  useEffect(() => {
    if (!terbuka) return;
    const id = setTimeout(onTutup, 2400);
    return () => clearTimeout(id);
  }, [terbuka, onTutup]);
  if (!terbuka) return null;
  return (
    <div role="status" aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-2 font-sans text-sm font-medium text-paper shadow-lg">
      {pesan}
    </div>
  );
}

/* ---------- komponen utama ---------- */
export default function RatingUlasan() {
  const { t, locale } = useI18n();
  const seed = useMemo(() => dataAwal(t), [t]);
  const [ulasan, setUlasan] = useState(() => bacaUlasan(seed));
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [toast, setToast] = useState(null);
  const [bintangHero, setBintangHero] = useState(0);

  const pilihBintangHero = useCallback((n) => {
    setBintangHero((prev) => (prev === n ? 0 : n)); // klik ulang = batal
  }, []);

  const bukaForm = useCallback(() => {
    setFormTerbuka(true);
    requestAnimationFrame(() => {
      document.getElementById("form-ulasan")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    setUlasan((prev) => (prev.some((u) => u.tamu) ? prev : seed));
  }, [seed]);
  useEffect(() => { simpanUlasan(ulasan); }, [ulasan]);

  const kirimUlasan = useCallback((u) => {
    setUlasan((prev) => [u, ...prev]);
    setFormTerbuka(false);
    setBintangHero(0);
    setToast(t("landing.rating.terkirim", { n: u.bintang }));
  }, [t]);

  const vote = useCallback((id, arah) => {
    setUlasan((prev) => prev.map((u) => {
      if (u.id !== id) return u;
      const sebelumnya = u.sayaSuka;
      let suka = u.suka, tidakSuka = u.tidakSuka, sayaSuka;
      if (arah === "naik") sayaSuka = sebelumnya === true ? undefined : true;
      else sayaSuka = sebelumnya === false ? undefined : false;
      if (sebelumnya === true) suka -= 1;
      if (sebelumnya === false) tidakSuka -= 1;
      if (sayaSuka === true) suka += 1;
      if (sayaSuka === false) tidakSuka += 1;
      return { ...u, suka: Math.max(0, suka), tidakSuka: Math.max(0, tidakSuka), sayaSuka };
    }));
  }, []);

  const urut = useMemo(() => {
    return [...ulasan].sort((a, b) => {
      if (a.tamu && !b.tamu) return -1;
      if (!a.tamu && b.tamu) return 1;
      return b.ts - a.ts;
    });
  }, [ulasan]);

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">

        {/* 1. Hero polos: "Beri rating aplikasi ini" + bintang + "Tulis ulasan" */}
        <div className="flex flex-col items-start gap-3">
          <h3 className="font-sans text-xl font-semibold text-foreground md:text-2xl">
            {t("landing.rating.ajakJudul")}
          </h3>
          <p className="font-sans text-base text-foregroundGrey">
            {t("landing.rating.ajakSub")}
          </p>
          <DeretBintang
            nilai={bintangHero}
            ukuran="xl"
            bisaUbah
            onPilih={pilihBintangHero}
          />
          <button
            type="button"
            onClick={bukaForm}
            className="font-sans text-base font-medium text-primary transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:underline"
          >
            {t("landing.rating.tulisUlasan")}
          </button>
        </div>

        {/* 2. Kepala "Rating dan ulasan" + panah-kanan + paragraf verifikasi */}
        <div className="mt-10 flex items-center justify-between gap-3">
          <h2 className="font-sans text-xl font-semibold text-foreground md:text-2xl">
            {t("landing.rating.judul")}
          </h2>
          <button
            type="button"
            aria-label={t("landing.rating.lihatSemua")}
            className="flex size-10 items-center justify-center rounded-full bg-grey-200 text-foregroundGrey transition-colors hover:bg-grey-300 hover:text-foreground"
            onClick={() => {
              document.getElementById("daftar-ulasan")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <PanahKanan className="size-5" />
          </button>
        </div>
        <p className="mt-2 flex items-start gap-1.5 font-sans text-sm text-foregroundGrey">
          <IkonInfo className="mt-0.5 size-4 flex-none" />
          <span>{t("landing.rating.subJudul")}</span>
        </p>

        {/* 3. Ringkasan mendatar */}
        <div className="mt-5">
          <Ringkasan t={t} ulasan={ulasan} locale={locale} />
        </div>

        {/* 4. Form (jika terbuka) + daftar kartu ulasan */}
        <div id="daftar-ulasan" className="mt-6 flex flex-col gap-4">
          {formTerbuka ? (
            <FormUlasan
              t={t}
              bintangAwal={bintangHero}
              onKirim={kirimUlasan}
              onBatal={() => setFormTerbuka(false)}
            />
          ) : null}
            {urut.map((u) => (
              <KartuUlasan
                key={u.id}
                t={t}
                ulasan={u}
                padaVote={vote}
              />
            ))}
        </div>
      </div>

      <Suspense fallback={null}>
        <Toast terbuka={!!toast} pesan={toast || ""} onTutup={() => setToast(null)} />
      </Suspense>
    </section>
  );
}
