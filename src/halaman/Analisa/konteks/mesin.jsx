/**
 * Konteks engine analisis.
 *
 * Semua komponen halaman Analisa (papan, panel langkah, pemutar partai) harus
 * memakai SATU worker Stockfish: tiap worker mengunduh ±7 MB WASM, jadi dua
 * worker sekaligus berarti dua kali lipat ukuran dan dua kali beban CPU.
 *
 * Provider ini yang memiliki worker tersebut:
 *  - dibuat malas (saat analisis pertama diminta),
 *  - dibangun ulang bila pengguna mengganti engine di panel Pengaturan,
 *  - dibuang saat halaman ditutup.
 *
 * Status (`mati | memuat | siap | gagal`) dibaca toolbar halaman untuk
 * menampilkan badge "engine", dan dipakai panel muat untuk menulis
 * "mengunduh engine…" sebelum persentase langkah muncul.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ENGINE_BAKU } from "../../../lib/engineCatur.js";
import { EngineAnalisis } from "../mesin/engine.js";
import { wasmSupported } from "../mesin/cekWasm.js";

const KUNCI_ENGINE = "kci-analisa-engine";

function bacaPenyimpanan(kunci, bawaan) {
  try {
    return localStorage.getItem(kunci) ?? bawaan;
  } catch {
    return bawaan;
  }
}

export const KonteksMesin = createContext(null);

export function MesinProvider({ children }) {
  const [idEngine, setIdEngineState] = useState(() => bacaPenyimpanan(KUNCI_ENGINE, ENGINE_BAKU));
  const [didukung] = useState(() => (typeof window === "undefined" ? true : wasmSupported()));
  const [status, setStatus] = useState("mati"); // mati | memuat | siap | gagal
  const [galat, setGalat] = useState("");
  const mesinRef = useRef(null);

  const buat = useCallback((id) => {
    mesinRef.current?.hancurkan();
    mesinRef.current = new EngineAnalisis({ idEngine: id });
    return mesinRef.current;
  }, []);

  /** Engine siap pakai (dimuat bila belum ada). Boleh dipanggil berulang. */
  const Siapkan = useCallback(async () => {
    const mesin = mesinRef.current ?? buat(idEngine);
    mesinRef.current = mesin;
    setStatus((s) => (s === "siap" ? s : "memuat"));
    try {
      await mesin.siapkan();
      setStatus("siap");
      setGalat("");
      return mesin;
    } catch (e) {
      setStatus("gagal");
      setGalat(e?.message ?? String(e));
      throw e;
    }
  }, [buat, idEngine]);

  const gantiEngine = useCallback(
    (id) => {
      setIdEngineState(id);
      try {
        localStorage.setItem(KUNCI_ENGINE, id);
      } catch {
        /* mode pribadi: pilihan tidak tersimpan, tidak fatal */
      }
      setStatus("mati");
      setGalat("");
      buat(id); // worker lama dibuang, yang baru dibuat di sini
    },
    [buat]
  );

  /** Batal pencarian aktif (tombol Batal pada panel muat). */
  const setop = useCallback(() => {
    mesinRef.current?.setop();
  }, []);

  useEffect(() => {
    return () => {
      mesinRef.current?.hancurkan();
      mesinRef.current = null;
    };
  }, []);

  const nilai = {
    idEngine,
    gantiEngine,
    status,
    galat,
    siapkan: Siapkan,
    setop,
    /** Instance engine aktif, atau null bila belum pernah dimuat. */
    ambilMesin: () => mesinRef.current,
    didukung,
  };

  return <KonteksMesin.Provider value={nilai}>{children}</KonteksMesin.Provider>;
}

export function gunakanMesin() {
  const konteks = useContext(KonteksMesin);
  if (!konteks) throw new Error("gunakanMesin() harus dipakai di dalam <MesinProvider>");
  return konteks;
}
