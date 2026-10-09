import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import { useSuara, SUARA } from "../../lib/suara.js";
import { SOAL_CATUR, DAFTAR_KATEGORI, IKON_KATEGORI } from "./daftar.js";
import { berkasPublik } from "../../lib/asets.js";
import { gabungPeringkat } from "../../lib/peringkatKuis.js";
import License from "../Analisa/komponen/svg/license.jsx";
import CeklisHijau from "../Analisa/komponen/svg/checkbox-green.svg";
import CeklisMerah from "../Analisa/komponen/svg/checkbox-red.svg";

const KUNCI_PERINGKAT = "blunderskuad.quiz.peringkat";

/* ------------------------------------------------------------------ bantu */

function acak(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ikon centang dalam lingkaran (hijau) / X dalam lingkaran (merah). */
function IkonBenar({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IkonSalah({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path
        d="M9 9l6 6M15 9l-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Kategori terurut sesuai DAFTAR_KATEGORI. */
const URUTAN_KATEGORI = DAFTAR_KATEGORI.slice()
  .sort((a, b) => a.urutan - b.urutan)
  .map((k) => k.id);

/* ================================================================== page */

export default function QuizCatur() {
  const { t } = useI18n();
  const { mainkan } = useSuara();

  // Fase: "pilih" (idle) | "main" | "selesai".
  const [fase, setFase] = useState("pilih");
  const [kategori, setKategori] = useState("semua");

  const [urutan, setUrutan] = useState([]); // urutan indeks soal (di daftar terfilter)
  const [idx, setIdx] = useState(0);
  const [dipilih, setDipilih] = useState(null); // indeks ORIGINAL pilihan yg diklik
  const [acakOpsi, setAcakOpsi] = useState([]); // urutan tampil indeks pilihan
  const [benar, setBenar] = useState(0);
  const [lampau, setLampau] = useState([]); // riwayat {benar} utk rekap
  const [username, setUsername] = useState("");
  const [cobaMulai, setCobaMulai] = useState(false);
  const [konfirmasiMulai, setKonfirmasiMulai] = useState(false);
  const [batasSalah, setBatasSalah] = useState(3);
  // Ref selalu sinkron dengan state — dipakai oleh catatHasil supaya skor
  // yang tercatat tidak tertinggal satu angka akibat closure React yang
  // masih memegang nilai lama saat setState di-batch dalam handler yang
  // sama (mis. jawaban benar pada soal terakhir atau jawaban salah yang
  // mencapai batas salah).
  const benarRef = useRef(0);
  const lampauRef = useRef([]);
  useEffect(() => {
    benarRef.current = benar;
  }, [benar]);
  useEffect(() => {
    lampauRef.current = lampau;
  }, [lampau]);
  const [peringkat, setPeringkat] = useState(() => {
    try {
      const mentah = JSON.parse(localStorage.getItem(KUNCI_PERINGKAT)) || [];
      // Data lama bisa memuat nama ganda — gabungPeringkat menyisakan nilai
      // terbaik per nama sekaligus mengurutkannya.
      return (Array.isArray(mentah) ? mentah : []).reduce(
        (daftar, p) => gabungPeringkat(daftar, p),
        []
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    document.title = `${t("quiz.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_PERINGKAT, JSON.stringify(peringkat));
    } catch {
      /* abaikan */
    }
  }, [peringkat]);

  // Soal yang tampil, difilter sesuai kategori & urut kategori.
  const daftar = useMemo(() => {
    const terisi =
      kategori === "semua"
        ? SOAL_CATUR
        : SOAL_CATUR.filter((s) => s.kategori === kategori);
    const urut = [...terisi].sort((a, b) => {
      const ka = URUTAN_KATEGORI.indexOf(a.kategori);
      const kb = URUTAN_KATEGORI.indexOf(b.kategori);
      return (ka < 0 ? URUTAN_KATEGORI.length : ka) - (kb < 0 ? URUTAN_KATEGORI.length : kb);
    });
    return urut;
  }, [kategori]);

  const hitungPerKategori = useMemo(() => {
    const m = {};
    for (const s of SOAL_CATUR) m[s.kategori] = (m[s.kategori] || 0) + 1;
    return m;
  }, []);

  const total = daftar.length;
  const soal = fase === "main" && total > 0 ? daftar[urutan[idx]] : null;

  const pilihKategori = (k) => {
    setKategori(k);
    setFase("pilih");
    setUrutan([]);
    setIdx(0);
    setDipilih(null);
    setAcakOpsi([]);
    setBenar(0);
    setLampau([]);
    setCobaMulai(false);
  };

  const mulai = useCallback(() => {
    if (!total) return;
    const barisan = acak(daftar.map((_, i) => i));
    setUrutan(barisan);
    setIdx(0);
    setDipilih(null);
    setAcakOpsi(acak(Array.from({ length: daftar[barisan[0]].pilihan.length }, (_, i) => i)));
    setBenar(0);
    setLampau([]);
    benarRef.current = 0;
    lampauRef.current = [];
    setFase("main");
    mainkan(SUARA.mulai);
  }, [daftar, total, mainkan]);

  const pilihOpsi = (indeksOriginal) => {
    if (!soal || dipilih !== null) return;
    setDipilih(indeksOriginal);
    const benarSekarang = indeksOriginal === soal.kunci;
    mainkan(benarSekarang ? SUARA.tekaTekiBenar : SUARA.tekaTekiSalah);
    if (benarSekarang) {
      const b = benarRef.current + 1;
      benarRef.current = b;
      setBenar(b);
    }
    const lampauBaru = [...lampauRef.current, benarSekarang];
    lampauRef.current = lampauBaru;
    setLampau(lampauBaru);
    if (!benarSekarang && lampauBaru.filter((b) => !b).length >= batasSalah) {
      catatHasil();
      setFase("selesai");
      mainkan(SUARA.selesai);
    }
  };

  /**
   * Catat skor ke daftar peringkat lokal. Memakai ref (bukan closure state)
   * supaya skor yang tersimpan selalu akurat meski dipanggil tepat setelah
   * setState di dalam handler yang sama — React 18 men-batch setState
   * se-siklus, sehingga membaca state lewat closure akan tertinggal
   * satu nilai (skor berkurang 1) pada jalur akhir kuiz.
   */
  const catatHasil = () => {
    const nama = username.trim();
    const nilaiLampau = lampauRef.current;
    const nilaiBenar = benarRef.current;
    if (!nama || nilaiLampau.length === 0) return;
    const masuk = { nama, benar: nilaiBenar, total: nilaiLampau.length };
    // Cukup perbarui state: efek persistensi [peringkat] yang menulis ke
    // localStorage. Menulis di dalam updater ini membuat penulisan ganda —
    // dan di StrictMode updater dipanggil dua kali (efek samping di dalamnya).
    setPeringkat((sebelumnya) => gabungPeringkat(sebelumnya, masuk));
  };

  const lanjut = () => {
    const berikut = idx + 1;
    if (berikut >= urutan.length) {
      catatHasil();
      setFase("selesai");
      mainkan(SUARA.selesai);
      return;
    }
    setIdx(berikut);
    setDipilih(null);
    const s = daftar[urutan[berikut]];
    setAcakOpsi(
      acak(Array.from({ length: s.pilihan.length }, (_, i) => i))
    );
    mainkan(SUARA.klik);
  };

  const ulangi = () => {
    if (!total) return;
    mulai();
  };

  const menyerah = () => {
    // Menyerah sebelum menjawab apa pun: tidak ada hasil untuk dicatat,
    // cukup kembali ke beranda tanpa layar selesai "0 / 0".
    if (lampau.length === 0) {
      kembaliDepan();
      return;
    }
    catatHasil();
    setFase("selesai");
    mainkan(SUARA.klik);
  };

  const kembaliDepan = () => {
    // urutan/idx/dipilih dipertahankan: panel rekap kanan membacanya untuk
    // menampilkan hasil terakhir di beranda (mulai() yang mereset semua saat
    // kuis baru dimulai).
    setFase("pilih");
    mainkan(SUARA.klik);
  };

  /* ------------------------------------------------------- label kecil */
  const MikroLabel = ({ children }) => (
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </span>
  );

  const navKiri = (
    <aside className="flex w-full shrink-0 flex-col border-b border-r-0 border-[#262421] bg-[#262421] lg:w-[236px] lg:border-b-0 lg:border-r">
      <div className="flex flex-1 flex-col px-4 py-4">
        <p className="text-[22px] font-bold tracking-tight text-white leading-none">
          Blunder<span className="text-[#81b64c]">Skuad</span>
        </p>
        {fase === "main" || fase === "selesai" ? (
          <>
            <MikroLabel>{t("quiz.peringkatHeading")}</MikroLabel>
            <div className="mt-1 flex flex-col divide-y divide-[#312e2b]">
              {peringkat.length === 0 ? (
                <p className="py-2 text-sm text-slate-500">
                  {t("quiz.peringkatKosong")}
                </p>
              ) : (
                peringkat.slice(0, 10).map((p, i) => (
                  <div
                    key={`${p.nama}-${i}`}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`w-5 shrink-0 text-right tabular-nums ${
                          i === 0 ? "font-bold text-[#81b64c]" : "text-slate-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="truncate text-slate-200">{p.nama}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-400">
                      {p.benar}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <MikroLabel>{t("quiz.kategoriHeading")}</MikroLabel>
            <div className="mt-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => pilihKategori("semua")}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition ${
              kategori === "semua"
                ? "bg-[#81b64c]/15 text-[#b8dc8e]"
                : "text-slate-300 hover:bg-[#262421]"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <img
                src={berkasPublik(IKON_KATEGORI.semua)}
                alt=""
                className="h-4 w-4 shrink-0"
              />
              <span className="truncate">{t("quiz.semua")}</span>
            </span>
            <span className="text-xs tabular-nums text-slate-500">
              {SOAL_CATUR.length}
            </span>
          </button>
          {URUTAN_KATEGORI.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => pilihKategori(k)}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                kategori === k
                  ? "bg-[#81b64c]/15 text-[#b8dc8e]"
                  : "text-slate-300 hover:bg-[#262421]"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <img
                  src={berkasPublik(IKON_KATEGORI[k] || IKON_KATEGORI.semua)}
                  alt=""
                  className="h-4 w-4 shrink-0"
                />
                <span className="truncate">{t(`quiz.kategori.${k}`)}</span>
              </span>
              <span className="text-xs tabular-nums text-slate-500">
                {hitungPerKategori[k] || 0}
              </span>
            </button>
          ))}
        </div>
          </>
        )}
        <div className="mt-auto pt-4">
          <Link
            to="/program-kami/atribusi"
            className="flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-white"
          >
            <License size={14} class="fill-current" />
            {t("papan.menuAtribusi")}
          </Link>
          <p className="mt-2 text-[11px] text-slate-600">{t("quiz.versi")}</p>
        </div>
      </div>
    </aside>
  );

  const panelKanan = (
    <aside className="flex w-full shrink-0 flex-col border-t border-[#9b9b9b] bg-[#262421] lg:w-[280px] lg:border-l lg:border-t-0">
      <div className="min-h-0 flex-1 p-4">
        {(fase !== "pilih" || lampau.length > 0) && (
          <>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t("quiz.progress", { n: idx + 1, total: urutan.length })}</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <img src={CeklisHijau} alt="" className="h-4 w-4" />
                  {benar}
                </span>
                <span className="flex items-center gap-1.5">
                  <img src={CeklisMerah} alt="" className="h-4 w-4" />
                  {lampau.length - benar}
                </span>
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#312e2b]">
              <div
                className="h-full bg-[#81b64c] transition-all"
                style={{ width: `${(idx + (dipilih !== null ? 1 : 0)) / urutan.length * 100}%` }}
              />
            </div>
          </>
        )}

        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {lampau.map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold tabular-nums text-slate-500">
                {i + 1}
              </span>
              <span className="flex h-9 w-full items-center justify-center">
                <img
                  src={b ? CeklisHijau : CeklisMerah}
                  alt=""
                  className="h-6 w-6"
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );

  /* --------------------------------------------- konten tengah per fase */
  let tengah;
  if (fase === "selesai") {
    tengah = (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg text-center">
<p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t("quiz.selesaiJudul")}
          </p>
          <div className="mt-4 text-7xl font-black tabular-nums text-[#fffaec]">
            {benar}
            <span className="text-3xl text-slate-500">/{lampau.length}</span>
          </div>
          <p className="mt-3 text-base font-semibold text-[#81b64c]">
            {t("quiz.hasil", { benar, total: lampau.length })}
          </p>
          <button
            type="button"
            onClick={ulangi}
            className="mt-6 w-full rounded-lg bg-[#81b64c] py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#1e1c18] transition hover:bg-[#92c45f]"
          >
            {t("quiz.ulangi")}
          </button>
          <button
            type="button"
            onClick={kembaliDepan}
            className="mt-3 text-xs font-medium text-slate-400 underline underline-offset-4 transition hover:text-white"
          >
            {t("quiz.kembaliDepan")}
          </button>
        </div>
      </div>
    );
  } else if (fase === "pilih") {
    tengah = (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg text-center">
          <div className="flex items-center justify-center gap-3">
            <img
              src={berkasPublik("/images/color-icon/lessons.svg")}
              alt=""
              className="h-10 w-10 sm:h-14 sm:w-14"
            />
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
              {t("quiz.judul")}
            </h1>
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (cobaMulai) setCobaMulai(false);
            }}
            placeholder={t("quiz.usernamePlaceholder")}
            className={`mt-8 w-full border-0 border-b-2 bg-transparent px-1 py-2 text-left text-base text-white outline-none transition-colors duration-200 placeholder:text-slate-500 ${
              cobaMulai && !username.trim()
                ? "border-red-400"
                : "border-[#9b9b9b] focus:border-[#81b64c]"
            }`}
          />
          {cobaMulai && !username.trim() && (
            <p className="mt-2 text-xs text-red-400">{t("quiz.usernameKosong")}</p>
          )}
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {t("quiz.batasSalah")}
            </p>
            <div className="mt-2 flex gap-3">
              <label
                className={`flex-1 cursor-pointer rounded-md border-2 px-4 py-2.5 text-sm font-semibold text-center transition ${
                  batasSalah === 3
                    ? "border-[#81b64c] text-[#b8dc8e]"
                    : "border-slate-500 text-slate-300 hover:border-white"
                }`}
              >
                <input
                  type="radio"
                  name="batasSalah"
                  value="3"
                  checked={batasSalah === 3}
                  onChange={() => setBatasSalah(3)}
                  className="sr-only"
                />
                {t("quiz.salahTiga")}
              </label>
              <label
                className={`flex-1 cursor-pointer rounded-md border-2 px-4 py-2.5 text-sm font-semibold text-center transition ${
                  batasSalah === 5
                    ? "border-[#81b64c] text-[#b8dc8e]"
                    : "border-slate-500 text-slate-300 hover:border-white"
                }`}
              >
                <input
                  type="radio"
                  name="batasSalah"
                  value="5"
                  checked={batasSalah === 5}
                  onChange={() => setBatasSalah(5)}
                  className="sr-only"
                />
                {t("quiz.salahLima")}
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!username.trim()) {
                setCobaMulai(true);
                return;
              }
              if (lampau.length > 0) {
                setKonfirmasiMulai(true);
                return;
              }
              mulai();
            }}
            disabled={total === 0}
            className="mt-8 w-full rounded-lg bg-[#81b64c] py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#1e1c18] disabled:opacity-40"
          >
            {t("quiz.mulai")}
          </button>
          {total === 0 && (
            <p className="mt-3 text-sm text-amber-300">{t("quiz.kosong")}</p>
          )}
        </div>
      </div>
    );
  } else {
    // main
    tengah = (
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          {t("quiz.soalDari")}
        </p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <img
            src={berkasPublik(IKON_KATEGORI[soal.kategori] || IKON_KATEGORI.semua)}
            alt=""
            className="h-10 w-10 sm:h-14 sm:w-14"
          />
          <span className="text-3xl font-extrabold text-[#b8dc8e] sm:text-4xl">
            {t(`quiz.kategori.${soal.kategori}`)}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center py-6">
          <div className="w-full max-w-4xl">
            <h2 className="text-center text-xl font-bold leading-relaxed text-[#fffaec] sm:text-2xl">
              {soal.soal}
            </h2>

<div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {acakOpsi.map((indeks, posisiTampil) => {
                const teks = soal.pilihan[indeks];
                const terjawab = dipilih !== null;
                const iniBenar = indeks === soal.kunci;
                const iniDipilih = dipilih === indeks;
                const redup = terjawab && !iniBenar;
                const cls = `border-current text-[#fffaec] hover:border-[#81b64c] hover:text-[#b8dc8e] ${
                  redup ? "opacity-60" : ""
                }`;
                return (
                  <button
                    key={indeks}
                    type="button"
                    disabled={terjawab}
                    onClick={() => pilihOpsi(indeks)}
                    className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-base font-medium transition ${cls}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-current text-xs font-bold tabular-nums">
                      {String.fromCharCode(65 + posisiTampil)}
                    </span>
                    <span className="min-w-0 flex-1">{teks}</span>
                    {terjawab && iniBenar && (
                      <span className="shrink-0 text-[#81b64c]">
                        <IkonBenar size={22} />
                      </span>
                    )}
                    {terjawab && iniDipilih && !iniBenar && (
                      <span className="shrink-0 text-red-500">
                        <IkonSalah size={22} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

<div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                {dipilih !== null ? (
                  <button
                    type="button"
                    onClick={lanjut}
                    className="ml-auto rounded-lg bg-[#81b64c] px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-[#1e1c18] transition hover:bg-[#92c45f]"
                  >
                    {idx + 1 >= urutan.length
                      ? t("quiz.selesai")
                      : t("quiz.lanjut")}
                  </button>
                ) : (
                  <p className="text-center text-xs text-slate-500">
                    {t("quiz.pilihJawaban")}
                  </p>
                )}
                <button
                  type="button"
                  onClick={menyerah}
                  className="rounded-lg border border-[#312e2b] px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-slate-400 transition hover:border-red-500/60 hover:text-red-300"
                >
                  {t("quiz.menyerah")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#262421] text-gray-200 font-sans select-none lg:h-screen lg:overflow-hidden">
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
        {navKiri}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#262421]">
          {tengah}
        </main>
        {panelKanan}
      </div>

      {konfirmasiMulai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg border border-[#312e2b] bg-[#211f1c] p-6 text-center">
            <p className="text-base font-bold text-white">{t("quiz.mulaiUlangTanya")}</p>
            <p className="mt-2 text-sm text-slate-400">{t("quiz.mulaiUlangCatatan")}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setKonfirmasiMulai(false)}
                className="flex-1 rounded-lg border border-[#312e2b] py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-[#262421]"
              >
                {t("quiz.batal")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setKonfirmasiMulai(false);
                  mulai();
                }}
                className="flex-1 rounded-lg bg-[#81b64c] py-2.5 text-sm font-bold text-[#1e1c18] transition hover:bg-[#92c45f]"
              >
                {t("quiz.yaMulai")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
