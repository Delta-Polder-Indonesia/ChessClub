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
import { teksGalat } from "../../lib/api/core.js";
import {
  ambilPemohonEbook,
  simpanPemohonEbook,
  ambilTiketSesi,
  simpanTiketSesi,
} from "../../lib/sesiUnduhEbook.js";
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
      <Label htmlFor={htmlFor} className="font-semibold text-grey-600 uppercase text-[11px] tracking-wider select-none">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function ModalUnduhEbook({ buku, onTutup }) {
  const { t } = useI18n();
  /*
   * Gerbang UNDUH saja: membaca e-book tidak lewat modal ini (baca bebas,
   * lihat EbookPanduan.jsx). Tiket sesi yang masih berlaku untuk berkas ini
   * membuat pengguna tidak perlu mengetik ulang nama/akun/kode (tiket e-book
   * hanya hidup 15 menit — lihat src/lib/sesiUnduhEbook.js). Mode "punya kode"
   * dibuka otomatis supaya tombol Mulai unduh langsung menembus gerbang.
   */
  const tiketSesiAwal = useRef(null);
  if (tiketSesiAwal.current === null) {
    tiketSesiAwal.current = ambilTiketSesi({ file: buku?.file }) || "";
  }
  const pemohonTersimpan = useRef(null);
  if (pemohonTersimpan.current === null) {
    pemohonTersimpan.current = ambilPemohonEbook() || {};
  }
  const adaTiketSesi = Boolean(tiketSesiAwal.current);
  const [punyaKode, setPunyaKode] = useState(adaTiketSesi);
  const [nama, setNama] = useState(() => pemohonTersimpan.current?.nama || "");
  const [akun, setAkun] = useState(() => pemohonTersimpan.current?.akun || "");
  const [kode, setKode] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  const [tercatat, setTercatat] = useState(null);
  const [mintaTerkirim, setMintaTerkirim] = useState(false);
  const [salah, setSalah] = useState(false);
  const namaRef = useRef(null);
  const kodeRef = useRef(null);

  useEffect(() => {
    const gulirTadi = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const jam = setTimeout(() => {
      // Tiket sesi sudah ada & isian lengkap → langsung ke kode; kalau tidak,
      // fokus ke nama supaya pengguna bisa langsung mengetik.
      if (adaTiketSesi && pemohonTersimpan.current?.nama) kodeRef.current?.focus();
      else namaRef.current?.focus();
    }, 60);
    const onEsc = (e) => {
      if (e.key === "Escape") onTutup();
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = gulirTadi;
      clearTimeout(jam);
      window.removeEventListener("keydown", onEsc);
    };
  }, [onTutup, adaTiketSesi]);

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
      // Redemption menerbitkan tiket unduhan untuk berkas ini.
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
        // Sesi disimpan sebelum apa pun: tiket yang sama dipakai tombol unduh
        // di bilah pembaca, jadi menyimpannya lebih dulu berarti buku berikutnya
        // (atau muat ulang) tidak meminta data yang sama lagi.
        simpanPemohonEbook({ nama: nama.trim(), akun: akun.trim() });
        simpanTiketSesi({ file: buku.file, tiket: catatan.tiketUnduh });

        setTercatat(catatan);
        const taut = document.createElement("a");
        taut.href = urlEbook(buku.file, {
          unduh: true,
          tiket: catatan.tiketUnduh,
        });
        taut.download = "";
        document.body.appendChild(taut);
        taut.click();
        taut.remove();
      } catch (e2) {
        setGalat(teksGalat(e2, t, "unduhEbook.galatTebus"));
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
        simpanPemohonEbook({ nama: nama.trim(), akun: akun.trim() });
        setMintaTerkirim(true);
      } catch (e2) {
        setGalat(teksGalat(e2, t, "unduhEbook.galatMinta"));
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
        className="w-full max-w-[440px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-none"
      >
        {/* Header */}
        <CardHeader className="flex-row items-center justify-between gap-4 border-b border-slate-200 bg-grey-50 p-5 shadow-none">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-slate-300 bg-white p-1">
              <img
                src={berkasPublik("/images/color-icon/book-open-aqua.svg")}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <CardTitle as="h2" id="judul-unduh-ebook" className="text-base font-semibold text-grey-800 sm:text-lg">
                {t("unduhEbook.judul")}
              </CardTitle>
              <CardDescription className="mt-0.5 truncate text-xs font-medium text-grey-600">
                {buku.judul}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onTutup}
            aria-label={t("unduhEbook.tutup")}
            className="h-9 w-9 flex-none rounded-lg border border-slate-300 bg-white text-grey-600 shadow-none transition-colors hover:bg-grey-100 hover:text-grey-800"
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
                <CardTitle as="h3" className="text-sm font-semibold text-grey-800">
                  {t("unduhEbook.tercatatJudul")}
                </CardTitle>
                <CardDescription className="mx-auto max-w-sm text-xs font-medium leading-relaxed text-grey-600">
                  {(() => {
                    // Gunakan interpolasi untuk nama, akun, judul dengan tetap menjaga bold pada nama
                    const placeholder = "__NAMA__";
                    const template = t("unduhEbook.tercatatIsi", {
                      nama: placeholder,
                      akun: tercatat.akunChess,
                      judul: tercatat.judul,
                    });
                    const [awal, akhir] = template.split(placeholder);
                    return (
                      <>
                        {awal}
                        <strong className="border border-slate-300 bg-grey-100 px-1.5 py-0.5 font-semibold">{tercatat.nama}</strong>
                        {akhir}
                      </>
                    );
                  })()}
                </CardDescription>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 bg-white p-6 pt-0">
              <a
                href={urlEbook(buku.file, {
                  unduh: true,
                  tiket: tercatat.tiketUnduh,
                })}
                download
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 text-xs font-semibold text-white shadow-none transition-colors hover:bg-blue-400"
              >
                <IkonUnduh />
                {t("unduhEbook.unduhLagi")}
              </a>
              <Button
                variant="ghost"
                onClick={onTutup}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white text-xs font-semibold text-grey-800 shadow-none transition-colors hover:bg-grey-100"
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
                <CardTitle as="h3" className="text-sm font-semibold text-grey-800">
                  {t("unduhEbook.mintaJudul")}
                </CardTitle>
                <CardDescription className="mx-auto max-w-sm text-xs font-medium leading-relaxed text-grey-600">
                  {(() => {
                    const opsiPlaceholder = "__OPSI__";
                    const template = t("unduhEbook.mintaIsi", { opsi: opsiPlaceholder });
                    const [awal, akhir] = template.split(opsiPlaceholder);
                    return (
                      <>
                        {awal}
                        <strong className="border border-slate-300 bg-grey-100 px-1.5 py-0.5 font-semibold">{t("unduhEbook.mintaIsiOpsi")}</strong>
                        {akhir}
                      </>
                    );
                  })()}
                </CardDescription>
              </div>
            </CardContent>
            <CardFooter className="bg-white p-6 pt-0">
              <Button
                onClick={onTutup}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white text-xs font-semibold text-grey-800 shadow-none transition-colors hover:bg-grey-100"
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
                <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-600 bg-red-50 p-3 text-xs font-semibold text-red-700 shadow-none">
                  <span className="h-2 w-2 flex-none rounded-full bg-red-600" />
                  <span>{galat}</span>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <Field label={t("unduhEbook.labelNamaAsli")} htmlFor="unduh-nama">
                  <Input
                    ref={namaRef}
                    id="unduh-nama"
                    name="nama"
                    autoComplete="name"
                    maxLength={80}
                    placeholder={t("unduhEbook.placeholderNama")}
                    value={nama}
                    onChange={(e) => {
                      setNama(e.target.value);
                      bersihkanGalat();
                    }}
                    className="h-10 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-grey-800 shadow-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-slate-400 placeholder:font-normal"
                  />
                </Field>

                <Field label={t("unduhEbook.labelAkunChess")} htmlFor="unduh-akun">
                  <Input
                    id="unduh-akun"
                    name="akunChess"
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={25}
                    placeholder={t("unduhEbook.placeholderAkun")}
                    value={akun}
                    onChange={(e) => {
                      setAkun(e.target.value);
                      bersihkanGalat();
                    }}
                    className="h-10 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-grey-800 shadow-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-slate-400 placeholder:font-normal"
                  />
                </Field>

                {punyaKode && (
                  <Field label={t("unduhEbook.labelKodeAkses")} htmlFor="unduh-kode">
                    <Input
                      id="unduh-kode"
                      ref={kodeRef}
                      name="kode"
                      autoComplete="off"
                      spellCheck="false"
                      maxLength={12}
                      placeholder={t("unduhEbook.placeholderKode")}
                      value={kode}
                      onChange={(e) => {
                        setKode(e.target.value.toUpperCase());
                        bersihkanGalat();
                      }}
                      className="h-10 rounded-lg border border-slate-300 bg-white text-xs font-mono font-semibold tracking-wider text-grey-800 shadow-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal"
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
                className={`h-10 w-full gap-2 rounded-lg border border-primary bg-primary text-xs font-semibold text-white shadow-none transition-colors hover:bg-blue-400 disabled:opacity-50 ${salah ? "border-red-600 bg-white text-red-600" : "text-white"}`}
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
              <div className="text-center text-xs font-medium text-grey-600">
                {punyaKode ? (
                  <>
                    {t("unduhEbook.belumPunyaKode")}{" "}
                    <button
                      type="button"
                      onClick={() => gantiMode(false)}
                      className="font-semibold underline underline-offset-4 hover:text-primary"
                    >
                      {t("unduhEbook.mintaKodeDiSini")}
                    </button>
                  </>
                ) : (
                  <>
                    {t("unduhEbook.sudahPunyaKode")}{" "}
                    <button
                      type="button"
                      onClick={() => gantiMode(true)}
                      className="font-semibold underline underline-offset-4 hover:text-primary"
                    >
                      {t("unduhEbook.masukkanKode")}
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
