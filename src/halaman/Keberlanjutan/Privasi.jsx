import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function Privasi() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("privasi.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("privasi.deskripsi")}
      next={{
        to: "/ketentuan",
        judul: t("privasi.nextJudul"),
      }}
    >
      <PageArtikel lebar>
        {/* ═══ Header Editorial / Koran ═══ */}
        <section className="-mt-8 md:-mt-12 relative w-full overflow-hidden bg-white">
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-2 md:px-8 md:py-3 xl:px-0">
            <div className="relative mb-6 border-b-4 border-double border-gray-900 pb-3 text-center">
              <p className="mb-1 font-sans text-xs font-bold tracking-widest text-gray-900 uppercase">
                {t("privasi.artikel")}
              </p>
              <h1 className="mb-2 text-3xl leading-none font-black tracking-tight text-gray-900 uppercase md:text-4xl">
                {t("privasi.judul")}
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
            Blunder Skuad menghargai privasi setiap anggota dan menjelaskan di
            sini data apa yang dikumpulkan, cara menggunakannya, serta hak Anda
            atas data tersebut.
          </p>

          <hr className="my-2 border-t border-gray-300" />

          {/* Seksi 1 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="m-0 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              1. Data yang Dikumpulkan
            </h2>
            <p className="m-0">
              Saat mendaftar, kami mengumpulkan username Chess.com, nama lengkap,
              nama panggilan, tanggal lahir, kota asal, nomor HP/WhatsApp, nomor
              DANA (bila diisi), alamat email, dan klub asal (bila ada). Data
              tersebut diberikan langsung oleh Anda melalui formulir pendaftaran.
              Kami juga membaca profil publik Chess.com semata-mata untuk
              keperluan verifikasi kode keanggotaan.
            </p>
          </section>

          <hr className="my-2 border-t border-gray-300" />

          {/* Seksi 2 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="m-0 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              2. Penggunaan Data
            </h2>
            <p className="m-0">
              Data digunakan untuk keperluan administrasi keanggotaan, komunikasi
              pengurus, pengiriman hadiah turnamen, dan penentuan kategori umur
              turnamen. Nomor HP/WhatsApp dan DANA hanya disimpan pada catatan
              pengurus dan tidak pernah ditampilkan di situs.
            </p>
          </section>

          <hr className="my-2 border-t border-gray-300" />

          {/* Seksi 3 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="m-0 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              3. Penyimpanan dan Perlindungan
            </h2>
            <p className="m-0">
              Data pribadi tidak disebarluaskan kepada pihak ketiga tanpa
              persetujuan tertulis dari yang bersangkutan, kecuali diwajibkan
              oleh hukum atau untuk investigasi pelanggaran internal. Akses ke
              data dibatasi pada pengurus yang bertanggung jawab.
            </p>
          </section>

          <hr className="my-2 border-t border-gray-300" />

          {/* Seksi 4 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="m-0 font-sans text-sm font-black tracking-tight text-gray-900 uppercase">
              4. Hak Anggota
            </h2>
            <p className="m-0">
              Anggota dapat meminta perbaikan atau penghapusan data pribadinya
              kapan saja, termasuk setelah mengundurkan diri, dengan memperhatikan
              ketentuan retensi data untuk keperluan arsip atau hukum. Permintaan
              diajukan melalui laman Hubungi Kami.
            </p>
          </section>

          {/* ═══ Footer Note / Penutup Editorial ═══ */}
          <div className="mt-6 border-t-2 border-b-2 border-gray-900 p-4 text-center">
            <p className="m-0 font-serif text-sm leading-relaxed text-gray-900 italic">
              Kebijakan ini berlaku untuk seluruh anggota Komunitas Catur
              Indonesia — Blunder Skuad selama menjadi bagian dari komunitas.
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