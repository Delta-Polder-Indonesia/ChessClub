import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Hero from "../../components/Hero.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece, DAFTAR_SET } from "../Beranda/ChessPieceSvg.jsx";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";

const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Urutan pilihan bidak promosi (menteri, benteng, gajah, kuda). */
const PILIHAN_PROMOSI = ["q", "r", "b", "n"];
const KUCI_NAMA_PROMOSI = {
  q: "tekaTeki.promosiMenteri",
  r: "tekaTeki.promosiBenteng",
  b: "tekaTeki.promosiGajah",
  n: "tekaTeki.promosiKuda",
};

/** Replay deret SAN menjadi FEN (dipakai untuk undo & memuat jalur katalog). */
function fenDariLangkah(daftarSan) {
  const game = new Chess();
  for (const san of daftarSan) game.move(san);
  return game.fen();
}

/** Susun deret SAN menjadi teks PGN sederhana ("1. e4 e5 2. Nf3 …"). */
function susunPgn(daftarSan) {
  const bagian = [];
  for (let i = 0; i < daftarSan.length; i += 2) {
    const nomor = i / 2 + 1;
    const putih = daftarSan[i];
    const hitam = daftarSan[i + 1];
    bagian.push(`${nomor}. ${putih}${hitam ? ` ${hitam}` : ""}`);
  }
  return bagian.join(" ");
}

/** Kumpulkan katalog (nama + jalur terpendek) lewat DFS dari pohon pembukaan. */
function susunKatalog(pohon) {
  const hasil = [];
  (function telusur(node, jalur) {
    if (node.n) {
      for (const [eco, nama] of node.n) {
        hasil.push({ eco, nama, langkah: [...jalur] });
      }
    }
    for (const [san, anak] of Object.entries(node.c || {})) {
      jalur.push(san);
      telusur(anak, jalur);
      jalur.pop();
    }
  })(pohon, []);
  hasil.sort((a, b) => (a.eco === b.eco ? a.nama.localeCompare(b.nama) : a.eco.localeCompare(b.eco)));
  return hasil;
}

/** Pola langkah koordinat ("e2e4") — dipakai untuk membedakan jenis kunci pohon. */
const POLA_KOORDINAT = /^[a-h][1-8][a-h][1-8]$/;

/**
 * Ubah buku pembukaan berformat "daftar rata" (format Lichess, mis.
 * [{ eco, opening, moves: "e2e4 e7e5 g1f3 …" }, …]) menjadi pohon langkah
 * ber-key koordinat: node = { "n"?: [[eco, nama], …], "c"?: {…} }.
 * Konversi ini murni penyusunan string sehingga cepat (tidak butuh chess.js).
 */
function pohonDariDaftar(daftar) {
  const akar = {};
  for (const entri of daftar) {
    const eco = entri.eco || entri.code || "?";
    const nama = entri.opening || entri.name;
    const langkah = String(entri.moves || entri.uci || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!nama || !langkah.length) continue;
    let node = akar;
    for (const k of langkah) {
      if (!node.c) node.c = {};
      if (!node.c[k]) node.c[k] = {};
      node = node.c[k];
    }
    if (!node.n) node.n = [];
    if (!node.n.some(([e, n]) => e === eco && n === nama)) {
      node.n.push([eco, nama]);
    }
  }
  return akar;
}

/** Tebak kunci pohon: koordinat ("e2e4") atau SAN ("e4", "Nf3", …). */
function modeDariPohon(pohon) {
  const kunci = Object.keys((pohon && pohon.c) || {});
  if (!kunci.length) return "koordinat";
  return kunci.every((k) => POLA_KOORDINAT.test(k)) ? "koordinat" : "san";
}

/** Kunci pohon untuk satu pindahan: koordinat atau SAN, sesuai mode. */
function kuciDariPindahan(pindah, mode) {
  return mode === "koordinat" ? `${pindah.from}${pindah.to}` : pindah.san;
}

/** Ubah satu langkah koordinat menjadi SAN pada posisi `game` (lalu undo). */
function sanDiPosisi(game, koordinat) {
  try {
    const pindah = game.move({ from: koordinat.slice(0, 2), to: koordinat.slice(2, 4) });
    if (pindah) {
      game.undo();
      return pindah.san;
    }
  } catch {}
  return koordinat;
}

/** Replay deret koordinat menjadi { fen, san } (untuk memuat jalur katalog). */
function fenDanSanDariKoordinat(daftarKoordinat) {
  const game = new Chess();
  const san = [];
  for (const k of daftarKoordinat) {
    let pindah;
    try {
      pindah = game.move({ from: k.slice(0, 2), to: k.slice(2, 4) });
    } catch {
      pindah = null;
    }
    if (!pindah) return null;
    san.push(pindah.san);
  }
  return { fen: game.fen(), san };
}

/** Pratinjau SAN untuk deret koordinat (dipakai daftar katalog; di-cache). */
const KACI_PRATINJAU = new Map();
function pratinjauSan(daftarKoordinat) {
  const kuci = daftarKoordinat.slice(0, 6).join(" ");
  if (KACI_PRATINJAU.has(kuci)) return KACI_PRATINJAU.get(kuci);
  const game = new Chess();
  const san = [];
  for (const k of daftarKoordinat.slice(0, 6)) {
    try {
      const pindah = game.move({ from: k.slice(0, 2), to: k.slice(2, 4) });
      if (!pindah) break;
      san.push(pindah.san);
    } catch {
      break;
    }
  }
  const teks = san.join(" ") + (daftarKoordinat.length > 6 ? " …" : "");
  KACI_PRATINJAU.set(kuci, teks);
  return teks;
}

function Kerangka() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-40 rounded-lg bg-slate-200" />
      <div className="mt-4 h-4 w-56 rounded bg-slate-200" />
    </div>
  );
}

export default function PapanInteraktif() {
  const { t } = useI18n();

  const [pohon, setPohon] = useState(null);
  const [mode, setMode] = useState("koordinat"); // "koordinat" | "san"
  const [gagal, setGagal] = useState(false);

  const [fen, setFen] = useState(FEN_AWAL);
  const [riwayat, setRiwayat] = useState([]); // SAN, untuk PGN
  const [jalur, setJalur] = useState([]); // kunci pohon, untuk menelusuri pembukaan
  const [orientasi, setOrientasi] = useState("w");

  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [kesalahan, setKesalahan] = useState(null);
  const [promosi, setPromosi] = useState(null); // { from, to, warna }

  const [tanda, setTanda] = useState({ panah: [], petak: {} });
  const [setBidak, setSetBidak] = useState("merida");

  const [cari, setCari] = useState("");
  const [tersalin, setTersalin] = useState(false);

  const abaikanKlikRef = useRef(false);
  const timerSalah = useRef(null);
  const timerSalin = useRef(null);

  /* ----------------------------------------------------- muat data pohon */
  useEffect(() => {
    let aktif = true;
    fetch(`${import.meta.env.BASE_URL}data/buku-pembukaan.json`)
      .then((respon) => {
        if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
        return respon.json();
      })
      .then((data) => {
        if (!aktif) return;
        // Daftar rata (format Lichess) → bangun pohon koordinat di tempat.
        // Objek pohon → pakai langsung (dukung kunci SAN lama maupun koordinat).
        if (Array.isArray(data)) {
          setPohon(pohonDariDaftar(data));
          setMode("koordinat");
        } else {
          setPohon(data);
          setMode(modeDariPohon(data));
        }
      })
      .catch(() => {
        if (aktif) setGagal(true);
      });
    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => {
    document.title = `${t("papan.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  useEffect(
    () => () => {
      window.clearTimeout(timerSalah.current);
      window.clearTimeout(timerSalin.current);
    },
    []
  );

  /* ------------------------------------------------ pembukaan saat ini */
  const infoPembukaan = useMemo(() => {
    if (!pohon) return { nama: null, saran: [], cocok: false };
    let node = pohon;
    let namaTerdalam = null;
    let cocok = true;
    for (const k of jalur) {
      if (!node.c || !node.c[k]) {
        cocok = false;
        break;
      }
      node = node.c[k];
      if (node.n && node.n.length) namaTerdalam = node.n;
    }
    let saran = [];
    if (cocok) {
      const game = new Chess(fen);
      saran = Object.entries(node.c || {})
        .slice(0, 8)
        .map(([k, anak]) => ({
          k,
          san: mode === "koordinat" ? sanDiPosisi(game, k) : k,
          nama: anak.n && anak.n.length ? anak.n[0][1] : null,
        }));
    }
    return { nama: namaTerdalam, saran, cocok };
  }, [pohon, jalur, fen, mode]);

  const katalog = useMemo(() => (pohon ? susunKatalog(pohon) : []), [pohon]);

  const hasilCari = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return [];
    const ecoQ = cari.trim().toUpperCase();
    return katalog
      .filter((k) => k.nama.toLowerCase().includes(q) || k.eco.includes(ecoQ))
      .slice(0, 60);
  }, [cari, katalog]);

  /* ------------------------------------------------------ gerakan bidak */
  function pilihPetak(petak) {
    if (!fen || promosi) return;
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

  function klikPetak(petak) {
    if (!fen || promosi) return;
    if (abaikanKlikRef.current) {
      abaikanKlikRef.current = false;
      return;
    }
    if (tanda.panah.length > 0 || Object.keys(tanda.petak).length > 0) {
      setTanda({ panah: [], petak: {} });
    }
    if (terpilih && sasaran.includes(petak)) {
      cobaLangkah(terpilih, petak);
      return;
    }
    pilihPetak(petak);
  }

  function cobaLangkah(from, to, promo) {
    const game = new Chess(fen);

    // Bidak menuju baris terakhir → wajib promosi.
    let butuhPromosi = false;
    let warnaPromosi = "w";
    try {
      const bidak = game.get(from);
      if (bidak && bidak.type === "p" && (to.endsWith("8") || to.endsWith("1"))) {
        butuhPromosi = true;
        warnaPromosi = bidak.color;
      }
    } catch {}

    if (butuhPromosi && !promo) {
      setPromosi({ from, to, warna: warnaPromosi });
      setTerpilih(null);
      setSasaran([]);
      return;
    }

    let pindah;
    try {
      pindah = game.move({ from, to, promotion: promo });
    } catch {
      pindah = null;
    }

    if (!pindah) {
      window.clearTimeout(timerSalah.current);
      setKesalahan({ from, to });
      setTerpilih(null);
      setSasaran([]);
      timerSalah.current = window.setTimeout(() => setKesalahan(null), 700);
      return;
    }

    setFen(game.fen());
    setRiwayat((lama) => [...lama, pindah.san]);
    setJalur((lama) => [...lama, kuciDariPindahan(pindah, mode)]);
    setLangkahAkhir({ from, to });
    setTerpilih(null);
    setSasaran([]);
    setKesalahan(null);
    setPromosi(null);
  }

  /** Mainkan satu SAN (dipakai chip saran) — menangani promosi otomatis. */
  function mainkanSan(san) {
    const game = new Chess(fen);
    let pindah;
    try {
      pindah = game.move(san);
    } catch {
      return;
    }
    setFen(game.fen());
    setRiwayat((lama) => [...lama, pindah.san]);
    setJalur((lama) => [...lama, kuciDariPindahan(pindah, mode)]);
    setLangkahAkhir({ from: pindah.from, to: pindah.to });
    setTerpilih(null);
    setSasaran([]);
  }

  function pilihPromosi(bidakPromosi) {
    if (!promosi) return;
    const { from, to } = promosi;
    setPromosi(null);
    cobaLangkah(from, to, bidakPromosi);
  }

  function batalPromosi() {
    setPromosi(null);
    setTerpilih(null);
    setSasaran([]);
  }

  useEffect(() => {
    if (!promosi) return;
    function saatEscape(e) {
      if (e.key === "Escape") batalPromosi();
    }
    window.addEventListener("keydown", saatEscape);
    return () => window.removeEventListener("keydown", saatEscape);
  }, [promosi]);

  const mulaiSeret = useCallback(
    (petak) => {
      if (!fen || promosi) return;
      const game = new Chess(fen);
      const bidak = game.get(petak);
      if (bidak && bidak.color === game.turn()) {
        abaikanKlikRef.current = false;
        pilihPetak(petak);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fen, promosi]
  );

  const selesaiSeret = useCallback(
    (from, to) => {
      if (!fen || promosi) return;
      if (!to || from === to) return;
      abaikanKlikRef.current = true;
      cobaLangkah(from, to);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fen, promosi]
  );

  const batalkanSeret = useCallback(() => {
    abaikanKlikRef.current = true;
    setTerpilih(null);
    setSasaran([]);
  }, []);

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

  /* ------------------------------------------------------ kontrol papan */
  function reset() {
    setFen(FEN_AWAL);
    setRiwayat([]);
    setJalur([]);
    setOrientasi("w");
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setPromosi(null);
    setTanda({ panah: [], petak: {} });
  }

  function undo() {
    if (!riwayat.length) return;
    const baru = riwayat.slice(0, -1);
    setRiwayat(baru);
    setJalur((lama) => lama.slice(0, -1));
    setFen(fenDariLangkah(baru));
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setPromosi(null);
  }

  function salinPgn() {
    if (!riwayat.length) return;
    const teks = susunPgn(riwayat);
    const selesai = () => {
      setTersalin(true);
      window.clearTimeout(timerSalin.current);
      timerSalin.current = window.setTimeout(() => setTersalin(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(teks).then(selesai).catch(selesai);
    } else {
      selesai();
    }
  }

  function muatJalur(entri) {
    if (mode === "koordinat") {
      const hasil = fenDanSanDariKoordinat(entri.langkah);
      if (!hasil) return;
      setRiwayat(hasil.san);
      setJalur([...entri.langkah]);
      setFen(hasil.fen);
    } else {
      setRiwayat([...entri.langkah]);
      setJalur([...entri.langkah]);
      setFen(fenDariLangkah(entri.langkah));
    }
    setOrientasi("w");
    setTerpilih(null);
    setSasaran([]);
    setLangkahAkhir(null);
    setPromosi(null);
    setTanda({ panah: [], petak: {} });
  }

  /* ------------------------------------------------------------ tampilan */
  const crumbs = [
    { label: t("common.home"), to: "/" },
    { label: t("papan.judul") },
  ];

  const namaUtama = infoPembukaan.nama ? infoPembukaan.nama[0] : null;
  const jumlahNama = infoPembukaan.nama ? infoPembukaan.nama.length : 0;

  return (
    <>
      <Hero
        title={t("papan.judul")}
        description={t("papan.deskripsi")}
        crumbs={crumbs}
      />

      <main className="px-6 md:px-8">
        <div className="mx-auto max-w-[1024px] py-10 md:py-16">
          {gagal ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {t("papan.gagalMuat")}
            </p>
          ) : !pohon ? (
            <div className="mx-auto max-w-[560px]">
              <p className="mb-6 text-sm text-slate-500">{t("papan.memuat")}</p>
              <Kerangka />
            </div>
          ) : (
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="mx-auto w-full max-w-[520px] shrink-0 lg:mx-0">
                <div className="relative">
                  <PapanTekaTeki
                    fen={fen}
                    orientasi={orientasi}
                    terpilih={terpilih}
                    sasaran={sasaran}
                    kesalahan={kesalahan}
                    langkahAkhir={langkahAkhir}
                    tanda={tanda}
                    terkunci={!!promosi}
                    membeku={false}
                    setBidak={setBidak}
                    onKlik={klikPetak}
                    onMulaiSeret={mulaiSeret}
                    onSelesaiSeret={selesaiSeret}
                    onBatalSeret={batalkanSeret}
                    onJatuh={cobaLangkah}
                    onTandaPetak={tandaPetak}
                    onTandaPanah={tandaPanah}
                  />

                  {promosi && (
                    <div
                      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40"
                      onClick={batalPromosi}
                    >
                      <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={t("tekaTeki.promosiJudul")}
                        className="flex flex-col items-center gap-3 rounded-lg bg-white/95 p-4 shadow-xl ring-1 ring-black/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          {t(
                            promosi.warna === "w"
                              ? "tekaTeki.promosiPutih"
                              : "tekaTeki.promosiHitam"
                          )}
                        </p>
                        <div className="flex gap-2">
                          {PILIHAN_PROMOSI.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => pilihPromosi(p)}
                              aria-label={t(KUCI_NAMA_PROMOSI[p])}
                              title={t(KUCI_NAMA_PROMOSI[p])}
                              className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 p-1.5 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <ChessPiece
                                piece={promosi.warna === "w" ? p.toUpperCase() : p}
                                set={setBidak}
                                className="h-full w-full"
                              />
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={batalPromosi}
                          className="text-xs font-medium text-slate-500 underline-offset-2 transition hover:text-slate-700 hover:underline"
                        >
                          {t("tekaTeki.promosiBatal")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">
                      {t("papan.setBidak")}
                    </label>
                    <select
                      value={setBidak}
                      onChange={(e) => setSetBidak(e.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {DAFTAR_SET.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setOrientasi((o) => (o === "w" ? "b" : "w"))}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {t("papan.flip")}
                    </button>
                    <button
                      type="button"
                      onClick={undo}
                      disabled={!riwayat.length}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("papan.undo")}
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {t("papan.reset")}
                    </button>
                    <button
                      type="button"
                      onClick={salinPgn}
                      disabled={!riwayat.length}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {tersalin ? t("papan.tersalin") : t("papan.salinPgn")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t("papan.pembukaan")}
                  </p>
                  {namaUtama ? (
                    <div className="mt-1.5">
                      <p className="text-lg font-bold text-slate-900">
                        {namaUtama[1]}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                          {namaUtama[0]}
                        </span>
                        {jumlahNama > 1 && (
                          <span
                            title={infoPembukaan.nama.map((n) => n[1]).join(" • ")}
                            className="text-xs text-slate-500"
                          >
                            +{jumlahNama - 1} {t("papan.variasi")}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-sm font-medium text-slate-600">
                      {infoPembukaan.cocok && !riwayat.length
                        ? t("papan.petunjukAwal")
                        : t("papan.belumAdaNama")}
                    </p>
                  )}

                  {!infoPembukaan.cocok && (
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      {t("papan.diLuarBuku")}
                    </p>
                  )}

                  {infoPembukaan.saran.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-500">
                        {t("papan.langkahBerikutnya")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {infoPembukaan.saran.map((s) => (
                          <button
                            key={s.k}
                            type="button"
                            onClick={() => mainkanSan(s.san)}
                            title={s.nama || s.san}
                            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
                          >
                            {s.san}
                            {s.nama ? <span className="ml-1 font-normal text-slate-400">{s.nama}</span> : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t("papan.katalog")}
                  </p>
                  <input
                    type="text"
                    value={cari}
                    onChange={(e) => setCari(e.target.value)}
                    placeholder={t("papan.cariPembukaan")}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {cari.trim() ? (
                    hasilCari.length ? (
                      <>
                        <p className="mt-1.5 text-xs text-slate-500">
                          {t("papan.menampilkan", {
                            n: hasilCari.length,
                            total: katalog.length,
                          })}
                        </p>
                        <DaftarKatalog entri={hasilCari} onMuat={muatJalur} mode={mode} />
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        {t("papan.tidakAdaHasil", { q: cari.trim() })}
                      </p>
                    )
                  ) : (
                    <DaftarKatalog
                      entri={katalog.slice(0, 40)}
                      onMuat={muatJalur}
                      mode={mode}
                    />
                  )}
                </div>

                <div className="mt-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {t("papan.riwayat")}
                  </p>
                  <p className="min-h-[2.5rem] break-words rounded-md bg-slate-50 px-3 py-2 font-mono text-xs leading-6 text-slate-700">
                    {riwayat.length ? susunPgn(riwayat) : t("papan.kosong")}
                  </p>
                </div>

                <p className="mt-6 border-t border-slate-200 pt-4 text-xs leading-6 text-slate-400">
                  {t("papan.sumber")}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function DaftarKatalog({ entri, onMuat, mode }) {
  if (!entri.length) return null;
  return (
    <ul className="mt-2 max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white">
      {entri.map((k) => (
        <li key={`${k.eco}-${k.nama}-${k.langkah.join(" ")}`} className="border-b border-slate-100 last:border-0">
          <button
            type="button"
            onClick={() => onMuat(k)}
            className="flex w-full items-baseline gap-2 px-3 py-2 text-left transition hover:bg-slate-50"
          >
            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600">
              {k.eco}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
              {k.nama}
            </span>
            <span className="hidden shrink-0 truncate font-mono text-xs text-slate-400 sm:block">
              {mode === "koordinat"
                ? pratinjauSan(k.langkah)
                : k.langkah.slice(0, 6).join(" ") + (k.langkah.length > 6 ? " …" : "")}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
