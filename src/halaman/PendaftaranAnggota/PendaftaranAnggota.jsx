import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import {
  daftarDenganChessCom,
  normalisasiUsername,
  normalisasiNama,
  hpValid,
  hitungUmur,
} from "../../lib/api/index.js";
import { segarkanAnggota } from "../../lib/anggotaBersama.js";
import { useI18n } from "../../lib/i18n.jsx";
import ContohTampilanPendaftaran from "./ContohTampilanPendaftaran.jsx";

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
    const data = { ...form, setuju: true };
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
      <PageArtikel lebar>
        <ContohTampilanPendaftaran
          form={form}
          status={status}
          pesan={pesan}
          verifikasi={verifikasi}
          statusVerifikasi={statusVerifikasi}
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
        />
      </PageArtikel>
    </HalamanIsi>
  );
}
