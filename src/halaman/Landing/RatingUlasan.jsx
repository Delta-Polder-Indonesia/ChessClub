/**
 * Rating & Ulasan — agregat bintang, tombol "tulis ulasan" yang membuka
 * form emoji + teks, dan daftar kartu ulasan (avatar/nama/bintang/tanggal/
 * pesan/tombol bermanfaat).
 *
 * Dirancang untuk user TAMU di Landing — tidak perlu login. Ulasan yang
 * ditulis disimpan di localStorage (kunci `kci-ulasan`) agar tetap ada
 * saat halaman dibuka ulang; seed data 3 ulasan awal (dari Testimoni lama)
 * supaya blok tidak kosong saat kunjungan pertama.
 *
 * Pola interaksi mengikuti c-rating-4 (bintang interaktif), c-rating-9
 * (pilih emoji pengalaman), dan c-rating-6 (ringkasan distribusi +
 * progress bar) tapi disesuaikan ke token desain KCI (border-2, rounded-lg,
 * bg-paper/-backgroundBox, warna primary, tanpa lib tambahan).
 */
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/button.jsx";
import { Progress, ProgressTrack, ProgressIndicator } from "../../components/ui/progress.jsx";
import { Separator } from "../../components/ui/separator.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { JUDUL_SEKSI, KEPALA_SEKSI } from "./gayaTeks.jsx";

const KUNCI_SIMPAN = "kci-ulasan-tamu";

/* ---------- ikon bintang (padat & kosong) ---------- */
function Bintang({ padat = false, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill={padat ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={padat ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.8l-5.9 2.8 1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
    </svg>
  );
}

/* ---------- ikon jempol (naik & turun) ---------- */
function Jempol({ arah = "naik", aktif = false, className = "" }) {
  const rotasi = arah === "turun" ? "rotate-180" : "";
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${rotasi} ${className}`}
      fill={aktif ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 9 4-7h3l-1 7h9l-2 13H7zM2 9h5v13H2z" />
    </svg>
  );
}

/* ---------- inisial avatar (lingkaran huruf) ---------- */
function Inisial({ nama }) {
  const huruf = (nama || "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="flex size-10 flex-none items-center justify-center rounded-full border-2 border-primary bg-background font-sans text-sm font-semibold text-primary"
    >
      {huruf}
    </span>
  );
}

/* ---------- bintang statis / interaktif ---------- */
function DeretBintang({ nilai, ukuran = "md", onPilih, bisaUbah = false }) {
  const max = 5;
  const ukuranCls =
    ukuran === "sm" ? "size-4" : ukuran === "lg" ? "size-7" : "size-5";
  return (
    <div
      className={`inline-flex items-center ${bisaUbah ? "gap-1" : "gap-0.5"} text-yellow-400`}
      role={bisaUbah ? "radiogroup" : "img"}
      aria-label={`${nilai} dari 5 bintang`}
    >
      {Array.from({ length: max }, (_, i) => {
        const bintangKe = i + 1;
        const padat = bintangKe <= Math.round(nilai);
        if (!bisaUbah) {
          return <Bintang key={bintangKe} padat={padat} className={ukuranCls} />;
        }
        return (
          <button
            key={bintangKe}
            type="button"
            role="radio"
            aria-checked={nilai === bintangKe}
            aria-label={`${bintangKe} bintang`}
            onClick={() => onPilih?.(bintangKe)}
            className={`rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
          >
            <Bintang padat={bintangKe <= nilai} className={ukuranCls} />
          </button>
        );
      })}
    </div>
  );
}

/* ---------- ringkasan agregat (skor besar + distribusi) ---------- */
function Ringkasan({ t, ulasan }) {
  const total = ulasan.length;
  const rata = total
    ? ulasan.reduce((a, u) => a + u.bintang, 0) / total
    : 0;
  const distribusi = useMemo(() => {
    const baris = [5, 4, 3, 2, 1].map((b) => {
      const hitung = ulasan.filter((u) => u.bintang === b).length;
      const persen = total ? Math.round((hitung / total) * 100) : 0;
      return { bintang: b, count: hitung, percentage: persen };
    });
    return baris;
  }, [ulasan, total]);

  return (
    <div className="rounded-lg border-2 border-border bg-backgroundBox p-5 md:p-6">
      <div className="flex flex-col items-center gap-2">
        <span className="font-sans text-3xl font-semibold text-foreground">
          {rata.toFixed(1)}
        </span>
        <DeretBintang nilai={rata} ukuran="sm" />
        <span className="font-sans text-xs text-foregroundGrey">
          {t("landing.rating.berdasarkan", { n: total })}
        </span>
      </div>
      <Separator className="my-4" />
      <div className="space-y-2">
        {distribusi.map((row) => (
          <div key={row.bintang} className="flex items-center gap-3 text-sm">
            <span className="w-3 text-right font-sans text-xs text-foregroundGrey">
              {row.bintang}
            </span>
            <Progress
              value={row.percentage}
              className="flex-1 items-center"
            >
              <ProgressTrack className="h-1.5 flex-1 rounded border-0 bg-grey-200">
                <ProgressIndicator className="bg-yellow-400" />
              </ProgressTrack>
            </Progress>
            <span className="w-7 text-right font-sans text-xs text-foregroundGrey tabular-nums">
              {row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- emoji picker (c-rating-9) ---------- */
const EMOJI_LIST = (t) => [
  { value: 1, emoji: "😞", label: t("landing.rating.emoji1") },
  { value: 2, emoji: "😕", label: t("landing.rating.emoji2") },
  { value: 3, emoji: "😐", label: t("landing.rating.emoji3") },
  { value: 4, emoji: "😊", label: t("landing.rating.emoji4") },
  { value: 5, emoji: "🤩", label: t("landing.rating.emoji5") },
];

/* ---------- format waktu relatif ---------- */
function waktuRelatif(ts, t) {
  const detik = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (detik < 60) return t("landing.rating.baruSaja");
  const menit = Math.floor(detik / 60);
  if (menit < 60) return t("landing.rating.yangLalu", { n: menit, satuan: t("landing.rating.menit") });
  const jam = Math.floor(menit / 60);
  if (jam < 24) return t("landing.rating.yangLalu", { n: jam, satuan: t("landing.rating.jam") });
  const hari = Math.floor(jam / 24);
  if (hari < 30) return t("landing.rating.yangLalu", { n: hari, satuan: t("landing.rating.hari") });
  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return t("landing.rating.yangLalu", { n: bulan, satuan: t("landing.rating.bulan") });
  const tahun = Math.floor(bulan / 12);
  return t("landing.rating.yangLalu", { n: tahun, satuan: t("landing.rating.tahun") });
}

function tanggalPanjang(ts, locale) {
  try {
    return new Date(ts).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return new Date(ts).toISOString().slice(0, 10);
  }
}

/* ---------- form tulis ulasan ---------- */
function FormUlasan({ t, onKirim, onBatal }) {
  const [bintang, setBintang] = useState(0);
  const [emoji, setEmoji] = useState(null);
  const [nama, setNama] = useState("");
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState(null);
  const daftarEmoji = EMOJI_LIST(t);

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
      className="space-y-5 rounded-lg border-2 border-border bg-paper p-5 md:p-6"
    >
      {/* langkah 1: bintang */}
      <div className="space-y-2">
        <label className="block font-sans text-sm font-semibold text-foreground">
          {t("landing.rating.beriBintang")}
        </label>
        <DeretBintang
          nilai={bintang}
          ukuran="lg"
          bisaUbah
          onPilih={(n) => {
            setBintang(n);
            setEmoji(n);
            setError(null);
          }}
        />
      </div>

      {/* langkah 2: emoji pengalaman */}
      <div className="space-y-2">
        <p className="font-sans text-sm font-medium text-foreground">
          {t("landing.rating.bagaimanaPengalaman")}
        </p>
        <div className="flex flex-wrap gap-2">
          {daftarEmoji.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setEmoji(item.value);
                setBintang(item.value);
                setError(null);
              }}
              className={`flex size-11 items-center justify-center rounded-lg border-2 text-2xl transition-all ${
                (emoji ?? bintang) === item.value
                  ? "scale-110 border-border bg-backgroundBox"
                  : "border-transparent hover:bg-backgroundBox"
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

      {/* langkah 3: nama (opsional) */}
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
          className="w-full rounded-lg border-2 border-input bg-transparent px-3 py-2 font-sans text-sm outline-none placeholder:text-foregroundGrey focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
          onChange={(e) => {
            setPesan(e.target.value);
            setError(null);
          }}
          rows={4}
          maxLength={600}
          placeholder={t("landing.rating.pesanPlaceholder")}
        />
        <p className="text-right font-sans text-xs text-foregroundGrey">
          {pesan.length}/600
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded border-2 border-destructive/40 bg-destructive/10 px-3 py-2 font-sans text-sm text-destructive">
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

/* ---------- kartu ulasan satu per satu ---------- */
function KartuUlasan({ t, locale, ulasan: u, padaVote }) {
  const emojiFor = EMOJI_LIST(t).find((e) => e.value === (u.emoji ?? u.bintang));
  return (
    <article className="flex flex-col gap-3 rounded-lg border-2 border-border bg-paper p-5">
      <header className="flex items-start gap-3">
        <Inisial nama={u.nama} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-sans text-sm font-semibold text-foreground">
              {u.nama}
            </span>
            {emojiFor ? <span aria-hidden="true">{emojiFor.emoji}</span> : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <DeretBintang nilai={u.bintang} ukuran="sm" />
            <time
              dateTime={new Date(u.ts).toISOString()}
              title={tanggalPanjang(u.ts, locale)}
              className="font-sans text-xs text-foregroundGrey"
            >
              {waktuRelatif(u.ts, t)}
            </time>
          </div>
        </div>
      </header>

      <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
        {u.pesan}
      </p>

      <footer className="flex items-center gap-2 border-t border-border pt-3">
        <span className="mr-auto font-sans text-xs text-foregroundGrey">
          {t("landing.rating.apakahMembantu")}
        </span>
        <button
          type="button"
          onClick={() => padaVote(u.id, "naik")}
          aria-pressed={u.sayaSuka === true}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-sans text-xs transition-colors ${
            u.sayaSuka
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-foregroundGrey hover:bg-backgroundBox"
          }`}
          aria-label={t("landing.rating.suka")}
        >
          <Jempol arah="naik" aktif={u.sayaSuka} className="size-4" />
          <span className="tabular-nums">{u.suka}</span>
        </button>
        <button
          type="button"
          onClick={() => padaVote(u.id, "turun")}
          aria-pressed={u.sayaSuka === false}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-sans text-xs transition-colors ${
            u.sayaSuka === false
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border text-foregroundGrey hover:bg-backgroundBox"
          }`}
          aria-label={t("landing.rating.tidakSuka")}
        >
          <Jempol arah="turun" aktif={u.sayaSuka === false} className="size-4" />
          <span className="tabular-nums">{u.tidakSuka}</span>
        </button>
      </footer>
    </article>
  );
}

/* ---------- data seed dari 3 testimoni lama + beberapa rating agar distribusi hidup ---------- */
function dataAwal(t) {
  const now = Date.now();
  const hr = 3600 * 1000;
  const hri = 24 * hr;
  return [
    {
      id: "seed-1",
      nama: t("landing.testimoniLeadNama"),
      bintang: 5,
      emoji: 5,
      pesan: t("landing.testimoniLeadKutip"),
      ts: now - 6 * hri,
      suka: 14,
      tidakSuka: 0,
    },
    {
      id: "seed-2",
      nama: t("landing.testimoniKutip1Nama"),
      bintang: 5,
      emoji: 5,
      pesan: t("landing.testimoniKutip1Kutip"),
      ts: now - 2 * hri,
      suka: 9,
      tidakSuka: 1,
    },
    {
      id: "seed-3",
      nama: t("landing.testimoniKutip2Nama"),
      bintang: 4,
      emoji: 4,
      pesan: t("landing.testimoniKutip2Kutip"),
      ts: now - 12 * hri,
      suka: 7,
      tidakSuka: 0,
    },
    {
      id: "seed-4",
      nama: "Dimas P.",
      bintang: 5,
      emoji: 5,
      pesan: t("landing.rating.seed4"),
      ts: now - 3 * hri,
      suka: 4,
      tidakSuka: 0,
    },
    {
      id: "seed-5",
      nama: "Aulia S.",
      bintang: 4,
      emoji: 4,
      pesan: t("landing.rating.seed5"),
      ts: now - 5 * hri,
      suka: 2,
      tidakSuka: 0,
    },
    {
      id: "seed-6",
      nama: "Rendi H.",
      bintang: 5,
      emoji: 5,
      pesan: t("landing.rating.seed6"),
      ts: now - 1 * hri,
      suka: 3,
      tidakSuka: 0,
    },
  ];
}

/* ---------- baca tulis localStorage (aman saat SSR/privat) ---------- */
function bacaUlasan(seed) {
  try {
    const mentah = globalThis.localStorage?.getItem(KUNCI_SIMPAN);
    if (mentah) {
      const data = JSON.parse(mentah);
      if (Array.isArray(data)) return data;
    }
  } catch {
    /* rusak / tak tersedia — pakai seed */
  }
  return seed;
}
function simpanUlasan(daftar) {
  try {
    globalThis.localStorage?.setItem(KUNCI_SIMPAN, JSON.stringify(daftar));
  } catch {
    /* kuota penuh atau privat mode — abaikan */
  }
}

/* ---------- toast ringan (tanpa lib) ---------- */
function Toast({ terbuka, pesan, onTutup }) {
  useEffect(() => {
    if (!terbuka) return;
    const id = setTimeout(onTutup, 2600);
    return () => clearTimeout(id);
  }, [terbuka, onTutup]);
  if (!terbuka) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border-2 border-primary bg-primary px-4 py-2 font-sans text-sm font-medium text-white shadow-lg"
    >
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

  // Saat seed berganti (ganti bahasa) dan user belum pernah menambah ulasan,
  // refresh ulasan seed supaya teks tampil dalam bahasa yang dipilih.
  useEffect(() => {
    setUlasan((prev) => {
      const punyaUlasanTamu = prev.some((u) => u.tamu);
      if (punyaUlasanTamu) return prev;
      return seed;
    });
  }, [seed]);

  useEffect(() => {
    simpanUlasan(ulasan);
  }, [ulasan]);

  const kirimUlasan = useCallback(
    (u) => {
      setUlasan((prev) => [u, ...prev]);
      setFormTerbuka(false);
      setToast(t("landing.rating.terkirim", { n: u.bintang }));
    },
    [t]
  );

  const vote = useCallback((id, arah) => {
    setUlasan((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const sebelumnya = u.sayaSuka; // true/ false / undefined
        let suka = u.suka;
        let tidakSuka = u.tidakSuka;
        let sayaSuka;
        if (arah === "naik") {
          sayaSuka = sebelumnya === true ? undefined : true;
        } else {
          sayaSuka = sebelumnya === false ? undefined : false;
        }
        // sesuaikan hitungan
        if (sebelumnya === true) suka -= 1;
        if (sebelumnya === false) tidakSuka -= 1;
        if (sayaSuka === true) suka += 1;
        if (sayaSuka === false) tidakSuka += 1;
        return { ...u, suka: Math.max(0, suka), tidakSuka: Math.max(0, tidakSuka), sayaSuka };
      })
    );
  }, []);

  const urut = useMemo(
    () =>
      [...ulasan].sort((a, b) => {
        // ulasan tamu (yang baru ditulis pengguna) paling atas, lalu terbaru
        if (a.tamu && !b.tamu) return -1;
        if (!a.tamu && b.tamu) return 1;
        return b.ts - a.ts;
      }),
    [ulasan]
  );

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">
        <div className={KEPALA_SEKSI}>
          <h2 className={JUDUL_SEKSI}>{t("landing.rating.judul")}</h2>
          <p className="max-w-xl font-sans text-sm leading-relaxed text-foregroundGrey md:text-base">
            {t("landing.rating.subJudul")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[minmax(260px,320px)_1fr] md:gap-10">
          {/* kolom kiri: agregat + CTA */}
          <div className="flex flex-col gap-4">
            <Ringkasan t={t} ulasan={ulasan} />

            {!formTerbuka ? (
              <Button
                onClick={() => setFormTerbuka(true)}
                variant="default"
                size="lg"
                className="w-full border-primary bg-primary text-white hover:bg-primary/90 hover:text-white"
              >
                {t("landing.rating.tulisUlasan")}
              </Button>
            ) : null}

            <p className="font-sans text-xs leading-relaxed text-foregroundGrey">
              {t("landing.rating.verifikasi")}
            </p>
          </div>

          {/* kolom kanan: form / daftar ulasan */}
          <div className="flex flex-col gap-4">
            {formTerbuka ? (
              <FormUlasan
                t={t}
                onKirim={kirimUlasan}
                onBatal={() => setFormTerbuka(false)}
              />
            ) : null}
            {urut.map((u) => (
              <KartuUlasan
                key={u.id}
                t={t}
                locale={locale}
                ulasan={u}
                padaVote={vote}
              />
            ))}
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <Toast
          terbuka={!!toast}
          pesan={toast || ""}
          onTutup={() => setToast(null)}
        />
      </Suspense>
    </section>
  );
}
