import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ID, EN } from "./terjemahan.js";

const SIMPAN = "kci-bahasa";
const KAMUS = { id: ID, en: EN };

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
        .reduce((o, k) => (o ? o[k] : undefined), KAMUS[bahasa]);
      teks = teks ?? kunci;
      for (const [k, v] of Object.entries(ganti)) {
        teks = teks.replaceAll(`{${k}}`, v);
      }
      return teks;
    },
    [bahasa]
  );

  const nilai = useMemo(() => ({ bahasa, setBahasa, t }), [bahasa, t]);

  return <KonteksI18n.Provider value={nilai}>{children}</KonteksI18n.Provider>;
}

export function useI18n() {
  return useContext(KonteksI18n);
}
