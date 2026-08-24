import { useCallback, useEffect, useState } from "react";
import Hero from "../../components/Hero.jsx";
import StickyMenu from "../../components/StickyMenu.jsx";
import { PageSelanjutnya } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { PANDUAN_CATUR, muatBab } from "../../data/panduan/index.js";

/**
 * Halaman "Cara Bermain Catur" — panduan lengkap 71 bagian.
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
        <span className="section-number text-sm">{bagian.nomor}</span>
        <h3 className="text-xl font-semibold leading-snug text-slate-950 md:text-2xl">
          {bagian.judul}
        </h3>
      </div>
      {bagian.deskripsi && (
        <p
          className="mb-6 text-base leading-7 text-slate-600"
          dangerouslySetInnerHTML={{ __html: bagian.deskripsi }}
        />
      )}
      {bagian.baris.map((baris, i) => (
        <BarisKonten key={i} html={baris.html} />
      ))}
    </section>
  );
}

/** Isi panduan dengan pemuatan konten per bab, bukan satu artikel raksasa. */
export function IsiPanduan({ panduan }) {
  const { t } = useI18n();
  const [bagianTerbuka, setBagianTerbuka] = useState({});
  const [sedangMuat, setSedangMuat] = useState({});
  const [targetGulir, setTargetGulir] = useState(null);

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

  const bukaBab = useCallback(async (id) => {
    if (bagianTerbuka[id] || sedangMuat[id]) return;
    setSedangMuat((lama) => ({ ...lama, [id]: true }));
    try {
      const daftar = await muatBab(id);
      setBagianTerbuka((lama) => ({ ...lama, [id]: daftar }));
    } finally {
      setSedangMuat((lama) => ({ ...lama, [id]: false }));
    }
  }, [bagianTerbuka, sedangMuat]);

  // Bab pertama dimuat otomatis agar pembaca langsung mendapat isi artikel.
  useEffect(() => {
    setBagianTerbuka({});
    setSedangMuat({});
    bukaBab(panduan.bab[0]?.id);
    // Manifest panduan tidak berubah sepanjang masa pakai halaman.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panduan]);

  // Tautan daftar isi juga dapat membuka bab yang belum pernah dimuat.
  useEffect(() => {
    if (!targetGulir) return;
    const elemen = document.getElementById(targetGulir);
    if (elemen) {
      elemen.scrollIntoView({ behavior: "smooth", block: "start" });
      setTargetGulir(null);
    }
  }, [bagianTerbuka, targetGulir]);

  const bukaDariDaftarIsi = (event, bab, bagian) => {
    event.preventDefault();
    setTargetGulir(bagian.id);
    void bukaBab(bab.id);
  };

  return (
    <article className="panduan-kci">
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

        <nav aria-label={t("caraBermain.daftarIsi")} className="mt-10 border-y border-slate-200 py-6">
          <p className="mb-3 text-sm font-semibold text-slate-950">{t("caraBermain.daftarIsi")}</p>
          <div className="grid gap-x-10 md:grid-cols-2">
            {panduan.bab.map((bab) => (
              <div key={bab.id} className="min-w-0">
                <p className="mt-3 mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">{labelBab[bab.id]}</p>
                <ol>
                  {bab.bagian.map((bagian) => (
                    <li key={bagian.id} className="border-b border-dashed border-slate-200 py-1 last:border-0">
                      <a href={`#${bagian.id}`} onClick={(event) => bukaDariDaftarIsi(event, bab, bagian)} className="text-[15px] leading-6 text-slate-700 hover:text-primary hover:underline">
                        {bagian.judul}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </nav>
      </header>

      {panduan.bab.map((bab, idx) => {
        const daftar = bagianTerbuka[bab.id];
        const memuat = sedangMuat[bab.id];
        return (
          <section key={bab.id} id={bab.id} className="scroll-mt-36 pt-10 md:pt-14">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">{t("caraBermain.bab")} {idx + 1}</p>
            <h2 className="mt-2 border-b-2 border-slate-200 pb-4 text-2xl font-bold text-slate-950 md:text-3xl">{labelBab[bab.id]}</h2>
            {daftar ? daftar.map((bagian) => <BlokBagian key={bagian.id} bagian={bagian} />) : (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm leading-6 text-slate-600">{t("caraBermain.babMalas")}</p>
                <button type="button" onClick={() => void bukaBab(bab.id)} disabled={memuat} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60">
                  {memuat ? t("caraBermain.memuatBab") : t("caraBermain.muatBab")}
                </button>
              </div>
            )}
          </section>
        );
      })}
    </article>
  );
}

export default function CaraBermainCatur() {
  const { t, bahasa } = useI18n();
  const isEN = bahasa === "en";

  useEffect(() => {
    document.title = `${t("caraBermain.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);



  const crumbs = [
    { label: t("common.home"), to: "/" },
    { label: t("nav.programKami"), to: "/program-kami" },
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

<IsiPanduan panduan={PANDUAN_CATUR} />
        </div>
      </main>

      <PageSelanjutnya to="/turnamen" judul={t("nav.turnamen")} />
    </>
  );
}
