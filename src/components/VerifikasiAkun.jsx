import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n.jsx";
import {
  caraVerifikasi,
  mulaiLoginChess,
  mintaKodeProfil,
  periksaKodeProfil,
} from "../lib/chessAnggota.js";

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
}) {
  const { t } = useI18n();
  const [cara, setCara] = useState(null);
  const [tahap, setTahap] = useState("awal"); // awal | kode | memeriksa
  const [kode, setKode] = useState("");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);

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

  /* ------------------------------------------------------ sudah selesai */
  if (terverifikasi) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
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
    try {
      const { url } = await mulaiLoginChess(window.location.pathname);
      window.location.href = url;
    } catch (e) {
      setPesan(e.message);
      setSibuk(false);
    }
  };

  const mintaKode = async () => {
    if (!username?.trim()) {
      setPesan(t("verifikasi.isiUsernameDulu"));
      return;
    }
    setSibuk(true);
    setPesan("");
    try {
      const hasil = await mintaKodeProfil(username);
      setKode(hasil.kode);
      setTahap("kode");
    } catch (e) {
      setPesan(e.message);
    } finally {
      setSibuk(false);
    }
  };

  const periksa = async () => {
    setSibuk(true);
    setPesan("");
    setTahap("memeriksa");
    try {
      const hasil = await periksaKodeProfil(username);
      if (hasil.cocok && hasil.tiket) {
        onTerverifikasi({ username: hasil.username, tiket: hasil.tiket });
      } else {
        setPesan(hasil.pesan || t("verifikasi.belumTerbaca"));
        setTahap("kode");
      }
    } catch (e) {
      setPesan(e.message);
      setTahap("kode");
    } finally {
      setSibuk(false);
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

          {(tahap === "kode" || tahap === "memeriksa") && (
            <div className="flex flex-col gap-3">
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

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://www.chess.com/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary underline underline-offset-2"
                >
                  {t("verifikasi.bukaPengaturan")}
                </a>
                <button
                  type="button"
                  onClick={periksa}
                  disabled={sibuk}
                  className="rounded-full border border-solid border-primary px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
                >
                  {tahap === "memeriksa"
                    ? t("verifikasi.memeriksa")
                    : t("verifikasi.sudahPasang")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {pesan && (
        <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          {pesan}
        </p>
      )}
    </div>
  );
}
