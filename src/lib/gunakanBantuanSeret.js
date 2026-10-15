/**
 * Hook "Bantuan Langkah" (assisted play) — mesinnya SENDIRI, terpisah dari
 * analisa utama Papan Interaktif.
 *
 * Cara kerja: saat pengguna mengangkat bidak dan menggesernya di atas petak
 * tujuan yang sah, `panggil({ dari, tujuan })` menyusun FEN hipotetis lalu
 * meminta pencarian DANGKAL (depth/movetime kecil) ke worker Stockfish kedua.
 * Hasilnya:
 *   - `bantuan.warna` → hijau/kuning/merah untuk petak tujuan;
 *   - `bantuan.panah` → langkah balasan terbaik lawan dari posisi hipotetis.
 *
 * Kenapa worker terpisah: analisa posisi utama (bilah evaluasi + panah mesin)
 * memakai satu worker; kalau pencarian kilat dipakai bergantian di worker yang
 * sama, analisa utama akan terus dihentikan dan bilah evaluasi berkedip.
 * Worker kedua baru dibuat saat fitur ini benar-benar dipakai (sakelar ON dan
 * seret pertama) dan dibuang begitu sakelarnya dimatikan.
 *
 * Kerapian yang dijaga:
 * - debounce: menyeret cepat melintasi banyak petak tidak membanjiri engine;
 * - cache per-FEN hipotetis: kembali ke petak yang sama = hasil instan;
 * - nomor permintaan: jawaban lambat dari petak lama dibuang, bukan ditampilkan;
 * - promosi: petak baris terakhir dilewati selama pilihan bidak promosi belum
 *   ada (lihat `promosiLangkah`), supaya label "aman" tidak salah bidak;
 * - `bersihkan()` dipanggil saat seret berakhir → pencarian dihentikan.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EngineCatur } from "./engineCatur.js";
import { susunHasilEngine } from "./gunakanEngineCatur.js";
import { promosiLangkah, susunBantuan, susunFenHipotetis } from "./bantuanSeret.js";

/** Kedalaman maksimum pencarian kilat (berhenti pada batas pertama tercapai). */
export const KEDALAMAN_BANTUAN = 8;
/** Batas waktu pencarian kilat (ms) — dijaga kecil agar terasa "saat diseret". */
export const MOVETIME_BANTUAN = 300;
/** Jeda sebelum engine dipanggil: menyeret cepat tidak memicu kueri tiap petak. */
export const JEDA_BANTUAN_MS = 200;
/** Batas cache klien (FEN hipotetis) supaya memori tetap kecil. */
const CACHE_MAKS = 400;

/**
 * @param {object} p
 * @param {boolean} p.aktif        sakelar fitur (Pengaturan Papan)
 * @param {string} p.fen           posisi saat ini
 * @param {number|null} p.nilaiTerbaik nilai langkah terbaik posisi sekarang
 *        (sudut pandang pihak yang melangkah; dari analisa utama yang sudah
 *        berjalan — tanpa ini petak hanya diberi warna kuning netral)
 */
export function useBantuanSeret({ aktif, fen, nilaiTerbaik = null }) {
  const [bantuan, setBantuan] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | menunggu | menghitung | siap | gagal

  const engineRef = useRef(null);
  const cacheRef = useRef(new Map());
  const jamRef = useRef(null);
  const nomorRef = useRef(0);
  const aktifRef = useRef(aktif);
  aktifRef.current = aktif;
  const nilaiTerbaikRef = useRef(nilaiTerbaik);
  nilaiTerbaikRef.current = nilaiTerbaik;

  /** Buang worker bantuan (dipakai saat sakelar dimatikan / komponen dilepas). */
  const matikanEngineBantuan = useCallback(() => {
    engineRef.current?.tamat();
    engineRef.current = null;
  }, []);

  useEffect(() => {
    if (aktif) return undefined;
    // Sakelar dimatikan: hentikan pencarian & buang worker (memori kembali).
    window.clearTimeout(jamRef.current);
    jamRef.current = null;
    nomorRef.current += 1;
    matikanEngineBantuan();
    setBantuan(null);
    setStatus("idle");
    return undefined;
  }, [aktif, matikanEngineBantuan]);

  useEffect(
    () => () => {
      window.clearTimeout(jamRef.current);
      matikanEngineBantuan();
    },
    [matikanEngineBantuan]
  );

  /** Hentikan pencarian yang sedang jalan dan sembunyikan bantuan. */
  const bersihkan = useCallback(() => {
    window.clearTimeout(jamRef.current);
    jamRef.current = null;
    nomorRef.current += 1;
    engineRef.current?.setop();
    setBantuan(null);
    setStatus("idle");
  }, []);

  /**
   * Minta bantuan untuk satu kandidat langkah (dipanggil saat petak tujuan
   * dilintasi selama seret).
   *
   * `promosi` opsional: bidak promosi BILA sudah diketahui pemanggil. Selama
   * seret belum ada yang tahu (pemilih promosi baru muncul sesudah bidak
   * dilepas), jadi petak promosi dilewati — menilai posisi hasil promosi
   * menteri lalu menamai promosi kuda/gajah/benteng "aman" hanya menyesatkan.
   */
  const panggil = useCallback(({ dari, tujuan, promosi }) => {
    if (!aktifRef.current || !fen || !dari || !tujuan || dari === tujuan) return;
    if (promosiLangkah(fen, dari, tujuan) && !promosi) {
      setBantuan(null);
      setStatus("idle");
      return;
    }

    const hipotetis = susunFenHipotetis(fen, dari, tujuan, promosi || "q");
    if (!hipotetis) {
      setBantuan(null);
      return;
    }

    const sisi = fen.split(" ")[1] === "b" ? "b" : "w";
    const tersimpan = cacheRef.current.get(hipotetis);
    if (tersimpan) {
      setBantuan(susunBantuan({ tujuan, ...tersimpan, nilaiTerbaik: nilaiTerbaikRef.current, sisi }));
      setStatus("siap");
      return;
    }

    // Petak baru: sembunyikan hasil petak lama, tunggu jeda sebelum bertanya.
    window.clearTimeout(jamRef.current);
    nomorRef.current += 1;
    const nomor = nomorRef.current;
    setBantuan(null);
    setStatus("menunggu");
    jamRef.current = window.setTimeout(async () => {
      jamRef.current = null;
      const engine = (engineRef.current ||= new EngineCatur());
      try {
        await engine.mulai();
        // Seret bisa berakhir (atau petak berganti) saat worker masih dimuat;
        // jangan kirim pencarian yang sudah tidak dibutuhkan.
        if (nomor !== nomorRef.current || !aktifRef.current) return;
        setStatus("menghitung");
        const hasil = await engine.cari({
          fen: hipotetis,
          kedalaman: KEDALAMAN_BANTUAN,
          movetime: MOVETIME_BANTUAN,
        });
        if (nomor !== nomorRef.current || !aktifRef.current) return; // hasil basi
        const giliranHipotetis = hipotetis.split(" ")[1] === "b" ? "b" : "w";
        const nilai = susunHasilEngine(
          hasil.info ?? { cp: 0, mate: null, pv: [] },
          hipotetis,
          giliranHipotetis
        );
        const uci = hasil.uci || nilai.pvUci?.[0] || null;
        const dataKandidat = {
          nilaiKandidat: { cpPutih: nilai.cpPutih, matePutih: nilai.matePutih },
          uci,
          kedalaman: nilai.kedalaman ?? null,
        };
        cacheRef.current.set(hipotetis, dataKandidat);
        while (cacheRef.current.size > CACHE_MAKS) {
          cacheRef.current.delete(cacheRef.current.keys().next().value);
        }
        setBantuan(susunBantuan({ tujuan, ...dataKandidat, nilaiTerbaik: nilaiTerbaikRef.current, sisi }));
        setStatus("siap");
      } catch {
        // Pencarian dibatalkan/digantikan bukan kegagalan yang perlu ditampilkan.
        if (nomor === nomorRef.current && aktifRef.current) setStatus("gagal");
      }
    }, JEDA_BANTUAN_MS);
  }, [fen]);

  /** Peta petak→warna untuk papan (hanya satu petak: tujuan yang diseret). */
  const petakBantuan = useMemo(
    () => (bantuan ? { [bantuan.tujuan]: bantuan.warna } : null),
    [bantuan]
  );

  /** Panah langkah lawan — warna merah (ancaman), terpisah dari panah mesin. */
  const panahBantuan = useMemo(
    () => (bantuan?.panah ? { ...bantuan.panah, warna: "merah" } : null),
    [bantuan]
  );

  return { bantuan, status, petakBantuan, panahBantuan, panggil, bersihkan };
}
