import { HalamanIsi, PageArtikel } from"../../components/PageBagian.jsx";
import { useI18n } from"../../lib/i18n.jsx";

export default function Bantuan() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("bantuan.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("bantuan.deskripsi")}
      next={{
        to:"/privasi",
        judul: t("bantuan.nextJudul"),
      }}
    >
      <PageArtikel lebar>

        {/* ═══ Konten Artikel Editorial ═══ */}
        <div className="flex w-full flex-col gap-y-6 pt-1 font-serif text-base leading-[1.6] text-grey-800">
          <p className="m-0">
            Halaman ini memuat panduan singkat penggunaan situs dan layanan
            Komunitas Catur Indonesia — Blunder Skuad, termasuk cara
            bergabung dan menyelesaikan verifikasi akun.
          </p>

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 1 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
              1. Pendaftaran Anggota
            </h2>
            <p className="m-0">
              Pendaftaran dilakukan melalui laman Pendaftaran Anggota dengan
              menggunakan akun Chess.com. Isi setiap langkah data diri dan
              kontak satu per satu, lalu periksa kembali sebelum menekan Kirim
              Pendaftaran. Pendaftaran diproses oleh pengurus klub dan status
              keanggotaan dapat dicek pada bagian Keanggotaan di Struktur Grup
              Catur.
            </p>
          </section>

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 2 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
              2. Verifikasi Akun Chess.com
            </h2>
            <p className="m-0">
              Untuk menjaga keamanan, pendaftaran mewajibkan verifikasi bahwa
              akun Chess.com yang dipakai memang milik Anda. Kode verifikasi
              sekali pakai ditempelkan pada kolom Lokasi di pengaturan profil
              Chess.com, lalu diperiksa melalui API publik. Kode dapat dihapus
              kembali setelah verifikasi selesai. Bila profil belum dapat
              disunting, tersedia mode verifikasi cepat.
            </p>
          </section>

          <hr className="my-2 border-t border-slate-300" />

          {/* Seksi 3 */}
          <section className="flex flex-col gap-y-2">
            <h2 className="font-serif">
              3. Kontak Pengurus
            </h2>
            <p className="m-0">
              Bila mengalami kendala pendaftaran, verifikasi, atau penggunaan
              situs, hubungi pengurus melalui laman Hubungi Kami. Pertanyaan
              umum juga sudah dirangkum di halaman Pertanyaan Umum di kelompok
              Keberlanjutan ini.
            </p>
          </section>

          {/* ═══ Footer Note / Penutup Editorial ═══ */}
          <div className="mt-6 border-t border-b border-grey-200 p-4 text-center">
            <p className="m-0 font-serif text-sm leading-relaxed text-grey-800 italic">
              Bilamana petunjuk di halaman ini tidak menjawab masalah Anda,
              sampaikan detail masalahnya kepada pengurus agar dapat ditindaklanjuti.
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