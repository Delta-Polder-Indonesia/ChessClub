import { CircleUser, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useKartuPemain } from "../../lib/pemainCatur.js";
import VerificationSpinner from "../../components/VerificationSpinner.jsx";
import VerifikasiAkun from "../../components/VerifikasiAkun.jsx";
import { Button } from "../../components/ui/button.jsx";

/**
 * Tampilan mirip alur masuk Google (tema terang, dua kolom responsif,
 * alur akun/username & verifikasi) dengan hirarki teks dan tombol yang konsisten.
 */

function WordmarkKomunitas({ gelap = false }) {
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
        INDONESIA
      </span>
    </span>
  );
}

function MarkKomunitas({ kecil = false }) {
  const px = kecil ? 36 : 40;
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
const URL_KLUB = "https://www.chess.com/club/blunder-skuad";

/* Satu isian per langkah pada bagian Data Diri (1 → 2 → 3 → 4). */
const LANGKAH_DATADIRI = [
  {
    kunci: "namaLengkap",
    label: "Nama Lengkap",
    judul: "Nama Lengkap Anda",
    deskripsi: "Sesuai identitas resmi, untuk sertifikat dan hadiah turnamen.",
    tipe: "text",
    placeholder: "contoh: Budi Santoso",
  },
  {
    kunci: "panggilan",
    label: "Nama Panggilan",
    judul: "Nama Panggilan Anda",
    deskripsi: "Dipakai pengurus untuk administrasi dan turnamen.",
    tipe: "text",
    placeholder: "contoh: Budi",
  },
  {
    kunci: "tanggalLahir",
    label: "Tanggal Lahir",
    judul: "Tanggal Lahir",
    deskripsi: "Dipakai untuk menentukan kategori umur turnamen.",
    tipe: "date",
  },
  {
    kunci: "kota",
    label: "Kota Asal",
    judul: "Kota Asal Anda",
    deskripsi: "Untuk pembagian wilayah pada liga antar-komunitas.",
    tipe: "text",
    placeholder: "contoh: Medan",
  },
];

/* Satu isian per langkah pada bagian Kontak & Pembayaran (1 → 2 → 3 → 4).
   Langkah dengan `opsional: true` menyediakan tombol "Lewati". */
const LANGKAH_KONTAK = [
  {
    kunci: "hp",
    label: "Nomor HP / WhatsApp",
    judul: "Nomor HP / WhatsApp",
    deskripsi: "Nomor aktif WhatsApp, untuk undangan turnamen dan verifikasi.",
    tipe: "tel",
    placeholder: "contoh: 0812-3456-7890",
    opsional: false,
  },
  {
    kunci: "dana",
    label: "Nomor DANA",
    judul: "Nomor DANA",
    deskripsi: "Untuk pengiriman hadiah turnamen.",
    tipe: "tel",
    placeholder: "kosongkan bila sama dengan nomor HP",
    opsional: true,
  },
  {
    kunci: "email",
    label: "Email",
    judul: "Alamat Email",
    deskripsi: "Untuk pemberitahuan resmi dari pengurus.",
    tipe: "email",
    placeholder: "contoh: budi@email.com",
    opsional: true,
  },
  {
    kunci: "klub",
    label: "Klub / Komunitas Asal",
    judul: "Klub / Komunitas Asal",
    deskripsi: "Bila Anda sudah tergabung di klub lain.",
    tipe: "text",
    placeholder: "contoh: Klub Catur Medan",
    opsional: true,
  },
];

export default function TampilanPendaftaran({
  form,
  status,
  pesan,
  verifikasi,
  statusVerifikasi,
  teksSetuju,
  onUbah,
  onTerverifikasi,
  onBatalVerifikasi,
  onKirim,
  onReset,
  validasiLokal,
}) {
  const [step, setStep] = useState(verifikasi ? "success" : "akun");
  const [usernameError, setUsernameError] = useState("");
  const username = form.username;
  const setUsername = (nilai) => onUbah("username", nilai);
  const kartuPemain = useKartuPemain(username, Boolean(username), "chessCom");

  const [toastMessage, setToastMessage] = useState("");

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
    else if (statusVerifikasi === "error") setStep("password");
  }, [verifikasi, statusVerifikasi]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

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
      showToast("Data diri selesai. Lanjut ke Kontak & Pembayaran...");
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
      showToast("Pendaftaran sedang diproses...");
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
      showToast("Pendaftaran sedang diproses...");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col justify-between items-center p-4 sm:p-6 lg:p-10 select-none relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl border border-gray-700 shadow-xl flex items-center gap-3 animate-fade-in">
          <Info className="h-4 w-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
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
                    Pendaftaran Anggota
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Gunakan akun Chess.com Anda. Data pendaftaran akan tersimpan aman di Komunitas Catur Indonesia.
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
          placeholder="Username Chess.com"
        />
        {/* PERBAIKAN: Gaya label memotong garis persis seperti Google */}
        <label className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-gray-700">
          Username Chess.com *
        </label>
                  </div>

                  {usernameError && (
                    <div role="alert" className="text-xs text-red-600 flex items-center gap-1.5 -mt-2">
                      <Info className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                      <span>{usernameError}</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-600 leading-normal">
                    Username harus sudah tercatat sebagai anggota Blunder Skuad di Chess.com. Roster Chess.com dapat membutuhkan hingga 12 jam untuk diperbarui.{" "}
                    <button
                      type="button"
                      onClick={() => window.open(URL_KLUB, "_blank", "noopener,noreferrer")}
                      className="text-blue-600 hover:underline font-medium inline-block mt-1"
                    >
                      Buka klub Blunder Skuad di Chess.com
                    </button>
                  </p>

                  <div className="flex items-center justify-end pt-6">
                    <Button type="submit">
                      Berikutnya
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
                    Verifikasi diri Anda
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Untuk membantu menjaga keamanan akun Anda, kami ingin memastikan bahwa memang Anda yang mencoba mendaftar.
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
                      Ubah
                    </button>
                  </div>
                </div>

                {/* Kolom Kanan: Instruksi Kode & Tombol Aksi */}
                <div className="lg:col-span-6 flex flex-col space-y-5 pt-2 lg:pt-0">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Verifikasi lewat kode profil
                  </h2>
                  <VerifikasiAkun
                    username={username}
                    terverifikasi={verifikasi}
                    onTerverifikasi={onTerverifikasi}
                    onBatal={onBatalVerifikasi}
                    statusAwal={statusVerifikasi}
                    pesanAwal={statusVerifikasi === "error" ? pesan : ""}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP SUCCESS */}
          {step === "success" && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center py-8 space-y-5">
              <VerificationSpinner
                status="success"
                size={72}
                successText="Verifikasi Berhasil!"
              />
              <h2 className="text-2xl sm:text-3xl font-normal text-gray-900 tracking-tight">
                Verifikasi Berhasil!
              </h2>
              <p className="text-gray-600 max-w-md text-sm sm:text-base leading-relaxed">
                Akun{" "}
                <span className="text-[#0B2F9F] font-semibold">
                  {username}
                </span>{" "}
                sudah terverifikasi dan siap melanjutkan pendaftaran anggota.
              </p>
              <div className="flex w-full items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("akun");
                    onBatalVerifikasi();
                    setUsername("");
                  }}
                >
                  Ganti Akun
                </Button>
                <Button onClick={() => setStep("data-diri")}>
                  Lanjutkan Pendaftaran
                </Button>
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
                    Data Diri
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Isi satu data per langkah. Data disimpan secara privat oleh
                    pengurus untuk administrasi dan turnamen.
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
                      Langkah {diriStep + 1} dari {LANGKAH_DATADIRI.length}
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
                    {/* PERBAIKAN: Gaya label memotong garis */}
                    <label className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600">
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
                      Kembali
                    </Button>
                    <Button type="submit">
                      {diriStep < LANGKAH_DATADIRI.length - 1
                        ? "Berikutnya"
                        : "Lanjutkan"}
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
                    Kontak & Pembayaran
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Isi satu data per langkah. Nomor HP/WhatsApp dan DANA hanya
                    disimpan pada catatan pengurus dan tidak pernah ditampilkan
                    di situs.
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
                      Langkah {kontakStep + 1} dari {LANGKAH_KONTAK.length}
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
                    {LANGKAH_KONTAK[kontakStep].opsional && "(opsional)"}
                  </p>

                  <div className="relative mt-2">
                    <input
                      type={LANGKAH_KONTAK[kontakStep].tipe}
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
                    {/* PERBAIKAN: Gaya label memotong garis */}
                    <label className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm sm:peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-blue-600">
                      {LANGKAH_KONTAK[kontakStep].label}{" "}
                      {LANGKAH_KONTAK[kontakStep].opsional ? "(opsional)" : "*"}
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
                      Kembali
                    </Button>
                    {LANGKAH_KONTAK[kontakStep].opsional && (
                      <Button variant="outline" onClick={handleLewatiKontak}>
                        Lewati
                      </Button>
                    )}
                    <Button type="submit">
                      {kontakStep < LANGKAH_KONTAK.length - 1
                        ? "Berikutnya"
                        : "Selesai"}
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
                loadingText="Mendaftarkan anggota..."
                successText="Pendaftaran Berhasil!"
                errorText="Pendaftaran Gagal"
              />
              {finalStatus !== "loading" && finalStatus !== "success" && (
                <label className="flex max-w-md items-start gap-3 text-left text-sm leading-6 text-grey-800">
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
                  Semua data sudah lengkap. Klik tombol untuk mengirim
                  pendaftaran.
                </p>
              )}
              {finalStatus === "success" && (
                <p className="text-sm text-gray-600 leading-relaxed max-w-md">
                  Selamat datang,{" "}
                  <span className="font-semibold text-gray-900">
                    {username}
                  </span>
                  . Anda kini tercatat sebagai anggota Blunder Skuad.
                </p>
              )}
              {finalStatus === "error" && (
                <p className="text-sm text-red-600 leading-relaxed max-w-md">
                  {finalPesan || "Ada kesalahan saat mengirim. Coba lagi."}
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
                    ? "Keluar / Ganti Akun"
                    : "Ulangi dari Awal"}
                </Button>
                {finalStatus !== "loading" && finalStatus !== "success" && (
                  <Button onClick={onKirim}>
                    {finalStatus === "error" ? "Coba Lagi" : "Kirim Pendaftaran"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}