/**
 * "Apa kata para anggota" — pohon kutipan dari anggota komunitas.
 *
 * Struktur mengikuti pola section testimoni yang ada di `prompt.md`:
 * lead quote lebar di kiri (teks besar serif italic dengan garis aksen),
 * dua kutipan kartu di kanan yang dipisah garis 1px. Seluruh kutipan
 * ditulis asli untuk KCI — nama inisial fiktif, tanpa klaim yang tidak
 * mewakili komunitas.
 */
import { useI18n } from "../../lib/i18n.jsx";

function BalokKutip({ anak, aria }) {
  return (
    <blockquote className="m-0" aria-label={aria}>
      {anak}
    </blockquote>
  );
}

function GlobalKutip({ t, sumber }) {
  return (
    <div className="flex flex-col gap-[0.2rem] mt-5">
      <cite className="font-serif font-semibold text-[15px] not-italic text-grey-800">
        {sumber.nama}
      </cite>
      <span className="font-serif text-primary font-semibold text-[13px] uppercase tracking-[0.1em]">
        {sumber.peran}
      </span>
    </div>
  );
}

/** Lead quote — kolom kiri, teks besar serif italic dengan garis aksen kiri. */
function KutipUnggulan({ t }) {
  return (
    <BalokKutip
      aria={t("landing.testimoniLeadAria")}
      anak={
        <>
          <p className="border-l-4 border-primary m-0 pl-[clamp(1.25rem,3vw,2rem)] font-serif italic font-medium text-[clamp(1.5rem,2.6vw,1.875rem)] leading-[1.3] max-w-[24ch] text-grey-800">
            {t("landing.testimoniLeadKutip")}
          </p>
          <GlobalKutip
            t={t}
            sumber={{
              nama: t("landing.testimoniLeadNama"),
              peran: t("landing.testimoniLeadPeran"),
            }}
          />
        </>
      }
    />
  );
}

/** Kartu kutipan — kolom kanan, dipisah garis horizontal 1px. */
function KartuKutip({ t, kunci }) {
  return (
    <BalokKutip
      aria={t(`${kunci}Aria`)}
      anak={
        <>
          <p className="m-0 font-serif text-base leading-[1.6] text-grey-800">
            {t(`${kunci}Kutip`)}
          </p>
          <GlobalKutip
            t={t}
            sumber={{
              nama: t(`${kunci}Nama`),
              peran: t(`${kunci}Peran`),
            }}
          />
        </>
      }
    />
  );
}

export default function Testimoni() {
  const { t } = useI18n();
  const kartuKunci = ["landing.testimoniKutip1", "landing.testimoniKutip2"];

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pt-0 pb-16 md:pb-20 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">
        <h2 className="font-serif font-semibold text-2xl md:text-3xl leading-snug text-grey-800">
          {t("landing.testimoniJudul")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-10 md:gap-y-0 items-start mt-10">
          <KutipUnggulan t={t} />
          <div className="grid">
            {kartuKunci.map((kunci) => (
              <div key={kunci} className="border-t border-slate-300 py-6">
                <KartuKutip t={t} kunci={kunci} />
              </div>
            ))}
            <div className="border-b border-slate-300" />
          </div>
        </div>
      </div>
    </section>
  );
}