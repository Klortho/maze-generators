import {default as Cell} from './cell.js';

// Sum of two two-element arrays
export const addVectors = (v0, v1) => [v0[0] + v1[0], v0[1] + v1[1]];

// The list of directions (integers from 0 to 5)
export const allDirections = [0, 1, 2, 3, 4, 5];

// Actual x, y deltas for the verteces of a hexagon
export const cellWidth = Math.sqrt(3);
export const cellHeight = 1.5;

export const hexPoints = allDirections.map(dir => {
  const angle = (2.5 + dir) * Math.PI / 3;
  return [Math.cos(angle), Math.sin(angle)];
});

// x, y coords of the center of a cell relative to its top-left.
export const cellCenter = coords => {
  const [r, c] = coords;
  return [0.5 * (1 + r%2 + 2*c) * cellWidth, 1 + r * cellHeight];
};

// "Start" vertex (the counter-clockwise-most one) for a given direction,
// as an x,y coord relative to the cell top-left.
export const hexVertex = (coords, dir) => {
  const ctr = cellCenter(coords);
  return addVectors(ctr, hexPoints[dir]);
}

// Pair of verteces, corresponding to the side of the hexagon in the
// given direction
export const hexSide = (coords, dir) => {
  return [hexVertex(coords, dir), hexVertex(coords, (dir+1)%6)];
};

export default class HexMaze {
  constructor(opts) {
    const _opts = opts ? opts : {};
    this.rows = _opts.rows || 30;
    this.cols = _opts.cols || 30;
    const prows = this.rows + 1/3;
    const pcols = this.cols + 0.5;

    this.width = 'width' in _opts ? _opts.width :
      'height' in _opts ?
        _opts.height * cellWidth/cellHeight * pcols/prows :
      cellWidth * 10 * this.cols;
    this.height = 'height' in _opts ? _opts.height :
      'width' in _opts ?
        _opts.width * cellHeight/cellWidth * prows/pcols :
      cellHeight * 10 * this.cols;

    this.startCol = Math.floor(Math.random() * this.cols);
    this.finishCol = Math.floor(Math.random() * this.cols);

    this.cells = Array.from({length: this.rows}, (v, r) =>
      Array.from({length: this.cols}, (v, c) =>
        new Cell(this, [r, c])));
    this.mazify();
  }

  // True if the coordinates are for a valid cell
  validCoords(coords) {
    const [r, c] = coords;
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  // Given coords and direction, compute the coords of the adjacent
  // cell. No validation is done.
  adjCoords(coords, dir) {
    const deltaRow = [0, -1, -1, 0, 1, 1];
    const deltaCol = (coords[0] % 2) ?
      [-1, 0, 1, 1, 1, 0] : [-1, -1, 0, 1, 0, -1];
    return addVectors(coords, [deltaRow[dir], deltaCol[dir]]);
  };


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

  finishCell() {
    return this.getCell([r, this.finishCol]);
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
