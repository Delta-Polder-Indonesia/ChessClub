/**
 * Provider BoardContext: state papan + navigasi langkah.
 *
 * Seluruh isi berkas ini adalah PEMINDAHAN apa adanya dari
 * `konteks/analyze.jsx` (Fase 2). Tidak ada perubahan nilai awal, urutan
 * `useState`, isi `gameController`, maupun perilaku ref. Yang berubah hanya
 * letak state: nilai yang berubah sangat sering (progress, pageState,
 * analyzingMove, langkahSementara, data, analyzeController) kini hidup di
 * `ImportProvider` sehingga perubahan itu tidak lagi me-render provider ini.
 *
 * Urutan pemanggilan hook dipertahankan supaya urutan inisialisasi (termasuk
 * `bacaAngka("kedalaman", 13)` dan `t(...)` untuk nama pemain bawaan) tetap
 * sama seperti sebelumnya.
 *
 * Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa
 * cek README.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import { bacaAngka } from "../penyimpanan.js";
import { normalisasiPemain, TAMPILAN_ANALISA } from "./analyzeKonteks.js";
import { BoardContext } from "./boardKonteks.js";

export function BoardProvider({ children }) {
  const { t } = useI18n();
  const [game, setGame] = useState([]);
  const [players, setPlayers] = useState(() => [
    { name: t("analisa.pemain.putih"), elo: "?" },
    { name: t("analisa.pemain.hitam"), elo: "?" },
  ]);
  const playersAman = useMemo(
    () => normalisasiPemain(players, [t("analisa.pemain.putih"), t("analisa.pemain.hitam")]),
    [players, t]
  );
  const [moveNumber, setMoveNumber] = useState(0);
  const [forward, setForward] = useState(true);
  const [animation, setAnimation] = useState(true);
  const [white, setWhite] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [materialAdvantage, setMaterialAdvantage] = useState(0);
  const [result2, setResult] = useState("");
  const [tab, setTab] = useState("analyze");
  const [customLine, setCustomLine] = useState({ moveNumber: -1, moves: [], arrows: {} });
  const [returnedToNormalGame, setReturnedToNormalGame] = useState(null);
  /*
   * Kedalaman tersimpan. Kuncinya HARUS "kci-analisa-kedalaman" — sama
   * dengan yang ditulis form.jsx dan panel pengaturan. Sebelumnya di
   * `analyze.jsx` dibaca kunci "kci-analisa-depth" yang tidak pernah ditulis
   * siapa pun, jadi pilihan pengguna selalu kembali ke 13 setiap kali
   * halaman dibuka.
   */
  const [depth, setDepth] = useState(() => {
    const tersimpan = bacaAngka("kedalaman", 13);
    return tersimpan >= 1 ? tersimpan : 13;
  });
  const [tampilan, setTampilan] = useState(TAMPILAN_ANALISA.AKUN);
  const moveNumberRef = useRef(moveNumber);
  const customLineRef = useRef(customLine);
  const gameLengthRef = useRef(game.length);
  useEffect(() => {
    customLineRef.current = customLine;
  }, [customLine]);
  useEffect(() => {
    moveNumberRef.current = moveNumber;
  }, [moveNumber]);
  useEffect(() => {
    gameLengthRef.current = game.length;
  }, [game.length]);
  /*
   * Stabil antar-render: isinya hanya membaca ref + setter (keduanya stabil),
   * jadi tidak perlu dibuat ulang — dan karena `gameController` masuk ke
   * nilai konteks, kestabilan ini mencegah seluruh konsumen konteks
   * me-render ulang setiap kali provider me-render.
   */
  const gameController = useMemo(
    () => ({
      back: () => {
        if (customLineRef.current.moveNumber > 0) {
          setForward(false);
          setAnimation(true);
          setReturnedToNormalGame(null);
          setCustomLine((prev) => ({ ...prev, moveNumber: prev.moveNumber - 1 }));
        } else if (customLineRef.current.moveNumber === 0) {
          setForward(false);
          setAnimation(true);
          setReturnedToNormalGame(customLineRef.current.moves[0].movement ?? null);
          setCustomLine({ moveNumber: -1, moves: [], arrows: {} });
        } else if (moveNumberRef.current > 0) {
          setForward(false);
          setAnimation(true);
          setReturnedToNormalGame(null);
          setMoveNumber((prev) => prev - 1);
        }
      },
      forward: () => {
        setReturnedToNormalGame(null);
        if (customLineRef.current.moveNumber >= 0) {
          if (customLineRef.current.moveNumber < customLineRef.current.moves.length - 1) {
            setForward(true);
            setAnimation(true);
            setCustomLine((prev) => ({ ...prev, moveNumber: prev.moveNumber + 1 }));
          }
          return;
        } else if (moveNumberRef.current < gameLengthRef.current - 1) {
          setForward(true);
          setAnimation(true);
          setMoveNumber((prev) => prev + 1);
        }
      },
      first: () => {
        if (customLineRef.current.moveNumber >= 0) {
          setAnimation(false);
          setReturnedToNormalGame(customLineRef.current.moves[0].movement ?? null);
          setCustomLine({ moveNumber: -1, moves: [], arrows: {} });
        } else {
          setAnimation(false);
          setReturnedToNormalGame(null);
          setMoveNumber(0);
        }
      },
      last: () => {
        setReturnedToNormalGame(null);
        if (customLineRef.current.moveNumber >= 0) {
          setAnimation(false);
          setCustomLine((prev) => ({ ...prev, moveNumber: prev.moves.length - 1 }));
        } else {
          setAnimation(false);
          setMoveNumber(gameLengthRef.current - 1);
        }
      },
      togglePlay: () => {
        setPlaying((prev) => !prev);
      },
      play: () => {
        setPlaying(true);
      },
      pause: () => {
        setPlaying(false);
      },
    }),
    []
  );
  /*
   * Dependensinya adalah seluruh NILAI state yang diekspor (setter stabil,
   * tak perlu disebut). Menambah state ke provider ini WAJIB menambahkannya
   * di sini.
   */
  const nilai = useMemo(
    () => ({
      game: [game, setGame],
      players: [playersAman, setPlayers],
      moveNumber: [moveNumber, setMoveNumber],
      forward: [forward, setForward],
      white: [white, setWhite],
      animation: [animation, setAnimation],
      playing: [playing, setPlaying],
      time: [time, setTime],
      materialAdvantage: [materialAdvantage, setMaterialAdvantage],
      result: [result2, setResult],
      tab: [tab, setTab],
      customLine: [customLine, setCustomLine],
      returnedToNormalGame: [returnedToNormalGame, setReturnedToNormalGame],
      depth: [depth, setDepth],
      tampilan: [tampilan, setTampilan],
      gameController,
    }),
    [
      game,
      playersAman,
      moveNumber,
      forward,
      white,
      animation,
      playing,
      time,
      materialAdvantage,
      result2,
      tab,
      customLine,
      returnedToNormalGame,
      depth,
      tampilan,
      gameController,
    ]
  );
  return <BoardContext.Provider value={nilai}>{children}</BoardContext.Provider>;
}
