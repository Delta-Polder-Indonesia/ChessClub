const fs = require('fs');

let content = fs.readFileSync('public/peeking-widget.js', 'utf8');

// The file replaces requestAnimationFrame with a custom rAF
// First, insert custom rAF implementation after `"use strict";`
const customRAF = `var _rAF_paused = false;
var rAF = function(cb) {
  if (_rAF_paused) {
    // If paused, we don't request the next frame immediately,
    // but we need a way to resume it later.
    // Instead of dropping it, we'll expose a resume function.
    if (!window.PeekingWidget) window.PeekingWidget = {};
    if (!window.PeekingWidget.api) window.PeekingWidget.api = {};
    window.PeekingWidget.api._pendingCb = cb;
    return;
  }
  return window.requestAnimationFrame(cb);
};
window.PeekingWidget = window.PeekingWidget || {};
window.PeekingWidget.api = window.PeekingWidget.api || {};
window.PeekingWidget.api.pause = function() { _rAF_paused = true; };
window.PeekingWidget.api.resume = function() {
  _rAF_paused = false;
  if (window.PeekingWidget.api._pendingCb) {
    var cb = window.PeekingWidget.api._pendingCb;
    window.PeekingWidget.api._pendingCb = null;
    window.requestAnimationFrame(cb);
  }
};
`;

content = content.replace('"use strict";', '"use strict";' + customRAF);

// Now replace all requestAnimationFrame with rAF except the one in customRAF
// We'll just replace 'requestAnimationFrame(' with 'rAF(' in the minified part
content = content.replace(/requestAnimationFrame\(/g, 'rAF(');

// Make sure our customRAF uses the real requestAnimationFrame
content = content.replace(/rAF\(cb\)/g, 'requestAnimationFrame(cb)');

fs.writeFileSync('public/peeking-widget.js', content, 'utf8');
