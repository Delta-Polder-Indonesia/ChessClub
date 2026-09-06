/*
 * Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa
 * cek README.
 *
 * Penyesuaian lokal (sesuai permintaan pengguna + konvensi repo ini):
 *  - Pemilih Chess.com TIDAK lagi membuka daftar bulan yang harus diklik satu
 *    per satu. Semua arsip bulan diambil otomatis (dengan batas antrean 4
 *    permintaan, progres, dan tombol batal), lalu disajikan sebagai SATU
 *    tabel terperinci yang bisa dicari, diurutkan, dan dihalaman.
 *  - GamesUI (dipakai juga Lichess) memuat kolom tambahan "Langkah" (jumlah
 *    langkah/ply), penomoran halaman, dan legenda hasil relatif terhadap
 *    pemain yang dicari.
 */
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnalyzeContext } from "../../../konteks/analyze.jsx";
import { pushPageError } from "../../errors/pageErrors.jsx";
import { hitungPlyPgn } from "../../../../../lib/pgnRingan.js";
import Files from "../../svg/files.jsx";
import Database from "../../svg/database.jsx";
import SquareFillEqual from "../../svg/square-fill-equal.jsx";
import SquareFillMinus from "../../svg/square-fill-minus.jsx";
import SquareFillPlus from "../../svg/square-fill-plus.jsx";
import { ErrorsContext } from "../../../konteks/errors.jsx";
import { useI18n } from "../../../../../lib/i18n.jsx";
import { ambilDaftarPartai, simpanBanyakPartai } from "../../../basisData.js";
/** Kunci pesan galat (lihat kamus analisa.partai.*) — dipakai juga oleh halaman Lichess. */
const GAMES_ERROR = ["analisa.partai.galatJaringan", "analisa.partai.galatJaringanIsi"];
const USER_ERROR = ["analisa.partai.galatPengguna", "analisa.partai.galatPenggunaIsi"];
const API_BLOCKING_ERROR = ["analisa.partai.galatBatas", "analisa.partai.galatBatasIsi"];
const PLATFORM = "Chess.com";
const PLAYER_URL = "https://www.chess.com/member/";
/** Berapa banyak partai per halaman pada tabel agregat. */
const BARIS_PER_HALAMAN = 100;
/** Berapa banyak arsip bulan yang diambil bersamaan (batas wajar untuk API publik). */
const ANTREAN_ARSIP = 4;

function IkonRefresh({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

/** Nama bulan lewat Intl: mengikuti bahasa antarmuka, jadi tidak perlu tabel manual. */
function getMonthName(month, locale = "id") {
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2000, month - 1, 1));
}
function capitalizeFirst(string) {
  return string[0].toUpperCase() + string.substring(1).toLowerCase();
}
/** Format tanggal penuh singkat: 12 Agu 2026 (atau 12 Aug 2026 dalam EN). */
function formatTanggal(timestamp, locale) {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(timestamp));
  } catch {
    return "";
  }
}
function Loading(props) {
  const { t } = useI18n();
  const [ellipsis, setEllipsis] = useState("");
  const ellipsisRef = useRef(ellipsis);
  useEffect(() => {
    ellipsisRef.current = ellipsis;
  }, [ellipsis]);
  useEffect(() => {
    function animateEllipsis() {
      const ellipsis2 = ellipsisRef.current;
      if (ellipsis2.length >= 3) {
        setEllipsis("");
      } else {
        setEllipsis(ellipsis2 + ".");
      }
    }
    const ellipsisInterval = setInterval(animateEllipsis, 300);
    return () => clearInterval(ellipsisInterval);
  }, []);
  return <div className="flex flex-col flex-grow">
                    <div className="flex-grow flex flex-col justify-center items-center">
                        <div className="w-[70%] bg-backgroundBox relative overflow-hidden rounded-borderExtraRoundness text-sm text-foregroundGrey flex flex-col gap-6 pb-6 pt-10 items-center">
                            <div className="flex flex-col items-center gap-3">
                                <Files className="animate-[pulse_1.25s_cubic-bezier(0.4,_0,_0.6,_1)_infinite;] scale-x-[-1]" size={44} />
                                <span className="text-base text-foreground font-semibold">{props.whatIsLoading}</span>
                                <span>{t("analisa.partai.mengambilApi")}{ellipsis}</span>
                                {props.progres ? <span className="text-xs text-foregroundGrey">{props.progres}</span> : null}
                            </div>
                            <button onClick={props.abort} className="hover:text-foreground transition-colors" type="button">{t("analisa.muat.batal")}</button>
                        </div>
                    </div>
                </div>;
}
function SimpleLoading(props) {
  const { t } = useI18n();
  const [ellipsis, setEllipsis] = useState("");
  const ellipsisRef = useRef(ellipsis);
  useEffect(() => {
    ellipsisRef.current = ellipsis;
  }, [ellipsis]);
  useEffect(() => {
    function animateEllipsis() {
      const ellipsis2 = ellipsisRef.current;
      if (ellipsis2.length >= 3) {
        setEllipsis("");
      } else {
        setEllipsis(ellipsis2 + ".");
      }
    }
    const ellipsisInterval = setInterval(animateEllipsis, 300);
    return () => clearInterval(ellipsisInterval);
  }, []);
  return <div className="text-sm text-foregroundGrey animate-[pulse_1.25s_cubic-bezier(0.4,_0,_0.6,_1)_infinite;] w-fit my-4 m-auto">
            {t("analisa.partai.memuat")} {props.whatIsLoading}{ellipsis}
        </div>;
}

/** Ubah satu objek partai mentah Chess.com jadi baris tabel yang aman. */
function olahPartaiChessCom(game) {
  const pgn = typeof game?.pgn === "string" ? game.pgn : "";
  if (!pgn) return null;
  /*
   * Jumlah langkah dihitung RINGAN dari teks PGN (lihat lib/pgnRingan.js).
   * Dulu memakai `new Chess().loadPgn(pgn)` untuk SETIAP partai pada seluruh
   * akun — menyusun ulang seluruh papan untuk ribuan partai hanya untuk
   * angka di kolom "Langkah". Itu penyebab pemuatan terasa berat.
   */
  let plyCount = hitungPlyPgn(pgn);
  if (Number.isNaN(plyCount) || plyCount <= 0) return null;
  const putih = game.white ?? {};
  const hitam = game.black ?? {};
  let hasil = "draw";
  if (putih.result === "win") hasil = "white";
  else if (hitam.result === "win") hasil = "black";
  const endTime = typeof game.end_time === "number" ? game.end_time : 0;
  return {
    pgn,
    whiteName: putih.username ?? "",
    blackName: hitam.username ?? "",
    whiteElo: putih.rating ?? 0,
    blackElo: hitam.rating ?? 0,
    result: hasil,
    timestamp: endTime * 1e3,
    timeClass: game.time_class ?? "unknown",
    plyCount,
  };
}
function nilaiHasil(gameInfo) {
  if (gameInfo.result === "white") return 1;
  if (gameInfo.result === "black") return -1;
  return 0;
}

function GamesUI(props) {
  const { t, bahasa: locale } = useI18n();
  const { gamesInfo, loading, username, setData } = props;
  // Pencarian bebas: cocokkan nama pemain putih/hitam (huruf besar/kecil diabaikan).
  const [cari, setCari] = useState("");
  // Pengurutan tabel: kolom aktif + arah. Bawaan: tanggal terbaru di atas.
  const [urut, setUrut] = useState({ kolom: "tanggal", arah: "desc" });
  const [hal, setHal] = useState(1);

  // Ganti daftar/kata kunci/urutan → kembali ke halaman pertama.
  useEffect(() => {
    setHal(1);
  }, [gamesInfo, cari, urut]);

  // Daftar partai setelah disaring pencarian, lalu diurutkan.
  const terfilter = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    if (!kata) return gamesInfo;
    return gamesInfo.filter(
      (g) =>
        g.whiteName?.toLowerCase().includes(kata) ||
        g.blackName?.toLowerCase().includes(kata)
    );
  }, [gamesInfo, cari]);

  const terurut = useMemo(() => {
    const { kolom, arah } = urut;
    const pengali = arah === "asc" ? 1 : -1;
    return [...terfilter].sort((a, b) => {
      if (kolom === "tanggal") return (a.timestamp - b.timestamp) * pengali;
      if (kolom === "hasil") return (nilaiHasil(a) - nilaiHasil(b)) * pengali;
      if (kolom === "langkah") return ((a.plyCount ?? 0) - (b.plyCount ?? 0)) * pengali;
      // kolom "pemain": urut berdasarkan nama putih, lalu hitam.
      if (kolom === "pemain") {
        const banding =
          a.whiteName.localeCompare(b.whiteName, locale) ||
          a.blackName.localeCompare(b.blackName, locale);
        return banding * pengali;
      }
      return 0;
    });
  }, [terfilter, urut, locale]);

  const totalHal = Math.max(1, Math.ceil(terurut.length / BARIS_PER_HALAMAN));
  const aktifHal = Math.min(hal, totalHal);
  const tampil = terurut.slice((aktifHal - 1) * BARIS_PER_HALAMAN, aktifHal * BARIS_PER_HALAMAN);

  /** Balik arah bila kolom sama, atau mulai arah baru (tanggal: terbaru dulu). */
  function ubahUrut(kolom) {
    setUrut((lama) =>
      lama.kolom === kolom
        ? { kolom, arah: lama.arah === "asc" ? "desc" : "asc" }
        : { kolom, arah: kolom === "tanggal" ? "desc" : "asc" }
    );
  }

  const IkonUrut = ({ kolom }) =>
    urut.kolom === kolom ? (
      <span className="ml-1 inline-block w-3 text-foregroundGrey">{urut.arah === "asc" ? "↑" : "↓"}</span>
    ) : (
      <span className="ml-1 inline-block w-3 text-foregroundGrey opacity-40">↕</span>
    );

  return <>
            {loading ? <SimpleLoading whatIsLoading={t("analisa.tab.pilihPartai")} /> : null}
            <div className="px-8 pt-2">
              <input
                type="search"
                value={cari}
                onChange={(e) => setCari(e.currentTarget.value)}
                placeholder={t("analisa.partai.cari")}
                aria-label={t("analisa.partai.cari")}
                className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
              />
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-8 pt-1.5 text-xs text-foregroundGrey">
              <span>{t("analisa.partai.pilihPartai")}</span>
              <span className="flex flex-wrap items-baseline gap-x-3">
                <span>{t("analisa.partai.legenda", { pemain: username })}</span>
                <span className="font-semibold text-foreground text-sm">{t("analisa.partai.jumlahPartai", { jumlah: gamesInfo.length })}</span>
              </span>
            </div>
            <div className="w-full overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                    <thead style={{ display: loading ? "none" : "" }}>
                        <tr>
                            <th className="py-2 pl-8 pr-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                              <button type="button" onClick={() => ubahUrut("pemain")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors">
                                {t("analisa.partai.pemain")}<IkonUrut kolom="pemain" />
                              </button>
                            </th>
                            <th className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                              <button type="button" onClick={() => ubahUrut("hasil")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors">
                                {t("analisa.partai.hasil")}<IkonUrut kolom="hasil" />
                              </button>
                            </th>
                            <th className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                              <button type="button" onClick={() => ubahUrut("tanggal")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors">
                                {t("analisa.partai.tanggal")}<IkonUrut kolom="tanggal" />
                              </button>
                            </th>
                            <th className="py-2 pl-3 pr-8 text-right text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                              <button type="button" onClick={() => ubahUrut("langkah")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors">
                                {t("analisa.partai.jumlahLangkah")}<IkonUrut kolom="langkah" />
                              </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tampil.map((gameInfo, i) => {
    const { pgn, whiteName, blackName, whiteElo, blackElo, result, timestamp, timeClass, plyCount } = gameInfo;
    const whiteWon = result === "white";
    const blackWon = result === "black";
    const isWin = whiteWon && whiteName.toLowerCase() === username.toLowerCase() || blackWon && blackName.toLowerCase() === username.toLowerCase();
    const isLoss = whiteWon && whiteName.toLowerCase() !== username.toLowerCase() || blackWon && blackName.toLowerCase() !== username.toLowerCase();
    const kelasWaktu = t("analisa.partai.kontrolWaktu") + ": " + t(`analisa.partai.kelas.${timeClass ?? "unknown"}`);
    const eloPutih = Number(whiteElo) > 0 ? `(${whiteElo})` : "";
    const eloHitam = Number(blackElo) > 0 ? `(${blackElo})` : "";
    return <tr title={kelasWaktu} onClick={() => setData({ format: "pgn", string: pgn })} className="cursor-pointer select-none border-b border-border transition-colors hover:bg-backgroundBoxHover" key={i}>
                                    <td className="py-2 pl-8 pr-2 w-[36%] min-w-52 overflow-hidden">
                                        <div className="flex flex-row items-center gap-2 text-[13px] leading-5">
                                            <div className={`h-3.5 min-h-3.5 w-3.5 min-w-3.5 shrink-0 bg-evaluationBarWhite rounded-sm ${whiteWon ? "border-[3px] border-winGreen" : ""}`} />
                                            <span className="truncate">{whiteName}</span>
                                            <span className="text-foregroundGrey">{eloPutih}</span>
                                        </div>
                                        <div className="flex flex-row items-center gap-2 text-[13px] leading-5">
                                            <div className={`h-3.5 w-3.5 shrink-0 bg-evaluationBarBlack rounded-sm ${blackWon ? "border-[3px] border-winGreen" : ""}`} />
                                            <span className="truncate">{blackName}</span>
                                            <span className="text-foregroundGrey">{eloHitam}</span>
                                        </div>
                                    </td>
                                    <td className="py-2 px-3">
                                        <div className="flex flex-row items-center gap-2">
                                            <div className="flex w-4 flex-col text-foregroundGrey font-semibold text-[11px] leading-4"><span>{whiteWon ? 1 : blackWon ? 0 : <>&#189;</>}</span><span>{blackWon ? 1 : whiteWon ? 0 : <>&#189;</>}</span></div>
{isWin ? <SquareFillPlus className="h-5 w-5 shrink-0 text-winGreen" /> : isLoss ? <SquareFillMinus className="h-5 w-5 shrink-0 text-lossRed" /> : <SquareFillEqual className="h-5 w-5 shrink-0 text-foregroundGrey" />}
                                          </div>
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap text-[13px]">{formatTanggal(timestamp, locale)}</td>
                                    <td className="py-2 pl-3 pr-8 text-right whitespace-nowrap text-[13px] text-foreground font-semibold tabular-nums">{plyCount ?? ""}</td>
                                </tr>;
  })}
                    {!loading && terurut.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-6 text-center text-sm text-foregroundGrey">
                                {cari.trim() ? t("analisa.partai.tidakCocok") : t("analisa.partai.tidakAda")}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
            {totalHal > 1 ? <div className="flex items-center justify-between gap-2 px-8 py-2.5 text-sm">
                <span className="text-xs text-foregroundGrey">{t("analisa.partai.halaman", { aktif: aktifHal, total: totalHal })}</span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={aktifHal <= 1}
                        onClick={() => setHal((h) => Math.max(1, h - 1))}
                        className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1 text-xs text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted disabled:cursor-default disabled:opacity-40 disabled:hover:bg-backgroundBoxBox disabled:hover:text-foreground"
                    >{t("analisa.partai.sebelumnya")}</button>
                    <button
                        type="button"
                        disabled={aktifHal >= totalHal}
                        onClick={() => setHal((h) => Math.min(totalHal, h + 1))}
                        className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1 text-xs text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted disabled:cursor-default disabled:opacity-40 disabled:hover:bg-backgroundBoxBox disabled:hover:text-foreground"
                    >{t("analisa.partai.berikutnya")}</button>
                </div>
            </div> : null}
        </>;
}

/** Tampilan galat inline + tombol "Muat ulang"/"Kembali ke formulir". */
function GalatInline(props) {
  const { judul, isi, onMuatUlang, onKembali } = props;
  const { t } = useI18n();
  const tombolMuatUlang = t("analisa.partai.ambilLagi");
  const tombolKembali = t("analisa.partai.kembali");
  return <div className="flex flex-col items-center gap-3 px-8 py-10 text-center">
            <p className="text-base font-semibold text-foreground">{judul}</p>
            <p className="max-w-xs text-sm text-foregroundGrey">{isi}</p>
            <div className="flex flex-row gap-2">
                <button type="button" onClick={onMuatUlang} className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted">{tombolMuatUlang}</button>
                <button type="button" onClick={onKembali} className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted">{tombolKembali}</button>
            </div>
        </div>;
}

/**
 * Pemilih partai Chess.com: semua arsip bulan diambil otomatis lalu
 * disajikan sebagai satu tabel (tanpa harus membuka bulan satu per satu).
 */
function SelectChessComGame(props) {
  const { t, bahasa: locale } = useI18n();
  const { username, depth, stopSelecting } = props;
  const [fase, setFase] = useState("muatArsip"); // muatArsip | siap | galatPengguna | galatBatas | galatJaringan
  const [gamesInfo, setGamesInfo] = useState([]);
  const [sumberDb, setSumberDb] = useState(false);
  const [gagal, setGagal] = useState(0);
  const [progres, setProgres] = useState(null); // { selesai, total, bulan }
  const [coba, setCoba] = useState(0);
  const errorsContext = useContext(ErrorsContext);
  const analyzeContext = useContext(AnalyzeContext);
  const setErrors = errorsContext.errors[1];
  const setData = analyzeContext.data[1];
  const sinyalRef = useRef(null);

  // Muat instan dari basis data lokal jika ada
  useEffect(() => {
    let dibatalkan = false;
    ambilDaftarPartai({ platform: "chessCom", username })
      .then((dbData) => {
        if (!dibatalkan && dbData?.partai?.length > 0) {
          setGamesInfo((lama) => (lama.length === 0 ? dbData.partai : lama));
          setSumberDb(true);
          setFase((f) => (f === "muatArsip" ? "siap" : f));
        }
      })
      .catch(() => {});
    return () => {
      dibatalkan = true;
    };
  }, [username]);

  useEffect(() => {
    let dibatalkan = false;
    const sinyal = new AbortController();
    sinyalRef.current = sinyal;

    (async () => {
      try {
        setFase((f) => (gamesInfo.length > 0 ? f : "muatArsip"));
        setGagal(0);
        setProgres(null);

        const res = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`, { signal: sinyal.signal });
        if (!res.ok) throw Object.assign(new Error(String(res.status)), { status: res.status });
        const json = await res.json();
        const arsip = (Array.isArray(json?.archives) ? json.archives : []).toReversed().map((alamat) => {
          const pecahan = alamat.split("/");
          const tahun = pecahan.at(-2);
          const bulan = pecahan.at(-1);
          return { tahun, bulan, url: alamat };
        });
        if (arsip.length === 0) {
          if (!dibatalkan) setFase("siap");
          return;
        }
        if (!dibatalkan) setProgres({ selesai: 0, total: arsip.length, bulan: "" });
        const semua = [];
        let gagalArsip = 0;
        for (let i = 0; i < arsip.length; i += ANTREAN_ARSIP) {
          const potongan = arsip.slice(i, i + ANTREAN_ARSIP);
          const hasil = await Promise.all(potongan.map(async (arsipBulan, j) => {
            const nomor = Math.min(i + j + 1, arsip.length);
            if (!dibatalkan) {
              setProgres({
                selesai: nomor,
                total: arsip.length,
                bulan: `${getMonthName(Number(arsipBulan.bulan), locale)} ${arsipBulan.tahun}`,
              });
            }
            try {
              const jawaban = await fetch(arsipBulan.url, { signal: sinyal.signal });
              if (!jawaban.ok) throw new Error(String(jawaban.status));
              const isi = await jawaban.json();
              const daftar = Array.isArray(isi?.games) ? isi.games : [];
              return daftar.map(olahPartaiChessCom).filter(Boolean);
            } catch (galat) {
              if (galat?.name === "AbortError") throw galat;
              gagalArsip++;
              return [];
            }
          }));
          for (const bagian of hasil) semua.push(...bagian);
        }
        semua.sort((a, b) => b.timestamp - a.timestamp);
        if (semua.length === 0 && gagalArsip > 0) {
          if (!dibatalkan) {
            setFase("galatJaringan");
            await pushPageError(setErrors, t(GAMES_ERROR[0]), t(GAMES_ERROR[1]));
          }
          return;
        }

        // Simpan seluruh partai ke basis data lokal (IndexedDB)
        if (semua.length > 0) {
          simpanBanyakPartai(semua, { platform: "chessCom", username }).catch(() => {});
        }

        if (!dibatalkan) {
          setGagal(gagalArsip);
          setGamesInfo(semua);
          setSumberDb(false);
          setFase("siap");
        }
      } catch (galat) {
        if (galat?.name === "AbortError") return;
        const status = Number(galat?.status ?? galat?.message);
        if (status === 404) {
          if (!dibatalkan) {
            setFase("galatPengguna");
            await pushPageError(setErrors, t(USER_ERROR[0]), t(USER_ERROR[1]));
          }
        } else if (status === 429 || status === 403) {
          if (!dibatalkan) {
            setFase("galatBatas");
            await pushPageError(setErrors, t(API_BLOCKING_ERROR[0]), t(API_BLOCKING_ERROR[1]));
          }
        } else {
          if (!dibatalkan) {
            // Jika sudah ada data dari DB yang tampil, jangan hancurkan tampilan
            if (gamesInfo.length === 0) {
              setFase("galatJaringan");
              await pushPageError(setErrors, t(GAMES_ERROR[0]), t(GAMES_ERROR[1]));
            }
          }
        }
      }
    })();
    return () => {
      dibatalkan = true;
      sinyal.abort();
    };
  }, [username, coba, t, locale, setErrors]);

  const muatUlang = () => {
    setPaksaFetch(true);
    setCoba((n) => n + 1);
  };
  const tombolMuatUlang = t("analisa.partai.ambilLagi");
  const tombolKembali = t("analisa.partai.kembali");

  let galatInline = null;
  if (fase === "galatPengguna") galatInline = { judul: t(USER_ERROR[0]), isi: t(USER_ERROR[1]) };
  else if (fase === "galatBatas") galatInline = { judul: t(API_BLOCKING_ERROR[0]), isi: t(API_BLOCKING_ERROR[1]) };
  else if (fase === "galatJaringan") galatInline = { judul: t(GAMES_ERROR[0]), isi: t(GAMES_ERROR[1]) };

  const memuat = fase === "muatArsip";
  const progresTeks = progres
    ? `${t("analisa.partai.memuatArsip", { bulan: progres.bulan })}${progres.bulan ? " · " : ""}${progres.selesai}/${progres.total}`
    : "";

  return <div className="overflow-y-auto flex flex-col flex-grow">
            <div className="py-3 px-8 sticky top-0 bg-backgroundBox z-10 flex flex-row items-center justify-between gap-3">
              <h1 className="text-lg text-foreground min-w-0"><a target="_blank" rel="noreferrer" href={`${PLAYER_URL}${username}`} className="hover:underline text-foregroundHighlighted text-xl font-bold">{username}</a> <span className="text-foregroundGrey">&middot; {t("analisa.partai.judul", { platform: PLATFORM })}</span></h1>
              <button type="button" onClick={stopSelecting} title={t("analisa.partai.kembali")} aria-label={t("analisa.partai.kembali")} data-uji="tutup-tabel" className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted">✕</button>
            </div>
            <hr className="border-border" />
            {memuat ? <Loading whatIsLoading={t("analisa.tab.pilihPartai")} abort={stopSelecting} progres={progresTeks} /> : null}
            {galatInline ? <GalatInline judul={galatInline.judul} isi={galatInline.isi} onMuatUlang={muatUlang} onKembali={stopSelecting} /> : null}
            {fase === "siap" && gamesInfo.length === 0 ? <div className="flex flex-col items-center gap-4 py-10 px-8 text-center text-sm text-foregroundGrey">
                    <span>{t("analisa.partai.tidakAda")}</span>
                    <div className="flex flex-row gap-2">
                        <button type="button" onClick={muatUlang} className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted">{tombolMuatUlang}</button>
                        <button type="button" onClick={stopSelecting} className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted">{tombolKembali}</button>
                    </div>
                </div> : null}
            {fase === "siap" && gamesInfo.length > 0 ? <>
                {sumberDb ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-8 py-2 text-xs bg-backgroundBoxBox/60 border-b border-border">
                    <span className="flex items-center gap-1.5 font-medium text-foregroundHighlighted">
                      <Database width={14} height={14} className="fill-foregroundHighlighted shrink-0" />
                      <span>{t("analisa.basisData.dimuatDariDb", { jumlah: gamesInfo.length })}</span>
                    </span>
                    <button
                      type="button"
                      onClick={muatUlang}
                      className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1 text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer"
                    >
                      <IkonRefresh className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("analisa.basisData.tarikUlang")}</span>
                    </button>
                  </div>
                ) : null}
                {gagal > 0 ? <div className="flex flex-wrap items-center gap-2 px-8 pt-2 text-xs text-foregroundGrey">
                    <span>{t("analisa.partai.arsipGagal", { jumlah: gagal })}</span>
                    <button type="button" onClick={muatUlang} className="underline hover:text-foregroundHighlighted transition-colors">{tombolMuatUlang}</button>
                </div> : null}
                <GamesUI gamesInfo={gamesInfo} username={username} depth={depth} loading={false} setData={setData} />
            </> : null}
        </div>;
}
export {
  API_BLOCKING_ERROR,
  GAMES_ERROR,
  GamesUI,
  Loading,
  SimpleLoading,
  USER_ERROR,
  capitalizeFirst,
  SelectChessComGame as default,
  getMonthName
};
