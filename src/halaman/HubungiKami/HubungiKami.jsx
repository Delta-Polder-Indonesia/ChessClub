import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CorporateDivider,
  CorporatePage,
  CorporateSection,
  CorporateTable,
} from "../../components/CorporatePage.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";
import { kirimPesan } from "../../lib/api/index.js";

const SIDEBAR = [
  { id: "sekretariat", label: "Sekretariat", active: true },
  { id: "hubungi-kami", label: "Kirim Pesan" },
  { id: "jejaring-komunitas", label: "Jejaring Komunitas" },
];

export default function HubungiKami() {
  const { t } = useI18n();
  const [terkirim, setTerkirim] = useState(false);
  const [sedangMengirim, setSedangMengirim] = useState(false);
  const [galat, setGalat] = useState("");

  return (
    <CorporatePage
      title={t("hubungi.judul")}
      description={t("hubungi.deskripsi")}
      image={gambar("/images/sekilas.jpg")}
      sidebar={SIDEBAR}
      next={{ to: "/karir", title: t("karir.judul") }}
    >
      <CorporateSection id="sekretariat" title="Sekretariat Komunitas">
        <CorporateTable
          rows={[
            [
              "Alamat",
              <p key="alamat">
                Sekretariat Komunitas Catur Indonesia
                <br />Jl. Gatot Subroto No. 11–13
                <br />Medan 20152, Sumatera Utara, Indonesia
              </p>,
            ],
            [
              "Telepon",
              <a key="telepon" className="text-primary" href="tel:+62611234567">
                +62 61 123 4567
              </a>,
            ],
            [
              "Email",
              <span key="email" className="flex flex-col gap-2">
                <a className="text-primary" href="mailto:info@komunitascatur.or.id">
                  info@komunitascatur.or.id
                </a>
              </span>,
            ],
          ]}
        />
      </CorporateSection>

      <CorporateDivider />

      <CorporateSection id="hubungi-kami" title="Kirim Pesan" className="pb-10 md:pb-10 xl:pb-10 pt-6 md:pt-8 xl:pt-0">
        {terkirim ? (
          <div className="border border-green-200 bg-green-50 rounded-lg p-5 text-green-800">
            <p className="font-semibold mb-1">Pesan Anda berhasil dikirim!</p>
            <p>
              Terima kasih telah menghubungi Komunitas Catur Indonesia. Tim kami akan
              segera merespons pesan Anda melalui email yang Anda berikan.
            </p>
            <button
              type="button"
              onClick={() => setTerkirim(false)}
              className="mt-4 text-sm font-semibold text-primary hover:underline"
            >
              Tulis pesan lain
            </button>
          </div>
        ) : (
          <form
            method="post"
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setSedangMengirim(true);
              setGalat("");

              try {
                const data = new FormData(event.currentTarget);
                await kirimPesan({
                  nama: data.get("nama"),
                  email: data.get("email"),
                  telepon: data.get("telepon"),
                  organisasi: data.get("organisasi"),
                  subjek: data.get("subjek"),
                  pesan: data.get("pesan"),
                });

                setTerkirim(true);
              } catch (err) {
                setGalat(err.message || "Gagal mengirim pesan. Silakan coba lagi.");
              } finally {
                setSedangMengirim(false);
              }
            }}
          >
            {galat && (
              <div className="border border-red-300 bg-red-50 rounded-lg p-4 text-red-800">
                <p className="font-semibold">Gagal mengirim pesan</p>
                <p className="text-sm">{galat}</p>
              </div>
            )}
            <div className="w-full flex flex-col md:flex-row items-start gap-4">
              <input required name="nama" placeholder="Nama Lengkap" className="w-full px-4 py-3 placeholder:text-slate-400 ring-primary border rounded-md border-slate-200" />
              <input name="telepon" placeholder="Nomor Telepon (Opsional)" className="w-full px-4 py-3 placeholder:text-slate-400 ring-primary border border-slate-200 rounded-md" />
            </div>
            <div className="w-full flex flex-col md:flex-row items-start gap-4">
              <input name="organisasi" placeholder="Nama Organisasi / Klub" className="w-full px-4 py-3 placeholder:text-slate-400 ring-primary border rounded-md border-slate-200" />
              <input required type="email" name="email" placeholder="Alamat Email" className="w-full px-4 py-3 placeholder:text-slate-400 ring-primary border rounded-md border-slate-200" />
            </div>
            <div className="w-full">
              <input name="subjek" placeholder="Subjek Pesan" className="w-full px-4 py-3 placeholder:text-slate-400 ring-primary border rounded-md border-slate-200" />
            </div>
            <div className="w-full">
              <textarea required name="pesan" rows={6} placeholder="Ketik pesan Anda di sini..." className="w-full px-4 py-3 placeholder:text-slate-400 ring-primary border rounded-md border-slate-200 resize-y" />
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <p className="font-medium text-base mb-4">Persetujuan Data Pribadi</p>
                <div className="w-full px-4 py-5 border rounded-md border-slate-200 prose prose-sm max-w-none">
                  <p>
                    Komunitas Catur Indonesia berkomitmen melindungi data pribadi Anda. Data yang dikirim melalui formulir ini hanya digunakan untuk menindaklanjuti pesan dan kebutuhan komunikasi komunitas.
                  </p>
                  <p className="text-base font-bold">Persetujuan Pengguna</p>
                  <p>
                    Dengan mengirimkan pesan, Anda memahami dan menyetujui pemrosesan data yang Anda berikan sesuai dengan kebijakan privasi yang berlaku.
                  </p>
                  <p>
                    <Link
                      to="/keberlanjutan/syarat-dan-ketentuan"
                      className="text-primary no-underline font-bold"
                    >
                      Baca Selengkapnya
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input required type="checkbox" id="agreement" name="agreement" className="w-4 h-4 text-primary accent-primary focus:ring-primary" />
                <label htmlFor="agreement" className="text-base">Saya setuju dengan syarat dan ketentuan</label>
              </div>
            </div>

            <button
              type="submit"
              disabled={sedangMengirim}
              className="self-start text-sm font-semibold rounded-full px-6 py-3 border border-solid border-primary bg-primary text-white hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sedangMengirim ? "Mengirim..." : "Kirim Pesan"}
            </button>
          </form>
        )}
      </CorporateSection>

      <CorporateSection id="jejaring-komunitas" title="Jejaring Komunitas" className="pt-6 md:pt-8 xl:pt-0">
        <p>
          Komunitas Catur Indonesia terbuka untuk berkolaborasi dengan klub, sekolah, pelatih, sponsor, dan komunitas catur di berbagai daerah. Sampaikan rencana kolaborasi Anda melalui formulir di atas atau email resmi komunitas.
        </p>
      </CorporateSection>
    </CorporatePage>
  );
}
