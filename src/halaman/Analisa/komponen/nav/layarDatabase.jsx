/*
 * Layar "Basis Data Permainan" (Database) — arsitektur terinspirasi
 * dari sistem manajemen database en-croissant (https://github.com/franciscoBSalgueiro/en-croissant).
 *
 * Menggunakan SVG icons konsisten tanpa emoji, tipografi terstruktur,
 * dan integrasi langsung ke IndexedDB peramban.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon } from "lucide-react";
import PanelLayar from "./PanelLayar.jsx";
import Database from "../svg/database.jsx";
import Back from "../svg/back.jsx";
import { Alert, Alertjudul } from "../../../../components/ui/alert.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import { ambilDaftarPartai, ambilPartai, ambilSemuaKoleksi, bacaRevisiBasis, bersihkanBasisData, eksporPgnKoleksi, hapusKoleksi, hapusPartai, hitungStatistikBasisData, hitungStatistikKoleksiRingan, langgananRevisi, pastikanKoleksi } from "../../basisData.js";
import { bacaDaftarAkun } from "../../akun/daftarAkun.js";
import { BARIS_PER_HALAMAN } from "./database/formatDatabase.js";
import ToolbarTabel from "./database/toolbarTabel.jsx";
import KolomKoleksi from "./database/kolomKoleksi.jsx";
import PanelRingkasanDatabase from "./database/panelRingkasanDatabase.jsx";
import PanelTabelData from "./database/panelTabelData.jsx";
import DialogDatabase from "./database/dialogDatabase.jsx";

/*
 * Cache sesi ringkasan Database: daftar koleksi + statistik seluruh basis +
 * statistik per koleksi. Disimpan bersama `revisi` basis data — setiap tulis
 * (unduh akun di menu Akun, impor, hapus, gabung, bersihkan) menaikkan revisi,
 * jadi cache ini otomatis basi saat data benar-benar berubah. Membuka layar
 * ini lagi tanpa perubahan tidak perlu memindai ulang IndexedDB.
 */
let cacheRingkasan = null;

/*
 * Pilihan yang bertahan saat layar dilepas: mode panel kanan ("data"/"tabel")
 * dan tab tabel ("partai"/"pemain"/"event"). Layar di-unmount begitu pindah
 * menu (mis. ke Bermain), jadi disimpan di sini agar kembali ke Database
 * tetap menampilkan tabel yang sedang dibuka — bukan ringkasan awal.
 */
let modeTersimpan = "data";
let tampilanTersimpan = "partai";

/*
 * Cache rekap tab Pemain & Event — key = koleksiId ("" = semua koleksi),
 * value = { revisi, daftar }. Bertahan lintas buka-tutup layar dalam sesi
 * yang sama; revisi basis yang naik otomatis membuatnya basi.
 */
const rekapPemainCache = new Map();
const rekapEventCache = new Map();

/*
 * Cache sesi halaman terakhir tabel Partai: satu entri { kunci, revisi,
 * total, daftar } untuk kueri yang paling baru dijalankan. Kunci mencakup
 * koleksi + cari + filter + urut + halaman. Tabel Partai selalu di-refetch
 * setiap layar dibuka ulang; dengan cache ini kembali ke Database tidak lagi
 * menarik ulang data yang sudah pernah dilihat selama revisi basis masih sama.
 */
let cacheTabelPartai = null;














/* ── Komponen Utama ────────────────────────────────────────────────── */

export default function LayarDatabase({
  onTutup,
  onAnalisa,
  onBukaAkun,
}) {
  const { t, bahasa: locale } = useI18n();

  /* State */
  const [koleksiList, setKoleksiList] = useState([]);
  const [koleksiTerpilih, setKoleksiTerpilih] = useState("");
  const [cari, setCari] = useState("");
  const [cariKoleksi, setCariKoleksi] = useState("");
  const [filterHasil, setFilterHasil] = useState("");
  const [filterWaktu, setFilterWaktu] = useState("");
  const [urut, setUrut] = useState({ kolom: "tanggal", arah: "desc" });
  const [hal, setHal] = useState(1);
  // Tandai bahwa auto-pilih "koleksi pertama" sudah pernah berjalan. Dipakai
  // supaya pilihan sah "Semua Koleksi" (nilai "") tidak di-bypass lagi oleh
  // auto-pilih tiap daftar koleksi berubah.
  const otomatisPilihRef = useRef(false);

  const [daftarPartai, setDaftarPartai] = useState([]);
  const [totalPartai, setTotalPartai] = useState(0);
  const [stats, setStats] = useState(null);
  const [memuat, setMemuat] = useState(true);

  const [, setSalinSuksesId] = useState(null);
  const [notifikasi, setNotifikasi] = useState(null);
  const notifikasiTimer = useRef(null);
  const [dialogEksporKosong, setDialogEksporKosong] = useState(false);
  const [dialogHapusPartai, setDialogHapusPartai] = useState(false);
  const [targetHapusPartai, setTargetHapusPartai] = useState(null);
  const [dialogHapusKoleksi, setDialogHapusKoleksi] = useState(null);
  const [dialogKosongkanSemua, setDialogKosongkanSemua] = useState(false);

  // Mode panel kanan: "data" (ringkasan + tools) atau "tabel" (browse/analisa).
  const [mode, setMode] = useState(modeTersimpan);
  // Revisi basis saat tabel ringkasan dirender agar ikut refetch setelah basis berubah.
  const revisiRingkasan = bacaRevisiBasis();
  // Statistik per koleksi (jumlah/pemain/event/ukuran) — di-cache di sini.
  const [statMap, setStatMap] = useState({});

  /* Tab tampilan mode tabel: "partai" (default) | "pemain" | "event". */
  const [tampilan, setTampilan] = useState(tampilanTersimpan);
  const [rekapPemain, setRekapPemain] = useState([]);
  const [rekapEvent, setRekapEvent] = useState([]);
  const [memuatPemain, setMemuatPemain] = useState(false);
  const [memuatEvent, setMemuatEvent] = useState(false);

  /* Simpan pilihan mode & tab agar bertahan saat layar dilepas lalu dibuka lagi. */
  useEffect(() => {
    modeTersimpan = mode;
  }, [mode]);
  useEffect(() => {
    tampilanTersimpan = tampilan;
  }, [tampilan]);

  /* Turunan */
  const totalHal = Math.max(1, Math.ceil(totalPartai / BARIS_PER_HALAMAN));
  const aktifHal = Math.min(hal, totalHal);
  const koleksi = koleksiList.find((k) => k.id === koleksiTerpilih) || null;
  // Koleksi yang tampil di kolom kiri, difilter oleh kotak pencarian koleksi.
  const daftarKoleksi = cariKoleksi
    ? koleksiList.filter((k) => (k.label || "").toLowerCase().includes(cariKoleksi.toLowerCase()))
    : koleksiList;

  // Penyaringan rekap Pemain & Event di memori (data sudah dimuat penuh):
  // kotak cari yang sama ikut menyaring kedua tab itu, tanpa tarik ulang.
  const cariBawah = cari.toLowerCase();
  const daftarPemainTampil = cariBawah
    ? rekapPemain.filter((e) => (e.nama || "").toLowerCase().includes(cariBawah))
    : rekapPemain;
  const daftarEventTampil = cariBawah
    ? rekapEvent.filter((e) => (e.nama || "").toLowerCase().includes(cariBawah))
    : rekapEvent;

  /* ── Pemuat Data ───────────────────────────────────────────────── */

  // Penjaga request basi: pemicu yang beruntun (ketikan kotak cari, ganti
  // koleksi, ganti layar) tidak boleh membuat hasil lama menimpa yang
  // lebih baru.
  const tokenPartai = useRef(0);
  const tokenMetadata = useRef(0);

  // Dialog Radix di-render ke <body> via Portal — di luar `.analisa-root`,
  // sehingga variabel tema Analisa tidak ikut dan kontennya tampil putih.
  // Portal konten dialog ke dalam akar tema supaya memakai warna gelap halaman.
  const wadahDialog = useMemo(
    () => document.querySelector?.(".analisa-root") || undefined,
    [],
  );

  // Penggabungan pembacaan ringkasan yang beruntun: bila pemuatan metadata
  // masih berjalan (mis. layar dibuka ulang saat scan pertama belum selesai),
  // panggilan kedua menunggu hasil yang sama — tidak memindai basis dua kali.
  const janjiRingkasan = useRef(null);

  async function muatMetadata() {
    const token = ++tokenMetadata.current;
    const revisi = bacaRevisiBasis();
    if (cacheRingkasan?.revisi === revisi) {
      if (token === tokenMetadata.current) {
        setKoleksiList(cacheRingkasan.koleksi);
        setStats(cacheRingkasan.stats);
        setStatMap(cacheRingkasan.statMap);
      }
      return;
    }
    // Pembacaan yang sama sedang berjalan → ikut menunggu, jangan dobel.
    if (janjiRingkasan.current) {
      try {
        await janjiRingkasan.current;
      } catch {
        /* abaikan */
      }
      if (token === tokenMetadata.current && cacheRingkasan?.revisi === bacaRevisiBasis()) {
        setKoleksiList(cacheRingkasan.koleksi);
        setStats(cacheRingkasan.stats);
        setStatMap(cacheRingkasan.statMap);
      }
      return;
    }
    const pekerjaan = (async () => {
      const [semuaKoleksi, st] = await Promise.all([
        ambilSemuaKoleksi(),
        hitungStatistikBasisData(),
      ]);
      // Statistik per koleksi (jumlah/pemain/event/ukuran) dihitung dari
      // metadata ringan (lihat hitungStatistikKoleksiRingan di basisData.js)
      // — versi lama membaca teks PGN penuh SETIAP koleksi, sehingga membuka
      // layar Database berulang kali menumpuk ribuan teks PGN di memori.
      // Dilakukan berurutan agar puncak memorinya kecil.
      const map = {};
      for (const k of semuaKoleksi) {
        try {
          map[k.id] = await hitungStatistikKoleksiRingan(k.id);
        } catch {
          map[k.id] = null;
        }
      }
      return { revisi, koleksi: semuaKoleksi, stats: st, statMap: map };
    })();
    janjiRingkasan.current = pekerjaan;
    try {
      const ringkasan = await pekerjaan;
      cacheRingkasan = ringkasan;
      if (token === tokenMetadata.current) {
        setKoleksiList(ringkasan.koleksi);
        setStats(ringkasan.stats);
        setStatMap(ringkasan.statMap);
      }
    } catch {
      /* abaikan */
    } finally {
      janjiRingkasan.current = null;
    }
  }

  async function muatPartai() {
    const token = ++tokenPartai.current;
    const revisi = bacaRevisiBasis();
    const kunci = JSON.stringify([
      koleksiTerpilih,
      cariDebounce,
      filterHasil,
      filterWaktu,
      urut,
      hal,
    ]);
    // Koleksi pertama belum terpilih otomatis (daftar koleksi masih dimuat):
    // skip dulu — effect ini akan berjalan ulang setelah auto-pilih.
    // "Semua Koleksi" (nilai "") tetap dihormati setelah auto-pilih pernah jalan.
    if (!koleksiTerpilih && koleksiList.length > 0 && !otomatisPilihRef.current) return;
    const tersimpan = cacheTabelPartai;
    if (tersimpan && tersimpan.kunci === kunci && tersimpan.revisi === revisi) {
      if (token === tokenPartai.current) {
        setDaftarPartai(tersimpan.daftar);
        setTotalPartai(tersimpan.total);
        setMemuat(false);
      }
      return;
    }
    setMemuat(true);
    try {
      let plat = "";
      let user = "";
      if (koleksiTerpilih) {
        const [p, ...rest] = koleksiTerpilih.split(":");
        plat = p;
        user = rest.join(":");
      }

      const hasil = await ambilDaftarPartai({
        koleksiId: koleksiTerpilih || undefined,
        platform: plat || undefined,
        username: user || undefined,
        cari: cariDebounce,
        hasil: filterHasil || undefined,
        timeClass: filterWaktu || undefined,
        urut: urut.kolom,
        arah: urut.arah,
        limit: BARIS_PER_HALAMAN,
        // Pakai halaman efektif (data menyusut → halaman terakhir yang valid),
        // bukan `hal` mentah, agar tidak minta offset di luar total partai.
        offset: (aktifHal - 1) * BARIS_PER_HALAMAN,
        // Tabel hanya butuh metadata. Teks PGN (bagian terberat tiap rekaman)
        // baru diambil untuk satu partai saat ditekan Analisa / Salin.
        sertakanPgn: false,
      });

      if (token !== tokenPartai.current) return; // ada pemicu yang lebih baru
      // Bedakan "koleksi kosong" dari "basis galat": yang kedua harus
      // bersuara, bukan tampil sebagai tabel kosong tanpa kabar.
      if (hasil?.galat) tampilkanNotif("Gagal memuat daftar partai dari basis data.", "gagal");
      cacheTabelPartai = { kunci, revisi, total: hasil.total || 0, daftar: hasil.partai || [] };
      setDaftarPartai(hasil.partai || []);
      setTotalPartai(hasil.total || 0);
    } catch {
      if (token === tokenPartai.current) {
        setDaftarPartai([]);
        setTotalPartai(0);
      }
    } finally {
      if (token === tokenPartai.current) setMemuat(false);
    }
  }

  /* ── Effects ───────────────────────────────────────────────────── */

  /*
   * Muat ulang otomatis setiap basis data berubah (mis. akun baru selesai
   * ditambahkan dari layar Akun sepersekian detik sebelum layar ini dibuka,
   * atau partai selesai ditarik). Memakai ref agar selalu memanggil pemuat
   * versi terbaru tanpa harus daftar-ulang tiap render.
   */
  const muatUlangRef = useRef({ meta: null, partai: null });
  muatUlangRef.current = { meta: muatMetadata, partai: muatPartai };
  useEffect(
    () =>
      langgananRevisi(() => {
        muatUlangRef.current.meta?.();
        muatUlangRef.current.partai?.();
      }),
    []
  );

  useEffect(() => {
    // Selaraskan daftar akun → koleksi lebih dulu: akun yang koleksinya
    // belum ada (balapan tulis / basis pernah dibersihkan) langsung dibuat
    // di sini sehingga tidak ada akun yang "hilang" dari Database.
    (async () => {
      try {
        const daftar = bacaDaftarAkun();
        await Promise.all(
          daftar
            .filter((a) => a?.platform && a?.username)
            .map((a) =>
              pastikanKoleksi({ platform: a.platform, username: a.username }).catch(() => null)
            )
        );
      } catch {
        /* abaikan — muatMetadata tetap jalan dengan apa yang ada */
      }
      muatMetadata();
    })();
     
  }, []);

  useEffect(() => {
    setHal(1);
  }, [koleksiTerpilih, cari, filterHasil, filterWaktu, urut]);

  // Kotak cari di-debounce: tanpa ini setiap ketikan memicu penelusuran
  // kursor baru ke IndexedDB (dan membuka transaksi baru) — mengetik cepat
  // beberapa kata menumpuk belasan kueri paralel.
  const tundaCari = useRef(null);
  const [cariDebounce, setCariDebounce] = useState(cari);
  useEffect(() => {
    window.clearTimeout(tundaCari.current);
    tundaCari.current = window.setTimeout(() => setCariDebounce(cari), 300);
    return () => window.clearTimeout(tundaCari.current);
  }, [cari]);

  useEffect(() => {
    muatPartai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [koleksiTerpilih, cariDebounce, filterHasil, filterWaktu, urut, hal]);

  /*
   * Rekap pemain & event — dihitung lazily (hanya saat tab-nya dibuka) dan
   * di-cache per (koleksi, revisi basis) di LEVEL MODUL: layar ini dilepas
   * setiap pindah menu Akun ↔ Database, jadi cache useRef ikut hilang dan
   * memindai ulang basis tiap kali. Keduanya cukup membaca METADATA (field
   * `event` sudah diuraikan dari header [Event] saat partai disimpan) — teks
   * PGN tidak pernah ditarik ke sini.
   */
  useEffect(() => {
    if (tampilan !== "pemain") return undefined;
    // Koleksi pertama belum terpilih otomatis: tunggu auto-pilih, effect ini
    // akan berjalan ulang begitu koleksi pertama siap. Pilihan "Semua Koleksi"
    // tetap dilayani setelah auto-pilih pernah jalan.
    if (!koleksiTerpilih && koleksiList.length > 0 && !otomatisPilihRef.current) return undefined;
    let hidup = true;
    const revisi = bacaRevisiBasis();
    const kunciCache = koleksiTerpilih || "";
    const cache = rekapPemainCache.get(kunciCache);
    if (cache && cache.revisi === revisi) {
      setRekapPemain(cache.daftar);
      setMemuatPemain(false);
      return undefined;
    }
    (async () => {
      setMemuatPemain(true);
      try {
        const hasil = await ambilDaftarPartai({
          koleksiId: koleksiTerpilih || undefined,
          limit: 0,
          urut: "tanggal",
          arah: "desc",
          sertakanPgn: false, // metadata saja — murah
        });
        const peta = new Map();
        const tambah = (nama, hasilMain, ts, p, sisi) => {
          if (!nama) return;
          const e =
            peta.get(nama) ||
            {
              nama,
              main: 0,
              menang: 0,
              seri: 0,
              kalah: 0,
              terakhir: 0,
              putih: 0,
              hitam: 0,
              elo: 0,
              partai: [],
            };
          e.main += 1;
          e[hasilMain] += 1;
          e[sisi] += 1;
          if (ts > e.terakhir) e.terakhir = ts;
          const elo = Number(sisi === "putih" ? p.whiteElo : p.blackElo) || 0;
          if (ts >= e.terakhir && elo > 0) e.elo = elo;
          // Metadata ringan per partai — untuk baris rincian kartu (tanpa PGN).
          e.partai.push({
            id: p.id,
            whiteName: p.whiteName,
            blackName: p.blackName,
            elo,
            result: p.result,
            sisi,
          });
          peta.set(nama, e);
        };
        for (const p of hasil?.partai || []) {
          const ts = p.timestamp || 0;
          if (p.result === "white") {
            tambah(p.whiteName, "menang", ts, p, "putih");
            tambah(p.blackName, "kalah", ts, p, "hitam");
          } else if (p.result === "black") {
            tambah(p.whiteName, "kalah", ts, p, "putih");
            tambah(p.blackName, "menang", ts, p, "hitam");
          } else {
            tambah(p.whiteName, "seri", ts, p, "putih");
            tambah(p.blackName, "seri", ts, p, "hitam");
          }
        }
        const daftar = Array.from(peta.values()).sort(
          (a, b) => b.main - a.main || a.nama.localeCompare(b.nama),
        );
        rekapPemainCache.set(kunciCache, { revisi, daftar });
        if (hidup) setRekapPemain(daftar);
      } catch {
        if (hidup) setRekapPemain([]);
      } finally {
        if (hidup) setMemuatPemain(false);
      }
    })();
    return () => {
      hidup = false;
    };
  }, [tampilan, koleksiTerpilih, koleksiList.length]);

  useEffect(() => {
    if (tampilan !== "event") return undefined;
    // Lihat catatan guard di effect tab Pemain.
    if (!koleksiTerpilih && koleksiList.length > 0 && !otomatisPilihRef.current) return undefined;
    let hidup = true;
    const revisi = bacaRevisiBasis();
    const kunciCache = koleksiTerpilih || "";
    const cache = rekapEventCache.get(kunciCache);
    if (cache && cache.revisi === revisi) {
      setRekapEvent(cache.daftar);
      setMemuatEvent(false);
      return undefined;
    }
    (async () => {
      setMemuatEvent(true);
      try {
        // Metadata saja: field `event` sudah diuraikan dari header [Event]
        // saat partai disimpan (normalisasiDataPartai), jadi tidak perlu
        // menarik teks PGN penuh ribuan partai ke memori.
        const hasil = await ambilDaftarPartai({
          koleksiId: koleksiTerpilih || undefined,
          limit: 0,
          urut: "tanggal",
          arah: "desc",
          sertakanPgn: false,
        });
        const peta = new Map();
        let butuhPgn = false;
        for (const p of hasil?.partai || []) {
          // Partai warisan tanpa event teruraikan → perlu fallback baca PGN.
          const nama = p.event?.trim() || "—";
          if (nama === "—") butuhPgn = true;
          const e = peta.get(nama) || { nama, jumlah: 0, terakhir: 0 };
          e.jumlah += 1;
          if ((p.timestamp || 0) > e.terakhir) e.terakhir = p.timestamp || 0;
          peta.set(nama, e);
        }

        // Basis lama: satu kali tarik PGN untuk koleksi ini lalu cache —
        // tidak diulang tiap kali layar ini dibuka.
        if (butuhPgn) {
          const lengkap = await ambilDaftarPartai({
            koleksiId: koleksiTerpilih || undefined,
            limit: 0,
            urut: "tanggal",
            arah: "desc",
            sertakanPgn: true,
          });
          const petaPenuh = new Map();
          for (const p of lengkap?.partai || []) {
            const m = /\[Event\s+"([^"]*)"\]/.exec(p.pgn || "");
            const nama = m?.[1]?.trim() || p.event?.trim() || "—";
            const e = petaPenuh.get(nama) || { nama, jumlah: 0, terakhir: 0 };
            e.jumlah += 1;
            if ((p.timestamp || 0) > e.terakhir) e.terakhir = p.timestamp || 0;
            petaPenuh.set(nama, e);
          }
          const daftarPenuh = Array.from(petaPenuh.values()).sort(
            (a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama),
          );
          rekapEventCache.set(kunciCache, { revisi, daftar: daftarPenuh });
          if (hidup) setRekapEvent(daftarPenuh);
          if (hidup) setMemuatEvent(false);
          return;
        }

        const daftar = Array.from(peta.values()).sort(
          (a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama),
        );
        rekapEventCache.set(kunciCache, { revisi, daftar });
        if (hidup) setRekapEvent(daftar);
      } catch {
        if (hidup) setRekapEvent([]);
      } finally {
        if (hidup) setMemuatEvent(false);
      }
    })();
    return () => {
      hidup = false;
    };
  }, [tampilan, koleksiTerpilih, koleksiList.length]);

  // Bila belum ada koleksi yang dipilih, pilih koleksi pertama otomatis (satu kali saja).
  useEffect(() => {
    if (!koleksiTerpilih && koleksiList.length > 0 && !otomatisPilihRef.current) {
      otomatisPilihRef.current = true;
      setKoleksiTerpilih(koleksiList[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [koleksiList]);

  /* ── Aksi / Handler ────────────────────────────────────────────── */

  function tampilkanNotif(pesan, variasi = "sukses") {
    setNotifikasi({ pesan, variasi });
    if (notifikasiTimer.current) clearTimeout(notifikasiTimer.current);
    notifikasiTimer.current = setTimeout(() => setNotifikasi(null), 4000);
  }

  /** Ambil teks PGN satu partai (baris tabel sengaja tidak membawanya). */
  async function pgnPartai(game) {
    if (game?.pgn) return game.pgn;
    if (!game?.id) return "";
    try {
      const penuh = await ambilPartai(game.id);
      return penuh?.pgn || "";
    } catch {
      return "";
    }
  }

  async function tanganiAnalisa(game) {
    const pgn = await pgnPartai(game);
    if (!pgn) {
      tampilkanNotif(t("analisa.basisData.pgnTidakAda"), "gagal");
      return;
    }
    onAnalisa({ format: "pgn", string: pgn });
    onTutup();
  }

  async function _tanganiSalinPgn(game) {
    const pgn = await pgnPartai(game);
    if (!pgn) {
      tampilkanNotif(t("analisa.basisData.pgnTidakAda"), "gagal");
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(pgn);
      }
      setSalinSuksesId(game.id);
      tampilkanNotif(t("analisa.basisData.pgnDisalin"));
      setTimeout(() => setSalinSuksesId(null), 2000);
    } catch {
      tampilkanNotif("Gagal menyalin PGN.", "gagal");
    }
  }

  async function tanganiEksporPgn(id) {
    try {
      const koleksiId = id ?? koleksiTerpilih;
      let plat = "";
      let user = "";
      if (koleksiId) {
        const [p, ...rest] = koleksiId.split(":");
        plat = p;
        user = rest.join(":");
      }

      const pgnString = await eksporPgnKoleksi({
        koleksiId: koleksiId || undefined,
        platform: plat || undefined,
        username: user || undefined,
        cari,
        hasil: filterHasil || undefined,
        timeClass: filterWaktu || undefined,
      });

      if (!pgnString) {
        setDialogEksporKosong(true);
        return;
      }

      const blob = new Blob([pgnString], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const namaFile = `kci-catur-${
        koleksiId
          ? koleksiId.replace(":", "-")
          : "semua"
      }-${Date.now()}.pgn`;
      a.href = url;
      a.download = namaFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      tampilkanNotif(t("analisa.basisData.eksporPgnSukses"));
    } catch {
      tampilkanNotif("Gagal mengekspor PGN.", "gagal");
    }
  }

  function _bukaDialogHapusPartai(e, game) {
    if (e) e.stopPropagation();
    setTargetHapusPartai(game);
    setDialogHapusPartai(true);
  }

  async function tanganiHapusPartai() {
    const game = targetHapusPartai;
    setDialogHapusPartai(false);
    setTargetHapusPartai(null);
    if (!game) return;
    // Nilai baliknya jujur (true/false) — jangan laporkan sukses buta.
    const ok = await hapusPartai(game.id);
    await muatMetadata();
    await muatPartai();
    if (ok) tampilkanNotif("Partai berhasil dihapus dari basis data.");
    else tampilkanNotif("Gagal menghapus partai dari basis data.", "gagal");
  }

  function tanganiHapusKoleksi(id) {
    const koleksiId = id ?? koleksiTerpilih;
    if (!koleksiId) return;
    setDialogHapusKoleksi(koleksiId);
  }

  async function konfirmasiHapusKoleksi() {
    const koleksiId = dialogHapusKoleksi;
    setDialogHapusKoleksi(null);
    if (!koleksiId) return;
    const kol = koleksiList.find((k) => k.id === koleksiId);
    const label = kol?.label || koleksiId;
    const ok = await hapusKoleksi(koleksiId);
    setKoleksiTerpilih((lama) => (lama === koleksiId ? "" : lama));
    await muatMetadata();
    await muatPartai();
    if (ok) tampilkanNotif(`Koleksi ${label} berhasil dihapus.`);
    else tampilkanNotif(`Gagal menghapus koleksi ${label}.`, "gagal");
  }

  function tanganiKosongkanSemua() {
    setDialogKosongkanSemua(true);
  }

  async function konfirmasiKosongkanSemua() {
    setDialogKosongkanSemua(false);
    const ok = await bersihkanBasisData();
    setKoleksiTerpilih("");
    await muatMetadata();
    await muatPartai();
    if (ok) tampilkanNotif("Seluruh basis data telah dikosongkan.");
    else tampilkanNotif("Gagal mengosongkan basis data.", "gagal");
  }

  function ubahUrut(kolom) {
    setUrut((lama) =>
      lama.kolom === kolom
        ? { kolom, arah: lama.arah === "asc" ? "desc" : "asc" }
        : { kolom, arah: kolom === "tanggal" ? "desc" : "asc" },
    );
  }

  /* ── Render ────────────────────────────────────────────────────── */

  const koleksiHapus = dialogHapusKoleksi
    ? koleksiList.find((k) => k.id === dialogHapusKoleksi)
    : null;



  return (
    <PanelLayar
      judul={
        mode === "tabel" ? (
          <span className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMode("data")}
              title={t("analisa.basisData.kembaliKeData")}
              aria-label={t("analisa.basisData.kembaliKeData")}
              className="flex h-8 shrink-0 cursor-pointer items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted px-1"
            >
              <Back className="h-6 w-10" />
            </button>
            <span className="min-w-0 truncate text-lg sm:text-2xl leading-6 sm:leading-8 font-extrabold text-foreground">
              {koleksi && koleksi.username
                ? `${koleksi.username} ${koleksi.platform === "chessCom" ? "Chess.com" : koleksi.platform === "lichessOrg" ? "Lichess.org" : koleksi.platform}`
                : koleksi?.label || t("analisa.basisData.judul")}
            </span>
          </span>
        ) : (
          t("analisa.basisData.judul")
        )
      }
      bawahJudul={
        mode === "data" ? (
          <div className={`flex flex-wrap items-center gap-2.5 text-xs text-foregroundGrey ${!stats || stats.totalPartai === 0 ? "invisible" : ""}`}>
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Database
                width={14}
                height={14}
                className="fill-foregroundHighlighted"
              />
              {t("analisa.basisData.jumlahPartai", {
                jumlah: stats?.totalPartai ?? 0,
              })}
            </span>
            <span className="text-border">/</span>
            <span className="flex items-center gap-1 text-winGreen font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-winGreen" />
              {stats?.putihMenang ?? 0} {t("analisa.basisData.menang")} Putih
            </span>
            <span className="flex items-center gap-1 text-lossRed font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-lossRed" />
              {stats?.hitamMenang ?? 0} {t("analisa.basisData.menang")} Hitam
            </span>
            <span className="flex items-center gap-1 text-foregroundGrey font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-foregroundGrey" />
              {stats?.seri ?? 0} {t("analisa.basisData.seri")}
            </span>
          </div>
        ) : null
      }
      headerKanan={
        <>
          {notifikasi ? (
            <Alert
              variasi={notifikasi.variasi}
              style={{
                borderColor:
                  notifikasi.variasi === "gagal"
                    ? "var(--analisa-lossRed)"
                    : notifikasi.variasi === "info"
                      ? "var(--analisa-foregroundGrey)"
                      : "var(--analisa-winGreen)",
              }}
              className="shrink-0 bg-transparent text-white text-[11px] leading-tight px-2 py-1 gap-x-1.5 [&>svg]:size-3 [&>svg]:translate-y-px rounded-sm"
            >
              {notifikasi.variasi === "gagal" ? (
                <AlertCircleIcon style={{ color: "var(--analisa-lossRed)" }} />
              ) : notifikasi.variasi === "info" ? (
                <InfoIcon style={{ color: "var(--analisa-foregroundGrey)" }} />
              ) : (
                <CheckCircle2Icon style={{ color: "var(--analisa-winGreen)" }} />
              )}
              <Alertjudul className="font-medium leading-tight">{notifikasi.pesan}</Alertjudul>
            </Alert>
          ) : null}
          {mode === "tabel" ? (
            <ToolbarTabel
              koleksiTerpilih={koleksiTerpilih}
              setKoleksiTerpilih={setKoleksiTerpilih}
              koleksiList={koleksiList}
              stats={stats}
              filterHasil={filterHasil}
              setFilterHasil={setFilterHasil}
              filterWaktu={filterWaktu}
              setFilterWaktu={setFilterWaktu}
            />
          ) : null}
          {mode === "data" ? (
            <button
              type="button"
              onClick={() => setMode("tabel")}
              className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3 py-1.5 text-xs font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover sm:ml-0"
            >
              <span>{t("analisa.basisData.explore")}</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-1 min-h-0 flex-col gap-3">
        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 lg:flex-row">
          <KolomKoleksi
            mode={mode}
            koleksiList={koleksiList}
            daftarKoleksi={daftarKoleksi}
            statMap={statMap}
            koleksiTerpilih={koleksiTerpilih}
            setKoleksiTerpilih={setKoleksiTerpilih}
            setMode={setMode}
            cariKoleksi={cariKoleksi}
            setCariKoleksi={setCariKoleksi}
            tanganiEksporPgn={tanganiEksporPgn}
            tanganiHapusKoleksi={tanganiHapusKoleksi}
            onBukaAkun={onBukaAkun}
          />

          {/* ── Kolom Kanan: Data / Tabel ─────────────────────────── */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
            {mode === "data" ? (
              <PanelRingkasanDatabase
                koleksi={koleksi}
                koleksiTerpilih={koleksiTerpilih}
                locale={locale}
                revisiRingkasan={revisiRingkasan}
                tanganiAnalisa={tanganiAnalisa}
                tanganiKosongkanSemua={tanganiKosongkanSemua}
                totalPartai={totalPartai}
              />
            ) : (
              <PanelTabelData
                tampilan={tampilan}
                setTampilan={setTampilan}
                cari={cari}
                setCari={setCari}
                daftarPartai={daftarPartai}
                memuat={memuat}
                locale={locale}
                koleksi={koleksi}
                tanganiAnalisa={tanganiAnalisa}
                urut={urut}
                ubahUrut={ubahUrut}
                onBukaAkun={onBukaAkun}
                filterHasil={filterHasil}
                filterWaktu={filterWaktu}
                totalHal={totalHal}
                aktifHal={aktifHal}
                setHal={setHal}
                totalPartai={totalPartai}
                daftarPemainTampil={daftarPemainTampil}
                memuatPemain={memuatPemain}
                daftarEventTampil={daftarEventTampil}
                memuatEvent={memuatEvent}
              />
            )}
</div>
      </div>
      </div>

      <DialogDatabase
        wadahDialog={wadahDialog}
        dialogEksporKosong={dialogEksporKosong}
        setDialogEksporKosong={setDialogEksporKosong}
        dialogHapusPartai={dialogHapusPartai}
        setDialogHapusPartai={setDialogHapusPartai}
        setTargetHapusPartai={setTargetHapusPartai}
        tanganiHapusPartai={tanganiHapusPartai}
        dialogHapusKoleksi={dialogHapusKoleksi}
        setDialogHapusKoleksi={setDialogHapusKoleksi}
        koleksiHapus={koleksiHapus}
        totalPartai={totalPartai}
        konfirmasiHapusKoleksi={konfirmasiHapusKoleksi}
        dialogKosongkanSemua={dialogKosongkanSemua}
        setDialogKosongkanSemua={setDialogKosongkanSemua}
        konfirmasiKosongkanSemua={konfirmasiKosongkanSemua}
      />
    </PanelLayar>
  );
}
