import { useI18n } from "../lib/i18n.jsx";

function formatTanggal(tanggal, bahasa) {
  if (!tanggal) return "";
  const nilai = new Date(`${tanggal}T00:00:00Z`);
  if (Number.isNaN(nilai.getTime())) return tanggal;
  return new Intl.DateTimeFormat(bahasa === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(nilai);
}

/** Daftar berita/pengumuman bergambar dengan bahasa visual korporat. */
export default function DaftarKontenMedia({ daftar, jenis }) {
  const { bahasa } = useI18n();

  return (
    <ul className="daftar-konten-media">
      {daftar.map((item) => (
        <li
          key={item.id}
          className={`baris-konten-media${item.gambar ? " dengan-gambar" : " tanpa-gambar"}`}
        >
          {item.gambar && (
            <div className="gambar-konten-media">
              <img
                src={item.gambar}
                alt={item.altGambar || item.judul}
                width="320"
                height="180"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          <article className="isi-konten-media">
            <p className="jenis-konten-media">
              {jenis === "berita" ? "Berita Komunitas" : "Pengumuman"}
            </p>
            <h3>{item.judul}</h3>
            <time dateTime={item.tanggal}>{formatTanggal(item.tanggal, bahasa)}</time>
            {item.ringkasan && <p className="ringkasan-konten-media">{item.ringkasan}</p>}
            <p className="teks-konten-media">{item.isi}</p>
          </article>
        </li>
      ))}
    </ul>
  );
}
