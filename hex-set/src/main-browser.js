import {default as HexMaze} from './hex-maze.js';
import {draw as svgDraw} from './svg-renderer.js';
export {HexMaze, svgDraw};

// Helper to get options from a query string
export function optsFromQS(_qs) {
  const qmark = _qs.indexOf('?');
  const qs = (qmark !== -1) ? _qs.substr(qmark + 1) : _qs;
  const qsOpts = {};
  qs.split('&').forEach(function (pairStr) {
    var pair = pairStr.replace(/\+/g, ' ').split('=');
    var k = pair[0];
    if (k.length > 0) {
      var val = pair.length === 1 ? null : decodeURIComponent(pair[1]);
      qsOpts[k] = parseInt(val);
    }
  });
  return qsOpts;
}
