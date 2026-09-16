import { CircleUser, ExternalLink, Info, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { useProfilPemain, formatAngka, benderaNegara } from "./komponen/pemainCatur.js";
import { URL_KLUB } from "./komponen/pendaftaran.js";
import VerificationSpinner from "../../components/VerificationSpinner.jsx";
import VerifikasiAkun from "../../components/VerifikasiAkun.jsx";
import { Button } from "../../components/ui/button.jsx";

/**
 * Tampilan mirip alur masuk Google (tema terang, dua kolom responsif,
 * alur akun/username & verifikasi) dengan hirarki teks dan tombol yang konsisten.
 * Port mandiri dari contoh chess-community-ui-component.
 */

function WordmarkKomunitas({ gelap = false }) {
  const { t } = useI18n();
  return (
    <span className="flex flex-col leading-none">
      <span
        className={`font-extrabold tracking-wide text-base md:text-lg ${
          gelap ? "text-slate-900" : "text-gray-900"
        }`}
      >
        KOMUNITAS CATUR
      </span>
      <span
        className={`font-semibold tracking-[0.25em] text-[10px] md:text-xs mt-1 ${
          gelap ? "text-slate-500" : "text-gray-600"
        }`}
      >
        {t("pendaftaran.brandLine2")}
      </span>
    </span>
  );
}

function MarkKomunitas({ kecil = false }) {
  const px = kecil ? 44 : 56;
  return (
    <div className="select-none mb-6">
      <div className="flex items-center gap-3">
        <img
          src="/favicon-64.png"
          alt="Logo Komunitas"
          width={px}
          height={px}
          draggable="false"
          className="flex-none object-contain rounded-xl"
        />
        <WordmarkKomunitas />
      </div>
      <div className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
        Blunder <span className="text-[#81b64c]">Skuad</span>
      </div>
    </div>
  );
}

const HARI_INI = new Date().toISOString().slice(0, 10);

/**
 * Status verifikasi yang dipahami tampilan ini. Nilainya berasal dari orang
 * tua (PendaftaranAnggota) dan HANYA menggambarkan apa yang dikatakan server:
 *   "sukses"     -> tiket verifikasi diterbitkan server;
 *   "pengajuan"  -> pengajuan manual dikirim, menunggu pemeriksaan pengurus;
 *   "gagal"      -> pemeriksaan terakhir gagal;
 *   "kedaluwarsa"-> tiket tidak berlaku lagi (kedaluwarsa/terpakai/username
 *                   berbeda) — pengguna harus memverifikasi ulang.
 */
export default function TampilanPendaftaran({
  form,
  status,
  pesan,
  verifikasi,
  statusVerifikasi = "idle",
  cara = null,
  teksSetuju,
  onUbah,
  onTerverifikasi,
  onPengajuan,
  onBatalVerifikasi,
  onUlangiVerifikasi,
  onKirim,
  onReset,
  validasiLokal,
  children,
}) {
  const { t, bahasa } = useI18n();
  const [step, setStep] = useState(verifikasi ? "success" : "akun");

  /* Satu isian per langkah pada bagian Data Diri (1 → 2 → 3 → 4). */
  const LANGKAH_DATADIRI = [
    {
      kunci: "namaLengkap",
      label: t("pendaftaran.labelNama"),
      judul: t("pendaftaran.judulNama"),
      deskripsi: t("pendaftaran.catatanNama"),
      tipe: "text",
      placeholder: t("pendaftaran.phNama"),
    },
    {
      kunci: "panggilan",
      label: t("pendaftaran.labelPanggilan"),
      judul: t("pendaftaran.judulPanggilan"),
      deskripsi: t("pendaftaran.catatanPanggilan"),
      tipe: "text",
      placeholder: t("pendaftaran.phPanggilan"),
    },
    {
      kunci: "tanggalLahir",
      label: t("pendaftaran.labelLahir"),
      judul: t("pendaftaran.labelLahir"),
      deskripsi: t("pendaftaran.catatanLahir"),
      tipe: "date",
    },
    {
      kunci: "kota",
      label: t("pendaftaran.labelKota"),
      judul: t("pendaftaran.judulKota"),
      deskripsi: t("pendaftaran.catatanKota"),
      tipe: "text",
      placeholder: t("pendaftaran.phKota"),
    },
  ];

  /* Satu isian per langkah pada bagian Kontak & Pembayaran (1 → 2 → 3 → 4).
     Langkah dengan `opsional: true` menyediakan tombol "Lewati". */
  const LANGKAH_KONTAK = [
    {
      kunci: "hp",
      label: t("pendaftaran.labelHp"),
      judul: t("pendaftaran.labelHp"),
      deskripsi: t("pendaftaran.catatanHp"),
      tipe: "tel",
      placeholder: t("pendaftaran.phHp"),
      opsional: false,
    },
    {
      kunci: "dana",
      label: t("pendaftaran.labelDana"),
      judul: t("pendaftaran.labelDana"),
      deskripsi: t("pendaftaran.catatanDana"),
      tipe: "tel",
      placeholder: t("pendaftaran.phDana"),
      opsional: true,
    },
    {
      kunci: "email",
      label: t("pendaftaran.labelEmail"),
      judul: t("pendaftaran.judulEmail"),
      deskripsi: t("pendaftaran.catatanEmail"),
      tipe: "email",
      placeholder: t("pendaftaran.phEmail"),
      opsional: true,
    },
    {
      kunci: "klub",
      label: t("pendaftaran.labelKlub"),
      judul: t("pendaftaran.labelKlub"),
      deskripsi: t("pendaftaran.catatanKlub"),
      tipe: "text",
      placeholder: t("pendaftaran.phKlub"),
      opsional: true,
    },
  ];

  /* Username ditebalkan di tengah kalimat, jadi templat i18n dipecah pada
     placeholder {username} agar markup <span> bergaya tetap dipertahankan. */
  const [akunSiapAwal, akunSiapAkhir] = t("pendaftaran.akunSiap").split("{username}");
  const [finalSuksesAwal, finalSuksesAkhir] = t("pendaftaran.finalSukses").split("{username}");

  const [usernameError, setUsernameError] = useState("");
  const username = form.username;
  const setUsername = (nilai) => onUbah("username", nilai);
  const {
    kartu: kartuPemain,
    memuat: memuatProfil,
    galat: galatProfil,
  } = useProfilPemain(username, Boolean(username), "chessCom");

  /* Toast menyimpan KUNCI terjemahan, bukan kalimat jadi: kalimat yang
     disimpan saat klik akan tetap berbahasa lama setelah pengguna berganti
     bahasa (kamus EN dimuat malas). */
  const [toastKey, setToastKey] = useState("");
  /* Satu timer untuk satu toast. Tanpa ini, timer dari toast lama akan
     mengosongkan toast baru yang sedang tampil (bug "toast hilang tiba-tiba"). */
  const timerToast = useRef(null);

  useEffect(
    () => () => {
      if (timerToast.current) clearTimeout(timerToast.current);
      timerToast.current = null;
    },
    []
  );

  const dataDiri = form;
  const setDataDiri = (pembaruan) => {
    const hasil = typeof pembaruan === "function" ? pembaruan(form) : pembaruan;
    Object.entries(hasil).forEach(([kunci, nilai]) => {
      if (form[kunci] !== nilai) onUbah(kunci, nilai);
    });
  };
  const [diriStep, setDiriStep] = useState(0);
  const [diriError, setDiriError] = useState("");

  const finalStatus = status === "mengirim"
    ? "loading"
    : status === "sukses"
      ? "success"
      : status === "gagal"
        ? "error"
        : "idle";
  const finalPesan = pesan;

  const kontak = form;
  const setKontak = (pembaruan) => {
    const hasil = typeof pembaruan === "function" ? pembaruan(form) : pembaruan;
    Object.entries(hasil).forEach(([kunci, nilai]) => {
      if (form[kunci] !== nilai) onUbah(kunci, nilai);
    });
  };
  const [kontakStep, setKontakStep] = useState(0);
  const [kontakError, setKontakError] = useState("");

  useEffect(() => {
    if (verifikasi) setStep("success");
    else if (statusVerifikasi === "pengajuan") setStep("pengajuan");
    else if (statusVerifikasi === "error" || statusVerifikasi === "kedaluwarsa")
      setStep("password");
  }, [verifikasi, statusVerifikasi]);

  const showToast = (kunci) => {
    if (timerToast.current) clearTimeout(timerToast.current);
    setToastKey(kunci);
    timerToast.current = setTimeout(() => {
      timerToast.current = null;
      setToastKey("");
    }, 3500);
  };

  /* Ringkasan status verifikasi untuk langkah terakhir — jujur terhadap apa
     yang sebenarnya tercatat di server. */
  const statusVerifikasiTeks = verifikasi?.tiket
    ? t("pendaftaran.verifStatusBerhasil")
    : statusVerifikasi === "pengajuan"
      ? t("pendaftaran.verifStatusMenunggu")
      : t("pendaftaran.verifStatusBelum");

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    const galat = validasiLokal({ ...form, setuju: true });
    if (galat.username) {
      setUsernameError(galat.username);
      return;
    }
    setUsernameError("");
    setStep("password");
  };

  const handleDiriSubmit = (e) => {
    e.preventDefault();
    const langkah = LANGKAH_DATADIRI[diriStep];
    const galat = validasiLokal({ ...form, setuju: true });
    if (galat[langkah.kunci]) {
      setDiriError(galat[langkah.kunci]);
      return;
    }
    setDiriError("");
    if (diriStep < LANGKAH_DATADIRI.length - 1) {
      setDiriStep((s) => s + 1);
    } else {
      setStep("kontak");
      showToast("pendaftaran.toastDiriSelesai");
    }
  };

  const handleKontakSubmit = (e) => {
    e.preventDefault();
    const langkah = LANGKAH_KONTAK[kontakStep];
    const galat = validasiLokal({ ...form, setuju: true });
    if (galat[langkah.kunci]) {
      setKontakError(galat[langkah.kunci]);
      return;
    }
    setKontakError("");
    if (kontakStep < LANGKAH_KONTAK.length - 1) {
      setKontakStep((s) => s + 1);
    } else {
      setStep("final");
      showToast("pendaftaran.toastKontakSelesai");
    }
  };

  const handleLewatiKontak = () => {
    const langkah = LANGKAH_KONTAK[kontakStep];
    setKontak((k) => ({ ...k, [langkah.kunci]: "" }));
    setKontakError("");
    if (kontakStep < LANGKAH_KONTAK.length - 1) {
      setKontakStep((s) => s + 1);
    } else {
      setStep("final");
      showToast("pendaftaran.toastKontakSelesai");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col justify-between items-center p-4 sm:p-6 lg:p-10 select-none relative">
      {toastKey && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl border border-gray-700 shadow-xl flex items-center gap-3 animate-fade-in">
          <Info className="h-4 w-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
          <span>{t(toastKey)}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="w-full max-w-4xl my-auto z-10">
        <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-md border border-gray-200 min-h-[440px] flex flex-col justify-between transition-all duration-300">
          {step === "akun" && (
            <form onSubmit={handleUsernameSubmit} className="w-full h-full flex flex-col justify-between">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Kolom Kiri: Header & Branding */}
                <div className="lg:col-span-6 flex flex-col space-y-3">
                  <MarkKomunitas />
                  <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 tracking-tight leading-tight">
                    {t("pendaftaran.judul")}
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t("pendaftaran.subjudulAkun")}
                  </p>
                </div>

                {/* Kolom Kanan: Form Input & Tindakan */}
                <div className="lg:col-span-6 flex flex-col space-y-5 pt-2 lg:pt-0">
                  <div className="relative mt-1">
                    <input
                      type="text"
                      id="usernameInput"
                      name="username"
                      value={username}
                      aria-invalid={usernameError ? "true" : undefined}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (usernameError) setUsernameError("");
                      }}
                      className="peer w-full h-14 px-4 rounded-lg border border-gray-300 bg-transparent text-sm sm:text-base text-gray-900 placeholder-transparent focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all"
                      placeholder={t("pendaftaran.phUsername")}
                    />
                    {/* Gaya label memotong garis persis seperti Google */}
                    <label htmlFor="usernameInput" className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-gray-700">
                      {t("pendaftaran.labelUsernameAkun")}
                    </label>
                  </div>

                  {usernameError && (
                    <div role="alert" className="text-xs text-red-600 flex items-center gap-1.5 -mt-2">
                      <Info className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                      <span>{usernameError}</span>
                    </div>
                  )}

                  {/* Hasil verifikasi yang gagal sebelumnya (OAuth rusak/kedaluwarsa)
                      tetap terlihat di langkah pertama, tidak hilang saat kembali. */}
                  {!usernameError && status === "gagal" && pesan && (
                    <div role="alert" className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700 -mt-2">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
                      <span>{pesan}</span>
                    </div>
                  )}

                  {/* Status pencarian profil */}
                  {!usernameError && memuatProfil && !kartuPemain && (
                    <p className="flex items-center gap-2 text-xs text-gray-500 -mt-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      {t("pendaftaran.mencariProfil")}
                    </p>
                  )}

                  {!usernameError && !memuatProfil && !kartuPemain && galatProfil && (
                    <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 -mt-2">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
                      <span>
                        {galatProfil}{" "}{t("pendaftaran.profilGagalLanjut")}
                      </span>
                    </p>
                  )}

                  {/* Pratinjau profil publik Chess.com */}
                  {!usernameError && kartuPemain && (
                    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 -mt-1">
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
                        {kartuPemain.avatar ? (
                          <img
                            className="h-full w-full object-cover"
                            src={kartuPemain.avatar}
                            alt=""
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <CircleUser className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {kartuPemain.nama}
                          {kartuPemain.gelar && (
                            <span className="ml-1 text-xs font-bold text-[#81b64c]">
                              {kartuPemain.gelar}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {kartuPemain.username}
                          {benderaNegara(kartuPemain.negara) && (
                            <span className="ml-1">{benderaNegara(kartuPemain.negara)}</span>
                          )}{" "}
                          · {formatAngka(kartuPemain.followers, bahasa)} {t("pendaftaran.pengikut")}
                        </span>
                      </span>
                      <a
                        href={kartuPemain.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-none items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                      >
                        {t("pendaftaran.profil")}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-gray-600 leading-normal">
                    {t("pendaftaran.catatanRoster")}{" "}
                    <button
                      type="button"
                      onClick={() => window.open(URL_KLUB, "_blank", "noopener,noreferrer")}
                      className="text-blue-600 hover:underline font-medium inline-block mt-1"
                    >
                      {t("pendaftaran.bukaKlub")}
                    </button>
                  </p>

                  <div className="flex items-center justify-end pt-6">
                    <Button type="submit">
                      {t("pendaftaran.berikutnya")}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {step === "password" && (
            <div className="w-full h-full flex flex-col justify-between">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Kolom Kiri: Informasi Verifikasi */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                  <MarkKomunitas kecil />
                  <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 tracking-tight leading-tight">
                    {t("pendaftaran.verifJudul")}
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t("pendaftaran.verifDeskripsi")}
                  </p>

                  {/* Badge User — avatar + nama dari Chess.com, tanpa pembungkus */}
                  <div className="inline-flex items-center gap-2.5 text-sm sm:text-base text-gray-800">
                    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full">
                      {kartuPemain?.avatar ? (
                        <img
                          className="h-full w-full object-cover"
                          src={kartuPemain.avatar}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <CircleUser className="h-5 w-5 text-gray-500" aria-hidden="true" />
                      )}
                    </span>
                    <span className="font-medium truncate max-w-[200px]">
                      {kartuPemain?.name || username}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep("akun")}
                      className="ml-1 text-xs text-blue-600 hover:underline font-semibold"
                    >
                      {t("pendaftaran.ubah")}
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed text-gray-500">
                    {t("pendaftaran.verifTanpaSandi")}
                  </p>
                </div>

                {/* Kolom Kanan: Instruksi Kode & Tombol Aksi */}
                <div className="lg:col-span-6 flex flex-col space-y-5 pt-2 lg:pt-0">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {t("pendaftaran.verifLewatKode")}
                  </h2>
                  <VerifikasiAkun
                    username={username}
                    terverifikasi={Boolean(verifikasi?.tiket)}
                    verifikasi={verifikasi}
                    onTerverifikasi={onTerverifikasi}
                    onPengajuan={onPengajuan}
                    cara={cara}
                    onBatal={() => {
                      setStep("akun");
                      onBatalVerifikasi();
                    }}
                    statusAwal={statusVerifikasi}
                    pesanAwal={
                      statusVerifikasi === "error" ||
                      statusVerifikasi === "kedaluwarsa"
                        ? pesan
                        : ""
                    }
                  />

                  {/* Mode `opsional`/`off`: verifikasi boleh dilewati, tetapi
                      tanpa tiket pendaftaran TIDAK akan berstatus terverifikasi. */}
                  {!verifikasi && !cara?.wajib && (
                    <p className="flex flex-wrap items-center justify-between gap-2 text-[11px] leading-relaxed text-gray-500">
                      <span>{t("pendaftaran.verifOpsionalCatatan")}</span>
                      <button
                        type="button"
                        onClick={() => setStep("data-diri")}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {t("pendaftaran.lewatiVerifikasi")}
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP SUCCESS — hanya muncul bila SERVER menerbitkan tiket. */}
          {step === "success" && verifikasi?.tiket && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center py-8 space-y-5">
              <VerificationSpinner
                status="success"
                size={72}
                successText={t("pendaftaran.verifBerhasil")}
              />
              <h2 className="text-2xl sm:text-3xl font-normal text-gray-900 tracking-tight">
                {t("pendaftaran.verifBerhasil")}
              </h2>
              <p className="text-gray-600 max-w-md text-sm sm:text-base leading-relaxed">
                {akunSiapAwal}
                <span className="text-[#0B2F9F] font-semibold">
                  {username}
                </span>
                {akunSiapAkhir}
              </p>
              {verifikasi.berlakuDetik ? (
                <p className="text-[11px] text-gray-500">
                  {t("pendaftaran.verifTiketBerlaku", {
                    menit: Math.max(1, Math.round(verifikasi.berlakuDetik / 60)),
                  })}
                </p>
              ) : null}
              <div className="flex w-full items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("akun");
                    onBatalVerifikasi();
                    setUsername("");
                  }}
                >
                  {t("pendaftaran.gantiAkun")}
                </Button>
                <Button onClick={() => setStep("data-diri")}>
                  {t("pendaftaran.lanjutkanPendaftaran")}
                </Button>
              </div>
            </div>
          )}

          {/* STEP PENGAJUAN — status menunggu, BUKAN terverifikasi. */}
          {step === "pengajuan" && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center py-8 space-y-5">
              <VerificationSpinner
                status="idle"
                size={72}
                idleText={t("pendaftaran.verifStatusMenunggu")}
              />
              <h2 className="text-2xl sm:text-3xl font-normal text-gray-900 tracking-tight">
                {t("pendaftaran.pengajuanDiterima")}
              </h2>
              <p className="text-gray-600 max-w-md text-sm sm:text-base leading-relaxed">
                {t("pendaftaran.pengajuanPenjelasan", { username })}
              </p>
              <div className="flex w-full items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("akun");
                    onBatalVerifikasi();
                  }}
                >
                  {t("pendaftaran.kembali")}
                </Button>
                {!cara?.wajib && (
                  <Button onClick={() => setStep("data-diri")}>
                    {t("pendaftaran.lanjutkanTanpaVerifikasi")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* STEP DATA DIRI */}
          {step === "data-diri" && (
            <form
              onSubmit={handleDiriSubmit}
              className="w-full h-full flex flex-col justify-between"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Kolom Kiri: Informasi Data Diri */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                  <MarkKomunitas kecil />
                  <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 tracking-tight leading-tight">
                    {t("pendaftaran.judulDataDiri")}
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t("pendaftaran.deskDataDiri")}
                  </p>

                  <div className="flex items-center gap-2.5">
                    {LANGKAH_DATADIRI.map((l, i) => (
                      <span
                        key={l.kunci}
                        className={`w-2.5 h-2.5 rounded-full transition ${
                          i <= diriStep
                            ? "bg-[#0B2F9F]"
                            : "bg-gray-200"
                        }`}
                      ></span>
                    ))}
                    <span className="ml-1 text-xs text-gray-500">
                      {t("pendaftaran.langkahDari", { n: diriStep + 1, total: LANGKAH_DATADIRI.length })}
                    </span>
                  </div>
                </div>

                {/* Kolom Kanan: Satu Isian Aktif */}
                <div className="lg:col-span-6 flex flex-col space-y-5 pt-2 lg:pt-0">
                  <h2 className="text-xl font-normal text-gray-900 tracking-tight">
                    {LANGKAH_DATADIRI[diriStep].judul}
                  </h2>
                  <p className="-mt-3 text-xs text-gray-500 leading-normal">
                    {LANGKAH_DATADIRI[diriStep].deskripsi}
                  </p>

                  <div className="relative mt-2">
                    <input
                      type={LANGKAH_DATADIRI[diriStep].tipe}
                      id={`pendaftaran-${LANGKAH_DATADIRI[diriStep].kunci}`}
                      name={LANGKAH_DATADIRI[diriStep].kunci}
                      value={dataDiri[LANGKAH_DATADIRI[diriStep].kunci]}
                      onChange={(e) => {
                        setDataDiri((d) => ({
                          ...d,
                          [LANGKAH_DATADIRI[diriStep].kunci]: e.target.value,
                        }));
                        if (diriError) setDiriError("");
                      }}
                      max={LANGKAH_DATADIRI[diriStep].tipe === "date" ? HARI_INI : undefined}
                      className="peer w-full h-14 px-4 rounded-lg border border-gray-300 bg-transparent text-sm sm:text-base text-gray-900 placeholder-transparent focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                      placeholder={LANGKAH_DATADIRI[diriStep].placeholder}
                    />
                    {/* Gaya label memotong garis */}
                    <label htmlFor={`pendaftaran-${LANGKAH_DATADIRI[diriStep].kunci}`} className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600">
                      {LANGKAH_DATADIRI[diriStep].label} *
                    </label>
                  </div>

                  {diriError && (
                    <div className="text-xs text-red-600 flex items-center gap-1.5 -mt-2">
                      <Info className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                      <span>{diriError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-6 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (diriStep === 0) {
                          setStep("success");
                        } else {
                          setDiriStep((s) => s - 1);
                        }
                      }}
                    >
                      {t("pendaftaran.kembali")}
                    </Button>
                    <Button type="submit">
                      {diriStep < LANGKAH_DATADIRI.length - 1
                        ? t("pendaftaran.berikutnya")
                        : t("pendaftaran.lanjutkan")}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* STEP KONTAK & PEMBAYARAN */}
          {step === "kontak" && (
            <form
              onSubmit={handleKontakSubmit}
              className="w-full h-full flex flex-col justify-between"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Kolom Kiri: Informasi Kontak */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                  <MarkKomunitas kecil />
                  <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 tracking-tight leading-tight">
                    {t("pendaftaran.judulKontak")}
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t("pendaftaran.deskKontak")}
                  </p>

                  <div className="flex items-center gap-2.5">
                    {LANGKAH_KONTAK.map((l, i) => (
                      <span
                        key={l.kunci}
                        className={`w-2.5 h-2.5 rounded-full transition ${
                          i <= kontakStep ? "bg-[#0B2F9F]" : "bg-gray-200"
                        }`}
                      ></span>
                    ))}
                    <span className="ml-1 text-xs text-gray-500">
                      {t("pendaftaran.langkahDari", { n: kontakStep + 1, total: LANGKAH_KONTAK.length })}
                    </span>
                  </div>
                </div>

                {/* Kolom Kanan: Satu Isian Aktif */}
                <div className="lg:col-span-6 flex flex-col space-y-5 pt-2 lg:pt-0">
                  <h2 className="text-xl font-normal text-gray-900 tracking-tight">
                    {LANGKAH_KONTAK[kontakStep].judul}
                  </h2>
                  <p className="-mt-3 text-xs text-gray-500 leading-normal">
                    {LANGKAH_KONTAK[kontakStep].deskripsi}{" "}
                    {LANGKAH_KONTAK[kontakStep].opsional && t("pendaftaran.opsional")}
                  </p>

                  <div className="relative mt-2">
                    <input
                      type={LANGKAH_KONTAK[kontakStep].tipe}
                      id={`pendaftaran-${LANGKAH_KONTAK[kontakStep].kunci}`}
                      name={LANGKAH_KONTAK[kontakStep].kunci}
                      value={kontak[LANGKAH_KONTAK[kontakStep].kunci]}
                      onChange={(e) => {
                        setKontak((k) => ({
                          ...k,
                          [LANGKAH_KONTAK[kontakStep].kunci]: e.target.value,
                        }));
                        if (kontakError) setKontakError("");
                      }}
                      className="peer w-full h-14 px-4 rounded-lg border border-gray-300 bg-transparent text-sm sm:text-base text-gray-900 placeholder-transparent focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                      placeholder={LANGKAH_KONTAK[kontakStep].placeholder}
                    />
                    {/* Gaya label memotong garis */}
                    <label htmlFor={`pendaftaran-${LANGKAH_KONTAK[kontakStep].kunci}`} className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600">
                      {LANGKAH_KONTAK[kontakStep].label}{" "}
                      {LANGKAH_KONTAK[kontakStep].opsional ? t("pendaftaran.opsional") : "*"}
                    </label>
                  </div>

                  {kontakError && (
                    <div className="text-xs text-red-600 flex items-center gap-1.5 -mt-2">
                      <Info
                        className="h-3.5 w-3.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{kontakError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-6 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (kontakStep === 0) {
                          setStep("data-diri");
                        } else {
                          setKontakStep((s) => s - 1);
                        }
                      }}
                    >
                      {t("pendaftaran.kembali")}
                    </Button>
                    {LANGKAH_KONTAK[kontakStep].opsional && (
                      <Button variant="outline" onClick={handleLewatiKontak}>
                        {t("pendaftaran.lewati")}
                      </Button>
                    )}
                    <Button type="submit">
                      {kontakStep < LANGKAH_KONTAK.length - 1
                        ? t("pendaftaran.berikutnya")
                        : t("pendaftaran.selesai")}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* STEP FINAL: Kirim Pendaftaran */}
          {step === "final" && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center py-8 space-y-6">
              <VerificationSpinner
                status={finalStatus}
                size={72}
                loadingText={t("pendaftaran.mendaftarkan")}
                successText={t("pendaftaran.pendaftaranBerhasil")}
                errorText={t("pendaftaran.pendaftaranGagal")}
              />
              {finalStatus !== "loading" && finalStatus !== "success" && (
                <label className="flex max-w-md items-start gap-3 text-left text-sm leading-6 text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="setuju"
                    checked={form.setuju}
                    onChange={(e) => onUbah("setuju", e.target.checked)}
                    className={`mt-1 h-4 w-4 shrink-0 ${form.setuju ? "accent-emerald-600" : "accent-[#0B2F9F]"}`}
                  />
                  <span>{teksSetuju}</span>
                </label>
              )}
              {finalStatus === "idle" && (
                <p className="text-sm text-gray-600 leading-relaxed max-w-md">
                  {t("pendaftaran.finalIdle")}
                </p>
              )}

              {/* Status verifikasi sesuai catatan server — bukan apa yang
                  tadi diklik di layar ini. */}
              {finalStatus !== "loading" && finalStatus !== "success" && (
                <div className="flex w-full max-w-md flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left">
                  <span className="text-[11px] font-medium text-gray-700">
                    {t("pendaftaran.verifStatusLabel")}:{" "}
                    <span
                      className={
                        verifikasi?.tiket
                          ? "text-emerald-700 font-semibold"
                          : statusVerifikasi === "pengajuan"
                            ? "text-amber-700 font-semibold"
                            : "text-gray-500 font-semibold"
                      }
                    >
                      {statusVerifikasiTeks}
                    </span>
                  </span>
                  {(statusVerifikasi === "kedaluwarsa" ||
                    statusVerifikasi === "error") && (
                    <button
                      type="button"
                      onClick={() => {
                        onUlangiVerifikasi?.();
                        setStep("password");
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      {t("pendaftaran.ulangiVerifikasi")}
                    </button>
                  )}
                </div>
              )}
              {finalStatus === "success" && (
                <>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-md">
                    {finalSuksesAwal}
                    <span className="font-semibold text-gray-900">
                      {username}
                    </span>
                    {finalSuksesAkhir}
                  </p>
                  {finalPesan && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-800">
                      {finalPesan}
                    </span>
                  )}
                </>
              )}
              {finalStatus === "error" && (
                <p className="text-sm text-red-600 leading-relaxed max-w-md">
                  {finalPesan || t("pendaftaran.finalGagal")}
                </p>
              )}
              <div className="flex w-full items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("akun");
                    setDiriStep(0);
                    setKontakStep(0);
                    onReset();
                  }}
                >
                  {finalStatus === "success"
                    ? t("pendaftaran.keluarGantiAkun")
                    : t("pendaftaran.ulangiAwal")}
                </Button>
                {finalStatus !== "loading" && finalStatus !== "success" && (
                  <Button
                    onClick={onKirim}
                    /* Double-klik: tombol dikunci selama permintaan berjalan
                       (status dipegang orang tua, jadi tetap konsisten bila
                       pengguna berpindah langkah di tengah jalan). */
                    loading={status === "mengirim"}
                    disabled={status === "mengirim"}
                  >
                    {finalStatus === "error" ? t("pendaftaran.cobaLagi") : t("pendaftaran.kirimPendaftaran")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {children}
    </div>
  );
}