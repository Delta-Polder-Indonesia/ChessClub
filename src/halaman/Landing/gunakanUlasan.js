/**
 * Hook useUlasan — penyimpanan + state daftar ulasan rating.
 *
 * Dipakai bersama di tiga tempat agar ulasan user tamu konsisten:
 *   1. RatingUlasan.jsx (blok di Landing — hero + agregat + carousel)
 *   2. HalamanTulisUlasan (/tulis-ulasan)
 *   3. HalamanSemuaUlasan (/rating-ulasan)
 *
 * Mekanisme sinkronisasi: gunakan event 'storage' (lintas tab) dan
 * CustomEvent 'kci-ulasan-updated' (lintas komponen di tab yang sama)
 * agar ulasan yang dikirim dari halaman /tulis-ulasan otomatis tampil
 * di Landing dan halaman Semua Ulasan tanpa reload.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";

const KUNCI_SIMPAN = "kci-ulasan-tamu";

/* ---------- data seed awal (muncul saat kunjungan pertama) ---------- */
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

function bacaDariPenyimpanan(seed) {
  try {
    const mentah = globalThis.localStorage?.getItem(KUNCI_SIMPAN);
    if (mentah) {
      const data = JSON.parse(mentah);
      if (Array.isArray(data)) return data;
    }
  } catch {
    /* rusak — pakai seed */
  }
  return seed;
}
function simpanKePenyimpanan(daftar) {
  try {
    globalThis.localStorage?.setItem(KUNCI_SIMPAN, JSON.stringify(daftar));
  } catch {
    /* kuota — abaikan */
  }
}

/** Panggil saat daftar ulasan berubah agar semua subscriber sinkron. */
function siarkanPerubahan() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("kci-ulasan-updated"));
}

export function useUlasan() {
  const { t } = useI18n();
  const seed = useMemo(() => dataAwal(t), [t]);
  const [ulasan, setUlasan] = useState(() => bacaDariPenyimpanan(seed));
  // Cermin daftar terkini untuk dipakai sinkron di tambah/vote: event
  // 'kci-ulasan-updated' didengar hook ini sendiri, jadi penyimpanan
  // harus ditulis DULU sebelum event disiarkan — kalau tidak, pendengar
  // membaca data lama dan menimpa perubahan yang baru saja dibuat
  // (klik jempul/kirim ulasan tampak tidak berpengaruh).
  const ulasanRef = useRef(ulasan);
  ulasanRef.current = ulasan;

  // Refresh jika seed berubah (ganti bahasa) dan user belum menambah ulasan.
  useEffect(() => {
    setUlasan((prev) => (prev.some((u) => u.tamu) ? prev : seed));
  }, [seed]);

  // Persist ke localStorage saat daftar berubah + siarkan event.
  useEffect(() => {
    simpanKePenyimpanan(ulasan);
  }, [ulasan]);

  // Dengarkan perubahan dari komponen/tab lain.
  useEffect(() => {
    const sinkron = () => setUlasan(bacaDariPenyimpanan(seed));
    window.addEventListener("kci-ulasan-updated", sinkron);
    window.addEventListener("storage", sinkron);
    return () => {
      window.removeEventListener("kci-ulasan-updated", sinkron);
      window.removeEventListener("storage", sinkron);
    };
  }, [seed]);

  const tambah = useCallback((u) => {
    const baru = {
      id: crypto.randomUUID ? crypto.randomUUID() : `u-${Date.now()}`,
      suka: 0,
      tidakSuka: 0,
      tamu: true,
      ts: Date.now(),
      ...u,
    };
    const berikut = [baru, ...ulasanRef.current];
    simpanKePenyimpanan(berikut);
    setUlasan(berikut);
    siarkanPerubahan();
    return baru;
  }, []);

  const vote = useCallback((id, arah) => {
    const berikut = ulasanRef.current.map((u) => {
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
    });
    simpanKePenyimpanan(berikut);
    setUlasan(berikut);
    siarkanPerubahan();
  }, []);

  const urut = useMemo(() => {
    return [...ulasan].sort((a, b) => {
      if (a.tamu && !b.tamu) return -1;
      if (!a.tamu && b.tamu) return 1;
      return b.ts - a.ts;
    });
  }, [ulasan]);

  const total = ulasan.length;
  const rata = total ? ulasan.reduce((a, u) => a + u.bintang, 0) / total : 0;

  return { ulasan, urut, total, rata, tambah, vote };
}
