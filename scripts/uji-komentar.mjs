/**
 * Uji KOMENTAR hasil analisis fitur Analisa — komponen & fungsi ASLI di atas
 * jsdom:
 *
 *   1. `Comments`: label penilaian + kalimat "e4 adalah langkah Blunder" dari
 *      kamus (kunci `analisa.komentar.<kunci>.<varian>`), teks komentar diambil
 *      dari kamus sesuai commentKey+commentIndex, dan kotak FormatEval.
 *   2. `FormatEval`: konversi skor UCI (sudut pandang pihak bergilir) ke teks
 *      sudut pandang PUTIH: cp ±X.XX, skakmat ±M(n−1 bila langkah terbaik),
 *      dan "0-1"/"1-0" untuk posisi mat tanpa nomor.
 *   3. `getOverallGameComment`: pilihan varian acak dari kamus
 *      `analisa.komentarPartai.{menang|seri|netral}.<0..3>`, pengisian
 *      {menang}/{kalah}, dan escaping HTML nama pemain (PGN pihak ketiga
 *      tidak boleh bisa menyuntik markup).
 *
 * Jalankan: node scripts/uji-komentar.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { I18nProvider, useI18n } = await import("../src/lib/i18n.jsx");
const ID = (await import("../src/lib/terjemahan/id/index.js")).ID;
const { default: Comments, FormatEval } = await import(
  "../src/halaman/Analisa/komponen/menu/analysis/moves/comments.jsx"
);
const getOverallGameComment = (await import(
  "../src/halaman/Analisa/komponen/menu/analysis/moves/overallGameComment.jsx"
)).default;

const act = React.act ?? (await import("react-dom/test-utils")).act;

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

/* Ambil `t` asli dari provider (teks yang diuji = teks kamus yang terpasang). */
let tAsli = null;
function Penjepit() {
  tAsli = useI18n().t;
  return null;
}
act(() => {
  root.render(React.createElement(I18nProvider, null, React.createElement(Penjepit)));
});
const t = tAsli;

function teksFormatEval(evaluation, white, best = false) {
  act(() => {
    root.render(
      React.createElement(I18nProvider, null, React.createElement(FormatEval, { evaluation, white, best }))
    );
  });
  // Baca DOM SETELAH act selesai — membaca di dalam callback act bisa
  // menangkap render sebelumnya yang belum di-flush.
  return el.textContent.trim();
}

function teksComments(props) {
  let keluaran;
  act(() => {
    root.render(React.createElement(I18nProvider, null, React.createElement(Comments, props)));
    keluaran = el;
  });
  return keluaran;
}

/* ------------------------- 1. Comments ------------------------- */

console.log("== Comments: kartu komentar satu langkah ==");
{
  const n = teksComments({
    comment: undefined,
    commentKey: "blunder",
    commentIndex: 0,
    rating: "blunder",
    moveSan: "e4",
    evaluation: ["cp", "34"],
    white: true,
    overallGameComment: "<p>Komentar partai.</p>",
  });
  const teks = n.textContent;
  hasil(
    'kalimat "e4 adalah langkah Blunder" (formatLabel dari kamus)',
    teks.includes("e4 adalah langkah Blunder"),
    teks.slice(0, 120)
  );
  hasil(
    "teks komentar = varian 0 kamus analisa.komentar.blunder",
    teks.includes(t("analisa.komentar.blunder.0")),
    teks.slice(0, 200)
  );
  hasil('kotak evaluasi "+0.34"', teks.includes("+0.34"));
  hasil(
    "menampilkan ikon rating (SVG)",
    n.querySelector("svg") !== null
  );

  // Varian lain: commentIndex 2 → kalimat ketiga.
  const n2 = teksComments({
    comment: undefined,
    commentKey: "blunder",
    commentIndex: 2,
    rating: "blunder",
    moveSan: "d5",
    evaluation: ["cp", "-34"],
    white: false,
    overallGameComment: "",
  });
  hasil(
    "commentIndex 2 → varian ke-3 kamus",
    n2.textContent.includes(t("analisa.komentar.blunder.2"))
  );
  hasil(
    'skor "-34" dari sisi hitam (hitam kalah 0.34) → "+0.34" sudut pandang putih',
    n2.textContent.includes("+0.34"),
    n2.textContent
  );

  // Langkah buku: `comment` = nama pembukaan, dipakai APA ADANYA (bukan kamus).
  const n3 = teksComments({
    comment: "Pertahanan Bukit Raya",
    commentKey: undefined,
    commentIndex: undefined,
    rating: "book",
    moveSan: "e4",
    evaluation: ["cp", "12"],
    white: true,
    overallGameComment: "",
  });
  hasil('label "Buku" + kalimat formatLabel', n3.textContent.includes("e4 adalah langkah Buku"), n3.textContent.slice(0, 120));
  hasil('nama pembukaan dipakai apa adanya', n3.textContent.includes("Pertahanan Bukit Raya"));
}

console.log("\n== Comments: fallback komentar partai ==");
{
  const n = teksComments({
    comment: undefined,
    commentKey: undefined,
    commentIndex: undefined,
    rating: undefined,
    moveSan: undefined,
    evaluation: ["cp", "0"],
    white: true,
    overallGameComment: '<p class="uji-partai">Kalimat pembuka partai.</p>',
  });
  hasil(
    "tanpa rating/komentar → HTML overallGameComment dirender",
    n.querySelector(".uji-partai")?.textContent === "Kalimat pembuka partai.",
    n.innerHTML.slice(0, 120)
  );
}

/* ------------------------- 2. FormatEval ------------------------- */

console.log("\n== FormatEval: cp (sudut pandang putih) ==");
hasil('["cp","34"] giliran putih → "+0.34"', teksFormatEval(["cp", "34"], true) === "+0.34", teksFormatEval(["cp", "34"], true));
hasil('["cp","-34"] giliran putih → "-0.34"', teksFormatEval(["cp", "-34"], true) === "-0.34");
hasil('["cp","34"] giliran hitam → "-0.34"', teksFormatEval(["cp", "34"], false) === "-0.34");
hasil('["cp","-34"] giliran hitam → "+0.34"', teksFormatEval(["cp", "-34"], false) === "+0.34");
hasil('["cp","0"] → "0.00" (tanpa tanda)', teksFormatEval(["cp", "0"], true) === "0.00", teksFormatEval(["cp", "0"], true));
hasil('["cp","3042"] → "+30.42"', teksFormatEval(["cp", "3042"], true) === "+30.42");

console.log("\n== FormatEval: skakmat ==");
// Konvensi engine (divalidasi uji-engine-uci): mate positif = pihak bergilir
// MEMBERI skakmat. FormatEval menormalkan ke sudut pandang putih via `white`.
hasil('["mate","2"] giliran putih, langkah terbaik → "+M1"', teksFormatEval(["mate", "2"], true, true) === "+M1", teksFormatEval(["mate", "2"], true, true));
hasil('["mate","2"] giliran putih, bukan terbaik → "+M2"', teksFormatEval(["mate", "2"], true, false) === "+M2");
hasil('["mate","2"] giliran hitam, terbaik → "-M1"', teksFormatEval(["mate", "2"], false, true) === "-M1");
hasil('["mate","-2"] giliran putih, terbaik → "-M1"', teksFormatEval(["mate", "-2"], true, true) === "-M1");
hasil('["mate","-2"] giliran hitam, terbaik → "+M1"', teksFormatEval(["mate", "-2"], false, true) === "+M1");
hasil('["mate"] (posisi mat) giliran putih → "0-1"', teksFormatEval(["mate"], true) === "0-1", teksFormatEval(["mate"], true));
hasil('["mate"] (posisi mat) giliran hitam → "1-0"', teksFormatEval(["mate"], false) === "1-0");

/* ------------------------- 3. getOverallGameComment ------------------------- */

console.log("\n== getOverallGameComment ==");
const VARIAN = (kunci) => ID.analisa.komentarPartai[kunci];

function cocokDenganVarian(keluar, varian, ganti) {
  return varian.some((v) => keluar === v.replaceAll("{menang}", ganti.menang).replaceAll("{kalah}", ganti.kalah));
}

{
  const M = '<span class="font-extrabold" style="color: var(--foregroundBlackDark);">';
  const A = "</span>";

  const keluar = getOverallGameComment(["Magnus", "Hikaru"], "1-0", t);
  hasil(
    "1-0 → varian 'menang', putih sang pemenang",
    cocokDenganVarian(keluar, VARIAN("menang"), { menang: M + "Magnus" + A, kalah: M + "Hikaru" + A }),
    keluar
  );
  hasil("nama pemenang dibungkus span tebal", keluar.includes(M + "Magnus" + A));

  const keluar2 = getOverallGameComment(["Magnus", "Hikaru"], "0-1", t);
  hasil(
    "0-1 → varian 'menang', HITAM sang pemenang",
    cocokDenganVarian(keluar2, VARIAN("menang"), { menang: M + "Hikaru" + A, kalah: M + "Magnus" + A }),
    keluar2
  );

  const keluar3 = getOverallGameComment(["Magnus", "Hikaru"], "1/2-1/2", t);
  hasil(
    "1/2-1/2 → salah satu varian 'seri'",
    cocokDenganVarian(keluar3, VARIAN("seri"), {
      menang: M + "Magnus" + A,
      kalah: M + "Hikaru" + A,
    }) ||
      cocokDenganVarian(keluar3, VARIAN("seri"), {
        menang: M + "Hikaru" + A,
        kalah: M + "Magnus" + A,
      }),
    keluar3
  );

  const keluar4 = getOverallGameComment(["Magnus", "Hikaru"], "", t);
  hasil(
    "tanpa hasil → salah satu varian 'netral'",
    cocokDenganVarian(keluar4, VARIAN("netral"), {
      menang: M + "Magnus" + A,
      kalah: M + "Hikaru" + A,
    }) ||
      cocokDenganVarian(keluar4, VARIAN("netral"), {
        menang: M + "Hikaru" + A,
        kalah: M + "Magnus" + A,
      }),
    keluar4
  );

  // Acak: 40 undian harus menyentuh keempat varian (peluang lolos sangat kecil).
  const varianKeluar = new Set();
  for (let i = 0; i < 40; i++) {
    const keluar = getOverallGameComment(["A", "B"], "1-0", t);
    for (let v = 0; v < 4; v++) {
      if (keluar === VARIAN("menang")[v].replaceAll("{menang}", M + "A" + A).replaceAll("{kalah}", M + "B" + A)) {
        varianKeluar.add(v);
      }
    }
  }
  hasil("40 undian → keempat varian 0..3 muncul", varianKeluar.size === 4, [...varianKeluar].join(","));

  // Escaping HTML: nama dari PGN pihak ketiga tidak boleh menyuntik markup.
  const jahat = "<script>alert('xss')</script>";
  const keluar5 = getOverallGameComment([jahat, "Hikaru"], "1-0", t);
  hasil("nama berbahaya di-escape (&lt;script&gt;)", keluar5.includes("&lt;script&gt;"), keluar5);
  hasil("tidak ada tag <script> mentah dalam keluaran", !keluar5.includes("<script>"));
  hasil(
    "escape penuh: tanda kutip ikut di-escape (&#39;)",
    keluar5.includes("alert(&#39;xss&#39;)")
  );
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
