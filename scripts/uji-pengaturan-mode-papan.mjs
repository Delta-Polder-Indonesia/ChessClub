/**
 * Uji UI pengaturan papan non-popup untuk mode mandiri (`HandBrain`,
 * `TuringTest`, `LatihanRepertoar`) serta adaptasi warna/koordinat/sorotan
 * pada `PapanStatis`.
 *
 * Yang dijaga:
 *  1. Klik Pengaturan membuka panel `.analisa-root [data-panel="mode-pengaturan"]`
 *     bergaya Pengaturan Papan — BUKAN modal `role="dialog"`.
 *  2. Hanya opsi yang relevan terhadap masing-masing mode yang ditampilkan
 *     (Hand & Brain dan Latihan Repertoar punya titik langkah & suara;
 *      Turing test tidak menampilkan titik langkah & suara; ketiganya tidak
 *      menampilkan panah mesin, bantuan seret, komentator, atau promosi Ratu).
 *  3. Perubahan Set Bidak, Warna papan, Koordinat papan, Titik langkah legal,
 *     Sorot langkah terakhir, dan Suara papan langsung memengaruhi papan & audio.
 *  4. Menutup lewat tombol Tutup atau tombol Escape mengembalikan mode tanpa
 *     menghilangkan progres permainan / teks PGN yang sedang berjalan.
 *  5. PapanStatis tetap hijau klasik saat tanpa prop `tema`, dan beradaptasi
 *     saat `tema`, `tampilKoordinat`, dan `sorotLangkahAkhir` diberikan.
 *
 * Jalankan: node scripts/uji-pengaturan-mode-papan.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";
import "fake-indexeddb/auto";

window.PointerEvent = window.PointerEvent || window.MouseEvent;
globalThis.PointerEvent = window.PointerEvent;

register(new URL("./loader-jsx.mjs", import.meta.url));

const suaraDiputar = [];
class AudioMock {
  constructor(src) {
    this.src = src;
    this.volume = 1;
    this.preload = "auto";
  }
  cloneNode() {
    return new AudioMock(this.src);
  }
  play() {
    suaraDiputar.push(this.src);
    return Promise.resolve();
  }
}
globalThis.Audio = AudioMock;
window.Audio = AudioMock;

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { MemoryRouter } = await import("react-router-dom");
const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { default: HandBrain } = await import("../src/halaman/HandBrain/HandBrain.jsx");
const { default: TuringTest } = await import("../src/halaman/TuringTest/TuringTest.jsx");
const { default: LatihanRepertoar } = await import(
  "../src/halaman/LatihanRepertoar/LatihanRepertoar.jsx"
);
const { default: PapanStatis } = await import("../src/components/PapanStatis.jsx");
const { buatKartuDariJalur, indeksJalurPembukaan } = await import(
  "../src/halaman/LatihanRepertoar/repertoarLogika.js"
);
const { simpanKartuRepertoar } = await import(
  "../src/halaman/LatihanRepertoar/repertoarStorage.js"
);
const { TEMA_PAPAN } = await import("../src/halaman/TekaTeki/temaPapan.js");

const act = React.act ?? (await import("react-dom/test-utils")).act;

let lulus = 0;
let gagal = 0;
// React memperingatkan lewat console.error; diuji di akhir.
const catatanGalat = [];
const galatAsli = console.error;
console.error = (...argumen) => {
  catatanGalat.push(argumen.join(" "));
  galatAsli(...argumen);
};

function hasil(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    galatAsli(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
}

async function pasang(elemen, rute = "/papan-interaktif") {
  localStorage.removeItem("kci-pengaturan-papan");
  localStorage.removeItem("kci-suara-papan");
  localStorage.setItem("kci-bahasa", "id");
  const wadah = document.createElement("div");
  document.body.appendChild(wadah);
  const root = createRoot(wadah);
  await act(async () => {
    root.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [rute] },
        React.createElement(I18nProvider, null, elemen)
      )
    );
  });
  await act(async () => {
    await new Promise((selesai) => setTimeout(selesai, 60));
  });
  return {
    wadah,
    tutup: () => {
      act(() => root.unmount());
      wadah.remove();
    },
  };
}

const tombolDenganTeks = (wadah, teks) =>
  [...wadah.querySelectorAll("button")].find((b) => b.textContent.trim() === teks);

const klik = async (elemen) => {
  if (!elemen) return;
  await act(async () => {
    elemen.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise((selesai) => setTimeout(selesai, 10));
  });
};

const ubahSelect = async (selectEl, nilai) => {
  if (!selectEl) return;
  await act(async () => {
    selectEl.value = nilai;
    selectEl.dispatchEvent(new window.Event("change", { bubbles: true }));
    await new Promise((selesai) => setTimeout(selesai, 10));
  });
};

const tekanEscape = async () => {
  await act(async () => {
    window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await new Promise((selesai) => setTimeout(selesai, 10));
  });
};

/* ---------- 1. PapanStatis ---------- */
console.log("\n1. PapanStatis: warna tema, koordinat, dan sorotan langkah terakhir");
{
  const m1 = await pasang(
    React.createElement(PapanStatis, {
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      terakhir: { from: "e2", to: "e4" },
      ariaLabel: "Papan uji bawaan",
    })
  );
  const e2Sorot = m1.wadah.querySelector('[data-petak="e2"] > span[style*="255, 213, 79"]');
  const e4Sorot = m1.wadah.querySelector('[data-petak="e4"] > span[style*="255, 213, 79"]');
  const a8Default = m1.wadah.querySelector('[data-petak="a8"]')?.style.backgroundColor;
  hasil(
    "PapanStatis tanpa tema tetap memakai warna hijau klasik (#ebecd0)",
    a8Default === "rgb(235, 236, 208)",
    a8Default
  );
  hasil(
    "PapanStatis tanpa sorotLangkahAkhir tetap menyorot langkah terakhir",
    Boolean(e2Sorot && e4Sorot),
    `e2=${Boolean(e2Sorot)} e4=${Boolean(e4Sorot)}`
  );
  m1.tutup();

  const m2 = await pasang(
    React.createElement(PapanStatis, {
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      terakhir: { from: "e2", to: "e4" },
      tema: "blue",
      tampilKoordinat: "semua",
      sorotLangkahAkhir: false,
      ariaLabel: "Papan uji terkustom",
    })
  );
  const biruTerang = TEMA_PAPAN.blue.terang;
  const a8Biru = m2.wadah.querySelector('[data-petak="a8"]')?.style.backgroundColor;
  const e2TanpaSorot = m2.wadah.querySelector('[data-petak="e2"] > span[style*="255, 213, 79"]');
  const jumlahLabelKoordinat = m2.wadah.querySelectorAll("[data-petak] > span").length;
  hasil("PapanStatis tema='blue' memakai palet biru", a8Biru === "rgb(215, 229, 240)", `${a8Biru} (${biruTerang})`);
  hasil(
    "PapanStatis sorotLangkahAkhir={false} meniadakan sorotan langkah",
    !e2TanpaSorot,
    String(Boolean(e2TanpaSorot))
  );
  hasil(
    "PapanStatis tampilKoordinat='semua' menampilkan label koordinat di semua petak",
    jumlahLabelKoordinat === 128,
    String(jumlahLabelKoordinat)
  );
  m2.tutup();
}

/* ---------- 2. Hand & Brain ---------- */
console.log("\n2. Hand & Brain: panel pengaturan non-popup, opsi relevan, papan & suara");
{
  suaraDiputar.length = 0;
  const m = await pasang(React.createElement(HandBrain), "/papan-interaktif/hand-brain");

  // Mainkan satu langkah legal sebelum membuka Pengaturan
  const cocokUndian = (m.wadah.textContent || "").match(/Jenis bidak undian:\s*(Pion|Kuda)/);
  const isPion = cocokUndian?.[1] === "Pion";
  // Coba langkah salah jenis lebih dulu untuk menguji bunyi ilegal
  if (isPion) {
    await klik(m.wadah.querySelector('[data-petak="g1"]'));
    await klik(m.wadah.querySelector('[data-petak="f3"]'));
  } else {
    await klik(m.wadah.querySelector('[data-petak="e2"]'));
    await klik(m.wadah.querySelector('[data-petak="e4"]'));
  }
  hasil(
    "Hand & Brain membunyikan suara ilegal saat bidak tidak sesuai undian",
    suaraDiputar.some((s) => s.includes("illegal.mp3")),
    `undian=${cocokUndian?.[1]}; suara=${suaraDiputar.join(", ")}`
  );

  // Mainkan langkah sesuai undian
  suaraDiputar.length = 0;
  if (isPion) {
    await klik(m.wadah.querySelector('[data-petak="e2"]'));
    await klik(m.wadah.querySelector('[data-petak="e4"]'));
  } else {
    await klik(m.wadah.querySelector('[data-petak="g1"]'));
    await klik(m.wadah.querySelector('[data-petak="f3"]'));
  }
  hasil(
    "Hand & Brain membunyikan suara langkah saat langkah sah dimainkan",
    suaraDiputar.some((s) => s.includes("/SoundChess/standard/")),
    suaraDiputar.join(", ")
  );
  const jmlRiwayatSebelum = m.wadah.querySelectorAll("li").length;

  // Buka Pengaturan lewat sidebar
  await klik(tombolDenganTeks(m.wadah, "Pengaturan"));
  const panel = m.wadah.querySelector('[data-panel="mode-pengaturan"]');
  hasil("Hand & Brain membuka panel mode-pengaturan tanpa role='dialog'", !!panel && !m.wadah.querySelector('[role="dialog"]'));
  hasil("Panel pengaturan Hand & Brain memakai gaya .analisa-root", panel?.classList.contains("analisa-root"));

  const labelSelect = [...(panel?.querySelectorAll("select") || [])].map((s) => s.getAttribute("aria-label"));
  const labelSwitch = [...(panel?.querySelectorAll('[role="switch"]') || [])].map((s) => s.getAttribute("aria-label"));
  hasil(
    "Hand & Brain menampilkan tepat opsi relevan (bidak, warna, koordinat, titik, sorot, suara)",
    JSON.stringify(labelSelect) === JSON.stringify(["Set Bidak", "Warna papan", "Koordinat papan"]) &&
      JSON.stringify(labelSwitch) ===
        JSON.stringify(["Titik langkah legal", "Sorot langkah terakhir", "Suara papan"]),
    `select=${labelSelect.join(",")}; switch=${labelSwitch.join(",")}`
  );
  hasil(
    "Hand & Brain tidak menampilkan kontrol Analisa/PvE yang tidak relevan",
    !/Panah mesin|Bantuan langkah|Komentator|Promosi otomatis/.test(panel?.textContent || "")
  );

  // Ubah Warna papan, Set Bidak, Koordinat, Titik langkah, Sorot, Suara
  await ubahSelect(panel?.querySelector('select[aria-label="Set Bidak"]'), "merida");
  await ubahSelect(panel?.querySelector('select[aria-label="Warna papan"]'), "blue");
  await ubahSelect(panel?.querySelector('select[aria-label="Koordinat papan"]'), "semua");
  await klik(panel?.querySelector('[role="switch"][aria-label="Titik langkah legal"]'));
  await klik(panel?.querySelector('[role="switch"][aria-label="Sorot langkah terakhir"]'));
  await klik(panel?.querySelector('[role="switch"][aria-label="Suara papan"]'));

  // Tutup dengan Escape → permainan tetap utuh & pengaturan langsung diterapkan
  await tekanEscape();
  hasil("Escape menutup panel pengaturan Hand & Brain", !m.wadah.querySelector('[data-panel="mode-pengaturan"]'));
  hasil(
    "Progres partai Hand & Brain tetap utuh setelah menutup pengaturan",
    m.wadah.querySelectorAll("li").length === jmlRiwayatSebelum
  );
  const a8WarnaBaru = m.wadah.querySelector('[data-petak="a8"]')?.style.backgroundColor;
  const bidakMerida = m.wadah.querySelector('[data-petak] img[src*="merida"]');
  const koordinatSemuaHb = m.wadah.querySelectorAll('[data-petak] > span:not([aria-hidden]):not([data-bidak])').length;
  const sorotAkhirHb = m.wadah.querySelector('[data-petak] > span[style*="205, 210, 106"]');
  hasil("Set Bidak merida langsung diterapkan di papan Hand & Brain", Boolean(bidakMerida));
  hasil("Warna papan biru langsung diterapkan di papan Hand & Brain", a8WarnaBaru === "rgb(215, 229, 240)", a8WarnaBaru);
  hasil("Koordinat papan 'semua' diterapkan di Hand & Brain", koordinatSemuaHb === 128, String(koordinatSemuaHb));
  hasil("Sorot langkah terakhir mati menghilangkan sorotan langkah di Hand & Brain", !sorotAkhirHb);

  // Klik bidak sesuai undian saat Titik langkah legal mati → titik [data-bantu-sasaran] tidak muncul
  const cocokUndian2 = (m.wadah.textContent || "").match(/Jenis bidak undian:\s*(Pion|Kuda)/);
  const isPionHitam = cocokUndian2?.[1] === "Pion";
  await klik(m.wadah.querySelector(isPionHitam ? '[data-petak="e7"]' : '[data-petak="b8"]'));
  hasil(
    "Sakelar Titik langkah legal mati menyembunyikan titik sasaran di Hand & Brain",
    m.wadah.querySelectorAll('[data-bantu-sasaran="1"]').length === 0
  );

  // Mainkan langkah berikut saat suara dimatikan → harus senyap
  suaraDiputar.length = 0;
  await klik(m.wadah.querySelector(isPionHitam ? '[data-petak="e5"]' : '[data-petak="c6"]'));
  hasil("Sakelar Suara papan mati membisukan suara langkah di Hand & Brain", suaraDiputar.length === 0, suaraDiputar.join(", "));
  m.tutup();
}

/* ---------- 3. Turing test ---------- */
console.log("\n3. Turing test: panel pengaturan non-popup, opsi relevan saja, status terjaga");
{
  const m = await pasang(React.createElement(TuringTest), "/papan-interaktif/turing-test");
  const textarea = m.wadah.querySelector("textarea");
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    setter.call(textarea, "1. e4 e5 2. Nf3 Nc6 *");
    textarea.dispatchEvent(new window.Event("input", { bubbles: true }));
    textarea.dispatchEvent(new window.Event("change", { bubbles: true }));
  });

  await klik(tombolDenganTeks(m.wadah, "Pengaturan"));
  const panel = m.wadah.querySelector('[data-panel="mode-pengaturan"]');
  hasil("Turing test membuka panel mode-pengaturan tanpa role='dialog'", !!panel && !m.wadah.querySelector('[role="dialog"]'));

  const labelSelect = [...(panel?.querySelectorAll("select") || [])].map((s) => s.getAttribute("aria-label"));
  const labelSwitch = [...(panel?.querySelectorAll('[role="switch"]') || [])].map((s) => s.getAttribute("aria-label"));
  hasil(
    "Turing test hanya menampilkan opsi relevan (bidak, warna, koordinat, sorot akhir — tanpa titik langkah & suara)",
    JSON.stringify(labelSelect) === JSON.stringify(["Set Bidak", "Warna papan", "Koordinat papan"]) &&
      JSON.stringify(labelSwitch) === JSON.stringify(["Sorot langkah terakhir"]),
    `select=${labelSelect.join(",")}; switch=${labelSwitch.join(",")}`
  );

  await ubahSelect(panel?.querySelector('select[aria-label="Set Bidak"]'), "cburnett");
  await ubahSelect(panel?.querySelector('select[aria-label="Warna papan"]'), "wood");
  await ubahSelect(panel?.querySelector('select[aria-label="Koordinat papan"]'), "tidak");

  await klik(panel?.querySelector('button[aria-label="Tutup"]'));
  hasil("Tombol Tutup menutup panel pengaturan Turing test", !m.wadah.querySelector('[data-panel="mode-pengaturan"]'));
  hasil(
    "Isi PGN yang diketik di Turing test tetap terjaga setelah menutup pengaturan",
    m.wadah.querySelector("textarea")?.value === "1. e4 e5 2. Nf3 Nc6 *"
  );
  hasil(
    "Set Bidak cburnett & Warna papan wood diterapkan pada papan Turing test",
    Boolean(m.wadah.querySelector('[data-petak] img[src*="cburnett"]')) &&
      m.wadah.querySelector('[data-petak="a8"]')?.style.backgroundColor === "rgb(231, 199, 143)"
  );
  m.tutup();
}

/* ---------- 4. Latihan Repertoar ---------- */
console.log("\n4. Latihan Repertoar: panel pengaturan, PapanStatis terimbas, papan latihan & suara");
{
  const jalur = indeksJalurPembukaan([
    { eco: "C20", opening: "King Pawn Game", moves: "e2e4 e7e5 g1f3 b8c6", games: 20 },
  ]);
  const kartu = buatKartuDariJalur(jalur[0], "w", Date.now());
  await simpanKartuRepertoar(kartu);

  const m = await pasang(React.createElement(LatihanRepertoar), "/papan-interaktif/latihan-repertoar");
  await act(async () => {
    await new Promise((selesai) => setTimeout(selesai, 100));
  });

  await klik(tombolDenganTeks(m.wadah, "Pengaturan"));
  const panel = m.wadah.querySelector('[data-panel="mode-pengaturan"]');
  hasil("Latihan Repertoar membuka panel mode-pengaturan tanpa role='dialog'", !!panel && !m.wadah.querySelector('[role="dialog"]'));

  const labelSelect = [...(panel?.querySelectorAll("select") || [])].map((s) => s.getAttribute("aria-label"));
  const labelSwitch = [...(panel?.querySelectorAll('[role="switch"]') || [])].map((s) => s.getAttribute("aria-label"));
  hasil(
    "Latihan Repertoar menampilkan opsi relevan (bidak, warna, koordinat, titik, sorot, suara)",
    JSON.stringify(labelSelect) === JSON.stringify(["Set Bidak", "Warna papan", "Koordinat papan"]) &&
      JSON.stringify(labelSwitch) ===
        JSON.stringify(["Titik langkah legal", "Sorot langkah terakhir", "Suara papan"]),
    `select=${labelSelect.join(",")}; switch=${labelSwitch.join(",")}`
  );

  await ubahSelect(panel?.querySelector('select[aria-label="Warna papan"]'), "blue");
  await ubahSelect(panel?.querySelector('select[aria-label="Set Bidak"]'), "merida");
  await klik(panel?.querySelector('button[aria-label="Tutup"]'));

  const a8Kartu = m.wadah.querySelector('[data-petak="a8"]')?.style.backgroundColor;
  hasil("PapanStatis di katalog Latihan Repertoar mengikuti warna papan blue", a8Kartu === "rgb(215, 229, 240)", a8Kartu);

  // Masuk sesi latihan dan uji suara langkah benar + salah + ilegal
  await klik(tombolDenganTeks(m.wadah, "Latih 2 jatuh tempo"));
  suaraDiputar.length = 0;
  await klik(m.wadah.querySelector('[data-petak="d2"]'));
  await klik(m.wadah.querySelector('[data-petak="d4"]'));
  hasil(
    "Latihan Repertoar membunyikan suara salah saat langkah tidak sesuai repertoar",
    suaraDiputar.some((s) => s.includes("puzzle-wrong.mp3") || s.includes("illegal.mp3")),
    suaraDiputar.join(", ")
  );

  // Jadwalkan ulang lalu mainkan langkah buku kartu berikutnya (g1 -> f3)
  await klik(tombolDenganTeks(m.wadah, "Jadwalkan ulang"));
  await act(async () => {
    await new Promise((selesai) => setTimeout(selesai, 80));
  });
  suaraDiputar.length = 0;
  await klik(m.wadah.querySelector('[data-papan-latihan] [data-petak="g1"]'));
  await klik(m.wadah.querySelector('[data-papan-latihan] [data-petak="f3"]'));
  hasil(
    "Latihan Repertoar membunyikan suara langkah saat langkah buku benar",
    suaraDiputar.some((s) => s.includes("/SoundChess/standard/")),
    suaraDiputar.join(", ")
  );

  // Matikan Titik langkah legal & Suara papan di tengah sesi latihan, lalu nilai kartu dan cek kartu baru senyap + tanpa titik
  await klik(tombolDenganTeks(m.wadah, "Pengaturan"));
  const panelLatihan = m.wadah.querySelector('[data-panel="mode-pengaturan"]');
  await klik(panelLatihan?.querySelector('[role="switch"][aria-label="Titik langkah legal"]'));
  await klik(panelLatihan?.querySelector('[role="switch"][aria-label="Suara papan"]'));
  await klik(panelLatihan?.querySelector('button[aria-label="Tutup"]'));
  await klik(tombolDenganTeks(m.wadah, "Baik"));
  await act(async () => {
    await new Promise((selesai) => setTimeout(selesai, 80));
  });
  await klik(m.wadah.querySelector('[data-papan-latihan] [data-petak="e2"]'));
  hasil(
    "Latihan Repertoar menghormati sakelar Titik langkah legal mati",
    m.wadah.querySelectorAll('[data-papan-latihan] [data-bantu-sasaran="1"]').length === 0
  );
  suaraDiputar.length = 0;
  await klik(m.wadah.querySelector('[data-papan-latihan] [data-petak="e4"]'));
  hasil(
    "Latihan Repertoar membisukan suara saat sakelar Suara papan dimatikan",
    suaraDiputar.length === 0,
    suaraDiputar.join(", ")
  );

  m.tutup();
}

const galatReact = catatanGalat.filter(
  (pesan) => !pesan.includes("not wrapped in act") && !pesan.includes("ReactDOMTestUtils.act")
);
hasil("tidak ada peringatan/galat React", galatReact.length === 0, galatReact.join(" | "));
hasil(
  "semua teks UI memakai terjemahan (tidak ada kunci i18n mentah)",
  !/papan\.[a-zA-Z]+/.test(document.body.textContent || "")
);

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
