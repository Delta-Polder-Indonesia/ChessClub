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
// Radix (AlertDialog dipakai layar Database & Deteksi engine) membaca
// getComputedStyle/MutationObserver sebagai global saat dialog dibuka, dan
// membuat Event/CustomEvent global yang harus se-realm dengan document jsdom.
pasang("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
pasang("MutationObserver", dom.window.MutationObserver);
pasang("Event", dom.window.Event);
pasang("CustomEvent", dom.window.CustomEvent);
// framer-motion (halaman Hubungi Kami dkk.) memeriksa `instanceof SVGElement`
// saat memasang node proyeksi — tanpa global ini render melempar
// ReferenceError di lingkungan uji.
pasang("SVGElement", dom.window.SVGElement);
/*
 * Radix Tabs (panel Akun) memanggil requestAnimationFrame sebagai global,
 * bukan lewat window — jadi globalnya wajib ada.
 *
 * Yang dipasang di sini BUKAN `dom.window.requestAnimationFrame` milik jsdom,
 * melainkan rAF berbasis antrean tugas makro. Alasannya: rAF jsdom digerakkan
 * jam animasinya sendiri (satu frame ≈ 16 ms), sehingga "tunggu satu siklus
 * timer" di uji tidak lagi berarti "satu frame sudah jalan". Akibatnya uji
 * yang membaca DOM setelah `setTimeout(…, 10)` (mis. scripts/uji-jsonld.mjs
 * membaca <head> yang ditulis react-helmet-async di dalam rAF) menang di mesin
 * lengang dan gagal di runner CI yang sibuk — frame 16 ms-nya belum sempat
 * menyala saat pembacaan terjadi.
 *
 * Dengan rAF berbasis antrean tugas makro, satu frame = satu tugas makro, jadi
 * hasil uji tidak bergantung pada kecepatan mesin. Callback tetap menerima
 * stempel waktu seperti rAF sungguhan (komponen seperti framer-motion
 * memakainya untuk menghitung delta).
 */
function rafUji(callback) {
  return setTimeout(() => callback(performance.now()), 0);
}
pasang("requestAnimationFrame", rafUji);
pasang("cancelAnimationFrame", (id) => clearTimeout(id));
// jsdom tidak mengimplementasikan Element.prototype.scrollTo (digunakan
// daftar langkah Moves untuk meluncur ke langkah aktif). Polyfill no-op.
dom.window.Element.prototype.scrollTo = function scrollTo() {};
// Wajib agar React act() tidak memperingatkan di lingkungan non-CI.
pasang("IS_REACT_ACT_ENVIRONMENT", true);

export default dom;
