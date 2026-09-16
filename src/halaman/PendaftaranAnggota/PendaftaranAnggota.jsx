import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import {
  daftarDenganChessCom,
  normalisasiUsername,
  normalisasiNama,
  hpValid,
  hitungUmur,
} from "../../lib/api/index.js";
import { segarkanAnggota } from "../../lib/anggotaBersama.js";
import { useI18n } from "../../lib/i18n.jsx";
import TampilanPendaftaran from "./TampilanPendaftaran.jsx";
import { URL_KLUB } from "./komponen/pendaftaran.js";

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

export default function PendaftaranAnggota() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [parameter] = useSearchParams();
  const [form, setForm] = useState(() => ({
    ...AWAL,
    username: normalisasiUsername(parameter.get("username")),
  }));
  const [status, setStatus] = useState("idle");
  const [pesan, setPesan] = useState("");
  const [verifikasi, setVerifikasi] = useState(null);
  const [statusVerifikasi, setStatusVerifikasi] = useState("idle");

  useEffect(() => {
    try {
      const tersimpan = sessionStorage.getItem("kci-hasil-verifikasi");
      if (!tersimpan) return;
      sessionStorage.removeItem("kci-hasil-verifikasi");
      const data = JSON.parse(tersimpan);
      if (data.sukses && data.username && data.tiket) {
        setVerifikasi({ username: data.username, tiket: data.tiket });
        setForm((f) => ({ ...f, username: data.username }));
        setStatusVerifikasi("success");
      } else if (data.sebab) {
        setPesan(`Verifikasi Chess.com gagal: ${data.sebab}`);
        setStatus("gagal");
        setStatusVerifikasi("error");
      }
    } catch {
      /* abaikan hasil OAuth yang tidak sah */
    }
  }, []);

  const ubah = (nama, nilai) => {
    setForm((f) => ({ ...f, [nama]: nilai }));
    if (nama === "username" && normalisasiUsername(nilai) !== verifikasi?.username) {
      setVerifikasi(null);
    }
  };

  const validasiLokal = (data = form) => {
    const g = {};
    const usia = hitungUmur(data.tanggalLahir);
    if (!normalisasiUsername(data.username))
      g.username = t("pendaftaran.galatUsername");
    if (normalisasiNama(data.namaLengkap).split(" ").filter(Boolean).length < 2)
      g.namaLengkap = t("pendaftaran.galatNama");
    if (!data.panggilan.trim()) g.panggilan = t("pendaftaran.galatPanggilan");
    if (!hpValid(data.hp)) g.hp = t("pendaftaran.galatHp");
    if (data.dana.trim() && !hpValid(data.dana))
      g.dana = t("pendaftaran.galatDana");
    if (!data.kota.trim()) g.kota = t("pendaftaran.galatKota");
    if (!data.tanggalLahir) g.tanggalLahir = t("pendaftaran.galatLahir");
    else if (usia != null && (usia < 5 || usia > 100))
      g.tanggalLahir = t("pendaftaran.galatLahirAneh");
    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email))
      g.email = t("pendaftaran.galatEmail");
    if (!data.setuju) g.setuju = t("pendaftaran.galatSetuju");
    return g;
  };

  const kirim = async () => {
    setPesan("");
    const data = form;
    const galat = validasiLokal(data);
    if (Object.keys(galat).length) {
      setStatus("gagal");
      setPesan(Object.values(galat)[0] || t("pendaftaran.periksaIsian"));
      return false;
    }

    setStatus("mengirim");
    try {
      await daftarDenganChessCom({
        ...data,
        username: normalisasiUsername(data.username),
        tiketVerifikasi:
          verifikasi?.username === normalisasiUsername(data.username)
            ? verifikasi.tiket
            : undefined,
      });
      setStatus("sukses");
      segarkanAnggota().catch(() => {});
      window.setTimeout(
        () => navigate("/tentang-kami/struktur-grup-catur#keanggotaan"),
        900
      );
      return true;
    } catch (err) {
      setStatus("gagal");
      setPesan(err.message);
      return false;
    }
  };

  const reset = () => {
    setForm(AWAL);
    setVerifikasi(null);
    setStatusVerifikasi("idle");
    setStatus("idle");
    setPesan("");
  };

  return (
    <HalamanIsi
      title={t("pendaftaran.judul")}
      parent={t("nav.tentangKami")}
      parentPath="/tentang-kami"
      description={t("pendaftaran.deskripsi")}
      next={{ to: "/tentang-kami/struktur-grup-catur#keanggotaan", judul: t("pendaftaran.nextJudul") }}
    >
      <TampilanPendaftaran
        form={form}
        status={status}
        pesan={pesan}
        verifikasi={verifikasi}
        statusVerifikasi={statusVerifikasi}
        teksSetuju={t("pendaftaran.setuju")}
        onUbah={ubah}
        onTerverifikasi={(hasil) => {
          setVerifikasi(hasil);
          setStatusVerifikasi("success");
          setForm((f) => ({ ...f, username: hasil.username }));
          setStatus("idle");
          setPesan("");
        }}
        onBatalVerifikasi={() => {
          setVerifikasi(null);
          setStatusVerifikasi("idle");
        }}
        onKirim={kirim}
        onReset={reset}
        validasiLokal={validasiLokal}
      >
        <footer className="z-10 w-full max-w-4xl pb-2">
          <div className="flex flex-col items-center gap-3 border-t border-gray-200 pt-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="order-2 text-[11px] leading-relaxed text-gray-500 sm:order-1">
              © {new Date().getFullYear()} Komunitas Catur Indonesia · Blunder Skuad.
              Pendaftaran diproses oleh pengurus klub.
            </p>
            <nav className="order-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium text-gray-600 sm:order-2">
              <a
                href={URL_KLUB}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0B2F9F] hover:underline"
              >
                Klub Chess.com
              </a>
              <Link to="/bantuan" className="hover:text-[#0B2F9F] hover:underline">
                {t("bantuan.judul")}
              </Link>
              <Link to="/privasi" className="hover:text-[#0B2F9F] hover:underline">
                {t("privasi.judul")}
              </Link>
              <Link to="/ketentuan" className="hover:text-[#0B2F9F] hover:underline">
                {t("ketentuan.judul")}
              </Link>
            </nav>
          </div>
        </footer>
      </TampilanPendaftaran>
    </HalamanIsi>
  );
}
