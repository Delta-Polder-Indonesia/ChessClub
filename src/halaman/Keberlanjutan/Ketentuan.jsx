import { HalamanIsi, PageArtikel } from"../../components/PageBagian.jsx";
import { useI18n } from"../../lib/i18n.jsx";

export default function Ketentuan() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("ketentuan.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("ketentuan.deskripsi")}
      next={{
        to:"/keberlanjutan",
        judul: t("ketentuan.nextJudul"),
      }}
    >
      <PageArtikel lebar>

        {/* ═══ Konten Artikel Editorial ═══ */}
        <div className="flex w-full flex-col gap-y-6 pt-1 font-serif text-base leading-[1.6] text-grey-800">
          <p className="m-0">
            Ketentuan penggunaan situs dan layanan Komunitas Catur Indonesia —
            Blunder Skuad ini menjelaskan tanggung jawab bersama antara
            pengunjung dan pengurus.
          </p>

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 1 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
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

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 2 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
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

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 3 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
              3. Tanggung Jawab
            </h2>
            <p className="m-0">
              Pengurus berupaya menjaga keakuratan informasi pada situs, namun
              tidak menjamin ketiadaan kesalahan. Setiap pengguna bertanggung
              jawab atas keamanan akun mereka sendiri dan atas kebenaran data
              yang disampaikan dalam proses pendaftaran.
            </p>
          </section>

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 4 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
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
          <div className="mt-6 border-t border-b border-grey-200 p-4 text-center">
            <p className="m-0 font-serif text-sm leading-relaxed text-grey-800 italic">
              Pertanyaan tentang ketentuan ini dapat disampaikan kepada pengurus
              melalui laman Hubungi Kami.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-300">
              <strong className="block font-sans text-[13px] font-semibold text-grey-800">
                Blunder Skuad
              </strong>
              <span className="block font-serif text-xs italic text-grey-600 mt-0.5">
                Komunitas Catur untuk Semua
              </span>
            </div>
          </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}