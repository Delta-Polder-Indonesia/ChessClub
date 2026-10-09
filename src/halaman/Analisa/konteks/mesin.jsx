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

import { useCallback, useEffect, useRef, useState } from "react";
import { ENGINE_BAKU } from "../../../lib/engineCatur.js";
import { EngineAnalisis } from "../mesin/engine.js";
import { hashUntukEngine, wasmSupported } from "../mesin/cekWasm.js";
import { bacaTeks, tulis } from "../penyimpanan.js";
import { KonteksMesin } from "./mesinKonteks.js";

export function MesinProvider({ children }) {
  const [idEngine, setIdEngineState] = useState(() => bacaTeks("engine", ENGINE_BAKU));
  const [didukung] = useState(() => (typeof window === "undefined" ? true : wasmSupported()));
  const [status, setStatus] = useState("mati"); // mati | memuat | siap | gagal
  const [galat, setGalat] = useState("");
  const mesinRef = useRef(null);
  /*
   * Opsi UCI per engine (Hash MB & Threads). Ref dipakai supaya `buat` yang
   * selalu dibuat ulang memakai nilai terkini tanpa dependensi berubah.
   */
  const opsiRef = useRef({ hash: hashUntukEngine(), threads: 1 });
  const [opsi, setOpsiState] = useState(opsiRef.current);

  const ubahOpsi = useCallback((perubahan) => {
    opsiRef.current = { ...opsiRef.current, ...perubahan };
    setOpsiState(opsiRef.current);
    mesinRef.current?.terapkanOpsi?.(perubahan);
  }, []);

  const buat = useCallback((id) => {
    mesinRef.current?.hancurkan();
    mesinRef.current = new EngineAnalisis({ idEngine: id, hash: opsiRef.current.hash, threads: opsiRef.current.threads });
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
      tulis("engine", id);
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
    /** Opsi UCI aktif (Hash MB & Threads). */
    opsi,
    /** Ubah opsi UCI — langsung disetel ke worker bila sudah ada. */
    ubahOpsi,
    /** Instance engine aktif, atau null bila belum pernah dimuat. */
    ambilMesin: () => mesinRef.current,
    didukung,
  };

  return <KonteksMesin.Provider value={nilai}>{children}</KonteksMesin.Provider>;
}
