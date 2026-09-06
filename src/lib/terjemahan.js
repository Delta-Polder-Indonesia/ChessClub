/**
 * Facade untuk alat validasi Node (mis. `node scripts/uji-i18n.mjs`).
 * Aplikasi di browser mengimpor ID dari `./terjemahan/id/index.js` dan memuat
 * kamus EN secara lazy dari `./terjemahan/en/index.js`.
 */
export { ID } from "./terjemahan/id/index.js";
export { EN } from "./terjemahan/en/index.js";
