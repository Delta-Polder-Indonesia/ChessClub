/**
 * Uji regresi halaman Hubungi Kami (formulir kontak).
 *
 * Latar: halaman ini dahulu menampilkan SEMUA teks fungsionalnya secara
 * hardcode (Indonesia/Inggris campur) padahal kunci kamus `hubungi.*` sudah
 * tersedia, dan timer status submit berjalan tanpa cleanup sehingga timer
 * submit sebelumnya bisa memaksa status kembali "idle" di tengah submit
 * berikutnya. Uji ini mengunci:
 *   1. label/placeholder/tombol/persetujuan memakai kamus (ID default);
 *   2. submit kosong ditolak lokal tanpa menyentuh jaringan;
 *   3. submit sukses menampilkan teks kamus `terkirimJudul`/`terkirimIsi`;
 *   4. galat server ditampilkan apa adanya dengan judul kamus `galatJudul`;
 *   5. pembongkaran komponen setelah submit tidak melempar (timer dibersihkan).
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { MemoryRouter } = await import("react-router-dom");
const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { default: HubungiKami } = await import(
  "../src/halaman/HubungiKami/HubungiKami.jsx"
);
const { hubungi } = await import("../src/lib/terjemahan/id/hubungi.js");

const act = React.act ?? (await import("react-dom/test-utils")).act;

/* ------------------------------- lingkungan ------------------------------- */

// sessionStorage dipakai klien API (token CSRF) — pasang dari jsdom.
Object.defineProperty(globalThis, "sessionStorage", {
  value: window.sessionStorage,
  configurable: true,
  writable: true,
});
window.sessionStorage.setItem("kci-csrf-token", "token-uji");

// fetch dikendalikan penuh oleh uji — tidak boleh ada permintaan nyata.
const panggilanFetch = [];
let balasanFetch = { ok: true, status: 200, body: {} };
globalThis.fetch = async (url, opsi = {}) => {
  panggilanFetch.push({ url: String(url), opsi });
  return {
    ok: balasanFetch.ok,
    status: balasanFetch.status,
    json: async () => balasanFetch.body,
  };
};
window.fetch = globalThis.fetch;

let lulus = 0;
let gagal = 0;
function hasil(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
}

const el = document.getElementById("root");
const root = createRoot(el);

function Bungkus() {
  return React.createElement(
    MemoryRouter,
    { initialEntries: ["/hubungi-kami/contact"] },
    React.createElement(I18nProvider, null, React.createElement(HubungiKami))
  );
}

await act(async () => {
  root.render(React.createElement(Bungkus));
});

/* ----------------------------- helper interaksi ---------------------------- */

function setNilai(nama, nilai) {
  const input = document.querySelector(`[name="${nama}"]`);
  const proto =
    input.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(input, nilai);
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
}

function isiFormValid() {
  setNilai("name", "Bintang Toba");
  setNilai("email", "bintang@contoh.id");
  setNilai("subject", "Kerja sama turnamen");
  setNilai("message", "Halo, kami ingin berdiskusi tentang kerja sama.");
  const kotak = document.getElementById("agreement");
  if (!kotak.checked) kotak.click();
}

async function kirim() {
  const form = document.querySelector("form");
  await act(async () => {
    form.dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true })
    );
    // Beri mikrotugas untuk promise kirimPesan yang selesai.
    await new Promise((r) => setTimeout(r, 0));
  });
}

/* --------------------------------- uji ---------------------------------- */

// 1. Teks fungsional memakai kamus ID (bukan hardcode).
const inputNama = document.querySelector('[name="name"]');
hasil(
  "placeholder nama dari kamus",
  inputNama?.placeholder === hubungi.nama,
  `dapat "${inputNama?.placeholder}"`
);
const tombolKirim = document.querySelector('button[type="submit"]');
hasil(
  "tombol submit dari kamus",
  tombolKirim?.textContent?.trim() === hubungi.kirim,
  `dapat "${tombolKirim?.textContent?.trim()}"`
);
const labelSetuju = document.querySelector('label[for="agreement"]');
hasil(
  "label persetujuan dari kamus",
  labelSetuju?.textContent?.trim() === hubungi.setuju,
  `dapat "${labelSetuju?.textContent?.trim()}"`
);
const labelSubjek = document.querySelector('label[for="subject-input"]');
hasil(
  "label subjek dari kamus (kunci baru)",
  labelSubjek?.textContent?.trim() === hubungi.subjek,
  `dapat "${labelSubjek?.textContent?.trim()}"`
);

// 2. Submit kosong ditolak lokal — tanpa jaringan.
panggilanFetch.length = 0;
await kirim();
hasil("submit kosong tidak menyentuh jaringan", panggilanFetch.length === 0);
hasil(
  "submit kosong menandai field galat",
  inputNama?.getAttribute("aria-invalid") === "true"
);

// 3. Submit valid → sukses dengan teks kamus.
balasanFetch = { ok: true, status: 200, body: {} };
await act(async () => {
  isiFormValid();
});
panggilanFetch.length = 0;
await kirim();
hasil(
  "submit valid mengirim satu permintaan ke /api/pesan",
  panggilanFetch.length === 1 && panggilanFetch[0].url.includes("/api/pesan"),
  `dapat ${panggilanFetch.length} permintaan`
);
const isi = document.getElementById("root").textContent;
hasil(
  "overlay sukses memakai teks kamus terkirimJudul",
  isi.includes(hubungi.terkirimJudul),
  "teks tidak ditemukan"
);
hasil(
  "overlay sukses memakai teks kamus terkirimIsi",
  isi.includes(hubungi.terkirimIsi),
  "teks tidak ditemukan"
);
hasil(
  "teks hardcode lama tidak muncul lagi",
  !isi.includes("Pesan Anda berhasil dikirim!") ||
    hubungi.terkirimJudul === "Pesan Anda berhasil dikirim!",
  "teks hardcode masih tampil"
);

// 4. Galat → pesan server tampil apa adanya, judul dari kamus. (Pesan
//    cadangan milik lapisan API — mis. "Gagal mengirim pesan." pada
//    lib/api/pesan.js — adalah konvensi pesan ramah berbahasa Indonesia
//    yang berlaku di seluruh modul API; diperlakukan sebagai konten.)
balasanFetch = {
  ok: false,
  status: 500,
  body: { pesan: "Kuota pesan harian habis." },
};
await act(async () => {
  isiFormValid();
});
await kirim();
const isiGalat = document.getElementById("root").textContent;
hasil(
  "judul galat dari kamus galatJudul",
  isiGalat.includes(hubungi.galatJudul),
  "teks tidak ditemukan"
);
hasil(
  "pesan galat server ditampilkan apa adanya",
  isiGalat.includes("Kuota pesan harian habis."),
  "pesan server tidak ditemukan"
);

// 5. Unmount setelah submit (timer status masih hidup) harus bersih.
let galatUnmount = null;
const asalError = console.error;
console.error = (...a) => {
  galatUnmount = galatUnmount || a.join(" ");
};
await act(async () => {
  root.unmount();
});
console.error = asalError;
hasil(
  "pembongkaran setelah submit tanpa galat (timer dibersihkan)",
  galatUnmount === null,
  galatUnmount ? String(galatUnmount).slice(0, 120) : ""
);

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal === 0) console.log("OK — formulir Hubungi Kami berbahasa dari kamus dan bersih.");
