import { Link } from "react-router-dom";
import { BagianBeranda } from "./TataLetakBeranda.jsx";

/** Arahkan kebutuhan anggota ke kanal yang tersedia, tanpa kontak fiktif. */
export default function HubungiAdmin() {
  return (
    <BagianBeranda id="hubungi-admin" title="Hubungi Admin">
      <p>
        Tim pengurus siap membantu pertanyaan keanggotaan, turnamen, dan
        kendala teknis. Kirim detail yang cukup agar tindak lanjut dapat
        dilakukan dengan cepat dan tepat.
      </p>
      <div className="mt-7 flex flex-col gap-4 sm:flex-row">
        <Link
          to="/hubungi-kami"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Kirim pesan ke pengurus
        </Link>
        <Link
          to="/pendaftaran-anggota"
          className="inline-flex items-center justify-center rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Bantuan pendaftaran anggota
        </Link>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-slate-600">
        Untuk menjaga privasi, jangan mengirim kata sandi Chess.com, token,
        atau data identitas sensitif melalui formulir pesan.
      </p>
    </BagianBeranda>
  );
}
