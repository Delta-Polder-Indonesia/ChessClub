import { useState } from "react";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function HubungiKami() {
  const [kirim, setKirim] = useState(false);

  return (
    <HalamanIsi
      title="Hubungi Kami"
      description="Sekretariat Medan, surel resmi, dan formulir pesan."
    >
      <PageArtikel title="Sekretariat">
        <p>
          <strong>Address:</strong> Sekretariat Komunitas Catur Indonesia, Jl.
          Gatot Subroto No. 11-13, Medan 20152, Sumatera Utara, Indonesia
        </p>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:info@komunitascatur.or.id">
            info@komunitascatur.or.id
          </a>
        </p>
        <p className="ql-align-justify">
          Jam kunjung luring: Sabtu 09.00–16.00 WIB, kecuali pada tanggal libur
          yang diumumkan melalui halaman Pengumuman.
        </p>
      </PageArtikel>

      <PageArtikel title="Kirim Pesan">
        {kirim ? (
          <p>Pesan terkirim. Kami membalas pada hari kerja.</p>
        ) : (
          <form
            className="flex flex-col gap-6 max-w-xl"
            onSubmit={(e) => {
              e.preventDefault();
              setKirim(true);
            }}
          >
            <label className="flex flex-col gap-2 text-sm text-grey-800">
              Nama
              <input
                required
                name="nama"
                className="border-0 border-b border-solid border-grey-200 outline-none py-2 text-base bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-grey-800">
              Surel
              <input
                required
                type="email"
                name="email"
                className="border-0 border-b border-solid border-grey-200 outline-none py-2 text-base bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-grey-800">
              Pesan
              <textarea
                required
                name="pesan"
                rows={5}
                className="border-0 border-b border-solid border-grey-200 outline-none py-2 text-base bg-transparent resize-none"
              />
            </label>
            <button
              type="submit"
              className="self-start text-xs rounded-full px-4 py-2 border border-solid border-primary text-primary"
            >
              Kirim
            </button>
          </form>
        )}
      </PageArtikel>
    </HalamanIsi>
  );
}
