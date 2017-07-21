//--------------------------------------
// Some utilities that describe how hexagons connect with each other in
// a hexagonal grid

// The list of directions (integers from 0 to 5)
const allDirections = Array.from({length: 6}).map( (v, i) => i );

// Sum of two two-element arrays
const addVectors = (v0, v1) => [v0[0] + v1[0], v0[1] + v1[1]];

// Given coords and direction, compute the coords of the adjacent cell. No
// validation is done.
const adjCoords = (coords, dir) => {
  const deltaRow = [0, -1, -1, 0, 1, 1];
  const deltaCol = (coords[0] % 2) ?
    [-1, 0, 1, 1, 1, 0] : [-1, -1, 0, 1, 0, -1];
  return addVectors(coords, [deltaRow[dir], deltaCol[dir]]);
};

//--------------------------------------
function setDefaultOpts(_opts) {
  const opts = {};
  opts.rows = 'rows' in _opts ? _opts.rows : 30;
  opts.cols = 'cols' in _opts ? _opts.cols : 30;
  opts.width = 'width' in _opts ? _opts.width : 20 * Math.sqrt(3) * opts.cols;
  opts.height = 'height' in _opts ? _opts.height : 30 * opts.rows;
  return opts;
}

// Helper to get options from a query string
function optsFromQS(_qs) {
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
  return setDefaultOpts(qsOpts);
}

//--------------------------------------
class Cell {
  constructor(maze, coords) {
    this.maze = maze;
    this.coords = coords;
    this.parent = null;
    this.setp = this;
  }

  // Get the set that this cell belongs to. A set corresponds to the cell that
  // is at the root of this subtree. Every cell starts out in its own one-cell
  // set (the root of its own subtree). The `setp` property is a pointer to
  // the value of the root of this subtree the last time we checked -- it's a
  // cache of subtree root value. Every time getSet() is called, it starts
  // with that last value, recurses up until it finds the (possibly new)
  // subtree root, and then records the new value.
  getSet() {
    if (this.setp === this) return this;
    const mySet = this.setp.getSet();
    if (this.setp !== mySet) this.setp = mySet;
    return mySet;
  }

  // Set this cell's parent, which also changes this cell's set to be the same
  // as the parent's
  setParent(p) {
    if (this.parent !== null) throw Error('ack'); // shouldn't happen
    this.parent = p;
    this.setp = p.getSet();
  }

  sameSet(other) {
    return this.getSet() === other.getSet();
  }

  // Get the cell adjacent to this one, in the indicated direction; or null
  adjacent(dir) {
    const aCoords = adjCoords(this.coords, dir);
    return this.maze.getCell(aCoords);
  }

  // An array of all valid adjacent cells
  adjCells() {
    return allDirections.map(dir => this.adjacent(dir))
      .filter(cell => cell !== null);
  }

  // When processing this cell as part of building the maze, this produces
  // the list of "candidate" parents from among the adjacent cells
  candidates() {
    return this.adjCells()
      .filter(aCell => !this.sameSet(aCell));
  }

  // True if this cell is connected to its adjacent.
  isConnected(dir) {
    const aCell = this.adjacent(dir);
    return aCell !== null && (this.parent === aCell || aCell.parent === this);
  }

  // Is there a visible wall in the indicated direction?
  hasWall(dir) {
    const [r, c] = this.coords;
    const maze = this.maze;
    if (r === 0 && c === maze.startCol && (dir === 1 || dir === 2)) return false;
    if (r === maze.rows - 1 && c === maze.endCol &&
        (dir === 4 || dir === 5)) return false;
    if (this.adjacent(dir) === null) return true;
    return !this.isConnected(dir);
  }
}

//--------------------------------------
class HexMaze {
  constructor(opts) {
    this.width = opts.width;
    this.height = opts.height;
    this.rows = opts.rows;
    this.cols = opts.cols;

    this.startCol = Math.floor(Math.random() * this.cols);
    this.endCol = Math.floor(Math.random() * this.cols);

    this.cells = Array.from({length: this.rows}, (v, r) =>
      Array.from({length: this.cols}, (v, c) => new Cell(this, [r, c])));
    this.mazify();
  }

  // True if the coordinates are for a valid cell
  validCoords(coords) {
    const [r, c] = coords;
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  // Get a cell, without validation
  fetchCell(coords) {
    return this.cells[coords[0]][coords[1]];
  }

  // Validate a set of coordinates, and if valid, return the cell
  getCell(coords) {
    return this.validCoords(coords) ? this.fetchCell(coords) : null;
  }

  // Compute the maze
  mazify() {
    var r, c;
    this.cells.forEach(cellRow => {
      cellRow.forEach(cell => {
        const candidates = cell.candidates();
        if (candidates.length > 0) {
          const pick = Math.floor(Math.random() * candidates.length);
          const parent = candidates[pick];
          cell.setParent(parent);
        }
      });
    });
  }
}

//--------------------------------------
// Geometry of the hexagonal grid. This is independent of the
// drawing library.

// Actual x, y deltas for the verteces of a hexagon
const sqrt3 = Math.sqrt(3);
const cw = sqrt3;
const ch = 1.5;

const hexPoints = allDirections.map(dir => {
  const angle = (2.5 + dir) * Math.PI / 3;
  return [Math.cos(angle), Math.sin(angle)];
});

const cellCenter = coords => {
  const [r, c] = coords;
  return [0.5 * (1 + r%2 + 2*c) * cw, 1 + r * ch];
};

const hexSide = (coords, dir) => {
  const ctr = cellCenter(coords);
  const start = addVectors(ctr, hexPoints[dir]);
  const end = addVectors(ctr, hexPoints[(dir + 1) % 6]);
  return [start, end];
};

const marginX = 10;
const marginY = 10;

//--------------------------------------
// svg
class SvgArea {
  constructor(selector, opts) {
    this.svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.querySelector(selector).appendChild(this.svgElem);

    this.width = opts.width;
    this.height = opts.height;
    this.svg = d3.select('svg')
      .attrs({
        width: this.width,
        height: this.height,
      });

    const scaleX = (this.width - 2 * marginX) / (opts.cols + 0.5) / cw;
    const scaleY = (this.height - 2 * marginY) / (opts.rows + 0.25) / ch;

    this.drawingArea = this.svg.append('g')
      .attr('transform', `translate(${marginX}, ${marginY}) scale(${scaleX}, ${scaleY})`);
  }

  pathPoint(p) {
    return `${p[0]},${p[1]}`;
  }

  drawSeg(points) {
    const [start, end] = points;
    this.drawingArea.append('path')
      .attrs({
        d: `M${this.pathPoint(start)}L${this.pathPoint(end)}`,
        stroke: 'black',
        'stroke-linecap': 'round',
        'vector-effect': 'non-scaling-stroke',
      });
  }

  draw(maze) {
    for (var r = 0; r < maze.rows; ++r) {
      for (var c = 0; c < maze.cols; ++c) {
        const coords = [r, c];
        const cell = maze.fetchCell(coords);
        allDirections.forEach(dir => {
          if (cell.hasWall(dir)) this.drawSeg(hexSide(coords, dir));
        });
      }
    }
  }
}


/*
//--------------------------------------
m = new HexMaze(20, 20);
m.mazify();
draw(m);
*/
