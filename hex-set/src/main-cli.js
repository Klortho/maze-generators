const args = require('command-line-args');

import {default as HexMaze} from './hex-maze.js';
import {draw as psDraw} from './ps-renderer.js';

// Helper to get options from a command line
function optsFromCLI() {
  const opts = args([
    { name: 'rows', alias: 'r', type: parseInt, defaultValue: 30, },
    { name: 'cols', alias: 'c', type: parseInt, defaultValue: 30, },
    { name: 'width', alias: 'w', type: parseInt, defaultValue: null, },
    { name: 'height', alias: 'h', type: parseInt, defaultValue: null, },
  ]);
  //console.log(opts);
  return opts;
}

const opts = optsFromCLI();
const maze = new HexMaze(opts);
psDraw(maze, opts);
