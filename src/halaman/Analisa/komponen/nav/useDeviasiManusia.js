/**
 * Pengait layar Deteksi engine untuk metrik distribusi manusia (Maia).
 *
 * Jalur ini memakai **pengaturan yang sudah ada** di panel kiri — akun, situs,
 * filter waktu, dan jumlah partai — jadi tidak ada setelan kedua yang harus
 * diisi ulang. Bedanya hanya mesin yang menjawab: Stockfish menghitung eval,
 * Maia memprediksi langkah yang *mungkin* dimainkan manusia pada rating pemain.
 *
 * Alurnya sengaja berlapis supaya unduhan 45 MB tidak pernah terjadi diam-diam:
 *
 *   kosong → menyiapkan (worker + unduh/cache) → menghitung (per partai) →
 *   selesai | tanpaSampel | batal | galat
 *
 * `menyiapkan` hanya berjalan setelah pengguna menekan tombol — `MesinMaia`
 * sendiri tidak pernah menyentuh jaringan sampai `siapkan()` dipanggil, dan
 * bobot yang sudah ada di IndexedDB dipakai ulang tanpa unduh.
 *
 * Yang dihitung diserahkan ke `ringkasDeviasiRiwayat` (murni); pengait ini
 * hanya menyediakan penyedia prediksi, progres, dan pembatalan.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ambilDaftarPartai } from "../../basisData.js";
import { BATAS_PARTAI } from "../../akun/antiCheatRiwayat.js";
import { ratingDariMetadata, warnaPemainDariMetadata } from "../../mesin/antiCheat.js";
import { prediksiManusia } from "../../mesin/prediksiMaia.js";
import { ringkasDeviasiRiwayat } from "../../mesin/deviasiRiwayat.js";
import { batasRating, RATING_BAKU } from "../../../../lib/maia3.js";
import { useMesinMaia } from "../../../../lib/gunakanMesinMaia.js";

const KOSONG = { ke: 0, total: 0 };

/**
 * @param {{platform?: string, username?: string, waktu?: string,
 *   batas?: number|null, rating?: number}} opsi
 *   filter yang sama dengan deteksi riwayat: partai yang dinilai harus persis
 *   partai yang sedang ditinjau peninjau, bukan seluruh basis data. `batas`
 *   adalah jumlah partai dari kolom yang sama dengan jalur Stockfish, dan
 *   `rating` adalah Elo pemain — pengganti kolom kedalaman, karena Maia tidak
 *   punya kedalaman: yang menentukan tebakannya adalah rating.
 */
export function useDeviasiManusia({
  platform = "chessCom",
  username = "",
  waktu = "any",
  batas = null,
  rating = RATING_BAKU,
} = {}) {
  const maia = useMesinMaia();
  const [status, setStatus] = useState("kosong");
  const [hasil, setHasil] = useState(null);
  const [pesan, setPesan] = useState("");
  const [progres, setProgres] = useState(KOSONG);
  const [berjalan, setBerjalan] = useState(false);
  const controllerRef = useRef(null);
  // PGN partai yang baru dinilai — sumber tombol "buka di papan" di panel.
  const partaiRef = useRef([]);
  // `null` berarti isian jumlah partai belum sah; panggilan mulai ditahan
  // pemanggil, jadi nilai jatuh ke bawaan yang sama dengan jalur Stockfish.
  const jumlahPartai = Number.isInteger(batas) && batas > 0 ? batas : BATAS_PARTAI;
  // Satu sumber untuk kedua sisi inferensi: Elo yang dipilih pengguna. Nilai di
  // luar rentang model dijepit di sini supaya sisa UI tidak perlu tahu batasnya.
  const elo = batasRating(rating);

  // Bongkar komponen di tengah perhitungan tidak boleh menyisakan inferensi
  // yang terus jalan di worker.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const mulai = useCallback(async () => {
    if (berjalan || !username) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;
    const terkini = () => controllerRef.current === controller;

    setHasil(null);
    setPesan("");
    setProgres(KOSONG);
    setBerjalan(true);
    setStatus("menyiapkan");

    try {
      // Titik unduhan: satu-satunya jalur yang menyentuh jaringan.
      await maia.siapkan();
      if (!terkini() || signal.aborted) return;

      const daftar =
        (await ambilDaftarPartai({
          koleksiId: `${platform}:${username.toLowerCase()}`,
          timeClass: waktu === "any" ? "" : waktu,
          limit: jumlahPartai,
          sertakanPgn: true,
          urut: "tanggal",
          arah: "desc",
        }))?.partai || [];
      if (!terkini() || signal.aborted) return;
      if (!daftar.length) {
        setStatus("tanpaPartai");
        return;
      }

      partaiRef.current = daftar;
      setStatus("menghitung");
      setProgres({ ke: 0, total: daftar.length });
      const keluaran = await ringkasDeviasiRiwayat(daftar, {
        warnaUntuk: (partai) => warnaPemainDariMetadata(partai?.metadata, username),
        sinyal: signal,
        onProgres: (p) => {
          if (terkini() && !signal.aborted) setProgres(p);
        },
        prediksi: (moves, { partai: satu, sinyal: sinyalPrediksi }) => {
          // Pemain memakai Elo dari kolom pengaturan — itulah pengganti
          // "kedalaman" di jalur ini. Lawan memakai Elo dari PGN bila ada;
          // kalau PGN impor lama tidak memuatnya, Elo yang sama dipakai untuk
          // kedua sisi (lawan selevel adalah asumsi paling wajar).
          const dariPgn = ratingDariMetadata(satu?.metadata);
          const warna = warnaPemainDariMetadata(satu?.metadata, username);
          const eloLawan = warna === "b" ? dariPgn.w : dariPgn.b;
          return prediksiManusia(moves, {
            mesin: { inferensi: maia.inferensi },
            rating: elo,
            ratingLawan: Number.isFinite(eloLawan) ? eloLawan : elo,
            sinyal: sinyalPrediksi,
          });
        },
      });
      if (!terkini()) return;
      setHasil(keluaran);
      setStatus(keluaran.dibatalkan ? "batal" : keluaran.sampel > 0 ? "selesai" : "tanpaSampel");
    } catch (galat) {
      if (!terkini() || signal.aborted) return;
      setStatus("galat");
      setPesan(galat?.message ?? String(galat));
    } finally {
      if (terkini()) {
        controllerRef.current = null;
        setBerjalan(false);
      }
    }
  }, [berjalan, username, platform, waktu, jumlahPartai, elo, maia]);

  const batalkan = useCallback(() => controllerRef.current?.abort(), []);

  /**
   * Unduh/siapkan model TANPA menjalankan analisis.
   *
   * Dipisah karena 45 MB bukan sesuatu yang boleh terjadi sebagai efek samping
   * tombol "Analisis": tombolnya sendiri yang berubah menjadi "Unduh Maia",
   * dan baru setelah `siap` ia menjadi tombol analisis. Pemakaian berikutnya
   * memakai cache, jadi tombol itu langsung siap.
   */
  const siapkan = useCallback(async () => {
    if (maia.siap) return;
    try {
      await maia.siapkan();
      if (maia.siap) setStatus("kosong");
    } catch (galat) {
      setStatus("galat");
      setPesan(galat?.message ?? String(galat));
    }
  }, [maia]);

  /**
   * Teks PGN partai ke-`indeks` dari hasil yang sedang ditampilkan. Dipakai
   * panel untuk membuka partai itu di papan pada langkah yang disorot.
   */
  const pgnPartai = useCallback((indeks) => partaiRef.current[indeks]?.pgn || "", []);

  return {
    status,
    hasil,
    pesan,
    progres,
    berjalan,
    jumlahPartai,
    elo,
    mulai,
    batalkan,
    siapkan,
    pgnPartai,
    // Status unduhan model diteruskan apa adanya supaya panel bisa
    // menampilkan "mengunduh 42%" tanpa menebak-nebak.
    unduh: {
      status: maia.status,
      progres: maia.progres,
      galat: maia.galat,
      siap: maia.siap,
      dariCache: maia.dariCache,
    },
  };
}
