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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
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
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
      <Label htmlFor={htmlFor} className="font-bold text-black uppercase text-[11px] tracking-wider">
        {label}
      </Label>
      {children}
    </div>
  );
}

/**
 * Popup gerbang unduh e-book — model perpustakaan.
 */
export default function ModalUnduhEbook({ buku, onTutup }) {
  const { t } = useI18n();
  const [tab, setTab] = useState("minta");
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

  async function kirimPermintaan(e) {
    e.preventDefault();
    if (sibuk) return;
    setGalat("");

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

  async function tebusDanUnduh(e) {
    e.preventDefault();
    if (sibuk) return;
    setGalat("");

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

      // Kode sah — kirim berkasnya ke browser.
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
  }

  const pilihTab = (pilihan) => {
    setTab(pilihan);
    bersihkanGalat();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/70 p-4 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <Tabs value={tab} onValueChange={pilihTab} className="w-full max-w-[480px]">
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby="judul-unduh-ebook"
          className="rounded-lg border-2 border-black bg-white shadow-none"
        >
          <CardHeader className="flex-row items-center justify-between gap-4 border-b-2 border-black p-5 shadow-none">
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={berkasPublik("/images/color-icon/book-open-aqua.svg")}
                alt=""
                aria-hidden="true"
                className="h-10 w-10 flex-none"
              />
              <div className="min-w-0">
                <CardTitle as="h2" id="judul-unduh-ebook" className="text-lg font-black uppercase text-black">
                  {t("unduhEbook.judul")}
                </CardTitle>
                <CardDescription className="mt-0.5 truncate text-xs font-semibold text-black">
                  {buku.judul}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onTutup}
              aria-label={t("unduhEbook.tutup")}
              className="h-9 w-9 flex-none rounded-lg border-2 border-black bg-white text-black shadow-none transition-none hover:border-black hover:bg-white hover:text-black"
            >
              <IkonTutup />
            </Button>
          </CardHeader>

          {tercatat ? (
            <>
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <IkonCentang />
                <CardTitle as="h3" className="text-base font-black text-black">
                  {t("unduhEbook.tercatatJudul")}
                </CardTitle>
                <CardDescription className="text-xs leading-5 text-black">
                  Tercatat di buku kunjungan: <strong className="px-1 border border-black">{tercatat.nama}</strong>{" "}
                  ({tercatat.akunChess}) mengunduh “{tercatat.judul}”.
                </CardDescription>
              </CardContent>
              <CardFooter className="flex-col gap-2 p-6 pt-0">
                <a
                  href={urlEbook(buku.file, { unduh: true })}
                  download
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border-2 border-black px-4 text-sm font-bold text-black shadow-none transition-none"
                >
                  <IkonUnduh />
                  {t("unduhEbook.unduhLagi")}
                </a>
                <Button
                  variant="ghost"
                  onClick={onTutup}
                  className="w-full rounded-lg border-2 border-black bg-white font-bold text-black shadow-none transition-none hover:bg-white hover:text-black"
                >
                  {t("unduhEbook.tutup")}
                </Button>
              </CardFooter>
            </>
          ) : mintaTerkirim ? (
            <>
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <IkonCentang />
                <CardTitle as="h3" className="text-base font-black text-black">
                  {t("unduhEbook.mintaJudul")}
                </CardTitle>
                <CardDescription className="text-xs leading-5 text-black">
                  Tunggu kode akses dikirimkan oleh pengurus, misalnya lewat grup
                  WhatsApp. Setelah kodenya diterima, buka popup ini lagi lalu
                  pilih <strong className="px-1 border border-black">“Sudah punya kode”</strong> untuk mulai mengunduh.
                </CardDescription>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button
                  onClick={onTutup}
                  className="w-full rounded-lg border-2 border-black bg-transparent font-bold text-black shadow-none transition-none hover:bg-transparent"
                >
                  {t("unduhEbook.mengerti")}
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardContent className="p-5 pt-5">
              {galat && (
                <p role="alert" className="mb-4 rounded-lg border-2 border-black p-3 text-xs font-bold text-black shadow-none">
                  {galat}
                </p>
              )}

              <TabsList aria-label="Cara mendapatkan kode akses" className="grid h-auto w-full grid-cols-2 rounded-lg border-2 border-black bg-transparent p-1 shadow-none">
                <TabsTrigger
                  value="minta"
                  className="rounded-lg border border-transparent font-bold text-xs shadow-none data-[state=active]:border-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-none"
                >
                  Belum punya kode
                </TabsTrigger>
                <TabsTrigger
                  value="kode"
                  className="rounded-lg border border-transparent font-bold text-xs shadow-none data-[state=active]:border-black data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-none"
                >
                  Sudah punya kode
                </TabsTrigger>
              </TabsList>

              <TabsContent value="minta" className="mt-5">
                <form className="grid gap-4" onSubmit={kirimPermintaan} noValidate>
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
                      className="rounded-lg border-2 border-black bg-white text-xs font-semibold shadow-none focus-visible:ring-0 focus-visible:border-black"
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
                      className="rounded-lg border-2 border-black bg-white text-xs font-semibold shadow-none focus-visible:ring-0 focus-visible:border-black"
                    />
                  </Field>

                  <CardFooter className="p-0 pt-2">
                    <Button
                      type="submit"
                      disabled={sibuk}
                      className={`w-full gap-2 rounded-lg border-2 border-black bg-transparent font-bold shadow-none transition-none hover:bg-transparent ${salah ? "text-red-600" : "text-black"}`}
                    >
                      <IkonKirim />
                      {sibuk ? t("unduhEbook.mengirim") : t("unduhEbook.kirimPermintaan")}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>

              <TabsContent value="kode" className="mt-5">
                <form className="grid gap-4" onSubmit={tebusDanUnduh} noValidate>
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
                      className="rounded-lg border-2 border-black bg-white text-xs font-semibold shadow-none focus-visible:ring-0 focus-visible:border-black"
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
                      className="rounded-lg border-2 border-black bg-white text-xs font-semibold shadow-none focus-visible:ring-0 focus-visible:border-black"
                    />
                  </Field>

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
                      className="rounded-lg border-2 border-black bg-white text-xs font-mono font-bold tracking-wider shadow-none focus-visible:ring-0 focus-visible:border-black"
                    />
                  </Field>

                  <CardFooter className="p-0 pt-2">
                    <Button
                      type="submit"
                      disabled={sibuk}
                      className={`w-full gap-2 rounded-lg border-2 border-black bg-transparent font-bold shadow-none transition-none hover:bg-transparent ${salah ? "text-red-600" : "text-black"}`}
                    >
                      <IkonUnduh />
                      {sibuk ? t("unduhEbook.memeriksa") : t("unduhEbook.mulaiUnduh")}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </CardContent>
          )}
        </Card>
      </Tabs>
    </div>
  );
}