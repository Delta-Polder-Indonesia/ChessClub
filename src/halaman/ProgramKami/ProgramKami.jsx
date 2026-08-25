import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Enam program unggulan — dipasangkan dengan ikon bidak pada
 * public/images/IconBidak. `judul` dan `isi` merujuk kunci terjemahan
 * (ID/EN) agar seluruh teks tetap dwibahasa.
 */
const DAFTAR_PROGRAM = [
  {
    ikon: "icon-Pawn.svg",
    judul: "program.kartu.kelas.judul",
    isi: "program.kartu.kelas.deskripsi",
  },
  {
    ikon: "icon-Knight.svg",
    judul: "program.kartu.clinic.judul",
    isi: "program.kartu.clinic.deskripsi",
  },
  {
    ikon: "icon-Bishop.svg",
    judul: "program.kartu.sekolah.judul",
    isi: "program.kartu.sekolah.deskripsi",
  },
  {
    ikon: "icon-Rook.svg",
    judul: "program.kartu.panduan.judul",
    isi: "program.kartu.panduan.deskripsi",
  },
  {
    ikon: "icon-Queen.svg",
    judul: "program.kartu.simultan.judul",
    isi: "program.kartu.simultan.deskripsi",
  },
  {
    ikon: "icon-chessboard.svg",
    judul: "program.kartu.tekaTeki.judul",
    isi: "program.kartu.tekaTeki.deskripsi",
  },
];

export default function ProgramKami() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("program.judul")}
      description={t("program.deskripsi")}
      next={{
        to: "/program-kami/sekolah-catur/cara-bermain-catur",
        judul: t("nav.caraBermainCatur"),
      }}
    >
      <PageArtikel title={t("program.artikel")}>
        <p className="ql-align-justify">{t("program.p1")}</p>
        <p className="ql-align-justify">{t("program.p2")}</p>

        <h3>{t("program.programJudul")}</h3>

        <div className="program-unggulan">
          {DAFTAR_PROGRAM.map((p) => (
            <article key={p.ikon} className="program-kartu">
              <div className="program-ikon">
                <img
                  src={gambar(`/images/IconBidak/${p.ikon}`)}
                  alt=""
                  draggable="false"
                  decoding="async"
                  loading="lazy"
                />
              </div>
              <div className="program-kartu-isi">
                <h4>{t(p.judul)}</h4>
                <p>{t(p.isi)}</p>
              </div>
            </article>
          ))}
        </div>

        <h3>{t("program.h1")}</h3>
        <p>
          {t("program.p3a")}{" "}
          <Link to="/program-kami/sekolah-catur/cara-bermain-catur">
            {t("nav.caraBermainCatur")}
          </Link>{" "}
          {t("program.p3b")}{" "}
          <Link to="/teka-teki">{t("tekaTeki.judul")}</Link>{" "}
          {t("program.p3c")}
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
