//--------------------------------------
// Some utilities that describe how hexagons connect with each other in
// a hexagonal grid

// The list of directions (integers from 0 to 5)
export const allDirections = Array.from({length: 6}).map( (v, i) => i );

// Sum of two two-element arrays
export const addVectors = (v0, v1) => [v0[0] + v1[0], v0[1] + v1[1]];

// Given coords and direction, compute the coords of the adjacent cell. No
// validation is done.
export const adjCoords = (coords, dir) => {
  const deltaRow = [0, -1, -1, 0, 1, 1];
  const deltaCol = (coords[0] % 2) ?
    [-1, 0, 1, 1, 1, 0] : [-1, -1, 0, 1, 0, -1];
  return addVectors(coords, [deltaRow[dir], deltaCol[dir]]);
};


//--------------------------------------
export class Cell {
  constructor(maze, coords) {
    this.maze = maze;
    this.coords = coords;
    this.parent = null;
    this.setp = this;
  }

  // Get the set that this cell belongs to. The set is identified by the cell
  // that's currently at the root of this subtree. Every cell starts out in
  // its own one-cell set (it is the root of its own subtree). The `setp`
  // property is a cache of the reference to the root cell the last time
  // getSet() was called. Every time getSet() is called, it starts
  // with that last value, recurses up until it finds the current root,
  // and then records the new value.
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
export default class HexMaze {
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

  startCell() {
    return this.getCell([0, this.startCol]);
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

  // Traverse the maze with a depth-first search, calling f at each cell

  traverse(start, f) {
    const stack = [[null, start, 0]];

    function visit() {
      const [source, current, distance] = stack.pop();
      f(current, distance);
      allDirections.forEach(dir => {
        if (current.isConnected(dir)) {
          const adj = current.adjacent(dir);
          if (adj !== source) {
            stack.push([current, adj, distance+1]);
          }
        }
      });
    }

    while (stack.length > 0) visit();
  }
}

//--------------------------------------
// Geometry of the hexagonal grid. This is independent of the
// drawing library.

// Actual x, y deltas for the verteces of a hexagon
export const cw = Math.sqrt(3);
export const ch = 1.5;

export const hexPoints = allDirections.map(dir => {
  const angle = (2.5 + dir) * Math.PI / 3;
  return [Math.cos(angle), Math.sin(angle)];
});

export const cellCenter = coords => {
  const [r, c] = coords;
  return [0.5 * (1 + r%2 + 2*c) * cw, 1 + r * ch];
};

export const hexVertex = (coords, dir) => {
  const ctr = cellCenter(coords);
  return addVectors(ctr, hexPoints[dir]);
}

export const hexSide = (coords, dir) => {
  return [hexVertex(coords, dir), hexVertex(coords, (dir+1)%6)];
};
