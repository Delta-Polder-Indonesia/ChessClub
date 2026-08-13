import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function BeritaKomunitas() {
  return (
    <HalamanIsi
      title="Berita Komunitas"
      parent="Media & Informasi"
      parentPath="/media-dan-informasi"
      description="Liputan kegiatan, hasil pertandingan, dan cerita anggota."
      next={{ to: "/media-dan-informasi/pengumuman", judul: "Pengumuman" }}
    >
      <PageArtikel title="Terbaru">
        <ol>
          <li className="ql-align-justify">
            <strong>12 Agustus 2026 — Turnamen Bulanan Agustus diikuti 64 pecatur.</strong>{" "}
            Rekor peserta baru untuk event internal. Grup A dimenangkan pecatur
            junior dari chapter Medan.
          </li>
          <li className="ql-align-justify">
            <strong>28 Juli 2026 — Coaching clinic struktur pion bersama pelatih tamu.</strong>{" "}
            Sesi daring 110 menit membahas Isolated Queen Pawn dan cara
            merencanakan break di pusat.
          </li>
          <li className="ql-align-justify">
            <strong>10 Desember 2025 — Hari lahir komunitas ke-10 dirayakan dengan simultan.</strong>{" "}
            Dua puluh papan simultan dibuka untuk pelajar. Acara ditutup
            pembaruan identitas visual.
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
