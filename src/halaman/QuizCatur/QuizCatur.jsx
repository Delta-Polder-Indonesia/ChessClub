import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import { gunakanSuara, SUARA } from "../../lib/suara.js";
import { SOAL_CATUR, DAFTAR_KATEGORI } from "./daftar.js";

/* ------------------------------------------------------------------ bantu */

function acak(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Kategori terurut sesuai DAFTAR_KATEGORI. */
const URUTAN_KATEGORI = DAFTAR_KATEGORI.slice()
  .sort((a, b) => a.urutan - b.urutan)
  .map((k) => k.id);

/* ================================================================== page */

export default function QuizCatur() {
  const { t } = useI18n();
  const { mainkan } = gunakanSuara();

  // Fase: "pilih" (idle) | "main" | "selesai".
  const [fase, setFase] = useState("pilih");
  const [kategori, setKategori] = useState("semua");

  const [urutan, setUrutan] = useState([]); // urutan indeks soal (di daftar terfilter)
  const [idx, setIdx] = useState(0);
  const [dipilih, setDipilih] = useState(null); // indeks ORIGINAL pilihan yg diklik
  const [acakOpsi, setAcakOpsi] = useState([]); // urutan tampil indeks pilihan
  const [benar, setBenar] = useState(0);
  const [lampau, setLampau] = useState([]); // riwayat {benar} utk rekap

  useEffect(() => {
    document.title = `${t("quiz.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  // Soal yang tampil, difilter sesuai kategori & urut kategori.
  const daftar = useMemo(() => {
    const terisi =
      kategori === "semua"
        ? SOAL_CATUR
        : SOAL_CATUR.filter((s) => s.kategori === kategori);
    const urut = [...terisi].sort((a, b) => {
      const ka = URUTAN_KATEGORI.indexOf(a.kategori) ?? 99;
      const kb = URUTAN_KATEGORI.indexOf(b.kategori) ?? 99;
      return ka - kb;
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
    setFase("main");
    mainkan(SUARA.mulai);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daftar, total, mainkan]);

  const pilihOpsi = (indeksOriginal) => {
    if (!soal || dipilih !== null) return;
    setDipilih(indeksOriginal);
    const benar = indeksOriginal === soal.kunci;
    mainkan(benar ? SUARA.tekaTekiBenar : SUARA.tekaTekiSalah);
    if (benar) setBenar((b) => b + 1);
    setLampau((l) => [...l, benar]);
  };

  const lanjut = () => {
    const berikut = idx + 1;
    if (berikut >= urutan.length) {
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

  /* ------------------------------------------------------- label kecil */
  const MikroLabel = ({ children }) => (
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
      {children}
    </span>
  );

  const kategoriAktif = kategori === "semua" ? t("quiz.semua") : t(`quiz.kategori.${kategori}`);

  const header = (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#312e2b] bg-[#1e1c18] px-3 sm:px-4">
      <Link
        to="/program-kami"
        className="flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
        title={t("quiz.kembali")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M19 12H5M11 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden sm:inline">{t("quiz.kembali")}</span>
        <span className="sm:hidden">{t("quiz.kembali")}</span>
      </Link>
      <div className="flex items-center gap-2">
        <span className="hidden text-[13px] font-semibold text-slate-200 md:inline">
          Blunder<span className="text-[#81b64c]">Skuad</span>
        </span>
        <span className="rounded-md border border-[#81b64c]/40 bg-[#81b64c]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#b8dc8e]">
          {t("quiz.judul")}
        </span>
      </div>
    </header>
  );

  const navKiri = (
    <aside className="flex w-full shrink-0 flex-col border-b border-r-0 border-[#312e2b] bg-[#1e1c18] lg:w-[236px] lg:border-b-0 lg:border-r">
      <div className="flex-1 px-4 py-4">
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
            <span>{t("quiz.semua")}</span>
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
              <span>{t(`quiz.kategori.${k}`)}</span>
              <span className="text-xs tabular-nums text-slate-500">
                {hitungPerKategori[k] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );

  const panelKanan = (
    <aside className="flex w-full shrink-0 flex-col border-t border-[#312e2b] bg-[#211f1c] lg:w-[280px] lg:border-l lg:border-t-0">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <MikroLabel>{t("quiz.judul")}</MikroLabel>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {t("quiz.tagline")}
        </p>

        <div className="mt-4">
          <MikroLabel>{t("quiz.kategoriLabel", { kategori: kategoriAktif })}</MikroLabel>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#81b64c]" aria-hidden="true" />
              <span>{benar}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
              <span>{lampau.length - benar}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  /* --------------------------------------------- konten tengah per fase */
  let tengah;
  if (fase === "selesai") {
    const salah = lampau.length - benar;
    const pct = lampau.length ? Math.round((benar / lampau.length) * 100) : 0;
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
          <p className="mt-1 text-sm text-slate-400">
            {t("quiz.rekap", { benar, salah })}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {pct >= 80
              ? t("quiz.capaiPuas")
              : pct >= 50
                ? t("quiz.capaiSedang")
                : t("quiz.capaiRendah")}
          </p>
          <button
            type="button"
            onClick={ulangi}
            className="mt-6 w-full rounded-lg bg-[#81b64c] py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#1e1c18] transition hover:bg-[#92c45f]"
          >
            {t("quiz.ulangi")}
          </button>
        </div>
      </div>
    );
  } else if (fase === "pilih") {
    tengah = (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#81b64c]/15 text-[#81b64c]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2 15 8l6 .5-4.5 4L18 18l-6-3-6 3 1.5-5.5L3 8.5 9 8l3-6z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-white">
            {t("quiz.judul")}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{t("quiz.tagline")}</p>
          <p className="mt-6 text-sm text-slate-300">
            {t("quiz.belumMulai")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {kategoriAktif} · {total} {t("quiz.banyakSoal")}
          </p>
          <button
            type="button"
            onClick={mulai}
            disabled={total === 0}
            className="mt-6 w-full rounded-lg bg-[#81b64c] py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#1e1c18] transition hover:bg-[#92c45f] disabled:opacity-50"
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
    const salahSekarang = lampau.length - benar;
    tengah = (
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
        {/* progress */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{t("quiz.progress", { n: idx + 1, total: urutan.length })}</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#81b64c]" aria-hidden="true" />
              {benar}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
              {salahSekarang}
            </span>
          </span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#312e2b]">
          <div
            className="h-full bg-[#81b64c] transition-all"
            style={{ width: `${((idx + (dipilih !== null ? 1 : 0)) / urutan.length) * 100}%` }}
          />
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center py-6">
          <div className="w-full max-w-xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-md border border-[#81b64c]/40 bg-[#81b64c]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#b8dc8e]">
                {t(`quiz.kategori.${soal.kategori}`)}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-relaxed text-[#fffaec] sm:text-2xl">
              {soal.soal}
            </h2>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {acakOpsi.map((indeks) => {
                const teks = soal.pilihan[indeks];
                const terjawab = dipilih !== null;
                const iniBenar = indeks === soal.kunci;
                const iniDipilih = dipilih === indeks;
                let cls =
                  "border-[#312e2b] bg-[#1e1c18] text-slate-200 hover:border-slate-500";
                if (terjawab) {
                  if (iniBenar)
                    cls = "border-[#81b64c] bg-[#81b64c]/15 text-[#c9e8a8]";
                  else if (iniDipilih)
                    cls = "border-red-500 bg-red-500/15 text-red-200";
                  else cls = "border-[#312e2b] bg-[#1e1c18] text-slate-400 opacity-60";
                }
                return (
                  <button
                    key={indeks}
                    type="button"
                    disabled={terjawab}
                    onClick={() => pilihOpsi(indeks)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${cls}`}
                  >
                    <span className="text-xs font-bold tabular-nums text-slate-500">
                      {String.fromCharCode(65 + indeks)}
                    </span>
                    <span className="min-w-0 flex-1">{teks}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {dipilih !== null ? (
                <div className="flex items-center justify-between gap-3">
                  <p
                    className={`text-sm font-semibold ${
                      dipilih === soal.kunci ? "text-[#81b64c]" : "text-red-300"
                    }`}
                  >
                    {dipilih === soal.kunci
                      ? t("quiz.tepat")
                      : t("quiz.kurangTepat")}
                  </p>
                  <button
                    type="button"
                    onClick={lanjut}
                    className="rounded-lg bg-[#81b64c] px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-[#1e1c18] transition hover:bg-[#92c45f]"
                  >
                    {idx + 1 >= urutan.length
                      ? t("quiz.selesai")
                      : t("quiz.lanjut")}
                  </button>
                </div>
              ) : (
                <p className="text-center text-xs text-slate-500">
                  {t("quiz.pilihJawaban")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#262421] text-gray-200 font-sans select-none lg:h-screen lg:overflow-hidden">
      {header}
      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
        {navKiri}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#262421]">
          {tengah}
        </main>
        {panelKanan}
      </div>
    </div>
  );
}
