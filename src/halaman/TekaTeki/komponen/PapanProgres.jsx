/**
 * Papan + penanganan seret klik-sintetis untuk halaman Teka-Teki.
 *
 * Logika "klik sesudah pointerup tidak boleh membatalkan pilihan" dulu
 * menumpang di komponen halaman (dua `ref` + dua `useCallback`). Sekarang
 * pembungkus ini memilikinya, sehingga halaman tidak perlu tahu detail
 * sintesis klik peramban.
 */
import { useCallback, useEffect, useRef } from "react";
import PapanTekaTeki from "../PapanTekaTeki.jsx";

const DURASI_KLIK_SINTETIS = 500;

export default function PapanProgres({
  onKlik,
  onMulaiSeret,
  onSelesaiSeret,
  onBatalSeret,
  ...sisa
}) {
  const abaikanKlikRef = useRef(false);
  const timerRef = useRef(null);

  const batalkanAbaikanKlik = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    abaikanKlikRef.current = false;
  }, []);

  const telanKlikBerikutnya = useCallback(() => {
    batalkanAbaikanKlik();
    abaikanKlikRef.current = true;
    const timer = window.setTimeout(() => {
      if (timerRef.current !== timer) return;
      timerRef.current = null;
      abaikanKlikRef.current = false;
    }, DURASI_KLIK_SINTETIS);
    timerRef.current = timer;
  }, [batalkanAbaikanKlik]);

  useEffect(() => {
    document.addEventListener("pointerdown", batalkanAbaikanKlik, true);
    return () => {
      document.removeEventListener("pointerdown", batalkanAbaikanKlik, true);
      batalkanAbaikanKlik();
    };
  }, [batalkanAbaikanKlik]);

  const klik = useCallback(
    (petak) => onKlik?.(petak, { abaikanKlik: abaikanKlikRef.current, batalkanAbaikanKlik }),
    [onKlik, batalkanAbaikanKlik]
  );

  const mulaiSeret = useCallback(
    (petak) => {
      batalkanAbaikanKlik();
      onMulaiSeret?.(petak);
    },
    [onMulaiSeret, batalkanAbaikanKlik]
  );

  const selesaiSeret = useCallback(
    (from, to, klikUlang) => {
      telanKlikBerikutnya();
      onSelesaiSeret?.(from, to, klikUlang);
    },
    [onSelesaiSeret, telanKlikBerikutnya]
  );

  const batalSeret = useCallback(() => {
    telanKlikBerikutnya();
    onBatalSeret?.();
  }, [onBatalSeret, telanKlikBerikutnya]);

  return (
    <PapanTekaTeki
      {...sisa}
      onKlik={klik}
      onMulaiSeret={mulaiSeret}
      onSelesaiSeret={selesaiSeret}
      onBatalSeret={batalSeret}
    />
  );
}
