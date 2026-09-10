/**
 * Pasang lingkungan jsdom sebagai global Node SEBELUM modul React diimpor
 * (dipakai scripts/uji-navigasi.mjs). React DOM membaca `window`/`document`
 * pada saat render, bukan saat import — tapi lebih aman dipasang duluan.
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM(
  "<!doctype html><html><body><div id=root></div></body></html>",
  { url: "http://localhost/", pretendToBeVisual: true }
);

const pasang = (nama, nilai) =>
  Object.defineProperty(globalThis, nama, {
    value: nilai,
    configurable: true,
    writable: true,
  });

pasang("window", dom.window);
pasang("document", dom.window.document);
pasang("navigator", dom.window.navigator);
pasang("localStorage", dom.window.localStorage);
pasang("HTMLElement", dom.window.HTMLElement);
pasang("Element", dom.window.Element);
pasang("Node", dom.window.Node);
// jsdom tidak menyediakan ResizeObserver (digunakan Summary dkk.). Polyfill
// no-op: cukup agar efek komponen tidak melempar; perilaku responsif layar
// kecil diuji lewat ukuran window, bukan lewat observer.
class ResizeObserverPolyfill {
  observe() {}
  unobserve() {}
  disconnect() {}
}
pasang("ResizeObserver", ResizeObserverPolyfill);
dom.window.ResizeObserver = ResizeObserverPolyfill;
// jsdom tidak mengimplementasikan Element.prototype.scrollTo (digunakan
// daftar langkah Moves untuk meluncur ke langkah aktif). Polyfill no-op.
dom.window.Element.prototype.scrollTo = function scrollTo() {};
// Wajib agar React act() tidak memperingatkan di lingkungan non-CI.
pasang("IS_REACT_ACT_ENVIRONMENT", true);

export default dom;
