import {
  CircleCheck,
  CircleUser,
  Copy,
  Info,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";
import { useKartuPemain } from "../../lib/pemainCatur.js";
import VerificationSpinner from "../../components/VerificationSpinner.jsx";

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

export default function ContohTampilanPendaftaran() {
  const [step, setStep] = useState("akun");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const kartu = useKartuPemain(username, step === "password", "chessCom");

  const [headingTitle, setHeadingTitle] = useState("Pendaftaran Anggota");
  const [articleText, setArticleText] = useState(
    "Gunakan akun Chess.com Anda. Data pendaftaran akan tersimpan aman di Komunitas Catur Indonesia."
  );

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [dataDiri, setDataDiri] = useState({
    namaLengkap: "",
    panggilan: "",
    tanggalLahir: "",
    kota: "",
  });
  const [diriStep, setDiriStep] = useState(0);
  const [diriError, setDiriError] = useState("");

  const [finalStatus, setFinalStatus] = useState("idle");
  const [finalPesan, setFinalPesan] = useState("");

  const [kontak, setKontak] = useState({
    hp: "",
    dana: "",
    email: "",
    klub: "",
  });
  const [kontakStep, setKontakStep] = useState(0);
  const [kontakError, setKontakError] = useState("");

  const [editHeadingTitle, setEditHeadingTitle] = useState(headingTitle);
  const [editArticleText, setEditArticleText] = useState(articleText);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setUsernameError("Masukkan username Chess.com.");
      return;
    }
    setUsernameError("");
    setStep("password");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setStep("success");
    showToast("Verifikasi berhasil! Menyambungkan ke sistem...");
  };

  const handleDiriSubmit = (e) => {
    e.preventDefault();
    const langkah = LANGKAH_DATADIRI[diriStep];
    const nilai = dataDiri[langkah.kunci].trim();
    if (!nilai) {
      setDiriError("Isian ini wajib diisi.");
      return;
    }
    if (langkah.kunci === "namaLengkap" && nilai.split(/\s+/).length < 2) {
      setDiriError("Tulis nama lengkap (minimal dua kata).");
      return;
    }
    if (langkah.kunci === "tanggalLahir" && nilai > HARI_INI) {
      setDiriError("Tanggal lahir tidak masuk akal.");
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
    const nilai = kontak[langkah.kunci].trim();
    if (!langkah.opsional) {
      if (!nilai) {
        setKontakError("Isian ini wajib diisi.");
        return;
      }
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

  const handleSaveCustomization = (e) => {
    e.preventDefault();
    setHeadingTitle(editHeadingTitle);
    setArticleText(editArticleText);
    setShowCustomizeModal(false);
    showToast("Pengaturan tampilan berhasil diperbarui.");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col justify-between items-center p-4 sm:p-6 lg:p-10 select-none relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl border border-gray-700 shadow-xl flex items-center gap-3 animate-fade-in">
          <Info className="h-4 w-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation Demo */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 z-10">
        <div className="flex items-center space-x-2 text-xs text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">Demo Interactive React</span>
        </div>
        <button
          type="button"
          onClick={() => setShowCustomizeModal(true)}
          className="text-xs font-medium bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300 transition flex items-center gap-1.5 active:scale-95 shadow-sm"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Ubah Teks & Artikel</span>
        </button>
      </div>

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
                    {headingTitle}
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {articleText}
                  </p>
                </div>

                {/* Kolom Kanan: Form Input & Tindakan */}
                <div className="lg:col-span-6 flex flex-col space-y-5 pt-2 lg:pt-0">
                  <div className="relative mt-1">
                    <input
                      type="text"
                      id="usernameInput"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (usernameError) setUsernameError("");
                      }}
                      className="peer w-full h-14 px-4 pt-4 pb-1 rounded-lg border border-gray-300 bg-transparent text-sm sm:text-base text-gray-900 placeholder-transparent focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                      placeholder="Username Chess.com"
                      required
                    />
                    <label className="pointer-events-none absolute left-4 top-2 px-0.5 text-xs text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-600">
                      Username Chess.com *
                    </label>
                  </div>

                  {usernameError && (
                    <div className="text-xs text-red-600 flex items-center gap-1.5 -mt-2">
                      <Info className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                      <span>{usernameError}</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-600 leading-normal">
                    Username harus sudah tercatat sebagai anggota Blunder Skuad di Chess.com. Roster Chess.com dapat membutuhkan hingga 12 jam untuk diperbarui.{" "}
                    <button
                      type="button"
                      onClick={() => setShowGuestModal(true)}
                      className="text-blue-600 hover:underline font-medium inline-block mt-1"
                    >
                      Buka klub Blunder Skuad di Chess.com
                    </button>
                  </p>

                  <div className="flex items-center justify-end pt-6">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#0B2F9F] hover:bg-[#08216f] text-white font-medium rounded-full text-sm shadow-sm hover:shadow transition-all active:scale-95"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="w-full h-full flex flex-col justify-between">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Kolom Kiri: Informasi Verifikasi */}
                <div className="lg:col-span-6 flex flex-col space-y-4">
                  <MarkKomunitas kecil />
                  <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 tracking-tight leading-tight">
                    Verifikasi diri Anda
                  </h1>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Untuk membantu menjaga keamanan akun Anda, kami ingin memastikan bahwa memang Anda yang mencoba mendaftar sebagai.
                  </p>

                  {/* Badge User */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-800 text-xs sm:text-sm w-fit">
                    {kartu?.avatar ? (
                      <img
                        src={kartu.avatar}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <CircleUser className="h-4 w-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span className="font-medium truncate max-w-[160px]">
                      {kartu?.name ?? username}
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

                  <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3">
                    <p>
                      Buka pengaturan profil Chess.com Anda. Isi kolom <span className="font-semibold text-gray-800">Location</span> dengan kode berikut:
                    </p>
                    <div className="py-1 flex items-center gap-2">
                      <code className="select-all rounded-md bg-gray-100 px-3 py-1.5 font-mono text-sm font-bold text-[#0B2F9F] border border-gray-300 inline-block tracking-wider">
                        KCI-Z96AKZ
                      </code>
                      <button
                        type="button"
                        title="Salin kode"
                        aria-label="Salin kode"
                        onClick={() => {
                          navigator.clipboard?.writeText("KCI-Z96AKZ").catch(() => {});
                          showToast("Kode berhasil disalin.");
                        }}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1.5 text-gray-500 hover:text-gray-800 hover:border-gray-400 transition"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p>
                      Simpan perubahan, lalu klik tombol di bawah. Setelah terverifikasi, kode boleh dihapus kembali.
                    </p>
                    <button
                      type="button"
                      className="text-blue-600 hover:underline font-medium text-xs sm:text-sm inline-block"
                    >
                      Buka pengaturan Chess.com
                    </button>
                  </div>

                  <div className="flex items-center justify-end pt-6 gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("akun")}
                      className="px-5 py-2.5 text-blue-600 hover:bg-gray-100 rounded-full text-sm font-medium transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#0B2F9F] hover:bg-[#08216f] text-white font-medium rounded-full text-sm shadow-sm hover:shadow transition-all active:scale-95"
                    >
                      Saya sudah memasang kode
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* STEP SUCCESS */}
          {step === "success" && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center py-8 space-y-5">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shadow-sm">
                <CircleCheck className="h-10 w-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-normal text-gray-900 tracking-tight">
                Verifikasi Berhasil!
              </h2>
              <p className="text-gray-600 max-w-md text-sm sm:text-base leading-relaxed">
                Akun{" "}
                <span className="text-[#0B2F9F] font-semibold">
                  {kartu?.name ?? username}
                </span>{" "}
                sudah terverifikasi dan siap melanjutkan pendaftaran anggota.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("akun");
                    setUsername("");
                  }}
                  className="px-5 py-2.5 text-blue-600 hover:bg-gray-100 rounded-full text-sm font-medium transition"
                >
                  Ganti Akun
                </button>
                <button
                  type="button"
                  className="px-6 py-2.5 bg-[#0B2F9F] hover:bg-[#08216f] text-white font-medium rounded-full text-sm shadow-sm hover:shadow transition-all active:scale-95"
                  onClick={() => setStep("data-diri")}
                >
                  Lanjutkan Pendaftaran
                </button>
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
                      value={dataDiri[LANGKAH_DATADIRI[diriStep].kunci]}
                      onChange={(e) => {
                        setDataDiri((d) => ({
                          ...d,
                          [LANGKAH_DATADIRI[diriStep].kunci]: e.target.value,
                        }));
                        if (diriError) setDiriError("");
                      }}
                      max={LANGKAH_DATADIRI[diriStep].tipe === "date" ? HARI_INI : undefined}
                      className="peer w-full h-14 px-4 pt-4 pb-1 rounded-lg border border-gray-300 bg-transparent text-sm sm:text-base text-gray-900 placeholder-transparent focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                      placeholder={LANGKAH_DATADIRI[diriStep].placeholder}
                      required
                    />
                    <label className="pointer-events-none absolute left-4 top-2 px-0.5 text-xs text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-600">
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
                    <button
                      type="button"
                      onClick={() => {
                        if (diriStep === 0) {
                          setStep("success");
                        } else {
                          setDiriStep((s) => s - 1);
                        }
                      }}
                      className="px-5 py-2.5 text-blue-600 hover:bg-gray-100 rounded-full text-sm font-medium transition"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#0B2F9F] hover:bg-[#08216f] text-white font-medium rounded-full text-sm shadow-sm hover:shadow transition-all active:scale-95"
                    >
                      {diriStep < LANGKAH_DATADIRI.length - 1
                        ? "Berikutnya"
                        : "Lanjutkan"}
                    </button>
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
                      value={kontak[LANGKAH_KONTAK[kontakStep].kunci]}
                      onChange={(e) => {
                        setKontak((k) => ({
                          ...k,
                          [LANGKAH_KONTAK[kontakStep].kunci]: e.target.value,
                        }));
                        if (kontakError) setKontakError("");
                      }}
                      className="peer w-full h-14 px-4 pt-4 pb-1 rounded-lg border border-gray-300 bg-transparent text-sm sm:text-base text-gray-900 placeholder-transparent focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                      placeholder={LANGKAH_KONTAK[kontakStep].placeholder}
                    />
                    <label className="pointer-events-none absolute left-4 top-2 px-0.5 text-xs text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-600">
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

                  <div className="flex items-center justify-between pt-6 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (kontakStep === 0) {
                          setStep("data-diri");
                        } else {
                          setKontakStep((s) => s - 1);
                        }
                      }}
                      className="px-5 py-2.5 text-blue-600 hover:bg-gray-100 rounded-full text-sm font-medium transition"
                    >
                      Kembali
                    </button>
                    <div className="flex items-center gap-3">
                      {LANGKAH_KONTAK[kontakStep].opsional && (
                        <button
                          type="button"
                          onClick={handleLewatiKontak}
                          className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-full text-sm font-medium transition"
                        >
                          Lewati
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#0B2F9F] hover:bg-[#08216f] text-white font-medium rounded-full text-sm shadow-sm hover:shadow transition-all active:scale-95"
                      >
                        {kontakStep < LANGKAH_KONTAK.length - 1
                          ? "Berikutnya"
                          : "Selesai"}
                      </button>
                    </div>
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
                    {kartu?.name ?? username}
                  </span>
                  . Anda kini tercatat sebagai anggota Blunder Skuad.
                </p>
              )}
              {finalStatus === "error" && (
                <p className="text-sm text-red-600 leading-relaxed max-w-md">
                  {finalPesan || "Ada kesalahan saat mengirim. Coba lagi."}
                </p>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("akun");
                    setUsername("");
                    setDataDiri({
                      namaLengkap: "",
                      panggilan: "",
                      tanggalLahir: "",
                      kota: "",
                    });
                    setKontak({ hp: "", dana: "", email: "", klub: "" });
                    setDiriStep(0);
                    setKontakStep(0);
                    setFinalStatus("idle");
                  }}
                  className="px-5 py-2.5 text-blue-600 hover:bg-gray-100 rounded-full text-sm font-medium transition"
                >
                  {finalStatus === "success"
                    ? "Keluar / Ganti Akun"
                    : "Ulangi dari Awal"}
                </button>
                {finalStatus !== "loading" && finalStatus !== "success" && (
                  <button
                    type="button"
                    onClick={() => {
                      setFinalStatus("loading");
                      setFinalPesan("");
                      setTimeout(() => setFinalStatus("success"), 2500);
                    }}
                    className="px-6 py-2.5 bg-[#0B2F9F] hover:bg-[#08216f] text-white font-medium rounded-full text-sm shadow-sm hover:shadow transition-all active:scale-95"
                  >
                    {finalStatus === "error" ? "Coba Lagi" : "Kirim Pendaftaran"}
                  </button>
                )}
                {finalStatus === "idle" && (
                  <button
                    type="button"
                    onClick={() => {
                      setFinalStatus("error");
                      setFinalPesan(
                        "Server tidak merespons. Periksa koneksi Anda lalu coba lagi."
                      );
                    }}
                    className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-full text-sm font-medium transition"
                  >
                    Simulasi Gagal
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 pt-6 gap-4">
        <div>Bahasa Indonesia</div>
        <div className="flex items-center space-x-6">
          <button
            type="button"
            onClick={() => showToast("Memuat Bantuan...")}
            className="hover:text-gray-800 transition"
          >
            Bantuan
          </button>
          <button
            type="button"
            onClick={() => showToast("Memuat Privasi...")}
            className="hover:text-gray-800 transition"
          >
            Privasi
          </button>
          <button
            type="button"
            onClick={() => showToast("Memuat Persyaratan...")}
            className="hover:text-gray-800 transition"
          >
            Persyaratan
          </button>
        </div>
      </footer>

      {/* Modal Kustomisasi */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span>Kustomisasi Portal Login</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomization} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Judul Halaman (Heading)
                </label>
                <input
                  type="text"
                  value={editHeadingTitle}
                  onChange={(e) => setEditHeadingTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Artikel / Subteks Penjelasan
                </label>
                <textarea
                  value={editArticleText}
                  onChange={(e) => setEditArticleText(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-600"
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomizeModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mode Tamu */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span>Menggunakan Mode Tamu</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuestModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Gunakan mode Tamu untuk login di perangkat publik atau komputer milik orang lain.
            </p>

            <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
              <li>
                Riwayat penjelajahan dan cookie tidak akan disimpan di perangkat setelah Anda menutup semua jendela mode tamu.
              </li>
              <li>
                Aktivitas Anda tetap terlindungi dan aman secara menyeluruh.
              </li>
            </ul>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGuestModal(false)}
                className="px-5 py-2 text-xs font-medium bg-[#0B2F9F] hover:bg-[#08216f] text-white rounded-full transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}