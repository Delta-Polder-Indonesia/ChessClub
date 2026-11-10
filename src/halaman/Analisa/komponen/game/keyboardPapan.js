/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
/**
 * Logika keyboard papan Analisa — diekstrak dari game.jsx agar dapat diuji
 * langsung tanpa menduplikasi helper. Berkas ini adalah SATU-SATUNYA sumber
 * kebenaran untuk isElemenInteraktif, isDialogAktif, dan handleKeyDown.
 *
 * game.jsx mengimpor dari sini; scripts/uji-keyboard-analisa.mjs juga
 * mengimpor dari sini — keduanya menjalankan kode yang identik.
 */
import { TAMPILAN_ANALISA } from "../../konteks/analyzeKonteks.js";

export function isElemenInteraktif(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return true;
  if (el.isContentEditable) return true;
  if (el.closest) {
    if (el.closest('[contenteditable="true"], [contenteditable=""]')) return true;
    if (el.closest('button, input, textarea, select, a[href], [contenteditable], [role="button"]')) return true;
    if (el.closest('[role="dialog"], dialog, [aria-modal="true"]')) return true;
  }
  return false;
}

export function isDialogAktif() {
  const kandidat = document.querySelectorAll('dialog[open], [role="dialog"], [aria-modal="true"]');
  for (const el of kandidat) {
    if (el.hidden) continue;
    if (el.getAttribute("aria-hidden") === "true") continue;
    if (el.style.display === "none" || el.style.visibility === "hidden") continue;
    if (el.closest("[hidden]")) continue;
    try {
      const style = window.getComputedStyle?.(el);
      if (style && (style.display === "none" || style.visibility === "hidden")) continue;
    } catch (_e) {
      /* getComputedStyle tidak tersedia di env tanpa window */
    }
    return true;
  }
  return false;
}

/**
 * Buat handler keydown produksi. Parameter adalah ref dan controller yang
 * sama dengan yang dipakai game.jsx — handler membaca .current saat event
 * terjadi, bukan saat dibuat.
 */
export function buatHandleKeyDown({ tampilanRef, pageStateRef, dragRef, analyzingMoveRef, gameController }) {
  let lastPressed = 0;
  return function handleKeyDown(e) {
    /*
     * Pintasan pemutar partai hanya berlaku saat papan yang tampil.
     * Papan tidak pernah dilepas saat layar berganti (lihat areaKerja.jsx)
     * — jadi tanpa penjaga ini, mengetik di layar Basis Data atau menekan
     * panah untuk menggulir tabel partai akan menggerakkan papan di
     * baliknya. `tampilanRef`, bukan `tampilan`: efek ini dipasang
     * sekali, sehingga pembacaan langsung akan selamanya berisi nilai
     * render pertama.
     */
    if (tampilanRef.current !== TAMPILAN_ANALISA.BERMAIN) return;
    // Kalau belum ada partai termuat, biarkan peramban menggulirkan
    // halaman seperti biasa.
    if (pageStateRef.current === "default") return;
    // Pintasan tidak boleh mengambil alih navigasi keyboard standar
    // dan interaksi kontrol. Tab dibiarkan untuk perpindahan fokus
    // browser; Space/Enter pada tombol harus mengaktifkan tombol itu,
    // bukan memutar partai.
    if (isDialogAktif()) return;
    const element = e.target;
    if (isElemenInteraktif(element)) return;
    const now = new Date().getTime();
    const minPressInterval = 25;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        if (dragRef.current.is) return;
        if (now - lastPressed < minPressInterval) return;
        if (analyzingMoveRef.current) return;
        gameController.back();
        lastPressed = new Date().getTime();
        break;
      case "ArrowRight":
        e.preventDefault();
        if (dragRef.current.is) return;
        if (now - lastPressed < minPressInterval) return;
        if (analyzingMoveRef.current) return;
        gameController.forward();
        lastPressed = new Date().getTime();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (dragRef.current.is) return;
        if (now - lastPressed < minPressInterval) return;
        if (analyzingMoveRef.current) return;
        gameController.first();
        lastPressed = new Date().getTime();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (dragRef.current.is) return;
        if (now - lastPressed < minPressInterval) return;
        if (analyzingMoveRef.current) return;
        gameController.last();
        lastPressed = new Date().getTime();
        break;
      case " ":
      case "Spacebar":
        e.preventDefault();
        if (dragRef.current.is) return;
        if (now - lastPressed < minPressInterval) return;
        if (analyzingMoveRef.current) return;
        gameController.togglePlay();
        lastPressed = new Date().getTime();
        break;
      default:
        break;
    }
  };
}
