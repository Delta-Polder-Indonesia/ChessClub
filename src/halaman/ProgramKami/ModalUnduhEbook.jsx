import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { tebusUnduhanEbook, ajukanMintaEbook } from "../../lib/api/ebook.js";
import { urlEbook, berkasPublik } from "../../lib/asets.js";
import { useI18n } from "../../lib/i18n.jsx";

function IkonTutup() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}

function IkonCentang() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="#000000" strokeWidth="2" />
      <path d="M8 12.5L11 15.5L16 9.5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

function IkonKirim() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

function IkonUnduh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3V15M12 15L8 11M12 15L16 11M3 17V19C3 19.55 3.45 20 4 20H20C20.55 20 21 19.55 21 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="font-bold text-black uppercase text-[11px] tracking-wider select-none">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function ModalUnduhEbook({ buku, onTutup }) {
  const { t } = useI18n();
  const [punyaKode, setPunyaKode] = useState(false);
  const [nama, setNama] = useState("");
  const [akun, setAkun] = useState("");
  const [kode, setKode] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [tercatat, setTercatat] = useState(null);
  const [mintaTerkirim, setMintaTerkirim] = useState(false);
  const [salah, setSalah] = useState(false);
  const namaRef = useRef(null);

  useEffect(() => {
    const gulirTadi = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const jam = setTimeout(() => namaRef.current?.focus(), 60);
    const onEsc = (e) => {
      if (e.key === "Escape") onTutup();
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = gulirTadi;
      clearTimeout(jam);
      window.removeEventListener("keydown", onEsc);
    };
  }, [onTutup]);

  function bersihkanGalat() {
    if (galat) setGalat("");
    setSalah(false);
  }

  function gantiMode(punyaKodeState) {
    setPunyaKode(punyaKodeState);
    bersihkanGalat();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sibuk) return;
    setGalat("");

    if (punyaKode) {
      // Logika Tebus & Unduh
      if (!nama.trim() || !akun.trim() || !kode.trim()) {
        setGalat(t("unduhEbook.lengkapiKode"));
        setSalah(true);
        return;
      }
      setSalah(false);
      setSibuk(true);

      try {
        const catatan = await tebusUnduhanEbook({
          kode: kode.trim(),
          nama: nama.trim(),
          akunChess: akun.trim(),
          bukuId: buku.id,
          judul: buku.judul,
        });
        setTercatat(catatan);

        const taut = document.createElement("a");
        taut.href = urlEbook(buku.file, { unduh: true });
        taut.download = "";
        document.body.appendChild(taut);
        taut.click();
        taut.remove();
      } catch (e2) {
        setGalat(e2.message || t("unduhEbook.galatTebus"));
        setSalah(true);
      } finally {
        setSibuk(false);
      }
    } else {
      // Logika Minta Kode
      if (!nama.trim() || !akun.trim()) {
        setGalat(t("unduhEbook.lengkapiMinta"));
        setSalah(true);
        return;
      }
      setSalah(false);
      setSibuk(true);

      try {
        await ajukanMintaEbook({
          nama: nama.trim(),
          akunChess: akun.trim(),
          bukuId: buku.id,
          judul: buku.judul,
        });
        setMintaTerkirim(true);
      } catch (e2) {
        setGalat(e2.message || t("unduhEbook.galatMinta"));
        setSalah(true);
      } finally {
        setSibuk(false);
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-unduh-ebook"
        className="w-full max-w-[440px] overflow-hidden rounded-xl border-2 border-black bg-white shadow-none"
      >
        {/* Header */}
        <CardHeader className="flex-row items-center justify-between gap-4 border-b-2 border-black bg-neutral-50 p-5 shadow-none">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg border-2 border-black bg-white p-1">
              <img
                src={berkasPublik("/images/color-icon/book-open-aqua.svg")}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <CardTitle as="h2" id="judul-unduh-ebook" className="text-base font-black uppercase tracking-tight text-black sm:text-lg">
                {t("unduhEbook.judul")}
              </CardTitle>
              <CardDescription className="mt-0.5 truncate text-xs font-bold text-neutral-700">
                {buku.judul}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onTutup}
            aria-label={t("unduhEbook.tutup")}
            className="h-9 w-9 flex-none rounded-lg border-2 border-black bg-white text-black shadow-none transition-all hover:bg-neutral-100 hover:text-black active:translate-y-0.5"
          >
            <IkonTutup />
          </Button>
        </CardHeader>

        {/* State Sukses: Berkas berhasil diunduh */}
        {tercatat ? (
          <>
            <CardContent className="flex flex-col items-center gap-4 bg-white p-6 sm:p-8 text-center">
              <IkonCentang />
              <div className="space-y-1">
                <CardTitle as="h3" className="text-base font-black uppercase tracking-wide text-black">
                  {t("unduhEbook.tercatatJudul")}
                </CardTitle>
                <CardDescription className="mx-auto max-w-sm text-xs font-medium leading-relaxed text-black">
                  Tercatat di buku kunjungan: <strong className="border border-black bg-neutral-100 px-1.5 py-0.5 font-bold">{tercatat.nama}</strong>{" "}
                  ({tercatat.akunChess}) mengunduh “{tercatat.judul}”.
                </CardDescription>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 bg-white p-6 pt-0">
              <a
                href={urlEbook(buku.file, { unduh: true })}
                download
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-4 text-xs font-bold uppercase tracking-wider text-black shadow-none transition-all hover:bg-neutral-100 active:translate-y-0.5"
              >
                <IkonUnduh />
                {t("unduhEbook.unduhLagi")}
              </a>
              <Button
                variant="ghost"
                onClick={onTutup}
                className="h-10 w-full rounded-lg border-2 border-black bg-white text-xs font-bold uppercase tracking-wider text-black shadow-none transition-all hover:bg-neutral-100 active:translate-y-0.5"
              >
                {t("unduhEbook.tutup")}
              </Button>
            </CardFooter>
          </>
        ) : mintaTerkirim ? (
          /* State Sukses: Permintaan dikirim */
          <>
            <CardContent className="flex flex-col items-center gap-4 bg-white p-6 sm:p-8 text-center">
              <IkonCentang />
              <div className="space-y-2">
                <CardTitle as="h3" className="text-base font-black uppercase tracking-wide text-black">
                  {t("unduhEbook.mintaJudul")}
                </CardTitle>
                <CardDescription className="mx-auto max-w-sm text-xs font-medium leading-relaxed text-black">
                  Tunggu kode akses dikirimkan oleh pengurus. Setelah kodenya diterima, buka popup ini lagi lalu pilih opsi <strong className="border border-black bg-neutral-100 px-1.5 py-0.5 font-bold">"Sudah punya kode"</strong> di bagian bawah.
                </CardDescription>
              </div>
            </CardContent>
            <CardFooter className="bg-white p-6 pt-0">
              <Button
                onClick={onTutup}
                className="h-10 w-full rounded-lg border-2 border-black bg-white text-xs font-bold uppercase tracking-wider text-black shadow-none transition-all hover:bg-neutral-100 active:translate-y-0.5"
              >
                {t("unduhEbook.mengerti")}
              </Button>
            </CardFooter>
          </>
        ) : (
          /* State Form Utama */
          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="bg-white p-5 sm:p-6 pb-2">
              {galat && (
                <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border-2 border-red-600 bg-red-50 p-3 text-xs font-bold text-red-700 shadow-none">
                  <span className="h-2 w-2 flex-none rounded-full bg-red-600" />
                  <span>{galat}</span>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <Field label="Nama asli" htmlFor="unduh-nama">
                  <Input
                    ref={namaRef}
                    id="unduh-nama"
                    name="nama"
                    autoComplete="name"
                    maxLength={80}
                    placeholder="cth. Budi Santoso"
                    value={nama}
                    onChange={(e) => {
                      setNama(e.target.value);
                      bersihkanGalat();
                    }}
                    className="h-10 rounded-lg border-2 border-black bg-white text-xs font-semibold shadow-none focus-visible:ring-0 focus-visible:border-black placeholder:text-neutral-400 placeholder:font-normal"
                  />
                </Field>

                <Field label="Akun Chess.com" htmlFor="unduh-akun">
                  <Input
                    id="unduh-akun"
                    name="akunChess"
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={25}
                    placeholder="cth. budichess99"
                    value={akun}
                    onChange={(e) => {
                      setAkun(e.target.value);
                      bersihkanGalat();
                    }}
                    className="h-10 rounded-lg border-2 border-black bg-white text-xs font-semibold shadow-none focus-visible:ring-0 focus-visible:border-black placeholder:text-neutral-400 placeholder:font-normal"
                  />
                </Field>

                {punyaKode && (
                  <Field label="Kode akses" htmlFor="unduh-kode">
                    <Input
                      id="unduh-kode"
                      name="kode"
                      autoComplete="off"
                      spellCheck="false"
                      maxLength={12}
                      placeholder="cth. EBK-7F3K2M9Q"
                      value={kode}
                      onChange={(e) => {
                        setKode(e.target.value.toUpperCase());
                        bersihkanGalat();
                      }}
                      className="h-10 rounded-lg border-2 border-black bg-white text-xs font-mono font-bold tracking-wider shadow-none focus-visible:ring-0 focus-visible:border-black placeholder:text-neutral-400 placeholder:font-sans placeholder:font-normal"
                    />
                  </Field>
                )}
              </div>
            </CardContent>

            {/* Footer Form & Teks Navigasi */}
            <CardFooter className="flex-col gap-3 bg-white p-5 sm:p-6 pt-3">
              <Button
                type="submit"
                disabled={sibuk}
                className={`h-10 w-full gap-2 rounded-lg border-2 border-black bg-white text-xs font-bold uppercase tracking-wider shadow-none transition-all hover:bg-neutral-100 active:translate-y-0.5 disabled:opacity-50 ${salah ? "border-red-600 text-red-600" : "text-black"}`}
              >
                {punyaKode ? <IkonUnduh /> : <IkonKirim />}
                {sibuk
                  ? punyaKode
                    ? t("unduhEbook.memeriksa")
                    : t("unduhEbook.mengirim")
                  : punyaKode
                  ? t("unduhEbook.mulaiUnduh")
                  : t("unduhEbook.kirimPermintaan")}
              </Button>

              {/* Navigasi Teks ala Sign Up / Sign In */}
              <div className="text-center text-xs font-medium text-black">
                {punyaKode ? (
                  <>
                    Belum punya kode akses?{" "}
                    <button
                      type="button"
                      onClick={() => gantiMode(false)}
                      className="font-bold underline underline-offset-4 hover:text-neutral-700"
                    >
                      Minta kode di sini
                    </button>
                  </>
                ) : (
                  <>
                    Sudah punya kode akses?{" "}
                    <button
                      type="button"
                      onClick={() => gantiMode(true)}
                      className="font-bold underline underline-offset-4 hover:text-neutral-700"
                    >
                      Masukkan kode
                    </button>
                  </>
                )}
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}