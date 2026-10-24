/*
 * Layar "Akun" — daftar akun + kartu kanan kosong (disiapkan untuk konten lain), responsive mobile.
 */
import { useContext, useEffect, useState } from "react";
import PanelLayar from "./PanelLayar.jsx";
import DaftarAkun from "../../akun/DaftarAkun.jsx";
import { bacaDaftarAkun, tambahKeDaftar, hapusDariDaftar } from "../../akun/daftarAkun.js";
import { hapusKoleksi, pastikanKoleksi } from "../../basisData.js";
import { AnalyzeContext } from "../../konteks/analyzeKonteks.js";

export default function LayarAkun({ onTutup }) {
  const analyzeContext = useContext(AnalyzeContext);
  const [username, setUsername] = analyzeContext.akun;
  const [daftar, setDaftar] = useState(() => bacaDaftarAkun());

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
      }
    }
    /*
     * Selaraskan SELURUH daftar ke basis data, bukan hanya akun aktif:
     * bila IndexedDB pernah dibersihkan (atau akun ditambahkan sebelum
     * koleksinya sempat tersimpan), akun-akun lain tidak punya koleksi dan
     * tidak akan pernah muncul di layar Database.
     */
    for (const a of bacaDaftarAkun()) {
      if (a?.platform && a?.username) {
        pastikanKoleksi({ platform: a.platform, username: a.username }).catch(() => {});
      }
    }
    setDaftar(bacaDaftarAkun());
  }, [username?.username, username?.platform]);

  function tambahAkunHandler(platform, nama) {
    const list = tambahKeDaftar({ platform, username: nama });
    setDaftar(list);
    setUsername({ platform, username: nama });
    pastikanKoleksi({ platform, username: nama }).catch(() => {});
  }

  function hapusAkunHandler(platform, nama) {
    const list = hapusDariDaftar(platform, nama);
    setDaftar(list);
    hapusKoleksi(`${platform}:${String(nama || "").trim().toLowerCase()}`).catch(() => {});
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
      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 lg:flex-row">
        {/* Kolom kiri: daftar akun - di HP max 45vh biar statistik tetap kelihatan */}
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-1/2 lg:min-h-0 max-h-[45vh] sm:max-h-[38vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
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

        {/* Kolom kanan: kartu dibiarkan kosong untuk konten berikutnya */}
        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-2 lg:w-1/2 overflow-y-auto">
          <div className="min-h-0 min-w-0 flex-1 flex flex-col">
            <div className="flex h-full w-full flex-col p-1" data-uji="akun-kartu-kanan">
              <div className="flex min-h-48 lg:min-h-0 flex-1 flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox" />
            </div>
          </div>
        </div>
      </div>
    </PanelLayar>
  );
}
