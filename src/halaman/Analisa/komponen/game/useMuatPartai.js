/*
 * Memuat partai ke papan — dua bentuk masukan, satu siklus hidup.
 *
 *   - `handlePGN`: analisis penuh satu partai (parsePGN + engine + buku
 *     pembukaan), memakai `AbortController` yang dipasang di konteks.
 *   - `handleFEN`: posisi bebas tanpa riwayat langkah (parsePosition).
 *
 * Hook ini lahir dari pemecahan `game.jsx` (Fase 3). Tiga ref di bawah adalah
 * jantung perilaku balapannya, jadi kepemilikannya sengaja di sini dan
 * diberikan ke pemanggil:
 *
 *   - `muatSeqRef`  — nomor urut muatan; muatan lama yang dibatalkan tidak
 *                     boleh menyetor state ke muatan baru.
 *   - `controllerRef` — cermin `analyzeController` yang segar untuk alur async
 *                     (dipakai juga oleh `useAnalisisPapan`).
 *   - `openingsRef` — tabel nama pembukaan, diunduh saat senggang peramban
 *                     (±160 KiB, jangan di jalur kritis) dan dipakai bersama
 *                     oleh dua alur di atas.
 *
 * Semua setter datang dari `AnalyzeContext` lewat parameter: hook ini tidak
 * membaca konteks sendiri supaya ketergantungannya kelihatan di berkas
 * pemanggil.
 */
import { useCallback, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { bacaPartaiPGN, formatSquare, parsePGN, parsePosition } from "../../mesin/engine.js";
import { cariNamaPembukaan } from "../../mesin/buku.js";
import { pushPageError, pushPageWarning } from "../errors/pushPageError.js";
import { hashPgn } from "../../../../lib/pgnRingan.js";
import { ringkasAnalisis } from "../../mesin/ringkasanAnalisis.js";
import { catatAnalisis } from "../../mesin/analisisTersimpan.js";
import { adaPgnTitipan } from "../../../../lib/titipanAnalisa.js";
import { gameStartSound } from "./gameStartSound.js";
import { langkahLompat } from "./lompatLangkah.js";

export function useMuatPartai({
  data,
  depth,
  analyzeController,
  boardSounds,
  siapkan,
  t,
  setErrors,
  setAnalyzeController,
  setPageState,
  setTab,
  setProgress,
  setLangkahSementara,
  setTime,
  setPlayers,
  setGame,
  setResult,
  setAnimation,
  setArrows,
  setCustomLine,
  setAnalyzingMove,
  setMoveNumber,
  setWhite,
  setPlaying,
}) {
  const openingsRef = useRef(null);
  // Nomor urut muatan partai: muatan yang lebih lama dibatalkan oleh yang
  // lebih baru sehingga hasilnya tidak saling menimpa (`related key` ada di
  // useEffect [data]).
  const muatSeqRef = useRef(0);
  /*
   * Cermin controller untuk alur async: `analyzeController` (state) hanya
   * segar saat render, sedangkan `handlePGN`/`analyzeMove` hidup melintasi
   * banyak render — membaca state dari closure basi berarti membatalkan
   * controller yang SALAH. Ref ini disinkronkan tiap render (mencakup
   * penulis luar seperti ganti engine di pengaturan) dan dibaca semua alur
   * async; penulis di berkas ini selalu memperbarui keduanya berbarengan.
   */
  const controllerRef = useRef(analyzeController);
  controllerRef.current = analyzeController;
  // Label "langkah buku": tabel nama pembukaan milik situs ini sendiri
  // (dibangun oleh scripts/generasi-buku-analisa.mjs). Bentuknya fungsi
  // pencarian (fen) => nama, bukan peta mentah, agar penghitung langkah di
  // FEN bisa diabaikan — tabel upstream tidak pernah cocok karena itu.
  useEffect(() => {
    /*
     * Tabel bukunya ±160 KiB — jangan diunduh di jalur kritis pemuatan
     * halaman (Lighthouse mencatatnya sebagai item payload terbesar).
     * Ditunda ke waktu senggang peramban; belum ada partai yang butuh nama
     * pembukaan pada detik-detik pertama, dan `cariNamaPembukaan` men-cache
     * janjinya jadi jalur lain (muat partai/impor) tetap berbagi unduhan.
     */
    let hidup = true;
    const muat = () =>
      cariNamaPembukaan().then((pencari) => {
        if (hidup) openingsRef.current = pencari;
      });
    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(muat, { timeout: 5000 });
      return () => {
        hidup = false;
        window.cancelIdleCallback?.(id);
      };
    }
    const id = setTimeout(muat, 1500);
    id?.unref?.();
    return () => {
      hidup = false;
      clearTimeout(id);
    };
  }, []);

  function createArrowsObject(length) {
    const newArrows = {};
    Array.from({ length }).forEach((_, i) => {
      newArrows[i] = [];
    });
    return newArrows;
  }
  const cleanArrows = useCallback(() => {
    setArrows({ 0: [] });
  }, [setArrows]);
  const handlePGN = useCallback(async (pgn, depth2, terkini, signal, lompatKe) => {
    setPageState("loading");
    setTab("summary");
    setProgress(0);
    setLangkahSementara([]);
    if (!pgn?.trim()) {
      pushPageError(setErrors, t("analisa.galat.pgnJudul"), t("analisa.galat.pgnIsi"));
      setPageState("default");
      return;
    }

    // Tombol Batal juga bekerja saat engine/buku masih disiapkan, bukan cuma
    // saat pencarian UCI sudah berjalan. Muatan lama tidak boleh menutup yang baru.
    const batal = () => {
      if (!terkini()) return;
      setPageState("default");
      setProgress(0);
      setLangkahSementara([]);
    };
    signal.addEventListener("abort", batal, { once: true });
    try {
      const partai = bacaPartaiPGN(pgn);
      if (signal.aborted || !terkini()) return;
      // Berkas multi-partai: hanya partai pertama yang dianalisis — katakan,
      // jangan diam (pengguna menempel 100 partai lalu heran sisanya hilang).
      if ((partai.jumlahPartai ?? 1) > 1) {
        pushPageWarning(setErrors, t("analisa.multiPartai.judul"), t("analisa.multiPartai.isi", { n: partai.jumlahPartai }));
      }
      setLangkahSementara(partai.kerangka);

      // Buku pembukaan diunduh bersamaan dengan penyiapan engine.
      const janjiBuku = openingsRef.current
        ? Promise.resolve(openingsRef.current)
        : cariNamaPembukaan().catch(() => ({}));
      const mesin = await siapkan().catch(() => {
        throw new Error(signal.aborted ? "canceled" : "mesin");
      });
      if (signal.aborted || !terkini()) return;
      const buku = await janjiBuku;
      if (signal.aborted || !terkini()) return;

      // Posisi belum dinilai tetap berada pada garis tengah. Sumbu X berasal
      // dari seluruh partai dan tidak berubah setiap kali onLangkah terpanggil.
      const laporkanLangkah = (dinilai) => {
        if (!terkini() || signal.aborted) return;
        setLangkahSementara(partai.kerangka.map((posisi, i) => dinilai[i] ?? posisi));
      };
      const laporkanProgres = (nilai) => {
        if (terkini() && !signal.aborted) setProgress(nilai);
      };
      const { metadata, moves } = await parsePGN(mesin, pgn, depth2, buku, laporkanProgres, signal, {
        partai, onLangkah: laporkanLangkah,
      });
      if (!terkini() || signal.aborted) return;
      setTime(metadata.time);
      setPlayers(metadata.players.map((p) => ({ name: p.name || t("analisa.pemain.anonim"), elo: p.elo })));
      setGame(moves);
      /*
       * Daftarkan hasil partai ini ke peta analisis sesi — padanan case
       * `analysis/terminal` di acuan (`features/workspace/reducer.ts`):
       * `{ ...resultsByGameId, [gameId]: result }` hanya untuk status
       * `complete`. Peta itu yang dibaca layar Wawasan sebagai `analysisMap`,
       * persis `ChessWorkspace.tsx` meneruskan `state.analysis.resultsByGameId`.
       *
       * Kuncinya HASH TEKS PGN, bukan id basis data: di titik ini papan hanya
       * memegang teks PGN (layar Database/Impor melempar `{ format, string }`
       * tanpa id). Layar Wawasan menerjemahkan hash itu kembali ke `p.id`
       * lewat `hashPgn(p.pgn)`, jadi kedua sisi bertemu tanpa perlu mengubah
       * alur data partai.
       */
      catatAnalisis(hashPgn(pgn), ringkasAnalisis(moves));
      setResult(metadata.result);
      setAnimation(false);
      setArrows(createArrowsObject(moves.length));
      setCustomLine({ moveNumber: -1, moves: [], arrows: {} });
      setAnalyzingMove(false);
      if (boardSounds) setTimeout(() => gameStartSound.play(), 100);
      setPageState("analyze");
      /*
       * "Buka di langkah ini" (dari sorotan distribusi manusia): nomor
       * langkah baru bisa dijepit SETELAH parse selesai, di sini — sebelumnya
       * panjang partai belum diketahui. Nilai di luar jangkauan dijepit ke
       * langkah terakhir, bukan dibiarkan menghasilkan papan kosong.
       */
      const tujuan = langkahLompat(lompatKe, moves.length);
      if (tujuan !== null) setMoveNumber(tujuan);
    } catch (e) {
      if (!terkini()) return;
      switch (e?.kunci ?? e?.message) {
        case "pgn":
          pushPageError(setErrors, t("analisa.galat.pgnJudul"), t("analisa.galat.pgnIsi"));
          break;
        case "canceled":
          setAnalyzeController(new AbortController());
          break;
        case "mesin":
          pushPageError(setErrors, t("analisa.galat.engineJudul"), t("analisa.galat.engineIsi"));
          break;
        default:
          pushPageError(setErrors, t("analisa.galat.analisisJudul"), String(e?.message ?? e));
      }
      setPageState("default");
    } finally {
      signal.removeEventListener("abort", batal);
      if (terkini()) {
        setProgress(0);
        setLangkahSementara([]);
        setMoveNumber(0);
      }
    }
  }, [t, siapkan, boardSounds, setErrors, setAnalyzeController, setPageState, setTab, setProgress, setLangkahSementara, setTime, setPlayers, setGame, setResult, setAnimation, setArrows, setCustomLine, setAnalyzingMove, setMoveNumber]);
  const handleFEN = useCallback(async (fen, terkini, sinyal) => {
    /*
     * Halaman dibuka dengan PGN titipan dari teka-teki (lihat
     * `src/lib/titipanAnalisa.js`): keadaan awal `data` masih `{fen, ""}`, jadi
     * tanpa penjagaan ini jalur "tanpa FEN" di bawah menggambar papan POSISI
     * AWAL sebagai `default` sebelum PGN titipan sempat dibaca. Biarkan
     * `loading` (kerangka papan) — pengimpor di `areaKerja.jsx` mengambil alih
     * beberapa milidetik kemudian.
     */
    if (!fen?.trim() && adaPgnTitipan()) return;
    let move3;
    try {
      move3 = await new Promise((resolve, reject) => {
        (async () => {
          setPageState("loading");
          setTime(0);
          setPlayers([{ name: t("analisa.pemain.putih"), elo: "?" }, { name: t("analisa.pemain.hitam"), elo: "?" }]);
          setWhite(true);
          setPlaying(false);
          setMoveNumber(0);
          setResult("");
          setProgress(0);
          setCustomLine({ moveNumber: -1, moves: [], arrows: {} });
          setAnalyzingMove(false);
          cleanArrows();
          if (!fen?.trim()) {
            // Tanpa FEN: papan bebas dari posisi awal, saran engine langsung
            // ditampilkan setelah engine siap (lihat efek di bawah).
            const chess2 = new Chess();
            const fen2 = chess2.fen();
            const bestMove = chess2.move({ from: "e2", to: "e4" });
            const move5 = {
              fen: fen2,
              color: chess2.turn(),
              bestMove: [formatSquare(bestMove.from), formatSquare(bestMove.to)],
              bestMoveSan: bestMove.san,
              previousStaticEvals: [["cp", "-30"]],
              clock: { white: null, black: null },
            };
            setGame([move5]);
            setPageState("default");
            return null;
          }
          const mesin = await siapkan().catch(() => null);
          if (!mesin) {
            pushPageError(setErrors, t("analisa.galat.engineJudul"), t("analisa.galat.engineIsi"));
            return null;
          }
          let chess;
          try {
            chess = new Chess(fen);
          } catch {
            throw new Error("fen");
          }
          const signal = sinyal;
          function handleAbort() {
            reject(new Error("canceled"));
            signal.removeEventListener("abort", handleAbort);
          }
          return parsePosition(mesin, chess, depth, signal, handleAbort);
        })().then(resolve, reject);
      });
    } catch (e) {
      // Muatan lama yang dibatalkan tidak boleh menimpa muatan baru.
      if (!terkini()) return;
      switch (e?.kunci ?? e?.message) {
        case "fen":
          pushPageError(setErrors, t("analisa.galat.fenJudul"), t("analisa.galat.fenIsi"));
          break;
        case "canceled":
          setAnalyzeController(new AbortController());
          break;
        case "mesin":
          pushPageError(setErrors, t("analisa.galat.engineJudul"), t("analisa.galat.engineIsi"));
          break;
        default:
          pushPageError(setErrors, t("analisa.galat.analisisJudul"), String(e?.message ?? e));
      }
      setPageState("default");
      return;
    }
    if (!move3) {
      if (terkini()) setPageState("default");
      return;
    }
    if (!terkini()) return;
    setGame([{ ...move3, clock: { white: null, black: null } }]);
    setPageState("analyzeCustom");
  }, [t, depth, siapkan, cleanArrows, setErrors, setAnalyzeController, setPageState, setTime, setPlayers, setWhite, setPlaying, setMoveNumber, setResult, setProgress, setCustomLine, setAnalyzingMove, setGame]);
  useEffect(() => {
    const { format, string, lompatKe } = data;
    /*
     * Muatan baru membatalkan analisis yang masih berjalan — dua parsePGN
     * sekaligus memakai signal yang sama saling menimpa hasil. Muatan baru
     * memakai controller/signal miliknya sendiri; `terkini` mencegah muatan
     * lama yang dibatalkan ikut menyetor state (langkah, progres, halaman).
     */
    muatSeqRef.current += 1;
    const nomor = muatSeqRef.current;
    const terkini = () => muatSeqRef.current === nomor;
    // Muatan baru = kanvas bersih: galat/peringatan muatan lama (termasuk
    // "multi-partai") tidak boleh menghantui muatan ini.
    setErrors([]);
    controllerRef.current.abort();
    const baru = new AbortController();
    controllerRef.current = baru;
    setAnalyzeController(baru);
    switch (format) {
      case "pgn":
        handlePGN(string, depth, terkini, baru.signal, lompatKe);
        break;
      case "fen":
        handleFEN(string, terkini, baru.signal);
        break;
    }
  }, [data, depth, handleFEN, handlePGN, setAnalyzeController, setErrors]);

  return { controllerRef, muatSeqRef, openingsRef };
}
