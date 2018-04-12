function LadyMaze() {
  this.opts = this.getUrlOpts();
  this.stickForm();
  
  this.moveDuration = 5 + (9 - this.speed) * 100;
  this.turnDuration = this.moveDuration / 5;
  
  // Initialize the canvas
  this.canvas = new fabric.Canvas('canvas');
  this.canvas.selection = false;

  // Initialize the background music
  if (!this.opts.music) return;
  const music = new Audio('sound/jj-cale-call-me-the-breezee-IDzMFe9y5JI.mp3');
  music.play();
  
  // Load the sounds asyncronously, then continue
  this.initSounds(() => {
    
    this.computeMaze();
    this.drawMaze();
    
    // Load the sprite, then listen for keystrokes
    this.initSprite(() => {  
      $('body').on('keydown', this.handleKey.bind(this));
    });
    
  });
  
}

//////////////////////////////////////////////////////////////////////////
LadyMaze.defaults = {
  debug:  true,
  rows:   20,
  cols:   20,
  color:  'red',
  speed:  7,
  trail:  true,
  sound:  true,
  music:  true,
  easing:  'easeInSine'   // jump easing (http://fabricjs.com/animation-easing/)
};

//////////////////////////////////////////////////////////////////////////
LadyMaze.prototype.getUrlOpts = function() {
  const defaults = LadyMaze.defaults;
  const opts = {};
  Object.keys(defaults).forEach(k => {
    opts[k] = defaults[k];
  });
  
  const decode = s => decodeURIComponent(s.replace(/\+/g, " "));
  const query = window.location.search.substring(1);
  const search = /([^&=]+)=?([^&]*)/g;
  var match;
  while (match = search.exec(query)) {
    const k = decode(match[1]);
    if (k in defaults) {
      const v = decode(match[2]).toLowerCase();
      const t = typeof defaults[k];
      if (t === 'boolean') {
        var first = v.charAt(0);
        opts[k] = (first === 't' || first === 'y');
      }
      else if (t === 'number') {
        opts[k] = v - 0;
      }
      else {  // string
        opts[k] = v;
      }
    }
  }
  return opts;
};


  
//////////////////////////////////////////////////////////////////////////
// Makes the form sticky

LadyMaze.prototype.stickForm = function() {
  $('#rows').val(this.opts.rows);
  $('#cols').val(this.opts.cols);
  $('#color').val(this.opts.color);
  $('#speed').val(this.opts.speed);
  // FIXME: finish these
};


//////////////////////////////////////////////////////////////////////////
LadyMaze.prototype.initSounds = function(cb) {
  if (!this.opts.sound) return;
  const debug = this.opts.debug;
  
  // Create audio context object
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  this.audioContext = window.AudioContext ? new AudioContext() : null;

  // Load the sounds sequentially
  this.sounds = {};
  [ 'boing', 'squink', 'goal', ].reduce((prevCallback, name) => () => {
    if (debug) console.info("Loading sound " + name);

    const request = new XMLHttpRequest();
    request.soundName = name;   // Save the sound name in the request object
    request.open('GET', `sound/${name}.mp3`, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
      this.audioContext.decodeAudioData(request.response,
        // success
        buffer => {
          if (debug) console.info("Successfully decoded sound " + name);
          this.sounds[name] = buffer;
          prevCallback();
        },
        // failed
        () => {
          console.error("Error trying to decode audio data: " + name);
          prevCallback();
        }
      );
    }
    request.send();
  }, cb);
};


/////////////////////////////////////////////////////////////////////////
// This helper creates a new wall object
function newWall(orientation, r, c) {
  return {
    exists: true,
    orientation: orientation,
    row: r,
    col: c,
  };
}

// Compute the maze in memory (no drawing yet)
LadyMaze.prototype.computeMaze = function() {

  const rows = this.rows;
  const cols = this.cols;
  const numCells = rows * cols;
  const cells = this.cells = [];  // 2d array of objects
  const walls = this.walls = [];

  this.cellWidth = (this.canvasWidth - this.wallThickness) / cols;
  this.cellHeight = (this.canvasHeight - this.wallThickness) / rows;

  // First initialize the two-dimensional array of the cell objects
  for (var r = 0; r < rows; ++r) {
    var cellRow = cells[r] = [];
    for (var c = 0; c < cols; ++c) {
      cellRow[c] = {
        visited: false,
        walls: {}
      };
    }
  }
  
  // Initialize the wall objects
  for (var r = 0; r < rows; ++r) {
    var cellRow = cells[r];
    for (var c = 0; c < cols; ++c) {
      var cell = cellRow[c];

      // Add cell walls, taking into account that cells share walls
      var cw = cell.walls;

      // north: if there is a cell to the north, that already has
      // a southern wall, then use that.
      if (r > 0 && cells[r-1][c].walls.S) {
        cw.N = cells[r-1][c].walls.S;
      }
      // Otherwise this cell doesn't have another above it; create a new wall
      else {
        cw.N = newWall('horizontal', r, c);
        walls.push(cw.N);
      }

      // east
      if (c < cols - 1 && cells[r][c+1].walls.W) {
        cw.E = cells[r][c+1].walls.W;
      }
      else {
        cw.E = newWall('vertical', r, c+1);
        walls.push(cw.E);
      }

      // south
      if (r < rows - 1 && cells[r+1][c].walls.N) {
        cw.S = cells[r+1][c].walls.N;
      }
      else {
        cw.S = newWall('horizontal', r+1, c);
        walls.push(cw.S);
      }

      // west
      if (c > 0 && cells[r][c-1].walls.E) {
        cw.W = cells[r][c-1].walls.E;
      }
      else {
        cw.W = newWall('vertical', r, c);
        walls.push(cw.W);
      }
    }
  }

  // Initialize start and finish flags and mole tracker
  var gotStart = false;
  var gotFinish = false;
  var mole = {};
  var cellsVisited = 0;

  // Move the mole into a specific cell
  function moveMole(row, col) {
    mole.r = row;
    mole.c = col;
    cells[row][col].visited = true;
    cellsVisited++;
  }

  // When we hit a dead-end, "hop" the mole to a cell that we've
  // already visited.
  function hopMole() {
    do {
      mole.r = Math.floor(Math.random() * rows);
      mole.c = Math.floor(Math.random() * cols);
    }
    while (!cells[mole.r][mole.c].visited);
  }

  // This says when we're done
  function doneDigging() {
    return gotStart && gotFinish && cellsVisited == numCells;
  }

  // Start in a random cell
  moveMole(Math.floor(Math.random() * rows),
           Math.floor(Math.random() * cols));

  // Start digging
  while (!doneDigging()) {
    var r = mole.r;
    var c = mole.c;
    var cell = cells[r][c];

    // which directions can we go from here?
    var goodDirections = [];
    // North?
    if ((r === 0 && !gotStart) || (r > 0 && !cells[r-1][c].visited)) {
      goodDirections.push('N');
    }
    // East?
    if ((c < cols - 1) && !cells[r][c+1].visited) {
      goodDirections.push('E');
    }
    // South?
    if ( (r === num_rows-1) && !gotFinish ||
         (r < num_rows-1 && !cells[r+1][c].visited) ) {
      goodDirections.push('S');
    }
    // West?
    if ((c > 0) && !cells[r][c-1].visited) {
      goodDirections.push('W');
    }

    // Can we go anywhere?
    if (goodDirections.length === 0) {
      // No, we need to hop the mole
      hopMole(mole);
    }
    else {
      // Pick one of those directions, and dig there
      var dir = goodDirections[ Math.floor(Math.random() * goodDirections.length) ];
      // Clear the wall
      cell.walls[dir].exists = false;
      // Move the mole
      if (dir == 'N') {
        if (r == 0) {
          gotStart = true;
          this.startCol = c;
          if (!doneDigging()) hopMole();
        }
        else {
          moveMole(r-1, c);
        }
      }

      else if (dir === 'E') {
        moveMole(r, c+1);
      }

      else if (dir === 'S') {
        if (r == num_rows - 1) {
          gotFinish = true;
          cell.finish = true;
          if (!doneDigging()) hopMole();
        }
        else {
          moveMole(r+1, c);
        }
      }

      else if (dir = 'W') {
        moveMole(r, c-1);
      }
    }
  }
};

LadyMaze.prototype.drawWall = function(w) {
  if (!w.exists) return;
  return 'M ' + this.cellWidth * w.col + ' ' + this.cellHeight * w.row + ' ' +
      'l ' + (o == 'horizontal' ? this.cellWidth : 0) + ' ' +
             (o == 'horizontal' ? 0 : this.cellHeight);
};

LadyMaze.prototype.drawMaze = function() {
  const maze = this;
  
  const pathStr = this.walls
    .map(this.drawWall.bind(this))
    .join(' ');

  // Create the path object from the string, and set its styles
  const path = new fabric.Path(pathStr);
  path.set({
    originX: 'left',
    originY: 'top',
    left: 0,
    top: 0,
    selectable: false,
    fill: "none",
    stroke: color,
    strokeWidth: wallThickness,
    strokeLineCap: 'round'
  });
  canvas.add(path);
};

// Compute the `left` and `top`, given a cell row and col
LadyMaze.prototype.coords = function(row, col) {
  return {
    left: col * cw + (cw + wt)/2,
    top: row * ch + (ch + wt)/2
  };
};

/////////////////////////////////////////////////////////////////////
LadyMaze.prototype.initSprite = function(cb) {
  this.bug = {
    row: 0,
    col: this.startCol,
    dir: 'S'
  };

  fabric.Image.fromURL('ladybug_red-100.png', sprite => {
    const startCoords = coords(0, this.startCol);
    const size = (Math.min(this.cellWidth, this.cellHeight) - this.wallThickness) * 0.8;

    sprite.set({
      left: startCoords.left,
      top: startCoords.top,
      width: size,
      height: size,
      angle: 180,
    });

    this.canvas.add(sprite);
    this.animationInProgress = false;
    cb();
  });
};



/////////////////////////////////////////////////////////////////////
LadyMaze.prototype.handleKey = function(evt) {
  var k = evt.keyCode;
  // Return if it's not one of the arrow keys
  if (k < 37 || k > 40) return true;

  // Return if our previous animation isn't finished yet
  if (this.animationInProgress) return false;
  
  // What to do for each of the arrow (direction) keys
  const dirKeys = {
    37: {     // left
      dir: 'W',
      prop: 'left',  // property to animate
      delta: '-=' + cw,
      angle: 270,
    },
    38: {     // up
      dir: 'N',
      prop: 'top',
      delta: '-=' + ch,
      angle: 0,
    },
    39: {     // right
      dir: 'E',
      prop: 'left',
      delta: '+=' + cw,
      angle: 90,
    },
    40: {     // down
      dir: 'S',
      prop: 'top',
      delta: '+=' + ch,
      angle: 180,
    },
  };

  // Where are we, and can we go the way he wants?
  const r = bug.row;
  const c = bug.col;
  const cell = this.cells[r][c];
  var canMove = false;
  var newCell = null;

  if (!cell.walls[dir].exists) {
    if (dir == 'W' && c != 0) {
      canMove = true;
      newCell = this.cells[r][c-1];
    }
    else if (dir == 'N' && r != 0) {
      canMove = true;
      newCell = this.cells[r-1][c];
    }
    else if (dir == 'E' && c != nc - 1) {
      canMove = true;
      newCell = this.cells[r][c+1];
    }
    else if (dir == 'S' && r != nr - 1) {
      canMove = true;
      newCell = this.cells[r+1][c];
    }
  }

  if (!canMove) playSound('boing');

  // Define a function that will handle the move (as opposed to the rotation)
  var animate_move = canMove ?
      function() {
          playSound('squink');
          if (dir == 'W')
              sprite_data.col--;
          else if (dir == 'N')
              sprite_data.row--;
          else if (dir == 'E')
              sprite_data.col++;
          else
              sprite_data.row++;

          if (debug) {
              console.info("Setting easing to " + jump_easing + ", %o",
                           fabric.util.ease[jump_easing]);
          }
          sprite.animate(prop, delta, {
              duration: anim_duration_move,
              onChange: canvas.renderAll.bind(canvas),
              easing: fabric.util.ease[jump_easing],
              onComplete: function() {
                  animation_in_progress = false;
                  if (new_cell.finish) playSound('goal');
              }
          });
          if (leave_trail && !cell.seen) {
              if (debug) console.info("adding trail dot");
              var dot_coords = coords(r, c);
              var circle = new fabric.Circle({
                  radius: sprite_size/5,
                  fill: 'black',
                  left: dot_coords.left,
                  top: dot_coords.top
              });
              canvas.add(circle);
              canvas.sendToBack(circle);
              maze.cells[r][c].seen = true;
          }
      } :
      function() {
          animation_in_progress = false;
      };

      if (debug) {
          console.info("dir = " + dir + "\nprop = " + prop + "\ndelta = " + delta +
          "\nangle = " + angle + "\nnew row = " + sprite_data.row +
          "\nnew col = " + sprite_data.col);
      }

      // Do we need to change direction?
      animationInProgress = true;
      if (spriteData.dir != dir) {

          // These next checks fix the problem when you rotate between 0 and 270 degrees,
          // to make sure it doesn't go the long way around
          if (sprite_data.dir == 'N' && dir == 'W') {
              sprite.set('angle', 360);
          }
          else if (sprite_data.dir == 'W' && dir == 'N') {
              sprite.set('angle', -90);
          }

          sprite_data.dir = dir;
          sprite.animate('angle', angle, {
              duration: anim_duration_turn,
              onChange: canvas.renderAll.bind(canvas),
              onComplete: animate_move
          });
      }
      else {
          animate_move();
      }

      return false;
};


LadyMaze.prototype.playSound = function(soundName) {
  if (!this.opts.sound) return;
  var source = this.audioContext.createBufferSource();
  source.buffer = this.sounds[soundName];
  source.connect(this.audioContext.destination);
  source.start(0);
};


const maze = new LadyMaze();