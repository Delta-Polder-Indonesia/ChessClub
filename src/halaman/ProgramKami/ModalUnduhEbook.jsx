import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.jsx";
import { tebusUnduhanEbook, ajukanMintaEbook } from "../../lib/api/ebook.js";
import { urlEbook } from "../../lib/asets.js";
import { useI18n } from "../../lib/i18n.jsx";

function IkonTutup() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IkonCentang() {
  return (
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="1.6" />
      <path d="M8 12.5L11 15.5L16 9.5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IkonKirim() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IkonUnduh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3V15M12 15L8 11M12 15L16 11M3 17V19C3 19.55 3.45 20 4 20H20C20.55 20 21 19.55 21 19V17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/**
 * Popup gerbang unduh e-book — model perpustakaan.
 *
 * Markup panel ini mengikuti pola shadcn/ui Tabs + Card: setiap alur punya
 * tab yang jelas, isi formulir memakai Label/Input, dan aksi utama memakai
 * Button. Komponennya lokal agar tidak perlu menambah dependensi UI baru.
 *
 * Dua alurnya:
 *   - "Ajukan kode": pengunjung yang belum punya kode mengirim permintaan
 *     (nama asli + akun Chess.com) ke pengurus.
 *   - "Sudah punya kode": peminjam memasukkan kode dari pengurus; bila sah,
 *     unduhan tercatat dan PDF dikirim ke browser.
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
  }

  async function kirimPermintaan(e) {
    e.preventDefault();
    if (sibuk) return;
    setGalat("");

    if (!nama.trim() || !akun.trim()) {
      setGalat(t("unduhEbook.lengkapiMinta"));
      return;
    }

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
      return;
    }

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
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <Tabs value={tab} onValueChange={pilihTab} className="w-full max-w-[480px]">
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby="judul-unduh-ebook"
          className="overflow-hidden shadow-2xl"
        >
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 p-5">
            <div className="min-w-0">
              <CardTitle as="h2" id="judul-unduh-ebook" className="text-[17px] text-slate-900">
                {t("unduhEbook.judul")}
              </CardTitle>
              <CardDescription className="mt-1 truncate text-[12px] text-slate-500">
                {buku.judul}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onTutup}
              aria-label={t("unduhEbook.tutup")}
              className="h-9 w-9 flex-none"
            >
              <IkonTutup />
            </Button>
          </CardHeader>

          {tercatat ? (
            <>
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <IkonCentang />
                <CardTitle as="h3" className="text-[15px] text-slate-900">
                  {t("unduhEbook.tercatatJudul")}
                </CardTitle>
                <CardDescription className="text-[12px] leading-5 text-slate-600">
                  Tercatat di buku kunjungan: <strong>{tercatat.nama}</strong>{" "}
                  ({tercatat.akunChess}) mengunduh “{tercatat.judul}”.
                </CardDescription>
              </CardContent>
              <CardFooter className="flex-col gap-2 p-6 pt-0">
                <a
                  href={urlEbook(buku.file, { unduh: true })}
                  download
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0B2F9F] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0a2a8e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2F9F]"
                >
                  <IkonUnduh />
                  {t("unduhEbook.unduhLagi")}
                </a>
                <Button variant="ghost" onClick={onTutup} className="w-full">
                  {t("unduhEbook.tutup")}
                </Button>
              </CardFooter>
            </>
          ) : mintaTerkirim ? (
            <>
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <IkonCentang />
                <CardTitle as="h3" className="text-[15px] text-slate-900">
                  {t("unduhEbook.mintaJudul")}
                </CardTitle>
                <CardDescription className="text-[12px] leading-5 text-slate-600">
                  Tunggu kode akses dikirimkan oleh pengurus, misalnya lewat grup
                  WhatsApp. Setelah kodenya diterima, buka popup ini lagi lalu
                  pilih <strong>“Sudah punya kode”</strong> untuk mulai mengunduh.
                </CardDescription>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button onClick={onTutup} className="w-full">
                  {t("unduhEbook.mengerti")}
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardContent className="p-5 pt-5">
              {galat && (
                <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-medium leading-5 text-red-700">
                  {galat}
                </p>
              )}

              <TabsList aria-label="Cara mendapatkan kode akses" className="grid h-auto w-full grid-cols-2">
                <TabsTrigger value="minta">Belum punya kode</TabsTrigger>
                <TabsTrigger value="kode">Sudah punya kode</TabsTrigger>
              </TabsList>

              <TabsContent value="minta" className="mt-5">
                <form className="grid gap-5" onSubmit={kirimPermintaan} noValidate>
                  <p className="m-0 text-[12px] leading-5 text-slate-600">
                    Permintaanmu diteruskan ke pengurus. Setelah disetujui, kode
                    akses dikirimkan kepadamu dan berlaku 1 jam.
                  </p>

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
                    />
                  </Field>

                  <CardFooter className="p-0 pt-1">
                    <Button type="submit" disabled={sibuk} className="w-full">
                      <IkonKirim />
                      {sibuk ? t("unduhEbook.mengirim") : t("unduhEbook.kirimPermintaan")}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>

              <TabsContent value="kode" className="mt-5">
                <form className="grid gap-5" onSubmit={tebusDanUnduh} noValidate>
                  <p className="m-0 text-[12px] leading-5 text-slate-600">
                    Masukkan kode dari pengurus. Setiap unduhan tercatat seperti
                    buku kunjungan perpustakaan.
                  </p>

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
                      className="font-mono tracking-wide"
                    />
                  </Field>

                  <CardFooter className="p-0 pt-1">
                    <Button type="submit" disabled={sibuk} className="w-full">
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
