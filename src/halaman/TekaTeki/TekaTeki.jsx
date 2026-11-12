/**
 * Halaman Teka-Teki — komposisi tipis.
 *
 * Berkas ini dulu memuat 2.987 baris: pemuatan data, pemilihan soal, aturan
 * permainan, navigasi tinjau, mesin, audio, video, statistik, i18n, dan seluruh
 * markup dalam satu komponen 1.600 baris plus satu komponen presentasi 89 prop.
 *
 * Sekarang berkas ini hanya merangkai:
 *   - `usePuzzleSession`  → data, filter, indeks, URL, progres (services/*)
 *   - `usePuzzleGame`     → aturan permainan (reducers/tekaTekiReducer, murni)
 *   - `usePuzzleReview`   → navigasi tinjau + pintasan panah
 *   - `usePuzzleSettings` → preferensi tampilan (services/puzzleStorage)
 *   - komponen kecil di `komponen/`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { useLocation, useParams } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import { useEngineCatur } from "../../lib/gunakanEngineCatur.js";
import { PILIHAN_KECEPATAN } from "../../components/panelEngineData.js";
import { isForced } from "../Analisa/mesin/penilaian.js";
import { cariNamaPembukaan } from "../Analisa/mesin/buku.js";
import { petakRajaPemenang, petakRajaTermat } from "../../lib/skakmat.js";
import { useSuara } from "../../lib/suara.js";
import { usePreferensiKomentator } from "../../components/usePreferensiKomentator.js";
import { susunKomentarTekaTeki } from "../../lib/komentator.js";
import { antrekanLatar } from "../../lib/waktuSenggang.js";
import { DAFTAR_SET } from "../../components/chess/pemuatBidak.js";
import { PILIHAN_WARNA_PAPAN } from "../../lib/pilihanPapan.js";
import KartuKomentator from "../../components/KartuKomentator.jsx";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import { useTandaBantu } from "../../lib/tandaBantu.js";
import { bangunPgnUntukAnalisa } from "./services/puzzlePgn.js";
import { bandLevel } from "./services/puzzleFilter.js";
import { hitungTangkapanPuzzle } from "./services/tangkapanPuzzle.js";
import { DAFTAR_TEMA } from "./data/temaTekaTeki.js";
import { usePuzzleSession } from "./hooks/usePuzzleSession.js";
import { usePuzzleGame } from "./hooks/usePuzzleGame.js";
import { usePuzzleReview } from "./hooks/usePuzzleReview.js";
import { usePuzzleSettings } from "./hooks/usePuzzleSettings.js";
import TekaTekiShell from "./komponen/TekaTekiShell.jsx";
import BilahEvaluasi from "./komponen/BilahEvaluasi.jsx";
import PromotionDialog from "./komponen/PromotionDialog.jsx";
import PapanProgres from "./komponen/PapanProgres.jsx";

/**
 * ID soal dari alamat: segmen terakhir, bukan segmen pertama. Alamat kanonik
 * memakai `/teka-teki/problem/<nomor>`, sedangkan alamat lama
 * `/teka-teki/<nomor>` (dialihkan di App.jsx) tetap dibaca sama. Untuk
 * `/teka-teki/problem` tanpa nomor, segmen terakhir = "problem" → bukan angka.
 */
function idSoalDariLokasi(lokasi, idRute) {
  if (idRute) return idRute;
  if (!lokasi.pathname.startsWith("/teka-teki/")) return "";
  const segmen = lokasi.pathname.split("/").filter(Boolean).pop() || "";
  try {
    return decodeURIComponent(segmen);
  } catch {
    // Alamat dengan escape rusak (mis. "%") tidak boleh menjatuhkan halaman.
    return segmen;
  }
}

const KUNCI_LEVEL = {
  1: "tekaTeki.sangatMudah",
  2: "tekaTeki.mudah",
  3: "tekaTeki.normal",
  4: "tekaTeki.sulit",
  5: "tekaTeki.sangatSulit",
};

export default function TekaTeki() {
  const { t } = useI18n();
  const lokasi = useLocation();
  const { id: idRute } = useParams();
  const idUrl = idSoalDariLokasi(lokasi, idRute);

  const pesanIdTidakDitemukan = useCallback(
    (nilai) => t("tekaTeki.idSoalTidakDitemukan", nilai),
    [t]
  );
  // Fungsi pesan dibaca lewat ref oleh hook sesi: pesan hanya perlu versi
  // terbaru saat dipakai, bukan menjadi pemicu pemuatan ulang.
  const pesanRef = useRef(pesanIdTidakDitemukan);
  useEffect(() => {
    pesanRef.current = pesanIdTidakDitemukan;
  }, [pesanIdTidakDitemukan]);

  /* --------------------------------------------------------------- sesi */
  const sesi = usePuzzleSession({
    idUrl,
    pesanIdTidakDitemukan: pesanRef.current,
    t,
  });
  const {
    masalah,
    versiSoal,
    soal,
    kolamAktif,
    memuatKoleksi,
    gagal,
    cobaLagi,
    filter,
    gantiFilter,
    pilihKoleksi,
    indeks,
    pindahSoal,
    soalAcak,
    terpecahkan,
    catatTerpecahkan,
    posisiTersimpan,
    ingatPosisi,
    setIngatPosisi,
    pesan,
    setPesan,
    bukaDiAnalisa,
    daftarPelatih,
    nomorSoal,
    setNomorSoal,
    galatNomor,
    setGalatNomor,
  } = sesi;

  /* ----------------------------------------------------------- preferensi */
  const pengaturan = usePuzzleSettings({ ingatPosisi, setIngatPosisi });
  const { setBidak, setSetBidak, warnaPapan, setWarnaPapan, otomatis, setOtomatis } =
    pengaturan;

  /* ------------------------------------------------------------ suara */
  const {
    nyala: suaraNyala,
    setNyala: setSuaraNyala,
    mainkan: bunyikan,
    mainkanLangkah: bunyikanLangkah,
  } = useSuara();

  /* ------------------------------------------------------ tanda bantu */
  const { tanda, tandaPetak, tandaPanah, hapusSemuaTanda } = useTandaBantu();

  const [tabPanelAktif, setTabPanelAktif] = useState("main");
  const [videoGagal, setVideoGagal] = useState(false);

  /* ------------------------------------------------------------- mesin */
  const {
    engineNyala,
    kecepatanEngine,
    setKecepatanEngine,
    hasilEngine,
    panahMesin,
    tampilPanahMesin,
    setTampilPanahMesin,
    nyalakanEngine,
    matikanEngine,
  } = useEngineCatur(masalah?.fen || "");

  /**
   * Hasil evaluasi terakhir ditahan selama analisis posisi baru berjalan agar
   * bar evaluasi tidak goyang. Diturunkan (bukan state salinan): nilai yang
   * dipakai selalu `hasilEngine` terbaru, dan reset saat engine mati dihitung.
   */
  const hasilTertahan = engineNyala ? hasilEngine : null;

  /* ------------------------------------------------------ permainan */
  const permainan = usePuzzleGame({
    masalah,
    bunyikan,
    bunyikanLangkah,
    setPesan,
    catatTerpecahkan,
    otomatis,
    pindahSoal,
    t,
    indeks,
    hapusTanda: hapusSemuaTanda,
  });
  const {
    kondisi,
    dispatch,
    pasangSoal,
    pilihPetak,
    klikPetak,
    cobaLangkah,
    pilihPromosi,
    batalPromosi,
    batalkanOtomatis,
    tampilPetunjuk,
    setOrientasi,
    bisaHint,
    langkahPenuh,
    orientasi,
  } = permainan;
  const {
    fen,
    sisa,
    terpilih,
    sasaran,
    petunjuk,
    kesalahan,
    langkahAkhir,
    jalurFen,
    selesai,
    promosi,
    komputer,
    sedangSeret,
    komentar,
  } = kondisi;
  const tangkapan = useMemo(() => hitungTangkapanPuzzle(jalurFen), [jalurFen]);

  /*
   * Soal baru selalu memasang papan bersih, termasuk tanda bantu.
   *
   * Pemicu pemasangan papan adalah `versiSoal`, bukan `masalah`. `masalah`
   * ikut berubah setiap `soal` dihitung ulang (mis. saat filter/koleksi
   * berganti), padahal papan belum tentu perlu dipasang ulang; memasang pada
   * setiap perubahan `masalah` membuat papan bisa ter-reset dua kali untuk satu
   * soal yang sama, tepat di tengah langkah pemain.
   *
   * `versiSoal` hanya naik ketika sesi memasang soal secara eksplisit (muat
   * awal, navigasi, acak, filter, buka ulang soal), dan angka itulah yang
   * menjadi tanda "sudah dipasang".
   */
  const versiTerpasangRef = useRef(0);
  useEffect(() => {
    if (!masalah) return;
    if (versiSoal === 0) return;
    if (versiTerpasangRef.current === versiSoal) return;
    versiTerpasangRef.current = versiSoal;
    pasangSoal(masalah);
  }, [masalah, versiSoal, pasangSoal]);

  useEffect(() => {
    setVideoGagal(false);
  }, [masalah?.problemid]);

  /* -------------------------------------------------------- tinjau */
  const { keAwal, mundur, maju, keAkhir, bisaMundur, bisaMaju } = usePuzzleReview({
    kondisi,
    pasangSoal,
    dispatch,
    masalah,
    langkahPenuh,
    bunyikanLangkah,
    setPesan,
    onMundurOtomatis: batalkanOtomatis,
    blokirKunciPintasan: tabPanelAktif === "pengaturan",
  });

  /* ------------------------------------------------ komentator & ikon */

  const preferensiKomentator = usePreferensiKomentator();
  const bukuSiap = useMemo(() => ({ cari: null }), []);
  const [versiBuku, setVersiBuku] = useState(0);

  useEffect(() => {
    /*
     * Tabel buku ±1,3 MB jangan diunduh di jalur kritis halaman. Ditunda ke
     * waktu senggang peramban; `cariNamaPembukaan` men-cache janjinya.
     */
    let aktif = true;
    const muat = () =>
      cariNamaPembukaan()
        .then((cari) => {
          if (aktif && typeof cari === "function") {
            bukuSiap.cari = cari;
            setVersiBuku((n) => n + 1);
          }
        })
        .catch(() => {});
    const batalMuat = antrekanLatar(muat);
    return () => {
      aktif = false;
      batalMuat();
    };
  }, [bukuSiap]);

  /**
   * Lencana langkah terakhir: "book" (tercatat di buku), "forced" (satu-satunya
   * langkah legal), atau "best" (langkah solusi lain).
   *
   * `versiBuku` WAJIB ada di dependensi: pencari buku disimpan di ref, jadi
   * tanpa pemicu ini lencana "book" baru muncul setelah pemain memainkan
   * langkah berikutnya (bug C2 pada audit).
   */
  const ikonLangkahAkhir = useMemo(() => {
    void versiBuku;
    if (!jalurFen || jalurFen.length < 2) return null;
    const i = jalurFen.length - 1;
    const fenSebelum = jalurFen[i - 1];
    const fenSesudah = jalurFen[i];
    if (!fenSebelum || !fenSesudah) return null;

    let langkah;
    try {
      const g = new Chess(fenSebelum);
      const daftar = g.moves({ verbose: true });
      langkah =
        daftar.find((m) => m.after === fenSesudah) ||
        daftar.find((m) => {
          try {
            const uji = new Chess(fenSebelum);
            return uji.move(m.san)?.fen() === fenSesudah;
          } catch {
            return false;
          }
        }) ||
        null;
    } catch {
      return null;
    }
    if (!langkah) return null;

    let rating = "best";
    let namaBuku;
    try {
      namaBuku = bukuSiap.cari?.(fenSesudah) || null;
    } catch {
      namaBuku = null;
    }
    if (namaBuku) {
      rating = "book";
    } else {
      try {
        if (isForced({ before: fenSebelum })) rating = "forced";
      } catch {
        /* abaikan — tetap "best" */
      }
    }
    return { petak: langkah.to, rating };
  }, [jalurFen, versiBuku, bukuSiap]);

  const ikonSkakmat = useMemo(() => {
    const petak = petakRajaTermat(fen);
    return petak ? { petak } : null;
  }, [fen]);

  const ikonMahkota = useMemo(() => {
    const petak = petakRajaPemenang(fen);
    return petak ? { petak } : null;
  }, [fen]);

  const segmenKomentar = useMemo(() => {
    if (!komentar || !masalah) return null;
    const giliranSoal = masalah.first === "Black to Move" ? "b" : "w";
    return susunKomentarTekaTeki({
      tahap: komentar.tahap,
      gaya: preferensiKomentator.gaya,
      fakta: komentar.fakta || null,
      giliran: giliranSoal,
      jumlahLangkah: Math.ceil(langkahPenuh.length / 2),
      sisa: komentar.sisa !== undefined ? komentar.sisa : Math.ceil(sisa.length / 2),
      nomor: komentar.nomor || 0,
      sudahPecah: terpecahkan.has(masalah.problemid),
      legal: komentar.legal !== false,
      tema: masalah.tema ? String(masalah.tema).split(/\s+/) : [],
      petunjuk: komentar.petunjuk || null,
      benih: masalah.problemid,
    });
  }, [komentar, masalah, langkahPenuh.length, sisa.length, terpecahkan, preferensiKomentator.gaya]);

  const opsiTemaKamus = useMemo(
    () =>
      DAFTAR_TEMA.map((g) => ({
        grup: t(g.grup),
        isi: g.isi.map(([nilai, kunci]) => [nilai, t(kunci)]),
      })),
    [t]
  );

  /* ------------------------------------------------------------- aksi */
  const mainkanSaranEngine = useCallback(
    (san) => {
      if (!masalah || komputer || selesai || !sisa.length || !fen) return;
      const game = new Chess(fen);
      let pindah;
      try {
        pindah = game.move(san);
      } catch {
        pindah = null;
      }
      if (!pindah) return;
      dispatch({ type: "BERSIHKAN_PILIHAN" });
      cobaLangkah(pindah.from, pindah.to, pindah.promotion);
    },
    [masalah, komputer, selesai, sisa, fen, dispatch, cobaLangkah]
  );

  const bukaAnalisa = useCallback(() => {
    if (!masalah) return;
    bukaDiAnalisa(bangunPgnUntukAnalisa(masalah));
  }, [masalah, bukaDiAnalisa]);

  const bukaNomor = useCallback(
    (e) => {
      e.preventDefault();
      if (!soal?.length) return;
      const teks = String(nomorSoal || "").trim();
      const n = Number(teks);
      if (!/^\d+$/.test(teks) || n < 1 || n > soal.length) {
        setGalatNomor(t("tekaTeki.nomorTidakValid", { total: soal.length }));
        return;
      }
      setGalatNomor(null);
      setNomorSoal("");
      pindahSoal(n - 1, true);
    },
    [soal, nomorSoal, setGalatNomor, setNomorSoal, pindahSoal, t]
  );

  const kartuKomentator = (
    <KartuKomentator
      segmen={segmenKomentar}
      posisiAwal={false}
      nyala={preferensiKomentator.nyala}
      setNyala={preferensiKomentator.setNyala}
      gaya={preferensiKomentator.gaya}
      setGaya={preferensiKomentator.setGaya}
      t={t}
      className=""
      hanyaKontrol
    />
  );

  /* ------------------------------------------------------------ render */

  /*
   * "Memuat" berlaku sampai papan punya posisi. Tanpa `fen`, papan akan
   * tergambar sebagai 64 petak kosong sekejap sebelum soal terpasang — kilatan
   * yang tampak seperti papan rusak.
   */
  const memuat = !masalah || !fen;
  const kosong = !masalah && Boolean(kolamAktif) && !memuatKoleksi;

  return (
    <>
      {/*
        Satu halaman kanonik untuk pemutar teka-teki. Nomor soal di alamat
        (dipakai untuk berbagi) sengaja TIDAK menjadi kanonik sendiri — kalau
        tidak, ribuan URL nyaris identik akan bersaing di hasil pencarian.
      */}
      <MetaHalaman
        title={t("tekaTeki.metaJudul")}
        description={t("tekaTeki.metaDeskripsi")}
        robots="index, follow"
        path="/teka-teki/problem"
      />
      <TekaTekiShell
        masalah={masalah}
        /*
         * Pesan diteruskan HANYA untuk diumumkan pembaca layar lewat wilayah
         * `sr-only` di dalam shell — tidak ada yang tampil di layar.
         *
         * Dulu hanya pesan "selesai" yang diteruskan, sehingga langkah salah
         * (dan mate alternatif) tidak menghasilkan apa pun bagi pengguna
         * pembaca layar: umpan baliknya cuma lapisan merah + suara. Sekarang
         * pesan "salah" ikut diumumkan; sorotan petak & suara tetap sama.
         */
        pesan={
          pesan && (pesan.jenis === "selesai" || pesan.jenis === "salah") ? pesan : null
        }
        memuat={memuat}
        memuatKoleksi={memuatKoleksi}
        gagal={gagal}
        kosong={kosong}
        semuaTerpecahkan={Boolean(
          soal?.length && soal.every((m) => terpecahkan.has(m.problemid))
        )}
        selesai={selesai}
        kol={{
          nilai: filter.koleksi,
          buka: pilihKoleksi,
          daftarPelatih,
          pelatih: filter.pelatih,
          setPelatih: (v) => gantiFilter({ pelatih: v }),
          level: filter.level,
          setLevel: (v) => gantiFilter({ level: v }),
          langkah: filter.tipe,
          setLangkah: (tipe) => gantiFilter({ tipe }),
          tema: filter.tema,
          setTema: (v) => gantiFilter({ tema: v }),
          opsiTema: opsiTemaKamus,
          giliran: filter.giliran,
          setGiliran: (v) => gantiFilter({ giliran: v }),
          nomor: nomorSoal,
          setNomor: setNomorSoal,
          total: soal?.length || 0,
          galatNomor: galatNomor || "",
          bukaNomor,
          bisaHint,
          hint: tampilPetunjuk,
        }}
        tampilan={{
          orientasi,
          giliran: fen && fen.split(" ")[1] === "b" ? "hitam" : "putih",
          teksTingkat: masalah ? t(KUNCI_LEVEL[bandLevel(masalah.rating ?? 0)]) : "",
          teksCekmat: pesan?.jenis === "selesai" ? pesan.teks : "",
          eloSoal: masalah?.rating ?? 1500,
          namaHitam: masalah?.pemainHitam || "",
          eloHitam: masalah?.eloHitam || 0,
          tangkapanHitam: tangkapan.olehHitam,
          namaPutih: masalah?.pemainPutih || "",
          eloPutih: masalah?.eloPutih || 0,
          tangkapanPutih: tangkapan.olehPutih,
          nilaiSetBidak: setBidak,
          onGantiSetBidak: setSetBidak,
          daftarSet: DAFTAR_SET,
          nilaiWarnaPapan: warnaPapan,
          onGantiWarnaPapan: setWarnaPapan,
          pilihanWarnaPapan: PILIHAN_WARNA_PAPAN.map(([nilai, kunci]) => [nilai, t(kunci)]),
          nilaiSuara: suaraNyala,
          onGantiSuara: setSuaraNyala,
          nilaiOtomatis: otomatis,
          onGantiOtomatis: setOtomatis,
          nilaiIngatPosisi: ingatPosisi,
          onGantiIngatPosisi: pengaturan.setIngatPosisi,
          teksPosisiTersimpan:
            ingatPosisi && posisiTersimpan
              ? t("tekaTeki.posisiTersimpan", { n: posisiTersimpan.id })
              : "",
          teksIngatNonaktif: ingatPosisi ? "" : t("tekaTeki.ingatNonaktif"),
          komentatorNyala: preferensiKomentator.nyala,
          komentator: {
            nyala: preferensiKomentator.nyala,
            setNyala: preferensiKomentator.setNyala,
            gaya: preferensiKomentator.gaya,
            setGaya: preferensiKomentator.setGaya,
          },
          kartuKomentator,
        }}
        tabPanelAktif={tabPanelAktif}
        onGantiTabPanel={setTabPanelAktif}
        videoGagal={videoGagal}
        onGalatVideo={() => setVideoGagal(true)}
        onPutarVideo={() => {}}
        onBukaKoleksiVideo={() => pilihKoleksi("video")}
        mesin={{
          engineNyala,
          onGantiEngine: () => (engineNyala ? matikanEngine() : nyalakanEngine()),
          tampilPanahMesin,
          onGantiPanahMesin: setTampilPanahMesin,
          teksPanahMesin: t("papan.enginePanahToggle"),
          kecepatanEngine,
          onGantiKecepatan: (ms) => setKecepatanEngine(Number(ms)),
          opsiKecepatan: PILIHAN_KECEPATAN.map(([ms, kunci]) => [ms, t(kunci)]),
          pvSanEngine: hasilEngine?.pvSan || [],
          onMainkanSaran: mainkanSaranEngine,
        }}
        navigasi={{ onKeAwal: keAwal, onMundur: mundur, onMaju: maju, onKeAkhir: keAkhir, bisaMundur, bisaMaju }}
        aksi={{
          onFlip: () => setOrientasi((o) => (o === "w" ? "b" : "w")),
          onBukaAnalisa: bukaAnalisa,
          onAcak: soalAcak,
          onLewati: () => pindahSoal(indeks + 1),
          onCobaLagi: cobaLagi,
        }}
        papan={
          fen ? (
          <PapanProgres
            fen={fen}
            orientasi={orientasi}
            terpilih={terpilih}
            sasaran={sasaran}
            petunjuk={petunjuk}
            kesalahan={kesalahan}
            langkahAkhir={langkahAkhir}
            tanda={tanda}
            panahMesin={tampilPanahMesin ? panahMesin : null}
            ikonLangkah={kesalahan ? { petak: kesalahan.to, rating: "blunder" } : ikonLangkahAkhir}
            ikonSkakmat={kesalahan ? null : ikonSkakmat}
            ikonMahkota={kesalahan ? null : ikonMahkota}
            terkunci={komputer || selesai || Boolean(promosi)}
            membeku={komputer}
            setBidak={setBidak}
            // Papan menghitung paletnya sendiri dari prop `tema` (lihat memo
            // `warnaPapan` di PapanTekaTeki). Sebelumnya halaman mengirim
            // `warnaPapan={...}`, prop yang tidak pernah dibaca papan — jadi
            // apa pun yang dipilih di Pengaturan, papannya tetap hijau.
            tema={warnaPapan}
            sedangSeret={sedangSeret}
            onKlik={klikPetak}
            onPilih={pilihPetak}
            onMulaiSeret={(petak) => {
              if (!masalah || komputer || selesai || !fen) return;
              pilihPetak(petak);
            }}
            onSelesaiSeret={(from, to, klikUlang) => {
              if (klikUlang) {
                dispatch({ type: "BERSIHKAN_PILIHAN" });
                return;
              }
              if (!to || from === to) return;
              if (!masalah || komputer || selesai || !fen) return;
              cobaLangkah(from, to);
            }}
            onBatalSeret={() => dispatch({ type: "BERSIHKAN_PILIHAN" })}
            onJatuh={cobaLangkah}
            onTandaPetak={tandaPetak}
            onTandaPanah={tandaPanah}
            onHapusTanda={hapusSemuaTanda}
          />
          ) : null
        }
        bilahEvaluasi={<BilahEvaluasi hasil={hasilTertahan} orientasi={orientasi} />}
      />
      {promosi && (
        <PromotionDialog
          promosi={promosi}
          setBidak={setBidak}
          onPilih={pilihPromosi}
          onBatal={batalPromosi}
          judul={
            promosi.warna === "w" ? t("tekaTeki.promosiPutih") : t("tekaTeki.promosiHitam")
          }
        />
      )}
    </>
  );
}
