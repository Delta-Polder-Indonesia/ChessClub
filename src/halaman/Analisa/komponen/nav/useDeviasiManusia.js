/**
 * Pengait layar Deteksi engine untuk metrik distribusi manusia (Maia).
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
import { ratingDariMetadata, warnaPemainDariMetadata } from "../../mesin/antiCheat.js";
import { prediksiManusia } from "../../mesin/prediksiMaia.js";
import { ringkasDeviasiRiwayat } from "../../mesin/deviasiRiwayat.js";
import { useMesinMaia } from "../../../../lib/gunakanMesinMaia.js";

const KOSONG = { ke: 0, total: 0 };

/**
 * @param {{platform?: string, username?: string, waktu?: string, batas?: number}} opsi
 *   filter yang sama dengan deteksi riwayat: partai yang dinilai harus persis
 *   partai yang sedang ditinjau peninjau, bukan seluruh basis data.
 */
export function useDeviasiManusia({ platform = "chessCom", username = "", waktu = "any", batas = 0 } = {}) {
  const maia = useMesinMaia();
  const [status, setStatus] = useState("kosong");
  const [hasil, setHasil] = useState(null);
  const [pesan, setPesan] = useState("");
  const [progres, setProgres] = useState(KOSONG);
  const [berjalan, setBerjalan] = useState(false);
  const controllerRef = useRef(null);
  // PGN partai yang baru dinilai — sumber tombol "buka di papan" di panel.
  const partaiRef = useRef([]);

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
          limit: batas,
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
          // Rating dibaca per partai: riwayat bisa memuat naik-turun rating,
          // dan Maia memakai rating sebagai masukan utama.
          const rating = ratingDariMetadata(satu?.metadata);
          const warna = warnaPemainDariMetadata(satu?.metadata, username);
          const milikPemain = warna === "b" ? rating.b : rating.w;
          const milikLawan = warna === "b" ? rating.w : rating.b;
          return prediksiManusia(moves, {
            mesin: { inferensi: maia.inferensi },
            rating: milikPemain,
            ratingLawan: milikLawan,
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
  }, [berjalan, username, platform, waktu, batas, maia]);

  const batalkan = useCallback(() => controllerRef.current?.abort(), []);

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
    mulai,
    batalkan,
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
