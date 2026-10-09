import { createContext, useContext } from "react";

const KonteksI18n = createContext(null);

export function useI18n() {
  return useContext(KonteksI18n);
}

export { KonteksI18n };
