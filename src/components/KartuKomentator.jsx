import { useEffect, useMemo, useState } from "react";
import { MessageSquareText } from "lucide-react";
import RatingSVG from "../halaman/Analisa/komponen/svg/rating.jsx";
import {
  GAYA_KOMENTATOR,
  KUNCI_GAYA,
  KUNCI_NYALA,
  isiNamaBidak,
  rapikanKalimat,
  susunKomentar,
} from "../lib/komentator.js";

/**
 * Kartu "Komentator" — panel komentar langsung di Papan Interaktif.
 *
 * Menerima `fakta` (hasil faktaLangkah) untuk langkah terakhir yang sedang
 * ditampilkan, penilaian engine bila ada, lalu menyusun kalimatnya lewat
 * mesin komentator (src/lib/komentator.js) + kamus terjemahan. Tidak ada
 * teks yang dibekukan: ganti bahasa → kalimat ikut berganti seketika.
 *
 * Preferensi (nyala/mati, gaya) disimpan di localStorage agar pengunjung
 * tidak perlu mengatur ulang tiap kali membuka papan.
 */

function bacaSimpanan(kunci, bawaan) {
  try {
    const nilai = localStorage.getItem(kunci);
    return nilai === null ? bawaan : nilai;
  } catch {
    return bawaan;
  }
}

function tulisSimpanan(kunci, nilai) {
  try {
    localStorage.setItem(kunci, nilai);
  } catch {
    /* mode privat / kuota penuh — abaikan */
  }
}

/** Hook preferensi komentator (nyala + gaya), dipakai kartu dan pemanggilnya. */
export function gunakanPreferensiKomentator() {
  const [nyala, setNyalaState] = useState(() => bacaSimpanan(KUNCI_NYALA, "1") !== "0");
  const [gaya, setGayaState] = useState(() => {
    const g = bacaSimpanan(KUNCI_GAYA, "santai");
    return GAYA_KOMENTATOR.includes(g) ? g : "santai";
  });
  const setNyala = (v) => {
    setNyalaState(v);
    tulisSimpanan(KUNCI_NYALA, v ? "1" : "0");
  };
  const setGaya = (g) => {
    if (!GAYA_KOMENTATOR.includes(g)) return;
    setGayaState(g);
    tulisSimpanan(KUNCI_GAYA, g);
  };
  return { nyala, setNyala, gaya, setGaya };
}

/**
 * @param {object} p
 * @param {Array<{kunci:string, ganti?:object}>|null} [p.segmen]
 *        Daftar kunci kalimat yang SUDAH disusun pemanggil (mis. halaman
 *        Teka-Teki lewat susunKomentarTekaTeki). Bila diberikan, `fakta` &
 *        opsi engine di bawah diabaikan — kartu hanya menerjemahkan.
 * @param {string|null} [p.ikon]         paksa ikon rating tertentu (mode segmen)
 * @param {object|null} p.fakta          hasil faktaLangkah() untuk langkah terakhir
 * @param {string|null} p.rating         label penilaian (book/best/blunder/…)
 * @param {object|null} p.evalSesudah    { cpPutih, matePutih } posisi saat ini
 * @param {string|null} p.namaPembukaan  nama pembukaan bila masih di buku
 * @param {string|null} p.saranTerbaik   SAN saran engine pada posisi SEBELUM langkah
 * @param {boolean} p.engineNyala
 * @param {boolean} p.engineMenilai      engine menyala tapi eval belum siap
 * @param {boolean} p.posisiAwal         belum ada langkah
 * @param {boolean} p.nyala
 * @param {(v: boolean) => void} p.setNyala
 * @param {string} p.gaya
 * @param {(g: string) => void} p.setGaya
 * @param {(k: string, ganti?: object) => string} p.t
 */
export default function KartuKomentator({
  segmen = null,
  ikon = null,
  fakta = null,
  rating = null,
  evalSesudah = null,
  namaPembukaan = null,
  saranTerbaik = null,
  engineNyala = false,
  engineMenilai = false,
  posisiAwal = false,
  nyala,
  setNyala,
  gaya,
  setGaya,
  t,
  className = "mt-3 border-b border-[#312e2b] pb-3",
  hanyaKontrol = false,
  sembunyikanKontrol = false,
}) {
  const kalimat = useMemo(() => {
    if (!nyala) return "";
    const daftar =
      segmen ||
      (fakta
        ? susunKomentar({
            fakta,
            gaya,
            rating,
            evalSesudah,
            namaPembukaan,
            saranTerbaik,
            engineNyala,
          })
        : []);
    return rapikanKalimat(
      daftar.map(({ kunci, ganti }) => isiNamaBidak(t(kunci, ganti), t)).join(" ")
    );
  }, [nyala, segmen, fakta, gaya, rating, evalSesudah, namaPembukaan, saranTerbaik, engineNyala, t]);

  // Animasi "muncul" ringan tiap kalimat berganti — cukup memberi kesan hidup
  // tanpa memindahkan tata letak.
  const [kunciAnimasi, setKunciAnimasi] = useState(0);
  useEffect(() => {
    setKunciAnimasi((k) => k + 1);
  }, [kalimat]);

  const ikonRating = ikon || (rating && rating !== "forced" ? rating : null);

  return (
    <section aria-label={t("papan.komentator.judul")} className={className}>
      {!sembunyikanKontrol && <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={nyala}
            onClick={() => setNyala(!nyala)}
            className={`flex h-5 w-9 shrink-0 items-center rounded-full border transition ${
              nyala ? "border-[#81b64c] bg-[#81b64c]" : "border-[#363431] bg-[#363431]"
            }`}
            aria-label={nyala ? t("papan.komentator.matikan") : t("papan.komentator.nyalakan")}
            title={nyala ? t("papan.komentator.matikan") : t("papan.komentator.nyalakan")}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                nyala ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <p className="flex min-w-0 items-center gap-1.5 text-sm font-bold leading-none text-white">
            <MessageSquareText className="h-4 w-4 shrink-0 text-[#81b64c]" aria-hidden="true" />
            <span className="truncate">{t("papan.komentator.judul")}</span>
          </p>
        </div>

        {nyala && (
          <div
            role="radiogroup"
            aria-label={t("papan.komentator.gayaLabel")}
            className="flex shrink-0 items-center rounded-md border border-[#312e2b] bg-[#262421] p-0.5 text-[11px] font-semibold"
          >
            {GAYA_KOMENTATOR.map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={gaya === g}
                onClick={() => setGaya(g)}
                className={`rounded px-2 py-0.5 transition ${
                  gaya === g ? "bg-[#81b64c] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {t(g === "santai" ? "papan.komentator.gayaSantai" : "papan.komentator.gayaFormal")}
              </button>
            ))}
          </div>
        )}
      </div>}

      {!hanyaKontrol && nyala && (
        <div
          key={kunciAnimasi}
          className="komentator-gelembung mt-3 flex items-start gap-2.5 rounded-lg border border-[#312e2b] bg-[#262421] px-3 py-2.5"
          aria-live="polite"
        >
          {ikonRating ? (
            <span className="mt-0.5 shrink-0" title={t(`analisa.penilaian.${ikonRating}`)}>
              <RatingSVG rating={ikonRating} size={20} />
            </span>
          ) : (
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#81b64c]/20 text-[11px]"
              aria-hidden="true"
            >
              🎙️
            </span>
          )}
          <p className="m-0 min-w-0 text-[13px] leading-5 text-gray-200">
            {posisiAwal ? t("papan.komentator.posisiAwal") : kalimat || t("papan.komentator.menunggu")}
            {!posisiAwal && engineMenilai && (
              <span className="ml-1 text-xs italic text-gray-500">{t("papan.komentator.menilai")}</span>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
