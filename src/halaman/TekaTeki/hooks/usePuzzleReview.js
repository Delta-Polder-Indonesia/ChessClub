/**
 * Navigasi tinjau langkah (|< < > >|) + pintasan panah untuk halaman Teka-Teki.
 *
 * Aturan produk yang dipertahankan persis:
 *   - "maju" dan "ke akhir" hanya aktif SETELAH soal selesai (anti-spoiler);
 *   - status selesai tetap dipertahankan selama meninjau, sehingga pemutar
 *     video dan tombol maju tidak ikut terkunci;
 *   - bunyi langkah diputar saat mundur/maju memakai langkah yang sama seperti
 *     halaman Analisa.
 */
import { useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import { parseLangkah, terapkan } from "../../../lib/tekaTeki.js";
import { faktaLangkah } from "../../../lib/komentator.js";
import { faktaDariKoordinat } from "./usePuzzleGame.js";
import { useNilaiTerbaru } from "./useCallbackTerbaru.js";

/**
 * @param {object} opsi
 * @param {object} opsi.kondisi keadaan papan dari `usePuzzleGame`
 * @param {Function} opsi.pasangSoal memasang ulang soal (untuk |<)
 * @param {Function} opsi.dispatch dispatcher reducer papan
 * @param {object} opsi.masalah soal aktif
 * @param {Array}  opsi.langkahPenuh langkah solusi soal
 * @param {Function} opsi.bunyikanLangkah pemutar bunyi langkah
 * @param {Function} opsi.setPesan pengatur pesan status
 * @param {Function} opsi.onMundurOtomatis membatalkan lanjut-otomatis terjadwal
 * @param {boolean} opsi.blokirKunciPintasan true saat tab pengaturan/dialog terbuka
 */
export function usePuzzleReview({
  kondisi,
  pasangSoal,
  dispatch,
  masalah,
  langkahPenuh,
  bunyikanLangkah,
  setPesan,
  blokirKunciPintasan,
  onMundurOtomatis,
}) {
  const { fen, sisa, jalurFen, komputer, selesai, promosi } = kondisi;
  const total = langkahPenuh.length;
  const posisi = Math.max(0, total - sisa.length);

  const keAwal = useCallback(() => {
    if (!masalah || komputer || promosi) return;
    onMundurOtomatis?.();
    pasangSoal(masalah, { pertahankanSelesai: selesai });
  }, [masalah, komputer, promosi, onMundurOtomatis, pasangSoal, selesai]);

  const mundur = useCallback(() => {
    if (!total || komputer || promosi) return;
    onMundurOtomatis?.();
    const kini = Math.max(0, total - sisa.length);
    if (kini <= 0) return;
    const baru = kini - 1;
    // Bunyi langkah yang sedang dikembalikan (mode tinjau).
    try {
      const d = parseLangkah(langkahPenuh[baru]);
      const g = terapkan(jalurFen[baru], d);
      bunyikanLangkah(g.history({ verbose: true }).slice(-1)[0], g);
    } catch {
      /* bunyi opsional — navigasi tetap jalan */
    }
    const lanjut = baru >= 1;
    const komentar = lanjut
      ? selesai
        ? {
            tahap: "tinjau",
            fakta: faktaDariKoordinat(
              jalurFen[baru - 1],
              parseLangkah(langkahPenuh[baru - 1]).from,
              parseLangkah(langkahPenuh[baru - 1]).to,
              parseLangkah(langkahPenuh[baru - 1]).promo
            ),
            nomor: baru,
            fen: jalurFen[baru],
          }
        : null
      : { tahap: "mulai", fakta: null, fen: jalurFen[0] };
    dispatch({
      type: "SETELAH_MUNDUR",
      fenBaru: jalurFen[baru],
      sisa: langkahPenuh.slice(baru),
      jalurFen: jalurFen.slice(0, baru + 1),
      langkahAkhir: lanjut
        ? {
            from: parseLangkah(langkahPenuh[baru - 1]).from,
            to: parseLangkah(langkahPenuh[baru - 1]).to,
          }
        : null,
      komentar,
    });
    if (!selesai) setPesan(null);
  }, [
    total,
    komputer,
    promosi,
    sisa,
    langkahPenuh,
    jalurFen,
    bunyikanLangkah,
    dispatch,
    selesai,
    setPesan,
    onMundurOtomatis,
  ]);

  const maju = useCallback(() => {
    if (!total || komputer || promosi) return;
    onMundurOtomatis?.();
    // Anti-spoiler: maju baru boleh setelah soal tuntas.
    if (!selesai) return;
    const kini = Math.max(0, total - sisa.length);
    if (kini >= total) return;
    const d = parseLangkah(langkahPenuh[kini]);
    try {
      const g = terapkan(fen, d);
      const fenBaru = g.fen();
      const langkah = g.history({ verbose: true }).slice(-1)[0];
      bunyikanLangkah(langkah, g);
      dispatch({
        type: "SETELAH_MAJU",
        fenBaru,
        sisa: langkahPenuh.slice(kini + 1),
        // `jalurFen[i]` = posisi SETELAH langkah ke-i → posisi baru menyambung
        // setelah `jalurFen[kini]`, bukan menggantikannya.
        jalurFen: [...jalurFen.slice(0, kini + 1), fenBaru],
        langkahAkhir: { from: d.from, to: d.to },
        komentar: {
          tahap: kini + 1 >= total ? "selesai" : "tinjau",
          fakta: faktaLangkah(fen, langkah.san),
          nomor: kini + 1,
          fen: fenBaru,
        },
      });
    } catch {
      /* posisi tidak sah — navigasi maju diabaikan */
    }
  }, [
    total,
    komputer,
    promosi,
    selesai,
    sisa,
    langkahPenuh,
    fen,
    jalurFen,
    bunyikanLangkah,
    dispatch,
    onMundurOtomatis,
  ]);

  const keAkhir = useCallback(() => {
    if (!total || komputer || promosi) return;
    onMundurOtomatis?.();
    if (!selesai) return;
    const kini = Math.max(0, total - sisa.length);
    if (kini >= total) return;
    let game;
    try {
      game = new Chess(fen);
    } catch {
      return;
    }
    const fens = [];
    let akhir = null;
    for (let i = kini; i < total; i += 1) {
      const d = parseLangkah(langkahPenuh[i]);
      try {
        const mv = game.move({
          from: d.from,
          to: d.to,
          promotion: d.promo || undefined,
        });
        if (!mv) break;
      } catch {
        break;
      }
      fens.push(game.fen());
      akhir = { from: d.from, to: d.to };
    }
    if (!fens.length) return;
    const fenSebelumAkhir =
      fens.length >= 2 ? fens[fens.length - 2] : kini > 0 ? jalurFen[kini] : fen;
    const terakhir = parseLangkah(langkahPenuh[total - 1]);
    dispatch({
      type: "SETELAH_MAJU",
      fenBaru: fens[fens.length - 1],
      sisa: [],
      jalurFen: [...jalurFen.slice(0, kini + 1), ...fens],
      langkahAkhir: akhir,
      komentar: {
        tahap: "selesai",
        fakta: akhir
          ? faktaDariKoordinat(fenSebelumAkhir, akhir.from, akhir.to, terakhir.promo)
          : null,
        nomor: total,
        fen: fens[fens.length - 1],
      },
    });
  }, [
    total,
    komputer,
    promosi,
    selesai,
    sisa,
    fen,
    jalurFen,
    langkahPenuh,
    dispatch,
    onMundurOtomatis,
  ]);

  /* ------------------------------------------------------- pintasan panah */
  // ← mundur, → maju, ↑ ke awal, ↓ ke akhir — sama seperti halaman Analisa.
  const aksiRef = useNilaiTerbaru({
    mundur,
    maju,
    keAwal,
    keAkhir,
    adaSoal: total > 0,
    blokir: Boolean(promosi) || Boolean(blokirKunciPintasan),
  });

  useEffect(() => {
    let terakhirDitekan = 0;
    function saatKeydown(e) {
      const aksi = aksiRef.current;
      if (!aksi.adaSoal || aksi.blokir) return;
      const el = e.target;
      const tipeFokus = ["text", "number", "password", "email", "search", "tel", "url"];
      if (el?.tagName === "INPUT" && tipeFokus.includes(el.getAttribute("type") ?? "")) return;
      if (el?.tagName === "TEXTAREA" || el?.tagName === "SELECT") return;
      const kini = Date.now();
      if (kini - terakhirDitekan < 25) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          aksi.mundur?.();
          terakhirDitekan = kini;
          break;
        case "ArrowRight":
          e.preventDefault();
          aksi.maju?.();
          terakhirDitekan = kini;
          break;
        case "ArrowUp":
          e.preventDefault();
          aksi.keAwal?.();
          terakhirDitekan = kini;
          break;
        case "ArrowDown":
          e.preventDefault();
          aksi.keAkhir?.();
          terakhirDitekan = kini;
          break;
        default:
          break;
      }
    }
    document.addEventListener("keydown", saatKeydown);
    return () => document.removeEventListener("keydown", saatKeydown);
  }, [aksiRef]);

  return {
    keAwal,
    mundur,
    maju,
    keAkhir,
    bisaMundur: !komputer && !promosi && posisi > 0,
    bisaMaju: !komputer && !promosi && selesai && posisi < total,
  };
}
