import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import {
  daftarDenganChessCom,
  normalisasiUsername,
} from "../../lib/chessAnggota.js";
import { useI18n } from "../../lib/i18n.jsx";

export default function PendaftaranAnggota() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("idle");
  const [pesan, setPesan] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    const uname = normalisasiUsername(username);
    if (!uname) {
      setPesan(t("pendaftaran.wajib"));
      setStatus("gagal");
      return;
    }
    setStatus("mengirim");
    setPesan("");
    try {
      await daftarDenganChessCom(uname);
      setStatus("sukses");
      navigate("/keanggotaan");
    } catch (err) {
      setStatus("gagal");
      setPesan(err.message);
    }
  };

  return (
    <HalamanIsi
      title={t("pendaftaran.judul")}
      parent={t("nav.keanggotaan")}
      parentPath="/keanggotaan"
      description={t("pendaftaran.deskripsi")}
      next={{
        to: "/keanggotaan",
        judul: t("pendaftaran.nextJudul"),
      }}
    >
      <PageArtikel title={t("pendaftaran.artikel")}>
        <p className="ql-align-justify">{t("pendaftaran.intro")}</p>

        <form className="flex flex-col gap-6 max-w-xl" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm text-grey-800">
            {t("pendaftaran.label")}
            <input
              required
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("pendaftaran.placeholder")}
              className="border-0 border-b border-solid border-grey-200 outline-none py-2 text-base bg-transparent"
            />
          </label>
          {status === "gagal" && pesan && <p>{pesan}</p>}
          <button
            type="submit"
            disabled={status === "mengirim"}
            className="self-start text-xs rounded-full px-4 py-2 border border-solid border-primary text-primary disabled:opacity-50"
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
