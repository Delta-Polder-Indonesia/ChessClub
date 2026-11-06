/**
 * Utilitas hook kecil untuk halaman Teka-Teki.
 *
 * `useCallbackTerbaru` menggantikan pola manual `ref.current = fn` yang ditulis
 * di badan komponen: pola itu membuat identitas callback stabil, tetapi nilainya
 * diperbarui saat render. Versi di sini memperbarui ref lewat efek, sehingga
 * tidak ada penulisan ref selama render dan dependensi hook tetap jujur
 * (tidak perlu `eslint-disable react-hooks/exhaustive-deps`).
 */
import { useCallback, useEffect, useRef } from "react";

/** Callback dengan identitas stabil yang selalu memanggil versi terbaru. */
export function useCallbackTerbaru(fn) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useCallback((...args) => ref.current?.(...args), []);
}

/** Nilai terbaru dari sebuah nilai, dibaca tanpa memasang ulang efek. */
export function useNilaiTerbaru(nilai) {
  const ref = useRef(nilai);
  useEffect(() => {
    ref.current = nilai;
  }, [nilai]);
  return ref;
}
