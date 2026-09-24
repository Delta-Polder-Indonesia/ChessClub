import { useMemo } from "react";

function bersihTeksArtikel(teks) {
  return String(teks || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[^>]*\/?>/gi, "")
    .replace(/<\/ref>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/'{2,}/g, "")
    .replace(/^\s*[:*#;]+/, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.,;:!?])(?=[.,;:!?])/g, "$1")
    .trim();
}

/** Pecah ringkasan Wikibooks menjadi blok tersusun: baris `== judul ==` /
 *  `=== subjudul ===` menjadi judul bagian, sisanya paragraf isi. */
function susunBlokArtikel(teks) {
  const blok = [];
  for (const mentah of String(teks || "").split(/\r?\n/)) {
    const baris = bersihTeksArtikel(mentah);
    if (!baris) continue;
    const judul = /^(={2,6})\s*(.*?)\s*\1$/.exec(baris);
    if (judul) {
      const isi = bersihTeksArtikel(judul[2]);
      if (isi) {
        blok.push({
          jenis: judul[1].length === 2 ? "judul" : "subjudul",
          teks: isi,
        });
      }
      continue;
    }
    // Buang penanda judul yang tersisa di tengah baris (artefak
    // terjemahan), mis. "==3. d4==", agar jadi teks biasa.
    blok.push({ jenis: "paragraf", teks: baris.replace(/={2,}/g, "") });
  }
  return blok;
}

/**
 * Kartu "Tentang Pembukaan Ini" — ringkasan dari Wikibooks Chess Opening
 * Theory yang berganti otomatis mengikuti pembukaan aktif di papan.
 * Seluruh paragraf ringkasan ditampilkan langsung (tanpa tombol
 * "selengkapnya"); artikelnya sendiri baru dimuat saat tab Explorer terbuka.
 */
export default function KartuArtikelPembukaan({ artikel, t }) {
  const blok = useMemo(
    () =>
      artikel && artikel.data
        ? susunBlokArtikel(artikel.data.ringkasan)
        : [],
    [artikel]
  );

  if (!artikel) return null;
  const data = artikel.data;

  return (
    <div className="mt-3 border-t border-[#312e2b] pt-3">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {t("papan.artikelJudul")}
      </p>

      {artikel.status === "memuat" ? (
        <div
          className="mt-2 animate-pulse"
          role="status"
          aria-label={t("papan.artikelMemuat")}
        >
          <div className="h-3 w-2/5 rounded bg-[#312e2b]" />
          <div className="mt-2 h-3 w-full rounded bg-[#312e2b]" />
          <div className="mt-1.5 h-3 w-11/12 rounded bg-[#312e2b]" />
          <div className="mt-1.5 h-3 w-3/5 rounded bg-[#312e2b]" />
        </div>
      ) : artikel.status === "siap" && data ? (
        <div className="mt-2">
          <p className="m-0 text-sm font-bold text-white">{data.judul}</p>
          <div className="mt-1.5 flex items-start gap-3">
            {data.gambar && (
              <img
                src={data.gambar}
                alt=""
                width={72}
                height={72}
                loading="lazy"
                className="h-[72px] w-[72px] shrink-0 border border-[#363431] bg-[#262421] object-cover"
              />
            )}
            <div className="min-w-0">
              {blok.map((b, i) =>
                b.jenis === "judul" ? (
                  <p
                    key={i}
                    className="m-0 mb-1 mt-2.5 text-[13px] font-bold leading-snug text-gray-100 first:mt-0"
                  >
                    {b.teks}
                  </p>
                ) : b.jenis === "subjudul" ? (
                  <p
                    key={i}
                    className="m-0 mb-1 mt-2 text-xs font-semibold leading-snug text-gray-200"
                  >
                    {b.teks}
                  </p>
                ) : (
                  <p key={i} className="m-0 mb-1.5 text-xs leading-5 text-gray-400">
                    {b.teks}
                  </p>
                )
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-gray-500">
              Wikibooks · {data.bahasa.toUpperCase()} · CC BY-SA
              {data.terjemahanOtomatis &&
                ` · ${t("papan.artikelOtomatis")}`}
            </span>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#a3d168] hover:underline"
            >
              {t("papan.artikelBaca")} ↗
            </a>
          </div>
        </div>
      ) : (
        <p className="m-0 mt-1.5 text-xs text-gray-400">
          {t("papan.artikelKosong")}
        </p>
      )}
    </div>
  );
}
