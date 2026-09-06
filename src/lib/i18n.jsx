import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ID } from "./terjemahan/id/index.js";

const SIMPAN = "kci-bahasa";

const KonteksI18n = createContext(null);

export function I18nProvider({ children }) {
  const [bahasa, setBahasa] = useState(() => {
    try {
      const simpan = localStorage.getItem(SIMPAN);
      if (simpan === "en" || simpan === "id") return simpan;
    } catch (_) {
      /* localStorage tidak tersedia */
    }
    return "id";
  });
  const [kamusEn, setKamusEn] = useState(null);

  // Kamus Inggris cukup besar dan tidak diperlukan bagi mayoritas pengunjung.
  // Saat bahasa EN dipilih/tersimpan, browser mengambil chunk ini sekali lalu
  // menyimpannya pada state untuk perpindahan bahasa berikutnya.
  useEffect(() => {
    if (bahasa !== "en" || kamusEn) return undefined;
    let aktif = true;
    import("./terjemahan/en/index.js")
      .then((modul) => {
        if (aktif) setKamusEn(modul.EN);
      })
      // Bila koneksi putus, teks Indonesia tetap menjadi fallback yang aman.
      .catch(() => {});
    return () => { aktif = false; };
  }, [bahasa, kamusEn]);

  useEffect(() => {
    document.documentElement.lang = bahasa;
    try {
      localStorage.setItem(SIMPAN, bahasa);
    } catch (_) {
      /* abaikan */
    }
  }, [bahasa]);

  const t = useCallback(
    (kunci, ganti = {}) => {
      let teks = kunci
        .split(".")
        .reduce((o, k) => (o ? o[k] : undefined), bahasa === "en" ? (kamusEn || ID) : ID);
      teks = teks ?? kunci;
      for (const [k, v] of Object.entries(ganti)) {
        teks = teks.replaceAll(`{${k}}`, v);
      }
      return teks;
    },
    [bahasa, kamusEn]
  );

  const nilai = useMemo(() => ({ bahasa, setBahasa, t }), [bahasa, t]);

  return <KonteksI18n.Provider value={nilai}>{children}</KonteksI18n.Provider>;
}

export function useI18n() {
  return useContext(KonteksI18n);
}
