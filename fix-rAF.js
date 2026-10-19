import fs from "node:fs";

const path = "public/peeking-widget.js";
let content = fs.readFileSync(path, "utf8");
const marker = "var _peekingWidgetApi = {";

if (content.includes(marker)) {
  console.log("Shim pause/resume peeking-widget sudah terpasang; tidak ada perubahan.");
  process.exit(0);
}

const penutupStrict = content.indexOf('"use strict";');
const awalKonfigurasi = content.indexOf('var e="ybouane-peeking";');
if (penutupStrict < 0 || awalKonfigurasi < 0 || awalKonfigurasi < penutupStrict) {
  throw new Error("Format peeking-widget.js tidak dikenali; berkas tidak diubah.");
}

const customRAF = `
var _rAF_paused = false;
var _rAF_pendingCb = null;
var rAF = function(cb) {
  if (_rAF_paused) {
    _rAF_pendingCb = cb;
    return;
  }
  return window.__KCI_REAL_RAF__(cb);
};
var _peekingWidgetApi = {
  pause: function() { _rAF_paused = true; },
  resume: function() {
    if (!_rAF_paused) return;
    _rAF_paused = false;
    if (_rAF_pendingCb) {
      var cb = _rAF_pendingCb;
      _rAF_pendingCb = null;
      window.__KCI_REAL_RAF__(cb);
    }
  }
};
`;

content =
  content.slice(0, penutupStrict + '"use strict";'.length) +
  customRAF +
  content.slice(awalKonfigurasi);

content = content.replace(/requestAnimationFrame\(/g, "rAF(");
content = content.replace(/window\.__KCI_REAL_RAF__\(/g, "window.requestAnimationFrame(");

const assignmentLama = "window.PeekingWidget={config:o,container:v,";
const assignmentBaru = "window.PeekingWidget={api:_peekingWidgetApi,config:o,container:v,";
if (!content.includes(assignmentBaru)) {
  if (!content.includes(assignmentLama)) {
    throw new Error("Titik inisialisasi PeekingWidget tidak ditemukan; berkas tidak diubah.");
  }
  content = content.replace(assignmentLama, assignmentBaru);
}

const daftarOpsiLama = '"onClick"],r=document.currentScript';
const daftarOpsiBaru = '"onClick","fileNameWebm","fileNameHevc"],r=document.currentScript';
if (!content.includes(daftarOpsiBaru)) {
  if (!content.includes(daftarOpsiLama)) {
    throw new Error("Daftar opsi PeekingWidget tidak ditemukan; berkas tidak diubah.");
  }
  content = content.replace(daftarOpsiLama, daftarOpsiBaru);
}
const hevcLama = "o.hevcSrc=Ze(o.fileNameHevc)";
const hevcBaru = "o.hevcSrc=o.fileNameHevc?Ze(o.fileNameHevc):o.webmSrc";
if (!content.includes(hevcBaru)) {
  if (!content.includes(hevcLama)) {
    throw new Error("Pemilihan sumber video HEVC tidak ditemukan; berkas tidak diubah.");
  }
  content = content.replace(hevcLama, hevcBaru);
}

fs.writeFileSync(path, content, "utf8");
console.log("Shim pause/resume peeking-widget berhasil dipasang.");
