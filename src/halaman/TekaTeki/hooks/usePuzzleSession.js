/**
 * Hook sesi halaman Teka-Teki: data, koleksi, filter, indeks soal, dan URL.
 *
 * Semua yang berhubungan dengan "soal mana yang sedang dibuka" dipindahkan ke
 * sini supaya komponen halaman tidak lagi memegang efek pemuatan + penulisan
 * URL yang saling memicu. Dua perbaikan penting yang menyatu di desain ini:
 *
 *   1. Efek pemuatan hanya bergantung pada permintaan yang benar-benar berarti
 *      (`idPermintaan`, `kunciFilter`, `percobaan`) — tidak ada lagi
 *      `eslint-disable react-hooks/exhaustive-deps`. Perubahan nomor di URL
 *      (termasuk tombol kembali/maju peramban) kini memuat soal yang diminta.
 *   2. Penulisan URL dilakukan di efek terpisah yang hanya memantau soal aktif,
 *      jadi menulis URL tidak pernah memicu pemuatan ulang.
 *
 * Perilaku yang dipertahankan: nomor soal di URL ditulis dengan `replace:true`
 * agar riwayat peramban tidak menumpuk antar-soal.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { standarkanNamaPembukaan } from "../../../lib/namaPembukaan.js";
import { coba } from "../../../lib/utils.js";
import {
  bacaPosisi,
  bacaTerpecahkan,
  hapusPosisi,
  simpanPosisi as simpanPosisiKePenyimpanan,
  simpanTerpecahkan,
} from "../services/puzzleStorage.js";
import {
  cariIndeksBelumTerpecahkan,
  pilihIndeksAcak,
  tentukanIndeksAwal,
} from "../services/puzzleSelection.js";
import {
  daftarPelatihDari,
  FILTER_AWAL,
  kolamKoleksi,
  kunciFilter as hitungKunciFilter,
  saringSoal,
} from "../services/puzzleFilter.js";
import { urlVideoSah, tanggalVideoSah } from "../services/videoAman.js";
import { useCallbackTerbaru, useNilaiTerbaru } from "./useCallbackTerbaru.js";

const KUNCI_IMPOR_ANALISA = "kci-analisa-impor-awal";

/** Normalisasi satu record soal dari dataset (pembukaan + media). */
function rapikanSoal(item) {
  if (!item) return item;
  const video = urlVideoSah(item.video);
  const tanggal = tanggalVideoSah(item.tanggal);
  return {
    ...item,
    ...(item.pembukaan ? { pembukaan: standarkanNamaPembukaan(item.pembukaan) } : {}),
    video: video || undefined,
    tanggal: tanggal || undefined,
  };
}

/**
 * @param {object} opsi
 * @param {number|string} opsi.idUrl nomor soal dari URL ("problem" bila kosong)
 * @param {Function} opsi.pesanIdTidakDitemukan fungsi teks kamus ID tak dikenal
 */
export function usePuzzleSession({ idUrl, pesanIdTidakDitemukan, t }) {
  const navigate = useNavigate();

  const [semuaSoal, setSemuaSoal] = useState(null);
  const [soalTambahan, setSoalTambahan] = useState(null);
  const [memuatKoleksi, setMemuatKoleksi] = useState(false);
  const [gagal, setGagal] = useState(false);
  const [percobaan, setPercobaan] = useState(0);
  const [indeks, setIndeks] = useState(0);
  // Naik setiap kali soal dipasang eksplisit — membuat "buka ulang soal yang
  // sama" (mis. meninjau soal yang sudah tuntas) tetap mengembalikan papan.
  const [versiSoal, setVersiSoal] = useState(0);
  const [filter, setFilter] = useState(FILTER_AWAL);
  const [pesan, setPesan] = useState(null);
  // Input nomor soal + pesan galatnya (hanya UI sesi, bukan keadaan permainan).
  const [nomorSoal, setNomorSoal] = useState("");
  const [galatNomor, setGalatNomor] = useState(null);
  const [terpecahkan, setTerpecahkan] = useState(bacaTerpecahkan);
  const [posisiTersimpan, setPosisiTersimpan] = useState(bacaPosisi);
  const [ingatPosisi, setIngatPosisi] = useState(true);

  /* --------------------------------------------------------- data turunan */

  const kolamAktif = useMemo(
    () => kolamKoleksi(semuaSoal, soalTambahan, filter.koleksi),
    [semuaSoal, soalTambahan, filter.koleksi]
  );

  const daftarPelatih = useMemo(
    () => daftarPelatihDari(kolamAktif, filter.koleksi),
    [kolamAktif, filter.koleksi]
  );

  const soal = useMemo(() => saringSoal(kolamAktif, filter), [kolamAktif, filter]);

  const masalah = soal?.[indeks];

  const kunciFilter = hitungKunciFilter(filter);

  /* ------------------------------------------------- permintaan dari URL */

  const idPermintaan = useMemo(() => {
    const teks = String(idUrl ?? "").trim();
    if (!teks || teks === "problem") return null;
    const n = Number(teks);
    return Number.isInteger(n) && n >= 1 ? n : null;
  }, [idUrl]);

  const idBermakna = useMemo(() => {
    const teks = String(idUrl ?? "").trim();
    return Boolean(teks) && teks !== "problem";
  }, [idUrl]);

  // Ref agar efek pemuatan tidak perlu memasang ulang callback ketika soal
  // berganti; isinya selalu versi terbaru (lihat useCallbackTerbaru).
  const ingatPosisiRef = useRef(ingatPosisi);
  useEffect(() => {
    ingatPosisiRef.current = ingatPosisi;
  }, [ingatPosisi]);

  const terpecahkanRef = useRef(terpecahkan);
  useEffect(() => {
    terpecahkanRef.current = terpecahkan;
  }, [terpecahkan]);

  /* ------------------------------------------------- unduh koleksi tambahan */

  const janjiKoleksiRef = useRef(null);
  const hidupRef = useRef(true);
  useEffect(() => {
    hidupRef.current = true;
    return () => {
      hidupRef.current = false;
    };
  }, []);

  const unduhKoleksiTambahan = useCallback(() => {
    if (janjiKoleksiRef.current) return janjiKoleksiRef.current;
    const janji = fetch(`${import.meta.env.BASE_URL}data/teka-teki-video.json`)
      .then((respon) => {
        if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
        return respon.json();
      })
      .then((data) => {
        const mentah = data?.problems || [];
        if (!mentah.length) throw new Error("data tambahan kosong");
        return mentah.map(rapikanSoal);
      })
      .catch((err) => {
        janjiKoleksiRef.current = null;
        throw err;
      });
    janjiKoleksiRef.current = janji;
    return janji;
  }, []);

  /* --------------------------------------------------------- pilih soal */

  const perbaruiUrlSoal = useCallback(
    (id) =>
      navigate(`/teka-teki/problem/${encodeURIComponent(String(id))}`, {
        replace: true,
      }),
    [navigate]
  );

  const simpanPosisi = useCallback((id, koleksi) => {
    if (!ingatPosisiRef.current) return;
    simpanPosisiKePenyimpanan(id, koleksi);
    setPosisiTersimpan({ id, koleksi });
  }, []);

  /**
   * Pasang soal sebagai soal aktif. `perbaruiUrl` dimatikan saat efek pemuatan
   * sudah menulis URL sendiri, agar tidak ada dua penulisan beruntun.
   */
  /*
   * `perbaruiUrlSoal` bergantung pada `navigate` react-router, yang identitasnya
   * berubah setiap kali lokasi berubah. Kalau `pasangSoal` memakai callback itu
   * langsung, efek pemuatan & efek filter akan berjalan ulang setelah setiap
   * penulisan URL dan memasang ulang papan di tengah langkah pemain. Karena itu
   * keduanya dipanggil lewat ref: `pasangSoal` tetap stabil.
   */
  const perbaruiUrlTerbaru = useCallbackTerbaru(perbaruiUrlSoal);
  const simpanPosisiTerbaru = useCallbackTerbaru(simpanPosisi);
  // Soal yang sedang terpasang — dipakai efek muat untuk membedakan "URL
  // ditulis oleh aplikasi sendiri" dari "pemain membuka nomor lain".
  const idTerpasangRef = useRef(null);

  const pasangSoal = useCallback(
    (daftar, idx, koleksi, { perbaruiUrl = true } = {}) => {
      const m = daftar?.[idx];
      if (!m) return null;
      setIndeks(idx);
      idTerpasangRef.current = m.problemid;
      simpanPosisiTerbaru(m.problemid, koleksi);
      if (perbaruiUrl) perbaruiUrlTerbaru(m.problemid);
      setVersiSoal((n) => n + 1);
      return m;
    },
    [simpanPosisiTerbaru, perbaruiUrlTerbaru]
  );

  /* --------------------------------------------- efek pemuatan data soal */

  const pesanRef = useCallbackTerbaru(pesanIdTidakDitemukan);
  const tRef = useCallbackTerbaru(t);

  // Nilai permintaan dibaca lewat ref agar efek pemuatan tidak perlu dipasang
  // ulang setiap URL ditulis aplikasi sendiri.
  const idPermintaanRef = useNilaiTerbaru(idPermintaan);
  const idBermaknaRef = useNilaiTerbaru(idBermakna);
  const idUrlRef = useNilaiTerbaru(idUrl);

  // `percobaan` terakhir yang sudah dimuat (0 = muatan pertama).
  const percobaanDimuatRef = useRef(-1);

  useEffect(() => {
    /*
     * Efek ini memuat dataset SEKALI per "Coba lagi". Pemilihan soal sesudahnya
     * ditangani efek lain, sehingga menulis URL atau mengganti filter tidak
     * pernah mengulang unduhan — dulu efek ini ikut berjalan pada setiap
     * perubahan filter dan memasang ulang papan di tengah langkah.
     */
    if (percobaanDimuatRef.current === percobaan) return;
    percobaanDimuatRef.current = percobaan;

    let aktif = true;
    setGagal(false);
    fetch(`${import.meta.env.BASE_URL}data/teka-teki.json`)
      .then((respon) => {
        if (!respon.ok) throw new Error(`HTTP ${respon.status}`);
        return respon.json();
      })
      .then(async (data) => {
        if (!aktif) return;
        const daftarMentah = data.problems || [];
        if (!daftarMentah.length) throw new Error("data kosong");
        const daftar = daftarMentah.map(rapikanSoal);
        const idDiminta = idPermintaanRef.current;

        // Nomor di luar jangkauan dataset utama bisa menunjuk koleksi kurasi.
        if (idDiminta && idDiminta > daftar.length) {
          try {
            const daftarTambahan = await unduhKoleksiTambahan();
            if (!aktif) return;
            const target = daftarTambahan.find((m) => m.problemid === idDiminta);
            if (target) {
              const koleksiTarget = target.video ? "video" : "arsip";
              const kolamTarget = kolamKoleksi(daftar, daftarTambahan, koleksiTarget);
              const idxTarget = kolamTarget.findIndex(
                (m) => m.problemid === idDiminta
              );
              setSemuaSoal(daftar);
              setSoalTambahan(daftarTambahan);
              setFilter((lama) => ({ ...lama, koleksi: koleksiTarget, pelatih: "semua" }));
              pasangSoal(
                kolamTarget,
                idxTarget >= 0 ? idxTarget : 0,
                koleksiTarget,
                { perbaruiUrl: false }
              );
              return;
            }
          } catch {
            if (!aktif) return;
          }
        }

        const idxAwal = tentukanIndeksAwal({
          daftar,
          idDiminta,
          koleksi: "lichess",
          posisiTersimpan: ingatPosisiRef.current ? bacaPosisi() : null,
          terpecahkan: terpecahkanRef.current,
        });
        setSemuaSoal(daftar);
        if (idxAwal === -1) {
          setIndeks(-1);
        } else {
          pasangSoal(daftar, idxAwal, "lichess");
        }
        if (idDiminta === null && idBermaknaRef.current) {
          setPesan({
            jenis: "peringatan",
            teks: pesanRef.current?.({
              id: String(idUrlRef.current),
              total: daftar.length,
            }),
          });
        }
      })
      .catch(() => {
        if (aktif) setGagal(true);
      });
    return () => {
      aktif = false;
    };
  }, [percobaan, pasangSoal, unduhKoleksiTambahan, pesanRef, idPermintaanRef, idBermaknaRef, idUrlRef]);

  /* --------------------------------- soal yang diminta lewat alamat (URL) */

  useEffect(() => {
    /*
     * Nomor di alamat bisa berubah tanpa lewat UI: pemain mengetik URL lain,
     * menekan kembali, atau membuka tautan. Bila nomornya berbeda dari soal yang
     * sedang terpasang, pasang soal itu — tanpa mengunduh ulang dataset.
     */
    if (idPermintaan === null) return;
    if (idPermintaan === idTerpasangRef.current) return;
    const daftar = soalRef.current;
    if (!daftar?.length) return;
    const idx = daftar.findIndex((m) => m.problemid === idPermintaan);
    if (idx === -1) return;
    pasangSoal(daftar, idx, filter.koleksi, { perbaruiUrl: false });
  }, [idPermintaan, soal, soalTambahan, pasangSoal, filter.koleksi]);

  /* --------------------------------- efek re-filter: pilih soal yang pas */

  const soalRef = useRef(soal);
  useEffect(() => {
    soalRef.current = soal;
  }, [soal]);

  // Indeks yang sedang tampil, dibaca lewat ref oleh efek re-filter.
  const indeksRef = useNilaiTerbaru(indeks);
  const koleksiSebelumnyaRef = useRef(filter.koleksi);

  useEffect(() => {
    // Pemilihan ulang hanya terjadi ketika filter berubah — bukan saat pindah
    // soal. Karena itu keadaan soal dibaca dari ref, sedangkan pemicunya adalah
    // `kunciFilter`/`koleksi` (satu-satunya dependensi yang jujur).
    const gantiKoleksi = koleksiSebelumnyaRef.current !== filter.koleksi;
    koleksiSebelumnyaRef.current = filter.koleksi;
    const daftar = soalRef.current;
    if (!daftar?.length) {
      setIndeks(-1);
      return;
    }
    // Berganti koleksi → mulai dari soal pertama kolam baru (perilaku lama);
    // filter lain → lanjut dari posisi yang sedang tampil.
    const awalDiminta = gantiKoleksi ? 0 : Math.max(0, indeksRef.current);
    const idx = cariIndeksBelumTerpecahkan(
      daftar,
      awalDiminta,
      terpecahkanRef.current
    );
    if (idx === -1) {
      setIndeks(-1);
      return;
    }
    pasangSoal(daftar, idx, filter.koleksi);
  }, [kunciFilter, filter.koleksi, pasangSoal, indeksRef]);

  /* ------------------------------------------------------ aksi navigasi */

  const pindahSoal = useCallback(
    (indeksBaru, izinkanTerpecahkan = false) => {
      const daftar = soalRef.current;
      if (!daftar?.length) return null;
      const total = daftar.length;
      const diminta = ((indeksBaru % total) + total) % total;
      const idx = izinkanTerpecahkan
        ? diminta
        : cariIndeksBelumTerpecahkan(daftar, diminta, terpecahkanRef.current);
      if (idx === -1) {
        setIndeks(-1);
        return null;
      }
      return pasangSoal(daftar, idx, filter.koleksi);
    },
    [pasangSoal, filter.koleksi]
  );

  const soalAcak = useCallback(() => {
    const daftar = soalRef.current;
    const idx = pilihIndeksAcak(daftar, terpecahkanRef.current);
    if (idx === -1) {
      setIndeks(-1);
      return null;
    }
    return pasangSoal(daftar, idx, filter.koleksi);
  }, [pasangSoal, filter.koleksi]);

  const gantiFilter = useCallback((perubahan) => {
    setFilter((lama) => ({ ...lama, ...perubahan }));
  }, []);

  const koleksiDimintaRef = useRef(filter.koleksi);

  const pilihKoleksi = useCallback(
    (koleksiBaru) => {
      if (koleksiBaru === filter.koleksi && !memuatKoleksi) return;
      koleksiDimintaRef.current = koleksiBaru;
      setGalatNomor(null);
      setNomorSoal("");

      const pasangKoleksi = (nilai) =>
        setFilter((lama) => ({
          ...lama,
          koleksi: nilai,
          pelatih: "semua",
          // Koleksi Lichess tidak mengenal tipe "Mate in More"/"Tactical".
          tipe:
            nilai === "lichess" &&
            (lama.tipe === "Mate in More" || lama.tipe === "Tactical")
              ? "semua"
              : lama.tipe,
        }));

      if (koleksiBaru === "lichess") {
        setMemuatKoleksi(false);
        pasangKoleksi("lichess");
        return;
      }
      if (soalTambahan) {
        setMemuatKoleksi(false);
        pasangKoleksi(koleksiBaru);
        return;
      }
      /*
       * Koleksi kurasi baru dipasang SETELAH unduhan selesai. Kalau filter
       * diganti lebih dulu, efek re-filter akan memilih soal dari kolam lama
       * (Lichess) dengan label koleksi baru, lalu papan tidak pernah ikut
       * berpindah ke soal kurasi yang sebenarnya.
       */
      setMemuatKoleksi(true);
      unduhKoleksiTambahan()
        .then((daftarTambahan) => {
          if (!hidupRef.current) return;
          setSoalTambahan(daftarTambahan);
          setMemuatKoleksi(false);
          // Permintaan terakhir yang menang: unduhan yang selesai belakangan
          // tidak boleh menimpa pilihan koleksi yang lebih baru.
          const diminta = koleksiDimintaRef.current;
          if (diminta !== "lichess") pasangKoleksi(diminta);
        })
        .catch(() => {
          if (!hidupRef.current) return;
          setMemuatKoleksi(false);
          if (koleksiDimintaRef.current !== "lichess") {
            setPesan({ jenis: "peringatan", teks: tRef.current("tekaTeki.gagalMuat") });
          }
        });
    },
    [filter.koleksi, memuatKoleksi, soalTambahan, unduhKoleksiTambahan, tRef]
  );

  /* ------------------------------------------------------------ progres */

  const catatTerpecahkan = useCallback((id) => {
    setTerpecahkan((lama) => {
      if (lama.has(id)) return lama;
      const baru = new Set(lama);
      baru.add(id);
      return baru;
    });
  }, []);

  // Penyimpanan progres dijalankan di efek (bukan di dalam updater `setState`):
  // updater wajib murni, dan StrictMode memanggilnya dua kali saat development.
  const terpecahkanSiapRef = useRef(false);
  useEffect(() => {
    if (!terpecahkanSiapRef.current) {
      terpecahkanSiapRef.current = true;
      return;
    }
    simpanTerpecahkan(terpecahkan);
  }, [terpecahkan]);

  const bukaDiAnalisa = useCallback(
    (pgn) => {
      if (!pgn) return;
      coba(
        () => sessionStorage.setItem(KUNCI_IMPOR_ANALISA, pgn),
        "titip PGN ke papan analisa"
      );
      navigate("/program-kami/analisa/papan");
    },
    [navigate]
  );

  const ubahIngatPosisi = useCallback((nilai) => {
    setIngatPosisi(nilai);
    if (!nilai) {
      hapusPosisi();
      setPosisiTersimpan(null);
    }
  }, []);

  const cobaLagi = useCallback(() => setPercobaan((n) => n + 1), []);

  return {
    // data
    soal,
    masalah,
    versiSoal,
    daftarPelatih,
    memuatKoleksi,
    gagal,
    cobaLagi,
    // filter
    filter,
    gantiFilter,
    pilihKoleksi,
    // navigasi
    indeks,
    pindahSoal,
    soalAcak,
    // progres & posisi
    terpecahkan,
    catatTerpecahkan,
    posisiTersimpan,
    ingatPosisi,
    setIngatPosisi: ubahIngatPosisi,
    // pesan
    pesan,
    setPesan,
    // input nomor soal
    nomorSoal,
    setNomorSoal,
    galatNomor,
    setGalatNomor,
    // lain-lain
    bukaDiAnalisa,
  };
}
