/** Tulis teks ke Clipboard API dan kembalikan hasil tanpa gagal secara senyap. */
export async function salinKeClipboard(teks, clipboard = globalThis.navigator?.clipboard) {
  if (typeof clipboard?.writeText !== "function") return false;
  try {
    await clipboard.writeText(teks);
    return true;
  } catch {
    return false;
  }
}
