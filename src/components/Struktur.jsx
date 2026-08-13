import { useI18n } from "../lib/i18n.jsx";

function Box({ children, outline = false }) {
  return (
    <div
      className={`text-sm font-semibold px-5 py-3 text-center min-w-[160px] max-w-[220px] ${
        outline
          ? "border-2 border-solid border-primary text-primary bg-white"
          : "bg-primary text-white"
      }`}
    >
      {children}
    </div>
  );
}

function LineV() {
  return <div className="w-px h-6 bg-slate-300 mx-auto" />;
}

function LineH({ children }) {
  return (
    <div className="flex flex-col items-center">
      <div className="h-px bg-slate-300 w-full max-w-[520px]" />
      <div className="flex items-start gap-6 md:gap-10 justify-center flex-wrap pt-0">
        {children}
      </div>
    </div>
  );
}

export default function Struktur() {
  const { t } = useI18n();
  const divisi = [
    t("struktur.divisiTurnamen"),
    t("struktur.divisiPembinaan"),
    t("struktur.divisiMedia"),
    t("struktur.divisiKeanggotaan"),
    t("struktur.divisiTeknologi"),
  ];

  return (
    <section id="struktur-pengurus" className="w-full relative bg-transparent">
      {/* Teks & judul */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 xl:pb-16 pt-24 md:pt-24 xl:pt-24 ml-0 mr-0">
        <div className="relative w-full mx-auto md:max-w-[1024px]">
          <h2 className="focus:outline-none focus:ring-0 font-semibold text-3xl md:text-3xl text-black mb-6">
            {t("struktur.judul")}
          </h2>
          <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
            <div className="relative z-[1] prose-kci max-w-none">
              <p>{t("struktur.p1")}</p>
              <p>{t("struktur.p2")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bagan struktur */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-20 pr-6 md:pr-8 xl:pr-20 pb-6 md:pb-8 xl:pb-16 ml-0 mr-0">
        <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] border-guide flex flex justify-center items-center">
          <div className="flex flex-col justify-center items-center w-full">
            <div className="w-full overflow-x-auto">
              <div className="min-w-[560px] flex flex-col items-center py-4">
                <div className="flex items-start gap-8 justify-center flex-wrap">
                  <Box outline>{t("struktur.dewanPembina")}</Box>
                  <Box outline>{t("struktur.dewanPenasihat")}</Box>
                </div>
                <LineV />
                <Box>{t("struktur.ketuaUmum")}</Box>
                <LineV />
                <div className="flex items-start gap-8 justify-center flex-wrap">
                  <div className="flex flex-col items-center">
                    <LineV />
                    <Box>{t("struktur.sekretarisJenderal")}</Box>
                  </div>
                  <div className="flex flex-col items-center">
                    <LineV />
                    <Box>{t("struktur.bendaharaUmum")}</Box>
                  </div>
                </div>
                <LineH>
                  {divisi.map((d) => (
                    <div key={d} className="flex flex-col items-center">
                      <LineV />
                      <Box>{d}</Box>
                    </div>
                  ))}
                </LineH>
              </div>
            </div>
            <p className="text-sm font-normal text-gray-500 mt-2">
              {t("struktur.caption")}
            </p>
          </div>
        </div>
      </div>

      {/* Teks penutup */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 ml-0 mr-0">
        <div className="relative w-full mx-auto md:max-w-[1024px]">
          <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
            <div className="relative z-[1] prose-kci max-w-none">
              <p className="ql-align-justify">{t("struktur.p3")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
