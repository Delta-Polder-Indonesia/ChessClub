import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n.jsx";
import {
  caraVerifikasi,
  mulaiLoginChess,
  mintaKodeProfil,
  periksaKodeProfil,
} from "../lib/api/index.js";
import VerificationSpinner from "./VerificationSpinner.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog.jsx";

/**
 * Pembuktian kepemilikan akun Chess.com.
 *
 * Dua jalur:
 *  1. Login Chess.com (OAuth) — sekali klik, paling meyakinkan.
 *  2. Kode di profil — cadangan bila OAuth belum aktif di server.
 *
 * Setelah berhasil, komponen mengirim { username, tiket } ke induk melalui
 * `onTerverifikasi`; tiket itulah yang dilampirkan saat formulir dikirim.
 */
export default function VerifikasiAkun({
  username,
  terverifikasi,
  onTerverifikasi,
  onBatal,
  onLewati,
  statusAwal = "idle",
  pesanAwal = "",
}) {
  const { t } = useI18n();
  const [cara, setCara] = useState(null);
  const [tahap, setTahap] = useState("awal"); // awal | kode | memeriksa
  const [kode, setKode] = useState("");
  const [pesan, setPesan] = useState(pesanAwal);
  const [sibuk, setSibuk] = useState(false);
  const [bukaKosong, setBukaKosong] = useState(false);
  const [hasilVerifikasi, setHasilVerifikasi] = useState(null);
  const [statusSpinner, setStatusSpinner] = useState(statusAwal);

  useEffect(() => {
    let aktif = true;
    caraVerifikasi()
      .then((c) => aktif && setCara(c))
      .catch(() => aktif && setCara({ oauth: false, kodeProfil: true, mode: "opsional" }));
    return () => {
      aktif = false;
    };
  }, []);

  const wajib = cara?.mode === "wajib";
  const indikatorVerifikasi = (
    <VerificationSpinner
      status={statusSpinner}
      size={56}
      loadingText={t("verifikasi.memeriksa")}
      successText={t("verifikasi.berhasil")}
      errorText={t("verifikasi.belumTerbaca")}
    />
  );

  /* ------------------------------------------------------ sudah selesai */
  if (terverifikasi) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-300 bg-white px-4 py-3 text-sm text-emerald-900">
        <span aria-hidden="true" className="text-base leading-none">
          ✓
        </span>
        <p className="flex-1">
          {t("verifikasi.berhasil")}{" "}
          <strong className="font-semibold">{terverifikasi.username}</strong>
        </p>
        <button
          type="button"
          onClick={onBatal}
          className="text-xs font-semibold text-emerald-800 underline underline-offset-2"
        >
          {t("verifikasi.ganti")}
        </button>
      </div>
    );
  }

  /* ------------------------------------------------------------ aksi */

  const loginChess = async () => {
    setSibuk(true);
    setPesan("");
    setStatusSpinner("loading");
    try {
      const { url } = await mulaiLoginChess(window.location.pathname);
      window.location.href = url;
    } catch (e) {
      setPesan(e.message);
      setStatusSpinner("error");
      setSibuk(false);
    }
  };

  const mintaKode = async () => {
    if (!username?.trim()) {
      setBukaKosong(true);
      return;
    }
    setSibuk(true);
    setPesan("");
    setStatusSpinner("loading");
    try {
      const hasil = await mintaKodeProfil(username);
      setKode(hasil.kode);
      setStatusSpinner("idle");
      setTahap("kode");
    } catch (e) {
      setStatusSpinner("error");
      setPesan(e.message);
    } finally {
      setSibuk(false);
    }
  };

  const periksa = async () => {
    setSibuk(true);
    setPesan("");
    setTahap("memeriksa");
    setStatusSpinner("loading");
    try {
      const hasil = await periksaKodeProfil(username);
      if (hasil.cocok && hasil.tiket) {
        setStatusSpinner("success");
        setTahap("awal");
        setHasilVerifikasi({ username: hasil.username, tiket: hasil.tiket });
      } else {
        setStatusSpinner("error");
        setPesan(hasil.pesan || t("verifikasi.belumTerbaca"));
        setTahap("kode");
      }
    } catch (e) {
      setStatusSpinner("error");
      setPesan(e.message);
      setTahap("kode");
    } finally {
      setSibuk(false);
    }
  };

  const konfirmasiSukses = () => {
    if (hasilVerifikasi) {
      onTerverifikasi(hasilVerifikasi);
      setHasilVerifikasi(null);
    }
  };

  /* ----------------------------------------------------------- tampilan */

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-sm font-semibold text-slate-900">
        {t("verifikasi.judul")}
        {wajib && <span className="text-red-600"> *</span>}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        {t("verifikasi.penjelasan")}
      </p>

      {tahap === "awal" && !hasilVerifikasi && statusSpinner !== "idle" && (
        <div className="mt-4">{indikatorVerifikasi}</div>
      )}

      {/* Jalur 1: login Chess.com */}
      {cara?.oauth && (
        <div className="mt-4">
          <button
            type="button"
            onClick={loginChess}
            disabled={sibuk}
            className="rounded-full bg-[#81b64c] px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t("verifikasi.tombolLogin")}
          </button>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {t("verifikasi.catatanLogin")}
          </p>
        </div>
      )}

      {/* Jalur 2: kode di profil */}
      {cara?.kodeProfil && (
        <div className={cara?.oauth ? "mt-5 border-t border-slate-200 pt-4" : "mt-4"}>
          {cara?.oauth && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
              {t("verifikasi.atau")}
            </p>
          )}

          {tahap === "awal" && (
            <button
              type="button"
              onClick={mintaKode}
              disabled={sibuk}
              className="rounded-full border border-solid border-primary px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
            >
              {sibuk ? t("verifikasi.memproses") : t("verifikasi.tombolKode")}
            </button>
          )}
        </div>
      )}

      {!wajib && cara && onLewati && (
        <button
          type="button"
          onClick={onLewati}
          disabled={sibuk}
          className="mt-4 rounded-full border border-solid border-primary px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
        >
          {t("verifikasi.lanjut")}
        </button>
      )}

      {/* Dialog: langkah memasang kode */}
      <AlertDialog
        open={tahap === "kode" || tahap === "memeriksa"}
        onOpenChange={(terbuka) => {
          if (!terbuka) {
            setTahap("awal");
            setKode("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("verifikasi.tombolKode")}</AlertDialogTitle>
            <AlertDialogDescription>
              {(tahap === "memeriksa" || statusSpinner === "error") && (
                <div className="mb-4">{indikatorVerifikasi}</div>
              )}
              <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                <li>{t("verifikasi.langkah1")}</li>
                <li>
                  {t("verifikasi.langkah2")}{" "}
                  <code className="select-all rounded bg-white px-2 py-0.5 font-mono text-sm font-bold text-primary ring-1 ring-slate-300">
                    {kode}
                  </code>
                </li>
                <li>{t("verifikasi.langkah3")}</li>
              </ol>
              <a
                href="https://www.chess.com/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-semibold text-primary underline underline-offset-2"
              >
                {t("verifikasi.bukaPengaturan")}
              </a>
              {pesan && (
                <p className="mt-3 rounded border border-amber-300 bg-white px-3 py-2 text-xs leading-5 text-amber-900">
                  {pesan}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTahap("awal")} disabled={sibuk}>
              {t("verifikasi.batal")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={periksa} disabled={sibuk}>
              {tahap === "memeriksa"
                ? t("verifikasi.memeriksa")
                : t("verifikasi.sudahPasang")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: username kosong */}
      <AlertDialog open={bukaKosong} onOpenChange={setBukaKosong}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("verifikasi.judulKosong")}</AlertDialogTitle>
            <AlertDialogDescription>{t("verifikasi.isiUsernameDulu")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setBukaKosong(false)}>
              {t("verifikasi.mengerti")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: verifikasi berhasil */}
      <AlertDialog
        open={Boolean(hasilVerifikasi)}
        onOpenChange={(terbuka) => {
          if (!terbuka) setHasilVerifikasi(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("verifikasi.berhasil")}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mb-4">{indikatorVerifikasi}</div>
              {t("verifikasi.akunTerverifikasi")}{" "}
              <strong>{hasilVerifikasi?.username}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={konfirmasiSukses}>
              {t("verifikasi.lanjut")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(tahap !== "kode" && tahap !== "memeriksa" && pesan) && (
        <p className="mt-3 rounded border border-amber-300 bg-white px-3 py-2 text-xs leading-5 text-amber-900">
          {pesan}
        </p>
      )}
    </div>
  );
}
