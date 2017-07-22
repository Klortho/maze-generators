export {default as HexMaze} from './hex-maze.js';
export { draw as svgDraw } from './svg-renderer.js';

export function setDefaultOpts(_opts) {
  const opts = {};
  opts.rows = 'rows' in _opts ? _opts.rows : 30;
  opts.cols = 'cols' in _opts ? _opts.cols : 30;
  opts.width = 'width' in _opts ? _opts.width : 20 * Math.sqrt(3) * opts.cols;
  opts.height = 'height' in _opts ? _opts.height : 30 * opts.rows;
  return opts;
}

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
  //return setDefaultOpts(qsOpts);
}
