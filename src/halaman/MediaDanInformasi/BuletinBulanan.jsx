import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

const EDISI = [
  { bulan: "Juli 2026", isi: "Laporan Liga Musim II dan kurikulum kelas pemula baru." },
  { bulan: "Juni 2026", isi: "Hasil simultan pelajar dan pembukaan chapter daring." },
  { bulan: "Mei 2026", isi: "Wawancara pelatih tamu dan kalender semester depan." },
];

export default function BuletinBulanan() {
  return (
    <HalamanIsi
      title="Buletin Bulanan"
      parent="Media & Informasi"
      parentPath="/media-dan-informasi"
      description="Ringkasan resmi kegiatan, hasil pertandingan, dan agenda bulan berikutnya."
      next={{ to: "/keanggotaan", judul: "Keanggotaan" }}
    >
      <PageArtikel title="Edisi terbaru">
        <p>
          Buletin dikirim ke surel anggota aktif setiap tanggal 5. Publik dapat
          membaca ringkasannya di halaman ini.
        </p>
        <ol>
          {EDISI.map((e) => (
            <li key={e.bulan}>
              <strong>{e.bulan}.</strong> {e.isi}
            </li>
          ))}
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
