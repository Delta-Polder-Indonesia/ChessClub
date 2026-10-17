const fs = require('fs');

let content = fs.readFileSync('public/peeking-widget.js', 'utf8');

// The file replaces requestAnimationFrame with a custom rAF
// First, insert custom rAF implementation after `"use strict";`
const customRAF = `var _rAF_paused = false;
var rAF = function(cb) {
  if (_rAF_paused) {
    if (!window.PeekingWidget) window.PeekingWidget = {};
    if (!window.PeekingWidget.api) window.PeekingWidget.api = {};
    window.PeekingWidget.api._pendingCb = cb;
    return;
  }
  return window.requestAnimationFrame(cb);
};
if (!window.PeekingWidget) window.PeekingWidget = {};
if (!window.PeekingWidget.api) window.PeekingWidget.api = {};
window.PeekingWidget.api.pause = function() { _rAF_paused = true; };
window.PeekingWidget.api.resume = function() {
  if (!_rAF_paused) return;
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
content = content.replace(/requestAnimationFrame\(/g, 'rAF(');

// Fix the one inside our definition
content = content.replace(/window\.rAF\(cb\)/g, 'window.requestAnimationFrame(cb)');

fs.writeFileSync('public/peeking-widget.js', content, 'utf8');
