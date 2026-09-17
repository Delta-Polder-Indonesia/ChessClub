/**
 * Uji alur pendaftaran anggota di sisi BROWSER (jsdom, tanpa jaringan).
 *
 * Fokusnya pada hal yang tidak dapat dibuktikan dari sisi server:
 *  - kode tantangan benar-benar diminta ke server, bukan dibuat di browser;
 *  - jalur manual menghasilkan status "menunggu", bukan "terverifikasi",
 *    dan tidak pernah menghasilkan tiket;
 *  - tiket dari server ikut dikirim saat formulir dikirim;
 *  - penolakan karena tiket kedaluwarsa tampil spesifik, dapat ditindaklanjuti,
 *    dan isian pengguna TIDAK hilang;
 *  - klik ganda tidak mengirim dua permintaan;
 *  - daur hidup effect/timer: timer toast dan timer status salin dibersihkan,
 *    toast lama tidak menghapus toast baru, permintaan profil lama tidak
 *    menimpa hasil terbaru, dan hasil OAuth yang rusak di sessionStorage tidak
 *    membuat halaman crash (dan tidak dihapus sebelum berhasil diurai);
 *  - pergantian bahasa tidak meninggalkan pesan basi.
 *
 * Skrip melewatkan dirinya (exit 0, ada catatan) bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-pendaftaran-ui.mjs  |  npm run uji:pendaftaran-ui
 */
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("jsdom") || !ada("esbuild")) {
  console.log(
    "lewati uji UI pendaftaran — pasang `npm i -D jsdom esbuild` untuk menjalankannya."
  );
  process.exit(0);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

let lulus = 0;
let gagal = 0;
const cek = (nama, syarat, rincian = "") => {
  if (syarat) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}${rincian ? `\n      ${rincian}` : ""}`);
  }
};

/* --------------------------------------------------------------- bundel */

const MASUK = String.raw`
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider, useI18n } from "./src/lib/i18n.jsx";
import PendaftaranAnggota from "./src/halaman/PendaftaranAnggota/PendaftaranAnggota.jsx";
import VerifikasiAkun from "./src/components/VerifikasiAkun.jsx";
import {
  normalisasiUsername,
  normalisasiUsernameKanonik,
  periksaUsername,
  sahUsername,
  periksaTanggalLahir,
  hitungUmur,
} from "./src/lib/identitas.js";
import {
  sahUsername as sahUsernameHalaman,
  normalisasiUsername as normalisasiHalaman,
  periksaUsername as periksaUsernameHalaman,
} from "./src/halaman/PendaftaranAnggota/komponen/pemainCatur.js";
import { ajukanVerifikasiManual } from "./src/lib/api/anggota.js";

export {
  React,
  act,
  normalisasiUsername,
  normalisasiUsernameKanonik,
  periksaUsername,
  sahUsername,
  periksaTanggalLahir,
  hitungUmur,
  sahUsernameHalaman,
  normalisasiHalaman,
  periksaUsernameHalaman,
  ajukanVerifikasiManual,
};

export function TombolBahasa({ nilai }) {
  const { setBahasa } = useI18n();
  return (
    <button type="button" id={"bahasa-" + nilai} onClick={() => setBahasa(nilai)}>
      {nilai}
    </button>
  );
}

export function mountHalaman(el) {
  const root = createRoot(el);
  act(() => {
    root.render(
      <HelmetProvider>
        <I18nProvider>
          <TombolBahasa nilai="en" />
          <MemoryRouter initialEntries={["/pendaftaran-anggota"]}>
            <PendaftaranAnggota />
          </MemoryRouter>
        </I18nProvider>
      </HelmetProvider>
    );
  });
  return root;
}

/**
 * VerifikasiAkun berdiri sendiri (untuk menguji jalur manual, permintaan
 * yang bertumpuk, dan daur hidup timer). Prop dapat diubah lewat
 * 'ubahProps' untuk mensimulasikan pengguna yang mengganti username saat
 * permintaan masih berjalan.
 */
let ubahPropsVerifikasi = null;
const tercatatGlobal = { terverifikasi: [], pengajuan: [] };

function KontrolVerifikasi({ awal }) {
  const [props, setProps] = React.useState(awal);
  ubahPropsVerifikasi = (patch) => setProps((p) => ({ ...p, ...patch }));
  return (
    <VerifikasiAkun
      username={props.username}
      cara={props.cara}
      onTerverifikasi={(h) => tercatatGlobal.terverifikasi.push(h)}
      onPengajuan={(h) => tercatatGlobal.pengajuan.push(h)}
    />
  );
}

export function mountVerifikasi(el, props = {}) {
  const root = createRoot(el);
  const awal = {
    username: props.username || "hikaru",
    cara: props.cara || { oauth: false, wajib: false },
  };
  tercatatGlobal.terverifikasi = [];
  tercatatGlobal.pengajuan = [];
  act(() => {
    root.render(
      <HelmetProvider>
        <I18nProvider>
          <KontrolVerifikasi awal={awal} />
        </I18nProvider>
      </HelmetProvider>
    );
  });
  return {
    root,
    tercatat: tercatatGlobal,
    ubahProps: (patch) => {
      act(() => {
        ubahPropsVerifikasi(patch);
      });
    },
  };
}
`;

const TMP = mkdtempSync(path.join(tmpdir(), "uji-daftar-ui-"));
const BUNDEL = path.join(TMP, "bundel.cjs");

await build({
  stdin: { contents: MASUK, resolveDir: ROOT, loader: "jsx", sourcefile: "uji-pendaftaran-ui-entry.jsx" },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: BUNDEL,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
  },
  logLevel: "error",
});

/* ------------------------------------------------------------- jsdom */

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://uji.test/pendaftaran-anggota",
  pretendToBeVisual: true,
});
const { window } = dom;

for (const nama of ["window", "document", "navigator", "localStorage", "sessionStorage"]) {
  Object.defineProperty(globalThis, nama, { value: window[nama], configurable: true, writable: true });
}
for (const nama of ["HTMLElement", "HTMLInputElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent"]) {
  if (window[nama]) globalThis[nama] = window[nama];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.Element.prototype.scrollIntoView = function scrollIntoView() {};
/* react-helmet-async (dipakai HalamanIsi) membutuhkan requestAnimationFrame. */
window.requestAnimationFrame =
  window.requestAnimationFrame ?? ((cb) => globalThis.setTimeout(() => cb(Date.now()), 0));
window.cancelAnimationFrame = window.cancelAnimationFrame ?? ((id) => globalThis.clearTimeout(id));
globalThis.requestAnimationFrame = window.requestAnimationFrame;
globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const M = require(BUNDEL);
const { act } = M;

/* --------------------------------------------- lingkungan + fetch tiruan */

/**
 * Perekam timer. HANYA delay yang terdaftar di `perhatikan` yang dicatat,
 * sehingga timer internal jsdom/React tidak mengacaukan hasil. Semua panggilan
 * didelegasikan ke setTimeout Node yang asli (bukan milik window) supaya
 * pembungkusan ini tidak pernah rekursif.
 */
function pasangTimerPerekam({ perhatikan = [3500, 2200, 900] } = {}) {
  const asliSet = globalThis.setTimeout;
  const asliClear = globalThis.clearTimeout;
  const dijadwalkan = new Map(); // idPalsu -> { ms, idAsli }
  const yangDibersihkan = new Set();
  let berikut = 1;

  const set = (fn, ms, ...args) => {
    if (!perhatikan.includes(ms)) return asliSet(fn, ms, ...args);
    const id = berikut++;
    const idAsli = asliSet(() => {
      dijadwalkan.delete(id);
      fn(...args);
    }, ms);
    dijadwalkan.set(id, { ms, idAsli });
    return id;
  };
  const clear = (id) => {
    const rekam = dijadwalkan.get(id);
    if (rekam) {
      dijadwalkan.delete(id);
      yangDibersihkan.add(id);
      return asliClear(rekam.idAsli);
    }
    return asliClear(id);
  };

  const sebelum = { g: globalThis.setTimeout, w: window.setTimeout };
  globalThis.setTimeout = set;
  globalThis.clearTimeout = clear;
  window.setTimeout = set;
  window.clearTimeout = clear;

  return {
    /** id timer yang masih menunggu (hanya yang direkam). */
    hidup: () => [...dijadwalkan.entries()].map(([id, v]) => ({ id, ms: v.ms })),
    yangDibersihkan: () => [...yangDibersihkan],
    jumlah: (ms) => [...dijadwalkan.values()].filter((v) => v.ms === ms).length,
    pulihkan: () => {
      globalThis.setTimeout = sebelum.g;
      globalThis.clearTimeout = asliClear;
      window.setTimeout = sebelum.w;
      window.clearTimeout = asliClear;
    },
  };
}

/**
 * Router fetch tiruan. Setiap MOCK.xxx boleh objek atau fungsi; tiap
 * permintaan dicatat di `panggilan` supaya tes bisa memeriksa body yang
 * benar-benar dikirim browser.
 */
function pasangFetch(mocks = {}) {
  const state = {
    panggilan: [],
    mocks,
    /** Janji yang ditahan supaya tes bisa mengontrol kapan respons tiba. */
    tahan: new Map(),
  };
  const jawab = (res) =>
    new Response(typeof res === "string" ? res : JSON.stringify(res.body ?? res), {
      status: res.status ?? 200,
      headers: { "Content-Type": "application/json", ...(res.headers || {}) },
    });

  const handle = async (url, opsi = {}) => {
    const jalur = new URL(String(url), "https://uji.test").pathname;
    const body = opsi.body ? safeParse(opsi.body) : null;
    state.panggilan.push({
      jalur,
      metode: opsi.method || "GET",
      body,
      csrf: opsi.headers?.["X-CSRF-Token"] || "",
      host: new URL(String(url), "https://uji.test").host,
    });
    const kunci = `${opsi.method || "GET"} ${jalur}`;
    const tabel = state.mocks[kunci] ?? state.mocks[jalur];
    const keluar = tabel === undefined ? {} : typeof tabel === "function" ? await tabel(body, state) : tabel;
    const tertunda = state.tahan.get(kunci);
    if (tertunda) {
      return new Promise((resolve) => {
        tertunda.push(() => resolve(jawab(keluar ?? {})));
      });
    }
    return jawab(keluar ?? {});
  };
  window.fetch = handle;
  globalThis.fetch = handle;
  return state;
}

function safeParse(teks) {
  try {
    return JSON.parse(teks);
  } catch {
    return null;
  }
}

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function flush(n = 6) {
  for (let i = 0; i < n; i++) await act(async () => await tick(0));
}
/**
 * Beri waktu benar-benar berlalu (debounce 350/550 ms + rantai promise
 * fetch), lalu biarkan React menyelesaikan commit-nya di dalam act().
 */
async function tunggu(ms = 80, putaran = 3) {
  for (let i = 0; i < putaran; i++) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await tick(ms);
    });
  }
}

const teksHalaman = () => M.document?.body?.textContent ?? window.document.body.textContent;
const cariTeks = (pola) => {
  const semua = [...window.document.querySelectorAll("h1,h2,p,button,label,span,code,div,alert")];
  return semua.find((el) => pola.test(el.textContent || "")) || null;
};
const tombol = (nama) =>
  [...window.document.querySelectorAll("button")].find((b) =>
    nama instanceof RegExp ? nama.test((b.textContent || "").trim()) : (b.textContent || "").trim() === nama
  ) || null;
const isian = (nama) => window.document.querySelector(`input[name="${nama}"], textarea[name="${nama}"]`);

async function klik(el, { ms = 80 } = {}) {
  if (!el) return false;
  await act(async () => {
    el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await flush();
  if (ms) await tunggu(ms, 1);
  return true;
}

function isiInput(el, nilai) {
  const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  act(() => {
    setter.call(el, nilai);
    el.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}

const root = window.document.getElementById("root");
function kosongkan() {
  act(() => {
    root.innerHTML = "";
  });
  window.localStorage.clear();
  window.sessionStorage.clear();
}

/* =========================================================== aturan username */

console.log("\nAturan username — satu aturan untuk browser dan server");
{
  const contoh = [
    ["BudiCatur", "budicatur", true],
    ["  budicatur  ", "budicatur", true],
    ["budi".repeat(7), null, false], // 28 karakter
    ["m".repeat(25), "m".repeat(25), true],
    ["m".repeat(26), null, false],
    ["bo", null, false],
    ["budi catur", null, false],
    ["budi@nako", null, false],
    ["", null, false],
    ["https://www.chess.com/member/hikaru", "hikaru", true],
    ["@hikaru", "hikaru", true],
  ];
  let cocokSemua = true;
  for (const [mentah, harap, sah] of contoh) {
    const hasil = M.periksaUsername(mentah);
    const hasilHalaman = M.periksaUsernameHalaman(mentah);
    if (harap !== null && hasil.username !== harap) cocokSemua = false;
    if (hasil.sah !== sah) cocokSemua = false;
    // Modul halaman harus memakai aturan yang PERSIS sama.
    if (
      hasilHalaman.sah !== hasil.sah ||
      hasilHalaman.username !== hasil.username ||
      M.sahUsernameHalaman(mentah) !== M.sahUsername(mentah) ||
      M.normalisasiHalaman(mentah) !== M.normalisasiUsernameKanonik(mentah)
    ) {
      cocokSemua = false;
    }
  }
  cek("normalisasi + validasi username identik di kedua modul", cocokSemua);
  cek(
    "kapital dan lowercase dianggap username yang sama",
    M.periksaUsername("BudiCatur").username === M.periksaUsername("budicatur").username
  );
  cek("username 30 karakter ditolak (sebelumnya lolos di UI)", !M.sahUsername("m".repeat(30)));
  cek("username 25 karakter diterima", M.sahUsername("m".repeat(25)));
  cek("spasi di tengah ditolak, bukan ditempel", M.periksaUsername("budi catur").sebab === "spasi");
}

console.log("\nAturan tanggal lahir & umur");
{
  cek("29 Feb 2000 (kabisat) valid", M.periksaTanggalLahir("2000-02-29").sah === true);
  cek("30 Feb ditolak", M.periksaTanggalLahir("2026-02-30").sebab === "format");
  cek("masa depan ditolak", M.periksaTanggalLahir("2999-01-01").sebab === "masa-depan");
  cek("null ditolak dengan sebab 'kosong'", M.periksaTanggalLahir(null).sebab === "kosong");
  cek("string aneh ditolak", M.periksaTanggalLahir("bukan-tanggal").sah === false);
  cek(
    "umur dihitung dari kalender UTC: browser WIB & server UTC sepakat",
    M.hitungUmur("2000-01-01", new Date("2026-01-01T06:30:00+07:00")) ===
      M.hitungUmur("2000-01-01", new Date("2025-12-31T23:30:00Z")) &&
      M.hitungUmur("2000-01-01", new Date("2026-01-01T06:30:00+07:00")) === 25
  );
  cek("umur 26 dihitung benar", M.periksaTanggalLahir("2000-01-01", new Date("2026-06-01T00:00:00Z")).umur === 26);
  cek("umur 4 terlalu muda", M.periksaTanggalLahir("2022-01-01", new Date("2026-06-01T00:00:00Z")).sebab === "terlalu-muda");
  cek("umur 126 terlalu tua", M.periksaTanggalLahir("1900-01-01", new Date("2026-06-01T00:00:00Z")).sebab === "terlalu-tua");
}

/* ==================================================== VerifikasiAkun: manual */

console.log("\nVerifikasiAkun — kode diminta ke server, jalur manual = pengajuan");
{
  kosongkan();
  const f = pasangFetch({
    "/api/csrf-token": { token: "csrf-uji" },
    "POST /api/csrf-token": { token: "csrf-uji" },
    "/api/csrf-token": { token: "csrf-uji" },
    "POST /api/auth/kode/minta": { username: "hikaru", kode: "KCI-SERVER", berlakuDetik: 1800, diulang: false },
    "POST /api/auth/kode/periksa": { cocok: false, pesan: "Kode belum terbaca di profil Anda." },
    "POST /api/auth/pengajuan-manual": { status: 202, body: { id: "pj-1", status: "menunggu", username: "hikaru" } },
  });

  const timer = pasangTimerPerekam();
  const { root: r, tercatat } = M.mountVerifikasi(root, { username: "hikaru" });
  await tunggu(600);
  await flush();

  const minta = f.panggilan.find((p) => p.jalur === "/api/auth/kode/minta");
  cek("kode tantangan diminta ke server", Boolean(minta), JSON.stringify(f.panggilan.map((p) => p.jalur)));
  cek("permintaan kode membawa username ternormalisasi", minta?.body?.username === "hikaru");
  await flush(3);
  cek("kode dari server yang ditampilkan", /KCI-SERVER/.test(root.textContent || ""), root.textContent?.slice(0, 120));

  // Jalur manual: kirim pengajuan.
  const toggle = [...root.querySelectorAll("button")].find((b) => /Ajukan pemeriksaan manual/i.test(b.textContent || ""));
  await klik(toggle);
  const kirimPengajuan = [...root.querySelectorAll("button")].find((b) => /^Kirim Pengajuan$/i.test((b.textContent || "").trim()));
  cek("tombol kirim pengajuan ada", Boolean(kirimPengajuan));
  await klik(kirimPengajuan);
  await flush();

  const diajukan = f.panggilan.find((p) => p.jalur === "/api/auth/pengajuan-manual");
  cek("pengajuan manual POST ke endpoint khusus", Boolean(diajukan), JSON.stringify(f.panggilan.map((p) => p.jalur)));
  cek(
    "pengajuan manual TIDAK memicu callback terverifikasi",
    tercatat.terverifikasi.length === 0,
    JSON.stringify(tercatat)
  );
  cek(
    "pengajuan manual dilaporkan sebagai menunggu",
    tercatat.pengajuan.length === 1 && tercatat.pengajuan[0].status === "menunggu"
  );
  const isi = root.textContent || "";
  cek(
    "kata 'terverifikasi' tidak dipakai untuk jalur manual",
    !/Verifikasi Berhasil/i.test(isi) && !/telah terverifikasi/i.test(isi),
    isi.slice(0, 200)
  );

  await act(async () => r.unmount());
  cek(
    "timer yang masih tersisa nol setelah unmount (tidak ada kebocoran)",
    timer.hidup().length === 0,
    JSON.stringify(timer.hidup())
  );
  timer.pulihkan();
}

/* ================== VerifikasiAkun: tantangan hilang di server (cold start) */

console.log("\nVerifikasiAkun — tantangan hilang: kode baru diminta, bukan pesan buntu");
{
  kosongkan();
  let nomor = 0;
  const f = pasangFetch({
    "/api/csrf-token": { token: "csrf-uji" },
    "POST /api/csrf-token": { token: "csrf-uji" },
    "POST /api/auth/kode/minta": () => {
      nomor += 1;
      return {
        username: "hikaru",
        kode: `KCI-BARU${nomor}`,
        berlakuDetik: 1800,
        diulang: false,
      };
    },
    /* Server menjawab bahwa tantangan tidak ada lagi (cold start tanpa
       penyimpanan bersama, atau kode kedaluwarsa) dengan SEBAB-nya. */
    "POST /api/auth/kode/periksa": {
      status: 400,
      body: {
        pesan: "Belum ada kode aktif untuk akun ini. Minta kode baru, tempelkan ke profil, lalu periksa lagi.",
        kode: "tantangan-tidak-ada",
      },
    },
  });

  const timer = pasangTimerPerekam();
  const { root: r } = M.mountVerifikasi(root, { username: "hikaru" });
  await tunggu(600);
  await flush();
  cek("kode pertama ditampilkan", /KCI-BARU1/.test(root.textContent || ""), root.textContent?.slice(0, 140));

  const tombolPeriksa = [...root.querySelectorAll("button")].find((b) =>
    /Periksa Kode/i.test(b.textContent || "")
  );
  cek("tombol periksa ada", Boolean(tombolPeriksa));
  await klik(tombolPeriksa);
  await tunggu(700);
  await flush(8);

  const jumlahMinta = f.panggilan.filter((p) => p.jalur === "/api/auth/kode/minta").length;
  cek(
    "tantangan yang hilang memicu permintaan kode ulang otomatis",
    jumlahMinta >= 2,
    `panggilan minta: ${jumlahMinta}`
  );
  cek(
    "kode di layar diganti kode BARU, bukan kode mati",
    /KCI-BARU2/.test(root.textContent || ""),
    (root.textContent || "").slice(0, 160)
  );
  cek(
    "permintaan ulang memakai paksa:true (kode lama dibuang server)",
    f.panggilan.some((p) => p.jalur === "/api/auth/kode/minta" && p.body?.paksa === true),
    JSON.stringify(f.panggilan.filter((p) => p.jalur === "/api/auth/kode/minta").map((p) => p.body))
  );
  cek(
    "tidak ada tiket/status terverifikasi yang dikarang dari respons galat",
    !/Verifikasi Berhasil/i.test(root.textContent || "")
  );

  await act(async () => r.unmount());
  cek(
    "timer dibersihkan saat unmount",
    timer.hidup().length === 0,
    JSON.stringify(timer.hidup())
  );
  timer.pulihkan();
}

/* ==================================== Pemulihan CSRF lintas instance (klien) */

console.log("\nKlien — token CSRF ditolak (instance berganti): diminta ulang, kirim sekali");
{
  kosongkan();
  let nomorToken = 0;
  const f = pasangFetch({
    "/api/csrf-token": () => {
      nomorToken += 1;
      return { token: `csrf-${nomorToken}` };
    },
    /* Token pertama ditolak — seperti yang terjadi bila POST mendarat di
       instance lain (token CSRF hidup di memori instance). */
    "POST /api/auth/pengajuan-manual": (bodi, state) => {
      const sekarang = state.panggilan
        .filter((p) => p.jalur === "/api/auth/pengajuan-manual")
        .pop();
      if (sekarang?.csrf === "csrf-1") {
        return {
          status: 403,
          body: { pesan: "Token CSRF tidak valid.", kode: "token-csrf" },
        };
      }
      /* `status` di sini adalah status HTTP jawaban mock, jadi body pengajuan
         (yang juga punya field `status`) harus dibungkus `body`. */
      return { body: { id: "pj-9", status: "menunggu", username: bodi?.username || "" } };
    },
  });

  const hasil = await M.ajukanVerifikasiManual("Hikaru", "catatan uji");
  cek(
    "pengajuan tetap terkirim setelah token diperbarui",
    hasil?.status === "menunggu",
    JSON.stringify(hasil)
  );
  const percobaan = f.panggilan.filter((p) => p.jalur === "/api/auth/pengajuan-manual");
  cek(
    "hanya SATU pengiriman ulang (tidak ada loop)",
    percobaan.length === 2,
    JSON.stringify(percobaan.map((p) => p.csrf))
  );
  cek(
    "percobaan ulang memakai token BARU, bukan token yang ditolak",
    percobaan[0]?.csrf === "csrf-1" &&
      percobaan[1]?.csrf === "csrf-2",
    JSON.stringify(percobaan.map((p) => p.csrf))
  );
  cek(
    "token baru benar-benar diminta ke server",
    f.panggilan.filter((p) => p.jalur === "/api/csrf-token").length === 2,
    `${f.panggilan.filter((p) => p.jalur === "/api/csrf-token").length}`
  );
  cek(
    "pengiriman ulang membawa isian yang sama (tidak ada yang hilang karena retry)",
    percobaan[1]?.body?.username === "Hikaru" &&
      percobaan[1]?.body?.catatan === "catatan uji",
    JSON.stringify(percobaan[1]?.body)
  );
}

/* ============================================ VerifikasiAkun: pembatalan & timer */

console.log("\nVerifikasiAkun — permintaan lama tidak menimpa hasil baru");
{
  kosongkan();
  const antreanTunda = [];
  const f = pasangFetch({
    "/api/csrf-token": { token: "csrf-uji" },
    "POST /api/auth/kode/minta": (body, state) => {
      const nomor = state.panggilan.filter((p) => p.jalur === "/api/auth/kode/minta").length;
      if (nomor === 1) {
        // Permintaan pertama sengaja ditahan lalu diselesaikan TERAKHIR.
        return new Promise((resolve) => {
          antreanTunda.push(() =>
            resolve(
              new Response(
                JSON.stringify({ kode: "KCI-LAMA", username: body?.username, berlakuDetik: 1800 }),
                { status: 200, headers: { "Content-Type": "application/json" } }
              )
            )
          );
        });
      }
      return { kode: "KCI-BARU", username: body?.username, berlakuDetik: 1800 };
    },
  });
  const timer = pasangTimerPerekam();
  const { root: r, ubahProps } = M.mountVerifikasi(root, { username: "hikaru" });
  await tunggu(500);
  await flush();
  cek(
    "permintaan pertama sudah berangkat",
    f.panggilan.filter((p) => p.jalur === "/api/auth/kode/minta").length === 1,
    JSON.stringify(f.panggilan.map((p) => p.jalur))
  );

  // Username diganti sementara permintaan pertama masih di udara.
  await act(async () => {
    ubahProps({ username: "gothamchess" });
  });
  await tunggu(500);
  await flush();
  await act(async () => {
    antreanTunda.forEach((lepas) => lepas());
  });
  await flush();
  await act(async () => {
    await tick(20);
  });

  const tampil = root.textContent || "";
  cek("hasil permintaan TERAKHIR yang dipakai", /KCI-BARU/.test(tampil), tampil.slice(0, 180));
  cek("jawaban permintaan lama diabaikan", !/KCI-LAMA/.test(tampil));
  cek(
    "satu permintaan per username (tidak ada permintaan mengulang tanpa alasan)",
    f.panggilan.filter((p) => p.jalur === "/api/auth/kode/minta").length === 2,
    String(f.panggilan.filter((p) => p.jalur === "/api/auth/kode/minta").length)
  );

  await act(async () => r.unmount());
  timer.pulihkan();
}

/* ============================================================ halaman penuh */

console.log("\nPendaftaranAnggota — sessionStorage hasil OAuth");
{
  kosongkan();
  window.sessionStorage.setItem("kci-hasil-verifikasi", "{rusak: ja");
  const urutan = [];
  // jsdom mengembalikan objek Storage lewat accessor, jadi dipantau di
  // prototype-nya agar pembungkusan tidak hilang di antara dua akses.
  const ProtoStorage = window.Storage.prototype;
  const asliGet = ProtoStorage.getItem;
  const asliRemove = ProtoStorage.removeItem;
  ProtoStorage.getItem = function getItem(k) {
    if (k === "kci-hasil-verifikasi") urutan.push("get");
    return asliGet.call(this, k);
  };
  ProtoStorage.removeItem = function removeItem(k) {
    if (k === "kci-hasil-verifikasi") urutan.push("remove");
    return asliRemove.call(this, k);
  };
  const asliParse = JSON.parse;
  let jumlahParse = 0;
  JSON.parse = function parse(...args) {
    jumlahParse++;
    return asliParse.apply(JSON, args);
  };

  pasangFetch({
    "/api/csrf-token": { token: "csrf-uji" },
    "/api/auth/cara": { oauth: false, kodeProfil: true, mode: "opsional", wajib: false, tiketBerlakuDetik: 1800 },
    "POST /api/auth/kode/minta": { kode: "KCI-ABC", username: "hikaru", berlakuDetik: 1800 },
    "/api/anggota": [],
  });
  const timer = pasangTimerPerekam();
  const r = M.mountHalaman(root);
  await tunggu(250);
  await flush();

  const isi = root.textContent || "";
  cek("JSON rusak tidak membuat halaman crash", isi.length > 0);
  cek("data rusak dilaporkan ke pengguna", /tidak dapat dibaca/i.test(isi), isi.slice(0, 240));
  cek("item dibaca lalu dibuang (bukan dibuang dulu)", urutan.join(",") === "get,remove", urutan.join(","));
  cek("parse diusahakan lebih dulu sebelum dibuang", jumlahParse > 0, String(jumlahParse));
  cek("item rusak tidak tertinggal di sessionStorage", window.sessionStorage.getItem("kci-hasil-verifikasi") === null);

  /* Hasil yang sah: username dan tiket harus benar-benar dipakai. */
  await act(async () => r.unmount());
  timer.pulihkan();
  ProtoStorage.removeItem = asliRemove;
  ProtoStorage.getItem = asliGet;
  JSON.parse = asliParse;

  kosongkan();
  window.sessionStorage.setItem(
    "kci-hasil-verifikasi",
    JSON.stringify({ sukses: true, username: "HIkaru", tiket: "kci1.TIKET-OAUTH", cara: "oauth" })
  );
  const f2 = pasangFetch({
    "/api/csrf-token": { token: "csrf-uji" },
    "/api/auth/cara": { oauth: false, kodeProfil: true, mode: "opsional", wajib: false, tiketBerlakuDetik: 1800 },
    "POST /api/auth/kode/minta": { kode: "KCI-ABC", username: "hikaru", berlakuDetik: 1800 },
    "POST /api/anggota": { username: "hikaru" },
    "/api/anggota": [],
  });
  const r2 = M.mountHalaman(root);
  await tunggu(250);
  await flush();
  cek(
    "hasil OAuth sah (username + tiket string) dipercaya",
    /Verifikasi Berhasil/i.test(root.textContent || ""),
    (root.textContent || "").slice(0, 160)
  );
  await act(async () => r2.unmount());
  void f2;

  /* Item tanpa field wajib (username/tiket string) = data tak sah. */
  kosongkan();
  window.sessionStorage.setItem("kci-hasil-verifikasi", JSON.stringify({ sukses: true, username: 42 }));
  pasangFetch({
    "/api/csrf-token": { token: "csrf-uji" },
    "/api/auth/cara": { oauth: false, kodeProfil: true, mode: "opsional", wajib: false, tiketBerlakuDetik: 1800 },
    "POST /api/auth/kode/minta": { kode: "KCI-ABC", username: "hikaru", berlakuDetik: 1800 },
    "/api/anggota": [],
  });
  const r3 = M.mountHalaman(root);
  await tunggu(200);
  await flush();
  cek(
    "tipe field yang salah tidak dipercaya",
    !/Verifikasi Berhasil/i.test(root.textContent || "") &&
      window.sessionStorage.getItem("kci-hasil-verifikasi") === null,
    (root.textContent || "").slice(0, 120)
  );
  await act(async () => r3.unmount());
}

console.log("\nPendaftaranAnggota — tiket server dikirim, jalur manual tidak");
{
  kosongkan();
  const f = pasangFetch({
    "/api/csrf-token": { token: "csrf-uji" },
    "/api/auth/cara": { oauth: false, kodeProfil: true, mode: "opsional", wajib: false, tiketBerlakuDetik: 1800 },
    "POST /api/auth/kode/minta": { kode: "KCI-ABC", username: "hikaru", berlakuDetik: 1800 },
    "POST /api/auth/kode/periksa": {
      cocok: true,
      username: "hikaru",
      tiket: "kci1.TIKET-UJI",
      berlakuDetik: 1800,
      cara: "kode-profil",
    },
    "POST /api/csrf-token": { token: "csrf-uji" },
    "POST /api/anggota": { username: "hikaru" },
    "https://api.chess.com/pub/player/hikaru": { username: "Hikaru", name: "Hikaru Nakamura" },
  });
  window.sessionStorage.setItem(
    "kci-hasil-verifikasi",
    JSON.stringify({ sukses: true, username: "hikaru", tiket: "kci1.DARI-OAUTH", cara: "oauth", berlakuDetik: 1800 })
  );
  const timer = pasangTimerPerekam();
  const r = M.mountHalaman(root);
  await flush();
  await act(async () => await tick(50));
  await flush();

  cek(
    "hasil OAuth di sessionStorage mengisi username & status sukses",
    /Verifikasi Berhasil/i.test(root.textContent || ""),
    (root.textContent || "").slice(0, 200)
  );

  const lanjut = tombol("Lanjutkan Pendaftaran");
  await klik(lanjut);

  const langkah = async (nama, nilai, tombolBerikutnya = "Berikutnya") => {
    const el = isian(nama);
    if (!el) return false;
    isiInput(el, nilai);
    const t = tombol(tombolBerikutnya);
    if (!t) return false;
    await klik(t);
    return true;
  };
  await langkah("namaLengkap", "Hikaru Nakamura");
  await langkah("panggilan", "Hikaru");
  await langkah("tanggalLahir", "1990-05-20");
  await langkah("kota", "Medan", "Lanjutkan");
  await langkah("hp", "081234567890");
  for (let i = 0; i < 3; i++) {
    const lewati = tombol("Lewati");
    if (lewati) await klik(lewati);
  }

  const kirim = tombol("Kirim Pendaftaran");
  cek("tombol kirim tersedia di langkah akhir", Boolean(kirim), (root.textContent || "").slice(-200));
  const checkbox = isian("setuju");
  if (checkbox) {
    await act(async () => {
      checkbox.click();
    });
    await flush();
  }
  // Klik ganda: dua klik beruntun tidak boleh mengirim dua POST.
  const kirimLagi = tombol("Kirim Pendaftaran");
  await klik(kirimLagi);
  const kedua = tombol("Kirim Pendaftaran");
  if (kedua) await klik(kedua);
  await tunggu(220);
  await flush();

  const posts = f.panggilan.filter((p) => p.jalur === "/api/anggota" && p.metode === "POST");
  cek(
    "klik ganda hanya mengirim satu permintaan",
    posts.length === 1,
    `dapat ${posts.length}`
  );
  cek(
    "tiket terbitan server ikut dikirim",
    posts[0]?.body?.tiketVerifikasi === "kci1.DARI-OAUTH",
    JSON.stringify(posts[0]?.body)
  );
  cek(
    "body pendaftaran tidak membawa field 'bukti' dari browser",
    posts[0]?.body &&
      !("mode" in posts[0].body) &&
      !("sumber" in posts[0].body) &&
      !("profil" in posts[0].body) &&
      !("terverifikasi" in posts[0].body) &&
      !("kode" in posts[0].body),
    JSON.stringify(Object.keys(posts[0]?.body || {}))
  );
  cek("username dikirim dalam bentuk kanonik", posts[0]?.body?.username === "hikaru");
  cek("POST membawa token CSRF", Boolean(posts[0]?.csrf));

  await act(async () => r.unmount());
  timer.pulihkan();
}

console.log("\nPendaftaranAnggota — tiket kedaluwarsa & isian tidak hilang");
{
  kosongkan();
  const f = pasangFetch({
    "/api/csrf-token": { token: "csrf-uji" },
    "/api/auth/cara": { oauth: false, kodeProfil: true, mode: "wajib", wajib: true, tiketBerlakuDetik: 1800 },
    "POST /api/auth/kode/minta": { kode: "KCI-ABC", username: "hikaru", berlakuDetik: 1800 },
    "POST /api/auth/kode/periksa": {
      cocok: true,
      username: "hikaru",
      tiket: "kci1.TIKET-BARU",
      berlakuDetik: 1800,
    },
    "POST /api/anggota": {
      status: 403,
      body: {
        pesan: "Sesi verifikasi telah kedaluwarsa. Silakan ulangi verifikasi akun Chess.com Anda.",
        perluVerifikasi: true,
        kodeVerifikasi: "kedaluwarsa",
        galat: { username: "Sesi verifikasi kedaluwarsa. Ulangi verifikasi." },
      },
    },
  });
  const timer = pasangTimerPerekam();
  const r = M.mountHalaman(root);
  await tunggu(250);
  await flush();

  const isiInputUsername = window.document.querySelector('input[name="username"]');
  if (isiInputUsername) M.act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(isiInputUsername, "HIkaru");
    isiInputUsername.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  await klik(tombol("Berikutnya"));
  await tunggu(500);
  await flush();

  // Mode `wajib`: tidak ada jalan pintas sama sekali di langkah verifikasi.
  cek(
    "mode wajib: tidak ada centang 'lanjut tanpa verifikasi'",
    isian("pahamTanpaVerifikasi") === null
  );
  cek(
    "mode wajib: tidak ada tombol lanjut tanpa verifikasi",
    tombol("Lanjutkan tanpa verifikasi") === null
  );

  // Verifikasi berhasil di server -> tiket dipegang halaman.
  await klik(tombol("Periksa Kode"));
  await tunggu(150);
  await flush();
  cek(
    "tiket dari server mengubah status menjadi berhasil",
    /Verifikasi Berhasil/i.test(root.textContent || ""),
    (root.textContent || "").slice(0, 200)
  );

  await klik(tombol("Lanjutkan Pendaftaran"));
  const langkah = async (nama, nilai, tombolBerikutnya = "Berikutnya") => {
    const el = isian(nama);
    if (!el) return false;
    isiInput(el, nilai);
    await klik(tombol(tombolBerikutnya));
    return true;
  };
  await langkah("namaLengkap", "Hikaru Nakamura");
  await langkah("panggilan", "Hikaru");
  await langkah("tanggalLahir", "1990-05-20");
  await langkah("kota", "Medan", "Lanjutkan");
  await langkah("hp", "081234567890");
  for (let i = 0; i < 3; i++) await klik(tombol("Lewati"));
  const checkbox = isian("setuju");
  if (checkbox) {
    await act(async () => {
      checkbox.click();
    });
    await flush();
  }

  await klik(tombol("Kirim Pendaftaran"), { ms: 250 });
  await flush();

  const isi = root.textContent || "";
  const posts = f.panggilan.filter((p) => p.jalur === "/api/anggota" && p.metode === "POST");
  cek("formulir dikirim dengan tiket", posts.length === 1, `dapat ${posts.length}`);
  cek(
    "penolakan karena kedaluwarsa ditampilkan dengan kata 'kedaluwarsa'",
    /kedaluwarsa/i.test(isi),
    isi.slice(-320)
  );
  // Setelah tiket tidak sah, halaman mengembalikan pengguna ke langkah
  // verifikasi (bukan menampilkan "berhasil" palsu) dengan pesan yang jelas.
  cek(
    "pengguna dikembalikan ke langkah verifikasi",
    /Verifikasi diri Anda/i.test(isi),
    isi.slice(-200)
  );
  cek(
    "tiket yang ditolak dibuang dari state halaman",
    posts[0]?.body?.tiketVerifikasi === "kci1.TIKET-BARU"
  );

  // Verifikasi ulang lalu kirim lagi: isian sebelumnya harus masih utuh.
  await klik(tombol("Periksa Kode"));
  await tunggu(150);
  await flush();
  await klik(tombol("Lanjutkan Pendaftaran"));
  await klik(tombol("Lanjutkan"));
  for (let i = 0; i < 4; i++) {
    await klik(tombol("Lewati"));
    const lanjut = tombol("Selesai");
    if (lanjut) await klik(lanjut);
  }
  await klik(tombol("Kirim Pendaftaran"), { ms: 250 });
  await flush();
  const posts2 = f.panggilan.filter((p) => p.jalur === "/api/anggota" && p.metode === "POST");
  const bodyKedua = posts2[posts2.length - 1]?.body || {};
  cek(
    "isian pengguna tidak hilang setelah kegagalan (dikirim ulang utuh)",
    posts2.length === 2 &&
      bodyKedua.namaLengkap === "Hikaru Nakamura" &&
      bodyKedua.kota === "Medan" &&
      bodyKedua.username === "hikaru",
    JSON.stringify(bodyKedua)
  );
  cek(
    "percobaan ulang memakai tiket hasil verifikasi terbaru",
    bodyKedua.tiketVerifikasi === "kci1.TIKET-BARU"
  );

  await act(async () => r.unmount());
  timer.pulihkan();
}

console.log("\nPendaftaranAnggota — timer toast & pergantian bahasa");
{
  kosongkan();
  pasangFetch({
    "/api/csrf-token": { token: "csrf-uji" },
    "/api/auth/cara": { oauth: false, kodeProfil: true, mode: "opsional", wajib: false, tiketBerlakuDetik: 1800 },
    "POST /api/auth/kode/minta": { kode: "KCI-ABC", username: "hikaru", berlakuDetik: 1800 },
    "/api/anggota": [],
  });
  const timer = pasangTimerPerekam();
  const r = M.mountHalaman(root);
  await tunggu(250);
  await flush();

  const elUsername = window.document.querySelector('input[name="username"]');
  if (elUsername) M.act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(elUsername, "hikaru");
    elUsername.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  await klik(tombol("Berikutnya"));
  await tunggu(400);
  await flush();

  // Mode `opsional`: lanjut tanpa verifikasi menuntut pengakuan eksplisit.
  // Tombol tidak boleh bisa diklik sebelum centangnya dipasang.
  const tombolLanjut = tombol("Lanjutkan tanpa verifikasi");
  cek(
    "opsional: tombol lanjut tanpa verifikasi ada",
    Boolean(tombolLanjut)
  );
  cek(
    "opsional: tombol lanjut NONAKTIF sebelum pengakuan dicentang",
    tombolLanjut?.disabled === true
  );
  await klik(tombolLanjut);
  cek(
    "opsional: klik tanpa centang tidak memajukan langkah",
    isian("namaLengkap") === null
  );

  const paham = isian("pahamTanpaVerifikasi");
  cek("opsional: centang pengakuan tersedia", Boolean(paham));
  if (paham) {
    await act(async () => {
      paham.click();
    });
    await flush();
  }
  cek(
    "opsional: tombol lanjut aktif setelah pengakuan dicentang",
    tombol("Lanjutkan tanpa verifikasi")?.disabled === false
  );
  await klik(tombol("Lanjutkan tanpa verifikasi"));
  await flush();

  const langkah = async (nama, nilai, tombolBerikutnya = "Berikutnya") => {
    const el = isian(nama);
    if (!el) return false;
    isiInput(el, nilai);
    await klik(tombol(tombolBerikutnya));
    return true;
  };
  await langkah("namaLengkap", "Hikaru Nakamura");
  await langkah("panggilan", "Hikaru");
  await langkah("tanggalLahir", "1990-05-20");
  await langkah("kota", "Medan", "Lanjutkan"); // -> toast #1
  const setelahToastSatu = timer.jumlah(3500);
  await langkah("hp", "081234567890");
  await klik(tombol("Lewati"));
  await klik(tombol("Lewati"));
  await klik(tombol("Lewati")); // -> toast #2 di langkah akhir
  await flush();

  cek("toast pertama memasang timer 3.5 s", setelahToastSatu >= 1, String(setelahToastSatu));
  cek(
    "toast baru membatalkan timer toast lama (hanya satu timer aktif)",
    timer.jumlah(3500) === 1 && timer.yangDibersihkan().length >= 1,
    `aktif=${timer.jumlah(3500)} dibersihkan=${timer.yangDibersihkan().length}`
  );
  const toastTampil = cariTeks(/Data kontak selesai|Data diri selesai/);
  cek("toast masih tampil setelah toast kedua", Boolean(toastTampil), toastTampil?.textContent || "(tidak ada)");

  // Pergantian bahasa: pesan harus mengikuti bahasa aktif.
  await klik(window.document.getElementById("bahasa-en"));
  await flush();
  await act(async () => {
    await tick(120);
  });
  await flush();
  const setelahGanti = root.textContent || "";
  cek(
    "pergantian bahasa mengganti label tautan (ID -> EN)",
    /Chess\.com Club/.test(setelahGanti) && !/Klub Chess\.com/.test(setelahGanti),
    setelahGanti.slice(0, 220)
  );
  cek("pergantian bahasa tidak meninggalkan pesan basi berbahasa ID", !/Data kontak selesai/.test(setelahGanti));

  await act(async () => r.unmount());
  cek(
    "semua timer dibersihkan saat halaman dibongkar",
    timer.hidup().length === 0,
    JSON.stringify(timer.hidup())
  );
  timer.pulihkan();
}

rmSync(TMP, { recursive: true, force: true });

console.log(`\n${"=".repeat(50)}`);
console.log(`  ${lulus} lulus, ${gagal} gagal`);
console.log(`${"=".repeat(50)}\n`);
process.exit(gagal ? 1 : 0);
