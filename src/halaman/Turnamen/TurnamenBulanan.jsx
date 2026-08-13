import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";

export default function TurnamenBulanan() {
  return (
    <HalamanIsi
      title="Turnamen Bulanan"
      parent="Turnamen"
      parentPath="/turnamen"
      description="Turnamen Swiss lima ronde yang diadakan setiap bulan untuk anggota dan tamu."
      next={{ to: "/turnamen/liga-musiman", judul: "Liga Musiman" }}
    >
      <PageArtikel title="Ketentuan ringkas">
        <p>
          Turnamen Bulanan memakai sistem Swiss 5 ronde. Tempo standar adalah
          15+10 (kilat panjang). Grup dipisah bila peserta lebih dari 40 orang.
        </p>
        <ol>
          <li>Pendaftaran ditutup H-1 pukul 21.00 WIB.</li>
          <li>Anggota aktif mendapat potongan biaya administrasi.</li>
          <li>Hasil diumumkan di halaman Pengumuman pada malam yang sama.</li>
        </ol>
        <p>
          Jadwal bulan berjalan diumumkan di kanal anggota dan halaman
          Pengumuman.
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
