/**
 * Toolbar tabel Database: pemilih koleksi + filter hasil + filter waktu.
 *
 * Dipisah dari `layarDatabase.jsx` supaya layar induk tidak lagi memuat
 * seluruh markup tabel. Nama prop sengaja sama dengan nama state induk agar
 * pemindahannya tidak mengubah satu baris perilaku pun.
 */
import { useI18n } from "../../../../../lib/i18n.jsx";
import { DropdownPilih } from "./tabelPartai.jsx";

export default function ToolbarTabel({
  koleksiTerpilih,
  setKoleksiTerpilih,
  koleksiList,
  stats,
  filterHasil,
  setFilterHasil,
  filterWaktu,
  setFilterWaktu,
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
  <div className="flex flex-wrap items-center gap-2 min-w-0 flex-grow">
    {/* Pemilih Koleksi */}
    <DropdownPilih
      ariaLabel={t("analisa.basisData.koleksi")}
      nilai={koleksiTerpilih}
      onPilih={setKoleksiTerpilih}
      opsi={[
        {
          nilai: "",
          label: `${t("analisa.basisData.semuaKoleksi")} (${stats?.totalPartai || 0})`,
        },
        ...koleksiList.map((k) => ({
          nilai: k.id,
          label: `${k.label} (${k.jumlahPartai})`,
        })),
      ]}
    />

    {/* Filter Hasil */}
    <DropdownPilih
      ariaLabel={t("analisa.basisData.filterHasil")}
      nilai={filterHasil}
      onPilih={setFilterHasil}
      opsi={[
        { nilai: "", label: t("analisa.basisData.semuaHasil") },
        { nilai: "white", label: `${t("analisa.basisData.menang")} Putih` },
        { nilai: "black", label: `${t("analisa.basisData.menang")} Hitam` },
        { nilai: "draw", label: t("analisa.basisData.seri") },
      ]}
    />

    {/* Filter Waktu — sejajar kanan agar tidak meluber keluar panel */}
    <DropdownPilih
      ariaLabel={t("analisa.basisData.filterWaktu")}
      nilai={filterWaktu}
      onPilih={setFilterWaktu}
      sejajar="kanan"
      opsi={[
        { nilai: "", label: t("analisa.basisData.semuaWaktu") },
        { nilai: "blitz", label: "Blitz" },
        { nilai: "rapid", label: "Rapid" },
        { nilai: "bullet", label: "Bullet" },
        { nilai: "classical", label: "Klasik" },
      ]}
    />
  </div>
</div>
  );
}
