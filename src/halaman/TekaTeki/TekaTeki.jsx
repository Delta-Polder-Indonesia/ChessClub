import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Chess } from "chess.js";
import { PageSelanjutnya } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import PapanTekaTeki from "./PapanTekaTeki.jsx";

/**
 * Halaman "Teka-teki Catur" — pemutar interaktif 4.462 soal skakmat
 * (Mate in One/Two/Three) dari buku László Polgár (1994).
 *
 * Data dimuat terpisah dari public/data/teka-teki.json (berasal dari
 * FileRefrensi/problems.json) sehingga bundel utama tetap ringan.
 * Validasi langkah & deteksi skakmat memakai chess.js.
 */

const KUNCI_SELESAI = "kci-teka-teki-terpecahkan";
const KUNCI_POSISI = "kci-teka-teki-posisi";
const KUNCI_INGAT = "kci-teka-teki-ingat";
const KUNCI_TIPE = {
  "Mate in One": "skakmat1",
  "Mate in Two": "skakmat2",
  "Mate in Three": "skakmat3",
};
const KUNCI_SUSAH = {
  "Mate in One": "mudah",
  "Mate in Two": "menengah",
  "Mate in Three": "sulit",
};

/** "f6-g7" | "e7-e8q" → { from, to, promo } */
function parseLangkah(teks) {
  return {
    from: teks.slice(0, 2),
    to: teks.slice(3, 5),
    promo: teks.length > 5 ? teks[5] : null,
  };
}

/** Terapkan satu langkah pada posisi; melempar bila ilegal. */
function terapkan(fen, { from, to, promo }) {
  const game = new Chess(fen);
  const opsi = { from, to };
  const bidak = game.get(from);
  if (bidak && bidak.type === "p" && (to.endsWith("8") || to.endsWith("1"))) {
    opsi.promotion = promo || "q";
  }
  game.move(opsi);
  return game;
}

/** Baca daftar soal yang sudah dipecahkan (disimpan di localStorage). */
function bacaTerpecahkan() {
  try {
    const simpan = JSON.parse(localStorage.getItem(KUNCI_SELESAI) || "[]");
    return new Set(Array.isArray(simpan) ? simpan : []);
  } catch {
    return new Set();
  }
}

/** Baca nomor soal terakhir yang dilihat pengguna. */
function bacaPosisi() {
  try {
    const n = Number(localStorage.getItem(KUNCI_POSISI));
    return Number.isInteger(n) && n >= 1 ? n : null;
  } catch {
    return null;
  }
}

/** Apakah fitur "ingat posisi terakhir" aktif? (aktif secara bawaan). */
function bacaIngat() {
  try {
    return localStorage.getItem(KUNCI_INGAT) !== "0";
  } catch {
    return true;
  }
}

/** Kerangka pemuatan sebelum data teka-teki tiba. */
function KerangkaTekaTeki() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-40 rounded-lg bg-slate-200" />
      <div className="mt-4 h-4 w-56 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
    </div>
  );
}

export default function TekaTeki() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();

  const [soal, setSoal] = useState(null); // seluruh 4.462 soal
  const [gagal, setGagal] = useState(false);
  const [indeks, setIndeks] = useState(0);

  // Keadaan satu permainan.
  const [fen, setFen] = useState("");
  const [sisa, setSisa] = useState([]);
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [petunjuk, setPetunjuk] = useState(null);
  const [kesalahan, setKesalahan] = useState(null);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [pesan, setPesan] = useState(null); // { jenis: "salah"|"benar"|"selesai", teks }
  const [komputer, setKomputer] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [terpecahkan, setTerpecahkan] = useState(bacaTerpecahkan);

  // Tanda bantu analisis (klik kanan): panah & petak berwarna.
  const [tanda, setTanda] = useState({ panah: [], petak: {} });

  // Pengaturan & navigasi: ingat posisi terakhir + lompat ke nomor soal.
  const [ingatPosisi, setIngatPosisi] = useState(bacaIngat);
  const [posisiTersimpan, setPosisiTersimpan] = useState(bacaPosisi);
  const [nomorSoal, setNomorSoal] = useState("");
  const [galatNomor, setGalatNomor] = useState(null);

  const timerSalah = useRef(null);
  const masalah = soal?.[indeks];

  /* ------------------------------------------------------- pemuatan data */

  /** Simpan nomor soal terakhir yang dilihat agar bisa dilanjutkan lagi. */
  const simpanPosisi = useCallback((id) => {
    try {
      localStorage.setItem(KUNCI_POSISI, String(id));
    } catch {
      /* localStorage tidak tersedia */
    }
    setPosisiTersimpan(id);
  }, []);

  useEffect(() => {
    let aktif = true;
    fetch(`${import.meta.env.BASE_URL}data/teka-teki.json`)
      .then((respon) => {
        if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
        return respon.json();
      })
      .then((data) => {
        if (!aktif) return;
        const daftar = data.problems || [];
        if (!daftar.length) throw new Error("data kosong");
        const idParam = Number(params.get("id"));
        let awal;
        if (idParam >= 1 && idParam <= daftar.length) {
          // Tautan ?id=N (misalnya dibagikan) lebih diutamakan.
          awal = idParam - 1;
        } else if (ingatPosisi) {
          // Lanjutkan dari posisi terakhir yang tersimpan.
          const tersimpan = bacaPosisi();
          awal =
            tersimpan >= 1 && tersimpan <= daftar.length
              ? tersimpan - 1
              : Math.floor(Math.random() * daftar.length);
        } else {
          awal = Math.floor(Math.random() * daftar.length);
        }
        setSoal(daftar);
        setIndeks(awal);
        terapkanSoal(daftar[awal]);
        setParams({ id: String(daftar[awal].problemid) }, { replace: true });
        if (ingatPosisi) simpanPosisi(daftar[awal].problemid);
      })
      .catch(() => {
        if (aktif) setGagal(true);
      });
    return () => {
      aktif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = `${t("tekaTeki.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  useEffect(
    () => () => {
      window.clearTimeout(timerSalah.current);
    },
    []
  );

  /* --------------------------------------------------------- alur permainan */

  /** Muat soal ke papan (setel ulang seluruh keadaan permainan). */
  const terapkanSoal = useCallback((m) => {
    setFen(m.fen);
    setSisa(m.moves.split(";"));
    setTerpilih(null);
    setSasaran([]);
    setPetunjuk(null);
    setKesalahan(null);
    setLangkahAkhir(null);
    setPesan(null);
    setKomputer(false);
    setSelesai(false);
    setTanda({ panah: [], petak: {} });
  }, []);

  /** Pindah ke soal lain (indeks di-wrap dalam 0..total-1). */
  const pindahSoal = useCallback(
    (indeksBaru) => {
      if (!soal || !soal.length) return;
      const total = soal.length;
      const idx = ((indeksBaru % total) + total) % total;
      const m = soal[idx];
      setIndeks(idx);
      terapkanSoal(m);
      setParams({ id: String(m.problemid) }, { replace: true });
      if (ingatPosisi) simpanPosisi(m.problemid);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [soal, terapkanSoal, setParams, ingatPosisi, simpanPosisi]
  );

  const pilihAcak = () =>
    pindahSoal(Math.floor(Math.random() * (soal?.length || 1)));

  /** Pilih bidak sendiri (dipakai klik maupun awal seret/drag). */
  function pilihPetak(petak) {
    if (!masalah || komputer || selesai || !fen) return;
    const game = new Chess(fen);
    const bidak = game.get(petak);
    if (bidak && bidak.color === game.turn()) {
      const tujuan = game.moves({ square: petak, verbose: true }).map((m) => m.to);
      setTerpilih(petak);
      setSasaran(tujuan);
    } else {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  /** Klik petak: pilih bidak sendiri atau coba langkah ke petak sasaran. */
  function klikPetak(petak) {
    if (!masalah || komputer || selesai || !fen) return;
    if (terpilih && sasaran.includes(petak)) {
      cobaLangkah(terpilih, petak);
      return;
    }
    pilihPetak(petak);
  }

  /** Coba langkah pemain: cocok dengan solusi (atau skakmat apa pun di akhir). */
  function cobaLangkah(from, to) {
    const diharapkan = parseLangkah(sisa[0]);
    let lanjut = null;

    if (sisa.length === 1) {
      // Langkah pamungkas: terima langkah legal apa pun yang berujung skakmat.
      try {
        const g = terapkan(fen, { from, to });
        if (g.isCheckmate()) lanjut = g;
      } catch {
        /* langkah ilegal — tetap dianggap salah */
      }
    } else if (from === diharapkan.from && to === diharapkan.to) {
      try {
        lanjut = terapkan(fen, diharapkan);
      } catch {
        /* data janggal — abaikan */
      }
    }

    if (!lanjut) {
      window.clearTimeout(timerSalah.current);
      setPesan({ jenis: "salah", teks: t("tekaTeki.salah") });
      setKesalahan({ from, to });
      setTerpilih(null);
      setSasaran([]);
      timerSalah.current = window.setTimeout(() => setKesalahan(null), 700);
      return;
    }

    const sisaBaru = sisa.slice(1);
    setFen(lanjut.fen());
    setSisa(sisaBaru);
    setLangkahAkhir({ from, to });
    setTerpilih(null);
    setSasaran([]);
    setPetunjuk(null);
    setKesalahan(null);

    if (sisaBaru.length === 0) {
      setSelesai(true);
      setPesan({ jenis: "selesai", teks: t("tekaTeki.terpecahkan") });
      catatTerpecahkan(masalah.problemid);
    } else {
      setPesan({ jenis: "benar", teks: t("tekaTeki.benar") });
      setKomputer(true);
    }
  }

  /** Lawan membalas otomatis sesuai solusi setelah pemain melangkah. */
  useEffect(() => {
    if (!komputer || selesai || !sisa.length) return;
    const timer = window.setTimeout(() => {
      const diharapkan = parseLangkah(sisa[0]);
      try {
        const g = terapkan(fen, diharapkan);
        setFen(g.fen());
        setLangkahAkhir({ from: diharapkan.from, to: diharapkan.to });
      } catch {
        /* data janggal — lewati balasan */
      }
      setSisa((s) => s.slice(1));
      setKomputer(false);
      setPesan(null);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [komputer, fen, sisa, selesai]);

  function tampilPetunjuk() {
    if (!sisa.length || selesai) return;
    const d = parseLangkah(sisa[0]);
    setPetunjuk({ from: d.from, to: d.to });
  }

  function catatTerpecahkan(id) {
    setTerpecahkan((lama) => {
      if (lama.has(id)) return lama;
      const baru = new Set(lama);
      baru.add(id);
      try {
        localStorage.setItem(KUNCI_SELESAI, JSON.stringify([...baru]));
      } catch {
        /* localStorage tidak tersedia */
      }
      return baru;
    });
  }

  /** Hidupkan/matikan "ingat posisi terakhir" (pengaturan). */
  function ubahIngat(nilai) {
    setIngatPosisi(nilai);
    try {
      if (nilai) {
        if (masalah) {
          localStorage.setItem(KUNCI_POSISI, String(masalah.problemid));
          setPosisiTersimpan(masalah.problemid);
        }
        localStorage.setItem(KUNCI_INGAT, "1");
      } else {
        localStorage.setItem(KUNCI_INGAT, "0");
        localStorage.removeItem(KUNCI_POSISI);
        setPosisiTersimpan(null);
      }
    } catch {
      /* localStorage tidak tersedia */
    }
  }

  /** Lompat langsung ke nomor soal yang diketik pengguna. */
  function bukaNomor(e) {
    e.preventDefault();
    if (!soal?.length) return;
    const teks = nomorSoal.trim();
    const n = Number(teks);
    if (!/^\d+$/.test(teks) || n < 1 || n > soal.length) {
      setGalatNomor(t("tekaTeki.nomorTidakValid", { total: soal.length }));
      return;
    }
    setGalatNomor(null);
    setNomorSoal("");
    pindahSoal(n - 1);
  }

  /* ------------------------------------------------ tanda bantu (klik kanan) */

  /** Klik kanan pada petak: tandai — atau hapus SEMUA tanda bila sudah ditandai. */
  function tandaPetak(petak, warna) {
    setTanda((lama) => {
      if (lama.petak[petak]) return { panah: [], petak: {} };
      return { ...lama, petak: { ...lama.petak, [petak]: warna } };
    });
  }

  /** Klik kanan lalu seret: gambar panah — seret ulang panah yang sama untuk menghapusnya. */
  function tandaPanah(from, to, warna) {
    setTanda((lama) => {
      const ada = lama.panah.some((p) => p.from === from && p.to === to);
      const panah = ada
        ? lama.panah.filter((p) => !(p.from === from && p.to === to))
        : [...lama.panah, { from, to, warna }];
      return { ...lama, panah };
    });
  }

  function hapusSemuaTanda() {
    setTanda({ panah: [], petak: {} });
  }

  /* -------------------------------------------------------------- tampilan */

  const crumbs = [
    { label: t("common.home"), to: "/" },
    { label: t("tekaTeki.judul") },
  ];

  const orientasi = masalah?.first === "Black to Move" ? "b" : "w";
  const sudahPecah = masalah ? terpecahkan.has(masalah.problemid) : false;

  return (
    <>
      {/* Kepala halaman penuh sendiri — tanpa gambar/foto di atasnya. */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1024px] px-6 py-8 md:px-8 md:py-12">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 md:text-sm"
          >
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">/</span>}
                {c.to ? (
                  <Link to={c.to} className="hover:text-primary hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-800">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
            {t("tekaTeki.judul")}
          </h1>
          <p className="mt-3 max-w-[840px] text-sm leading-7 text-slate-600 md:text-base">
            {t("tekaTeki.deskripsi")}
          </p>
        </div>
      </header>

      <main className="px-6 md:px-8">
        <div className="mx-auto max-w-[1024px] py-10 md:py-16">
          {gagal ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {t("tekaTeki.gagalMuat")}
            </p>
          ) : !masalah ? (
            <div className="mx-auto max-w-[560px]">
              <p className="mb-6 text-sm text-slate-500">{t("tekaTeki.memuat")}</p>
              <KerangkaTekaTeki />
            </div>
          ) : (
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              {/* Papan catur */}
              <div className="mx-auto w-full max-w-[520px] shrink-0 lg:mx-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="m-0 text-base font-bold text-slate-950 md:text-lg">
                    {t("tekaTeki.soal", {
                      n: masalah.problemid,
                      total: soal.length,
                    })}
                  </h2>
                  <div className="flex gap-2">
                    <span className="rounded bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {t(`tekaTeki.${KUNCI_TIPE[masalah.type]}`)}
                    </span>
                    <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {t(`tekaTeki.${KUNCI_SUSAH[masalah.type]}`)}
                    </span>
                  </div>
                </div>

                <PapanTekaTeki
                  fen={fen}
                  orientasi={orientasi}
                  terpilih={terpilih}
                  sasaran={sasaran}
                  petunjuk={petunjuk}
                  kesalahan={kesalahan}
                  langkahAkhir={langkahAkhir}
                  tanda={tanda}
                  terkunci={komputer || selesai}
                  membeku={komputer}
                  onKlik={klikPetak}
                  onPilih={pilihPetak}
                  onJatuh={cobaLangkah}
                  onTandaPetak={tandaPetak}
                  onTandaPanah={tandaPanah}
                />

                <p className="mt-3 text-xs leading-5 text-slate-400">
                  {t("tekaTeki.caraTanda")}
                </p>

                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span
                    aria-hidden="true"
                    className={`inline-block h-3 w-3 rounded-full ${
                      masalah.first === "White to Move" ? "bg-white ring-1 ring-slate-400" : "bg-slate-800"
                    }`}
                  />
                  {t(
                    masalah.first === "White to Move"
                      ? "tekaTeki.giliranPutih"
                      : "tekaTeki.giliranHitam"
                  )}
                </p>
              </div>

              {/* Panel samping */}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-7 text-slate-600 md:text-base">
                  {t("tekaTeki.caraMain")}
                </p>

                {/* Kotak pesan hasil langkah */}
                <div aria-live="polite" className="mt-4 min-h-[52px]">
                  {pesan?.jenis === "salah" && (
                    <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                      {pesan.teks}
                    </p>
                  )}
                  {pesan?.jenis === "benar" && (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                      {pesan.teks}
                    </p>
                  )}
                  {pesan?.jenis === "selesai" && (
                    <p className="rounded-md border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-900">
                      {pesan.teks}
                    </p>
                  )}
                </div>

                {sudahPecah && !pesan && (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {t("tekaTeki.sudahTerpecahkan")}
                  </p>
                )}

                {/* Tombol kendali */}
                <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={tampilPetunjuk}
                    disabled={selesai || !sisa.length}
                    className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("tekaTeki.petunjuk")}
                  </button>
                  <button
                    type="button"
                    onClick={() => pindahSoal(indeks + 1)}
                    className="rounded-md bg-[#b85244] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a54538]"
                  >
                    {t("tekaTeki.lewati")}
                  </button>
                  <button
                    type="button"
                    onClick={pilihAcak}
                    className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t("tekaTeki.acak")}
                  </button>
                  <button
                    type="button"
                    onClick={() => pindahSoal(indeks - 1)}
                    className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    ← {t("tekaTeki.sebelumnya")}
                  </button>
                  <button
                    type="button"
                    onClick={() => pindahSoal(indeks + 1)}
                    className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t("tekaTeki.berikutnya")} →
                  </button>
                  {(tanda.panah.length > 0 || Object.keys(tanda.petak).length > 0) && (
                    <button
                      type="button"
                      onClick={hapusSemuaTanda}
                      className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {t("tekaTeki.hapusSemuaTanda")}
                    </button>
                  )}
                </div>

                {/* Kolom input nomor soal + pengaturan lanjutkan posisi */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <form
                    onSubmit={bukaNomor}
                    className="rounded-md border border-slate-200 bg-slate-50 p-4"
                  >
                    <label
                      htmlFor="nomor-soal"
                      className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {t("tekaTeki.langsungKe")}
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        id="nomor-soal"
                        type="number"
                        min={1}
                        max={soal.length}
                        value={nomorSoal}
                        onChange={(e) => setNomorSoal(e.target.value)}
                        placeholder={`1–${soal.length}`}
                        className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                      >
                        {t("tekaTeki.buka")}
                      </button>
                    </div>
                    {galatNomor ? (
                      <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                        {galatNomor}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-slate-400">
                        {t("tekaTeki.rentangNomor", { total: soal.length })}
                      </p>
                    )}
                  </form>

                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("tekaTeki.pengaturan")}
                    </p>
                    <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm leading-6 text-slate-700">
                      <input
                        type="checkbox"
                        checked={ingatPosisi}
                        onChange={(e) => ubahIngat(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#0b2f9f]"
                      />
                      <span>{t("tekaTeki.ingatPosisi")}</span>
                    </label>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {ingatPosisi
                        ? t("tekaTeki.posisiTersimpan", {
                            n: posisiTersimpan ?? masalah.problemid,
                          })
                        : t("tekaTeki.ingatNonaktif")}
                    </p>
                  </div>
                </div>

                {/* Rekor terselesaikan */}
                <p className="mt-5 text-sm text-slate-500">
                  {t("tekaTeki.totalTerpecahkan", { n: terpecahkan.size })}
                </p>

                <p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-6 text-slate-400">
                  {t("tekaTeki.sumber")}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <PageSelanjutnya
        to="/program-kami/sekolah-catur/cara-bermain-catur"
        judul={t("tekaTeki.selanjutnyaJudul")}
      />
    </>
  );
}
