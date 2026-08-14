import { useEffect, useMemo, useState } from "react";
import Hero from "../../components/Hero.jsx";
import StickyMenu from "../../components/StickyMenu.jsx";
import { PageSelanjutnya } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

/**
 * Halaman "Cara Bermain Catur" — panduan lengkap 71 bagian yang bersumber dari
 * DokumenHistory/index.html (diubah menjadi data lewat scripts/ekstrak-panduan-catur.py).
 * Konten dimuat terpisah (code-split) agar bundle utama tetap ringan.
 */

/** Satu baris isi panduan — HTML dokumen asli (papan SVG, tabel, kartu) dirender utuh. */
function BarisKonten({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Satu bagian (section) panduan: nomor, judul, deskripsi, dan baris isi. */
function BlokBagian({ bagian }) {
  return (
    <section
      id={bagian.id}
      className="scroll-mt-36 border-t border-slate-200 py-10 md:py-14"
    >
      <div className="mb-4 flex items-center gap-4">
        <span className="section-number text-2xl">{bagian.nomor}</span>
        <h3 className="text-xl font-extrabold uppercase leading-tight text-chess-green md:text-2xl">
          {bagian.judul}
        </h3>
      </div>
      {bagian.deskripsi && (
        <p
          className="mb-6 leading-snug text-gray-600"
          dangerouslySetInnerHTML={{ __html: bagian.deskripsi }}
        />
      )}
      {bagian.baris.map((baris, i) => (
        <BarisKonten key={i} html={baris.html} />
      ))}
    </section>
  );
}

/** Isi lengkap panduan: judul artikel, daftar isi, bab, dan seluruh bagian. */
export function IsiPanduan({ panduan }) {
  const { t } = useI18n();

  const labelBab = {
    "bab-bidak": t("caraBermain.babBidak"),
    "bab-dasar": t("caraBermain.babDasar"),
    "bab-pemula": t("caraBermain.babPemula"),
    "bab-menengah": t("caraBermain.babMenengah"),
    "bab-strategi": t("caraBermain.babStrategi"),
    "bab-lanjut": t("caraBermain.babLanjut"),
    "bab-master": t("caraBermain.babMaster"),
    "bab-penutup": t("caraBermain.babPenutup"),
  };

  const perBab = useMemo(() => {
    const urut = panduan.bab.map((b) => b.id);
    const peta = new Map(urut.map((id) => [id, []]));
    for (const b of panduan.bagian) {
      if (peta.has(b.bab)) peta.get(b.bab).push(b);
    }
    return urut
      .map((id) => ({ id, daftar: peta.get(id) ?? [] }))
      .filter((k) => k.daftar.length > 0);
  }, [panduan]);

  return (
    <article>
      <header className="pb-12 md:pb-16">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
          {t("caraBermain.labelArtikel")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
          {panduan.judul}
        </h1>
        <p className="mt-6 max-w-[860px] text-lg leading-8 text-slate-600">
          {t("caraBermain.lead")}
        </p>

        <nav
          aria-label={t("caraBermain.daftarIsi")}
          className="mt-10 border-y border-slate-200 py-6"
        >
          <p className="mb-3 text-sm font-semibold text-slate-950">
            {t("caraBermain.daftarIsi")}
          </p>
          <div className="grid gap-x-10 md:grid-cols-2">
            {perBab.map(({ id, daftar }) => (
              <div key={id} className="min-w-0">
                <p className="mt-3 mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                  {labelBab[id]}
                </p>
                <ol>
                  {daftar.map((b) => (
                    <li
                      key={b.id}
                      className="border-b border-dashed border-slate-200 py-1 last:border-0"
                    >
                      <a
                        href={`#${b.id}`}
                        className="text-[15px] leading-6 text-slate-700 hover:text-primary hover:underline"
                      >
                        {b.judul}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </nav>
      </header>

      {perBab.map(({ id, daftar }, idx) => (
        <section key={id} id={id} className="scroll-mt-36 pt-10 md:pt-14">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            {t("caraBermain.bab")} {idx + 1}
          </p>
          <h2 className="mt-2 border-b-2 border-slate-200 pb-4 text-2xl font-bold text-slate-950 md:text-3xl">
            {labelBab[id]}
          </h2>
          {daftar.map((b) => (
            <BlokBagian key={b.id} bagian={b} />
          ))}
        </section>
      ))}
    </article>
  );
}

/** Kerangka pemuatan saat data panduan dimuat secara terpisah. */
function KerangkaPanduan() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-4 w-40 rounded bg-slate-200" />
      <div className="mt-4 h-12 w-3/4 rounded bg-slate-200" />
      <div className="mt-6 h-28 rounded bg-slate-100" />
      <div className="mt-10 space-y-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-44 rounded border border-slate-200 bg-slate-50" />
        ))}
      </div>
    </div>
  );
}

export default function CaraBermainCatur() {
  const { t, bahasa } = useI18n();
  const isEN = bahasa === "en";
  const [panduan, setPanduan] = useState(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    document.title = `${t("caraBermain.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  useEffect(() => {
    let aktif = true;
    import("../../data/panduanCatur.js")
      .then((modul) => {
        if (aktif) setPanduan(modul.PANDUAN_CATUR);
      })
      .catch(() => {
        if (aktif) setGagal(true);
      });
    return () => {
      aktif = false;
    };
  }, []);

  const crumbs = [
    { label: t("common.home"), to: "/" },
    { label: t("nav.programKami"), to: "/program-kami" },
    { label: t("nav.sekolahCatur"), to: "/program-kami/sekolah-catur" },
    { label: t("caraBermain.judul") },
  ];

  const babMenu = [
    { id: "bab-bidak", label: t("caraBermain.babBidak") },
    { id: "bab-dasar", label: t("caraBermain.babDasar") },
    { id: "bab-pemula", label: t("caraBermain.babPemula") },
    { id: "bab-menengah", label: t("caraBermain.babMenengah") },
    { id: "bab-strategi", label: t("caraBermain.babStrategi") },
    { id: "bab-lanjut", label: t("caraBermain.babLanjut") },
    { id: "bab-master", label: t("caraBermain.babMaster") },
    { id: "bab-penutup", label: t("caraBermain.babPenutup") },
  ];

  return (
    <>
      <Hero
        title={t("caraBermain.judul")}
        description={t("caraBermain.deskripsi")}
        crumbs={crumbs}
      />
      <StickyMenu sections={babMenu} />

      <main className="px-6 md:px-8">
        <div className="mx-auto max-w-[1024px] py-10 md:py-16">
          {isEN && (
            <div className="mb-10 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              <span aria-hidden="true" className="text-base leading-6">
                🌐
              </span>
              <p>{t("caraBermain.kontenHanyaId")}</p>
            </div>
          )}

          {gagal ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {t("caraBermain.gagalMuat")}
            </p>
          ) : panduan ? (
            <IsiPanduan panduan={panduan} />
          ) : (
            <KerangkaPanduan />
          )}
        </div>
      </main>

      <PageSelanjutnya to="/turnamen" judul={t("sekolahCatur.nextJudul")} />
    </>
  );
}
