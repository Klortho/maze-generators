
// ------------------------------------
// | 0,0 -> | 0,1 -> | 0,2 -> | 0,3   |
// |  |     |  |     |  |     |  |    |
// |  V     |  V     |  V     |  V    |
// ------------------------------------
// | 1,0 -> | 1,1 -> | 1,2 -> | 1,3   |
// |        |        |        |       |
// ------------------------------------

const rows = 10;
const cols = 10;
var r, c;

var cells = [];
for (r = 0; r < rows; ++r) {
  cells[r] = [];
  for (c = 0; c < cols; ++c) {
    var self = {
      sw: true,
      bw: true,
    };
    cells[r][c] = self.p = self;
  }
}

var numSets = rows * cols;

// The total number of internal walls is the number of side walls plus the
// number of bottom walls.
var numSides = rows * (cols - 1);
var numWalls = numSides + (rows - 1) * cols;

// We'll be done when the number of distinct sets === 1
while (numSets > 1) {
  // Find a suitable wall to tear down
  var looking = true;
  do {
    // Pick a random wall
    var wnum = Math.floor(Math.random() * numWalls);
    var isSide = (wnum < numSides);
    var wr, wc;
    if (isSide) {
      wr = Math.floor(wnum / (cols - 1));
      wc = wnum % (cols - 1);
    }
    else {
      var wcnum = wnum - numSides;
      wr = Math.floor(wcnum / cols);
      wc = wcnum % cols;
    }

    // Make sure the wall isn't torn down already
    var a = cells[wr][wc];
    if (a[isSide ? 'sw' : 'bw']) {
      // Get the adjoining cell
      var b = cells[isSide ? wr : wr + 1][isSide ? wc + 1 : wc];
      // We can tear down this wall if a and b are not in the same set.
      if (set(a) !== set(b)) looking = false;
    }
  } while (looking);

  // Tear down the wall, and combine the sets
  a[isSide ? 'sw' : 'bw'] = false;
  set(a).p = set(b);
  numSets--;
  console.log('numSets now ' + numSets);
}

// pick a start (at the top) and finish (at the bottom) cell
const startCol = Math.floor(Math.random() * cols);
const finishCol = Math.floor(Math.random() * cols);

// Output the result
console.log(borderWalls(startCol));
for (r = 0; r < rows; ++r) {
  console.log(sideWalls(r));
  if (r < rows - 1) console.log(bottomWalls(r));
}
console.log(borderWalls(finishCol));

// Draw a line of horizontal walls, with a gap at the indicated column
function borderWalls(gapCol) {
  var str = '+';
  for (c = 0; c < cols; ++c) {
    str += (c === gapCol ? '   +' : '---+');
  }
  return str;
}

// Draw a line of vertical walls
function sideWalls(r) {
  var str = '|';
  for (c = 0; c < cols; ++c) {
    str += '   ' +
           ((c >= cols - 1 || cells[r][c].sw) ? '|' : ' ');
  }
  return str;
}

// Draw a line of horizontal walls between cells
function bottomWalls(r) {
  var str = '+';
  for (c = 0; c < cols; ++c) {
    str += (cells[r][c].bw ? '---' : '   ') + '+';
  }
  return str;
}

function set(cell) {
  return cell.p === cell ? cell : set(cell.p);
}
