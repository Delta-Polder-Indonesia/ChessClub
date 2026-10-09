import { createContext, useContext } from "react";

export const KonteksMesin = createContext(null);

export function useMesin() {
  const konteks = useContext(KonteksMesin);
  if (!konteks) throw new Error("useMesin() harus dipakai di dalam <MesinProvider>");
  return konteks;
}
