import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ambilTurnamenPublik, jenisTurnamen } from "../../lib/api/index.js";
import { parseWaktuKomunitas } from "../../lib/waktu.js";
import LencanaStatus from "../../components/LencanaStatus.jsx";

function formatTanggalShort(nilai) {
  if (!nilai) return "—";
  const d = parseWaktuKomunitas(nilai);
  if (!d) return nilai;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Turnamen() {
  const { t } = useI18n();
  const [turnamen, setTurnamen] = useState(null);
  const [jenis, setJenis] = useState({});
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let hidup = true;
    Promise.all([
      ambilTurnamenPublik(),
      jenisTurnamen()
        .then((j) => j.jenis || {})
        .catch(() => ({})),
    ])
      .then(([t, j]) => {
        if (!hidup) return;
        setTurnamen(t);
        setJenis(j);
      })
      .catch(() => {
        if (hidup) setGagal(true);
      });
    return () => {
      hidup = false;
    };
  }, []);

  return (
    <HalamanIsi
      title={t("turnamen.judul")}
      description={t("turnamen.deskripsi")}
      next={{ to: "/turnamen/turnamen-bulanan", judul: t("turnamen.nextJudul") }}
    >
      <PageArtikel title="Turnamen Liga Catur">
        <div className="mb-6 flex flex-wrap gap-2 text-sm">
          <Link to="/pendaftaran-anggota" className="border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
            Mendaftar Anggota
          </Link>
          <Link to="/beranda/peringkat" className="border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
            Liga Utama
          </Link>
          <Link to="/papan-interaktif" className="border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
            Turnamen Langsung
          </Link>
          <Link to="/turnamen/liga-musiman" className="border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
            Kursi Empat
          </Link>
          <a href="#history" className="border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
            Hasil Sebelumnya
          </a>
        </div>

        <p>
          Turnamen Liga Catur adalah wadah utama kompetisi komunitas. Sistem kami terinspirasi dari{" "}
          <a href="https://ligacatur.com/tournament#history" target="_blank" rel="noreferrer">
            ligacatur.com/tournament#history
          </a>{" "}
          — periode turnamen fleksibel, bisa dimainkan di Lichess / Chess.com kapan saja selama turnamen
          ketika anda punya waktu luang.
        </p>

        <h3>Turnamen Liga Catur Ketujuh</h3>
        <p>
          Turnamen berlangsung dari tanggal <strong>31 Agustus 2022</strong> sampai tanggal{" "}
          <strong>14 September 2022</strong> (ditutup jam 23:59:59 WIB). Permainan bisa dimainkan di
          Lichess kapan saja selama turnamen ketika anda punya waktu luang. Silahkan diunduh aplikasi di{" "}
          <a href="https://lichess.org" target="_blank" rel="noreferrer">
            Lichess
          </a>{" "}
          baik versi website maupun mobile dan mencoba segera bermain. Bergabung dengan WA Grup kami
          wajib. Sangat sulit untuk berkoordinasi tanpa bergabung di grup.
        </p>

        <h4>Berapa kali harus main?</h4>
        <p>
          Tergantung jumlah peserta. Kami bisa melakukan sistem swiss atau round robin. Waktu main bebas
          (ini yang sedikit membedakan dengan turnamen online), setting waktu juga bebas. Silahkan gabung
          saja ke grup WA kami.
        </p>

        <h4>Apa syarat bermain?</h4>
        <p>
          Anda bisa bermain catur dari awal sampai selesai. Mendaftar menjadi anggota Liga Catur, dan
          mendaftar Turnamen jika masih terbuka. Anda juga diwajibkan bergabung di grup WA kami. Syarat
          penting adalah <strong>anda tidak curang</strong>. Menggunakan engine adalah tindakan buruk dan
          kami dengan keras melarangnya. Jika akun Lichess/Chess.com anda terkena pelanggaran, maka anda
          akan kami keluarkan dari grup dan dilarang bergabung kembali.
        </p>

        <h4>Verifikasi pemain?</h4>
        <p>
          Saat ini dengan bergabung di grup kami sudah cukup. Anda sudah memberi kami nomor telepon.
          Ke depannya bisa saja kami membutuhkan tatap muka di Zoom dan memperlihatkan kartu identitas.
        </p>

        <h4>Cara bermain?</h4>
        <p>
          Ketika anda sudah mendapatkan lawan sesuai pilihan sistem, anda diminta untuk bermain melawan
          pemain tersebut kapan saja selama turnamen. Tekan link &quot;Papan Komunikasi&quot; di halaman
          Lawan dan Skor. Setelah komunikasi dengan lawan, kedua pemain harus online sesuai waktu luang.
          Pemain yang pegang Putih wajib membuat papan dan melangkah pertama. Ketika Hitam sudah juga
          melangkah pertama, maka papan permainan sudah resmi dan harus dihitung hasilnya. Masih bisa
          dibatalkan jika salah setting atau Hitam sedang tidak online. Setelah permainan selesai, anda
          bisa membantu Ambil Skor atau kami secara periodik akan merekap hasilnya.
        </p>

        <h4>Cara menghitung skor?</h4>
        <p>
          Menang 1, remis 1/2, dan kalah 0. Jika papan tidak dimainkan, maka kedua pemain mendapat skor 0.
          Kedepannya kami mencoba bermacam-macam variasi penghitungan. Bisa klub lawan klub, bisa kelompok
          umur tertentu.
        </p>

        <h4>Pertandingan Kursi Empat</h4>
        <p>
          Apa itu kursi empat? Kursi empat terjemahan quad adalah pertandingan yang hanya melibatkan 4
          pemain. Pemain A lawan B, C lawan D, A lawan C, B lawan D, A lawan D, dan B lawan C. Warna diatur
          dan diacak. Pemain bermain 3 ronde pada hari tersebut dan menyelesaikannya. Untuk hadiahnya,
          silahkan tanya kepada admin sebelum membuat kursi empat apakah ada hadiahnya.
        </p>

        <h4>Kemenangan Berturut</h4>
        <p>Belum ada untuk Kemenangan Berturut (winning streak).</p>

        <h4>Hadiah Turnamen</h4>
        <p>
          Pada akhir turnamen, pemain-pemain dengan skor paling tinggi akan mendapat hadiah. Jika ada skor
          yang sama, maka hadiah dibagi rata. Hadiah akan ditransfer ke rekening pemain lewat online
          banking dengan biaya transfer ditanggung pemenang.
        </p>

        <h4>Rating dan peringkat</h4>
        <p>
          Setiap permainan akan mempengaruhi rating/peringkat pemain. Kami menggunakan penghitungan ELO
          Rating. Rating awal 1000. Jika anda punya FIDE rating yang sudah mapan atau USCF rating yang
          sudah mapan, kami bisa mengkonversinya ke rating Liga Catur. Peringkat bukan nilai yang dihitung
          untuk hadiah turnamen ini.
        </p>

        <h4>Grup WA (WhatsApp) Liga Catur</h4>
        <p>
          Untuk memudahkan berkomunikasi kami menggunakan WhatsApp. Silahkan bergabung dalam grup kami.
        </p>

        <h4>Sponsor</h4>
        <p>
          Kami masih berkembang dan membutuhkan sponsor. Jika komunitas, lembaga, atau perusahaan anda ingin
          mengadakan turnamen online, kami dengan senang hati memfasilitasinya. Sistem yang kami pakai
          berpengalaman menjalankan turnamen dengan ribuan peserta.
        </p>

        <h4>Wasit Turnamen</h4>
        <p>
          Walau tidak ada wasit resmi dalam turnamen, kami mempunyai beberapa pemain yang menjadi wasit
          untuk memutuskan jika ada perselisian dan kita selesaikan secara kekeluargaan.
        </p>
      </PageArtikel>

      <PageArtikel title="Hasil Tournamen">
        <p id="history" className="scroll-mt-[140px]">
          Daftar hasil turnamen komunitas. Kolom persis seperti di ligacatur.com: # | Nama Turnamen |
          Kategori | Tanggal Mulai | Tanggal Berakhir.
        </p>

        {gagal ? (
          <p>Jadwal tidak dapat dimuat.</p>
        ) : turnamen === null ? (
          <p>Memuat jadwal...</p>
        ) : turnamen.length ? (
          <div className="overflow-auto">
            <table className="tabel-kci">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama Turnamen</th>
                  <th>Kategori</th>
                  <th>Tanggal Mulai</th>
                  <th>Tanggal Berakhir</th>
                </tr>
              </thead>
              <tbody>
                {[...turnamen]
                  .sort((a, b) => {
                    const da = parseWaktuKomunitas(a.mulai)?.getTime() || 0;
                    const db = parseWaktuKomunitas(b.mulai)?.getTime() || 0;
                    return db - da;
                  })
                  .map((t, i) => {
                    const label = jenis[t.jenis]?.label || t.jenis;
                    const slug = jenis[t.jenis]?.slug;
                    const href = slug ? `/turnamen/${slug}` : "";
                    return (
                      <tr key={t.id}>
                        <td>{i + 1}</td>
                        <td>
                          {href ? (
                            <Link to={href} className="font-medium text-[#0B2F9F]">
                              {t.nama}
                            </Link>
                          ) : t.tautan ? (
                            <a
                              href={t.tautan}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-[#0B2F9F]"
                            >
                              {t.nama}
                            </a>
                          ) : (
                            <span className="font-medium">{t.nama}</span>
                          )}{" "}
                          <span className="ml-2">
                            <LencanaStatus status={t.status} />
                          </span>
                        </td>
                        <td>{label}</td>
                        <td>{formatTanggalShort(t.mulai)}</td>
                        <td>{formatTanggalShort(t.selesai || t.mulai)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Belum ada hasil turnamen.</p>
        )}

        <p className="mt-6">
          <strong>Jenis turnamen di KCI:</strong>
        </p>
        <ol>
          <li>
            <Link to="/turnamen/turnamen-bulanan">{t("nav.turnamenBulanan")}</Link>:{" "}
            {t("turnamen.l1")}
          </li>
          <li>
            <Link to="/turnamen/liga-musiman">{t("nav.ligaMusiman")}</Link>: {t("turnamen.l2")}
          </li>
          <li>
            <Link to="/turnamen/turnamen-terbuka">{t("nav.turnamenTerbuka")}</Link>:{" "}
            {t("turnamen.l3")}
          </li>
          <li>
            <Link to="/turnamen/liga-antar-komunitas">{t("nav.ligaAntarKomunitas")}</Link>:{" "}
            {t("turnamen.l4")}
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
