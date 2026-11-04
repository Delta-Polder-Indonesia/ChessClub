import { useEffect, useMemo, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Switch } from "./ui/switch.jsx";
import RatingSVG from "../halaman/Analisa/komponen/svg/rating.jsx";
import { berkasPublik } from "../lib/asets.js";
import {
  AVATAR_BUKU,
  GAYA_KOMENTATOR,
  gambarKomentator,
  isiNamaBidak,
  rapikanKalimat,
  susunKomentar,
} from "../lib/komentator.js";

/**
 * Kartu "Komentator Papan" — panel komentar langsung di Papan Interaktif.
 *
 * Menerima `fakta` (hasil faktaLangkah) untuk langkah terakhir yang sedang
 * ditampilkan, penilaian engine bila ada, lalu menyusun kalimatnya lewat
 * mesin komentator (src/lib/komentator.js) + kamus terjemahan. Tidak ada
 * teks yang dibekukan: ganti bahasa → kalimat ikut berganti seketika.
 *
 * Preferensi (nyala/mati, gaya) disimpan di localStorage agar pengunjung
 * tidak perlu mengatur ulang tiap kali membuka papan.
 */

/**
 * @param {object} p
 * @param {Array<{kunci:string, ganti?:object}>|null} [p.segmen]
 *        Daftar kunci kalimat yang SUDAH disusun pemanggil (mis. halaman
 *        Teka-Teki lewat susunKomentarTekaTeki). Bila diberikan, `fakta` &
 *        opsi engine di bawah diabaikan — kartu hanya menerjemahkan.
 * @param {object|null} p.fakta          hasil faktaLangkah() untuk langkah terakhir
 * @param {string|null} p.rating         label penilaian (book/best/blunder/…)
 * @param {object|null} p.evalSesudah    { cpPutih, matePutih } posisi saat ini
 * @param {string|null} p.namaPembukaan  nama pembukaan bila masih di buku
 * @param {string|null} p.saranTerbaik   SAN saran engine pada posisi SEBELUM langkah
 * @param {boolean} p.engineNyala
 * @param {boolean} p.engineMenilai      engine menyala tapi eval belum siap
 * @param {{san:string, nilai:string}|null} [p.saranAwan] saran basis data awan
 *        (chessdb.cn) — dipakai saat engine mati & sudah di luar buku pembukaan
 * @param {boolean} p.posisiAwal         belum ada langkah
 * @param {boolean} p.nyala
 * @param {(v: boolean) => void} p.setNyala
 * @param {string} p.gaya
 * @param {(g: string) => void} p.setGaya
 * @param {(k: string, ganti?: object) => string} p.t
 */
export default function KartuKomentator({
  segmen = null,
  fakta = null,
  rating = null,
  evalSesudah = null,
  namaPembukaan = null,
  saranTerbaik = null,
  engineNyala = false,
  engineMenilai = false,
  posisiAwal = false,
  saranAwan = null,
  ekspresiAwan = null,
  catatanMaster = null,
  bahasa = "id",
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
            saranAwan,
          })
        : []);
    return rapikanKalimat(
      daftar.map(({ kunci, ganti }) => isiNamaBidak(t(kunci, ganti), t)).join(" ")
    );
  }, [nyala, segmen, fakta, gaya, rating, evalSesudah, namaPembukaan, saranTerbaik, engineNyala, saranAwan, t]);

  const teksTampil = useMemo(() => {
    if (!nyala) return "";
    if (posisiAwal) return t("papan.komentator.posisiAwal");
    const kutipan = !segmen && catatanMaster ? (bahasa === "en" ? catatanMaster.en : catatanMaster.id) : "";
    if (!kutipan) return kalimat || t("papan.komentator.menunggu");
    if (!engineNyala) return kutipan;
    const langkahBuruk =
      rating === "inaccuracy" || rating === "mistake" || rating === "miss" || rating === "blunder";
    if (langkahBuruk) return kalimat || kutipan;
    return kutipan;
  }, [nyala, posisiAwal, segmen, catatanMaster, bahasa, kalimat, engineNyala, rating, t]);

  // Animasi "muncul" ringan tiap kalimat berganti — cukup memberi kesan hidup
  // tanpa memindahkan tata letak.
  const [kunciAnimasi, setKunciAnimasi] = useState(0);
  useEffect(() => {
    setKunciAnimasi((k) => k + 1);
  }, [teksTampil]);

  // Avatar karakter: engine mati → Fritz berkonsentrasi, KECUALI bila ada
  // ekspresi dari skor basis data awan (ekspresiAwan) yang membuat wajah
  // bereaksi seperti mode engine; selama masih di buku pembukaan → ikon buku;
  // engine nyala → satu dari enam karakter yang bereaksi terhadap vonis engine /
  // fakta papan (lihat gambarKomentator di lib/komentator.js).
  const gambarAvatar = gambarKomentator({
    engineNyala,
    engineMenilai,
    rating,
    namaPembukaan,
    posisiAwal,
    fakta,
    ekspresiAwan,
  });
  const avatarBuku = gambarAvatar === AVATAR_BUKU;

  return (
    <section aria-label={t("papan.komentator.judul")} className={className}>
      {!sembunyikanKontrol && <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Switch
            size="sm"
            checked={nyala}
            onCheckedChange={() => setNyala(!nyala)}
            aria-label={nyala ? t("papan.komentator.matikan") : t("papan.komentator.nyalakan")}
            title={nyala ? t("papan.komentator.matikan") : t("papan.komentator.nyalakan")}
          />
          <p className="flex min-w-0 items-center gap-1.5 text-sm font-bold leading-none text-white">
            <MessageSquareText className="h-4 w-4 shrink-0 text-[#81b64c]" aria-hidden="true" />
            <span className="truncate">{t("papan.komentator.judul")}</span>
          </p>
        </div>

        {nyala && (
          <div
            role="radiogroup"
            aria-label={t("papan.komentator.gayaLabel")}
            className="flex flex-wrap items-center gap-0.5 rounded-md border border-[#312e2b] bg-[#262421] p-0.5 text-[11px] font-semibold"
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
                {t(`papan.komentator.gaya${g.charAt(0).toUpperCase() + g.slice(1)}`)}
              </button>
            ))}
          </div>
        )}
      </div>}

      {!hanyaKontrol && nyala && (
        <section
          key={kunciAnimasi}
          aria-live="polite"
          className="komentator-gelembung mt-3 flex min-h-[88px] shrink-0 items-center gap-2 sm:gap-3"
        >
          {/* Avatar komentator mengikuti `gambarKomentator()`: selama posisi
              masih di buku pembukaan / posisi awal tampilkan ikon buku tanpa
              gambar karakter; di luar itu tampilkan karakter aktif tanpa
              `fetchpriority="high"` agar tidak membebani prioritas unduhan
              pada panel yang LCP-nya berupa teks judul. */}
          {avatarBuku ? (
            <span
              data-avatar-komentator="book"
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center drop-shadow-md sm:h-16 sm:w-16"
            >
              <RatingSVG rating={AVATAR_BUKU} size={44} />
            </span>
          ) : (
            <img
              data-avatar-komentator="karakter"
              src={berkasPublik(gambarAvatar)}
              alt=""
              className="h-12 w-12 shrink-0 object-contain drop-shadow-md sm:h-16 sm:w-16"
              width="64"
              height="64"
              loading="eager"
              decoding="async"
            />
          )}
          <div className="relative min-w-0 flex-1 rounded-md border border-[#3b3935] bg-[#262421] p-2.5 sm:p-3">
            <span
              aria-hidden="true"
              className="absolute -left-[5px] top-5 h-2.5 w-2.5 rotate-45 border-b border-l border-[#3b3935] bg-[#262421]"
            />
            <p className="m-0 min-w-0 text-[13px] leading-5 text-gray-200">{teksTampil}</p>
          </div>
        </section>
      )}
    </section>
  );
}
