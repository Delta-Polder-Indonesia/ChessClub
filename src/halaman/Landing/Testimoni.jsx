/**
 * "Apa kata para anggota" — testimoni komunitas.
 *
 * Komposisi mengikuti DESIGN.md §3: satu kutipan sorotan (pull quote dengan
 * garis aksen) lalu dua kartu sekunder berdampingan. Setiap kutipan memakai
 * monogram inisial sebagai penanda orang karena belum ada foto anggota.
 * Seluruh isi ditulis asli untuk KCI dan nama memakai inisial.
 */
import { useI18n } from "../../lib/i18n.jsx";
import { JUDUL_SEKSI, KEPALA_SEKSI } from "./gayaTeks.jsx";

/** Inisial maksimal dua huruf dari nama tampilan: "Bima R." → "BR". */
function inisial(nama) {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .map((bagian) => bagian[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Penanda orang: lingkaran inisial, dekoratif karena nama tetap dibaca. */
function Monogram({ nama }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-11 flex-none items-center justify-center rounded-full border border-grey-200 bg-grey-100 font-sans text-sm font-semibold text-primary"
    >
      {inisial(nama)}
    </span>
  );
}

/** Nama + peran di bawah kutipan, dipakai sorotan maupun kartu. */
function SumberKutip({ nama, peran }) {
  return (
    <figcaption className="flex items-center gap-3">
      <Monogram nama={nama} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <cite className="font-sans text-sm font-semibold not-italic text-grey-800">
          {nama}
        </cite>
        <span className="font-sans text-xs leading-snug text-grey-600">
          {peran}
        </span>
      </span>
    </figcaption>
  );
}

/** Kutipan sorotan — pull quote selebar kolom dengan garis aksen kiri. */
function KutipUnggulan({ t }) {
  const nama = t("landing.testimoniLeadNama");
  return (
    <figure
      aria-label={t("landing.testimoniLeadAria")}
      className="m-0 flex flex-col gap-6 border-l-4 border-primary pl-6 md:pl-8"
    >
      <blockquote className="m-0">
        <p className="max-w-3xl font-serif text-3xl font-medium italic leading-snug text-grey-800 text-pretty">
          {t("landing.testimoniLeadKutip")}
        </p>
      </blockquote>
      <SumberKutip nama={nama} peran={t("landing.testimoniLeadPeran")} />
    </figure>
  );
}

/** Kartu kutipan sekunder — permukaan tipis, garis 1px, tanpa bayangan. */
function KartuKutip({ t, kunci }) {
  const nama = t(`${kunci}Nama`);
  return (
    <figure
      aria-label={t(`${kunci}Aria`)}
      className="m-0 flex flex-col justify-start gap-4 rounded-lg border border-grey-200 bg-paper p-6"
    >
      <blockquote className="m-0">
        <p className="font-serif text-base leading-relaxed text-grey-800 text-pretty">
          {t(`${kunci}Kutip`)}
        </p>
      </blockquote>
      <SumberKutip nama={nama} peran={t(`${kunci}Peran`)} />
    </figure>
  );
}

export default function Testimoni() {
  const { t } = useI18n();
  const kartuKunci = ["landing.testimoniKutip1", "landing.testimoniKutip2"];

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">
        <div className={KEPALA_SEKSI}>
          <h2 className={JUDUL_SEKSI}>{t("landing.testimoniJudul")}</h2>
        </div>

        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-x-12 md:gap-y-0">
          <KutipUnggulan t={t} />

          <div className="grid gap-6">
            {kartuKunci.map((kunci) => (
              <KartuKutip key={kunci} t={t} kunci={kunci} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
