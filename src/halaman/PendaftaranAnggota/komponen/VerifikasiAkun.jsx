import { useEffect, useState } from "react";
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
  ambilProfilChessCom,
  buatKodeVerifikasi,
  cariKodeDiProfil,
  normalisasiUsername,
} from "./pemainCatur.js";
import { URL_PENGATURAN_PROFIL } from "./pendaftaran.js";

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

const LANGKAH = [
  {
    judul: "Salin kode verifikasi Anda",
    rincian: "Kode di bawah bersifat unik untuk pendaftaran ini.",
  },
  {
    judul: "Tempel pada profil Chess.com",
    rincian:
      "Buka Settings → Profile, isi kolom Location (Lokasi) dengan kode tersebut, lalu tekan Save.",
  },
  {
    judul: "Periksa kembali di sini",
    rincian:
      "Tekan Periksa Kode. Kami membaca profil publik Anda untuk mencocokkan kode.",
  },
];

export default function VerifikasiAkun({
  username,
  terverifikasi = false,
  onTerverifikasi,
  onBatal,
  statusAwal = "idle",
  pesanAwal = "",
}) {
  const [kode, setKode] = useState(() => buatKodeVerifikasi());
  const [status, setStatus] = useState("idle"); // idle | memeriksa | gagal | sukses
  const [pesan, setPesan] = useState("");
  const [sudahDisalin, setSudahDisalin] = useState(false);
  const [percobaan, setPercobaan] = useState(0);
  const [modeCepat, setModeCepat] = useState(false);
  const [kodeCepat, setKodeCepat] = useState("");

  useEffect(() => {
    if (statusAwal === "success") {
      setStatus("sukses");
      return;
    }
    if (statusAwal === "error") {
      setStatus("gagal");
      setPesan(pesanAwal || "Verifikasi gagal. Coba lagi.");
    }
  }, [statusAwal, pesanAwal]);

  const berhasil = status === "sukses" || terverifikasi;

  const handleSalin = async () => {
    const ok = await salinTeks(kode);
    if (ok) {
      setSudahDisalin(true);
      setTimeout(() => setSudahDisalin(false), 2200);
    }
  };

  const handlePeriksa = async () => {
    const bersih = normalisasiUsername(username);
    if (!bersih) {
      setStatus("gagal");
      setPesan("Username Chess.com masih kosong.");
      return;
    }

    setStatus("memeriksa");
    setPesan("");

    try {
      const profil = await ambilProfilChessCom(bersih, { segar: true });
      const sumber = cariKodeDiProfil(profil, kode);

      if (sumber) {
        setStatus("sukses");
        setPesan("");
        onTerverifikasi?.({
          username: profil.username,
          kode,
          sumber,
          mode: "profil",
          profil,
        });
        return;
      }

      setStatus("gagal");
      setPercobaan((n) => n + 1);
      setPesan(
        `Kode belum terbaca pada profil ${profil.username}. Pastikan sudah ditekan Save di Chess.com, lalu periksa lagi. Profil Chess.com dapat tersimpan di cache hingga beberapa jam.`,
      );
    } catch (galat) {
      setStatus("gagal");
      setPercobaan((n) => n + 1);
      setPesan(galat?.message || "Gagal memeriksa profil Chess.com.");
    }
  };

  const handleCepat = (e) => {
    e.preventDefault();
    const bersih = normalisasiUsername(username);
    if (kodeCepat.trim().toUpperCase() === kode && bersih) {
      setStatus("sukses");
      setPesan("");
      onTerverifikasi?.({
        username: bersih,
        kode,
        sumber: "Konfirmasi manual",
        mode: "manual",
        profil: null,
      });
      return;
    }
    setStatus("gagal");
    setPesan(
      !bersih
        ? "Username Chess.com masih kosong."
        : "Kode yang Anda masukkan tidak cocok. Salin kode di atas, lalu tempel kembali.",
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5 space-y-4">
        {/* Kode verifikasi */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Kode verifikasi Anda
          </p>
          <div className="mt-2 flex items-stretch gap-2">
            <code className="flex-1 min-w-0 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-3 font-mono text-base sm:text-lg font-bold tracking-[0.14em] text-gray-900 select-text">
              {kode}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSalin}
              aria-label="Salin kode verifikasi"
              title="Salin kode"
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
                setKode(buatKodeVerifikasi());
                setStatus("idle");
                setPesan("");
                setKodeCepat("");
              }}
              aria-label="Buat kode baru"
              title="Buat kode baru"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Langkah */}
        <ol className="space-y-2.5">
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-[#0B2F9F] text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-xs leading-relaxed text-gray-700">
                <span className="font-semibold text-gray-900">{l.judul}</span>{" "}
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
          Buka pengaturan profil Chess.com
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>

        {/* Status */}
        {status === "memeriksa" && (
          <p className="flex items-center gap-2 text-xs font-medium text-[#0B2F9F]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Menghubungi Chess.com dan memeriksa profil {normalisasiUsername(username)}…
          </p>
        )}

        {status === "sukses" && (
          <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            Profil Chess.com terverifikasi. Melanjutkan pendaftaran…
          </p>
        )}

        {status === "gagal" && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            <span className="leading-relaxed">
              {pesan}
              {percobaan >= 2 && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={() => setModeCepat(true)}
                    className="font-semibold text-red-800 underline"
                  >
                    Gunakan verifikasi cepat
                  </button>
                </>
              )}
            </span>
          </div>
        )}

        {/* Aksi */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          {onBatal && (
            <Button variant="ghost" onClick={onBatal}>
              Ganti Akun
            </Button>
          )}
          <Button
            onClick={handlePeriksa}
            loading={status === "memeriksa"}
            disabled={berhasil}
          >
            {status === "memeriksa" ? "Memeriksa…" : "Periksa Kode"}
          </Button>
        </div>
      </div>

      {/* Verifikasi cepat */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-3">
        <button
          type="button"
          onClick={() => setModeCepat((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={modeCepat}
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-gray-900">
            <KeyRound className="h-4 w-4 text-gray-500" aria-hidden="true" />
            Tidak bisa menyunting profil? Verifikasi cepat
          </span>
          <span className="text-[11px] font-medium text-gray-500">
            {modeCepat ? "Tutup" : "Buka"}
          </span>
        </button>

        {modeCepat && (
          <form onSubmit={handleCepat} className="space-y-3 pt-1">
            <p className="text-[11px] leading-relaxed text-gray-600">
              Bila profil Chess.com Anda belum dapat disunting atau cache masih
              menyimpan data lama, ketik ulang kode di atas untuk menyelesaikan
              verifikasi (mode konfirmasi manual).
            </p>
            <input
              type="text"
              value={kodeCepat}
              onChange={(e) => {
                setKodeCepat(e.target.value);
                if (status === "gagal") setStatus("idle");
              }}
              placeholder="BSKUAD-XXXXXX"
              aria-label="Kode verifikasi manual"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 font-mono text-sm tracking-[0.12em] uppercase text-gray-900 placeholder:tracking-normal placeholder:font-sans placeholder:text-gray-400 focus:border-[#0B2F9F] focus:outline-none focus:ring-1 focus:ring-[#0B2F9F]"
            />
            <div className="flex items-center justify-end gap-3">
              <Button type="submit" variant="secondary">
                Konfirmasi Kode
              </Button>
            </div>
          </form>
        )}

        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-500">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
          Kami hanya membaca profil publik Chess.com. Kode boleh Anda hapus
          kembali setelah verifikasi selesai.
        </p>
      </div>
    </div>
  );
}