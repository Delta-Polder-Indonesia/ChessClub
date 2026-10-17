/**
 * Verifikasi kepemilikan akun Chess.com — dipakai TampilanPendaftaran pada
 * alur Pendaftaran Anggota.
 *
 * Kontrak keamanan (mengapa komponennya begini):
 *  - Kode tantangan DIBUAT DAN DISIMPAN SERVER (`POST /api/auth/kode/minta`)
 *    dan terikat pada username. Browser tidak pernah menciptakannya.
 *  - Yang membuktikan kepemilikan adalah pemeriksaan OLEH SERVER terhadap
 *    profil publik Chess.com (`POST /api/auth/kode/periksa`). Bila cocok,
 *    server menerbitkan tiket sekali pakai yang terikat username.
 *  - Komponen ini TIDAK PUNYA jalur yang mengubah status menjadi
 *    "terverifikasi" karena pengguna mengetik ulang kode: blok manual kini
 *    menjadi PENGAJUAN (status "menunggu pemeriksaan pengurus") dan tidak
 *    menghasilkan tiket.
 *  - Login Chess.com (OAuth) ditampilkan bila server mengaktifkannya; itu
 *    jalur terkuat karena identitas berasal dari id_token yang diverifikasi
 *    server.
 *
 * Utilitas pendukung (pemainCatur.js, pendaftaran.js) tetap tinggal di
 * folder halaman PendaftaranAnggota — sengaja mandiri dari modul Analisa.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Info,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "./ui/button.jsx";
import {
  ajukanVerifikasiManual,
  mulaiLoginChessCom,
  mintaKodeVerifikasi,
  periksaKodeVerifikasi,
} from "../lib/api/anggota.js";
import { teksGalat } from "../lib/api/core.js";
import { periksaUsername } from "../lib/identitas.js";
import { URL_PENGATURAN_PROFIL } from "../halaman/PendaftaranAnggota/komponen/pendaftaran.js";
import { useI18n } from "../lib/i18n.jsx";

async function salinTeks(teks) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(teks);
      return true;
    }
  } catch {
    /* lanjut ke cara cadangan */
  }
  try {
    const el = document.createElement("textarea");
    el.value = teks;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const berhasil = document.execCommand("copy");
    document.body.removeChild(el);
    return berhasil;
  } catch {
    return false;
  }
}

/** Status tampilan — jangan disamakan dengan status keamanan. */
const IDLE = "idle";
const MEMBUAT = "membuat-kode";
const MEMERIKSA = "memeriksa";
const GAGAL = "gagal";
const KEDALUWARSA = "kedaluwarsa";
const SUKSES = "sukses";
const PENGAJUAN = "pengajuan";

export default function VerifikasiAkun({
  username,
  terverifikasi = false,
  verifikasi = null,
  onTerverifikasi,
  onPengajuan,
  onBatal,
  statusAwal = "idle",
  pesanAwal = "",
  cara = null,
}) {
  const { t } = useI18n();

  const LANGKAH = [
    {
      judul: t("verifikasi.langkahSalinJudul"),
      rincian: t("verifikasi.langkahSalinRincian"),
    },
    {
      judul: t("verifikasi.langkahTempelJudul"),
      rincian: t("verifikasi.langkahTempelRincian"),
    },
    {
      judul: t("verifikasi.langkahPeriksaJudul"),
      rincian: t("verifikasi.langkahPeriksaRincian"),
    },
  ];

  const [kode, setKode] = useState("");
  const [status, setStatus] = useState(IDLE);
  const [pesan, setPesan] = useState("");
  const [sudahDisalin, setSudahDisalin] = useState(false);
  const [percobaan, setPercobaan] = useState(0);
  const [modeManual, setModeManual] = useState(false);
  const [catatanManual, setCatatanManual] = useState("");
  const [mengirimPengajuan, setMengirimPengajuan] = useState(false);
  const [mengalihkan, setMengalihkan] = useState(false);

  /* Ref timer agar effect/mount berikutnya tidak pernah menghapus toast
     baru, dan agar tidak ada timer yang hidup setelah komponen dibongkar. */
  const timerSalin = useRef(null);
  const aktifRef = useRef(true);
  /* Nomor permintaan: hanya hasil permintaan TERAKHIR yang boleh dipakai,
     supaya permintaan lama tidak menimpa hasil baru. */
  const nomorReq = useRef(0);

  useEffect(() => {
    aktifRef.current = true;
    return () => {
      aktifRef.current = false;
      if (timerSalin.current) clearTimeout(timerSalin.current);
    };
  }, []);

  const terikat = periksaUsername(username).username;
  const usernameSah = periksaUsername(username).sah;

  /** Minta kode tantangan ke server (sekali per username yang berubah). */
  const mintaUlangKode = useCallback(
    async ({ paksa = false, sinyal } = {}) => {
      if (!usernameSah) {
        setKode("");
        setStatus(IDLE);
        return;
      }
      const nomor = ++nomorReq.current;
      setStatus(MEMBUAT);
      setPesan("");
      try {
        const hasil = await mintaKodeVerifikasi(terikat, { paksa, sinyal });
        if (!aktifRef.current || nomor !== nomorReq.current) return;
        if (typeof hasil?.kode !== "string" || !hasil.kode) {
          throw new Error(t("verifikasi.kodeTidakDiterbitkan"));
        }
        setKode(hasil.kode);
        setStatus(IDLE);
      } catch (galat) {
        if (!aktifRef.current || nomor !== nomorReq.current) return;
        if (galat?.name === "AbortError" || sinyal?.aborted) return;
        setKode("");
        setStatus(GAGAL);
        setPesan(teksGalat(galat, t, "verifikasi.galatMintaKode"));
      }
    },
    [terikat, usernameSah, t]
  );

  /* Kode diambil saat komponen dibuka dan setiap username (kanonik)
     berubah. Permintaan sebelumnya dibatalkan lewat AbortController.
     Bila status berisi pesan yang HARUS tampil lebih dulu (mis. sesi
     verifikasi kedaluwarsa saat pendaftaran ditolak server), jangan
     langsung menimpa pesan itu dengan permintaan kode otomatis: pesannya
     hilang sebelum pengguna sempat membacanya. Pengguna bisa meminta kode
     baru lewat tombol segarkan. */
  useEffect(() => {
    if (statusAwal === "error" || statusAwal === "kedaluwarsa") return undefined;
    const kendali = new AbortController();
    const jam = setTimeout(() => {
      mintaUlangKode({ sinyal: kendali.signal });
    }, 350);
    return () => {
      clearTimeout(jam);
      kendali.abort();
    };
  }, [mintaUlangKode, statusAwal]);

  useEffect(() => {
    if (statusAwal === "success") {
      setStatus(SUKSES);
      return;
    }
    if (statusAwal === "error") {
      setStatus(GAGAL);
      setPesan(pesanAwal || t("verifikasi.galatUmum"));
    } else if (statusAwal === "kedaluwarsa") {
      setStatus(KEDALUWARSA);
      setPesan(pesanAwal || t("verifikasi.tiketKedaluwarsa"));
    } else if (statusAwal === "pengajuan") {
      setStatus(PENGAJUAN);
    }
  }, [statusAwal, pesanAwal, t]);

  const berhasil = status === SUKSES || Boolean(verifikasi?.tiket) || terverifikasi;
  const sedangSibuk = status === MEMERIKSA || status === MEMBUAT;

  const handleSalin = async () => {
    const ok = await salinTeks(kode);
    if (ok) {
      if (timerSalin.current) clearTimeout(timerSalin.current);
      setSudahDisalin(true);
      timerSalin.current = setTimeout(() => {
        timerSalin.current = null;
        setSudahDisalin(false);
      }, 2200);
    }
  };

  const handlePeriksa = async () => {
    if (!usernameSah) {
      setStatus(GAGAL);
      setPesan(t("verifikasi.usernameKosong"));
      return;
    }
    const nomor = ++nomorReq.current;
    setStatus(MEMERIKSA);
    setPesan("");
    try {
      const hasil = await periksaKodeVerifikasi(terikat);
      if (!aktifRef.current || nomor !== nomorReq.current) return;

      if (hasil?.cocok && hasil.tiket) {
        setStatus(SUKSES);
        setPesan("");
        onTerverifikasi?.({
          username: hasil.username || terikat,
          tiket: hasil.tiket,
          cara: "kode-profil",
          berlakuDetik: Number(hasil.berlakuDetik) || 0,
        });
        return;
      }

      setStatus(GAGAL);
      setPercobaan((n) => n + 1);
      setPesan(hasil?.pesan || t("verifikasi.belumTerbacaProfil", { username: terikat }));
    } catch (galat) {
      if (!aktifRef.current || nomor !== nomorReq.current) return;
      /* Server yang tahu bahwa tantangannya sudah tidak ada: kedaluwarsa,
         percobaan habis, atau hilang karena instance lama pensiun (cold start
         tanpa penyimpanan bersama). Kode di layar tidak ada gunanya lagi, jadi
         minta kode baru dan suruh tempel ulang — bukan menyuruh pengguna
         menebak-nebak. Sebab dibaca dari `kode`, bukan dari angka status saja. */
      const sebab = galat?.kode;
      const perluKodeBaru =
        galat?.status === 410 ||
        sebab === "kode-kedaluwarsa" ||
        sebab === "tantangan-tidak-ada" ||
        sebab === "terlalu-banyak-percobaan";
      if (perluKodeBaru) {
        setStatus(KEDALUWARSA);
        setPesan(galat?.message || t("verifikasi.kodeKedaluwarsa"));
        mintaUlangKode({ paksa: true });
        return;
      }
      setStatus(GAGAL);
      setPercobaan((n) => n + 1);
      setPesan(teksGalat(galat, t, "verifikasi.galatMemeriksa"));
    }
  };

  /**
   * Jalur manual = PENGAJUAN. Statusnya "menunggu", tidak ada tiket, dan
   * tidak ada kata "terverifikasi" di jalur ini.
   */
  const handlePengajuanManual = async (e) => {
    e.preventDefault();
    if (!usernameSah) {
      setStatus(GAGAL);
      setPesan(t("verifikasi.usernameKosong"));
      return;
    }
    setMengirimPengajuan(true);
    setPesan("");
    try {
      const hasil = await ajukanVerifikasiManual(terikat, catatanManual);
      if (!aktifRef.current) return;
      setStatus(PENGAJUAN);
      onPengajuan?.({
        username: hasil?.username || terikat,
        status: "menunggu",
        id: hasil?.id || null,
      });
    } catch (galat) {
      if (!aktifRef.current) return;
      setStatus(GAGAL);
      setPesan(teksGalat(galat, t, "verifikasi.galatPengajuan"));
    } finally {
      if (aktifRef.current) setMengirimPengajuan(false);
    }
  };

  const handleMasukChessCom = async () => {
    setMengalihkan(true);
    setPesan("");
    try {
      const { url } = await mulaiLoginChessCom("/pendaftaran-anggota");
      if (!aktifRef.current) return;
      window.location.assign(url);
    } catch (galat) {
      if (!aktifRef.current) return;
      setMengalihkan(false);
      setPesan(teksGalat(galat, t, "verifikasi.galatOAuth"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-grey-50 p-4 sm:p-5 space-y-4">
        {/* Kode verifikasi */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-grey-600">
            {t("verifikasi.kodeAnda")}
          </p>
          <div className="mt-2 flex items-stretch gap-2">
            <code className="flex-1 min-w-0 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 font-mono text-base sm:text-lg font-bold tracking-[0.14em] text-grey-800 select-text">
              {status === MEMBUAT && !kode ? (
                <span className="inline-flex items-center gap-2 text-sm font-sans tracking-normal text-grey-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  {t("verifikasi.membuatKode")}
                </span>
              ) : (
                kode || t("verifikasi.kodeBelumTersedia")
              )}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSalin}
              disabled={!kode}
              aria-label={t("verifikasi.salinKodeVerifikasi")}
              title={t("verifikasi.salinKode")}
            >
              {sudahDisalin ? (
                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setPesan("");
                setPercobaan(0);
                mintaUlangKode({ paksa: true });
              }}
              disabled={status === MEMBUAT}
              aria-label={t("verifikasi.buatKodeBaru")}
              title={t("verifikasi.buatKodeBaru")}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Langkah */}
        <ol className="space-y-2.5">
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-xs leading-relaxed text-grey-600">
                <span className="font-semibold text-grey-800">{l.judul}</span>{" "}
                {l.rincian}
              </span>
            </li>
          ))}
        </ol>

        <a
          href={URL_PENGATURAN_PROFIL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
        >
          {t("verifikasi.bukaPengaturanProfil")}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>

        {/* Status */}
        {(status === MEMBUAT || status === MEMERIKSA) && (
          <p className="flex items-center gap-2 text-xs font-medium text-[#0B2F9F]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            {status === MEMERIKSA
              ? t("verifikasi.menghubungi", { username: terikat })
              : t("verifikasi.membuatKode")}
          </p>
        )}

        {status === SUKSES && (
          <p className="flex items-start gap-2 rounded bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            {t("verifikasi.profilTerverifikasi")}
          </p>
        )}

        {status === PENGAJUAN && (
          <p className="flex items-start gap-2 rounded bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900">
            <Info className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            <span>{t("verifikasi.pengajuanTerkirim")}</span>
          </p>
        )}

        {(status === GAGAL || status === KEDALUWARSA) && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded bg-red-50 px-3 py-2.5 text-xs text-red-700"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            <span className="leading-relaxed">
              {pesan}
              {percobaan >= 2 && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={() => setModeManual(true)}
                    className="font-semibold text-red-800 underline"
                  >
                    {t("verifikasi.ajukanManualGunakan")}
                  </button>
                </>
              )}
            </span>
          </div>
        )}

        {/* Aksi */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          {cara?.oauth && (
            <Button
              variant="secondary"
              onClick={handleMasukChessCom}
              loading={mengalihkan}
            >
              {t("verifikasi.masukChessCom")}
            </Button>
          )}
          {onBatal && (
            <Button variant="ghost" onClick={onBatal}>
              {t("pendaftaran.gantiAkun")}
            </Button>
          )}
          <Button
            onClick={handlePeriksa}
            loading={status === MEMERIKSA}
            disabled={berhasil || sedangSibuk}
          >
            {status === MEMERIKSA
              ? t("verifikasi.sedangMemeriksa")
              : t("verifikasi.periksaKode")}
          </Button>
        </div>
      </div>

      {/* Pengajuan manual (bukan verifikasi otomatis) */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
        <button
          type="button"
          onClick={() => setModeManual((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={modeManual}
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-grey-800">
            <KeyRound className="h-4 w-4 text-grey-600" aria-hidden="true" />
            {t("verifikasi.ajukanManualToggle")}
          </span>
          <span className="text-xs font-medium text-grey-600">
            {modeManual ? t("verifikasi.tutup") : t("verifikasi.buka")}
          </span>
        </button>

        {modeManual && (
          <form onSubmit={handlePengajuanManual} className="space-y-3 pt-1">
            <p className="text-xs leading-relaxed text-grey-600">
              {t("verifikasi.ajukanManualKeterangan")}
            </p>
            <label className="block">
              <span className="text-xs font-medium text-grey-600">
                {t("verifikasi.catatanPengajuan")}
              </span>
              <textarea
                value={catatanManual}
                onChange={(e) => setCatatanManual(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={t("verifikasi.phCatatanPengajuan")}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-grey-800 focus:border-[#0B2F9F] focus:outline-none focus:ring-1 focus:ring-[#0B2F9F]"
              />
            </label>
            <div className="flex items-center justify-end gap-3">
              <Button type="submit" variant="secondary" loading={mengirimPengajuan}>
                {t("verifikasi.kirimPengajuan")}
              </Button>
            </div>
          </form>
        )}

        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-grey-600">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
          {t("verifikasi.catatanPrivasi")}
        </p>
      </div>
    </div>
  );
}
