import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Chess } from "chess.js";
import { PageSelanjutnya } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { DAFTAR_SET } from "../Beranda/ChessPieceSvg.jsx";
import PapanTekaTeki from "./PapanTekaTeki.jsx";

const KUNCI_SELESAI = "kci-teka-teki-terpecahkan";
const KUNCI_POSISI = "kci-teka-teki-posisi";
const KUNCI_INGAT = "kci-teka-teki-ingat";
const KUNCI_SET_BIDAK = "kci-teka-teki-set-bidak";
const KUNCI_OTOMATIS = "kci-teka-teki-otomatis";
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

function parseLangkah(teks) {
  return {
    from: teks.slice(0, 2),
    to: teks.slice(3, 5),
    promo: teks.length > 5 ? teks[5] : null,
  };
}

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

function bacaTerpecahkan() {
  try {
    const simpan = JSON.parse(localStorage.getItem(KUNCI_SELESAI) || "[]");
    return new Set(Array.isArray(simpan) ? simpan : []);
  } catch {
    return new Set();
  }
}

function bacaPosisi() {
  try {
    const n = Number(localStorage.getItem(KUNCI_POSISI));
    return Number.isInteger(n) && n >= 1 ? n : null;
  } catch {
    return null;
  }
}

function bacaIngat() {
  try {
    return localStorage.getItem(KUNCI_INGAT) !== "0";
  } catch {
    return true;
  }
}

function bacaSetBidak() {
  try {
    const simpan = localStorage.getItem(KUNCI_SET_BIDAK);
    if (simpan && DAFTAR_SET.some((s) => s.id === simpan)) return simpan;
  } catch {}
  return "merida";
}

function bacaOtomatis() {
  try {
    return localStorage.getItem(KUNCI_OTOMATIS) === "1";
  } catch {
    return false;
  }
}

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

  const [soal, setSoal] = useState(null);
  const [gagal, setGagal] = useState(false);
  const [indeks, setIndeks] = useState(0);

  const [fen, setFen] = useState("");
  const [sisa, setSisa] = useState([]);
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [petunjuk, setPetunjuk] = useState(null);
  const [kesalahan, setKesalahan] = useState(null);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [pesan, setPesan] = useState(null);
  const [komputer, setKomputer] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [terpecahkan, setTerpecahkan] = useState(bacaTerpecahkan);

  const [tanda, setTanda] = useState({ panah: [], petak: {} });

  const [ingatPosisi, setIngatPosisi] = useState(bacaIngat);
  const [posisiTersimpan, setPosisiTersimpan] = useState(bacaPosisi);
  const [nomorSoal, setNomorSoal] = useState("");
  const [galatNomor, setGalatNomor] = useState(null);
  const [setBidak, setSetBidak] = useState(bacaSetBidak);
  const [otomatis, setOtomatis] = useState(bacaOtomatis);

  // Sedang menyeret bidak (klik kiri tahan). Klik kanan membatalkan.
  const [sedangSeret, setSedangSeret] = useState(false);
  const abaikanKlikRef = useRef(false);

  const timerSalah = useRef(null);
  const timerOtomatis = useRef(null);
  const masalah = soal?.[indeks];

  const simpanPosisi = useCallback((id) => {
    try {
      localStorage.setItem(KUNCI_POSISI, String(id));
    } catch {}
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
          awal = idParam - 1;
        } else if (ingatPosisi) {
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
      window.clearTimeout(timerOtomatis.current);
    },
    []
  );

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_SET_BIDAK, setBidak);
    } catch {}
  }, [setBidak]);

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_OTOMATIS, otomatis ? "1" : "0");
    } catch {}
  }, [otomatis]);

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
    setSedangSeret(false);
  }, []);

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
    },
    [soal, terapkanSoal, setParams, ingatPosisi, simpanPosisi]
  );

  const pilihAcak = () =>
    pindahSoal(Math.floor(Math.random() * (soal?.length || 1)));

  function pilihPetak(petak) {
    if (!masalah || komputer || selesai || !fen) return;
    if (tanda.panah.length > 0 || Object.keys(tanda.petak).length > 0) {
      hapusSemuaTanda();
    }
    const game = new Chess(fen);
    const bidak = game.get(petak);
    if (bidak && bidak.color === game.turn()) {
      const tujuan = game
        .moves({ square: petak, verbose: true })
        .map((m) => m.to);
      setTerpilih(petak);
      setSasaran(tujuan);
    } else {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  function klikPetak(petak) {
    if (!masalah || !fen || komputer) return;
    // Klik sisa setelah drag-drop atau klik-kanan-batal tidak boleh jadi langkah.
    if (abaikanKlikRef.current) {
      abaikanKlikRef.current = false;
      return;
    }

    if (tanda.panah.length > 0 || Object.keys(tanda.petak).length > 0) {
      hapusSemuaTanda();
    }

    if (!selesai && terpilih && sasaran.includes(petak)) {
      cobaLangkah(terpilih, petak);
      return;
    }

    if (!selesai) {
      const game = new Chess(fen);
      const bidak = game.get(petak);
      if (bidak && bidak.color === game.turn()) {
        pilihPetak(petak);
        return;
      }
    }

    setTerpilih(null);
    setSasaran([]);
  }

  function cobaLangkah(from, to) {
    const diharapkan = parseLangkah(sisa[0]);
    let lanjut = null;

    if (sisa.length === 1) {
      try {
        const g = terapkan(fen, { from, to });
        if (g.isCheckmate()) lanjut = g;
      } catch {}
    } else if (from === diharapkan.from && to === diharapkan.to) {
      try {
        lanjut = terapkan(fen, diharapkan);
      } catch {}
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
      if (otomatis) {
        window.clearTimeout(timerOtomatis.current);
        timerOtomatis.current = window.setTimeout(() => {
          pindahSoal(indeks + 1);
        }, 1200);
      }
    } else {
      setPesan({ jenis: "benar", teks: t("tekaTeki.benar") });
      setKomputer(true);
    }
  }

  useEffect(() => {
    if (!komputer || selesai || !sisa.length) return;
    const timer = window.setTimeout(() => {
      const diharapkan = parseLangkah(sisa[0]);
      try {
        const g = terapkan(fen, diharapkan);
        setFen(g.fen());
        setLangkahAkhir({ from: diharapkan.from, to: diharapkan.to });
      } catch {}
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
      } catch {}
      return baru;
    });
  }

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
    } catch {}
  }

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

  // Klik kanan saat drag → bidak kembali ke petak asal (perilaku chess.com).
  const batalkanSeret = useCallback(() => {
    abaikanKlikRef.current = true;
    setSedangSeret(false);
    setTerpilih(null);
    setSasaran([]);
  }, []);

  const mulaiSeret = useCallback(
    (petak) => {
      if (!masalah || komputer || selesai || !fen) return;
      const game = new Chess(fen);
      const bidak = game.get(petak);
      if (bidak && bidak.color === game.turn()) {
        abaikanKlikRef.current = false;
        setSedangSeret(true);
        pilihPetak(petak);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masalah, komputer, selesai, fen]
  );

  const selesaiSeret = useCallback(
    (from, to) => {
      setSedangSeret(false);
      if (!masalah || komputer || selesai || !fen) return;
      if (!to || from === to) {
        // Dijatuhkan di petak asal / di luar papan → tetap terpilih.
        return;
      }
      abaikanKlikRef.current = true;
      cobaLangkah(from, to);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masalah, komputer, selesai, fen, sisa, terpilih, sasaran]
  );

  function tandaPetak(petak, warna) {
    setTanda((lama) => {
      if (lama.petak[petak]) return { panah: [], petak: {} };
      return { ...lama, petak: { ...lama.petak, [petak]: warna } };
    });
  }

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

  const crumbs = [
    { label: t("common.home"), to: "/" },
    { label: t("tekaTeki.judul") },
  ];

  const orientasi = masalah?.first === "Black to Move" ? "b" : "w";
  const sudahPecah = masalah ? terpecahkan.has(masalah.problemid) : false;

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1024px] px-6 py-8 md:px-8 md:py-12">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 md:text-sm"
          >
            {crumbs.map((c, i) => (
              <span
                key={`${c.label}-${i}`}
                className="flex items-center gap-2"
              >
                {i > 0 && <span aria-hidden="true">/</span>}
                {c.to ? (
                  <Link
                    to={c.to}
                    className="hover:text-primary hover:underline"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-800">
                    {c.label}
                  </span>
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
              <p className="mb-6 text-sm text-slate-500">
                {t("tekaTeki.memuat")}
              </p>
              <KerangkaTekaTeki />
            </div>
          ) : (
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
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
                  setBidak={setBidak}
                  sedangSeret={sedangSeret}
                  onKlik={klikPetak}
                  onPilih={pilihPetak}
                  onMulaiSeret={mulaiSeret}
                  onSelesaiSeret={selesaiSeret}
                  onBatalSeret={batalkanSeret}
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
                      masalah.first === "White to Move"
                        ? "bg-white ring-1 ring-slate-400"
                        : "bg-slate-800"
                    }`}
                  />
                  {t(
                    masalah.first === "White to Move"
                      ? "tekaTeki.giliranPutih"
                      : "tekaTeki.giliranHitam"
                  )}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-7 text-slate-600 md:text-base">
                  {t("tekaTeki.caraMain")}
                </p>

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

                <div className="mt-5 flex gap-3">
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
                </div>

                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={pilihAcak}
                    title={t("tekaTeki.acak")}
                    aria-label={t("tekaTeki.acak")}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="16 3 21 3 21 8" />
                      <line x1="4" y1="20" x2="21" y2="3" />
                      <polyline points="21 16 21 21 16 21" />
                      <line x1="15" y1="15" x2="21" y2="21" />
                      <line x1="4" y1="4" x2="9" y2="9" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => pindahSoal(indeks - 1)}
                    title={t("tekaTeki.sebelumnya")}
                    aria-label={t("tekaTeki.sebelumnya")}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtomatis((v) => !v)}
                    title={
                      otomatis
                        ? "Nonaktifkan next otomatis"
                        : "Aktifkan next otomatis"
                    }
                    aria-label={
                      otomatis
                        ? "Nonaktifkan next otomatis"
                        : "Aktifkan next otomatis"
                    }
                    className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {otomatis ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                      >
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                      >
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => pindahSoal(indeks + 1)}
                    title={t("tekaTeki.berikutnya")}
                    aria-label={t("tekaTeki.berikutnya")}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    →
                  </button>
                </div>

                <div className="mt-6 max-w-xs">
                  <form
                    onSubmit={bukaNomor}
                    className="flex items-center gap-2"
                  >
                    <label
                      htmlFor="ingat-posisi"
                      title={t("tekaTeki.ingatPosisi")}
                      className="shrink-0 cursor-pointer"
                    >
                      <input
                        id="ingat-posisi"
                        type="checkbox"
                        checked={ingatPosisi}
                        onChange={(e) => ubahIngat(e.target.checked)}
                        className="h-4 w-4 accent-[#0b2f9f]"
                      />
                    </label>
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
                  </form>
                  {galatNomor && (
                    <p
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-red-600"
                    >
                      {galatNomor}
                    </p>
                  )}
                </div>

                <div className="mt-4 max-w-xs">
                  <select
                    id="pilih-set-bidak"
                    value={setBidak}
                    onChange={(e) => setSetBidak(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {DAFTAR_SET.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                </div>

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