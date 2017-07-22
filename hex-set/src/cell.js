import {allDirections} from './hex-maze.js';

export default class Cell {
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
    const aCoords = this.maze.adjCoords(this.coords, dir);
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
    if (r === maze.rows - 1 && c === maze.finishCol &&
        (dir === 4 || dir === 5)) return false;
    if (this.adjacent(dir) === null) return true;
    return !this.isConnected(dir);
  }
}
