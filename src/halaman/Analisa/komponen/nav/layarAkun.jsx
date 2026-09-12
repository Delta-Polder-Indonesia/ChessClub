/*
 * Layar "Akun" — daftar akun + statistik, menempati seluruh area kerja di
 * samping bilah Nav. 
 *
 * UPDATE:
 * - Tombol tarik data dihapus dari daftar akun — hanya info profile.
 * - Saat akun didaftarkan, koleksi kosong langsung dibuat di IndexedDB
 *   (pastikanKoleksi) agar otomatis muncul di layar Database.
 */
import { useContext, useEffect, useState } from "react";
import PanelLayar from "./PanelLayar.jsx";
import DaftarAkun from "../../akun/DaftarAkun.jsx";
import DashboardAkun from "../../akun/DashboardAkun.jsx";
import { bacaDaftarAkun, tambahKeDaftar, hapusDariDaftar } from "../../akun/daftarAkun.js";
import { pastikanKoleksi } from "../../basisData.js";
import { AnalyzeContext } from "../../konteks/analyze.jsx";

export default function LayarAkun({ onTutup }) {
  const analyzeContext = useContext(AnalyzeContext);
  const [username, setUsername] = analyzeContext.akun;
  const [daftar, setDaftar] = useState(() => bacaDaftarAkun());

  // Sinkronkan daftar dengan akun yang dipilih dari luar layar ini.
  useEffect(() => {
    const list = bacaDaftarAkun();
    if (username?.username) {
      const ada = list.some(
        (a) =>
          a.platform === username.platform &&
          String(a.username || "").toLowerCase() === String(username.username || "").toLowerCase(),
      );
      if (!ada) {
        tambahKeDaftar({ platform: username.platform, username: username.username });
        // Pastikan koleksi ada di DB agar langsung muncul di Database
        pastikanKoleksi({ platform: username.platform, username: username.username }).catch(() => {});
      }
    }
    setDaftar(bacaDaftarAkun());
  }, [username?.username, username?.platform]);

  function tambahAkunHandler(platform, nama) {
    const list = tambahKeDaftar({ platform, username: nama });
    setDaftar(list);
    setUsername({ platform, username: nama });
    // Buat koleksi kosong di Database otomatis
    pastikanKoleksi({ platform, username: nama }).catch(() => {});
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
        {/* Kolom kiri: daftar akun + tombol tambah (tanpa tarik) */}
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-1/2 lg:min-h-0">
          <DaftarAkun
            daftar={daftar}
            aktif={username}
            onPilih={(p, u) => {
              const updated = tambahKeDaftar({ platform: p, username: u });
              setDaftar(updated);
              setUsername({ platform: p, username: u });
              pastikanKoleksi({ platform: p, username: u }).catch(() => {});
            }}
            onHapus={hapusAkunHandler}
            onTambah={tambahAkunHandler}
          />
        </div>

        {/* Kolom kanan: dashboard statistik (hanya baca lokal, tanpa tarik) */}
        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-2 lg:w-1/2">
          <div className="min-h-0 min-w-0 flex-1 flex flex-col">
            <DashboardAkun platform={username?.platform} username={username?.username} />
          </div>
        </div>
      </div>
    </PanelLayar>
  );
}
