import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import PapanTekaTeki from "../TekaTeki/PapanTekaTeki.jsx";
import { BarisProfil } from "../PapanInteraktif/bersama/BarisProfil.jsx";
import { EngineCatur } from "../../lib/engineCatur.js";
import { useI18n } from "../../lib/i18n.jsx";
import { PENGATURAN_AWAL, usePengaturanPapan } from "../PapanInteraktif/bersama/gunakanPengaturanPapan.js";
import { usePengaturanBersama } from "../PapanInteraktif/bersama/PengaturanKonteks.jsx";
import { GALAT_IMPOR, GalatImporLichess, ambilPgnLichess } from "./turingLichess.js";
import {
  JUMLAH_SOAL,
  catatSkor,
  ekstrakPosisi,
  nilaiTebakan,
  persenBenar,
  pilihAcak,
  skorAwal,
  susunSoal,
} from "./turingLogika.js";
import { useTandaBantu } from "../../lib/tandaBantu.js";

/** Kedalaman Stockfish untuk langkah mesin. Cukup untuk pilihan yang wajar. */
const KEDALAMAN_MESIN = 10;

/** Kode galat impor → kunci i18n (literal, supaya dipindai uji-i18n). */
const KUNCI_GALAT_IMPOR = {
  [GALAT_IMPOR.namaTidakSah]: "papan.turingGalatNama",
  [GALAT_IMPOR.tidakDitemukan]: "papan.turingGalatTidakAda",
  [GALAT_IMPOR.batasTercapai]: "papan.turingGalatBatas",
  [GALAT_IMPOR.jaringan]: "papan.turingGalatJaringan",
  [GALAT_IMPOR.kosong]: "papan.turingGalatKosong",
};

/** FEN setelah langkah manusia, dipakai untuk menampilkan hasil tebakan. */
function fenSetelahManusia(fen, uci) {
  const papan = new Chess(fen);
  papan.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  return papan.fen();
}

/**
 * Turing test: pemain menebak langkah mana yang dimainkan manusia dan mana
 * yang dipilih mesin. Langkah manusia berasal dari PGN yang ditempel pemain,
 * langkah mesin dari Stockfish pada posisi yang sama (lihat turingLogika.js).
 */
export default function TuringTest({ pengaturan = null }) {
  const { t } = useI18n();
  const pengaturanLokal = usePengaturanPapan();
  const pengaturanBersama = usePengaturanBersama();
  const pp = (pengaturan ?? pengaturanBersama ?? pengaturanLokal).nilai ?? PENGATURAN_AWAL;

  const [teks, setTeks] = useState("");
  const [namaLichess, setNamaLichess] = useState("");
  const [ambilSedang, setAmbilSedang] = useState(false);
  const ambilRef = useRef(null);
  // input | menyiapkan | tebak | hasil
  const [fase, setFase] = useState("input");
  const [soal, setSoal] = useState([]);
  const [indeks, setIndeks] = useState(0);
  const [jawaban, setJawaban] = useState(null);
  const [skor, setSkor] = useState(skorAwal);
  const [pesan, setPesan] = useState("");
  const { tanda, tandaPetak, tandaPanah, hapusSemuaTanda } = useTandaBantu();
  const engineRef = useRef(null);
  const aktifRef = useRef(true);

  useEffect(() => {
    aktifRef.current = true;
    return () => {
      aktifRef.current = false;
      ambilRef.current?.abort();
      engineRef.current?.tamat();
      engineRef.current = null;
    };
  }, []);

  /** Isi kotak PGN dengan partai akun Lichess. Pemain tetap menekan "Mulai tebak". */
  async function ambilDariLichess() {
    ambilRef.current?.abort();
    const kendali = new AbortController();
    ambilRef.current = kendali;
    setAmbilSedang(true);
    setPesan("");
    try {
      const pgn = await ambilPgnLichess(namaLichess, { signal: kendali.signal });
      if (!aktifRef.current || kendali.signal.aborted) return;
      setTeks(pgn);
    } catch (galat) {
      if (!aktifRef.current || kendali.signal.aborted) return;
      const kode = galat instanceof GalatImporLichess ? galat.kode : GALAT_IMPOR.jaringan;
      setPesan(t(KUNCI_GALAT_IMPOR[kode] ?? "papan.turingGalatJaringan"));
    } finally {
      if (aktifRef.current && ambilRef.current === kendali) {
        setAmbilSedang(false);
        ambilRef.current = null;
      }
    }
  }

  async function mulai() {
    const kandidat = ekstrakPosisi(teks);
    if (kandidat.length === 0) {
      setPesan(t("papan.turingTanpaPosisi"));
      return;
    }
    setPesan("");
    setFase("menyiapkan");
    try {
      if (!engineRef.current) engineRef.current = new EngineCatur({ hash: 16 });
      const mesin = engineRef.current;
      // Worker harus siap dulu; `mulai()` idempoten (memakai janji yang sama).
      await mesin.mulai();
      const hasil = [];
      // Posisi yang langkah mesinnya sama dengan manusia dilewati, jadi
      // urutan kandidat terus dicoba sampai soal terkumpul atau habis.
      for (const p of pilihAcak(kandidat, kandidat.length)) {
        if (hasil.length >= JUMLAH_SOAL) break;
        const { uci } = await mesin.cari({ fen: p.fen, kedalaman: KEDALAMAN_MESIN });
        const s = susunSoal(p, uci);
        if (s) hasil.push(s);
      }
      if (!aktifRef.current) return;
      if (hasil.length === 0) {
        setPesan(t("papan.turingTanpaPosisi"));
        setFase("input");
        return;
      }
      setSoal(hasil);
      setIndeks(0);
      setJawaban(null);
      setSkor(skorAwal());
      hapusSemuaTanda();
      setFase("tebak");
    } catch {
      if (aktifRef.current) {
        setPesan(t("papan.turingGalat"));
        setFase("input");
      }
    }
  }

  function tebak(i) {
    if (jawaban !== null) return;
    const benar = nilaiTebakan(soal[indeks], i);
    setJawaban(i);
    setSkor((s) => catatSkor(s, benar));
  }

  function lanjut() {
    if (indeks + 1 >= soal.length) {
      setFase("hasil");
      return;
    }
    setIndeks(indeks + 1);
    setJawaban(null);
    hapusSemuaTanda();
  }

  const aktif = fase === "tebak" ? soal[indeks] : null;
  const pilihanManusia = aktif?.pilihan.find((x) => x.manusia) ?? null;
  const fenTampil = !aktif
    ? new Chess().fen()
    : jawaban === null
      ? aktif.fen
      : fenSetelahManusia(aktif.fen, pilihanManusia.uci);
  const langkahAkhir = aktif && jawaban !== null
    ? { from: pilihanManusia.uci.slice(0, 2), to: pilihanManusia.uci.slice(2, 4) }
    : null;

  function kelasPilihan(i) {
    const dasar = "rounded-md px-4 py-3 text-left font-semibold transition disabled:cursor-default";
    if (jawaban === null) return `${dasar} bg-[#312e2b] text-white hover:bg-[#3d3935]`;
    if (aktif.pilihan[i].manusia) return `${dasar} bg-[#81b64c] text-white`;
    if (i === jawaban) return `${dasar} bg-[#b33c3c] text-white`;
    return `${dasar} bg-[#312e2b] text-gray-400`;
  }

  return (
    // Ukuran papan mengikuti Hand & Brain dan Manusia vs Mesin (lihat HandBrain.jsx).
    <section
      aria-label={t("papan.menuTuring")}
      className="mx-auto grid h-full min-h-0 w-full max-w-[1280px] grid-cols-1 gap-3 overflow-x-hidden overflow-y-auto p-2 sm:gap-4 sm:p-4 md:px-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:overflow-hidden"
    >
      <div className="mx-auto flex w-full max-w-[520px] min-w-0 flex-col sm:my-auto lg:w-[min(520px,calc(100dvh-140px),calc(100vw-634px))]">
        <h1 className="mb-2 text-xl font-bold text-white">{t("papan.turingJudul")}</h1>
        <BarisProfil
          nama={t("papan.pveHitam")}
          putih={false}
          tangkapan={[]}
          setBidak={pp.bidak}
          className="mb-2"
        />
        <div className="flex w-full items-stretch justify-center gap-1.5">
          <div aria-hidden="true" className="w-9 shrink-0" />
          <div className="aspect-square min-w-0 flex-1">
            <div className="relative h-full w-full">
              <PapanTekaTeki
                fen={fenTampil}
                orientasi="w"
                gayaGeser="analisa"
                langkahAkhir={langkahAkhir}
                terkunci
                membeku={false}
                tanda={tanda}
                setBidak={pp.bidak}
                tema={pp.warnaPapan}
                onKlik={() => {}}
                onSelesaiSeret={() => {}}
                onTandaPetak={tandaPetak}
                onTandaPanah={tandaPanah}
                onHapusTanda={hapusSemuaTanda}
              />
            </div>
          </div>
        </div>
        <BarisProfil
          nama={t("papan.pveAnda")}
          putih
          tangkapan={[]}
          setBidak={pp.bidak}
          namaDiBawah
          className="mt-3"
        />
      </div>

      <aside className="flex min-h-0 flex-col gap-3 self-stretch rounded-lg border border-[#312e2b] bg-[#211f1c] p-4 text-sm text-gray-200">
        {fase === "input" && (
          <>
            <p className="text-[11px] leading-relaxed text-gray-400">{t("papan.turingDeskripsi")}</p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (namaLichess.trim() && !ambilSedang) ambilDariLichess();
              }}
            >
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-semibold text-gray-300">{t("papan.turingLabelUser")}</span>
                <input
                  value={namaLichess}
                  onChange={(e) => setNamaLichess(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="rounded-md bg-[#312e2b] px-2 py-1.5 text-white outline-none focus:ring-1 focus:ring-[#81b64c]"
                />
              </label>
              <button
                type="submit"
                disabled={ambilSedang || namaLichess.trim() === ""}
                className="self-end rounded-md bg-[#312e2b] px-3 py-1.5 font-semibold text-white hover:bg-[#3d3935] disabled:opacity-50"
              >
                {ambilSedang ? t("papan.turingAmbilSedang") : t("papan.turingAmbil")}
              </button>
            </form>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-300">{t("papan.turingLabelPgn")}</span>
              <textarea
                value={teks}
                onChange={(e) => setTeks(e.target.value)}
                rows={10}
                spellCheck={false}
                className="rounded-md bg-[#312e2b] p-2 font-mono text-xs text-white outline-none focus:ring-1 focus:ring-[#81b64c]"
              />
            </label>
            {pesan && (
              <p className="text-xs text-amber-300" role="alert">
                {pesan}
              </p>
            )}
            <button
              type="button"
              onClick={mulai}
              disabled={teks.trim() === ""}
              className="rounded-md bg-[#81b64c] px-4 py-2 font-semibold text-white hover:bg-[#8fc75a] disabled:opacity-50"
            >
              {t("papan.turingMulai")}
            </button>
          </>
        )}

        {fase === "menyiapkan" && (
          <p className="font-semibold text-white" role="status">
            {t("papan.turingMenyiapkan")}
          </p>
        )}

        {fase === "tebak" && aktif && (
          <>
            <p className="text-xs text-gray-400">
              {t("papan.turingSoal", { n: indeks + 1, m: soal.length })}
            </p>
            <p className="font-semibold text-white">{t("papan.turingTanya")}</p>
            <div className="flex flex-col gap-2">
              {aktif.pilihan.map((p, i) => (
                <button
                  key={p.uci}
                  type="button"
                  onClick={() => tebak(i)}
                  disabled={jawaban !== null}
                  className={kelasPilihan(i)}
                >
                  {p.san}
                </button>
              ))}
            </div>
            {jawaban !== null && (
              <p
                className={`font-semibold ${nilaiTebakan(aktif, jawaban) ? "text-[#a3d168]" : "text-red-300"}`}
                role="status"
              >
                {nilaiTebakan(aktif, jawaban)
                  ? t("papan.turingBenar", { san: pilihanManusia.san })
                  : t("papan.turingSalah", { san: pilihanManusia.san })}
              </p>
            )}
            {jawaban !== null && (
              <button
                type="button"
                onClick={lanjut}
                className="rounded-md bg-[#81b64c] px-4 py-2 font-semibold text-white hover:bg-[#8fc75a]"
              >
                {indeks + 1 >= soal.length ? t("papan.turingLihatSkor") : t("papan.turingBerikut")}
              </button>
            )}
          </>
        )}

        {fase === "hasil" && (
          <>
            <p className="font-semibold text-white" role="status">
              {t("papan.turingSkorAkhir", { benar: skor.benar, jawab: skor.jawab, persen: persenBenar(skor) })}
            </p>
            <button
              type="button"
              onClick={() => {
                setFase("input");
                setPesan("");
              }}
              className="rounded-md bg-[#312e2b] px-4 py-2 font-semibold text-white hover:bg-[#3d3935]"
            >
              {t("papan.turingUlang")}
            </button>
          </>
        )}
      </aside>
    </section>
  );
}
