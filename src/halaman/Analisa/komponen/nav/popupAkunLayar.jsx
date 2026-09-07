/*
 * Popup "Layar Akun" — layar daftar akun + statistik + tabel partai dalam
 * popup full layar, ukurannya sama dengan PopupDatabase (menutupi seluruh
 * area kerja di samping bilah Nav). Sebelumnya layar ini tampil di dalam
 * panel kanan (Menu) selebar kolom itu; sekarang dibuka dari tombol "Akun"
 * di Nav dan punya ruang seluas database.
 *
 * Struktur dua kolom: kiri = daftar akun (DaftarAkun), kanan = dashboard
 * statistik (DashboardAkun). Tabel partai tidak lagi tersedia di sini karena
 * sudah ada di Basis Data (popupDatabase).
 */
import { useContext, useEffect, useState } from "react";
import Popup from "./Popup.jsx";
import DaftarAkun from "../../akun/DaftarAkun.jsx";
import DashboardAkun from "../../akun/DashboardAkun.jsx";
import { bacaDaftarAkun, tambahKeDaftar, hapusDariDaftar } from "../../akun/daftarAkun.js";
import { AnalyzeContext } from "../../konteks/analyze.jsx";

export default function PopupAkunLayar({ onTutup, lebarKiri = 0 }) {
  const analyzeContext = useContext(AnalyzeContext);
  const [username, setUsername] = analyzeContext.akun;
  const [data] = analyzeContext.data;
  const [daftar, setDaftar] = useState(() => bacaDaftarAkun());
  const [muatUlang, setMuatUlang] = useState(0);

  /*
   * Klik baris partai di tabel → AnalyzeContext.data berubah jadi
   * { format: "pgn" } dan Game mulai menganalisis. Popup harus menutup
   * diri supaya analisisnya terlihat di papan. Dipantau lewat `data`
   * (bukan pageState) karena membuka popup ikut mengosongkan data dulu —
   * pageState sempat "loading" sesaat, tapi data pgn hanya muncul saat
   * pengguna benar-benar memilih partai.
   */
  useEffect(() => {
    if (data.format === "pgn" && data.string) onTutup();
  }, [data, onTutup]);

  // Sinkronkan daftar dengan akun yang dipilih lewat popup Akun di Nav.
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
    <Popup
      onTutup={onTutup}
      fullLayar
      lebarKiri={lebarKiri}
      className="max-w-none"
    >
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
    </Popup>
  );
}