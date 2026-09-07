/*
 * Layar "Akun" — daftar akun + statistik, menempati seluruh area kerja di
 * samping bilah Nav (ruang yang sama dengan layar Basis Data). Dulu layar ini
 * berupa popup full layar yang dibuka dari tombol "Akun"; kini ia salah satu
 * layar area kerja, dipilih dari bilah navigasi seperti tab di halaman
 * Pengurus.
 *
 * Struktur dua kolom: kiri = daftar akun (DaftarAkun), kanan = dashboard
 * statistik (DashboardAkun). Tabel partai tidak lagi tersedia di sini karena
 * sudah ada di Basis Data (layarDatabase).
 */
import { useContext, useEffect, useState } from "react";
import PanelLayar from "./PanelLayar.jsx";
import DaftarAkun from "../../akun/DaftarAkun.jsx";
import DashboardAkun from "../../akun/DashboardAkun.jsx";
import { bacaDaftarAkun, tambahKeDaftar, hapusDariDaftar } from "../../akun/daftarAkun.js";
import { AnalyzeContext } from "../../konteks/analyze.jsx";

export default function LayarAkun({ onTutup }) {
  const analyzeContext = useContext(AnalyzeContext);
  const [username, setUsername] = analyzeContext.akun;
  const [daftar, setDaftar] = useState(() => bacaDaftarAkun());
  const [muatUlang, setMuatUlang] = useState(0);

  /*
   * Dulu ada efek di sini: "bila `data` berisi PGN, panggil onTutup()" —
   * waktu itu layar Akun masih punya tabel partai, jadi memilih partai dari
   * dalam layar ini harus mengembalikan pengguna ke papan.
   *
   * Efek itu sekarang berbahaya sekaligus mubazir. Berbahaya karena ia
   * berjalan saat komponen DIPASANG: begitu pengguna sudah memuat partai
   * PGN lalu menekan menu "Akun", `data.format` masih "pgn", efeknya
   * langsung memanggil onTutup() dan layar Akun memantul kembali ke papan
   * — layar itu jadi mustahil dibuka. Mubazir karena tabel partai sudah
   * pindah ke layar Basis Data: tidak ada lagi jalan dari dalam layar ini
   * untuk mengubah `data`.
   *
   * Yang mengembalikan pengguna ke papan kini eksplisit: `muatPartai()` di
   * areaKerja.jsx (dipanggil layar Basis Data / Impor setelah partai
   * dipilih), dan `onTutup()` di bawah untuk kasus akun terakhir dihapus.
   */

  // Sinkronkan daftar dengan akun yang dipilih dari luar layar ini.
  useEffect(() => {
    const list = bacaDaftarAkun();
    if (username?.username) {
      const ada = list.some(
        (a) =>
          a.platform === username.platform &&
          String(a.username || "").toLowerCase() === String(username.username || "").toLowerCase(),
      );
      if (!ada) tambahKeDaftar({ platform: username.platform, username: username.username });
    }
    setDaftar(bacaDaftarAkun());
  }, [username?.username, username?.platform]);

  function tambahAkunHandler(platform, nama) {
    const list = tambahKeDaftar({ platform, username: nama });
    setDaftar(list);
    setUsername({ platform, username: nama });
  }

  function hapusAkunHandler(platform, nama) {
    const list = hapusDariDaftar(platform, nama);
    setDaftar(list);
    if (
      String(username?.username || "").toLowerCase() === String(nama || "").toLowerCase() &&
      username?.platform === platform
    ) {
      const berikut = list[0];
      if (!berikut) {
        // Akun aktif terakhir dihapus dan tidak ada yang tersisa → kembali
        // ke papan; kolom statistik tidak punya apa-apa untuk ditampilkan.
        setUsername({ platform: "", username: "" });
        onTutup();
        return;
      }
      setUsername({ platform: berikut.platform, username: berikut.username });
    }
  }

  return (
    <PanelLayar>
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {/* Kolom kiri: daftar akun + tombol tambah */}
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-1/2 lg:min-h-0">
          <DaftarAkun
            daftar={daftar}
            aktif={username}
            onPilih={(p, u) => {
              setDaftar(tambahKeDaftar({ platform: p, username: u }));
              setUsername({ platform: p, username: u });
            }}
            onHapus={hapusAkunHandler}
            onTambah={tambahAkunHandler}
            onRefresh={() => setMuatUlang((x) => x + 1)}
          />
        </div>

        {/* Kolom kanan: dashboard statistik */}
        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-2 lg:w-1/2">
          <div className="min-h-0 min-w-0 flex-1 flex flex-col">
            <DashboardAkun
              platform={username?.platform}
              username={username?.username}
              muatUlang={muatUlang}
            />
          </div>
        </div>
      </div>
    </PanelLayar>
  );
}