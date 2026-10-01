import { HalamanIsi, PageArtikel } from"../../components/PageBagian.jsx";
import { useI18n } from"../../lib/i18n.jsx";

export default function Privasi() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("privasi.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("privasi.deskripsi")}
      next={{
        to:"/ketentuan",
        judul: t("privasi.nextJudul"),
      }}
    >
      <PageArtikel lebar>

        {/* ═══ Konten Artikel Editorial ═══ */}
        <div className="flex w-full flex-col gap-y-6 pt-1 font-serif text-base leading-[1.6] text-grey-800">
          <p className="m-0">
            Blunder Skuad menghargai privasi setiap anggota dan menjelaskan di
            sini data apa yang dikumpulkan, cara menggunakannya, serta hak Anda
            atas data tersebut.
          </p>

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 1 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
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

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 2 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
              2. Penggunaan Data
            </h2>
            <p className="m-0">
              Data digunakan untuk keperluan administrasi keanggotaan, komunikasi
              pengurus, pengiriman hadiah turnamen, dan penentuan kategori umur
              turnamen. Nomor HP/WhatsApp dan DANA hanya disimpan pada catatan
              pengurus dan tidak pernah ditampilkan di situs.
            </p>
          </section>

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 3 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
              3. Penyimpanan dan Perlindungan
            </h2>
            <p className="m-0">
              Data pribadi tidak disebarluaskan kepada pihak ketiga tanpa
              persetujuan tertulis dari yang bersangkutan, kecuali diwajibkan
              oleh hukum atau untuk investigasi pelanggaran internal. Akses ke
              data dibatasi pada pengurus yang bertanggung jawab.
            </p>
          </section>

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 4 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
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
          <div className="mt-6 border-t border-b border-grey-200 p-4 text-center">
            <p className="m-0 font-serif text-sm leading-relaxed text-grey-800 italic">
              Kebijakan ini berlaku untuk seluruh anggota Komunitas Catur
              Indonesia — Blunder Skuad selama menjadi bagian dari komunitas.
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