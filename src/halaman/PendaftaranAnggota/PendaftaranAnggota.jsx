import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import {
  daftarDenganChessCom,
  normalisasiUsername,
  hpValid,
  formatHp,
  kategoriUmur,
  hitungUmur,
} from "../../lib/chessAnggota.js";
import { segarkanAnggota } from "../../lib/anggotaBersama.js";
import { useI18n } from "../../lib/i18n.jsx";
import VerifikasiAkun from "../../components/VerifikasiAkun.jsx";

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
}) {
  const idGalat = galat ? `${nama}-galat` : undefined;
  return (
    <label className="flex flex-col gap-1.5 text-sm text-grey-800">
      <span className="font-medium">
        {label}
        {wajib && <span className="text-red-600"> *</span>}
        {!wajib && <span className="text-slate-400"> (opsional)</span>}
      </span>
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
        className={`border-0 border-b border-solid outline-none py-2 text-base bg-transparent transition-colors focus:border-primary ${
          galat ? "border-red-500" : "border-grey-200"
        }`}
      />
      {catatan && !galat && (
        <span className="text-xs leading-5 text-slate-500">{catatan}</span>
      )}
      {galat && (
        <span id={idGalat} className="text-xs leading-5 text-red-600">
          {galat}
        </span>
      )}
    </label>
  );
}

export default function PendaftaranAnggota() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState(AWAL);
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

  const validasiLokal = () => {
    const g = {};
    if (!normalisasiUsername(form.username))
      g.username = t("pendaftaran.galatUsername");
    if (form.namaLengkap.trim().split(/\s+/).length < 2)
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

  const hariIni = new Date().toISOString().slice(0, 10);

  return (
    <HalamanIsi
      title={t("pendaftaran.judul")}
      parent={t("nav.tentangKami")}
      parentPath="/tentang-kami"
      description={t("pendaftaran.deskripsi")}
      next={{ to: "/tentang-kami/struktur-grup-catur#keanggotaan", judul: t("pendaftaran.nextJudul") }}
    >
      <PageArtikel title={t("pendaftaran.artikel")}>
        <p className="ql-align-justify">{t("pendaftaran.intro")}</p>

        <div className="not-prose my-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-slate-900">
            {t("pendaftaran.privasiJudul")}
          </p>
          <p className="mt-1">{t("pendaftaran.privasiIsi")}</p>
        </div>

        <form className="not-prose flex flex-col gap-8" onSubmit={onSubmit} noValidate>
          {/* --- Akun --- */}
          <fieldset className="flex flex-col gap-5 border-0 p-0">
            <legend className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
              {t("pendaftaran.grupAkun")}
            </legend>
            <Isian
              nama="username"
              label={t("pendaftaran.label")}
              nilai={form.username}
              onChange={ubah}
              galat={galat.username}
              wajib
              autoComplete="username"
              placeholder={t("pendaftaran.placeholder")}
              catatan={t("pendaftaran.catatanUsername")}
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
            <legend className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
              {t("pendaftaran.grupDiri")}
            </legend>
            <Isian
              nama="namaLengkap"
              label={t("pendaftaran.labelNama")}
              nilai={form.namaLengkap}
              onChange={ubah}
              galat={galat.namaLengkap}
              wajib
              autoComplete="name"
              placeholder={t("pendaftaran.phNama")}
              catatan={t("pendaftaran.catatanNama")}
            />
            <Isian
              nama="panggilan"
              label={t("pendaftaran.labelPanggilan")}
              nilai={form.panggilan}
              onChange={ubah}
              galat={galat.panggilan}
              wajib
              autoComplete="nickname"
              placeholder={t("pendaftaran.phPanggilan")}
              catatan={t("pendaftaran.catatanPanggilan")}
            />
            <Isian
              nama="tanggalLahir"
              label={t("pendaftaran.labelLahir")}
              nilai={form.tanggalLahir}
              onChange={ubah}
              galat={galat.tanggalLahir}
              wajib
              tipe="date"
              max={hariIni}
              autoComplete="bday"
              catatan={
                kategori
                  ? `${t("pendaftaran.kategori")}: ${kategori} (${umur} ${t("pendaftaran.tahun")})`
                  : t("pendaftaran.catatanLahir")
              }
            />
            <Isian
              nama="kota"
              label={t("pendaftaran.labelKota")}
              nilai={form.kota}
              onChange={ubah}
              galat={galat.kota}
              wajib
              autoComplete="address-level2"
              placeholder={t("pendaftaran.phKota")}
              catatan={t("pendaftaran.catatanKota")}
            />
          </fieldset>

          {/* --- Kontak --- */}
          <fieldset className="grid gap-5 border-0 p-0 md:grid-cols-2">
            <legend className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
              {t("pendaftaran.grupKontak")}
            </legend>
            <Isian
              nama="hp"
              label={t("pendaftaran.labelHp")}
              nilai={form.hp}
              onChange={ubah}
              galat={galat.hp}
              wajib
              tipe="tel"
              autoComplete="tel"
              placeholder={t("pendaftaran.phHp")}
              catatan={
                hpValid(form.hp)
                  ? `${t("pendaftaran.terbaca")}: ${formatHp(form.hp)}`
                  : t("pendaftaran.catatanHp")
              }
            />
            <Isian
              nama="dana"
              label={t("pendaftaran.labelDana")}
              nilai={form.dana}
              onChange={ubah}
              galat={galat.dana}
              tipe="tel"
              placeholder={t("pendaftaran.phDana")}
              catatan={
                form.dana && hpValid(form.dana)
                  ? `${t("pendaftaran.terbaca")}: ${formatHp(form.dana)}`
                  : t("pendaftaran.catatanDana")
              }
            />
            <Isian
              nama="email"
              label={t("pendaftaran.labelEmail")}
              nilai={form.email}
              onChange={ubah}
              galat={galat.email}
              tipe="email"
              autoComplete="email"
              placeholder={t("pendaftaran.phEmail")}
              catatan={t("pendaftaran.catatanEmail")}
            />
            <Isian
              nama="klub"
              label={t("pendaftaran.labelKlub")}
              nilai={form.klub}
              onChange={ubah}
              placeholder={t("pendaftaran.phKlub")}
              catatan={t("pendaftaran.catatanKlub")}
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
                className="mt-1 h-4 w-4 shrink-0 accent-[#0B2F9F]"
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
                  ? "border-red-300 bg-red-50 text-red-900"
                  : "border-amber-300 bg-amber-50 text-amber-900"
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
      </PageArtikel>
    </HalamanIsi>
  );
}
