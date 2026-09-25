import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import PapanTekaTeki from "../../TekaTeki/PapanTekaTeki.jsx";
import { EngineCatur } from "../../../lib/engineCatur.js";
import { useI18n } from "../../../lib/i18n.jsx";
import { FEN_AWAL } from "../konstanta.js";

function hasilAkhir(game) {
  if (game.isCheckmate()) {
    return { jenis: "skakmat", pemenang: game.turn() === "w" ? "b" : "w" };
  }
  if (game.isDraw()) return { jenis: "seri", pemenang: null };
  return null;
}

function uciDariPindahan(pindah) {
  return `${pindah.from}${pindah.to}${pindah.promotion || ""}`;
}

export default function ManusiaVsMesin() {
  const { t } = useI18n();
  const [fen, setFen] = useState(FEN_AWAL);
  const fenRef = useRef(FEN_AWAL);
  const [riwayat, setRiwayat] = useState([]);
  const [langkahAkhir, setLangkahAkhir] = useState(null);
  const [terpilih, setTerpilih] = useState(null);
  const [sasaran, setSasaran] = useState([]);
  const [warnaPemain, setWarnaPemain] = useState("w");
  const warnaMesin = warnaPemain === "w" ? "b" : "w";
  const [waktuMesin, setWaktuMesin] = useState(600);
  const [aktif, setAktif] = useState(false);
  const [statusMesin, setStatusMesin] = useState("idle");
  const [hasil, setHasil] = useState(null);
  const [pesan, setPesan] = useState("");
  const mesinRef = useRef(null);

  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);

  const mainkanLangkah = useCallback(
    (from, to, promotion) => {
      const game = new Chess(fenRef.current);
      const piece = game.get(from);
      const promosi = promotion || (piece?.type === "p" && (to.endsWith("1") || to.endsWith("8")) ? "q" : undefined);
      let pindah;
      try {
        pindah = game.move({ from, to, ...(promosi ? { promotion: promosi } : {}) });
      } catch {
        pindah = null;
      }
      if (!pindah) {
        setPesan(t("papan.pveLangkahTidakSah"));
        return false;
      }

      const fenBaru = game.fen();
      fenRef.current = fenBaru;
      setFen(fenBaru);
      setRiwayat((lama) => [...lama, pindah.san]);
      setLangkahAkhir({ from: pindah.from, to: pindah.to });
      setTerpilih(null);
      setSasaran([]);
      setPesan("");
      const terminal = hasilAkhir(game);
      if (terminal) {
        mesinRef.current?.tamat();
        mesinRef.current = null;
        setHasil(terminal);
        setStatusMesin("selesai");
        setAktif(false);
      } else {
        setStatusMesin(game.turn() === warnaMesin ? "mesin" : "pemain");
      }
      return true;
    },
    [t, warnaMesin]
  );

  // Worker hanya hidup selama mesin harus menjawab. Ketika pemain berpindah
  // mode atau partai selesai, pencarian dibatalkan dan worker dilepas.
  useEffect(() => {
    if (!aktif) return undefined;
    let game;
    try {
      game = new Chess(fen);
    } catch {
      return undefined;
    }
    if (game.isGameOver() || game.turn() !== warnaMesin) return undefined;

    let hidup = true;
    const engine = (mesinRef.current ||= new EngineCatur({ hash: 16, threads: 1 }));
    setStatusMesin("memuat");
    engine
      .mulai()
      .then(() => {
        if (!hidup || fenRef.current !== fen) return;
        setStatusMesin("mesin");
        engine.analisis(fen, {
          movetime: waktuMesin,
          padaSelesai: (uci, _info, error) => {
            if (!hidup || fenRef.current !== fen) return;
            if (error || !uci || uci.length < 4) {
              setStatusMesin("gagal");
              return;
            }
            mainkanLangkah(uci.slice(0, 2), uci.slice(2, 4), uci[4]);
          },
        });
      })
      .catch(() => {
        if (hidup) setStatusMesin("gagal");
      });

    return () => {
      hidup = false;
      engine.setop();
    };
  }, [aktif, fen, warnaMesin, waktuMesin, mainkanLangkah]);

  useEffect(
    () => () => {
      mesinRef.current?.tamat();
      mesinRef.current = null;
    },
    []
  );

  const bolehGerak = useMemo(() => {
    if (!aktif || hasil || statusMesin === "mesin" || statusMesin === "memuat") return false;
    try {
      return new Chess(fen).turn() === warnaPemain;
    } catch {
      return false;
    }
  }, [aktif, hasil, statusMesin, fen, warnaPemain]);

  function tujuanLegal(square) {
    try {
      const game = new Chess(fenRef.current);
      const piece = game.get(square);
      if (!piece || piece.color !== warnaPemain || game.turn() !== warnaPemain) return [];
      return game.moves({ square, verbose: true }).map((move) => move.to);
    } catch {
      return [];
    }
  }

  function pilihPetak(square) {
    if (!bolehGerak) return;
    if (terpilih === square) {
      setTerpilih(null);
      setSasaran([]);
      return;
    }
    const targets = tujuanLegal(square);
    if (targets.length) {
      setTerpilih(square);
      setSasaran(targets);
    } else {
      setTerpilih(null);
      setSasaran([]);
    }
  }

  function klikPetak(square) {
    if (!bolehGerak) return;
    if (terpilih && sasaran.includes(square)) {
      mainkanLangkah(terpilih, square);
      return;
    }
    pilihPetak(square);
  }

  function mulaiPartai() {
    mesinRef.current?.setop();
    fenRef.current = FEN_AWAL;
    setFen(FEN_AWAL);
    setRiwayat([]);
    setLangkahAkhir(null);
    setTerpilih(null);
    setSasaran([]);
    setHasil(null);
    setPesan("");
    setAktif(true);
    setStatusMesin("pemain");
  }

  function statusTeks() {
    if (hasil?.jenis === "seri") return t("papan.pveHasilSeri");
    if (hasil?.jenis === "skakmat") {
      return t(hasil.pemenang === "w" ? "papan.pvePutihMenang" : "papan.pveHitamMenang");
    }
    if (!aktif) return t("papan.pveBelumMulai");
    if (statusMesin === "memuat") return t("papan.pveMesinMemuat");
    if (statusMesin === "mesin") return t("papan.pveMesinBerpikir");
    if (statusMesin === "gagal") return t("papan.pveMesinGagal");
    return t("papan.pveGiliranPemain");
  }

  const giliranPenuh = riwayat.reduce((baris, san, index) => {
    if (index % 2 === 0) baris.push({ nomor: Math.floor(index / 2) + 1, putih: san, hitam: "" });
    else baris[baris.length - 1].hitam = san;
    return baris;
  }, []);

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:overflow-hidden">
      <section className="mx-auto flex w-full max-w-[660px] flex-col gap-3 lg:min-h-0 lg:overflow-y-auto">
        <header>
          <h1 className="text-xl font-bold text-white">{t("papan.pveJudul")}</h1>
          <p className="mt-1 text-sm text-gray-400">{t("papan.pveDeskripsi")}</p>
        </header>
        <div className="relative mx-auto aspect-square w-full max-w-[620px]">
          <PapanTekaTeki
            fen={fen}
            orientasi={warnaPemain}
            terpilih={terpilih}
            sasaran={sasaran}
            langkahAkhir={langkahAkhir}
            terkunci={!bolehGerak}
            membeku={!bolehGerak}
            setBidak="alpha"
            tema="metal"
            onKlik={klikPetak}
            onJatuh={(from, to) => bolehGerak && mainkanLangkah(from, to)}
          />
        </div>
      </section>

      <aside className="flex min-h-0 flex-col gap-4 rounded-lg border border-[#312e2b] bg-[#211f1c] p-4 lg:overflow-y-auto">
        <div aria-live="polite" className="rounded-md border border-[#363431] bg-[#262421] p-3 text-sm text-gray-200">
          {statusTeks()}
          {pesan && <p className="mt-2 text-xs text-red-300">{pesan}</p>}
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-400">
          {t("papan.pveWarnaPemain")}
          <select
            value={warnaPemain}
            disabled={aktif}
            onChange={(event) => setWarnaPemain(event.target.value)}
            className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#81b64c] disabled:opacity-50"
          >
            <option value="w">{t("papan.pvePutih")}</option>
            <option value="b">{t("papan.pveHitam")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-400">
          {t("papan.pveWaktuMesin")}
          <select
            value={waktuMesin}
            disabled={aktif}
            onChange={(event) => setWaktuMesin(Number(event.target.value))}
            className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#81b64c] disabled:opacity-50"
          >
            <option value={250}>{t("papan.pveCepat")}</option>
            <option value={600}>{t("papan.pveSeimbang")}</option>
            <option value={1200}>{t("papan.pveKuat")}</option>
          </select>
        </label>

        <button
          type="button"
          onClick={mulaiPartai}
          className="rounded-md bg-[#81b64c] px-4 py-2.5 text-sm font-bold text-[#1e1c18] transition hover:bg-[#91c45a]"
        >
          {aktif ? t("papan.pvePartaiBaru") : t("papan.pveMulai")}
        </button>

        <section className="flex min-h-0 flex-1 flex-col border-t border-[#312e2b] pt-3">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            {t("papan.pveRiwayat")}
          </h2>
          <div className="min-h-12 flex-1 overflow-y-auto rounded-md bg-[#262421] p-2 text-sm">
            {giliranPenuh.length ? (
              <ol className="space-y-1">
                {giliranPenuh.map((row) => (
                  <li key={row.nomor} className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-gray-200">
                    <span className="text-gray-500">{row.nomor}.</span>
                    <span>{row.putih}</span>
                    <span>{row.hitam}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-gray-500">{t("papan.pveRiwayatKosong")}</p>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
