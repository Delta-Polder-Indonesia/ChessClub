import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function Ketentuan() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("ketentuan.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("ketentuan.deskripsi")}
      next={{
        to: "/keberlanjutan",
        judul: t("ketentuan.nextJudul"),
      }}
    >
      <PageArtikel lebar>
        {/* ═══ Header Editorial / Koran ═══ */}
        <section className="font-serif -mt-8 md:-mt-12 relative w-full overflow-hidden bg-white">
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-2 md:px-8 md:py-3 xl:px-0">
            <div className="relative mb-6 border-b-4 border-double border-gray-900 pb-3 text-center">
              <p className="mb-1 text-xs font-bold tracking-widest text-gray-900 uppercase">
                {t("ketentuan.artikel")}
              </p>
              <h1 className="mb-2 text-3xl leading-none font-black tracking-tight text-gray-900 uppercase md:text-4xl">
                {t("ketentuan.judul")}
              </h1>
              <p className="m-0 text-sm text-gray-900 italic">
                Terakhir diperbarui: 16 September 2026
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Konten Artikel Editorial ═══ */}
        <div className="flex w-full flex-col gap-y-6 pt-1 font-serif text-sm leading-relaxed text-justify text-gray-800">
          <p className="m-0 first-letter:float-left first-letter:mr-3 first-letter:text-4xl first-letter:font-black first-letter:leading-none first-letter:text-gray-900">
            Ketentuan penggunaan situs dan layanan Komunitas Catur Indonesia —
            Blunder Skuad ini menjelaskan tanggung jawab bersama antara
            pengunjung dan pengurus.
          </p>

          <hr className="my-2 border-t border-gray-300" />

          {/* Seksi 1 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="m-0 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              1. Penerimaan Ketentuan
            </h2>
            <p className="m-0">
              Dengan mengakses dan menggunakan situs ini, setiap pengunjung
              dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan
              yang tercantum pada halaman ini. Bila tidak setuju dengan sebagian
              atau seluruh ketentuan, kami persilakan untuk tidak menggunakan
              layanan yang tersedia.
            </p>
          </section>

          <hr className="my-2 border-t border-gray-300" />

          {/* Seksi 2 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="m-0 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              2. Penggunaan Situs
            </h2>
            <p className="m-0">
              Situs dapat digunakan untuk keperluan informasi, pendaftaran
              anggota, dan layanan yang disediakan komunitas. Dilarang melakukan
              pemalsuan data pendaftaran, eksploitasi bug, akses tidak sah ke
              area pengurus, serta aktivitas yang mengganggu kestabilan layanan
              bagi pengguna lain.
            </p>
          </section>

          <hr className="my-2 border-t border-gray-300" />

          {/* Seksi 3 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="m-0 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              3. Tanggung Jawab
            </h2>
            <p className="m-0">
              Pengurus berupaya menjaga keakuratan informasi pada situs, namun
              tidak menjamin ketiadaan kesalahan. Setiap pengguna bertanggung
              jawab atas keamanan akun mereka sendiri dan atas kebenaran data
              yang disampaikan dalam proses pendaftaran.
            </p>
          </section>

          <hr className="my-2 border-t border-gray-300" />

          {/* Seksi 4 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="m-0 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              4. Perubahan Ketentuan
            </h2>
            <p className="m-0">
              Ketentuan ini dapat diperbarui sewaktu-waktu oleh Pengurus Blunder
              Skuad. Perubahan material akan diumumkan melalui saluran komunikasi
              resmi komunitas, dan penggunaan situs setelah perubahan berlaku
              dianggap sebagai persetujuan terhadap versi terbaru.
            </p>
          </section>

          {/* ═══ Footer Note / Penutup Editorial ═══ */}
          <div className="mt-6 border-t-2 border-b-2 border-gray-900 p-4 text-center">
            <p className="m-0 font-serif text-sm leading-relaxed text-gray-900 italic">
              Pertanyaan tentang ketentuan ini dapat disampaikan kepada pengurus
              melalui laman Hubungi Kami.
            </p>
            <div className="mt-4 pt-3 border-t border-gray-300">
              <strong className="block font-sans text-xs font-black tracking-widest uppercase text-gray-900">
                Blunder Skuad
              </strong>
              <span className="block font-serif text-xs italic text-gray-700 mt-0.5">
                Komunitas Catur untuk Semua
              </span>
            </div>
          </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}