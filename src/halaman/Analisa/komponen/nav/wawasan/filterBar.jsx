/**
 * Baris filter Wawasan: kontrol waktu, warna bidak, dan rentang tanggal.
 * Markup murni; state-nya tetap di `layarWawasan.jsx`.
 */
import { OPSI_TANGGAL, OPSI_WAKTU, OPSI_WARNA } from "./opsiWawasan.js";

function FilterBar({ filterWaktu, filterWarna, filterTanggal, onWaktu, onWarna, onTanggal, t }) {
  const grup = [
    {
      kunci: "waktu",
      judul: t("analisa.wawasan.filterKecepatan"),
      opsi: OPSI_WAKTU,
      nilai: filterWaktu,
      onPilih: onWaktu,
    },
    {
      kunci: "warna",
      judul: t("analisa.wawasan.filterWarna"),
      opsi: OPSI_WARNA,
      nilai: filterWarna,
      onPilih: onWarna,
    },
    {
      kunci: "tanggal",
      judul: t("analisa.wawasan.filterRentang"),
      opsi: OPSI_TANGGAL,
      nilai: filterTanggal,
      onPilih: onTanggal,
    },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-borderRoundness border border-border bg-backgroundBox px-4 py-2"
      role="toolbar"
      aria-label={t("analisa.wawasan.filterJudul")}
    >
      {grup.map((g) => (
        <div key={g.kunci} className="flex items-center gap-2" role="radiogroup" aria-label={g.judul}>
          <span className="text-xs font-bold text-foregroundGrey">{g.judul}:</span>
          <div className="flex rounded-borderRoundness bg-backgroundBoxBox p-0.5">
            {g.opsi.map((o) => (
              <button
                key={o.nilai}
                type="button"
                role="radio"
                aria-checked={g.nilai === o.nilai}
                onClick={() => g.onPilih(o.nilai)}
                className={`rounded-borderRoundness px-2 py-1 text-xs font-medium transition-colors ${
                  g.nilai === o.nilai
                    ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark font-bold"
                    : "text-foregroundGrey hover:text-foreground"
                }`}
              >
                {o.kunci ? t(o.kunci) : o.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default FilterBar;
