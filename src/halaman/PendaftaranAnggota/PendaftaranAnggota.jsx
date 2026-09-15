import {
  AtSign,
  Cake,
  Contact,
  Globe,
  Mail,
  MapPin,
  Phone,
  Smartphone,
  User,
  Users,
} from "lucide-react";
import ContohTampilanPendaftaran from "./ContohTampilanPendaftaran.jsx";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { ImageCard } from "../../components/ui/image-card.jsx";
import {
  daftarDenganChessCom,
  normalisasiUsername,
  normalisasiNama,
  hpValid,
  formatHp,
  kategoriUmur,
  hitungUmur,
} from "../../lib/api/index.js";
import { segarkanAnggota } from "../../lib/anggotaBersama.js";
import { useI18n } from "../../lib/i18n.jsx";
import { hariIniLokal } from "../../lib/waktu.js";
import VerifikasiAkun from "../../components/VerifikasiAkun.jsx";

const URL_KLUB = "https://www.chess.com/club/blunder-skuad";

const AWAL = {
  username: "",
  namaLengkap: "",
  panggilan: "",
  hp: "",
  dana: "",
  kota: "",
  tanggalLahir: "",
  email: "",
  klub: "",
  setuju: false,
};

/** Ikon centang untuk field yang sudah terpenuhi. */
function IconCentang({ className }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-6.22 6.286a1 1 0 0 1-1.42.004l-3.53-3.53a1 1 0 0 1 1.415-1.414l2.82 2.82 5.51-5.56a1 1 0 0 1 1.41-.01Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Satu baris isian dengan label, catatan, dan pesan galat. */
function Isian({
  nama,
  label,
  nilai,
  onChange,
  galat,
  catatan,
  wajib = false,
  tipe = "text",
  placeholder = "",
  autoComplete,
  max,
  terpenuhi,
  ikon,
}) {
  const idGalat = galat ? `${nama}-galat` : undefined;
  const warnaBatas = galat
    ? "border-red-500"
    : terpenuhi === true
      ? "border-emerald-600"
      : "border-grey-200";
  return (
    <label className="flex flex-col gap-1.5 text-sm text-grey-800">
      <span className="font-medium">
        {label}
        {wajib && <span className="text-red-600"> *</span>}
        {!wajib && <span className="text-slate-400"> (opsional)</span>}
      </span>
      <div className="relative">
        {ikon && (
          <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-400">
            {ikon}
          </span>
        )}
        <input
          name={nama}
          type={tipe}
          value={nilai}
          max={max}
          onChange={(e) => onChange(nama, e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={galat ? "true" : undefined}
          aria-describedby={idGalat}
          className={`w-full border-0 border-b border-solid outline-none bg-transparent py-2 text-base transition-colors focus:border-primary ${
            terpenuhi === true ? "pr-7" : ""
          } ${ikon ? "pl-7" : ""} ${warnaBatas}`}
        />
        {terpenuhi === true && (
          <IconCentang className="pointer-events-none absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
        )}
      </div>
      {catatan && !galat && (
        <span className="text-xs leading-5 text-slate-500">{catatan}</span>
      )}
      {galat && (
        <span id={idGalat} role="alert" className="text-xs leading-5 text-red-600">
          {galat}
        </span>
      )}
    </label>
  );
}

export default function PendaftaranAnggota() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [parameter] = useSearchParams();
  const [form, setForm] = useState(() => ({
    ...AWAL,
    username: normalisasiUsername(parameter.get("username")),
  }));
  const [galat, setGalat] = useState({});
  const [status, setStatus] = useState("idle");
  const [pesan, setPesan] = useState("");
  const [diblokir, setDiblokir] = useState(false);
  const [verifikasi, setVerifikasi] = useState(null);

  /* Tangkap hasil verifikasi dari sessionStorage (aman, tidak di URL). */
  useEffect(() => {
    try {
      const tersimpan = sessionStorage.getItem("kci-hasil-verifikasi");
      if (!tersimpan) return;
      sessionStorage.removeItem("kci-hasil-verifikasi");
      const data = JSON.parse(tersimpan);
      if (data.sukses && data.username && data.tiket) {
        setVerifikasi({ username: data.username, tiket: data.tiket });
        setForm((f) => ({ ...f, username: data.username }));
      } else if (data.sebab) {
        setPesan(`Verifikasi Chess.com gagal: ${data.sebab}`);
        setStatus("gagal");
      }
    } catch {
      /* abaikan */
    }
  }, []);

  const ubah = (nama, nilai) => {
    setForm((f) => ({ ...f, [nama]: nilai }));
    setGalat((g) => (g[nama] ? { ...g, [nama]: undefined } : g));
  };

  const umur = useMemo(() => hitungUmur(form.tanggalLahir), [form.tanggalLahir]);
  const kategori = useMemo(
    () => kategoriUmur(form.tanggalLahir),
    [form.tanggalLahir]
  );

  /* Status live per field: true=terpenuhi, false=belum, null=opsional kosong. */
  const statusTerpenuhi = (nama) => {
    switch (nama) {
      case "username":
        return Boolean(normalisasiUsername(form.username));
      case "namaLengkap":
        return normalisasiNama(form.namaLengkap).split(" ").filter(Boolean).length >= 2;
      case "panggilan":
        return Boolean(form.panggilan.trim());
      case "tanggalLahir":
        return Boolean(form.tanggalLahir) && umur != null && umur >= 5 && umur <= 100;
      case "kota":
        return Boolean(form.kota.trim());
      case "hp":
        return hpValid(form.hp);
      case "dana":
        return form.dana.trim() ? hpValid(form.dana) : null;
      case "email":
        return form.email.trim()
          ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)
          : null;
      case "klub":
        return form.klub.trim() ? true : null;
      default:
        return null;
    }
  };

  const validasiLokal = () => {
    const g = {};
    if (!normalisasiUsername(form.username))
      g.username = t("pendaftaran.galatUsername");
    if (normalisasiNama(form.namaLengkap).split(" ").filter(Boolean).length < 2)
      g.namaLengkap = t("pendaftaran.galatNama");
    if (!form.panggilan.trim()) g.panggilan = t("pendaftaran.galatPanggilan");
    if (!hpValid(form.hp)) g.hp = t("pendaftaran.galatHp");
    if (form.dana.trim() && !hpValid(form.dana))
      g.dana = t("pendaftaran.galatDana");
    if (!form.kota.trim()) g.kota = t("pendaftaran.galatKota");
    if (!form.tanggalLahir) g.tanggalLahir = t("pendaftaran.galatLahir");
    else if (umur != null && (umur < 5 || umur > 100))
      g.tanggalLahir = t("pendaftaran.galatLahirAneh");
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email))
      g.email = t("pendaftaran.galatEmail");
    if (!form.setuju) g.setuju = t("pendaftaran.galatSetuju");
    return g;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setPesan("");
    setDiblokir(false);

    const g = validasiLokal();
    if (Object.keys(g).length) {
      setGalat(g);
      setStatus("gagal");
      setPesan(t("pendaftaran.periksaIsian"));
      return;
    }

    setStatus("mengirim");
    setGalat({});
    try {
      await daftarDenganChessCom({
        ...form,
        username: normalisasiUsername(form.username),
        tiketVerifikasi:
          verifikasi?.username === normalisasiUsername(form.username)
            ? verifikasi.tiket
            : undefined,
      });
      setStatus("sukses");
      // Satu pintu: kosongkan cache bersama agar anggota baru langsung
      // tampil di tab Keanggotaan MAUPUN halaman Peringkat.
      segarkanAnggota().catch(() => {});
      navigate("/tentang-kami/struktur-grup-catur#keanggotaan");
    } catch (err) {
      setStatus("gagal");
      setPesan(err.message);
      setDiblokir(Boolean(err.diblokir));
      if (err.galat) setGalat(err.galat);
    }
  };

  const hariIni = hariIniLokal();

  return (
    <HalamanIsi
      title={t("pendaftaran.judul")}
      parent={t("nav.tentangKami")}
      parentPath="/tentang-kami"
      description={t("pendaftaran.deskripsi")}
      next={{ to: "/tentang-kami/struktur-grup-catur#keanggotaan", judul: t("pendaftaran.nextJudul") }}
    >
      <PageArtikel lebar>
        {/* ═══ CONTOH tampilan ala Google — untuk disesuaikan ═══ */}
        <ContohTampilanPendaftaran />

        {/* ═══ Header Editorial / Koran ═══ */}
        <section className="-mt-8 md:-mt-12 relative w-full overflow-hidden bg-white">
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-2 md:px-8 md:py-3 xl:px-0">
            <div className="relative mb-6 border-b-4 border-double border-gray-900 pb-3 text-center">
              <p className="mb-1 font-sans text-xs font-bold tracking-widest text-gray-900 uppercase">
                {t("keanggotaan.judul")}
              </p>
              <h1 className="mb-2 text-3xl leading-none font-black tracking-tight text-gray-900 uppercase md:text-4xl">
                {t("pendaftaran.judul")}
              </h1>
              <p className="m-0 text-sm text-gray-900 italic text-center">{t("pendaftaran.deskripsi")}</p>
            </div>
          </div>
        </section>

        {/* ═══ Konten Artikel Editorial ═══ */}
        <div className="flex w-full flex-col gap-y-6 pt-1 font-serif text-sm leading-relaxed text-justify text-gray-800">
          <p className="m-0 first-letter:float-left first-letter:mr-3 first-letter:text-4xl first-letter:font-black first-letter:leading-none first-letter:text-gray-900">
            {t("pendaftaran.intro")}
          </p>

          {/* Perlu klub */}
          <div className="not-prose flex flex-col gap-4 leading-6 sm:flex-row">
            <ImageCard
              imageUrl="/images/BlunderSkuad.png"
              alt="BLUNDER SKUAD"
              caption="BLUNDER SKUAD"
              ratio="aspect-square"
              className="w-36 shrink-0 self-start sm:w-44"
            />
            <div className="flex flex-col gap-y-1">
              <p className="font-sans text-xs font-black uppercase tracking-widest text-gray-900">
                {t("pendaftaran.klubWajibJudul")}
              </p>
              <p className="m-0">{t("pendaftaran.klubWajibIsi")}</p>
              <a
                href={URL_KLUB}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-block font-sans text-xs font-bold text-gray-900 underline underline-offset-2"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("pendaftaran.gabungKlub")}
                </span>
              </a>
            </div>
          </div>

          {/* Privasi */}
          <div className="not-prose border border-gray-300 bg-white px-4 py-3 leading-6">
            <p className="font-sans text-xs font-black uppercase tracking-widest text-gray-900">
              {t("pendaftaran.privasiJudul")}
            </p>
            <p className="m-0 mt-1">{t("pendaftaran.privasiIsi")}</p>
          </div>

          <hr className="my-2 border-t border-gray-300" />

          <form className="not-prose flex flex-col gap-8" onSubmit={onSubmit} noValidate>
          {/* --- Akun --- */}
          <fieldset className="flex flex-col gap-5 border-0 p-0">
            <legend className="mb-1 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              {t("pendaftaran.grupAkun")}
            </legend>
            <Isian
              nama="username"
              label={t("pendaftaran.label")}
              nilai={form.username}
              onChange={ubah}
              galat={galat.username}
              terpenuhi={statusTerpenuhi("username")}
              wajib
              autoComplete="username"
              placeholder={t("pendaftaran.placeholder")}
              catatan={t("pendaftaran.catatanUsername")}
              ikon={<AtSign className="h-4 w-4" aria-hidden="true" />}
            />

            <VerifikasiAkun
              username={form.username}
              terverifikasi={
                verifikasi?.username === normalisasiUsername(form.username)
                  ? verifikasi
                  : null
              }
              onTerverifikasi={(v) => {
                setVerifikasi(v);
                setForm((f) => ({ ...f, username: v.username }));
                setPesan("");
              }}
              onBatal={() => setVerifikasi(null)}
            />
          </fieldset>

          {/* --- Data diri --- */}
          <fieldset className="grid gap-5 border-0 p-0 md:grid-cols-2">
            <legend className="mb-1 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              {t("pendaftaran.grupDiri")}
            </legend>
            <Isian
              nama="namaLengkap"
              label={t("pendaftaran.labelNama")}
              nilai={form.namaLengkap}
              onChange={ubah}
              galat={galat.namaLengkap}
              terpenuhi={statusTerpenuhi("namaLengkap")}
              wajib
              autoComplete="name"
              placeholder={t("pendaftaran.phNama")}
              catatan={t("pendaftaran.catatanNama")}
              ikon={<User className="h-4 w-4" aria-hidden="true" />}
            />
            <Isian
              nama="panggilan"
              label={t("pendaftaran.labelPanggilan")}
              nilai={form.panggilan}
              onChange={ubah}
              galat={galat.panggilan}
              terpenuhi={statusTerpenuhi("panggilan")}
              wajib
              autoComplete="nickname"
              placeholder={t("pendaftaran.phPanggilan")}
              catatan={t("pendaftaran.catatanPanggilan")}
              ikon={<Contact className="h-4 w-4" aria-hidden="true" />}
            />
            <Isian
              nama="tanggalLahir"
              label={t("pendaftaran.labelLahir")}
              nilai={form.tanggalLahir}
              onChange={ubah}
              galat={galat.tanggalLahir}
              terpenuhi={statusTerpenuhi("tanggalLahir")}
              wajib
              tipe="date"
              max={hariIni}
              autoComplete="bday"
              catatan={
                kategori
                  ? `${t("pendaftaran.kategori")}: ${kategori} (${umur} ${t("pendaftaran.tahun")})`
                  : t("pendaftaran.catatanLahir")
              }
              ikon={<Cake className="h-4 w-4" aria-hidden="true" />}
            />
            <Isian
              nama="kota"
              label={t("pendaftaran.labelKota")}
              nilai={form.kota}
              onChange={ubah}
              galat={galat.kota}
              terpenuhi={statusTerpenuhi("kota")}
              wajib
              autoComplete="address-level2"
              placeholder={t("pendaftaran.phKota")}
              catatan={t("pendaftaran.catatanKota")}
              ikon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            />
          </fieldset>

          {/* --- Kontak --- */}
          <fieldset className="grid gap-5 border-0 p-0 md:grid-cols-2">
            <legend className="mb-1 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              {t("pendaftaran.grupKontak")}
            </legend>
            <Isian
              nama="hp"
              label={t("pendaftaran.labelHp")}
              nilai={form.hp}
              onChange={ubah}
              galat={galat.hp}
              terpenuhi={statusTerpenuhi("hp")}
              wajib
              tipe="tel"
              autoComplete="tel"
              placeholder={t("pendaftaran.phHp")}
              catatan={
                hpValid(form.hp)
                  ? `${t("pendaftaran.terbaca")}: ${formatHp(form.hp)}`
                  : t("pendaftaran.catatanHp")
              }
              ikon={<Smartphone className="h-4 w-4" aria-hidden="true" />}
            />
            <Isian
              nama="dana"
              label={t("pendaftaran.labelDana")}
              nilai={form.dana}
              onChange={ubah}
              galat={galat.dana}
              terpenuhi={statusTerpenuhi("dana")}
              tipe="tel"
              placeholder={t("pendaftaran.phDana")}
              catatan={
                form.dana && hpValid(form.dana)
                  ? `${t("pendaftaran.terbaca")}: ${formatHp(form.dana)}`
                  : t("pendaftaran.catatanDana")
              }
              ikon={<Phone className="h-4 w-4" aria-hidden="true" />}
            />
            <Isian
              nama="email"
              label={t("pendaftaran.labelEmail")}
              nilai={form.email}
              onChange={ubah}
              galat={galat.email}
              terpenuhi={statusTerpenuhi("email")}
              tipe="email"
              autoComplete="email"
              placeholder={t("pendaftaran.phEmail")}
              catatan={t("pendaftaran.catatanEmail")}
              ikon={<Mail className="h-4 w-4" aria-hidden="true" />}
            />
            <Isian
              nama="klub"
              label={t("pendaftaran.labelKlub")}
              nilai={form.klub}
              onChange={ubah}
              terpenuhi={statusTerpenuhi("klub")}
              placeholder={t("pendaftaran.phKlub")}
              catatan={t("pendaftaran.catatanKlub")}
              ikon={<Users className="h-4 w-4" aria-hidden="true" />}
            />
          </fieldset>

          {/* --- Persetujuan --- */}
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3 text-sm leading-6 text-grey-800">
              <input
                type="checkbox"
                name="setuju"
                checked={form.setuju}
                onChange={(e) => ubah("setuju", e.target.checked)}
                className={`mt-1 h-4 w-4 shrink-0 ${form.setuju ? "accent-emerald-600" : "accent-[#0B2F9F]"}`}
              />
              <span>{t("pendaftaran.setuju")}</span>
            </label>
            {galat.setuju && (
              <p className="text-xs text-red-600">{galat.setuju}</p>
            )}
          </div>

          {/* --- Pesan status --- */}
          {status === "gagal" && pesan && (
            <p
              role="alert"
              className={`rounded-md border px-4 py-3 text-sm leading-6 ${
                diblokir
                  ? "border-red-300 bg-white text-red-900"
                  : "border-amber-300 bg-white text-amber-900"
              }`}
            >
              {pesan}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "mengirim"}
            className="self-start rounded-full border border-solid border-primary px-5 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-primary"
          >
            {status === "mengirim"
              ? t("pendaftaran.memeriksa")
              : t("pendaftaran.daftar")}
          </button>
        </form>

        <hr className="my-2 border-t border-gray-300" />

        {/* ═══ Footer Note / Penutup Editorial ═══ */}
        <div className="mt-2 border-t-2 border-b-2 border-gray-900 p-4 text-center">
          <p className="m-0 font-serif text-sm leading-relaxed text-gray-900 italic">
            {t("pendaftaran.penutup")}
          </p>
        </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}
